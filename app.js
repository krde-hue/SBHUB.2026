/* ==========================================
   1. GLOBAL CRASH-PROOF LAMP LOGIN ENGINE
   ========================================== */

let inactivityTimer = null;
const INACTIVITY_LIMIT = 30 * 60 * 1000;

window.playClickSound = function() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const audioCtx = new AudioCtx();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine'; 
    osc.frequency.setValueAtTime(520, audioCtx.currentTime); 
    osc.frequency.exponentialRampToValueAtTime(180, audioCtx.currentTime + 0.08); 
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime); 
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08); 
    osc.connect(gain); 
    gain.connect(audioCtx.destination); 
    osc.start(); 
    osc.stop(audioCtx.currentTime + 0.08);
  } catch(e) {}
};

window.toggleLamp = function(event) {
  if (event && event.stopPropagation) event.stopPropagation();
  window.playClickSound();

  const cordEl = document.getElementById("pullCord");
  if (cordEl) {
    cordEl.classList.remove("bouncing");
    void cordEl.offsetWidth; // Force CSS reflow
    cordEl.classList.add("bouncing");
  }

  document.body.classList.toggle("lamp-is-on");

  if (document.body.classList.contains("lamp-is-on")) {
    setTimeout(() => {
      const pwdInput = document.getElementById("loginPassword");
      if (pwdInput) pwdInput.focus();
    }, 300);
  }
};

window.verifyLogin = function() {
  const pwdInput = document.getElementById("loginPassword");
  const errEl = document.getElementById("loginError");
  if (!pwdInput) return;

  if (pwdInput.value === "sb2026") {
    if (errEl) errEl.innerText = "";
    const authOverlay = document.getElementById("authOverlay");
    if (authOverlay) authOverlay.classList.add("unlocked");
    document.body.classList.remove("lamp-is-on");
    pwdInput.value = "";
    
    const rememberChk = document.getElementById("rememberMeCheckbox");
    if (rememberChk && rememberChk.checked) {
      localStorage.setItem("sbhub_remember_me", "true");
    } else {
      localStorage.removeItem("sbhub_remember_me");
    }
    window.resetInactivityTimer();
  } else {
    if (errEl) errEl.innerText = "Incorrect password!";
  }
};

window.triggerLogout = function() {
  localStorage.removeItem("sbhub_remember_me");
  const modal = document.getElementById("settingsModal");
  if (modal) modal.style.display = "none";
  const authOverlay = document.getElementById("authOverlay");
  if (authOverlay) authOverlay.classList.remove("unlocked");
  document.body.classList.remove("lamp-is-on");
};

window.resetInactivityTimer = function() {
  clearTimeout(inactivityTimer);
  const authOverlay = document.getElementById("authOverlay");
  if (!authOverlay || !authOverlay.classList.contains("unlocked")) return;
  
  inactivityTimer = setTimeout(() => {
    if (localStorage.getItem("sbhub_remember_me") !== "true") {
      authOverlay.classList.remove("unlocked");
      document.body.classList.remove("lamp-is-on");
    }
  }, INACTIVITY_LIMIT);
};

window.checkRememberedSession = function() {
  const isRemembered = localStorage.getItem("sbhub_remember_me") === "true";
  if (isRemembered) {
    const authOverlay = document.getElementById("authOverlay");
    if (authOverlay) authOverlay.classList.add("unlocked");
    const rememberChk = document.getElementById("rememberMeCheckbox");
    if (rememberChk) rememberChk.checked = true;
    window.resetInactivityTimer();
  }
};


/* ==========================================
   2. GLOBAL UTILITIES & DATA REGISTRIES
   ========================================== */

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const wallpaperPresets = [
  { id: "green_default", name: "Merry Christmas Green (Default)", type: "dark", url: "green.jpg" },
  { id: "minimalist_bg", name: "Winter Minimalist", type: "light", url: "minimalist.jpg" },
  { id: "santa_bg", name: "Festive Santa", type: "dark", url: "santa.jpg" },
  { id: "merry_christmas_default", name: "Christmas Tree Scene", type: "dark", url: "https://images.unsplash.com/photo-1543589077-47d81606c1bf?q=80&w=1600&auto=format&fit=crop" },
  { id: "winter_wonderland_default", name: "Winter Wonderland", type: "light", url: "https://images.unsplash.com/photo-1513297887119-d46091b24bfa?q=80&w=1600&auto=format&fit=crop" },
  { id: "festive_default", name: "Sportsbook Hub Festive", type: "dark", url: "https://images.unsplash.com/photo-1512389142860-9c449e58a543?q=80&w=1600&auto=format&fit=crop" },
  { id: "orig", name: "Sportsbook Hub (Original)", type: "dark", url: "https://raw.githubusercontent.com/krde-hue/SBHUB.2026/main/SB%20background.jpg" },
  { id: "nature1", name: "Nature Forest 4K", type: "dark", url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1600&auto=format&fit=crop" },
  { id: "nature2", name: "Mountain Lake 4K", type: "dark", url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1600&auto=format&fit=crop" },
  { id: "sports1", name: "Stadium Arena HD", type: "dark", url: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1600&auto=format&fit=crop" },
  { id: "sports2", name: "Football Pitch HD", type: "dark", url: "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=1600&auto=format&fit=crop" },
  { id: "plain_white", name: "Pearl White (Plain)", type: "light", url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop" },
  { id: "plain_black", name: "Slate Carbon (Plain)", type: "dark", url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1600&auto=format&fit=crop" },
  { id: "clear1", name: "Clear Blue Sky", type: "dark", url: "https://images.unsplash.com/photo-1534088568595-a066f410bcda?q=80&w=1600&auto=format&fit=crop" },
  { id: "clear2", name: "Clear Ocean View", type: "light", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600&auto=format&fit=crop" },
  { id: "clear3", name: "Cyber Minimal Gradient", type: "dark", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1600&auto=format&fit=crop" }
];

const widgetRegistry = {
  timezonesCard: "World Clock", weatherCard: "Weather PH", topGamesCard: "Next Day Top Games",
  flashscoreCard: "Flashscore Hub", trendCard: "Monitoring Trend", quickDockCard: "Directory Dock",
  dailyTaskCard: "Daily Task Dock", handoverCard: "Handover Tasks", currentDutyCard: "Live Time-Slot Duties"
};

let widgetVisibilityState = {
  timezonesCard: true, weatherCard: true, topGamesCard: true, flashscoreCard: true,
  trendCard: true, quickDockCard: true, dailyTaskCard: true, handoverCard: true, currentDutyCard: true
};

const menuData = [
  { category: "INTERNAL", icon: "bx-home-alt", subs: [{ name: "DAILY DUTY", url: "duties.html" }, { name: "ROTA", url: "rota.html" }, { name: "HANDOVER", url: "handover.html" }] },
  { category: "DAILY TASK", icon: "bx-task", subs: [
    { name: "SPORTS OFFER CHECK", url: "https://docs.google.com/spreadsheets/d/1-sft6uXe-D4GlDng96bMfWcOC4492WA3lkuO8gaUqQ4/edit?usp=sharing" },
    { name: "PREDICTION OFFER CHECK", url: "https://polymarket.com/breaking" },
    { name: "TOP PICKS", url: "boostschedule.html" },
    { name: "EDGE BOOST (MIG)", url: "https://docs.google.com/spreadsheets/d/1Pl8XVaYNEaupKx57HlXbWibsIeR7a28UfemRasxJ8RY/edit?gid=1450723096#gid=1450723096" },
    { name: "IBET BOOST (MIG)", url: "https://docs.google.com/spreadsheets/d/18ZJNs7wJ37-4sAHX5CNMfqQQcmpfy1cIvP19tHI7rY4/edit?gid=933404962#gid=933404962" },
    { name: "EDGE BOOST (EXCEL)", url: "https://docs.google.com/spreadsheets/d/1E-34VRXSaQG0oFrNPjfxLZe8L05oNYWXcoX-rDhdVCE/edit?gid=477417890#gid=477417890" },
    { name: "IBET BOOST (EXCEL)", url: "https://docs.google.com/spreadsheets/d/1gjkUVpMM3AuABSsWRcq0oD-72_ttWNHTE7yagCWFPLE/edit?gid=807815114#gid=807815114" }
  ] },
  { category: "DAILY MONITORING", icon: "bx-line-chart", subs: [{ name: "GREEN TRACKER", url: "https://docs.google.com/spreadsheets/d/1qruVq-HZCyM0uDgnYSqFhccXKnMkqJ8z/edit?gid=1305147410#gid=1305147410" }, { name: "RED TRACKER", url: "https://docs.google.com/spreadsheets/d/1OcaMz_AOUeRsWIVplbnk2XAna62m3IKa/edit?gid=457800468#gid=457800468" }, { name: "ORANGE TRACKER", url: "https://docs.google.com/spreadsheets/d/1U-Dmc628kHQabzJGoBeEgRus5PiRhgSd/edit?pli=1&gid=1983372695#gid=1983372695" }, { name: "7A TRACKER", url: "#" }, { name: "GREEN CRM", url: "https://docs.google.com/spreadsheets/d/11STKO4Xsj0a8iTuUXSCXC-XEE4-7qmF9/edit?pli=1&gid=1701374259#gid=1701374259" }, { name: "RED CRM", url: "https://docs.google.com/spreadsheets/d/1gPks2FdHyOOTiILvn553miz32WeEtOpx/edit?gid=1701374259#gid=1701374259" }] },
  { category: "BACK OFFICE", icon: "bx-briefcase-alt-2", subs: [{ name: "QBET/55/30", url: "https://betbook.center/qbet/bets" }, { name: "IBET", url: "https://mga-betbook.center/ibet/bets" }, { name: "PUBS", url: "https://eu-b7k.center/pubs8/bets" }] },
  { category: "MULTI MONITOR", icon: "bx-desktop", subs: [{ name: "EDGE PREDICTION TICKER", url: "https://betbook.center/monitor?providerIds=prediction_markets" }, { name: "PUBS PREDICTION TICKER", url: "https://eu-b7k.center/monitor?providerIds=prediction_markets" }, { name: "QBET/55/30 REJECTED", url: "https://betbook.center/monitor" }, { name: "PUBS REJECTED", url: "https://eu-b7k.center/monitor" }] },
  { category: "BETRADAR", icon: "bx-radar", subs: [{ name: "MTS", url: "https://mtsc-its.betradar.com/" }, { name: "CTRL PORTAL", url: "https://portal.betradar.com/" }] },
  { category: "OWN BRANDS", icon: "bx-layer", subs: [{ name: "7A", url: "https://www.7abet.com/en-UN" }, { name: "QBET", url: "https://www.qbet.com/en-UN" }, { name: "55BET", url: "https://www.55bet.com/en-UN" }, { name: "30BET", url: "https://www.30bet.com/en-UN" }, { name: "GQBET", url: "https://www.gqbet.vip/en-UN/" }, { name: "BVBET", url: "https://www.bvbet.com/en-UN" }, { name: "IBET", url: "https://www.ibet.com/en-UN/sportsbook/price-boost/football" }] },
  { category: "PRICE REFERENCES", icon: "bx-data", subs: [{ name: "FLASHSCORE", url: "https://www.flashscore.com/" }, { name: "BETSAPI", url: "https://betsapi.com/" }, { name: "ODDSPORTAL", url: "https://www.oddsportal.com/football/" }, { name: "ODDSCHECKER", url: "https://www.oddschecker.com/" }, { name: "BETFAIR", url: "https://www.betfair.com/exchange/plus/" }, { name: "FANDUEL", url: "https://sportsbook.fanduel.com/" }, { name: "DRAFTKINGS", url: "https://sportsbook.draftkings.com/" }, { name: "CAESARS", url: "https://sportsbook.caesars.com/" }, { name: "BET365", url: "https://www.bet365.com/" }, { name: "PINNACLE", url: "https://www.pinnacle.com/" }, { name: "GGBET", url: "https://gg.bet/" }, { name: "UNIBET", url: "https://www.unibet.com.au/" }, { name: "SOFASCORE", url: "https://www.sofascore.com/" }, { name: "MARATHONBET", url: "https://www.marathonbet.com/" }, { name: "FONBET", url: "https://fonbet.com/" }] },
  { category: "PROCEDURES", icon: "bx-file", subs: [{ name: "CONFLUENCE", url: "https://ibet.atlassian.net/wiki/spaces/Sportsbook/overview" }, { name: "WORKSPACE", url: "workspace.html" }] }
];

const availableTimezones = [
  { zone: "Asia/Manila", name: "Manila (PST)" }, { zone: "UTC", name: "UTC / GMT" },
  { zone: "America/New_York", name: "US East (EST)" }, { zone: "America/Los_Angeles", name: "US West (PST)" },
  { zone: "Europe/London", name: "London (GMT/BST)" }, { zone: "Europe/Paris", name: "Central Europe" },
  { zone: "Asia/Tokyo", name: "Tokyo (JST)" }, { zone: "Asia/Singapore", name: "Singapore (SGT)" },
  { zone: "Australia/Sydney", name: "Sydney (AEST)" }
];

let selectedTimezones = ["Asia/Manila", "UTC", "America/New_York"];
let trendChartInstance = null;
let handoverItems = [];
let isSidebarLocked = localStorage.getItem('sbhub_sidebar_locked') === 'true';
let selectedGameDayOffset = 1;

let rosterDb = null;
try {
  if (typeof firebase !== 'undefined') {
    const rosterFirebaseConfig = {
      apiKey: "AIzaSyCaEclzLI284lWCFk-vXbLSXa_bEZsXbOg",
      authDomain: "test-daily-task--sb.firebaseapp.com",
      databaseURL: "https://test-daily-task--sb-default-rtdb.firebaseio.com",
      projectId: "test-daily-task--sb",
      storageBucket: "test-daily-task--sb.firebasestorage.app",
      messagingSenderId: "928476661919",
      appId: "1:928476661919:web:c6d531190824c6ed7c7aaa"
    };
    if (!firebase.apps.length) firebase.initializeApp(rosterFirebaseConfig);
    rosterDb = firebase.database();
  }
} catch (e) {
  console.warn("Firebase offline or blocked.", e);
}


/* ==========================================
   3. DASHBOARD CONTROLLERS & DATA HANDLERS
   ========================================== */

window.changeGameDayOffset = function(delta) {
  const newOffset = selectedGameDayOffset + delta;
  if (newOffset >= 0 && newOffset <= 7) {
    selectedGameDayOffset = newOffset;
    fetchLiveGames();
  }
};

window.showToastNotification = function(msg) {
  const toast = document.getElementById('toastNotification');
  const msgEl = document.getElementById('toastMsg');
  if (!toast || !msgEl) return;
  msgEl.innerText = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
};

window.toggleAccordion = function(containerId, chevronId) {
  const container = document.getElementById(containerId);
  const chevron = document.getElementById(chevronId);
  if (!container) return;
  const isHidden = container.style.display === 'none' || container.style.display === '';
  container.style.display = isHidden ? 'flex' : 'none';
  if (chevron) chevron.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
};

function initWallpaperPicker() {
  const container = document.getElementById('wallpaperPickerContainer');
  if (!container) return;
  container.innerHTML = '';
  const activeWpId = localStorage.getItem('sbhub_selected_wallpaper') || 'green_default';

  wallpaperPresets.forEach(wp => {
    const thumb = document.createElement('div');
    thumb.className = `wallpaper-thumb ${wp.id === activeWpId ? 'active' : ''}`;
    thumb.style.backgroundImage = `url('${wp.url}')`;
    thumb.title = wp.name;
    thumb.onclick = () => selectWallpaper(wp.id);
    container.appendChild(thumb);
  });
  applyWallpaper(activeWpId);
}

function selectWallpaper(id) {
  localStorage.setItem('sbhub_selected_wallpaper', id);
  document.querySelectorAll('.wallpaper-thumb').forEach((thumb, idx) => {
    if (wallpaperPresets[idx] && wallpaperPresets[idx].id === id) thumb.classList.add('active');
    else thumb.classList.remove('active');
  });
  applyWallpaper(id);
}

window.handleCustomBgUpload = function(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const maxWidth = 1920; const maxHeight = 1080;
      let width = img.width; let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width); width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height); height = maxHeight;
        }
      }

      canvas.width = width; canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);

      try {
        localStorage.setItem('sbhub_custom_wallpaper_data', compressedDataUrl);
        localStorage.setItem('sbhub_selected_wallpaper', 'custom');
        document.querySelectorAll('.wallpaper-thumb').forEach(thumb => thumb.classList.remove('active'));
        applyWallpaper('custom');
        window.showToastNotification("🖼️ Background uploaded & optimized!");
      } catch(err) {
        alert("Storage quota exceeded. Please select a smaller image.");
      }
    };
    img.src = evt.target.result;
  };
  reader.readAsDataURL(file);
};

