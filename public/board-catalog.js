(() => {
  const notes = ['graphicHtml', 'notesHtml', 'tutorialAnswers', 'examplesHtml', 'howToImprove'];
  const courseNames = {
    accounting:'会计', economics:'经济学', mathematics:'数学', computing:'计算机',
    english:'Academic English', extracurricular:'课外拓展', xiaodao:'小岛经济学',
    guofulun:'国富论', gupiao:'股票作手回忆录', dadian:'大癫狂', richdad:'富爸爸穷爸爸',
    lombard:'伦巴第街', jamespsych:'心理学', htlb:'活得更好'
  };
  const catalog = Object.fromEntries(Object.entries(courseNames).map(([id, label]) => [
    id === 'mathematics' ? 'math-notes' : 'notes-' + id, {
      label, file:'data.js', expression:'window.PORTAL_DATA', fields:notes,
      entries:data => (data?.courses.find(course => course.id === id)?.terms || [])
        .flatMap(term => term.weeks.map(week => [term.id + '/' + week.num, week]))
    }
  ]));
  Object.assign(catalog, {
    'question-bank': {
      label:'备考题库', file:'question-bank.js', expression:'window.QUESTION_BANK',
      fields:['q','answer','topic','kind','minutes'], entries:data => (data?.questions || []).map(q => [q.id,q])
    },
    'prep-schedule': {
      label:'备考排期', file:'prep-data.js', expression:'window.PREP_DATA',
      fields:['label','crit','steps','minutes'],
      entries:data => (data?.days || []).flatMap(day => day.items.map((item, index) =>
        [day.date + '/' + index + '/' + item.label, item]))
    },
    'study-plan': {
      label:'复习计划', file:'study-plan.js', expression:'window.STUDY_PLAN',
      fields:['focus','note','strategy','target','dailyHours','done'],
      entries:data => data ? [
        ['goals',data.goals],
        ...data.weeks.map(week => ['week/' + week.w,week]),
        ...data.exams.map(exam => ['exam/' + exam.subj + '/' + exam.name,exam])
      ] : []
    },
    'learning-profile': {
      label:'学科学习档案', file:'learning-profile-data.js', expression:'window.LP_ARCHIVES',
      fields:['progress','verdict'],
      entries:data => (data?.subjects || []).map(subject => [subject.key,subject])
    },
    'english-library': {
      label:'英语学习素材库', file:'english/js/data.js', expression:'ARTICLES',
      fields:['title','topic','paragraphs'], entries:data => (data || []).map(article => [article.id,article])
    }
  });
  if (typeof module === 'object' && module.exports) module.exports = catalog;
  else window.LIORA_BOARD_CATALOG = catalog;
})();
