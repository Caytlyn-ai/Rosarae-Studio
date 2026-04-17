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

const SHOP_SIZES = [
  { id: 'small', label: 'Small (5 roses)', roses: 5, price: 18 },
  { id: 'medium', label: 'Medium (10 roses)', roses: 10, price: 32 },
  { id: 'large', label: 'Large (20 roses)', roses: 20, price: 58 },
];

const SHOP_EXTRAS = [
  { id: 'bear', label: 'Plush Keychain Bear', price: 10 },
  { id: 'diamonds', label: 'Diamond push pins', price: 4 },
];

const DELIVERY_OPTIONS = [
  { id: 'pickup', label: 'Pickup', price: 0 },
  { id: 'delivery', label: 'Local Delivery', price: 15 },
];

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

  grid.innerHTML = RIBBON_COLORS.map((color, index) => {
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

  const wrapOptions = wraps.map((wrap, index) => `
    <label class="ribbon-option">
      <input type="radio" name="wrap-${slug}" value="${wrap.n}" ${index === 0 ? 'checked' : ''}>
      <span class="color-dot" style="background:${wrap.h};${wrap.h === '#ffffff' || wrap.h === '#f8f4e8' ? 'border:1px solid #ccc;' : ''}"></span>
      <span class="ribbon-option-copy">
        <span class="ribbon-option-title">${wrap.n}</span>
        <span class="ribbon-option-note">Best paired with ${color.n.toLowerCase()} satin ribbon</span>
      </span>
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

  const deliveryOptions = DELIVERY_OPTIONS.map((option, index) => `
    <label class="ribbon-option">
      <input type="radio" name="delivery-${slug}" value="${option.id}" data-price="${option.price}" ${index === 0 ? 'checked' : ''}>
      <span class="ribbon-option-copy">
        <span class="ribbon-option-title">${option.label}${option.price ? ` (+$${option.price})` : ''}</span>
        <span class="ribbon-option-note">${option.id === 'pickup' ? 'Arrange a pickup time after ordering' : 'Available for nearby local delivery'}</span>
      </span>
    </label>
  `).join('');

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
        <legend>Choose Wrap Style</legend>
        <div class="ribbon-option-list">${wrapOptions}</div>
      </fieldset>

      <fieldset class="ribbon-fieldset">
        <legend>Add Extras</legend>
        <div class="ribbon-option-list">${extrasOptions}</div>
      </fieldset>

      <fieldset class="ribbon-fieldset">
        <legend>Delivery Option</legend>
        <div class="ribbon-option-list">${deliveryOptions}</div>
      </fieldset>

      <div class="ribbon-card-footer">
        <div class="ribbon-total">
          <span class="ribbon-total-label">Estimated total</span>
          <span class="ribbon-total-price" data-ribbon-total="${slug}">${fmt(SHOP_SIZES[0].price)}</span>
        </div>
        <button class="btn btn-primary ribbon-order-btn" type="button" data-ribbon-order="${slug}">Order Now</button>
        <p class="ribbon-meta">Each bouquet is handmade. Slight variations may occur.<br>Ready in up to 5 days.</p>
      </div>
    </article>
  `;
}

function calculateRibbonCardTotal(card) {
  const selectedSize = card.querySelector('input[name^="size-"]:checked');
  const selectedDelivery = card.querySelector('input[name^="delivery-"]:checked');
  const extraInputs = card.querySelectorAll('input[name^="extra-"]:checked');

  let total = Number(selectedSize?.dataset.price || 0) + Number(selectedDelivery?.dataset.price || 0);
  extraInputs.forEach((input) => {
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
      renderRibbonDetail(color?.n || RIBBON_COLORS[0].n);
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
      input.addEventListener('change', () => calculateRibbonCardTotal(card));
    });

    const orderButton = card.querySelector('[data-ribbon-order]');
    if (orderButton && orderButton.dataset.bound !== 'true') {
      orderButton.dataset.bound = 'true';
      orderButton.addEventListener('click', () => {
        const ribbonName = card.querySelector('.ribbon-card-title')?.textContent || 'bouquet';
        const size = card.querySelector('input[name^="size-"]:checked')?.closest('.ribbon-option')?.querySelector('.ribbon-option-title')?.textContent || 'Custom size';
        const wrap = card.querySelector('input[name^="wrap-"]:checked')?.value || 'recommended wrap';
        const delivery = card.querySelector('input[name^="delivery-"]:checked')?.closest('.ribbon-option')?.querySelector('.ribbon-option-title')?.textContent || 'Pickup';
        showToast(`${ribbonName} bouquet saved: ${size}, ${wrap} wrap, ${delivery}.`);
      });
    }

    calculateRibbonCardTotal(card);
  });
}

/* ── INITIALISE on DOM ready ── */
document.addEventListener('DOMContentLoaded', () => {
  // Nav
  initNav();

  // Build color grids if on order page
  buildColorGrid('ribbon-grid', RIBBON_COLORS, 'ribbon');
  buildColorGrid('wrap-grid',   WRAP_COLORS,   'wrap');
  renderRibbonShop();

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
