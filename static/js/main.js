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

  /* ============ CONSTANTS ============ */
  var SYNODIC_MONTH_DAYS = 29.530588853;
  var MARS_YEAR_DAYS = 686.9713;

  var MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

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
  function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); }

  function safeDate(y, mIdx, d) {
    var dt = new Date(y, mIdx, 1);
    var max = daysInMonth(y, mIdx + 1);
    dt.setDate(Math.min(d, max));
    return dt;
  }

  /* ============ AGE MATH (mirrors the server's exact-time logic) ============ */
  function computeAge(dobDate, tobHH, tobMM, now) {
    var birthDt = new Date(dobDate.getFullYear(), dobDate.getMonth(), dobDate.getDate(), tobHH, tobMM, 0);

    var years = now.getFullYear() - dobDate.getFullYear();
    var months = now.getMonth() - dobDate.getMonth();
    var days = now.getDate() - dobDate.getDate();

    var nowClock = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    var tobClock = tobHH * 3600 + tobMM * 60;
    if (nowClock < tobClock) days -= 1;

    if (days < 0) {
      months -= 1;
      var pm = now.getMonth() === 0 ? 12 : now.getMonth();
      var py = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      days += daysInMonth(py, pm);
    }
    if (months < 0) { months += 12; years -= 1; }

    var totalMs = now.getTime() - birthDt.getTime();
    var totalSeconds = Math.floor(totalMs / 1000);
    var totalDays = Math.floor(totalSeconds / 86400);

    var nextBdayYear = now.getFullYear();
    var thisYearBday = safeDate(nextBdayYear, dobDate.getMonth(), dobDate.getDate());
    thisYearBday.setHours(tobHH, tobMM, 0, 0);
    if (thisYearBday.getTime() < now.getTime()) nextBdayYear += 1;
    var nextBirthday = safeDate(nextBdayYear, dobDate.getMonth(), dobDate.getDate());
    nextBirthday.setHours(tobHH, tobMM, 0, 0);

    var leapYears = 0;
    for (var y = dobDate.getFullYear(); y <= now.getFullYear(); y++) if (isLeap(y)) leapYears++;

    var fullMoons = Math.floor(totalDays / SYNODIC_MONTH_DAYS);
    var marsYearsExact = totalDays / MARS_YEAR_DAYS;

    return {
      years: years, months: months, days: days,
      totalDays: totalDays, totalSeconds: totalSeconds,
      totalWeeks: Math.floor(totalDays / 7),
      totalHours: Math.floor(totalSeconds / 3600),
      totalMinutes: Math.floor(totalSeconds / 60),
      dayOfWeek: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dobDate.getDay()],
      generation: generationOf(dobDate.getFullYear()),
      leapYears: leapYears,
      fullMoons: fullMoons,
      marsYearsExact: marsYearsExact,
      marsYearsWhole: Math.floor(marsYearsExact),
      nextBirthday: nextBirthday,
      isBirthdayToday: now.getMonth() === dobDate.getMonth() && now.getDate() === dobDate.getDate()
    };
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

  /* ============ CUSTOM CALENDAR WIDGET ============ */
  var calState = { viewYear: null, viewMonth: null, selected: null };
  var dobHidden = document.getElementById("dob");
  var dobDisplay = document.getElementById("dobDisplay");
  var dobDisplayText = document.getElementById("dobDisplayText");
  var calendarPanel = document.getElementById("calendarPanel");
  var calGrid = document.getElementById("calGrid");
  var calMonthSelect = document.getElementById("calMonthSelect");
  var calYearSelect = document.getElementById("calYearSelect");

  function fmtDisplay(d) {
    return d.getDate() + " " + MONTH_NAMES[d.getMonth()] + " " + d.getFullYear();
  }

  function initCalendar() {
    if (!calendarPanel) return;
    var today = new Date();
    calState.viewYear = today.getFullYear();
    calState.viewMonth = today.getMonth();

    MONTH_NAMES.forEach(function (name, i) {
      var opt = document.createElement("option");
      opt.value = i;
      opt.textContent = name;
      calMonthSelect.appendChild(opt);
    });
    for (var y = today.getFullYear(); y >= 1900; y--) {
      var opt2 = document.createElement("option");
      opt2.value = y;
      opt2.textContent = y;
      calYearSelect.appendChild(opt2);
    }

    if (dobHidden.value) {
      var parts = dobHidden.value.split("-").map(Number);
      var d = new Date(parts[0], parts[1] - 1, parts[2]);
      calState.selected = d;
      calState.viewYear = d.getFullYear();
      calState.viewMonth = d.getMonth();
      dobDisplayText.textContent = fmtDisplay(d);
      dobDisplay.classList.remove("placeholder");
    }

    renderCalendar();

    dobDisplay.addEventListener("click", function () {
      var isOpen = !calendarPanel.hasAttribute("hidden");
      if (isOpen) closeCalendar(); else openCalendar();
    });

    document.getElementById("calPrevMonth").addEventListener("click", function () { shiftMonth(-1); });
    document.getElementById("calNextMonth").addEventListener("click", function () { shiftMonth(1); });
    document.getElementById("calPrevYear").addEventListener("click", function () { shiftYear(-1); });
    document.getElementById("calNextYear").addEventListener("click", function () { shiftYear(1); });
    document.getElementById("calToday").addEventListener("click", function () {
      selectDate(new Date());
    });
    calMonthSelect.addEventListener("change", function () {
      calState.viewMonth = Number(calMonthSelect.value);
      renderCalendar();
    });
    calYearSelect.addEventListener("change", function () {
      calState.viewYear = Number(calYearSelect.value);
      renderCalendar();
    });

    document.addEventListener("click", function (e) {
      if (!calendarPanel.contains(e.target) && e.target !== dobDisplay && !dobDisplay.contains(e.target)) {
        closeCalendar();
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !calendarPanel.hasAttribute("hidden")) {
        closeCalendar();
        dobDisplay.focus();
      }
    });
  }

  function openCalendar() {
    calendarPanel.removeAttribute("hidden");
    dobDisplay.setAttribute("aria-expanded", "true");
  }
  function closeCalendar() {
    calendarPanel.setAttribute("hidden", "");
    dobDisplay.setAttribute("aria-expanded", "false");
  }
  function shiftMonth(delta) {
    calState.viewMonth += delta;
    if (calState.viewMonth > 11) { calState.viewMonth = 0; calState.viewYear++; }
    if (calState.viewMonth < 0) { calState.viewMonth = 11; calState.viewYear--; }
    renderCalendar();
  }
  function shiftYear(delta) {
    calState.viewYear += delta;
    renderCalendar();
  }

  function selectDate(d) {
    if (startOfDay(d) > startOfDay(new Date())) return; // no future dates
    calState.selected = d;
    calState.viewYear = d.getFullYear();
    calState.viewMonth = d.getMonth();
    var iso = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    dobHidden.value = iso;
    dobDisplayText.textContent = fmtDisplay(d);
    dobDisplay.classList.remove("placeholder");
    closeCalendar();
    renderCalendar();
  }

  function renderCalendar() {
    if (!calGrid) return;
    calMonthSelect.value = calState.viewMonth;
    calYearSelect.value = calState.viewYear;

    calGrid.innerHTML = "";
    var firstOfMonth = new Date(calState.viewYear, calState.viewMonth, 1);
    var startWeekday = firstOfMonth.getDay();
    var totalDaysInMonth = daysInMonth(calState.viewYear, calState.viewMonth + 1);
    var prevMonthDays = daysInMonth(calState.viewYear, calState.viewMonth);
    var today = new Date();
    var cellsNeeded = Math.ceil((startWeekday + totalDaysInMonth) / 7) * 7;

    for (var i = 0; i < cellsNeeded; i++) {
      var dayNum = i - startWeekday + 1;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cal-day";

      var cellDate, outside = false;
      if (dayNum < 1) {
        cellDate = new Date(calState.viewYear, calState.viewMonth - 1, prevMonthDays + dayNum);
        outside = true;
      } else if (dayNum > totalDaysInMonth) {
        cellDate = new Date(calState.viewYear, calState.viewMonth + 1, dayNum - totalDaysInMonth);
        outside = true;
      } else {
        cellDate = new Date(calState.viewYear, calState.viewMonth, dayNum);
      }

      btn.textContent = cellDate.getDate();
      if (outside) btn.classList.add("outside");
      if (startOfDay(cellDate) === startOfDay(today)) btn.classList.add("today");
      if (calState.selected && startOfDay(cellDate) === startOfDay(calState.selected)) btn.classList.add("selected");
      if (startOfDay(cellDate) > startOfDay(today)) btn.disabled = true;

      (function (d) {
        btn.addEventListener("click", function () { selectDate(d); });
      })(cellDate);

      calGrid.appendChild(btn);
    }
  }

  initCalendar();

  /* ============ MAIN FLOW ============ */
  var form = document.getElementById("ageForm");
  var tobInput = document.getElementById("tob");
  var errorEl = document.getElementById("errorMsg");
  var results = document.getElementById("results");
  var tickInterval = null;

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.add("show");
  }
  function clearError() {
    errorEl.textContent = "";
    errorEl.classList.remove("show");
  }

  function setText(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  }
  function pad2(n) { return String(n).padStart(2, "0"); }

  function populateResults(dob, tobHH, tobMM, timeKnown) {
    if (tickInterval) clearInterval(tickInterval);
    results.classList.add("show");
    results.setAttribute("aria-live", "polite");

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

    function refresh() {
      var now = new Date();
      var data = computeAge(dob, tobHH, tobMM, now);

      countUpOnce("years", data.years);
      countUpOnce("months", data.months);
      countUpOnce("days", data.days);

      var hh = Math.floor(data.totalSeconds / 3600) % 24;
      var mm = Math.floor(data.totalSeconds / 60) % 60;
      var ss = data.totalSeconds % 60;

      document.getElementById("liveTotalDays").textContent = data.totalDays.toLocaleString();
      renderFlipNumber(document.getElementById("liveClock"), pad2(hh) + pad2(mm) + pad2(ss), 6);

      setText("valWeeks", data.totalWeeks.toLocaleString());
      setText("valHours", data.totalHours.toLocaleString());
      setText("valMinutes", data.totalMinutes.toLocaleString());
      setText("valSeconds", data.totalSeconds.toLocaleString());

      setText("valDayOfWeek", data.dayOfWeek);
      setText("valGeneration", data.generation);
      setText("valLeap", data.leapYears);
      setText("valFullMoons", data.fullMoons.toLocaleString());
      setText("valMarsAge", data.marsYearsWhole + " Mars yrs");
      var marsCard = document.getElementById("valMarsAge");
      if (marsCard) {
        var marsSub = marsCard.parentElement.querySelector(".card-sub");
        if (marsSub) marsSub.textContent = data.marsYearsExact.toFixed(2) + " exact \u00b7 a Mars year is 687 Earth days";
      }

      if (timeKnown) {
        setText("valBornTime", pad2(tobHH) + ":" + pad2(tobMM));
        setText("valBornTimeSub", "used for second-precision timing");
      } else {
        setText("valBornTime", "midnight (assumed)");
        setText("valBornTimeSub", "add a time above for more precision");
      }

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

      var heartbeats = Math.floor(data.totalSeconds / 60 * 75);
      setText("valHeartbeats", heartbeats.toLocaleString());

      if (data.isBirthdayToday && !window.__confettiFired) {
        window.__confettiFired = true;
        launchConfetti();
        var bTag = document.getElementById("birthdayBadge");
        if (bTag) bTag.style.display = "inline-flex";
      }
    }

    refresh();
    tickInterval = setInterval(refresh, 1000);
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      clearError();

      if (!dobHidden.value) { showError("Please choose a date."); return; }
      var parts = dobHidden.value.split("-").map(Number);
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

      var tobHH = 0, tobMM = 0, timeKnown = false;
      if (tobInput && tobInput.value) {
        var tp = tobInput.value.split(":").map(Number);
        tobHH = tp[0]; tobMM = tp[1];
        timeKnown = true;
      }

      window.__confettiFired = false;
      populateResults(dob, tobHH, tobMM, timeKnown);
      setTimeout(function () {
        results.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    });
  }
})();
