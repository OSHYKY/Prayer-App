// ===== Storage helpers =====
const STORAGE_KEYS = {
  prayers: "prayers",
  settings: "settings",
  streak: "streak",
  calendar: "calendar",
  bahaiFast: "bahai_fast",
  geo: "user_coords"
 
};

const BAHAI_PRAYERS = {
  short: [
    {
      text: `<< INSERT SHORT OBLIGATORY PRAYER TEXT HERE >>`,
      author: "Bahá’u’lláh"
    }
  ],

  medium: [
    {
      text: `
<p><strong>TO BE RECITED DAILY, IN THE MORNING, AT NOON, AND IN THE EVENING</strong></p>

<p>Whoso wisheth to pray, let him wash his hands, and while he washeth, let him say:</p>

<p>Strengthen my hand, O my God, that it may take hold of Thy Book with such steadfastness that the hosts of the world shall have no power over it. Guard it, then, from meddling with whatsoever doth not belong unto it. Thou art, verily, the Almighty, the Most Powerful.</p>

<p>And while washing his face, let him say:</p>

<p>I have turned my face unto Thee, O my Lord! Illumine it with the light of Thy countenance. Protect it, then, from turning to anyone but Thee.</p>

<p>Then let him stand up, and facing the Qiblih (Point of Adoration, i.e. Bahjí, Akká), let him say:</p>

<p>God testifieth that there is none other God but Him. His are the kingdoms of Revelation and of creation. He, in truth, hath manifested Him Who is the Dayspring of Revelation, Who conversed on Sinai, through Whom the Supreme Horizon hath been made to shine, and the Lote-Tree beyond which there is no passing hath spoken, and through Whom the call hath been proclaimed unto all who are in heaven and on earth: “Lo, the All-Possessing is come. Earth and heaven, glory and dominion are God’s, the Lord of all men, and the Possessor of the Throne on high and of earth below!”</p>

<p>Let him, then, bend down, with hands resting on the knees, and say:</p>

<p>Exalted art Thou above my praise and the praise of anyone beside me, above my description and the description of all who are in heaven and all who are on earth!</p>

<p>Then standing with open hands, palms upward toward the face, let him say:</p>

<p>I have borne witness, O my God, that Thou hast created me to know Thee and to worship Thee. I testify, at this moment, to my powerlessness and to Thy might, to my poverty and to Thy wealth. There is none other God but Thee, the Help in Peril, the Self-Subsisting.</p>

<p>Let him, then, be seated and say:</p>

<p>Thou seest me, O my God, turned toward Thee. He Who hath turned unto Thee is he who hath recognized Thee, and he who hath recognized Thee hath turned unto Thee. I beseech Thee, by Thy Name through which Thou didst subdue all things, and didst decree that which is to befall them, to make me steadfast in Thy Cause, fulfilled Thy Covenant, and opened wide the door of Thy grace to all that dwell in heaven and on earth. Blessing and peace, salutation and glory, rest upon Thy loved ones, whom the changes and chances of the world have not deterred from turning unto Thee, and who have given their all, in the hope of obtaining that which is with Thee. Thou art, in truth, the Ever-Forgiving, the All-Bountiful.</p>
`,
      author: "Bahá’u’lláh"
    }
  ],

  long: [
    {
      text: `<< INSERT LONG OBLIGATORY PRAYER TEXT HERE >>`,
      author: "Bahá’u’lláh"
    }
  ]
};



const get = (k, fallback) => {
  try { return JSON.parse(localStorage.getItem(k)) ?? fallback; }
  catch { return fallback; }
};
const set = (k, v) => localStorage.setItem(k, JSON.stringify(v));

// ===== Default data =====
let prayers = get(STORAGE_KEYS.prayers, [
  { id: "p1", title: "Morning Devotion", text: "Begin the day with gratitude and focus..." },
  { id: "p2", title: "Evening Reflection", text: "Reflect on the day, seek peace and rest..." }
]);

let settings = get(STORAGE_KEYS.settings, {
  morningTime: "07:00",
  eveningTime: "20:00",
  morningPrayerId: prayers[0]?.id || "p1",
  eveningPrayerId: prayers[1]?.id || "p2",
  notificationStyle: "gentle",
  notificationsEnabled: false
});

let streak = get(STORAGE_KEYS.streak, { count: 0, lastDate: null });
let calendarData = get(STORAGE_KEYS.calendar, {}); // { "YYYY-MM-DD": "done" | "skip" | "miss" }
let fastConfig = get(STORAGE_KEYS.bahaiFast, null);

