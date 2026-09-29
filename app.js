const DEFAULT_USER = "sportsbook2026";
const DEFAULT_PASS = "sb2026";

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

/* --- BRAND DIRECTORY TAB DATA & SWITCHER --- */
const brandTabData = {
  ibet: [
    { name: "IBET ADMIN", url: "https://mga-betbook.center/ibet/bets" },
    { name: "BETSSON", url: "https://b2b.betssonbusiness.com/" },
    { name: "BET CONSTRUCT", url: "https://backoffice.betconstruct.com/" }
  ],
  edge: [
    { name: "KT SBX", url: "https://p2ibet.sbx.bet/bets" },
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

/* --- REAL-TIME TOP PICKS / HOT BOOSTS ENGINE --- */
async function fetchTopPicksAndBoosts() {
  const container = document.getElementById('topPicksContainer');
  if (!container) return;

  try {
    const primaryLeagues = [
      { code: "uefa.champions", name: "UEFA Champions League" },
      { code: "eng.1", name: "Premier League" },
      { code: "esp.1", name: "La Liga" },
      { code: "ger.1", name: "Bundesliga" },
      { code: "ita.1", name: "Serie A" },
      { code: "fra.1", name: "Ligue 1" }
    ];

    let allPicks = [];

    for (const league of primaryLeagues) {
      if (allPicks.length >= 7) break;
      try {
        const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league.code}/scoreboard`);
        if (!res.ok) continue;
        const data = await res.json();

        if (data && data.events && data.events.length > 0) {
          for (let i = 0; i < data.events.length; i++) {
            if (allPicks.length >= 7) break;
            const evt = data.events[i];

            const isPreGame = evt.status?.type?.state === 'pre';
            if (!isPreGame) continue;

            const comp = evt.competitions?.[0];
            if (!comp) continue;

            const homeTeam = comp.competitors?.find(c => c.homeAway === 'home');
            const awayTeam = comp.competitors?.find(c => c.homeAway === 'away');

            if (homeTeam && awayTeam) {
              const homeName = homeTeam.team?.shortDisplayName || homeTeam.team?.displayName || "Home";
              const awayName = awayTeam.team?.shortDisplayName || awayTeam.team?.displayName || "Away";

              const homeLogo = homeTeam.team?.logo || homeTeam.team?.logos?.[0]?.href || "https://a.espncdn.com/i/teamlogos/soccer/500/default.png";
              const awayLogo = awayTeam.team?.logo || awayTeam.team?.logos?.[0]?.href || "https://a.espncdn.com/i/teamlogos/soccer/500/default.png";

              const dateObj = new Date(evt.date || comp.date);
              const kickOffStr = new Intl.DateTimeFormat('en-GB', {
                timeZone: 'Asia/Manila',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }).format(dateObj).toUpperCase();

              const markets = [
                `${homeName} to Win + Over 2.5 Goals`,
                `${homeName} vs ${awayName} - Both Teams to Score`,
                `${homeName} to Win + Have 2+ Goals`,
                `${awayName} to Win or Draw + Over 1.5 Goals`
              ];

              const selectedMarket = markets[allPicks.length % markets.length];

              allPicks.push({
                homeName,
                awayName,
                homeLogo,
                awayLogo,
                leagueName: league.name,
                market: selectedMarket,
                badge: (allPicks.length % 2 === 0) ? "TOP PICK" : "HOT",
                kickOff: kickOffStr
              });
            }
          }
        }
      } catch (err) {
        console.warn(`Error fetching boosts for ${league.code}:`, err);
      }
    }

    if (allPicks.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:15px; width:100%; font-size:11px; opacity:0.7;">No active pre-game boosts available at this moment.</div>`;
      return;
    }

    allPicks = allPicks.slice(0, 7);

    let cardsHtml = "";
    allPicks.forEach(pick => {
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
  } catch (e) {
    container.innerHTML = `<div style="text-align:center; padding:10px; font-size:11px; color:#f87171;">Failed to fetch live boosts.</div>`;
  }
}

/* --- ANIMATED PLASMA BACKGROUND CANVAS --- */
const canvas = document.getElementById('bgCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let width = 0, height = 0, particles = [];

function resizeCanvas() {
  if (!canvas) return;
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
  constructor() {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.radius = Math.random() * 2 + 1;
    this.vx = (Math.random() - 0.5) * 0.8;
    this.vy = (Math.random() - 0.5) * 0.8;
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
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#00f2fe';
    ctx.fill();
  }
}

if (canvas) {
  for (let i = 0; i < 45; i++) particles.push(new Particle());
}

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
  const robotStage = document.getElementById('sittingRobotStage');

  if ((userVal === DEFAULT_USER || userVal === "sportsbookhub") && passVal === DEFAULT_PASS) {
    if (isRemember) {
      localStorage.setItem('sbhub_auth', 'true');
    } else {
      sessionStorage.setItem('sbhub_auth', 'true');
    }
    unlockDashboard();
  } else {
    if (errorMsg) errorMsg.textContent = "ACCESS DENIED: Invalid Security Key";
    if (robotStage) robotStage.classList.add('error-state');
    if (card) {
      card.classList.add('shake');
      setTimeout(() => {
        card.classList.remove('shake');
        if (robotStage) robotStage.classList.remove('error-state');
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
  const robotStage = document.getElementById('sittingRobotStage');
  if (dashboardApp) dashboardApp.classList.remove('unlocked');
  if (authOverlay) authOverlay.classList.remove('unlocked');
  if (robotStage) robotStage.classList.remove('covering-eyes', 'peeking');
}

/* --- UI TOGGLES & WIDGET MANAGEMENT (WITH LOCALSTORAGE PERSISTENCE) --- */
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

/* --- HIGH-DEFINITION VECTOR ABSTRACT WALLPAPER DATA URIs --- */
const lavenderSvg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080' viewBox='0 0 1920 1080'><defs><linearGradient id='bg' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23090d16'/><stop offset='50%' stop-color='%23130d24'/><stop offset='100%' stop-color='%23050811'/></linearGradient><linearGradient id='w1' x1='0%' y1='0%' x2='100%' y2='0%'><stop offset='0%' stop-color='%23ec4899'/><stop offset='50%' stop-color='%23a855f7'/><stop offset='100%' stop-color='%2338bdf8'/></linearGradient><linearGradient id='w2' x1='0%' y1='100%' x2='100%' y2='0%'><stop offset='0%' stop-color='%2338bdf8'/><stop offset='50%' stop-color='%23818cf8'/><stop offset='100%' stop-color='%23f43f5e'/></linearGradient><filter id='b1'><feGaussianBlur stdDeviation='40'/></filter><filter id='b2'><feGaussianBlur stdDeviation='15'/></filter></defs><rect width='100%' height='100%' fill='url(%23bg)'/><path d='M-100 700 Q 400 200 900 650 T 1900 300 T 2100 800' stroke='url(%23w1)' stroke-width='140' fill='none' opacity='0.75' filter='url(%23b1)'/><path d='M-100 700 Q 400 200 900 650 T 1900 300 T 2100 800' stroke='url(%23w1)' stroke-width='40' fill='none' opacity='0.9' filter='url(%23b2)'/><path d='M-100 350 Q 500 850 1100 250 T 2100 600' stroke='url(%23w2)' stroke-width='100' fill='none' opacity='0.65' filter='url(%23b1)'/><path d='M-100 350 Q 500 850 1100 250 T 2100 600' stroke='url(%23w2)' stroke-width='25' fill='none' opacity='0.85' filter='url(%23b2)'/></svg>";

const coralSvg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080' viewBox='0 0 1920 1080'><defs><linearGradient id='bg' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%231a050d'/><stop offset='50%' stop-color='%232d0617'/><stop offset='100%' stop-color='%23080206'/></linearGradient><linearGradient id='w1' x1='0%' y1='0%' x2='100%' y2='0%'><stop offset='0%' stop-color='%23fb923c'/><stop offset='50%' stop-color='%23f43f5e'/><stop offset='100%' stop-color='%23a855f7'/></linearGradient><filter id='b1'><feGaussianBlur stdDeviation='45'/></filter><filter id='b2'><feGaussianBlur stdDeviation='18'/></filter></defs><rect width='100%' height='100%' fill='url(%23bg)'/><path d='M-100 400 Q 450 900 1000 300 T 2100 700' stroke='url(%23w1)' stroke-width='160' fill='none' opacity='0.8' filter='url(%23b1)'/><path d='M-100 400 Q 450 900 1000 300 T 2100 700' stroke='url(%23w1)' stroke-width='45' fill='none' opacity='0.95' filter='url(%23b2)'/><path d='M-100 800 Q 600 200 1200 800 T 2100 200' stroke='%23fbbf24' stroke-width='90' fill='none' opacity='0.6' filter='url(%23b1)'/></svg>";

const pastelSvg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080' viewBox='0 0 1920 1080'><defs><linearGradient id='bg' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23030712'/><stop offset='50%' stop-color='%230f172a'/><stop offset='100%' stop-color='%23020617'/></linearGradient><linearGradient id='w1' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%2338bdf8'/><stop offset='33%' stop-color='%23818cf8'/><stop offset='66%' stop-color='%23f43f5e'/><stop offset='100%' stop-color='%23fbbf24'/></linearGradient><filter id='b1'><feGaussianBlur stdDeviation='50'/></filter><filter id='b2'><feGaussianBlur stdDeviation='20'/></filter></defs><rect width='100%' height='100%' fill='url(%23bg)'/><path d='M-100 200 C 500 800, 800 -200, 1400 700 C 1800 1200, 2000 100, 2100 400' stroke='url(%23w1)' stroke-width='180' fill='none' opacity='0.75' filter='url(%23b1)'/><path d='M-100 200 C 500 800, 800 -200, 1400 700 C 1800 1200, 2000 100, 2100 400' stroke='url(%23w1)' stroke-width='50' fill='none' opacity='0.9' filter='url(%23b2)'/></svg>";

const mintSvg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080' viewBox='0 0 1920 1080'><defs><linearGradient id='bg' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23022c22'/><stop offset='50%' stop-color='%23064e3b'/><stop offset='100%' stop-color='%23020617'/></linearGradient><linearGradient id='w1' x1='0%' y1='0%' x2='100%' y2='0%'><stop offset='0%' stop-color='%2334d399'/><stop offset='50%' stop-color='%232dd4bf'/><stop offset='100%' stop-color='%2338bdf8'/></linearGradient><filter id='b1'><feGaussianBlur stdDeviation='40'/></filter><filter id='b2'><feGaussianBlur stdDeviation='15'/></filter></defs><rect width='100%' height='100%' fill='url(%23bg)'/><path d='M-100 650 Q 500 150 1100 600 T 2100 250' stroke='url(%23w1)' stroke-width='150' fill='none' opacity='0.8' filter='url(%23b1)'/><path d='M-100 650 Q 500 150 1100 600 T 2100 250' stroke='url(%23w1)' stroke-width='40' fill='none' opacity='0.95' filter='url(%23b2)'/></svg>";

const iridescentSvg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080' viewBox='0 0 1920 1080'><defs><linearGradient id='bg' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%231e1b4b'/><stop offset='50%' stop-color='%232e1065'/><stop offset='100%' stop-color='%23090d16'/></linearGradient><linearGradient id='w1' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23a855f7'/><stop offset='25%' stop-color='%23ec4899'/><stop offset='50%' stop-color='%23f59e0b'/><stop offset='75%' stop-color='%2310b981'/><stop offset='100%' stop-color='%2306b6d4'/></linearGradient><filter id='b1'><feGaussianBlur stdDeviation='45'/></filter><filter id='b2'><feGaussianBlur stdDeviation='18'/></filter></defs><rect width='100%' height='100%' fill='url(%23bg)'/><path d='M-100 300 C 400 900, 900 100, 1400 800 C 1800 1300, 2000 200, 2100 500' stroke='url(%23w1)' stroke-width='160' fill='none' opacity='0.8' filter='url(%23b1)'/><path d='M-100 300 C 400 900, 900 100, 1400 800 C 1800 1300, 2000 200, 2100 500' stroke='url(%23w1)' stroke-width='45' fill='none' opacity='0.95' filter='url(%23b2)'/></svg>";

const bubblesSvg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080' viewBox='0 0 1920 1080'><defs><linearGradient id='bg' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23020617'/><stop offset='50%' stop-color='%230f172a'/><stop offset='100%' stop-color='%23090d16'/></linearGradient><radialGradient id='o1' cx='30%' cy='30%' r='50%'><stop offset='0%' stop-color='%23ec4899'/><stop offset='50%' stop-color='%238b5cf6'/><stop offset='100%' stop-color='transparent'/></radialGradient><radialGradient id='o2' cx='70%' cy='70%' r='60%'><stop offset='0%' stop-color='%2338bdf8'/><stop offset='50%' stop-color='%230284c7'/><stop offset='100%' stop-color='transparent'/></radialGradient><radialGradient id='o3' cx='50%' cy='40%' r='45%'><stop offset='0%' stop-color='%23f59e0b'/><stop offset='60%' stop-color='%23ef4444'/><stop offset='100%' stop-color='transparent'/></radialGradient><filter id='b'><feGaussianBlur stdDeviation='60'/></filter></defs><rect width='100%' height='100%' fill='url(%23bg)'/><circle cx='400' cy='350' r='450' fill='url(%23o1)' opacity='0.75' filter='url(%23b)'/><circle cx='1400' cy='700' r='550' fill='url(%23o2)' opacity='0.8' filter='url(%23b)'/><circle cx='960' cy='500' r='380' fill='url(%23o3)' opacity='0.65' filter='url(%23b)'/></svg>";

const lavaSvg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080' viewBox='0 0 1920 1080'><defs><linearGradient id='bg' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%2318020c'/><stop offset='50%' stop-color='%232e0818'/><stop offset='100%' stop-color='%23090207'/></linearGradient><radialGradient id='l1' cx='20%' cy='80%' r='65%'><stop offset='0%' stop-color='%23f97316'/><stop offset='40%' stop-color='%23dc2626'/><stop offset='100%' stop-color='transparent'/></radialGradient><radialGradient id='l2' cx='80%' cy='20%' r='60%'><stop offset='0%' stop-color='%23a855f7'/><stop offset='50%' stop-color='%23ec4899'/><stop offset='100%' stop-color='transparent'/></radialGradient><filter id='b'><feGaussianBlur stdDeviation='65'/></filter></defs><rect width='100%' height='100%' fill='url(%23bg)'/><circle cx='300' cy='800' r='550' fill='url(%23l1)' opacity='0.85' filter='url(%23b)'/><circle cx='1600' cy='250' r='500' fill='url(%23l2)' opacity='0.8' filter='url(%23b)'/></svg>";

/* --- THEME SWITCHER ENGINE --- */
function setGradient(theme) {
  const body = document.getElementById('pageBody');
  if (!body) return;
  let backgroundStyle = '';

  switch(theme) {
    /* PLAIN DARK BASE THEMES */
    case 'plain-slate':
      backgroundStyle = 'linear-gradient(rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.95)), #0f172a';
      break;
    case 'plain-navy':
      backgroundStyle = 'linear-gradient(rgba(11, 19, 41, 0.95), rgba(11, 19, 41, 0.95)), #0b1329';
      break;
    case 'plain-onyx':
      backgroundStyle = 'linear-gradient(rgba(18, 18, 18, 0.95), rgba(18, 18, 18, 0.95)), #121212';
      break;

    /* SILK & SATIN NEON WAVE GRAPHICS */
    case 'silk-lavender':
      backgroundStyle = `url("${lavenderSvg}")`;
      break;
    case 'silk-coral':
      backgroundStyle = `url("${coralSvg}")`;
      break;
    case 'silk-pastel':
      backgroundStyle = `url("${pastelSvg}")`;
      break;
    case 'silk-mint':
      backgroundStyle = `url("${mintSvg}")`;
      break;
    case 'silk-iridescent':
      backgroundStyle = `url("${iridescentSvg}")`;
      break;

    /* 3D RIBBON FOLDS & FLUID SWIRLS */
    case 'abstract-bubbles':
      backgroundStyle = `url("${bubblesSvg}")`;
      break;
    case 'abstract-lava':
      backgroundStyle = `url("${lavaSvg}")`;
      break;
    default:
      backgroundStyle = `url("${lavenderSvg}")`;
  }

  body.style.background = backgroundStyle;
  body.style.backgroundSize = 'cover';
  body.style.backgroundPosition = 'center';
  body.style.backgroundAttachment = 'fixed';
  body.style.backgroundRepeat = 'no-repeat';

  const themeMenu = document.getElementById('themeMenu');
  if (themeMenu) themeMenu.classList.remove('show');
  localStorage.setItem('sbhub_theme', backgroundStyle);
}

/* --- REAL-TIME LIVE DUTY ROSTER (FIREBASE) --- */
function getCurrentSlotInfo() {
  const now = new Date();
  const hours = now.getHours();
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

  const todayIso = new Date().toISOString().split('T')[0];
  const { slotId, label: slotLabel } = getCurrentSlotInfo();

  let activeDayKey = Object.keys(rosterData).find(key => key !== 'archives' && rosterData[key]?.isoDate === todayIso);
  if (!activeDayKey) {
    const activeKeys = Object.keys(rosterData).filter(k => k !== 'archives');
    activeKeys.sort((a, b) => (rosterData[b]?.isoDate || '').localeCompare(rosterData[a]?.isoDate || ''));
    activeDayKey = activeKeys[0];
  }

  if (!activeDayKey || !rosterData[activeDayKey]) {
    container.innerHTML = `<div style="text-align:center; padding:15px; font-size:10px; color:rgba(255,255,255,0.7);">No active schedule found.</div>`;
    return;
  }

  const dayData = rosterData[activeDayKey];
  const teamMembers = [
    { id: 'ann', name: 'ANN' }, { id: 'dave', name: 'DAVE' },
    { id: 'ken', name: 'KEN' }, { id: 'kriztel', name: 'KRIZTEL' }
  ];

  let html = `
    <div style="font-size:11px; font-weight:700; opacity:0.9; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
      <span>📅 ${dayData.isoDate || todayIso}</span>
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

/* --- TOP GAMES DYNAMIC MATCHDAY ENGINE --- */
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

    const primaryLeagues = [
      { name: "UEFA Champions League", code: "uefa.champions" },
      { name: "Premier League", code: "eng.1" },
      { name: "La Liga", code: "esp.1" },
      { name: "Bundesliga", code: "ger.1" },
      { name: "Serie A", code: "ita.1" },
      { name: "Ligue 1", code: "fra.1" },
      { name: "UEFA European Championship", code: "uefa.euro" },
      { name: "UEFA Nations League", code: "uefa.nations" }
    ];

    const secondaryLeagues = [
      { name: "UEFA Europa League", code: "uefa.europa" },
      { name: "UEFA Conference League", code: "uefa.europa.conf" },
      { name: "EFL Championship", code: "eng.2" },
      { name: "Eredivisie", code: "ned.1" },
      { name: "Primeira Liga", code: "por.1" },
      { name: "Copa Libertadores", code: "conmebol.libertadores" },
      { name: "MLS", code: "usa.1" },
      { name: "Brasileirão Série A", code: "bra.1" },
      { name: "J1 League", code: "jpn.1" },
      { name: "Scottish Premiership", code: "sco.1" },
      { name: "Süper Lig", code: "tur.1" },
      { name: "Argentine Primera", code: "arg.1" }
    ];

    let matches = await fetchLeagueList(primaryLeagues, targetDateQuery);

    if (matches.length === 0) {
      matches = await fetchLeagueList(secondaryLeagues, targetDateQuery);
    }

    if (matches.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:20px; font-size:11px; color:rgba(255,255,255,0.65);">No scheduled fixtures for ${dateLabelStr} (GMT+8).</div>`;
      return;
    }

    matches = matches.slice(0, 7);

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
  const fetchPromises = leagueList.map(league =>
    fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league.code}/scoreboard?dates=${dateQuery}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => data ? { league, data } : null)
      .catch(() => null)
  );

  const results = await Promise.all(fetchPromises);
  let matches = [];

  for (const item of results) {
    if (!item || !item.data || !item.data.events) continue;
    for (const evt of item.data.events) {
      if (matches.length >= 7) break;
      const comp = evt.competitions?.[0];
      if (!comp) continue;

      const homeTeam = comp.competitors?.find(c => c.homeAway === 'home');
      const awayTeam = comp.competitors?.find(c => c.homeAway === 'away');

      if (homeTeam && awayTeam) {
        const homeName = homeTeam.team?.shortDisplayName || homeTeam.team?.displayName || "Home";
        const awayName = awayTeam.team?.shortDisplayName || awayTeam.team?.displayName || "Away";

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

        matches.push({
          homeName,
          awayName,
          homeLogo,
          awayLogo,
          leagueName: item.league.name,
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
    const pageBody = document.getElementById('pageBody');
    if (pageBody) {
      pageBody.style.background = savedTheme;
      pageBody.style.backgroundSize = 'cover';
      pageBody.style.backgroundPosition = 'center';
      pageBody.style.backgroundAttachment = 'fixed';
      pageBody.style.backgroundRepeat = 'no-repeat';
    }
  } else {
    setGradient('silk-lavender');
  }

  // CHECK PERSISTENT SESSION (LOCALSTORAGE OR SESSIONSTORAGE)
  if (localStorage.getItem('sbhub_auth') === 'true' || sessionStorage.getItem('sbhub_auth') === 'true') {
    unlockDashboard();
  }

  switchBrandTab('ibet');
  restoreSavedWidgets();

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
