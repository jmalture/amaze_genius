/**
 * Shared behaviour for every page. Section-specific scripts live next to their section.
 * Everything degrades gracefully: without JS the content is fully visible and usable,
 * with prefers-reduced-motion the movement is dropped (see site.css).
 */

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

// 1. Scroll reveal: [data-reveal] gets .is-in once it enters the viewport. After the reveal has played the
//    attribute is removed, so the reveal transition no longer overrides the element's own transitions.
function initReveal() {
  const els = document.querySelectorAll<HTMLElement>('[data-reveal]');
  const done = (el: HTMLElement) => {
    el.removeAttribute('data-reveal');
    el.classList.remove('is-in');
  };
  if (!('IntersectionObserver' in window) || reduceMotion) {
    els.forEach(done);
    return;
  }
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target as HTMLElement;
        el.classList.add('is-in');
        io.unobserve(el);
        const i = Number(getComputedStyle(el).getPropertyValue('--i')) || 0;
        window.setTimeout(() => done(el), i * 90 + 1100);
      }),
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  els.forEach((el) => io.observe(el));
}

// 2. Header: glass once scrolled, hides on scroll down, returns on scroll up; drawer; nav ink + scroll spy.
function initHeader() {
  const hd = document.querySelector<HTMLElement>('[data-header]');
  if (!hd) return;
  let lastY = scrollY;
  let ticking = false;
  const update = () => {
    ticking = false;
    const y = scrollY;
    hd.classList.toggle('is-scrolled', y > 12);
    if (y > lastY + 4 && y > 520 && !hd.classList.contains('is-open')) hd.classList.add('is-hidden');
    else if (y < lastY - 4 || y < 520) hd.classList.remove('is-hidden');
    if (Math.abs(y - lastY) > 4) lastY = y;
  };
  addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  update();

  // Drawer (mobile / tablet)
  const burger = hd.querySelector<HTMLButtonElement>('[data-burger]');
  if (burger) {
    const set = (open: boolean) => {
      hd.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      document.documentElement.style.overflow = open ? 'hidden' : '';
    };
    burger.addEventListener('click', () => set(!hd.classList.contains('is-open')));
    hd.querySelectorAll('[data-drawer] a').forEach((a) => a.addEventListener('click', () => set(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && hd.classList.contains('is-open')) set(false);
    });
    matchMedia('(min-width: 1001px)').addEventListener('change', (e) => e.matches && set(false));
  }

  // Nav ink: slides to the hovered link, otherwise rests on the section in view.
  const list = hd.querySelector<HTMLElement>('[data-nav]');
  if (!list) return;
  const links = [...list.querySelectorAll<HTMLAnchorElement>('[data-nav-link]')];
  let current: HTMLAnchorElement | null = null;
  const inkTo = (a: HTMLAnchorElement | null) => {
    list.classList.toggle('has-ink', !!a);
    if (!a) return;
    list.style.setProperty('--ink-x', `${a.offsetLeft}px`);
    list.style.setProperty('--ink-w', `${a.offsetWidth}px`);
  };
  links.forEach((a) => a.addEventListener('pointerenter', () => inkTo(a)));
  list.addEventListener('pointerleave', () => inkTo(current));
  const sections = links.map((a) => document.getElementById(a.dataset.navLink!)).filter((s): s is HTMLElement => !!s);
  if (!sections.length) return;
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        current = links.find((a) => a.dataset.navLink === e.target.id) ?? null;
        links.forEach((a) => a.classList.toggle('is-current', a === current));
        if (!list.matches(':hover')) inkTo(current);
      });
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  sections.forEach((s) => spy.observe(s));
  // above the first tour section: no ink
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) {
      current = null;
      links.forEach((a) => a.classList.remove('is-current'));
      if (!list.matches(':hover')) inkTo(null);
    }
  }).observe(document.getElementById('start') ?? document.body);
}

// 3. Spotlight cards: [data-spotlight] passes the pointer position to each .ag-card as --mx/--my.
function initSpotlight() {
  if (!finePointer) return;
  document.querySelectorAll<HTMLElement>('[data-spotlight]').forEach((root) => {
    const cards = [...root.querySelectorAll<HTMLElement>('.ag-card')];
    root.addEventListener('pointermove', (e) => {
      cards.forEach((c) => {
        const r = c.getBoundingClientRect();
        c.style.setProperty('--mx', `${e.clientX - r.left}px`);
        c.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  });
}

// 4. Subtle 3D tilt for [data-tilt] (sets --rx/--ry from -1..1).
function initTilt() {
  if (reduceMotion || !finePointer) return;
  document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--rx', (((e.clientX - r.left) / r.width - 0.5) * 2).toFixed(3));
      el.style.setProperty('--ry', (((e.clientY - r.top) / r.height - 0.5) * 2).toFixed(3));
    });
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--rx', '0');
      el.style.setProperty('--ry', '0');
    });
  });
}

initReveal();
initHeader();
initSpotlight();
initTilt();
