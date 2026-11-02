/* ============================================================
   JACK BARONE — interactions
   ============================================================ */
(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Year ---------- */
  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Intro loader ---------- */
  (function intro() {
    var intro = $("#intro");
    if (!intro) return;
    if (reduceMotion || sessionStorage.getItem("jb_intro")) { intro.remove(); return; }
    var dismiss = function () {
      intro.classList.add("is-done");
      sessionStorage.setItem("jb_intro", "1");
      window.setTimeout(function () { if (intro.parentNode) intro.remove(); }, 900);
    };
    window.setTimeout(dismiss, 1100);
  })();

  /* ---------- Scroll progress ---------- */
  var progressBar = $("#progressBar");
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
      if (progressBar) progressBar.style.width = pct + "%";
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Reveal on scroll ---------- */
  var reveals = $$(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); ro.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { ro.observe(el); });
  }

  /* ---------- Rotating roles ---------- */
  (function rotator() {
    var el = $("#rotator");
    if (!el) return;
    var words = (el.dataset.words || "").split(",").map(function (w) { return w.trim(); }).filter(Boolean);
    if (words.length < 2) return;
    var i = 0;
    el.style.transition = "opacity .35s ease";
    window.setInterval(function () {
      if (document.hidden) return;
      el.style.opacity = "0";
      window.setTimeout(function () {
        i = (i + 1) % words.length;
        el.textContent = words[i];
        el.style.opacity = "1";
      }, reduceMotion ? 0 : 350);
    }, 2200);
  })();

  /* ---------- Mobile overlay menu ---------- */
  (function menu() {
    var btn = $("#menuBtn");
    var overlay = $("#overlay");
    if (!btn || !overlay) return;
    function setOpen(open) {
      overlay.classList.toggle("is-open", open);
      overlay.setAttribute("aria-hidden", open ? "false" : "true");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.setAttribute("aria-label", open ? "Close chapter menu" : "Open chapter menu");
      document.body.style.overflow = open ? "hidden" : "";
    }
    btn.addEventListener("click", function () { setOpen(!overlay.classList.contains("is-open")); });
    $$(".overlay__item", overlay).forEach(function (a) {
      a.addEventListener("click", function () { setOpen(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("is-open")) setOpen(false);
    });
  })();

  /* ---------- Keyboard page navigation (→ / ← / J / K) ----------
     Each chapter is its own page now, so the keys follow the pager's
     previous/next links instead of scrolling between sections. */
  (function keys() {
    var prev = $('[data-pager="prev"]'), next = $('[data-pager="next"]');
    if (!prev && !next) return;
    document.addEventListener("keydown", function (e) {
      var t = e.target;
      if (e.metaKey || e.ctrlKey || e.altKey) return;   // leave browser shortcuts (⌘← = back) alone
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if ($("#lightbox") && $("#lightbox").classList.contains("is-open")) return;
      if (next && (e.key === "ArrowRight" || e.key === "j" || e.key === "J")) window.location.href = next.href;
      else if (prev && (e.key === "ArrowLeft" || e.key === "k" || e.key === "K")) window.location.href = prev.href;
    });
  })();

  /* ---------- Studio reel + home film: hover, Space, or tap to pause ----------
     The reel is hard cuts (a new photo every ~0.1s, no crossfades), so pausing
     at any moment freezes on one clean picture. Hover pauses only while the
     pointer is over it; Space (and a tap on touch screens) holds it until
     pressed again. */
  (function studioReel() {
    var video = $(".studio__reel, .home__video");
    if (!video) return;
    var holder = video.closest(".studio__portrait, .home__film") || video;
    var hovering = false, held = reduceMotion;   // reduced-motion visitors get a still frame until they press play
    function sync() {
      if (hovering || held) { video.pause(); return; }
      var p = video.play();
      if (p && p.catch) p.catch(function () {});   // autoplay can be refused; nothing to do
    }
    if (held) video.pause();
    holder.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") { hovering = true; sync(); } });
    holder.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") { hovering = false; sync(); } });
    holder.addEventListener("pointerup", function (e) { if (e.pointerType !== "mouse") { held = !held; sync(); } });
    document.addEventListener("keydown", function (e) {
      if (e.key !== " " || e.metaKey || e.ctrlKey || e.altKey) return;
      var t = e.target;
      // Space still activates a focused link/button and types in fields
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "BUTTON" || t.tagName === "A" || t.isContentEditable)) return;
      e.preventDefault();                 // don't scroll the page
      held = !held;
      if (!held) hovering = false;        // second press resumes even if the pointer is still over it
      sync();
    });
  })();

  /* ---------- Lightbox ---------- */
  (function lightbox() {
    var lb = $("#lightbox");
    var shots = $$(".shot");
    if (!lb || !shots.length) return;
    var frame = $("#lbFrame"), cap = $("#lbCap");
    var closeBtn = $("#lbClose"), prevBtn = $("#lbPrev"), nextBtn = $("#lbNext");
    var current = 0, lastFocus = null;

    function render(i) {
      current = (i + shots.length) % shots.length;
      var shot = shots[current];
      var img = shot.querySelector("img");
      var src = img ? (img.currentSrc || img.src) : "";
      var alt = img ? img.alt : "";
      cap.textContent = shot.dataset.cap || "";
      var pad = function (n) { return String(n).padStart(2, "0"); };
      frame.innerHTML =
        '<img src="' + src + '" alt="' + alt.replace(/"/g, "&quot;") + '">' +
        '<span class="lightbox__count">' + pad(current + 1) + " / " + pad(shots.length) + "</span>";
    }
    function open(i) {
      lastFocus = document.activeElement;
      render(i);
      lb.classList.add("is-open");
      lb.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      closeBtn.focus();
    }
    function close() {
      lb.classList.remove("is-open");
      lb.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    }
    shots.forEach(function (s, i) { s.addEventListener("click", function () { open(i); }); });
    closeBtn.addEventListener("click", close);
    prevBtn.addEventListener("click", function () { render(current - 1); });
    nextBtn.addEventListener("click", function () { render(current + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") render(current + 1);
      else if (e.key === "ArrowLeft") render(current - 1);
    });
  })();

  /* ---------- Vinyl buy → hosted checkout ---------- */
  $$(".btn-buy").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var url = btn.getAttribute("data-checkout");
      if (url && /^https?:\/\//.test(url)) {
        window.open(url, "_blank", "noopener");
      } else {
        var original = btn.innerHTML;
        btn.textContent = "Add checkout link →";
        window.setTimeout(function () { btn.innerHTML = original; }, 1600);
      }
    });
  });

  /* ---------- External placeholder links (href="#") ---------- */
  $$("[data-ext]").forEach(function (a) {
    var href = a.getAttribute("href") || "";
    if (href === "#" || href === "") {
      a.addEventListener("click", function (e) { e.preventDefault(); });
    } else if (/^https?:\/\//.test(href)) {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    }
  });

  /* ---------- Newsletter (front-end stub) ---------- */
  (function signup() {
    var form = $("#signup"), input = $("#email"), msg = $("#signupMsg");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var val = (input.value || "").trim();
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      if (!ok) { msg.textContent = "Enter a valid email."; msg.style.color = "var(--accent)"; input.focus(); return; }
      msg.textContent = "Thanks — you're on the list.";
      form.reset();
    });
  })();

  /* ---------- Back to top ---------- */
  var toTop = $("#toTop");
  if (toTop) toTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });
})();
