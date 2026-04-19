// Star Office UI - 游戏主逻辑
// 依赖: layout.js（必须在这个之前加载）

let supportsWebP = false;

function checkWebPSupport() {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    if (canvas.getContext && canvas.getContext('2d')) {
      resolve(canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0);
    } else resolve(false);
  });
}

function getExt(pngFile) {
  if (pngFile === 'star-working-spritesheet.png') return '.png';
  if (LAYOUT.forcePng && LAYOUT.forcePng[pngFile.replace(/\.(png|webp)$/, '')]) return '.png';
  return supportsWebP ? '.webp' : '.png';
}

const config = {
  type: Phaser.AUTO,
  width: LAYOUT.game.width,
  height: LAYOUT.game.height,
  parent: 'game-container',
  pixelArt: true,
  physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
  scene: { preload: preload, create: create, update: update }
};

let totalAssets = 0, loadedAssets = 0, loadingProgressBar, loadingOverlay, loadingText;

const STATES = {
  idle: { name: '待命', area: 'breakroom' },
  writing: { name: '整理文档', area: 'writing' },
  researching: { name: '搜索信息', area: 'researching' },
  executing: { name: '执行任务', area: 'writing' },
  syncing: { name: '同步备份', area: 'writing' },
  error: { name: '出错了', area: 'error' }
};

const BUBBLE_TEXTS = {
  idle: [
    '待命中：耳朵竖起来了', '随时可以开工', '我在后台给你加 Buff', '小猫说：慢一点也没关系',
    'Capt. Vance: Watching the perimeter.', 'Dr. Moretti: The numbers don\'t lie.',
    'Dr. Simmons: Ethics is not a bug.', 'System: ALL CLEAR'
  ],
  writing: [
    '// 下次再改', '谁写的屎山', '这个bug不是我写的', 'context window爆了',
    'hallucination又来了', 'Dr. Chen: Securing the data pipelines.',
    'Dr. Okoro: Assessing morale...', 'Drafting the mission report...'
  ],
  researching: [
    '我在挖证据链', '找到了：关键在这里', 'OSINT: Global awareness active.',
    'Scanning World Monitor feeds...', 'Tracing digital footprints.'
  ],
  executing: [
    '执行中：不要眨眼', '把任务切成小块', 'Deploying logic to the grid...',
    'Command: EXECUTING'
  ],
  syncing: [
    '同步中：备份不是仪式', '写入中…别断电', 'Cloud link stable.'
  ],
  error: [
    '警报响了：先别慌', '我闻到 bug 的味道了', 'System failure? Just Tuesday.'
  ],
  cat: [ '喵~', '咕噜咕噜…', '有人来看我啦', '今天的罐罐准备好了吗', 'I run this place.' ]
};

let game, star, sofa, serverroom, areas = {}, currentState = 'idle', statusText, lastFetch = 0, lastBubble = 0, targetX = 660, targetY = 170, bubble = null, typewriterText = '', typewriterTarget = '', typewriterIndex = 0, lastTypewriter = 0, syncAnimSprite = null, catBubble = null;
const FETCH_INTERVAL = 2500, BUBBLE_INTERVAL = 6000, CAT_BUBBLE_INTERVAL = 15000, TYPEWRITER_DELAY = 50;
let lastCatBubble = 0, agents = {}, lastAgentsFetch = 0;

const AGENT_COLORS = {
  star: 0xffd700, vance: 0x3b82f6, moretti: 0x8b5cf6, simmons: 0x10b981,
  chen: 0xf43f5e, okoro: 0x06b6d4, default: 0xffffff
};

const AREA_POSITIONS = {
  breakroom: [ { x: 620, y: 180 }, { x: 560, y: 220 }, { x: 680, y: 210 } ],
  writing: [ { x: 760, y: 320 }, { x: 830, y: 280 }, { x: 690, y: 350 } ],
  error: [ { x: 180, y: 260 }, { x: 120, y: 220 }, { x: 240, y: 230 } ]
};

let areaPositionCounters = { breakroom: 0, writing: 0, error: 0 };

function updateLoadingProgress() {
  loadedAssets++;
  const percent = Math.min(100, Math.round((loadedAssets / totalAssets) * 100));
  if (loadingProgressBar) loadingProgressBar.style.width = percent + '%';
  if (loadingText) loadingText.textContent = `COMMAND CREW INITIALIZING... ${percent}%`;
}

