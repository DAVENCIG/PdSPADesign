/**
 * StaffPortal Dashboard — script.js
 * Vanilla ES6+ | No external libraries
 */

'use strict';

/* =============================================================
   CONSTANTS & STATE
   ============================================================= */
const APPOINTMENT_DATA = [
  { id: 'APT-001', name: 'Maria Santos',     type: 'Consultation', date: '2026-08-18', status: 'approved' },
  { id: 'APT-002', name: 'Ricardo Cruz',     type: 'Follow-Up',    date: '2026-08-18', status: 'pending'  },
  { id: 'APT-003', name: 'Ana Reyes',        type: 'Certificate',  date: '2026-08-17', status: 'approved' },
  { id: 'APT-004', name: 'Leo Fernandez',    type: 'Grievance',    date: '2026-08-17', status: 'rejected' },
  { id: 'APT-005', name: 'Sofia Villanueva', type: 'Consultation', date: '2026-08-16', status: 'pending'  },
  { id: 'APT-006', name: 'Carlos Mendoza',   type: 'Other',        date: '2026-08-15', status: 'approved' },
];

let currentSort = { field: null, dir: 'asc' };

/* =============================================================
   UTILITIES
   ============================================================= */
function qs(selector, scope = document) {
  return scope.querySelector(selector);
}

function qsa(selector, scope = document) {
  return [...scope.querySelectorAll(selector)];
}

function escapeHtml(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(str).replace(/[&<>"']/g, c => map[c]);
}

/* =============================================================
   TOAST SYSTEM
   ============================================================= */
const toastRegion = qs('#toastRegion');

function showToast({ type = 'info', title, message, duration = 4000 }) {
  const icons = { success: '✅', error: '❌', info: '🔔' };

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.setAttribute('role', 'status');
  toast.innerHTML = `
    <span class="toast__icon" aria-hidden="true">${icons[type]}</span>
    <div class="toast__message">
      ${title ? `<strong class="toast__title">${escapeHtml(title)}</strong>` : ''}
      <span>${escapeHtml(message)}</span>
    </div>
    <button class="toast__close" aria-label="Dismiss notification">&times;</button>
  `;

  qs('.toast__close', toast).addEventListener('click', () => dismissToast(toast));
  toastRegion.appendChild(toast);

  const timer = setTimeout(() => dismissToast(toast), duration);
  toast._timer = timer;
}

function dismissToast(toast) {
  clearTimeout(toast._timer);
  toast.classList.add('toast--leaving');
  toast.addEventListener('animationend', () => toast.remove(), { once: true });
}

/* =============================================================
   ANIMATED COUNTERS (stat cards)
   ============================================================= */
function animateCounter(el, target, duration = 1200) {
  const start = performance.now();

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
    el.textContent = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

function initCounters() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.countTo, 10);
        animateCounter(el, target);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.4 });

  qsa('[data-count-to]').forEach(el => observer.observe(el));
}

/* =============================================================
   FORM VALIDATION
   ============================================================= */
const validationRules = {
  firstName:  { required: true, minLength: 2, label: 'First name' },
  lastName:   { required: true, minLength: 2, label: 'Last name'  },
  email:      { required: true, email: true,  label: 'Email'      },
  apptDate:   { required: true, futureDate: true, label: 'Date'   },
  apptTime:   { required: true, label: 'Time'                     },
  apptType:   { required: true, label: 'Appointment type'         },
  agreeTerms: { required: true, checkbox: true, label: 'Confirmation' },
};

function validateField(id, rules) {
  const field = qs(`#${id}`);
  const errorEl = qs(`#${id}-error`);
  if (!field) return true;

  let error = '';
  const value = rules.checkbox ? field.checked : field.value.trim();

  if (rules.required && !value) {
    error = `${rules.label} is required.`;
  } else if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
    error = `${rules.label} must be at least ${rules.minLength} characters.`;
  } else if (rules.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    error = 'Please enter a valid email address.';
  } else if (rules.futureDate && value) {
    const selected = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selected < today) error = 'Date cannot be in the past.';
  }

  const isValid = !error;
  if (errorEl) errorEl.textContent = error;

  if (!rules.checkbox) {
    field.classList.toggle('is-error', !isValid);
    field.classList.toggle('is-valid', isValid && field.value.trim() !== '');
  }

  return isValid;
}

function validateForm() {
  let allValid = true;
  for (const [id, rules] of Object.entries(validationRules)) {
    if (!validateField(id, rules)) allValid = false;
  }
  return allValid;
}

