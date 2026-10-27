/* ============================================================
   PdSPA SARMS — Standalone vanilla-JS application
   Implements all five design updates:
   1. Pamisa/Mass Intentions removed; Upcoming Activities on dashboard
   2. Calendar is an editable Activity Planner
   3. OR No. replaces online-payment reference fields
   4. Marriage Details intake form (Form 97 layout)
   5. Type-specific certificate print templates
   ============================================================ */
"use strict";

/* ── CONSTANTS ─────────────────────────────────────────────── */
const LOGO = "assets/logo.png";

const SACR = {
  "Baptismal":                { col:"#2563EB", light:"#EFF6FF" },
  "Confirmation":             { col:"#7C3AED", light:"#F5F3FF" },
  "First Holy Communion":     { col:"#B45309", light:"#FFFBEB" },
  "Matrimony":                { col:"#BE185D", light:"#FDF2F8" },
  "Burial/Death":             { col:"#475569", light:"#F8FAFC" },
  "No Record":                { col:"#DC2626", light:"#FEF2F2" },
  "Good Standing/Membership": { col:"#16A34A", light:"#F0FDF4" },
};
const SACR_LIST = Object.keys(SACR);

const ACTIVITY_CATS = {
  "Wedding Mass":      { col:"#BE185D", light:"#FDF2F8" },
  "Funeral Mass":      { col:"#475569", light:"#F8FAFC" },
  "Holy Mass":         { col:"#2563EB", light:"#EFF6FF" },
  "Barangay Mass":     { col:"#B45309", light:"#FFFBEB" },
  "Holiday":           { col:"#92400E", light:"#FFFBEB" },
  "Closed Office Day": { col:"#DC2626", light:"#FEF2F2" },
};
const ACTIVITY_CAT_LIST = Object.keys(ACTIVITY_CATS);

const STATUS_CFG = {
  pending:   { label:"Pending",   col:"#92400E", bg:"#FEF3C7" },
  verified:  { label:"Verified",  col:"#1E40AF", bg:"#DBEAFE" },
  scheduled: { label:"Scheduled", col:"#065F46", bg:"#D1FAE5" },
  completed: { label:"Completed", col:"#166534", bg:"#F0FDF4" },
  cancelled: { label:"Cancelled", col:"#991B1B", bg:"#FEF2F2" },
};

const CERT_STATUS_CFG = {
  pending:    { label:"Pending",    col:"#92400E", bg:"#FEF3C7" },
  processing: { label:"Processing", col:"#1E40AF", bg:"#DBEAFE" },
  ready:      { label:"Ready",      col:"#065F46", bg:"#D1FAE5" },
  released:   { label:"Released",   col:"#4B5563", bg:"#F3F4F6" },
};

const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const DEMO_USERS = [
  { label:"Admin", u:"admin", p:"admin123", role:"admin" },
  { label:"Staff", u:"staff", p:"staff123", role:"staff" },
];

/* ── SEED DATA ──────────────────────────────────────────────── */
let _aid = 8, _crid = 4, _actid = 5, _bkid = 6, _fnid = 5;
const nextAid  = () => `SARMS-2026-${String(++_aid).padStart(3,"0")}`;
const nextCrid = () => `CR-2026-${String(++_crid).padStart(3,"0")}`;
const nextActid= () => `ACT-${String(++_actid).padStart(3,"0")}`;
const nextBkid = () => `BK-${String(++_bkid).padStart(3,"0")}`;
const nextFnid = () => `FN-${String(++_fnid).padStart(3,"0")}`;

const SEED_APPTS = [
  { id:"SARMS-2026-001", requestDate:"2026-08-01", parishioner:"Maria Dela Cruz",      contact:"09171234567", email:"maria@email.com",   sacramentType:"Baptismal",                subjectName:"Juan Carlos Dela Cruz",     dateOfSacrament:"2020-03-15", purposeOf:"School enrollment",         status:"completed", orNo:"OR-2026-0001", scheduledDate:"2026-08-05", staffNotes:"Book 12, Pg 34" },
  { id:"SARMS-2026-002", requestDate:"2026-08-03", parishioner:"Jose Banaga",          contact:"09281234567", email:"jose@email.com",    sacramentType:"Confirmation",             subjectName:"Jose Banaga Jr.",           dateOfSacrament:"2018-04-22", purposeOf:"Employment",                status:"verified",  orNo:"OR-2026-0002", scheduledDate:"2026-09-10", staffNotes:"" },
  { id:"SARMS-2026-003", requestDate:"2026-08-05", parishioner:"Rosario Layug",        contact:"09351234567", email:"rosario@email.com", sacramentType:"Matrimony",                subjectName:"Eduardo & Rosario Layug",   dateOfSacrament:"2005-06-18", purposeOf:"Annulment proceedings",     status:"scheduled", orNo:"OR-2026-0003", scheduledDate:"2026-09-12", staffNotes:"Court-ordered" },
  { id:"SARMS-2026-004", requestDate:"2026-08-07", parishioner:"Pedro Abalos",         contact:"09181234567", email:"pedro@email.com",   sacramentType:"Burial/Death",             subjectName:"Conchita Abalos",           dateOfSacrament:"2026-07-30", purposeOf:"Estate settlement",         status:"pending",   orNo:"",             scheduledDate:"",           staffNotes:"" },
  { id:"SARMS-2026-005", requestDate:"2026-08-08", parishioner:"Lourdes Ramos",        contact:"09291234567", email:"lourdes@email.com", sacramentType:"First Holy Communion",     subjectName:"Ana Lourdes Ramos",         dateOfSacrament:"2019-05-10", purposeOf:"Confirmation requirement",  status:"completed", orNo:"OR-2026-0005", scheduledDate:"2026-08-09", staffNotes:"Book 8, Pg 102" },
  { id:"SARMS-2026-006", requestDate:"2026-08-10", parishioner:"Antonio Magno",        contact:"09371234567", email:"antonio@email.com", sacramentType:"Good Standing/Membership", subjectName:"Antonio Magno",             dateOfSacrament:"",           purposeOf:"Visa application",          status:"verified",  orNo:"OR-2026-0006", scheduledDate:"2026-09-15", staffNotes:"Active parishioner" },
  { id:"SARMS-2026-007", requestDate:"2026-08-12", parishioner:"Cynthia Obispo",       contact:"09461234567", email:"cynthia@email.com", sacramentType:"No Record",                subjectName:"Carlo Obispo",              dateOfSacrament:"",           purposeOf:"Insurance claim",           status:"pending",   orNo:"",             scheduledDate:"",           staffNotes:"" },
];

const SEED_CERT_REQS = [
  { id:"CR-2026-001", requestDate:"2026-08-02", parishioner:"Maria Dela Cruz",  contact:"09171234567", email:"maria@email.com",   sacramentType:"Baptismal",            subjectName:"Juan Carlos Dela Cruz",   dateOfSacrament:"2020-03-15", purposeOf:"School enrollment",        orNo:"OR-2026-0001", status:"released",   staffNotes:"Book 12, Pg 34",    claimedDate:"2026-08-06" },
  { id:"CR-2026-002", requestDate:"2026-08-09", parishioner:"Lourdes Ramos",    contact:"09291234567", email:"lourdes@email.com", sacramentType:"First Holy Communion", subjectName:"Ana Lourdes Ramos",       dateOfSacrament:"2019-05-10", purposeOf:"Confirmation requirement", orNo:"OR-2026-0002", status:"ready",      staffNotes:"Book 8, Pg 102",    claimedDate:"" },
  { id:"CR-2026-003", requestDate:"2026-08-13", parishioner:"Pedro Abalos",     contact:"09181234567", email:"pedro@email.com",   sacramentType:"Burial/Death",         subjectName:"Conchita Abalos",         dateOfSacrament:"2026-07-30", purposeOf:"Estate settlement",        orNo:"",             status:"processing", staffNotes:"Verifying records", claimedDate:"" },
];

const SEED_BOOKS = [
  { id:"BK-001", sacramentType:"Baptismal",            subjectName:"Juan Carlos Dela Cruz",   dateOfSacrament:"2020-03-15", dateOfArrival:"2026-08-01", volume:"12", page:"34",  minister:"Fr. Rene Tabios",  remarks:"Parents: Carlos & Maria Dela Cruz" },
  { id:"BK-002", sacramentType:"Confirmation",          subjectName:"Jose Banaga Jr.",         dateOfSacrament:"2018-04-22", dateOfArrival:"2026-08-03", volume:"9",  page:"88",  minister:"Bishop Pedro Arigo",remarks:"Sponsor: Atty. Ramon Banaga" },
  { id:"BK-003", sacramentType:"First Holy Communion",  subjectName:"Ana Lourdes Ramos",       dateOfSacrament:"2019-05-10", dateOfArrival:"2026-08-08", volume:"8",  page:"102", minister:"Fr. Rene Tabios",  remarks:"Batch 2019" },
  { id:"BK-004", sacramentType:"Matrimony",             subjectName:"Eduardo & Rosario Layug", dateOfSacrament:"2005-06-18", dateOfArrival:"2026-08-05", volume:"6",  page:"57",  minister:"Fr. Domingo Cruz", remarks:"Sponsors: see page 58" },
  { id:"BK-005", sacramentType:"Burial/Death",          subjectName:"Conchita Abalos",         dateOfSacrament:"2026-07-30", dateOfArrival:"2026-08-07", volume:"15", page:"4",   minister:"Fr. Rene Tabios",  remarks:"Interred at PdSPA Campo Santo" },
];

const SEED_FUNERALS = [
  { id:"FN-001", deceasedName:"Conchita Abalos",    dateOfDeath:"2026-07-28", dateOfBurial:"2026-07-30", block:"A", lot:"12", section:"Nicho",  nextOfKin:"Pedro Abalos",      contact:"09181234567", notes:"" },
  { id:"FN-002", deceasedName:"Felix Tabios",        dateOfDeath:"2025-08-15", dateOfBurial:"2025-08-18", block:"B", lot:"3",  section:"Lawn",   nextOfKin:"Fr. Rene Tabios",   contact:"09151234567", notes:"Perpetual care" },
  { id:"FN-003", deceasedName:"Remedios Villanueva", dateOfDeath:"2024-11-02", dateOfBurial:"2024-11-05", block:"A", lot:"44", section:"Nicho",  nextOfKin:"Carmen Villanueva", contact:"09261234567", notes:"" },
  { id:"FN-004", deceasedName:"Ignacio Banaga",      dateOfDeath:"2024-03-20", dateOfBurial:"2024-03-22", block:"C", lot:"7",  section:"Ground", nextOfKin:"Jose Banaga",       contact:"09281234567", notes:"" },
];

const SEED_ACTIVITIES = [
  { id:"ACT-001", category:"Holy Mass",         title:"Parish Feast Day — St. Peter",   date:"2026-09-29", time:"8:00 AM",  notes:"Annual feast; solemn High Mass" },
  { id:"ACT-002", category:"Barangay Mass",     title:"Brgy. 3 Outreach Mass",          date:"2026-09-05", time:"7:00 AM",  notes:"" },
  { id:"ACT-003", category:"Holiday",           title:"National Heroes Day",             date:"2026-08-31", time:"",         notes:"Office closed" },
  { id:"ACT-004", category:"Wedding Mass",      title:"Santos–Reyes Wedding",            date:"2026-09-12", time:"10:00 AM", notes:"Rehearsal Sept 11, 4PM" },
  { id:"ACT-005", category:"Closed Office Day", title:"Annual Parish Recollection",      date:"2026-09-19", time:"",         notes:"Staff off-site" },
];

/* ── STATE ──────────────────────────────────────────────────── */
const S = {
  auth: null,
  view: "dashboard",
  appts:      [...SEED_APPTS],
  certReqs:   [...SEED_CERT_REQS],
  books:      [...SEED_BOOKS],
  funerals:   [...SEED_FUNERALS],
  activities: [...SEED_ACTIVITIES],
  todos: [
    { id:1, text:"Verify pending baptismal request (SARMS-2026-004)", done:false },
    { id:2, text:"Update book entry — Burial/Death Vol. 15",           done:false },
    { id:3, text:"Print certificate for Rosario Layug",                done:true  },
  ],
  // table state
  apt: { tab:"list", search:"", sf:"", sv:"", sortF:null, sortD:"asc", page:1 },
  crt: { tab:"requests", search:"", sf:"", sv:"", sortF:null, sortD:"asc", page:1, printSearch:"", printSel:null },
  bk:  { search:"", sortF:null, sortD:"asc", page:1, showForm:false },
  fn:  { search:"", showForm:false },
  cal: { year: new Date().getFullYear(), month: new Date().getMonth() },
  rpt: { month:"2026-08" },
};