function hideLoadingOverlay() {
  setTimeout(() => {
    if (loadingOverlay) {
      loadingOverlay.style.transition = 'opacity 0.5s ease';
      loadingOverlay.style.opacity = '0';
      setTimeout(() => { loadingOverlay.style.display = 'none'; }, 500);
    }
  }, 300);
}

async function initGame() {
  supportsWebP = await checkWebPSupport();
  new Phaser.Game(config);
}

function preload() {
  loadingOverlay = document.getElementById('loading-overlay');
  loadingProgressBar = document.getElementById('loading-progress-bar');
  loadingText = document.getElementById('loading-text');
  totalAssets = 15;
  this.load.on('filecomplete', updateLoadingProgress);
  this.load.on('complete', hideLoadingOverlay);

  const ext = supportsWebP ? '.webp' : '.png';
  this.load.image('office_bg', '/star-office/office_bg_small' + ext);
  this.load.spritesheet('star_idle', '/star-office/star-idle-spritesheet' + getExt('star-idle-spritesheet.png'), { frameWidth: 128, frameHeight: 128 });
  this.load.spritesheet('star_researching', '/star-office/star-researching-spritesheet' + getExt('star-researching-spritesheet.png'), { frameWidth: 128, frameHeight: 105 });
  this.load.spritesheet('star_working', '/star-office/star-working-spritesheet-grid' + ext, { frameWidth: 230, frameHeight: 144 });
  this.load.image('sofa_idle', '/star-office/sofa-idle' + getExt('sofa-idle.png'));
  this.load.spritesheet('sofa_busy', '/star-office/sofa-busy-spritesheet' + getExt('sofa-busy-spritesheet.png'), { frameWidth: 256, frameHeight: 256 });
  this.load.spritesheet('plants', '/star-office/plants-spritesheet' + ext, { frameWidth: 160, frameHeight: 160 });
  this.load.spritesheet('posters', '/star-office/posters-spritesheet' + ext, { frameWidth: 160, frameHeight: 160 });
  this.load.spritesheet('coffee_machine', '/star-office/coffee-machine-spritesheet' + ext, { frameWidth: 230, frameHeight: 230 });
  this.load.spritesheet('serverroom', '/star-office/serverroom-spritesheet' + ext, { frameWidth: 180, frameHeight: 251 });
  this.load.spritesheet('error_bug', '/star-office/error-bug-spritesheet-grid' + ext, { frameWidth: 180, frameHeight: 180 });
  this.load.spritesheet('cats', '/star-office/cats-spritesheet' + ext, { frameWidth: 160, frameHeight: 160 });
  this.load.image('desk_v2', '/star-office/desk-v2.png');
  this.load.spritesheet('flowers', '/star-office/flowers-spritesheet' + ext, { frameWidth: 65, frameHeight: 65 });
  this.load.spritesheet('sync_anim', '/star-office/sync-animation-spritesheet-grid' + ext, { frameWidth: 256, frameHeight: 256 });
}