function initForm() {
  const form = qs('#appointmentForm');
  const submitBtn = qs('#submitBtn');
  if (!form) return;

  // Live validation on blur
  qsa('.form-input, .form-select, .form-textarea', form).forEach(input => {
    input.addEventListener('blur', () => {
      const id = input.id;
      if (validationRules[id]) validateField(id, validationRules[id]);
    });

    input.addEventListener('input', () => {
      const id = input.id;
      if (input.classList.contains('is-error') && validationRules[id]) {
        validateField(id, validationRules[id]);
      }
    });
  });

  qs('#agreeTerms', form).addEventListener('change', () => {
    validateField('agreeTerms', validationRules.agreeTerms);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast({ type: 'error', title: 'Validation Error', message: 'Please correct the highlighted fields.' });

      const firstError = qs('.is-error', form);
      firstError?.focus();
      return;
    }

    // Simulate async submission
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';

    await new Promise(resolve => setTimeout(resolve, 1200));

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    console.log('[StaffPortal] Appointment payload:', payload);

    showToast({
      type: 'success',
      title: 'Request Submitted',
      message: `Appointment for ${escapeHtml(payload.first_name)} ${escapeHtml(payload.last_name)} has been queued for review.`,
      duration: 5000,
    });

    form.reset();
    qsa('.is-valid, .is-error', form).forEach(el => {
      el.classList.remove('is-valid', 'is-error');
    });
    qsa('.form-error', form).forEach(el => el.textContent = '');

    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Request';
  });

  form.addEventListener('reset', () => {
    setTimeout(() => {
      qsa('.form-error', form).forEach(el => el.textContent = '');
      qsa('.is-valid, .is-error', form).forEach(el => {
        el.classList.remove('is-valid', 'is-error');
      });
    }, 0);
  });
}

/* =============================================================
   MOBILE NAV TOGGLE
   ============================================================= */
function initMobileNav() {
  const toggle = qs('#mobileMenuToggle');
  const nav    = qs('#mobileNav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    nav.hidden = expanded;
  });
}

/* =============================================================
   TABLE SEARCH
   ============================================================= */
function initTableSearch() {
  const input  = qs('#tableSearch');
  const tbody  = qs('#tableBody');
  const info   = qs('#tableInfo');
  if (!input || !tbody) return;

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    let visible = 0;

    qsa('tr', tbody).forEach(row => {
      const text = row.textContent.toLowerCase();
      const match = !q || text.includes(q);
      row.style.display = match ? '' : 'none';
      if (match) visible++;
    });

    if (info) {
      info.textContent = q
        ? `Showing ${visible} result${visible !== 1 ? 's' : ''} for "${input.value}"`
        : `Showing ${visible} of 248 entries`;
    }
  });
}

/* =============================================================
   TABLE SORTING
   ============================================================= */
function initTableSort() {
  const tbody = qs('#tableBody');
  if (!tbody) return;

  qsa('.sort-btn').forEach(btn => {
    const th   = btn.closest('[data-sort]');
    const field = th?.dataset.sort;
    if (!field) return;

    btn.addEventListener('click', () => {
      const dir = (currentSort.field === field && currentSort.dir === 'asc') ? 'desc' : 'asc';
      currentSort = { field, dir };

      // Update aria-sort on all sortable headers
      qsa('[data-sort]').forEach(h => {
        h.setAttribute('aria-sort', 'none');
        qs('.sort-btn__icon', h).textContent = '⇅';
      });

      th.setAttribute('aria-sort', dir === 'asc' ? 'ascending' : 'descending');
      qs('.sort-btn__icon', th).textContent = dir === 'asc' ? '↑' : '↓';

      const rows = qsa('tr', tbody);
      const fieldMap = { id: 0, name: 1, date: 3 };
      const colIdx   = fieldMap[field] ?? 0;

      rows.sort((a, b) => {
        const aVal = a.cells[colIdx]?.textContent.trim() ?? '';
        const bVal = b.cells[colIdx]?.textContent.trim() ?? '';
        return dir === 'asc'
          ? aVal.localeCompare(bVal, undefined, { numeric: true })
          : bVal.localeCompare(aVal, undefined, { numeric: true });
      });

      rows.forEach(row => tbody.appendChild(row));
    });
  });
}

/* =============================================================
   MODAL
   ============================================================= */
const modalOverlay = qs('#modalOverlay');
const modalBody    = qs('#modalBody');
const modalFooter  = qs('#modalFooter');
const modalTitle   = qs('#modalTitle');

function openModal({ title, bodyHTML, footerHTML }) {
  if (!modalOverlay) return;
  modalTitle.textContent = title || 'Details';
  modalBody.innerHTML    = bodyHTML  || '';
  modalFooter.innerHTML  = footerHTML || '';
  modalOverlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  qs('#modalClose')?.focus();
}

function closeModal() {
  if (!modalOverlay) return;
  modalOverlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function initModal() {
  qs('#modalClose')?.addEventListener('click', closeModal);

  modalOverlay?.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay?.getAttribute('aria-hidden') === 'false') {
      closeModal();
    }
  });
}

