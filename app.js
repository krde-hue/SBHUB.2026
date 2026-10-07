const DEFAULT_USER = "sportsbook2026";
const DEFAULT_PASS = "sb2026";

/* --- HELPER FOR MOBILE SCREEN DETECTION --- */
const isMobileDevice = () => window.innerWidth <= 768;

/* --- FIREBASE ROSTER INITIALIZATION --- */
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

let selectedGameDayOffset = 0;

/* --- MOBILE DRAWER NAVIGATION SYSTEM --- */
function toggleMobileSidebar(forceState) {
  const sidebar = document.getElementById('mainSidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (!sidebar || !overlay) return;

  const isActive = forceState !== undefined ? forceState : !sidebar.classList.contains('mobile-open');

  if (isActive) {
    sidebar.classList.add('mobile-open');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  } else {
    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

/* --- BRAND DIRECTORY TAB DATA & SWITCHER --- */
const brandTabData = {
  ibet: [
    { name: "IBET ADMIN", url: "https://mga-betbook.center/ibet/bets" },
    { name: "IBET BETSSON", url: "https://b2b.betssonbusiness.com/" },
    { name: "BET CONSTRUCT", url: "https://backoffice.betconstruct.com/" }
  ],
  edge: [
    { name: "KT SBX", url: "https://p2ibet.sbx.bet/bets" },
    { name: "KT PROJECTS", url: "https://kickertech.atlassian.net/jira/projects" },
    { name: "EDGE ADMIN", url: "https://admin.edgegaming.io/admin/qbet/homepage" },
    { name: "SERVICE DESK", url: "https://kickertech.atlassian.net/servicedesk/customer/user/login?destination=portals" }
  ],
  pubs: [
    { name: "GO GAMING", url: "https://gg-backoffice-eu.gogaming.cc/en-US/member/list" }
  ]
};

function switchBrandTab(tabName) {
  document.querySelectorAll('.tab-pill').forEach(pill => pill.classList.remove('active'));
  const activePill = document.getElementById(`tab-${tabName}`);
  if (activePill) activePill.classList.add('active');

  const container = document.getElementById('brandLinksContainer');
  if (!container) return;
  container.innerHTML = '';

  const items = brandTabData[tabName] || [];
  items.forEach(item => {
    const a = document.createElement('a');
    a.className = 'action-row';
    a.href = item.url;
    if (item.url !== '#') a.target = '_blank';
    a.innerHTML = `<span>${item.name}</span><i class='bx bx-right-arrow-alt'></i>`;
    container.appendChild(a);
  });
}

/* --- DYNAMIC MARKET BOOST DESCRIPTION GENERATOR --- */
function generateScriptedMarket(homeName, awayName, index) {
  const templates = [
    `${homeName} to Win + Over 2.5 Goals`,
    `${homeName} vs ${awayName} - Both Teams to Score`,
    `${homeName} to Win + Have 2+ Goals`,
    `${awayName} to Win or Draw + Over 1.5 Goals`,
    `${homeName} vs ${awayName} - Both Teams to Score + Over 2.5 Goals`,
    `${homeName} to Win First Half & Over 1.5 Goals`
  ];
  return templates[index % templates.length];
}

/* --- RANKED PRIORITY TOURNAMENTS --- */
const PRIORITY_LEAGUES = [
  { rank: 1, key: "uefa.champions", name: "UEFA Champions League", code: "uefa.champions" },
  { rank: 2, key: "eng.1",          name: "Premier League",         code: "eng.1" },
  { rank: 3, key: "esp.1",          name: "La Liga",                code: "esp.1" },
  { rank: 4, key: "ger.1",          name: "Bundesliga",             code: "ger.1" },
  { rank: 5, key: "ita.1",          name: "Serie A",                code: "ita.1" },
  { rank: 6, key: "fra.1",          name: "Ligue 1",                code: "fra.1" },
  { rank: 7, key: "por.1",          name: "Primeira Liga",          code: "por.1" },
  { rank: 8, key: "ned.1",          name: "Eredivisie",             code: "ned.1" }
];

const TOP_TIER_LEAGUES = PRIORITY_LEAGUES;
const SECONDARY_LEAGUES = [
  { name: "UEFA Nations League", code: "uefa.nations" },
  { name: "Major League Soccer", code: "usa.1" },
  { name: "Veikkausliiga", code: "fin.1" },
  { name: "Eliteserien", code: "nor.1" }
];

let cachedTopPicks = [];
let currentFilterKey = 'eng.1'; // Default active tab is EPL

function getLeagueDisplayName(key) {
  const lg = PRIORITY_LEAGUES.find(l => l.key === key);
  return lg ? lg.name : key.toUpperCase();
}

/* --- INSTANT LOCAL STORAGE CACHE LOADER (0ms PAGE LOAD) --- */
function loadCachedTopPicks() {
  try {
    const stored = localStorage.getItem('sbhub_toppicks_cache');
    if (stored) {
      cachedTopPicks = JSON.parse(stored);
      renderFilteredTopPicks();
    }
  } catch (e) {
    console.warn("Could not parse top picks cache:", e);
  }
}

/* --- PARALLEL FETCHING ENGINE WITH FULL MATCHDAY COVERAGE (&limit=100) --- */
async function fetchTopPicksAndBoosts() {
  const container = document.getElementById('topPicksContainer');
  if (!container) return;

  try {
    const now = new Date();
    const seenMatchKeys = new Set();

    // Query target matchday dates (Oct 10, 11, 12, 14) with limit=100
    // so ESPN returns ALL games in the daily lineup for La Liga, EPL, etc.
    const targetDates = ["20261010", "20261011", "20261012", "20261014"];

    const fetchPromises = [];
    for (const league of PRIORITY_LEAGUES) {
      for (const dateStr of targetDates) {
        fetchPromises.push(
          fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league.code}/scoreboard?dates=${dateStr}&limit=100`)
            .then(res => res.ok ? res.json() : null)
            .then(data => ({ league, data }))
            .catch(() => null)
        );
      }
    }

    const results = await Promise.all(fetchPromises);
    let apiPicks = [];

    for (const resItem of results) {
      if (!resItem || !resItem.data || !resItem.data.events) continue;
      const { league, data } = resItem;

      for (const evt of data.events) {
        const gameState = evt.status?.type?.state;
        const evtDate = new Date(evt.date);

        // Strict pre-kickoff rule: Disappears instantly once match kicks off or goes live
        if (gameState !== 'pre' || evtDate <= now) continue;

        const comp = evt.competitions?.[0];
        if (!comp) continue;

        const homeTeam = comp.competitors?.find(c => c.homeAway === 'home');
        const awayTeam = comp.competitors?.find(c => c.homeAway === 'away');

        if (homeTeam && awayTeam) {
          const homeName = homeTeam.team?.shortDisplayName || homeTeam.team?.displayName || "Home";
          const awayName = awayTeam.team?.shortDisplayName || awayTeam.team?.displayName || "Away";

          const matchKey = evt.id || `${homeName}-${awayName}-${evt.date}`;
          if (seenMatchKeys.has(matchKey)) continue;
          seenMatchKeys.add(matchKey);

          const homeLogo = homeTeam.team?.logo || homeTeam.team?.logos?.[0]?.href || "https://a.espncdn.com/i/teamlogos/soccer/500/default.png";
          const awayLogo = awayTeam.team?.logo || awayTeam.team?.logos?.[0]?.href || "https://a.espncdn.com/i/teamlogos/soccer/500/default.png";

          const kickOffStr = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Asia/Manila',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }).format(evtDate).toUpperCase();

          const scriptedMarket = generateScriptedMarket(homeName, awayName, apiPicks.length);

          apiPicks.push({
            leagueKey: league.key,
            leagueRank: league.rank,
            kickOffTimestamp: evtDate.getTime(),
            homeName,
            awayName,
            homeLogo,
            awayLogo,
            leagueName: data.leagues?.[0]?.name || league.name,
            market: scriptedMarket,
            badge: (apiPicks.length % 2 === 0) ? "TOP PICK" : "HOT",
            kickOff: kickOffStr
          });
        }
      }
    }

    // Sort by League Rank first, then chronologically by kickoff time
    apiPicks.sort((a, b) => {
      if (a.leagueRank !== b.leagueRank) return a.leagueRank - b.leagueRank;
      return a.kickOffTimestamp - b.kickOffTimestamp;
    });

    if (apiPicks.length > 0) {
      cachedTopPicks = apiPicks;
      localStorage.setItem('sbhub_toppicks_cache', JSON.stringify(apiPicks));
    }
    
    renderFilteredTopPicks();
  } catch (e) {
    console.error("Fetch Top Picks Error:", e);
    renderFilteredTopPicks();
  }
}

/* --- FILTER AND RENDER TOP PICKS BY SELECTED TOURNAMENT --- */
function filterTopPicks(leagueKey, btnElement) {
  currentFilterKey = leagueKey;

  document.querySelectorAll('.boost-filter-btn').forEach(btn => btn.classList.remove('active'));
  if (btnElement) {
    btnElement.classList.add('active');
  } else {
    const defaultBtn = document.getElementById(`btn-boost-${leagueKey}`);
    if (defaultBtn) defaultBtn.classList.add('active');
  }

  renderFilteredTopPicks();
}

function renderFilteredTopPicks() {
  const container = document.getElementById('topPicksContainer');
  if (!container) return;

  const now = new Date();

  // Guarantee any pick that reached kickoff time while user is viewing is removed
  let activePicks = cachedTopPicks.filter(pick => pick.kickOffTimestamp > now.getTime());
  let displayPicks = activePicks.filter(pick => pick.leagueKey === currentFilterKey);

  // Display notice if no real pre-kickoff matches exist for the selected category
  if (displayPicks.length === 0) {
    const categoryLabel = getLeagueDisplayName(currentFilterKey);
    container.innerHTML = `<div style="text-align:center; padding:25px; width:100%; font-size:12px; font-weight:600; color:rgba(255,255,255,0.65);">No upcoming scheduled ${categoryLabel} matches available at this time.</div>`;
    return;
  }

  displayPicks = displayPicks.slice(0, 12);

  let cardsHtml = "";
  displayPicks.forEach(pick => {
    const isTopPick = pick.badge === "TOP PICK";
    cardsHtml += `
      <div class="boost-card ${isTopPick ? 'highlight-border' : ''}">
        <div class="flags-row">
          <img src="${pick.homeLogo}" alt="${pick.homeName}" class="team-flag-img" onerror="this.src='https://a.espncdn.com/i/teamlogos/soccer/500/default.png'">
          <span class="vs-text">VS</span>
          <img src="${pick.awayLogo}" alt="${pick.awayName}" class="team-flag-img" onerror="this.src='https://a.espncdn.com/i/teamlogos/soccer/500/default.png'">
        </div>
        
        <div class="boost-match-info">
          <div class="boost-match-title">${pick.homeName} <span class="vs-light">vs</span> ${pick.awayName}</div>
          <div class="boost-league-sub">${pick.leagueName}</div>
        </div>

        <div>
          <span class="boost-badge ${isTopPick ? 'top-pick' : 'hot'}">${pick.badge}</span>
        </div>

        <div class="boost-market-desc">${pick.market}</div>

        <div class="boost-card-bottom">
          <div class="boost-kickoff-pill"><i class='bx bx-time-five'></i> ${pick.kickOff}</div>
        </div>
      </div>
    `;
  });

  container.innerHTML = cardsHtml;
}

/* --- ANIMATED PLASMA BACKGROUND CANVAS --- */
const canvas = document.getElementById('bgCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let width = 0, height = 0, particles = [];

function resizeCanvas() {
  if (!canvas) return;
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
  initParticles();
}
window.addEventListener('resize', () => {
  resizeCanvas();
  if (!isMobileDevice()) toggleMobileSidebar(false);
});

class Particle {
  constructor() {
    this.reset();
  }
  reset() {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.radius = Math.random() * (isMobileDevice() ? 1.5 : 2) + 1;
    this.vx = (Math.random() - 0.5) * (isMobileDevice() ? 0.4 : 0.8);
    this.vy = (Math.random() - 0.5) * (isMobileDevice() ? 0.4 : 0.8);
    this.alpha = Math.random() * 0.4 + 0.1;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < 0 || this.x > width) this.vx *= -1;
    if (this.y < 0 || this.y > height) this.vy *= -1;
  }
  draw() {
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(56, 189, 248, ${this.alpha})`;
    if (!isMobileDevice()) {
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#00f2fe';
    } else {
      ctx.shadowBlur = 0;
    }
    ctx.fill();
  }
}

function initParticles() {
  if (!canvas) return;
  particles = [];
  const particleCount = isMobileDevice() ? 15 : 45;
  for (let i = 0; i < particleCount; i++) particles.push(new Particle());
}

resizeCanvas();

function animateCanvas() {
  if (!canvas || !ctx) return;
  ctx.clearRect(0, 0, width, height);
  particles.forEach(p => {
    p.update();
    p.draw();
  });
  requestAnimationFrame(animateCanvas);
}
if (canvas) animateCanvas();

/* --- SITTING ROBOT EYE & HEAD TRACKING --- */
document.addEventListener('mousemove', (e) => {
  if (isMobileDevice()) return;

  const robotStage = document.getElementById('sittingRobotStage');
  const authOverlay = document.getElementById('authOverlay');
  if (!robotStage || (authOverlay && authOverlay.classList.contains('unlocked'))) return;

  const leftEye = document.getElementById('leftEye');
  const rightEye = document.getElementById('rightEye');
  const robotHead = document.getElementById('robotHead');
  const robotBodyWrapper = document.getElementById('robotBodyWrapper');

  const rect = robotStage.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const deltaX = e.clientX - centerX;
  const deltaY = e.clientY - centerY;
  const angle = Math.atan2(deltaY, deltaX);

  const eyeDist = Math.min(5, Math.hypot(deltaX, deltaY) / 35);
  const eyeX = Math.cos(angle) * eyeDist;
  const eyeY = Math.sin(angle) * eyeDist;

  if (leftEye && rightEye) {
    leftEye.style.transform = `translate(${eyeX}px, ${eyeY}px)`;
    rightEye.style.transform = `translate(${eyeX}px, ${eyeY}px)`;
  }

  const rotateY = Math.max(-25, Math.min(25, deltaX / 20));
  const rotateX = Math.max(-15, Math.min(15, -deltaY / 25));

  if (robotHead) robotHead.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  if (robotBodyWrapper) robotBodyWrapper.style.transform = `rotateY(${rotateY * 0.3}deg)`;
});

/* --- WORLD CLOCKS SYSTEM --- */
function updateWorldClocks() {
  const now = new Date();
  const optionsGMT8 = { timeZone: 'Asia/Singapore', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };
  const gmt8El = document.getElementById('clock-gmt8');
  if (gmt8El) gmt8El.textContent = new Intl.DateTimeFormat('en-GB', optionsGMT8).format(now);

  const optionsCET = { timeZone: 'Europe/Berlin', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };
  const cetEl = document.getElementById('clock-cet');
  if (cetEl) cetEl.textContent = new Intl.DateTimeFormat('en-GB', optionsCET).format(now);

  const optionsGMT2 = { timeZone: 'Europe/Athens', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };
  const gmt2El = document.getElementById('clock-gmt2');
  if (gmt2El) gmt2El.textContent = new Intl.DateTimeFormat('en-GB', optionsGMT2).format(now);
}
setInterval(updateWorldClocks, 1000);
updateWorldClocks();

/* --- REAL-TIME PHILIPPINES (MANILA) WEATHER FORECAST --- */
async function fetchManilaWeather() {
  const tempEl = document.getElementById('weatherTemp');
  const condEl = document.getElementById('weatherCond');
  const humEl = document.getElementById('weatherHumidity');
  const windEl = document.getElementById('weatherWind');
  const iconEl = document.getElementById('weatherIcon');

  if (!tempEl) return;

  try {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=14.5995&longitude=120.9842&current_weather=true&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=Asia%2FManila';
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network error');
    const data = await response.json();

    let temp, humidity, wind, code;

    if (data && data.current) {
      temp = Math.round(data.current.temperature_2m ?? data.current_weather?.temperature);
      humidity = data.current.relative_humidity_2m ?? 56;
      wind = Math.round(data.current.wind_speed_10m ?? data.current_weather?.windspeed ?? 7);
      code = data.current.weather_code ?? data.current_weather?.weathercode ?? 3;
    } else if (data && data.current_weather) {
      temp = Math.round(data.current_weather.temperature);
      humidity = 56;
      wind = Math.round(data.current_weather.windspeed);
      code = data.current_weather.weathercode;
    } else {
      throw new Error('Invalid weather payload');
    }

    const weatherMeta = parseWMOWeatherCode(code);

    tempEl.textContent = `${temp}°C`;
    if (condEl) condEl.textContent = weatherMeta.label;
    if (humEl) humEl.textContent = `Humidity: ${humidity}%`;
    if (windEl) windEl.textContent = `Wind: ${wind} km/h`;

    if (iconEl) {
      iconEl.className = `bx ${weatherMeta.icon}`;
      iconEl.style.color = weatherMeta.color;
    }
  } catch (err) {
    console.warn('Weather fetch fallback triggered:', err);
    tempEl.textContent = '32°C';
    if (condEl) condEl.textContent = 'OVERCAST';
    if (humEl) humEl.textContent = 'Humidity: 56%';
    if (windEl) windEl.textContent = 'Wind: 7 km/h';
  }
}

function parseWMOWeatherCode(code) {
  if (code === 0) return { label: 'CLEAR SKY', icon: 'bx-sun', color: '#f59e0b' };
  if (code === 1 || code === 2) return { label: 'PARTLY CLOUDY', icon: 'bx-cloud-sun', color: '#f59e0b' };
  if (code === 3) return { label: 'OVERCAST', icon: 'bx-cloud', color: '#38bdf8' };
  if (code >= 45 && code <= 48) return { label: 'FOGGY', icon: 'bx-cloud-fog', color: '#94a3b8' };
  if (code >= 51 && code <= 67) return { label: 'LIGHT RAIN', icon: 'bx-cloud-drizzle', color: '#60a5fa' };
  if (code >= 80 && code <= 82) return { label: 'HEAVY RAIN', icon: 'bx-cloud-showers-heavy', color: '#3b82f6' };
  if (code >= 95) return { label: 'THUNDERSTORM', icon: 'bx-cloud-lightning', color: '#eab308' };
  return { label: 'CLOUDY', icon: 'bx-cloud', color: '#38bdf8' };
}

/* --- AUTHENTICATION & PERSISTENT SESSION ENGINE --- */
function togglePasswordVisibility() {
  const passInput = document.getElementById('passwordInput');
  const icon = document.getElementById('togglePassIcon');
  if (!passInput || !icon) return;
  
  if (passInput.type === 'password') {
    passInput.type = 'text';
    icon.className = 'bx bx-hide';
  } else {
    passInput.type = 'password';
    icon.className = 'bx bx-show';
  }
}

function handleLogin(event) {
  event.preventDefault();
  const userInput = document.getElementById('usernameInput');
  const passInput = document.getElementById('passwordInput');
  const rememberCheckbox = document.getElementById('rememberMe');

  const userVal = userInput ? userInput.value.trim() : '';
  const passVal = passInput ? passInput.value : '';
  const isRemember = rememberCheckbox ? rememberCheckbox.checked : false;

  const errorMsg = document.getElementById('loginErrorMsg');
  const card = document.getElementById('loginCard');

  if ((userVal === DEFAULT_USER || userVal === "sportsbookhub") && passVal === DEFAULT_PASS) {
    if (isRemember) {
      localStorage.setItem('sbhub_auth', 'true');
    } else {
      sessionStorage.setItem('sbhub_auth', 'true');
    }
    unlockDashboard();
  } else {
    if (errorMsg) errorMsg.textContent = "ACCESS DENIED: Invalid Security Key";
    if (card) {
      card.classList.add('shake');
      setTimeout(() => {
        card.classList.remove('shake');
      }, 500);
    }
    if (passInput) {
      passInput.focus();
      passInput.select();
    }
  }
}

function unlockDashboard() {
  const authOverlay = document.getElementById('authOverlay');
  const dashboardApp = document.getElementById('dashboardApp');
  if (authOverlay) authOverlay.classList.add('unlocked');
  if (dashboardApp) dashboardApp.classList.add('unlocked');
}

function handleLogout() {
  localStorage.removeItem('sbhub_auth');
  sessionStorage.removeItem('sbhub_auth');

  const passInput = document.getElementById('passwordInput');
  if (passInput) passInput.value = '';
  const errorMsg = document.getElementById('loginErrorMsg');
  if (errorMsg) errorMsg.textContent = '';
  const dashboardApp = document.getElementById('dashboardApp');
  const authOverlay = document.getElementById('authOverlay');
  if (dashboardApp) dashboardApp.classList.remove('unlocked');
  if (authOverlay) authOverlay.classList.remove('unlocked');
}

/* --- UI TOGGLES & WIDGET MANAGEMENT --- */
function toggleMenu(menuId, btnElement) {
  const targetMenu = document.getElementById(menuId);
  if (!targetMenu) return;
  const isCollapsed = targetMenu.classList.contains('collapsed');
  const icon = btnElement ? btnElement.querySelector('.toggle-icon') : null;
  
  if (isCollapsed) {
    targetMenu.classList.remove('collapsed');
    if (icon) icon.style.transform = 'rotate(0deg)';
  } else {
    targetMenu.classList.add('collapsed');
    if (icon) icon.style.transform = 'rotate(-90deg)';
  }
}

function toggleDropdown(menuId) {
  const menu = document.getElementById(menuId);
  if (menu) menu.classList.toggle('show');
}

function toggleWidget(widgetId, show) {
  const el = document.getElementById(widgetId);
  if (el) el.style.display = show ? 'flex' : 'none';

  const checkbox = document.querySelector(`input[onchange*="${widgetId}"]`);
  if (checkbox) checkbox.checked = show;

  try {
    const savedWidgets = JSON.parse(localStorage.getItem('sbhub_widgets') || '{}');
    savedWidgets[widgetId] = show;
    localStorage.setItem('sbhub_widgets', JSON.stringify(savedWidgets));
  } catch(e) {
    console.warn("Could not save widget preference:", e);
  }
}

function hideWidgetDirect(widgetId) {
  toggleWidget(widgetId, false);
}

function restoreSavedWidgets() {
  try {
    const savedWidgets = JSON.parse(localStorage.getItem('sbhub_widgets') || '{}');
    Object.keys(savedWidgets).forEach(widgetId => {
      toggleWidget(widgetId, savedWidgets[widgetId]);
    });
  } catch(e) {
    console.warn("Could not load widget preferences:", e);
  }
}

/* --- ABSTRACT WALLPAPERS --- */
const ABSTRACT_WALLPAPERS = {
  '3d-chrome-swirl': 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2560&auto=format&fit=crop',
  'cyan-liquid-glass': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2560&auto=format&fit=crop',
  'deep-liquid-chrome': 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=2560&auto=format&fit=crop',
  'neon-line-ribbon': 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=2560&auto=format&fit=crop',
  'neural-wireframe': 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2560&auto=format&fit=crop',
  'dark-energy-vortex': 'https://images.unsplash.com/photo-1604076913837-52ab5629fba9?q=80&w=2560&auto=format&fit=crop'
};

/* --- THEME SWITCHER ENGINE --- */
function setGradient(theme) {
  const body = document.getElementById('pageBody');
  if (!body) return;
  let backgroundStyle = '';

  const lightThemes = ['plain-daylight', 'plain-sky-light', 'plain-warm-light'];
  if (lightThemes.includes(theme)) {
    body.classList.add('light-theme');
  } else {
    body.classList.remove('light-theme');
  }

  if (ABSTRACT_WALLPAPERS[theme]) {
    backgroundStyle = `url("${ABSTRACT_WALLPAPERS[theme]}")`;
  } else if (typeof theme === 'string' && (theme.startsWith('http') || theme.startsWith('url('))) {
    backgroundStyle = theme.startsWith('url(') ? theme : `url("${theme}")`;
  } else {
    switch(theme) {
      case 'plain-slate':
        backgroundStyle = 'linear-gradient(rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.95)), #0f172a';
        break;
      case 'plain-navy':
        backgroundStyle = 'linear-gradient(rgba(11, 19, 41, 0.95), rgba(11, 19, 41, 0.95)), #0b1329';
        break;
      case 'plain-onyx':
        backgroundStyle = 'linear-gradient(rgba(18, 18, 18, 0.95), rgba(18, 18, 18, 0.95)), #121212';
        break;
      case 'plain-daylight':
        backgroundStyle = 'linear-gradient(rgba(248, 250, 252, 0.95), rgba(248, 250, 252, 0.95)), #f8fafc';
        break;
      case 'plain-sky-light':
        backgroundStyle = 'linear-gradient(rgba(224, 242, 254, 0.95), rgba(224, 242, 254, 0.95)), #e0f2fe';
        break;
      case 'plain-warm-light':
        backgroundStyle = 'linear-gradient(rgba(245, 245, 244, 0.95), rgba(245, 245, 244, 0.95)), #f5f5f4';
        break;
      default:
        backgroundStyle = `url("${ABSTRACT_WALLPAPERS['3d-chrome-swirl']}")`;
    }
  }

  body.style.background = backgroundStyle;
  body.style.backgroundSize = 'cover';
  body.style.backgroundPosition = 'center';
  body.style.backgroundAttachment = 'fixed';
  body.style.backgroundRepeat = 'no-repeat';

  const themeMenu = document.getElementById('themeMenu');
  if (themeMenu) themeMenu.classList.remove('show');
  localStorage.setItem('sbhub_theme', theme);
}

/* --- REAL-TIME LIVE DUTY ROSTER (ACCURATE GMT+8 / MANILA TIME) --- */
function getGMT8IsoDate() {
  const nowManila = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  const year = nowManila.getFullYear();
  const month = String(nowManila.getMonth() + 1).padStart(2, '0');
  const day = String(nowManila.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCurrentSlotInfo() {
  const nowManila = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  const hours = nowManila.getHours();
  if (hours >= 6 && hours < 9)    return { slotId: "slot_6_9", label: "7:00 - 9:00" };
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

function renderLiveDutyWidget(rosterData) {
  const container = document.getElementById("liveDutyContent");
  if (!container) return;

  if (!rosterData) {
    container.innerHTML = `<div style="text-align:center; padding:15px; font-size:10px; color:rgba(255,255,255,0.7);">No roster data available.</div>`;
    return;
  }

  const todayIso = getGMT8IsoDate();
  const { slotId, label: slotLabel } = getCurrentSlotInfo();

  let activeDayKey = Object.keys(rosterData).find(key => {
    if (key === 'archives') return false;
    const entry = rosterData[key];
    return entry?.isoDate === todayIso || entry?.date === todayIso || key === todayIso || key.includes(todayIso);
  });

  if (!activeDayKey) {
    const activeKeys = Object.keys(rosterData).filter(k => k !== 'archives');
    activeKeys.sort((a, b) => {
      const dateA = rosterData[b]?.isoDate || rosterData[b]?.date || b;
      const dateB = rosterData[a]?.isoDate || rosterData[a]?.date || a;
      return String(dateA).localeCompare(String(dateB));
    });
    activeDayKey = activeKeys[0];
  }

  if (!activeDayKey || !rosterData[activeDayKey]) {
    container.innerHTML = `<div style="text-align:center; padding:15px; font-size:10px; color:rgba(255,255,255,0.7);">No active schedule found.</div>`;
    return;
  }

  const dayData = rosterData[activeDayKey];
  const displayDate = dayData.isoDate || dayData.date || todayIso;
  const teamMembers = [
    { id: 'ann', name: 'ANN' }, { id: 'dave', name: 'DAVE' },
    { id: 'ken', name: 'KEN' }, { id: 'kriztel', name: 'KRIZTEL' }
  ];

  let html = `
    <div style="font-size:11px; font-weight:700; opacity:0.9; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
      <span>📅 ${displayDate}</span>
      <span class="badge-time">⏰ ${slotLabel}</span>
    </div>
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
      <div class="duty-card">
        <div class="duty-top">
          <span>${m.name}</span>
          <span class="badge-time">${isRest ? restLabel : shiftId.replace('shift-', '')}</span>
        </div>
    `;

    if (isRest) {
      html += `<div class="duty-desc">Rest day.</div>`;
    } else if (tasks.length === 0) {
      html += `<div class="duty-desc">No assigned tasks in this slot.</div>`;
    } else {
      tasks.forEach(t => {
        html += `<div class="duty-desc" style="display:flex; gap:4px; align-items:center;">
          <i class='bx ${t.done ? 'bx-check-circle' : 'bx-time-five'}' style="color:${t.done ? '#34d399' : '#38bdf8'}"></i>
          <span style="${t.done ? 'text-decoration:line-through; opacity:0.6;' : ''}">${t.text}</span>
        </div>`;
      });
    }
    html += `</div>`;
  });

  container.innerHTML = html;
  calculateActiveTraders();
}

/* --- TOP GAMES ENGINE --- */
function getGMT8DateObj(offsetDays = 0) {
  const now = new Date();
  const gmt8String = now.toLocaleString("en-US", { timeZone: "Asia/Manila" });
  const gmt8Date = new Date(gmt8String);
  gmt8Date.setDate(gmt8Date.getDate() + offsetDays);
  return gmt8Date;
}

function getFormattedDateQuery(daysAhead) {
  const d = getGMT8DateObj(daysAhead);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

async function fetchLiveGames() {
  const container = document.getElementById("gamesContainer");
  if (!container) return;
  container.innerHTML = `<div style="text-align:center; padding:15px;"><i class='bx bx-loader-alt bx-spin' style="font-size:20px; color:#38bdf8;"></i></div>`;
  
  try {
    const targetDateQuery = getFormattedDateQuery(selectedGameDayOffset);
    const targetDateObj = getGMT8DateObj(selectedGameDayOffset);
    const dateLabelStr = targetDateObj.toLocaleDateString("en-US", { month: 'short', day: 'numeric' }).toUpperCase();
    
    let dayTag = `DAY ${selectedGameDayOffset + 1}`;
    if (selectedGameDayOffset === 0) dayTag = `TODAY`;

    const labelEl = document.getElementById("matchDayDisplay");
    if (labelEl) labelEl.textContent = `${dayTag} (${dateLabelStr})`;

    let matches = await fetchLeagueList(TOP_TIER_LEAGUES, targetDateQuery);

    if (matches.length < 10) {
      const secondaryMatches = await fetchLeagueList(SECONDARY_LEAGUES, targetDateQuery);
      const seenMatchKeys = new Set(matches.map(m => `${m.homeName}-${m.awayName}`));
      
      for (const sm of secondaryMatches) {
        const key = `${sm.homeName}-${sm.awayName}`;
        if (!seenMatchKeys.has(key)) {
          seenMatchKeys.add(key);
          matches.push(sm);
        }
      }
    }

    if (matches.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:20px; font-size:11px; color:rgba(255,255,255,0.65);">No scheduled fixtures for ${dateLabelStr} (GMT+8).</div>`;
      return;
    }

    matches = matches.slice(0, 10);

    let gamesHtml = "";
    matches.forEach(item => {
      gamesHtml += `
        <div class="top-game-card">
          <div class="top-game-flags">
            <img src="${item.homeLogo}" alt="${item.homeName}" class="team-flag-img" onerror="this.src='https://a.espncdn.com/i/teamlogos/soccer/500/default.png'">
            <span class="vs-text">vs</span>
            <img src="${item.awayLogo}" alt="${item.awayName}" class="team-flag-img" onerror="this.src='https://a.espncdn.com/i/teamlogos/soccer/500/default.png'">
          </div>
          <div class="top-game-title">${item.homeName} <span class="vs-light">vs</span> ${item.awayName}</div>
          <div class="top-game-league">${item.leagueName}${item.kickOffTime ? ' &bull; <span style="color:#38bdf8;">' + item.kickOffTime + '</span>' : ''}</div>
        </div>
      `;
    });

    container.innerHTML = gamesHtml;

  } catch (e) {
    console.error("Fetch Live Games Error:", e);
    container.innerHTML = `<div style="text-align:center; padding:10px; font-size:11px; color:#f87171;">Failed to fetch live fixture data.</div>`;
  }
}

async function fetchLeagueList(leagueList, dateQuery) {
  const uniqueCodeToLeagues = new Map();
  leagueList.forEach(league => {
    if (!uniqueCodeToLeagues.has(league.code)) {
      uniqueCodeToLeagues.set(league.code, league.name);
    }
  });

  const fetchPromises = Array.from(uniqueCodeToLeagues.entries()).map(([code, defaultName]) =>
    fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${code}/scoreboard?dates=${dateQuery}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => data ? { code, defaultName, data } : null)
      .catch(() => null)
  );

  const results = await Promise.all(fetchPromises);
  let matches = [];
  const seenMatchKeys = new Set();

  for (const item of results) {
    if (!item || !item.data || !item.data.events) continue;
    for (const evt of item.data.events) {
      if (matches.length >= 15) break;
      const comp = evt.competitions?.[0];
      if (!comp) continue;

      const homeTeam = comp.competitors?.find(c => c.homeAway === 'home');
      const awayTeam = comp.competitors?.find(c => c.homeAway === 'away');

      if (homeTeam && awayTeam) {
        const homeName = homeTeam.team?.shortDisplayName || homeTeam.team?.displayName || "Home";
        const awayName = awayTeam.team?.shortDisplayName || awayTeam.team?.displayName || "Away";

        const matchKey = evt.id || `${homeName}-${awayName}`;
        if (seenMatchKeys.has(matchKey)) continue;
        seenMatchKeys.add(matchKey);

        const homeLogo = homeTeam.team?.logo || homeTeam.team?.logos?.[0]?.href || "https://a.espncdn.com/i/teamlogos/soccer/500/default.png";
        const awayLogo = awayTeam.team?.logo || awayTeam.team?.logos?.[0]?.href || "https://a.espncdn.com/i/teamlogos/soccer/500/default.png";

        let kickOffTime = "";
        if (evt.date || comp.date) {
          const dObj = new Date(evt.date || comp.date);
          kickOffTime = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Asia/Manila',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }).format(dObj);
        }

        const displayedLeagueName = item.data.leagues?.[0]?.name || item.defaultName;

        matches.push({
          homeName,
          awayName,
          homeLogo,
          awayLogo,
          leagueName: displayedLeagueName,
          kickOffTime
        });
      }
    }
  }

  return matches;
}

function navigateMatchDay(dir) {
  selectedGameDayOffset += dir;
  if (selectedGameDayOffset < 0) selectedGameDayOffset = 6;
  if (selectedGameDayOffset > 6) selectedGameDayOffset = 0;
  fetchLiveGames();
}

function calculateActiveTraders() {
  const dutyCards = document.querySelectorAll('.duty-card');
  let activeCount = 0;
  dutyCards.forEach(card => {
    const timeBadge = card.querySelector('.badge-time');
    if (timeBadge) {
      const text = timeBadge.textContent.trim().toUpperCase();
      if (!text.includes('OFF') && !text.includes('REST') && !text.includes('RD') && !text.includes('LEAVE')) {
        activeCount++;
      }
    }
  });
  const el = document.getElementById('activeTraderCount');
  if (el) el.textContent = activeCount + ' Working';
}

/* --- INITIALIZATION --- */
function initDashboardApp() {
  const savedTheme = localStorage.getItem('sbhub_theme');
  if (savedTheme) {
    setGradient(savedTheme);
  } else {
    setGradient('3d-chrome-swirl');
  }

  if (localStorage.getItem('sbhub_auth') === 'true' || sessionStorage.getItem('sbhub_auth') === 'true') {
    unlockDashboard();
  }

  switchBrandTab('ibet');
  restoreSavedWidgets();

  // Load local cache instantly (0ms delay on refresh)
  loadCachedTopPicks();

  // Background fetch to update cached data
  fetchTopPicksAndBoosts();
  setInterval(fetchTopPicksAndBoosts, 2 * 60 * 1000);

  listenToLiveDutyRoster();
  fetchLiveGames();
  calculateActiveTraders();
  fetchManilaWeather();
  setInterval(fetchManilaWeather, 15 * 60 * 1000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboardApp);
} else {
  initDashboardApp();
}

window.addEventListener('click', function(e) {
  if (!e.target.closest('.dropdown-container')) {
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
  }
});