function create() {
  game = this;
  this.add.image(640, 360, 'office_bg');
  sofa = this.add.sprite(LAYOUT.furniture.sofa.x, LAYOUT.furniture.sofa.y, 'sofa_busy').setOrigin(0,0).setDepth(10);
  this.anims.create({ key: 'sofa_busy', frames: this.anims.generateFrameNumbers('sofa_busy', { start: 0, end: 47 }), frameRate: 12, repeat: -1 });
  this.anims.create({ key: 'star_idle', frames: this.anims.generateFrameNumbers('star_idle', { start: 0, end: 29 }), frameRate: 12, repeat: -1 });
  this.anims.create({ key: 'star_researching', frames: this.anims.generateFrameNumbers('star_researching', { start: 0, end: 95 }), frameRate: 12, repeat: -1 });
  this.anims.create({ key: 'star_working', frames: this.anims.generateFrameNumbers('star_working', { start: 0, end: 191 }), frameRate: 12, repeat: -1 });
  this.anims.create({ key: 'error_bug', frames: this.anims.generateFrameNumbers('error_bug', { start: 0, end: 95 }), frameRate: 12, repeat: -1 });
  this.anims.create({ key: 'coffee_machine', frames: this.anims.generateFrameNumbers('coffee_machine', { start: 0, end: 95 }), frameRate: 12, repeat: -1 });
  this.anims.create({ key: 'serverroom_on', frames: this.anims.generateFrameNumbers('serverroom', { start: 0, end: 39 }), frameRate: 6, repeat: -1 });
  this.anims.create({ key: 'sync_anim', frames: this.anims.generateFrameNumbers('sync_anim', { start: 1, end: 52 }), frameRate: 12, repeat: -1 });
  areas = LAYOUT.areas;
  star = game.physics.add.sprite(areas.breakroom.x, areas.breakroom.y, 'star_idle').setScale(1.4).setAlpha(0.95).setDepth(1200);
  star.anims.play('star_idle', true);
  if (game.textures.exists('sofa_busy')) sofa.anims.play('sofa_busy', true);
  game.add.rectangle(LAYOUT.plaque.x, LAYOUT.plaque.y, LAYOUT.plaque.width, LAYOUT.plaque.height, 0x5d4037).setStrokeStyle(3, 0x3e2723);
  game.add.text(LAYOUT.plaque.x, LAYOUT.plaque.y, 'COMMAND CREW CENTER', { fontFamily: 'ArkPixel, monospace', fontSize: '18px', fill: '#ffd700', fontWeight: 'bold' }).setOrigin(0.5);
  LAYOUT.furniture.plants.forEach(p => game.add.sprite(p.x, p.y, 'plants', Math.floor(Math.random() * 16)).setDepth(p.depth).setInteractive({ useHandCursor: true }));
  window.catSprite = game.add.sprite(LAYOUT.furniture.cat.x, LAYOUT.furniture.cat.y, 'cats', 0).setOrigin(0.5).setDepth(2000).setInteractive({ useHandCursor: true });
  game.add.sprite(LAYOUT.furniture.coffeeMachine.x, LAYOUT.furniture.coffeeMachine.y, 'coffee_machine').setDepth(99).anims.play('coffee_machine', true);
  serverroom = game.add.sprite(LAYOUT.furniture.serverroom.x, LAYOUT.furniture.serverroom.y, 'serverroom', 0).setDepth(2);
  game.add.image(LAYOUT.furniture.desk.x, LAYOUT.furniture.desk.y, 'desk_v2').setDepth(1000);
  window.starWorking = game.add.sprite(LAYOUT.furniture.starWorking.x, LAYOUT.furniture.starWorking.y, 'star_working', 0).setVisible(false).setScale(1.32).setDepth(900);
  window.errorBug = game.add.sprite(LAYOUT.furniture.errorBug.x, LAYOUT.furniture.errorBug.y, 'error_bug', 0).setDepth(50).setVisible(false).setScale(0.9);
  syncAnimSprite = game.add.sprite(LAYOUT.furniture.syncAnim.x, LAYOUT.furniture.syncAnim.y, 'sync_anim', 0).setDepth(40);
  statusText = document.getElementById('status-text');
  fetchActivity();
}

function update(time) {
  if (time - lastFetch > FETCH_INTERVAL) { fetchActivity(); lastFetch = time; }
  const eff = currentState;
  if (serverroom) { if (eff === 'idle') serverroom.anims.stop().setFrame(0); else serverroom.anims.play('serverroom_on', true); }
  if (window.errorBug) {
    if (eff === 'error') { window.errorBug.setVisible(true).anims.play('error_bug', true);
      const p = LAYOUT.furniture.errorBug.pingPong; window.errorBug.x += p.speed * (window.errorBugDir || 1);
      if (window.errorBug.x >= p.rightX) window.errorBugDir = -1; else if (window.errorBug.x <= p.leftX) window.errorBugDir = 1;
    } else window.errorBug.setVisible(false);
  }
  if (syncAnimSprite) { if (eff === 'syncing') syncAnimSprite.anims.play('sync_anim', true); else syncAnimSprite.anims.stop().setFrame(0); }
  if (time - lastBubble > BUBBLE_INTERVAL) { showBubble(); lastBubble = time; }
  if (time - lastCatBubble > CAT_BUBBLE_INTERVAL) { showCatBubble(); lastCatBubble = time; }
  if (typewriterIndex < typewriterTarget.length && time - lastTypewriter > TYPEWRITER_DELAY) { typewriterText += typewriterTarget[typewriterIndex++]; statusText.textContent = typewriterText; lastTypewriter = time; }
  const dx = targetX - star.x, dy = targetY - star.y, dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > 3) { star.x += (dx / dist) * 2.0; star.y += (dy / dist) * 2.0; star.setY(star.y + Math.sin(time / 200) * 0.8); }
}

