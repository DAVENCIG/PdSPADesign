/**
 * StaffPortal — Certificate Issuance & Print Preview
 * certificate-script.js | Vanilla ES6+ | No external libraries
 */

'use strict';

/* =============================================================
   CERTIFICATE DATA STORE
   ============================================================= */
const CERT_STORE = [
  { certNo: 'CERT-2026-0087', recipient: 'Maria Santos',     type: 'Employment',    date: '2026-08-18', status: 'active',  officer: 'Jane Doe',    designation: 'HR Manager',     purpose: 'For employment abroad.' },
  { certNo: 'CERT-2026-0086', recipient: 'Ana Reyes',        type: 'Completion',    date: '2026-08-17', status: 'active',  officer: 'Jane Doe',    designation: 'HR Manager',     purpose: 'For training program completion.' },
  { certNo: 'CERT-2026-0080', recipient: 'Carlos Mendoza',   type: 'Training',      date: '2026-08-10', status: 'expired', officer: 'John Smith',  designation: 'Training Head',  purpose: 'For skills training records.' },
  { certNo: 'CERT-2026-0071', recipient: 'Leo Fernandez',    type: 'Good Standing', date: '2026-07-28', status: 'revoked', officer: 'Ana Torres',  designation: 'Branch Director',purpose: 'For loan application.' },
  { certNo: 'CERT-2026-0065', recipient: 'Sofia Villanueva', type: 'Appreciation',  date: '2026-07-15', status: 'active',  officer: 'Jane Doe',    designation: 'HR Manager',     purpose: 'In recognition of outstanding service.' },
  { certNo: 'CERT-2026-0058', recipient: 'Ricardo Cruz',     type: 'Achievement',   date: '2026-07-05', status: 'active',  officer: 'Mark Reyes',  designation: 'Director',       purpose: 'For outstanding performance in Q2.' },
];

/* =============================================================
   UTILITIES
   ============================================================= */
const qs  = (sel, root = document) => root.querySelector(sel);
const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

