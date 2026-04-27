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

const TIER_RATES = { small: 2.00, medium: 2.00, large: 2.00 };
const TIER_CONFIG = {
  small: { min: 1, max: 9, value: 5, note: 'Small bouquets range from 1 to 9 roses.' },
  medium: { min: 10, max: 40, value: 20, note: 'Medium bouquets range from 10 to 40 roses.' },
  large: { min: 50, max: 100, value: 75, note: 'Large bouquets range from 50 to 100 roses.' },
};

let currentTier = 'small';

const SHOP_SIZES = [
  { id: 'small', label: 'Small (5 roses)', roses: 5, price: 10 },
  { id: 'medium', label: 'Medium (10 roses)', roses: 10, price: 20 },
  { id: 'large', label: 'Large (20 roses)', roses: 20, price: 40 },
];

const SHOP_EXTRAS = [
  { id: 'bear', label: 'Plush Keychain Bear', price: 7 },
  { id: 'diamonds', label: 'Diamond push pins', price: 2 },
];

const BEAR_COLORS = [
  { n: 'Pink', h: '#f4b8c8' },
  { n: 'Blue / White', h: '#b8d4f0' },
  { n: 'Cream', h: '#f5ecd7' },
  { n: 'Brown', h: '#a07850' },
];

const LOCAL_DELIVERY_PRICE = 8;

/* ── HELPERS ── */
function fmt(n) {
  return '$' + n.toFixed(2);
}

function encode(data) {
  return Object.keys(data)
    .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
    .join('&');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 4000);
}

function getSelectedValues(selector) {
  return Array.from(document.querySelectorAll(selector))
    .filter((input) => input.checked)
    .map((input) => input.value);
}

function savePaymentSummary(summary) {
  try {
    sessionStorage.setItem('rosarae-payment-summary', JSON.stringify(summary));
  } catch (error) {
    // Ignore storage issues and fall back to a plain redirect.
  }
}

function savePendingOrder(orderData) {
  try {
    sessionStorage.setItem('rosarae-pending-order', JSON.stringify(orderData));
  } catch (error) {
    // Ignore storage issues and fall back to payment summary only.
  }
}

function clearPendingOrder() {
  try {
    sessionStorage.removeItem('rosarae-pending-order');
  } catch (error) {
    // Ignore storage issues.
  }
}

function setCashAppOpened(opened) {
  try {
    sessionStorage.setItem('rosarae-cashapp-opened', opened ? 'true' : 'false');
  } catch (error) {
    // Ignore storage issues.
  }
}

function getStoredJson(key) {
  try {
    return JSON.parse(sessionStorage.getItem(key) || 'null');
  } catch (error) {
    return null;
  }
}

function resetCustomOrderForm(form) {
  if (!form) return;
  form.reset();
  currentTier = 'small';
  document.querySelectorAll('.tier-tabs .tier-tab').forEach((button, index) => {
    button.classList.toggle('active', index === 0);
  });
  syncOrderRangeToTier(currentTier);
  calcOrder();
}

function parseMoneyString(value) {
  return Number(String(value || '0').replace(/[^0-9.]/g, '')) || 0;
}

function setStripeSubmittedSession(sessionId) {
  try {
    sessionStorage.setItem('rosarae-stripe-submitted-session', sessionId || '');
  } catch (error) {
    // Ignore storage issues.
  }
}

