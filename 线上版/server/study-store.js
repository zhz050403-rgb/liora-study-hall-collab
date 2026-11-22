/* 个人学习扩展数据存储（错题本+遗忘曲线 / 笔记高亮批注 / 番茄专注 / 真实成绩簿 / 术语闪卡 / 一键备份恢复）
   每账号独立文件：data/study_<user>.json，与 u_<user>.json 进度文件并列、互不干扰、绝不入库 */
'use strict';

const path = require('path');
const crypto = require('crypto');

const REVIEW_INTERVALS_DAYS = [1, 3, 7, 14, 30];
const VALID_GRADE_SOURCES = new Set(['official', 'self_reported', 'practice', 'ai_estimate']);

function safeUserKey(u) {
  return String(u || '').replace(/[^A-Za-z0-9_.@-]/g, '_');
}

function emptyStudyData() {
  return {
    version: 1,
    updatedAt: 0,
    mistakes: [],
    annotations: [],
    focusSessions: [],
    grades: [],
    flashcards: {},
    dailyFocus: { day: '', items: [] }
  };
}

function beijingDay(ts) {
  return new Date((ts || Date.now()) + 8 * 3600 * 1000).toISOString().slice(0, 10);
}

function calcNextReview(stage, nowMs) {
  const idx = Math.max(0, Math.min(REVIEW_INTERVALS_DAYS.length - 1, stage));
  return (nowMs || Date.now()) + REVIEW_INTERVALS_DAYS[idx] * 86400 * 1000;
}

