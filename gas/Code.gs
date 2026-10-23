/**
 * こんだて — 同期用 Google Apps Script
 *
 * 使い方（くわしくは README）:
 *   1. 新しい Google スプレッドシートを作る
 *   2. 拡張機能 → Apps Script を開き、このファイルの中身をまるごと貼り付ける
 *   3. 下の PASSWORD を好きな合言葉に変えて保存
 *   4. デプロイ → 新しいデプロイ → 種類「ウェブアプリ」
 *        次のユーザーとして実行: 自分
 *        アクセスできるユーザー: 全員
 *   5. 出てきた URL（…/exec）と合言葉をアプリの設定画面に入れる
 */

const PASSWORD = 'ここを合言葉に変える';
const SHEET_NAME = 'data';

function doGet() {
  return out_({ ok: true, app: 'kondate' });
}

function doPost(e) {
  let req;
  try {
    req = JSON.parse(e.postData.contents);
  } catch (err) {
    return out_({ ok: false, error: 'bad request' });
  }
  if (PASSWORD === 'ここを合言葉に変える') return out_({ ok: false, error: 'Code.gs の PASSWORD を変更してください' });
  if (req.key !== PASSWORD) return out_({ ok: false, error: 'auth' });

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = sheet_();
    if (req.action === 'put') write_(sh, req.ops || []);
    return out_({ ok: true, items: read_(sh) });
  } finally {
    lock.releaseLock();
  }
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.getRange(1, 1, 1, 4).setValues([['key', 'value', '更新日時', '内容（見る用）']]).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.getRange('A:B').setNumberFormat('@'); // 数字や日付に勝手に変換されないように
    sh.setColumnWidth(2, 120);
    sh.setColumnWidth(4, 400);
  }
  return sh;
}

function read_(sh) {
  const items = {};
  const n = sh.getLastRow() - 1;
  if (n < 1) return items;
  sh.getRange(2, 1, n, 2).getValues().forEach(function (r) {
    if (!r[0]) return;
    try { items[r[0]] = JSON.parse(r[1]); } catch (err) { /* 壊れた行は無視 */ }
  });
  return items;
}

function write_(sh, ops) {
  // 同じキーへの操作は最後のものだけ使う
  const latest = {};
  ops.forEach(function (op) { if (op && op.k) latest[op.k] = op.v; });

  const n = sh.getLastRow() - 1;
  const keys = n > 0 ? sh.getRange(2, 1, n, 1).getValues().map(function (r) { return r[0]; }) : [];
  const rowOf = {};
  keys.forEach(function (k, i) { rowOf[k] = i + 2; });

  const now = new Date();
  const adds = [];
  const dels = [];
  Object.keys(latest).forEach(function (k) {
    const v = latest[k];
    if (v === null || v === undefined) {
      if (rowOf[k]) dels.push(rowOf[k]);
      return;
    }
    const row = [k, JSON.stringify(v), now, describe_(k, v)];
    if (rowOf[k]) sh.getRange(rowOf[k], 1, 1, 4).setValues([row]);
    else adds.push(row);
  });
  if (adds.length) sh.getRange(sh.getLastRow() + 1, 1, adds.length, 4).setValues(adds);
  dels.sort(function (a, b) { return b - a; }).forEach(function (r) { sh.deleteRow(r); });
}

// スプレッドシートを直接見たときに分かりやすいように
function describe_(k, v) {
  try {
    if (k.indexOf('rcp:') === 0) {
      return '【' + (v.cat || '') + '】' + v.name + '：' + (v.ings || []).map(function (i) { return i.n + (i.a ? ' ' + i.a : ''); }).join('、');
    }
    if (k.indexOf('meal:') === 0) {
      return k.slice(5) + ' 夕食：' + (v.dishes || []).map(function (d) { return d.t; }).join('・') + (v.note ? '（' + v.note + '）' : '');
    }
    if (k.indexOf('ext:') === 0) return '買い物に追加：' + v.n;
    if (k.indexOf('chk:') === 0) return v === 'h' ? '家にある' : v === 0 ? '買う' : '買った';
    if (k.indexOf('stp:') === 0) return 'いつも家にある：' + v.n;
  } catch (err) { /* 説明が作れなくても保存はする */ }
  return '';
}