function getStripeSubmittedSession() {
  try {
    return sessionStorage.getItem('rosarae-stripe-submitted-session') || '';
  } catch (error) {
    return '';
  }
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

function buildWrapGrid() {
  const grid = document.getElementById('wrap-grid');
  if (!grid) return;

  grid.innerHTML = WRAP_COLORS.map((c) => {
    const border = (c.h === '#ffffff' || c.h === '#f8f4e8') ? 'border:1px solid #ccc;' : '';
    return `<label class="color-opt wrap-opt">
      <input type="checkbox" name="wrap" value="${c.n}" onchange="handleWrapSelection(this)">
      <span class="color-dot" style="background:${c.h};${border}"></span>
      <span>${c.n}</span>
    </label>`;
  }).join('');
}

function handleWrapSelection(input) {
  const selected = document.querySelectorAll('#wrap-grid input:checked');
  if (selected.length > 2) {
    input.checked = false;
    showToast('You can choose up to 2 floral wraps.');
  }
  calcOrder();
}

/* ── TIER TABS (order page) ── */
function setTier(t, el) {
  currentTier = t;

  document.querySelectorAll('.tier-tabs .tier-tab').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  syncOrderRangeToTier(t);

  calcOrder();
}

/* ── SLIDER UPDATES ── */
function updR() {
  const el = document.getElementById('order-rose-range');
  if (!el) return;
  const rv = document.getElementById('order-rose-value');
  if (rv) rv.textContent = el.value;
  syncRushAvailability();
  calcOrder();
}

function syncOrderRangeToTier(tier) {
  const el = document.getElementById('order-rose-range');
  const rv = document.getElementById('order-rose-value');
  const note = document.getElementById('order-rose-note');
  if (!el) return;

  const cfg = TIER_CONFIG[tier] || TIER_CONFIG.small;
  el.min = cfg.min;
  el.max = cfg.max;
  el.value = cfg.value;

  if (rv) rv.textContent = cfg.value;
  if (note) note.textContent = cfg.note;
  syncRushAvailability();
}

function syncRushAvailability() {
  const rushOption = document.getElementById('rush-order-option');
  const rushInput = document.getElementById('o-rush');
  const rushNote = document.getElementById('rush-note');
  const roseCount = parseInt(document.getElementById('order-rose-range')?.value || '0', 10);
  const showRush = roseCount > 50;

  if (!rushOption || !rushInput) return;

  rushOption.classList.toggle('hidden', !showRush);
  if (!showRush) {
    rushInput.checked = false;
    if (rushNote) rushNote.style.display = 'none';
  }
}

/* ── PRICE CALCULATOR (order page) ── */
function calcOrder() {
  const roseRow     = document.getElementById('op-rose-row');
  const addonRows   = document.getElementById('op-addon-rows');
  const totalEl     = document.getElementById('op-total');
  const extraNote   = document.getElementById('ribbon-extra-note');
  const bearSection = document.getElementById('bear-colors');
  const rushNote    = document.getElementById('rush-note');
  const tierField   = document.getElementById('selected-tier');

  if (!roseRow || !totalEl) return;
  if (tierField) tierField.value = currentTier;

  let roses = 5;
  const rate = TIER_RATES[currentTier] || 2.00;
  roses = parseInt(document.getElementById('order-rose-range')?.value || TIER_CONFIG[currentTier]?.value || 5);

  let base = roses * rate;
  roseRow.innerHTML = `<span>${roses} roses × ${fmt(rate)}</span><span>${fmt(base)}</span>`;

  let rows = '';
  let addl = 0;

  // Extra ribbon colors
  const checkedRibbons = document.querySelectorAll('#ribbon-grid input:checked').length;
  if (checkedRibbons > 3) {
    const extra = checkedRibbons - 3;
    const rc = extra * 2.00;
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

  const wrapSelections = document.querySelectorAll('#wrap-grid input:checked');
  if (wrapSelections.length > 0) {
    const wrapCost = wrapSelections.length * 4;
    rows += `<div class="price-row"><span>Floral wrap colors (${wrapSelections.length})</span><span>+${fmt(wrapCost)}</span></div>`;
    addl += wrapCost;
  }

  // Bear
  const bearCB = document.getElementById('o-bear');
  if (bearCB?.checked) {
    rows += `<div class="price-row"><span>Bear</span><span>+$7.00</span></div>`;
    addl += 7;
    if (bearSection) bearSection.style.display = 'block';
  } else {
    if (bearSection) bearSection.style.display = 'none';
  }

  // Diamond push pins
  if (document.getElementById('o-diamonds')?.checked) {
    rows += `<div class="price-row"><span>Diamond push pins</span><span>+$2.00</span></div>`;
    addl += 2;
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
function submitOrderForm(event) {
  event.preventDefault();

  const form = event.target;
  const name  = document.getElementById('o-name')?.value.trim();
  const email = document.getElementById('o-email')?.value.trim();

  if (!name || !email) {
    showToast('Please fill in your name and email first.');
    return;
  }

  const data = {
    'form-name': 'order-payment',
    subject: 'New Rosarae Studio order',
    name,
    email,
    selected_tier: currentTier,
    rose_count: document.getElementById('order-rose-range')?.value || '',
    ribbon: getSelectedValues('#ribbon-grid input').join(', '),
    occasion_ribbon: document.getElementById('o-occ-ribbon')?.selectedOptions?.[0]?.textContent || 'None',
    wrap: getSelectedValues('#wrap-grid input').join(', '),
    mesh_wrap: document.getElementById('o-mesh')?.checked ? 'Black mesh pearl wrap' : '',
    add_bear: document.getElementById('o-bear')?.checked ? 'Bear' : '',
    diamond_push_pins: document.getElementById('o-diamonds')?.checked ? 'Diamond push pins' : '',
    rush_order: document.getElementById('o-rush')?.checked ? 'Rush order' : '',
    bear_color: document.querySelector('input[name="bear_color"]:checked')?.value || '',
    notes: document.getElementById('o-notes')?.value || '',
  };

  const details = [
    `Tier: ${currentTier}`,
    `Rose count: ${data.rose_count}`,
    `Satin ribbon colors: ${data.ribbon || 'None selected'}`,
    `Occasion ribbon: ${data.occasion_ribbon || 'None selected'}`,
    `Floral wraps: ${data.wrap || 'None selected'}`,
    `Black mesh pearl wrap: ${data.mesh_wrap || 'Not added'}`,
    `Bear add-on: ${data.add_bear || 'Not added'}`,
    `Bear color: ${data.bear_color || 'Not selected'}`,
    `Diamond push pins: ${data.diamond_push_pins || 'Not added'}`,
    `Rush order: ${data.rush_order || 'No'}`,
  ];

  savePaymentSummary({
    title: 'Custom Ribbon Rose Order',
    price: document.getElementById('op-total')?.textContent || '$0.00',
    details,
  });

  savePendingOrder({
    formName: 'order-payment',
    orderType: 'custom',
    orderTitle: 'Custom Ribbon Rose Order',
    orderTotal: document.getElementById('op-total')?.textContent || '$0.00',
    orderDetails: details,
    customer: {
      name,
      email,
      phone: '',
      delivery_address: '',
    },
    notes: data.notes,
    sourcePage: 'custom-order',
  });
  setCashAppOpened(false);

  showToast('Review your order and payment details on the next page.');
  resetCustomOrderForm(form);
  window.location.href = 'payment.html';
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

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function getRibbonDescription(colorName) {
  const descriptions = {
    'White': 'Clean and timeless for weddings, memorial gifts, and classic keepsake bouquets.',
    'Light Pink': 'Soft and sweet with a gentle romantic feel for birthdays and baby showers.',
    'Hot Pink': 'Bright and playful for bold celebrations that need a cheerful pop of color.',
    'Peach Pink': 'Warm and delicate with a blush-toned glow that feels tender and elegant.',
    'Rose Red': 'Rich and romantic for anniversaries, Valentine gifts, and statement bouquets.',
    'Rose Pink': 'A graceful pink with a polished, feminine look for heartfelt gifting.',
    'Light Blue': 'Fresh and airy with a calming finish that feels clean and celebratory.',
    'Dusty Blue': 'Muted and elegant, perfect for modern bouquets with a soft refined palette.',
    'Pale Blue': 'A delicate pastel blue that feels serene, gentle, and beautifully classic.',
    'Smoky Blue': 'Sophisticated and moody with a smooth satin finish that photographs beautifully.',
    'Dark Blue': 'Deep and dramatic for a bouquet that feels rich, formal, and confident.',
    'Navy Blue': 'Classic and polished with a luxe feel for bold yet timeless arrangements.',
    'Black': 'Striking and modern for dramatic bouquets with a fashion-forward edge.',
    'Pink': 'Pretty and cheerful for everyday gifting, birthdays, and sweet thank-you bouquets.',
    'Red': 'A vibrant red bouquet that feels full of love, passion, and celebration.',
    'Green': 'Fresh and lively with a playful botanical feel that stands out beautifully.',
    'Light Purple': 'Dreamy and whimsical with a soft lavender tone for delicate occasions.',
    'Yellow': 'Sunny and uplifting for joyful gifts that instantly brighten the room.',
    'Royal Blue': 'Bold and vibrant for standout bouquets with a jewel-toned finish.',
    'Ivory': 'Warm and graceful with a creamy softness that pairs beautifully with satin wraps.',
    'Purple': 'Rich and expressive with a regal feel for standout keepsake bouquets.',
    'Dark Green': 'Earthy and luxurious for deep-toned bouquets with a dramatic natural mood.',
    'Sky Blue': 'Bright, fresh, and happy with a breezy softness that feels effortless.',
    'Gold': 'Shimmering and celebratory for bouquets that feel glamorous and gift-ready.',
    'Champagne Gold': 'Softly luxe with an elevated neutral glow perfect for elegant events.',
    'Wine Red': 'Deep and romantic with a velvety richness made for meaningful moments.',
  };

  return descriptions[colorName] || 'A handmade satin bouquet color designed to feel personal, polished, and gift-ready.';
}

function getRecommendedWraps(colorName) {
  const suggestions = {
    'White': ['Dusty Pink', 'Light Pink', 'Beige'],
    'Light Pink': ['Light Pink', 'Dusty Pink', 'Beige'],
    'Hot Pink': ['Black', 'Light Grey', 'Light Pink'],
    'Peach Pink': ['Beige', 'Light Pink', 'Dusty Pink'],
    'Rose Red': ['Black', 'Light Grey', 'Beige'],
    'Rose Pink': ['Dusty Pink', 'Light Pink', 'Beige'],
    'Light Blue': ['Light Grey', 'Cyan', 'Beige'],
    'Dusty Blue': ['Dark Grey', 'Light Grey', 'Beige'],
    'Pale Blue': ['Light Grey', 'Cyan', 'Beige'],
    'Smoky Blue': ['Dark Grey', 'Light Grey', 'Black'],
    'Dark Blue': ['Black', 'Light Grey', 'Beige'],
    'Navy Blue': ['Black', 'Light Grey', 'Beige'],
    'Black': ['Black', 'Light Grey', 'Dusty Pink'],
    'Pink': ['Light Pink', 'Dusty Pink', 'Beige'],
    'Red': ['Black', 'Light Grey', 'Beige'],
    'Green': ['Beige', 'Black', 'Light Grey'],
    'Light Purple': ['Lavender', 'Light Pink', 'Light Grey'],
    'Yellow': ['Beige', 'Light Grey', 'Dusty Pink'],
    'Royal Blue': ['Black', 'Light Grey', 'Cyan'],
    'Ivory': ['Beige', 'Light Pink', 'Dusty Pink'],
    'Purple': ['Lavender', 'Black', 'Light Grey'],
    'Dark Green': ['Black', 'Beige', 'Light Grey'],
    'Sky Blue': ['Cyan', 'Light Grey', 'Beige'],
    'Gold': ['Black', 'Beige', 'Light Grey'],
    'Champagne Gold': ['Beige', 'Dusty Pink', 'Light Grey'],
    'Wine Red': ['Black', 'Beige', 'Light Grey'],
  };

  return (suggestions[colorName] || ['Beige', 'Light Grey', 'Black'])
    .map((wrapName) => WRAP_COLORS.find((wrap) => wrap.n === wrapName))
    .filter(Boolean);
}

function renderRibbonShop() {
  const grid = document.getElementById('ribbon-shop-grid');
  if (!grid) return;

  const singleRoseCard = `
    <article class="ribbon-gallery-card ribbon-feature-card" data-ribbon-trigger="single-rose-bear" tabindex="0" role="button" aria-label="Open Single Rose plus Keychain Bear details">
      <div class="ribbon-gallery-visual ribbon-feature-visual">
        <div class="ribbon-gallery-frame">
          <div class="single-rose-showcase">
            <div class="single-rose-stem"></div>
            <div class="single-rose-bloom"></div>
            <div class="single-bear-charm"></div>
          </div>
          <div class="ribbon-gallery-overlay">
            <span class="ribbon-gallery-zoom">Open Details</span>
          </div>
        </div>
      </div>
      <div class="ribbon-gallery-content">
        <div class="ribbon-gallery-title-row">
          <span class="ribbon-card-dot" style="background:#f4b8c8;"></span>
          <h3 class="ribbon-gallery-title">Single Rose + Bear</h3>
        </div>
        <p class="ribbon-gallery-copy">A single ribbon rose paired with a keychain bear for a sweet little keepsake gift.</p>
        <div class="ribbon-gallery-price">from ${fmt(9)}</div>
      </div>
    </article>
  `;

  const bouquetCards = RIBBON_COLORS.map((color, index) => {
    const slug = slugify(color.n);
    const border = (color.h === '#ffffff' || color.h === '#f8f4e8') ? 'border:1px solid #ccc;' : '';
    const startingPrice = fmt(SHOP_SIZES[0].price);
    return `
      <article class="ribbon-gallery-card ${index === 0 ? 'active' : ''}" data-ribbon-trigger="${slug}" tabindex="0" role="button" aria-label="Open ${color.n} bouquet details">
        <div class="ribbon-gallery-visual" style="background-color:${color.h};">
          <div class="ribbon-gallery-frame">
            <div class="ribbon-gallery-bloom" style="background:
              radial-gradient(circle at 50% 42%, rgba(255,255,255,0.92) 0 10%, rgba(255,255,255,0.22) 11% 30%, transparent 31%),
              radial-gradient(circle at 28% 34%, rgba(255,255,255,0.24) 0 18%, transparent 19%),
              radial-gradient(circle at 72% 34%, rgba(255,255,255,0.24) 0 18%, transparent 19%),
              radial-gradient(circle at 28% 70%, rgba(255,255,255,0.18) 0 17%, transparent 18%),
              radial-gradient(circle at 72% 70%, rgba(255,255,255,0.18) 0 17%, transparent 18%),
              linear-gradient(180deg, rgba(255,255,255,0.22), rgba(0,0,0,0.08)),
              ${color.h};"></div>
            <div class="ribbon-gallery-stem"></div>
            <div class="ribbon-gallery-overlay">
              <span class="ribbon-gallery-zoom">Open Details</span>
            </div>
          </div>
        </div>
        <div class="ribbon-gallery-content">
          <div class="ribbon-gallery-title-row">
            <span class="ribbon-card-dot" style="background:${color.h};${border}"></span>
            <h3 class="ribbon-gallery-title">${color.n}</h3>
          </div>
          <p class="ribbon-gallery-copy">${getRibbonDescription(color.n)}</p>
          <div class="ribbon-gallery-price">from ${startingPrice}</div>
        </div>
      </article>
    `;
  }).join('');

  grid.innerHTML = singleRoseCard + bouquetCards;

  attachRibbonShopEvents();
}

function renderRibbonDetail(colorName) {
  const detail = document.getElementById('ribbon-shop-detail');
  if (!detail) return;

  const color = RIBBON_COLORS.find((entry) => entry.n === colorName) || RIBBON_COLORS[0];
  const slug = slugify(color.n);
  const border = (color.h === '#ffffff' || color.h === '#f8f4e8') ? 'border:1px solid #ccc;' : '';
  const wraps = getRecommendedWraps(color.n);

  const sizeOptions = SHOP_SIZES.map((size, index) => `
    <label class="ribbon-option">
      <input type="radio" name="size-${slug}" value="${size.id}" data-price="${size.price}" ${index === 0 ? 'checked' : ''}>
      <span class="ribbon-option-copy">
        <span class="ribbon-option-title">${size.label}</span>
        <span class="ribbon-option-note">${size.roses} hand-folded roses</span>
      </span>
      <span class="ribbon-price-line">${fmt(size.price)}</span>
    </label>
  `).join('');

  const wrapOptions = wraps.map((wrap) => `
    <label class="ribbon-option">
      <input type="checkbox" name="wrap-${slug}" value="${wrap.n}" data-price="4" data-wrap-limit="2">
      <span class="color-dot" style="background:${wrap.h};${wrap.h === '#ffffff' || wrap.h === '#f8f4e8' ? 'border:1px solid #ccc;' : ''}"></span>
      <span class="ribbon-option-copy">
        <span class="ribbon-option-title">${wrap.n}</span>
        <span class="ribbon-option-note">Best paired with ${color.n.toLowerCase()} satin ribbon</span>
      </span>
      <span class="ribbon-price-line">+${fmt(4)}</span>
    </label>
  `).join('');

  const extrasOptions = SHOP_EXTRAS.map((extra) => `
    <label class="ribbon-option">
      <input type="checkbox" name="extra-${slug}" value="${extra.id}" data-price="${extra.price}">
      <span class="ribbon-option-copy">
        <span class="ribbon-option-title">${extra.label}</span>
        <span class="ribbon-option-note">Adds a special finishing detail</span>
      </span>
      <span class="ribbon-price-line">+${fmt(extra.price)}</span>
    </label>
  `).join('');

  const bearColorOptions = BEAR_COLORS.map((bear, index) => `
    <label class="ribbon-option">
      <input type="radio" name="bear-color-${slug}" value="${bear.n}" ${index === 0 ? 'checked' : ''}>
      <span class="color-dot" style="background:${bear.h};"></span>
      <span class="ribbon-option-copy">
        <span class="ribbon-option-title">${bear.n}</span>
        <span class="ribbon-option-note">Choose a bear color for this bouquet</span>
      </span>
    </label>
  `).join('');

  const meshOption = `
    <label class="ribbon-option">
      <input type="checkbox" name="mesh-${slug}" value="mesh" data-price="8">
      <span class="ribbon-option-copy">
        <span class="ribbon-option-title">Black mesh pearl wrap</span>
        <span class="ribbon-option-note">Add over the floral wraps for a fuller finished bouquet</span>
      </span>
      <span class="ribbon-price-line">+${fmt(8)}</span>
    </label>
  `;

  detail.innerHTML = `
    <article class="ribbon-card" data-ribbon-card="${slug}">
      <div class="ribbon-card-header">
        <div class="ribbon-card-hero" style="background-color:${color.h};">
          <span class="ribbon-card-image-tag">Future product photo</span>
          <div class="ribbon-card-bloom" style="background:
            radial-gradient(circle at 50% 42%, rgba(255,255,255,0.92) 0 10%, rgba(255,255,255,0.22) 11% 30%, transparent 31%),
            radial-gradient(circle at 28% 34%, rgba(255,255,255,0.24) 0 18%, transparent 19%),
            radial-gradient(circle at 72% 34%, rgba(255,255,255,0.24) 0 18%, transparent 19%),
            radial-gradient(circle at 28% 70%, rgba(255,255,255,0.18) 0 17%, transparent 18%),
            radial-gradient(circle at 72% 70%, rgba(255,255,255,0.18) 0 17%, transparent 18%),
            linear-gradient(180deg, rgba(255,255,255,0.22), rgba(0,0,0,0.08)),
            ${color.h};"></div>
          <div class="ribbon-card-stem"></div>
        </div>
        <div class="ribbon-card-summary">
          <div class="ribbon-card-topline">
            <span class="ribbon-card-dot" style="background:${color.h};${border}"></span>
            <span id="ribbon-modal-title">Ribbon Bouquet</span>
          </div>
          <h3 class="ribbon-card-title">${color.n}</h3>
          <p class="ribbon-card-copy">${getRibbonDescription(color.n)}</p>
          <div class="ribbon-card-starting">
            <span class="ribbon-card-starting-label">Starting at</span>
            <span class="ribbon-card-starting-price">${fmt(SHOP_SIZES[0].price)}</span>
          </div>
        </div>
      </div>

      <fieldset class="ribbon-fieldset">
        <legend>Select Size</legend>
        <div class="ribbon-option-list">${sizeOptions}</div>
      </fieldset>

      <fieldset class="ribbon-fieldset">
        <legend>Choose Floral Wrap</legend>
        <div class="ribbon-option-list">${wrapOptions}${meshOption}</div>
      </fieldset>

      <fieldset class="ribbon-fieldset">
        <legend>Add Extras</legend>
        <div class="ribbon-option-list">${extrasOptions}</div>
      </fieldset>

      <fieldset class="ribbon-fieldset hidden" data-bear-colors="${slug}">
        <legend>Choose Bear Color</legend>
        <div class="ribbon-option-list">${bearColorOptions}</div>
      </fieldset>

      <div class="ribbon-card-footer">
        <div class="ribbon-total">
          <span class="ribbon-total-label">Estimated total</span>
          <span class="ribbon-total-price" data-ribbon-total="${slug}">${fmt(SHOP_SIZES[0].price + LOCAL_DELIVERY_PRICE)}</span>
        </div>
        <button class="btn btn-primary ribbon-order-btn" type="button" data-ribbon-order="${slug}">Order Now</button>
        <p class="ribbon-meta">Local delivery is included in the total at ${fmt(LOCAL_DELIVERY_PRICE)}.<br>Each bouquet is handmade. Slight variations may occur.<br>Ready in up to 5 days.</p>
      </div>
    </article>
  `;
}

function renderSingleRoseDetail() {
  const detail = document.getElementById('ribbon-shop-detail');
  if (!detail) return;

  const roseOptions = RIBBON_COLORS.map((color, index) => `
    <label class="ribbon-option">
      <input type="radio" name="single-rose-color" value="${color.n}" ${index === 0 ? 'checked' : ''}>
      <span class="color-dot" style="background:${color.h};${color.h === '#ffffff' || color.h === '#f8f4e8' ? 'border:1px solid #ccc;' : ''}"></span>
      <span class="ribbon-option-copy">
        <span class="ribbon-option-title">${color.n}</span>
        <span class="ribbon-option-note">Choose your satin ribbon rose color</span>
      </span>
    </label>
  `).join('');

  const bearOptions = BEAR_COLORS.map((color, index) => `
    <label class="ribbon-option">
      <input type="radio" name="single-bear-color" value="${color.n}" ${index === 0 ? 'checked' : ''}>
      <span class="color-dot" style="background:${color.h};"></span>
      <span class="ribbon-option-copy">
        <span class="ribbon-option-title">${color.n}</span>
        <span class="ribbon-option-note">Pick one keychain bear color</span>
      </span>
    </label>
  `).join('');

  const wrapOptions = WRAP_COLORS.map((wrap) => `
    <label class="ribbon-option">
      <input type="radio" name="single-wrap" value="${wrap.n}" data-price="4">
      <span class="color-dot" style="background:${wrap.h};${wrap.h === '#ffffff' || wrap.h === '#f8f4e8' ? 'border:1px solid #ccc;' : ''}"></span>
      <span class="ribbon-option-copy">
        <span class="ribbon-option-title">${wrap.n}</span>
        <span class="ribbon-option-note">Choose one floral wrap color</span>
      </span>
      <span class="ribbon-price-line">+${fmt(4)}</span>
    </label>
  `).join('');

  detail.innerHTML = `
    <article class="ribbon-card" data-ribbon-card="single-rose-bear" data-base-price="9">
      <div class="ribbon-card-header">
        <div class="ribbon-card-hero ribbon-feature-visual">
          <span class="ribbon-card-image-tag">Future product photo</span>
          <div class="single-rose-showcase modal-single-rose">
            <div class="single-rose-stem"></div>
            <div class="single-rose-bloom"></div>
            <div class="single-bear-charm"></div>
          </div>
        </div>
        <div class="ribbon-card-summary">
          <div class="ribbon-card-topline">
            <span class="ribbon-card-dot" style="background:#f4b8c8;"></span>
            <span id="ribbon-modal-title">Signature Add-On</span>
          </div>
          <h3 class="ribbon-card-title">Single Rose + Keychain Bear</h3>
          <p class="ribbon-card-copy">A single satin ribbon rose paired with a keychain bear, one floral wrap, and an optional diamond pushpin.</p>
          <div class="ribbon-card-starting">
            <span class="ribbon-card-starting-label">Starting at</span>
            <span class="ribbon-card-starting-price">${fmt(9)}</span>
          </div>
        </div>
      </div>

      <fieldset class="ribbon-fieldset">
        <legend>Choose Rose Color</legend>
        <div class="ribbon-option-list compact-option-list">${roseOptions}</div>
      </fieldset>

      <fieldset class="ribbon-fieldset">
        <legend>Choose Bear Color</legend>
        <div class="ribbon-option-list">${bearOptions}</div>
      </fieldset>

      <fieldset class="ribbon-fieldset">
        <legend>Choose One Floral Wrap</legend>
        <div class="ribbon-option-list compact-option-list">
          <label class="ribbon-option">
            <input type="radio" name="single-wrap" value="No floral wrap" data-price="0" checked>
            <span class="ribbon-option-copy">
              <span class="ribbon-option-title">No floral wrap</span>
              <span class="ribbon-option-note">Keep the rose simple and unwrapped</span>
            </span>
          </label>
          ${wrapOptions}
        </div>
      </fieldset>

      <fieldset class="ribbon-fieldset">
        <legend>Add On</legend>
        <div class="ribbon-option-list">
          <label class="ribbon-option">
            <input type="checkbox" name="single-diamond" value="Diamond push pin" data-price="2">
            <span class="ribbon-option-copy">
              <span class="ribbon-option-title">1 Diamond pushpin</span>
            <span class="ribbon-option-note">A small sparkle detail for the finished bouquet</span>
            </span>
            <span class="ribbon-price-line">+${fmt(2)}</span>
          </label>
        </div>
      </fieldset>

      <div class="ribbon-card-footer">
        <div class="ribbon-total">
          <span class="ribbon-total-label">Estimated total</span>
          <span class="ribbon-total-price" data-ribbon-total="single-rose-bear">${fmt(9 + LOCAL_DELIVERY_PRICE)}</span>
        </div>
        <button class="btn btn-primary ribbon-order-btn" type="button" data-ribbon-order="single-rose-bear">Order Now</button>
        <p class="ribbon-meta">Local delivery is included in the total at ${fmt(LOCAL_DELIVERY_PRICE)}.<br>Each item is handmade. Slight variations may occur.<br>Ready in up to 5 days.</p>
      </div>
    </article>
  `;
}

function calculateRibbonCardTotal(card) {
  if (card.dataset.ribbonCard === 'single-rose-bear') {
    const basePrice = Number(card.dataset.basePrice || 9);
    const wrapPrice = Number(card.querySelector('input[name="single-wrap"]:checked')?.dataset.price || 0);
    const diamondPrice = Number(card.querySelector('input[name="single-diamond"]:checked')?.dataset.price || 0);
    const totalNode = card.querySelector('[data-ribbon-total]');
    if (totalNode) totalNode.textContent = fmt(basePrice + wrapPrice + diamondPrice + LOCAL_DELIVERY_PRICE);
    return;
  }

  const selectedSize = card.querySelector('input[name^="size-"]:checked');
  const extraInputs = card.querySelectorAll('input[name^="extra-"]:checked');
  const meshInput = card.querySelector('input[name^="mesh-"]:checked');
  const wrapInputs = card.querySelectorAll('input[name^="wrap-"]:checked');

  let total = Number(selectedSize?.dataset.price || 0) + LOCAL_DELIVERY_PRICE;
  extraInputs.forEach((input) => {
    total += Number(input.dataset.price || 0);
  });
  total += Number(meshInput?.dataset.price || 0);
  wrapInputs.forEach((input) => {
    total += Number(input.dataset.price || 0);
  });

  const totalNode = card.querySelector('[data-ribbon-total]');
  if (totalNode) totalNode.textContent = fmt(total);
}

function attachRibbonShopEvents() {
  const modal = document.getElementById('ribbon-shop-modal');
  const detail = document.getElementById('ribbon-shop-detail');

  document.querySelectorAll('[data-ribbon-trigger]').forEach((card) => {
    if (card.dataset.bound === 'true') return;
    card.dataset.bound = 'true';
    const openCard = () => {
      const slug = card.getAttribute('data-ribbon-trigger');
      const color = RIBBON_COLORS.find((entry) => slugify(entry.n) === slug);
      document.querySelectorAll('[data-ribbon-trigger]').forEach((item) => item.classList.remove('active'));
      card.classList.add('active');
      if (slug === 'single-rose-bear') {
        renderSingleRoseDetail();
      } else {
        renderRibbonDetail(color?.n || RIBBON_COLORS[0].n);
      }
      if (modal) {
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      }
      attachRibbonShopEvents();
    };

    card.addEventListener('click', openCard);
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openCard();
      }
    });
  });

  if (modal && modal.dataset.bound !== 'true') {
    modal.dataset.bound = 'true';
    modal.querySelectorAll('[data-ribbon-close]').forEach((button) => {
      button.addEventListener('click', () => {
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        detail.innerHTML = '';
      });
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        detail.innerHTML = '';
      }
    });
  }

  document.querySelectorAll('[data-ribbon-card]').forEach((card) => {
    card.querySelectorAll('input').forEach((input) => {
      if (input.dataset.bound === 'true') return;
      input.dataset.bound = 'true';
      input.addEventListener('change', () => {
        if (input.dataset.wrapLimit) {
          const limit = Number(input.dataset.wrapLimit);
          const checkedWraps = card.querySelectorAll(`input[name="${input.name}"]:checked`);
          if (checkedWraps.length > limit) {
            input.checked = false;
            showToast(`You can choose up to ${limit} floral wraps.`);
          }
        }

        if (input.name.startsWith('extra-') && input.value === 'bear') {
          const bearFieldset = card.querySelector('[data-bear-colors]');
          if (bearFieldset) {
            bearFieldset.classList.toggle('hidden', !input.checked);
          }
        }

        calculateRibbonCardTotal(card);
      });
    });

    const orderButton = card.querySelector('[data-ribbon-order]');
    if (orderButton && orderButton.dataset.bound !== 'true') {
      orderButton.dataset.bound = 'true';
      orderButton.addEventListener('click', () => {
        if (card.dataset.ribbonCard === 'single-rose-bear') {
          const roseColor = card.querySelector('input[name="single-rose-color"]:checked')?.value || 'Rose color';
          const bearColor = card.querySelector('input[name="single-bear-color"]:checked')?.value || 'Bear color';
          const wrap = card.querySelector('input[name="single-wrap"]:checked')?.value || 'No floral wrap';
          savePaymentSummary({
            title: 'Single Rose + Keychain Bear',
            price: card.querySelector('[data-ribbon-total]')?.textContent || '$0.00',
            details: [
              `Rose color: ${roseColor}`,
              `Bear color: ${bearColor}`,
              `Floral wrap: ${wrap}`,
              `Local delivery: ${fmt(LOCAL_DELIVERY_PRICE)}`,
            ],
          });
          savePendingOrder({
            formName: 'order-payment',
            orderType: 'shop',
            orderTitle: 'Single Rose + Keychain Bear',
            orderTotal: card.querySelector('[data-ribbon-total]')?.textContent || '$0.00',
            orderDetails: [
              `Rose color: ${roseColor}`,
              `Bear color: ${bearColor}`,
              `Floral wrap: ${wrap}`,
              `Local delivery: ${fmt(LOCAL_DELIVERY_PRICE)}`,
            ],
            customer: {
              name: '',
              email: '',
              phone: '',
              delivery_address: '',
            },
            notes: '',
            sourcePage: 'shop',
          });
          setCashAppOpened(false);
          showToast(`Single Rose + Bear saved: ${roseColor}, ${bearColor}, ${wrap}, local delivery included.`);
          window.location.href = 'payment.html';
          return;
        }
        const ribbonName = card.querySelector('.ribbon-card-title')?.textContent || 'bouquet';
        const size = card.querySelector('input[name^="size-"]:checked')?.closest('.ribbon-option')?.querySelector('.ribbon-option-title')?.textContent || 'Custom size';
        const wrap = Array.from(card.querySelectorAll('input[name^="wrap-"]:checked')).map((input) => input.value).join(', ') || 'No floral wrap selected';
        const bearChoice = card.querySelector('input[name^="extra-"][value="bear"]')?.checked
          ? (card.querySelector('input[name^="bear-color-"]:checked')?.value || 'Bear color not chosen')
          : 'No bear add-on';
        savePaymentSummary({
          title: ribbonName,
          price: card.querySelector('[data-ribbon-total]')?.textContent || '$0.00',
          details: [
            `Size: ${size}`,
            `Wraps: ${wrap}`,
            `Bear: ${bearChoice}`,
            `Local delivery: ${fmt(LOCAL_DELIVERY_PRICE)}`,
          ],
        });
        savePendingOrder({
          formName: 'order-payment',
          orderType: 'shop',
          orderTitle: ribbonName,
          orderTotal: card.querySelector('[data-ribbon-total]')?.textContent || '$0.00',
          orderDetails: [
            `Size: ${size}`,
            `Wraps: ${wrap}`,
            `Bear: ${bearChoice}`,
            `Local delivery: ${fmt(LOCAL_DELIVERY_PRICE)}`,
          ],
          customer: {
            name: '',
            email: '',
            phone: '',
            delivery_address: '',
          },
          notes: '',
          sourcePage: 'shop',
        });
        setCashAppOpened(false);
        showToast(`${ribbonName} bouquet saved: ${size}, ${wrap}, local delivery included.`);
        window.location.href = 'payment.html';
      });
    }

    const bearFieldset = card.querySelector('[data-bear-colors]');
    const bearInput = card.querySelector('input[name^="extra-"][value="bear"]');
    if (bearFieldset && bearInput) {
      bearFieldset.classList.toggle('hidden', !bearInput.checked);
    }

    calculateRibbonCardTotal(card);
  });
}

function initPaymentPage() {
  const summaryRoot = document.getElementById('payment-summary');
  const checkoutRoot = document.getElementById('payment-checkout');
  if (!summaryRoot || !checkoutRoot) return;

  const summary = getStoredJson('rosarae-payment-summary');
  const pendingOrder = getStoredJson('rosarae-pending-order');
  const urlParams = new URLSearchParams(window.location.search);
  const checkoutStatus = urlParams.get('checkout');
  const sessionId = urlParams.get('session_id');

  if (!summary) {
    summaryRoot.innerHTML = '<p class="payment-empty">No recent order summary was found yet. Complete an order request or choose a shop item first.</p>';
    checkoutRoot.innerHTML = '';
    return;
  }

  const details = (summary.details || []).map((line) => `<li>${line}</li>`).join('');
  const statusMessage = checkoutStatus === 'cancel'
    ? '<p class="payment-note payment-note-strong">Your Stripe checkout was canceled. Your order details are still saved below, so you can try payment again.</p>'
    : '';

  summaryRoot.innerHTML = `
    <div class="payment-card">
      <div class="payment-card-header">
        <p class="payment-label">Payment Details</p>
        <h2>${summary.title}</h2>
        <p class="payment-price">${summary.price}</p>
      </div>
      <ul class="payment-list">${details}</ul>
      <div class="payment-actions">
        <a class="btn btn-outline" href="mailto:caytlyn09@gmail.com?subject=Rosarae%20Studio%20Order%20Payment">Email Payment Questions</a>
      </div>
      <p class="payment-note">Orders are paid securely through Stripe Checkout before the final paid order request is sent to Rosarae Studio.</p>
      ${statusMessage}
    </div>
  `;

  const buildOrderPayload = (customer, stripeDetails) => ({
    'form-name': pendingOrder?.formName || 'order-payment',
    subject: 'New Rosarae Studio paid order',
    order_type: pendingOrder?.orderType || 'shop',
    order_title: summary.title,
    order_total: summary.price,
    order_details: (summary.details || []).join(' | '),
    payment_method: 'Stripe',
    payment_link: stripeDetails?.sessionId ? `Stripe Checkout Session ${stripeDetails.sessionId}` : 'Stripe Checkout',
    payment_note: 'Paid with Stripe Checkout',
    payment_confirmed: 'Yes',
    cashapp_sender: '',
    payment_amount: stripeDetails?.amount || summary.price,
    stripe_session_id: stripeDetails?.sessionId || '',
    stripe_payment_status: stripeDetails?.status || '',
    source_page: pendingOrder?.sourcePage || 'shop',
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    delivery_address: customer.delivery_address,
    notes: customer.notes,
  });

  const renderPaidSuccess = () => {
    summaryRoot.innerHTML = `
      <div class="payment-card">
        <div class="payment-card-header">
          <p class="payment-label">Order Paid</p>
          <h2>Thank you for your order</h2>
          <p class="payment-subcopy">Your Stripe payment was confirmed and your paid order request was sent to Rosarae Studio.</p>
        </div>
        <div class="payment-actions">
          <a class="btn btn-primary" href="shop.html">Back to Shop</a>
          <a class="btn btn-outline" href="contact.html">Contact Rosarae Studio</a>
        </div>
      </div>
    `;
    checkoutRoot.innerHTML = '';
  };

  if (checkoutStatus === 'success' && sessionId) {
    checkoutRoot.innerHTML = `
      <div class="payment-card payment-card-secondary">
        <div class="payment-card-header">
          <p class="payment-label">Verifying Payment</p>
          <h2>Checking your Stripe payment</h2>
          <p class="payment-subcopy">Please wait while we confirm your payment and send your paid order request.</p>
        </div>
      </div>
    `;

    const submittedSession = getStripeSubmittedSession();
    if (submittedSession === sessionId) {
      clearPendingOrder();
      renderPaidSuccess();
      return;
    }

    fetch(`/.netlify/functions/verify-checkout-session?session_id=${encodeURIComponent(sessionId)}`)
      .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
      .then(({ ok, data }) => {
        if (!ok || data.payment_status !== 'paid' || data.status !== 'complete') {
          throw new Error(data.error || 'Stripe payment has not been confirmed yet.');
        }

        const customer = {
          name: pendingOrder?.customer?.name || '',
          email: pendingOrder?.customer?.email || data.customer_email || '',
          phone: pendingOrder?.customer?.phone || '',
          delivery_address: pendingOrder?.customer?.delivery_address || '',
          notes: pendingOrder?.notes || '',
        };

        return fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: encode(buildOrderPayload(customer, {
            sessionId: data.id,
            status: data.payment_status,
            amount: fmt((data.amount_total || 0) / 100),
          })),
        });
      })
      .then((response) => {
        if (!response.ok) throw new Error('Unable to send the paid order request.');
        setStripeSubmittedSession(sessionId);
        clearPendingOrder();
        renderPaidSuccess();
      })
      .catch((error) => {
        checkoutRoot.innerHTML = `
          <div class="payment-card payment-card-secondary">
            <div class="payment-card-header">
              <p class="payment-label">Payment Check Needed</p>
              <h2>We could not finish the order automatically</h2>
              <p class="payment-subcopy">${error.message || 'Please contact Rosarae Studio so the payment can be confirmed.'}</p>
            </div>
            <div class="payment-actions">
              <a class="btn btn-outline" href="mailto:caytlyn09@gmail.com?subject=Rosarae%20Studio%20Stripe%20Payment%20Help">Email for Payment Help</a>
              <a class="btn btn-primary" href="payment.html">Reload Payment Page</a>
            </div>
          </div>
        `;
      });
    return;
  }

  const customer = pendingOrder?.customer || {};
  checkoutRoot.innerHTML = `
    <div class="payment-card payment-card-secondary">
      <div class="payment-card-header">
        <p class="payment-label">Final Step</p>
        <h2>Pay with Stripe</h2>
        <p class="payment-subcopy">Add your customer and delivery details, then continue to Stripe Checkout. Your order request will only be sent after Stripe confirms payment.</p>
      </div>
      <form id="payment-order-form" class="payment-order-form">
        <div class="form-grid-2">
          <div class="field">
            <label for="pay-name">Full name</label>
            <input id="pay-name" name="name" type="text" value="${customer.name || ''}" required />
          </div>
          <div class="field">
            <label for="pay-email">Email</label>
            <input id="pay-email" name="email" type="email" value="${customer.email || ''}" required />
          </div>
        </div>
        <div class="form-grid-2">
          <div class="field">
            <label for="pay-phone">Phone number</label>
            <input id="pay-phone" name="phone" type="tel" value="${customer.phone || ''}" />
          </div>
          <div class="field">
            <label for="pay-total">Order total</label>
            <input id="pay-total" name="order_total" type="text" value="${summary.price}" readonly />
          </div>
        </div>
        <div class="field">
          <label for="pay-address">Local delivery address</label>
          <textarea id="pay-address" name="delivery_address" placeholder="Enter the address for local delivery" required>${customer.delivery_address || ''}</textarea>
        </div>
        <div class="field">
          <label for="pay-order-notes">Anything else we should know?</label>
          <textarea id="pay-order-notes" name="notes" placeholder="Gift note, delivery timing, or order details">${pendingOrder?.notes || ''}</textarea>
        </div>
        <div class="payment-submit-row">
          <button class="btn btn-primary" type="submit" id="payment-submit-button">Pay with Stripe</button>
          <a class="btn btn-outline" href="mailto:caytlyn09@gmail.com?subject=Rosarae%20Studio%20Order%20Payment">Email Payment Questions</a>
        </div>
        <p class="payment-note payment-note-strong">Your order request will only go through after Stripe confirms card payment.</p>
      </form>
    </div>
  `;

  const paymentForm = document.getElementById('payment-order-form');
  if (!paymentForm) return;

  paymentForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const name = document.getElementById('pay-name')?.value.trim();
    const email = document.getElementById('pay-email')?.value.trim();
    const phone = document.getElementById('pay-phone')?.value.trim();
    const deliveryAddress = document.getElementById('pay-address')?.value.trim();
    const notes = document.getElementById('pay-order-notes')?.value.trim();

    if (!name || !email || !deliveryAddress) {
      showToast('Please fill in your name, email, and delivery address.');
      return;
    }

    const updatedPendingOrder = {
      ...(pendingOrder || {}),
      formName: pendingOrder?.formName || 'order-payment',
      orderType: pendingOrder?.orderType || 'shop',
      orderTitle: summary.title,
      orderTotal: summary.price,
      orderDetails: summary.details || [],
      customer: {
        name,
        email,
        phone,
        delivery_address: deliveryAddress,
      },
      notes,
      sourcePage: pendingOrder?.sourcePage || 'shop',
    };

    savePendingOrder(updatedPendingOrder);
    setStripeSubmittedSession('');

    const button = document.getElementById('payment-submit-button');
    if (button) button.disabled = true;

    fetch('/.netlify/functions/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderTitle: summary.title,
        orderTotal: parseMoneyString(summary.price),
        orderDetails: summary.details || [],
        customer: updatedPendingOrder.customer,
        notes,
        sourcePage: updatedPendingOrder.sourcePage,
        siteUrl: window.location.origin,
      }),
    })
      .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
      .then(({ ok, data }) => {
        if (!ok || !data.url) {
          throw new Error(data.error || 'Unable to start Stripe Checkout.');
        }
        window.location.href = data.url;
      })
      .catch((error) => {
        if (button) button.disabled = false;
        showToast(error.message || 'Stripe Checkout could not start. Please try again.');
      });
  });
}

/* ── INITIALISE on DOM ready ── */
document.addEventListener('DOMContentLoaded', () => {
  // Nav
  initNav();

  // Build color grids if on order page
  buildColorGrid('ribbon-grid', RIBBON_COLORS, 'ribbon');
  buildWrapGrid();
  syncOrderRangeToTier(currentTier);
  renderRibbonShop();

  // Initial calc
  calcOrder();

  // Scroll animations
  initScrollAnimations();
  initPaymentPage();

  // CashApp link opens in new tab safely
  document.querySelectorAll('a[href*="cash.app"]').forEach(a => {
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
  });
});
