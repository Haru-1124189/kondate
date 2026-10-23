'use strict';

// index.html の app.js?v=N の N（設定画面に出す）
const APP_VERSION = (document.currentScript && new URL(document.currentScript.src).searchParams.get('v')) || '?';

// ============================================================
// 小道具
// ============================================================
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => String(s ?? '').normalize('NFKC').trim();
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const load = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* 容量オーバー等 */ } };

const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseYmd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const mondayOf = d => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); return addDays(x, -((x.getDay() + 6) % 7)); };
const md = d => `${d.getMonth() + 1}/${d.getDate()}`;
const DOW = ['月', '火', '水', '木', '金', '土', '日'];
const dowOf = date => DOW[(parseYmd(date).getDay() + 6) % 7];
const weekDates = w => Array.from({ length: 7 }, (_, i) => ymd(addDays(parseYmd(w), i)));

const RECIPE_CATS = ['主菜', '副菜', '汁物', '主食', 'その他'];

// 買い物リストの売り場カテゴリ（並び順＝売り場を回る順）
const SHOP_CATS = ['野菜・果物', '肉', '魚介', '卵・乳製品', '豆腐・練り物', '主食・乾物', 'その他', '追加', '調味料'];
const ING_WORDS = {
  '野菜・果物': '玉ねぎ たまねぎ 玉葱 にんじん 人参 じゃがいも じゃが芋 キャベツ レタス トマト ミニトマト きゅうり なす ナス ピーマン もやし ほうれん草 小松菜 白菜 大根 ねぎ ネギ 長ねぎ 青ねぎ 万能ねぎ にら ニラ ブロッコリー かぼちゃ ごぼう れんこん しめじ えのき しいたけ 椎茸 まいたけ 舞茸 エリンギ きのこ 生姜 しょうが にんにく 大葉 水菜 アボカド レモン りんご バナナ さつまいも 里芋 長芋 山芋 オクラ ズッキーニ パプリカ セロリ アスパラ 豆苗 かいわれ みょうが パセリ とうもろこし コーン 枝豆 いちご みかん ゴーヤ チンゲン菜 青梗菜 春菊 三つ葉 カット野菜 サラダ菜 ベビーリーフ 野菜 たけのこ マッシュルーム サンチュ バジル ししとう すだち なめこ パクチー クレソン 絹さや 梅干し レモン汁',
  '肉': '豚 牛 鶏 ひき肉 挽肉 合挽 ミンチ ベーコン ハム ソーセージ ウインナー ささみ 手羽 肉',
  '魚介': '鮭 さけ サーモン さば 鯖 あじ 鯵 いわし ぶり 鰤 たら 鱈 まぐろ かつお えび 海老 いか たこ あさり しじみ ほたて 帆立 しらす 刺身 魚 牡蠣 カレイ さんま 白身魚 桜えび ゆでだこ',
  '卵・乳製品': '卵 たまご 玉子 牛乳 チーズ バター ヨーグルト 生クリーム',
  '豆腐・練り物': '豆腐 厚揚げ 油揚げ 納豆 こんにゃく ちくわ かまぼこ はんぺん さつま揚げ キムチ しらたき ごぼう天 紅しょうが ザーサイ',
  '主食・乾物': '米 ご飯 ごはん パン 食パン うどん そば パスタ スパゲッティ 麺 中華麺 焼きそば 小麦粉 薄力粉 片栗粉 パン粉 春雨 わかめ のり 海苔 昆布 かつお節 ごま 胡麻 餃子の皮 カレールー シチュールー ルー ツナ 缶 トマト缶 そうめん マカロニ ひじき 切り干し大根 カシューナッツ 春巻きの皮 しゅうまいの皮 ライスペーパー 天ぷら粉 お好み焼き粉 たこ焼き粉 天かす ココナッツミルク クルトン レーズン ちらし寿司の素',
  '調味料': '醤油 しょうゆ 味噌 みそ 砂糖 塩 こしょう 胡椒 塩こしょう 酢 みりん 酒 料理酒 油 サラダ油 ごま油 オリーブオイル マヨネーズ ケチャップ ソース 中濃ソース だし 顆粒だし 白だし コンソメ 鶏ガラ 鶏がらスープ めんつゆ ポン酢 オイスターソース 豆板醤 コチュジャン カレー粉 はちみつ ドレッシング 焼肉のたれ わさび からし にんにくチューブ 生姜チューブ 甜麺醤 ナンプラー ごまだれ ラー油 白ワイン 鍋の素 キムチ鍋の素 おでんの素 スンドゥブの素 冷やし中華のたれ ラーメンスープの素 タコスシーズニング グリーンカレーペースト すし酢 鷹の爪',
};
const ING_INDEX = Object.entries(ING_WORDS).flatMap(([cat, ws]) => ws.split(' ').map(w => [w, cat]));
function guessCat(name) {
  // 一番長く一致した単語のカテゴリ（「ごま油」→調味料、「油揚げ」→豆腐）
  let best = null;
  for (const [w, cat] of ING_INDEX) if (name.includes(w) && (!best || w.length > best[0].length)) best = [w, cat];
  return best ? best[1] : 'その他';
}

// ============================================================
// データと同期
//   data: key → value のフラットな辞書
//     rcp:<id>              料理 {name, cat, ings:[{n,a}], memo}
//     meal:<YYYY-MM-DD>     その日の夕食 {dishes:[{r?, t}], note}
//     ext:<週>:<id>         買い物の手動追加 {n}
//     chk:<週>:<品目キー>   買い物のチェック 1
//   変更は「キー単位の上書き」としてスプレッドシートへ送る。
//   2人で同時に別の物を触っても潰し合わない。
// ============================================================
const K = { data: 'kondate.data', pending: 'kondate.pending', conf: 'kondate.conf', view: 'kondate.view', shopMode: 'kondate.shopMode', omakase: 'kondate.omakase' };
let data = load(K.data, {});
let pending = load(K.pending, []);
let conf = load(K.conf, { url: '', key: '' });

function applyOp(target, op) { if (op.v === null) delete target[op.k]; else target[op.k] = op.v; }
function persist() { store(K.data, data); store(K.pending, pending); }

function set(k, v) { setMany([[k, v]]); }
function setMany(pairs) {
  for (const [k, v] of pairs) { const op = { k, v: v ?? null }; applyOp(data, op); pending.push(op); }
  persist();
  render();
  scheduleFlush();
}

let sync = { state: 'local', msg: '' };
let flushTimer = null, busy = false, retryMs = 0;

const syncLabel = () => ({ local: '⚪ この端末にだけ保存中', busy: '🟡 送っとる…', ok: '🟢 スプレッドシートと同期中', err: '🔴 同期できとらん：' + esc(sync.msg) }[sync.state]);
function setSync(state, msg = '') {
  sync = { state, msg };
  renderSyncDot();
  const el = $('#syncStatus'); // 設定画面を開いとったら、その場で書き換える
  if (el) el.innerHTML = syncLabel();
}

async function api(body, c = conf) {
  let res;
  try {
    res = await fetch(c.url, {
      method: 'POST',
      // text/plain にすると CORS のプリフライトが飛ばず、Apps Script でもそのまま通る
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ ...body, key: c.key }),
    });
  } catch {
    // 電波がないか、Apps Script がエラー画面を返したとき（Failed to fetch）
    throw new Error('つながらん（電波か、Apps Script 側の問題）');
  }
  if (!res.ok) throw new Error('通信エラー（' + res.status + '）');
  let j;
  try { j = await res.json(); } catch { throw new Error('URL違うかもしれん'); }
  if (!j.ok) throw new Error(j.error === 'auth' ? '合言葉違うで' : (j.error || '不明なエラー'));
  return j;
}

function acceptServer(items) {
  const before = JSON.stringify(data);
  data = items || {};
  for (const op of pending) applyOp(data, op);
  persist();
  if (JSON.stringify(data) !== before) render();
}

function scheduleFlush(ms = 400) { clearTimeout(flushTimer); flushTimer = setTimeout(flush, ms); }

// 未送信の変更があれば送り、なければ最新を取りに行く
async function flush() {
  if (!conf.url) { setSync('local'); return; }
  if (busy) { scheduleFlush(500); return; }
  busy = true;
  const ops = pending.slice();
  // 変更を送るときだけ黄色にする（15秒ごとの取りに行くだけのときは、つながっとる表示のまま）
  if (ops.length || sync.state !== 'ok') setSync('busy');
  try {
    const j = await api(ops.length ? { action: 'put', ops } : { action: 'get' });
    pending = pending.slice(ops.length);
    acceptServer(j.items);
    setSync('ok');
    retryMs = 0;
    if (pending.length) scheduleFlush();
  } catch (e) {
    if (e.message === '混んどる') {
      // 相手が送っとる最中なだけ。黄色のまま、ちょっと待って送り直す
      scheduleFlush(2000 + Math.random() * 2000);
      return;
    }
    setSync('err', e.message);
    retryMs = Math.min((retryMs || 5000) * 2, 60000);
    scheduleFlush(retryMs);
  } finally {
    busy = false;
  }
}