function escHtml(str) {
  const m = { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' };
  return String(str ?? '').replace(/[&<>"']/g, c => m[c]);
}

function formatDate(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatDateShort(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* =============================================================
   TOAST
   ============================================================= */
const toastRegion = qs('#toastRegion');

const TOAST_ICONS = { success: '✅', error: '❌', info: '🔔', warning: '⚠️' };

function showToast({ type = 'info', title, message, duration = 4000 }) {
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.setAttribute('role', 'status');
  toast.innerHTML = `
    <span class="toast__icon" aria-hidden="true">${TOAST_ICONS[type]}</span>
    <div class="toast__message">
      ${title ? `<strong class="toast__title">${escHtml(title)}</strong>` : ''}
      <span>${escHtml(message)}</span>
    </div>
    <button class="toast__close" aria-label="Dismiss">&times;</button>
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
   MODAL
   ============================================================= */
const modalOverlay = qs('#modalOverlay');

function openModal({ title, bodyHTML, footerHTML }) {
  qs('#modalTitle').textContent = title || 'Details';
  qs('#modalBody').innerHTML    = bodyHTML  || '';
  qs('#modalFooter').innerHTML  = footerHTML || '';
  modalOverlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  qs('#modalClose')?.focus();
}

function closeModal() {
  modalOverlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function initModal() {
  qs('#modalClose')?.addEventListener('click', closeModal);
  modalOverlay?.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modalOverlay?.getAttribute('aria-hidden') === 'false') closeModal();
  });
}

window.closeModal = closeModal;

/* =============================================================
   LIVE PREVIEW — map form fields → certificate DOM nodes
   ============================================================= */
const PREVIEW_PLACEHOLDERS = {
  certPreviewName:        '— Name of Recipient —',
  certPreviewType:        'Certificate of [Type]',
  certPreviewPurpose:     'This certificate is issued upon request for official purposes.',
  certPreviewNo:          'CERT—',
  certPreviewDate:        '—',
  certPreviewOfficer:     'Issuing Officer',
  certPreviewDesignation: 'Designation',
};

function updatePreview() {
  const firstName  = qs('#recipientFirst')?.value.trim() || '';
  const lastName   = qs('#recipientLast')?.value.trim()  || '';
  const fullName   = (firstName || lastName) ? `${firstName} ${lastName}`.trim() : PREVIEW_PLACEHOLDERS.certPreviewName;

  const certNoRaw  = qs('#certNo')?.value.trim();
  const certNoFull = certNoRaw ? `CERT-${certNoRaw}` : PREVIEW_PLACEHOLDERS.certPreviewNo;

  const type        = qs('#certType')?.value    || '';
  const typeDisplay = type ? `Certificate of ${type}` : PREVIEW_PLACEHOLDERS.certPreviewType;

  const purpose     = qs('#certPurpose')?.value.trim() || PREVIEW_PLACEHOLDERS.certPreviewPurpose;
  const issueDate   = qs('#issueDate')?.value   ? formatDate(qs('#issueDate').value) : PREVIEW_PLACEHOLDERS.certPreviewDate;
  const officer     = qs('#issuedBy')?.value.trim()     || PREVIEW_PLACEHOLDERS.certPreviewOfficer;
  const designation = qs('#designation')?.value.trim()  || PREVIEW_PLACEHOLDERS.certPreviewDesignation;

  const set = (id, val) => { const el = qs(`#${id}`); if (el) el.textContent = val; };

  set('certPreviewName',        fullName);
  set('certPreviewType',        typeDisplay);
  set('certPreviewPurpose',     purpose);
  set('certPreviewNo',          certNoFull);
  set('certPreviewDate',        issueDate);
  set('certPreviewOfficer',     officer);
  set('certPreviewDesignation', designation);
}

function initLivePreview() {
  const watchIds = ['recipientFirst','recipientLast','certNo','certType','certPurpose',
                    'issueDate','issuedBy','designation'];
  watchIds.forEach(id => {
    const el = qs(`#${id}`);
    if (!el) return;
    el.addEventListener('input',  updatePreview);
    el.addEventListener('change', updatePreview);
  });
  updatePreview();
}

/* =============================================================
   FORM VALIDATION
   ============================================================= */
const RULES = {
  certNo:        { required: true, pattern: /^\d{4}-\d{4}$/, label: 'Certificate number', patternMsg: 'Format must be YYYY-NNNN (e.g. 2026-0001).' },
  recipientFirst:{ required: true, minLength: 2, label: 'First name' },
  recipientLast: { required: true, minLength: 2, label: 'Last name'  },
  certType:      { required: true, label: 'Certificate type' },
  certPurpose:   { required: true, minLength: 10, label: 'Purpose' },
  issueDate:     { required: true, label: 'Issue date' },
  issuedBy:      { required: true, minLength: 3, label: 'Issuing officer' },
  designation:   { required: true, minLength: 2, label: 'Designation' },
  certConfirm:   { required: true, checkbox: true, label: 'Confirmation' },
};

function validateField(id, rules) {
  const field   = qs(`#${id}`);
  const errorEl = qs(`#${id}-error`);
  if (!field) return true;

  const value = rules.checkbox ? field.checked : field.value.trim();
  let error = '';

  if (rules.required && !value) {
    error = `${rules.label} is required.`;
  } else if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
    error = `${rules.label} must be at least ${rules.minLength} characters.`;
  } else if (rules.pattern && typeof value === 'string' && value && !rules.pattern.test(value)) {
    error = rules.patternMsg || `${rules.label} format is invalid.`;
  }

  const isValid = !error;
  if (errorEl) errorEl.textContent = error;

  if (!rules.checkbox) {
    field.classList.toggle('is-error', !isValid);
    field.classList.toggle('is-valid',  isValid && field.value.trim() !== '');
  }

  return isValid;
}

function validateAll() {
  let ok = true;
  for (const [id, rules] of Object.entries(RULES)) {
    if (!validateField(id, rules)) ok = false;
  }
  return ok;
}

/* =============================================================
   FORM — INIT
   ============================================================= */
function initForm() {
  const form      = qs('#certForm');
  const submitBtn = qs('#issueCertBtn');
  if (!form) return;

  // Live validation on blur
  qsa('.form-input, .form-select, .form-textarea', form).forEach(input => {
    input.addEventListener('blur', () => {
      if (RULES[input.id]) validateField(input.id, RULES[input.id]);
    });
    input.addEventListener('input', () => {
      if (input.classList.contains('is-error') && RULES[input.id]) {
        validateField(input.id, RULES[input.id]);
      }
    });
  });

  qs('#certConfirm', form)?.addEventListener('change', () => {
    validateField('certConfirm', RULES.certConfirm);
  });

  // Submit
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validateAll()) {
      showToast({ type: 'error', title: 'Validation Error', message: 'Please correct the highlighted fields.' });
      qs('.is-error', form)?.focus();
      return;
    }

    submitBtn.disabled  = true;
    submitBtn.innerHTML = 'Issuing…';

    await new Promise(r => setTimeout(r, 1100));

    const data = Object.fromEntries(new FormData(form).entries());
    console.log('[StaffPortal] Certificate payload:', data);

    // Add to store (front-end only)
    const newCert = {
      certNo:      `CERT-${escHtml(data.cert_no)}`,
      recipient:   `${escHtml(data.recipient_first)} ${escHtml(data.recipient_last)}`,
      type:        escHtml(data.cert_type),
      date:        data.issue_date,
      status:      'active',
      officer:     escHtml(data.issued_by),
      designation: escHtml(data.designation),
      purpose:     escHtml(data.cert_purpose),
    };

    CERT_STORE.unshift(newCert);
    prependTableRow(newCert);

    showToast({
      type: 'success',
      title: 'Certificate Issued',
      message: `${newCert.certNo} has been issued to ${newCert.recipient}.`,
      duration: 5000,
    });

    form.reset();
    qsa('.is-valid,.is-error', form).forEach(el => el.classList.remove('is-valid','is-error'));
    qsa('.form-error', form).forEach(el => el.textContent = '');
    updatePreview();

    submitBtn.disabled  = false;
    submitBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg> Issue`;
  });

  form.addEventListener('reset', () => {
    setTimeout(() => {
      qsa('.form-error', form).forEach(el => el.textContent = '');
      qsa('.is-valid,.is-error', form).forEach(el => el.classList.remove('is-valid','is-error'));
      updatePreview();
    }, 0);
  });
}

/* =============================================================
   TABLE — PREPEND NEW ROW
   ============================================================= */
const TYPE_PILL_CLASS = {
  'Employment':   'employment',
  'Completion':   'completion',
  'Training':     'training',
  'Good Standing':'standing',
  'Appreciation': 'appreciation',
  'Achievement':  'achievement',
};

function prependTableRow(cert) {
  const tbody = qs('#certTableBody');
  if (!tbody) return;

  const pillClass = TYPE_PILL_CLASS[cert.type] || 'employment';
  const shortDate = formatDateShort(cert.date);

  const tr = document.createElement('tr');
  tr.className = 'data-table__row';
  tr.dataset.status    = cert.status;
  tr.dataset.certNo    = cert.certNo;
  tr.dataset.recipient = cert.recipient;
  tr.dataset.type      = cert.type;
  tr.dataset.date      = cert.date;

  tr.innerHTML = `
    <td class="data-table__td data-table__td--mono" data-label="Cert No.">${escHtml(cert.certNo)}</td>
    <td class="data-table__td" data-label="Recipient">${escHtml(cert.recipient)}</td>
    <td class="data-table__td" data-label="Type"><span class="type-pill type-pill--${pillClass}">${escHtml(cert.type)}</span></td>
    <td class="data-table__td" data-label="Issued">${escHtml(shortDate)}</td>
    <td class="data-table__td" data-label="Status"><span class="status-badge status-badge--active">Active</span></td>
    <td class="data-table__td data-table__td--actions" data-label="Actions">
      <button class="icon-btn icon-btn--view"  aria-label="View ${escHtml(cert.certNo)}"  data-action="view-cert"  data-cert-no="${escHtml(cert.certNo)}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      </button>
      <button class="icon-btn icon-btn--print" aria-label="Print ${escHtml(cert.certNo)}" data-action="print-row" data-cert-no="${escHtml(cert.certNo)}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
      </button>
      <button class="icon-btn icon-btn--revoke" aria-label="Revoke ${escHtml(cert.certNo)}" data-action="revoke-cert" data-cert-no="${escHtml(cert.certNo)}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </td>
  `;

  tbody.insertAdjacentElement('afterbegin', tr);
  tr.animate([{ opacity: 0, transform: 'translateY(-8px)' }, { opacity: 1, transform: 'none' }],
             { duration: 350, easing: 'ease' });
  updateTableInfo();
}

/* =============================================================
   TABLE — SEARCH & FILTER
   ============================================================= */
function filterTable() {
  const query  = (qs('#certSearch')?.value  || '').toLowerCase();
  const status = (qs('#statusFilter')?.value || '').toLowerCase();
  const rows   = qsa('tr[data-cert-no]', qs('#certTableBody'));
  const empty  = qs('#tableEmpty');
  let   visible = 0;

  rows.forEach(row => {
    const textMatch   = !query  || row.textContent.toLowerCase().includes(query);
    const statusMatch = !status || row.dataset.status === status;
    const show = textMatch && statusMatch;
    row.style.display = show ? '' : 'none';
    if (show) visible++;
  });

  if (empty) empty.hidden = visible > 0;
  updateTableInfo(visible);
}

function updateTableInfo(count) {
  const info = qs('#certTableInfo');
  if (!info) return;
  const total = CERT_STORE.length;
  const shown = count !== undefined ? count : qsa('tr[data-cert-no]:not([style*="none"])', qs('#certTableBody')).length;
  info.textContent = `Showing ${shown} of ${total} certificates`;
}

function initTableSearch() {
  qs('#certSearch')?.addEventListener('input',  filterTable);
  qs('#statusFilter')?.addEventListener('change', filterTable);
}

/* =============================================================
   TABLE — SORT
   ============================================================= */
let currentSort = { field: null, dir: 'asc' };

function initTableSort() {
  const tbody = qs('#certTableBody');
  if (!tbody) return;

  qsa('.sort-btn').forEach(btn => {
    const th    = btn.closest('[data-sort]');
    const field = th?.dataset.sort;
    if (!field) return;

    btn.addEventListener('click', () => {
      const dir = (currentSort.field === field && currentSort.dir === 'asc') ? 'desc' : 'asc';
      currentSort = { field, dir };

      qsa('[data-sort]').forEach(h => {
        h.setAttribute('aria-sort', 'none');
        const icon = qs('.sort-btn__icon', h);
        if (icon) icon.textContent = '⇅';
      });

      th.setAttribute('aria-sort', dir === 'asc' ? 'ascending' : 'descending');
      const icon = qs('.sort-btn__icon', th);
      if (icon) icon.textContent = dir === 'asc' ? '↑' : '↓';

      const COL = { 'cert-no': 0, 'name': 1, 'date': 3 };
      const idx  = COL[field] ?? 0;

      const rows = qsa('tr[data-cert-no]', tbody);
      rows.sort((a, b) => {
        const av = a.cells[idx]?.textContent.trim() ?? '';
        const bv = b.cells[idx]?.textContent.trim() ?? '';
        return dir === 'asc'
          ? av.localeCompare(bv, undefined, { numeric: true })
          : bv.localeCompare(av, undefined, { numeric: true });
      });
      rows.forEach(r => tbody.appendChild(r));
    });
  });
}

/* =============================================================
   TABLE — ACTION BUTTONS
   ============================================================= */
function loadCertIntoPreview(cert) {
  const set = (id, val) => { const el = qs(`#${id}`); if (el) el.textContent = val; };
  set('certPreviewName',        cert.recipient);
  set('certPreviewType',        `Certificate of ${cert.type}`);
  set('certPreviewPurpose',     cert.purpose);
  set('certPreviewNo',          cert.certNo);
  set('certPreviewDate',        formatDate(cert.date));
  set('certPreviewOfficer',     cert.officer);
  set('certPreviewDesignation', cert.designation);
}

function initTableActions() {
  const tbody = qs('#certTableBody');
  if (!tbody) return;

  tbody.addEventListener('click', e => {
    const btn    = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const certNo = btn.dataset.certNo;
    const cert   = CERT_STORE.find(c => c.certNo === certNo);

    if (action === 'view-cert' && cert) {
      loadCertIntoPreview(cert);
      qs('#previewCard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      showToast({ type: 'info', message: `Loaded ${escHtml(certNo)} into preview.` });
    }

    if (action === 'print-row' && cert) {
      loadCertIntoPreview(cert);
      setTimeout(() => window.print(), 400);
    }

    if (action === 'revoke-cert' && cert) {
      if (cert.status === 'revoked') {
        showToast({ type: 'warning', title: 'Already Revoked', message: `${escHtml(certNo)} is already revoked.` });
        return;
      }
      openModal({
        title: 'Revoke Certificate',
        bodyHTML: `
          <p>You are about to revoke <strong>${escHtml(certNo)}</strong> issued to <strong>${escHtml(cert.recipient)}</strong>.</p>
          <p style="margin-top:8px;">This action marks the certificate as invalid. It cannot be automatically undone.</p>
        `,
        footerHTML: `
          <button class="btn btn--ghost" onclick="closeModal()">Cancel</button>
          <button class="btn btn--primary" style="background:#C0392B;border-color:#C0392B"
                  onclick="confirmRevoke('${escHtml(certNo)}')">Revoke</button>
        `,
      });
    }
  });
}

function confirmRevoke(certNo) {
  const cert = CERT_STORE.find(c => c.certNo === certNo);
  if (!cert) return;
  cert.status = 'revoked';

  const row = qs(`[data-cert-no="${certNo}"]`, qs('#certTableBody'));
  if (row) {
    row.dataset.status = 'revoked';
    const statusCell = qs('[data-label="Status"]', row);
    if (statusCell) statusCell.innerHTML = `<span class="status-badge status-badge--revoked">Revoked</span>`;

    const actionsCell = qs('[data-label="Actions"]', row);
    if (actionsCell) {
      const revokeBtn = qs('[data-action="revoke-cert"]', actionsCell);
      const printBtn  = qs('[data-action="print-row"]',   actionsCell);
      revokeBtn?.remove();
      printBtn?.remove();
    }
  }

  closeModal();
  showToast({ type: 'error', title: 'Certificate Revoked', message: `${escHtml(certNo)} has been revoked.`, duration: 5000 });
}

window.confirmRevoke = confirmRevoke;

/* =============================================================
   PRINT / SAVE PDF
   ============================================================= */
function initPrintButtons() {
  qs('#printCertBtn')?.addEventListener('click', () => window.print());

  qs('#downloadPdfBtn')?.addEventListener('click', () => {
    showToast({
      type: 'info',
      title: 'Save as PDF',
      message: 'In the print dialog, set the destination to "Save as PDF".',
    });
    setTimeout(() => window.print(), 600);
  });

  qs('#bulkPrintBtn')?.addEventListener('click', () => {
    const activeCount = CERT_STORE.filter(c => c.status === 'active').length;
    showToast({
      type: 'info',
      title: 'Bulk Print',
      message: `${activeCount} active certificates queued. Feature connects to your print server endpoint.`,
      duration: 5000,
    });
  });
}

/* =============================================================
   SCROLL TO PREVIEW (preview button)
   ============================================================= */
function initScrollPreview() {
  qs('#previewScrollBtn')?.addEventListener('click', () => {
    qs('#previewCard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

/* =============================================================
   ANIMATED COUNTERS
   ============================================================= */
function animateCounter(el, target, duration = 1100) {
  const start = performance.now();
  const update = now => {
    const p = Math.min((now - start) / duration, 1);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(e * target);
    if (p < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

function initCounters() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        animateCounter(el, parseInt(el.dataset.countTo, 10));
        io.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  qsa('[data-count-to]').forEach(el => io.observe(el));
}

/* =============================================================
   MOBILE NAV
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
   DATE CONSTRAINT
   ============================================================= */
function initDateConstraint() {
  const today = new Date().toISOString().split('T')[0];
  qs('#issueDate')?.setAttribute('max', today);
  qs('#validUntil')?.setAttribute('min', today);
  qs('#issueDate')?.setAttribute('value', today);
  if (qs('#issueDate')) qs('#issueDate').value = today;
}

/* =============================================================
   INIT
   ============================================================= */
document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initCounters();
  initDateConstraint();
  initLivePreview();
  initForm();
  initTableSearch();
  initTableSort();
  initModal();
  initTableActions();
  initPrintButtons();
  initScrollPreview();
  updateTableInfo();
});
