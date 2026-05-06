/* =========================================================
   松鼠點數收集 · PWA app logic — vanilla JS
   ========================================================= */
(function () {
  'use strict';

  /* ---------- storage ---------- */
  const KEY = 'squirrel-points-v3';
  const KEY_OLD = 'squirrel-points-v2';
  const ACTIVE_CHILD_KEY = 'squirrel-active-child-v1';
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
        { id: 'snack-clothes', title: '吃點心、換衣服', note: '先讓身體回到家', icon: 'ic-salad', points: 1 }
      ]
    },
    {
      id: 'ticket',
      title: '遊戲機門票',
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
    pageTitle: '遊戲機門票＋睡前故事',
    pageSubtitle: '先拿遊戲機門票，再把晚上整理好',
    finalRewardName: '得到睡前故事',
    finalRewardCardTitle: '睡前故事',
    finalRewardCardSub: ''
  };
  const OLD_AFTER_SCHOOL_DEFAULTS = {
    pageTitle: '遊戲機門票',
    pageSubtitle: '先拿遊戲機門票，再把晚上收好',
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

  /* ---------- 每日重置：跨日打開時，今天的勾選清空（但 state.points 累積保留） ---------- */
  function dailyReset() {
    const today = todayKey();
    // log 是用日期當 key 的，所以「今天」自動是新的一天空白；不用主動清。
    // 但保險：如果 lastActiveDate 不是今天且不是昨天，把連續天數 reset 為 0
    if (state.lastActiveDate && state.lastActiveDate !== today) {
      const y = new Date(); y.setDate(y.getDate()-1);
      const ydk = `${y.getFullYear()}-${String(y.getMonth()+1).padStart(2,'0')}-${String(y.getDate()).padStart(2,'0')}`;
      if (state.lastActiveDate !== ydk) {
        state.streak = 0;
      }
      save();
    }
  }

  const dayRolloverTracker = window.SquirrelDailyReset
    ? window.SquirrelDailyReset.createDayRolloverTracker(todayKey, () => {
        dailyReset();
        refreshStreak();
        refreshCurrentScreen();
      })
    : { check() { return false; } };

  function checkDayRollover() {
    dayRolloverTracker.check();
  }

  /* ---------- streak (簡易：今天有勾任何一個就 +1，跨日斷掉) ---------- */
  function refreshStreak() {
    const today = todayKey();
    const todayLog = state.log[today] || {};
    const afterSchoolLog = (state.afterSchoolLog || {})[today] || {};
    const anyAfterSchool = Object.values(afterSchoolLog).some(v => v && v.done);
    const anyToday = Object.values(todayLog).some(isLogDone) || anyAfterSchool;
    if (anyToday) {
      if (state.lastActiveDate === today) return;
      const y = new Date(); y.setDate(y.getDate()-1);
      const ydk = `${y.getFullYear()}-${String(y.getMonth()+1).padStart(2,'0')}-${String(y.getDate()).padStart(2,'0')}`;
      state.streak = (state.lastActiveDate === ydk) ? state.streak + 1 : 1;
      state.lastActiveDate = today;
      save();
    }
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

  function normalizeClock(value, fallback = '') {
    const text = String(value || '').trim();
    return /^\d{2}:\d{2}$/.test(text) ? text : fallback;
  }

  function afterSchoolSettings() {
    state.afterSchoolSettings = {
      ...DEFAULT_AFTER_SCHOOL_SETTINGS,
      ...(state.afterSchoolSettings || {})
    };
    if (state.afterSchoolSettings.pageTitle === OLD_AFTER_SCHOOL_DEFAULTS.pageTitle) {
      state.afterSchoolSettings.pageTitle = DEFAULT_AFTER_SCHOOL_SETTINGS.pageTitle;
    }
    if (state.afterSchoolSettings.pageSubtitle === OLD_AFTER_SCHOOL_DEFAULTS.pageSubtitle) {
      state.afterSchoolSettings.pageSubtitle = DEFAULT_AFTER_SCHOOL_SETTINGS.pageSubtitle;
    }
    state.afterSchoolSettings.pageTitle = String(state.afterSchoolSettings.pageTitle || DEFAULT_AFTER_SCHOOL_SETTINGS.pageTitle).trim();
    state.afterSchoolSettings.pageSubtitle = String(
      state.afterSchoolSettings.pageSubtitle || `先拿${state.afterSchoolSettings.ticketTitle || '遊戲機門票'}，再把晚上收好`
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
    const legacyTicketTitle = state.afterSchoolSettings && state.afterSchoolSettings.ticketTitle;
    const legacyReminderTime = state.afterSchoolSettings && state.afterSchoolSettings.reminderTime;
    const source = Array.isArray(plan) ? plan : [];
    const normalized = DEFAULT_AFTER_SCHOOL_PLAN.map((defPhase, phaseIndex) => {
      const raw = source.find(phase => phase && phase.id === defPhase.id) || source[phaseIndex] || defPhase;
      const rawTasks = Array.isArray(raw.tasks) ? raw.tasks : defPhase.tasks;
      let tasks = rawTasks.map(task => ({
        id: task.id || h(),
        title: String(task.title || '未命名任務').trim(),
        note: String(task.note || '').trim(),
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
      const rawTitle = stripPhasePrefix(raw.title);
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
    return stripPhasePrefix(ticketPhase && ticketPhase.title) || '遊戲機門票';
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

  function maybeFireAfterSchoolReminders(plan, log) {
    const today = todayKey();
    state.afterSchoolReminderLog = state.afterSchoolReminderLog || {};
    const daily = (state.afterSchoolReminderLog[today] && typeof state.afterSchoolReminderLog[today] === 'object')
      ? state.afterSchoolReminderLog[today]
      : {};
    let fired = false;
    plan.filter(phase => phase.id === 'ticket' || phase.id === 'evening').forEach(phase => {
      if (!phase.reminderTime || daily[phase.id] || isAfterSchoolPhaseDone(phase, log) || !isAfterSchoolReminderDue(phase.reminderTime)) return;
      daily[phase.id] = true;
      fired = true;
      ding(3);
      toast(`${stripPhasePrefix(phase.title)}提醒時間到了`);
    });
    if (fired) {
      state.afterSchoolReminderLog[today] = daily;
      save();
    }
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

  function renderToday() {
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
        list.appendChild(row);
      });
    }

    document.getElementById('habit-count').textContent =
      visibleHabits.length ? `${visibleHabits.filter(h=>isLogDone(log[h.id])).length}/${visibleHabits.length}` : '';

    // dock
    const cur = todayPoints();
    updateDock();

    // header
    document.getElementById('user-name').textContent = childName();
    document.getElementById('streak-days').textContent = state.streak;
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
    const ticketReminder = document.getElementById('after-school-ticket-reminder');

    document.getElementById('after-school-child-name').textContent = `嗨！${childName()}`;
    document.getElementById('after-school-now').textContent = `現在 ${formatClock()}`;
    document.getElementById('after-school-title').textContent = cfg.pageTitle;
    document.getElementById('after-school-sub').textContent = cfg.pageSubtitle;
    ticketTitle.textContent = ticketName;
    ticketSub.textContent = status.gameTicket.done
      ? `${ticketName}條件都完成了`
      : `已完成 ${status.gameTicket.doneCount}/${status.gameTicket.totalCount}`;
    const reminderPhases = plan.filter(phase => (phase.id === 'ticket' || phase.id === 'evening') && phase.reminderTime);
    ticketReminder.innerHTML = reminderPhases.map(phase => {
      const done = isAfterSchoolPhaseDone(phase, log);
      const due = !done && isAfterSchoolReminderDue(phase.reminderTime);
      const text = `${stripPhasePrefix(phase.title)} ${formatClockShort(phase.reminderTime)} ${done ? '已完成' : (due ? '提醒時間到了' : '提醒')}`;
      return `<span class="ticket-reminder-pill${due ? ' alert' : ''}">${escHtml(text)}</span>`;
    }).join('');
    ticketGate.textContent = status.gameTicket.done ? '獲得門票' : '準備中';
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
              ${isNext && !done ? `<button class="after-school-inline-next" data-after-school-toggle="${task.id}">完成這一關</button>` : ''}
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
    const inlineBtn = row.querySelector('.after-school-inline-next');
    if (inlineBtn) inlineBtn.hidden = true;

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
    refreshStreak();
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
    if (state.habits.length <= 12) return { total: 9, cols: 3, rows: 3 };
    return { total: 16, cols: 4, rows: 4 };
  }
  function bingoConfigFromCells(cells) {
    return (cells || []).length <= 9
      ? { total: 9, cols: 3, rows: 3 }
      : { total: 16, cols: 4, rows: 4 };
  }

  function shuffled(list) {
    const arr = list.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function pickBingoHabits(cfg, log) {
    const all = state.habits.slice();
    if (all.length <= cfg.total) return shuffled(all);

    const selected = shuffled(all).slice(0, cfg.total);
    if (cfg.total !== 9) return selected;

    const allUndone = all.filter(habit => !isLogDone(log[habit.id]));
    const neededWhite = Math.min(2, allUndone.length);
    let selectedUndone = selected.filter(habit => !isLogDone(log[habit.id])).length;
    if (selectedUndone >= neededWhite) return selected;

    const selectedIds = new Set(selected.map(habit => habit.id));
    const extraUndone = shuffled(allUndone.filter(habit => !selectedIds.has(habit.id)));
    while (selectedUndone < neededWhite && extraUndone.length) {
      const replaceIndex = selected.findIndex(habit => isLogDone(log[habit.id]));
      if (replaceIndex < 0) break;
      selected[replaceIndex] = extraUndone.shift();
      selectedUndone++;
    }
    return shuffled(selected);
  }

  function buildBingoCells() {
    const cfg = bingoGridConfig();
    const log = state.log[todayKey()] || {};
    const habits = pickBingoHabits(cfg, log).slice(0, cfg.total);
    const cells = habits.map(habit => ({
      habitId: habit.id,
      title: habit.title,
      icon: habit.icon,
      done: isLogDone(log[habit.id]),
      empty: false
    }));

    let useFree = true;
    while (cells.length < cfg.total) {
      if (useFree) {
        cells.push({ title: 'FREE', icon: 'ic-star', done: true, empty: false, free: true });
      } else {
        cells.push({ title: '橡實', done: false, empty: true, acorn: true });
      }
      useFree = !useFree;
    }
    return shuffled(cells);
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
    const lines = [];
    for (let r = 0; r < cfg.rows; r++) {
      const indexes = [];
      for (let c = 0; c < cfg.cols; c++) indexes.push(r * cfg.cols + c);
      lines.push({ indexes, x1: 6, y1: ((r + 0.5) / cfg.rows) * 100, x2: 94, y2: ((r + 0.5) / cfg.rows) * 100 });
    }
    for (let c = 0; c < cfg.cols; c++) {
      const indexes = [];
      for (let r = 0; r < cfg.rows; r++) indexes.push(r * cfg.cols + c);
      lines.push({ indexes, x1: ((c + 0.5) / cfg.cols) * 100, y1: 6, x2: ((c + 0.5) / cfg.cols) * 100, y2: 94 });
    }
    if (cfg.rows === cfg.cols) {
      const down = [];
      const up = [];
      for (let i = 0; i < cfg.rows; i++) {
        down.push(i * cfg.cols + i);
        up.push(i * cfg.cols + (cfg.cols - 1 - i));
      }
      lines.push({ indexes: down, x1: 8, y1: 8, x2: 92, y2: 92 });
      lines.push({ indexes: up, x1: 92, y1: 8, x2: 8, y2: 92 });
    }
    return lines;
  }

  function completedBingoLines(cells, cfg = bingoGridConfig()) {
    return bingoLineCandidates(cfg).filter(line =>
      line.indexes.every(i => cells[i] && cells[i].done && !cells[i].empty)
    );
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

  function showBingoResult(bonus, before, after, fromEl) {
    const box = document.getElementById('bingo-result');
    const num = document.getElementById('bingo-bonus-num');
    const sub = document.getElementById('bingo-result-sub');
    box.hidden = false;
    sub.textContent = bonus > 0 ? '顆橡實已加進今天' : '今天沒有連線，明天再試';
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
    const bonus = lines.length;
    const after = before + bonus;
    const btn = document.getElementById('btn-bingo-spin');
    btn.disabled = true;
    btn.textContent = '今天已加碼';
    document.getElementById('bingo-lines').innerHTML = '';
    lines.forEach(drawBingoLine);

    state.bingoBonuses[today] = {
      bonus,
      lines: lines.length,
      cells,
      cfg,
      at: new Date().toISOString()
    };
    if (bonus > 0) state.points += bonus;
    save();

    setTimeout(() => showBingoResult(bonus, before, after, btn), 650 * lines.length + 450);
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
    document.getElementById('bingo-lines').innerHTML = '';
    result.hidden = true;

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
      num.textContent = saved.bonus || 0;
      resultSub.textContent = saved.bonus > 0 ? '顆橡實已加進今天' : '今天沒有連線，明天再試';
      sub.textContent = `今天已加碼 +${saved.bonus || 0} 顆，明天再來。`;
      return;
    }

    btn.disabled = false;
    btn.textContent = '好手氣加碼';
    sub.innerHTML = '粉色格子連成線<br>就可以加碼橡實';
    let cells = buildBingoCells();
    renderBingoCells(cells, true);
    stopBingoSpin();
    bingoTimer = setInterval(() => {
      cells = buildBingoCells();
      renderBingoCells(cells, true);
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
        <div>FREE 格是送你的，會一起幫忙連線。</div>
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
      list.appendChild(card);
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
    refreshStreak();
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
          <input name="pageTitle" maxlength="24" value="${escAttr(cfg.pageTitle)}" placeholder="例：遊戲機門票" />
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
                  <button type="button" class="after-school-editor-task" data-edit-after-school-task="${task.id}">
                    <span class="after-school-editor-task-icon">${iconSvg(task.icon, 20, '#5E5453')}</span>
                    <span class="after-school-editor-task-text">
                      <b>${escHtml(task.title)}</b>
                      <small>+${task.points} 顆橡實${task.note ? ` · ${escHtml(task.note)}` : ''}</small>
                    </span>
                    <span class="after-school-editor-task-edit">編輯</span>
                  </button>
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
      save();
      closeModal();
      renderAfterSchool();
      toast('放學設定已更新');
    };
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
    if (delBtn) delBtn.onclick = () => {
      if (!confirm(`刪除「${task.title}」？`)) return;
      state.afterSchoolPlan = afterSchoolPlan().map(item => {
        if (item.id !== phaseId) return item;
        return { ...item, tasks: item.tasks.filter(x => x.id !== task.id) };
      });
      Object.values(state.afterSchoolLog || {}).forEach(log => delete log[task.id]);
      state.afterSchoolPlan = normalizeAfterSchoolPlan(state.afterSchoolPlan);
      save();
      renderAfterSchool();
      openAfterSchoolSettingsForm();
    };
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
      <p class="modal-sub">每天勾選完成就能拿到橡實 🌰</p>
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
    if (delBtn) delBtn.onclick = () => {
      if (!confirm(`刪除「${habit.title}」？`)) return;
      state.habits = state.habits.filter(x => x.id !== habit.id);
      // also clear from today's log
      Object.values(state.log).forEach(l => delete l[habit.id]);
      Object.values(state.timedRuns || {}).forEach(l => delete l[habit.id]);
      save(); closeModal(); renderToday();
    };
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
    if (delBtn) delBtn.onclick = () => {
      if (!confirm(`刪除「${reward.title}」？`)) return;
      state.rewards = state.rewards.filter(x => x.id !== reward.id);
      save(); closeModal(); renderRewards();
    };
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
    const SCROLL_CANCEL_PX = 10;

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
      if (!dragRow && Math.abs(e.clientY - startY) > SCROLL_CANCEL_PX) {
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
    refreshStreak();
    refreshCurrentScreen();
    if (!closeAfterSwitch) openChildProfilesModal();
    toast(`已切換到 ${state.userName}`);
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
    document.getElementById('mine-week-streak').textContent = state.streak;
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
  function formatDate(key) {
    const [y, m, d] = key.split('-');
    return `${parseInt(m,10)}月${parseInt(d,10)}日`;
  }
  function renderCalendar() {
    const wrap = document.getElementById('mine-calendar');
    if (!wrap) return;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
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
      cells += `<div class="mine-cal-day ${lv} ${isToday ? 'today' : ''}" title="${score} 顆">${d}</div>`;
    }

    wrap.innerHTML = `
      <div class="mine-cal-head">
        <div class="mine-cal-month">${monthName}</div>
        <div class="mine-cal-legend">
          少 <i style="background:#FFF3EE"></i><i style="background:#F7DCD1"></i><i style="background:#EBB95E"></i><i style="background:#e89a6a"></i><i style="background:var(--orange)"></i> 多
        </div>
      </div>
      <div class="mine-cal-grid">${cells}</div>
    `;
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
  document.getElementById('btn-open-after-school').onclick = () => goToScreen('after-school');
  document.getElementById('btn-open-bingo').onclick = openBingoFromSquirrel;
  document.getElementById('btn-bingo-spin').onclick = finishBingoRound;
  document.getElementById('btn-bingo-back').onclick = () => goToScreen('today');
  window.addEventListener('focus', checkDayRollover);
  window.addEventListener('pageshow', checkDayRollover);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) checkDayRollover();
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
  dailyReset();
  refreshStreak();
  if (window.location.hash === '#after-school') {
    goToScreen('after-school');
  } else {
    renderToday();
  }

})();
