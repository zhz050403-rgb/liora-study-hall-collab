/* 19 板块即时补丁与笔记生成流水线路由（使用缓存 baseline，避免反复 vm 解析 8MB data.js） */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vm = require('node:vm');
const { json, send, readBody } = require('./http-utils');

function validBoardValue(field, value) {
  if (field === 'minutes') return Number.isInteger(value) && value > 0;
  if (field === 'dailyHours') return Number.isFinite(value) && value > 0;
  if (field === 'done') return typeof value === 'boolean';
  if (field === 'paragraphs' || field === 'steps') return Array.isArray(value) && value.every(text => typeof text === 'string');
  return typeof value === 'string';
}

function boardRevision(baseline, overrides) {
  return crypto.createHash('sha256').update(JSON.stringify([baseline, overrides])).digest('hex');
}

function createBoardsService(opts) {
  const f = opts.fs || fs;
  const config = opts.config;
  const storage = opts.storage;
  const cache = opts.cache;
  const loadAICfg = opts.loadAICfg;
  const BOARDS = require(path.join(config.pub, 'board-catalog.js'));

  function boardFile(board) {
    return path.join(config.dataDir, 'board-' + board + '.json');
  }

  function boardOverrides(board) {
    try {
      return JSON.parse(f.readFileSync(boardFile(board), 'utf8'));
    } catch (error) {
      if (error && error.code === 'ENOENT') return {};
      throw error;
    }
  }

  function saveBoardOverrides(board, overrides) {
    storage.writeJsonAtomic(boardFile(board), overrides);
  }

  function boardBaseline(board) {
    return cache.getBoardBaseline(board, BOARDS[board]);
  }

  async function handleBoard(req, res, board) {
    let payload;
    if (req.method === 'POST') {
      if (
        req.headers['x-liora-board'] !== '1' ||
        !/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '') ||
        req.headers['sec-fetch-site'] === 'cross-site'
      ) {
        return json(res, 403, { error: 'invalid_patch_request' });
      }
      let body;
      try { body = await readBody(req, 2 * 1024 * 1024); }
      catch (error) { return json(res, 413, { error: 'patch_too_large' }); }
      try { payload = JSON.parse(body); }
      catch (error) { return json(res, 400, { error: 'invalid_json' }); }
    } else if (req.method !== 'GET') {
      return json(res, 405, { error: 'method_not_allowed' });
    }

    try {
      const baseline = boardBaseline(board);
      const overrides = boardOverrides(board);
      const revision = boardRevision(baseline, overrides);
      const entries = Object.fromEntries(
        Object.entries(baseline).map(([key, entry]) => [key, { ...entry, ...overrides[key] }])
      );
      if (req.method === 'GET') return json(res, 200, { board, revision, entries });
      if (!payload || payload.revision !== revision) {
        return json(res, 409, { error: 'board_changed', revision });
      }
      const changes = payload.changes;
      if (!changes || typeof changes !== 'object' || Array.isArray(changes) || !Object.keys(changes).length) {
        return json(res, 400, { error: 'empty_patch' });
      }
      for (const [key, change] of Object.entries(changes)) {
        if (!Object.hasOwn(baseline, key)) return json(res, 400, { error: 'unknown_entry', key });
        if (change === null) { delete overrides[key]; continue; }
        const fields = Object.keys(baseline[key]);
        if (
          !change || typeof change !== 'object' || Array.isArray(change) || !Object.keys(change).length ||
          Object.entries(change).some(([field, value]) => !fields.includes(field) || !validBoardValue(field, value))
        ) {
          return json(res, 400, { error: 'invalid_entry', key });
        }
        overrides[key] = { ...overrides[key], ...change };
      }
      saveBoardOverrides(board, overrides);
      return json(res, 200, { ok: true, revision: boardRevision(baseline, overrides) });
    } catch (error) {
      console.error('Board update failed:', board, error.code || error.name);
      return json(res, 500, { error: 'board_storage_unavailable' });
    }
  }

  function serveBoardOverridesJs(res, isOwner) {
    const overrides = {};
    for (const board of Object.keys(BOARDS)) {
      if (!isOwner && board === 'notes-extracurricular') continue;
      try { overrides[board] = boardOverrides(board); }
      catch (error) { console.error('Board read failed:', board, error.code || error.name); }
    }
    return send(res, 200, 'window.LIORA_BOARD_OVERRIDES = ' + JSON.stringify(overrides) + ';', {
      'Content-Type': config.mime['.js'],
      'Cache-Control': 'private, no-store'
    });
  }

  let notesPipeline;
  function getNotesPipeline() {
    if (!notesPipeline) {
      notesPipeline = require('../notes/pipeline/service').createService({
        draftDir: path.join(config.dataDir, 'notes-review'),
        roots: [path.join(config.pub, 'sources'), config.pub, path.resolve(config.root, '../_deploy_excluded/sources')],
        readConfig: loadAICfg,
        lookup(board, key) {
          const spec = BOARDS[board];
          if (!spec || !spec.fields.includes('graphicHtml')) return null;
          const data = vm.runInNewContext(
            f.readFileSync(path.join(config.pub, spec.file), 'utf8') + '\n;' + spec.expression,
            { window: {} },
            { timeout: 1500 }
          );
          return spec.entries(data).find(([id]) => id === key)?.[1];
        },
        readBoard(board, key) {
          const baseline = boardBaseline(board);
          const overrides = boardOverrides(board);
          if (!Object.hasOwn(baseline[key] || {}, 'graphicHtml')) {
            throw new Error('This week does not have an editable graphicHtml field.');
          }
          return {
            html: overrides[key]?.graphicHtml ?? baseline[key].graphicHtml,
            revision: boardRevision(baseline, overrides)
          };
        },
        writeBoard(board, key, html, revision) {
          const baseline = boardBaseline(board);
          const overrides = boardOverrides(board);
          if (boardRevision(baseline, overrides) !== revision) {
            throw new Error('The board changed. Reopen the draft before publishing.');
          }
          overrides[key] = { ...overrides[key], graphicHtml: html };
          saveBoardOverrides(board, overrides);
        }
      });
    }
    return notesPipeline;
  }

  async function handleNotesPipeline(req, res, parsedUrl) {
    const sendResult = (status, payload) => json(res, status, payload, { 'Cache-Control': 'private, no-store' });
    try {
      if (req.method === 'GET') return sendResult(200, getNotesPipeline().get(parsedUrl.searchParams.get('id')));
      if (req.method !== 'POST') return sendResult(405, { error: 'method_not_allowed' });
      if (
        req.headers['x-liora-board'] !== '1' ||
        req.headers['sec-fetch-site'] === 'cross-site' ||
        !/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')
      ) {
        return sendResult(403, { error: 'invalid_request' });
      }
      let body;
      try { body = JSON.parse(await readBody(req, 8192)); }
      catch { return sendResult(400, { error: 'invalid_json' }); }
      if (body?.action === 'generate') {
        const result = await getNotesPipeline().generate(body);
        return sendResult(result.validation.errors.length ? 422 : 201, result);
      }
      if (body?.action === 'publish') return sendResult(200, getNotesPipeline().publish(body.id, body.revision));
      return sendResult(400, { error: 'invalid_action' });
    } catch (error) {
      if (!error.status) console.error('Notes pipeline failed:', error.code || error.name);
      return sendResult(error.status || 500, { error: error.status ? error.message : 'Notes pipeline failed.', calls: error.calls || 0 });
    }
  }

  return { BOARDS, handleBoard, serveBoardOverridesJs, handleNotesPipeline };
}

module.exports = { createBoardsService };
