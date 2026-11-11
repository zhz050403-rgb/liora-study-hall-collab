'use strict';
/* 从讲义、Tutorial Guide 的文字里，用固定规则提取「每道题要交什么」，不经过模型。
   结果用来核对模型写的 inventory：原文模板里列出的账户、小问编号、Required 里要求的表，模型漏掉任何一项都算错误。
   输入：每页一段文字的数组（PDF 抽取结果）。 */

const QUESTION_RE = /(?:^|\n)\s*(?:Question\s+(\d+)|Example\s+(\d+)|(\d{1,2})\s*[.)]\s+(?=[A-Z]))/g;
const TEMPLATE_RE = /([A-Z][A-Za-z’'&\/\- ]{2,40}?)\s*(?:Account)?\s*\n?\s*Date\s+Particulars?\s+(?:Debit|DR|Dr)/g;

function cleanAccount(name) {
  return name.replace(/\s+/g, ' ').replace(/^(?:Answer|Accounts in the ledger|General Ledger of [^:]+)\s*:?\s*/i, '').replace(/\b([A-Z]) ([a-z])/g, '$1$2').trim();
}

function deliverablesFrom(text) {
  const d = [];
  const accounts = [...new Set([...text.matchAll(TEMPLATE_RE)].map(m => cleanAccount(m[1])).filter(n => n.length > 2 && !/^(Date|Particulars?)$/i.test(n)))];
  /* 多栏式模板的表头有多种写法：Debit Credit Balance、Dr Cr Bal Dr/Cr、DR CR Balance Dr/Cr。 */
  const columnar = /\b(?:Debit|Dr)\s*\$?\s*(?:Credit|Cr)\s*\$?\s*(?:Balance|Bal)\b/i.test(text);
  if (accounts.length) d.push({ type: columnar ? 'columnar' : 'taccounts', accounts });
  else if (/post\b[^.]{0,80}\b(T\s*-?\s*accounts?|ledger)/i.test(text)) d.push({ type: columnar ? 'columnar' : 'taccounts', accounts: [] });
  const bal = [...text.matchAll(/balance the ([A-Za-z ]{3,30}?) account/gi)].map(m => m[1].trim());
  if (bal.length) d.push({ type: 'balanced', accounts: bal });
  if (/balance (?:the|all the|all) (?:T\s*-?\s*)?accounts/i.test(text) && accounts.length) d.push({ type: 'balanced', accounts });
  if (/trial balance/i.test(text) && /prepare|complete/i.test(text)) d.push({ type: 'trialBalance' });
  if (/transaction analysis/i.test(text) && /prepare|complete/i.test(text)) d.push({ type: 'analysis' });
  if (/(general )?journal/i.test(text) && /(enter|prepare|record|journali[sz]e)[^.]{0,60}journal|journal entr(?:y|ies)/i.test(text)) d.push({ type: 'journal' });
  if (/\b(sketch|draw|graph|diagram)\b/i.test(text)) d.push({ type: 'figure' });
  return d;
}

function partsFrom(text) {
  const found = new Set();
  for (const m of text.matchAll(/(?:^|[\s\n])\(?([a-h])\)\s+(?=[A-Z])/g)) found.add(m[1]);
  const letters = 'abcdefgh'.split('');
  const out = [];
  for (const l of letters) { if (found.has(l)) out.push(l); else if (out.length && found.size > out.length) continue; else if (out.length) break; }
  return out.length >= 2 ? out : [];
}

function extractRequirements(pages, prefix = '') {
  const text = pages.map((t, i) => `\n[[p${i + 1}]]\n` + t).join('');
  const marks = [...text.matchAll(QUESTION_RE)].map(m => ({ at: m.index, n: m[1] || m[2] || m[3], kind: m[1] ? 'Q' : m[2] ? 'Ex' : 'Q' }));
  const items = [];
  marks.forEach((m, i) => {
    const chunk = text.slice(m.at, i + 1 < marks.length ? marks[i + 1].at : text.length);
    const page = (text.slice(0, m.at).match(/\[\[p(\d+)\]\]/g) || ['[[p1]]']).pop().replace(/\D/g, '');
    const deliverables = deliverablesFrom(chunk), parts = partsFrom(chunk);
    if (deliverables.length || parts.length) items.push({ ref: `${prefix}${m.kind} ${m.n}`, page: 'p' + page, parts, deliverables });
  });
  return items;
}

module.exports = { extractRequirements, deliverablesFrom, partsFrom };
