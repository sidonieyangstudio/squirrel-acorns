/* =========================================================
   松鼠點數收集 · PWA app logic — vanilla JS
   ========================================================= */
(function () {
  'use strict';

  const bingoRules = window.SquirrelBingo;
  const reflectionRules = window.SquirrelReflection;

  /* ---------- storage ---------- */
  const KEY = 'squirrel-points-v3';
  const KEY_OLD = 'squirrel-points-v2';
  const ACTIVE_CHILD_KEY = 'squirrel-active-child-v1';
  // 第一次打開（手機裡還沒有任何松鼠橡實資料）才顯示歡迎畫面；要在任何存檔之前判斷
  // App 版（iOS）和網頁版共用同一份程式；有些畫面只在其中一邊出現
  const isNativeApp = !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform());
  const APP_TEASER_KEY = 'squirrel-app-teaser-dismissed-v1';
  let isFirstRun = false;
  try { isFirstRun = !localStorage.getItem(KEY) && !localStorage.getItem(KEY_OLD); } catch (e) {}
  const todayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };
  const childName = () => String(state.userName || '小朋友').trim() || '小朋友';

  const ICON_LIST = [
    'ic-cat','ic-candy','ic-flower','ic-gem','ic-gamepad','ic-gift',
    'ic-heart','ic-laugh','ic-popcorn','ic-rocket','ic-cart','ic-sparkles',
    'ic-wand','ic-volleyball','ic-star','ic-toolcase','ic-squirrel','ic-shrub',
    'ic-salad','ic-piano','ic-queen','ic-cherry','ic-caravan',
    'ic-bookopen','ic-booka','ic-apple','ic-backpack','ic-dumbbell','ic-palette','ic-tent'
  ];
  const DEFAULT_AFTER_SCHOOL_PLAN = [
    {
      id: 'decompress',
      title: '回家卸載壓力',
      time: '3:00–3:30',
      reminderTime: '',
      tasks: [
        { id: 'snack-clothes', title: '吃點心、換衣服', note: '先讓身體恢復能量', icon: 'ic-salad', points: 1 }
      ]
    },
    {
      id: 'ticket',
      title: '桌遊門票',
      time: '3:30–6:45',
      reminderTime: '18:15',
      tasks: [
        { id: 'chinese-story', title: '中文故事 15 分鐘', note: '門票條件 1/2', icon: 'ic-bookopen', points: 5, ticket: true },
        { id: 'piano', title: '練琴 10 分鐘', note: '完成後開門票', icon: 'ic-piano', points: 5, ticket: true }
      ]
    },
    {
      id: 'evening',
      title: '晚上整理',
      time: '晚餐後–8:30',
      reminderTime: '20:15',
      tasks: [
        { id: 'lunchbox', title: '準備明天便當', note: '晚餐後出現', icon: 'ic-backpack', points: 2 },
        { id: 'shower', title: '洗澡、換睡衣', note: '把身體切到睡覺模式', icon: 'ic-sparkles', points: 2 },
        { id: 'brush-bed', title: '刷牙、上床', note: '9:00 前開睡前故事', icon: 'ic-star', points: 3, storyGate: true }
      ]
    }
  ];
  const DEFAULT_AFTER_SCHOOL_SETTINGS = {
    pageTitle: '桌遊門票＋睡前故事',
    pageSubtitle: '先拿桌遊門票，再把晚上任務整理好',
    finalRewardName: '得到睡前故事',
    finalRewardCardTitle: '睡前故事',
    finalRewardCardSub: ''
  };
  const OLD_AFTER_SCHOOL_DEFAULTS = {
    pageTitle: '桌遊門票',
    // 2026-10-24 改字：舊預設文字還沒被家長改過的，自動換成新文字
    pageSubtitles: ['先拿桌遊門票，再把晚上收好', '先拿桌遊門票，再把晚上整理好'],
    taskNotes: { '先讓身體回到家': '先讓身體恢復能量' },
    phaseTitles: {
      decompress: '回家卸載',
      evening: '晚上收好'
    }
  };

  const DEFAULT_STATE = {
    userName: '小寶',
    habits: [
      { id: h(), title: '閱讀中文繪本',       icon: 'ic-bookopen', points: 3 },
      { id: h(), title: '運動－波比跳 10 下', icon: 'ic-dumbbell', points: 3 },
      { id: h(), title: '洗衣服＋烘衣服',     icon: 'ic-toolcase', points: 3 },
      { id: h(), title: '安靜 1 小時 A',      icon: 'ic-shrub',    points: 4 },
      { id: h(), title: '友善 1 小時 A',      icon: 'ic-heart',    points: 4 },
      { id: h(), title: '不生氣 1 小時 A',    icon: 'ic-laugh',    points: 4 },
      { id: h(), title: '學校表現 A',         icon: 'ic-star',     points: 5 },
      { id: h(), title: '學校表現 B',         icon: 'ic-apple',    points: 2 }
    ],
    rewards: [
      { id: h(), title: '起司餅乾',           desc: '一包小零食',                   icon: 'ic-candy',    cost: 10 },
      { id: h(), title: '動物小盲包',         desc: '隨機可愛小物',                 icon: 'ic-sparkles', cost: 20 },
      { id: h(), title: '3D 列印小玩具',      desc: '媽媽印一個小玩具給你',         icon: 'ic-rocket',   cost: 25 },
      { id: h(), title: '禮物箱',             desc: '驚喜小禮物一份',               icon: 'ic-gift',     cost: 30 },
      { id: h(), title: '玩具鑽石',           desc: '收藏閃亮亮寶石',               icon: 'ic-gem',      cost: 50 },
      { id: h(), title: '材料大禮包',         desc: '美術材料一盒',                 icon: 'ic-palette',  cost: 80 },
      { id: h(), title: '皮克品布偶',         desc: '隨機抽一隻皮克品布偶',         icon: 'ic-cat',      cost: 100 },
      { id: h(), title: '爸媽選的驚喜包',     desc: '打開才知道裡面是什麼驚喜',     icon: 'ic-cart',     cost: 120 }
    ],
    points: 0,                       // 累積總橡實
    log: {},                         // { '2025-05-01': { habitId: true, ... } }
    streak: 0,
    lastActiveDate: null,
    redeemed: [],                    // [{ id, rewardId, title, icon, cost, date }]
    bingoBonuses: {},                // { '2026-05-01': { bonus, lines, at } }
    dailyReflections: {},            // { '2026-05-01': { mood, blocker, sticker, completed } }
    timedRuns: {},                   // { '2026-05-01': { habitId: { startedAt, expiresAt } } }
    afterSchoolLog: {},              // { '2026-05-01': { taskId: { done, at } } }
    afterSchoolReminderLog: {},      // { '2026-05-01': { phaseId: true } }
    afterSchoolSettings: structuredClone(DEFAULT_AFTER_SCHOOL_SETTINGS),
    afterSchoolPlan: structuredClone(DEFAULT_AFTER_SCHOOL_PLAN),
    parentPin: '',                   // 家長密碼 4 位數字（空 = 未設定）
    parentSecretQ: '',               // 秘密題目（提示用）
    parentSecretA: ''                // 答案，比對時統一 toLowerCase + trim
  };

  function h() { return Math.random().toString(36).slice(2, 9); }

  let appState = load();
  let state = activeChildState();
  if (removeLegacyDefaultHabits(state)) save();

  function removeLegacyDefaultHabits(nextState) {
    const removed = new Set();
    nextState.habits = (nextState.habits || []).filter(habit => {
      const title = String(habit.title || '').trim();
      const compactTitle = title.replace(/\s+/g, '');
      const legacy = title === '寫一篇中文故事' || compactTitle === '練琴20分鐘';
      if (legacy) removed.add(habit.id);
      return !legacy;
    });
    if (!removed.size) return false;
    Object.values(nextState.log || {}).forEach(log => {
      removed.forEach(id => delete log[id]);
    });
    Object.values(nextState.timedRuns || {}).forEach(runs => {
      removed.forEach(id => delete runs[id]);
    });
    return true;
  }

  function makeChildProfile(seed = {}, fallbackName = '小寶') {
    const child = Object.assign(structuredClone(DEFAULT_STATE), seed || {});
    child.id = String(child.id || `child-${h()}`);
    child.userName = String(child.userName || fallbackName || '小寶').trim();
    if (!child.stickerTheme) child.stickerTheme = 'daily';
    child.reflectionBlockers = reflectionRules
      ? reflectionRules.normalizeBlockers(child.reflectionBlockers)
      : (child.reflectionBlockers || []);
    child.birthday = reflectionRules ? reflectionRules.normalizeBirthday(child.birthday) : null;
    delete child.parentPin;
    delete child.parentSecretQ;
    delete child.parentSecretA;
    return child;
  }

  function normalizeAppState(raw) {
    if (raw && Array.isArray(raw.children)) {
      const children = raw.children.length
        ? raw.children.map((child, index) => makeChildProfile(child, index === 0 ? '小寶' : `孩子${index + 1}`))
        : [makeChildProfile()];
      let storedActiveId = '';
      try {
        storedActiveId = sessionStorage.getItem(ACTIVE_CHILD_KEY) || localStorage.getItem(ACTIVE_CHILD_KEY) || '';
      } catch (e) {}
      const requestedActiveId = storedActiveId || raw.activeChildId;
      const activeChildId = children.some(child => child.id === requestedActiveId)
        ? requestedActiveId
        : children[0].id;
      return {
        version: 4,
        activeChildId,
        children,
        parentPin: String(raw.parentPin || '').trim(),
        parentSecretQ: String(raw.parentSecretQ || '').trim(),
        parentSecretA: String(raw.parentSecretA || '').trim().toLowerCase()
      };
    }
    const legacyChild = makeChildProfile(Object.assign(structuredClone(DEFAULT_STATE), raw || {}));
    return {
      version: 4,
      activeChildId: legacyChild.id,
      children: [legacyChild],
      parentPin: String((raw && raw.parentPin) || '').trim(),
      parentSecretQ: String((raw && raw.parentSecretQ) || '').trim(),
      parentSecretA: String((raw && raw.parentSecretA) || '').trim().toLowerCase()
    };
  }

  function activeChildState() {
    const child = (appState.children || []).find(item => item.id === appState.activeChildId) || appState.children[0];
    appState.activeChildId = child.id;
    return child;
  }

  function load() {
    // v3 / v4 already exists → use it
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return normalizeAppState(JSON.parse(raw));
    } catch (e) {}
    // migrate from v1: keep points/streak/userName but use new default habits/rewards
    try {
      const old = localStorage.getItem(KEY_OLD);
      if (old) {
        const o = JSON.parse(old);
        const fresh = structuredClone(DEFAULT_STATE);
        fresh.userName = o.userName || fresh.userName;
        fresh.points = o.points || 0;
        fresh.streak = o.streak || 0;
        fresh.lastActiveDate = o.lastActiveDate || null;
        return normalizeAppState(fresh);
      }
    } catch (e) {}
    return normalizeAppState(structuredClone(DEFAULT_STATE));
  }
  function save() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const latest = JSON.parse(raw);
        if (latest && Array.isArray(latest.children)) {
          const activeId = state && state.id;
          const latestChildren = latest.children.slice();
          const index = latestChildren.findIndex(child => child && child.id === activeId);
          if (index >= 0) latestChildren[index] = state;
          else if (state) latestChildren.push(state);
          for (const child of appState.children || []) {
            if (child && !latestChildren.some(item => item && item.id === child.id)) {
              latestChildren.push(child);
            }
          }
          appState.children = latestChildren;
        }
      }
    } catch (e) {}
    saveAll();
  }
  function saveAll() {
    localStorage.setItem(KEY, JSON.stringify(appState));
    rememberActiveChild();
    scheduleNativeReminderSync();
  }
  function rememberActiveChild() {
    try {
      sessionStorage.setItem(ACTIVE_CHILD_KEY, appState.activeChildId);
      localStorage.setItem(ACTIVE_CHILD_KEY, appState.activeChildId);
    } catch (e) {}
  }

  function isLogDone(value) {
    return value === true || !!(value && value.done);
  }
  function isTimedHabit(habit) {
    return !!(habit && habit.timed && habit.timerMinutes);
  }
  function habitBasePoints(habit) {
    return Math.max(1, parseInt(habit.points, 10) || 1);
  }
  function habitFullPoints(habit) {
    return habitBasePoints(habit) * (isTimedHabit(habit) ? 2 : 1);
  }
  function logEarnedPoints(habit, value) {
    if (!isLogDone(value)) return 0;
    if (value && typeof value === 'object' && Number.isFinite(value.points)) return value.points;
    return habitBasePoints(habit);
  }
  function todayTimedRuns() {
    const today = todayKey();
    state.timedRuns = state.timedRuns || {};
    state.timedRuns[today] = state.timedRuns[today] || {};
    return state.timedRuns[today];
  }
  function timedRunFor(habit) {
    return todayTimedRuns()[habit.id] || null;
  }
  function isTimedExpired(habit, log, now = Date.now()) {
    if (!isTimedHabit(habit) || isLogDone(log[habit.id])) return false;
    const run = timedRunFor(habit);
    return !!(run && run.expiresAt && now >= run.expiresAt);
  }
  function visibleHabitsToday() {
    const today = todayKey();
    const log = state.log[today] || {};
    const now = Date.now();
    return state.habits.filter(habit => !isTimedExpired(habit, log, now));
  }
  function formatDuration(minutes) {
    const mins = Math.max(1, parseInt(minutes, 10) || 1);
    if (mins % 60 === 0) return `${mins / 60} 小時`;
    if (mins > 60) return `${Math.floor(mins / 60)} 小時 ${mins % 60} 分鐘`;
    return `${mins} 分鐘`;
  }
  function formatCountdown(ms) {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    return `${m}:${String(s).padStart(2,'0')}`;
  }

  const dayRolloverTracker = window.SquirrelDailyReset
    ? window.SquirrelDailyReset.createDayRolloverTracker(todayKey, () => {
        refreshCurrentScreen();
      })
    : { check() { return false; } };

  function checkDayRollover() {
    dayRolloverTracker.check();
  }

  /* ---------- icon util ---------- */
  function iconSvg(id, size = 24, stroke = '#5E5453') {
    const tpl = document.getElementById('tpl-icons');
    const src = tpl.content.getElementById(id) || tpl.content.getElementById('ic-star');
    const node = src.cloneNode(true);
    node.removeAttribute('id');
    node.setAttribute('width', size);
    node.setAttribute('height', size);
    node.setAttribute('stroke', stroke);
    return node.outerHTML;
  }
  // 標準橡實 SVG（phosphor 棕色實心 #5E5453）
  function acornSvg(size = 18) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 256 256" fill="#5E5453" stroke="#5E5453" stroke-width="10" stroke-linejoin="round"><path d="M232,104a56.06,56.06,0,0,0-56-56H136a24,24,0,0,1,24-24,8,8,0,0,0,0-16,40,40,0,0,0-40,40H80a56.06,56.06,0,0,0-56,56,16,16,0,0,0,8,13.83V128c0,35.53,33.12,62.12,59.74,83.49C103.66,221.07,120,234.18,120,240a8,8,0,0,0,16,0c0-5.82,16.34-18.93,28.26-28.51C190.88,190.12,224,163.53,224,128V117.83A16,16,0,0,0,232,104ZM80,64h96a40.06,40.06,0,0,1,40,40H40A40,40,0,0,1,80,64Zm74.25,135c-10.62,8.52-20,16-26.25,23.37-6.25-7.32-15.63-14.85-26.25-23.37C77.8,179.79,48,155.86,48,128v-8H208v8C208,155.86,178.2,179.79,154.25,199Z"/></svg>`;
  }

  /* ---------- screen routing ---------- */
  const screens = ['screen-today', 'screen-rewards', 'screen-unlock', 'screen-mine', 'screen-bingo', 'screen-after-school'];
  function showScreen(id) {
    if (id !== 'screen-bingo') stopBingoSpin();
    if (id !== 'screen-after-school' && afterSchoolClockTimer) {
      clearInterval(afterSchoolClockTimer);
      afterSchoolClockTimer = null;
    }
    screens.forEach(s => document.getElementById(s).hidden = (s !== id));
    document.body.classList.toggle('on-unlock', id === 'screen-unlock');
    updateDockButtons(id);
    window.scrollTo(0, 0);
    if (id === 'screen-rewards') hopRewardsSquirrel();
    if (id === 'screen-unlock') hopSquirrel(document.querySelector('.unlock-squirrel-circle img'));
  }
  // 進獎勵小店時松鼠跳一下歡迎，跳完回到原本的呼吸動畫
  function hopRewardsSquirrel() {
    hopSquirrel(document.querySelector('#screen-rewards .points-card-squirrel.cheer'));
  }
  // 首頁松鼠：勾完任務歡呼一下，全部做完跳三下
  function homeSquirrelImg() { return document.querySelector('.squirrel-wrap img'); }
  function playSquirrelMove(img, cls, ms) {
    if (!img) return;
    img.classList.remove('sq-cheer', 'sq-cheer-big', 'sq-idle-wiggle', 'sq-idle-peek');
    void img.offsetWidth;
    img.classList.add(cls);
    clearTimeout(img._sqTimer);
    img._sqTimer = setTimeout(() => img.classList.remove(cls), ms);
  }
  // 首頁松鼠表情跟著今天進度換：還沒開始揮手、未過半微笑、過半抱滿橡實、全部完成大笑
  const SQUIRREL_MOOD_SRC = {
    wave: 'assets/squirrel-wave.webp',
    normal: 'assets/squirrel-normal.webp',
    proud: 'assets/squirrel-proud.webp',
    happy: 'assets/squirrel-happy.webp'
  };
  Object.values(SQUIRREL_MOOD_SRC).forEach(src => { const pre = new Image(); pre.src = src; });
  function updateHomeSquirrelMood(done, total) {
    const img = homeSquirrelImg();
    if (!img) return;
    const src = SQUIRREL_MOOD_SRC[window.SquirrelMood.squirrelMood(done, total)];
    if (img.getAttribute('src') !== src) img.setAttribute('src', src);
  }
  function cheerHomeSquirrel(allDone) {
    playSquirrelMove(homeSquirrelImg(), allDone ? 'sq-cheer-big' : 'sq-cheer', allDone ? 2700 : 1000);
  }
  // 首頁松鼠偶爾自己動一下，讓畫面感覺是活的
  (function startIdleSquirrel() {
    const moves = [['sq-idle-wiggle', 1200], ['sq-idle-peek', 1400]];
    setInterval(() => {
      const img = homeSquirrelImg();
      if (!img || document.hidden || document.getElementById('screen-today').hidden) return;
      if (img.classList.contains('sq-cheer') || img.classList.contains('sq-cheer-big')) return;
      if (Math.random() < 0.45) return;
      const [cls, ms] = moves[Math.floor(Math.random() * moves.length)];
      playSquirrelMove(img, cls, ms);
    }, 5000);
  })();
  function hopSquirrel(img) {
    if (!img) return;
    img.classList.remove('hop');
    void img.offsetWidth;
    img.classList.add('hop');
  }
  // 圖示備好給 dock 按鈕用
  const ICON_HOME = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/></svg>';
  const ICON_PERSON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>';
  const ICON_GIFT = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7v14"/><path d="M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"/><path d="M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5"/><rect x="3" y="7" width="18" height="4" rx="1"/></svg>';

  function goToScreen(target) {
    if (target === 'today')        { showScreen('screen-today');   renderToday(); }
    else if (target === 'after-school') { showScreen('screen-after-school'); renderAfterSchool(); }
    else if (target === 'mine')    { showScreen('screen-mine');    renderMine(); }
    else if (target === 'rewards') { showScreen('screen-rewards'); renderRewards(); }
    else if (target === 'bingo')    { showScreen('screen-bingo');   renderBingo(); }
  }
  function updateDockButtons(currentId) {
    const map = {
      'screen-today':   'btn-go-today',
      'screen-after-school': 'btn-go-after-school',
      'screen-mine':    'btn-go-mine',
      'screen-rewards': 'btn-go-rewards-2',
      'screen-bingo':   'btn-go-today'
    };
    ['btn-go-today','btn-go-after-school','btn-go-mine','btn-go-rewards-2'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.toggle('btn-primary', map[currentId] === id);
    });
  }
  function updateDock() {
    const cur = todayPoints();
    const max = maxPointsToday() || 1;
    const labelEl = document.getElementById('dock-label-text');
    const curEl = document.getElementById('dock-current');
    const tgtEl = document.getElementById('dock-target');
    const barEl = document.getElementById('dock-bar');
    if (labelEl) labelEl.textContent = '我的橡實';
    if (curEl) curEl.textContent = cur;
    if (tgtEl) tgtEl.textContent = maxPointsToday();
    if (barEl) barEl.style.width = Math.min(100, Math.round(cur/max*100)) + '%';
  }

  /* ---------- audio: jsfxr-style 8-bit 合成 (Web Audio API) ---------- */
  let audioCtx = null;
  function ensureAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }
  // jsfxr 簡化版合成器：照 sfxr 公式跑出 PCM buffer 再播
  function jsfxrPlay(p, pitchShift = 1, volume = 1) {
    try {
      const ctx = ensureAudio();
      const sampleRate = 44100;
      // 重建波形：square wave（wave_type=1）
      const sustain = Math.max(0.01, p.p_env_sustain * p.p_env_sustain * 100000 / sampleRate);
      const decay   = Math.max(0.01, p.p_env_decay   * p.p_env_decay   * 100000 / sampleRate);
      const punch   = p.p_env_punch;
      const baseFreqRaw = (p.p_base_freq * p.p_base_freq + 0.001) * pitchShift;
      const arpMod   = p.p_arp_mod >= 0.5 ? 1 - Math.pow(p.p_arp_mod, 2) * 0.9 : 1 + Math.pow(p.p_arp_mod, 2) * 10;
      const arpTime  = Math.floor(Math.pow(1 - p.p_arp_speed, 2) * 20000 + 32);
      const totalSec = sustain + decay + 0.05;
      const totalSamples = Math.floor(totalSec * sampleRate);
      const buf = ctx.createBuffer(1, totalSamples, sampleRate);
      const data = buf.getChannelData(0);
      let phase = 0, period = 100 / (baseFreqRaw * 100 + 0.001);
      let arpLimit = arpTime, t = 0;
      let envStage = 0, envTime = 0;
      const sustainSamples = sustain * sampleRate;
      const decaySamples   = decay   * sampleRate;
      let curBase = baseFreqRaw;
      for (let i = 0; i < totalSamples; i++) {
        // arpeggio
        if (arpLimit !== 0 && i >= arpLimit) {
          arpLimit = 0;
          curBase *= arpMod;
        }
        period = Math.max(8, 100 / (curBase * 100 + 0.001));
        // envelope
        let envVol = 0;
        envTime++;
        if (envStage === 0) { // sustain
          envVol = 1 + (1 - envTime / sustainSamples) * 2 * punch;
          if (envTime >= sustainSamples) { envStage = 1; envTime = 0; }
        } else { // decay
          envVol = 1 - envTime / decaySamples;
          if (envTime >= decaySamples) break;
        }
        envVol = Math.max(0, envVol);
        // square wave
        phase++;
        if (phase >= period) phase -= period;
        const sample = (phase / period < 0.5 ? 0.5 : -0.5) * envVol;
        data[i] = sample * (p.sound_vol || 0.25) * volume;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start();
    } catch (e) { /* silent */ }
  }
  // pickupCoin1.json 配方（完成習慣的「叮」）
  const SFX_HABIT = {"p_env_sustain":0.0730461100378819,"p_env_punch":0.43808534614042427,"p_env_decay":0.22406780429407336,"p_base_freq":0.8320212280064907,"p_arp_mod":0.5511110655222,"p_arp_speed":0.6631900709177619,"sound_vol":0.25};
  // pickupCoin.json 配方（兌換獎勵的「噹」）
  const SFX_REWARD = {"p_env_sustain":0.033939358911840765,"p_env_punch":0.41165853182520484,"p_env_decay":0.47085308607529497,"p_base_freq":0.5598997833876371,"p_arp_mod":0.5895488052539248,"p_arp_speed":0.637118328448699,"sound_vol":0.25};
  // 撒花用：powerUp 上揚琶音（jsfxr powerUp 風格）
  const SFX_CONFETTI = {"p_env_sustain":0.18,"p_env_punch":0.20,"p_env_decay":0.42,"p_base_freq":0.42,"p_arp_mod":0.65,"p_arp_speed":0.55,"sound_vol":0.22};

  function ding(times = 3) {
    // 完成習慣：跑 N 次，每次升半音（pitch * 1.06 ^ n）
    for (let i = 0; i < times; i++) {
      setTimeout(() => jsfxrPlay(SFX_HABIT, Math.pow(1.06, i % 8), 1), i * 90);
    }
  }
  function rewardSfx() {
    jsfxrPlay(SFX_REWARD, 1, 1.2);
  }
  function bingoTickSfx() {
    jsfxrPlay(SFX_HABIT, 0.7 + Math.random() * 0.7, 0.35);
  }
  function bingoLineSfx(index = 0) {
    jsfxrPlay(SFX_REWARD, 1 + index * 0.08, 0.9);
    setTimeout(() => jsfxrPlay(SFX_HABIT, 1.2 + index * 0.08, 0.6), 110);
  }
  function bingoTotalSfx() {
    jackpotFanfare();
    setTimeout(coinShower, 180);
  }
  function reflectionPickSfx() {
    jsfxrPlay(SFX_HABIT, 0.92, 0.28);
  }
  function softTapSfx() {
    jsfxrPlay(SFX_HABIT, 0.82, 0.18);
  }
  function reflectionStickerSfx() {
    jsfxrPlay(SFX_REWARD, 1.18, 0.55);
    setTimeout(() => jsfxrPlay(SFX_HABIT, 1.45, 0.35), 90);
  }
  /* ---------- 慶祝音效套組：上揚琶音 + 金幣聲 + 鈴鐺 + 拉長歡呼 ---------- */
  function jackpotFanfare() {
    try {
      const ctx = ensureAudio();
      const now = ctx.currentTime;
      // 三輪上行琶音 C-E-G-C，一輪比一輪高
      const notes = [
        523.25, 659.25, 783.99, 1046.50,            // 第一輪 C5
        659.25, 783.99, 1046.50, 1318.51,           // 第二輪
        783.99, 1046.50, 1318.51, 1567.98,          // 第三輪
        1567.98, 2093.00, 2637.02                   // 高音收尾 G6 C7 E7
      ];
      notes.forEach((freq, i) => {
        const t0 = now + i * 0.075;
        const osc = ctx.createOscillator();
        osc.type = 'triangle'; osc.frequency.value = freq;
        const osc2 = ctx.createOscillator();
        osc2.type = 'square'; osc2.frequency.value = freq / 2;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(0.20, t0 + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
        const gain2 = ctx.createGain();
        gain2.gain.setValueAtTime(0, t0);
        gain2.gain.linearRampToValueAtTime(0.07, t0 + 0.005);
        gain2.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
        osc.connect(gain).connect(ctx.destination);
        osc2.connect(gain2).connect(ctx.destination);
        osc.start(t0); osc.stop(t0 + 0.2);
        osc2.start(t0); osc2.stop(t0 + 0.2);
      });
      // 高音長尾收尾：1.5s
      const finalT = now + notes.length * 0.075 + 0.05;
      [2093, 2637, 3136].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine'; osc.frequency.value = freq;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, finalT);
        gain.gain.linearRampToValueAtTime(0.13 - i*0.03, finalT + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, finalT + 1.5);
        osc.connect(gain).connect(ctx.destination);
        osc.start(finalT); osc.stop(finalT + 1.6);
      });
    } catch (e) {}
  }
  function coinShower() {
    // 金幣嘩啦：連續 1.4 秒 18 個短促高音（pickupCoin 配方升 pitch 隨機）
    for (let i = 0; i < 18; i++) {
      setTimeout(() => {
        jsfxrPlay(SFX_HABIT, 1.0 + Math.random() * 1.5, 0.7);
      }, i * 75 + Math.random() * 30);
    }
  }
  function bellRing() {
    // 鈴鐺 ding-dong-ding 三聲（C6 G6 C7 三度音程）
    try {
      const ctx = ensureAudio();
      const base = ctx.currentTime + 0.4;
      [1046.50, 1567.98, 2093.00, 1567.98].forEach((freq, i) => {
        const t0 = base + i * 0.18;
        const osc = ctx.createOscillator();
        osc.type = 'sine'; osc.frequency.value = freq;
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine'; osc2.frequency.value = freq * 2.01; // 微微失諧泛音 = 鈴鐺感
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(0.16, t0 + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.85);
        const gain2 = ctx.createGain();
        gain2.gain.setValueAtTime(0, t0);
        gain2.gain.linearRampToValueAtTime(0.08, t0 + 0.005);
        gain2.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.7);
        osc.connect(gain).connect(ctx.destination);
        osc2.connect(gain2).connect(ctx.destination);
        osc.start(t0); osc.stop(t0 + 0.9);
        osc2.start(t0); osc2.stop(t0 + 0.75);
      });
    } catch (e) {}
  }
  function cheerCrowd() {
    // 歡呼拉長到 3.5 秒，三波交疊：先漸進、中段最大、尾段拉長
    try {
      const ctx = ensureAudio();
      const dur = 3.5;
      const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
      const data = buf.getChannelData(0);
      // 加調變的白噪音：每秒會有自然起伏（人群擺動）
      for (let i = 0; i < data.length; i++) {
        const t = i / ctx.sampleRate;
        const wobble = 0.6 + 0.4 * Math.sin(t * 6) + 0.3 * Math.sin(t * 13);
        data[i] = (Math.random() * 2 - 1) * wobble;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1100;
      bp.Q.value = 0.6;
      const gain = ctx.createGain();
      const now = ctx.currentTime + 0.5;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.4);   // 漸進
      gain.gain.linearRampToValueAtTime(0.26, now + 1.4);   // 中段高潮
      gain.gain.linearRampToValueAtTime(0.22, now + 2.2);
      gain.gain.linearRampToValueAtTime(0.16, now + 2.8);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      src.connect(bp).connect(gain).connect(ctx.destination);
      src.start(now);
      src.stop(now + dur);
    } catch (e) {}
  }
  function confettiSfx() {
    // 慶祝音效：上揚琶音 + 金幣聲 + 鈴鐺（不疊人群歡呼，避免怪聲）
    jackpotFanfare();
    setTimeout(coinShower, 200);
    setTimeout(bellRing, 800);
  }
  function afterSchoolClearSfx() {
    // 放學破關專屬：短一點、亮一點，像故事門打開
    try {
      const ctx = ensureAudio();
      const now = ctx.currentTime;
      [659.25, 783.99, 987.77, 1318.51, 1567.98].forEach((freq, i) => {
        const t0 = now + i * 0.09;
        const osc = ctx.createOscillator();
        osc.type = i < 3 ? 'triangle' : 'sine';
        osc.frequency.value = freq;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(0.15, t0 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.5);
      });
      setTimeout(() => {
        jsfxrPlay(SFX_CONFETTI, 1.35, 0.8);
        setTimeout(() => jsfxrPlay(SFX_REWARD, 1.55, 0.7), 140);
      }, 420);
    } catch (e) {}
  }
  function afterSchoolAlarmSfx() {
    try {
      const ctx = ensureAudio();
      const now = ctx.currentTime;
      [880, 1174.66, 880, 1174.66, 1318.51, 1174.66].forEach((freq, i) => {
        const t0 = now + i * 0.18;
        const osc = ctx.createOscillator();
        osc.type = i % 2 ? 'triangle' : 'square';
        osc.frequency.value = freq;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(0.13, t0 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.18);
      });
    } catch (e) {}
  }

  /* ---------- 飛橡實動畫 + 數字跳動 ---------- */
  function flyOneAcorn(fromRect, toRect, jitter = 0) {
    const node = document.createElement('div');
    node.className = 'flying-acorn';
    node.innerHTML = '<svg viewBox="0 0 256 256" fill="#5E5453" stroke="#5E5453" stroke-width="10" stroke-linejoin="round"><path d="M232,104a56.06,56.06,0,0,0-56-56H136a24,24,0,0,1,24-24,8,8,0,0,0,0-16,40,40,0,0,0-40,40H80a56.06,56.06,0,0,0-56,56,16,16,0,0,0,8,13.83V128c0,35.53,33.12,62.12,59.74,83.49C103.66,221.07,120,234.18,120,240a8,8,0,0,0,16,0c0-5.82,16.34-18.93,28.26-28.51C190.88,190.12,224,163.53,224,128V117.83A16,16,0,0,0,232,104ZM80,64h96a40.06,40.06,0,0,1,40,40H40A40,40,0,0,1,80,64Zm74.25,135c-10.62,8.52-20,16-26.25,23.37-6.25-7.32-15.63-14.85-26.25-23.37C77.8,179.79,48,155.86,48,128v-8H208v8C208,155.86,178.2,179.79,154.25,199Z"/></svg>';
    const startX = fromRect.left + fromRect.width/2 - 21 + jitter;
    const startY = fromRect.top  + fromRect.height/2 - 21;
    node.style.left = startX + 'px';
    node.style.top  = startY + 'px';
    node.style.setProperty('--dx', (toRect.left + toRect.width/2 - startX - 21) + 'px');
    node.style.setProperty('--dy', (toRect.top  + toRect.height/2 - startY - 21) + 'px');
    node.style.animation = 'acorn-fly .8s cubic-bezier(0.4, 0.0, 0.6, 1) forwards';
    document.body.appendChild(node);
    setTimeout(() => node.remove(), 850);
  }
  function flyAcorn(fromEl, toEl, count = 3, onArrive) {
    if (!fromEl || !toEl) { if (onArrive) onArrive(); return; }
    const a = fromEl.getBoundingClientRect();
    const b = toEl.getBoundingClientRect();
    // 飛 N 顆：間隔 90ms，左右微錯位（圍繞中線散開）
    for (let i = 0; i < count; i++) {
      const jitter = ((i % 7) - 3) * 6 + (Math.random() - 0.5) * 8;
      setTimeout(() => flyOneAcorn(a, b, jitter), i * 90);
    }
    setTimeout(() => { if (onArrive) onArrive(); }, 850 + count * 90);
  }
  function tweenNumber(el, from, to, dur = 600) {
    if (!el) return;
    const start = performance.now();
    function step(t) {
      const p = Math.min(1, (t - start) / dur);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (to - from) * ease);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = to;
    }
    requestAnimationFrame(step);
  }

  /* ---------- toast ---------- */
  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2200);
  }

  /* ---------- points helpers ---------- */
  const afterSchool = window.SquirrelAfterSchool;
  const afterSchoolAlarm = window.SquirrelAfterSchoolAlarm;
  // App 版不受瀏覽器「要先點一下才能出聲」的限制，鬧鐘聲預設開啟，家長關掉後會記住；
  // 網頁版維持每次要按按鈕開啟
  const ALARM_SOUND_KEY = 'squirrel-alarm-sound-v1';
  let afterSchoolAlarmReady = false;
  if (isNativeApp) {
    afterSchoolAlarmReady = true;
    try { afterSchoolAlarmReady = localStorage.getItem(ALARM_SOUND_KEY) !== 'off'; } catch (e) {}
  }
  function rememberAlarmSound(on) {
    if (!isNativeApp) return;
    try { localStorage.setItem(ALARM_SOUND_KEY, on ? 'on' : 'off'); } catch (e) {}
  }
  let lastAlarmRingAt = 0;
  let activeAfterSchoolAlarmPhaseId = null;

  function normalizeClock(value, fallback = '') {
    const text = String(value || '').trim();
    return /^\d{2}:\d{2}$/.test(text) ? text : fallback;
  }

  // 2026-10-22 「遊戲機門票」改名「桌遊門票」：舊資料裡存的字一起換掉
  function renameToBoardGame(text) {
    return typeof text === 'string' ? text.replace(/遊戲機/g, '桌遊') : text;
  }
  function afterSchoolSettings() {
    state.afterSchoolSettings = {
      ...DEFAULT_AFTER_SCHOOL_SETTINGS,
      ...(state.afterSchoolSettings || {})
    };
    ['pageTitle', 'pageSubtitle', 'ticketTitle'].forEach(key => {
      state.afterSchoolSettings[key] = renameToBoardGame(state.afterSchoolSettings[key]);
    });
    if (state.afterSchoolSettings.pageTitle === OLD_AFTER_SCHOOL_DEFAULTS.pageTitle) {
      state.afterSchoolSettings.pageTitle = DEFAULT_AFTER_SCHOOL_SETTINGS.pageTitle;
    }
    if (OLD_AFTER_SCHOOL_DEFAULTS.pageSubtitles.includes(state.afterSchoolSettings.pageSubtitle)) {
      state.afterSchoolSettings.pageSubtitle = DEFAULT_AFTER_SCHOOL_SETTINGS.pageSubtitle;
    }
    state.afterSchoolSettings.pageTitle = String(state.afterSchoolSettings.pageTitle || DEFAULT_AFTER_SCHOOL_SETTINGS.pageTitle).trim();
    state.afterSchoolSettings.pageSubtitle = String(
      state.afterSchoolSettings.pageSubtitle || `先拿${state.afterSchoolSettings.ticketTitle || '桌遊門票'}，再把晚上收好`
    ).trim();
    state.afterSchoolSettings.finalRewardName = String(
      state.afterSchoolSettings.finalRewardName || DEFAULT_AFTER_SCHOOL_SETTINGS.finalRewardName
    ).trim();
    state.afterSchoolSettings.finalRewardCardTitle = String(
      state.afterSchoolSettings.finalRewardCardTitle || DEFAULT_AFTER_SCHOOL_SETTINGS.finalRewardCardTitle
    ).trim();
    state.afterSchoolSettings.finalRewardCardSub = String(
      state.afterSchoolSettings.finalRewardCardSub || ''
    ).trim();
    return state.afterSchoolSettings;
  }

  function upgradeTaskNote(note) {
    return OLD_AFTER_SCHOOL_DEFAULTS.taskNotes[note] || note;
  }

  function stripPhasePrefix(title) {
    return String(title || '').replace(/^第[一二三四五六七八九十]+段\s*[·．.]\s*/, '').trim();
  }

  function phaseLabel(index) {
    return ['第一段', '第二段', '第三段'][index] || `第${index + 1}段`;
  }

  function displayPhaseTitle(phase, index) {
    return `${phaseLabel(index)} • ${stripPhasePrefix(phase.title) || DEFAULT_AFTER_SCHOOL_PLAN[index]?.title || '放學任務'}`;
  }

  function normalizeAfterSchoolPlan(plan = state.afterSchoolPlan) {
    const legacyTicketTitle = renameToBoardGame(state.afterSchoolSettings && state.afterSchoolSettings.ticketTitle);
    const legacyReminderTime = state.afterSchoolSettings && state.afterSchoolSettings.reminderTime;
    const source = Array.isArray(plan) ? plan : [];
    const normalized = DEFAULT_AFTER_SCHOOL_PLAN.map((defPhase, phaseIndex) => {
      const raw = source.find(phase => phase && phase.id === defPhase.id) || source[phaseIndex] || defPhase;
      const rawTasks = Array.isArray(raw.tasks) ? raw.tasks : defPhase.tasks;
      let tasks = rawTasks.map(task => ({
        id: task.id || h(),
        title: renameToBoardGame(String(task.title || '未命名任務').trim()),
        note: upgradeTaskNote(renameToBoardGame(String(task.note || '').trim())),
        icon: ICON_LIST.includes(task.icon) ? task.icon : defPhase.tasks[0]?.icon || 'ic-star',
        points: Math.max(1, parseInt(task.points, 10) || 1)
      }));
      tasks = tasks.map((task, taskIndex) => ({
        ...task,
        ticket: defPhase.id === 'ticket',
        storyGate: defPhase.id === 'evening' && taskIndex === tasks.length - 1
      }));
      let reminderTime = normalizeClock(raw.reminderTime, defPhase.reminderTime || '');
      if (defPhase.id === 'ticket' && !raw.reminderTime && legacyReminderTime) {
        reminderTime = normalizeClock(legacyReminderTime, defPhase.reminderTime || '');
      }
      const rawTitle = renameToBoardGame(stripPhasePrefix(raw.title));
      const upgradedTitle = rawTitle === OLD_AFTER_SCHOOL_DEFAULTS.phaseTitles[defPhase.id]
        ? defPhase.title
        : rawTitle;
      return {
        id: defPhase.id,
        title: upgradedTitle || (defPhase.id === 'ticket' && legacyTicketTitle ? legacyTicketTitle : defPhase.title),
        time: String(raw.time || defPhase.time || '').trim(),
        reminderTime,
        tasks
      };
    });
    state.afterSchoolPlan = normalized;
    return normalized;
  }

  function afterSchoolPlan() {
    if (!afterSchool) return [];
    return normalizeAfterSchoolPlan();
  }

  function afterSchoolTicketTitle(plan = afterSchoolPlan()) {
    const ticketPhase = plan.find(phase => phase.id === 'ticket');
    return stripPhasePrefix(ticketPhase && ticketPhase.title) || '桌遊門票';
  }

  function cleanAfterSchoolTaskTitle(title) {
    return String(title || '')
      .replace(/\s*\d+\s*(分鐘|分|min|mins?)/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function afterSchoolPhaseTaskSummary(phaseId, plan = afterSchoolPlan()) {
    const phase = plan.find(item => item.id === phaseId);
    const names = (phase && Array.isArray(phase.tasks) ? phase.tasks : [])
      .map(task => cleanAfterSchoolTaskTitle(task.title))
      .filter(Boolean);
    if (!names.length) return stripPhasePrefix(phase && phase.title) || '任務';
    if (names.length <= 3) return names.join('、');
    return `${names.slice(0, 3).join('、')}等 ${names.length} 項`;
  }

  function clockMinutes(value) {
    const time = normalizeClock(value, '');
    if (!time) return null;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  function formatClockShort(value) {
    const time = normalizeClock(value, '');
    if (!time) return '';
    const [h, m] = time.split(':').map(Number);
    const hour = h > 12 ? h - 12 : h;
    return `${hour}:${String(m).padStart(2, '0')}`;
  }

  function isAfterSchoolReminderDue(reminderTime, now = new Date()) {
    const target = clockMinutes(reminderTime);
    if (target === null) return false;
    return now.getHours() * 60 + now.getMinutes() >= target;
  }

  function isAfterSchoolPhaseDone(phase, log) {
    return !!(phase && phase.tasks && phase.tasks.length) && phase.tasks.every(task => afterSchool.isAfterSchoolDone(log, task.id));
  }

  function afterSchoolReminderDaily() {
    const today = todayKey();
    state.afterSchoolReminderLog = state.afterSchoolReminderLog || {};
    state.afterSchoolReminderLog[today] = (state.afterSchoolReminderLog[today] && typeof state.afterSchoolReminderLog[today] === 'object')
      ? state.afterSchoolReminderLog[today]
      : {};
    return state.afterSchoolReminderLog[today];
  }

  function updateAfterSchoolAlarmButton() {
    const btn = document.getElementById('btn-after-school-alarm');
    if (!btn) return;
    btn.textContent = afterSchoolAlarmReady ? '鬧鐘聲已開啟' : '鬧鐘聲已關閉';
    btn.classList.toggle('ready', afterSchoolAlarmReady);
  }

  function showAfterSchoolAlarm(phase) {
    const overlay = document.getElementById('after-school-alarm-overlay');
    if (!overlay || !phase) return;
    const alreadyOpen = !overlay.hidden && activeAfterSchoolAlarmPhaseId === phase.id;
    activeAfterSchoolAlarmPhaseId = phase.id;
    document.getElementById('after-school-alarm-title').textContent = `${stripPhasePrefix(phase.title)}提醒時間到了`;
    document.getElementById('after-school-alarm-sub').textContent = phase.id === 'ticket'
      ? '先完成門票任務，再開心使用。'
      : '先整理好，再舒服進入睡前時間。';
    overlay.hidden = false;
    if (afterSchoolAlarmReady && !alreadyOpen) ringAfterSchoolAlarm();
  }

  // 提醒視窗和手機通知可能幾乎同時到，5 秒內只響一次
  function ringAfterSchoolAlarm() {
    const now = Date.now();
    if (now - lastAlarmRingAt < 5000) return;
    lastAlarmRingAt = now;
    afterSchoolAlarmSfx();
  }

  function hideAfterSchoolAlarm() {
    const overlay = document.getElementById('after-school-alarm-overlay');
    if (overlay) overlay.hidden = true;
    activeAfterSchoolAlarmPhaseId = null;
  }

  function toggleAfterSchoolAlarmSound() {
    const nextReady = afterSchoolAlarm && afterSchoolAlarm.toggleAlarmReady
      ? afterSchoolAlarm.toggleAlarmReady(afterSchoolAlarmReady)
      : !afterSchoolAlarmReady;
    if (!nextReady) {
      afterSchoolAlarmReady = false;
      rememberAlarmSound(false);
      updateAfterSchoolAlarmButton();
      toast('鬧鐘聲已關閉');
      return;
    }
    try {
      ensureAudio();
      afterSchoolAlarmReady = true;
      rememberAlarmSound(true);
      updateAfterSchoolAlarmButton();
      afterSchoolAlarmSfx();
      toast('鬧鐘聲已開啟');
    } catch (e) {
      toast('請再點一次開啟鬧鐘聲');
    }
  }

  function currentAfterSchoolAlarmPhaseId() {
    const daily = afterSchoolReminderDaily();
    if (afterSchoolAlarm && afterSchoolAlarm.resolveAlarmPhaseId) {
      return afterSchoolAlarm.resolveAlarmPhaseId(
        activeAfterSchoolAlarmPhaseId,
        afterSchoolPlan(),
        afterSchoolTodayLog(),
        daily,
        isAfterSchoolPhaseDone,
        new Date(),
        Date.now()
      );
    }
    return activeAfterSchoolAlarmPhaseId;
  }

  function dismissAfterSchoolAlarm() {
    const phaseId = currentAfterSchoolAlarmPhaseId();
    if (!phaseId) {
      hideAfterSchoolAlarm();
      return;
    }
    const daily = afterSchoolReminderDaily();
    daily[phaseId] = { dismissed: true, dismissedAt: Date.now() };
    save();
    hideAfterSchoolAlarm();
    renderAfterSchool();
  }

  function snoozeAfterSchoolAlarm() {
    const phaseId = currentAfterSchoolAlarmPhaseId();
    if (!phaseId) {
      hideAfterSchoolAlarm();
      return;
    }
    const daily = afterSchoolReminderDaily();
    daily[phaseId] = { snoozeUntil: Date.now() + 5 * 60 * 1000 };
    save();
    hideAfterSchoolAlarm();
    toast('5 分鐘後再提醒');
  }

  function maybeFireAfterSchoolReminders(plan, log) {
    const today = todayKey();
    const daily = afterSchoolReminderDaily();
    if (afterSchoolAlarm) {
      const phase = afterSchoolAlarm.nextAlarmPhase(plan, log, daily, isAfterSchoolPhaseDone, new Date(), Date.now());
      if (!phase) return;
      daily[phase.id] = { active: true, firedAt: Date.now() };
      save();
      showAfterSchoolAlarm(phase);
      return;
    }
    plan.filter(phase => phase.id === 'ticket' || phase.id === 'evening').forEach(phase => {
      if (!phase.reminderTime || daily[phase.id] || isAfterSchoolPhaseDone(phase, log) || !isAfterSchoolReminderDue(phase.reminderTime)) return;
      daily[phase.id] = true;
      ding(3);
      toast(`${stripPhasePrefix(phase.title)}提醒時間到了`);
      state.afterSchoolReminderLog[today] = daily;
      save();
    });
  }

  /* ---------- App 版手機通知（網頁版不會跑到這裡） ----------
     App 關著也會跳的提醒。時間全部排在手機上，不用伺服器、不連網。
     家長在放學設定按「儲存」時才第一次問能不能發通知；拒絕的話，App 內提醒照舊。 */
  function nativeNotifications() {
    if (!isNativeApp || !window.Capacitor || !window.Capacitor.Plugins) return null;
    return window.Capacitor.Plugins.LocalNotifications || null;
  }

  // 資料一有變動（改時間、打勾完成、按知道了、換天）就重排；連續變動只排最後一次
  function scheduleNativeReminderSync() {
    if (!isNativeApp) return;
    clearTimeout(scheduleNativeReminderSync.timer);
    scheduleNativeReminderSync.timer = setTimeout(() => {
      syncNativeReminders().catch(() => {});
    }, 800);
  }

  function childReminderPlan(child) {
    if (child === state) return afterSchoolPlan();
    const raw = Array.isArray(child.afterSchoolPlan) ? child.afterSchoolPlan : [];
    return DEFAULT_AFTER_SCHOOL_PLAN.map((defPhase, index) => {
      const phase = raw.find(item => item && item.id === defPhase.id) || raw[index] || defPhase;
      return {
        id: defPhase.id,
        title: renameToBoardGame(stripPhasePrefix(phase.title)) || defPhase.title,
        reminderTime: normalizeClock(phase.reminderTime, defPhase.reminderTime || ''),
        tasks: Array.isArray(phase.tasks) ? phase.tasks : defPhase.tasks
      };
    });
  }

  function nativeReminderText(child, phase, showName) {
    const name = String(child.userName || '').trim();
    const title = `${showName && name ? `${name}・` : ''}${stripPhasePrefix(phase.title)}提醒時間到了`;
    const body = phase.id === 'ticket'
      ? '先完成門票任務，再開心使用。'
      : '先整理好，再舒服進入睡前時間。';
    return { title, body };
  }

  async function syncNativeReminders() {
    const notifications = nativeNotifications();
    if (!notifications || !afterSchool || !afterSchoolAlarm) return;
    const permission = await notifications.checkPermissions();
    if (permission.display !== 'granted') return;

    const today = todayKey();
    const children = (appState.children || []).map(child => ({
      child,
      plan: childReminderPlan(child),
      todayLog: ((child.afterSchoolLog || {})[today]) || {},
      todayDaily: ((child.afterSchoolReminderLog || {})[today]) || {}
    }));
    const showName = children.length > 1;
    const planned = afterSchoolAlarm.planNativeReminders(children, isAfterSchoolPhaseDone, new Date());

    const pending = await notifications.getPending();
    const ours = (pending.notifications || []).filter(item => afterSchoolAlarm.isNativeReminderId(item.id));
    if (ours.length) await notifications.cancel({ notifications: ours.map(item => ({ id: item.id })) });
    if (!planned.length) return;

    await notifications.schedule({
      notifications: planned.map(item => {
        const entry = children[item.childIndex];
        const phase = entry.plan.find(p => p.id === item.phaseId);
        return {
          id: item.id,
          ...nativeReminderText(entry.child, phase, showName),
          // 沒指定聲音的話 iOS 只跳橫幅不會響；用 App 內鬧鐘同一段旋律
          sound: 'reminder.wav',
          schedule: { at: new Date(item.at), allowWhileIdle: true }
        };
      })
    });
  }

  // 只在家長儲存放學設定時呼叫：還沒問過才跳系統詢問；之前拒絕過就不再吵
  async function askNativeReminderPermission() {
    const notifications = nativeNotifications();
    if (!notifications) return;
    try {
      let permission = await notifications.checkPermissions();
      if (permission.display === 'prompt' || permission.display === 'prompt-with-rationale') {
        permission = await notifications.requestPermissions();
        toast(permission.display === 'granted'
          ? '時間到了，手機會跳通知提醒'
          : '沒開通知也沒關係，App 開著時一樣會提醒');
      }
      await syncNativeReminders();
    } catch (e) {}
  }

  // 家長編輯放學設定或任務後，今天已經過了的提醒不補響（只響之後的時間），
  // 否則改完一按儲存，鈴聲和提醒視窗就會立刻跳出來
  function silencePassedRemindersAfterEdit() {
    const daily = afterSchoolReminderDaily();
    afterSchoolPlan().forEach(phase => {
      if (phase.id !== 'ticket' && phase.id !== 'evening') return;
      if (!phase.reminderTime || !isAfterSchoolReminderDue(phase.reminderTime)) return;
      const entry = daily[phase.id];
      if (entry && entry.active) return;
      daily[phase.id] = { dismissed: true, silencedByEdit: true };
    });
  }

  function afterSchoolTodayLog() {
    const today = todayKey();
    state.afterSchoolLog = state.afterSchoolLog || {};
    state.afterSchoolLog[today] = state.afterSchoolLog[today] || {};
    return state.afterSchoolLog[today];
  }

  function afterSchoolStatusFor(dateKey = todayKey()) {
    const log = ((state.afterSchoolLog || {})[dateKey]) || {};
    if (!afterSchool) {
      return { earnedPoints: 0, totalCount: 0, doneCount: 0, tasks: [], gameTicket: { done: false, doneCount: 0, totalCount: 0 } };
    }
    return afterSchool.getAfterSchoolStatus(afterSchoolPlan(), log);
  }

  function afterSchoolTaskById(id) {
    if (!afterSchool) return null;
    return afterSchool.flattenTasks(afterSchoolPlan()).find(task => task.id === id) || null;
  }

  function todayPoints() {
    const log = state.log[todayKey()] || {};
    const habitPoints = state.habits.reduce((sum, hab) => sum + logEarnedPoints(hab, log[hab.id]), 0);
    const bonus = ((state.bingoBonuses || {})[todayKey()] || {}).bonus || 0;
    const afterSchoolPoints = afterSchoolStatusFor(todayKey()).earnedPoints || 0;
    return habitPoints + bonus + afterSchoolPoints;
  }
  function maxPointsToday() {
    const afterSchoolMax = afterSchoolStatusFor(todayKey()).tasks.reduce((sum, task) => sum + (parseInt(task.points, 10) || 0), 0);
    return visibleHabitsToday().reduce((s, h) => s + habitFullPoints(h), 0) + afterSchoolMax;
  }

  function todayReflection() {
    state.dailyReflections = state.dailyReflections || {};
    const today = todayKey();
    const entry = state.dailyReflections[today] || null;
    if (entry && entry.completed && (!entry.sticker || !entry.sticker.src) && reflectionRules) {
      entry.sticker = reflectionRules.stickerForDate(today, stickerOptions());
      state.dailyReflections[today] = entry;
      save();
    }
    return entry;
  }

  function hasCompletedReflection() {
    const entry = todayReflection();
    return !!(entry && entry.completed && entry.sticker);
  }

  function reflectionBlockers() {
    if (!reflectionRules) return [];
    state.reflectionBlockers = reflectionRules.normalizeBlockers(state.reflectionBlockers);
    return state.reflectionBlockers;
  }

  function stickerOptions() {
    return { childId: state.id, theme: stickerThemeId(), birthday: state.birthday || null };
  }
  function activeSpecialSet() {
    return reflectionRules ? reflectionRules.activeSpecialSet(todayKey(), state.birthday) : null;
  }
  function stickerThemeId() {
    const id = state.stickerTheme || 'daily';
    return reflectionRules && reflectionRules.STICKER_THEMES[id] ? id : 'daily';
  }

  function stickerIconHtml(sticker, size = 26) {
    if (sticker && sticker.src) {
      return `<img src="${escAttr(sticker.src)}" alt="" width="${size}" height="${size}" loading="lazy">`;
    }
    return iconSvg('ic-star', size, '#DA844F');
  }

  function reflectionStickerPreviewHtml(sticker) {
    return `
      <div class="reflection-preview-sticker" style="--sticker-color:${escAttr(sticker.color || '#DA844F')}">
        ${stickerIconHtml(sticker, 56)}
      </div>
    `;
  }

  function reflectionCollectedStickerHtml(entry) {
    const sticker = entry.sticker || entry;
    return `
      <div class="reflection-collected-sticker">
        <div class="reflection-collected-icon" style="--sticker-color:${escAttr(sticker.color || '#DA844F')}">
          ${stickerIconHtml(sticker, 68)}
        </div>
        <div class="reflection-collected-copy">今天收集到的貼紙</div>
      </div>
    `;
  }

  function reflectionCardStickerHtml(entry) {
    const sticker = entry.sticker || entry;
    return `
      <div class="reflection-card-sticker" style="--sticker-color:${escAttr(sticker.color || '#DA844F')}">
        ${stickerIconHtml(sticker, 34)}
      </div>
    `;
  }

  function stickerCollectionSlotHtml(slot) {
    const sticker = slot.sticker || {};
    return `
      <div class="sticker-slot${slot.collected ? ' collected' : ''}">
        <div class="sticker-slot-img${!slot.collected && slot.silhouette ? ' silhouette' : ''}">
          ${slot.collected || slot.silhouette ? stickerIconHtml(sticker, 42) : ''}
        </div>
        <div class="sticker-slot-date">${slot.collected ? formatDateShort(slot.dateKey) : ''}</div>
      </div>
    `;
  }

  function renderReflectionCard() {
    const wrap = document.getElementById('reflection-card');
    if (!wrap || !reflectionRules) return;
    const entry = todayReflection();
    if (entry && entry.completed && entry.sticker) {
      wrap.innerHTML = `
        <section class="reflection-card done">
          ${reflectionCardStickerHtml(entry)}
          <div class="reflection-card-copy">
            <div class="reflection-card-title">今天小回顧完成了</div>
            <div class="reflection-card-sub">這張貼紙已經收進小本本。</div>
          </div>
          <button class="btn btn-ghost btn-sm" id="btn-open-reflection">查看</button>
        </section>
      `;
      return;
    }
    wrap.innerHTML = `
      <section class="reflection-card">
        <div class="reflection-card-mark">${iconSvg('ic-sparkles', 22, '#DA844F')}</div>
        <div class="reflection-card-copy">
          <div class="reflection-card-title">今天小回顧</div>
          <div class="reflection-card-sub">選三個答案，送自己一張貼紙。</div>
        </div>
        <button class="btn btn-primary btn-sm" id="btn-open-reflection">開始</button>
      </section>
    `;
  }

  function openDailyReflectionModal() {
    if (!reflectionRules) return;
    const entry = todayReflection() || {};
    const selected = {
      mood: entry.mood || '',
      blocker: entry.blocker || ''
    };
    const sticker = (entry.completed && entry.sticker)
      ? entry.sticker
      : reflectionRules.stickerForDate(todayKey(), stickerOptions());
    const blockers = reflectionBlockers();

    openModal(`
      <h3 class="modal-title">今天小回顧</h3>
      <p class="modal-sub">不用打分數，只要選最像今天的答案。</p>
      <div class="reflection-form">
        <div class="reflection-question">
          <div class="reflection-question-title">我對今天自己的表現滿意度如何？</div>
          <div class="reflection-options reflection-moods">
            ${reflectionRules.MOODS.map(item => `
              <button type="button" class="reflection-option${selected.mood === item.id ? ' selected' : ''}" data-reflection-mood="${item.id}">
                <img class="reflection-face-img" src="assets/face-${escAttr(item.id)}.webp" alt="" width="52" height="52">
                <span>${escHtml(item.label)}</span>
              </button>
            `).join('')}
          </div>
        </div>
        <div class="reflection-question">
          <div class="reflection-question-title">今天哪件事卡住我了？</div>
          <div class="reflection-options">
            ${blockers.map(item => `
              <button type="button" class="reflection-option${selected.blocker === item.id ? ' selected' : ''}" data-reflection-blocker="${item.id}">
                ${escHtml(item.label)}
              </button>
            `).join('')}
          </div>
        </div>
        <div class="reflection-preview">
          <div class="reflection-preview-copy">
            <div class="reflection-preview-label">今天的貼紙</div>
            <div class="reflection-preview-message">送自己一張貼紙，為明天加油。</div>
            <div class="reflection-preview-hint">${activeSpecialSet()
              ? `現在是${escHtml(activeSpecialSet().label)}限定貼紙期間，收下就會永遠留在收藏冊！`
              : '貼紙主題可到家長模式的孩子檔案調整。'}</div>
          </div>
          ${reflectionStickerPreviewHtml(sticker)}
        </div>
      </div>
      <div class="modal-actions" style="margin-top:18px;">
        <button type="button" class="btn btn-ghost" data-reflection-cancel>晚點再填</button>
        <button type="button" class="btn btn-primary" data-reflection-save>收下貼紙</button>
      </div>
    `);

    const root = document.getElementById('modal');
    const saveBtn = root.querySelector('[data-reflection-save]');
    const refresh = () => {
      root.querySelectorAll('[data-reflection-mood]').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.reflectionMood === selected.mood);
      });
      root.querySelectorAll('[data-reflection-blocker]').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.reflectionBlocker === selected.blocker);
      });
      saveBtn.disabled = !(selected.mood && selected.blocker);
    };
    root.querySelectorAll('[data-reflection-mood]').forEach(btn => {
      btn.onclick = () => { selected.mood = btn.dataset.reflectionMood; reflectionPickSfx(); refresh(); };
    });
    root.querySelectorAll('[data-reflection-blocker]').forEach(btn => {
      btn.onclick = () => { selected.blocker = btn.dataset.reflectionBlocker; reflectionPickSfx(); refresh(); };
    });
    root.querySelector('[data-reflection-cancel]').onclick = closeModal;
    saveBtn.onclick = () => {
      reflectionStickerSfx();
      state.dailyReflections = reflectionRules.saveDailyReflection(
        state.dailyReflections || {},
        todayKey(),
        selected,
        Object.assign(stickerOptions(), { blockers: reflectionBlockers() })
      );
      save();
      renderReflectionCard();
      renderMineIfVisible();
      showReflectionStickerModal(state.dailyReflections[todayKey()]);
    };
    refresh();
  }

  function showReflectionStickerModal(entry) {
    openModal(`
      <h3 class="modal-title">貼紙收好了</h3>
      <p class="modal-sub">明天也可以再送自己一張新的。</p>
      <div class="reflection-sticker-big">
        ${reflectionCollectedStickerHtml(entry)}
      </div>
      <div class="modal-actions" style="margin-top:18px;">
        <button type="button" class="btn btn-primary" data-reflection-done>知道了</button>
      </div>
    `);
    document.getElementById('modal').querySelector('[data-reflection-done]').onclick = closeModal;
  }

  function renderMineIfVisible() {
    const mine = document.getElementById('screen-mine');
    if (mine && !mine.hidden) renderMine();
  }

  /* ---------- render: today ---------- */
  let todayCountdownTimer = null;
  function scheduleTodayCountdown() {
    if (todayCountdownTimer) { clearInterval(todayCountdownTimer); todayCountdownTimer = null; }
    const today = todayKey();
    const log = state.log[today] || {};
    const now = Date.now();
    const hasActiveTimer = state.habits.some(habit => {
      const run = isTimedHabit(habit) ? timedRunFor(habit) : null;
      return run && !isLogDone(log[habit.id]) && run.expiresAt > now;
    });
    if (hasActiveTimer) todayCountdownTimer = setInterval(renderToday, 1000);
  }

  function renderBirthdayGreeting() {
    const sub = document.getElementById('greet-sub');
    if (!sub || !reflectionRules) return;
    // 預設問候語是兩行（中間有 <br>），所以存 HTML 而不是純文字
    if (!sub.dataset.defaultHtml) sub.dataset.defaultHtml = sub.innerHTML;
    const birthday = reflectionRules.isBirthdayToday(todayKey(), state.birthday);
    if (birthday) {
      sub.innerHTML = `${escHtml(childName())}，生日快樂！<br>松鼠送你生日限定貼紙`;
    } else {
      sub.innerHTML = sub.dataset.defaultHtml;
    }
    sub.classList.toggle('birthday', birthday);
  }
  function renderToday() {
    renderBirthdayGreeting();
    const today = todayKey();
    const log = state.log[today] || {};
    const list = document.getElementById('habit-list');
    const visibleHabits = visibleHabitsToday();
    list.innerHTML = '';

    if (visibleHabits.length === 0) {
      list.innerHTML = state.habits.length === 0
        ? '<div class="empty">還沒有習慣～<br>點下方「管理習慣」加一個吧！</div>'
        : '<div class="empty">今天的限時任務時間到了～<br>明天再來挑戰！</div>';
    } else {
      visibleHabits.forEach(habit => {
        const done = isLogDone(log[habit.id]);
        const timed = isTimedHabit(habit);
        const run = timed ? timedRunFor(habit) : null;
        const started = !!run;
        const remaining = run ? run.expiresAt - Date.now() : 0;
        const points = timed ? habitFullPoints(habit) : habitBasePoints(habit);
        const row = document.createElement('div');
        row.className = 'habit' + (done ? ' done' : '') + (timed ? ' timed' : '') + (started && !done ? ' timing' : '');
        row.innerHTML = `
          <div class="habit-icon-box">${iconSvg(habit.icon, 28, '#5E5453')}</div>
          <div class="habit-text">
            <div class="habit-title"></div>
            <div class="habit-sub">
              ${acornSvg(16)}
              <span class="habit-points">+${points} 顆橡實</span>
              ${timed ? '<span class="timed-badge">限時雙倍</span>' : ''}
              ${timed && !started ? `<span class="timer-pill">${formatDuration(habit.timerMinutes)}</span>` : ''}
              ${timed && started && !done ? `<span class="timer-pill live">剩 ${formatCountdown(remaining)}</span>` : ''}
            </div>
          </div>
          <div class="habit-row-actions">
            <button class="habit-edit" data-edit="${habit.id}" aria-label="編輯">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
            </button>
            ${timed && !started && !done
              ? `<button class="btn btn-sm timed-start" data-start-timed="${habit.id}">開始</button>`
              : `<button class="check ${done ? 'done' : ''}" data-toggle="${habit.id}" aria-label="勾選">
                  ${done ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 12 10 18 20 6"/></svg>' : ''}
                </button>`}
          </div>
        `;
        row.querySelector('.habit-title').textContent = habit.title;
        // 家長模式往左滑可刪除（孩子模式不能滑）
        const wrap = document.createElement('div');
        wrap.className = 'swipe-row';
        wrap.innerHTML = swipeRowHtml(habit.title);
        wrap.appendChild(row);
        bindSwipeRow(wrap, row, () => deleteHabit(habit), { onlyParent: true, onCopy: () => copyHabit(habit) });
        list.appendChild(wrap);
      });
    }

    const doneToday = visibleHabits.filter(h=>isLogDone(log[h.id])).length;
    document.getElementById('habit-count').textContent =
      visibleHabits.length ? `${doneToday}/${visibleHabits.length}` : '';
    updateHomeSquirrelMood(doneToday, visibleHabits.length);

    // dock
    const cur = todayPoints();
    updateDock();
    renderReflectionCard();

    // header
    document.getElementById('user-name').textContent = childName();
    const d = new Date();
    const week = ['日','一','二','三','四','五','六'][d.getDay()];
    document.getElementById('today-date').textContent =
      `${d.getMonth()+1}月${d.getDate()}日 · 星期${week}`;
    scheduleTodayCountdown();
  }

  /* ---------- render: after school ---------- */
  let afterSchoolClockTimer = null;
  function formatClock(now = new Date()) {
    return `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  // 桌遊門票進度圈圈：完成的變深粉色，下一個要做的加橘色外框，走過的箭頭變橘色。
  // 3 個以內圈圈 40px；4 個以上縮成 32px，一排放不下就自動換行
  function renderTicketSteps(plan, log) {
    const box = document.getElementById('after-school-ticket-steps');
    if (!box) return;
    const phase = plan.find(item => item.id === 'ticket');
    const tasks = (phase && phase.tasks) || [];
    const doneFlags = tasks.map(task => afterSchool.isAfterSchoolDone(log, task.id));
    const nextIndex = doneFlags.indexOf(false);
    const size = 19;
    const check = `<span class="ticket-step-check" aria-hidden="true"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#FEFBF9" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg></span>`;
    const arrow = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>`;
    box.innerHTML = tasks.map((task, i) => {
      const done = doneFlags[i];
      const cls = done ? ' done' : (i === nextIndex ? ' next' : '');
      const step = `<span class="ticket-step${cls}" title="${escAttr(task.title)}" aria-label="${escAttr(task.title)}${done ? '，已完成' : ''}">${iconSvg(task.icon, size, '#a8725f')}${done ? check : ''}</span>`;
      const link = i < tasks.length - 1 ? `<span class="ticket-step-arrow${done ? ' passed' : ''}" aria-hidden="true">${arrow}</span>` : '';
      // 圈圈＋箭頭包成一格，CSS 一排放 4 格，換行時箭頭跟著前一個圈圈
      return `<span class="ticket-step-unit">${step}${link}</span>`;
    }).join('');
    box.hidden = tasks.length === 0;
  }

  function scheduleAfterSchoolClock() {
    if (afterSchoolClockTimer) { clearInterval(afterSchoolClockTimer); afterSchoolClockTimer = null; }
    const screen = document.getElementById('screen-after-school');
    if (screen && !screen.hidden) afterSchoolClockTimer = setInterval(renderAfterSchool, 30000);
  }

  function renderAfterSchool() {
    if (!afterSchool) return;
    const today = todayKey();
    const log = afterSchoolTodayLog();
    const cfg = afterSchoolSettings();
    const plan = afterSchoolPlan();
    const ticketName = afterSchoolTicketTitle(plan);
    const status = afterSchool.getAfterSchoolStatus(plan, log);
    const list = document.getElementById('after-school-list');
    const nextBtn = document.getElementById('btn-after-school-next');
    const ticketGate = document.getElementById('after-school-ticket-gate');
    const ticketSub = document.getElementById('after-school-ticket-sub');
    const ticketTitle = document.getElementById('after-school-ticket-title');

    document.getElementById('after-school-child-name').textContent = `嗨！${childName()}`;
    document.getElementById('after-school-now').textContent = `現在 ${formatClock()}`;
    document.getElementById('after-school-title').textContent = cfg.pageTitle;
    document.getElementById('after-school-sub').textContent = cfg.pageSubtitle;
    updateAfterSchoolAlarmButton();
    ticketTitle.textContent = ticketName;
    ticketSub.textContent = `已完成 ${status.gameTicket.doneCount}/${status.gameTicket.totalCount}`;
    renderTicketSteps(plan, log);
    // 門票任務全部完成：換成歡呼的松鼠＋「拿到門票」；進行中維持「準備中」
    ticketGate.innerHTML = status.gameTicket.done
      ? '<img class="ticket-gate-squirrel" src="assets/squirrel-cheer.webp" alt="" /><span>拿到門票</span>'
      : '準備中';
    ticketGate.classList.toggle('open', status.gameTicket.done);

    list.innerHTML = plan.map(phase => {
      const rows = phase.tasks.map(task => {
        const done = afterSchool.isAfterSchoolDone(log, task.id);
        const isNext = status.nextTask && status.nextTask.id === task.id;
        const tag = done ? '已完成' : (isNext ? '下一關' : task.note);
        const tagClass = done ? ' good' : (task.storyGate ? ' warn' : '');
        return `
          <div class="after-school-task${done ? ' done' : ''}${isNext ? ' current' : ''}">
            <div class="after-school-task-icon">${iconSvg(task.icon, 25, '#5E5453')}</div>
            <div class="after-school-task-text">
              <div class="after-school-task-title">${escHtml(task.title)}</div>
              <div class="after-school-task-sub">
                ${acornSvg(14)}
                +${task.points} 顆橡實
                <span class="after-school-tag${tagClass}">${escHtml(tag)}</span>
              </div>
            </div>
            <button class="check ${done ? 'done' : ''}" data-after-school-toggle="${task.id}" aria-label="切換${escAttr(task.title)}">
              ${done ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 12 10 18 20 6"/></svg>' : ''}
            </button>
          </div>
        `;
      }).join('');
      return `
        <section class="after-school-phase">
          <div class="after-school-phase-head">
            <div class="after-school-phase-title">${escHtml(displayPhaseTitle(phase, plan.indexOf(phase)))}</div>
            <div class="after-school-phase-time">
              <span>${escHtml(phase.time)}</span>
              ${phase.reminderTime ? `<span class="phase-reminder">${escHtml(formatClockShort(phase.reminderTime))} 提醒</span>` : ''}
            </div>
          </div>
          ${rows}
        </section>
      `;
    }).join('');

    nextBtn.hidden = true;
    nextBtn.dataset.afterSchoolNext = '';

    const curEl = document.getElementById('dock-current');
    const tgtEl = document.getElementById('dock-target');
    const barEl = document.getElementById('dock-bar');
    const labelEl = document.getElementById('dock-label-text');
    if (labelEl) labelEl.textContent = '今晚目標';
    if (curEl) curEl.textContent = status.doneCount;
    if (tgtEl) tgtEl.textContent = status.totalCount;
    if (barEl) barEl.style.width = status.totalCount ? Math.round(status.doneCount / status.totalCount * 100) + '%' : '0%';
    maybeFireAfterSchoolReminders(plan, log);
    scheduleAfterSchoolClock();
  }

  function markAfterSchoolTaskDoneNow(sourceEl, status) {
    const row = sourceEl ? sourceEl.closest('.after-school-task') : null;
    if (!row) return;
    row.classList.add('done');
    row.classList.remove('current');
    const checkBtn = row.querySelector('[data-after-school-toggle].check');
    if (checkBtn) {
      checkBtn.classList.add('done');
      checkBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 12 10 18 20 6"/></svg>';
    }
    const tag = row.querySelector('.after-school-tag');
    if (tag) {
      tag.textContent = '已完成';
      tag.classList.add('good');
      tag.classList.remove('warn');
    }

    const curEl = document.getElementById('dock-current');
    const barEl = document.getElementById('dock-bar');
    if (curEl) {
      const from = Math.max(0, status.doneCount - 1);
      tweenNumber(curEl, from, status.doneCount, 360);
      curEl.classList.remove('bump');
      void curEl.offsetWidth;
      curEl.classList.add('bump');
    }
    if (barEl) {
      barEl.style.width = status.totalCount ? Math.round(status.doneCount / status.totalCount * 100) + '%' : '0%';
    }
  }

  function toggleAfterSchoolTask(id, sourceEl) {
    if (!afterSchool) return;
    const today = todayKey();
    const log = afterSchoolTodayLog();
    const task = afterSchoolTaskById(id);
    if (!task) return;
    const wasDone = afterSchool.isAfterSchoolDone(log, id);
    const earned = parseInt(task.points, 10) || 0;
    const prevStatus = afterSchool.getAfterSchoolStatus(afterSchoolPlan(), log);
    state.afterSchoolLog[today] = afterSchool.setAfterSchoolTaskDone(log, id, !wasDone);
    state.points = Math.max(0, state.points + (wasDone ? -earned : earned));
    save();
    const nextStatus = afterSchool.getAfterSchoolStatus(afterSchoolPlan(), state.afterSchoolLog[today]);
    const ticketJustUnlocked = !wasDone && !prevStatus.gameTicket.done && nextStatus.gameTicket.done;

    if (!wasDone && sourceEl) {
      markAfterSchoolTaskDoneNow(sourceEl, nextStatus);
      const n = Math.max(1, Math.min(earned, 8));
      ding(n);
      const dockEl = document.querySelector('.dock-label svg');
      flyAcorn(sourceEl, dockEl, n);
      if (nextStatus.nextTask === null) {
        setTimeout(() => {
          showScreen('screen-unlock');
          renderUnlock(null, { mode: 'after-school' });
          setTimeout(() => afterSchoolClearSfx(), 120);
        }, 850 + n * 90 + 120);
      } else if (ticketJustUnlocked) {
        setTimeout(() => {
          showScreen('screen-unlock');
          renderUnlock(null, { mode: 'after-school-ticket' });
          setTimeout(() => afterSchoolClearSfx(), 120);
        }, 850 + n * 90 + 120);
      } else {
        setTimeout(renderAfterSchool, 850 + n * 90 + 120);
      }
    } else if (!wasDone && nextStatus.nextTask === null) {
      showScreen('screen-unlock');
      renderUnlock(null, { mode: 'after-school' });
      setTimeout(() => afterSchoolClearSfx(), 120);
    } else if (ticketJustUnlocked) {
      showScreen('screen-unlock');
      renderUnlock(null, { mode: 'after-school-ticket' });
      setTimeout(() => afterSchoolClearSfx(), 120);
    } else {
      renderAfterSchool();
    }
  }

  /* ---------- render: bingo ---------- */
  let bingoTimer = null;
  let bingoTickTimer = null;
  let bingoBusy = false;

  function stopBingoSpin() {
    if (bingoTimer) { clearInterval(bingoTimer); bingoTimer = null; }
    if (bingoTickTimer) { clearInterval(bingoTickTimer); bingoTickTimer = null; }
  }

  function bingoGridConfig() {
    const log = state.log[todayKey()] || {};
    return bingoRules.bingoGridConfig(bingoRules.dailyCompletionCount(state.habits, log));
  }
  function bingoConfigFromCells(cells) {
    return bingoRules.bingoConfigFromCells(cells);
  }

  function buildBingoCells() {
    const log = state.log[todayKey()] || {};
    return bingoRules.buildBingoCells({ habits: state.habits, log });
  }

  function renderBingoCells(cells, spinning = false, cfg = bingoGridConfig()) {
    const board = document.getElementById('bingo-board');
    board.className = `bingo-board cols-${cfg.cols} rows-${cfg.rows}${spinning ? ' spinning' : ''}`;
    board.innerHTML = '';
    cells.forEach(cell => {
      const el = document.createElement('div');
      el.className = 'bingo-cell' + (cell.done ? ' done' : '') + (cell.empty ? ' empty' : '') + (cell.free ? ' free' : '') + (cell.acorn ? ' acorn' : '');
      el.innerHTML = `
        <div class="bingo-cell-icon">${cell.acorn ? acornSvg(24) : iconSvg(cell.icon || 'ic-star', 24, '#5E5453')}</div>
        <div class="bingo-cell-title"></div>
      `;
      el.querySelector('.bingo-cell-title').textContent = cell.title;
      board.appendChild(el);
    });
  }

  function bingoLineCandidates(cfg) {
    return bingoRules.bingoLineCandidates(cfg);
  }

  function completedBingoLines(cells, cfg = bingoGridConfig()) {
    return bingoRules.completedBingoLines(cells, cfg);
  }

  function drawBingoLine(line, index) {
    const svg = document.getElementById('bingo-lines');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    path.setAttribute('x1', line.x1);
    path.setAttribute('y1', line.y1);
    path.setAttribute('x2', line.x2);
    path.setAttribute('y2', line.y2);
    path.setAttribute('class', 'bingo-line');
    svg.appendChild(path);
    setTimeout(() => {
      path.classList.add('show');
      bingoLineSfx(index);
    }, index * 620);
  }

  function showBingoResult(bonus, before, after, fromEl, lineCount = bonus) {
    const box = document.getElementById('bingo-result');
    const num = document.getElementById('bingo-bonus-num');
    const sub = document.getElementById('bingo-result-sub');
    const reflectionBtn = document.getElementById('btn-bingo-reflection');
    box.hidden = false;
    if (reflectionBtn) reflectionBtn.hidden = hasCompletedReflection();
    sub.textContent = bonus > 0
      ? (lineCount > bonus ? `條線很多，加碼最高 ${bonus} 顆` : '顆橡實已加進今天')
      : '今天沒有連線，明天再試';
    tweenNumber(num, 0, bonus, 900);
    if (bonus > 0) {
      bingoTotalSfx();
      const dockIcon = document.querySelector('.dock-label svg');
      const curEl = document.getElementById('dock-current');
      flyAcorn(fromEl || box, dockIcon, bonus, () => {
        tweenNumber(curEl, before, after, 700);
        curEl.classList.remove('bump');
        void curEl.offsetWidth;
        curEl.classList.add('bump');
        updateDock();
      });
    } else {
      updateDock();
    }
  }

  function finishBingoRound() {
    if (bingoBusy) return;
    bingoBusy = true;
    stopBingoSpin();

    const today = todayKey();
    state.bingoBonuses = state.bingoBonuses || {};
    if (state.bingoBonuses[today]) {
      renderBingo();
      return;
    }

    const before = todayPoints();
    const cfg = bingoGridConfig();
    const cells = buildBingoCells();
    renderBingoCells(cells, false);
    const lines = completedBingoLines(cells, cfg);
    const bonus = bingoRules.calculateBingoBonus(lines, cfg);
    const after = before + bonus;
    const btn = document.getElementById('btn-bingo-spin');
    btn.disabled = true;
    btn.textContent = '今天已加碼';
    document.getElementById('bingo-lines').innerHTML = '';
    lines.forEach(drawBingoLine);

    state.bingoBonuses[today] = {
      bonus,
      lines: lines.length,
      overflow: bingoRules.bingoOverflowCount(state.habits, state.log[today] || {}, cells),
      cells,
      cfg,
      at: new Date().toISOString()
    };
    if (bonus > 0) state.points += bonus;
    save();

    setTimeout(() => showBingoResult(bonus, before, after, btn, lines.length), 650 * lines.length + 450);
  }

  function bingoBoardNote(cells) {
    const overflow = bingoRules.bingoOverflowCount(state.habits, state.log[todayKey()] || {}, cells);
    if (overflow > 0) return `還有 ${overflow} 個完成任務也算在今天。`;
    return '粉色格子代表今天完成的任務。';
  }

  function renderBingo() {
    bingoBusy = false;
    updateDock();
    const today = todayKey();
    const saved = (state.bingoBonuses || {})[today];
    const btn = document.getElementById('btn-bingo-spin');
    const result = document.getElementById('bingo-result');
    const sub = document.getElementById('bingo-sub');
    const num = document.getElementById('bingo-bonus-num');
    const resultSub = document.getElementById('bingo-result-sub');
    const reflectionBtn = document.getElementById('btn-bingo-reflection');
    document.getElementById('bingo-lines').innerHTML = '';
    result.hidden = true;
    if (reflectionBtn) reflectionBtn.hidden = true;

    if (saved) {
      stopBingoSpin();
      const savedCells = saved.cells || buildBingoCells();
      const savedCfg = saved.cfg || bingoConfigFromCells(savedCells);
      renderBingoCells(savedCells, false, savedCfg);
      completedBingoLines(savedCells, savedCfg).forEach((line) => {
        const svg = document.getElementById('bingo-lines');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        path.setAttribute('x1', line.x1);
        path.setAttribute('y1', line.y1);
        path.setAttribute('x2', line.x2);
        path.setAttribute('y2', line.y2);
        path.setAttribute('class', 'bingo-line show');
        svg.appendChild(path);
      });
      btn.disabled = true;
      btn.textContent = '今天已加碼';
      result.hidden = false;
      if (reflectionBtn) reflectionBtn.hidden = hasCompletedReflection();
      num.textContent = saved.bonus || 0;
      resultSub.textContent = saved.bonus > 0
        ? ((saved.lines || 0) > (saved.bonus || 0) ? `條線很多，加碼最高 ${saved.bonus || 0} 顆` : '顆橡實已加進今天')
        : '今天沒有連線，明天再試';
      sub.textContent = `今天已加碼 +${saved.bonus || 0} 顆，明天再來。`;
      return;
    }

    btn.disabled = false;
    btn.textContent = '好手氣加碼';
    sub.innerHTML = '粉色格子連成線<br>就可以加碼橡實';
    let cells = buildBingoCells();
    renderBingoCells(cells, true);
    sub.textContent = bingoBoardNote(cells);
    stopBingoSpin();
    bingoTimer = setInterval(() => {
      cells = buildBingoCells();
      renderBingoCells(cells, true);
      sub.textContent = bingoBoardNote(cells);
    }, 170);
    bingoTickTimer = setInterval(bingoTickSfx, 340);
  }

  function openBingoIntroModal() {
    openModal(`
      <h3 class="modal-title">好手氣賓果</h3>
      <p class="modal-sub">每天只能玩一次，連線可以加碼橡實！</p>
      <div class="bingo-intro-card">
        <div>粉色格子代表今天已完成的任務。</div>
        <div>直線、橫線、對角線都算賓果。</div>
        <div>線很多時，今天最多加碼 5 顆。</div>
      </div>
      <div class="modal-actions" style="margin-top:18px;">
        <button type="button" class="btn btn-primary" data-bingo-intro-ok>知道了</button>
      </div>
    `);
    const root = document.getElementById('modal');
    root.querySelector('[data-bingo-intro-ok]').onclick = closeModal;
  }

  function openBingoFromSquirrel() {
    goToScreen('bingo');
    setTimeout(openBingoIntroModal, 120);
  }

  /* ---------- render: rewards ---------- */
  function renderRewards() {
    updateDock();
    document.getElementById('rewards-page-title').textContent = `${childName()}的獎勵小店`;
    document.getElementById('rw-current').textContent = state.points;
    const todayEl = document.getElementById('rw-today');
    if (todayEl) todayEl.textContent = todayPoints();

    const list = document.getElementById('reward-list');
    list.innerHTML = '';
    if (state.rewards.length === 0) {
      list.innerHTML = '<div class="empty">還沒有獎勵～<br>請家長點下方「管理獎勵」新增！</div>';
      return;
    }

    // 跟著 state.rewards 自訂順序顯示，不依價格排
    const ordered = state.rewards.slice();
    const firstLockedId = (ordered.find(r => state.points < r.cost) || {}).id;

    ordered.forEach(rw => {
      const can = state.points >= rw.cost;
      const need = Math.max(0, rw.cost - state.points);
      const isNext = !can && rw.id === firstLockedId;
      const card = document.createElement('div');
      card.className = 'reward' + (can ? ' affordable' : ' locked') + (isNext ? ' next-goal' : '');
      card.innerHTML = `
        <div class="reward-icon-box">
          ${iconSvg(rw.icon, 32, can ? '#FEFBF9' : '#9c938f')}
          ${can ? '' : '<div class="reward-lock-overlay"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5E5453" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></div>'}
        </div>
        <div class="reward-text">
          <div class="reward-title"></div>
          <div class="reward-sub"></div>
          <div class="reward-tags">
            <span class="tag">
              ${acornSvg(14)}
              ${rw.cost} 顆
            </span>
            ${can ? '<span class="tag ok"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FEFBF9" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 12 10 18 20 6"/></svg> 可兌換</span>' : `<span class="tag warn">還差 ${need} 顆</span>`}
          </div>
        </div>
        <div class="reward-actions">
          <button class="btn btn-sm ${can ? 'btn-primary' : ''}" ${can ? `data-redeem="${rw.id}"` : 'disabled style="opacity:.5"'}>
            ${can ? '兌換' : '加油'}
          </button>
          <button class="habit-edit" data-edit-reward="${rw.id}" aria-label="編輯">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
          </button>
        </div>
      `;
      card.querySelector('.reward-title').textContent = rw.title;
      const subEl = card.querySelector('.reward-sub');
      if (rw.desc) subEl.textContent = rw.desc;
      else subEl.remove();
      const wrap = document.createElement('div');
      wrap.className = 'swipe-row';
      wrap.innerHTML = swipeRowHtml(rw.title);
      wrap.appendChild(card);
      bindSwipeRow(wrap, card, () => deleteReward(rw), { onlyParent: true, onCopy: () => copyReward(rw) });
      list.appendChild(wrap);
    });
  }

  /* ---------- render: unlock screen ---------- */
  let unlockReturnTarget = 'rewards';
  function renderUnlock(reward, options = {}) {
    const card = document.getElementById('unlock-card');
    const nameTop = document.getElementById('unlock-reward-name');
    const titleEl = document.getElementById('unlock-title');
    const subEl = document.getElementById('unlock-sub');
    const sub2El = document.getElementById('unlock-sub2');
    const ctaEl = document.getElementById('unlock-cta');
    const mode = options.mode || 'reward';
    unlockReturnTarget = mode.startsWith('after-school') ? 'after-school' : 'rewards';

    if (mode === 'after-school') {
      const cfg = afterSchoolSettings();
      const cardSub = cfg.finalRewardCardSub || `${afterSchoolPhaseTaskSummary('evening')}都完成`;
      card.hidden = false;
      const icBox = card.querySelector('.reward-icon-box');
      icBox.innerHTML = iconSvg('ic-bookopen', 32, '#FEFBF9');
      if (titleEl) titleEl.textContent = '恭喜破關！';
      if (nameTop) nameTop.textContent = cfg.finalRewardName;
      if (subEl) subEl.textContent = '第三階段任務完成了';
      if (sub2El) sub2El.textContent = '晚上整理好，就可以進入睡前時光';
      document.getElementById('unlock-card-name').textContent = cfg.finalRewardCardTitle;
      document.getElementById('unlock-card-sub').textContent = cardSub;
      if (ctaEl) ctaEl.textContent = '✓ 回放學路線';
    } else if (mode === 'after-school-ticket') {
      const ticketName = afterSchoolTicketTitle();
      const ticketTaskSummary = afterSchoolPhaseTaskSummary('ticket');
      card.hidden = false;
      const icBox = card.querySelector('.reward-icon-box');
      icBox.innerHTML = iconSvg('ic-gamepad', 32, '#FEFBF9');
      if (titleEl) titleEl.textContent = '恭喜過關！';
      if (nameTop) nameTop.textContent = '獲得門票';
      if (subEl) subEl.textContent = '第二階段任務完成了';
      if (sub2El) sub2El.textContent = '先補充能量，再開心使用';
      document.getElementById('unlock-card-name').textContent = ticketName;
      document.getElementById('unlock-card-sub').textContent = `${ticketTaskSummary}都完成`;
      if (ctaEl) ctaEl.textContent = '✓ 回放學路線';
    } else if (reward) {
      card.hidden = false;
      const icBox = card.querySelector('.reward-icon-box');
      icBox.innerHTML = iconSvg(reward.icon, 32, '#FEFBF9');
      if (titleEl) titleEl.textContent = '恭喜你獲得';
      document.getElementById('unlock-card-name').textContent = reward.title;
      document.getElementById('unlock-card-sub').textContent = `已扣抵 ${reward.cost} 顆橡實`;
      if (nameTop) nameTop.textContent = reward.title;
      if (subEl) subEl.innerHTML = `你收集了 ${acornSvg(20)} <b id="unlock-points">${reward.cost}</b> 顆橡實`;
      if (sub2El) sub2El.textContent = '松鼠也好開心呀！';
      if (ctaEl) ctaEl.textContent = '✓ 太棒了！';
    } else {
      card.hidden = true;
      if (titleEl) titleEl.textContent = '恭喜你獲得';
      if (nameTop) nameTop.textContent = '';
      if (subEl) subEl.innerHTML = `你收集了 ${acornSvg(20)} <b id="unlock-points">${state.points}</b> 顆橡實`;
      if (sub2El) sub2El.textContent = '松鼠也好開心呀！';
      if (ctaEl) ctaEl.textContent = '✓ 太棒了！';
    }
    spawnBgIcons();
    spawnConfetti();
  }

  let confettiTimer = null;
  let confettiSfxTimer = null;
  let bgIconsTimer = null;
  function spawnConfettiBatch(count) {
    // 彩帶感：70% 長條 / 30% 圓點，下降 4-6 秒，sway ±70px
    const screen = document.getElementById('screen-unlock');
    const colors = ['#DA844F','#C78E78','#F5A3A4','#EBB95E','#A4AE92','#DB6D66'];
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'confetti-piece';
      const c = colors[i % colors.length];
      const isStrip = Math.random() > 0.3;
      Object.assign(p.style, {
        left: (Math.random() * 100) + '%',
        background: c,
        width: isStrip ? '8px' : (11 + Math.random()*9) + 'px',
        height: isStrip ? (20 + Math.random()*14) + 'px' : (11 + Math.random()*9) + 'px',
        borderRadius: isStrip ? '2px' : '50%',
        animation: `confetti-fall ${2.5 + Math.random()*1}s ${(Math.random()*0.3).toFixed(2)}s linear forwards`,
        opacity: 0
      });
      p.style.setProperty('--sway', ((Math.random()*140 - 70)) + 'px');
      screen.appendChild(p);
      setTimeout(() => p.remove(), 4000);
    }
  }
  function spawnConfetti() {
    // 同時 ~35 顆彩帶：每 600ms 補 7 顆 × 平均停留 3s = ~35 顆；無縫接續（落下 3 秒比較快）
    document.querySelectorAll('.confetti-piece').forEach(n => n.remove());
    if (confettiTimer) clearInterval(confettiTimer);
    spawnConfettiBatch(10);
    confettiTimer = setInterval(() => spawnConfettiBatch(7), 600);
  }
  function spawnBgIcons() {
    const wrap = document.getElementById('bg-icons');
    if (!wrap) return;
    wrap.innerHTML = '';
    // 形狀庫
    const SHAPE = {
      starOutline: (color) => `<svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M11.5 2.3a.55.55 0 0 1 1 0l2.4 4.9 5.4.8a.55.55 0 0 1 .3.94l-3.9 3.8 1 5.4a.55.55 0 0 1-.8.58l-4.8-2.5-4.8 2.5a.55.55 0 0 1-.8-.58l1-5.4-3.9-3.8a.55.55 0 0 1 .3-.94l5.4-.8z"/></svg>`,
      heartOutline: (color) => `<svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"><path d="M2 9.5a5.5 5.5 0 0 1 9.6-3.7.6.6 0 0 0 .8 0A5.5 5.5 0 0 1 22 9.5c0 2.3-1.5 4-3 5.5l-5.5 5.3a2 2 0 0 1-3 0L5 15c-1.5-1.5-3-3.2-3-5.5"/></svg>`,
      square: (color) => `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" fill="${color}"/></svg>`,
      circle: (color) => `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="${color}"/></svg>`,
      ellipse: (color) => `<svg viewBox="0 0 24 12"><ellipse cx="12" cy="6" rx="11" ry="5" fill="${color}"/></svg>`,
      stripe: (color) => `<svg viewBox="0 0 24 8"><rect x="1" y="1" width="22" height="6" rx="3" fill="${color}"/></svg>`
    };
    // 對照設計圖布局：避開中間圓圈（top 38-68%, left 18-82%）
    const ITEMS = [
      // 上方（左上 → 右上）
      { x: 18, y:  9, w: 26, h: 26, shape: 'square',       color: '#EBB95E', rot:  18 },  // 黃方塊
      { x:  8, y: 18, w: 22, h: 22, shape: 'square',       color: '#FFF3EE', rot: -12 },  // 白方塊
      { x: 30, y: 22, w: 16, h: 16, shape: 'circle',       color: '#F5A3A4', rot:   0 },  // 粉點
      { x: 50, y: 14, w: 26, h: 13, shape: 'ellipse',      color: '#A4AE92', rot: -10 },  // 綠橢圓
      { x: 72, y: 12, w: 24, h: 12, shape: 'ellipse',      color: '#F7DCD1', rot:  20 },  // 粉橢圓
      { x: 86, y: 22, w: 20, h: 20, shape: 'square',       color: '#FFF3EE', rot:  10 },  // 白方塊
      // 中段兩側
      { x:  6, y: 33, w: 30, h: 30, shape: 'starOutline',  color: '#F5A3A4', rot: -15 },  // 粉星空
      { x: 12, y: 48, w: 22, h: 22, shape: 'circle',       color: '#DA844F', rot:   0 },  // 橘實心圓
      { x: 88, y: 36, w: 24, h: 12, shape: 'ellipse',      color: '#F7DCD1', rot: -25 },  // 粉橢圓
      { x: 90, y: 50, w: 22, h: 22, shape: 'circle',       color: '#F5A3A4', rot:   0 },  // 粉點
      // 下方左
      { x:  5, y: 70, w: 28, h: 28, shape: 'heartOutline', color: '#F5A3A4', rot: -10 },  // 粉愛心
      { x: 14, y: 82, w: 26, h: 13, shape: 'ellipse',      color: '#F7DCD1', rot:  15 },  // 粉橢圓
      { x:  8, y: 92, w: 22, h:  8, shape: 'stripe',       color: '#DA844F', rot:  -8 },  // 橘條
      // 下方中
      { x: 38, y: 88, w: 14, h: 14, shape: 'circle',       color: '#F5A3A4', rot:   0 },  // 粉點
      { x: 50, y: 80, w: 28, h: 28, shape: 'starOutline',  color: '#EBB95E', rot:  20 },  // 黃星空
      { x: 60, y: 92, w: 22, h:  8, shape: 'stripe',       color: '#C78E78', rot:  10 },  // 棕條
      // 下方右
      { x: 80, y: 72, w: 28, h: 28, shape: 'heartOutline', color: '#F5A3A4', rot:  18 },  // 粉愛心
      { x: 92, y: 86, w: 14, h: 14, shape: 'circle',       color: '#EBB95E', rot:   0 },  // 黃點
    ];
    ITEMS.forEach((it, i) => {
      const el = document.createElement('div');
      el.className = 'bg-icon';
      el.innerHTML = SHAPE[it.shape](it.color);
      Object.assign(el.style, {
        left: it.x + '%',
        top:  it.y + '%',
        width:  it.w + 'px',
        height: it.h + 'px',
        animationDelay: ((i % 6) * 0.4) + 's'
      });
      el.style.setProperty('--rot', it.rot + 'deg');
      wrap.appendChild(el);
    });
  }
  function clearBgIcons() {
    const wrap = document.getElementById('bg-icons');
    if (wrap) wrap.innerHTML = '';
  }
  function stopFestivities() {
    if (confettiTimer) { clearInterval(confettiTimer); confettiTimer = null; }
    if (confettiSfxTimer) { clearInterval(confettiSfxTimer); confettiSfxTimer = null; }
    if (bgIconsTimer) { clearInterval(bgIconsTimer); bgIconsTimer = null; }
    document.querySelectorAll('.confetti-piece').forEach(n => n.remove());
    clearBgIcons();
  }

  /* ---------- toggle habit ---------- */
  function startTimedHabit(id) {
    const habit = state.habits.find(h => h.id === id);
    if (!isTimedHabit(habit)) return;
    const runs = todayTimedRuns();
    const now = Date.now();
    runs[id] = {
      startedAt: now,
      expiresAt: now + habit.timerMinutes * 60 * 1000
    };
    save();
    renderToday();
  }

  function toggleHabit(id, sourceEl) {
    const today = todayKey();
    const log = state.log[today] || {};
    const habit = state.habits.find(h => h.id === id);
    if (!habit) return;
    const timed = isTimedHabit(habit);
    const run = timed ? timedRunFor(habit) : null;
    if (timed && !run && !isLogDone(log[id])) {
      startTimedHabit(id);
      return;
    }
    if (timed && isTimedExpired(habit, log)) {
      toast('時間到了，明天再挑戰');
      renderToday();
      return;
    }
    const wasDone = isLogDone(log[id]);
    const earnedPoints = wasDone ? logEarnedPoints(habit, log[id]) : habitFullPoints(habit);
    const before = todayPoints();
    if (wasDone) {
      delete log[id];
      state.points = Math.max(0, state.points - earnedPoints);
    } else {
      log[id] = timed
        ? { done: true, points: earnedPoints, timed: true, completedAt: new Date().toISOString() }
        : { done: true, points: earnedPoints, completedAt: new Date().toISOString() };
      state.points += earnedPoints;
    }
    state.log[today] = log;
    save();

    if (!wasDone) {
      // 1. 立即改顏色（不等動畫跑完）
      const habitRow = sourceEl ? sourceEl.closest('.habit') : null;
      if (habitRow) habitRow.classList.add('done');
      if (sourceEl) {
        sourceEl.classList.add('done');
        sourceEl.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 12 10 18 20 6"/></svg>';
      }

      // 2. 顏色改完 → 飛 N 顆橡實 + 叮 N 聲 + 數字跳
      const n = Math.max(1, earnedPoints);
      ding(n);
      const visibleNow = visibleHabitsToday();
      const allDone = visibleNow.length > 0 && visibleNow.every(h => isLogDone(log[h.id]));
      cheerHomeSquirrel(allDone);
      const dockEl = document.querySelector('.dock-label svg');
      flyAcorn(sourceEl, dockEl, n);
      const after = before + earnedPoints;
      const curEl = document.getElementById('dock-current');
      if (curEl) {
        tweenNumber(curEl, before, after, Math.min(1500, 600 + n * 60));
        curEl.classList.remove('bump');
        void curEl.offsetWidth;
        curEl.classList.add('bump');
      }
      // 3. 動畫跑完才 render（保持顏色＋進度數字穩定）
      setTimeout(() => renderToday(), 850 + n * 90 + 200);
    } else {
      renderToday();
    }
  }

  /* ---------- redeem reward ---------- */
  function redeem(id) {
    const r = state.rewards.find(x => x.id === id);
    if (!r) return;
    if (state.points < r.cost) { toast('橡實還不夠～'); return; }
    rewardSfx();
    state.points -= r.cost;
    state.redeemed = state.redeemed || [];
    state.redeemed.unshift({
      id: h(),
      rewardId: r.id,
      title: r.title,
      icon: r.icon,
      cost: r.cost,
      date: todayKey()
    });
    // 只保留 30 天內
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
    const cutoffKey = `${cutoff.getFullYear()}-${String(cutoff.getMonth()+1).padStart(2,'0')}-${String(cutoff.getDate()).padStart(2,'0')}`;
    state.redeemed = state.redeemed.filter(x => x.date >= cutoffKey);
    save();
    showScreen('screen-unlock');
    renderUnlock(r);
    // 撒花畫面浮現 100ms 後撒花音效
    setTimeout(() => confettiSfx(), 150);
  }

  /* ---------- modal ---------- */
  function openModal(html) {
    const bd = document.getElementById('modal-backdrop');
    document.getElementById('modal-body').innerHTML = html;
    bd.hidden = false;
  }
  function closeModal() { document.getElementById('modal-backdrop').hidden = true; }

  function openAfterSchoolSettingsForm() {
    const cfg = afterSchoolSettings();
    const plan = afterSchoolPlan();
    openModal(`
      <h3 class="modal-title">放學設定</h3>
      <p class="modal-sub">主畫面、三段路線、提醒時間和任務都可以在這裡改。</p>
      <form id="after-school-settings-form">
        <div class="field">
          <label>頁面主標題</label>
          <input name="pageTitle" maxlength="24" value="${escAttr(cfg.pageTitle)}" placeholder="例：桌遊門票" />
        </div>
        <div class="field">
          <label>主標題下方文字</label>
          <input name="pageSubtitle" maxlength="40" value="${escAttr(cfg.pageSubtitle)}" placeholder="例：先拿門票，再把晚上收好" />
        </div>
        <div class="after-school-editor-phase">
          <div class="after-school-editor-head">
            <div>
              <div class="after-school-editor-kicker">第三階段撒花獎勵</div>
              <div class="after-school-editor-title">${escHtml(cfg.finalRewardCardTitle)}</div>
            </div>
          </div>
          <div class="field">
            <label>畫面大字</label>
            <input name="finalRewardName" maxlength="24" value="${escAttr(cfg.finalRewardName)}" placeholder="例：得到睡前故事" />
          </div>
          <div class="field">
            <label>下方獎勵主標</label>
            <input name="finalRewardCardTitle" maxlength="24" value="${escAttr(cfg.finalRewardCardTitle)}" placeholder="例：睡前故事" />
          </div>
          <div class="field">
            <label>下方獎勵小字</label>
            <input name="finalRewardCardSub" maxlength="40" value="${escAttr(cfg.finalRewardCardSub)}" placeholder="不填會自動帶入第三階段任務" />
          </div>
        </div>
        <div class="after-school-editor">
          ${plan.map((phase, index) => `
            <section class="after-school-editor-phase">
              <div class="after-school-editor-head">
                <div>
                  <div class="after-school-editor-kicker">${phaseLabel(index)}</div>
                  <div class="after-school-editor-title">${escHtml(stripPhasePrefix(phase.title))}</div>
                </div>
                <button type="button" class="btn btn-sm btn-ghost" data-new-after-school-task="${phase.id}">新增任務</button>
              </div>
              <div class="field-row">
                <div class="field">
                  <label>${phaseLabel(index)}標題</label>
                  <input name="phaseTitle_${phase.id}" maxlength="18" value="${escAttr(stripPhasePrefix(phase.title))}" />
                </div>
                <div class="field">
                  <label>時間文字</label>
                  <input name="phaseTime_${phase.id}" maxlength="18" value="${escAttr(phase.time)}" />
                </div>
              </div>
              ${phase.id === 'ticket' || phase.id === 'evening' ? `
                <div class="field">
                  <label>${phaseLabel(index)}提醒時間</label>
                  <input name="phaseReminder_${phase.id}" type="time" value="${escAttr(phase.reminderTime || '')}" />
                </div>
              ` : ''}
              <div class="after-school-editor-task-list">
                ${phase.tasks.map(task => `
                  <div class="swipe-row">
                  ${swipeRowHtml(task.title)}
                  <button type="button" class="after-school-editor-task" data-edit-after-school-task="${task.id}">
                    <span class="after-school-editor-task-icon">${iconSvg(task.icon, 20, '#5E5453')}</span>
                    <span class="after-school-editor-task-text">
                      <b>${escHtml(task.title)}</b>
                      <small>+${task.points} 顆橡實${task.note ? ` · ${escHtml(task.note)}` : ''}</small>
                    </span>
                    <span class="after-school-editor-task-edit">編輯</span>
                  </button>
                  </div>
                `).join('')}
              </div>
            </section>
          `).join('')}
        </div>
        <div class="modal-actions" style="margin-top:18px;">
          <button type="button" class="btn" data-cancel>取消</button>
          <button type="submit" class="btn btn-primary">儲存</button>
        </div>
      </form>
    `);
    const root = document.getElementById('modal');
    root.querySelector('[data-cancel]').onclick = closeModal;
    root.querySelectorAll('[data-new-after-school-task]').forEach(btn => {
      btn.onclick = () => openAfterSchoolTaskForm(btn.dataset.newAfterSchoolTask);
    });
    root.querySelectorAll('[data-edit-after-school-task]').forEach(btn => {
      btn.onclick = () => {
        const task = afterSchoolTaskById(btn.dataset.editAfterSchoolTask);
        if (task) openAfterSchoolTaskForm(task.phaseId, task);
      };
    });
    bindSwipeToDelete(root);
    root.querySelector('#after-school-settings-form').onsubmit = (e) => {
      e.preventDefault();
      const f = e.target;
      const nextPlan = afterSchoolPlan().map(phase => ({
        ...phase,
        title: f[`phaseTitle_${phase.id}`].value.trim() || stripPhasePrefix(phase.title),
        time: f[`phaseTime_${phase.id}`].value.trim() || phase.time,
        reminderTime: f[`phaseReminder_${phase.id}`]
          ? normalizeClock(f[`phaseReminder_${phase.id}`].value, phase.reminderTime || '')
          : ''
      }));
      state.afterSchoolSettings = {
        pageTitle: f.pageTitle.value.trim() || DEFAULT_AFTER_SCHOOL_SETTINGS.pageTitle,
        pageSubtitle: f.pageSubtitle.value.trim() || DEFAULT_AFTER_SCHOOL_SETTINGS.pageSubtitle,
        finalRewardName: f.finalRewardName.value.trim() || DEFAULT_AFTER_SCHOOL_SETTINGS.finalRewardName,
        finalRewardCardTitle: f.finalRewardCardTitle.value.trim() || DEFAULT_AFTER_SCHOOL_SETTINGS.finalRewardCardTitle,
        finalRewardCardSub: f.finalRewardCardSub.value.trim()
      };
      state.afterSchoolPlan = nextPlan;
      state.afterSchoolReminderLog = {};
      silencePassedRemindersAfterEdit();
      save();
      closeModal();
      renderAfterSchool();
      toast('放學設定已更新');
      askNativeReminderPermission();
    };
  }

  function deleteAfterSchoolTask(phaseId, task) {
    if (!confirm(`刪除「${task.title}」？`)) return;
    state.afterSchoolPlan = afterSchoolPlan().map(item => {
      if (item.id !== phaseId) return item;
      return { ...item, tasks: item.tasks.filter(x => x.id !== task.id) };
    });
    Object.values(state.afterSchoolLog || {}).forEach(log => delete log[task.id]);
    state.afterSchoolPlan = normalizeAfterSchoolPlan(state.afterSchoolPlan);
    silencePassedRemindersAfterEdit();
    save();
    renderAfterSchool();
    openAfterSchoolSettingsForm();
  }

  // 往左滑露出紅色「刪除」、往右滑露出綠色「複製」（放學設定任務列、首頁任務、獎勵卡共用）。
  // 點刪除會再確認；滑開時點列本身只會收回。onlyParent：只有家長模式能滑
  let openSwipeRow = null;
  function closeSwipeRow(row) {
    if (!row) return;
    row.style.transform = '';
    row.classList.remove('swiped');
    row.closest('.swipe-row')?.classList.remove('swiping', 'swiping-right');
    if (openSwipeRow === row) openSwipeRow = null;
  }
  function bindSwipeRow(wrap, row, onDelete, { onlyParent = false, onCopy = null } = {}) {
    const OPEN_X = -84;
    const COPY_X = onCopy ? 84 : 0;
    let startX = 0, startY = 0, dx = 0, tracking = false, horizontal = null;
    row.addEventListener('touchstart', (e) => {
      if (onlyParent && !document.body.classList.contains('parent-mode')) return;
      if (openSwipeRow && openSwipeRow !== row) closeSwipeRow(openSwipeRow);
      const t = e.touches[0];
      startX = t.clientX; startY = t.clientY; dx = 0; tracking = true; horizontal = null;
      row.style.transition = 'none';
    }, { passive: true });
    row.addEventListener('touchmove', (e) => {
      if (!tracking) return;
      const t = e.touches[0];
      const mx = t.clientX - startX, my = t.clientY - startY;
      if (horizontal === null && (Math.abs(mx) > 8 || Math.abs(my) > 8)) horizontal = Math.abs(mx) > Math.abs(my);
      if (!horizontal) return;
      e.preventDefault();
      const base = row.classList.contains('swiped') ? OPEN_X : (row.classList.contains('swiped-right') ? COPY_X : 0);
      dx = Math.max(OPEN_X - 20, Math.min(COPY_X ? COPY_X + 20 : 0, base + mx));
      wrap.classList.toggle('swiping', dx < 0);
      wrap.classList.toggle('swiping-right', dx > 0);
      row.style.transform = `translateX(${dx}px)`;
    }, { passive: false });
    row.addEventListener('touchend', () => {
      if (!tracking) return;
      tracking = false;
      row.style.transition = '';
      if (!horizontal) return;
      row.classList.remove('swiped', 'swiped-right');
      if (dx < OPEN_X / 2) {
        row.style.transform = `translateX(${OPEN_X}px)`;
        row.classList.add('swiped');
        openSwipeRow = row;
      } else if (COPY_X && dx > COPY_X / 2) {
        row.style.transform = `translateX(${COPY_X}px)`;
        row.classList.add('swiped-right');
        openSwipeRow = row;
      } else {
        closeSwipeRow(row);
      }
      // 手指剛放開時系統可能補送一次點擊，短時間內忽略
      row.dataset.justSwiped = '1';
      setTimeout(() => { delete row.dataset.justSwiped; }, 350);
    });
    // 掛在外層的捕獲階段，才會比列裡面的按鈕（打勾、編輯、兌換）先執行
    wrap.addEventListener('click', (e) => {
      if (!row.contains(e.target)) return;
      if (row.dataset.justSwiped || row.classList.contains('swiped') || row.classList.contains('swiped-right')) {
        e.stopImmediatePropagation();
        e.preventDefault();
        if (!row.dataset.justSwiped) closeSwipeRow(row);
      }
    }, true);
    wrap.querySelector('[data-swipe-delete]').onclick = () => {
      closeSwipeRow(row);
      onDelete();
    };
    const copyBtn = wrap.querySelector('[data-swipe-copy]');
    if (copyBtn && onCopy) copyBtn.onclick = () => {
      closeSwipeRow(row);
      onCopy();
    };
  }
  function swipeRowHtml(label) {
    return `<button type="button" class="swipe-copy" data-swipe-copy aria-label="複製${escAttr(label)}">複製</button>`
      + `<button type="button" class="swipe-delete" data-swipe-delete aria-label="刪除${escAttr(label)}">刪除</button>`;
  }
  // 複製一份放在原本那一項的下面，名字加「（複製）」，接著打開編輯讓家長改
  function copyName(title) {
    return `${String(title || '').replace(/（複製）$/, '')}（複製）`;
  }
  function copyHabit(habit) {
    const copy = { ...structuredClone(habit), id: h(), title: copyName(habit.title) };
    const i = state.habits.findIndex(x => x.id === habit.id);
    state.habits.splice(i + 1, 0, copy);
    save(); renderToday();
    toast('已複製');
    openHabitForm(copy);
  }
  function copyReward(reward) {
    const copy = { ...structuredClone(reward), id: h(), title: copyName(reward.title) };
    const i = state.rewards.findIndex(x => x.id === reward.id);
    state.rewards.splice(i + 1, 0, copy);
    save(); renderRewards();
    toast('已複製');
    openRewardForm(copy);
  }
  function copyAfterSchoolTask(phaseId, task) {
    const copy = { id: `as-${h()}`, title: copyName(task.title), note: task.note || '', icon: task.icon, points: task.points };
    state.afterSchoolPlan = afterSchoolPlan().map(item => {
      if (item.id !== phaseId) return item;
      const tasks = item.tasks.slice();
      const i = tasks.findIndex(x => x.id === task.id);
      tasks.splice(i + 1, 0, copy);
      return { ...item, tasks };
    });
    state.afterSchoolPlan = normalizeAfterSchoolPlan(state.afterSchoolPlan);
    silencePassedRemindersAfterEdit();
    save();
    renderAfterSchool();
    openAfterSchoolSettingsForm();
    toast('已複製');
  }

  function bindSwipeToDelete(root) {
    root.querySelectorAll('.swipe-row').forEach(wrap => {
      const row = wrap.querySelector('.after-school-editor-task');
      const task = () => afterSchoolTaskById(row.dataset.editAfterSchoolTask);
      bindSwipeRow(wrap, row, () => {
        const t = task();
        if (t) deleteAfterSchoolTask(t.phaseId, t);
      }, {
        onCopy: () => {
          const t = task();
          if (t) copyAfterSchoolTask(t.phaseId, t);
        }
      });
    });
  }

  function deleteHabit(habit) {
    if (!confirm(`刪除「${habit.title}」？`)) return;
    state.habits = state.habits.filter(x => x.id !== habit.id);
    // also clear from today's log
    Object.values(state.log).forEach(l => delete l[habit.id]);
    Object.values(state.timedRuns || {}).forEach(l => delete l[habit.id]);
    save(); closeModal(); renderToday();
  }
  function deleteReward(reward) {
    if (!confirm(`刪除「${reward.title}」？`)) return;
    state.rewards = state.rewards.filter(x => x.id !== reward.id);
    save(); closeModal(); renderRewards();
  }

  function openAfterSchoolTaskForm(phaseId, task) {
    const plan = afterSchoolPlan();
    const phase = plan.find(item => item.id === phaseId);
    if (!phase) return;
    const isNew = !task;
    if (isNew) task = { id: `as-${h()}`, title: '', note: '', icon: phase.tasks[0]?.icon || 'ic-star', points: 2 };
    openModal(`
      <h3 class="modal-title">${isNew ? '新增放學任務' : '編輯放學任務'}</h3>
      <p class="modal-sub">${escHtml(displayPhaseTitle(phase, plan.indexOf(phase)))}</p>
      <form id="after-school-task-form">
        <div class="field">
          <label>任務名稱</label>
          <input name="title" required maxlength="24" placeholder="例：中文故事 15 分鐘" value="${escAttr(task.title)}" />
        </div>
        <div class="field">
          <label>任務小提示</label>
          <input name="note" maxlength="28" placeholder="例：完成後開門票" value="${escAttr(task.note || '')}" />
        </div>
        <div class="field">
          <label>完成可得橡實</label>
          <input name="points" type="number" min="1" max="20" value="${escAttr(task.points || 2)}" required />
        </div>
        ${iconPicker(task.icon)}
        <div class="modal-actions" style="margin-top:18px;">
          <button type="button" class="btn" data-cancel>取消</button>
          ${!isNew ? '<button type="button" class="btn btn-icon btn-danger btn-trash" data-delete-after-school-task><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>' : ''}
          <button type="submit" class="btn btn-primary">儲存</button>
        </div>
      </form>
    `);
    const root = document.getElementById('modal');
    bindIconPicker(root);
    root.querySelector('[data-cancel]').onclick = openAfterSchoolSettingsForm;
    const delBtn = root.querySelector('[data-delete-after-school-task]');
    if (delBtn) delBtn.onclick = () => deleteAfterSchoolTask(phaseId, task);
    root.querySelector('#after-school-task-form').onsubmit = (e) => {
      e.preventDefault();
      const f = e.target;
      const data = {
        id: task.id,
        title: f.title.value.trim() || '未命名任務',
        note: f.note.value.trim(),
        points: Math.max(1, Math.min(20, parseInt(f.points.value, 10) || 1)),
        icon: f.icon.value
      };
      state.afterSchoolPlan = afterSchoolPlan().map(item => {
        if (item.id !== phaseId) return item;
        const tasks = isNew
          ? [...item.tasks, data]
          : item.tasks.map(existing => existing.id === task.id ? data : existing);
        return { ...item, tasks };
      });
      state.afterSchoolPlan = normalizeAfterSchoolPlan(state.afterSchoolPlan);
      silencePassedRemindersAfterEdit();
      save();
      renderAfterSchool();
      openAfterSchoolSettingsForm();
    };
  }

  /* ---------- icon picker ---------- */
  function iconPicker(selectedId, fieldName = 'icon') {
    return `
      <div class="field">
        <label>圖示</label>
        <div class="icon-grid" data-icon-grid>
          ${ICON_LIST.map(id => `
            <button type="button" class="icon-pick ${id === selectedId ? 'active' : ''}" data-icon-pick="${id}">
              ${iconSvg(id, 22, '#5E5453')}
            </button>
          `).join('')}
        </div>
        <input type="hidden" name="${fieldName}" value="${selectedId}" />
      </div>
    `;
  }
  function bindIconPicker(root) {
    root.querySelectorAll('[data-icon-grid]').forEach(grid => {
      grid.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-icon-pick]');
        if (!btn) return;
        grid.querySelectorAll('.icon-pick').forEach(n => n.classList.remove('active'));
        btn.classList.add('active');
        const hidden = grid.parentElement.querySelector('input[type=hidden]');
        if (hidden) hidden.value = btn.dataset.iconPick;
      });
    });
  }

  /* ---------- habit form ---------- */
  function openHabitForm(habit) {
    const isNew = !habit;
    if (isNew) habit = { id: h(), title: '', icon: 'ic-star', points: 2, timed: false, timerMinutes: 30 };
    const timedChecked = isTimedHabit(habit);
    const durationOptions = [30, 60, 180, 480];
    const durationValue = durationOptions.includes(parseInt(habit.timerMinutes, 10)) ? String(habit.timerMinutes) : 'custom';
    const customMinutes = durationValue === 'custom' ? Math.max(1, parseInt(habit.timerMinutes, 10) || 30) : 30;
    openModal(`
      <h3 class="modal-title">${isNew ? '新增習慣' : '編輯習慣'}</h3>
      <p class="modal-sub">每天勾選完成就能拿到橡實</p>
      <form id="habit-form">
        <div class="field">
          <label>習慣名稱</label>
          <input name="title" required maxlength="20" placeholder="例：看書 30 分鐘" value="${escAttr(habit.title)}" />
        </div>
        <div class="field">
          <label>每次完成可得橡實</label>
          <input name="points" type="number" min="1" max="20" value="${habit.points}" required />
        </div>
        <label class="switch-field">
          <input type="checkbox" name="timed" ${timedChecked ? 'checked' : ''}>
          <span>
            <b>限時雙倍任務</b>
            <small>孩子按開始後倒數，完成可拿雙倍橡實</small>
          </span>
        </label>
        <div class="timed-fields" ${timedChecked ? '' : 'hidden'}>
          <div class="field">
            <label>倒數時間</label>
            <select name="timerPreset">
              <option value="30" ${durationValue === '30' ? 'selected' : ''}>30 分鐘</option>
              <option value="60" ${durationValue === '60' ? 'selected' : ''}>1 小時</option>
              <option value="180" ${durationValue === '180' ? 'selected' : ''}>3 小時</option>
              <option value="480" ${durationValue === '480' ? 'selected' : ''}>8 小時</option>
              <option value="custom" ${durationValue === 'custom' ? 'selected' : ''}>自訂</option>
            </select>
          </div>
          <div class="field timed-custom" ${durationValue === 'custom' ? '' : 'hidden'}>
            <label>自訂分鐘數</label>
            <input name="timerCustom" type="number" min="1" max="1440" value="${customMinutes}" />
          </div>
        </div>
        ${iconPicker(habit.icon)}
        <div class="modal-actions" style="margin-top:18px;">
          <button type="button" class="btn" data-cancel>取消</button>
          ${!isNew ? '<button type="button" class="btn btn-icon btn-danger btn-trash" data-delete-habit><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>' : ''}
          <button type="submit" class="btn btn-primary">儲存</button>
        </div>
      </form>
    `);
    const root = document.getElementById('modal');
    bindIconPicker(root);
    const timedToggle = root.querySelector('input[name=timed]');
    const timedFields = root.querySelector('.timed-fields');
    const timerPreset = root.querySelector('select[name=timerPreset]');
    const timedCustom = root.querySelector('.timed-custom');
    function syncTimedFields() {
      timedFields.hidden = !timedToggle.checked;
      timedCustom.hidden = timerPreset.value !== 'custom';
    }
    timedToggle.onchange = syncTimedFields;
    timerPreset.onchange = syncTimedFields;
    syncTimedFields();
    root.querySelector('[data-cancel]').onclick = closeModal;
    const delBtn = root.querySelector('[data-delete-habit]');
    if (delBtn) delBtn.onclick = () => deleteHabit(habit);
    root.querySelector('#habit-form').onsubmit = (e) => {
      e.preventDefault();
      const f = e.target;
      let timerMinutes = parseInt(f.timerPreset.value, 10) || 30;
      if (f.timerPreset.value === 'custom') timerMinutes = parseInt(f.timerCustom.value, 10) || 30;
      timerMinutes = Math.max(1, Math.min(1440, timerMinutes));
      const data = {
        id: habit.id,
        title: f.title.value.trim() || '未命名',
        points: Math.max(1, parseInt(f.points.value, 10) || 1),
        icon: f.icon.value,
        timed: !!f.timed.checked,
        timerMinutes: timerMinutes
      };
      if (!data.timed) delete data.timerMinutes;
      if (isNew) state.habits.push(data);
      else Object.assign(state.habits.find(x=>x.id===habit.id), data);
      save(); closeModal(); renderToday();
    };
  }

  /* ---------- reward form ---------- */
  function openRewardForm(reward) {
    const isNew = !reward;
    if (isNew) reward = { id: h(), title: '', desc: '', icon: 'ic-gift', cost: 10 };
    openModal(`
      <h3 class="modal-title">${isNew ? '新增獎勵' : '編輯獎勵'}</h3>
      <p class="modal-sub">設定一個目標，換到時候會撒花喔 ✨</p>
      <form id="reward-form">
        <div class="field">
          <label>獎勵名稱</label>
          <input name="title" required maxlength="20" placeholder="例：玩具店逛逛" value="${escAttr(reward.title)}" />
        </div>
        <div class="field">
          <label>副標說明（選填）</label>
          <input name="desc" maxlength="30" placeholder="例：週末才能用喔" value="${escAttr(reward.desc || '')}" />
        </div>
        <div class="field">
          <label>需要橡實數</label>
          <input name="cost" type="number" min="1" max="999" value="${reward.cost}" required />
        </div>
        ${iconPicker(reward.icon)}
        <div class="modal-actions" style="margin-top:18px;">
          <button type="button" class="btn" data-cancel>取消</button>
          ${!isNew ? '<button type="button" class="btn btn-icon btn-danger btn-trash" data-delete-reward><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>' : ''}
          <button type="submit" class="btn btn-primary">儲存</button>
        </div>
      </form>
    `);
    const root = document.getElementById('modal');
    bindIconPicker(root);
    root.querySelector('[data-cancel]').onclick = closeModal;
    const delBtn = root.querySelector('[data-delete-reward]');
    if (delBtn) delBtn.onclick = () => deleteReward(reward);
    root.querySelector('#reward-form').onsubmit = (e) => {
      e.preventDefault();
      const f = e.target;
      const data = {
        id: reward.id,
        title: f.title.value.trim() || '未命名',
        desc: (f.desc ? f.desc.value.trim() : ''),
        cost: Math.max(1, parseInt(f.cost.value, 10) || 1),
        icon: f.icon.value
      };
      if (isNew) state.rewards.push(data);
      else Object.assign(state.rewards.find(x=>x.id===reward.id), data);
      save(); closeModal(); renderRewards();
    };
  }

  /* ---------- manage list ---------- */
  // 長按進入排序模式：進入後可直接拖曳清單，直到點其他按鈕或關閉視窗。
  function bindDragSortList(root, list, attr, afterChange) {
    const box = root.querySelector('#manage-list');
    if (!box) return;
    let sorting = false;
    let timer = null;
    let activeRow = null;
    let dragRow = null;
    let dragId = null;
    let pointerId = null;
    let startY = 0;
    let moved = false;
    const REORDER_MS = 500;
    const SCROLL_CANCEL_PX = 30;

    function rows() {
      return Array.from(box.querySelectorAll(`.manage-row[data-${attr}]`));
    }

    function enterSortMode(row) {
      sorting = true;
      box.classList.add('sorting');
      rows().forEach(n => n.classList.add('reorder-active'));
      if (row && navigator.vibrate) navigator.vibrate(40);
    }

    function syncListFromDom() {
      const order = rows().map(row => row.dataset[attr]);
      const byId = new Map(list.map(item => [item.id, item]));
      const sorted = order.map(id => byId.get(id)).filter(Boolean);
      list.splice(0, list.length, ...sorted);
      save();
      afterChange();
    }

    function clearTimer(row) {
      if (timer) { clearTimeout(timer); timer = null; }
      if (row) row.classList.remove('long-pressing');
    }

    function clearWindowDragEvents() {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    }

    function finishDrag() {
      clearTimer(activeRow);
      clearWindowDragEvents();
      if (dragRow) dragRow.classList.remove('dragging');
      dragRow = null;
      dragId = null;
      pointerId = null;
      activeRow = null;
      document.body.classList.remove('drag-sorting');
      if (sorting) syncListFromDom();
    }

    function startDrag(row, e) {
      if (!sorting) enterSortMode(row);
      dragRow = row;
      dragId = row.dataset[attr];
      pointerId = e.pointerId;
      moved = false;
      row.classList.remove('long-pressing');
      row.classList.add('dragging');
      document.body.classList.add('drag-sorting');
    }

    function onPointerDown(e) {
      const row = e.currentTarget;
      if (e.target.closest('button')) return;
      activeRow = row;
      startY = e.clientY;
      moved = false;
      pointerId = e.pointerId;
      window.addEventListener('pointermove', onPointerMove, { passive: false });
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
      row.classList.add('long-pressing');
      timer = setTimeout(() => {
        enterSortMode(row);
        startDrag(row, e);
      }, REORDER_MS);
    }

    function onPointerMove(e) {
      const row = activeRow;
      if (!row || (pointerId !== null && e.pointerId !== pointerId)) return;
      const cancelLongPress = window.SquirrelManageSort
        ? window.SquirrelManageSort.shouldCancelLongPress(e.clientY - startY, SCROLL_CANCEL_PX)
        : Math.abs(e.clientY - startY) > SCROLL_CANCEL_PX;
      if (!dragRow && cancelLongPress) {
        clearTimer(row);
        clearWindowDragEvents();
        activeRow = null;
        pointerId = null;
        return;
      }
      if (!dragRow || dragId !== row.dataset[attr]) return;
      moved = true;
      e.preventDefault();
      const otherRows = rows().filter(n => n !== dragRow);
      const beforeRow = otherRows.find(target => {
        const rect = target.getBoundingClientRect();
        return e.clientY < rect.top + rect.height / 2;
      });
      box.insertBefore(dragRow, beforeRow || null);
    }

    function onPointerUp(e) {
      if (pointerId !== null && e.pointerId !== pointerId) return;
      if (!dragRow) {
        clearTimer(activeRow);
        clearWindowDragEvents();
        activeRow = null;
        pointerId = null;
        return;
      }
      finishDrag();
      e.stopPropagation();
    }

    // 列表平常可以捲動（touch-action: pan-y）；拖曳排序中擋掉捲動，系統才不會中途把拖曳取消
    box.addEventListener('touchmove', (e) => {
      if (dragRow) e.preventDefault();
    }, { passive: false });

    rows().forEach(row => {
      row.addEventListener('pointerdown', onPointerDown);
      row.addEventListener('click', (e) => {
        if (sorting || moved) {
          e.preventDefault();
          e.stopPropagation();
          moved = false;
          return;
        }
        if (e.target.closest('button')) return;
        // 一般點擊 → 編輯
        const id = row.dataset[attr];
        const item = list.find(x => x.id === id);
        if (item) {
          if (attr === 'mh') openHabitForm(item);
          else openRewardForm(item);
        }
      });
    });

    root.querySelectorAll('[data-cancel], #btn-new-habit, #btn-new-reward').forEach(btn => {
      btn.addEventListener('click', () => {
        sorting = false;
        box.classList.remove('sorting');
        rows().forEach(row => row.classList.remove('reorder-active', 'dragging', 'long-pressing'));
      }, { capture: true });
    });
  }

  function buildManageRow(item, attr) {
    const isHabit = attr === 'mh';
    const iconBox = isHabit ? 'habit-icon-box' : 'reward-icon-box';
    const sub = isHabit
      ? (isTimedHabit(item) ? `限時 ${formatDuration(item.timerMinutes)} · +${habitFullPoints(item)} 顆橡實` : `+${item.points} 顆橡實`)
      : `${item.cost} 顆橡實`;
    return `
      <div class="manage-row" data-${attr}="${item.id}">
        <div class="${iconBox}" style="width:40px;height:40px;border-radius:12px;">${iconSvg(item.icon, 22)}</div>
        <div class="info">
          <div class="info-title">${escHtml(item.title)}</div>
          <div class="info-sub">${sub}</div>
        </div>
        <div class="drag-grip" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg>
        </div>
        <svg class="chevron-right" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9c938f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    `;
  }

  function openManageHabits() {
    const render = () => {
      const html = `
        <h3 class="modal-title">管理習慣</h3>
        <p class="manage-hint">點一下編輯，長按 0.5 秒後直接拖曳排序</p>
        <div id="manage-list">
          ${state.habits.map(hb => buildManageRow(hb, 'mh')).join('')}
          ${state.habits.length === 0 ? '<div class="empty">還沒有任何習慣</div>' : ''}
        </div>
        <div class="modal-actions" style="margin-top:14px;">
          <button type="button" class="btn" data-cancel>關閉</button>
          <button type="button" class="btn btn-primary" id="btn-new-habit">＋ 新增習慣</button>
        </div>
      `;
      openModal(html);
      const root = document.getElementById('modal');
      root.querySelector('[data-cancel]').onclick = closeModal;
      root.querySelector('#btn-new-habit').onclick = () => openHabitForm();
      bindDragSortList(root, state.habits, 'mh', renderToday);
    };
    render();
  }

  function openManageRewards() {
    const render = () => {
      const html = `
        <h3 class="modal-title">管理獎勵</h3>
        <p class="manage-hint">點一下編輯，長按 0.5 秒後直接拖曳排序</p>
        <div id="manage-list">
          ${state.rewards.map(rw => buildManageRow(rw, 'mr')).join('')}
          ${state.rewards.length === 0 ? '<div class="empty">還沒有任何獎勵</div>' : ''}
        </div>
        <div class="modal-actions" style="margin-top:14px;">
          <button type="button" class="btn" data-cancel>關閉</button>
          <button type="button" class="btn btn-primary" id="btn-new-reward">＋ 新增獎勵</button>
        </div>
      `;
      openModal(html);
      const root = document.getElementById('modal');
      root.querySelector('[data-cancel]').onclick = closeModal;
      root.querySelector('#btn-new-reward').onclick = () => openRewardForm();
      bindDragSortList(root, state.rewards, 'mr', renderRewards);
    };
    render();
  }

  /* ---------- name editor ---------- */
  function openNameForm() {
    openModal(`
      <h3 class="modal-title">改個稱呼</h3>
      <p class="modal-sub">松鼠想知道要怎麼叫你 🐿️</p>
      <form id="name-form">
        <div class="field">
          <label>你的名字</label>
          <input name="userName" maxlength="10" required value="${escAttr(state.userName)}" autofocus />
        </div>
        <div class="modal-actions">
          <button type="button" class="btn" data-cancel>取消</button>
          <button type="submit" class="btn btn-primary">儲存</button>
        </div>
      </form>
    `);
    const root = document.getElementById('modal');
    root.querySelector('[data-cancel]').onclick = closeModal;
    root.querySelector('#name-form').onsubmit = (e) => {
      e.preventDefault();
      state.userName = e.target.userName.value.trim() || '小朋友';
      save(); closeModal(); renderToday();
    };
  }

  /* ---------- child profiles ---------- */
  function currentScreenId() {
    return screens.find(id => {
      const el = document.getElementById(id);
      return el && !el.hidden;
    }) || 'screen-today';
  }

  function refreshCurrentScreen() {
    const id = currentScreenId();
    if (id === 'screen-rewards') renderRewards();
    else if (id === 'screen-mine') renderMine();
    else if (id === 'screen-bingo') renderBingo();
    else if (id === 'screen-after-school') renderAfterSchool();
    else renderToday();
    updateDockButtons(id);
  }

  function childProfileSummary(child) {
    const rewardCount = (child.redeemed || []).length;
    return `${child.points || 0} 顆橡實 · ${rewardCount} 筆兌換`;
  }

  function blockerInputsHtml(blockers) {
    return blockers.map((item, index) => `
      <div class="field">
        <label>卡住選項 ${index + 1}</label>
        <input name="blocker" maxlength="12" value="${escAttr(item.label)}" placeholder="例：整理書包" />
      </div>
    `).join('');
  }

  function makeChildFromCurrent(name, copySettings) {
    const child = makeChildProfile({ userName: name || '小朋友' }, name || '小朋友');
    if (copySettings) {
      child.habits = structuredClone(state.habits || []);
      child.rewards = structuredClone(state.rewards || []);
      child.afterSchoolSettings = structuredClone(afterSchoolSettings());
      child.afterSchoolPlan = structuredClone(afterSchoolPlan());
    }
    child.points = 0;
    child.log = {};
    child.streak = 0;
    child.lastActiveDate = null;
    child.redeemed = [];
    child.bingoBonuses = {};
    child.timedRuns = {};
    child.afterSchoolLog = {};
    child.afterSchoolReminderLog = {};
    child.dailyReflections = {};
    child.stickerTheme = state.stickerTheme || 'daily';
    child.reflectionBlockers = structuredClone(reflectionBlockers());
    child.birthday = null;
    return child;
  }

  function switchChildProfile(id, closeAfterSwitch = false) {
    const next = appState.children.find(child => child.id === id);
    if (!next) return;
    appState.activeChildId = next.id;
    state = activeChildState();
    if (removeLegacyDefaultHabits(state)) {
      // removeLegacyDefaultHabits mutates the active child profile.
    }
    save();
    if (closeAfterSwitch) {
      closeModal();
      setParentMode(false);
    }
    refreshCurrentScreen();
    if (!closeAfterSwitch) openChildProfilesModal();
    toast(`已切換到 ${state.userName}`);
  }

  function themeSampleStickers(theme) {
    const list = theme.stickers;
    return [0, Math.floor(list.length / 2), list.length - 1].map(i => list[i]);
  }
  function stickerGridHtml(stickers) {
    return `<div class="sticker-preview-grid">${stickers.map(st => `<div class="sticker-preview-cell">${stickerIconHtml(st, 44)}</div>`).join('')}</div>`;
  }
  function bindPreviewBack() {
    document.getElementById('modal').querySelector('[data-preview-back]').onclick = openChildProfilesModal;
  }
  function openThemePreviewModal(themeId) {
    const theme = reflectionRules.STICKER_THEMES[themeId] || reflectionRules.STICKER_THEMES.daily;
    openModal(`
      <h3 class="modal-title">${escHtml(theme.label)}</h3>
      <p class="modal-sub">共 ${theme.stickers.length} 張，完成小回顧時從這裡抽一張。</p>
      ${stickerGridHtml(theme.stickers)}
      <div class="modal-actions">
        <button type="button" class="btn btn-primary" data-preview-back>返回</button>
      </div>
    `);
    bindPreviewBack();
  }
  function openFestivalPreviewModal() {
    const fmt = md => `${parseInt(md.slice(0, 2), 10)}/${parseInt(md.slice(3), 10)}`;
    const active = activeSpecialSet();
    openModal(`
      <h3 class="modal-title">今年的節慶貼紙</h3>
      <p class="modal-sub">節日期間完成小回顧，抽到的就是限定貼紙。拿到的會永遠留在收藏冊，沒拿到的明年再來收集。</p>
      ${reflectionRules.SPECIAL_SETS.map(set => `
        <div class="festival-preview-head">${escHtml(set.label)}<span>${fmt(set.start)} 到 ${fmt(set.end)}${active && active.id === set.id ? ' · 進行中' : ''}</span></div>
        ${stickerGridHtml(set.stickers)}
      `).join('')}
      <div class="festival-preview-head">生日<span>${state.birthday ? `${state.birthday.month}/${state.birthday.day} 前後一週` : '在孩子檔案填生日就會出現'}</span></div>
      ${stickerGridHtml(reflectionRules.BIRTHDAY_SET.stickers)}
      <div class="modal-actions">
        <button type="button" class="btn btn-primary" data-preview-back>返回</button>
      </div>
    `);
    bindPreviewBack();
  }
  function openChildProfilesModal() {
    const rows = appState.children.map(child => {
      const active = child.id === appState.activeChildId;
      return `
        <div class="child-profile-row${active ? ' active' : ''}">
          <div style="min-width:0;">
            <div class="child-profile-name">${escHtml(child.userName || '小朋友')}${active ? ' · 目前' : ''}</div>
            <div class="child-profile-meta">${escHtml(childProfileSummary(child))}</div>
          </div>
          <div class="child-profile-actions">
            ${active ? '' : `<button type="button" class="btn btn-primary" data-switch-child="${escAttr(child.id)}">切換</button>`}
            <button type="button" class="btn" data-rename-child="${escAttr(child.id)}">改名</button>
            ${appState.children.length > 1 ? `<button type="button" class="btn btn-danger" data-delete-child="${escAttr(child.id)}">刪除</button>` : ''}
          </div>
        </div>
      `;
    }).join('');
    openModal(`
      <h3 class="modal-title">孩子檔案</h3>
      <p class="modal-sub">每個孩子各自有任務、橡實、獎勵、放學路線和紀錄。切換後會留在家長模式，點右上鎖頭才上鎖。</p>
      <div class="child-profile-list">${rows}</div>
      <hr style="margin: 20px 0 16px; border: 0; border-top: 1px solid var(--hairline);">
      <form id="reflection-settings-form">
        <h4 class="settings-subtitle">每日小回顧</h4>
        <div class="field">
          <label>貼紙主題（點一下就換）</label>
          <div class="sticker-theme-cards">
            ${Object.values(reflectionRules.STICKER_THEMES).map(theme => `
              <div class="sticker-theme-card${stickerThemeId() === theme.id ? ' selected' : ''}" data-pick-theme="${escAttr(theme.id)}" role="button" tabindex="0">
                <div class="sticker-theme-name">${escHtml(theme.label)}<small>${theme.stickers.length} 張</small></div>
                <div class="sticker-theme-samples">${themeSampleStickers(theme).map(st => stickerIconHtml(st, 30)).join('')}</div>
                <button type="button" class="sticker-theme-all" data-preview-theme="${escAttr(theme.id)}">看全部</button>
              </div>
            `).join('')}
          </div>
          <div class="sticker-theme-note">節慶貼紙會在節日期間自動出現，不用另外設定。</div>
          <button type="button" class="sticker-theme-all sticker-theme-festival" data-preview-festival>看今年的節慶貼紙</button>
        </div>
        <div class="field">
          <label>${escHtml(childName())}的生日（選填，只存在這台裝置）</label>
          <div class="birthday-fields">
            <select name="birthdayMonth">
              <option value="">月</option>
              ${Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}" ${state.birthday && state.birthday.month === i + 1 ? 'selected' : ''}>${i + 1} 月</option>`).join('')}
            </select>
            <select name="birthdayDay">
              <option value="">日</option>
              ${Array.from({ length: 31 }, (_, i) => `<option value="${i + 1}" ${state.birthday && state.birthday.day === i + 1 ? 'selected' : ''}>${i + 1} 日</option>`).join('')}
            </select>
          </div>
          <div class="sticker-theme-note">生日前後一週，小回顧會抽到生日限定貼紙。不填也沒關係。</div>
        </div>
        <div class="reflection-settings-blockers">
          ${blockerInputsHtml(reflectionBlockers())}
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" data-reset-reflection-settings>恢復預設</button>
          <button type="submit" class="btn btn-primary">儲存回顧設定</button>
        </div>
      </form>
      <hr style="margin: 20px 0 16px; border: 0; border-top: 1px solid var(--hairline);">
      <form id="new-child-form">
        <div class="field">
          <label>新增孩子</label>
          <input name="childName" maxlength="10" placeholder="例：姊姊" />
        </div>
        <label class="checkline" style="margin-top:10px;">
          <input type="checkbox" name="copySettings" checked />
          複製目前孩子的任務、獎勵和放學路線
        </label>
        <div class="modal-actions">
          <button type="button" class="btn" data-cancel>關閉</button>
          <button type="submit" class="btn btn-primary">新增</button>
        </div>
      </form>
    `);
    const root = document.getElementById('modal');
    root.querySelector('[data-cancel]').onclick = closeModal;
    root.querySelector('#reflection-settings-form').onsubmit = (e) => {
      e.preventDefault();
      const labels = Array.from(e.target.querySelectorAll('input[name="blocker"]')).map(input => input.value.trim());
      const month = e.target.birthdayMonth.value;
      const day = e.target.birthdayDay.value;
      if ((month || day) && !reflectionRules.normalizeBirthday({ month, day })) {
        alert('生日的月和日要一起選，而且要是存在的日期喔。');
        return;
      }
      state.birthday = reflectionRules.normalizeBirthday({ month, day });
      state.reflectionBlockers = reflectionRules.normalizeBlockers(labels.map((label, index) => ({
        id: (state.reflectionBlockers && state.reflectionBlockers[index] && state.reflectionBlockers[index].id) || '',
        label
      })));
      save();
      openChildProfilesModal();
      refreshCurrentScreen();
      toast('小回顧設定已更新 ★');
    };
    root.querySelectorAll('[data-pick-theme]').forEach(card => {
      const pick = () => {
        state.stickerTheme = card.dataset.pickTheme;
        save();
        root.querySelectorAll('[data-pick-theme]').forEach(item => item.classList.toggle('selected', item === card));
        refreshCurrentScreen();
        toast(`貼紙主題換成「${reflectionRules.STICKER_THEMES[state.stickerTheme].label}」★`);
      };
      card.onclick = (e) => { if (!e.target.closest('[data-preview-theme]')) pick(); };
      card.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } };
    });
    root.querySelectorAll('[data-preview-theme]').forEach(btn => {
      btn.onclick = () => openThemePreviewModal(btn.dataset.previewTheme);
    });
    root.querySelector('[data-preview-festival]').onclick = openFestivalPreviewModal;
    root.querySelector('[data-reset-reflection-settings]').onclick = () => {
      state.stickerTheme = 'daily';
      state.reflectionBlockers = reflectionRules.normalizeBlockers(reflectionRules.DEFAULT_BLOCKERS);
      save();
      openChildProfilesModal();
      refreshCurrentScreen();
      toast('已恢復小回顧預設 ★');
    };
    root.querySelectorAll('[data-switch-child]').forEach(btn => {
      btn.onclick = () => switchChildProfile(btn.dataset.switchChild);
    });
    root.querySelectorAll('[data-rename-child]').forEach(btn => {
      btn.onclick = () => {
        const child = appState.children.find(item => item.id === btn.dataset.renameChild);
        if (!child) return;
        const name = prompt('孩子名字', child.userName || '小朋友');
        if (name === null) return;
        child.userName = name.trim() || child.userName || '小朋友';
        if (child.id === appState.activeChildId) state = child;
        saveAll();
        openChildProfilesModal();
        refreshCurrentScreen();
      };
    });
    root.querySelectorAll('[data-delete-child]').forEach(btn => {
      btn.onclick = () => {
        const child = appState.children.find(item => item.id === btn.dataset.deleteChild);
        if (!child) return;
        if (appState.children.length <= 1) return;
        if (!confirm(`刪除「${child.userName || '小朋友'}」的檔案嗎？\n\n這個孩子的橡實、任務、獎勵和紀錄都會刪掉，無法復原。`)) return;
        appState.children = appState.children.filter(item => item.id !== child.id);
        if (appState.activeChildId === child.id) {
          appState.activeChildId = appState.children[0].id;
          state = activeChildState();
        }
        saveAll();
        openChildProfilesModal();
        refreshCurrentScreen();
      };
    });
    root.querySelector('#new-child-form').onsubmit = (e) => {
      e.preventDefault();
      const f = e.target;
      const name = f.childName.value.trim() || `孩子${appState.children.length + 1}`;
      const child = makeChildFromCurrent(name, f.copySettings.checked);
      appState.children.push(child);
      appState.activeChildId = child.id;
      state = activeChildState();
      saveAll();
      refreshCurrentScreen();
      openChildProfilesModal();
      toast(`已新增並切換到 ${state.userName}`);
    };
  }

  /* ---------- escape ---------- */
  function escHtml(s) { return String(s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }
  function escAttr(s) { return String(s).replace(/"/g, '&quot;'); }

  /* ---------- render: mine ---------- */
  function weekKeys() {
    // 本週週一到週日（ISO style：週一為起點）
    const d = new Date();
    const day = d.getDay() || 7;          // 週日=7
    const monday = new Date(d); monday.setDate(d.getDate() - (day - 1));
    const arr = [];
    for (let i = 0; i < 7; i++) {
      const x = new Date(monday); x.setDate(monday.getDate() + i);
      arr.push({
        key: `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`,
        label: ['一','二','三','四','五','六','日'][i],
        isToday: x.toDateString() === d.toDateString()
      });
    }
    return arr;
  }
  function dayPoints(dateKey) {
    const log = state.log[dateKey] || {};
    const bonus = ((state.bingoBonuses || {})[dateKey] || {}).bonus || 0;
    const afterSchoolPoints = afterSchoolStatusFor(dateKey).earnedPoints || 0;
    return state.habits.reduce((s, h) => s + logEarnedPoints(h, log[h.id]), 0)
         + Object.entries(log).reduce((s, [hid, v]) => {
             // 已被刪掉的習慣：log 還在但找不到 habit，跳過
             return s;
           }, 0)
         + bonus
         + afterSchoolPoints;
  }
  function renderMine() {
    updateDock();
    document.getElementById('mine-page-title').textContent = `${childName()}的小本本`;
    document.getElementById('mine-current').textContent = state.points;
    const days = weekKeys();
    const totals = days.map(d => ({ ...d, val: dayPoints(d.key) }));
    const weekTotal = totals.reduce((s, x) => s + x.val, 0);
    const weekBest = totals.reduce((m, x) => Math.max(m, x.val), 0);
    document.getElementById('mine-week-total').textContent = weekTotal;
    document.getElementById('mine-week-best').textContent = weekBest;

    const max = Math.max(weekBest, 1);
    const bars = document.getElementById('mine-week-bars');
    bars.innerHTML = totals.map(d => {
      const pct = Math.round(d.val / max * 100);
      const h = Math.max(6, pct);
      return `
        <div class="mine-bar-col${d.isToday ? ' today' : ''}">
          <div class="mine-bar-val">${d.val > 0 ? d.val : ''}</div>
          <div class="mine-bar ${d.val === 0 ? 'zero' : ''} ${d.isToday ? 'today' : ''}" style="height:${h}%"></div>
          <div class="mine-bar-day">${d.label}</div>
        </div>
      `;
    }).join('');

    renderCalendar();
    renderStickerCollection();

    const list = document.getElementById('mine-redeemed-list');
    const items = (state.redeemed || []);
    if (items.length === 0) {
      list.innerHTML = '<div class="empty">這個月還沒有兌換紀錄～<br>去獎勵小店挑一個目標吧 ✨</div>';
    } else {
      list.innerHTML = items.map(r => `
        <div class="mine-redeemed">
          <div class="reward-icon-box" style="background:var(--honey)">
            ${iconSvg(r.icon, 24, '#FEFBF9')}
          </div>
          <div class="info">
            <div class="info-title">${escHtml(r.title)}</div>
            <div class="info-sub">${formatDate(r.date)}</div>
          </div>
          <div class="cost-pill">
            ${acornSvg(14)}
            ${r.cost}
          </div>
        </div>
      `).join('');
    }
  }
  let openStickerBookId = null;
  function stickerPeriodText(book) {
    const fmt = md => `${parseInt(md.slice(0, 2), 10)}/${parseInt(md.slice(3), 10)}`;
    if (book.kind === 'season') return `每年 ${fmt(book.start)} 到 ${fmt(book.end)}`;
    if (book.kind === 'birthday') {
      return state.birthday
        ? `每年生日 ${state.birthday.month}/${state.birthday.day} 前後各 3 天`
        : '每年生日前後各 3 天';
    }
    return '完成小回顧就能抽一張';
  }
  function renderStickerCollection() {
    const list = document.getElementById('mine-sticker-list');
    if (!list || !reflectionRules) return;
    const shelf = reflectionRules.stickerBookshelf(state.dailyReflections || {}, todayKey(), state.birthday);
    const book = shelf.find(item => item.id === openStickerBookId);
    if (book) {
      list.innerHTML = `
        <div class="sticker-book-open">
          <button type="button" class="sticker-book-back" data-book-back>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
            回書架
          </button>
          <div class="sticker-book-title">
            <span>${escHtml(book.label)}${book.full ? '<em class="sticker-book-tag full">集滿了</em>' : ''}</span>
            <span class="sticker-book-count">${book.collectedCount}/${book.total}</span>
          </div>
          <div class="sticker-book-period">${escHtml(stickerPeriodText(book))}</div>
          <div class="sticker-album-grid">
            ${book.slots.map(slot => stickerCollectionSlotHtml(Object.assign({ silhouette: true }, slot))).join('')}
          </div>
        </div>
      `;
      list.querySelector('[data-book-back]').onclick = () => {
        openStickerBookId = null;
        renderStickerCollection();
        list.scrollIntoView({ block: 'start', behavior: 'smooth' });
      };
      return;
    }
    openStickerBookId = null;
    const current = reflectionRules.currentSpecialBook(state.dailyReflections || {}, todayKey(), state.birthday);
    list.innerHTML = `
      ${current ? `
        <div class="sticker-current">
          <div class="sticker-book-title">
            <span>${escHtml(current.label)}限定<em class="sticker-book-tag live">進行中</em>${current.full ? '<em class="sticker-book-tag full">集滿了</em>' : ''}</span>
            <span class="sticker-book-count">${current.collectedCount}/${current.total}</span>
          </div>
          <div class="sticker-book-period">${escHtml(stickerPeriodText(current))}，期間結束後會收進書架</div>
          <div class="sticker-album-grid">
            ${current.slots.map(slot => stickerCollectionSlotHtml(Object.assign({ silhouette: true }, slot))).join('')}
          </div>
        </div>
      ` : ''}
      <div class="sticker-shelf">
        ${shelf.map(item => `
          <button type="button" class="sticker-book${item.full ? ' full' : ''}" data-open-book="${escAttr(item.id)}">
            <span class="sticker-book-cover${item.collectedCount ? '' : ' silhouette'}">${stickerIconHtml(item.cover, 48)}</span>
            <span class="sticker-book-name">${escHtml(item.label)}</span>
            ${item.full
              ? '<em class="sticker-book-tag full">集滿了</em>'
              : `<span class="sticker-book-progress">${item.collectedCount}/${item.total}</span>`}
          </button>
        `).join('')}
      </div>
    `;
    list.querySelectorAll('[data-open-book]').forEach(btn => {
      btn.onclick = () => {
        openStickerBookId = btn.dataset.openBook;
        renderStickerCollection();
        list.scrollIntoView({ block: 'start', behavior: 'smooth' });
      };
    });
  }
  function formatDate(key) {
    const [y, m, d] = key.split('-');
    return `${parseInt(m,10)}月${parseInt(d,10)}日`;
  }
  function formatDateShort(key) {
    const [y, m, d] = String(key || '').split('-');
    return m && d ? `${parseInt(m,10)}/${parseInt(d,10)}` : '';
  }
  // 月曆可以往前翻：0 = 這個月，1 = 上個月……最早翻到有紀錄的那個月
  let calendarMonthsBack = 0;
  function earliestRecordMonthsBack() {
    const keys = [state.log, state.bingoBonuses, state.afterSchoolLog, state.dailyReflections]
      .flatMap(obj => Object.keys(obj || {}))
      .filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k))
      .sort();
    if (!keys.length) return 0;
    const [y, m] = keys[0].split('-').map(Number);
    const now = new Date();
    return Math.max(0, (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m));
  }
  // 補登：家長把過去某一天有做到的今日小任務打勾，橡實加進現在的總數；不限日期。
  // 補登的紀錄標 backfilled，月曆上那天右上角會有小橘點
  function openBackfillModal(dayKey) {
    const [y, m, d] = dayKey.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const week = ['日','一','二','三','四','五','六'][date.getDay()];
    const log = state.log[dayKey] || {};
    const picked = new Set(state.habits.filter(hb => isLogDone(log[hb.id])).map(hb => hb.id));
    const check = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 12 10 18 20 6"/></svg>';
    const pointsOf = (hb) => isLogDone(log[hb.id]) ? logEarnedPoints(hb, log[hb.id]) : habitBasePoints(hb);
    openModal(`
      <h3 class="modal-title">補登 ${m}月${d}日（${week}）</h3>
      <p class="modal-sub">把那天有做到的任務打勾，橡實會加進現在的總數。</p>
      <div class="bf-list">
        ${state.habits.map(hb => `
          <button type="button" class="bf-row" data-bf-habit="${escAttr(hb.id)}">
            <span class="bf-icon">${iconSvg(hb.icon, 20, '#5E5453')}</span>
            <span class="bf-text">
              <b>${escHtml(hb.title)}${log[hb.id] && log[hb.id].backfilled ? '<span class="bf-tag">補登</span>' : ''}</b>
              <small>+${pointsOf(hb)} 顆橡實</small>
            </span>
            <span class="bf-check">${check}</span>
          </button>
        `).join('') || '<div class="empty">還沒有今日小任務</div>'}
      </div>
      <div class="bf-sum"><span>這天合計</span><span><b id="bf-total">0</b> 顆橡實</span></div>
      <div class="modal-actions" style="margin-top:14px;">
        <button type="button" class="btn" data-cancel>取消</button>
        <button type="button" class="btn btn-primary" data-bf-save>儲存</button>
      </div>
    `);
    const root = document.getElementById('modal');
    const refresh = () => {
      root.querySelectorAll('[data-bf-habit]').forEach(row => row.classList.toggle('done', picked.has(row.dataset.bfHabit)));
      const total = state.habits.filter(hb => picked.has(hb.id)).reduce((sum, hb) => sum + pointsOf(hb), 0);
      root.querySelector('#bf-total').textContent = total;
    };
    root.querySelectorAll('[data-bf-habit]').forEach(row => {
      row.onclick = () => {
        const id = row.dataset.bfHabit;
        if (picked.has(id)) picked.delete(id); else picked.add(id);
        refresh();
      };
    });
    root.querySelector('[data-cancel]').onclick = closeModal;
    root.querySelector('[data-bf-save]').onclick = () => {
      const next = { ...(state.log[dayKey] || {}) };
      let delta = 0;
      state.habits.forEach(hb => {
        const was = isLogDone(next[hb.id]);
        const now = picked.has(hb.id);
        if (now && !was) {
          const pts = habitBasePoints(hb);
          next[hb.id] = { done: true, points: pts, backfilled: true, completedAt: new Date().toISOString() };
          delta += pts;
        } else if (!now && was) {
          delta -= logEarnedPoints(hb, next[hb.id]);
          delete next[hb.id];
        }
      });
      state.log[dayKey] = next;
      state.points = Math.max(0, state.points + delta);
      save();
      closeModal();
      renderMine();
      if (delta) toast(delta > 0 ? `補登 +${delta} 顆橡實` : `已修正 ${delta} 顆橡實`);
    };
    refresh();
  }

  function renderCalendar() {
    const wrap = document.getElementById('mine-calendar');
    if (!wrap) return;
    // 至少能往回翻 12 個月，家長才能補登更早的紙本紀錄
    const maxBack = Math.max(earliestRecordMonthsBack(), 12);
    calendarMonthsBack = Math.min(Math.max(0, calendarMonthsBack), maxBack);
    const shown = new Date();
    shown.setDate(1);
    shown.setMonth(shown.getMonth() - calendarMonthsBack);
    const year = shown.getFullYear();
    const month = shown.getMonth();
    const monthName = `${year} 年 ${month+1} 月`;
    const firstDay = new Date(year, month, 1);
    const lastDay  = new Date(year, month+1, 0);
    const daysInMonth = lastDay.getDate();
    const startDow = (firstDay.getDay() + 6) % 7; // 週一=0
    const todayStr = todayKey();

    // 算每天分數，找最大值定 level
    const dayScores = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const k = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const log = state.log[k] || {};
      let score = 0;
      state.habits.forEach(h => { score += logEarnedPoints(h, log[h.id]); });
      score += ((state.bingoBonuses || {})[k] || {}).bonus || 0;
      score += afterSchoolStatusFor(k).earnedPoints || 0;
      dayScores[k] = score;
    }
    const maxScore = Math.max(1, ...Object.values(dayScores));
    function levelOf(s) {
      if (s === 0) return '';
      const r = s / maxScore;
      if (r >= 0.85) return 'lv4';
      if (r >= 0.6)  return 'lv3';
      if (r >= 0.3)  return 'lv2';
      return 'lv1';
    }

    let cells = '';
    ['一','二','三','四','五','六','日'].forEach(d => {
      cells += `<div class="mine-cal-dow">${d}</div>`;
    });
    for (let i = 0; i < startDow; i++) cells += '<div class="mine-cal-day empty"></div>';
    for (let d = 1; d <= daysInMonth; d++) {
      const k = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const score = dayScores[k];
      const lv = levelOf(score);
      const isToday = k === todayStr;
      const isPast = k < todayStr;
      const backfilled = Object.values(state.log[k] || {}).some(v => v && v.backfilled);
      cells += `<div class="mine-cal-day ${lv} ${isToday ? 'today' : ''} ${isPast ? 'past' : ''}" title="${score} 顆"${isPast ? ` data-backfill-day="${k}"` : ''}>${d}${backfilled ? '<span class="cal-backfill-dot" aria-label="有補登"></span>' : ''}</div>`;
    }

    wrap.innerHTML = `
      <div class="mine-cal-head">
        <div class="mine-cal-nav">
          <button type="button" class="mine-cal-arrow" data-cal-prev aria-label="上個月" ${calendarMonthsBack >= maxBack ? 'disabled' : ''}>◀</button>
          <div class="mine-cal-month">${monthName}</div>
          <button type="button" class="mine-cal-arrow" data-cal-next aria-label="下個月" ${calendarMonthsBack === 0 ? 'disabled' : ''}>▶</button>
        </div>
        <div class="mine-cal-legend">
          少 <i style="background:#FFF3EE"></i><i style="background:#F7DCD1"></i><i style="background:#EBB95E"></i><i style="background:#e89a6a"></i><i style="background:var(--orange)"></i> 多
        </div>
      </div>
      <div class="mine-cal-grid">${cells}</div>
      <div class="cal-backfill-hint"><i></i>有補登的日子<span class="cal-backfill-parent">　·　點過去的日子可以補登</span></div>
    `;
    // 家長模式點過去的日子：補登那天的今日小任務
    wrap.querySelectorAll('[data-backfill-day]').forEach(cell => {
      cell.onclick = () => {
        if (!document.body.classList.contains('parent-mode')) return;
        openBackfillModal(cell.dataset.backfillDay);
      };
    });
    wrap.querySelector('[data-cal-prev]').onclick = () => { calendarMonthsBack += 1; renderCalendar(); };
    wrap.querySelector('[data-cal-next]').onclick = () => { calendarMonthsBack -= 1; renderCalendar(); };
  }

  /* ---------- event delegation ---------- */
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-toggle],[data-start-timed],[data-edit],[data-redeem],[data-edit-reward],[data-back],[data-after-school-toggle],[data-after-school-next]');
    if (!t) return;
    if (t.dataset.toggle) toggleHabit(t.dataset.toggle, t);
    else if (t.dataset.afterSchoolToggle) toggleAfterSchoolTask(t.dataset.afterSchoolToggle, t);
    else if (t.dataset.afterSchoolNext) toggleAfterSchoolTask(t.dataset.afterSchoolNext, t);
    else if (t.dataset.startTimed) startTimedHabit(t.dataset.startTimed);
    else if (t.dataset.edit) {
      const hb = state.habits.find(x => x.id === t.dataset.edit);
      if (hb) openHabitForm(hb);
    }
    else if (t.dataset.redeem) redeem(t.dataset.redeem);
    else if (t.dataset.editReward) {
      const rw = state.rewards.find(x => x.id === t.dataset.editReward);
      if (rw) openRewardForm(rw);
    }
    else if (t.hasAttribute('data-back')) { showScreen('screen-today'); renderToday(); }
  });

  document.getElementById('modal-backdrop').addEventListener('click', (e) => {
    if (e.target.id === 'modal-backdrop') closeModal();
  });

  /* ---------- 家長模式 ---------- */
  let parentMode = false;  // runtime only, 重開 PWA 自動回兒童

  function setParentMode(on) {
    parentMode = on;
    document.body.classList.toggle('parent-mode', on);
    document.body.classList.toggle('child-mode', !on);
    const banner = document.getElementById('parent-banner');
    if (banner) banner.hidden = !on;
  }
  function shakeModal() {
    const m = document.getElementById('modal');
    if (!m) return;
    m.style.animation = 'none';
    void m.offsetWidth;
    m.style.animation = 'shake .35s ease';
    setTimeout(() => { m.style.animation = ''; }, 400);
  }
  function openParentModal() {
    if (parentMode) {
      // 切回兒童模式（不需密碼）
      setParentMode(false);
      toast('回到孩子模式 ✦');
      return;
    }
    if (!appState.parentPin) {
      // 第一次：引導設定（密碼/秘密題/答案皆可選）
      openModal(`
        <h3 class="modal-title">第一次設定家長模式</h3>
        <p class="modal-sub">三個都可以留空。設了密碼孩子就動不了；設了秘密題萬一忘記密碼可以用它救回 ✦</p>
        <form id="pin-setup-form">
          <div class="field">
            <label>家長密碼（4 位數字，可留空）</label>
            <input name="pin" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" placeholder="例：1234" autofocus />
          </div>
          <div class="field">
            <label>秘密題目（可留空）</label>
            <input name="secretQ" maxlength="40" placeholder="例：媽媽叫什麼" />
          </div>
          <div class="field">
            <label>答案（可留空，大小寫不分）</label>
            <input name="secretA" maxlength="40" placeholder="例：sunny" />
          </div>
          <div class="modal-actions" style="margin-top:18px;">
            <button type="button" class="btn" data-skip>都不設，直接進</button>
            <button type="submit" class="btn btn-primary">儲存進入</button>
          </div>
        </form>
      `);
      const root = document.getElementById('modal');
      root.querySelector('[data-skip]').onclick = () => {
        closeModal(); setParentMode(true); toast('已進入家長模式 ★');
      };
      root.querySelector('#pin-setup-form').onsubmit = (e) => {
        e.preventDefault();
        const f = e.target;
        const pin = f.pin.value.trim();
        const sq  = f.secretQ.value.trim();
        const sa  = f.secretA.value.trim().toLowerCase();
        if (pin && !/^\d{4}$/.test(pin)) { shakeModal(); return; }
        appState.parentPin = pin;
        appState.parentSecretQ = sq;
        appState.parentSecretA = sa;
        saveAll();
        closeModal(); setParentMode(true); toast('已進入家長模式 ★');
      };
      return;
    }
    // 已設密碼：輸入驗證
    const hasSecret = !!(appState.parentSecretQ && appState.parentSecretA);
    openModal(`
      <h3 class="modal-title">輸入家長密碼</h3>
      <p class="modal-sub">4 位數字</p>
      <form id="pin-check-form">
        <div class="field">
          <input name="pin" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" autofocus placeholder="••••" style="text-align:center; font-size:24px; letter-spacing:0.5em;" />
        </div>
        <div class="modal-actions" style="margin-top:18px;">
          <button type="button" class="btn" data-cancel>取消</button>
          <button type="submit" class="btn btn-primary">送出</button>
        </div>
        ${hasSecret ? '<div style="text-align:center;margin-top:14px;"><button type="button" class="btn btn-ghost btn-sm" data-secret style="font-size:12px;padding:6px 14px;">忘記密碼？用秘密題回去</button></div>' : ''}
        <div style="text-align:center;margin-top:10px;font-size:11px;color:var(--ink-muted);line-height:1.5;">
          完全忘記？長按右上鎖頭 5 秒可重置（資料會保留）
        </div>
      </form>
    `);
    const root = document.getElementById('modal');
    root.querySelector('[data-cancel]').onclick = closeModal;
    const secretBtn = root.querySelector('[data-secret]');
    if (secretBtn) secretBtn.onclick = () => { closeModal(); openSecretQModal(); };
    root.querySelector('#pin-check-form').onsubmit = (e) => {
      e.preventDefault();
      const pin = e.target.pin.value.trim();
      if (pin === appState.parentPin) {
        closeModal(); setParentMode(true); toast('進入家長模式 ★');
      } else {
        shakeModal();
        e.target.pin.value = '';
        e.target.pin.focus();
      }
    };
  }
  function openSecretQModal() {
    openModal(`
      <h3 class="modal-title">秘密題救援</h3>
      <p class="modal-sub">${escHtml(appState.parentSecretQ || '')}</p>
      <form id="secret-form">
        <div class="field">
          <label>答案（大小寫不分）</label>
          <input name="ans" maxlength="40" autofocus placeholder="輸入答案" />
        </div>
        <div class="modal-actions" style="margin-top:18px;">
          <button type="button" class="btn" data-cancel>取消</button>
          <button type="submit" class="btn btn-primary">送出</button>
        </div>
      </form>
    `);
    const root = document.getElementById('modal');
    root.querySelector('[data-cancel]').onclick = closeModal;
    root.querySelector('#secret-form').onsubmit = (e) => {
      e.preventDefault();
      const ans = e.target.ans.value.trim().toLowerCase();
      if (ans && ans === (appState.parentSecretA || '').toLowerCase()) {
        closeModal(); setParentMode(true); toast('答對了！進入家長模式 ★');
      } else {
        shakeModal();
        e.target.ans.value = '';
        e.target.ans.focus();
      }
    };
  }
  function hardResetParentLock() {
    if (!confirm('資料保留，只清掉密碼跟秘密題。確定嗎？')) return;
    appState.parentPin = '';
    appState.parentSecretQ = '';
    appState.parentSecretA = '';
    saveAll();
    setParentMode(true);
    toast('密碼已重置 · 進入家長模式 ★');
  }
  async function exportBackup() {
    const now = new Date();
    const text = JSON.stringify(window.SquirrelBackup.buildBackup(appState, now), null, 2);
    const name = window.SquirrelBackup.backupFileName(now);
    const file = new File([text], name, { type: 'application/json' });
    // 手機（含 iOS App）優先用分享選單，可以存到「檔案」或傳給自己；不支援時改成直接下載
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: name });
        toast('備份完成 ★');
      } catch (e) {
        if (e && e.name !== 'AbortError') toast('備份沒有成功，請再試一次');
      }
      return;
    }
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('備份檔已下載 ★');
  }
  async function importBackup(file) {
    let text = '';
    try {
      text = await file.text();
    } catch (e) {
      alert('檔案讀不出來，請重新選擇。');
      return;
    }
    const result = window.SquirrelBackup.parseBackup(text);
    if (!result.ok) {
      alert(result.error);
      return;
    }
    const when = result.exportedAt ? new Date(result.exportedAt).toLocaleString('zh-TW') : '不明時間';
    if (!confirm(`要用這份備份還原嗎？\n\n備份時間：${when}\n孩子人數：${result.childCount} 位\n\n現在這台裝置上的任務、點數、獎勵和紀錄會被備份內容取代。家長密碼維持不變。`)) return;
    appState.children = result.data.children;
    appState.activeChildId = result.data.activeChildId;
    saveAll();
    window.location.reload();
  }
  function openBackupHelpModal() {
    openModal(`
      <h3 class="modal-title">從網頁版搬資料過來</h3>
      <div class="about-body">
        <p><b>第一步：在網頁版備份</b></p>
        <ul>
          <li>用原本的方式打開網頁版松鼠橡實。</li>
          <li>點下方「我的」，拉到最下面，按「備份資料」。</li>
          <li>跳出選單後，選「儲存到檔案」，存在 iCloud 雲碟或「我的 iPhone」都可以。</li>
        </ul>
        <p><b>第二步：在這裡還原</b></p>
        <ul>
          <li>回到這個畫面，按「我用過網頁版，把資料搬過來」。</li>
          <li>選剛剛存的「松鼠橡實備份」檔案就完成了。</li>
        </ul>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-primary" data-cancel>知道了</button>
      </div>
    `);
    document.getElementById('modal').querySelector('[data-cancel]').onclick = closeModal;
  }
  function setupWelcome() {
    const el = document.getElementById('welcome');
    if (!el || !isFirstRun) return;
    el.hidden = false;
    document.body.classList.add('on-welcome');
    const close = () => { el.hidden = true; document.body.classList.remove('on-welcome'); };
    // 按開始就先存一次，下次打開才不會又看到歡迎畫面
    el.querySelectorAll(isNativeApp ? '[data-web-only]' : '[data-app-only]').forEach(b => { b.hidden = true; });
    el.querySelector('[data-welcome-start]').onclick = () => { saveAll(); close(); };
    const fileInput = el.querySelector('[data-welcome-file]');
    el.querySelector('[data-welcome-import]').onclick = () => fileInput.click();
    el.querySelector('[data-welcome-restore]').onclick = () => fileInput.click();
    fileInput.onchange = () => {
      const file = fileInput.files && fileInput.files[0];
      fileInput.value = '';
      if (file) importBackup(file);
    };
    el.querySelector('[data-welcome-help]').onclick = openBackupHelpModal;
  }
  // 首頁公告列：一次露出一則、每 10 秒換下一則、最多 3 則。
  // 按 ✕ 只關掉那一則，以後不再出現；新增公告時換一個新的 id 就會重新出現。
  const NEWS_DISMISSED_KEY = 'squirrel-news-dismissed-v1';
  const NEWS_MAX = 3;
  const NEWS_INTERVAL = 10000;
  function newsItems() {
    return [
      { id: 'backfill-2026', badge: '新功能', text: '忘記勾的日子，可以補登了！', open: openBackfillNewsModal },
      { id: 'special-stickers-2026', badge: '新功能', text: '節慶限定貼紙和生日週來了！', open: openStickerNewsModal },
      { id: 'app-coming-2026', badge: 'NEW', text: '松鼠橡實 App 版即將推出！', webOnly: true, open: openAppTeaserModal }
    ];
  }
  function dismissedNews() {
    let list = [];
    try { list = JSON.parse(localStorage.getItem(NEWS_DISMISSED_KEY) || '[]'); } catch (e) {}
    try { if (localStorage.getItem(APP_TEASER_KEY) === '1') list.push('app-coming-2026'); } catch (e) {}
    return Array.isArray(list) ? list : [];
  }
  function setupNewsBar() {
    if (!isNativeApp) {
      const sub = document.getElementById('mine-backup-sub');
      if (sub) sub.innerHTML = '資料只存在這支手機。<br>先備份一份存到「檔案」，以後換手機或改用 App 版都能搬過去。';
    }
    const bar = document.getElementById('news-bar');
    if (!bar) return;
    const textEl = document.getElementById('news-text');
    const badgeEl = document.getElementById('news-badge');
    const dotsEl = document.getElementById('news-dots');
    let index = 0;
    let timer = null;
    const visible = () => {
      const hidden = dismissedNews();
      return newsItems()
        .filter(item => !(item.webOnly && isNativeApp) && !hidden.includes(item.id))
        .slice(0, NEWS_MAX);
    };
    const show = () => {
      const items = visible();
      if (!items.length) { bar.hidden = true; clearInterval(timer); return; }
      bar.hidden = false;
      index = index % items.length;
      const item = items[index];
      textEl.textContent = item.text;
      badgeEl.textContent = item.badge;
      dotsEl.hidden = items.length < 2;
      dotsEl.innerHTML = items.map((_, i) => `<button type="button" class="news-dot${i === index ? ' active' : ''}" data-news-dot="${i}" aria-label="第 ${i + 1} 則公告"></button>`).join('');
      dotsEl.querySelectorAll('[data-news-dot]').forEach(dot => {
        dot.onclick = () => { index = Number(dot.dataset.newsDot); show(); restart(); };
      });
    };
    const restart = () => {
      clearInterval(timer);
      if (visible().length > 1) timer = setInterval(() => { index += 1; show(); }, NEWS_INTERVAL);
    };
    document.getElementById('news-open').onclick = () => {
      const item = visible()[index];
      if (item) item.open();
    };
    document.getElementById('news-close').onclick = () => {
      const item = visible()[index];
      if (!item) return;
      const list = dismissedNews().concat(item.id);
      try { localStorage.setItem(NEWS_DISMISSED_KEY, JSON.stringify(list)); } catch (e) {}
      show();
      restart();
    };
    show();
    restart();
  }
  function openBackfillNewsModal() {
    openModal(`
      <h3 class="modal-title">忘記勾的日子，可以補登了</h3>
      <div class="about-body">
        <p>有時候孩子做了，但當天忘記在 App 上打勾，或是先記在紙上，現在可以補回來。</p>
        <p>點右上角鎖頭進家長模式，到「我的」頁的月曆，點那一天，把有做到的今日小任務打勾後按儲存，橡實會加進現在的總數。日期不限，多久以前都可以補。</p>
        <p>補登過的日子，月曆上右上角會有一個小橘點。</p>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn" data-cancel>知道了</button>
        <button type="button" class="btn btn-primary" data-go-calendar>去看月曆</button>
      </div>
    `);
    const root = document.getElementById('modal');
    root.querySelector('[data-cancel]').onclick = closeModal;
    root.querySelector('[data-go-calendar]').onclick = () => {
      closeModal();
      showScreen('screen-mine');
      if (typeof renderMine === 'function') renderMine();
      setTimeout(() => document.getElementById('mine-calendar').scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
    };
  }

  function openStickerNewsModal() {
    openModal(`
      <h3 class="modal-title">節慶限定貼紙和生日週</h3>
      <div class="about-body">
        <p>每年過年、暑假、中秋、萬聖節、聖誕節，完成「今天小回顧」抽到的會是節慶限定貼紙。拿到的會永遠收在貼紙書架上，沒拿到的明年再來收集。</p>
        <p>家長也可以在「孩子檔案」填孩子的生日（只要月和日），生日前後一週會抽到生日限定貼紙，生日當天松鼠還會說生日快樂。</p>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn" data-cancel>知道了</button>
        <button type="button" class="btn btn-primary" data-go-stickers>去看我的貼紙</button>
      </div>
    `);
    const root = document.getElementById('modal');
    root.querySelector('[data-cancel]').onclick = closeModal;
    root.querySelector('[data-go-stickers]').onclick = () => {
      closeModal();
      showScreen('screen-mine');
      if (typeof renderMine === 'function') renderMine();
      setTimeout(() => document.getElementById('mine-sticker-list').scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    };
  }
  function openAppTeaserModal() {
    openModal(`
      <h3 class="modal-title">松鼠橡實 App 版即將推出</h3>
      <div class="about-body">
        <p>我們正在把松鼠橡實做成 iPhone App，推出時這裡會通知你。</p>
        <p>現在可以先做一件事：到「我的小本本」最下面按「備份資料」，存一份到「檔案」。以後改用 App 版或換手機，點數、任務和紀錄都能一起搬過去。</p>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn" data-cancel>知道了</button>
        <button type="button" class="btn btn-primary" data-go-backup>去備份</button>
      </div>
    `);
    const root = document.getElementById('modal');
    root.querySelector('[data-cancel]').onclick = closeModal;
    root.querySelector('[data-go-backup]').onclick = () => {
      closeModal();
      showScreen('screen-mine');
      if (typeof renderMine === 'function') renderMine();
      setTimeout(() => document.getElementById('btn-mine-backup').scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
    };
  }
  function openAboutModal() {
    openModal(`
      <h3 class="modal-title">關於松鼠橡實</h3>
      <div class="about-body">
        <p>松鼠橡實是歐的樂星球做的親子任務集點工具。家長設定每天的小任務和獎勵，孩子在家長陪同下完成任務、收集橡實、換獎勵，讓放學後和睡前的流程更看得見。</p>

        <h4>隱私說明</h4>
        <ul>
          <li>不需要建立帳號，不收集 email、電話或真實姓名。</li>
          <li>沒有廣告，也沒有任何追蹤或分析工具。</li>
          <li>孩子的暱稱、生日（只有月和日，選填）、任務、點數、獎勵和紀錄，只存在這台裝置上，不會上傳到任何伺服器。我們也看不到這些資料。</li>
          <li>「備份資料」產生的檔案，只會存到你自己選的地方。備份檔不含家長密碼。</li>
          <li>刪除 App 或使用「清掉全部資料」後，資料就會消失。換手機前請先備份。</li>
        </ul>

        <h4>素材與授權</h4>
        <ul>
          <li>松鼠插圖與 App 圖示：歐的樂星球製作（使用 AI 繪圖工具輔助）。</li>
          <li>小圖示：<b>Lucide</b>（ISC 授權）、<b>Phosphor Icons</b>（MIT 授權）。</li>
          <li>貼紙圖案：All emojis designed by <b>OpenMoji</b> (openmoji.org), the open-source emoji and icon project. License: CC BY-SA 4.0（creativecommons.org/licenses/by-sa/4.0）</li>
          <li>字型：<b>Chiron GoRound TC</b>，採用 SIL Open Font License 1.1 授權。</li>
        </ul>

        <h4>聯絡我們</h4>
        <p>有問題或建議，歡迎到歐的樂星球留言板找我們：<br>sidonie.ca/message-board</p>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-primary" data-cancel>知道了</button>
      </div>
    `);
    document.getElementById('modal').querySelector('[data-cancel]').onclick = closeModal;
  }
  function openChangePinModal() {
    openModal(`
      <h3 class="modal-title">改家長設定</h3>
      <p class="modal-sub">三個欄位都可改、留空 = 移除</p>
      <form id="pin-change-form">
        <div class="field">
          <label>密碼（4 位數字，留空 = 移除）</label>
          <input name="pin" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" placeholder="${appState.parentPin ? '已設定（重打覆蓋）' : '未設定'}" />
        </div>
        <div class="field">
          <label>秘密題目</label>
          <input name="secretQ" maxlength="40" value="${escAttr(appState.parentSecretQ || '')}" placeholder="${appState.parentSecretQ ? '' : '未設定'}" />
        </div>
        <div class="field">
          <label>答案（大小寫不分）</label>
          <input name="secretA" maxlength="40" placeholder="${appState.parentSecretA ? '已設定（重打覆蓋；留空 = 移除）' : '未設定'}" />
        </div>
        <div class="modal-actions">
          <button type="button" class="btn" data-cancel>取消</button>
          <button type="submit" class="btn btn-primary">儲存</button>
        </div>
      </form>
      <div class="backup-zone">
        <div class="backup-zone-title">資料備份</div>
        <p class="backup-zone-sub">資料只存在這台裝置。換手機或刪掉 App 前，先備份一份存到檔案或傳給自己。備份不含家長密碼。</p>
        <div class="backup-zone-actions">
          <button type="button" class="btn btn-ghost" data-backup-export>備份資料</button>
          <button type="button" class="btn btn-ghost" data-backup-import>從備份還原</button>
        </div>
        <input type="file" accept="application/json,.json" data-backup-file hidden>
      </div>
      <button type="button" class="about-link" data-about>關於松鼠橡實・隱私・授權</button>
      <hr style="margin: 26px 0 16px; border: 0; border-top: 1.5px dashed rgba(219,109,102,0.4);">
      <div class="danger-zone">
        <div class="danger-zone-title">⚠ 危險區（不可復原）</div>
        <p class="danger-zone-sub">清掉所有點數、習慣、獎勵、紀錄，App 回到第一次打開的狀態。</p>
        <button type="button" class="btn btn-danger danger-zone-btn" data-clear-all>清掉全部資料重新開始</button>
      </div>
    `);
    const root = document.getElementById('modal');
    root.querySelector('[data-cancel]').onclick = closeModal;
    root.querySelector('#pin-change-form').onsubmit = (e) => {
      e.preventDefault();
      const f = e.target;
      const pin = f.pin.value.trim();
      const sq  = f.secretQ.value.trim();
      const sa  = f.secretA.value.trim().toLowerCase();
      if (pin && !/^\d{4}$/.test(pin)) { shakeModal(); return; }
      appState.parentPin = pin;
      appState.parentSecretQ = sq;
      appState.parentSecretA = sa;
      saveAll();
      closeModal();
      toast('家長設定已更新 ★');
    };
    root.querySelector('[data-about]').onclick = openAboutModal;
    root.querySelector('[data-backup-export]').onclick = exportBackup;
    const fileInput = root.querySelector('[data-backup-file]');
    root.querySelector('[data-backup-import]').onclick = () => fileInput.click();
    fileInput.onchange = () => {
      const file = fileInput.files && fileInput.files[0];
      fileInput.value = '';
      if (file) importBackup(file);
    };
    root.querySelector('[data-clear-all]').onclick = () => {
      if (!confirm('真的要清掉全部資料嗎？\n\n習慣、獎勵、點數、紀錄、家長密碼會全部歸零，無法復原。')) return;
      if (!confirm('最後確認：真的要清掉嗎？')) return;
      localStorage.clear();
      window.location.reload();
    };
  }
  // 長按 5 秒右上鎖頭觸發 hardResetParentLock
  (function bindLongPress() {
    const btn = document.getElementById('parent-toggle');
    let timer = null;
    let fired = false;
    function start() {
      if (timer) return;
      fired = false;
      btn.classList.add('long-press');
      timer = setTimeout(() => {
        fired = true;
        timer = null;
        btn.classList.remove('long-press');
        hardResetParentLock();
      }, 5000);
    }
    function cancel() {
      if (timer) { clearTimeout(timer); timer = null; }
      btn.classList.remove('long-press');
    }
    btn.addEventListener('mousedown', start);
    btn.addEventListener('touchstart', start, { passive: true });
    btn.addEventListener('mouseup', cancel);
    btn.addEventListener('mouseleave', cancel);
    btn.addEventListener('touchend', cancel);
    btn.addEventListener('touchcancel', cancel);
    // capture-phase 吞掉長按完成後跟著的 click（避免又開 modal）
    btn.addEventListener('click', (e) => {
      if (fired) {
        e.stopImmediatePropagation();
        e.preventDefault();
        fired = false;
      }
    }, true);
  })();
  document.getElementById('parent-toggle').onclick = openParentModal;
  document.getElementById('btn-about').onclick = openAboutModal;
  document.getElementById('btn-mine-backup').onclick = exportBackup;
  setupWelcome();
  setupNewsBar();
  document.getElementById('parent-banner').onclick = () => { if (parentMode) openChangePinModal(); };

  document.getElementById('btn-go-today').onclick     = () => goToScreen('today');
  document.getElementById('btn-go-after-school').onclick = () => goToScreen('after-school');
  document.getElementById('btn-go-mine').onclick      = () => goToScreen('mine');
  document.getElementById('btn-go-rewards-2').onclick = () => goToScreen('rewards');
  // 初始化 dock 按鈕（today 頁）
  updateDockButtons('screen-today');
  document.getElementById('btn-manage-habits').onclick = openManageHabits;
  document.getElementById('btn-manage-rewards').onclick = openManageRewards;
  document.getElementById('btn-manage-after-school').onclick = openAfterSchoolSettingsForm;
  document.getElementById('btn-child-profiles').onclick = openChildProfilesModal;
  document.getElementById('btn-after-school-alarm').onclick = toggleAfterSchoolAlarmSound;
  document.getElementById('after-school-alarm-dismiss').onclick = dismissAfterSchoolAlarm;
  document.getElementById('after-school-alarm-snooze').onclick = snoozeAfterSchoolAlarm;
  document.getElementById('btn-open-bingo').onclick = openBingoFromSquirrel;
  document.getElementById('btn-bubble-bingo').onclick = openBingoFromSquirrel;
  document.getElementById('btn-bingo-spin').onclick = finishBingoRound;
  document.getElementById('btn-bingo-back').onclick = () => goToScreen('today');
  document.addEventListener('click', (e) => {
    if (e.target.closest('#btn-open-reflection,#btn-bingo-reflection')) {
      softTapSfx();
      openDailyReflectionModal();
    }
  });
  // 往下捲時加上 is-scrolled，頂端底色帶會延伸到鎖頭高度（見 styles.css body::before）
  const updateScrolledState = () => document.body.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', updateScrolledState, { passive: true });
  // App 版鍵盤套件預設會藏起鍵盤上方的「︿ ﹀ ✓」列；數字鍵盤要靠它收起，所以留著
  const nativeKeyboard = isNativeApp && window.Capacitor.Plugins && window.Capacitor.Plugins.Keyboard;
  if (nativeKeyboard) nativeKeyboard.setAccessoryBarVisible({ isVisible: true }).catch(() => {});
  window.addEventListener('focus', checkDayRollover);
  window.addEventListener('pageshow', checkDayRollover);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      checkDayRollover();
      scheduleNativeReminderSync();
    }
  });
  setInterval(checkDayRollover, 60 * 1000);
  const unlockScreen = document.getElementById('screen-unlock');
  unlockScreen.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  unlockScreen.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });
  document.getElementById('unlock-cta').onclick = () => {
    stopFestivities();
    if (unlockReturnTarget === 'after-school') {
      showScreen('screen-after-school');
      renderAfterSchool();
    } else {
      showScreen('screen-rewards');
      renderRewards();
    }
  };

  /* ---------- init ---------- */
  scheduleNativeReminderSync();
  // App 開著時收到放學提醒通知：系統橫幅不出聲（capacitor.config presentationOptions），改由 App 自己響鬧鐘聲
  const reminderNotifications = nativeNotifications();
  if (reminderNotifications && afterSchoolAlarm) {
    reminderNotifications.addListener('localNotificationReceived', (notification) => {
      if (afterSchoolAlarmReady && afterSchoolAlarm.isNativeReminderId(notification.id)) ringAfterSchoolAlarm();
    });
  }
  if (window.location.hash === '#after-school') {
    goToScreen('after-school');
  } else {
    renderToday();
  }

})();
