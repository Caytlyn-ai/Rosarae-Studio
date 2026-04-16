/* ============================================================
   ROSARAE STUDIO — script.js
   Navigation, price calculator, forms, animations, toasts
   ============================================================ */

/* ── DATA ── */
const RIBBON_COLORS = [
  { n: 'White',         h: '#ffffff' },
  { n: 'Light Pink',    h: '#f8c8d4' },
  { n: 'Hot Pink',      h: '#ff69b4' },
  { n: 'Peach Pink',    h: '#ffb5a0' },
  { n: 'Rose Red',      h: '#c0392b' },
  { n: 'Rose Pink',     h: '#e8758a' },
  { n: 'Light Blue',    h: '#add8e6' },
  { n: 'Dusty Blue',    h: '#7b9eb8' },
  { n: 'Pale Blue',     h: '#cfe2f3' },
  { n: 'Smoky Blue',    h: '#6a8caf' },
  { n: 'Dark Blue',     h: '#1a3a5c' },
  { n: 'Navy Blue',     h: '#001f5b' },
  { n: 'Black',         h: '#222222' },
  { n: 'Pink',          h: '#ffb6c1' },
  { n: 'Red',           h: '#e53935' },
  { n: 'Green',         h: '#388e3c' },
  { n: 'Light Purple',  h: '#ce93d8' },
  { n: 'Yellow',        h: '#ffd54f' },
  { n: 'Royal Blue',    h: '#2962ff' },
  { n: 'Ivory',         h: '#f8f4e8' },
  { n: 'Purple',        h: '#7b1fa2' },
  { n: 'Dark Green',    h: '#1b5e20' },
  { n: 'Sky Blue',      h: '#87ceeb' },
  { n: 'Gold',          h: '#ffd700' },
  { n: 'Champagne Gold',h: '#f7e7ce' },
  { n: 'Wine Red',      h: '#722f37' },
];

const WRAP_COLORS = [
  { n: 'Black',      h: '#222222' },
  { n: 'Dark Grey',  h: '#555555' },
  { n: 'Light Grey', h: '#aaaaaa' },
  { n: 'Red',        h: '#c0392b' },
  { n: 'Green',      h: '#388e3c' },
  { n: 'Dusty Pink', h: '#d4a0a8' },
  { n: 'Lavender',   h: '#c9b8e8' },
  { n: 'Light Pink', h: '#f8c8d4' },
  { n: 'Cyan',       h: '#00bcd4' },
  { n: 'Beige',      h: '#e8d8c4' },
];

const TIER_RATES = { small: 2.50, medium: 2.75, large: 3.00 };

let currentTier = 'small';

/* ── HELPERS ── */
function fmt(n) {
  return '$' + n.toFixed(2);
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 4000);
}

/* ── MOBILE NAV TOGGLE ── */
function initNav() {
  const toggle = document.querySelector('.nav-toggle');
  const links  = document.querySelector('.nav-links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open);
  });

  // Close menu when a link is clicked
  links.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.classList.remove('open');
    });
  });

  // Highlight active page
  const page = window.location.pathname.split('/').pop() || 'index.html';
  links.querySelectorAll('a').forEach(a => {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });
}

/* ── BUILD COLOR GRIDS ── */
function buildColorGrid(containerId, colors, inputName) {
  const grid = document.getElementById(containerId);
  if (!grid) return;

  grid.innerHTML = colors.map(c => {
    const border = (c.h === '#ffffff' || c.h === '#f8f4e8') ? 'border:1px solid #ccc;' : '';
    return `<label class="color-opt">
      <input type="checkbox" name="${inputName}" value="${c.n}" onchange="calcOrder()">
      <span class="color-dot" style="background:${c.h};${border}"></span>
      ${c.n}
    </label>`;
  }).join('');
}

/* ── TIER TABS (order page) ── */
function setTier(t, el) {
  currentTier = t;

  document.querySelectorAll('.tier-tabs .tier-tab').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');

  ['small', 'medium', 'large'].forEach(s => {
    const sec = document.getElementById('oc-' + s);
    if (sec) sec.classList.toggle('active', s === t);
  });

  calcOrder();
}

/* ── SLIDER UPDATES ── */
function updR(pfx) {
  const el = document.getElementById(pfx + '-r');
  if (!el) return;
  const rv = document.getElementById(pfx + '-rv');
  if (rv) rv.textContent = el.value;
  calcOrder();
}