setInterval(() => { if (conf.url && !document.hidden && !busy && !pending.length) flush(); }, 15000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) flush(); });
window.addEventListener('online', () => flush());

// ============================================================
// データの読み出し
// ============================================================
const recipe = id => (id ? data['rcp:' + id] : undefined);
const recipes = () => Object.entries(data).filter(([k]) => k.startsWith('rcp:')).map(([k, v]) => ({ id: k.slice(4), ...v }));
const meal = date => data['meal:' + date] || { dishes: [], note: '' };
const dishName = d => recipe(d.r)?.name || d.t || '（名前なし）';
const dishCat = d => recipe(d.r)?.cat || 'その他';

function setMeal(date, m) {
  const empty = !(m.dishes || []).length && !norm(m.note);
  set('meal:' + date, empty ? null : { dishes: m.dishes || [], note: norm(m.note) });
}

function lastUsedMap() {
  const map = {};
  for (const [k, v] of Object.entries(data)) {
    if (!k.startsWith('meal:')) continue;
    const date = k.slice(5);
    for (const d of v.dishes || []) if (d.r && (!map[d.r] || map[d.r] < date)) map[d.r] = date;
  }
  return map;
}
function lastUsedLabel(date) {
  if (!date) return 'まだ作っとらん';
  const days = Math.round((parseYmd(date) - parseYmd(ymd(new Date()))) / 864e5);
  if (days > 0) return `${md(parseYmd(date))} に予定`;
  if (days === 0) return '今日';
  return `${-days}日前`;
}

function knownIngredients() {
  const s = new Set();
  for (const r of recipes()) for (const i of r.ings || []) if (norm(i.n)) s.add(norm(i.n));
  return [...s].sort((a, b) => a.localeCompare(b, 'ja'));
}

// ---- 分量の合算 ----
const NUM = '(\\d+(?:\\.\\d+)?(?:\\/\\d+)?)';
const parseNum = s => { if (s.includes('/')) { const [a, b] = s.split('/').map(Number); return b ? a / b : NaN; } return Number(s); };
const fmtNum = n => String(Math.round(n * 100) / 100);
function sumAmounts(list) {
  const units = new Map(); // 単位 → {n, prefix}
  const other = [];
  for (const a of list) {
    let m = a.match(new RegExp('^' + NUM + '\\s*(.*)$'));          // 200g, 1/2個
    if (m && !isNaN(parseNum(m[1]))) { addUnit(m[2], parseNum(m[1]), false); continue; }
    m = a.match(new RegExp('^(.*?)\\s*' + NUM + '$'));              // 大さじ2
    if (m && !isNaN(parseNum(m[2]))) { addUnit(m[1], parseNum(m[2]), true); continue; }
    other.push(a);                                                  // 少々、適量、2〜3個 など
  }
  function addUnit(unit, n, prefix) {
    const key = (prefix ? '<' : '>') + unit;
    const u = units.get(key) || { unit, n: 0, prefix };
    u.n += n;
    units.set(key, u);
  }
  return [
    ...[...units.values()].map(u => (u.prefix ? u.unit + fmtNum(u.n) : fmtNum(u.n) + u.unit)),
    ...new Set(other),
  ].join(' ＋ ');
}

// 週の買い物データ
//   料理ごと：その日のその料理に必要な材料（チェックは料理×材料ごと）
//   まとめて：同じ材料を週で合算（チェックは中の全部をまとめて付け外し）
//   材料ごとの状態: need（買う）/ bought（買った）/ have（家にある）
//     chk の値  1 = 買った、'h' = 家にある、0 = 買う（いつも家にある物をこの週だけ買う）
//     値がなければ、いつも家にある物なら have、それ以外は need
function shoppingList(week) {
  const stateOf = ck => {
    const v = data[`chk:${week}:${ck}`];
    if (v === 1) return 'bought';
    if (v === 'h') return 'have';
    if (v === 0) return 'need';
    return isStapleCk(ck) ? 'have' : 'need';
  };
  const withState = (o, ck) => { const st = stateOf(ck); return { ...o, cks: [ck], state: st, checked: st !== 'need', have: st === 'have' }; };
  const days = [];
  const missing = [];
  for (const date of weekDates(week)) {
    const dishes = [];
    for (const d of meal(date).dishes || []) {
      const r = recipe(d.r);
      if (!r) continue; // 登録していない料理（外食メモなど）は材料なし
      const ings = (r.ings || []).filter(i => norm(i.n)).map(i => {
        const name = norm(i.n);
        return withState({ name, key: name.toLowerCase(), amount: norm(i.a), cat: guessCat(name) }, `d:${date}:${d.r}:${name.toLowerCase()}`);
      });
      if (!ings.length) missing.push({ id: d.r, name: r.name, dow: dowOf(date) });
      dishes.push({ id: d.r, name: r.name, cat: r.cat || 'その他', ings });
    }
    if (dishes.length) days.push({ date, dishes, note: meal(date).note });
  }

  const agg = new Map();
  for (const day of days) for (const dish of day.dishes) for (const i of dish.ings) {
    let it = agg.get(i.key);
    if (!it) agg.set(i.key, (it = { name: i.name, cat: i.cat, amounts: [], days: [], dishes: [], cks: [], done: 0, haves: 0 }));
    if (i.amount) it.amounts.push(i.amount);
    const dw = dowOf(day.date);
    if (!it.days.includes(dw)) it.days.push(dw);
    if (!it.dishes.includes(dish.name)) it.dishes.push(dish.name);
    it.cks.push(...i.cks);
    if (i.checked) it.done++;
    if (i.have) it.haves++;
  }
  const list = [...agg.values()].map(it => ({
    ...it, amount: sumAmounts(it.amounts),
    checked: it.done === it.cks.length, have: it.haves === it.cks.length,
  }));

  const prefix = `ext:${week}:`;
  const extras = Object.entries(data).filter(([k]) => k.startsWith(prefix))
    .map(([k, v]) => withState({ name: v.n, cat: '追加', amount: '', days: [], dishes: [], extKey: k }, 'x:' + k.slice(prefix.length)));
  list.push(...extras);
  list.sort((a, b) => SHOP_CATS.indexOf(a.cat) - SHOP_CATS.indexOf(b.cat) || a.name.localeCompare(b.name, 'ja'));

  // 進み具合は「料理×材料」単位で数える（どちらの表示でも同じ数字になるように）
  const all = [...days.flatMap(d => d.dishes.flatMap(x => x.ings)), ...extras];
  return { days, list, extras, missing, total: all.length, done: all.filter(i => i.checked).length };
}

// ---- いつも家にある物 ----
//   stp:<材料名(小文字)> → {n}
const stapleKey = name => 'stp:' + norm(name).toLowerCase();
const isStaple = name => !!data[stapleKey(name)];
const staples = () => Object.entries(data).filter(([k]) => k.startsWith('stp:')).map(([, v]) => v.n).sort((a, b) => a.localeCompare(b, 'ja'));
// ck = d:<日付>:<料理ID>:<材料名>
const isStapleCk = ck => ck.startsWith('d:') && !!data['stp:' + ck.split(':').slice(3).join(':')];
// 「買う」に戻すときの値：いつも家にある物は明示的に 0 を入れないと「家にある」に戻ってしまう
const needValue = ck => (isStapleCk(ck) ? 0 : null);

// ============================================================
// 画面
// ============================================================
const VIEWS = ['plan', 'shop', 'recipes', 'settings'];
// 献立は「今週＋来週」の2週間を並べる（来週を考えながら今週も見えるように）
// 買い物は1週間ずつ。週末（土日）に開いたら来週分を出す
const isWeekend = () => [0, 6].includes(new Date().getDay());
const thisMonday = () => ymd(mondayOf(new Date()));
const ui = {
  view: load(K.view, 'plan'),
  planWeek: thisMonday(),
  shopWeek: isWeekend() ? ymd(addDays(mondayOf(new Date()), 7)) : thisMonday(),
  shopMode: load(K.shopMode, 'dish'),
  recipeQuery: '',
  recipeTag: '',
};
if (!VIEWS.includes(ui.view)) ui.view = 'plan';
const viewWeek = () => (ui.view === 'shop' ? ui.shopWeek : ui.planWeek);
const shiftWeek = (w, n) => ymd(addDays(parseYmd(w), 7 * n));
function weekName(w) {
  const diff = Math.round((parseYmd(w) - mondayOf(new Date())) / 864e5 / 7);
  return diff === 0 ? '今週' : diff === 1 ? '来週' : diff === -1 ? '先週' : diff === 2 ? '再来週' : diff > 0 ? `${diff}週間後` : `${-diff}週間前`;
}

