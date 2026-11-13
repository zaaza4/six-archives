/* ==========================================================================
   SIX ARCHIVES — main.js (vanilla, no dependencies)
   Modules: helpers · counts · torn edges · gallery · viewer · random ·
            timeline pins · soundtrack · reveal & scroll · nav · cursor · secrets
   ========================================================================== */
(() => {
  'use strict';

  /* ---------- helpers ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const pad = (n) => String(n).padStart(2, '0');
  const wait = (ms) => new Promise((res) => setTimeout(res, ms));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const store = window.SIX_ARCHIVES || {};

  const cards = $$('.memory-card');
  const grid = $('#memory-grid');

  /* ---------- toast ---------- */
  const toast = $('#toast');
  let toastTimer;
  function say(message) {
    toast.textContent = message;
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-on'), 3600);
  }

  /* ---------- counters (archive counter + per-category) ---------- */
  function updateStaticCounts() {
    const total = cards.length;
    $$('[data-count="total"]').forEach((el) => (el.textContent = pad(total)));
    $$('[data-filter-count]').forEach((el) => {
      const key = el.dataset.filterCount;
      el.textContent = pad(key === 'all' ? total : cards.filter((c) => c.dataset.category === key).length);
    });
    cards.forEach((card, i) => {
      const num = $('.card-number', card);
      if (num) num.textContent = `${pad(i + 1)} / ${pad(total)}`;
      card.setAttribute('aria-haspopup', 'dialog');
      card.setAttribute('aria-label', `Open memory: ${card.dataset.title}, ${card.dataset.date}`);
      // film-style date stamp in the corner of each photo, e.g. '23 09 12
      const m = /(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/.exec(card.dataset.date || '');
      const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
      const image = $('.card-image', card);
      if (m && image) {
        const mi = months.indexOf(m[2].slice(0, 3).toLowerCase()) + 1;
        if (mi) image.dataset.stamp = `'${m[3].slice(2)} ${pad(mi)} ${pad(+m[1])}`;
      }
    });
  }

  /* ---------- torn paper edges ---------- */
  function seeded(seed) {
    let t = seed + 0x6D2B79F5;
    return () => {
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function tornPolygon(mode, seed) {
    const rand = seeded(seed);
    const steps = 46;
    const top = [];
    const bottom = [];
    for (let i = 0; i <= steps; i++) {
      const x = ((i / steps) * 100).toFixed(2) + '%';
      top.push(`${x} ${(rand() * 9 + 1).toFixed(1)}px`);
      bottom.unshift(`${x} calc(100% - ${(rand() * 7 + 1).toFixed(1)}px)`);
    }
    const hasTop = mode === 'top' || mode === 'all' || mode === 'both';
    const hasBottom = mode === 'bottom' || mode === 'all' || mode === 'both';
    const pts = [
      ...(hasTop ? top : ['0 0', '100% 0']),
      ...(hasBottom ? bottom : ['100% 100%', '0 100%'])
    ];
    return `polygon(${pts.join(',')})`;
  }
  $$('[data-torn]').forEach((el, i) => el.style.setProperty('--torn', tornPolygon(el.dataset.torn, 11 + i * 17)));

  /* ---------- gallery layout + filters (FLIP) ---------- */
  const visibleCards = () => cards.filter((c) => !c.hidden);
  function assignSlots() {
    visibleCards().forEach((card, i) => (card.dataset.slot = String(i % 6)));
  }
  const visibleCount = $('#visible-count');
  const filterButtons = $$('.filter-btn');
  let filtering = false;

  async function applyFilter(filter) {
    if (filtering) return;
    filtering = true;
    filterButtons.forEach((b) => {
      const on = b.dataset.filter === filter;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    const willShow = (c) => filter === 'all' || c.dataset.category === filter;
    const animate = !reduceMotion.matches;

    // 1. leaving cards fade away
    if (animate) {
      await Promise.all(visibleCards().filter((c) => !willShow(c)).map((c) =>
        c.animate([{ opacity: 1 }, { opacity: 0, transform: 'scale(.9) translateY(12px)' }], { duration: 220, easing: 'ease-in', fill: 'forwards' }).finished));
    }
    // 2. measure, re-layout, play (First-Last-Invert-Play)
    const first = new Map(visibleCards().map((c) => [c, c.getBoundingClientRect()]));
    cards.forEach((c) => {
      c.getAnimations().forEach((a) => a.cancel());
      c.hidden = !willShow(c);
      if (!c.hidden) c.classList.add('is-visible');
    });
    assignSlots();
    visibleCount.textContent = pad(visibleCards().length);
    if (animate) {
      visibleCards().forEach((c, i) => {
        const was = first.get(c);
        const now = c.getBoundingClientRect();
        if (was) {
          const dx = was.left - now.left; const dy = was.top - now.top;
          if (dx || dy) c.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 700, easing: 'cubic-bezier(.22,.8,.24,1)' });
        } else {
          c.animate([{ opacity: 0, transform: 'translateY(30px) scale(.92)' }, { opacity: 1, transform: 'none' }], { duration: 600, delay: i * 60, easing: 'cubic-bezier(.22,.8,.24,1)', fill: 'backwards' });
        }
      });
    }
    filtering = false;
  }
  filterButtons.forEach((b) => b.addEventListener('click', () => applyFilter(b.dataset.filter)));

  /* ---------- memory viewer ---------- */
  const dialog = $('#memory-dialog');
  const viewerInner = $('#viewer-inner');
  const el = {
    image: $('#viewer-image'), note: $('#viewer-note'), polaroid: $('#viewer-polaroid'),
    count: $('#viewer-count'), title: $('#dialog-title'), date: $('#dialog-date'),
    location: $('#dialog-location'), story: $('#dialog-story'), song: $('#dialog-song')
  };
  let list = [];
  let index = 0;
  let lastFocus = null;

  function songsFor(title) {
    return (store.soundtrack || []).filter((s) => s.memory && s.memory.trim().toLowerCase() === title.trim().toLowerCase());
  }

  function renderViewer(direction) {
    const card = list[index];
    const d = card.dataset;
    el.title.textContent = d.title;
    el.date.textContent = d.date;
    el.story.textContent = d.story;
    el.note.textContent = d.note || '';
    el.count.textContent = `${pad(cards.indexOf(card) + 1)} / ${pad(cards.length)}`;
    el.location.hidden = !d.location;
    el.location.textContent = d.location ? `⌖ ${d.location}` : '';
    el.polaroid.style.setProperty('--vr', `${index % 2 ? 2.5 : -3}deg`);

    // photo: real <img> if the card has one, otherwise the same placeholder
    const source = $('.card-image', card);
    const img = $('img', source);
    el.image.className = 'viewer-image ' + [...source.classList].filter((c) => c.startsWith('image-')).join(' ');
    el.image.dataset.stamp = source.dataset.stamp || '';
    el.image.replaceChildren();
    if (img) {
      const big = document.createElement('img');
      big.src = d.full || img.currentSrc || img.src;
      big.alt = img.alt || d.title;
      big.decoding = 'async';
      el.image.append(big);
    } else {
      const ph = $('.ph', source);
      const span = document.createElement('span');
      span.innerHTML = ph ? ph.innerHTML : '';
      el.image.append(span);
    }

    // soundtrack connection
    const songs = songsFor(d.title);
    el.song.hidden = !songs.length;
    el.song.replaceChildren();
    if (songs.length) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = `♪ playing in this memory: ${songs[0].title} →`;
      btn.addEventListener('click', () => {
        closeViewer().then(() => $(`[data-track="${songs[0].id}"]`)?.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'center' }));
      });
      el.song.append(btn);
    }

    viewerInner.classList.remove('swap-next', 'swap-prev', 'is-first');
    if (direction) {
      void viewerInner.offsetWidth; // restart animation
      viewerInner.classList.add(direction > 0 ? 'swap-next' : 'swap-prev');
    } else {
      viewerInner.classList.add('is-first');
    }
    viewerInner.scrollTop = 0;
  }

  function openMemory(card) {
    lastFocus = document.activeElement;
    list = card.hidden ? cards.slice() : visibleCards();
    index = Math.max(0, list.indexOf(card));
    renderViewer(0);
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('is-locked');
  }

  function step(dir) {
    if (list.length < 2) return;
    index = (index + dir + list.length) % list.length;
    renderViewer(dir);
  }

  function closeViewer() {
    return new Promise((resolve) => {
      if (!dialog.open || dialog.classList.contains('is-closing')) return resolve();
      const finish = () => {
        dialog.classList.remove('is-closing');
        dialog.close();
        resolve();
      };
      if (reduceMotion.matches) return finish();
      dialog.classList.add('is-closing');
      let done = false;
      const once = () => { if (!done) { done = true; finish(); } };
      dialog.addEventListener('animationend', once, { once: true });
      setTimeout(once, 500); // safety net
    });
  }

  dialog.addEventListener('close', () => {
    document.body.classList.remove('is-locked');
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  });
  dialog.addEventListener('cancel', (e) => { e.preventDefault(); closeViewer(); }); // Escape
  dialog.addEventListener('click', (e) => { if (e.target === dialog) closeViewer(); });
  $('#dialog-close').addEventListener('click', closeViewer);
  $('#viewer-prev').addEventListener('click', () => step(-1));
  $('#viewer-next').addEventListener('click', () => step(1));
  document.addEventListener('keydown', (e) => {
    if (!dialog.open) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  });
  // swipe on touch screens
  let startX = null;
  viewerInner.addEventListener('pointerdown', (e) => { startX = e.pointerType === 'touch' ? e.clientX : null; });
  viewerInner.addEventListener('pointerup', (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 70) step(dx < 0 ? 1 : -1);
    startX = null;
  });
  cards.forEach((card) => card.addEventListener('click', () => openMemory(card)));

  /* ---------- random memory ---------- */
  let lastRandom = null;
  let shuffling = false;
  async function pickRandom() {
    if (shuffling) return;
    const pool = visibleCards();
    if (!pool.length) return;
    shuffling = true;
    const buttons = $$('[data-random]');
    buttons.forEach((b) => (b.disabled = true));
    let pick;
    do { pick = pool[Math.floor(Math.random() * pool.length)]; } while (pool.length > 1 && pick === lastRandom);
    lastRandom = pick;

    if (!reduceMotion.matches) {
      pick.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await wait(550);
      // flick through cards like riffling pages, landing on the pick
      const order = [];
      for (let i = 0; i < 7; i++) order.push(pool[Math.floor(Math.random() * pool.length)]);
      order.push(pick);
      for (const c of order) {
        c.classList.add('is-shuffling');
        await wait(110);
        c.classList.remove('is-shuffling');
      }
      pick.classList.add('is-picked');
      await wait(650);
      pick.classList.remove('is-picked');
    }
    openMemory(pick);
    buttons.forEach((b) => (b.disabled = false));
    shuffling = false;
  }
  $$('[data-random]').forEach((b) => b.addEventListener('click', pickRandom));

  /* ---------- timeline: pin real memories to their year ---------- */
  function buildPins() {
    $$('.timeline-item').forEach((item) => {
      const year = item.dataset.year;
      const holder = $('[data-pins]', item);
      cards.filter((c) => (c.dataset.date || '').includes(year)).forEach((card) => {
        const pin = document.createElement('button');
        pin.type = 'button';
        pin.className = 'pin';
        pin.setAttribute('aria-label', `Open memory: ${card.dataset.title}`);
        const src = $('.card-image', card);
        const thumb = document.createElement('span');
        thumb.className = 'pin-img ' + [...src.classList].filter((c) => c.startsWith('image-')).join(' ');
        const img = $('img', src);
        if (img) {
          const t = document.createElement('img');
          t.src = img.currentSrc || img.src; t.alt = ''; t.loading = 'lazy'; t.decoding = 'async';
          thumb.append(t);
        }
        const label = document.createElement('span');
        label.className = 'pin-label';
        label.textContent = card.dataset.title;
        pin.append(thumb, label);
        pin.addEventListener('click', () => openMemory(card));
        holder.append(pin);
      });
    });
  }

  /* ---------- soundtrack ---------- */
  function spotifyEmbed(url) {
    if (!url) return null;
    const m = /(?:open\.spotify\.com\/(?:intl-[a-z-]+\/)?|spotify:)(track|album|playlist|episode|show|artist)[/:]([A-Za-z0-9]+)/.exec(url);
    if (!m) return null;
    const tall = m[1] === 'playlist' || m[1] === 'album' || m[1] === 'show' || m[1] === 'artist';
    return { src: `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator`, height: tall ? 352 : 152, link: `https://open.spotify.com/${m[1]}/${m[2]}` };
  }

  function buildSoundtrack() {
    const shelf = $('#tape-shelf');
    const tracks = store.soundtrack || [];
    $$('[data-count="tapes"]').forEach((n) => (n.textContent = pad(tracks.length)));
    tracks.forEach((t, i) => {
      const embed = spotifyEmbed(t.spotify);
      const memCard = t.memory ? cards.find((c) => c.dataset.title.toLowerCase() === t.memory.trim().toLowerCase()) : null;
      const article = document.createElement('article');
      article.className = 'track reveal';
      article.dataset.track = t.id;
      article.innerHTML = `
        <div class="cassette cassette--${t.color || 'rust'}" aria-hidden="true">
          <div class="cassette-label">
            <div class="cassette-top"><span>SIDE ${t.side || 'A'}</span><span>TRK ${pad(i + 1)}</span></div>
            <p class="cassette-title"></p>
          </div>
          <div class="cassette-window"><span class="reel"></span><span class="reel"></span></div>
          <span class="cassette-side">${t.id || ''}</span>
        </div>
        <div class="track-note">
          <span class="tape" aria-hidden="true"></span>
          <p class="track-id">ARCHIVE NO. ${t.id || pad(i + 1)} · SIDE ${t.side || 'A'}</p>
          <h3></h3>
          <p class="track-artist"></p>
          <p class="track-text"></p>
          <div class="track-links"></div>
          <div class="track-player"></div>
        </div>`;
      $('.cassette-title', article).textContent = t.title;
      $('h3', article).textContent = t.title;
      $('.track-artist', article).textContent = t.artist || '';
      $('.track-text', article).textContent = t.note || '';
      const links = $('.track-links', article);
      if (memCard) {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'track-memory';
        b.textContent = `♪ FROM THE MEMORY: ${memCard.dataset.title.toUpperCase()} →`;
        b.addEventListener('click', () => openMemory(memCard));
        links.append(b);
      }
      if (t.scribble) {
        const s = document.createElement('span');
        s.className = 'track-scribble'; s.textContent = t.scribble;
        links.append(s);
      }
      if (!links.children.length) links.remove();
      const player = $('.track-player', article);
      if (embed) {
        // The Spotify iframe is heavy, so it only loads when asked for.
        const load = document.createElement('button');
        load.type = 'button';
        load.className = 'track-load';
        load.innerHTML = '<b aria-hidden="true">▶</b><span>INSERT TAPE &amp; PLAY<small>loads the Spotify player</small></span>';
        load.setAttribute('aria-label', `Load Spotify player for ${t.title}`);
        load.addEventListener('click', () => {
          const frame = document.createElement('iframe');
          frame.src = embed.src;
          frame.height = embed.height;
          frame.title = `Spotify player: ${t.title}`;
          frame.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
          load.replaceWith(frame);
          frame.focus();
        });
        player.append(load);
      } else {
        player.className = 'track-empty';
        player.innerHTML = 'TAPE NOT INSERTED YET<br>paste a Spotify link in <code>assets/js/data.js</code>';
      }
      shelf.append(article);
    });
    // reels spin while a Spotify frame has focus (i.e. after you press play)
    window.addEventListener('blur', () => setTimeout(() => {
      const active = document.activeElement;
      $$('.track').forEach((tr) => tr.classList.toggle('is-playing', !!active && active.tagName === 'IFRAME' && tr.contains(active)));
    }, 0));
    window.addEventListener('focus', () => $$('.track.is-playing').forEach((tr) => tr.classList.remove('is-playing')));
  }

  /* ---------- reveal on scroll ---------- */
  function initReveal() {
    const items = $$('.reveal');
    // stagger siblings that sit in the same parent
    const groups = new Map();
    items.forEach((item) => {
      const n = groups.get(item.parentElement) || 0;
      item.style.setProperty('--d', `${Math.min(n, 5) * 90}ms`);
      groups.set(item.parentElement, n + 1);
    });
    if (!('IntersectionObserver' in window)) { items.forEach((i) => i.classList.add('is-visible')); return; }
    // Elements that are fully clipped before they reveal (the letter) report zero
    // intersection, so their parent is observed instead.
    const watched = new Map();
    items.forEach((item) => {
      const target = item.classList.contains('notes-sheet') ? item.parentElement : item;
      watched.set(target, [...(watched.get(target) || []), item]);
    });
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        const isLetterWrap = entry.target.classList.contains('notes-section');
        if (!entry.isIntersecting) return;
        if (isLetterWrap && entry.intersectionRatio < 0.3) return;
        watched.get(entry.target).forEach((item) => item.classList.add('is-visible'));
        obs.unobserve(entry.target);
      });
    }, { threshold: [0.12, 0.3, 0.5], rootMargin: '0px 0px -6% 0px' });
    watched.forEach((_, target) => io.observe(target));
  }

  /* ---------- nav: active section, mobile menu, header ---------- */
  const topbar = $('#topbar');
  const menuToggle = $('#menu-toggle');
  const mainNav = $('#main-nav');
  function closeMenu() { mainNav.classList.remove('open'); menuToggle.setAttribute('aria-expanded', 'false'); }
  menuToggle.addEventListener('click', () => {
    const open = mainNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
  });
  $$('a', mainNav).forEach((a) => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && mainNav.classList.contains('open')) { closeMenu(); menuToggle.focus(); } });
  document.addEventListener('click', (e) => { if (!topbar.contains(e.target)) closeMenu(); });

  function initActiveNav() {
    const links = new Map($$('a', mainNav).map((a) => [a.getAttribute('href').slice(1), a]));
    const targets = [...links.keys()].map((id) => document.getElementById(id)).filter(Boolean);
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a, id) => {
          const on = id === entry.target.id;
          a.classList.toggle('is-active', on);
          if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    targets.forEach((t) => io.observe(t));
  }

  /* ---------- scroll effects: parallax, timeline progress, back-to-top ---------- */
  function initScroll() {
    const hero = $('#home');
    const collage = $('.hero-collage');
    const timeline = $('#timeline-list');
    const toTop = $('#to-top');
    let ticking = false;
    let heroOn = true;
    let timelineOn = false;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((e) => { heroOn = e[0].isIntersecting; hero.classList.toggle('is-off', !heroOn); }).observe(hero);
      new IntersectionObserver((e) => { timelineOn = e[0].isIntersecting; if (timelineOn) frame(); }, { rootMargin: '200px 0px' }).observe(timeline);
    }
    function frame() {
      ticking = false;
      const y = window.scrollY;
      topbar.classList.toggle('is-scrolled', y > 8);
      const showTop = y > 700;
      toTop.hidden = false;
      toTop.classList.toggle('is-on', showTop);
      toTop.tabIndex = showTop ? 0 : -1;
      toTop.setAttribute('aria-hidden', String(!showTop));
      if (!reduceMotion.matches) {
        if (heroOn) collage.style.setProperty('--scroll-y', String(y));
        if (timelineOn) {
          const r = timeline.getBoundingClientRect();
          const progress = Math.min(1, Math.max(0, (window.innerHeight * 0.65 - r.top) / r.height));
          timeline.style.setProperty('--progress', progress.toFixed(3));
        }
      } else {
        timeline.style.setProperty('--progress', '1');
      }
    }
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
    window.addEventListener('resize', frame);
    toTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      $('#home').setAttribute('tabindex', '-1');
      $('#home').focus({ preventScroll: true });
    });
    frame();
  }

  /* ---------- custom cursor (desktop, fine pointer only) ---------- */
  function initCursor() {
    if (!finePointer.matches || reduceMotion.matches) return;
    const ring = document.createElement('div');
    const dot = document.createElement('div');
    ring.className = 'cursor'; dot.className = 'cursor-dot';
    ring.setAttribute('aria-hidden', 'true'); dot.setAttribute('aria-hidden', 'true');
    document.body.append(ring, dot);
    let x = 0, y = 0, rx = 0, ry = 0, raf = null;
    const loop = () => {
      rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      raf = Math.abs(x - rx) + Math.abs(y - ry) > 0.1 ? requestAnimationFrame(loop) : null;
    };
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      x = e.clientX; y = e.clientY;
      dot.style.transform = `translate(${x}px, ${y}px)`;
      ring.classList.add('is-on'); dot.classList.add('is-on');
      ring.classList.toggle('is-link', !!e.target.closest('a, button, iframe, [tabindex]'));
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    document.addEventListener('pointerleave', () => { ring.classList.remove('is-on'); dot.classList.remove('is-on'); });
  }

  /* ---------- secrets ---------- */
  function initSecrets() {
    const messages = {
      star: '✳ a tiny star, tucked in for luck.',
      tape: 'oops. that tape was holding more than it looked.',
      care: 'fragile: contains laughter.',
      reg: '® registered to no one, belonging to everyone who was there.',
      ps: 'P.S. found. there are still blank pages.'
    };
    const found = new Set();
    const total = Object.keys(messages).length;
    const counter = $('#secret-count');
    $$('[data-secret]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.secret;
        btn.classList.remove('is-found');
        void btn.offsetWidth;
        btn.classList.add('is-found');
        if (key === 'tape') btn.classList.add('is-peeled');
        if (key === 'ps') {
          const ps = $('#note-ps');
          ps.hidden = false;
          btn.setAttribute('aria-expanded', 'true');
        }
        say(messages[key]);
        found.add(key);
        counter.hidden = false;
        counter.textContent = `SECRETS FOUND ${found.size} / ${total}`;
        if (found.size === total) setTimeout(() => say('all of them. you really did keep everything.'), 3900);
      });
    });
  }

  /* ---------- init ---------- */
  updateStaticCounts();
  assignSlots();
  buildPins();
  buildSoundtrack();
  initReveal();
  initActiveNav();
  initScroll();
  initCursor();
  initSecrets();
})();
