/* main.js — 90s Retro Workstation preloader, nav, theme, scroll-spy, reveals,
   magnetic buttons, Pikachu cursor with electric aura, spotlight, text-decode.
   Vanilla JS, no external dependencies. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ── 90s Retro Workstation Boot Preloader ──────────────────── */
  var preloader = $('#preloader');

  var CMD = 'cd /sys/devops && ./launch_workstation.sh';
  var LINES = [
    { text: '★ BIOS v9.84: Linux Workstation Initialised', ok: true },
    { text: '› Loading Cloud Neural Clusters (AWS & Azure)...', ok: false },
    { text: '✓ Kubernetes Control Plane connected [OK]', ok: true },
    { text: '› Syncing GitOps State with ArgoCD...', ok: false },
    { text: '✓ 0 Drift detected · Terraform modules locked', ok: true },
    { text: '★ City-Pop Audio Matrix: 120 BPM active', ok: true },
    { text: '✓ Welcome to Rohit Dakre\'s DevOps Deck! 🚀', ok: true },
  ];

  function runPreloader() {
    if (!preloader || reduce) { done(); return; }

    var cmdEl = $('#bootCmd', preloader);
    var caretEl = $('#bootCaret', preloader);
    var linesEl = $('#bootLines', preloader);
    var doneMs = 3400;

    /* type command */
    if (cmdEl) {
      var i = 0;
      var typeTimer = setInterval(function () {
        if (i < CMD.length) {
          cmdEl.textContent += CMD[i++];
        } else {
          clearInterval(typeTimer);
          if (caretEl) { caretEl.style.display = 'none'; }
          /* stream log lines after typing */
          streamLines(linesEl);
        }
      }, 42);
    }

    setTimeout(done, reduce ? 0 : doneMs);
  }

  function streamLines(linesEl) {
    if (!linesEl) return;
    LINES.forEach(function (item, i) {
      setTimeout(function () {
        var span = document.createElement('span');
        span.className = 'ln' + (item.ok ? ' ok' : ' dim');
        span.textContent = item.text;
        linesEl.appendChild(span);
      }, 140 + i * 260);
    });
  }

  function done() {
    if (preloader) preloader.classList.add('is-done');
    document.body.classList.remove('is-loading');
    runDecodes();
    initReveals();
  }

  runPreloader();

  /* ── Smooth scroll ──────────────────────────────────────────── */
  function scrollToEl(el) {
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }
  $$('a[href^="#"]').forEach(function (a) {
    var id = a.getAttribute('href');
    if (!id || id.length < 2) return;
    a.addEventListener('click', function (e) {
      var el = $(id);
      if (!el) return;
      e.preventDefault();
      closeMenu();
      scrollToEl(el);
      history.replaceState(null, '', id);
    });
  });

  /* ── Navigation ─────────────────────────────────────────────── */
  var header = $('#siteHeader');
  var nav = $('#nav');
  var toggle = $('#navToggle');

  function onScroll() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 24);
    if (nav) {
      var max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      nav.style.setProperty('--scroll', Math.min(1, window.scrollY / max).toFixed(4));
    }
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  function closeMenu() {
    if (nav) nav.classList.remove('is-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* scroll spy */
  var navLinks = $$('.nav__link');
  var spySects = navLinks.map(function (l) { return $(l.getAttribute('href')); }).filter(Boolean);
  if (spySects.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (l) {
          var active = l.getAttribute('href') === '#' + en.target.id;
          l.classList.toggle('is-active', active);
          if (active) l.setAttribute('aria-current', 'page');
          else l.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-42% 0px -52% 0px' });
    spySects.forEach(function (s) { spy.observe(s); });
  }

  /* ── Theme toggle ───────────────────────────────────────────── */
  var themeBtn = $('#themeToggle');
  var themeMeta = $('meta[name="theme-color"]');
  var animTimer = null;

  function applyTheme(t, persist) {
    document.documentElement.setAttribute('data-theme', t);
    if (persist) { try { localStorage.setItem('theme', t); } catch (e) { } }
    if (themeMeta) themeMeta.setAttribute('content', t === 'light' ? '#fcf8fa' : '#0a0d18');
    if (themeBtn) themeBtn.setAttribute('aria-label', t === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
  }

  var stored = null;
  try { stored = localStorage.getItem('theme'); } catch (e) { }
  if (stored !== 'light' && stored !== 'dark') stored = 'dark';
  applyTheme(stored, false);

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      if (!reduce) {
        document.documentElement.classList.add('theme-anim');
        clearTimeout(animTimer);
        animTimer = setTimeout(function () { document.documentElement.classList.remove('theme-anim'); }, 420);
      }
      applyTheme(next, true);
    });
  }

  /* ── Live clock (IST) ───────────────────────────────────────── */
  var clocks = $$('[data-clock]');
  if (clocks.length) {
    var fmt = null;
    try {
      fmt = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      });
    } catch (e) { }
    var tick = function () {
      var t = fmt ? fmt.format(new Date()) : new Date().toTimeString().slice(0, 8);
      clocks.forEach(function (c) { c.textContent = t; });
    };
    tick(); setInterval(tick, 1000);
  }

  /* ── Running Pikachu Cursor with Retro Aura ─────────────────── */
  if (finePointer && !reduce) {
    document.body.classList.add('has-cursor');
    var cursor = $('#cursor');
    var img = cursor && cursor.querySelector('.cursor__img');
    var lbl = cursor && cursor.querySelector('.cursor__label');

    if (cursor && img) {
      var cx = innerWidth / 2, cy = innerHeight / 2;
      var vis = false;

      document.addEventListener('pointermove', function (e) {
        cx = e.clientX; cy = e.clientY;
        if (!vis) { vis = true; cursor.classList.add('is-visible'); cursor.classList.remove('is-out'); }
        img.style.transform = 'translate(' + (cx - 6) + 'px,' + (cy - 38) + 'px)';
        if (lbl) lbl.style.transform = 'translate(' + (cx + 32) + 'px,' + (cy - 12) + 'px)';
      }, { passive: true });

      document.addEventListener('pointerleave', function () {
        cursor.classList.remove('is-visible'); cursor.classList.add('is-out'); vis = false;
      });

      document.addEventListener('pointerover', function (e) {
        var el = e.target.closest('a, button, [data-cursor]');
        if (!el) { cursor.classList.remove('cursor--link'); if (lbl) lbl.textContent = ''; return; }
        cursor.classList.add('cursor--link');
        if (lbl) lbl.textContent = el.dataset.cursor || '★ EXPLORE';
      });
    }
  }

  /* ── Magnetic buttons ───────────────────────────────────────── */
  if (finePointer && !reduce) {
    $$('.magnetic').forEach(function (el) {
      var str = 0.3, r = 80;
      el.addEventListener('pointermove', function (e) {
        var b = el.getBoundingClientRect();
        var mx = e.clientX - (b.left + b.width / 2);
        var my = e.clientY - (b.top + b.height / 2);
        var f = Math.max(0, 1 - Math.hypot(mx, my) / (r + b.width / 2));
        el.style.setProperty('--mx', (mx * str * f).toFixed(1) + 'px');
        el.style.setProperty('--my', (my * str * f).toFixed(1) + 'px');
      });
      el.addEventListener('pointerleave', function () {
        el.style.setProperty('--mx', '0px');
        el.style.setProperty('--my', '0px');
      });
    });

    /* Polaroid ID card tilt */
    var idcard = $('.idcard');
    if (idcard) {
      var inner = idcard.querySelector('.idcard__inner');
      idcard.addEventListener('pointermove', function (e) {
        var b = idcard.getBoundingClientRect();
        var x = (e.clientX - b.left) / b.width;
        var y = (e.clientY - b.top) / b.height;
        if (inner) {
          inner.style.setProperty('--ry', ((x - 0.5) * 10).toFixed(2) + 'deg');
          inner.style.setProperty('--rx', ((0.5 - y) * 10).toFixed(2) + 'deg');
        }
      }, { passive: true });
      idcard.addEventListener('pointerleave', function () {
        if (inner) { inner.style.setProperty('--rx', '0deg'); inner.style.setProperty('--ry', '0deg'); }
      });
    }

    /* City Pop Spotlight hover effect */
    $$('.idcard__inner, .principle, .spec, .kanban-card, .crow, .proj-card, .cred-card').forEach(function (el) {
      el.classList.add('has-spotlight');
      if (!el.querySelector(':scope > .spotlight')) {
        var s = document.createElement('span');
        s.className = 'spotlight';
        s.setAttribute('aria-hidden', 'true');
        el.appendChild(s);
      }
      el.addEventListener('pointermove', function (e) {
        var b = el.getBoundingClientRect();
        el.style.setProperty('--px', (((e.clientX - b.left) / b.width) * 100).toFixed(2) + '%');
        el.style.setProperty('--py', (((e.clientY - b.top) / b.height) * 100).toFixed(2) + '%');
      }, { passive: true });
    });
  }

  /* ── Retro Text decode scramble ─────────────────────────────── */
  var GLYPHS = '★☆◆◇▲△▶▷✦✧#</>{}+*~10';
  function decode(el, duration) {
    var final = el.getAttribute('data-decode') || el.textContent;
    var len = final.length;
    var t0 = null;
    duration = duration || 900;
    function frame(now) {
      if (t0 === null) t0 = now;
      var p = Math.min((now - t0) / duration, 1);
      var settled = Math.floor(p * len);
      var out = final.slice(0, settled);
      for (var i = settled; i < len; i++) {
        out += final[i] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = final;
    }
    requestAnimationFrame(frame);
  }

  function runDecodes() {
    if (reduce) return;
    $$('[data-decode]').forEach(function (el, i) {
      el.textContent = el.getAttribute('data-decode') || el.textContent;
      setTimeout(function () { decode(el, 800 + i * 140); }, i * 120);
    });
  }

  /* ── Scroll reveals ─────────────────────────────────────────── */
  function initReveals() {
    if (!('IntersectionObserver' in window)) {
      $$('.reveal').forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); obs.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    $$('.reveal').forEach(function (el) { obs.observe(el); });
  }

})();
