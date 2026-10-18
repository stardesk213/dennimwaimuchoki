(() => {
  'use strict';

  const doc = document;
  const root = doc.documentElement;
  const $ = (selector, ctx = doc) => ctx.querySelector(selector);
  const $$ = (selector, ctx = doc) => [...ctx.querySelectorAll(selector)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Footer year ---------- */
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------- Mobile navigation ---------- */
  const header = $('.site-header');
  const navToggle = $('#navToggle');
  const navMenu = $('#navMenu');
  const backdrop = $('.nav-backdrop');

  function setMenu(open) {
    if (!navToggle || !navMenu) return;
    navMenu.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    if (backdrop) backdrop.classList.toggle('show', open);
    if (header) header.classList.toggle('menu-open', open);
  }
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => setMenu(!navMenu.classList.contains('open')));
    $$('a', navMenu).forEach((link) => link.addEventListener('click', () => setMenu(false)));
    if (backdrop) backdrop.addEventListener('click', () => setMenu(false));
    doc.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMenu.classList.contains('open')) { setMenu(false); navToggle.focus(); }
    });
    window.matchMedia('(min-width: 801px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });
  }

  /* ---------- Scroll: header state, progress bar, back-to-top ---------- */
  const progress = $('.scroll-progress');
  const toTop = $('.to-top');
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      const max = root.scrollHeight - window.innerHeight;
      if (header) header.classList.toggle('is-scrolled', y > 24);
      if (progress) progress.style.setProperty('--progress', max > 0 ? Math.min(y / max, 1).toFixed(4) : '0');
      if (toTop) toTop.classList.toggle('is-visible', y > 700);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  /* ---------- Active section highlight in the nav ---------- */
  const navLinks = $$('#navMenu .nav-link[href^="#"]');
  const sections = navLinks.map((link) => $(link.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          const active = link.getAttribute('href') === `#${entry.target.id}`;
          if (active) link.setAttribute('aria-current', 'true'); else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((section) => spy.observe(section));
  }

  /* ---------- Scroll reveal ---------- */
  $$('[data-stagger]').forEach((parent) => {
    [...parent.children].forEach((child, i) => {
      if (!child.hasAttribute('data-reveal')) child.setAttribute('data-reveal', 'up');
      child.style.setProperty('--d', `${i * 90}ms`);
    });
  });
  const revealEls = $$('[data-reveal]');
  // Once an element has finished revealing, drop the attribute so its hover transitions take over.
  const settle = (el) => { el.removeAttribute('data-reveal'); el.style.removeProperty('--d'); };
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('is-visible');
        observer.unobserve(el);
        let done = false;
        const finish = () => { if (!done) { done = true; settle(el); } };
        el.addEventListener('transitionend', (e) => { if (e.propertyName === 'transform') finish(); }, { once: true });
        window.setTimeout(finish, 1600);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => { el.classList.add('is-visible'); settle(el); });
  }

  /* ---------- Hero: typing headline ---------- */
  const rotator = $('.rotator');
  if (rotator && !reduceMotion) {
    const words = (rotator.dataset.words || '').split('|').map((w) => w.trim()).filter(Boolean);
    if (words.length > 1) {
      let wordIndex = 0;
      let text = rotator.textContent;
      const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
      (async function loop() {
        await wait(2200);
        for (;;) {
          while (doc.hidden) await wait(500);
          while (text.length) { text = text.slice(0, -1); rotator.textContent = text; await wait(32); }
          wordIndex = (wordIndex + 1) % words.length;
          await wait(260);
          for (const ch of words[wordIndex]) { text += ch; rotator.textContent = text; await wait(70); }
          await wait(2400);
        }
      })();
    }
  }

  /* ---------- Hero card: gentle 3D tilt (mouse devices only) ---------- */
  const tiltEl = $('.tilt');
  if (tiltEl && finePointer && !reduceMotion) {
    tiltEl.addEventListener('pointermove', (e) => {
      const r = tiltEl.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      tiltEl.style.setProperty('--ry', `${(x * 10).toFixed(2)}deg`);
      tiltEl.style.setProperty('--rx', `${(-y * 8).toFixed(2)}deg`);
    });
    tiltEl.addEventListener('pointerleave', () => {
      tiltEl.style.setProperty('--rx', '0deg');
      tiltEl.style.setProperty('--ry', '0deg');
    });
  }

  /* ---------- Cursor spotlight on cards ---------- */
  if (finePointer && !reduceMotion) {
    $$('.spot').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  }

  /* ---------- Project tabs ---------- */
  const tabs = $$('.category-tab');
  const panels = { web: $('#panel-web'), software: $('#panel-software') };
  function selectView(view, moveFocus = false) {
    tabs.forEach((tab) => {
      const selected = tab.dataset.view === view;
      tab.classList.toggle('is-active', selected);
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && moveFocus) tab.focus();
    });
    Object.entries(panels).forEach(([name, panel]) => { if (panel) panel.hidden = name !== view; });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectView(tab.dataset.view));
    tab.addEventListener('keydown', (e) => {
      let next = index;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (index + 1) % tabs.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (index - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      else return;
      e.preventDefault();
      selectView(tabs[next].dataset.view, true);
    });
  });
  $$('[data-select-view]').forEach((link) => link.addEventListener('click', () => selectView(link.dataset.selectView)));

  /* ---------- Button click feedback ---------- */
  $$('.button, .category-tab').forEach((control) => {
    control.addEventListener('click', () => {
      control.classList.remove('is-clicked');
      requestAnimationFrame(() => control.classList.add('is-clicked'));
      window.setTimeout(() => control.classList.remove('is-clicked'), 600);
    });
  });

  /* ---------- Screenshot lightbox ---------- */
  const lightbox = $('#lightbox');
  if (lightbox && typeof lightbox.showModal === 'function') {
    const lbImg = $('#lbImg');
    const lbCap = $('#lbCap');
    let group = [];
    let index = 0;

    const show = (i) => {
      index = (i + group.length) % group.length;
      const btn = group[index];
      lbImg.src = btn.dataset.full;
      lbImg.alt = btn.dataset.alt || '';
      lbCap.textContent = `${btn.dataset.caption || ''}  ·  ${index + 1} / ${group.length}`;
    };
    $$('.shot').forEach((btn) => btn.addEventListener('click', () => {
      group = $$(`.shot[data-gallery="${btn.dataset.gallery}"]`);
      show(group.indexOf(btn));
      doc.body.classList.add('lock');
      lightbox.showModal();
    }));
    $('.lb-prev', lightbox).addEventListener('click', () => show(index - 1));
    $('.lb-next', lightbox).addEventListener('click', () => show(index + 1));
    $('.lb-close', lightbox).addEventListener('click', () => lightbox.close());
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.close(); });
    lightbox.addEventListener('close', () => { doc.body.classList.remove('lock'); lbImg.removeAttribute('src'); });
    lightbox.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') show(index - 1);
      if (e.key === 'ArrowRight') show(index + 1);
    });
  }

  /* ---------- Copy email ---------- */
  const toast = $('.toast');
  let toastTimer;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2200);
  }
  $$('[data-copy]').forEach((btn) => btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      showToast('Email address copied');
    } catch (err) {
      showToast('Copy not available — please select the address manually');
    }
  }));
})();