/* ── PRICE CALCULATOR (order page) ── */
function calcOrder() {
  const roseRow     = document.getElementById('op-rose-row');
  const addonRows   = document.getElementById('op-addon-rows');
  const totalEl     = document.getElementById('op-total');
  const extraNote   = document.getElementById('ribbon-extra-note');
  const bearSection = document.getElementById('bear-colors');
  const rushNote    = document.getElementById('rush-note');

  if (!roseRow || !totalEl) return;

  let roses = 5;
  const rate = TIER_RATES[currentTier] || 2.50;

  if (currentTier === 'small') {
    roses = parseInt(document.getElementById('sm-r')?.value || 5);
  } else if (currentTier === 'medium') {
    roses = parseInt(document.getElementById('md-r')?.value || 20);
  } else if (currentTier === 'large') {
    roses = parseInt(document.getElementById('lg-r')?.value || 75);
  }

  let base = roses * rate;
  roseRow.innerHTML = `<span>${roses} roses × ${fmt(rate)}</span><span>${fmt(base)}</span>`;

  let rows = '';
  let addl = 0;

  // Extra ribbon colors
  const checkedRibbons = document.querySelectorAll('#ribbon-grid input:checked').length;
  if (checkedRibbons > 3) {
    const extra = checkedRibbons - 3;
    const rc = extra * 2.50;
    rows += `<div class="price-row"><span>Extra ribbon colors (${extra})</span><span>+${fmt(rc)}</span></div>`;
    addl += rc;
    if (extraNote) {
      extraNote.textContent = `${extra} extra color${extra > 1 ? 's' : ''} — +${fmt(rc)}`;
      extraNote.style.display = 'block';
    }
  } else {
    if (extraNote) extraNote.style.display = 'none';
  }

  // Occasion ribbon
  const occVal = parseInt(document.getElementById('o-occ-ribbon')?.value || 0) || 0;
  if (occVal > 0) {
    rows += `<div class="price-row"><span>Occasion ribbon</span><span>+$${occVal}.00</span></div>`;
    addl += occVal;
  }

  // Mesh wrap
  if (document.getElementById('o-mesh')?.checked) {
    rows += `<div class="price-row"><span>Black mesh pearl wrap</span><span>+$8.00</span></div>`;
    addl += 8;
  }

  // Bear
  const bearCB = document.getElementById('o-bear');
  if (bearCB?.checked) {
    rows += `<div class="price-row"><span>Bear</span><span>+$10.00</span></div>`;
    addl += 10;
    if (bearSection) bearSection.style.display = 'block';
  } else {
    if (bearSection) bearSection.style.display = 'none';
  }

  // Diamond push pins
  if (document.getElementById('o-diamonds')?.checked) {
    rows += `<div class="price-row"><span>Diamond push pins</span><span>+$4.00</span></div>`;
    addl += 4;
  }

  // Rush order
  if (document.getElementById('o-rush')?.checked) {
    rows += `<div class="price-row"><span>Rush order</span><span>+$20.00</span></div>`;
    addl += 20;
    if (rushNote) rushNote.style.display = 'block';
  } else {
    if (rushNote) rushNote.style.display = 'none';
  }

  if (addonRows) addonRows.innerHTML = rows;
  totalEl.textContent = fmt(base + addl);
}

/* ── FORM SUBMISSION (contact/order) ── */
function submitOrderForm() {
  const name  = document.getElementById('o-name')?.value.trim();
  const email = document.getElementById('o-email')?.value.trim();

  if (!name || !email) {
    showToast('Please fill in your name and email first.');
    return;
  }

  // In production: replace this with a real form handler (Formspree, EmailJS, etc.)
  showToast('Order sent! I\'ll be in touch within 24 hours.');

  // Optional: clear fields
  document.querySelectorAll('.order-form input[type=text], .order-form input[type=email], .order-form textarea').forEach(el => {
    el.value = '';
  });
}

function submitContactForm() {
  const name    = document.getElementById('c-name')?.value.trim();
  const email   = document.getElementById('c-email')?.value.trim();
  const message = document.getElementById('c-message')?.value.trim();

  if (!name || !email || !message) {
    showToast('Please fill in all fields.');
    return;
  }

  showToast('Message sent! I\'ll get back to you soon.');
}

/* ── SCROLL ANIMATIONS ── */
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

/* ── SMOOTH SCROLL to anchor ── */
function scrollTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

/* ── RIBBON EXTRA COLOR NOTE ── */
function ribbonChk() {
  calcOrder();
}

/* ── INITIALISE on DOM ready ── */
document.addEventListener('DOMContentLoaded', () => {
  // Nav
  initNav();

  // Build color grids if on order page
  buildColorGrid('ribbon-grid', RIBBON_COLORS, 'ribbon');
  buildColorGrid('wrap-grid',   WRAP_COLORS,   'wrap');

  // Initial calc
  calcOrder();

  // Scroll animations
  initScrollAnimations();

  // CashApp link opens in new tab safely
  document.querySelectorAll('a[href*="cash.app"]').forEach(a => {
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
  });
});
