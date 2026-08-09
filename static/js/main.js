(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");
  document.documentElement.classList.add("js");

  /* ============ THEME TOGGLE ============ */
  var root = document.documentElement;
  var toggle = document.getElementById("themeToggle");
  var savedTheme = localStorage.getItem("age-theme");
  if (savedTheme) root.setAttribute("data-theme", savedTheme);

  function currentTheme() {
    return root.getAttribute("data-theme") === "light" ? "light" : "dark";
  }

  if (toggle) {
    toggle.setAttribute("aria-pressed", currentTheme() === "light");
    toggle.addEventListener("click", function () {
      var next = currentTheme() === "light" ? "dark" : "light";
      root.setAttribute("data-theme", next);
      localStorage.setItem("age-theme", next);
      toggle.setAttribute("aria-pressed", next === "light");
    });
  }

  /* ============ AMBIENT STARFIELD ============ */
  var canvas = document.getElementById("starfield");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var stars = [];
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function resize() {
      canvas.width = window.innerWidth * devicePixelRatio;
      canvas.height = window.innerHeight * devicePixelRatio;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      var count = Math.min(160, Math.floor((window.innerWidth * window.innerHeight) / 9000));
      stars = [];
      for (var i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height * 0.7,
          r: Math.random() * 1.4 * devicePixelRatio + 0.3,
          phase: Math.random() * Math.PI * 2,
          speed: 0.4 + Math.random() * 0.8
        });
      }
    }

    function draw(t) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var twinkle = reduceMotion ? 0.7 : 0.5 + 0.5 * Math.sin(t * 0.0006 * s.speed + s.phase);
        ctx.beginPath();
        ctx.fillStyle = "rgba(237,230,214," + (0.15 + twinkle * 0.5) + ")";
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!reduceMotion) requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    requestAnimationFrame(draw);
  }

  /* ============ DATA HELPERS ============ */
  var ZODIAC = [
    [[1, 20], [2, 18], "Aquarius", "♒"],
    [[2, 19], [3, 20], "Pisces", "♓"],
    [[3, 21], [4, 19], "Aries", "♈"],
    [[4, 20], [5, 20], "Taurus", "♉"],
    [[5, 21], [6, 20], "Gemini", "♊"],
    [[6, 21], [7, 22], "Cancer", "♋"],
    [[7, 23], [8, 22], "Leo", "♌"],
    [[8, 23], [9, 22], "Virgo", "♍"],
    [[9, 23], [10, 22], "Libra", "♎"],
    [[10, 23], [11, 21], "Scorpio", "♏"],
    [[11, 22], [12, 21], "Sagittarius", "♐"],
    [[12, 22], [1, 19], "Capricorn", "♑"]
  ];
  var CHINESE = ["Monkey", "Rooster", "Dog", "Pig", "Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake", "Horse", "Goat"];
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  function zodiacOf(month, day) {
    for (var i = 0; i < ZODIAC.length; i++) {
      var s = ZODIAC[i][0], e = ZODIAC[i][1];
      if (month === s[0] && day >= s[1]) return { name: ZODIAC[i][2], symbol: ZODIAC[i][3] };
      if (month === e[0] && day <= e[1]) return { name: ZODIAC[i][2], symbol: ZODIAC[i][3] };
    }
    return { name: "Capricorn", symbol: "♑" };
  }

  function generationOf(year) {
    if (year >= 2013) return "Generation Alpha";
    if (year >= 1997) return "Generation Z";
    if (year >= 1981) return "Millennial";
    if (year >= 1965) return "Generation X";
    if (year >= 1946) return "Baby Boomer";
    return "Silent Generation";
  }

  function isLeap(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }

  function daysInMonth(y, m) { return new Date(y, m, 0).getDate(); }

  function computeAge(dob, now) {
    var years = now.getFullYear() - dob.getFullYear();
    var months = now.getMonth() - dob.getMonth();
    var days = now.getDate() - dob.getDate();
    if (days < 0) {
      months -= 1;
      var pm = now.getMonth() === 0 ? 12 : now.getMonth();
      var py = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      days += daysInMonth(py, pm);
    }
    if (months < 0) { months += 12; years -= 1; }

    var msPerDay = 86400000;
    var totalDays = Math.floor((startOfDay(now) - startOfDay(dob)) / msPerDay);

    var nextBdayYear = now.getFullYear();
    var thisYearBday = safeDate(nextBdayYear, dob.getMonth(), dob.getDate());
    if (startOfDay(thisYearBday) < startOfDay(now)) {
      nextBdayYear += 1;
    }
    var nextBirthday = safeDate(nextBdayYear, dob.getMonth(), dob.getDate());

    var leapYears = 0;
    for (var y = dob.getFullYear(); y <= now.getFullYear(); y++) if (isLeap(y)) leapYears++;

    var z = zodiacOf(dob.getMonth() + 1, dob.getDate());

    return {
      years: years, months: months, days: days,
      totalDays: totalDays,
      totalWeeks: Math.floor(totalDays / 7),
      dayOfWeek: DAYS[dob.getDay()],
      zodiac: z.name, zodiacSymbol: z.symbol,
      chineseZodiac: CHINESE[((dob.getFullYear() % 12) + 12) % 12],
      generation: generationOf(dob.getFullYear()),
      leapYears: leapYears,
      nextBirthday: nextBirthday,
      isBirthdayToday: now.getMonth() === dob.getMonth() && now.getDate() === dob.getDate()
    };
  }

  function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); }
  function safeDate(y, mIdx, d) {
    var dt = new Date(y, mIdx, 1);
    var max = daysInMonth(y, mIdx + 1);
    dt.setDate(Math.min(d, max));
    return dt;
  }

  /* ============ COUNT-UP ANIMATION ============ */
  function countUp(el, target, duration) {
    var start = 0;
    var startTime = null;
    function step(ts) {
      if (!startTime) startTime = ts;
      var progress = Math.min(1, (ts - startTime) / duration);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(start + (target - start) * eased);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = target;
    } else {
      requestAnimationFrame(step);
    }
  }

  /* ============ FLIP DIGIT RENDER ============ */
  function renderFlipNumber(container, value, padLength) {
    var str = String(value).padStart(padLength || 0, "0");
    var existing = container.querySelectorAll(".flip-digit");
    if (existing.length !== str.length) {
      container.innerHTML = "";
      for (var i = 0; i < str.length; i++) {
        var span = document.createElement("span");
        span.className = "flip-digit";
        span.textContent = str[i];
        container.appendChild(span);
      }
      return;
    }
    for (var j = 0; j < str.length; j++) {
      var digitEl = existing[j];
      if (digitEl.textContent !== str[j]) {
        digitEl.textContent = str[j];
        digitEl.classList.remove("flip");
        void digitEl.offsetWidth;
        digitEl.classList.add("flip");
      }
    }
  }

  /* ============ CONFETTI (birthday) ============ */
  function launchConfetti() {
    var cvs = document.getElementById("confetti-canvas");
    if (!cvs || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var ctx = cvs.getContext("2d");
    cvs.width = window.innerWidth;
    cvs.height = window.innerHeight;
    var colors = ["#c9a227", "#e8c65a", "#c77b4d", "#4fb3a9", "#ede6d6"];
    var pieces = [];
    for (var i = 0; i < 120; i++) {
      pieces.push({
        x: Math.random() * cvs.width,
        y: -20 - Math.random() * cvs.height * 0.5,
        r: 3 + Math.random() * 4,
        c: colors[Math.floor(Math.random() * colors.length)],
        vy: 2 + Math.random() * 3,
        vx: -1.5 + Math.random() * 3,
        rot: Math.random() * Math.PI,
        vr: -0.2 + Math.random() * 0.4
      });
    }
    var frames = 0;
    function loop() {
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      pieces.forEach(function (p) {
        p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.r, -p.r * 0.4, p.r * 2, p.r * 0.8);
        ctx.restore();
      });
      frames++;
      if (frames < 220) requestAnimationFrame(loop);
      else ctx.clearRect(0, 0, cvs.width, cvs.height);
    }
    requestAnimationFrame(loop);
  }

  /* ============ MAIN FLOW ============ */
  var form = document.getElementById("ageForm");
  var dobInput = document.getElementById("dob");
  var errorEl = document.getElementById("errorMsg");
  var results = document.getElementById("results");
  var tickInterval = null;

  if (dobInput) {
    var today = new Date();
    dobInput.max = today.toISOString().split("T")[0];
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.add("show");
  }
  function clearError() {
    errorEl.textContent = "";
    errorEl.classList.remove("show");
  }

  function populateResults(dob) {
    if (tickInterval) clearInterval(tickInterval);
    results.classList.add("show");
    results.setAttribute("aria-live", "polite");

    function refresh() {
      var now = new Date();
      var data = computeAge(dob, now);

      countUpOnce("years", data.years);
      countUpOnce("months", data.months);
      countUpOnce("days", data.days);

      var totalSeconds = Math.floor((now - dob) / 1000);
      var hh = Math.floor(totalSeconds / 3600) % 24;
      var mm = Math.floor(totalSeconds / 60) % 60;
      var ss = totalSeconds % 60;

      document.getElementById("liveTotalDays").textContent = data.totalDays.toLocaleString();
      var flipWrap = document.getElementById("liveClock");
      renderFlipNumber(flipWrap, pad2(hh) + pad2(mm) + pad2(ss), 6);

      setText("valWeeks", data.totalWeeks.toLocaleString());
      setText("valHours", Math.floor((now - dob) / 3600000).toLocaleString());
      setText("valMinutes", Math.floor((now - dob) / 60000).toLocaleString());
      setText("valSeconds", totalSeconds.toLocaleString());

      setText("valDayOfWeek", data.dayOfWeek);
      setText("valZodiac", data.zodiacSymbol + "  " + data.zodiac);
      setText("valChinese", data.chineseZodiac);
      setText("valGeneration", data.generation);
      setText("valLeap", data.leapYears);

      var lifeExpectancy = 80;
      var pct = Math.min(100, (data.years + data.months / 12) / lifeExpectancy * 100);
      var bar = document.getElementById("lifeBarFill");
      if (bar) bar.style.width = pct.toFixed(1) + "%";
      setText("lifePct", pct.toFixed(1) + "%");

      var toNext = data.nextBirthday.getTime() - now.getTime();
      var d = Math.floor(toNext / 86400000);
      var h = Math.floor(toNext / 3600000) % 24;
      var m = Math.floor(toNext / 60000) % 60;
      var s = Math.floor(toNext / 1000) % 60;
      setText("cdDays", d);
      setText("cdHours", pad2(h));
      setText("cdMinutes", pad2(m));
      setText("cdSeconds", pad2(s));

      var heartbeats = Math.floor(totalSeconds / 60 * 75);
      setText("valHeartbeats", heartbeats.toLocaleString());

      if (data.isBirthdayToday && !window.__confettiFired) {
        window.__confettiFired = true;
        launchConfetti();
        var bTag = document.getElementById("birthdayBadge");
        if (bTag) bTag.style.display = "inline-flex";
      }
    }

    var didCountUp = {};
    function countUpOnce(id, value) {
      var el = document.getElementById(id);
      if (!el) return;
      if (!didCountUp[id]) {
        countUp(el, value, 900);
        didCountUp[id] = true;
      } else {
        el.textContent = value;
      }
    }

    refresh();
    tickInterval = setInterval(refresh, 1000);
  }

  function setText(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  }
  function pad2(n) { return String(n).padStart(2, "0"); }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      clearError();
      var val = dobInput.value;
      if (!val) { showError("Please choose a date."); return; }
      var parts = val.split("-").map(Number);
      var dob = new Date(parts[0], parts[1] - 1, parts[2]);
      var now = new Date();
      if (startOfDay(dob) > startOfDay(now)) {
        showError("Birth date cannot be in the future.");
        return;
      }
      if (parts[0] < 1900) {
        showError("Please enter a year after 1900.");
        return;
      }
      window.__confettiFired = false;
      populateResults(dob);
      setTimeout(function () {
        results.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    });
  }
})();