function applyWallpaper(id) {
  if (id === 'custom') {
    const customData = localStorage.getItem('sbhub_custom_wallpaper_data');
    if (customData) {
      document.body.style.backgroundImage = `linear-gradient(var(--bg-overlay), var(--bg-overlay)), url('${customData}')`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center center';
      document.body.style.backgroundRepeat = 'no-repeat';
      document.body.style.backgroundAttachment = 'fixed';
    } else {
      applyWallpaper('green_default');
    }
    return;
  }

  const wp = wallpaperPresets.find(w => w.id === id) || wallpaperPresets[0];
  document.body.style.backgroundImage = `linear-gradient(var(--bg-overlay), var(--bg-overlay)), url('${wp.url}')`;
  document.body.style.backgroundSize = 'cover';
  document.body.style.backgroundPosition = 'center center';
  document.body.style.backgroundRepeat = 'no-repeat';
  document.body.style.backgroundAttachment = 'fixed';
  
  if (wp.type === 'light') {
    document.body.classList.add('light-mode');
    const modeToggle = document.getElementById('modeToggle');
    if (modeToggle) modeToggle.checked = true;
  } else {
    document.body.classList.remove('light-mode');
    const modeToggle = document.getElementById('modeToggle');
    if (modeToggle) modeToggle.checked = false;
  }

  if (trendChartInstance) initTrendChart();
}

function initWidgetManagerUI() {
  const savedVisibility = localStorage.getItem('sbhub_widget_visibility');
  if (savedVisibility) {
    try {
      const parsed = JSON.parse(savedVisibility);
      widgetVisibilityState = { ...widgetVisibilityState, ...parsed };
    } catch(e){}
  }

  const container = document.getElementById('widgetManagerContainer');
  if (!container) return;
  container.innerHTML = '';

  Object.keys(widgetRegistry).forEach(cardId => {
    const isVisible = widgetVisibilityState[cardId] !== false;
    const name = widgetRegistry[cardId];
    const item = document.createElement('label');
    item.className = 'widget-toggle-item';
    item.innerHTML = `<span>${name}</span><input type="checkbox" ${isVisible ? 'checked' : ''} onchange="setWidgetVisible('${cardId}', this.checked)">`;
    container.appendChild(item);

    const cardEl = document.getElementById(cardId);
    if (cardEl) cardEl.style.display = isVisible ? 'flex' : 'none';
  });
}

window.setWidgetVisible = function(cardId, isVisible) {
  widgetVisibilityState[cardId] = isVisible;
  localStorage.setItem('sbhub_widget_visibility', JSON.stringify(widgetVisibilityState));

  const cardEl = document.getElementById(cardId);
  if (cardEl) cardEl.style.display = isVisible ? 'flex' : 'none';

  const container = document.getElementById('widgetManagerContainer');
  if (container) {
    const inputs = container.querySelectorAll('input[type="checkbox"]');
    const keys = Object.keys(widgetRegistry);
    const idx = keys.indexOf(cardId);
    if (idx !== -1 && inputs[idx]) inputs[idx].checked = isVisible;
  }

  if (cardId === 'trendCard' && isVisible && trendChartInstance) {
    setTimeout(() => trendChartInstance.resize(), 150);
  }
};

window.updateGlassOpacity = function(val) {
  const alpha = (val / 100).toFixed(2);
  document.documentElement.style.setProperty('--glass-alpha', alpha);
  const lbl = document.getElementById('opacityValLabel');
  if (lbl) lbl.innerText = `${val}%`;
  localStorage.setItem('sbhub_glass_opacity', val);
  if (trendChartInstance) initTrendChart();
};

window.setAccentColor = function(colorHex, swatchEl) {
  document.documentElement.style.setProperty('--accent-glow', colorHex);
  document.querySelectorAll('.color-swatch').forEach(sw => sw.classList.remove('active'));
  if (swatchEl) swatchEl.classList.add('active');
  localStorage.setItem('sbhub_accent_color', colorHex);
  if (trendChartInstance) initTrendChart();
};

function restoreAppearanceSettings() {
  const savedOpacity = localStorage.getItem('sbhub_glass_opacity') || "30";
  const slider = document.getElementById('opacitySlider');
  if (slider) slider.value = savedOpacity;
  window.updateGlassOpacity(savedOpacity);

  const savedAccent = localStorage.getItem('sbhub_accent_color');
  if (savedAccent) {
    document.documentElement.style.setProperty('--accent-glow', savedAccent);
    document.querySelectorAll('.color-swatch').forEach(sw => {
      if (sw.getAttribute('onclick')?.includes(savedAccent)) sw.classList.add('active');
      else sw.classList.remove('active');
    });
  }
}

function isMobileOrTablet() {
  return window.innerWidth <= 1024;
}

window.closeMobileSidebar = function() {
  const sidebar = document.getElementById("mainSidebar");
  const backdrop = document.getElementById("mobileBackdropOverlay");
  if (sidebar) sidebar.classList.remove("mobile-open");
  if (backdrop) backdrop.classList.remove("active");
};

window.toggleMobileSidebar = function() {
  const sidebar = document.getElementById("mainSidebar");
  const backdrop = document.getElementById("mobileBackdropOverlay");
  const isOpen = sidebar && sidebar.classList.contains("mobile-open");
  if (isOpen) window.closeMobileSidebar();
  else {
    if (sidebar) sidebar.classList.add("mobile-open");
    if (backdrop) backdrop.classList.add("active");
  }
};

window.handleNavClick = function(targetTab, action) {
  if (targetTab) {
    document.querySelectorAll('.mobile-nav-item').forEach(item => item.classList.remove('active'));
    targetTab.classList.add('active');
  }
  window.closeMobileSidebar();
  if (action) action();
};