let dirty = false;
function render(force = false) {
  // 入力中に同期で画面が書き換わると文字が消えるので、入力が終わるまで待つ
  const a = document.activeElement;
  if (!force && a && a.closest('main') && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && !/^(checkbox|radio)$/.test(a.type)) { dirty = true; return; }
  dirty = false;
  renderHeader();
  for (const v of VIEWS) $('#view-' + v).hidden = v !== ui.view;
  $$('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.view === ui.view));
  ({ plan: renderPlan, shop: renderShop, recipes: renderRecipes, settings: renderSettings })[ui.view]($('#view-' + ui.view));
}
document.addEventListener('focusout', () => setTimeout(() => { if (dirty) render(); }, 0));

function renderHeader() {
  const weekly = ui.view === 'plan' || ui.view === 'shop';
  $('#weekNav').hidden = !weekly;
  $('#pageTitle').hidden = weekly;
  $('#pageTitle').textContent = ui.view === 'recipes' ? '料理リスト' : '設定';
  if (weekly) {
    const w = viewWeek();
    const m = parseYmd(w);
    const days = ui.view === 'plan' ? 13 : 6;
    $('#weekTitle').textContent = ui.view === 'plan' ? `${weekName(w)}・${weekName(shiftWeek(w, 1))}` : `${weekName(w)}の買い物`;
    $('#weekRange').textContent = `${md(m)}（月）〜 ${md(addDays(m, days))}（日）`;
  }
  renderSyncDot();
}

function renderSyncDot() {
  const el = $('#syncDot');
  const label = { local: 'この端末だけに保存中', busy: '同期中…', ok: 'スプレッドシートと同期済み', err: '同期できとらん：' + sync.msg }[sync.state];
  el.className = 'sync-dot ' + sync.state;
  el.title = label;
  el.setAttribute('aria-label', label);
}

// ---- 献立 ----
function renderPlan(el) {
  el.innerHTML = [ui.planWeek, shiftWeek(ui.planWeek, 1)].map(renderPlanWeek).join('');
}
function renderPlanWeek(week) {
  const today = ymd(new Date());
  const dates = weekDates(week);
  const total = dates.reduce((n, d) => n + (meal(d).dishes || []).length, 0);
  return `
    <h2 class="week-head" id="w-${week}">${weekName(week)} <small>${md(parseYmd(week))}〜${md(addDays(parseYmd(week), 6))}</small></h2>
    <div class="days">
      ${dates.map((date, i) => {
        const m = meal(date);
        return `
        <div class="day${date === today ? ' today' : ''}${date < today ? ' past' : ''}${i >= 5 ? ' weekend' : ''}">
          <button class="day-head" data-act="note" data-date="${date}" aria-label="${md(parseYmd(date))}のメモ">
            <span class="dow">${DOW[i]}</span><span class="date">${md(parseYmd(date))}</span>
          </button>
          <div class="day-body">
            ${m.note ? `<button class="note" data-act="note" data-date="${date}">📝 ${esc(m.note)}</button>` : ''}
            <div class="dishes">
              ${(m.dishes || []).map((d, j) => {
                const r = recipe(d.r);
                const warn = r && !(r.ings || []).some(x => norm(x.n));
                return `<button class="dish c-${RECIPE_CATS.indexOf(dishCat(d))}" data-act="dish" data-date="${date}" data-i="${j}">
                  ${esc(dishName(d))}${warn ? '<span class="warn" title="材料未登録">!</span>' : ''}</button>`;
              }).join('')}
              <button class="add" data-act="add" data-date="${date}">＋</button>
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>
    <div class="plan-foot">
      ${total === 0 ? `<button class="btn" data-act="copyPrevWeek" data-week="${week}">前の週の献立をコピー</button>` : ''}
      <button class="btn" data-act="omakaseWeek" data-week="${week}">🎲 空いてる日をおまかせ</button>
      <button class="btn primary" data-act="goShop" data-week="${week}">🛒 ${weekName(week)}の買い物リスト</button>
    </div>`;
}

// ---- 買い物 ----
function renderShop(el) {
  const sh = shoppingList(ui.shopWeek);
  const byDish = ui.shopMode !== 'all';
  const row = it => {
    const cks = esc(it.cks.join('|'));
    return `
    <div class="item${it.checked ? ' checked' : ''}${it.have ? ' have' : ''}">
      <label>
        ${it.have ? '<span class="have-icon" aria-hidden="true">🏠</span>'
          : `<input type="checkbox" data-chk="${cks}"${it.checked ? ' checked' : ''} aria-label="買った">`}
        <span class="iname">${esc(it.name)}</span>
        ${it.amount ? `<span class="iamt">${esc(it.amount)}</span>` : ''}
        ${!byDish && it.days.length ? `<span class="idays" title="${esc(it.dishes.join('、'))}">${it.days.join('・')}</span>` : ''}
      </label>
      ${it.extKey ? `<button class="x" data-act="delExtra" data-k="${esc(it.extKey)}" aria-label="削除">×</button>`
        : it.have ? `<button class="have-btn undo" data-act="have" data-chk="${cks}" data-on="0">やっぱり買う</button>`
        : !it.checked ? `<button class="have-btn" data-act="have" data-chk="${cks}" data-on="1">家にある</button>` : ''}
    </div>`;
  };

  let body;
  if (byDish) {
    const dishCard = dish => {
      const done = dish.ings.filter(i => i.checked).length;
      return `
        <div class="dish-card${dish.ings.length && done === dish.ings.length ? ' complete' : ''}">
          <div class="dish-card-head c-${RECIPE_CATS.indexOf(dish.cat)}">
            <span>${esc(dish.name)}</span>
            ${dish.ings.length ? `<small>${done} / ${dish.ings.length}</small>` : ''}
          </div>
          ${dish.ings.length ? dish.ings.map(row).join('')
            : `<p class="dish-missing">材料まだ入っとらん <button class="link" data-act="editRecipe" data-id="${dish.id}">登録する</button></p>`}
        </div>`;
    };
    body = sh.days.map(day => `
      <h3 class="grp day-grp"><span>${dowOf(day.date)}</span> ${md(parseYmd(day.date))}${day.note ? ` <small>📝 ${esc(day.note)}</small>` : ''}</h3>
      ${day.dishes.map(dishCard).join('')}`).join('')
      + (sh.extras.length ? `<h3 class="grp">追加で買うもの</h3>${sh.extras.map(row).join('')}` : '');
  } else {
    const todo = sh.list.filter(i => !i.checked);
    const have = sh.list.filter(i => i.have);
    const done = sh.list.filter(i => i.checked && !i.have);
    body = (sh.missing.length ? `
      <div class="callout">材料が未登録の料理：
        ${sh.missing.map(m => `<button class="link" data-act="editRecipe" data-id="${m.id}">${esc(m.name)}（${m.dow}）</button>`).join('、')}
      </div>` : '')
      + SHOP_CATS.map(cat => {
        const items = todo.filter(i => i.cat === cat);
        if (!items.length) return '';
        return `<h3 class="grp">${cat === '調味料' ? '調味料 <small>家にあるか確認</small>' : cat}</h3>${items.map(row).join('')}`;
      }).join('')
      + (have.length ? `<h3 class="grp muted">家にある</h3>${have.map(row).join('')}` : '')
      + (done.length ? `<h3 class="grp muted">買った</h3>${done.map(row).join('')}` : '');
  }

  const empty = !sh.days.length && !sh.extras.length;
  el.innerHTML = `
    <div class="seg shop-mode">
      <button class="${byDish ? 'on' : ''}" data-act="shopMode" data-mode="dish">料理ごと</button>
      <button class="${byDish ? '' : 'on'}" data-act="shopMode" data-mode="all">まとめて（売り場順）</button>
    </div>
    ${sh.total ? `
      <div class="shop-head">
        <div class="progress"><div style="width:${(sh.done / sh.total) * 100}%"></div></div>
        <div class="shop-count">${sh.done} / ${sh.total}</div>
      </div>` : ''}
    <form class="add-extra" data-form="extra">
      <input id="extraInput" name="n" placeholder="ほかに買うもの（洗剤・牛乳など）" autocomplete="off" enterkeyhint="done">
      <button class="btn primary">追加</button>
    </form>
    ${empty ? '' : `
      <p class="hint shop-hint">冷蔵庫見て、残っとる物は「家にある」押しといて。
        <button class="link" data-act="staples">いつも家にある物（${staples().length}）</button></p>`}
    ${empty ? `<p class="empty">この週の献立まだ空っぽやん。<br>献立入れたら、ここに材料が並ぶで。</p>` : body}
    ${sh.total && sh.done === sh.total ? `<p class="empty">全部そろった！🎉</p>` : ''}
    ${sh.total ? `
      <div class="plan-foot">
        <button class="btn" data-act="shareList">リストを送る / コピー</button>
        ${sh.done ? `<button class="btn" data-act="uncheckAll">チェックをリセット</button>` : ''}
      </div>` : ''}`;
}

// ---- 料理リスト ----
function renderRecipes(el) {
  el.innerHTML = `
    <div class="toolbar">
      <input type="search" id="recipeQuery" placeholder="料理名・材料で検索" value="${esc(ui.recipeQuery)}" autocomplete="off">
      <button class="btn primary" data-act="newRecipe">＋ 新しい料理</button>
    </div>
    <button class="staple-row" data-act="staples">
      <span>🏠 いつも家にある物</span>
      <small>${staples().length ? esc(staples().slice(0, 6).join('、')) + (staples().length > 6 ? ' ほか' : '') : '調味料や米などを登録'} ›</small>
    </button>
    <div class="seg cat-filter">${['すべて', ...RECIPE_CATS.filter(c => c !== 'その他')].map(c =>
      `<button class="${(ui.recipeCat || 'すべて') === c ? 'on' : ''}" data-act="recipeCat" data-c="${c}">${c}</button>`).join('')}</div>
    ${tagChips(ui.recipeTag, 'recipeTag')}
    <div id="recipeList"></div>
    <div class="plan-foot"><button class="btn" data-act="restorePresets">定番料理を入れ直す</button></div>`;
  renderRecipeList();
}

// ---- 五十音 ----
const GYOU = ['あ', 'か', 'さ', 'た', 'な', 'は', 'ま', 'や', 'ら', 'わ'];
const GYOU_CHARS = ['あいうえおぁぃぅぇぉ', 'かきくけこ', 'さしすせそ', 'たちつてとっ', 'なにぬねの', 'はひふへほ', 'まみむめも', 'やゆよゃゅょ', 'らりるれろ', 'わをんゎ'];
// 並び順用の読み（自分で入れたよみがな → 定番料理の読み → 料理名そのもの）をひらがなに
function yomiOf(r) {
  const s = norm(r.yomi || PRESET_YOMI[r.name] || r.name);
  return s.replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
}
function gyouOf(r) {
  const c = yomiOf(r).normalize('NFD')[0]; // 濁点・半濁点を外す（ぎ→き、ぱ→は）
  const i = GYOU_CHARS.findIndex(g => g.includes(c));
  return i < 0 ? '他' : GYOU[i];
}

// タグの絞り込みチップ（1つ選ぶ／もう一度押すと解除）
function tagChips(selected, act) {
  return `<div class="tag-bar">${TAGS.map(t =>
    `<button type="button" class="chip${t === selected ? ' on' : ''}" data-act="${act}" data-t="${t}">${t}</button>`).join('')}</div>`;
}
// 料理名・材料・タグのどれかに当たれば OK
function matchRecipe(r, q, tag) {
  if (tag && !(r.tags || []).includes(tag)) return false;
  if (!q) return true;
  return norm(r.name).toLowerCase().includes(q)
    || (r.tags || []).some(t => t.includes(q))
    || (r.ings || []).some(i => norm(i.n).toLowerCase().includes(q));
}

function renderRecipeList() {
  const box = $('#recipeList');
  if (!box) return;
  const q = norm(ui.recipeQuery).toLowerCase();
  const last = lastUsedMap();
  const cat = ui.recipeCat && ui.recipeCat !== 'すべて' ? ui.recipeCat : '';
  const all = recipes().filter(r => (!cat || (r.cat || 'その他') === cat) && matchRecipe(r, q, ui.recipeTag))
    .sort((a, b) => yomiOf(a).localeCompare(yomiOf(b), 'ja'));
  if (!recipes().length) { box.innerHTML = `<p class="empty">まだ料理ないで。<br>よう作る料理と材料入れとったら、買い物リスト勝手にできるで。</p>`; return; }
  if (!all.length) { box.innerHTML = `<p class="empty">見つからんかった</p>`; return; }
  const groups = [...GYOU, '他'].map(g => [g, all.filter(r => gyouOf(r) === g)]).filter(([, rs]) => rs.length);
  box.innerHTML = `
    <div class="kana-index">${[...GYOU, '他'].map(g => {
      const has = groups.some(([x]) => x === g);
      return g === '他' && !has ? '' : `<button data-act="jumpKana" data-g="${g}"${has ? '' : ' disabled'}>${g}</button>`;
    }).join('')}</div>
    <p class="hint list-count">${all.length} 品</p>
    ${groups.map(([g, rs]) => `
      <h3 class="grp kana-head" id="g-${g}">${g === '他' ? 'その他' : g + '行'}</h3>
      <div class="recipe-grid">${rs.map(r => {
        const n = (r.ings || []).filter(i => norm(i.n)).length;
        return `<button class="recipe-cell c-${RECIPE_CATS.indexOf(r.cat || 'その他')}" data-act="viewRecipe" data-id="${r.id}">
          <span class="rname">${esc(r.name)}</span>
          <span class="rmeta">${cat ? '' : esc(r.cat || 'その他') + ' · '}${n ? lastUsedLabel(last[r.id]) : '<span class="warn-text">材料未登録</span>'}</span>
        </button>`;
      }).join('')}</div>`).join('')}`;
}

// ---- 設定 ----
function renderSettings(el) {
  el.innerHTML = `
    <div class="card">
      <h2>共有（Googleスプレッドシート）</h2>
      <p class="status" id="syncStatus">${syncLabel()}</p>
      <label class="field">Apps Script の URL
        <input id="cfUrl" type="url" placeholder="https://script.google.com/macros/s/…/exec" value="${esc(conf.url)}" autocomplete="off">
      </label>
      <label class="field">合言葉
        <input id="cfKey" type="text" value="${esc(conf.key)}" autocomplete="off">
      </label>
      <div class="row">
        <button class="btn primary" data-act="saveConf">保存して接続</button>
        ${conf.url ? `<button class="btn" data-act="disconnect">接続をやめる</button>` : ''}
      </div>
      <p class="hint">設定のしかたは <a href="https://github.com/Haru-1124189/kondate#readme" target="_blank" rel="noopener">README</a> 見てくれや。</p>
    </div>
    ${conf.url ? '' : `
    <div class="card">
      <h2>設定リンクを貼ってつなぐ</h2>
      <p>LINE で届いた設定リンクをコピーして、ここに貼ってくれや。<br><small>※ホーム画面のアプリは Safari と保存場所が別やから、こっちで入れ直す。</small></p>
      <div class="add-extra">
        <input id="setupLink" placeholder="https://haru-1124189.github.io/kondate/#s=…" autocomplete="off">
        <button class="btn primary" data-act="pasteSetup">つなぐ</button>
      </div>
    </div>`}
    ${conf.url ? `
    <div class="card">
      <h2>相手のスマホを設定</h2>
      <p>このリンクLINEで送って、開いてもろたら設定完了や。<br><small>※合言葉入っとるから、他の人に送ったらあかんで。</small></p>
      <button class="btn" data-act="shareSetup">設定リンクを送る</button>
    </div>` : ''}
    <div class="card">
      <h2>バックアップ</h2>
      <div class="row">
        <button class="btn" data-act="export">ファイルに書き出す</button>
        <label class="btn">ファイルから読み込む<input type="file" id="importFile" accept="application/json,.json" hidden></label>
      </div>
      <p class="hint">料理 ${recipes().length} 品 ・ 献立 ${Object.keys(data).filter(k => k.startsWith('meal:')).length} 日分</p>
    </div>
    <div class="card">
      <h2>アプリの更新</h2>
      <p class="hint">今のバージョン：${esc(APP_VERSION)}。古い画面のままな気がしたら押してくれや。</p>
      <button class="btn" data-act="reloadApp">最新にする</button>
    </div>`;
}

// ============================================================
// 下から出るシート（ダイアログ）
// ============================================================
const sheet = $('#sheet');
let sheetCtx = {};
function openSheet(html, ctx = {}) {
  sheetCtx = ctx;
  // 開いた瞬間にブラウザが最初の入力欄へカーソルを当てて、iPhone でプルダウンやキーボードが勝手に出るのを防ぐ。
  // 見えん置き場（autofocus）にカーソルを置いとく。入力欄に最初から入れたいときは、開いたあとに自分で focus() する
  sheet.innerHTML = '<span class="focus-sink" tabindex="-1" autofocus></span>' + html;
  if (!sheet.open) sheet.showModal();
  else $('.focus-sink', sheet).focus();
}
function closeSheet() { if (sheet.open) sheet.close(); sheetCtx = {}; }
sheet.addEventListener('click', e => { if (e.target === sheet) closeSheet(); }); // 背景タップで閉じる
const dayLabel = date => `${md(parseYmd(date))}（${dowOf(date)}）`;

// 料理を選んで献立に入れる
function openPicker(date) {
  openSheet(`
    <div class="sheet-body">
      <h2>${dayLabel(date)} の夕食に追加</h2>
      <button class="btn omakase-btn" data-act="omakaseDay">🎲 迷ったら おまかせで決める</button>
      <input type="search" id="pickQuery" placeholder="料理名・材料で検索 / 新しい料理名を入力" autocomplete="off" enterkeyhint="search">
      <div id="pickTags">${tagChips('', 'pickTag')}</div>
      <div id="pickList" class="pick-list"></div>
      <div class="sheet-actions"><button class="btn" data-act="close">閉じる</button></div>
    </div>`, { date });
  renderPickList();
  $('#pickQuery').addEventListener('input', renderPickList);
}
function renderPickList() {
  const q = norm($('#pickQuery')?.value);
  const ql = q.toLowerCase();
  const last = lastUsedMap();
  const today = ymd(new Date());
  const rs = recipes().filter(r => matchRecipe(r, ql, sheetCtx.tag));
  // 最近作っていない順（献立のマンネリ防止）
  rs.sort((a, b) => (last[a.id] || '') .localeCompare(last[b.id] || '') || a.name.localeCompare(b.name, 'ja'));
  const exact = rs.some(r => norm(r.name) === q);
  $('#pickList').innerHTML = `
    ${q && !exact ? `
      <button class="pick new" data-act="pickNew" data-name="${esc(q)}">＋「${esc(q)}」を料理として登録<small>材料も入れとったら買い物リストに出るで</small></button>
      <button class="pick new" data-act="pickText" data-name="${esc(q)}">✎「${esc(q)}」を名前だけで追加<small>外食・お惣菜とか、材料いらんとき</small></button>` : ''}
    ${!recipes().length && !q ? `<p class="empty">料理名入れて登録しよか</p>` : ''}
    ${rs.map(r => {
      const lu = last[r.id];
      return `<button class="pick c-${RECIPE_CATS.indexOf(r.cat || 'その他')}" data-act="pickRecipe" data-id="${r.id}">
        <span>${esc(r.name)}</span><small>${esc([r.cat || 'その他', ...(r.tags || []).slice(0, 2)].join('・'))} · ${lu && lu > today ? `${md(parseYmd(lu))} に予定` : lastUsedLabel(lu)}</small></button>`;
    }).join('')}`;
}
function addDish(date, dish) {
  const m = meal(date);
  setMeal(date, { ...m, dishes: [...(m.dishes || []), dish] });
}

// 献立の料理をタップ
function openDish(date, i) {
  const d = (meal(date).dishes || [])[i];
  if (!d) return;
  const r = recipe(d.r);
  const ings = (r?.ings || []).filter(x => norm(x.n));
  const memo = r?.memo ? esc(r.memo).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>').replace(/\n/g, '<br>') : '';
  const week = mondayOf(parseYmd(date));
  const moveOpts = Array.from({ length: 21 }, (_, k) => ymd(addDays(week, k - 7)))
    .map(x => `<option value="${x}"${x === date ? ' selected' : ''}>${dayLabel(x)}</option>`).join('');
  openSheet(`
    <div class="sheet-body">
      <h2>${esc(dishName(d))}</h2>
      <p class="sub">${dayLabel(date)}${r ? ' · ' + esc(r.cat || 'その他') : ''}</p>
      ${r ? (ings.length
        ? `<ul class="ing-view">${ings.map(x => `<li><span>${esc(x.n)}</span><span>${esc(x.a || '')}</span></li>`).join('')}</ul>`
        : `<p class="callout">材料まだ入っとらんで。入れたら買い物リストに出るで。</p>`)
        : `<p class="hint">名前だけの予定やで（買い物リストには出ん）</p>`}
      ${memo ? `<div class="memo">${memo}</div>` : ''}
      <label class="field">別の日に移動
        <select id="moveTo">${moveOpts}</select>
      </label>
      <div class="sheet-actions">
        <button class="btn danger" data-act="removeDish">献立から外す</button>
        <span class="spacer"></span>
        ${r ? `<button class="btn" data-act="editRecipe" data-id="${d.r}">材料を編集</button>`
            : `<button class="btn" data-act="promoteDish">料理として登録</button>`}
        <button class="btn primary" data-act="close">閉じる</button>
      </div>
    </div>`, { date, i });
  $('#moveTo').addEventListener('change', e => {
    const to = e.target.value;
    if (to === date) return;
    const from = meal(date);
    const dish = from.dishes[i];
    setMeal(date, { ...from, dishes: from.dishes.filter((_, k) => k !== i) });
    addDish(to, dish);
    closeSheet();
    toast(`${dayLabel(to)} に移動した`);
  });
}

// その日のメモ
function openNote(date) {
  const m = meal(date);
  openSheet(`
    <form class="sheet-body" data-form="note">
      <h2>${dayLabel(date)} のメモ</h2>
      <input id="noteInput" name="note" value="${esc(m.note || '')}" placeholder="外食・残り物・お弁当いらない など" autocomplete="off">
      <div class="chips">${['外食', '残り物', 'お惣菜', '帰り遅い', '未定'].map(t => `<button type="button" class="chip" data-act="noteChip" data-t="${t}">${t}</button>`).join('')}</div>
      <div class="sheet-actions">
        ${m.note ? `<button type="button" class="btn danger" data-act="clearNote">メモを消す</button>` : ''}
        <span class="spacer"></span>
        <button type="button" class="btn" data-act="close">キャンセル</button>
        <button class="btn primary">保存</button>
      </div>
    </form>`, { date });
}

// 料理リストから料理をタップ：材料を見て、そのまま献立に入れられる
function openRecipeView(id) {
  const r = recipe(id);
  if (!r) return;
  const ings = (r.ings || []).filter(x => norm(x.n));
  const memo = r.memo ? esc(r.memo).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>').replace(/\n/g, '<br>') : '';
  const today = ymd(new Date());
  // 今日から2週間分。週の頭（月曜）で段を分ける
  const days = Array.from({ length: 14 }, (_, k) => ymd(addDays(parseYmd(today), k)));
  const dayBtn = date => {
    const ds = meal(date).dishes || [];
    const has = ds.some(d => d.r === id);
    return `<button class="date-pick${date === today ? ' today' : ''}${has ? ' has' : ''}" data-act="addToDate" data-date="${date}">
      <b>${dowOf(date)}</b><span>${md(parseYmd(date))}</span>
      <small>${has ? '入っとる' : ds.length ? ds.length + '品' : '空き'}</small></button>`;
  };
  openSheet(`
    <div class="sheet-body">
      <h2>${esc(r.name)}</h2>
      <p class="sub">${esc([r.cat || 'その他', ...(r.tags || [])].join('・'))} · ${lastUsedLabel(lastUsedMap()[id])}</p>
      <div class="field">この日に作る <small>（押したら献立に入るで）</small>
        <div class="date-grid">${days.map(dayBtn).join('')}</div>
      </div>
      ${ings.length
        ? `<ul class="ing-view">${ings.map(x => `<li><span>${esc(x.n)}</span><span>${esc(x.a || '')}</span></li>`).join('')}</ul>`
        : `<p class="callout">材料まだ入っとらんで。入れたら買い物リストに出るで。</p>`}
      ${memo ? `<div class="memo">${memo}</div>` : ''}
      <div class="sheet-actions">
        <span class="spacer"></span>
        <button class="btn" data-act="editRecipe" data-id="${id}">編集する</button>
        <button class="btn primary" data-act="close">閉じる</button>
      </div>
    </div>`, { id });
}

// 料理の登録・編集
function openRecipeEditor(id, opts = {}) {
  const r = id ? recipe(id) : null;
  const ings = r?.ings?.length ? r.ings : [{ n: '', a: '' }, { n: '', a: '' }, { n: '', a: '' }];
  $('#ingList').innerHTML = knownIngredients().map(n => `<option value="${esc(n)}">`).join('');
  openSheet(`
    <form class="sheet-body" data-form="recipe">
      <h2>${r ? '料理を編集' : '料理を登録'}</h2>
      <label class="field">料理名
        <input name="name" required value="${esc(r?.name || opts.name || '')}" autocomplete="off">
      </label>
      <label class="field">よみがな <small>（漢字で始まる料理だけ。五十音の並び用）</small>
        <input name="yomi" value="${esc(r?.yomi || '')}" placeholder="${esc(r && PRESET_YOMI[r.name] ? PRESET_YOMI[r.name] : '例: ぎょうざ')}" autocomplete="off">
      </label>
      <div class="field">種類
        <div class="seg">${RECIPE_CATS.map(c => `<label><input type="radio" name="cat" value="${c}"${(r?.cat || opts.cat || '主菜') === c ? ' checked' : ''}><span>${c}</span></label>`).join('')}</div>
      </div>
      <div class="field">タグ <small>（おまかせで選ぶときに使う）</small>
        <div class="seg tags">${TAGS.map(t => `<label><input type="checkbox" name="tags" value="${t}"${(r?.tags || []).includes(t) ? ' checked' : ''}><span>${t}</span></label>`).join('')}</div>
      </div>
      <div class="field">材料 <small>（1回に作る分の量）</small>
        <div id="ings">${ings.map(ingRow).join('')}</div>
        <button type="button" class="btn small" data-act="addIng">＋ 材料を追加</button>
      </div>
      <label class="field">メモ・レシピのURL
        <textarea name="memo" rows="3" placeholder="作り方のコツや、レシピサイトのURLなど">${esc(r?.memo || '')}</textarea>
      </label>
      <div class="sheet-actions">
        ${r ? `<button type="button" class="btn danger" data-act="deleteRecipe">削除</button>` : ''}
        <span class="spacer"></span>
        <button type="button" class="btn" data-act="close">キャンセル</button>
        <button class="btn primary">保存</button>
      </div>
    </form>`, { id, ...opts });
  if (!r) $('input[name=name]', sheet).focus();
}
// ---- おまかせ献立 ----
//   何系（タグ）を選ぶと、その中から最近作っていない料理をランダムに選ぶ
//   和食・洋食などの「ジャンル」同士は「どれか」、揚げ物・麺などの「その他」同士も「どれか」、
//   ジャンルとその他は「両方」（例: 和食＋魚 → 和食の魚料理、和食＋洋食 → どちらか）
const omakaseTargets = week => {
  const today = ymd(new Date());
  return weekDates(week).filter(d => d >= today && !(meal(d).dishes || []).length);
};
function openOmakase(dates, title) {
  const saved = load(K.omakase, { tags: [], sides: false });
  openSheet(`
    <div class="sheet-body">
      <h2>🎲 おまかせ献立</h2>
      <p class="sub">${esc(title)}</p>
      <div class="field">何系がええ？ <small>（いくつでも。選ばんかったら何でも）</small>
        <div class="chips">${TAGS.map(t => `<button type="button" class="chip${saved.tags.includes(t) ? ' on' : ''}" data-act="omTag" data-t="${t}">${t}</button>`).join('')}</div>
      </div>
      <label class="check-row"><input type="checkbox" id="omSides"${saved.sides ? ' checked' : ''}> 副菜と汁物もつける</label>
      <button class="btn primary wide" data-act="omRoll">🎲 決めてもらう</button>
      <div id="omResult"></div>
    </div>`, { dates, tags: new Set(saved.tags), proposal: null });
}
function omPool(tags, cats, cuisineOnly = false) {
  const cu = [...tags].filter(t => TAG_CUISINE.includes(t));
  const ot = cuisineOnly ? [] : [...tags].filter(t => !TAG_CUISINE.includes(t));
  return recipes().filter(r => cats.includes(r.cat || 'その他')
    && (!cu.length || cu.some(t => (r.tags || []).includes(t)))
    && (!ot.length || ot.some(t => (r.tags || []).includes(t))));
}
function omRollDate(date, avoid) {
  const { tags } = sheetCtx;
  // 前後6日以内に作る（作った）料理はなるべく避ける
  const near = new Set();
  for (let k = -6; k <= 6; k++) {
    for (const d of meal(ymd(addDays(parseYmd(date), k))).dishes || []) if (d.r) near.add(d.r);
  }
  const pick = pool => {
    const ok = pool.filter(r => !avoid.has(r.id) && !near.has(r.id));
    const src = ok.length ? ok : pool.filter(r => !avoid.has(r.id));
    const list = src.length ? src : pool;
    return list.length ? list[Math.floor(Math.random() * list.length)] : null;
  };
  const main = pick(omPool(tags, ['主菜', '主食']));
  if (!main) return null;
  avoid.add(main.id);
  const ids = [main.id];
  if ($('#omSides')?.checked) {
    const side = cat => { const p = omPool(tags, [cat], true); return pick(p.length ? p : omPool(new Set(), [cat])); };
    const s = side('副菜');
    if (s) { ids.push(s.id); avoid.add(s.id); }
    // 鍋や麺に汁物はいらない
    if (!(main.tags || []).some(t => t === '鍋' || t === '麺')) {
      const soup = side('汁物');
      if (soup) { ids.push(soup.id); avoid.add(soup.id); }
    }
  }
  return ids;
}
function renderOmakase() {
  const { dates, proposal } = sheetCtx;
  const box = $('#omResult');
  if (!proposal) { box.innerHTML = `<p class="empty">条件に合う料理ないわ…<br>タグ減らしてみてくれや。</p>`; return; }
  box.innerHTML = `
    <div class="om-list">
      ${dates.map(date => `
        <div class="om-day">
          <div class="om-date"><b>${dowOf(date)}</b>${md(parseYmd(date))}</div>
          <div class="om-dishes">${proposal[date].map(id => {
            const r = recipe(id);
            return `<span class="dish c-${RECIPE_CATS.indexOf(r.cat || 'その他')}">${esc(r.name)}</span>`;
          }).join('')}</div>
          <button class="icon-btn small" data-act="omReroll" data-date="${date}" aria-label="この日だけ引き直す">🔄</button>
        </div>`).join('')}
    </div>
    <div class="sheet-actions">
      <button class="btn" data-act="omRoll">🎲 全部引き直す</button>
      <span class="spacer"></span>
      <button class="btn primary" data-act="omAccept">これで決定</button>
    </div>`;
}

// いつも家にある物（調味料・米など）
function openStaples() {
  const list = staples();
  const have = new Set(list.map(n => n.toLowerCase()));
  // 候補：登録済みの材料のうち、調味料・乾物っぽいもの
  const cands = knownIngredients().filter(n => !have.has(n.toLowerCase()) && ['調味料', '主食・乾物'].includes(guessCat(n)));
  $('#ingList').innerHTML = knownIngredients().map(n => `<option value="${esc(n)}">`).join('');
  openSheet(`
    <form class="sheet-body" data-form="staple">
      <h2>いつも家にある物</h2>
      <p class="hint">ここに入れた物は、買い物リストで最初から「家にある」になるで。切れとったら、その週だけ「やっぱり買う」にしたらええ。</p>
      <div class="add-extra">
        <input name="n" list="ingList" placeholder="例: 醤油、米、塩" autocomplete="off" enterkeyhint="done">
        <button class="btn primary">追加</button>
      </div>
      <div class="chips">
        ${list.length ? list.map(n => `<button type="button" class="chip on" data-act="delStaple" data-n="${esc(n)}">${esc(n)} ×</button>`).join('')
          : '<p class="hint">まだなし</p>'}
      </div>
      ${cands.length ? `
        <h3 class="grp">候補（タップで追加）</h3>
        <div class="chips">${cands.map(n => `<button type="button" class="chip" data-act="addStapleChip" data-n="${esc(n)}">＋ ${esc(n)}</button>`).join('')}</div>` : ''}
      <div class="sheet-actions"><span class="spacer"></span><button type="button" class="btn primary" data-act="close">完了</button></div>
    </form>`);
}

function ingRow(i = { n: '', a: '' }) {
  return `<div class="ing">
    <input class="ing-n" list="ingList" placeholder="材料" value="${esc(i.n)}" autocomplete="off" enterkeyhint="next">
    <input class="ing-a" placeholder="量 (例: 200g)" value="${esc(i.a)}" autocomplete="off" enterkeyhint="next">
    <button type="button" class="x" data-act="rmIng" aria-label="この材料を消す">×</button>
  </div>`;
}
function appendIngRow() {
  $('#ings').insertAdjacentHTML('beforeend', ingRow());
  const rows = $$('#ings .ing');
  $('.ing-n', rows[rows.length - 1]).focus();
}
// 量の欄で Enter → 次の行へ
sheet.addEventListener('keydown', e => {
  if (e.key !== 'Enter' || e.isComposing) return;
  const t = e.target;
  if (t.classList.contains('ing-n')) { e.preventDefault(); $('.ing-a', t.closest('.ing')).focus(); }
  else if (t.classList.contains('ing-a')) {
    e.preventDefault();
    const next = t.closest('.ing').nextElementSibling;
    next ? $('.ing-n', next).focus() : appendIngRow();
  }
});

// ============================================================
// 操作
// ============================================================
let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), 2200);
}

async function shareText(text, title) {
  if (navigator.share) {
    try { await navigator.share({ title, text }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  try { await navigator.clipboard.writeText(text); toast('コピーした'); }
  catch { prompt('これコピーしてくれや', text); }
}

const b64e = s => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64d = s => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)));

async function connect(newConf) {
  const test = await api({ action: 'get' }, newConf); // 先に疎通確認
  const localKeys = Object.keys(data);
  const serverKeys = Object.keys(test.items || {});
  conf = newConf;
  store(K.conf, conf);
  if (localKeys.length && serverKeys.length) {
    if (confirm('この端末のデータ、スプレッドシートのと合わせる？\n\nOK：両方合わせる\nキャンセル：スプレッドシートの内容にする')) {
      // 両方にあるものはスプレッドシート側を優先（相手が編集した内容を消さないように）
      pending = localKeys.filter(k => !(k in test.items)).map(k => ({ k, v: data[k] }));
    } else pending = [];
  } else if (localKeys.length) {
    pending = localKeys.map(k => ({ k, v: data[k] }));
  } else pending = [];
  if (!pending.length) acceptServer(test.items);
  persist();
  await flush();
}

const actions = {
  close: () => closeSheet(),

  // 献立
  add: b => openPicker(b.dataset.date),
  dish: b => openDish(b.dataset.date, Number(b.dataset.i)),
  note: b => openNote(b.dataset.date),
  goShop: b => { ui.shopWeek = b.dataset.week; switchView('shop'); },
  copyPrevWeek: b => {
    const week = b.dataset.week;
    const prev = weekDates(shiftWeek(week, -1));
    const pairs = weekDates(week).map((d, i) => [d, meal(prev[i])]).filter(([, m]) => (m.dishes || []).length || m.note);
    if (!pairs.length) return toast('前の週の献立ないで');
    setMany(pairs.map(([d, m]) => ['meal:' + d, { dishes: m.dishes || [], note: m.note || '' }]));
    toast('前の週の献立をコピーした');
  },
  pickRecipe: b => {
    const r = recipe(b.dataset.id);
    addDish(sheetCtx.date, { r: b.dataset.id, t: r?.name || '' });
    closeSheet();
  },
  pickText: b => { addDish(sheetCtx.date, { t: b.dataset.name }); closeSheet(); },
  pickNew: b => openRecipeEditor(null, { name: b.dataset.name, addTo: sheetCtx.date }),
  removeDish: () => {
    const { date, i } = sheetCtx;
    const m = meal(date);
    setMeal(date, { ...m, dishes: m.dishes.filter((_, k) => k !== i) });
    closeSheet();
  },
  promoteDish: () => {
    const { date, i } = sheetCtx;
    openRecipeEditor(null, { name: meal(date).dishes[i]?.t || '', replace: { date, i } });
  },
  noteChip: b => { const inp = $('#noteInput'); inp.value = b.dataset.t; inp.focus(); },
  clearNote: () => { setMeal(sheetCtx.date, { ...meal(sheetCtx.date), note: '' }); closeSheet(); },

  // 料理
  newRecipe: () => openRecipeEditor(null),
  editRecipe: b => openRecipeEditor(b.dataset.id),
  viewRecipe: b => openRecipeView(b.dataset.id),
  addToDate: b => {
    const { id } = sheetCtx;
    const r = recipe(id);
    const date = b.dataset.date;
    if ((meal(date).dishes || []).some(d => d.r === id) && !confirm(`${dayLabel(date)} にはもう「${r.name}」入っとるで。もう1個入れる？`)) return;
    addDish(date, { r: id, t: r.name });
    closeSheet();
    toast(`${dayLabel(date)} に「${r.name}」入れた`);
  },
  addIng: () => appendIngRow(),
  rmIng: b => b.closest('.ing').remove(),
  deleteRecipe: () => {
    const r = recipe(sheetCtx.id);
    if (!confirm(`「${r.name}」を消す？\n（献立に入っとる分は名前だけ残るで）`)) return;
    set('rcp:' + sheetCtx.id, null);
    closeSheet();
  },

  // 買い物
  delExtra: b => {
    const k = b.dataset.k;
    const week = k.split(':')[1];
    setMany([[k, null], [`chk:${week}:x:${k.split(':')[2]}`, null]]);
  },
  uncheckAll: () => {
    const prefix = `chk:${ui.shopWeek}:`;
    setMany(Object.keys(data).filter(k => k.startsWith(prefix)).map(k => [k, null]));
  },
  shareList: () => {
    const sh = shoppingList(ui.shopWeek);
    const m = parseYmd(ui.shopWeek);
    const lines = [`【${md(m)}〜${md(addDays(m, 6))} の買い物】`];
    const line = it => `・${it.name}${it.amount ? ' ' + it.amount : ''}`;
    if (ui.shopMode !== 'all') {
      for (const day of sh.days) for (const dish of day.dishes) {
        const todo = dish.ings.filter(i => !i.checked);
        if (todo.length) lines.push('', `■ ${md(parseYmd(day.date))}（${dowOf(day.date)}）${dish.name}`, ...todo.map(line));
      }
      const ex = sh.extras.filter(i => !i.checked);
      if (ex.length) lines.push('', '■ 追加', ...ex.map(line));
    } else {
      for (const cat of SHOP_CATS) {
        const items = sh.list.filter(i => i.cat === cat && !i.checked);
        if (items.length) lines.push('', `■ ${cat}`, ...items.map(line));
      }
    }
    shareText(lines.join('\n'), '買い物リスト');
  },
  // タグの絞り込み
  recipeCat: b => { ui.recipeCat = b.dataset.c; render(true); },
  jumpKana: b => $('#g-' + b.dataset.g)?.scrollIntoView({ behavior: 'smooth' }),
  recipeTag: b => { ui.recipeTag = ui.recipeTag === b.dataset.t ? '' : b.dataset.t; render(true); },
  pickTag: b => {
    sheetCtx.tag = sheetCtx.tag === b.dataset.t ? '' : b.dataset.t;
    $('#pickTags').innerHTML = tagChips(sheetCtx.tag, 'pickTag');
    renderPickList();
  },
  restorePresets: () => {
    const n = seedPresets(true);
    toast(n ? `定番料理を ${n} 品戻した` : '定番料理は全部そろっとるで');
  },

  // おまかせ
  omakaseDay: () => { const d = sheetCtx.date; openOmakase([d], `${dayLabel(d)} の夕食`); },
  omakaseWeek: b => {
    const dates = omakaseTargets(b.dataset.week);
    if (!dates.length) return toast('空いとる日ないで');
    openOmakase(dates, `${weekName(b.dataset.week)}の空いている ${dates.length} 日（${dates.map(dowOf).join('・')}）`);
  },
  omTag: b => {
    const t = b.dataset.t;
    sheetCtx.tags.has(t) ? sheetCtx.tags.delete(t) : sheetCtx.tags.add(t);
    b.classList.toggle('on', sheetCtx.tags.has(t));
  },
  omRoll: () => {
    store(K.omakase, { tags: [...sheetCtx.tags], sides: !!$('#omSides')?.checked });
    const avoid = new Set();
    const proposal = {};
    for (const d of sheetCtx.dates) {
      const ids = omRollDate(d, avoid);
      if (!ids) { sheetCtx.proposal = null; return renderOmakase(); }
      proposal[d] = ids;
    }
    sheetCtx.proposal = proposal;
    renderOmakase();
  },
  omReroll: b => {
    const { proposal } = sheetCtx;
    const date = b.dataset.date;
    // 他の日に出ている料理とかぶらないように
    const avoid = new Set(Object.entries(proposal).filter(([d]) => d !== date).flatMap(([, ids]) => ids));
    avoid.add(proposal[date][0]); // 同じ主菜が続けて出ないように
    proposal[date] = omRollDate(date, avoid) || proposal[date];
    renderOmakase();
  },
  omAccept: () => {
    const { proposal } = sheetCtx;
    setMany(Object.entries(proposal).map(([date, ids]) => {
      const m = meal(date);
      return ['meal:' + date, { ...m, dishes: [...(m.dishes || []), ...ids.map(id => ({ r: id, t: recipe(id).name }))] }];
    }));
    closeSheet();
    toast('献立に入れた');
  },

  have: b => {
    const on = b.dataset.on === '1';
    setMany(b.dataset.chk.split('|').map(ck => [`chk:${ui.shopWeek}:${ck}`, on ? 'h' : needValue(ck)]));
    render(true);
  },
  staples: () => openStaples(),
  addStapleChip: b => { set(stapleKey(b.dataset.n), { n: b.dataset.n }); openStaples(); },
  delStaple: b => { set(stapleKey(b.dataset.n), null); openStaples(); },
  shopMode: b => { ui.shopMode = b.dataset.mode; store(K.shopMode, ui.shopMode); render(true); },

  // 設定
  saveConf: async () => {
    const url = norm($('#cfUrl').value);
    const key = $('#cfKey').value.trim();
    // デプロイ画面に出る …/macros/s/<ID>/exec だけ受け付ける（ブラウザで開いたときの googleusercontent の URL は使えん）
    if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec\/?$/.test(url)) {
      return alert('URL が違うで。\nデプロイの画面に出る「https://script.google.com/macros/s/…/exec」で終わる URL を入れてくれや');
    }
    if (!key) return toast('合言葉入れてくれや');
    setSync('busy');
    try {
      await connect({ url, key });
      toast('つながった！');
    } catch (e) {
      setSync(conf.url ? 'err' : 'local', e.message);
      alert('つながらんかった：' + e.message);
    }
    render(true);
  },
  reloadApp: async () => {
    // サービスワーカーの更新も確認してから読み込み直す
    try { const reg = await navigator.serviceWorker?.getRegistration(); await reg?.update(); } catch { /* なくてもええ */ }
    location.reload();
  },
  pasteSetup: async () => {
    const m = $('#setupLink').value.match(/#s=([\w-]+)/);
    if (!m) return alert('設定リンクやないみたいやで。\n「…/kondate/#s=…」っていうリンクを丸ごと貼ってくれや');
    await applySetupCode(m[1]);
  },
  disconnect: () => {
    if (!confirm('スプレッドシートとの同期やめる？\n（この端末のデータは残るで）')) return;
    conf = { url: '', key: '' };
    store(K.conf, conf);
    pending = [];
    persist();
    setSync('local');
    render(true);
  },
  shareSetup: () => {
    const link = location.origin + location.pathname + '#s=' + b64e(JSON.stringify({ u: conf.url, k: conf.key }));
    shareText(`こんだての設定リンクや。開いたら同期の設定終わるで。\n${link}`, 'こんだて 設定');
  },
  export: () => {
    const blob = new Blob([JSON.stringify({ app: 'kondate', at: new Date().toISOString(), data }, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `kondate-${ymd(new Date())}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
};

const forms = {
  staple: f => {
    const n = norm(f.elements.n.value);
    if (n) set(stapleKey(n), { n });
    openStaples();
    $('input[name=n]', sheet).focus(); // 続けて入力できるように
  },
  note: f => { setMeal(sheetCtx.date, { ...meal(sheetCtx.date), note: f.elements.note.value }); closeSheet(); },
  extra: f => {
    const n = norm(f.elements.n.value);
    if (!n) return;
    set(`ext:${ui.shopWeek}:${uid()}`, { n });
    render(true);
    $('#extraInput').focus(); // 続けて入力できるように
  },
  recipe: f => {
    const name = norm(f.elements.name.value);
    if (!name) return;
    const ings = $$('#ings .ing').map(row => ({ n: norm($('.ing-n', row).value), a: norm($('.ing-a', row).value) })).filter(i => i.n);
    const ctx = sheetCtx;
    const id = ctx.id || uid();
    const tags = $$('input[name=tags]:checked', f).map(i => i.value);
    const value = { name, yomi: norm(f.elements.yomi.value), cat: f.elements.cat.value || 'その他', tags, ings, memo: f.elements.memo.value.trim() };
    if (ctx.addTo) {
      setMany([['rcp:' + id, value], ['meal:' + ctx.addTo, { ...meal(ctx.addTo), dishes: [...(meal(ctx.addTo).dishes || []), { r: id, t: name }] }]]);
    } else if (ctx.replace) {
      const m = meal(ctx.replace.date);
      const dishes = m.dishes.map((d, k) => (k === ctx.replace.i ? { r: id, t: name } : d));
      setMany([['rcp:' + id, value], ['meal:' + ctx.replace.date, { ...m, dishes }]]);
    } else {
      set('rcp:' + id, value);
    }
    closeSheet();
    toast(ctx.id ? '保存した' : `「${name}」を登録した`);
  },
};

function switchView(v) {
  ui.view = v;
  store(K.view, v);
  window.scrollTo(0, 0);
  render(true);
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (b && actions[b.dataset.act]) { e.preventDefault(); actions[b.dataset.act](b, e); }
});
document.addEventListener('submit', e => {
  const fn = forms[e.target.dataset.form];
  if (fn) { e.preventDefault(); fn(e.target); }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.chk) {
    setMany(t.dataset.chk.split('|').map(ck => [`chk:${ui.shopWeek}:${ck}`, t.checked ? 1 : needValue(ck)]));
    render(true);
  } else if (t.id === 'importFile' && t.files[0]) {
    t.files[0].text().then(txt => {
      const j = JSON.parse(txt);
      const d = j.data || j;
      const keys = Object.keys(d).filter(k => /^(rcp|meal|ext|chk|stp|cfg):/.test(k));
      if (!keys.length) throw new Error('empty');
      if (!confirm(`${keys.length} 件のデータを読み込む？（今のデータに上書き・追加される）`)) return;
      setMany(keys.map(k => [k, d[k]]));
      toast('読み込んだ');
    }).catch(() => alert('このファイル読み込めんかった'));
    t.value = '';
  }
});
document.addEventListener('input', e => {
  if (e.target.id === 'recipeQuery') { ui.recipeQuery = e.target.value; renderRecipeList(); }
});