// ===== DOM =====
const morningTimeLabel = document.getElementById("morningTimeLabel");
const eveningTimeLabel = document.getElementById("eveningTimeLabel");
const morningStatus = document.getElementById("morningStatus");
const eveningStatus = document.getElementById("eveningStatus");
const morningPrayerTextDiv = document.getElementById("morningPrayerText");
const eveningPrayerTextDiv = document.getElementById("eveningPrayerText");

const morningPrayerSelect = document.getElementById("morningPrayerSelect");
const eveningPrayerSelect = document.getElementById("eveningPrayerSelect");

const newPrayerTitleEl = document.getElementById("newPrayerTitle");
const newPrayerTextEl = document.getElementById("newPrayerText");
const addPrayerBtn = document.getElementById("addPrayerBtn");
const editPrayerBtn = document.getElementById("editPrayerBtn");

const morningTimeInput = document.getElementById("morningTime");
const eveningTimeInput = document.getElementById("eveningTime");
const notificationStyleSelect = document.getElementById("notificationStyle");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const enableNotificationsBtn = document.getElementById("enableNotificationsBtn");

const streakCounter = document.getElementById("streakCounter");
const calendarEl = document.getElementById("calendar");

// Bahá’í page DOM
const startFastBtn = document.getElementById("startFastBtn");
const fastStartInput = document.getElementById("fastStart");
const fastDaysInput = document.getElementById("fastDays");
const fastAnchorSelect = document.getElementById("fastAnchor");
const bahaiTodayDiv = document.getElementById("bahaiToday");
const sunCanvas = document.getElementById("sunCanvas");
const sunTimesDiv = document.getElementById("sunTimes");

// ===== Utilities =====
const todayStr = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};
const parseHM = (hm) => {
  const [h,m] = hm.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
};
function nextOccurrence(hm) {
  const target = parseHM(hm);
  const now = new Date();
  if (target <= now) target.setDate(target.getDate() + 1);
  return target;
}
function getPrayerText(id) {
  return (prayers.find(p => p.id === id) || {}).text || "";
}
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

// ===== Rendering =====
function renderPrayers() {
  morningPrayerSelect.innerHTML = "";
  eveningPrayerSelect.innerHTML = "";

  prayers.forEach(p => {
    const optM = document.createElement("option");
    optM.value = p.id; optM.textContent = p.title;
    morningPrayerSelect.appendChild(optM);

    const optE = document.createElement("option");
    optE.value = p.id; optE.textContent = p.title;
    eveningPrayerSelect.appendChild(optE);
  });

  if (settings.morningPrayerId) morningPrayerSelect.value = settings.morningPrayerId;
  if (settings.eveningPrayerId) eveningPrayerSelect.value = settings.eveningPrayerId;
}

function renderSettings() {
  morningTimeInput.value = settings.morningTime;
  eveningTimeInput.value = settings.eveningTime;
  notificationStyleSelect.value = settings.notificationStyle;
  morningTimeLabel.textContent = settings.morningTime;
  eveningTimeLabel.textContent = settings.eveningTime;
}

function renderStreak() {
  streakCounter.textContent = `${streak.count} ${streak.count === 1 ? "day" : "days"}`;
}

function renderCalendar() {
  calendarEl.innerHTML = "";

  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 13); // 14-day window

  let doneCount = 0;

  for (let i = 0; i < 14; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);

    const key = d.toISOString().slice(0, 10);
    const status = calendarData[key] || "miss";

    if (status === "done") doneCount++;

    const dot = document.createElement("div");
    dot.className = `day ${status}`;

    // Add pulse animation for today's completion
    if (key === todayStr() && status === "done") {
      dot.classList.add("pulse");
    }

    calendarEl.appendChild(dot);
  }

  // Update percentage label
  const percent = Math.round((doneCount / 14) * 100);
  document.getElementById("streakPercent").textContent =
    `${doneCount}/14 days (${percent}%)`;
}



// ===== Show prayer within ±1 hour =====
function showUpcomingPrayer() {
  const now = new Date();
  const showIfWithinHour = (hm, prayerId, container) => {
    const target = parseHM(hm);
    const diffMinutes = Math.abs((now - target) / 60000);
    container.textContent = diffMinutes <= 60 ? getPrayerText(prayerId) : "";
  };
  showIfWithinHour(settings.morningTime, settings.morningPrayerId, morningPrayerTextDiv);
  showIfWithinHour(settings.eveningTime, settings.eveningPrayerId, eveningPrayerTextDiv);
}

