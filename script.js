(function () {
  "use strict";

  /* ============================================================
     الإعدادات — عدّل هنا فقط
     ============================================================ */
  const CONFIG = {
    title: "خطوبة حسين غسان العبدالله",
    description: "يتشرف الصيدلاني حسين غسان العبدالله بدعوتكم لحضور مشية خطوبته",
    location: "العروبة الثانية - فرع هايبر ماركت توفير",
    // 14 نوفمبر 2026 الساعة 3:00 مساءً (بالتوقيت المحلي للزائر)
    start: new Date(2026, 10, 14, 15, 0, 0),
    durationHours: 3,
    // ما يُبحث عنه في خرائط Google — استبدله برابط/إحداثيات دقيقة إن توفرت
    mapQuery: "هايبر ماركت توفير العروبة الثانية",
    // رقم واتساب لاستقبال تأكيد الحضور بالصيغة الدولية بدون + (مثال: 9627XXXXXXXX)
    // اتركه فارغاً لإخفاء قسم تأكيد الحضور
    rsvpPhone: "",
  };

  const $ = (id) => document.getElementById(id);
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pad = (n) => String(n).padStart(2, "0");
  const siteUrl = location.origin + location.pathname;

  /* ============================================================
     اسم الضيف من الرابط:  ?to=اسم الضيف
     ============================================================ */
  const params = new URLSearchParams(location.search);
  const guest = (params.get("to") || params.get("guest") || "").trim().slice(0, 60);
  if (guest) {
    const envTo = $("env-to");
    envTo.textContent = "إلى: " + guest;
    envTo.hidden = false;
    const cardTo = $("card-to");
    cardTo.textContent = "دعوة خاصة إلى " + guest;
    cardTo.hidden = false;
  }

  /* ============================================================
     المظروف
     ============================================================ */
  const scene = $("envelope-scene");
  const envelope = $("envelope");
  let opened = false;

  function openEnvelope() {
    if (opened) return;
    opened = true;
    scene.classList.add("open");
    envelope.setAttribute("aria-disabled", "true");
    const delay = reduceMotion ? 0 : 1600;
    setTimeout(() => {
      root.classList.remove("pre-open");
      root.classList.add("opened");
      scene.classList.add("gone");
      setTimeout(() => scene.remove(), 1000);
    }, delay);
  }
  envelope.addEventListener("click", openEnvelope);
  envelope.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openEnvelope(); }
  });

  /* ============================================================
     التاريخ الهجري
     ============================================================ */
  try {
    const hijri = new Intl.DateTimeFormat("ar-u-ca-islamic-umalqura-nu-latn", {
      day: "numeric", month: "long", year: "numeric",
    }).format(CONFIG.start);
    $("hijri").textContent = hijri;
  } catch (_) { /* المتصفح لا يدعم التقويم الهجري */ }

  /* ============================================================
     العدّاد التنازلي
     ============================================================ */
  const cd = {
    days: $("cd-days"), hours: $("cd-hours"), mins: $("cd-mins"), secs: $("cd-secs"),
    box: $("countdown"), done: $("countdown-done"),
  };
  function setNum(el, value) {
    if (el.textContent === value) return;
    el.textContent = value;
    if (reduceMotion) return;
    el.classList.remove("flip");
    void el.offsetWidth;
    el.classList.add("flip");
  }
  function tick() {
    const diff = CONFIG.start.getTime() - Date.now();
    if (diff <= 0) { cd.box.hidden = true; cd.done.hidden = false; return; }
    const s = Math.floor(diff / 1000);
    setNum(cd.days, String(Math.floor(s / 86400)));
    setNum(cd.hours, pad(Math.floor((s % 86400) / 3600)));
    setNum(cd.mins, pad(Math.floor((s % 3600) / 60)));
    setNum(cd.secs, pad(s % 60));
    setTimeout(tick, 1000 - (Date.now() % 1000));
  }
  tick();

  /* ============================================================
     الخريطة
     ============================================================ */
  const mapsUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(CONFIG.mapQuery);
  $("btn-map").href = mapsUrl;
  $("dock-map").href = mapsUrl;
  $("btn-show-map").addEventListener("click", () => {
    const frame = document.createElement("iframe");
    frame.src = "https://www.google.com/maps?q=" + encodeURIComponent(CONFIG.mapQuery) + "&hl=ar&z=16&output=embed";
    frame.loading = "lazy";
    frame.referrerPolicy = "no-referrer-when-downgrade";
    frame.title = "خريطة الموقع";
    frame.allowFullscreen = true;
    $("map").replaceChildren(frame);
  });

  /* ============================================================
     التقويم: Google + ملف ICS
     ============================================================ */
  const end = new Date(CONFIG.start.getTime() + CONFIG.durationHours * 3600 * 1000);
  const stamp = (d) => d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "T" + pad(d.getHours()) + pad(d.getMinutes()) + "00";

  $("cal-google").href =
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    "&text=" + encodeURIComponent(CONFIG.title) +
    "&dates=" + stamp(CONFIG.start) + "/" + stamp(end) +
    "&details=" + encodeURIComponent(CONFIG.description + "\n" + siteUrl) +
    "&location=" + encodeURIComponent(CONFIG.location);

  const escapeIcs = (t) => t.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  function downloadIcs() {
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Hussain Engagement//AR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "UID:hussain-engagement-2026-11-14@invitation",
      "DTSTAMP:" + stamp(new Date()) + "Z",
      "DTSTART:" + stamp(CONFIG.start),
      "DTEND:" + stamp(end),
      "SUMMARY:" + escapeIcs(CONFIG.title),
      "DESCRIPTION:" + escapeIcs(CONFIG.description + "\n" + siteUrl),
      "LOCATION:" + escapeIcs(CONFIG.location),
      "URL:" + siteUrl,
      "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY",
      "DESCRIPTION:" + escapeIcs("تذكير: " + CONFIG.title + " غداً"),
      "END:VALARM",
      "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "خطوبة-حسين.ics";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const calBtn = $("btn-calendar");
  const calMenu = $("cal-menu");
  function toggleMenu(force) {
    const show = force !== undefined ? force : calMenu.hidden;
    calMenu.hidden = !show;
    calBtn.setAttribute("aria-expanded", String(show));
  }
  calBtn.addEventListener("click", (e) => { e.stopPropagation(); toggleMenu(); });
  $("cal-ics").addEventListener("click", () => { downloadIcs(); toggleMenu(false); });
  document.addEventListener("click", (e) => { if (!calMenu.hidden && !calMenu.contains(e.target)) toggleMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") toggleMenu(false); });
  $("dock-cal").addEventListener("click", (e) => {
    e.stopPropagation();
    $("actions").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    setTimeout(() => toggleMenu(true), reduceMotion ? 0 : 450);
  });

  /* ============================================================
     المشاركة
     ============================================================ */
  const shareText =
    CONFIG.description + "\n\n📅 السبت 14 نوفمبر 2026\n🕒 3:00 مساءً\n📍 " + CONFIG.location + "\n\n" + siteUrl;
  const waUrl = "https://wa.me/?text=" + encodeURIComponent(shareText);
  $("btn-whatsapp").href = waUrl;
  $("dock-wa").href = waUrl;

  const toast = $("toast");
  let toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  if (navigator.share) {
    const shareBtn = $("btn-share");
    shareBtn.hidden = false;
    shareBtn.addEventListener("click", async () => {
      try { await navigator.share({ title: CONFIG.title, text: shareText.replace("\n\n" + siteUrl, ""), url: siteUrl }); }
      catch (_) { /* المستخدم ألغى */ }
    });
  }
  $("btn-copy").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(siteUrl);
      showToast("تم نسخ رابط الدعوة ✓");
    } catch (_) {
      showToast(siteUrl);
    }
  });

  /* ============================================================
     تأكيد الحضور عبر واتساب
     ============================================================ */
  if (CONFIG.rsvpPhone) {
    const rsvp = $("rsvp");
    rsvp.hidden = false;
    const countOut = $("rsvp-count");
    let count = 1;
    rsvp.querySelectorAll(".stepper button").forEach((b) => {
      b.addEventListener("click", () => {
        count = Math.min(10, Math.max(1, count + Number(b.dataset.d)));
        countOut.textContent = String(count);
      });
    });
    $("rsvp-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("rsvp-name").value.trim();
      const attending = rsvp.querySelector("input[name=att]:checked").value === "yes";
      const msg = attending
        ? "السلام عليكم، أنا " + name + "، سأحضر مشية خطوبة حسين بإذن الله 🌼\nعدد الحضور: " + count
        : "السلام عليكم، أنا " + name + "، أعتذر عن حضور مشية خطوبة حسين، وألف مبروك 🌼";
      const a = document.createElement("a");
      a.href = "https://wa.me/" + CONFIG.rsvpPhone + "?text=" + encodeURIComponent(msg);
      a.target = "_blank"; a.rel = "noopener";
      document.body.appendChild(a); a.click(); a.remove();
    });
  }

  /* ============================================================
     ميلان البطاقة مع المؤشر (أجهزة الفأرة فقط)
     ============================================================ */
  const card = $("invitation");
  if (!reduceMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty("--rx", (px * 7).toFixed(2) + "deg");
      card.style.setProperty("--ry", (-py * 7).toFixed(2) + "deg");
      card.style.setProperty("--px", px.toFixed(3));
      card.style.setProperty("--py", py.toFixed(3));
    });
    card.addEventListener("pointerleave", () => {
      ["--rx", "--ry", "--px", "--py"].forEach((v) => card.style.removeProperty(v));
    });
  }

  /* ============================================================
     الظهور عند التمرير + شريط الجوال
     ============================================================ */
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.15 });
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

    const dock = $("dock");
    new IntersectionObserver((entries) => {
      const en = entries[0];
      dock.classList.toggle("show", !en.isIntersecting && en.boundingClientRect.top < 0);
    }, { threshold: 0 }).observe(card);
  } else {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
  }

  /* ============================================================
     البتلات المتساقطة
     ============================================================ */
  (function petals() {
    if (reduceMotion) return;
    const canvas = $("petals");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const colors = ["#e9c9c3", "#f3dcd6", "#f1e7d8", "#d9dcc3", "#e8d8c8", "#f6e3dd"];
    let w = 0, h = 0, list = [], raf = 0, running = false;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + "px"; canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = w < 640 ? 16 : 28;
      while (list.length < n) list.push(make(true));
      list.length = n;
    }
    function make(initial) {
      return {
        x: Math.random() * w,
        y: initial ? Math.random() * h : -20,
        r: 4 + Math.random() * 6,
        vy: 0.35 + Math.random() * 0.7,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: 0.008 + Math.random() * 0.016,
        swayAmp: 0.4 + Math.random() * 0.8,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.03,
        color: colors[(Math.random() * colors.length) | 0],
        alpha: 0.45 + Math.random() * 0.4,
      };
    }
    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < list.length; i++) {
        const p = list[i];
        p.sway += p.swaySpeed;
        p.x += Math.sin(p.sway) * p.swayAmp;
        p.y += p.vy;
        p.rot += p.vr;
        if (p.y > h + 20 || p.x < -30 || p.x > w + 30) list[i] = make(false);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      raf = requestAnimationFrame(frame);
    }
    function start() { if (!running) { running = true; raf = requestAnimationFrame(frame); } }
    function stop() { running = false; cancelAnimationFrame(raf); }

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
    start();
  })();
})();
