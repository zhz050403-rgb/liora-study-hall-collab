const fs = require('fs'), vm = require('vm'), assert = require('assert'), path = require('path');
const source = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');
let handler, writes = 0;
const fakeFs = {readFileSync(file) {
 if(file.endsWith('auth.json')) return JSON.stringify({sessionSecret:'test',users:[{user:'owner',ai:true},{user:'guest',ai:false}]});
 if(file.endsWith('skipped-files.json')) return '{"files":[]}';
 if(file.includes('u_owner.json')) return JSON.stringify({updatedAt:1000,data:{'xinnan-test':'old'}});
 if(file.endsWith('board-notes-extracurricular.json')) return '{"modules/7":{"notesHtml":"owner-only fixture"}}';
 throw Object.assign(new Error('not found'), {code:'ENOENT'});
},readFile(file, encoding, callback){ callback(null, fs.readFileSync(file, encoding)); },existsSync(){return false},mkdirSync(){},writeFileSync(){writes++},renameSync(){}};
/* server.js 现在会 require('./accounts/service')。这个回归用 vm 直接跑源码，
   相对 require 会基于 checks/ 解析而失败；这里把账号模块用同一套 fakeFs 在
   沙箱里加载，既不改产品代码，也保证测试一个字节都不碰真实 data/。 */
const serviceSource = fs.readFileSync(path.join(__dirname, '../accounts/service.js'), 'utf8');
const serviceCtx = {require(name){ if(name==='fs')return fakeFs; return require(name); },
 module:{exports:{}}, console,Buffer,URL,setTimeout,clearTimeout,process:{env:{}},
 __dirname:path.resolve(__dirname,'..','accounts')};
serviceCtx.exports = serviceCtx.module.exports;
vm.createContext(serviceCtx); vm.runInContext(serviceSource, serviceCtx);
const context = {require(name){ if(name==='fs')return fakeFs; if(name==='http')return {createServer(fn){handler=fn;return {listen(){},on(){}}}}; if(name==='./accounts/service')return serviceCtx.module.exports; return require(name);}, __dirname:path.resolve(__dirname,'..'),process:{env:{}},console,Buffer,URL,setTimeout,clearTimeout};
vm.createContext(context);vm.runInContext(source,context);
async function request(url,method='GET',user,body){
 const handlers={}; const req={url,method,headers:{},socket:{remoteAddress:'test'},on(event,fn){handlers[event]=fn;return this}};
 if(user)req.headers.cookie='liora_sess='+vm.runInContext('makeToken('+JSON.stringify(user)+')',context);
 let status, data;const res={writeHead(code){status=code},end(value){data=value}};
 const task=handler(req,res); if(body){handlers.data(Buffer.from(JSON.stringify(body)));handlers.end();}await task;
 return {status,data};
}
(async()=>{
 for(const route of ['/api/chat','/api/ai-info','/__api/state'])assert.equal((await request(route)).status,401);
 assert.equal((await request('/api/chat','POST','guest')).status,403);
 assert.equal((await request('/__api/notes-pipeline','POST')).status,401);
 assert.equal((await request('/__api/notes-pipeline','POST','guest')).status,403);
 assert.equal((await request('/notes-review.html','GET','guest')).status,403);
 assert.equal((await request('/__api/notes-pipeline','POST','owner')).status,403);
 assert.equal((await request('/api/ai-info','GET','guest')).status,403);
 const guestData = await request('/data.js?v=test','GET','guest');
 const ownerData = await request('/data.js?v=test','GET','owner');
 assert.equal(guestData.status,200);
 assert.equal(ownerData.status,200);
 const guestCourses = JSON.parse(guestData.data.slice('window.PORTAL_DATA = '.length,-1)).courses;
 assert(guestCourses.length > 0 && guestCourses.every(course => !course.extra));
 assert(ownerData.data.includes('"id":"extracurricular"'));
 assert.equal((await request('/build/extracurricular_imgs/p2_1.png','GET','guest')).status,403);
 assert.equal((await request('/assets/extracurricular_imgs/p2_1.png','GET','guest')).status,403);
 assert((await request('/board-overrides.js','GET','owner')).data.includes('owner-only fixture'));
 assert(!(await request('/board-overrides.js','GET','guest')).data.includes('"notes-extracurricular"'));
 assert.equal((await request('/__api/state','POST','owner',{base:999,data:{'xinnan-test':'new'}})).status,409);
 assert.equal(writes,0);
 assert.equal((await request('/__api/state','POST','owner',{base:1000,data:{'xinnan-test':'new'}})).status,200);
 assert.equal(writes,1);
 assert(!(await request('/__login')).data.includes('maximum-scale'));
 console.log('PASS: anonymous AI/state denied, guest AI denied, stale state rejected without writes, current state accepted, login zoom enabled. Real auth/state files untouched.');
})().catch(error=>{console.error(error);process.exitCode=1});