// ===== Notifications =====
async function ensureSW() {
  try { return await navigator.serviceWorker.register("sw.js"); }
  catch (e) { console.warn("SW registration failed", e); return null; }
}
async function requestNotificationPermission() {
  const res = await Notification.requestPermission();
  settings.notificationsEnabled = (res === "granted");
  set(STORAGE_KEYS.settings, settings);
  return res;
}
async function sendNotification(title, body) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  const reg = await navigator.serviceWorker.ready;
  const options = {
    body,
    icon: "icon-192.png",
    badge: "icon-192.png",
    vibrate: settings.notificationStyle === "vibration" ? [100, 50, 100] : undefined,
    silent: settings.notificationStyle === "silent",
    tag: "prayer-reminder",
    actions: [{ action: "open", title: "Open" }]
  };
  try { reg.showNotification(title, options); }
  catch { new Notification(title, options); }
}
function scheduleNotification(hm, title) {
  if (!settings.notificationsEnabled) return;
  const next = nextOccurrence(hm);
  const ms = next.getTime() - Date.now();
  if (ms > 0 && ms < 1000 * 60 * 60 * 48) {
    setTimeout(() => {
      const text = hm === settings.morningTime ? getPrayerText(settings.morningPrayerId)
                                               : getPrayerText(settings.eveningPrayerId);
      sendNotification(title, text || "Time to pray.");
      scheduleNotification(hm, title);
    }, ms);
  }
}
function scheduleAllNotifications() {
  scheduleNotification(settings.morningTime, "Morning Prayer");
  scheduleNotification(settings.eveningTime, "Evening Prayer");
}

// ===== Geolocation =====
async function requestAndCacheLocation() {
  const cached = get(STORAGE_KEYS.geo, null);
  if (cached && cached.lat && cached.lon) return cached;
  if (!("geolocation" in navigator)) return null;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude, ts: Date.now() };
        set(STORAGE_KEYS.geo, coords);
        resolve(coords);
      },
      err => { console.warn("Geolocation denied/failed", err); resolve(null); },
      { enableHighAccuracy: false, timeout: 15000 }
    );
  });
}
function clearCachedLocation() { localStorage.removeItem(STORAGE_KEYS.geo); }

// ===== SunCalc helpers =====
function computeSunTimesForDate(date, lat, lon) {
  return SunCalc.getTimes(date, lat, lon);
}
function scheduleAt(date, title, body) {
  const ms = date.getTime() - Date.now();
  if (ms <= 0 || ms > 1000 * 60 * 60 * 48) return;
  setTimeout(async () => {
    await sendNotification(title, body);
  }, ms);
}

// ===== Bahá’í fast scheduling =====
async function scheduleBahaiFast(config) {
  if (!config || !config.startDate || !config.days) return;
  const coords = await requestAndCacheLocation();
  if (!coords) {
    bahaiTodayDiv.textContent = "Location required for sunrise/sunset scheduling.";
    return;
  }
  const start = new Date(config.startDate);
  for (let i = 0; i < config.days; i++) {
    const day = new Date(start); day.setDate(start.getDate() + i);
    const times = computeSunTimesForDate(day, coords.lat, coords.lon);
    if (config.type === "short" || config.type === "long") {
      const when = (config.anchor === "sunset") ? times.sunset : times.sunrise;
      scheduleAt(when, "Bahá’í Prayer", `Time for your ${config.type} prayer`);
    } else if (config.type === "medium") {
      const startMs = times.sunrise.getTime();
      const endMs = times.sunset.getTime();
      const interval = (endMs - startMs) / 4; // 3 times at quarter intervals
      for (let j = 1; j <= 3; j++) {
        const t = new Date(startMs + interval * j);
        scheduleAt(t, "Bahá’í Prayer", `Medium prayer ${j} of 3`);
      }
    }
  }
}