function initDraggableSidebar() {
  const sidebar = document.getElementById('mainSidebar');
  if (!sidebar || isMobileOrTablet()) return;

  const savedPos = localStorage.getItem('sbhub_sidebar_pos');
  if (savedPos) {
    try {
      const pos = JSON.parse(savedPos);
      if (pos.top) sidebar.style.top = pos.top;
      if (pos.left) sidebar.style.left = pos.left;
    } catch(e){}
  }

  updateSidebarLockVisuals();
  const dragHandle = document.getElementById('sidebarDragHandle');
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

  if (dragHandle) {
    dragHandle.onmousedown = function(e) {
      if (isSidebarLocked || e.target.id === 'closeSidebarBtn') return;
      e.preventDefault();
      pos3 = e.clientX; pos4 = e.clientY;
      document.onmouseup = closeDragSidebar;
      document.onmousemove = elementDragSidebar;
    };
  }

  function elementDragSidebar(e) {
    if (isSidebarLocked) return;
    e.preventDefault();
    pos1 = pos3 - e.clientX; pos2 = pos4 - e.clientY;
    pos3 = e.clientX; pos4 = e.clientY;
    sidebar.style.top = (sidebar.offsetTop - pos2) + "px";
    sidebar.style.left = (sidebar.offsetLeft - pos1) + "px";
  }

  function closeDragSidebar() {
    document.onmouseup = null; document.onmousemove = null;
    localStorage.setItem('sbhub_sidebar_pos', JSON.stringify({ top: sidebar.style.top, left: sidebar.style.left }));
  }

  sidebar.oncontextmenu = function(e) {
    e.preventDefault();
    toggleSidebarLock();
  };
}

function toggleSidebarLock() {
  isSidebarLocked = !isSidebarLocked;
  localStorage.setItem('sbhub_sidebar_locked', isSidebarLocked);
  updateSidebarLockVisuals();
  window.showToastNotification(isSidebarLocked ? "🔒 Sidebar Position Locked" : "🔓 Sidebar Position Unlocked (Draggable)");
}

function updateSidebarLockVisuals() {
  const sidebar = document.getElementById('mainSidebar');
  const dragHandle = document.getElementById('sidebarDragHandle');
  if (!sidebar) return;

  if (isSidebarLocked) {
    sidebar.classList.add('sidebar-locked');
    if (dragHandle) dragHandle.title = "Sidebar Position Locked (Right-click to Unlock)";
  } else {
    sidebar.classList.remove('sidebar-locked');
    if (dragHandle) dragHandle.title = "Drag Sidebar Here (Right-click to Lock)";
  }
}

async function fetchRealtimeWeather() {
  const tempEl = document.getElementById("phTemp");
  const descEl = document.getElementById("phDesc");
  const iconEl = document.getElementById("weatherIcon");
  const detailsEl = document.getElementById("weatherDetails");
  if (!tempEl || !descEl) return;

  try {
    const response = await fetch("https://api.open-meteo.com/v1/forecast?latitude=14.5995&longitude=120.9842&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=Asia%2FManila");
    const data = await response.json();
    if (!data.current) return;

    const temp = Math.round(data.current.temperature_2m);
    const humidity = data.current.relative_humidity_2m;
    const wind = Math.round(data.current.wind_speed_10m);
    const code = data.current.weather_code;

    let desc = "Clear Sky"; let iconClass = "bx-sun";
    if (code === 0) { desc = "Clear Sky"; iconClass = "bx-sun"; }
    else if (code === 1 || code === 2) { desc = "Partly Cloudy"; iconClass = "bx-cloud-sun"; }
    else if (code === 3) { desc = "Overcast"; iconClass = "bx-cloud"; }
    else if (code >= 45 && code <= 48) { desc = "Foggy"; iconClass = "bx-cloud-fog"; }
    else if (code >= 51 && code <= 67) { desc = "Rainy"; iconClass = "bx-cloud-rain"; }
    else if (code >= 80 && code <= 82) { desc = "Showers"; iconClass = "bx-cloud-drizzle"; }
    else if (code >= 95) { desc = "Thunderstorm"; iconClass = "bx-cloud-lightning"; }

    tempEl.innerText = `${temp}°C`;
    descEl.innerText = desc;
    if (iconEl) iconEl.className = `bx ${iconClass} weather-icon`;
    if (detailsEl) detailsEl.innerHTML = `<span>📍 Metro Manila, PH</span><span>Humidity: ${humidity}%</span><span>Wind: ${wind} km/h</span>`;
  } catch (e) {
    descEl.innerText = "Unavailable";
  }
}

window.switchDockTab = function(tabKey, btnEl) {
  const card = btnEl.closest('.bento-card');
  if (!card) return;
  card.querySelectorAll('.dock-pill-btn').forEach(btn => btn.classList.remove('active'));
  card.querySelectorAll('.dock-content-panel').forEach(panel => panel.classList.remove('active'));
  btnEl.classList.add('active');
  const targetPanel = card.querySelector(`#dock-${tabKey}`);
  if (targetPanel) targetPanel.classList.add('active');
};

