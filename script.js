(function () {
  "use strict";

  // ===== بيانات المناسبة =====
  const EVENT = {
    title: "خطوبة حسين غسان العبدالله",
    description: "يتشرف الصيدلاني حسين غسان العبدالله بدعوتكم لحضور مشية خطوبته",
    location: "العروبة الثانية - فرع هايبر ماركت توفير",
    // 14 نوفمبر 2026 الساعة 3:00 مساءً (بالتوقيت المحلي للزائر)
    start: new Date(2026, 10, 14, 15, 0, 0),
    durationHours: 3,
  };

  // ===== العدّاد التنازلي =====
  const els = {
    days: document.getElementById("cd-days"),
    hours: document.getElementById("cd-hours"),
    mins: document.getElementById("cd-mins"),
    secs: document.getElementById("cd-secs"),
    box: document.getElementById("countdown"),
    done: document.getElementById("countdown-done"),
  };

  const pad = (n) => String(n).padStart(2, "0");

  function tick() {
    const diff = EVENT.start.getTime() - Date.now();
    if (diff <= 0) {
      els.box.hidden = true;
      els.done.hidden = false;
      return;
    }
    const s = Math.floor(diff / 1000);
    els.days.textContent = Math.floor(s / 86400);
    els.hours.textContent = pad(Math.floor((s % 86400) / 3600));
    els.mins.textContent = pad(Math.floor((s % 3600) / 60));
    els.secs.textContent = pad(s % 60);
    setTimeout(tick, 1000 - (Date.now() % 1000));
  }
  tick();

  // ===== إضافة إلى التقويم (ملف ICS) =====
  function icsDate(d) {
    return (
      d.getFullYear() +
      pad(d.getMonth() + 1) +
      pad(d.getDate()) +
      "T" +
      pad(d.getHours()) +
      pad(d.getMinutes()) +
      "00"
    );
  }

  function escapeIcs(text) {
    return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  }

  function downloadIcs() {
    const end = new Date(EVENT.start.getTime() + EVENT.durationHours * 3600 * 1000);
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Hussain Engagement//AR",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "UID:hussain-engagement-2026-11-14@invitation",
      "DTSTAMP:" + icsDate(new Date()) + "Z",
      "DTSTART:" + icsDate(EVENT.start),
      "DTEND:" + icsDate(end),
      "SUMMARY:" + escapeIcs(EVENT.title),
      "DESCRIPTION:" + escapeIcs(EVENT.description),
      "LOCATION:" + escapeIcs(EVENT.location),
      "BEGIN:VALARM",
      "TRIGGER:-P1D",
      "ACTION:DISPLAY",
      "DESCRIPTION:" + escapeIcs("تذكير: " + EVENT.title + " غداً"),
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "خطوبة-حسين.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  document.getElementById("btn-calendar").addEventListener("click", downloadIcs);

  // ===== مشاركة عبر واتساب =====
  const shareText =
    EVENT.description +
    "\n\n📅 السبت 14 نوفمبر 2026\n🕒 3:00 مساءً\n📍 " +
    EVENT.location +
    "\n\n" +
    location.href.split("#")[0];
  document.getElementById("btn-whatsapp").href =
    "https://wa.me/?text=" + encodeURIComponent(shareText);
})();