/* =============================================================
   TABLE ACTION BUTTONS
   ============================================================= */
function buildDetailHTML(record) {
  return `
    <dl>
      <dt>ID</dt>        <dd>${escapeHtml(record.id)}</dd>
      <dt>Name</dt>      <dd>${escapeHtml(record.name)}</dd>
      <dt>Type</dt>      <dd>${escapeHtml(record.type)}</dd>
      <dt>Date</dt>      <dd>${escapeHtml(record.date)}</dd>
      <dt>Status</dt>    <dd>
        <span class="status-badge status-badge--${escapeHtml(record.status)}">
          ${escapeHtml(record.status.charAt(0).toUpperCase() + record.status.slice(1))}
        </span>
      </dd>
    </dl>
  `;
}

function initTableActions() {
  const tbody = qs('#tableBody');
  if (!tbody) return;

  tbody.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    const id     = btn.dataset.id;
    const record = APPOINTMENT_DATA.find(r => r.id === id);

    if (action === 'view' && record) {
      openModal({
        title: `Appointment ${escapeHtml(id)}`,
        bodyHTML: buildDetailHTML(record),
        footerHTML: `
          <button class="btn btn--outline" onclick="closeModal()">Close</button>
          ${record.status === 'pending'
            ? `<button class="btn btn--primary" data-action="approve" data-id="${escapeHtml(id)}" onclick="handleApprove('${escapeHtml(id)}')">Approve</button>`
            : ''}
        `,
      });
    }

    if (action === 'approve' && record) {
      handleApprove(id);
    }

    if (action === 'print-cert' && record) {
      showToast({
        type: 'info',
        title: 'Certificate',
        message: `Preparing certificate for ${escapeHtml(record.name)}…`,
      });
      setTimeout(() => window.print(), 500);
    }
  });
}

function handleApprove(id) {
  const record = APPOINTMENT_DATA.find(r => r.id === id);
  if (!record || record.status === 'approved') return;

  record.status = 'approved';

  // Update the DOM row
  const row = qs(`[data-id="${id}"][data-action="view"]`)?.closest('tr');
  if (row) {
    const statusCell = row.querySelector('[data-label="Status"]');
    if (statusCell) {
      statusCell.innerHTML = `<span class="status-badge status-badge--approved">Approved</span>`;
    }

    const actionsCell = row.querySelector('[data-label="Actions"]');
    if (actionsCell) {
      const approveBtn = actionsCell.querySelector('[data-action="approve"]');
      if (approveBtn) {
        const certBtn = document.createElement('button');
        certBtn.className = 'action-btn action-btn--cert';
        certBtn.setAttribute('aria-label', `Print certificate for ${id}`);
        certBtn.dataset.id = id;
        certBtn.dataset.action = 'print-cert';
        certBtn.textContent = 'Cert';
        approveBtn.replaceWith(certBtn);
      }
    }
  }

  closeModal();

  showToast({
    type: 'success',
    title: 'Approved',
    message: `${id} — ${escapeHtml(record.name)} has been approved.`,
  });
}

// Expose for inline onclick in modal footer
window.closeModal  = closeModal;
window.handleApprove = handleApprove;

/* =============================================================
   NEW APPOINTMENT SCROLL
   ============================================================= */
function initNewApptButton() {
  qs('[data-action="new-appointment"]')?.addEventListener('click', () => {
    const form = qs('#appointmentForm');
    form?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => qs('#firstName')?.focus(), 500);
  });
}

/* =============================================================
   DATE INPUT — set min to today
   ============================================================= */
function initDateConstraint() {
  const dateInput = qs('#apptDate');
  if (!dateInput) return;
  const today = new Date().toISOString().split('T')[0];
  dateInput.setAttribute('min', today);
}

/* =============================================================
   PROGRESS BARS — animate on view
   ============================================================= */
function initProgressBars() {
  const bars = qsa('.progress-bar__fill');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.width = entry.target.style.getPropertyValue('--pct') || '0%';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  bars.forEach(bar => {
    const pct = getComputedStyle(bar).getPropertyValue('--pct').trim();
    bar.style.setProperty('--pct', pct);
    bar.style.width = '0%';
    observer.observe(bar);
  });
}

/* =============================================================
   DYNAMIC GREETING
   ============================================================= */
function initGreeting() {
  const sub = qs('.page-title__sub');
  if (!sub) return;

  const now  = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const formatted = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  sub.textContent = `${formatted} — ${greeting}, Jane.`;
}

/* =============================================================
   INIT
   ============================================================= */
document.addEventListener('DOMContentLoaded', () => {
  initGreeting();
  initDateConstraint();
  initCounters();
  initProgressBars();
  initMobileNav();
  initForm();
  initTableSearch();
  initTableSort();
  initModal();
  initTableActions();
  initNewApptButton();
});