/* ── HELPERS ─────────────────────────────────────────────────── */
function fmt(iso) {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-PH", { month:"long", day:"numeric", year:"numeric" });
}
function fmtShort(iso) {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-PH", { month:"short", day:"numeric", year:"numeric" });
}
function todayISO() { return new Date().toISOString().slice(0,10); }
function esc(s) { return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function tag(name, attrs, inner) {
  const a = Object.entries(attrs||{}).map(([k,v])=>` ${k}="${esc(v)}"`).join("");
  return `<${name}${a}>${inner||""}</${name}>`;
}

function tablePaged(data, page, size=10) {
  const total = Math.max(1, Math.ceil(data.length / size));
  const safe  = Math.min(page, total);
  return { rows: data.slice((safe-1)*size, safe*size), total, page:safe };
}
function tableFilter(data, keys, search, filterKey, filterVal, sortF, sortD) {
  let d = data;
  if (search) {
    const q = search.toLowerCase();
    d = d.filter(r => keys.some(k => String(r[k]||"").toLowerCase().includes(q)));
  }
  if (filterKey && filterVal) {
    d = d.filter(r => String(r[filterKey]||"").toLowerCase() === filterVal.toLowerCase());
  }
  if (sortF) {
    d = [...d].sort((a,b) => {
      const av = String(a[sortF]||""), bv = String(b[sortF]||"");
      return sortD === "asc" ? av.localeCompare(bv,undefined,{numeric:true}) : bv.localeCompare(av,undefined,{numeric:true});
    });
  }
  return d;
}

/* ── BADGE HTML ─────────────────────────────────────────────── */
function apptBadge(status) {
  const c = STATUS_CFG[status] || { label:status, col:"#555", bg:"#eee" };
  return `<span class="badge" style="background:${c.bg};color:${c.col}">${c.label}</span>`;
}
function certBadge(status) {
  const c = CERT_STATUS_CFG[status] || { label:status, col:"#555", bg:"#eee" };
  return `<span class="badge" style="background:${c.bg};color:${c.col}">${c.label}</span>`;
}
function typeTag(type) {
  const s = SACR[type] || { col:"#555", light:"#eee" };
  return `<span class="tag" style="background:${s.light};color:${s.col}">${esc(type)}</span>`;
}
function activityChip(cat) {
  const c = ACTIVITY_CATS[cat] || { col:"#555", light:"#eee" };
  return `<span class="cal-chip" style="background:${c.light};color:${c.col}">${esc(cat)}</span>`;
}

/* ── TOAST ──────────────────────────────────────────────────── */
const TOAST_COL = { success:"var(--green)", error:"var(--red)", info:"var(--primary)", warning:"var(--amber)" };
function showToast(type, msg) {
  const box = document.getElementById("toasts");
  const id  = "t" + Date.now();
  const el  = document.createElement("div");
  el.className = `toast ${type}`;
  el.id = id;
  el.innerHTML = `<span>${esc(msg)}</span><button onclick="document.getElementById('${id}').remove()">×</button>`;
  el.style.borderLeftColor = TOAST_COL[type];
  box.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

/* ── MODAL ──────────────────────────────────────────────────── */
function openModal(title, bodyHTML, footHTML, opts={}) {
  const maxW = opts.maxW || 500;
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.id = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal" style="max-width:${maxW}px">
      <div class="modal-head">
        <span class="title">${esc(title)}</span>
        <button id="modal-x">×</button>
      </div>
      <div class="modal-body" id="modal-body">${bodyHTML}</div>
      ${footHTML ? `<div class="modal-foot" id="modal-foot">${footHTML}</div>` : ""}
    </div>`;
  overlay.addEventListener("click", e => { if (e.target === overlay) closeModal(); });
  document.body.appendChild(overlay);
  const _modal_x = document.getElementById("modal-x"); if (_modal_x) _modal_x.onclick = closeModal;
  document.addEventListener("keydown", _escHandler);
}
function _escHandler(e) { if (e.key === "Escape") closeModal(); }
function closeModal() {
  document.getElementById("modal-overlay")?.remove();
  document.removeEventListener("keydown", _escHandler);
}

/* ── PAGINATOR HTML ─────────────────────────────────────────── */
function paginatorHTML(page, total) {
  if (total <= 1) return "";
  let html = `<div class="pager">
    <button ${page===1?"disabled":""} data-pg="${page-1}">‹</button>`;
  const pages = Array.from({length:total},(_,i)=>i+1).filter(p=>p===1||p===total||Math.abs(p-page)<=1);
  pages.forEach((p,i) => {
    if (i>0 && pages[i-1]!==p-1) html += `<span class="dots">…</span>`;
    html += `<button class="${p===page?"active":""}" data-pg="${p}">${p}</button>`;
  });
  html += `<button ${page===total?"disabled":""} data-pg="${page+1}">›</button></div>`;
  return html;
}

/* ── SORT TH HTML ───────────────────────────────────────────── */
function sortTh(label, field, sortF, sortD) {
  const active = sortF === field;
  const ind = active ? (sortD==="asc"?"↑":"↓") : "↕";
  return `<th class="tbl th sortable" data-sort="${field}">${label} <span class="sort-ind${active?" active":""}">${ind}</span></th>`;
}

/* ─────────────────────────────────────────────────────────────
   VIEWS
───────────────────────────────────────────────────────────── */

/* ── LOGIN ──────────────────────────────────────────────────── */
function renderLogin() {
  document.getElementById("app").innerHTML = `
    <div class="login-wrap">
      <div class="login-card">
        <div class="login-left">
          <img src="${LOGO}" alt="PdSPA Seal" onerror="this.style.display='none'">
          <p>PdSPA Sacramental &amp; Administrative Records Management System</p>
        </div>
        <div class="login-right">
          <h1>User Login</h1>
          <form id="login-form" novalidate class="login-form">
            <div>
              <input id="login-user" class="login-input" type="text" placeholder="Username" autocomplete="username">
            </div>
            <div class="pw-wrap">
              <input id="login-pass" class="login-input" type="password" placeholder="Password" autocomplete="current-password" style="padding-right:28px">
              <button type="button" class="pw-toggle" id="pw-toggle" title="Show/hide password">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
            <div id="login-err" class="login-err" style="display:none"></div>
            <button type="submit" class="login-btn" id="login-btn">Login</button>
          </form>
          <div class="demo-box">
            <div class="h">Demo accounts</div>
            ${DEMO_USERS.map(d=>`<button class="demo-btn" data-u="${d.u}" data-p="${d.p}"><span class="l">${d.label}</span><span class="c">${d.u} / ${d.p}</span></button>`).join("")}
          </div>
        </div>
      </div>
    </div>`;

  const _pw_toggle = document.getElementById("pw-toggle"); if (_pw_toggle) _pw_toggle.onclick = function() {;
    const inp = document.getElementById("login-pass");
    inp.type = inp.type === "password" ? "text" : "password";
  };
  document.querySelectorAll(".demo-btn").forEach(b => {
    b.onclick = () => {
      document.getElementById("login-user").value = b.dataset.u;
      document.getElementById("login-pass").value = b.dataset.p;
    };
  });
  document.getElementById("login-form").onsubmit = async function(e) {
    e.preventDefault();
    const u = document.getElementById("login-user").value.trim();
    const p = document.getElementById("login-pass").value;
    const match = DEMO_USERS.find(d => d.u===u && d.p===p);
    const errEl = document.getElementById("login-err");
    if (!match) { errEl.textContent = "Incorrect username or password."; errEl.style.display="block"; return; }
    const btn = document.getElementById("login-btn");
    btn.disabled = true; btn.textContent = "Signing in…";
    await new Promise(r => setTimeout(r, 600));
    S.auth = { role:match.role, name:match.label };
    S.view = "dashboard";
    renderApp();
    showToast("success", `Signed in as ${match.label}.`);
  };
}

/* ── SHELL (sidebar + topbar) ───────────────────────────────── */
const NAV_ITEMS = [
  { view:"dashboard",    label:"Dashboard" },
  { view:"appointments", label:"Appointments" },
  { view:"certificates", label:"Certificates" },
  { view:"book-entries", label:"Book Entries" },
  { view:"funeral",      label:"Funeral / Campo Santo" },
  { view:"calendar",     label:"Calendar" },
  { view:"reports",      label:"Reports" },
];
const VIEW_LABELS = { dashboard:"Dashboard", appointments:"Appointments", certificates:"Certificates", "book-entries":"Book Entries", funeral:"Funeral / Campo Santo", calendar:"Calendar", reports:"Reports" };

function shellHTML() {
  const nav = NAV_ITEMS.map(n => {
    const a = S.view === n.view;
    return `<button class="nav-item${a?" active":""}" data-nav="${n.view}">${n.label}</button>`;
  }).join("");
  return `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="sidebar-logo">
          <img class="img" src="${LOGO}" alt="PdSPA" onerror="this.style.display='none'">
          <div><div class="t1">PdSPA</div><div class="t2">SARMS</div></div>
        </div>
        <nav class="sidebar-nav">${nav}</nav>
        <div class="sidebar-user">
          <div class="name">${esc(S.auth.name)}</div>
          <div class="role">${esc(S.auth.role)}</div>
          <button id="logout-btn" class="link-muted">Sign out</button>
        </div>
      </aside>
      <div class="app-main-col">
        <div class="topbar">
          <span class="topbar-title">${VIEW_LABELS[S.view]||""}</span>
          <span class="topbar-user">${esc(S.auth.name)} &bull; <span class="cap">${esc(S.auth.role)}</span></span>
        </div>
        <main class="content" id="main-content"></main>
      </div>
    </div>`;
}

function bindShell() {
  document.querySelectorAll("[data-nav]").forEach(b => {
    b.onclick = () => { S.view = b.dataset.nav; renderApp(); };
  });
  const _logout_btn = document.getElementById("logout-btn"); if (_logout_btn) _logout_btn.onclick = () => {;
    S.auth = null; S.view = "dashboard"; renderApp();
  };
}

/* ── BAR CHART (SVG) ────────────────────────────────────────── */
function barChartSVG(data, height=200) {
  if (!data.length) return `<div class="chart-empty">No data to display.</div>`;
  const padL=28, padB=28, padT=8, W=100, H=height;
  const max = Math.max(...data.map(d=>d.count), 1);
  const step = max<=4?1:Math.ceil(max/4);
  const ticks = []; for (let v=0;v<=max;v+=step) ticks.push(v);
  if (ticks[ticks.length-1]!==max) ticks.push(max);
  const plotH = H-padB-padT;
  const y = v => padT + plotH*(1-v/max);
  const bandW = (W-padL)/data.length;
  const barW  = bandW*0.5;
  let svg = `<div class="bar-chart-wrap"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="height:${height}px">`;
  ticks.forEach(t => {
    svg += `<line x1="${padL}" x2="${W}" y1="${y(t)}" y2="${y(t)}" stroke="var(--border)" stroke-width="0.3" stroke-dasharray="1 1" vector-effect="non-scaling-stroke"/>`;
    svg += `<text x="${padL-3}" y="${y(t)+3}" text-anchor="end" font-size="6" fill="var(--muted)">${t}</text>`;
  });
  data.forEach((d,i) => {
    const bx = padL + i*bandW + (bandW-barW)/2;
    const bh = plotH*(d.count/max);
    const col = d.color || (SACR[d.full]?.col || "var(--primary)");
    svg += `<rect x="${bx}" y="${y(d.count)}" width="${barW}" height="${bh}" rx="1" fill="${col}"/>`;
    svg += `<text x="${bx+barW/2}" y="${H-padB+8}" text-anchor="middle" font-size="6" fill="var(--muted)">${esc(d.name)}</text>`;
  });
  svg += `</svg></div>`;
  return svg;
}

function hBarsHTML(data) {
  const max = Math.max(...data.map(d=>d.count), 1);
  return `<div class="hbars">${data.map(d=>`
    <div class="hbar-row">
      <div class="hbar-name">${esc(d.name)}</div>
      <div class="hbar-track"><div class="hbar-fill" style="width:${(d.count/max)*100}%;background:${d.color}"></div></div>
      <div class="hbar-val">${d.count}</div>
    </div>`).join("")}</div>`;
}

/* ═══════════════════════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════════════════════════ */
function renderDashboard() {
  const main = document.getElementById("main-content");
  const today = new Date().toLocaleDateString("en-PH",{weekday:"long",month:"long",day:"numeric",year:"numeric"});
  const pending   = S.appts.filter(a=>a.status==="pending").length;
  const scheduled = S.appts.filter(a=>a.status==="scheduled").length;
  const completed = S.appts.filter(a=>a.status==="completed").length;
  const total     = S.appts.length;

  const chartData = SACR_LIST.map(t=>({
    name: t.split("/")[0].split(" ").slice(-1)[0],
    full: t,
    count: S.appts.filter(a=>a.sacramentType===t).length,
  })).filter(x=>x.count>0);

  // Upcoming activities: next 4 from activities + any scheduled appts in future
  const nowStr = todayISO();
  const upcoming = [...S.activities]
    .filter(a => a.date >= nowStr)
    .sort((a,b) => a.date.localeCompare(b.date))
    .slice(0,5);

  const uaRows = upcoming.length ? upcoming.map(a => {
    const d = new Date(a.date+"T00:00:00");
    const mo = d.toLocaleDateString("en-PH",{month:"short"}).toUpperCase();
    const dy = d.getDate();
    const cfg = ACTIVITY_CATS[a.category]||{col:"var(--muted)",light:"var(--bg)"};
    return `<div class="ua-row">
      <div class="ua-date">
        <div class="mo" style="color:${cfg.col}">${mo}</div>
        <div class="dy">${dy}</div>
        ${a.time?`<div class="tm">${esc(a.time)}</div>`:""}
      </div>
      <div class="ua-body">
        <div class="ua-title">${esc(a.title)}</div>
        <div class="ua-meta">${activityChip(a.category)}${a.notes?` &bull; ${esc(a.notes)}`:""}</div>
      </div>
    </div>`;
  }).join("") : `<p class="empty-note">No upcoming activities.</p>`;

  // Quick todos
  const done  = S.todos.filter(t=>t.done).length;
  const ttotal = S.todos.length;
  const progressWidth = ttotal ? Math.round((done/ttotal)*100) : 0;
  const todoRows = S.todos.map(t=>`
    <div class="todo-row${t.done?" done":""}">
      <button class="todo-check${t.done?" on":""}" data-todo-toggle="${t.id}">
        ${t.done?`<svg width="9" height="9" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`:""}
      </button>
      <span class="todo-text${t.done?" done":""}">${esc(t.text)}</span>
      <button class="todo-x" data-todo-del="${t.id}">×</button>
    </div>`).join("");

  // Recent activity
  const recentRows = S.appts.slice(0,5).map((a,i)=>`
    <div class="list-row${i<4?"":" "}" style="${i===4?"border-bottom:none":""}">
      <div style="min-width:0">
        <div class="primary">${esc(a.subjectName)}</div>
        <div class="secondary">${esc(a.sacramentType)}</div>
      </div>
      ${apptBadge(a.status)}
    </div>`).join("");

  main.innerHTML = `
    <div class="page-head">
      <h1 class="page-title">Dashboard</h1>
      <p class="page-sub">${today}</p>
    </div>

    <div class="stat-grid">
      <div class="stat"><div class="label">Total Requests</div><div class="val">${total}</div><div class="note">All time</div></div>
      <div class="stat"><div class="label">Pending</div><div class="val">${pending}</div><div class="note">Awaiting action</div></div>
      <div class="stat"><div class="label">Scheduled</div><div class="val">${scheduled}</div><div class="note">Confirmed</div></div>
      <div class="stat"><div class="label">Completed</div><div class="val">${completed}</div><div class="note">Processed</div></div>
    </div>

    <div class="dash-grid">
      <div class="dash-col">
        <div class="card">
          <div class="card-head"><div><div class="title">Requests by Sacrament Type</div></div></div>
          <div class="card-pad">${barChartSVG(chartData, 200)}</div>
        </div>
        <div class="card" id="todos-card">
          <div class="card-head">
            <div><div class="title">Quick To-Dos</div><div class="sub">${ttotal ? `${done} of ${ttotal} done` : "No tasks yet"}</div></div>
            ${done>0?`<button id="clear-done-btn" class="link-muted">Clear done</button>`:""}
          </div>
          ${ttotal>0?`<div class="progress"><div style="width:${progressWidth}%"></div></div>`:""}
          <div style="max-height:260px;overflow-y:auto" id="todo-list">${todoRows}</div>
          <div class="todo-add">
            <input id="todo-input" class="underline-input" type="text" placeholder="Add a task…" value="">
            <button class="add-btn" id="todo-add-btn">Add</button>
          </div>
        </div>
      </div>
      <div class="dash-col">
        <div class="card">
          <div class="card-head">
            <div><div class="title">Upcoming Activities</div><div class="sub">From activity planner</div></div>
            <button class="btn btn-outline sm" id="view-calendar-btn">View Calendar</button>
          </div>
          <div>${uaRows}</div>
          <div class="card-foot">
            <button class="link-muted" id="manage-activities-btn" style="font-size:12px;color:var(--primary);background:none;border:none;cursor:pointer;padding:0">Manage activities →</button>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><div class="title">Recent Activity</div></div>
          ${recentRows}
          <div class="card-foot">
            <button class="link-muted" id="view-appts-btn" style="font-size:12px;color:var(--primary);background:none;border:none;cursor:pointer;padding:0">View all appointments →</button>
          </div>
        </div>
      </div>
    </div>`;

  // Bind todos
  document.querySelectorAll("[data-todo-toggle]").forEach(b => {
    b.onclick = () => {
      const id = Number(b.dataset.todoToggle);
      S.todos = S.todos.map(t => t.id===id?{...t,done:!t.done}:t);
      renderDashboard();
    };
  });
  document.querySelectorAll("[data-todo-del]").forEach(b => {
    b.onclick = () => {
      S.todos = S.todos.filter(t => t.id !== Number(b.dataset.todoDel));
      renderDashboard();
    };
  });
  document.getElementById("clear-done-btn")?.addEventListener("click", () => {
    S.todos = S.todos.filter(t => !t.done);
    renderDashboard();
  });
  const todoInp = document.getElementById("todo-input");
  const addTodo = () => {
    const txt = todoInp.value.trim();
    if (!txt) return;
    S.todos.push({ id:Date.now(), text:txt, done:false });
    renderDashboard();
  };
  const _todo_add_btn = document.getElementById("todo-add-btn"); if (_todo_add_btn) _todo_add_btn.onclick = addTodo;
  todoInp.onkeydown = e => { if(e.key==="Enter") addTodo(); };

  const _view_calendar_btn = document.getElementById("view-calendar-btn"); if (_view_calendar_btn) _view_calendar_btn.onclick = () => { S.view="calendar"; renderApp(); };
  const _manage_activities_btn = document.getElementById("manage-activities-btn"); if (_manage_activities_btn) _manage_activities_btn.onclick = () => { S.view="calendar"; renderApp(); };
  const _view_appts_btn = document.getElementById("view-appts-btn"); if (_view_appts_btn) _view_appts_btn.onclick = () => { S.view="appointments"; renderApp(); };
}

/* ═══════════════════════════════════════════════════════════
   APPOINTMENTS
══════════════════════════════════════════════════════════════ */
function renderAppointments() {
  const main = document.getElementById("main-content");
  const ap = S.apt;

  const tabBtns = ["list","new"].map(t=>
    `<button class="tab${ap.tab===t?" active":""}" data-apt-tab="${t}">${t==="list"?"All Appointments":"New Request"}</button>`
  ).join("");

  let body = "";
  if (ap.tab === "list") {
    const filtered = tableFilter(S.appts, ["id","parishioner","subjectName","sacramentType","status"],
      ap.search, ap.sf, ap.sv, ap.sortF, ap.sortD);
    const { rows, total, page } = tablePaged(filtered, ap.page);
    ap.page = page;

    const rows_html = rows.length ? rows.map((a,i) => {
      const isMatrimony = a.sacramentType === "Matrimony";
      return `<tr class="${i%2===1?"zebra":""} hoverable" data-apt-view="${a.id}">
        <td class="mono">${esc(a.id)}</td>
        <td style="font-weight:500">${esc(a.parishioner)}</td>
        <td>${esc(a.subjectName)}</td>
        <td>${typeTag(a.sacramentType)}</td>
        <td class="muted">${fmtShort(a.requestDate)}</td>
        <td>${apptBadge(a.status)}</td>
        <td class="right">
          <button class="btn ghost sm" data-apt-view="${a.id}" style="margin-right:4px">View</button>
          ${isMatrimony?`<button class="btn btn-ghost sm" data-apt-marriage="${a.id}" style="margin-right:4px">Details</button>`:""}
          ${a.status==="pending"?`<button class="btn btn-outline sm" data-apt-verify="${a.id}">Verify</button>`:""}
          ${a.status==="verified"?`<button class="btn btn-outline sm" data-apt-schedule="${a.id}">Schedule</button>`:""}
          ${a.status==="scheduled"?`<button class="btn btn-primary sm" data-apt-complete="${a.id}">Complete</button>`:""}
        </td>
      </tr>`;
    }).join("") : `<tr><td colspan="7" class="empty">No records found.</td></tr>`;

    body = `<div class="card">
      <div class="tbl-filters">
        <input type="search" class="fi" placeholder="Search…" id="apt-search" value="${esc(ap.search)}" style="width:220px">
        <select class="fs" id="apt-status-filter" style="width:150px">
          <option value="">All Statuses</option>
          ${Object.entries(STATUS_CFG).map(([k,v])=>`<option value="${k}"${ap.sf==="status"&&ap.sv===k?" selected":""}>${v.label}</option>`).join("")}
        </select>
        <select class="fs" id="apt-type-filter" style="width:180px">
          <option value="">All Types</option>
          ${SACR_LIST.map(s=>`<option value="${s}"${ap.sf==="sacramentType"&&ap.sv===s?" selected":""}>${esc(s)}</option>`).join("")}
        </select>
        ${(ap.search||ap.sv)?`<button class="btn ghost sm" id="apt-clear-filter">Clear</button>`:""}
      </div>
      <div class="tbl-wrap">
        <table class="tbl">
          <thead><tr>
            <th>Ref. No.</th>
            ${sortTh("Parishioner","parishioner",ap.sortF,ap.sortD)}
            <th>Subject Name</th>
            <th>Sacrament Type</th>
            ${sortTh("Date Requested","requestDate",ap.sortF,ap.sortD)}
            ${sortTh("Status","status",ap.sortF,ap.sortD)}
            <th class="right">Actions</th>
          </tr></thead>
          <tbody>${rows_html}</tbody>
        </table>
      </div>
      <div class="tbl-foot">
        <span class="count">Showing ${rows.length} of ${filtered.length}</span>
        ${paginatorHTML(page, total)}
      </div>
    </div>`;
  } else {
    body = `<div class="card" style="max-width:680px">
      <div class="card-head"><div><div class="title">New Appointment Request</div><div class="sub">Submit a sacramental certificate request</div></div></div>
      <form id="new-apt-form" novalidate class="form">
        <div class="g2">
          <div><label class="fl">Parishioner Name <span class="req">*</span></label><input class="fi" id="apt-parishioner" placeholder="Full name"><p class="field-err" id="err-apt-parishioner"></p></div>
          <div><label class="fl">Contact Number <span class="req">*</span></label><input class="fi" id="apt-contact" placeholder="09XX-XXX-XXXX"><p class="field-err" id="err-apt-contact"></p></div>
        </div>
        <div><label class="fl">Email Address</label><input class="fi" type="email" id="apt-email" placeholder="email@example.com"></div>
        <div>
          <label class="fl">Sacrament / Service Type <span class="req">*</span></label>
          <select class="fs" id="apt-sacrament">
            <option value="" disabled selected>Select type…</option>
            ${SACR_LIST.map(s=>`<option value="${s}">${esc(s)}</option>`).join("")}
          </select>
          <p class="field-err" id="err-apt-sacrament"></p>
        </div>
        <div><label class="fl">Subject Name <span class="req">*</span></label><input class="fi" id="apt-subject" placeholder="Name as it appears in the register"><p class="field-err" id="err-apt-subject"></p></div>
        <div class="g2">
          <div><label class="fl">Date of Sacrament</label><input class="fi" type="date" id="apt-dos"></div>
          <div><label class="fl">OR No. (Official Receipt)</label><input class="fi" id="apt-orno" placeholder="e.g., OR-2026-0001"></div>
        </div>
        <div><label class="fl">Purpose of Request <span class="req">*</span></label><input class="fi" id="apt-purpose" placeholder="e.g., School enrollment, employment…"><p class="field-err" id="err-apt-purpose"></p></div>
        <div><label class="fl">Additional Notes</label><textarea class="ft" id="apt-notes" rows="3" placeholder="Special instructions…"></textarea></div>
        <div class="divider"></div>
        <div class="form-actions">
          <button type="button" class="btn ghost" id="apt-form-clear">Clear</button>
          <button type="submit" class="btn btn-primary" id="apt-form-submit">Submit Request</button>
        </div>
      </form>
    </div>`;
  }

  main.innerHTML = `
    <div class="page-head"><h1 class="page-title">Appointments</h1></div>
    <div class="tabs">${tabBtns}</div>
    ${body}`;

  // Tab switching
  document.querySelectorAll("[data-apt-tab]").forEach(b => {
    b.onclick = () => { ap.tab = b.dataset.aptTab; ap.page=1; renderAppointments(); };
  });

  if (ap.tab === "list") {
    // Search & filter
    document.getElementById("apt-search").oninput = e => { ap.search=e.target.value; ap.page=1; renderAppointments(); };
    document.getElementById("apt-status-filter").onchange = e => {
      if (e.target.value) { ap.sf="status"; ap.sv=e.target.value; } else { ap.sf=""; ap.sv=""; }
      ap.page=1; renderAppointments();
    };
    document.getElementById("apt-type-filter").onchange = e => {
      if (e.target.value) { ap.sf="sacramentType"; ap.sv=e.target.value; } else { ap.sf=""; ap.sv=""; }
      ap.page=1; renderAppointments();
    };
    const _apt_clear_filter = document.getElementById("apt-clear-filter"); if (_apt_clear_filter) _apt_clear_filter.onclick = () => { ap.search=""; ap.sf=""; ap.sv=""; ap.page=1; renderAppointments(); };

    // Sort
    document.querySelectorAll(".tbl th.sortable[data-sort]").forEach(th => {
      th.onclick = () => {
        if (ap.sortF===th.dataset.sort) ap.sortD=ap.sortD==="asc"?"desc":"asc";
        else { ap.sortF=th.dataset.sort; ap.sortD="asc"; }
        ap.page=1; renderAppointments();
      };
    });

    // Pagination
    document.querySelectorAll(".pager [data-pg]").forEach(b => {
      b.onclick = () => { ap.page=Number(b.dataset.pg); renderAppointments(); };
    });

    // Row view
    document.querySelectorAll("[data-apt-view]").forEach(el => {
      el.onclick = () => showApptViewModal(el.dataset.aptView);
    });
    document.querySelectorAll("[data-apt-verify]").forEach(b => {
      b.onclick = e => { e.stopPropagation(); showApptVerifyModal(b.dataset.aptVerify); };
    });
    document.querySelectorAll("[data-apt-schedule]").forEach(b => {
      b.onclick = e => { e.stopPropagation(); showApptScheduleModal(b.dataset.aptSchedule); };
    });
    document.querySelectorAll("[data-apt-complete]").forEach(b => {
      b.onclick = e => {
        e.stopPropagation();
        S.appts = S.appts.map(a=>a.id===b.dataset.aptComplete?{...a,status:"completed"}:a);
        showToast("success",`Appointment ${b.dataset.aptComplete} marked completed.`);
        renderAppointments();
      };
    });
    document.querySelectorAll("[data-apt-marriage]").forEach(b => {
      b.onclick = e => { e.stopPropagation(); showMarriageModal(b.dataset.aptMarriage); };
    });
  } else {
    const _apt_form_clear = document.getElementById("apt-form-clear"); if (_apt_form_clear) _apt_form_clear.onclick = () => {;
      document.getElementById("new-apt-form").reset();
      ["parishioner","contact","sacrament","subject","purpose"].forEach(k => {
        document.getElementById(`err-apt-${k}`).textContent="";
      });
    };
    document.getElementById("new-apt-form").onsubmit = async e => {
      e.preventDefault();
      const val = id => document.getElementById(id).value.trim();
      const errs = {};
      if (!val("apt-parishioner")) errs["apt-parishioner"]="Required";
      if (!val("apt-contact"))     errs["apt-contact"]="Required";
      if (!val("apt-sacrament"))   errs["apt-sacrament"]="Required";
      if (!val("apt-subject"))     errs["apt-subject"]="Required";
      if (!val("apt-purpose"))     errs["apt-purpose"]="Required";
      const errMap = {parishioner:"apt-parishioner",contact:"apt-contact",sacrament:"apt-sacrament",subject:"apt-subject",purpose:"apt-purpose"};
      let hasErr=false;
      Object.entries(errMap).forEach(([k,id])=>{
        document.getElementById(`err-apt-${k}`).textContent=errs[id]||"";
        if(errs[id]) hasErr=true;
      });
      if(hasErr) return;
      const btn = document.getElementById("apt-form-submit");
      btn.disabled=true; btn.textContent="Submitting…";
      await new Promise(r=>setTimeout(r,700));
      S.appts.unshift({
        id:nextAid(), requestDate:todayISO(), status:"pending",
        parishioner:val("apt-parishioner"), contact:val("apt-contact"),
        email:document.getElementById("apt-email").value.trim(),
        sacramentType:val("apt-sacrament"), subjectName:val("apt-subject"),
        dateOfSacrament:document.getElementById("apt-dos").value,
        orNo:val("apt-orno"), purposeOf:val("apt-purpose"),
        staffNotes:document.getElementById("apt-notes").value.trim(),
        scheduledDate:"",
      });
      showToast("success","New appointment request submitted.");
      ap.tab="list"; ap.page=1; renderAppointments();
    };
  }
}

function showApptViewModal(id) {
  const a = S.appts.find(x=>x.id===id); if(!a) return;
  const rows = [["ID",a.id],["Parishioner",a.parishioner],["Contact",a.contact],["Email",a.email||"—"],
    ["Subject",a.subjectName],["Sacrament",a.sacramentType],["Date of Sacrament",fmt(a.dateOfSacrament)],
    ["Purpose",a.purposeOf],["OR No.",a.orNo||"—"],["Scheduled",a.scheduledDate?fmt(a.scheduledDate):"—"],
    ["Staff Notes",a.staffNotes||"—"]];
  const dlHTML = `<dl class="kv">${rows.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}<dt>Status</dt><dd>${apptBadge(a.status)}</dd></dl>`;
  const foot = `<button class="btn ghost" onclick="closeModal()">Close</button>
    ${a.status==="pending"?`<button class="btn btn-primary" id="modal-verify-btn">Verify</button>`:""}`;
  openModal(a.id, dlHTML, foot);
  document.getElementById("modal-verify-btn")?.addEventListener("click",()=>{closeModal(); showApptVerifyModal(id);});
}

function showApptVerifyModal(id) {
  const a = S.appts.find(x=>x.id===id); if(!a) return;
  const bodyHTML = `
    <div class="mini-summary"><strong>${esc(a.id)}</strong> — ${esc(a.subjectName)} (${esc(a.sacramentType)})</div>
    <div style="margin-top:12px"><label class="fl">Staff Notes</label><textarea class="ft" id="verify-note" rows="3" placeholder="Verification notes, book volume/page…"></textarea></div>`;
  openModal("Verify Appointment", bodyHTML, `<button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn btn-primary" id="do-verify-btn">Mark Verified</button>`);
  const _do_verify_btn = document.getElementById("do-verify-btn"); if (_do_verify_btn) _do_verify_btn.onclick = () => {;
    const note = document.getElementById("verify-note").value.trim();
    S.appts = S.appts.map(x=>x.id===id?{...x,status:"verified",staffNotes:note||x.staffNotes}:x);
    showToast("success",`Appointment ${id} verified.`);
    closeModal(); renderAppointments();
  };
}

function showApptScheduleModal(id) {
  const a = S.appts.find(x=>x.id===id); if(!a) return;
  const bodyHTML = `
    <div class="mini-summary"><strong>${esc(a.id)}</strong> — ${esc(a.subjectName)} (${esc(a.sacramentType)})</div>
    <div style="margin-top:12px"><label class="fl">Scheduled Date <span class="req">*</span></label><input class="fi" type="date" id="sched-date" min="${todayISO()}"></div>
    <div style="margin-top:10px"><label class="fl">Staff Notes</label><textarea class="ft" id="sched-note" rows="3" placeholder="Confirmation notes…"></textarea></div>`;
  openModal("Schedule Appointment", bodyHTML, `<button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn btn-primary" id="do-sched-btn">Confirm Schedule</button>`);
  const _do_sched_btn = document.getElementById("do-sched-btn"); if (_do_sched_btn) _do_sched_btn.onclick = () => {;
    const date = document.getElementById("sched-date").value;
    if (!date) { alert("Please select a date."); return; }
    const note = document.getElementById("sched-note").value.trim();
    S.appts = S.appts.map(x=>x.id===id?{...x,status:"scheduled",scheduledDate:date,staffNotes:note||x.staffNotes}:x);
    showToast("success",`Appointment ${id} scheduled for ${fmt(date)}.`);
    closeModal(); renderAppointments();
  };
}

/* ─── MARRIAGE DETAILS MODAL (Form 97) ─────────────────────── */
function showMarriageModal(id) {
  const a = S.appts.find(x=>x.id===id);
  const title = a ? `Marriage Details — ${a.subjectName}` : "Marriage Details";
  const bodyHTML = marriageFormHTML();
  openModal(title, bodyHTML, `<button class="btn ghost" onclick="closeModal()">Close</button><button class="btn btn-primary" onclick="closeModal();showToast('success','Marriage details saved.')">Save Details</button>`, {maxW:820});
  // Collapsible sections
  document.querySelectorAll("#modal-body .section-head").forEach(btn => {
    btn.onclick = () => {
      const body = btn.nextElementSibling;
      const open = body.style.display !== "none";
      body.style.display = open ? "none" : "";
      btn.querySelector(".chev").textContent = open ? "▶" : "▼";
    };
  });
}

function marriageFormHTML() {
  function fi(id,ph,label,req) {
    return `<div><label class="fl">${label}${req?` <span class="req">*</span>`:""}</label><input class="fi" id="${id}" placeholder="${ph}"></div>`;
  }
  function personFields(prefix) {
    return `
      <div class="g2">${fi(`${prefix}-fname`,"First name","First Name")}<div><label class="fl">Middle Name</label><input class="fi" id="${prefix}-mname" placeholder="Middle name"></div></div>
      ${fi(`${prefix}-lname`,"Last name","Last Name")}
      <div class="g3">
        ${fi(`${prefix}-dob`,"","Date of Birth")}
        ${fi(`${prefix}-age`,"Age","Age")}
        ${fi(`${prefix}-pob`,"Province/City","Place of Birth")}
      </div>
      <div class="g2">
        ${fi(`${prefix}-citizenship`,"e.g., Filipino","Citizenship")}
        ${fi(`${prefix}-religion`,"e.g., Roman Catholic","Religion")}
      </div>
      ${fi(`${prefix}-residence`,"Complete address","Residence")}
      ${fi(`${prefix}-civilstatus`,"e.g., Single","Civil Status")}
      <div class="g2">
        ${fi(`${prefix}-father`,"Father's full name","Father's Name")}
        ${fi(`${prefix}-father-cit`,"Citizenship","Father's Citizenship")}
      </div>
      <div class="g2">
        ${fi(`${prefix}-mother`,"Mother's maiden name","Mother's Name")}
        ${fi(`${prefix}-mother-cit`,"Citizenship","Mother's Citizenship")}
      </div>`;
  }

  function section(title, content, open=true) {
    return `<div class="section-block">
      <button type="button" class="section-head">
        ${title} <span class="chev">${open?"▼":"▶"}</span>
      </button>
      <div class="section-body" style="display:${open?"":"none"}">${content}</div>
    </div>`;
  }

  return `<form id="marriage-form" novalidate>
    ${section("1. Registry Info", `
      <div class="g3">
        ${fi("reg-province","Province","Province")}
        ${fi("reg-city","City/Municipality","City / Municipality")}
        ${fi("reg-no","Registry No.","Registry No.")}
      </div>`)}

    ${section("2. Husband's Information", `
      <div class="two-col-people">
        <div><div class="person-col-head">Husband</div>${personFields("h")}</div>
        <div><div class="person-col-head">Wife</div>${personFields("w")}</div>
      </div>`, false)}

    ${section("3. Consent / Advice (if minor)", `
      <div class="g2">
        ${fi("consent-name","Full name","Name")}
        ${fi("consent-rel","e.g., Parent, Guardian","Relationship")}
      </div>
      ${fi("consent-res","Complete address","Residence")}`, false)}

    ${section("4. Marriage Details", `
      <div class="g2">
        ${fi("mar-place","Church / venue, municipality, province","Place of Marriage")}
        ${fi("mar-date","","Date of Marriage")}
      </div>
      ${fi("mar-time","e.g., 10:00 AM","Time")}`)}

    ${section("5. Solemnizing Officer & License", `
      <div class="g2">
        ${fi("sol-name","Full name","Solemnizing Officer")}
        ${fi("sol-pos","Position / Designation","Position")}
      </div>
      <div class="g2">
        ${fi("sol-religion","Religion / Registry No.","Religion / Registry No.")}
        ${fi("lic-no","License number","Marriage License No.")}
      </div>
      <div class="g2">
        ${fi("lic-issued","","Issued On (date)")}
        ${fi("lic-at","Place issued","Issued At")}
      </div>
      <label class="fl" style="margin-top:4px">Or basis (if no license)</label>
      <div>
        <label class="radio-line"><input type="radio" name="lic-basis" value="art34"> Art. 34 — No license required (5-year cohabitation)</label>
        <label class="radio-line"><input type="radio" name="lic-basis" value="pd1083"> PD 1083 — Muslim rites</label>
      </div>`, false)}

    ${section("6. Witnesses", `
      <div id="witness-list">
        ${[1,2,3,4].map(i=>`<div class="witness-row"><input class="fi" placeholder="Witness ${i} — Full name" id="wit-${i}"></div>`).join("")}
      </div>`, false)}

    ${section("7. Affidavit of Solemnizing Officer (optional)", `
      <label class="radio-line"><input type="checkbox" id="aff-sol-toggle"> Include this affidavit</label>
      <div id="aff-sol-body" style="display:none;margin-top:8px">
        <div class="g2">
          ${fi("affso-officer","Officer full name","Officer Name")}
          ${fi("affso-addr","Complete address","Officer Address")}
        </div>
        <div class="g2">
          ${fi("affso-h","Husband full name","Husband")}
          ${fi("affso-w","Wife full name","Wife")}
        </div>
        <label class="fl">Circumstance</label>
        <div>
          <label class="radio-line"><input type="radio" name="affso-circ" value="articulo"> Articulo mortis</label>
          <label class="radio-line"><input type="radio" name="affso-circ" value="transport"> No transportation available</label>
          <label class="radio-line"><input type="radio" name="affso-circ" value="muslim"> Muslim / ethnic community rites</label>
        </div>
        <div class="g2">
          ${fi("affso-date","","Date Signed")}
          ${fi("affso-place","Place signed","Place Signed")}
        </div>
      </div>`, false)}

    ${section("8. Affidavit for Delayed Registration (optional)", `
      <label class="radio-line"><input type="checkbox" id="aff-del-toggle"> Include this affidavit</label>
      <div id="aff-del-body" style="display:none;margin-top:8px">
        ${fi("affd-name","Applicant full name","Applicant Name")}
        <div class="g2">
          ${fi("affd-cs","Civil status","Civil Status")}
          ${fi("affd-res","Complete address","Residence")}
        </div>
        ${fi("affd-spouse","Spouse full name","Spouse Name")}
        <div class="g2">
          ${fi("affd-mardate","","Marriage Date")}
          ${fi("affd-marplace","Place","Marriage Place")}
        </div>
        ${fi("affd-reason","Reason for delayed registration","Reason for Delay")}
        <div class="g2">
          ${fi("affd-sigdate","","Date Signed")}
          ${fi("affd-sigplace","Place signed","Place Signed")}
        </div>
      </div>`, false)}
  </form>`;
}

/* ═══════════════════════════════════════════════════════════
   CERTIFICATES
══════════════════════════════════════════════════════════════ */
function renderCertificates() {
  const main = document.getElementById("main-content");
  const cr = S.crt;
  const pendingCount = S.certReqs.filter(r=>r.status==="pending").length;

  const tabBtns = [
    {k:"requests",label:"Certificate Requests",count:pendingCount},
    {k:"new",label:"New Request"},
    {k:"print",label:"Print Certificate"},
  ].map(t=>`<button class="tab${cr.tab===t.k?" active":""}" data-cert-tab="${t.k}">${t.label}${t.count>0?`<span class="pill">${t.count}</span>`:""}</button>`).join("");

  let body = "";

  if (cr.tab === "requests") {
    const filtered = tableFilter(S.certReqs, ["id","parishioner","subjectName","sacramentType","status"],
      cr.search, cr.sf, cr.sv, cr.sortF, cr.sortD);
    const { rows, total, page } = tablePaged(filtered, cr.page);
    cr.page = page;

    const rowsHTML = rows.length ? rows.map((r,i)=>`<tr class="${i%2===1?"zebra":""} hoverable" data-cert-view="${r.id}">
      <td class="mono">${esc(r.id)}</td>
      <td style="font-weight:500">${esc(r.parishioner)}</td>
      <td>${esc(r.subjectName)}</td>
      <td>${typeTag(r.sacramentType)}</td>
      <td class="muted">${fmtShort(r.requestDate)}</td>
      <td>${certBadge(r.status)}</td>
      <td class="right">
        <button class="btn ghost sm" data-cert-view="${r.id}" style="margin-right:4px">View</button>
        ${r.status==="pending"?`<button class="btn btn-outline sm" data-cert-process="${r.id}">Process</button>`:""}
        ${r.status==="processing"?`<button class="btn btn-outline sm" data-cert-ready="${r.id}">Mark Ready</button>`:""}
        ${r.status==="ready"?`<button class="btn btn-primary sm" data-cert-release="${r.id}">Release</button>`:""}
      </td>
    </tr>`).join("") : `<tr><td colspan="7" class="empty">No certificate requests found.</td></tr>`;

    body = `<div class="card">
      <div class="tbl-filters">
        <input type="search" class="fi" placeholder="Search…" id="cert-search" value="${esc(cr.search)}" style="width:220px">
        <select class="fs" id="cert-status-filter" style="width:155px">
          <option value="">All Statuses</option>
          ${Object.entries(CERT_STATUS_CFG).map(([k,v])=>`<option value="${k}"${cr.sf==="status"&&cr.sv===k?" selected":""}>${v.label}</option>`).join("")}
        </select>
        <select class="fs" id="cert-type-filter" style="width:180px">
          <option value="">All Types</option>
          ${SACR_LIST.map(s=>`<option value="${s}"${cr.sf==="sacramentType"&&cr.sv===s?" selected":""}>${esc(s)}</option>`).join("")}
        </select>
        ${(cr.search||cr.sv)?`<button class="btn ghost sm" id="cert-clear-filter">Clear</button>`:""}
      </div>
      <div class="tbl-wrap">
        <table class="tbl">
          <thead><tr>
            <th>Ref. No.</th>
            ${sortTh("Parishioner","parishioner",cr.sortF,cr.sortD)}
            <th>Subject Name</th><th>Certificate Type</th>
            ${sortTh("Requested","requestDate",cr.sortF,cr.sortD)}
            ${sortTh("Status","status",cr.sortF,cr.sortD)}
            <th class="right">Actions</th>
          </tr></thead>
          <tbody>${rowsHTML}</tbody>
        </table>
      </div>
      <div class="tbl-foot">
        <span class="count">Showing ${rows.length} of ${filtered.length}</span>
        ${paginatorHTML(page, total)}
      </div>
    </div>`;
  }

  else if (cr.tab === "new") {
    body = `<div class="card" style="max-width:680px">
      <div class="card-head"><div><div class="title">New Certificate Request</div><div class="sub">Submit a request for a sacramental certificate</div></div></div>
      <form id="new-cert-form" novalidate class="form">
        <div class="g2">
          <div><label class="fl">Parishioner Name <span class="req">*</span></label><input class="fi" id="cr-parishioner" placeholder="Full name"><p class="field-err" id="err-cr-parishioner"></p></div>
          <div><label class="fl">Contact Number <span class="req">*</span></label><input class="fi" id="cr-contact" placeholder="09XX-XXX-XXXX"><p class="field-err" id="err-cr-contact"></p></div>
        </div>
        <div><label class="fl">Email Address</label><input class="fi" type="email" id="cr-email" placeholder="email@example.com"></div>
        <div>
          <label class="fl">Certificate / Sacrament Type <span class="req">*</span></label>
          <select class="fs" id="cr-sacrament">
            <option value="" disabled selected>Select type…</option>
            ${SACR_LIST.map(s=>`<option value="${s}">${esc(s)}</option>`).join("")}
          </select>
          <p class="field-err" id="err-cr-sacrament"></p>
        </div>
        <div><label class="fl">Subject Name <span class="req">*</span></label><input class="fi" id="cr-subject" placeholder="Name as it appears in the register"><p class="field-err" id="err-cr-subject"></p></div>
        <div class="g2">
          <div><label class="fl">Date of Sacrament</label><input class="fi" type="date" id="cr-dos"></div>
          <div><label class="fl">OR No. (Official Receipt)</label><input class="fi" id="cr-orno" placeholder="e.g., OR-2026-0001"></div>
        </div>
        <div><label class="fl">Purpose of Request <span class="req">*</span></label><input class="fi" id="cr-purpose" placeholder="e.g., School enrollment, employment…"><p class="field-err" id="err-cr-purpose"></p></div>
        <div class="divider"></div>
        <div class="form-actions">
          <button type="button" class="btn ghost" id="cr-form-clear">Clear</button>
          <button type="submit" class="btn btn-primary" id="cr-form-submit">Submit Request</button>
        </div>
      </form>
    </div>`;
  }

  else if (cr.tab === "print") {
    const printable = S.appts.filter(a=>["completed","scheduled","verified"].includes(a.status));
    const fp = cr.printSearch ? printable.filter(a=>`${a.subjectName} ${a.parishioner} ${a.id} ${a.sacramentType}`.toLowerCase().includes(cr.printSearch.toLowerCase())) : printable;
    const sel = cr.printSel;

    const listItems = fp.map(a=>`
      <button class="print-list-item${sel&&sel.id===a.id?" active":""}" data-print-sel="${a.id}">
        <div class="n">${esc(a.subjectName)}</div>
        <div class="m">${esc(a.id)} &bull; ${esc(a.sacramentType)}</div>
        <div class="m">${esc(a.parishioner)} &bull; ${fmtShort(a.requestDate)}</div>
      </button>`).join("") || `<p style="padding:24px;text-align:center;font-size:13px;color:var(--muted)">No printable records.</p>`;

    const previewHTML = sel ? certPreviewHTML(sel) : `<div style="padding:40px;text-align:center;color:var(--muted);font-size:13px">Select a record on the left to preview the certificate.</div>`;

    body = `<div class="print-grid">
      <div class="card">
        <div style="padding:8px 12px;border-bottom:1px solid var(--border)">
          <input type="search" class="fi" id="print-search" placeholder="Search records…" value="${esc(cr.printSearch)}">
        </div>
        <div style="max-height:480px;overflow-y:auto">${listItems}</div>
      </div>
      <div class="card">
        <div class="card-head">
          <div class="title">Preview</div>
          ${sel?`<button class="btn btn-primary sm" id="do-print-btn">Print Certificate</button>`:""}
        </div>
        <div class="preview-pad">${previewHTML}</div>
      </div>
    </div>`;
  }

  main.innerHTML = `
    <div class="page-head"><h1 class="page-title">Certificates</h1></div>
    <div class="tabs">${tabBtns}</div>
    ${body}`;

  // Bind tabs
  document.querySelectorAll("[data-cert-tab]").forEach(b => {
    b.onclick = () => { cr.tab=b.dataset.certTab; cr.page=1; renderCertificates(); };
  });

  if (cr.tab === "requests") {
    document.getElementById("cert-search").oninput = e => { cr.search=e.target.value; cr.page=1; renderCertificates(); };
    document.getElementById("cert-status-filter").onchange = e => {
      if (e.target.value) { cr.sf="status"; cr.sv=e.target.value; } else { cr.sf=""; cr.sv=""; }
      cr.page=1; renderCertificates();
    };
    document.getElementById("cert-type-filter").onchange = e => {
      if (e.target.value) { cr.sf="sacramentType"; cr.sv=e.target.value; } else { cr.sf=""; cr.sv=""; }
      cr.page=1; renderCertificates();
    };
    const _cert_clear_filter = document.getElementById("cert-clear-filter"); if (_cert_clear_filter) _cert_clear_filter.onclick = () => { cr.search=""; cr.sf=""; cr.sv=""; cr.page=1; renderCertificates(); };
    document.querySelectorAll(".tbl th.sortable[data-sort]").forEach(th => {
      th.onclick = () => {
        if (cr.sortF===th.dataset.sort) cr.sortD=cr.sortD==="asc"?"desc":"asc";
        else { cr.sortF=th.dataset.sort; cr.sortD="asc"; }
        cr.page=1; renderCertificates();
      };
    });
    document.querySelectorAll(".pager [data-pg]").forEach(b => {
      b.onclick = () => { cr.page=Number(b.dataset.pg); renderCertificates(); };
    });
    document.querySelectorAll("[data-cert-view]").forEach(el => {
      el.onclick = () => showCertViewModal(el.dataset.certView);
    });
    document.querySelectorAll("[data-cert-process]").forEach(b => {
      b.onclick = e => { e.stopPropagation(); showCertProcessModal(b.dataset.certProcess); };
    });
    document.querySelectorAll("[data-cert-ready]").forEach(b => {
      b.onclick = e => {
        e.stopPropagation();
        S.certReqs = S.certReqs.map(r=>r.id===b.dataset.certReady?{...r,status:"ready"}:r);
        showToast("success",`${b.dataset.certReady} marked ready.`);
        renderCertificates();
      };
    });
    document.querySelectorAll("[data-cert-release]").forEach(b => {
      b.onclick = e => {
        e.stopPropagation();
        S.certReqs = S.certReqs.map(r=>r.id===b.dataset.certRelease?{...r,status:"released",claimedDate:todayISO()}:r);
        showToast("success",`${b.dataset.certRelease} released.`);
        renderCertificates();
      };
    });
  }

  else if (cr.tab === "new") {
    const _cr_form_clear = document.getElementById("cr-form-clear"); if (_cr_form_clear) _cr_form_clear.onclick = () => {;
      document.getElementById("new-cert-form").reset();
      ["parishioner","contact","sacrament","subject","purpose"].forEach(k=>{
        document.getElementById(`err-cr-${k}`).textContent="";
      });
    };
    document.getElementById("new-cert-form").onsubmit = async e => {
      e.preventDefault();
      const val = id => document.getElementById(id).value.trim();
      const errs = {};
      if (!val("cr-parishioner")) errs.parishioner="Required";
      if (!val("cr-contact"))     errs.contact="Required";
      if (!val("cr-sacrament"))   errs.sacrament="Required";
      if (!val("cr-subject"))     errs.subject="Required";
      if (!val("cr-purpose"))     errs.purpose="Required";
      let hasErr=false;
      ["parishioner","contact","sacrament","subject","purpose"].forEach(k=>{
        document.getElementById(`err-cr-${k}`).textContent=errs[k]||"";
        if(errs[k]) hasErr=true;
      });
      if(hasErr) return;
      const btn = document.getElementById("cr-form-submit");
      btn.disabled=true; btn.textContent="Submitting…";
      await new Promise(r=>setTimeout(r,700));
      const newR = {
        id:nextCrid(), requestDate:todayISO(), status:"pending",
        parishioner:val("cr-parishioner"), contact:val("cr-contact"),
        email:document.getElementById("cr-email").value.trim(),
        sacramentType:val("cr-sacrament"), subjectName:val("cr-subject"),
        dateOfSacrament:document.getElementById("cr-dos").value,
        orNo:val("cr-orno"), purposeOf:val("cr-purpose"),
        staffNotes:"", claimedDate:"",
      };
      S.certReqs.unshift(newR);
      showToast("success",`Certificate request ${newR.id} submitted.`);
      cr.tab="requests"; cr.page=1; renderCertificates();
    };
  }

  else if (cr.tab === "print") {
    document.getElementById("print-search").oninput = e => { cr.printSearch=e.target.value; renderCertificates(); };
    document.querySelectorAll("[data-print-sel]").forEach(b => {
      b.onclick = () => {
        cr.printSel = S.appts.find(a=>a.id===b.dataset.printSel)||null;
        renderCertificates();
      };
    });
    const _do_print_btn = document.getElementById("do-print-btn"); if (_do_print_btn) _do_print_btn.onclick = () => {;
      if (!cr.printSel) return;
      doPrintCert(cr.printSel);
    };
  }
}

function showCertViewModal(id) {
  const r = S.certReqs.find(x=>x.id===id); if(!r) return;
  const rows = [["ID",r.id],["Parishioner",r.parishioner],["Contact",r.contact],["Email",r.email||"—"],
    ["Subject",r.subjectName],["Cert. Type",r.sacramentType],["Date of Sacrament",fmt(r.dateOfSacrament)],
    ["Purpose",r.purposeOf],["OR No.",r.orNo||"—"],["Staff Notes",r.staffNotes||"—"],
    ["Date Claimed",r.claimedDate?fmt(r.claimedDate):"—"]];
  const dlHTML = `<dl class="kv">${rows.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}<dt>Status</dt><dd>${certBadge(r.status)}</dd></dl>`;
  openModal(r.id, dlHTML, `<button class="btn ghost" onclick="closeModal()">Close</button>${r.status==="pending"?`<button class="btn btn-primary" id="modal-process-btn">Process</button>`:""}`);
  document.getElementById("modal-process-btn")?.addEventListener("click",()=>{ closeModal(); showCertProcessModal(id); });
}

function showCertProcessModal(id) {
  const r = S.certReqs.find(x=>x.id===id); if(!r) return;
  const body = `<div class="mini-summary"><strong>${esc(r.id)}</strong> — ${esc(r.subjectName)} (${esc(r.sacramentType)})${r.orNo?`<div style="font-size:11px;color:var(--muted);margin-top:3px">OR No.: ${esc(r.orNo)}</div>`:""}</div>
    <div style="margin-top:12px"><label class="fl">Staff Notes</label><textarea class="ft" id="proc-note" rows="3" placeholder="Book volume, page number, verification notes…"></textarea></div>`;
  openModal("Process Certificate Request", body, `<button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn btn-primary" id="do-proc-btn">Mark as Processing</button>`);
  const _do_proc_btn = document.getElementById("do-proc-btn"); if (_do_proc_btn) _do_proc_btn.onclick = () => {;
    const note = document.getElementById("proc-note").value.trim();
    S.certReqs = S.certReqs.map(x=>x.id===id?{...x,status:"processing",staffNotes:note||x.staffNotes}:x);
    showToast("success",`${id} is now Processing.`);
    closeModal(); renderCertificates();
  };
}

/* ─── CERTIFICATE PREVIEW (on-screen) ─────────────────────── */
function certPreviewHTML(a) {
  const s = SACR[a.sacramentType] || { col:"var(--muted)", light:"var(--bg)" };
  return `<div style="border:1px solid var(--border);border-radius:8px;overflow:hidden">
    <div style="background:#1A1400;padding:20px 24px;text-align:center;color:#fff">
      <img src="${LOGO}" alt="PdSPA" style="width:40px;height:40px;object-fit:contain;margin-bottom:8px;display:block;margin-left:auto;margin-right:auto">
      <div style="font-size:13px;font-weight:700">Parroquia de San Pedro Apostol</div>
      <div style="font-size:11px;opacity:.7;margin-top:2px">Diocese of Daet &bull; Vinzons, Camarines Norte</div>
    </div>
    <div style="padding:20px 24px">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:${s.col};margin-bottom:6px">Certificate of ${esc(a.sacramentType)}</div>
      <p style="font-size:11px;color:var(--muted);margin-bottom:6px">This is to certify that</p>
      <div style="font-size:18px;font-weight:800;color:var(--text);border-bottom:1px solid var(--border);padding-bottom:8px;margin-bottom:12px">${esc(a.subjectName)}</div>
      <p style="font-size:12px;color:var(--sub);line-height:1.7;margin-bottom:16px">
        ${esc(a.sacramentType)} sacrament recorded in the register of this Parish.
        ${a.dateOfSacrament?`Dated <strong>${fmt(a.dateOfSacrament)}</strong>.`:""}
      </p>
      <div style="display:flex;gap:20px;padding:10px 14px;background:var(--bg);border:1px solid var(--border);border-radius:6px;margin-bottom:16px">
        <div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em">Cert. No.</div><div style="font-size:12px;font-weight:600;color:var(--text)">${esc(a.id)}</div></div>
        <div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em">Issued</div><div style="font-size:12px;font-weight:600;color:var(--text)">${fmt(todayISO())}</div></div>
        ${a.dateOfSacrament?`<div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em">Date of Sacrament</div><div style="font-size:12px;font-weight:600;color:var(--text)">${fmt(a.dateOfSacrament)}</div></div>`:""}
      </div>
      <div style="display:flex;justify-content:space-around;padding-top:16px;border-top:1px solid var(--border)">
        <div style="text-align:center"><div style="height:20px;border-bottom:1px solid var(--text);margin:0 12px 6px"></div><div style="font-size:11px;font-weight:700;color:var(--text)">PARISH PRIEST / PAROCHIAL VICAR</div></div>
      </div>
    </div>
  </div>`;
}

/* ─── PRINT CERTIFICATE (type-specific templates) ───────────── */
function doPrintCert(a) {
  const w = window.open("","_blank","width=860,height=720");
  if (!w) { showToast("error","Allow pop-ups to print."); return; }
  const html = buildPrintHTML(a);
  w.document.write(html);
  w.document.close();
  showToast("success",`Certificate for ${a.subjectName} sent to printer.`);
}

function buildPrintHTML(a) {
  const issued = fmt(todayISO());
  const logoTag = `<img src="../assets/logo.png" alt="Parish Seal" style="width:70px;height:70px;object-fit:contain">`;

  const base = (title, body) => `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Inter',sans-serif;background:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
      .cert{width:680px;padding:28px 36px;border:4px double #1A1400;position:relative}
      .cert-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
      .cert-crests{display:flex;align-items:center;gap:12px}
      .cert-center{flex:1;text-align:center;padding:0 10px}
      .cert-center .diocese{font-size:11px;letter-spacing:.04em;color:#555;margin-bottom:2px}
      .cert-center .parish{font-size:15px;font-weight:800;color:#1A1400;letter-spacing:.02em;line-height:1.2}
      .cert-center .address{font-size:10px;color:#666;margin-top:3px}
      .cert-title{text-align:center;font-size:18px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#1A1400;margin:14px 0 18px;border-top:1px solid #ccc;border-bottom:1px solid #ccc;padding:8px 0}
      .cert-body{font-size:12.5px;line-height:1.9;color:#1A1400}
      .cert-body p{margin-bottom:10px}
      .cert-body strong{font-weight:700}
      .cert-line{border-bottom:1px solid #333;display:inline-block;min-width:160px;vertical-align:bottom}
      .cert-footer{margin-top:28px;display:flex;justify-content:space-between;align-items:flex-end}
      .cert-footer .by{font-size:11px;color:#555}
      .sig-block{text-align:center}
      .sig-block .line{border-top:1px solid #333;padding-top:5px;margin-top:32px;width:200px}
      .sig-block .name{font-size:11px;font-weight:700}
      .nb{font-size:9.5px;color:#666;text-align:center;margin-top:16px;font-style:italic}
      .two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px}
      .two-col .head{font-weight:700;text-decoration:underline;margin-bottom:6px}
      @media print{body{padding:0}@page{size:A4 portrait;margin:14mm}}
    </style></head><body>
    <div class="cert">
      <div class="cert-header">
        <div>${logoTag}</div>
        <div class="cert-center">
          <div class="diocese">Diocese of Daet</div>
          <div class="parish">PARROQUIA DE SAN PEDRO APOSTOL</div>
          <div class="address">Anacleto Guinto Street, Brgy. 3, Vinzons, Camarines Norte</div>
        </div>
        <div style="width:70px"></div>
      </div>
      <div class="cert-title">${title}</div>
      <div class="cert-body">${body}</div>
      <div class="nb">N.B. Any mark or alteration of any kind invalidates this certificate.</div>
      <div class="cert-footer">
        <div class="by"><span>by: ___________________________</span></div>
        ${logoTag}
        <div class="sig-block"><div class="line"><div class="name">Parish Priest / Parochial Vicar</div></div></div>
      </div>
    </div>
    <script>window.onload=()=>window.print()<\/script></body></html>`;

  const line = (w=200) => `<span class="cert-line" style="min-width:${w}px">&nbsp;</span>`;

  switch (a.sacramentType) {

    case "Baptismal": return base("Certificate of Baptism",`
      <p style="text-align:center;font-size:15px;font-weight:700">${esc(a.subjectName)}</p>
      <p>Child of ${line(180)} (Father's Name) &nbsp; Of ${line(160)} (Place of Birth)</p>
      <p>And ${line(200)} (Mother's Name) &nbsp; Of ${line(160)} (Place of Birth)</p>
      <p>Was Born in ${line(200)} &nbsp; Legitimacy ${line(120)}</p>
      <p>On the ${line(60)} day of ${line(140)} In the year ${line(80)}</p>
      <p style="text-align:center;font-style:italic;font-weight:700;font-size:14px;margin:8px 0">Was Solemnly Baptized</p>
      <p>On the ${line(60)} day of ${line(140)} in the year ${line(80)}</p>
      <p>By the Rev. ${line(240)}</p>
      <p>The sponsors being ${line(200)} and ${line(200)}</p>
      <p>As appear on Baptismal register no. ${line(60)} Page no. ${line(60)} Entry no. ${line(60)}</p>
      <p>This Certificate was given for the purpose of ${line(240)}</p>
      <p>Date Issued: <strong>${issued}</strong></p>`);

    case "Matrimony": {
      const parts = a.subjectName.split("&").map(s=>s.trim());
      const husb = parts[0]||a.subjectName, wife = parts[1]||"";
      return base("Certificate of Marriage",`
        <p style="text-align:center">This Certifies that</p>
        <div class="two-col" style="margin:12px 0">
          <div><div class="head">Husband</div>
            <p><strong>${esc(husb)}</strong></p>
            <p>Age / Status: ${line(150)}</p>
            <p>Native of: ${line(180)}</p>
            <p>Residence: ${line(180)}</p>
            <p>Father: ${line(200)}</p>
            <p>Mother: ${line(200)}</p>
          </div>
          <div><div class="head">Wife</div>
            <p><strong>${esc(wife)||line(200)}</strong></p>
            <p>Age / Status: ${line(150)}</p>
            <p>Native of: ${line(180)}</p>
            <p>Residence: ${line(180)}</p>
            <p>Father: ${line(200)}</p>
            <p>Mother: ${line(200)}</p>
          </div>
        </div>
        <p>Were united in <strong>HOLY MATRIMONY</strong> according to the rites of the Holy Roman Catholic on the ${line(60)} day of ${line(180)}.</p>
        <p>The Marriage was solemnized by ${line(240)}</p>
        <p>In the presence of ${line(180)} and ${line(180)}</p>
        <p>Residence of ${line(240)}</p>
        <p>Witness as appears from the Marriage Records of this Church.</p>
        <p>Book no. ${line(60)} Page no. ${line(60)} Entry no. ${line(60)}</p>
        <p>Date issued: <strong>${issued}</strong></p>`);
    }

    case "Burial/Death": return base("Certificate of Death",`
      <p>This is to certify that <strong>${esc(a.subjectName)}</strong>, a resident of ${line(200)}, husband/wife/son/daughter of ${line(200)},
      died on the ${line(60)} day of ${line(140)} at the age of ${line(60)}, and was buried in the Roman Catholic Cemetery of this Parish
      on the ${line(60)} day of ${line(140)}. The cause of death was ${line(240)}.
      He/She received the last Sacrament of confession, Extreme Unction and Holy Viaticum before death <em>or</em> he/she was not able to receive any Sacrament before death.</p>
      <p>This is a true copy of the original record as it appears in the Register of Dead of this Parish, Book No. ${line(60)}, Year ${line(70)}, Page ${line(60)}, Line no. ${line(60)}.</p>
      <p>In witness whereof I affix my signature and put the seal of this Parroquia de San Pedro Apostol, Vinzons, Camarines Norte, on the ${line(60)} day of ${line(180)}.</p>`);

    case "Confirmation": return `<!DOCTYPE html><html><head><meta charset="UTF-8">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Inter',sans-serif;background:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
        .cert{width:660px;padding:28px 36px;border:4px double #1A1400}
        .cert-top{text-align:center;margin-bottom:16px}
        .cert-top .parish{font-size:15px;font-weight:800;color:#1A1400;letter-spacing:.02em}
        .cert-top .address{font-size:10px;color:#666;margin-top:3px}
        .cert-title{text-align:center;font-size:18px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#1A1400;margin:14px 0 18px;border-top:1px solid #ccc;border-bottom:1px solid #ccc;padding:8px 0}
        .cert-body{font-size:12.5px;line-height:2;color:#1A1400}
        .cert-line{border-bottom:1px solid #333;display:inline-block;min-width:160px;vertical-align:bottom}
        .cert-footer{margin-top:28px;display:flex;justify-content:space-between;align-items:flex-end}
        .sig-block{text-align:center}.sig-block .line{border-top:1px solid #333;padding-top:5px;margin-top:32px;width:200px}.sig-block .name{font-size:11px;font-weight:700}
        .nb{font-size:9.5px;color:#666;text-align:center;margin-top:16px;font-style:italic}
        @media print{body{padding:0}@page{size:A4 portrait;margin:14mm}}
      </style></head><body>
      <div class="cert">
        <div class="cert-top">
          <img src="../assets/logo.png" alt="Seal" style="width:70px;height:70px;object-fit:contain;display:block;margin:0 auto 10px">
          <div class="parish">PARROQUIA DE SAN PEDRO APOSTOL</div>
          <div class="address">Anacleto Guinto Street, Brgy. 3, Vinzons, Camarines Norte</div>
        </div>
        <div class="cert-title">Certificate of Confirmation</div>
        <div class="cert-body">
          <p>Name: <strong>${esc(a.subjectName)}</strong></p>
          <p>Age: ${line(120)}</p>
          <p>Father: ${line(240)}</p>
          <p>Mother: ${line(240)}</p>
          <p>Place of Baptism: ${line(240)}</p>
          <p>Date of Confirmation: <strong>${a.dateOfSacrament?fmt(a.dateOfSacrament):line(200)}</strong></p>
          <p>Minister: ${line(240)}</p>
          <p>Sponsor: ${line(240)}</p>
          <p>Book no. ${line(60)} Page no. ${line(60)} Entry no. ${line(60)} &nbsp; Remarks: ${line(160)}</p>
          <p>Date issued: <strong>${issued}</strong></p>
        </div>
        <div class="nb">N.B. Any mark or alteration of any kind invalidates this certificate.</div>
        <div class="cert-footer">
          <div style="font-size:11px;color:#555">by: ___________________________</div>
          <img src="../assets/logo.png" alt="Seal" style="width:50px;height:50px;object-fit:contain">
          <div class="sig-block"><div class="line"><div class="name">Parish Priest / Parochial Vicar</div></div></div>
        </div>
      </div>
      <script>window.onload=()=>window.print()<\/script></body></html>`;

    default: {
      const line2 = (w=200) => `<span style="border-bottom:1px solid #333;display:inline-block;min-width:${w}px;vertical-align:bottom">&nbsp;</span>`;
      return base(`Certificate of ${esc(a.sacramentType)}`,`
        <p>This is to certify that <strong>${esc(a.subjectName)}</strong>
        ${a.dateOfSacrament?`received the Sacrament of ${esc(a.sacramentType)} on <strong>${fmt(a.dateOfSacrament)}</strong>`:`is recognized by`}
        this Parish as recorded in the sacramental register.</p>
        <p>This certificate was issued upon the request of <strong>${esc(a.parishioner)}</strong>${a.purposeOf?` for the purpose of <strong>${esc(a.purposeOf)}</strong>`:""} on <strong>${issued}</strong>.</p>
        <p>Reference No.: ${esc(a.id)}</p>`);
    }
  }
}

/* ═══════════════════════════════════════════════════════════
   BOOK ENTRIES
══════════════════════════════════════════════════════════════ */
function renderBookEntries() {
  const main = document.getElementById("main-content");
  const bk = S.bk;
  const filtered = tableFilter(S.books, ["subjectName","sacramentType","minister"], bk.search, null, null, bk.sortF, bk.sortD);
  const { rows, total, page } = tablePaged(filtered, bk.page);
  bk.page = page;

  const rowsHTML = rows.length ? rows.map((b,i)=>`<tr class="${i%2===1?"zebra":""}">
    <td class="mono">${esc(b.id)}</td>
    <td style="font-weight:500">${esc(b.subjectName)}</td>
    <td>${typeTag(b.sacramentType)}</td>
    <td class="muted">${fmtShort(b.dateOfSacrament)}</td>
    <td style="font-weight:600;color:var(--primary)">${fmtShort(b.dateOfArrival)}</td>
    <td style="font-family:monospace;font-size:12px">Vol.${esc(b.volume)} / Pg.${esc(b.page)}</td>
    <td class="muted">${esc(b.minister)||"—"}</td>
  </tr>`).join("") : `<tr><td colspan="7" class="empty">No entries found.</td></tr>`;

  const formHTML = bk.showForm ? `<div class="card" style="margin-bottom:16px">
    <div class="card-head"><div><div class="title">Add Book Entry</div><div class="sub">Date of Arrival is required</div></div></div>
    <form id="new-bk-form" novalidate class="form">
      <div class="g2">
        <div>
          <label class="fl">Sacrament Type <span class="req">*</span></label>
          <select class="fs" id="bk-sacrament">
            <option value="" disabled selected>Select…</option>
            ${SACR_LIST.map(s=>`<option value="${s}">${esc(s)}</option>`).join("")}
          </select>
          <p class="field-err" id="err-bk-sacrament"></p>
        </div>
        <div><label class="fl">Subject Name <span class="req">*</span></label><input class="fi" id="bk-subject" placeholder="Name in register"><p class="field-err" id="err-bk-subject"></p></div>
      </div>
      <div class="g2">
        <div><label class="fl">Date of Sacrament</label><input class="fi" type="date" id="bk-dos"></div>
        <div><label class="fl">Date of Arrival <span class="req">*</span></label><input class="fi" type="date" id="bk-doa" value="${todayISO()}"><p class="field-err" id="err-bk-doa"></p></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 2fr;gap:12px">
        <div><label class="fl">Volume <span class="req">*</span></label><input class="fi" id="bk-volume" placeholder="e.g., 12"><p class="field-err" id="err-bk-volume"></p></div>
        <div><label class="fl">Page <span class="req">*</span></label><input class="fi" id="bk-page" placeholder="e.g., 34"><p class="field-err" id="err-bk-page"></p></div>
        <div><label class="fl">Minister</label><input class="fi" id="bk-minister" placeholder="e.g., Fr. Rene Tabios"></div>
      </div>
      <div><label class="fl">Remarks</label><textarea class="ft" id="bk-remarks" rows="2" placeholder="Parents, sponsors, witnesses…"></textarea></div>
      <div class="divider"></div>
      <div class="form-actions">
        <button type="button" class="btn ghost" id="bk-form-cancel">Cancel</button>
        <button type="submit" class="btn btn-primary" id="bk-form-submit">Save Entry</button>
      </div>
    </form>
  </div>` : "";

  main.innerHTML = `
    <div class="page-head row">
      <div><h1 class="page-title">Book Entries</h1><p class="page-sub">Sacramental register index</p></div>
      <button class="btn btn-primary sm" id="bk-toggle-form">${bk.showForm?"Cancel":"Add Entry"}</button>
    </div>
    ${formHTML}
    <div class="card">
      <div style="padding:8px 12px;border-bottom:1px solid var(--border)">
        <input type="search" class="fi" placeholder="Search entries…" id="bk-search" value="${esc(bk.search)}" style="width:260px">
      </div>
      <div class="tbl-wrap">
        <table class="tbl">
          <thead><tr>
            <th>ID</th>
            ${sortTh("Subject Name","subjectName",bk.sortF,bk.sortD)}
            <th>Sacrament</th>
            ${sortTh("Date of Sacrament","dateOfSacrament",bk.sortF,bk.sortD)}
            <th style="color:var(--primary)">Date of Arrival</th>
            <th>Vol. / Page</th>
            <th>Minister</th>
          </tr></thead>
          <tbody>${rowsHTML}</tbody>
        </table>
      </div>
      <div class="tbl-foot">
        <span class="count">${filtered.length} entries</span>
        ${paginatorHTML(page, total)}
      </div>
    </div>`;

  const _bk_toggle_form = document.getElementById("bk-toggle-form"); if (_bk_toggle_form) _bk_toggle_form.onclick = () => { bk.showForm=!bk.showForm; renderBookEntries(); };
  document.getElementById("bk-search").oninput = e => { bk.search=e.target.value; bk.page=1; renderBookEntries(); };
  document.querySelectorAll(".tbl th.sortable[data-sort]").forEach(th => {
    th.onclick = () => {
      if (bk.sortF===th.dataset.sort) bk.sortD=bk.sortD==="asc"?"desc":"asc";
      else { bk.sortF=th.dataset.sort; bk.sortD="asc"; }
      bk.page=1; renderBookEntries();
    };
  });
  document.querySelectorAll(".pager [data-pg]").forEach(b => {
    b.onclick = () => { bk.page=Number(b.dataset.pg); renderBookEntries(); };
  });

  if (bk.showForm) {
    const _bk_form_cancel = document.getElementById("bk-form-cancel"); if (_bk_form_cancel) _bk_form_cancel.onclick = () => { bk.showForm=false; renderBookEntries(); };
    document.getElementById("new-bk-form").onsubmit = async e => {
      e.preventDefault();
      const val = id => document.getElementById(id).value.trim();
      const errs = {};
      if (!val("bk-sacrament"))  errs.sacrament="Required";
      if (!val("bk-subject"))    errs.subject="Required";
      if (!document.getElementById("bk-doa").value) errs.doa="Required";
      if (!val("bk-volume"))     errs.volume="Required";
      if (!val("bk-page"))       errs.page="Required";
      let hasErr=false;
      ["sacrament","subject","doa","volume","page"].forEach(k=>{
        document.getElementById(`err-bk-${k}`).textContent=errs[k]||"";
        if(errs[k]) hasErr=true;
      });
      if(hasErr) return;
      const btn=document.getElementById("bk-form-submit");
      btn.disabled=true; btn.textContent="Saving…";
      await new Promise(r=>setTimeout(r,600));
      S.books.unshift({
        id: nextBkid(),
        sacramentType: val("bk-sacrament"),
        subjectName: val("bk-subject"),
        dateOfSacrament: document.getElementById("bk-dos").value,
        dateOfArrival: document.getElementById("bk-doa").value,
        volume: val("bk-volume"), page: val("bk-page"),
        minister: val("bk-minister"),
        remarks: document.getElementById("bk-remarks").value.trim(),
      });
      showToast("success",`Book entry for ${val("bk-subject")} added.`);
      bk.showForm=false; bk.page=1; renderBookEntries();
    };
  }
}

/* ═══════════════════════════════════════════════════════════
   FUNERAL / CAMPO SANTO
══════════════════════════════════════════════════════════════ */
function renderFuneral() {
  const main = document.getElementById("main-content");
  const fn = S.fn;
  const filtered = fn.search
    ? S.funerals.filter(r => r.deceasedName.toLowerCase().includes(fn.search.toLowerCase()) || r.nextOfKin.toLowerCase().includes(fn.search.toLowerCase()) || `${r.block}-${r.lot}`.includes(fn.search))
    : S.funerals;

  const rowsHTML = filtered.length ? filtered.map((r,i)=>`<tr class="${i%2===1?"zebra":""}">
    <td style="font-weight:600">${esc(r.deceasedName)}</td>
    <td class="muted">${fmtShort(r.dateOfDeath)}</td>
    <td class="muted">${fmtShort(r.dateOfBurial)}</td>
    <td><span style="font-weight:700;color:var(--primary)">Blk ${esc(r.block)}-${esc(r.lot)}</span> <span class="muted">(${esc(r.section)})</span></td>
    <td>${esc(r.nextOfKin)}</td>
    <td class="muted">${esc(r.contact)||"—"}</td>
    <td class="muted">${esc(r.notes)||"—"}</td>
  </tr>`).join("") : `<tr><td colspan="7" class="empty">No records found${fn.search?` for "${fn.search}"`:""}.</td></tr>`;

  const formHTML = fn.showForm ? `<div class="card" style="margin-bottom:16px">
    <div class="card-head"><div class="title">Add Burial Record</div></div>
    <form id="new-fn-form" novalidate class="form">
      <div><label class="fl">Deceased Name <span class="req">*</span></label><input class="fi" id="fn-name" placeholder="Full name"><p class="field-err" id="err-fn-name"></p></div>
      <div class="g2">
        <div><label class="fl">Date of Death</label><input class="fi" type="date" id="fn-dod"></div>
        <div><label class="fl">Date of Burial <span class="req">*</span></label><input class="fi" type="date" id="fn-dob"><p class="field-err" id="err-fn-dob"></p></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1.5fr;gap:12px">
        <div><label class="fl">Block <span class="req">*</span></label><input class="fi" id="fn-block" placeholder="A"><p class="field-err" id="err-fn-block"></p></div>
        <div><label class="fl">Lot <span class="req">*</span></label><input class="fi" id="fn-lot" placeholder="12"><p class="field-err" id="err-fn-lot"></p></div>
        <div>
          <label class="fl">Section</label>
          <select class="fs" id="fn-section">${["Nicho","Lawn","Ground","Wall Vault"].map(s=>`<option value="${s}">${s}</option>`).join("")}</select>
        </div>
      </div>
      <div class="g2">
        <div><label class="fl">Next of Kin <span class="req">*</span></label><input class="fi" id="fn-kin" placeholder="Full name"><p class="field-err" id="err-fn-kin"></p></div>
        <div><label class="fl">Contact</label><input class="fi" id="fn-contact" placeholder="09XX-XXX-XXXX"></div>
      </div>
      <div><label class="fl">Notes</label><textarea class="ft" id="fn-notes" rows="2"></textarea></div>
      <div class="divider"></div>
      <div class="form-actions">
        <button type="button" class="btn ghost" id="fn-form-cancel">Cancel</button>
        <button type="submit" class="btn btn-primary" id="fn-form-submit">Save Record</button>
      </div>
    </form>
  </div>` : "";

  main.innerHTML = `
    <div class="page-head row">
      <div><h1 class="page-title">Funeral / Campo Santo</h1><p class="page-sub">Cemetery records and lookup — PdSPA Campo Santo</p></div>
      <button class="btn btn-primary sm" id="fn-toggle-form">${fn.showForm?"Cancel":"Add Record"}</button>
    </div>
    <div class="card" style="margin-bottom:16px">
      <div style="padding:12px 16px;display:flex;align-items:center;gap:12px">
        <input type="search" class="fi" id="fn-search" placeholder='Search by name or block/lot…' value="${esc(fn.search)}" style="flex:1;font-size:14px">
        ${fn.search?`<button class="btn ghost sm" id="fn-clear-search">Clear</button>`:""}
      </div>
    </div>
    ${formHTML}
    <div class="card">
      <div class="tbl-wrap">
        <table class="tbl">
          <thead><tr>
            <th>Deceased Name</th><th>Date of Death</th><th>Date of Burial</th>
            <th>Location</th><th>Next of Kin</th><th>Contact</th><th>Notes</th>
          </tr></thead>
          <tbody>${rowsHTML}</tbody>
        </table>
      </div>
      <div style="padding:8px 12px;border-top:1px solid var(--border);background:var(--bg)">
        <span class="count">${filtered.length} records</span>
      </div>
    </div>`;

  const _fn_toggle_form = document.getElementById("fn-toggle-form"); if (_fn_toggle_form) _fn_toggle_form.onclick = () => { fn.showForm=!fn.showForm; renderFuneral(); };
  document.getElementById("fn-search").oninput = e => { fn.search=e.target.value; renderFuneral(); };
  const _fn_clear_search = document.getElementById("fn-clear-search"); if (_fn_clear_search) _fn_clear_search.onclick = () => { fn.search=""; renderFuneral(); };

  if (fn.showForm) {
    const _fn_form_cancel = document.getElementById("fn-form-cancel"); if (_fn_form_cancel) _fn_form_cancel.onclick = () => { fn.showForm=false; renderFuneral(); };
    document.getElementById("new-fn-form").onsubmit = async e => {
      e.preventDefault();
      const val = id => document.getElementById(id).value.trim();
      const errs = {};
      if (!val("fn-name"))  errs.name="Required";
      if (!document.getElementById("fn-dob").value) errs.dob="Required";
      if (!val("fn-block")) errs.block="Required";
      if (!val("fn-lot"))   errs.lot="Required";
      if (!val("fn-kin"))   errs.kin="Required";
      let hasErr=false;
      ["name","dob","block","lot","kin"].forEach(k=>{
        document.getElementById(`err-fn-${k}`).textContent=errs[k]||"";
        if(errs[k]) hasErr=true;
      });
      if(hasErr) return;
      const btn=document.getElementById("fn-form-submit");
      btn.disabled=true; btn.textContent="Saving…";
      await new Promise(r=>setTimeout(r,600));
      S.funerals.unshift({
        id: nextFnid(),
        deceasedName: val("fn-name"),
        dateOfDeath: document.getElementById("fn-dod").value,
        dateOfBurial: document.getElementById("fn-dob").value,
        block: val("fn-block"), lot: val("fn-lot"),
        section: val("fn-section"),
        nextOfKin: val("fn-kin"),
        contact: val("fn-contact"),
        notes: document.getElementById("fn-notes").value.trim(),
      });
      showToast("success",`Burial record for ${val("fn-name")} added.`);
      fn.showForm=false; renderFuneral();
    };
  }
}

/* ═══════════════════════════════════════════════════════════
   CALENDAR — Editable Activity Planner
══════════════════════════════════════════════════════════════ */
function renderCalendar() {
  const main = document.getElementById("main-content");
  const { year, month } = S.cal;
  const firstDay  = new Date(year, month, 1).getDay();
  const daysInMon = new Date(year, month+1, 0).getDate();
  const todayKey  = todayISO();

  // Build map: day → { appts, activities }
  const dayMap = {};
  S.appts.forEach(a => {
    const key = a.scheduledDate || a.requestDate; if (!key) return;
    const y=parseInt(key.slice(0,4)), mo=parseInt(key.slice(5,7))-1;
    if (y===year && mo===month) {
      const d=parseInt(key.slice(8,10));
      if (!dayMap[d]) dayMap[d]={appts:[],acts:[]};
      dayMap[d].appts.push(a);
    }
  });
  S.activities.forEach(a => {
    if (!a.date) return;
    const y=parseInt(a.date.slice(0,4)), mo=parseInt(a.date.slice(5,7))-1;
    if (y===year && mo===month) {
      const d=parseInt(a.date.slice(8,10));
      if (!dayMap[d]) dayMap[d]={appts:[],acts:[]};
      dayMap[d].acts.push(a);
    }
  });

  // Legend
  const legendHTML = Object.entries(ACTIVITY_CATS).map(([cat,cfg])=>`
    <div class="item"><div class="dot" style="background:${cfg.col}"></div>${esc(cat)}</div>`).join("")+
    SACR_LIST.filter(t=>S.appts.some(a=>a.sacramentType===t)).map(t=>`
    <div class="item"><div class="dot" style="background:${SACR[t].col}"></div>${esc(t)}</div>`).join("");

  // Calendar cells
  let cellsHTML = Array.from({length:firstDay}).map((_,i)=>`<div class="cal-cell empty" key="e${i}"></div>`).join("");

  for (let i=0; i<daysInMon; i++) {
    const day = i+1;
    const dayStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    const entry = dayMap[day] || {appts:[],acts:[]};
    const isToday = dayStr===todayKey;
    const hasItems = entry.appts.length+entry.acts.length > 0;

    const chips = [
      ...entry.acts.slice(0,2).map(a=>`<div class="cal-chip" style="background:${ACTIVITY_CATS[a.category]?.light||"#eee"};color:${ACTIVITY_CATS[a.category]?.col||"#555"}">${esc(a.category.split(" ")[0])}</div>`),
      ...entry.appts.slice(0, Math.max(0,2-entry.acts.length)).map(a=>`<div class="cal-chip" style="background:${SACR[a.sacramentType]?.light||"#eee"};color:${SACR[a.sacramentType]?.col||"#555"}">${esc(a.subjectName.split(" ")[0])}</div>`),
    ].join("");
    const more = entry.appts.length+entry.acts.length > 2 ? `<div class="cal-more">+${entry.appts.length+entry.acts.length-2}</div>` : "";

    cellsHTML += `<div class="cal-cell${isToday?" today":""}${hasItems?" clickable":""}" data-cal-day="${dayStr}">
      <div class="cal-daynum">${day}</div>
      ${chips}${more}
    </div>`;
  }

  main.innerHTML = `
    <div class="page-head row">
      <h1 class="page-title">Calendar of Activities</h1>
      <div style="display:flex;align-items:center;gap:8px">
        <button class="btn ghost sm" id="cal-prev">Prev</button>
        <span style="font-size:14px;font-weight:600;color:var(--text);min-width:140px;text-align:center">${MONTHS[month]} ${year}</span>
        <button class="btn ghost sm" id="cal-next">Next</button>
        <button class="btn btn-outline sm" id="cal-today">Today</button>
        <button class="btn btn-primary sm" id="cal-add-activity">+ Add Activity</button>
      </div>
    </div>
    <div class="card">
      <div class="cal-dow">${DAYS.map(d=>`<div>${d}</div>`).join("")}</div>
      <div class="cal-grid">${cellsHTML}</div>
      <div class="cal-legend">${legendHTML}</div>
    </div>`;

  const _cal_prev = document.getElementById("cal-prev"); if (_cal_prev) _cal_prev.onclick = () => {;
    if (S.cal.month===0){S.cal.month=11;S.cal.year--;}else S.cal.month--;
    renderCalendar();
  };
  const _cal_next = document.getElementById("cal-next"); if (_cal_next) _cal_next.onclick = () => {;
    if (S.cal.month===11){S.cal.month=0;S.cal.year++;}else S.cal.month++;
    renderCalendar();
  };
  const _cal_today = document.getElementById("cal-today"); if (_cal_today) _cal_today.onclick = () => {;
    S.cal.year=new Date().getFullYear(); S.cal.month=new Date().getMonth();
    renderCalendar();
  };
  const _cal_add_activity = document.getElementById("cal-add-activity"); if (_cal_add_activity) _cal_add_activity.onclick = () => showAddActivityModal(null);

  document.querySelectorAll("[data-cal-day]").forEach(cell => {
    cell.onclick = () => showDayDetailModal(cell.dataset.calDay);
  });
}

function showAddActivityModal(prefillDate) {
  const body = `<form id="act-form" novalidate class="form" style="gap:10px">
    <div>
      <label class="fl">Category <span class="req">*</span></label>
      <select class="fs" id="act-category">
        <option value="" disabled selected>Select category…</option>
        ${ACTIVITY_CAT_LIST.map(c=>`<option value="${c}">${esc(c)}</option>`).join("")}
      </select>
      <p class="field-err" id="err-act-category"></p>
    </div>
    <div><label class="fl">Title / Description <span class="req">*</span></label><input class="fi" id="act-title" placeholder="e.g., Barangay Mass — Brgy. 3"><p class="field-err" id="err-act-title"></p></div>
    <div class="g2">
      <div><label class="fl">Date <span class="req">*</span></label><input class="fi" type="date" id="act-date" value="${prefillDate||""}"><p class="field-err" id="err-act-date"></p></div>
      <div><label class="fl">Time (optional)</label><input class="fi" type="time" id="act-time"></div>
    </div>
    <div><label class="fl">Notes</label><textarea class="ft" id="act-notes" rows="2" placeholder="Additional details…"></textarea></div>
  </form>`;
  openModal("Add Activity", body,
    `<button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn btn-primary" id="do-add-act-btn">Save Activity</button>`);
  const _do_add_act_btn = document.getElementById("do-add-act-btn"); if (_do_add_act_btn) _do_add_act_btn.onclick = () => {;
    const cat  = document.getElementById("act-category").value;
    const title= document.getElementById("act-title").value.trim();
    const date = document.getElementById("act-date").value;
    const errs = {};
    if (!cat)   errs.category="Required";
    if (!title) errs.title="Required";
    if (!date)  errs.date="Required";
    let hasErr=false;
    ["category","title","date"].forEach(k=>{
      document.getElementById(`err-act-${k}`).textContent=errs[k]||"";
      if(errs[k]) hasErr=true;
    });
    if(hasErr) return;
    // format time display
    let timeDisplay = "";
    const rawTime = document.getElementById("act-time").value;
    if (rawTime) {
      const [h,m] = rawTime.split(":").map(Number);
      const ampm = h>=12?"PM":"AM";
      timeDisplay = `${h%12||12}:${String(m).padStart(2,"0")} ${ampm}`;
    }
    S.activities.push({
      id: nextActid(), category: cat, title, date,
      time: timeDisplay,
      notes: document.getElementById("act-notes").value.trim(),
    });
    showToast("success","Activity added.");
    closeModal(); renderCalendar();
  };
}

function showDayDetailModal(dateStr) {
  const y=parseInt(dateStr.slice(0,4)), mo=parseInt(dateStr.slice(5,7))-1, d=parseInt(dateStr.slice(8,10));
  const acts  = S.activities.filter(a=>a.date===dateStr);
  const appts = S.appts.filter(a=>(a.scheduledDate||a.requestDate)===dateStr);

  const actItems = acts.map(a=>`
    <div class="detail-item">
      <div>
        <div class="primary">${esc(a.title)}</div>
        <div class="secondary">${activityChip(a.category)}${a.time?` &bull; ${esc(a.time)}`:""}</div>
        ${a.notes?`<div class="secondary" style="margin-top:3px">${esc(a.notes)}</div>`:""}
      </div>
      <div style="display:flex;gap:4px;flex-shrink:0">
        <button class="btn ghost sm" data-edit-act="${a.id}">Edit</button>
        <button class="btn btn-danger sm" data-del-act="${a.id}">Delete</button>
      </div>
    </div>`).join("");

  const apptItems = appts.map(a=>`
    <div class="detail-item">
      <div>
        <div class="primary">${esc(a.subjectName)}</div>
        <div class="secondary">${esc(a.id)} &bull; ${esc(a.sacramentType)}</div>
      </div>
      ${apptBadge(a.status)}
    </div>`).join("");

  const body = `
    <div style="display:flex;flex-direction:column;gap:8px">
      ${acts.length?`<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);margin-bottom:2px">Activities</div>${actItems}`:""}
      ${appts.length?`<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);margin:${acts.length?8:0}px 0 2px">Appointments</div>${apptItems}`:""}
      ${!acts.length&&!appts.length?`<p style="color:var(--muted);text-align:center;padding:16px;font-size:13px">No items for this day.</p>`:""}
    </div>`;

  openModal(fmt(dateStr), body, `<button class="btn ghost" onclick="closeModal()">Close</button><button class="btn btn-primary" id="modal-add-act-btn">+ Add Activity</button>`);
  const _modal_add_act_btn = document.getElementById("modal-add-act-btn"); if (_modal_add_act_btn) _modal_add_act_btn.onclick = () => { closeModal(); showAddActivityModal(dateStr); };

  document.querySelectorAll("[data-del-act]").forEach(b => {
    b.onclick = () => {
      S.activities = S.activities.filter(a=>a.id!==b.dataset.delAct);
      showToast("info","Activity removed."); closeModal(); renderCalendar();
    };
  });
  document.querySelectorAll("[data-edit-act]").forEach(b => {
    b.onclick = () => { closeModal(); showEditActivityModal(b.dataset.editAct); };
  });
}

function showEditActivityModal(actId) {
  const a = S.activities.find(x=>x.id===actId); if(!a) return;
  // Convert time display back to HH:MM for input
  let timeInput = "";
  if (a.time) {
    const m = a.time.match(/(\d+):(\d+)\s+(AM|PM)/i);
    if (m) {
      let h = Number(m[1]); const min = m[2], ampm = m[3];
      if (ampm==="PM"&&h!==12) h+=12;
      if (ampm==="AM"&&h===12) h=0;
      timeInput = `${String(h).padStart(2,"0")}:${min}`;
    }
  }
  const body = `<form id="edit-act-form" novalidate class="form" style="gap:10px">
    <div>
      <label class="fl">Category <span class="req">*</span></label>
      <select class="fs" id="edit-act-category">
        ${ACTIVITY_CAT_LIST.map(c=>`<option value="${c}"${c===a.category?" selected":""}>${esc(c)}</option>`).join("")}
      </select>
    </div>
    <div><label class="fl">Title / Description <span class="req">*</span></label><input class="fi" id="edit-act-title" value="${esc(a.title)}"></div>
    <div class="g2">
      <div><label class="fl">Date <span class="req">*</span></label><input class="fi" type="date" id="edit-act-date" value="${a.date}"></div>
      <div><label class="fl">Time</label><input class="fi" type="time" id="edit-act-time" value="${timeInput}"></div>
    </div>
    <div><label class="fl">Notes</label><textarea class="ft" id="edit-act-notes" rows="2">${esc(a.notes)}</textarea></div>
  </form>`;
  openModal("Edit Activity", body,
    `<button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn btn-primary" id="do-edit-act-btn">Save Changes</button>`);
  const _do_edit_act_btn = document.getElementById("do-edit-act-btn"); if (_do_edit_act_btn) _do_edit_act_btn.onclick = () => {;
    const cat   = document.getElementById("edit-act-category").value;
    const title = document.getElementById("edit-act-title").value.trim();
    const date  = document.getElementById("edit-act-date").value;
    if (!cat||!title||!date) { showToast("error","Category, title, and date are required."); return; }
    let timeDisplay = "";
    const rawTime = document.getElementById("edit-act-time").value;
    if (rawTime) {
      const [h,m] = rawTime.split(":").map(Number);
      const ampm = h>=12?"PM":"AM";
      timeDisplay = `${h%12||12}:${String(m).padStart(2,"0")} ${ampm}`;
    }
    S.activities = S.activities.map(x=>x.id===actId?{...x,category:cat,title,date,time:timeDisplay,notes:document.getElementById("edit-act-notes").value.trim()}:x);
    showToast("success","Activity updated."); closeModal(); renderCalendar();
  };
}

/* ═══════════════════════════════════════════════════════════
   REPORTS
══════════════════════════════════════════════════════════════ */
function renderReports() {
  const main = document.getElementById("main-content");
  const selMonth = S.rpt.month;
  const monthAppts = S.appts.filter(a=>(a.scheduledDate||a.requestDate||"").startsWith(selMonth));

  const byType = SACR_LIST.map(t=>({
    name: t.split("/")[0].split(" ").slice(-1)[0],
    full: t,
    count: monthAppts.filter(a=>a.sacramentType===t).length,
    color: SACR[t]?.col||"var(--primary)",
  })).filter(x=>x.count>0);

  const byStatus = ["pending","verified","scheduled","completed","cancelled"].map(s=>({
    name: STATUS_CFG[s].label, count: monthAppts.filter(a=>a.status===s).length,
    color: STATUS_CFG[s].col,
  })).filter(x=>x.count>0);

  const completed = monthAppts.filter(a=>a.status==="completed").length;
  const rate = monthAppts.length ? Math.round((completed/monthAppts.length)*100) : 0;

  const summaryRows = SACR_LIST.map((t,i)=>{
    const rows = monthAppts.filter(a=>a.sacramentType===t);
    if (!rows.length) return "";
    return `<tr class="${i%2===1?"zebra":""}">
      <td>${typeTag(t)}</td>
      <td class="center" style="font-weight:700">${rows.length}</td>
      <td class="center" style="color:var(--green)">${rows.filter(a=>a.status==="completed").length}</td>
      <td class="center" style="color:var(--amber)">${rows.filter(a=>a.status==="pending").length}</td>
      <td class="center" style="color:var(--red)">${rows.filter(a=>a.status==="cancelled").length}</td>
    </tr>`;
  }).join("")+`<tr style="border-top:2px solid var(--border);background:var(--bg);font-weight:700">
    <td>Total</td>
    <td class="center" style="font-weight:800">${monthAppts.length}</td>
    <td class="center" style="color:var(--green);font-weight:700">${completed}</td>
    <td class="center" style="color:var(--amber);font-weight:700">${monthAppts.filter(a=>a.status==="pending").length}</td>
    <td class="center" style="color:var(--red);font-weight:700">${monthAppts.filter(a=>a.status==="cancelled").length}</td>
  </tr>`;

  main.innerHTML = `
    <div class="page-head row">
      <h1 class="page-title">Reports</h1>
      <div style="display:flex;gap:8px;align-items:center">
        <input class="fi" type="month" id="rpt-month" value="${selMonth}" style="width:auto">
        <button class="btn btn-outline sm" onclick="window.print()">Print</button>
      </div>
    </div>
    <div class="stat-grid" style="margin-bottom:16px">
      <div class="stat"><div class="label">Total Requests</div><div class="val">${monthAppts.length}</div></div>
      <div class="stat"><div class="label">Completed</div><div class="val">${completed}</div></div>
      <div class="stat"><div class="label">Pending</div><div class="val">${monthAppts.filter(a=>a.status==="pending").length}</div></div>
      <div class="stat"><div class="label">Completion Rate</div><div class="val">${rate}%</div></div>
    </div>
    <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:16px;margin-bottom:16px">
      <div class="card">
        <div class="card-head"><div class="title">By Sacrament Type</div></div>
        <div class="card-pad">${byType.length?hBarsHTML(byType):`<p style="text-align:center;color:var(--muted);padding:24px;font-size:13px">No data.</p>`}</div>
      </div>
      <div class="card">
        <div class="card-head"><div class="title">By Status</div></div>
        <div class="card-pad">${byStatus.length?hBarsHTML(byStatus):`<p style="text-align:center;color:var(--muted);padding:24px;font-size:13px">No data.</p>`}</div>
      </div>
    </div>
    <div class="card">
      <div class="card-head"><div><div class="title">Summary Table</div><div class="sub">Month: ${selMonth}</div></div></div>
      <div class="tbl-wrap">
        <table class="tbl">
          <thead><tr>
            <th>Sacrament / Service</th>
            <th class="center">Total</th>
            <th class="center">Completed</th>
            <th class="center">Pending</th>
            <th class="center">Cancelled</th>
          </tr></thead>
          <tbody>${summaryRows||`<tr><td colspan="5" class="empty">No requests for this month.</td></tr>`}</tbody>
        </table>
      </div>
    </div>`;

  document.getElementById("rpt-month").onchange = e => { S.rpt.month=e.target.value; renderReports(); };
}

/* ═══════════════════════════════════════════════════════════
   APP RENDER
══════════════════════════════════════════════════════════════ */
function renderApp() {
  const app = document.getElementById("app");
  if (!S.auth) { renderLogin(); return; }

  app.innerHTML = shellHTML();
  bindShell();

  switch (S.view) {
    case "dashboard":    renderDashboard();    break;
    case "appointments": renderAppointments(); break;
    case "certificates": renderCertificates(); break;
    case "book-entries": renderBookEntries();  break;
    case "funeral":      renderFuneral();      break;
    case "calendar":     renderCalendar();     break;
    case "reports":      renderReports();      break;
  }
}

/* ── INIT ────────────────────────────────────────────────────── */
renderApp();