function getFormattedDateQuery(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Fetch Top Games (Primary Top Tier with automatic fallback to secondary leagues if empty)
 */
async function fetchLiveGames() {
  const container = document.getElementById("topGamesList");
  if (!container) return;
  container.innerHTML = `<div style="text-align:center; padding:15px;"><i class='bx bx-loader-alt bx-spin' style="font-size:20px; color:var(--accent-glow);"></i></div>`;
  
  try {
    const targetDateQuery = getFormattedDateQuery(selectedGameDayOffset);
    const targetDateObj = new Date();
    targetDateObj.setDate(targetDateObj.getDate() + selectedGameDayOffset);
    const dateLabelStr = targetDateObj.toLocaleDateString("en-US", { month: 'short', day: 'numeric' }).toUpperCase();
    
    let dayTag = `NEXT DAY`;
    if (selectedGameDayOffset === 0) dayTag = `TODAY`;
    else if (selectedGameDayOffset > 1) dayTag = `DAY +${selectedGameDayOffset}`;

    const labelEl = document.getElementById("gameDateNavLabel");
    if (labelEl) labelEl.innerHTML = `📅 ${dayTag} (${dateLabelStr})`;

    // Primary Top Tier Leagues
    const primaryLeagues = [
      { name: "🏆 EURO CHAMPS", code: "uefa.euro", link: "https://www.flashscore.com/football/europe/euro/" },
      { name: "🏆 CHAMPIONS LEAGUE", code: "uefa.champions", link: "https://www.flashscore.com/football/europe/champions-league/" },
      { name: "🏆 EUROPA LEAGUE", code: "uefa.europa", link: "https://www.flashscore.com/football/europe/europa-league/" },
      { name: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 PREMIER LEAGUE", code: "eng.1", link: "https://www.flashscore.ph/football/england/premier-league/" },
      { name: "🇪🇸 LALIGA", code: "esp.1", link: "https://www.flashscore.ph/football/spain/laliga/" },
      { name: "🇩🇪 BUNDESLIGA", code: "ger.1", link: "https://www.flashscore.ph/football/germany/bundesliga/" },
      { name: "🇮🇹 SERIE A", code: "ita.1", link: "https://www.flashscore.ph/football/italy/serie-a/" },
      { name: "🇫🇷 LIGUE 1", code: "fra.1", link: "https://www.flashscore.ph/football/france/ligue-1/" },
      { name: "🇵🇹 LIGA PORTUGAL", code: "por.1", link: "https://www.flashscore.ph/football/portugal/liga-portugal/" },
      { name: "🇳🇱 EREDIVISIE", code: "ned.1", link: "https://www.flashscore.ph/football/netherlands/eredivisie/" }
    ];

    // Extended Backup Leagues (Queried IF Primary Top Tier returns 0 games)
    const backupLeagues = [
      { name: "🇳🇴 NORWAY ELITESERIEN", code: "nor.1", link: "https://www.flashscore.ph/football/norway/eliteserien/" },
      { name: "🇫🇮 FINLAND VEIKKAUSLIIGA", code: "fin.1", link: "https://www.flashscore.ph/football/finland/veikkausliiga/" },
      { name: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 FA CUP QUALIFICATION", code: "eng.fa", link: "https://www.flashscore.ph/football/england/fa-cup/" },
      { name: "🌍 AFCON QUALIFIERS", code: "caf.nations_qual", link: "https://www.flashscore.ph/football/africa/africa-cup-of-nations/" },
      { name: "🌏 ARABIAN GULF CUP", code: "uae.presidents.cup", link: "https://www.flashscore.ph/football/united-arab-emirates/presidents-cup/" },
      { name: "🇺🇸 USA MLS", code: "usa.1", link: "https://www.flashscore.ph/football/usa/mls/" },
      { name: "🇺🇸 USL CHAMPIONSHIP", code: "usa.usl.1", link: "https://www.flashscore.ph/football/usa/usl-championship/" },
      { name: "🌏 FIFA ASEAN CUP - DIV 1", code: "aff.championship", link: "https://www.flashscore.ph/football/asia/aff-championship/" },
      { name: "🌏 ASIAN GAMES - PLAY OFFS", code: "asian.games", link: "https://www.flashscore.ph/football/asia/asian-games/" },
      { name: "🇪🇺 UEFA NATIONS LEAGUE A", code: "uefa.nations.a", link: "https://www.flashscore.ph/football/europe/uefa-nations-league/" },
      { name: "🇪🇺 UEFA NATIONS LEAGUE B", code: "uefa.nations.b", link: "https://www.flashscore.ph/football/europe/uefa-nations-league/" },
      { name: "🇪🇺 UEFA NATIONS LEAGUE D", code: "uefa.nations.d", link: "https://www.flashscore.ph/football/europe/uefa-nations-league/" }
    ];

    // Helper fetcher
    const fetchLeagueData = async (leagues) => {
      const promises = leagues.map(league =>
        fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league.code}/scoreboard?dates=${targetDateQuery}`)
          .then(res => res.json())
          .then(data => ({ league, events: data.events || [] }))
          .catch(() => ({ league, events: [] }))
      );
      const results = await Promise.all(promises);
      let matches = [];
      results.forEach(result => {
        if (result.events && result.events.length > 0) {
          result.events.forEach(e => {
            matches.push({ event: e, league: result.league.name, link: result.league.link });
          });
        }
      });
      return matches;
    };

    // First attempt: Primary Top-Tier Leagues
    let allMatches = await fetchLeagueData(primaryLeagues);
    let isBackupUsed = false;

    // Fallback: If 0 primary matches found, fetch Backup Leagues
    if (allMatches.length === 0) {
      isBackupUsed = true;
      allMatches = await fetchLeagueData(backupLeagues);
    }

    allMatches.sort((a, b) => new Date(a.event.date) - new Date(b.event.date));

    const extractGame = (event, leagueName, link) => {
      if (!event || !event.competitions || !event.competitions[0]) return "";
      const match = event.competitions[0];
      const home = match.competitors?.find(c => c.homeAway === 'home')?.team?.shortDisplayName || match.competitors?.[0]?.team?.shortDisplayName || "Home";
      const away = match.competitors?.find(c => c.homeAway === 'away')?.team?.shortDisplayName || match.competitors?.[1]?.team?.shortDisplayName || "Away";
      
      const dateObj = new Date(event.date);
      const timeStr = dateObj.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: false });
      const dateStr = dateObj.toLocaleDateString("en-US", { month: 'short', day: 'numeric' });
      
      let status = "UPCOMING";
      let statusColor = "var(--accent-green)";
      if (event.status?.type?.state === 'in') { status = "LIVE"; statusColor = "#f87171"; }
      else if (event.status?.type?.completed === true || event.status?.type?.state === 'post') { status = "FINAL"; statusColor = "var(--text-sub)"; }

      return `
        <a href="${link}" target="_blank" class="game-card-item">
          <div class="game-league-tag">
            <span>${leagueName}</span>
            <span style="color: ${statusColor};">● ${status}</span>
          </div>
          <div class="game-teams-row">
            <span>${home}</span>
            <span style="opacity: 0.7; font-weight: 500;">vs</span>
            <span>${away}</span>
          </div>
          <div class="game-time-row">
            <span>📅 ${dateStr} - ${timeStr} (Local)</span>
            <span style="color: var(--accent-glow);">Flashscore →</span>
          </div>
        </a>`;
    };

    let gamesHtml = "";
    if (isBackupUsed && allMatches.length > 0) {
      gamesHtml += `
        <div style="font-size: 8.5px; font-weight: 800; color: var(--accent-glow); background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.25); padding: 3px 6px; border-radius: 4px; margin-bottom: 8px; text-align: center;">
          🌐 ALTERNATIVE LEAGUES (Top Tier Inactive)
        </div>`;
    }

    allMatches.forEach(item => { gamesHtml += extractGame(item.event, item.league, item.link); });

    if (!gamesHtml) {
      gamesHtml = `<div style="text-align:center; padding:20px; font-size:11px; color:var(--text-sub);">No games scheduled for ${dateLabelStr} in the selected leagues.</div>`;
    }

    container.innerHTML = gamesHtml;

  } catch (e) {
    container.innerHTML = `<div style="text-align:center; padding:10px; font-size:11px; color:var(--accent-red);">Failed to fetch live data. Please try again.</div>`;
  }
}

function getCurrentSlotInfo() {
  const now = new Date();
  const hours = now.getHours();
  if (hours >= 6 && hours < 9)   return { slotId: "slot_6_9", label: "7:00 - 9:00" };
  if (hours >= 9 && hours < 12)  return { slotId: "slot_9_12", label: "9:00 - 12:00" };
  if (hours >= 12 && hours < 15) return { slotId: "slot_12_15", label: "12:00 - 15:00" };
  if (hours >= 15 && hours < 18) return { slotId: "slot_15_18", label: "15:00 - 18:00" };
  if (hours >= 18 && hours < 21) return { slotId: "slot_18_21", label: "18:00 - 21:00" };
  return { slotId: "slot_21_0", label: "21:00 - 00:00" };
}

function listenToLiveDutyRoster() {
  if (!rosterDb) return;
  rosterDb.ref('roster_data').on('value', (snapshot) => {
    renderLiveDutyWidget(snapshot.val());
  });
}

window.fetchLiveRosterDuties = function() {
  if (!rosterDb) return;
  rosterDb.ref('roster_data').once('value').then((snapshot) => {
    renderLiveDutyWidget(snapshot.val());
  });
};

function renderLiveDutyWidget(rosterData) {
  const container = document.getElementById("liveDutyContent");
  if (!container) return;

  if (!rosterData) {
    container.innerHTML = `<div style="text-align:center; padding:15px; font-size:10px; color:var(--text-sub);">No roster data available.</div>`;
    return;
  }

  const todayIso = getLocalDateString();
  const { slotId, label: slotLabel } = getCurrentSlotInfo();

  let activeDayKey = Object.keys(rosterData).find(key => key !== 'archives' && rosterData[key]?.isoDate === todayIso);
  if (!activeDayKey) {
    const activeKeys = Object.keys(rosterData).filter(k => k !== 'archives');
    activeKeys.sort((a, b) => (rosterData[b]?.isoDate || '').localeCompare(rosterData[a]?.isoDate || ''));
    activeDayKey = activeKeys[0];
  }

  if (!activeDayKey || !rosterData[activeDayKey]) {
    container.innerHTML = `<div style="text-align:center; padding:15px; font-size:10px; color:var(--text-sub);">No active schedule found.</div>`;
    return;
  }

  const dayData = rosterData[activeDayKey];
  const teamMembers = [
    { id: 'ann', name: 'ANN' }, { id: 'dave', name: 'DAVE' },
    { id: 'ken', name: 'KEN' }, { id: 'kriztel', name: 'KRIZTEL' }
  ];

  let html = `
    <div style="font-size:9.5px; font-weight:800; color:var(--accent-glow); margin-bottom:6px; display:flex; justify-content:space-between; align-items:center;">
      <span>📅 ${dayData.isoDate || 'Today'}</span>
      <span style="background:rgba(56,189,248,0.2); padding:2px 6px; border-radius:4px; border:1px solid rgba(56,189,248,0.3);">⏱️ ${slotLabel}</span>
    </div>
    <div class="duty-member-grid">
  `;

  teamMembers.forEach(m => {
    const mGrid = dayData.grid ? dayData.grid[m.id] : null;
    const shiftId = mGrid?.shift || 'shift-7-16';
    const isRest = (shiftId === 'shift-rd' || shiftId === 'shift-vl' || shiftId === 'shift-sl');
    const restLabel = shiftId === 'shift-vl' ? 'VACATION LEAVE' : (shiftId === 'shift-sl' ? 'SICK LEAVE' : 'REST DAY');

    let rawTasks = (mGrid && mGrid.slots) ? mGrid.slots[slotId] || [] : [];
    if (!Array.isArray(rawTasks)) rawTasks = [];
    const tasks = rawTasks.map(item => (typeof item === 'string' ? { text: item, done: false } : { text: item.text || '', done: !!item.done }));

    html += `
      <div class="duty-member-card">
        <div class="duty-member-header">
          <span class="duty-member-name">${m.name}</span>
          <span class="duty-shift-badge">${isRest ? restLabel : formatShiftBadge(shiftId)}</span>
        </div>
    `;

    if (isRest) {
      html += `<div class="duty-rest-text">😴 ${restLabel}</div>`;
    } else if (tasks.length === 0) {
      html += `<div class="duty-empty-text">No assigned tasks in this slot.</div>`;
    } else {
      html += `<div class="duty-task-list">`;
      tasks.forEach(t => {
        html += `
          <div class="duty-task-item ${t.done ? 'done' : ''}">
            <i class='bx ${t.done ? 'bx-check-circle' : 'bx-time-five'}' style="color:${t.done ? 'var(--accent-green)' : 'var(--accent-glow)'}"></i>
            <span>${escapeHtml(t.text)}</span>
          </div>
        `;
      });
      html += `</div>`;
    }
    html += `</div>`;
  });

  html += `</div>`;
  container.innerHTML = html;
}

function formatShiftBadge(shiftId) {
  const map = {
    'shift-6-15': '6-15', 'shift-7-16': '7-16', 'shift-9-18': '9-18',
    'shift-10-19': '10-19', 'shift-12-21': '12-21', 'shift-14-23': '14-23',
    'shift-15-0': '15-00', 'shift-16-1': '16-01'
  };
  return map[shiftId] || shiftId.replace('shift-', '');
}

function initHandoverStore() {
  if (!rosterDb) return;
  rosterDb.ref('handover_items').on('value', (snapshot) => {
    const data = snapshot.val();
    handoverItems = data ? Object.values(data).sort((a, b) => Number(b.id) - Number(a.id)) : [];
    renderHandoverItems();
  });
}

function renderHandoverItems() {
  const listEl = document.getElementById('handoverList');
  if (!listEl) return;
  if (handoverItems.length === 0) {
    listEl.innerHTML = `<div style="text-align:center; padding:25px 10px; font-size:11px; color:var(--text-sub);">No pending handover tasks. Click <strong style="color:var(--accent-glow);">+</strong> to add issues/endorsements.</div>`;
    return;
  }

  let html = '';
  handoverItems.forEach(item => {
    const isDone = item.done ? 'completed' : '';
    const priorityClass = item.priority === 'urgent' ? 'urgent' : 'normal';
    const priorityLabel = item.priority === 'urgent' ? '🚨 URGENT' : 'NORMAL';
    const urgentPulseClass = (item.priority === 'urgent' && !item.done) ? 'urgent-item' : '';

    html += `
      <div class="handover-item ${isDone} ${urgentPulseClass}">
        <div class="handover-item-top">
          <div style="display:flex; gap:6px; align-items:center;">
            <span class="handover-tag ${priorityClass}">${priorityLabel}</span>
            <span style="font-weight:800; color:var(--accent-glow);">${item.brand}</span>
          </div>
          <span style="color:var(--text-sub); opacity:0.8;">🕒 ${item.timestamp}</span>
        </div>
        <div class="handover-desc">${escapeHtml(item.text)}</div>
        <div class="handover-actions">
          <button class="handover-btn" onclick="toggleHandoverDone('${item.id}')">
            <i class='bx ${item.done ? 'bx-undo' : 'bx-check-circle'}'></i> ${item.done ? 'Reopen' : 'Mark Done'}
          </button>
          <button class="handover-btn delete" onclick="deleteHandoverItem('${item.id}')">
            <i class='bx bx-trash'></i> Delete
          </button>
        </div>
      </div>
    `;
  });
  listEl.innerHTML = html;
}

window.openAddHandoverModal = function() {
  const modal = document.getElementById('handoverModal');
  if (modal) modal.style.display = 'flex';
  setTimeout(() => {
    const txt = document.getElementById('handoverText');
    if (txt) txt.focus();
  }, 100);
};

window.closeAddHandoverModal = function() {
  const modal = document.getElementById('handoverModal');
  if (modal) modal.style.display = 'none';
  const txt = document.getElementById('handoverText');
  if (txt) txt.value = '';
};

window.createHandoverItem = function() {
  const brand = document.getElementById('handoverBrand').value;
  const priority = document.getElementById('handoverPriority').value;
  const text = document.getElementById('handoverText').value.trim();

  if (!text) { alert('Please enter issue/endorsement description.'); return; }

  const itemId = Date.now().toString();
  const newItem = {
    id: itemId, brand: brand, priority: priority, text: text,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    done: false
  };

  if (rosterDb) rosterDb.ref('handover_items/' + itemId).set(newItem);
  window.closeAddHandoverModal();
};

window.toggleHandoverDone = function(id) {
  const item = handoverItems.find(i => i.id === id);
  if (item && rosterDb) rosterDb.ref('handover_items/' + id + '/done').set(!item.done);
};

window.deleteHandoverItem = function(id) {
  if (rosterDb) rosterDb.ref('handover_items/' + id).remove();
};

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

window.loadDataForDate = function(dateStr) {
  if (!dateStr) return;
  const appData = JSON.parse(localStorage.getItem('sbhub_chart_data')) || {};
  const dateData = appData[dateStr];
  
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  };

  if (dateData) {
    setVal('ibetIncInput', dateData.ibet?.inc || 0);
    setVal('ibetRedInput', dateData.ibet?.red || 0);
    setVal('ibetLimInput', dateData.ibet?.lim || 0);
    setVal('edgeIncInput', dateData.edge?.inc || 0);
    setVal('edgeRedInput', dateData.edge?.red || 0);
    setVal('edgeLimInput', dateData.edge?.lim || 0);
    setVal('sevenIncInput', dateData.tracker7a?.inc || 0);
    setVal('sevenRedInput', dateData.tracker7a?.red || 0);
    setVal('sevenLimInput', dateData.tracker7a?.lim || 0);
    setVal('pubsIncInput', dateData.pubs?.inc || 0);
    setVal('pubsRedInput', dateData.pubs?.red || 0);
    setVal('pubsLimInput', dateData.pubs?.lim || 0);
  } else {
    ['ibet', 'edge', 'seven', 'pubs'].forEach(b => {
      setVal(`${b}IncInput`, '');
      setVal(`${b}RedInput`, '');
      setVal(`${b}LimInput`, '');
    });
  }
};

window.navigateLogDate = function(days) {
  const input = document.getElementById('logDate');
  if (!input) return;
  if (!input.value) input.value = getLocalDateString();
  const parts = input.value.split('-');
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  d.setDate(d.getDate() + days);
  
  const newDateStr = getLocalDateString(d);
  input.value = newDateStr;
  window.loadDataForDate(newDateStr);
};

function initDataStore() {
  let storedData = localStorage.getItem('sbhub_chart_data');
  if (!storedData) {
    const baseData = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dateStr = getLocalDateString(d); 
      baseData[dateStr] = {
        ibet: { inc: Math.floor(Math.random() * 8) + 8, red: Math.floor(Math.random() * 4) + 1, lim: Math.floor(Math.random() * 3) + 1 },
        edge: { inc: Math.floor(Math.random() * 10) + 10, red: Math.floor(Math.random() * 5) + 2, lim: Math.floor(Math.random() * 4) + 1 },
        tracker7a: { inc: Math.floor(Math.random() * 7) + 6, red: Math.floor(Math.random() * 3) + 1, lim: Math.floor(Math.random() * 2) + 1 },
        pubs: { inc: Math.floor(Math.random() * 9) + 7, red: Math.floor(Math.random() * 4) + 1, lim: Math.floor(Math.random() * 3) + 1 }
      };
    }
    localStorage.setItem('sbhub_chart_data', JSON.stringify(baseData));
  }
  
  const today = getLocalDateString();
  const dateInput = document.getElementById('logDate');
  if (dateInput) dateInput.value = today;
  window.loadDataForDate(today);
}

window.saveDailyLog = function() {
  const dateStr = document.getElementById('logDate')?.value;
  if (!dateStr) return alert("Please select a valid date.");
  
  let appData = JSON.parse(localStorage.getItem('sbhub_chart_data')) || {};
  const getNum = id => Number(document.getElementById(id)?.value) || 0;

  appData[dateStr] = {
    ibet: { inc: getNum('ibetIncInput'), red: getNum('ibetRedInput'), lim: getNum('ibetLimInput') },
    edge: { inc: getNum('edgeIncInput'), red: getNum('edgeRedInput'), lim: getNum('edgeLimInput') },
    tracker7a: { inc: getNum('sevenIncInput'), red: getNum('sevenRedInput'), lim: getNum('sevenLimInput') },
    pubs: { inc: getNum('pubsIncInput'), red: getNum('pubsRedInput'), lim: getNum('pubsLimInput') }
  };

  localStorage.setItem('sbhub_chart_data', JSON.stringify(appData));
  initTrendChart(); 
  
  const btn = document.getElementById("saveLogBtn");
  if (btn) {
    const originalText = btn.innerHTML;
    btn.innerHTML = "<i class='bx bx-check'></i> SAVED!";
    setTimeout(() => btn.innerHTML = originalText, 1500);
  }
};

const verticalBarLabelPlugin = {
  id: 'verticalBarLabelPlugin',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    chart.data.datasets.forEach((dataset, datasetIndex) => {
      if (dataset.type === 'bar' || !dataset.type) {
        const meta = chart.getDatasetMeta(datasetIndex);
        if (!meta.hidden) {
          meta.data.forEach((bar, index) => {
            const val = dataset.data[index];
            if (val !== null && val !== undefined && val > 0) {
              ctx.save();
              const barHeight = Math.abs(bar.base - bar.y);
              const x = bar.x; const y = (bar.y + bar.base) / 2;
              ctx.translate(x, y);
              ctx.rotate(-Math.PI / 2);
              ctx.fillStyle = '#ffffff';
              ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 4;
              ctx.font = '800 9px "Plus Jakarta Sans", sans-serif';
              ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
              const barText = dataset.customBarLabel ? dataset.customBarLabel : dataset.label;
              if (barHeight > 18) ctx.fillText(barText, 0, 0);
              ctx.restore();
            }
          });
        }
      }
    });
  }
};

function initTrendChart() {
  const trackerEl = document.getElementById("trackerSelector");
  const tfEl = document.getElementById("timeframeSelector");
  const chartCanvas = document.getElementById("trendChart");
  if (!trackerEl || !tfEl || !chartCanvas || typeof Chart === 'undefined') return;

  const viewMode = trackerEl.value;
  const timeframe = tfEl.value;
  
  const appData = JSON.parse(localStorage.getItem('sbhub_chart_data')) || {};
  let sortedDates = Object.keys(appData).sort();
  
  if (timeframe === "7") sortedDates = sortedDates.slice(-7);
  else if (timeframe === "30") sortedDates = sortedDates.slice(-30);

  const dateLabels = sortedDates.map(dateStr => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: 'short', day: 'numeric' });
  });

  const isLight = document.body.classList.contains("light-mode");
  const textColor = isLight ? '#0f172a' : '#ffffff';
  const gridColor = isLight ? 'rgba(15, 23, 42, 0.15)' : 'rgba(255, 255, 255, 0.18)';

  const ctx = chartCanvas.getContext("2d");
  if (trendChartInstance) trendChartInstance.destroy();

  let chartConfigData = { labels: dateLabels, datasets: [] };
  const badge = document.getElementById("trendBadge");

  const brandSpecs = [
    { key: 'edge', label: 'EDGE', inc: '#4ade80', red: '#15803d', lim: '#000000' },
    { key: 'ibet', label: 'IBET', inc: '#f472b6', red: '#991b1b', lim: '#881337' },
    { key: 'tracker7a', label: '7A', inc: '#38bdf8', red: '#2563eb', lim: '#1e3a8a' },
    { key: 'pubs', label: 'PUBS', inc: '#fb923c', red: '#ea580c', lim: '#7c2d12' }
  ];

  if (viewMode === "all") {
    const allDatasets = [];
    brandSpecs.forEach(b => {
      allDatasets.push({
        type: 'bar', label: `${b.label} Inc`, customBarLabel: `inc ${b.label}`,
        data: sortedDates.map(d => appData[d]?.[b.key]?.inc || 0),
        backgroundColor: b.inc, borderColor: '#ffffff', borderWidth: 1, borderRadius: 4
      });
    });
    brandSpecs.forEach(b => {
      allDatasets.push({
        type: 'line', label: `${b.label} Red`,
        data: sortedDates.map(d => appData[d]?.[b.key]?.red || 0),
        borderColor: b.red, backgroundColor: 'transparent', borderWidth: 3, pointRadius: 3.5,
        pointBackgroundColor: b.red, pointBorderColor: '#ffffff', pointBorderWidth: 1, tension: 0.3
      });
    });
    brandSpecs.forEach(b => {
      allDatasets.push({
        type: 'line', label: `${b.label} Lim`,
        data: sortedDates.map(d => appData[d]?.[b.key]?.lim || 0),
        borderColor: b.lim, backgroundColor: 'transparent', borderWidth: 2.5, borderDash: [5, 5],
        pointRadius: 3.5, pointBackgroundColor: b.lim, pointBorderColor: '#ffffff', pointBorderWidth: 1, tension: 0.3
      });
    });

    chartConfigData.datasets = allDatasets;
    if (badge) {
      badge.className = "stat-badge up";
      badge.innerHTML = `<i class='bx bx-bar-chart-alt-2'></i> Custom Brand Palette`;
    }
  } else {
    const brandKey = viewMode;
    const brandObj = brandSpecs.find(b => b.key === brandKey) || brandSpecs[0];
    const brandName = brandObj.label;

    chartConfigData.datasets = [
      {
        type: 'bar', label: `${brandName} Increased`, customBarLabel: `inc ${brandName}`,
        data: sortedDates.map(d => appData[d]?.[brandKey]?.inc || 0),
        backgroundColor: brandObj.inc, borderColor: '#ffffff', borderWidth: 1.5, borderRadius: 4
      },
      {
        type: 'line', label: `${brandName} Reduced`,
        data: sortedDates.map(d => appData[d]?.[brandKey]?.red || 0),
        borderColor: brandObj.red, backgroundColor: 'transparent', borderWidth: 3.5, pointRadius: 4,
        pointBackgroundColor: brandObj.red, pointBorderColor: '#ffffff', pointBorderWidth: 1.5, tension: 0.3
      },
      {
        type: 'line', label: `${brandName} Limited`,
        data: sortedDates.map(d => appData[d]?.[brandKey]?.lim || 0),
        borderColor: brandObj.lim, backgroundColor: 'transparent', borderWidth: 3, borderDash: [5, 5],
        pointRadius: 4, pointBackgroundColor: brandObj.lim, pointBorderColor: '#ffffff', pointBorderWidth: 1.5, tension: 0.3
      }
    ];

    if (badge) {
      badge.className = "stat-badge up"; 
      badge.innerHTML = `<i class='bx bx-trending-up'></i> ${brandName} Palette Trend`;
    }
  }

  trendChartInstance = new Chart(ctx, {
    type: 'bar', 
    data: chartConfigData,
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { 
        legend: { labels: { color: textColor, font: { size: 9, weight: '800' }, boxWidth: 12 }, display: true } 
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: textColor, font: { size: 10, weight: '800' } } },
        y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 10, weight: '800' } } }
      }
    },
    plugins: [verticalBarLabelPlugin]
  });
}

function renderClocks() {
  const grid = document.getElementById("timezoneGrid");
  if (!grid) return;
  grid.innerHTML = "";
  selectedTimezones.forEach((tzZone, index) => {
    const timeString = new Date().toLocaleTimeString("en-US", { timeZone: tzZone, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    const item = document.createElement("div"); item.className = "tz-item";
    let optionsHtml = "";
    availableTimezones.forEach(t => { 
      const selected = (t.zone === tzZone) ? "selected" : ""; 
      optionsHtml += `<option value="${t.zone}" ${selected}>${t.name}</option>`; 
    });
    item.innerHTML = `<select class="tz-select" onchange="changeTimezone(${index}, this.value)">${optionsHtml}</select><div class="tz-clock" id="clock_${index}">${timeString}</div>`;
    grid.appendChild(item);
  });
}

function updateClocksTick() {
  selectedTimezones.forEach((tzZone, index) => {
    const clockEl = document.getElementById(`clock_${index}`);
    if (clockEl) {
      clockEl.innerText = new Date().toLocaleTimeString("en-US", { timeZone: tzZone, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    }
  });
}

window.changeTimezone = function(index, newZone) {
  selectedTimezones[index] = newZone;
  updateClocksTick();
  saveBentoLayout(); 
};

function getBentoLayoutObj() {
  const layout = {};
  document.querySelectorAll(".bento-card").forEach(card => { 
    if (card.id) {
      layout[card.id] = { 
        top: card.style.top, 
        left: card.style.left, 
        width: card.style.width, 
        height: card.style.height,
        display: card.style.display 
      }; 
    }
  });
  layout["selected_timezones"] = selectedTimezones; 
  layout["mobile_view"] = document.body.classList.contains("mobile-view-active");
  layout["selected_wallpaper"] = localStorage.getItem('sbhub_selected_wallpaper') || 'green_default';
  return layout;
}

function saveBentoLayout() {
  if (isMobileOrTablet()) return;
  const layout = getBentoLayoutObj();
  localStorage.setItem("sbhub_bento_layout_clean_v10", JSON.stringify(layout));
}

function restoreBentoLayout() {
  if (isMobileOrTablet()) return;
  const urlParams = new URLSearchParams(window.location.search);
  const layoutFromURL = urlParams.get('layout');
  let layoutToApply = null;

  if (layoutFromURL) {
    try {
      layoutToApply = JSON.parse(atob(layoutFromURL));
      localStorage.setItem("sbhub_bento_layout_clean_v10", JSON.stringify(layoutToApply)); 
      window.history.replaceState({}, document.title, window.location.pathname); 
    } catch(e) {}
  }

  if (!layoutToApply) {
    const saved = localStorage.getItem("sbhub_bento_layout_clean_v10");
    if (saved) {
      try { layoutToApply = JSON.parse(saved); } catch(e){}
    }
  }

  if (layoutToApply) {
    if (layoutToApply["mobile_view"]) { 
      document.body.classList.add("mobile-view-active"); 
      const mobileToggle = document.getElementById("mobileViewToggle");
      if(mobileToggle) mobileToggle.checked = true; 
    }
    
    if (layoutToApply["selected_wallpaper"]) {
      localStorage.setItem('sbhub_selected_wallpaper', layoutToApply["selected_wallpaper"]);
    }

    for (const id in layoutToApply) {
      if (id === "selected_timezones" || id === "mobile_view" || id === "selected_wallpaper") continue;
      const el = document.getElementById(id);
      if (el) { 
        if (layoutToApply[id].top) el.style.top = layoutToApply[id].top; 
        if (layoutToApply[id].left) el.style.left = layoutToApply[id].left; 
        if (layoutToApply[id].width) el.style.width = layoutToApply[id].width; 
        if (layoutToApply[id].height) el.style.height = layoutToApply[id].height; 
        if (layoutToApply[id].display) el.style.display = layoutToApply[id].display;
      }
    }
    if (layoutToApply["selected_timezones"]) selectedTimezones = layoutToApply["selected_timezones"];
  }
}

window.saveLayout = function() {
  saveBentoLayout();
  if (typeof showToastNotification === 'function') {
    showToastNotification("💾 Layout & Background saved successfully!");
  } else {
    alert("Layout & background saved successfully!");
  }
};

function renderSidebar() {
  const navList = document.getElementById("navList");
  if (!navList) return;
  navList.innerHTML = "";
  menuData.forEach(item => {
    const li = document.createElement("li");
    li.className = "nav-item-group";
    let subsHtml = "";
    item.subs.forEach(sub => subsHtml += `<li><a href="${sub.url}" target="_blank" onclick="closeMobileSidebar()" class="sub-menu-item">${sub.name}</a></li>`);
    li.innerHTML = `<div class="nav-header-btn" onclick="this.parentElement.classList.toggle('expanded')"><i class='bx ${item.icon} nav-icon'></i><span class="nav-item-title">${item.category}</span><i class='bx bx-chevron-down nav-arrow'></i></div><ul class="sub-menu-list">${subsHtml}</ul>`;
    navList.appendChild(li);
  });
}

window.handleSearch = function() {
  const query = document.getElementById("searchInput")?.value.toLowerCase() || "";
  const navItems = document.querySelectorAll(".nav-item-group");

  navItems.forEach(group => {
    const subs = group.querySelectorAll(".sub-menu-item");
    let matchFound = false;

    subs.forEach(sub => {
      if (sub.innerText.toLowerCase().includes(query)) {
        sub.parentElement.style.display = "block";
        matchFound = true;
      } else {
        sub.parentElement.style.display = "none";
      }
    });

    if (matchFound) {
      group.style.display = "block";
      group.classList.add("expanded");
    } else if (query === "") {
      group.style.display = "block";
      group.classList.remove("expanded");
      subs.forEach(sub => sub.parentElement.style.display = "block");
    } else {
      group.style.display = "none";
    }
  });
};

function makeElementDraggable(element) {
  if (isMobileOrTablet()) return;
  const header = element.querySelector(".card-header-title");
  if (!header) return;
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  header.onmousedown = function(e) {
    e.preventDefault(); element.style.zIndex = 100;
    pos3 = e.clientX; pos4 = e.clientY;
    document.onmouseup = closeDragElement; document.onmousemove = elementDrag;
  };
  function elementDrag(e) {
    e.preventDefault(); pos1 = pos3 - e.clientX; pos2 = pos4 - e.clientY; pos3 = e.clientX; pos4 = e.clientY;
    element.style.top = (element.offsetTop - pos2) + "px"; element.style.left = (element.offsetLeft - pos1) + "px";
  }
  function closeDragElement() { document.onmouseup = null; document.onmousemove = null; saveBentoLayout(); }
}

window.toggleModal = function() { 
  const modal = document.getElementById("settingsModal"); 
  if (modal) modal.style.display = (modal.style.display === "flex") ? "none" : "flex"; 
};

window.toggleTheme = function() { 
  const isLight = document.getElementById("modeToggle")?.checked; 
  if (isLight) document.body.classList.add("light-mode"); 
  else document.body.classList.remove("light-mode"); 
  initTrendChart(); 
};

window.toggleMobileView = function() { 
  const mobileToggle = document.getElementById("mobileViewToggle"); 
  if (mobileToggle && mobileToggle.checked) document.body.classList.add("mobile-view-active"); 
  else document.body.classList.remove("mobile-view-active"); 
  setTimeout(() => { if(trendChartInstance) trendChartInstance.resize(); }, 300); 
};


/* ==========================================
   4. 3D PHYSICS SNOW, KITTY, DOGS & PAWPRINTS
   ========================================== */

function initSnowEffect() {
  const canvas = document.getElementById('snowCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const colWidth = 4;
  let numCols = Math.ceil(width / colWidth);
  let groundHeights = new Float32Array(numCols).fill(0);

  const maxVolumePerSnowman = 350;
  const snowmen = [
    { xRatio: 0.32, volume: 0, decorated: false },
    { xRatio: 0.50, volume: 0, decorated: false },
    { xRatio: 0.68, volume: 0, decorated: false },
    { xRatio: 0.86, volume: 0, decorated: false }
  ];
  let currentSnowmanIdx = 0;

  let dogs = [];
  let dogsActive = false;
  let pawprints = [];

  function addPawprint(x, y) {
    pawprints.push({ x, y, opacity: 0.65 });
    if (pawprints.length > 60) pawprints.shift();
  }

  function drawPawprints() {
    for (let i = pawprints.length - 1; i >= 0; i--) {
      const pp = pawprints[i];
      ctx.save();
      ctx.fillStyle = `rgba(148, 163, 184, ${pp.opacity})`;
      ctx.beginPath();
      ctx.ellipse(pp.x, pp.y, 3, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(pp.x - 2.5, pp.y - 2, 1, 0, Math.PI * 2);
      ctx.arc(pp.x, pp.y - 3, 1, 0, Math.PI * 2);
      ctx.arc(pp.x + 2.5, pp.y - 2, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      pp.opacity -= 0.0008;
      if (pp.opacity <= 0) pawprints.splice(i, 1);
    }
  }

  const numFlakes = 130;
  const flakes = Array.from({ length: numFlakes }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 2.2 + 1.2,
    z: Math.random() * 0.8 + 0.4,
    speed: Math.random() * 1.2 + 0.8,
    opacity: Math.random() * 0.6 + 0.4,
    sway: Math.random() * Math.PI * 2,
    swaySpeed: Math.random() * 0.02 + 0.01
  }));

  const cat = { 
    x: 60, 
    state: 'ROLL_SNOW', 
    prevState: 'ROLL_SNOW', 
    timer: 0, 
    frame: 0, 
    speed: 2.2, 
    facingRight: true, 
    snowBallRadius: 5,
    lastFpX: 60,
    jumpY: 0,
    holdingItem: false
  };

  let waveCooldown = 0;

  function loadSnowState() {
    const saved = localStorage.getItem('sbhub_snow_data');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.snowmen && Array.isArray(data.snowmen)) {
          data.snowmen.forEach((s, i) => {
            if (snowmen[i]) {
              snowmen[i].volume = s.volume || 0;
              snowmen[i].decorated = !!s.decorated;
            }
          });
        }
        if (typeof data.currentSnowmanIdx === 'number') {
          currentSnowmanIdx = Math.min(data.currentSnowmanIdx, snowmen.length);
        }
        if (typeof data.catX === 'number') {
          cat.x = data.catX;
        }
        if (data.catState) {
          cat.state = (data.catState === 'CRYING' || data.catState === 'WAVING') ? 'ROLL_SNOW' : data.catState;
        }
      } catch (e) {}
    }
  }

  function saveSnowState() {
    localStorage.setItem('sbhub_snow_data', JSON.stringify({
      snowmen: snowmen.map(s => ({ volume: s.volume, decorated: s.decorated })),
      currentSnowmanIdx: currentSnowmanIdx,
      catX: cat.x,
      catState: cat.state
    }));
  }

  loadSnowState();

  window.addEventListener('mousemove', () => {
    if (waveCooldown <= 0 && cat.state !== 'WAVING' && cat.state !== 'CRYING' && cat.state !== 'DOGS_ATTACK') {
      cat.prevState = (cat.state === 'WAVING') ? 'ROLL_SNOW' : cat.state;
      cat.state = 'WAVING';
      cat.timer = 0;
      cat.jumpY = -12;
      waveCooldown = 600;
    }
  });

  window.addEventListener('click', (e) => {
    const clickY = e.clientY;
    const clickX = e.clientX;
    const groundY = height - 90;

    if (clickY >= groundY) {
      if (Math.abs(clickX - cat.x) < 80 && cat.state !== 'CRYING') {
        cat.prevState = (cat.state === 'WAVING') ? 'ROLL_SNOW' : cat.state;
        cat.state = 'WAVING';
        cat.timer = 0;
        cat.jumpY = -18;
        if (typeof window.playClickSound === 'function') window.playClickSound();
      }
    }
  });

  function spawnDogsAttack() {
    dogsActive = true;
    const fromLeft = Math.random() > 0.5;
    const startX = fromLeft ? -80 : width + 80;
    const speed = fromLeft ? 5.5 : -5.5;

    dogs = [
      { x: startX, speed: speed, jumpY: 0, frame: 0, facingRight: fromLeft },
      { x: startX - (fromLeft ? 60 : -60), speed: speed * 1.1, jumpY: 0, frame: 10, facingRight: fromLeft },
      { x: startX - (fromLeft ? 120 : -120), speed: speed * 0.9, jumpY: 0, frame: 20, facingRight: fromLeft }
    ];

    if (typeof window.showToastNotification === 'function') {
      window.showToastNotification("🐕 Oh no! A pack of playful dogs is charging in!");
    }
  }

  function handleFlakeCollision(f) {
    let col = Math.floor(f.x / colWidth);
    if (col < 0) col = 0; 
    if (col >= numCols) col = numCols - 1;
    let currentGroundY = height - groundHeights[col];

    if (f.y >= currentGroundY) {
      if (groundHeights[col] < 45) {
        groundHeights[col] += 0.3 * f.z;
        if (col > 0) groundHeights[col - 1] += 0.15 * f.z;
        if (col < numCols - 1) groundHeights[col + 1] += 0.15 * f.z;
      }
      f.y = -15; f.x = Math.random() * width;
    }
  }

  function drawLumpySnowball(cx, cy, radius, rotation) {
    if (radius <= 0) return;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);

    ctx.beginPath();
    const points = 12;
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const noise = Math.sin(angle * 3) * (radius * 0.08) + Math.cos(angle * 5) * (radius * 0.06);
      const r = Math.max(2, radius + noise);
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();

    const grad = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, radius * 0.1, 0, 0, radius * 1.1);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.65, "#f1f5f9");
    grad.addColorStop(0.85, "#cbd5e1");
    grad.addColorStop(1, "#94a3b8");
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.beginPath();
    ctx.arc(-radius * 0.2, -radius * 0.2, radius * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawSnowman(x, baseY, volume, decorated) {
    if (volume <= 0) return;
    ctx.save();
    
    const buildProgress = Math.min(1.0, volume / maxVolumePerSnowman);
    const bottomR = Math.min(32, buildProgress * 2.2 * 32);
    const middleR = buildProgress > 0.25 ? Math.min(22, (buildProgress - 0.25) * 2.2 * 22) : 0;
    const headR = buildProgress > 0.55 ? Math.min(15, (buildProgress - 0.55) * 2.2 * 15) : 0;

    if (bottomR > 1) {
      drawLumpySnowball(x, baseY - bottomR * 0.7, bottomR, 0);
    }
    if (middleR > 1) {
      const mY = baseY - bottomR * 1.3 - middleR * 0.7;
      drawLumpySnowball(x, mY, middleR, 0);
      if (decorated) {
        ctx.strokeStyle = "#582f0e"; ctx.lineWidth = 3; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(x - middleR * 0.8, mY); ctx.lineTo(x - middleR - 18, mY - 10); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + middleR * 0.8, mY); ctx.lineTo(x + middleR + 18, mY - 12); ctx.stroke();
      }
    }
    if (headR > 1) {
      const hY = baseY - bottomR * 1.3 - middleR * 1.3 - headR * 0.7;
      drawLumpySnowball(x, hY, headR, 0);
      if (buildProgress > 0.4) {
        ctx.fillStyle = "#0f172a"; ctx.beginPath();
        ctx.arc(x - 4, hY - 3, 1.8, 0, Math.PI * 2); ctx.arc(x + 4, hY - 3, 1.8, 0, Math.PI * 2); ctx.fill();
      }
      if (decorated) {
        ctx.fillStyle = "#ea580c"; ctx.beginPath();
        ctx.moveTo(x, hY); ctx.lineTo(x + 14, hY + 2); ctx.lineTo(x, hY + 4); ctx.closePath(); ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawDog(x, y, facingRight, frame) {
    ctx.save();
    ctx.translate(x, y + 4);
    ctx.scale(1.1, 1.1);
    if (!facingRight) ctx.scale(-1, 1);

    const legRun = Math.sin(frame * 0.4) * 12;
    const bounce = Math.abs(Math.sin(frame * 0.4)) * 3;

    ctx.translate(0, -bounce);

    ctx.fillStyle = "rgba(15, 23, 42, 0.35)";
    ctx.beginPath(); ctx.ellipse(0, 0, 16, 4, 0, 0, Math.PI * 2); ctx.fill();

    ctx.lineWidth = 1.8; ctx.strokeStyle = "#000000";

    const tailWag = Math.sin(frame * 0.5) * 0.4;
    ctx.save(); ctx.translate(-14, -14); ctx.rotate(-0.3 + tailWag);
    ctx.fillStyle = "#d97706"; ctx.beginPath();
    ctx.quadraticCurveTo(-12, -18, -6, -26); ctx.quadraticCurveTo(-2, -12, 0, 0); ctx.fill(); ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = "#d97706"; ctx.lineWidth = 5; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(-10 + legRun, -2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-4, -10); ctx.lineTo(-4 - legRun, -2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6, -10); ctx.lineTo(6 - legRun, -2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(12, -10); ctx.lineTo(12 + legRun, -2); ctx.stroke();

    ctx.fillStyle = "#f59e0b";
    ctx.beginPath(); ctx.ellipse(0, -14, 15, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    ctx.beginPath(); ctx.arc(14, -22, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    ctx.fillStyle = "#b45309";
    ctx.beginPath(); ctx.ellipse(10, -20, 5, 9, 0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.ellipse(18, -20, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#ef4444"; ctx.beginPath(); ctx.arc(20, -18, 2.5, 0, Math.PI); ctx.fill();
    ctx.fillStyle = "#000000"; ctx.beginPath(); ctx.arc(21, -22, 1.8, 0, Math.PI * 2); ctx.fill();

    ctx.beginPath(); ctx.arc(16, -25, 2, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }

  function drawCatCharacter(x, y, state, frame, facingRight = true, ballRadius = 0, holdingItem = false) {
    ctx.save();
    ctx.translate(x, y + 6);
    ctx.scale(1.15, 1.15);
    
    if (!facingRight) {
      ctx.scale(-1, 1);
    }

    const isWalking = (state === 'ROLL_SNOW' || state === 'FETCH_STICK' || state === 'DELIVER_STICK' || state === 'RETURNING');
    const gaitCycle = isWalking ? Math.sin(frame * 0.35) * 12 : 0;
    const bounce = isWalking ? Math.abs(Math.sin(frame * 0.35)) * 2.5 : 0;
    const tailSway = Math.sin(frame * 0.2) * 0.25;

    ctx.translate(0, -bounce + cat.jumpY);
    if (cat.jumpY < 0) cat.jumpY += 1;

    ctx.fillStyle = "rgba(15, 23, 42, 0.35)";
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 2.0;
    ctx.strokeStyle = "#000000";

    if (state === 'CRYING') {
      const sobTremble = Math.sin(frame * 0.8) * 1.5;
      ctx.translate(sobTremble, 0);

      ctx.save(); ctx.translate(-14, -8); ctx.rotate(0.6 + tailSway * 0.5);
      ctx.fillStyle = "#f97316";
      ctx.beginPath(); ctx.quadraticCurveTo(-15, 10, -8, 18); ctx.quadraticCurveTo(-2, 10, 0, 0); ctx.fill(); ctx.stroke();
      ctx.restore();

      ctx.fillStyle = "#f97316";
      ctx.beginPath(); ctx.ellipse(-12, -8, 8, 5, 0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(12, -8, 8, 5, -0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      ctx.fillStyle = "#f97316";
      ctx.beginPath(); ctx.ellipse(0, -18, 14, 16, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath(); ctx.ellipse(0, -16, 9, 11, 0, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = "#ec4899"; ctx.fillRect(-10, -32, 20, 4); ctx.strokeRect(-10, -32, 20, 4);

      ctx.fillStyle = "#f97316";
      ctx.beginPath(); ctx.arc(0, -40, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      ctx.beginPath(); ctx.moveTo(-11, -48); ctx.lineTo(-20, -56); ctx.lineTo(-2, -50); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(11, -48); ctx.lineTo(20, -56); ctx.lineTo(2, -50); ctx.closePath(); ctx.fill(); ctx.stroke();

      ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.ellipse(0, -36, 7, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#000000"; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(0, -32, 2.5, Math.PI, 0); ctx.stroke();

      ctx.fillStyle = "#000000";
      ctx.beginPath(); ctx.arc(-5, -42, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(5, -42, 2.5, 0, Math.PI * 2); ctx.fill();

      const tearY = (frame * 3) % 25;
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath(); ctx.arc(-6, -38 + tearY, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(6, -38 + tearY, 2, 0, Math.PI * 2); ctx.fill();

    } else if (state === 'WAVING') {
      ctx.save(); ctx.translate(-14, -12); ctx.rotate(-0.5 + tailSway);
      ctx.fillStyle = "#f97316";
      ctx.beginPath(); ctx.quadraticCurveTo(-15, -25, -5, -35); ctx.quadraticCurveTo(-18, -20, 0, 0); ctx.fill(); ctx.stroke();
      ctx.restore();

      ctx.fillStyle = "#f97316";
      ctx.beginPath(); ctx.ellipse(-12, -8, 8, 5, 0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(12, -8, 8, 5, -0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      
      ctx.fillStyle = "#ffffff";
      ctx.beginPath(); ctx.ellipse(-14, -4, 5, 3, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(14, -4, 5, 3, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      ctx.fillStyle = "#f97316";
      ctx.beginPath(); ctx.ellipse(0, -18, 14, 16, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath(); ctx.ellipse(0, -16, 9, 11, 0, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = "#ec4899"; ctx.fillRect(-10, -32, 20, 4); ctx.strokeRect(-10, -32, 20, 4);
      ctx.fillStyle = "#f59e0b"; ctx.beginPath(); ctx.arc(0, -29, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      ctx.fillStyle = "#f97316";
      ctx.beginPath(); ctx.arc(0, -42, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      ctx.beginPath(); ctx.moveTo(-11, -52); ctx.lineTo(-17, -68); ctx.lineTo(-2, -55); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.moveTo(-10, -53); ctx.lineTo(-15, -64); ctx.lineTo(-4, -55); ctx.closePath(); ctx.fill();

      ctx.fillStyle = "#f97316";
      ctx.beginPath(); ctx.moveTo(11, -52); ctx.lineTo(17, -68); ctx.lineTo(2, -55); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.moveTo(10, -53); ctx.lineTo(15, -64); ctx.lineTo(4, -55); ctx.closePath(); ctx.fill();

      ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.ellipse(0, -38, 7, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(0, -41, 2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#000000"; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(-2, -39, 2, 0, Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.arc(2, -39, 2, 0, Math.PI); ctx.stroke();

      ctx.fillStyle = "#000000";
      ctx.beginPath(); ctx.ellipse(-6, -45, 3, 4.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(6, -45, 3, 4.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath(); ctx.arc(-5, -47, 1.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(7, -47, 1.2, 0, Math.PI * 2); ctx.fill();

      const waveAngle = Math.sin(frame * 0.3) * 12;

      ctx.strokeStyle = "#f97316"; ctx.lineWidth = 6; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(-8, -26); ctx.lineTo(-18 - waveAngle, -40); ctx.stroke();
      ctx.strokeStyle = "#000000"; ctx.lineWidth = 1.8; ctx.stroke();
      ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(-18 - waveAngle, -40, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      ctx.strokeStyle = "#f97316"; ctx.lineWidth = 6; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(8, -26); ctx.lineTo(18 + waveAngle, -40); ctx.stroke();
      ctx.strokeStyle = "#000000"; ctx.lineWidth = 1.8; ctx.stroke();
      ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(18 + waveAngle, -40, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    } else {
      ctx.save(); ctx.translate(-16, -14); ctx.rotate(0.2 + tailSway);
      ctx.fillStyle = "#f97316";
      ctx.beginPath(); ctx.quadraticCurveTo(-15, -20, -10, -32); ctx.quadraticCurveTo(-2, -15, 0, 0); ctx.fill(); ctx.stroke();
      ctx.restore();

      const rearLeftX = -12 + gaitCycle * 0.6;
      const rearRightX = -6 - gaitCycle * 0.6;

      ctx.strokeStyle = "#f97316"; ctx.lineWidth = 6; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(-12, -12); ctx.lineTo(rearLeftX, -2); ctx.stroke();
      ctx.strokeStyle = "#000000"; ctx.lineWidth = 1.8; ctx.stroke();
      ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.ellipse(rearLeftX, -1, 4.5, 2.8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      ctx.strokeStyle = "#f97316"; ctx.lineWidth = 6; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(-6, -12); ctx.lineTo(rearRightX, -2); ctx.stroke();
      ctx.strokeStyle = "#000000"; ctx.lineWidth = 1.8; ctx.stroke();
      ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.ellipse(rearRightX, -1, 4.5, 2.8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      ctx.fillStyle = "#f97316";
      ctx.beginPath(); ctx.ellipse(-2, -16, 16, 11, -0.1, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath(); ctx.ellipse(2, -13, 10, 7, 0, 0, Math.PI * 2); ctx.fill();

      const frontLeftX = 8 - gaitCycle * 0.8;
      const frontRightX = 14 + gaitCycle * 0.8;

      if (state === 'ROLL_SNOW') {
        const rollPushLeft = Math.sin(frame * 0.3) * 4;
        const rollPushRight = -Math.sin(frame * 0.3) * 4;

        ctx.strokeStyle = "#f97316"; ctx.lineWidth = 5.5; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(6, -14); ctx.lineTo(14 + rollPushLeft, -8); ctx.stroke();
        ctx.strokeStyle = "#000000"; ctx.lineWidth = 1.8; ctx.stroke();
        ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(14 + rollPushLeft, -8, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        ctx.strokeStyle = "#f97316"; ctx.lineWidth = 5.5; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(10, -14); ctx.lineTo(18 + rollPushRight, -10); ctx.stroke();
        ctx.strokeStyle = "#000000"; ctx.lineWidth = 1.8; ctx.stroke();
        ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(18 + rollPushRight, -10, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        if (ballRadius > 0) {
          const bx = 16 + ballRadius; const by = -ballRadius + 2;
          drawLumpySnowball(bx, by, ballRadius, frame * 0.08);
        }

      } else {
        ctx.strokeStyle = "#f97316"; ctx.lineWidth = 5.5; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(6, -12); ctx.lineTo(frontLeftX, -2); ctx.stroke();
        ctx.strokeStyle = "#000000"; ctx.lineWidth = 1.8; ctx.stroke();
        ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.ellipse(frontLeftX, -1, 4, 2.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        ctx.strokeStyle = "#f97316"; ctx.lineWidth = 5.5; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(12, -12); ctx.lineTo(frontRightX, -2); ctx.stroke();
        ctx.strokeStyle = "#000000"; ctx.lineWidth = 1.8; ctx.stroke();
        ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.ellipse(frontRightX, -1, 4, 2.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }

      ctx.fillStyle = "#ec4899"; ctx.fillRect(10, -26, 4, 10); ctx.strokeRect(10, -26, 4, 10);
      ctx.fillStyle = "#f59e0b"; ctx.beginPath(); ctx.arc(12, -16, 2.8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      ctx.fillStyle = "#f97316";
      ctx.beginPath(); ctx.arc(15, -28, 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      ctx.beginPath(); ctx.moveTo(6, -36); ctx.lineTo(4, -50); ctx.lineTo(14, -40); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.moveTo(7, -37); ctx.lineTo(5, -46); ctx.lineTo(13, -39); ctx.closePath(); ctx.fill();

      ctx.fillStyle = "#f97316";
      ctx.beginPath(); ctx.moveTo(18, -38); ctx.lineTo(24, -52); ctx.lineTo(26, -36); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.moveTo(19, -38); ctx.lineTo(23, -48); ctx.lineTo(25, -37); ctx.closePath(); ctx.fill();

      ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.ellipse(21, -25, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(22.5, -27, 1.8, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#000000"; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(21, -25, 1.6, 0.1, Math.PI - 0.1); ctx.stroke();

      ctx.fillStyle = "#000000";
      ctx.beginPath(); ctx.ellipse(19, -31, 2.5, 3.8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath(); ctx.arc(20, -32.5, 1, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = "#f472b6";
      ctx.beginPath(); ctx.ellipse(16, -24, 2.5, 1.5, 0, 0, Math.PI * 2); ctx.fill();

      ctx.strokeStyle = "#000000"; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(22, -27); ctx.lineTo(32, -29); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(22, -25); ctx.lineTo(32, -24); ctx.stroke();

      if (holdingItem) {
        ctx.fillStyle = "#ea580c"; ctx.beginPath();
        ctx.moveTo(22, -24); ctx.lineTo(34, -20); ctx.lineTo(24, -18); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "#582f0e"; ctx.lineWidth = 2.5; ctx.beginPath();
        ctx.moveTo(18, -26); ctx.lineTo(32, -34); ctx.stroke();
      }
    }

    ctx.restore();
  }

  function updateCat() {
    cat.frame++;
    if (waveCooldown > 0) waveCooldown--;

    const minX = 60;
    const targetSnowman = snowmen[currentSnowmanIdx];
    const targetX = targetSnowman ? (width * targetSnowman.xRatio - 40) : width * 0.8;

    if (Math.abs(cat.x - cat.lastFpX) > 12) {
      const catCol = Math.floor(Math.max(0, cat.x) / colWidth);
      const groundY = height - (groundHeights[catCol] || 0) - 15;
      addPawprint(cat.x, groundY);
      cat.lastFpX = cat.x;
    }

    if (cat.state === 'WAVING') {
      cat.timer++;
      if (cat.timer > 100) {
        cat.state = (cat.prevState && cat.prevState !== 'WAVING') ? cat.prevState : 'ROLL_SNOW';
        cat.timer = 0;
      }
      return;
    }

    if (cat.state === 'CRYING') {
      cat.timer++;
      if (cat.timer > 180) {
        cat.state = 'ROLL_SNOW';
        currentSnowmanIdx = 0;
        cat.x = minX;
        cat.timer = 0;
        saveSnowState();
      }
      return;
    }

    if (currentSnowmanIdx < snowmen.length) {
      if (cat.state === 'RETURNING') {
        cat.facingRight = false;
        cat.holdingItem = false;
        cat.x -= cat.speed;
        if (cat.x <= minX) {
          cat.state = 'ROLL_SNOW';
          cat.facingRight = true;
          cat.snowBallRadius = 5;
          saveSnowState();
        }
      } else if (cat.state === 'ROLL_SNOW') {
        cat.facingRight = true;
        cat.holdingItem = false;
        cat.x += cat.speed;

        if (cat.snowBallRadius < 18) cat.snowBallRadius += 0.04;

        if (cat.x >= targetX) {
          targetSnowman.volume += 120;
          if (targetSnowman.volume >= maxVolumePerSnowman) {
            cat.state = 'FETCH_STICK';
          } else {
            cat.state = 'RETURNING';
          }
          cat.snowBallRadius = 0;
          saveSnowState();
        }
      } else if (cat.state === 'FETCH_STICK') {
        cat.facingRight = false;
        cat.holdingItem = false;
        cat.x -= cat.speed * 1.1;
        if (cat.x <= minX) {
          cat.state = 'DELIVER_STICK';
          cat.holdingItem = true;
          saveSnowState();
        }
      } else if (cat.state === 'DELIVER_STICK') {
        cat.facingRight = true;
        cat.holdingItem = true;
        cat.x += cat.speed * 1.1;
        if (cat.x >= targetX) {
          targetSnowman.decorated = true;
          cat.holdingItem = false;
          currentSnowmanIdx++;
          cat.state = 'RETURNING';
          saveSnowState();
        }
      }
    } else {
      if (!dogsActive) {
        spawnDogsAttack();
      }
    }
  }

  function updateDogs() {
    if (!dogsActive) return;

    let allDogsFinished = true;

    dogs.forEach(d => {
      d.frame++;
      d.x += d.speed;

      if ((d.speed > 0 && d.x < width + 100) || (d.speed < 0 && d.x > -100)) {
        allDogsFinished = false;
      }

      snowmen.forEach(s => {
        const smX = width * s.xRatio;
        if (Math.abs(d.x - smX) < 35 && s.volume > 0) {
          s.volume = 0;
          s.decorated = false;
          d.jumpY = -14;
        }
      });

      if (d.jumpY < 0) d.jumpY += 1;
    });

    if (allDogsFinished) {
      dogsActive = false;
      dogs = [];
      cat.state = 'CRYING';
      cat.timer = 0;
      saveSnowState();
    }
  }

  function drawGroundTerrain() {
    ctx.save();
    let maxH = 20;
    for (let c = 0; c < numCols; c++) { if (groundHeights[c] > maxH) maxH = groundHeights[c]; }

    const groundGrad = ctx.createLinearGradient(0, height - maxH - 12, 0, height);
    groundGrad.addColorStop(0, "#ffffff");
    groundGrad.addColorStop(0.3, "#f1f5f9");
    groundGrad.addColorStop(1, "rgba(148, 163, 184, 0.95)");

    ctx.fillStyle = groundGrad; ctx.beginPath(); ctx.moveTo(0, height);
    for (let c = 0; c < numCols; c++) { ctx.lineTo(c * colWidth, height - groundHeights[c] - 15); }
    ctx.lineTo(width, height); ctx.closePath(); ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.95)"; ctx.lineWidth = 2; ctx.beginPath();
    for (let c = 0; c < numCols; c++) {
      const h = height - groundHeights[c] - 15;
      if (c === 0) ctx.moveTo(0, h); else ctx.lineTo(c * colWidth, h);
    }
    ctx.stroke(); ctx.restore();
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    flakes.forEach((f) => {
      ctx.beginPath(); ctx.fillStyle = `rgba(255, 255, 255, ${f.opacity})`;
      ctx.arc(f.x, f.y, f.r * f.z, 0, Math.PI * 2); ctx.fill();

      f.sway += f.swaySpeed;
      f.y += f.speed * f.z;
      f.x += Math.sin(f.sway) * 0.6 * f.z;

      handleFlakeCollision(f);
    });

    drawGroundTerrain();
    drawPawprints();

    snowmen.forEach(s => {
      const smX = width * s.xRatio;
      const smCol = Math.floor(smX / colWidth);
      const groundY = height - (groundHeights[smCol] || 0) - 15;
      drawSnowman(smX, groundY, s.volume, s.decorated);
    });

    updateDogs();
    dogs.forEach(d => {
      const dCol = Math.floor(Math.max(0, Math.min(width, d.x)) / colWidth);
      const dGroundY = height - (groundHeights[dCol] || 0) - 15 + d.jumpY;
      drawDog(d.x, dGroundY, d.facingRight, d.frame);
    });

    updateCat();
    const catCol = Math.floor(Math.max(0, Math.min(width, cat.x)) / colWidth);
    const catGroundY = height - (groundHeights[catCol] || 0) - 15;
    drawCatCharacter(cat.x, catGroundY, cat.state, cat.frame, cat.facingRight, cat.snowBallRadius, cat.holdingItem);

    requestAnimationFrame(render);
  }

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    numCols = Math.ceil(width / colWidth);
    groundHeights = new Float32Array(numCols).fill(0);
  });

  render();
}


/* ==========================================
   5. FAIL-SAFE APPLICATION BOOTSTRAPPER
   ========================================== */

document.addEventListener("DOMContentLoaded", () => {
  try { window.checkRememberedSession(); } catch(e) { console.error("Session check error:", e); }
  
  try { restoreBentoLayout(); } catch(e){}
  try { restoreAppearanceSettings(); } catch(e){}
  try { initWallpaperPicker(); } catch(e){}
  try { initWidgetManagerUI(); } catch(e){}
  try { initDataStore(); } catch(e){}
  try { initHandoverStore(); } catch(e){}
  try { renderSidebar(); } catch(e){}
  try { initDraggableSidebar(); } catch(e){}
  try { fetchLiveGames(); } catch(e){}
  try { fetchRealtimeWeather(); } catch(e){}
  try { renderClocks(); setInterval(updateClocksTick, 1000); } catch(e){}
  try { initTrendChart(); } catch(e){}
  try { listenToLiveDutyRoster(); } catch(e){}
  try { initSnowEffect(); } catch(e) { console.error("Snow Canvas Error:", e); }

  // Safe init for draggable bento cards and resize observers after DOM tree is constructed
  try {
    document.querySelectorAll(".bento-card").forEach(makeElementDraggable);
    if (window.ResizeObserver) { 
      const resizeObserver = new ResizeObserver(() => { 
        if (trendChartInstance) trendChartInstance.resize(); 
        saveBentoLayout(); 
      }); 
      document.querySelectorAll(".bento-card").forEach(card => resizeObserver.observe(card)); 
    }
  } catch(e) { console.error("Draggable UI Setup Error:", e); }
});