function normalizeState(s) {
  if (!s) return 'idle';
  if (s === 'working' || s === 'delegating') return 'writing';
  if (s === 'researching') return 'researching';
  return 'idle';
}

function fetchActivity() {
  fetch('/api/agent-activity')
    .then(r => r.json())
    .then(data => {
      const main = data.agents?.[0];
      if (!main) return;
      const nextS = normalizeState(main.status);
      const nextL = `[${main.name}] ${main.activity}`;
      if (nextS !== currentState || typewriterTarget !== nextL) {
        currentState = nextS; typewriterTarget = nextL; typewriterText = ''; typewriterIndex = 0;
        const isIdle = (nextS === 'idle');
        star.setVisible(!isIdle);
        if (window.starWorking) { window.starWorking.setVisible(!isIdle && nextS !== 'researching'); if (window.starWorking.visible) window.starWorking.anims.play('star_working', true); }
        if (nextS === 'researching') star.setVisible(true).anims.play('star_researching', true); else if (star.visible) star.anims.play('star_idle', true);
      }
      areaPositionCounters = { breakroom: 0, writing: 0, error: 0 };
      data.agents.slice(1).forEach(renderAgent);
      data.subagents.forEach(renderAgent);
    });
}

function showBubble() {
  if (bubble) bubble.destroy();
  const texts = BUBBLE_TEXTS[currentState] || BUBBLE_TEXTS.idle;
  if (currentState === 'idle' && Math.random() > 0.3) return;
  let ax = star.x, ay = star.y; if (window.starWorking?.visible) { ax = window.starWorking.x; ay = window.starWorking.y; }
  const txt = texts[Math.floor(Math.random() * texts.length)];
  const bg = game.add.rectangle(ax, ay - 70, txt.length * 9 + 20, 28, 0xffffff, 0.9).setStrokeStyle(2, 0x000000);
  const textObj = game.add.text(ax, ay - 70, txt, { fontFamily: 'ArkPixel, monospace', fontSize: '12px', fill: '#000' }).setOrigin(0.5);
  bubble = game.add.container(0, 0, [bg, textObj]).setDepth(2100);
  setTimeout(() => { if (bubble) bubble.destroy(); }, 5000);
}

function showCatBubble() {
  if (catBubble) catBubble.destroy();
  const txt = BUBBLE_TEXTS.cat[Math.floor(Math.random() * BUBBLE_TEXTS.cat.length)];
  const bg = game.add.rectangle(window.catSprite.x, window.catSprite.y - 60, txt.length * 9 + 20, 24, 0xfffbeb, 0.9).setStrokeStyle(2, 0xd4a574);
  const textObj = game.add.text(window.catSprite.x, window.catSprite.y - 60, txt, { fontFamily: 'ArkPixel, monospace', fontSize: '11px', fill: '#8b6914' }).setOrigin(0.5);
  catBubble = game.add.container(0, 0, [bg, textObj]).setDepth(2100);
  setTimeout(() => { if (catBubble) catBubble.destroy(); }, 4000);
}

function renderAgent(agent) {
  const id = agent.id || agent.agentId, name = agent.name || agent.label, area = (agent.status === 'idle' ? 'breakroom' : 'writing');
  const pos = (AREA_POSITIONS[area] || AREA_POSITIONS.breakroom)[areaPositionCounters[area]++ % 3];
  const color = AGENT_COLORS[name.toLowerCase().split(' ')[0]] || AGENT_COLORS.default;
  if (!agents[id]) {
    const s = game.add.sprite(0, 0, 'star_idle').setScale(1.2).setTint(color); s.anims.play('star_idle', true);
    const l = game.add.text(0, -40, name, { fontFamily: 'ArkPixel', fontSize: '12px', fill: '#fff', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);
    agents[id] = game.add.container(pos.x, pos.y, [s, l]).setDepth(1100);
  } else agents[id].setPosition(pos.x, pos.y);
}

initGame();
