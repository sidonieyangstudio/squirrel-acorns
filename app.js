/* =========================================================
   松鼠點數收集 · PWA app logic — vanilla JS
   ========================================================= */
(function () {
  'use strict';

  /* ---------- storage ---------- */
  const KEY = 'squirrel-points-v3';
  const KEY_OLD = 'squirrel-points-v2';
  const todayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };

  const ICON_LIST = [
    'ic-cat','ic-candy','ic-flower','ic-gem','ic-gamepad','ic-gift',
    'ic-heart','ic-laugh','ic-popcorn','ic-rocket','ic-cart','ic-sparkles',
    'ic-wand','ic-volleyball','ic-star','ic-toolcase','ic-squirrel','ic-shrub',
    'ic-salad','ic-piano','ic-queen','ic-cherry','ic-caravan',
    'ic-bookopen','ic-booka','ic-apple','ic-backpack','ic-dumbbell','ic-palette'
  ];

  const DEFAULT_STATE = {
    userName: '小寶',
    habits: [
      { id: h(), title: '練習中文',     icon: 'ic-booka',    points: 3 },
      { id: h(), title: '練琴',         icon: 'ic-piano',    points: 3 },
      { id: h(), title: '閱讀繪本',     icon: 'ic-bookopen', points: 3 },
      { id: h(), title: '運動',         icon: 'ic-dumbbell', points: 3 },
      { id: h(), title: '安靜一小時',   icon: 'ic-shrub',    points: 4 },
      { id: h(), title: '友善一小時',   icon: 'ic-heart',    points: 4 }
    ],
    rewards: [
      { id: h(), title: '起司餅乾',   desc: '一包小零食',     icon: 'ic-candy',    cost: 10 },
      { id: h(), title: '開小盲包',   desc: '隨機可愛小物',   icon: 'ic-sparkles', cost: 20 },
      { id: h(), title: '開禮物箱',   desc: '驚喜小禮物一份', icon: 'ic-gift',     cost: 30 },
      { id: h(), title: '材料大禮包', desc: '美勞材料一袋',   icon: 'ic-backpack', cost: 50 },
      { id: h(), title: '玩具鑽石',   desc: '收藏隊長徽章',   icon: 'ic-gem',      cost: 80 }
    ],
    points: 0,                       // 累積總橡實
    log: {},                         // { '2025-05-01': { habitId: true, ... } }
    streak: 0,
    lastActiveDate: null,
    redeemed: [],                    // [{ id, rewardId, title, icon, cost, date }]
    parentPin: ''                    // 家長密碼 4 位數字（空 = 未設定）
  };

  function h() { return Math.random().toString(36).slice(2, 9); }

  let state = load();

  function load() {
    // v2 already exists → use it
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return Object.assign(structuredClone(DEFAULT_STATE), JSON.parse(raw));
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
        return fresh;
      }
    } catch (e) {}
    return structuredClone(DEFAULT_STATE);
  }
  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
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

  /* ---------- streak (簡易：今天有勾任何一個就 +1，跨日斷掉) ---------- */
  function refreshStreak() {
    const today = todayKey();
    const todayLog = state.log[today] || {};
    const anyToday = Object.values(todayLog).some(v => v);
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
  const screens = ['screen-today', 'screen-rewards', 'screen-unlock', 'screen-mine'];
  function showScreen(id) {
    screens.forEach(s => document.getElementById(s).hidden = (s !== id));
    window.scrollTo(0, 0);
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
  /* ---------- 賭城贏錢音效套組：jackpot 三輪琶音 + 金幣嘩啦 + 鈴鐺 + 拉長歡呼 ---------- */
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
    // 賭城贏錢音：jackpot 琶音 + 金幣嘩啦 + 鈴鐺（不疊人群歡呼，避免怪聲）
    jackpotFanfare();
    setTimeout(coinShower, 200);
    setTimeout(bellRing, 800);
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
  function todayPoints() {
    const log = state.log[todayKey()] || {};
    return state.habits.reduce((sum, hab) => sum + (log[hab.id] ? hab.points : 0), 0);
  }
  function maxPointsToday() {
    return state.habits.reduce((s, h) => s + h.points, 0);
  }

  /* ---------- render: today ---------- */
  function renderToday() {
    const today = todayKey();
    const log = state.log[today] || {};
    const list = document.getElementById('habit-list');
    list.innerHTML = '';

    if (state.habits.length === 0) {
      list.innerHTML = '<div class="empty">還沒有習慣～<br>點下方「管理習慣」加一個吧！</div>';
    } else {
      state.habits.forEach(habit => {
        const done = !!log[habit.id];
        const row = document.createElement('div');
        row.className = 'habit' + (done ? ' done' : '');
        row.innerHTML = `
          <div class="habit-icon-box">${iconSvg(habit.icon, 28, '#5E5453')}</div>
          <div class="habit-text">
            <div class="habit-title"></div>
            <div class="habit-sub">
              ${acornSvg(16)}
              <span class="habit-points">+${habit.points} 顆橡實</span>
            </div>
          </div>
          <div class="habit-row-actions">
            <button class="habit-edit" data-edit="${habit.id}" aria-label="編輯">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
            </button>
            <button class="check ${done ? 'done' : ''}" data-toggle="${habit.id}" aria-label="勾選">
              ${done ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 12 10 18 20 6"/></svg>' : ''}
            </button>
          </div>
        `;
        row.querySelector('.habit-title').textContent = habit.title;
        list.appendChild(row);
      });
    }

    document.getElementById('habit-count').textContent =
      state.habits.length ? `${Object.keys(log).filter(k=>log[k]).length}/${state.habits.length}` : '';

    // dock
    const cur = todayPoints();
    const max = maxPointsToday() || 1;
    document.getElementById('dock-current').textContent = cur;
    document.getElementById('dock-target').textContent = maxPointsToday();
    document.getElementById('dock-bar').style.width = Math.min(100, Math.round(cur/max*100)) + '%';

    // header
    document.getElementById('user-name').textContent = state.userName;
    document.getElementById('streak-days').textContent = state.streak;
    const d = new Date();
    const week = ['日','一','二','三','四','五','六'][d.getDay()];
    document.getElementById('today-date').textContent =
      `${d.getMonth()+1}月${d.getDate()}日 · 星期${week}`;
  }

  /* ---------- render: rewards ---------- */
  function renderRewards() {
    document.getElementById('rw-current').textContent = state.points;
    const todayEl = document.getElementById('rw-today');
    if (todayEl) todayEl.textContent = todayPoints();

    const list = document.getElementById('reward-list');
    list.innerHTML = '';
    if (state.rewards.length === 0) {
      list.innerHTML = '<div class="empty">還沒有獎勵～<br>點右上角齒輪新增一個吧！</div>';
      return;
    }

    const sorted = state.rewards.slice().sort((a,b) => a.cost - b.cost);
    const firstLockedId = (sorted.find(r => state.points < r.cost) || {}).id;

    sorted.forEach(rw => {
      const can = state.points >= rw.cost;
      const need = Math.max(0, rw.cost - state.points);
      const isNext = !can && rw.id === firstLockedId;
      const card = document.createElement('div');
      card.className = 'reward' + (can ? ' affordable' : ' locked') + (isNext ? ' next-goal' : '');
      card.innerHTML = `
        ${can ? '<span class="ribbon">✦ 已解鎖</span>' : ''}
        <div class="reward-icon-box">
          ${iconSvg(rw.icon, 32, can ? '#5E5453' : '#9c938f')}
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
            ${can ? '<span class="tag ok"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#5E5453" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 12 10 18 20 6"/></svg> 可兌換</span>' : `<span class="tag warn">還差 ${need} 顆</span>`}
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
  function renderUnlock(reward) {
    const card = document.getElementById('unlock-card');
    const nameTop = document.getElementById('unlock-reward-name');
    if (reward) {
      card.hidden = false;
      const icBox = card.querySelector('.reward-icon-box');
      icBox.innerHTML = iconSvg(reward.icon, 32, '#5E5453');
      document.getElementById('unlock-card-name').textContent = reward.title;
      document.getElementById('unlock-card-sub').textContent = `已扣抵 ${reward.cost} 顆橡實`;
      document.getElementById('unlock-points').textContent = reward.cost;
      if (nameTop) nameTop.textContent = reward.title;
    } else {
      card.hidden = true;
      document.getElementById('unlock-points').textContent = state.points;
      if (nameTop) nameTop.textContent = '';
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
    const colors = ['#DA844F','#C78E78','#F5A3A4','#FBE5A8','#B8C99A','#ef7678'];
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
        animation: `confetti-fall ${4 + Math.random()*2}s ${(Math.random()*0.3).toFixed(2)}s linear forwards`,
        opacity: 0
      });
      p.style.setProperty('--sway', ((Math.random()*140 - 70)) + 'px');
      screen.appendChild(p);
      setTimeout(() => p.remove(), 6500);
    }
  }
  function spawnConfetti() {
    // 同時 ~35 顆彩帶：每 700ms 補 5 顆 × 平均停留 5s = ~35 顆；無縫接續
    document.querySelectorAll('.confetti-piece').forEach(n => n.remove());
    if (confettiTimer) clearInterval(confettiTimer);
    spawnConfettiBatch(8);
    confettiTimer = setInterval(() => spawnConfettiBatch(5), 700);
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
      { x: 18, y:  9, w: 26, h: 26, shape: 'square',       color: '#FBE5A8', rot:  18 },  // 黃方塊
      { x:  8, y: 18, w: 22, h: 22, shape: 'square',       color: '#FFF3EE', rot: -12 },  // 白方塊
      { x: 30, y: 22, w: 16, h: 16, shape: 'circle',       color: '#F5A3A4', rot:   0 },  // 粉點
      { x: 50, y: 14, w: 26, h: 13, shape: 'ellipse',      color: '#B8C99A', rot: -10 },  // 綠橢圓
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
      { x: 50, y: 80, w: 28, h: 28, shape: 'starOutline',  color: '#FBE5A8', rot:  20 },  // 黃星空
      { x: 60, y: 92, w: 22, h:  8, shape: 'stripe',       color: '#C78E78', rot:  10 },  // 棕條
      // 下方右
      { x: 80, y: 72, w: 28, h: 28, shape: 'heartOutline', color: '#F5A3A4', rot:  18 },  // 粉愛心
      { x: 92, y: 86, w: 14, h: 14, shape: 'circle',       color: '#FBE5A8', rot:   0 },  // 黃點
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
  function toggleHabit(id, sourceEl) {
    const today = todayKey();
    const log = state.log[today] || {};
    const habit = state.habits.find(h => h.id === id);
    if (!habit) return;
    const wasDone = !!log[id];
    const before = todayPoints();
    if (wasDone) {
      delete log[id];
      state.points = Math.max(0, state.points - habit.points);
    } else {
      log[id] = true;
      state.points += habit.points;
    }
    state.log[today] = log;
    refreshStreak();
    save();

    if (!wasDone) {
      // 勾選 → 飛 N 顆橡實（依 habit.points） + 叮 N 聲 + 數字跳
      const n = Math.max(1, habit.points);
      ding(n);
      const dockEl = document.querySelector('.dock-label svg');
      flyAcorn(sourceEl, dockEl, n);
      const after = before + habit.points;
      const curEl = document.getElementById('dock-current');
      if (curEl) {
        tweenNumber(curEl, before, after, Math.min(1500, 600 + n * 60));
        curEl.classList.remove('bump');
        void curEl.offsetWidth;
        curEl.classList.add('bump');
      }
      // 等所有飛橡實動畫跑完再 render
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
    if (isNew) habit = { id: h(), title: '', icon: 'ic-star', points: 2 };
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
        ${iconPicker(habit.icon)}
        <div class="modal-actions" style="margin-top:18px;">
          ${!isNew ? '<button type="button" class="btn btn-icon btn-danger btn-trash" data-delete-habit><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>' : ''}
          <button type="button" class="btn" data-cancel>取消</button>
          <button type="submit" class="btn btn-primary">儲存</button>
        </div>
      </form>
    `);
    const root = document.getElementById('modal');
    bindIconPicker(root);
    root.querySelector('[data-cancel]').onclick = closeModal;
    const delBtn = root.querySelector('[data-delete-habit]');
    if (delBtn) delBtn.onclick = () => {
      if (!confirm(`刪除「${habit.title}」？`)) return;
      state.habits = state.habits.filter(x => x.id !== habit.id);
      // also clear from today's log
      Object.values(state.log).forEach(l => delete l[habit.id]);
      save(); closeModal(); renderToday();
    };
    root.querySelector('#habit-form').onsubmit = (e) => {
      e.preventDefault();
      const f = e.target;
      const data = {
        id: habit.id,
        title: f.title.value.trim() || '未命名',
        points: Math.max(1, parseInt(f.points.value, 10) || 1),
        icon: f.icon.value
      };
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
          ${!isNew ? '<button type="button" class="btn btn-icon btn-danger btn-trash" data-delete-reward><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>' : ''}
          <button type="button" class="btn" data-cancel>取消</button>
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
  function openManageHabits() {
    openModal(`
      <h3 class="modal-title">管理習慣</h3>
      <p class="modal-sub">點任一個可編輯，或新增一個 ✏️</p>
      <div id="manage-list">
        ${state.habits.map(hb => `
          <div class="manage-row" data-mh="${hb.id}">
            <div class="habit-icon-box">${iconSvg(hb.icon, 22)}</div>
            <div class="info">
              <div class="info-title">${escHtml(hb.title)}</div>
              <div class="info-sub">+${hb.points} 顆橡實</div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9c938f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        `).join('')}
        ${state.habits.length === 0 ? '<div class="empty">還沒有任何習慣</div>' : ''}
      </div>
      <div class="modal-actions" style="margin-top:14px;">
        <button type="button" class="btn" data-cancel>關閉</button>
        <button type="button" class="btn btn-primary" id="btn-new-habit">＋ 新增習慣</button>
      </div>
    `);
    const root = document.getElementById('modal');
    root.querySelector('[data-cancel]').onclick = closeModal;
    root.querySelector('#btn-new-habit').onclick = () => openHabitForm();
    root.querySelectorAll('[data-mh]').forEach(row => {
      row.onclick = () => {
        const id = row.dataset.mh;
        const hb = state.habits.find(x => x.id === id);
        if (hb) openHabitForm(hb);
      };
    });
  }

  function openManageRewards() {
    openModal(`
      <h3 class="modal-title">管理獎勵</h3>
      <p class="modal-sub">點任一個可編輯，或新增一個 ✨</p>
      <div id="manage-list">
        ${state.rewards.map(rw => `
          <div class="manage-row" data-mr="${rw.id}">
            <div class="reward-icon-box" style="width:40px;height:40px;border-radius:12px;">${iconSvg(rw.icon, 22)}</div>
            <div class="info">
              <div class="info-title">${escHtml(rw.title)}</div>
              <div class="info-sub">${rw.cost} 顆橡實</div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9c938f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        `).join('')}
        ${state.rewards.length === 0 ? '<div class="empty">還沒有任何獎勵</div>' : ''}
      </div>
      <div class="modal-actions" style="margin-top:14px;">
        <button type="button" class="btn" data-cancel>關閉</button>
        <button type="button" class="btn btn-primary" id="btn-new-reward">＋ 新增獎勵</button>
      </div>
    `);
    const root = document.getElementById('modal');
    root.querySelector('[data-cancel]').onclick = closeModal;
    root.querySelector('#btn-new-reward').onclick = () => openRewardForm();
    root.querySelectorAll('[data-mr]').forEach(row => {
      row.onclick = () => {
        const id = row.dataset.mr;
        const rw = state.rewards.find(x => x.id === id);
        if (rw) openRewardForm(rw);
      };
    });
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
    return state.habits.reduce((s, h) => s + (log[h.id] ? h.points : 0), 0)
         + Object.entries(log).reduce((s, [hid, v]) => {
             // 已被刪掉的習慣：log 還在但找不到 habit，跳過
             return s;
           }, 0);
  }
  function renderMine() {
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
            ${iconSvg(r.icon, 24, '#5E5453')}
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
      state.habits.forEach(h => { if (log[h.id]) score += h.points; });
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
          少 <i style="background:#FFF3EE"></i><i style="background:#FBE5A8"></i><i style="background:#F7DCD1"></i><i style="background:#e89a6a"></i><i style="background:var(--orange)"></i> 多
        </div>
      </div>
      <div class="mine-cal-grid">${cells}</div>
    `;
  }

  /* ---------- event delegation ---------- */
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-toggle],[data-edit],[data-redeem],[data-edit-reward],[data-back]');
    if (!t) return;
    if (t.dataset.toggle) toggleHabit(t.dataset.toggle, t);
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
    if (!state.parentPin) {
      // 第一次：引導設定（可略過）
      openModal(`
        <h3 class="modal-title">第一次設定家長模式</h3>
        <p class="modal-sub">設一個 4 位數字密碼，孩子就不能改設定。也可以選「不設密碼」直接進去 ✦</p>
        <form id="pin-setup-form">
          <div class="field">
            <label>新密碼（4 位數字）</label>
            <input name="pin" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" placeholder="例：1234" autofocus />
          </div>
          <div class="modal-actions" style="margin-top:18px;">
            <button type="button" class="btn" data-skip>不設密碼，直接進入</button>
            <button type="submit" class="btn btn-primary">儲存並進入</button>
          </div>
        </form>
      `);
      const root = document.getElementById('modal');
      root.querySelector('[data-skip]').onclick = () => {
        closeModal(); setParentMode(true); toast('已進入家長模式 ★');
      };
      root.querySelector('#pin-setup-form').onsubmit = (e) => {
        e.preventDefault();
        const pin = e.target.pin.value.trim();
        if (!/^\d{4}$/.test(pin)) { shakeModal(); return; }
        state.parentPin = pin; save();
        closeModal(); setParentMode(true); toast('密碼已設好，進入家長模式 ★');
      };
      return;
    }
    // 已設密碼：輸入驗證
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
          <button type="button" class="btn btn-ghost btn-sm" data-forget style="flex:0;font-size:11px;padding:6px 10px;">忘記密碼？</button>
        </div>
      </form>
    `);
    const root = document.getElementById('modal');
    root.querySelector('[data-cancel]').onclick = closeModal;
    root.querySelector('[data-forget]').onclick = () => {
      if (confirm('忘記密碼會清掉舊密碼，需要重新設定一個新的。要繼續嗎？')) {
        state.parentPin = ''; save();
        closeModal(); openParentModal();
      }
    };
    root.querySelector('#pin-check-form').onsubmit = (e) => {
      e.preventDefault();
      const pin = e.target.pin.value.trim();
      if (pin === state.parentPin) {
        closeModal(); setParentMode(true); toast('進入家長模式 ★');
      } else {
        shakeModal();
        e.target.pin.value = '';
        e.target.pin.focus();
      }
    };
  }
  function openChangePinModal() {
    openModal(`
      <h3 class="modal-title">改家長密碼</h3>
      <p class="modal-sub">設定新的 4 位數字密碼，或清空送出 = 移除密碼</p>
      <form id="pin-change-form">
        <div class="field">
          <label>新密碼（留空 = 不設密碼）</label>
          <input name="pin" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" placeholder="${state.parentPin ? '已設定' : '未設定'}" />
        </div>
        <div class="modal-actions">
          <button type="button" class="btn" data-cancel>取消</button>
          <button type="submit" class="btn btn-primary">儲存</button>
        </div>
      </form>
    `);
    const root = document.getElementById('modal');
    root.querySelector('[data-cancel]').onclick = closeModal;
    root.querySelector('#pin-change-form').onsubmit = (e) => {
      e.preventDefault();
      const pin = e.target.pin.value.trim();
      if (pin && !/^\d{4}$/.test(pin)) { shakeModal(); return; }
      state.parentPin = pin; save();
      closeModal();
      toast(pin ? '密碼已更新 ★' : '密碼已移除');
    };
  }
  document.getElementById('parent-toggle').onclick = openParentModal;
  document.getElementById('parent-banner').onclick = () => { if (parentMode) openChangePinModal(); };

  document.getElementById('btn-go-mine').onclick = () => { showScreen('screen-mine'); renderMine(); };
  document.getElementById('btn-go-rewards-2').onclick = () => { showScreen('screen-rewards'); renderRewards(); };
  document.getElementById('btn-manage-habits').onclick = openManageHabits;
  document.getElementById('btn-manage-rewards').onclick = openManageRewards;
  document.getElementById('btn-edit-name').onclick = openNameForm;
  document.getElementById('unlock-cta').onclick = () => { stopFestivities(); showScreen('screen-rewards'); renderRewards(); };

  /* ---------- init ---------- */
  dailyReset();
  refreshStreak();
  renderToday();

})();
