/* ============================================================
   AOKI ANIMATION — main.js
   Motion policy: prefers-reduced-motion is respected (videos stay on poster,
   CSS side stops animation/transition).
   ============================================================ */
(function () {
  "use strict";

  // Motion policy: always animate (flow rule §1-3 — RM intentionally not honored).
  var REDUCED_MOTION = false;

  /* ---------- 0. Reduced motion: keep autoplay videos on poster ---------- */
  function initReducedMotionVideos() {
    if (!REDUCED_MOTION) return;
    document.querySelectorAll("video[autoplay]").forEach(function (v) {
      v.removeAttribute("autoplay");
      try { v.pause(); } catch (e) {}
    });
  }

  /* ---------- 1. Scroll reveal (mask reveal + fade) ---------- */
  function initReveal() {
    var els = document.querySelectorAll(".rv, .ani, .sec-title, .lineup__in, .rv-group");
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 2. Header ---------- */
  function initHeader() {
    var header = document.querySelector(".header");
    if (!header) return;
    var onScroll = function () {
      header.classList.toggle("is-solid", window.scrollY > 80);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- 3. Drawer (SP) ---------- */
  function initDrawer() {
    var btn = document.querySelector(".hamburger");
    var drawer = document.querySelector(".drawer");
    if (!btn || !drawer) return;
    var close = function () {
      btn.classList.remove("is-open");
      drawer.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
      drawer.setAttribute("aria-hidden", "true");
    };
    btn.addEventListener("click", function () {
      var open = !btn.classList.contains("is-open");
      btn.classList.toggle("is-open", open);
      drawer.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
      drawer.setAttribute("aria-hidden", String(!open));
    });
    drawer.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", close);
    });
    window.addEventListener("pageshow", close);
  }

  /* ---------- 4. Seekbar (scroll progress, teal) ---------- */
  function initSeekbar() {
    var bar = document.querySelector(".seekbar");
    if (!bar) return;
    var update = function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? (window.scrollY / max) * 100 : 0;
      bar.style.setProperty("--seek", p.toFixed(2) + "%");
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---------- 5. Hero showreel caption sync ---------- */
  function initHeroCaptions() {
    var video = document.querySelector(".hero__movie video");
    var info = document.querySelector(".hero__info");
    if (!video || !info) return;
    var caps = [];
    try { caps = JSON.parse(info.getAttribute("data-captions") || "[]"); } catch (e) { caps = []; }
    if (!caps.length) return;
    var numEl = info.querySelector(".hero__info-num");
    var titleEl = info.querySelector(".hero__info-title");
    var statusEl = info.querySelector(".hero__info-status");
    var listItems = document.querySelectorAll(".hero__list li");
    var SEG = 2.8; // clip length minus crossfade
    var current = -1;
    var tick = function () {
      var t = video.currentTime || 0;
      var idx = Math.min(caps.length - 1, Math.floor(t / SEG));
      if (idx !== current && caps[idx]) {
        current = idx;
        if (numEl) numEl.textContent = caps[idx].num;
        if (titleEl) titleEl.textContent = caps[idx].title;
        if (statusEl) statusEl.textContent = caps[idx].status;
        listItems.forEach(function (li, n) { li.classList.toggle("is-on", n === idx); });
      }
    };
    video.addEventListener("timeupdate", tick);
    // Autoplay guard: if blocked, keep poster and first caption
    if (!REDUCED_MOTION) {
      var p = video.play();
      if (p && p.catch) { p.catch(function () {}); }
    }
  }

  /* ---------- 5a. Page transition (black veil, anchor-style) ---------- */
  function initPageTransition() {
    var veil = document.createElement("div");
    veil.className = "page-veil";
    veil.setAttribute("aria-hidden", "true");
    document.body.appendChild(veil);
    var reset = function () { veil.classList.remove("is-in"); };
    window.addEventListener("pageshow", reset);
    document.addEventListener("click", function (e) {
      var a = e.target.closest ? e.target.closest("a") : null;
      if (!a) return;
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var href = a.getAttribute("href") || "";
      if (!href || href.charAt(0) === "#" || a.target === "_blank" || a.hasAttribute("download") || a.getAttribute("aria-disabled") === "true") return;
      if (/^(https?:|mailto:|tel:|javascript:)/.test(href)) return;
      e.preventDefault();
      veil.classList.add("is-in");
      setTimeout(function () { location.href = href; }, 360);
    });
  }

  /* ---------- 5b. Loop guard (recover stalled autoplay-loop videos) ---------- */
  function initVideoLoopGuard() {
    var videos = document.querySelectorAll("video[autoplay][loop]");
    if (!videos.length) return;
    var state = [];
    videos.forEach(function (v) { state.push({ v: v, t: -1, stall: 0 }); });
    setInterval(function () {
      state.forEach(function (s) {
        if (s.v.paused || s.v.readyState < 2) return;
        if (s.v.currentTime === s.t) {
          s.stall++;
          if (s.stall >= 2) {
            s.v.currentTime = 0.01;
            var p = s.v.play();
            if (p && p.catch) p.catch(function () {});
            s.stall = 0;
          }
        } else {
          s.stall = 0;
        }
        s.t = s.v.currentTime;
      });
    }, 1000);
  }

  /* ---------- 6. Horizontal rails (works / youtube) ---------- */
  function initRail(wrapSel, railSel) {
    document.querySelectorAll(wrapSel).forEach(function (wrap) {
      var rail = wrap.querySelector(railSel);
      if (!rail) return;
      var prev = wrap.querySelector(".slider-btn--prev");
      var next = wrap.querySelector(".slider-btn--next");
      var step = function () {
        var item = rail.firstElementChild;
        return item ? item.getBoundingClientRect().width + 26 : 300;
      };
      if (prev) prev.addEventListener("click", function () { rail.scrollBy({ left: -step(), behavior: "smooth" }); });
      if (next) next.addEventListener("click", function () { rail.scrollBy({ left: step(), behavior: "smooth" }); });
      // pointer drag
      var down = false, startX = 0, startLeft = 0, moved = false;
      rail.addEventListener("pointerdown", function (e) {
        if (e.pointerType !== "mouse") return;
        down = true; moved = false;
        startX = e.clientX; startLeft = rail.scrollLeft;
        rail.classList.add("is-drag");
      });
      window.addEventListener("pointermove", function (e) {
        if (!down) return;
        var dx = e.clientX - startX;
        if (Math.abs(dx) > 4) moved = true;
        rail.scrollLeft = startLeft - dx;
      });
      window.addEventListener("pointerup", function () {
        down = false;
        rail.classList.remove("is-drag");
      });
      rail.addEventListener("click", function (e) {
        if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
      }, true);
    });
  }

  /* ---------- 7. Modal (video / goods) ---------- */
  function initModal() {
    var modal = document.querySelector(".modal");
    if (!modal) return;
    var box = modal.querySelector(".modal__content");
    var lastFocus = null;
    var close = function () {
      modal.classList.remove("is-open");
      document.body.style.overflow = "";
      if (box) box.innerHTML = "";
      if (lastFocus) lastFocus.focus();
    };
    var open = function (html) {
      if (box) box.innerHTML = html;
      modal.classList.add("is-open");
      document.body.style.overflow = "hidden";
      var v = modal.querySelector("video");
      if (v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      var c = modal.querySelector(".modal__close");
      if (c) c.focus();
    };
    document.querySelectorAll("[data-modal-video]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        lastFocus = el;
        var title = el.getAttribute("data-title") || "";
        var meta = el.getAttribute("data-meta") || "";
        open(
          '<video src="' + el.getAttribute("data-modal-video") + '" controls muted playsinline loop></video>' +
          '<div class="modal__body"><p class="modal__title">' + title + '</p><p class="modal__meta">' + meta + "</p></div>"
        );
      });
    });
    document.querySelectorAll("[data-modal-img]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        lastFocus = el;
        var title = el.getAttribute("data-title") || "";
        var meta = el.getAttribute("data-meta") || "";
        open(
          '<img src="' + el.getAttribute("data-modal-img") + '" alt="' + title + '">' +
          '<div class="modal__body"><p class="modal__title">' + title + '</p><p class="modal__meta">' + meta + "</p></div>"
        );
      });
    });
    modal.querySelector(".modal__bg").addEventListener("click", close);
    modal.querySelector(".modal__close").addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal.classList.contains("is-open")) close();
    });
    window.addEventListener("pageshow", close);
  }

  /* ---------- 8. Smooth anchor ---------- */
  function initAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth" });
      });
    });
  }

  /* ---------- 8b. Placeholder links (href="#"): no jump to top ---------- */
  function initNoopLinks() {
    document.querySelectorAll('a[href="#"], a[data-noop]').forEach(function (a) {
      a.addEventListener("click", function (e) { e.preventDefault(); });
    });
  }

  /* ---------- 8c. Footer bg video: play only while visible ---------- */
  function initFooterVideoVisibility() {
    var v = document.querySelector(".footer__bg video");
    if (!v || REDUCED_MOTION) return;
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var p = v.play();
          if (p && p.catch) p.catch(function () {});
        } else {
          v.pause();
        }
      });
    }, { threshold: 0 });
    io.observe(v);
  }

  /* ---------- 9. Job accordion (recruit) ---------- */
  function initAccordion() {
    document.querySelectorAll(".job__head").forEach(function (head) {
      var body = head.nextElementSibling;
      if (!body) return;
      var toggle = function () {
        var open = head.getAttribute("aria-expanded") === "true";
        head.setAttribute("aria-expanded", String(!open));
        // open/close is CSS-driven: .job__head[aria-expanded="true"] + .job__body { grid-template-rows: 1fr; }
      };
      head.addEventListener("click", toggle);
      head.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
      });
    });
  }

  /* ---------- 10. News filter (news page) ---------- */
  function initNewsFilter() {
    var tabs = document.querySelectorAll(".news-tabs button");
    var rows = document.querySelectorAll("[data-news-list] .news-row");
    if (!tabs.length) return;
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) { t.classList.toggle("is-on", t === tab); });
        var f = tab.getAttribute("data-news-filter");
        rows.forEach(function (row) {
          row.style.display = (f === "all" || row.getAttribute("data-category") === f) ? "" : "none";
        });
      });
    });
  }

  /* ---------- 11. Works year-nav current highlight ---------- */
  function initYearNav() {
    var nav = document.querySelector(".year-nav");
    if (!nav) return;
    var links = nav.querySelectorAll("li");
    var groups = document.querySelectorAll(".wcat-group[id]");
    if (!groups.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var id = "#" + e.target.id;
          links.forEach(function (li) {
            var a = li.querySelector("a");
            li.classList.toggle("is-on", a && a.getAttribute("href") === id);
          });
        }
      });
    }, { rootMargin: "-40% 0px -50% 0px" });
    groups.forEach(function (g) { io.observe(g); });
  }

  /* ---------- 12. Contact form (pseudo submit) ---------- */
  function initForm() {
    var form = document.getElementById("contact-form");
    if (!form) return;
    var success = document.querySelector(".form-success");
    var confirmTbody = form.querySelector(".confirm-table tbody");
    var validate = function () {
      var ok = true;
      form.querySelectorAll("[required]").forEach(function (input) {
        var err = input.parentElement.querySelector(".form-error");
        var msg = "";
        if (!input.value.trim()) msg = "入力してください";
        else if (input.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) msg = "メールアドレスの形式が正しくありません";
        if (err) err.textContent = msg;
        if (msg) ok = false;
      });
      return ok;
    };
    form.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-action]");
      if (!btn) return;
      var action = btn.getAttribute("data-action");
      if (action === "confirm") {
        if (!validate()) return;
        if (confirmTbody) {
          confirmTbody.innerHTML = "";
          var fields = [
            ["お問い合わせ種別", (form.querySelector('input[name="type"]:checked') || {}).value || ""],
            ["会社名", form.company.value],
            ["お名前", form.name.value],
            ["メールアドレス", form.email.value],
            ["電話番号", form.tel.value],
            ["メッセージ", form.message.value]
          ];
          fields.forEach(function (f) {
            var tr = document.createElement("tr");
            var th = document.createElement("th");
            var td = document.createElement("td");
            th.textContent = f[0];
            td.textContent = f[1] || "—";
            tr.appendChild(th); tr.appendChild(td);
            confirmTbody.appendChild(tr);
          });
        }
        form.classList.add("is-confirm");
        form.scrollIntoView({ behavior: "smooth" });
      } else if (action === "back") {
        form.classList.remove("is-confirm");
      } else if (action === "submit") {
        // Demo site: no real transmission
        form.style.display = "none";
        if (success) success.style.display = "block";
        success.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }

  /* ---------- boot ---------- */
  function boot() {
    initReducedMotionVideos();
    initReveal();
    initHeader();
    initDrawer();
    initSeekbar();
    initHeroCaptions();
    initPageTransition();
    initVideoLoopGuard();
    initRail(".lineup__rail-wrap", ".lineup__rail");
    initRail(".yt-rail-wrap", ".yt-rail");
    initModal();
    initAnchors();
    initNoopLinks();
    initFooterVideoVisibility();
    initAccordion();
    initNewsFilter();
    initYearNav();
    initForm();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