function createStudyStore(opts) {
  const storage = opts.storage;
  const dataDir = opts.dataDir;

  function studyPath(u) {
    return path.join(dataDir, 'study_' + safeUserKey(u) + '.json');
  }

  function readStudy(u) {
    const raw = storage.readJson(studyPath(u), emptyStudyData);
    const d = emptyStudyData();
    if (raw && typeof raw === 'object') {
      d.updatedAt = Number(raw.updatedAt) || 0;
      if (Array.isArray(raw.mistakes)) d.mistakes = raw.mistakes;
      if (Array.isArray(raw.annotations)) d.annotations = raw.annotations;
      if (Array.isArray(raw.focusSessions)) d.focusSessions = raw.focusSessions;
      if (Array.isArray(raw.grades)) d.grades = raw.grades;
      if (raw.flashcards && typeof raw.flashcards === 'object' && !Array.isArray(raw.flashcards)) d.flashcards = raw.flashcards;
      if (raw.dailyFocus && typeof raw.dailyFocus === 'object') d.dailyFocus = raw.dailyFocus;
    }
    return d;
  }

  function mutateStudy(u, mutator) {
    const fp = studyPath(u);
    return storage.withFileLock(fp, () => {
      const d = readStudy(u);
      const res = mutator(d);
      if (res && res.ok === false) return res;
      d.updatedAt = Date.now();
      storage.writeJsonAtomic(fp, d);
      return Object.assign({ ok: true, updatedAt: d.updatedAt }, res || {});
    });
  }

  function upsertMistake(u, payload) {
    return mutateStudy(u, d => {
      if (payload.action === 'delete') {
        const id = String(payload.id || '');
        d.mistakes = d.mistakes.filter(x => x.id !== id);
        return { deleted: id, total: d.mistakes.length };
      }
      if (payload.action === 'review') {
        const id = String(payload.id || '');
        const item = d.mistakes.find(x => x.id === id);
        if (!item) return { ok: false, error: '错题不存在' };
        const passed = payload.passed === true;
        const now = Date.now();
        item.reviewCount = (Number(item.reviewCount) || 0) + 1;
        item.lastReviewedAt = now;
        if (passed) {
          item.stage = Math.min(REVIEW_INTERVALS_DAYS.length, (Number(item.stage) || 0) + 1);
          item.mastered = item.stage >= REVIEW_INTERVALS_DAYS.length;
          item.nextReviewAt = item.mastered ? 0 : calcNextReview(item.stage, now);
        } else {
          item.stage = 0;
          item.mastered = false;
          item.nextReviewAt = calcNextReview(0, now);
        }
        return { item };
      }
      const prompt = String(payload.prompt || payload.question || '').trim().slice(0, 2000);
      if (!prompt) return { ok: false, error: '题干不能为空' };
      const now = Date.now();
      const id = String(payload.id || '').trim() || ('m_' + crypto.randomBytes(6).toString('hex'));
      const existing = d.mistakes.find(x => x.id === id);
      const item = existing || {
        id,
        createdAt: now,
        stage: 0,
        reviewCount: 0,
        mastered: false,
        nextReviewAt: calcNextReview(0, now)
      };
      item.course = String(payload.course || 'general').trim().slice(0, 40);
      item.term = String(payload.term || '').trim().slice(0, 24);
      item.week = String(payload.week || '').trim().slice(0, 24);
      item.topic = String(payload.topic || '').trim().slice(0, 120);
      item.errorTag = String(payload.errorTag || '').trim().slice(0, 60);
      item.prompt = prompt;
      item.myAnswer = String(payload.myAnswer || '').trim().slice(0, 1200);
      item.correctAnswer = String(payload.correctAnswer || '').trim().slice(0, 2000);
      item.note = String(payload.note || '').trim().slice(0, 1500);
      item.sourceHref = String(payload.sourceHref || '').trim().slice(0, 200);
      item.updatedAt = now;
      if (!existing) {
        if (d.mistakes.length >= 2000) return { ok: false, error: '错题本已达上限（2000 条）' };
        d.mistakes.unshift(item);
      }
      return { item, total: d.mistakes.length };
    });
  }

  function upsertAnnotation(u, payload) {
    return mutateStudy(u, d => {
      if (payload.action === 'delete') {
        const id = String(payload.id || '');
        d.annotations = d.annotations.filter(x => x.id !== id);
        return { deleted: id, total: d.annotations.length };
      }
      const route = String(payload.route || '').trim().slice(0, 160);
      const quote = String(payload.quote || '').trim().slice(0, 800);
      const note = String(payload.note || '').trim().slice(0, 2000);
      if (!route || (!quote && !note)) return { ok: false, error: '批注位置与内容不能为空' };
      const now = Date.now();
      const id = String(payload.id || '').trim() || ('a_' + crypto.randomBytes(6).toString('hex'));
      const existing = d.annotations.find(x => x.id === id);
      const item = existing || { id, createdAt: now };
      item.route = route;
      item.course = String(payload.course || '').trim().slice(0, 40);
      item.title = String(payload.title || '').trim().slice(0, 140);
      item.kind = ['highlight', 'note', 'bookmark'].includes(payload.kind) ? payload.kind : 'note';
      item.color = ['gold', 'blue', 'rose', 'green'].includes(payload.color) ? payload.color : 'gold';
      item.quote = quote;
      item.note = note;
      item.updatedAt = now;
      if (!existing) {
        if (d.annotations.length >= 3000) return { ok: false, error: '批注数已达上限（3000 条）' };
        d.annotations.unshift(item);
      }
      return { item, total: d.annotations.length };
    });
  }

  function logFocus(u, payload) {
    return mutateStudy(u, d => {
      if (payload.action === 'set_daily') {
        const day = beijingDay();
        const items = Array.isArray(payload.items)
          ? payload.items.slice(0, 6).map(x => ({
            id: String((x && x.id) || crypto.randomBytes(4).toString('hex')).slice(0, 32),
            text: String((x && x.text) || '').trim().slice(0, 140),
            course: String((x && x.course) || '').trim().slice(0, 32),
            minutes: Math.max(5, Math.min(180, Number(x && x.minutes) || 25)),
            done: !!(x && x.done),
            href: String((x && x.href) || '').trim().slice(0, 180)
          })).filter(x => x.text)
          : [];
        d.dailyFocus = { day, items };
        return { dailyFocus: d.dailyFocus };
      }
      const minutes = Math.max(1, Math.min(240, Math.round(Number(payload.minutes) || 25)));
      const now = Date.now();
      const session = {
        id: 'f_' + crypto.randomBytes(5).toString('hex'),
        day: beijingDay(now),
        minutes,
        course: String(payload.course || 'general').trim().slice(0, 40),
        task: String(payload.task || '').trim().slice(0, 140),
        at: now
      };
      d.focusSessions.unshift(session);
      if (d.focusSessions.length > 1000) d.focusSessions = d.focusSessions.slice(0, 1000);
      return { session };
    });
  }

  function upsertGrade(u, payload) {
    return mutateStudy(u, d => {
      if (payload.action === 'delete') {
        const id = String(payload.id || '');
        d.grades = d.grades.filter(x => x.id !== id);
        return { deleted: id, total: d.grades.length };
      }
      const course = String(payload.course || '').trim().slice(0, 40);
      const title = String(payload.title || '').trim().slice(0, 140);
      const score = Number(payload.score);
      const maxScore = Number(payload.maxScore);
      const sourceType = VALID_GRADE_SOURCES.has(payload.sourceType) ? payload.sourceType : 'practice';
      if (!course || !title || !Number.isFinite(score) || !Number.isFinite(maxScore) || maxScore <= 0 || score < 0) {
        return { ok: false, error: '请填写完整的科目、名称与有效分数' };
      }
      const now = Date.now();
      const id = String(payload.id || '').trim() || ('g_' + crypto.randomBytes(5).toString('hex'));
      const existing = d.grades.find(x => x.id === id);
      const item = existing || { id, createdAt: now };
      item.course = course;
      item.title = title;
      item.score = Math.round(score * 100) / 100;
      item.maxScore = Math.round(maxScore * 100) / 100;
      item.pct = Math.round((score / maxScore) * 10000) / 100;
      item.sourceType = sourceType;
      item.date = String(payload.date || beijingDay(now)).slice(0, 16);
      item.weakPoints = Array.isArray(payload.weakPoints)
        ? payload.weakPoints.map(x => String(x).trim().slice(0, 80)).filter(Boolean).slice(0, 12)
        : [];
      item.errorTags = Array.isArray(payload.errorTags)
        ? payload.errorTags.map(x => String(x).trim().slice(0, 40)).filter(Boolean).slice(0, 12)
        : [];
      item.summary = String(payload.summary || '').trim().slice(0, 1200);
      item.updatedAt = now;
      if (!existing) {
        if (d.grades.length >= 500) return { ok: false, error: '成绩记录已达上限（500 条）' };
        d.grades.unshift(item);
      }
      return { item, total: d.grades.length };
    });
  }

  function updateFlashcard(u, payload) {
    return mutateStudy(u, d => {
      const termId = String(payload.termId || '').trim().slice(0, 120);
      const status = ['known', 'review', 'unseen'].includes(payload.status) ? payload.status : 'review';
      if (!termId) return { ok: false, error: '术语 ID 不能为空' };
      if (status === 'unseen') delete d.flashcards[termId];
      else d.flashcards[termId] = { status, updatedAt: Date.now() };
      return { termId, status, totalTracked: Object.keys(d.flashcards).length };
    });
  }

  function importStudy(u, incoming) {
    if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
      return Promise.resolve({ ok: false, error: '备份数据结构无效' });
    }
    return mutateStudy(u, d => {
      if (Array.isArray(incoming.mistakes)) d.mistakes = incoming.mistakes.slice(0, 2000);
      if (Array.isArray(incoming.annotations)) d.annotations = incoming.annotations.slice(0, 3000);
      if (Array.isArray(incoming.focusSessions)) d.focusSessions = incoming.focusSessions.slice(0, 1000);
      if (Array.isArray(incoming.grades)) d.grades = incoming.grades.slice(0, 500);
      if (incoming.flashcards && typeof incoming.flashcards === 'object' && !Array.isArray(incoming.flashcards)) {
        d.flashcards = incoming.flashcards;
      }
      if (incoming.dailyFocus && typeof incoming.dailyFocus === 'object') {
        d.dailyFocus = incoming.dailyFocus;
      }
      return { restored: true };
    });
  }

  return {
    readStudy,
    upsertMistake,
    upsertAnnotation,
    logFocus,
    upsertGrade,
    updateFlashcard,
    importStudy,
    beijingDay
  };
}

module.exports = { createStudyStore, REVIEW_INTERVALS_DAYS, VALID_GRADE_SOURCES };