// ===== Sun animation =====
function initSunCanvas() {
  if (!sunCanvas) return;
  const ctx = sunCanvas.getContext("2d");

  function resize() {
    // Make canvas crisp on high-DPI screens
    const dpr = window.devicePixelRatio || 1;
    const cssW = sunCanvas.clientWidth || 320;
    const cssH = sunCanvas.clientHeight || 160;
    sunCanvas.width = Math.round(cssW * dpr);
    sunCanvas.height = Math.round(cssH * dpr);
    ctx.scale(dpr, dpr);
  }
  resize();
  window.addEventListener("resize", resize);

  async function frame() {
    const coords = await requestAndCacheLocation();
    if (!coords) {
      // Draw message if no location
      ctx.clearRect(0, 0, sunCanvas.width, sunCanvas.height);
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "14px system-ui";
      ctx.fillText("Enable location to show sun path.", 12, 24);
      requestAnimationFrame(frame);
      return;
    }

    const now = new Date();
    const times = computeSunTimesForDate(now, coords.lat, coords.lon);
    const sunrise = times.sunrise.getTime();
    const sunset = times.sunset.getTime();
    const noon = times.solarNoon.getTime();

    // Update text times
    const fmt = (d) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (sunTimesDiv) {
      sunTimesDiv.textContent = `Sunrise: ${fmt(sunrise)} • Solar noon: ${fmt(noon)} • Sunset: ${fmt(sunset)}`;
    }

    // Progress along arc
    let progress = (Date.now() - sunrise) / (sunset - sunrise); // 0..1
    progress = clamp(progress, 0, 1);

    // Draw arc and sun
    const cw = (sunCanvas.clientWidth || 320);
    const ch = (sunCanvas.clientHeight || 160);
    ctx.clearRect(0, 0, cw, ch);

    const cx = cw / 2;
    const cy = ch * 0.95;
    const radius = Math.min(cw, ch) * 0.75;

    // Arc background
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, Math.PI, 2 * Math.PI);
    ctx.stroke();

    // Sun position along arc
    const angle = Math.PI + progress * Math.PI; // left (sunrise) -> right (sunset)
    const sx = cx + Math.cos(angle) * radius;
    const sy = cy + Math.sin(angle) * radius;

    // Sun glow
    const grad = ctx.createRadialGradient(sx, sy, 4, sx, sy, 28);
    grad.addColorStop(0, "#fff59a");
    grad.addColorStop(1, "#ffb74d");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(sx, sy, 10, 0, 2 * Math.PI);
    ctx.fill();

    // Horizon line
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.moveTo(cx - radius, cy);
    ctx.lineTo(cx + radius, cy);
    ctx.stroke();

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

// ===== Navigation =====
function setupNav() {
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
      const pageId = "page-" + btn.dataset.page;
      document.getElementById(pageId).classList.remove("hidden");

      // Initialize sun canvas when switching to Bahá’í page
      if (btn.dataset.page === "bahai") {
        initSunCanvas();
      }
    });
  });
}

// ===== Event bindings =====
function bindEvents() {
  // Prayer selections
  morningPrayerSelect.addEventListener("change", () => {
    settings.morningPrayerId = morningPrayerSelect.value;
    set(STORAGE_KEYS.settings, settings);
    showUpcomingPrayer();
  });

  eveningPrayerSelect.addEventListener("change", () => {
    settings.eveningPrayerId = eveningPrayerSelect.value;
    set(STORAGE_KEYS.settings, settings);
    showUpcomingPrayer();
  });

  // Bahá’í daily prayer selector
  const bahaiPrayerType = document.getElementById("bahaiPrayerType");
  if (bahaiPrayerType) {
    bahaiPrayerType.addEventListener("change", renderBahaiPrayerOfTheDay);
  }

  // Add prayer
  addPrayerBtn.addEventListener("click", () => {
    const title = newPrayerTitleEl.value.trim();
    const text = newPrayerTextEl.value.trim();
    if (!title || !text) return;
    const id = `p_${Date.now()}`;
    prayers.push({ id, title, text });
    set(STORAGE_KEYS.prayers, prayers);
    if (!settings.morningPrayerId) settings.morningPrayerId = id;
    renderPrayers();
    newPrayerTitleEl.value = "";
    newPrayerTextEl.value = "";
    showUpcomingPrayer();
  });

  // Edit selected prayer
  editPrayerBtn.addEventListener("click", () => {
    const id = morningPrayerSelect.value || eveningPrayerSelect.value;
    const prayer = prayers.find(p => p.id === id);
    if (!prayer) return;
    newPrayerTitleEl.value = prayer.title;
    newPrayerTextEl.value = prayer.text;
    addPrayerBtn.textContent = "Save changes";
    const saveHandler = () => {
      const newTitle = newPrayerTitleEl.value.trim();
      const newText = newPrayerTextEl.value.trim();
      if (!newTitle || !newText) return;
      prayer.title = newTitle;
      prayer.text = newText;
      set(STORAGE_KEYS.prayers, prayers);
      renderPrayers();
      addPrayerBtn.textContent = "Add prayer";
      newPrayerTitleEl.value = "";
      newPrayerTextEl.value = "";
      showUpcomingPrayer();
      addPrayerBtn.removeEventListener("click", saveHandler);
    };
    addPrayerBtn.addEventListener("click", saveHandler, { once: true });
  });

  // Save settings
  saveSettingsBtn.addEventListener("click", () => {
    settings.morningTime = morningTimeInput.value;
    settings.eveningTime = eveningTimeInput.value;
    settings.notificationStyle = notificationStyleSelect.value;
    set(STORAGE_KEYS.settings, settings);
    renderSettings();
    showUpcomingPrayer();
    scheduleAllNotifications();
  });

  // Enable notifications
  enableNotificationsBtn.addEventListener("click", async () => {
    const reg = await ensureSW();
    if (!reg) return;
    const res = await requestNotificationPermission();
    if (res === "granted") scheduleAllNotifications();
  });

  // Mark actions
  document.getElementById("markMorningDone").addEventListener("click", () => {
    morningStatus.textContent = "Completed";
    markToday("done");
  });
  document.getElementById("markMorningSkip").addEventListener("click", () => {
    morningStatus.textContent = "Skipped";
    markToday("skip");
  });
  document.getElementById("markEveningDone").addEventListener("click", () => {
    eveningStatus.textContent = "Completed";
    markToday("done");
  });
  document.getElementById("markEveningSkip").addEventListener("click", () => {
    eveningStatus.textContent = "Skipped";
    markToday("skip");
  });

  // Bahá’í fast handler
  if (startFastBtn) {
    startFastBtn.addEventListener("click", async () => {
      const type = document.querySelector("input[name='bahaiType']:checked").value;
      const startDate = fastStartInput.value;
      const days = parseInt(fastDaysInput.value, 10);
      const anchor = fastAnchorSelect.value;

      fastConfig = { type, startDate, days, anchor };
      set(STORAGE_KEYS.bahaiFast, fastConfig);

      await scheduleBahaiFast(fastConfig);
      bahaiTodayDiv.textContent = `Fast scheduled: ${days} days starting ${startDate} (${type}, ${anchor})`;
    });
  }
}