$$('.tabs button').forEach(b => b.addEventListener('click', () => switchView(b.dataset.view)));
function moveWeek(n) {
  if (ui.view === 'shop') ui.shopWeek = n === 0 ? thisMonday() : shiftWeek(ui.shopWeek, n);
  else ui.planWeek = n === 0 ? thisMonday() : shiftWeek(ui.planWeek, n);
  render(true);
}
$('#prevWeek').addEventListener('click', () => moveWeek(-1));
$('#nextWeek').addEventListener('click', () => moveWeek(1));
$('#weekLabel').addEventListener('click', () => moveWeek(0));
$('#syncDot').addEventListener('click', () => { if (sync.state !== 'busy') flush(); switchView('settings'); });

// ============================================================
// 起動
// ============================================================

// 設定リンク（#s=...）から開かれたら、同期の設定を取り込む
async function readSetupHash() {
  const m = location.hash.match(/^#s=([\w-]+)/);
  if (!m) return;
  history.replaceState(null, '', location.pathname + location.search);
  await applySetupCode(m[1]);
}
// 設定リンクの #s= の後ろ（URL と合言葉が入っとる）を読んでつなぐ
async function applySetupCode(code) {
  let c;
  try { c = JSON.parse(b64d(code)); } catch { alert('設定リンク壊れとるっぽいわ'); return; }
  if (!c.u) return;
  if (conf.url === c.u && conf.key === c.k) return toast('もう設定済みやで');
  if (!confirm('共有の設定を読み込む？\n（2人で同じ献立・買い物リスト使えるようになるで）')) return;
  try { await connect({ url: c.u, key: c.k || '' }); toast('設定できた！'); }
  catch (e) { alert('つながらんかった：' + e.message); }
  render(true);
}

// 古い買い物チェック（2か月以上前）は片づける
function pruneOld() {
  const limit = ymd(addDays(mondayOf(new Date()), -56));
  const old = Object.keys(data).filter(k => /^(chk|ext):/.test(k) && k.split(':')[1] < limit);
  if (old.length) setMany(old.map(k => [k, null]));
}

// 定番料理といつも家にある物を入れる
//   初回：全部入れる（cfg:seeded で2回目以降は入れない。相手の端末で消した料理が復活しないように）
//   入れ直し：消してしまった定番料理だけ戻す（編集済みのものは上書きしない）
function seedPresets(restore = false) {
  const pairs = PRESETS.filter(p => !data['rcp:' + p.id])
    .map(({ id, ...r }) => ['rcp:' + id, r]);
  if (!restore) {
    pairs.push(...PRESET_STAPLES.filter(n => !isStaple(n)).map(n => [stapleKey(n), { n }]));
    pairs.push(['cfg:seeded', 1]);
  }
  if (pairs.length) setMany(pairs);
  return pairs.length;
}

setSync(conf.url ? 'busy' : 'local');
render(true);
if (ui.view === 'plan' && isWeekend()) $('#w-' + shiftWeek(ui.planWeek, 1))?.scrollIntoView();
(async () => {
  await readSetupHash();
  if (conf.url) await flush();
  // 同期の設定があるのに読み込めなかったときは入れない（スプレッドシート側に既にあるかもしれない）
  if (!data['cfg:seeded'] && (!conf.url || sync.state === 'ok')) seedPresets();
  pruneOld();
})();

// ホーム画面に追加したとき、電波がなくても開けるように
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
