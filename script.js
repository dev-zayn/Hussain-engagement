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
     المظروف — البطاقة داخل المظروف هي نسخة من البطاقة الحقيقية،
     تخرج منه ثم تكبر حتى تطابق مكانها في الصفحة تماماً، فيتم التبديل
     بينهما دون أي قفزة.
     ============================================================ */
  const scene = $("envelope-scene");
  const stage = $("env-stage");
  const envelope = $("envelope");
  const morph = $("morph");
  const realCard = $("invitation");
  const SLOT = { x: 0.09, y: 0.08, w: 0.82, h: 0.84 }; // موضع فتحة البطاقة داخل المظروف
  const PAD = 140;                                      // هامش القصّ حتى لا يُقطع ظل البطاقة
  const RADIUS = 24;
  let opened = false;
  let geo = null;
  let clone = null;

  function buildClone() {
    clone = realCard.cloneNode(true);
    clone.removeAttribute("id");
    clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
    morph.replaceChildren(clone);
    syncShimmer();
  }

  // يحسب حجم النسخة وموضعها بحيث تظهر داخل فتحة المظروف بالضبط
  function measure() {
    if (opened || !clone) return;
    const W = realCard.offsetWidth;
    const ew = envelope.offsetWidth, eh = envelope.offsetHeight;
    if (!W || !ew) return;
    morph.style.width = W + "px";
    const H = clone.offsetHeight;
    const sx = ew * SLOT.x, sy = eh * SLOT.y, sw = ew * SLOT.w, sh = eh * SLOT.h;
    const k = sw / W;
    const B = H - sh / k;
    geo = { sx, sy, sh, k, B };
    morph.style.transform = "translate(" + sx + "px, " + sy + "px) scale(" + k + ")";
    morph.style.clipPath = clip(B);
    morph.style.opacity = "1";
  }
  function clip(bottom) {
    return "inset(" + -PAD + "px " + -PAD + "px " + bottom + "px " + -PAD + "px round " + RADIUS + "px)";
  }

  function finish() {
    root.classList.remove("pre-open");
    root.classList.add("opened");
    scene.remove();
    morph.remove();
    startPage();
  }

  // مزامنة لمعان الرقم بين النسخة والبطاقة الحقيقية حتى لا يقفز عند التبديل
  function syncShimmer() {
    try {
      const a = realCard.querySelector(".day-num").getAnimations()[0];
      const b = clone.querySelector(".day-num").getAnimations()[0];
      if (a && b) b.startTime = a.startTime;
    } catch (_) { /* لا شيء */ }
  }

  async function openEnvelope() {
    if (opened) return;
    measure();
    opened = true;
    envelope.setAttribute("aria-disabled", "true");
    window.scrollTo(0, 0);

    if (reduceMotion || !geo || typeof morph.animate !== "function") { finish(); return; }

    const EASE_OUT = "cubic-bezier(0.2, 0.7, 0.2, 1)";
    const EASE_IN = "cubic-bezier(0.5, 0, 0.9, 0.6)";
    const EASE_MORPH = "cubic-bezier(0.7, 0, 0.2, 1)";
    const fwd = (duration, easing, delay) => ({ duration, easing, delay: delay || 0, fill: "forwards" });

    // 1) تثبيت حركة الطفو ثم إزالتها بهدوء حتى لا تقفز الإحداثيات
    const current = getComputedStyle(stage).transform;
    scene.classList.add("open");
    stage.animate([{ transform: current }, { transform: "none" }], fwd(600, "ease-out"));

    // 2) النصوص تختفي، الختم يذوب، الغطاء يُفتح (نصفان: أمامي حتى 90° ثم خلفي حتى 180°)
    scene.querySelectorAll(".env-kicker, .env-to, .env-hint").forEach((el) =>
      el.animate([{ opacity: 1 }, { opacity: 0 }], fwd(350, "ease")));
    scene.querySelector(".env-seal").animate(
      [{ transform: "scale(1) rotate(0deg)", opacity: 1 }, { transform: "scale(0) rotate(90deg)", opacity: 0 }],
      fwd(420, EASE_IN));
    scene.querySelector(".env-flap-front").animate(
      [{ transform: "rotateX(0deg)" }, { transform: "rotateX(90deg)" }], fwd(320, EASE_IN, 60));
    scene.querySelector(".env-flap-back").animate(
      [{ transform: "rotateX(90deg)" }, { transform: "rotateX(180deg)" }], fwd(420, EASE_OUT, 380));

    // 3) البطاقة تنزلق خارج المظروف
    const { sx, sy, sh, k, B } = geo;
    const y1 = -(sh + 14);
    const rise = morph.animate(
      [{ transform: "translate(" + sx + "px, " + sy + "px) scale(" + k + ")" },
       { transform: "translate(" + sx + "px, " + y1 + "px) scale(" + k + ")" }],
      fwd(950, EASE_OUT, 720));
    await rise.finished;

    // 4) المظروف يهبط ويتلاشى بينما البطاقة تكبر حتى تطابق مكانها الحقيقي في الصفحة.
    //    تُنقل النسخة إلى طبقة ثابتة بإحداثيات الشاشة (أرقام صحيحة من بكسلات الجهاز)
    //    حتى يكون التبديل النهائي مطابقاً تماماً بلا إزاحة أو ضبابية.
    const cur = clone.getBoundingClientRect();
    const x0 = cur.left, y0 = cur.top;
    morph.style.transform = "translate(" + x0 + "px, " + y0 + "px) scale(" + k + ")";
    morph.classList.add("morph-free");
    document.body.appendChild(morph);
    rise.cancel();
    syncShimmer();

    scene.querySelectorAll(".env-layer").forEach((layer) =>
      layer.animate(
        [{ transform: "translateY(0)", opacity: 1 }, { transform: "translateY(150px)", opacity: 0 }],
        fwd(700, EASE_IN)));

    const dpr = window.devicePixelRatio || 1;
    const snap = (v) => Math.round(v * dpr) / dpr;
    const cardRect = realCard.getBoundingClientRect();
    const xf = snap(cardRect.left), yf = snap(cardRect.top);
    const grow = morph.animate(
      [{ transform: "translate(" + x0 + "px, " + y0 + "px) scale(" + k + ")", clipPath: clip(B) },
       { transform: "translate(" + xf + "px, " + yf + "px) scale(1)", clipPath: clip(-PAD) }],
      fwd(1500, EASE_MORPH));
    await grow.finished;

    // 5) التبديل: البطاقة الحقيقية في نفس المكان بالضبط
    finish();
  }

  envelope.addEventListener("click", openEnvelope);
  envelope.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openEnvelope(); }
  });
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  // منع التمرير أثناء المظروف (خصوصاً على iOS) حتى تبقى الصفحة في موضعها
  const block = (e) => { if (root.classList.contains("pre-open")) e.preventDefault(); };
  scene.addEventListener("touchmove", block, { passive: false });
  scene.addEventListener("wheel", block, { passive: false });

  /* ============================================================
     التاريخ الهجري
     ============================================================ */
  try {
    const hijri = new Intl.DateTimeFormat("ar-u-ca-islamic-umalqura-nu-latn", {
      day: "numeric", month: "long", year: "numeric",
    }).format(CONFIG.start);
    $("hijri").textContent = hijri;
  } catch (_) { /* المتصفح لا يدعم التقويم الهجري */ }

  buildClone();
  measure();
  window.addEventListener("resize", measure);
  window.addEventListener("load", measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

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
     ما بعد فتح المظروف: ميلان البطاقة، الظهور عند التمرير، شريط الجوال
     ============================================================ */
  const card = realCard;
  function startPage() {
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

    const reveals = Array.from(document.querySelectorAll(".reveal"));
    if (!("IntersectionObserver" in window)) {
      reveals.forEach((el) => el.classList.add("in"));
      return;
    }
    // العناصر الظاهرة لحظة الفتح تظهر تباعاً بعد استقرار البطاقة
    let i = 0;
    reveals.forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight) {
        el.style.transitionDelay = (0.15 + i++ * 0.14).toFixed(2) + "s";
        el.addEventListener("transitionend", () => { el.style.transitionDelay = ""; }, { once: true });
      }
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.15 });
    reveals.forEach((el) => io.observe(el));

    const dock = $("dock");
    new IntersectionObserver((entries) => {
      const en = entries[0];
      dock.classList.toggle("show", !en.isIntersecting && en.boundingClientRect.top < 0);
    }, { threshold: 0 }).observe(card);
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