// ===== Actions: streak + calendar =====
function markToday(statusKey) {
  const key = todayStr();
  calendarData[key] = statusKey;
  set(STORAGE_KEYS.calendar, calendarData);

  if (statusKey === "done") {
    const last = streak.lastDate;
    const today = new Date(todayStr());

    if (!last) {
      streak.count = 1;
    } else {
      const lastDate = new Date(last);
      const diffDays = Math.round((today - lastDate) / (1000*60*60*24));
      if (diffDays === 1) streak.count += 1;
      else if (diffDays > 1) streak.count = 1;
    }

    streak.lastDate = todayStr();
    set(STORAGE_KEYS.streak, streak);
  }

  renderStreak();
  renderCalendar(); // triggers animations
}


// ===== Init =====
async function init() {
  renderPrayers();
  renderSettings();
  renderStreak();
  renderCalendar();
  bindEvents();
  setupNav();
	renderBahaiPrayerOfTheDay();

  // Register SW early
  await ensureSW();

  // Update prayer text display immediately and every minute
  showUpcomingPrayer();
  setInterval(showUpcomingPrayer, 60 * 1000);

  // If notifications already enabled, schedule them
  if (settings.notificationsEnabled && Notification.permission === "granted") {
    scheduleAllNotifications();
  }

  // If Bahá’í fast was previously configured, show status and init sun canvas
  if (fastConfig) {
    bahaiTodayDiv.textContent = `Fast active: ${fastConfig.days} days from ${fastConfig.startDate} (${fastConfig.type}, ${fastConfig.anchor})`;
  }

  // Initialize sun canvas if Bahá’í page is active at load
  const bahaiVisible = !document.getElementById("page-bahai").classList.contains("hidden");
  if (bahaiVisible) initSunCanvas();
}

document.addEventListener("DOMContentLoaded", init);

function renderBahaiPrayerOfTheDay() {
  const type = document.getElementById("bahaiPrayerType").value;
  const container = document.getElementById("bahaiPrayerText");

  let prayer;

  if (type === "short") {
    prayer = BAHAI_PRAYERS.short[0];
  } else if (type === "medium") {
    prayer = BAHAI_PRAYERS.medium[0];
  } else if (type === "long") {
    prayer = BAHAI_PRAYERS.long[0];
  }

  if (!prayer) {
    container.textContent = "No prayer found.";
    return;
  }

  container.innerHTML = `
    <div>${prayer.text}</div>
    <div style="text-align:right; font-weight:bold; margin-top:1rem;">
      — ${prayer.author}
    </div>
  `;
}












