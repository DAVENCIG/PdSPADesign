import { useState, useCallback, useMemo, useEffect } from "react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import logoSrc from "@/imports/logo.png";
import loginBgSrc from "@/imports/image-1.png";

/* ─── TOKENS ─────────────────────────────────────────────── */
const T = {
  bg:       "#FFFDF5",
  surface:  "#FFFFFF",
  border:   "#EDE8D4",
  borderMd: "#D6CC9A",
  text:     "#1A1400",
  sub:      "#5C5020",
  muted:    "#A8964A",
  primary:  "#C9960A",
  priHov:   "#A87D08",
  priLight: "#FEF9E7",
  green:    "#16A34A", greenL: "#F0FDF4", greenB: "#BBF7D0",
  amber:    "#92400E", amberL: "#FFFBEB", amberB: "#FDE68A",
  red:      "#DC2626", redL:   "#FEF2F2", redB:   "#FECACA",
  blue:     "#1D4ED8", blueL:  "#EFF6FF", blueB:  "#BFDBFE",
  purple:   "#7C3AED", purpleL:"#F5F3FF", purpleB:"#DDD6FE",
};

/* ─── SACRAMENT CONFIG ───────────────────────────────────── */
const SACR: Record<string, { col: string; light: string; cert: string }> = {
  "Baptismal":                { col:"#2563EB", light:"#EFF6FF", cert:"received the Sacrament of Holy Baptism" },
  "Confirmation":             { col:"#7C3AED", light:"#F5F3FF", cert:"received the Sacrament of Confirmation" },
  "First Holy Communion":     { col:"#B45309", light:"#FFFBEB", cert:"received the Sacrament of First Holy Communion" },
  "Matrimony":                { col:"#BE185D", light:"#FDF2F8", cert:"were united in the Sacrament of Holy Matrimony" },
  "Burial/Death":             { col:"#475569", light:"#F8FAFC", cert:"received the Last Rites of the Church and was interred" },
  "No Record":                { col:"#DC2626", light:"#FEF2F2", cert:"no sacramental record was found on file" },
  "Good Standing/Membership": { col:"#16A34A", light:"#F0FDF4", cert:"is a registered parishioner in good standing" },
};
const SACR_LIST = Object.keys(SACR);

/* ─── TYPES ──────────────────────────────────────────────── */
type View       = "dashboard"|"appointments"|"certificates"|"book-entries"|"funeral"|"calendar"|"reports";
type AppStatus  = "pending"|"verified"|"scheduled"|"completed"|"cancelled";
type UserRole   = "admin"|"staff";

interface Appointment {
  id: string; requestDate: string; parishioner: string;
  contact: string; email: string; sacramentType: string;
  subjectName: string; dateOfSacrament: string; purposeOf: string;
  status: AppStatus; referenceNo: string; scheduledDate: string; staffNotes: string;
}
interface BookEntry {
  id: string; sacramentType: string; subjectName: string;
  dateOfSacrament: string; dateOfArrival: string;
  volume: string; page: string; minister: string; remarks: string;
}
interface FuneralRecord {
  id: string; deceasedName: string; dateOfDeath: string; dateOfBurial: string;
  block: string; lot: string; section: string;
  nextOfKin: string; contact: string; notes: string;
}
interface Toast { id: number; type: "success"|"error"|"info"|"warning"; message: string; }

type MassType      = "For the Repose of Soul"|"Thanksgiving"|"Special Intention"|"Death Anniversary"|"Birthday"|"Healing"|"Other";
type MassReqStatus = "pending"|"confirmed"|"celebrated";
interface MassIntention {
  id: string; requestDate: string; requestor: string; contact: string;
  intention: string; massType: MassType; massDate: string; massTime: string;
  offering: string; status: MassReqStatus; celebrant: string; notes: string;
}

type CertReqStatus = "pending"|"processing"|"ready"|"released";
interface CertRequest {
  id: string; requestDate: string; parishioner: string;
  contact: string; email: string; sacramentType: string;
  subjectName: string; dateOfSacrament: string; purposeOf: string;
  referenceNo: string; status: CertReqStatus; staffNotes: string; claimedDate: string;
}

/* ─── SEED DATA ──────────────────────────────────────────── */
let _aid = 8;
const nid  = () => `SARMS-2026-${String(_aid++).padStart(3,"0")}`;
let _crid = 4;
const ncid = () => `CR-2026-${String(_crid++).padStart(3,"0")}`;
let _miid = 5;
const nmid = () => `MI-2026-${String(_miid++).padStart(3,"0")}`;
let _tid = 0;
const tid = () => ++_tid;

const SEED_APPTS: Appointment[] = [
  { id:"SARMS-2026-001", requestDate:"2026-08-01", parishioner:"Maria Dela Cruz",      contact:"09171234567", email:"maria@email.com",   sacramentType:"Baptismal",                subjectName:"Juan Carlos Dela Cruz",     dateOfSacrament:"2020-03-15", purposeOf:"School enrollment",          status:"completed", referenceNo:"GCash-001", scheduledDate:"2026-08-05", staffNotes:"Book 12, Pg 34" },
  { id:"SARMS-2026-002", requestDate:"2026-08-03", parishioner:"Jose Banaga",          contact:"09281234567", email:"jose@email.com",    sacramentType:"Confirmation",             subjectName:"Jose Banaga Jr.",           dateOfSacrament:"2018-04-22", purposeOf:"Employment",                status:"verified",  referenceNo:"BDO-002",    scheduledDate:"2026-08-10", staffNotes:"" },
  { id:"SARMS-2026-003", requestDate:"2026-08-05", parishioner:"Rosario Layug",        contact:"09351234567", email:"rosario@email.com", sacramentType:"Matrimony",                subjectName:"Eduardo & Rosario Layug",   dateOfSacrament:"2005-06-18", purposeOf:"Annulment proceedings",     status:"scheduled", referenceNo:"GCash-003",  scheduledDate:"2026-08-12", staffNotes:"Court-ordered" },
  { id:"SARMS-2026-004", requestDate:"2026-08-07", parishioner:"Pedro Abalos",         contact:"09181234567", email:"pedro@email.com",   sacramentType:"Burial/Death",             subjectName:"Conchita Abalos",           dateOfSacrament:"2026-07-30", purposeOf:"Estate settlement",         status:"pending",   referenceNo:"",           scheduledDate:"",           staffNotes:"" },
  { id:"SARMS-2026-005", requestDate:"2026-08-08", parishioner:"Lourdes Ramos",        contact:"09291234567", email:"lourdes@email.com", sacramentType:"First Holy Communion",     subjectName:"Ana Lourdes Ramos",         dateOfSacrament:"2019-05-10", purposeOf:"Confirmation requirement",  status:"completed", referenceNo:"GCash-005",  scheduledDate:"2026-08-09", staffNotes:"Book 8, Pg 102" },
  { id:"SARMS-2026-006", requestDate:"2026-08-10", parishioner:"Antonio Magno",        contact:"09371234567", email:"antonio@email.com", sacramentType:"Good Standing/Membership", subjectName:"Antonio Magno",             dateOfSacrament:"",           purposeOf:"Visa application",          status:"verified",  referenceNo:"BDO-006",    scheduledDate:"2026-08-15", staffNotes:"Active parishioner" },
  { id:"SARMS-2026-007", requestDate:"2026-08-12", parishioner:"Cynthia Obispo",       contact:"09461234567", email:"cynthia@email.com", sacramentType:"No Record",                subjectName:"Carlo Obispo",              dateOfSacrament:"",           purposeOf:"Insurance claim",           status:"pending",   referenceNo:"",           scheduledDate:"",           staffNotes:"" },
  { id:"SARMS-2026-008", requestDate:"2026-08-14", parishioner:"Fr. Rene Tabios",      contact:"09151234567", email:"frene@parish.com",  sacramentType:"Pamisa",                   subjectName:"Lolo Felix Tabios",         dateOfSacrament:"",           purposeOf:"Death anniversary",         status:"scheduled", referenceNo:"Internal",   scheduledDate:"2026-08-18", staffNotes:"7AM Mass" },
];

const MASS_TYPES: MassType[] = [
  "For the Repose of Soul","Thanksgiving","Special Intention",
  "Death Anniversary","Birthday","Healing","Other",
];

const MASS_TIMES = ["5:00 AM","6:00 AM","7:00 AM","8:00 AM","9:00 AM","10:00 AM","12:00 PM","5:00 PM","6:00 PM"];

const SEED_MASS: MassIntention[] = [
  { id:"MI-2026-001", requestDate:"2026-08-14", requestor:"Fr. Rene Tabios",  contact:"09151234567", intention:"Lolo Felix Tabios",    massType:"Death Anniversary",      massDate:"2026-08-18", massTime:"7:00 AM",  offering:"500",  status:"confirmed",  celebrant:"Fr. Rene Tabios",  notes:"7AM Mass" },
  { id:"MI-2026-002", requestDate:"2026-08-15", requestor:"Maria Dela Cruz",  contact:"09171234567", intention:"Carlos Dela Cruz",      massType:"Birthday",               massDate:"2026-08-20", massTime:"6:00 AM",  offering:"300",  status:"confirmed",  celebrant:"",                 notes:"" },
  { id:"MI-2026-003", requestDate:"2026-08-16", requestor:"Lourdes Ramos",    contact:"09291234567", intention:"For healing of Ana R.", massType:"Healing",                massDate:"2026-08-21", massTime:"6:00 AM",  offering:"300",  status:"pending",    celebrant:"",                 notes:"" },
  { id:"MI-2026-004", requestDate:"2026-08-17", requestor:"Jose Banaga",      contact:"09281234567", intention:"Ignacio Banaga",        massType:"For the Repose of Soul", massDate:"2026-08-22", massTime:"5:00 AM",  offering:"500",  status:"pending",    celebrant:"",                 notes:"" },
];

const SEED_CERT_REQUESTS: CertRequest[] = [
  { id:"CR-2026-001", requestDate:"2026-08-02", parishioner:"Maria Dela Cruz",  contact:"09171234567", email:"maria@email.com",   sacramentType:"Baptismal",                subjectName:"Juan Carlos Dela Cruz",   dateOfSacrament:"2020-03-15", purposeOf:"School enrollment",         referenceNo:"GCash-20260802-001", status:"released",   staffNotes:"Book 12, Pg 34",   claimedDate:"2026-08-06" },
  { id:"CR-2026-002", requestDate:"2026-08-09", parishioner:"Lourdes Ramos",    contact:"09291234567", email:"lourdes@email.com", sacramentType:"First Holy Communion",     subjectName:"Ana Lourdes Ramos",       dateOfSacrament:"2019-05-10", purposeOf:"Confirmation requirement",  referenceNo:"GCash-20260809-002", status:"ready",      staffNotes:"Book 8, Pg 102",   claimedDate:"" },
  { id:"CR-2026-003", requestDate:"2026-08-13", parishioner:"Pedro Abalos",     contact:"09181234567", email:"pedro@email.com",   sacramentType:"Burial/Death",             subjectName:"Conchita Abalos",         dateOfSacrament:"2026-07-30", purposeOf:"Estate settlement",         referenceNo:"",                   status:"processing", staffNotes:"Verifying records", claimedDate:"" },
];

const SEED_BOOKS: BookEntry[] = [
  { id:"BK-001", sacramentType:"Baptismal",            subjectName:"Juan Carlos Dela Cruz",  dateOfSacrament:"2020-03-15", dateOfArrival:"2026-08-01", volume:"12", page:"34",  minister:"Fr. Rene Tabios",  remarks:"Parents: Carlos & Maria Dela Cruz" },
  { id:"BK-002", sacramentType:"Confirmation",          subjectName:"Jose Banaga Jr.",        dateOfSacrament:"2018-04-22", dateOfArrival:"2026-08-03", volume:"9",  page:"88",  minister:"Bishop Pedro Arigo",remarks:"Sponsor: Atty. Ramon Banaga" },
  { id:"BK-003", sacramentType:"First Holy Communion",  subjectName:"Ana Lourdes Ramos",      dateOfSacrament:"2019-05-10", dateOfArrival:"2026-08-08", volume:"8",  page:"102", minister:"Fr. Rene Tabios",  remarks:"Batch 2019" },
  { id:"BK-004", sacramentType:"Matrimony",             subjectName:"Eduardo & Rosario Layug",dateOfSacrament:"2005-06-18", dateOfArrival:"2026-08-05", volume:"6",  page:"57",  minister:"Fr. Domingo Cruz", remarks:"Sponsors: see page 58" },
  { id:"BK-005", sacramentType:"Burial/Death",          subjectName:"Conchita Abalos",        dateOfSacrament:"2026-07-30", dateOfArrival:"2026-08-07", volume:"15", page:"4",   minister:"Fr. Rene Tabios",  remarks:"Interred at PdSPA Campo Santo" },
];

const SEED_FUNERAL: FuneralRecord[] = [
  { id:"FN-001", deceasedName:"Conchita Abalos",    dateOfDeath:"2026-07-28", dateOfBurial:"2026-07-30", block:"A", lot:"12", section:"Nicho",  nextOfKin:"Pedro Abalos",      contact:"09181234567", notes:"" },
  { id:"FN-002", deceasedName:"Felix Tabios",        dateOfDeath:"2025-08-15", dateOfBurial:"2025-08-18", block:"B", lot:"3",  section:"Lawn",   nextOfKin:"Fr. Rene Tabios",   contact:"09151234567", notes:"Perpetual care" },
  { id:"FN-003", deceasedName:"Remedios Villanueva", dateOfDeath:"2024-11-02", dateOfBurial:"2024-11-05", block:"A", lot:"44", section:"Nicho",  nextOfKin:"Carmen Villanueva", contact:"09261234567", notes:"" },
  { id:"FN-004", deceasedName:"Ignacio Banaga",      dateOfDeath:"2024-03-20", dateOfBurial:"2024-03-22", block:"C", lot:"7",  section:"Ground", nextOfKin:"Jose Banaga",       contact:"09281234567", notes:"" },
];

/* ─── HELPERS ────────────────────────────────────────────── */
function fmt(iso: string) {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-PH", { month:"long", day:"numeric", year:"numeric" });
}
function fmtShort(iso: string) {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-PH", { month:"short", day:"numeric", year:"numeric" });
}
function todayISO() { return new Date().toISOString().split("T")[0]; }

const CERT_STATUS_CFG: Record<CertReqStatus, { label: string; col: string; bg: string }> = {
  pending:    { label:"Pending",    col:"#92400E", bg:"#FEF3C7" },
  processing: { label:"Processing", col:"#1E40AF", bg:"#DBEAFE" },
  ready:      { label:"Ready",      col:"#065F46", bg:"#D1FAE5" },
  released:   { label:"Released",   col:"#4B5563", bg:"#F3F4F6" },
};

function CertBadge({ status }: { status: CertReqStatus }) {
  const { label, col, bg } = CERT_STATUS_CFG[status];
  return <span style={{ padding:"2px 8px", borderRadius:4, fontSize:12, fontWeight:600,
    background:bg, color:col, letterSpacing:".02em", whiteSpace:"nowrap" }}>{label}</span>;
}

const STATUS_CFG: Record<AppStatus, { label: string; col: string; bg: string }> = {
  pending:   { label:"Pending",   col:"#92400E", bg:"#FEF3C7" },
  verified:  { label:"Verified",  col:"#1E40AF", bg:"#DBEAFE" },
  scheduled: { label:"Scheduled", col:"#065F46", bg:"#D1FAE5" },
  completed: { label:"Completed", col:"#166534", bg:"#F0FDF4" },
  cancelled: { label:"Cancelled", col:"#991B1B", bg:"#FEF2F2" },
};

/* ─── SMALL COMPONENTS ───────────────────────────────────── */
function Badge({ status }: { status: AppStatus }) {
  const { label, col, bg } = STATUS_CFG[status];
  return (
    <span style={{ padding:"2px 8px", borderRadius:4, fontSize:12, fontWeight:600,
      background:bg, color:col, letterSpacing:".02em", whiteSpace:"nowrap" }}>
      {label}
    </span>
  );
}

function TypeTag({ type }: { type: string }) {
  const s = SACR[type];
  return (
    <span style={{ padding:"2px 8px", borderRadius:4, fontSize:12, fontWeight:600,
      background: s?.light ?? "#F3F4F6", color: s?.col ?? T.sub, whiteSpace:"nowrap" }}>
      {type}
    </span>
  );
}

function Btn({ variant = "primary", size = "md", children, style, ...rest }:
  { variant?: "primary"|"outline"|"ghost"|"danger"; size?: "sm"|"md";
    style?: React.CSSProperties; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const p = size === "sm" ? "4px 10px" : "7px 14px";
  const fs = size === "sm" ? 12 : 13;
  const vs: Record<string, React.CSSProperties> = {
    primary: { background:T.primary, color:"#fff",    border:`1px solid ${T.primary}` },
    outline: { background:"#fff",    color:T.primary, border:`1px solid ${T.primary}` },
    ghost:   { background:"transparent", color:T.sub,      border:`1px solid ${T.border}` },
    danger:  { background:T.red,     color:"#fff",          border:`1px solid ${T.red}` },
  };
  return (
    <button {...rest} style={{ padding:p, fontSize:fs, fontWeight:600, fontFamily:"inherit",
      borderRadius:6, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:5,
      whiteSpace:"nowrap", transition:"opacity .15s", opacity:rest.disabled?.55:1,
      ...vs[variant], ...style }}
      onMouseEnter={e => (e.currentTarget.style.opacity = ".85")}
      onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
      {children}
    </button>
  );
}

const inp: React.CSSProperties = {
  width:"100%", padding:"7px 10px", border:`1px solid ${T.border}`,
  borderRadius:6, fontSize:14, fontFamily:"inherit", color:T.text,
  background:"#fff", outline:"none",
};
function FI({ ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} style={{ ...inp, ...rest.style }}
    onFocus={e => (e.currentTarget.style.borderColor = T.primary)}
    onBlur={e => (e.currentTarget.style.borderColor = T.border)}/>;
}
function FS({ children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...rest} style={{ ...inp, appearance:"none",
      background:`#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2398A2B3' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 10px center`,
      paddingRight:28, cursor:"pointer" }}>
      {children}
    </select>
  );
}
function FT({ ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...rest} style={{ ...inp, resize:"vertical", minHeight:72 }}
    onFocus={e => (e.currentTarget.style.borderColor = T.primary)}
    onBlur={e => (e.currentTarget.style.borderColor = T.border)}/>;
}
function FL({ children, req, htmlFor }: { children: React.ReactNode; req?: boolean; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} style={{ display:"block", fontSize:13, fontWeight:600,
      color:T.sub, marginBottom:4, textTransform:"uppercase", letterSpacing:".04em" }}>
      {children}{req && <span style={{ color:T.red }}> *</span>}
    </label>
  );
}

function Divider() { return <div style={{ height:1, background:T.border, margin:"4px 0" }}/>; }

/* ─── CARD ───────────────────────────────────────────────── */
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background:T.surface, border:`1px solid ${T.border}`,
    borderRadius:8, overflow:"hidden", ...style }}>{children}</div>;
}
function CardHead({ title, sub, right }: { title: React.ReactNode; sub?: string; right?: React.ReactNode }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"16px 22px", borderBottom:`1px solid ${T.border}`, gap:20, flexWrap:"wrap" }}>
      <div>
        <div style={{ fontSize:14, fontWeight:700, color:T.text }}>{title}</div>
        {sub && <div style={{ fontSize:12, color:T.muted, marginTop:2 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

/* ─── TOAST ──────────────────────────────────────────────── */
function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((type: Toast["type"], message: string) => {
    const id = tid();
    setToasts(t => [...t, { id, type, message }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);
  const dismiss = useCallback((id: number) => setToasts(t => t.filter(x => x.id !== id)), []);
  return { toasts, push, dismiss };
}

const TOAST_COL: Record<Toast["type"], string> = {
  success: T.green, error: T.red, info: T.primary, warning: T.amber,
};

function Toasts({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: number) => void }) {
  return (
    <div style={{ position:"fixed", bottom:20, right:20, zIndex:400,
      display:"flex", flexDirection:"column", gap:12, maxWidth:360 }}>
      {toasts.map(t => (
        <div key={t.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"16px 22px",
          background:"#fff", border:`1px solid ${T.border}`, borderLeft:`3px solid ${TOAST_COL[t.type]}`,
          borderRadius:6, boxShadow:"0 4px 12px rgba(0,0,0,.08)", fontSize:14, color:T.text }}>
          <span style={{ flex:1 }}>{t.message}</span>
          <button onClick={() => dismiss(t.id)} style={{ background:"none", border:"none",
            cursor:"pointer", color:T.muted, fontSize:16, lineHeight:1, padding:0 }}>x</button>
        </div>
      ))}
    </div>
  );
}

/* ─── MODAL ──────────────────────────────────────────────── */
function Modal({ open, title, onClose, children, footer, maxW = 500 }:
  { open: boolean; title: string; onClose: () => void;
    children: React.ReactNode; footer?: React.ReactNode; maxW?: number }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape" && open) onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);
  if (!open) return null;
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position:"fixed", inset:0, zIndex:300, background:"rgba(0,0,0,.4)",
        display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ background:"#fff", borderRadius:8, border:`1px solid ${T.border}`,
        width:"100%", maxWidth:maxW, boxShadow:"0 8px 32px rgba(0,0,0,.12)", maxHeight:"90vh", display:"flex", flexDirection:"column" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"16px 22px", borderBottom:`1px solid ${T.border}` }}>
          <span style={{ fontWeight:700, fontSize:15, color:T.text }}>{title}</span>
          <button onClick={onClose} style={{ background:"none", border:"none",
            cursor:"pointer", fontSize:20, color:T.muted, lineHeight:1, padding:0 }}>x</button>
        </div>
        <div style={{ padding:20, overflowY:"auto", flex:1 }}>{children}</div>
        {footer && (
          <div style={{ display:"flex", justifyContent:"flex-end", gap:12,
            padding:"10px 16px", borderTop:`1px solid ${T.border}` }}>{footer}</div>
        )}
      </div>
    </div>
  );
}

/* ─── TABLE HELPERS ──────────────────────────────────────── */
const TH: React.CSSProperties = {
  padding:"10px 16px", textAlign:"left", fontSize:11, fontWeight:700,
  color:T.sub, textTransform:"uppercase", letterSpacing:".05em",
  borderBottom:`1px solid ${T.border}`, background:T.bg, whiteSpace:"nowrap",
};
const TD: React.CSSProperties = { padding:"11px 16px", fontSize:14, color:T.text, verticalAlign:"middle" };

function SortTh({ label, field, sf, sd, sort }: { label: string; field: string; sf: unknown; sd: string; sort: () => void }) {
  const active = sf === field;
  return (
    <th style={{ ...TH, cursor:"pointer", userSelect:"none" }} onClick={sort}>
      {label} <span style={{ opacity: active ? 1 : .4 }}>{active ? (sd === "asc" ? "↑" : "↓") : "↕"}</span>
    </th>
  );
}

function Paginator({ page, total, set }: { page: number; total: number; set: (p: number) => void }) {
  if (total <= 1) return null;
  return (
    <div style={{ display:"flex", gap:4, alignItems:"center" }}>
      <button onClick={() => set(Math.max(1, page - 1))} disabled={page === 1}
        style={{ minWidth:26, height:26, border:`1px solid ${T.border}`, borderRadius:4,
          background:"#fff", cursor:page===1?"not-allowed":"pointer", opacity:page===1?.4:1, fontSize:13 }}>‹</button>
      {Array.from({ length: total }, (_, i) => i + 1)
        .filter(p => p === 1 || p === total || Math.abs(p - page) <= 1)
        .map((p, i, arr) => (
          <span key={p} style={{ display:"contents" }}>
            {i > 0 && arr[i - 1] !== p - 1 && <span style={{ color:T.muted, fontSize:13 }}>…</span>}
            <button onClick={() => set(p)}
              style={{ minWidth:26, height:26, border:`1px solid ${p===page?T.primary:T.border}`,
                borderRadius:4, background:p===page?T.primary:"#fff",
                color:p===page?"#fff":T.sub, cursor:"pointer", fontSize:13, fontWeight:p===page?700:400 }}>{p}</button>
          </span>
        ))}
      <button onClick={() => set(Math.min(total, page + 1))} disabled={page === total}
        style={{ minWidth:26, height:26, border:`1px solid ${T.border}`, borderRadius:4,
          background:"#fff", cursor:page===total?"not-allowed":"pointer", opacity:page===total?.4:1, fontSize:13 }}>›</button>
    </div>
  );
}

/* ─── SIMPLE BAR CHART (pure SVG, no Recharts key conflicts) ─ */
type BarDatum = { name: string; count: number; col: string };
function SimpleBarChart({ data, height = 240, layout = "vertical" as "vertical" | "horizontal" }: {
  data: BarDatum[]; height?: number; layout?: "vertical" | "horizontal";
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);

  if (!data.length) return <p style={{ textAlign:"center", color:T.muted, padding:24, fontSize:14 }}>No data.</p>;

  if (layout === "horizontal") {
    /* Horizontal: categories on Y axis, bars extend right */
    const PAD = { top:8, bottom:8, left:92, right:16 };
    const maxVal = Math.max(...data.map(d => d.count), 1);
    const rowH = Math.floor((height - PAD.top - PAD.bottom) / data.length);
    const barH = Math.max(6, Math.min(20, rowH - 8));
    const chartW = 400;
    const innerW = chartW - PAD.left - PAD.right;

    return (
      <div style={{ position:"relative" }}>
        <svg width="100%" viewBox={`0 0 ${chartW} ${height}`} style={{ overflow:"visible" }}>
          {/* grid lines */}
          {[0, .25, .5, .75, 1].map(t => {
            const x = PAD.left + t * innerW;
            return <line key={t} x1={x} x2={x} y1={PAD.top} y2={height - PAD.bottom} stroke={T.border} strokeDasharray="3 3"/>;
          })}
          {data.map((d, i) => {
            const y = PAD.top + i * rowH + (rowH - barH) / 2;
            const w = (d.count / maxVal) * innerW;
            return (
              <g key={i} onMouseEnter={e => { setHovered(i); setTip({ x: e.clientX, y: e.clientY }); }}
                 onMouseMove={e => setTip({ x: e.clientX, y: e.clientY })}
                 onMouseLeave={() => { setHovered(null); setTip(null); }} style={{ cursor:"default" }}>
                <text x={PAD.left - 6} y={y + barH / 2 + 4} textAnchor="end" fontSize={11} fill={T.muted}>{d.name}</text>
                <rect x={PAD.left} y={y} width={Math.max(0, w)} height={barH}
                  fill={d.col} rx={3} opacity={hovered === null || hovered === i ? 1 : 0.45}/>
                {w > 20 && <text x={PAD.left + w + 4} y={y + barH / 2 + 4} fontSize={11} fill={T.sub}>{d.count}</text>}
              </g>
            );
          })}
        </svg>
        {hovered !== null && tip && (
          <div style={{ position:"fixed", left:tip.x+12, top:tip.y-28, background:"#fff", border:`1px solid ${T.border}`,
            borderRadius:6, padding:"4px 10px", fontSize:13, pointerEvents:"none", zIndex:9999, whiteSpace:"nowrap",
            boxShadow:"0 2px 8px rgba(0,0,0,.1)" }}>
            <b style={{ color:T.text }}>{data[hovered].name}</b>: {data[hovered].count}
          </div>
        )}
      </div>
    );
  }

  /* Vertical: categories on X axis, bars go up */
  const PAD = { top:8, bottom:36, left:32, right:8 };
  const maxVal = Math.max(...data.map(d => d.count), 1);
  const chartW = 480;
  const innerW = chartW - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;
  const colW = innerW / data.length;
  const barW = Math.max(8, Math.min(40, colW * 0.55));

  return (
    <div style={{ position:"relative" }}>
      <svg width="100%" viewBox={`0 0 ${chartW} ${height}`} style={{ overflow:"visible" }}>
        {/* horizontal grid lines */}
        {[0, .25, .5, .75, 1].map(t => {
          const y = PAD.top + t * innerH;
          return (
            <g key={t}>
              <line x1={PAD.left} x2={chartW - PAD.right} y1={y} y2={y} stroke={T.border} strokeDasharray="3 3"/>
              <text x={PAD.left - 4} y={y + 4} textAnchor="end" fontSize={11} fill={T.muted}>
                {Math.round(maxVal * (1 - t))}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const barH = (d.count / maxVal) * innerH;
          const x = PAD.left + i * colW + (colW - barW) / 2;
          const y = PAD.top + innerH - barH;
          return (
            <g key={i} onMouseEnter={e => { setHovered(i); setTip({ x: e.clientX, y: e.clientY }); }}
               onMouseMove={e => setTip({ x: e.clientX, y: e.clientY })}
               onMouseLeave={() => { setHovered(null); setTip(null); }} style={{ cursor:"default" }}>
              <rect x={x} y={y} width={barW} height={Math.max(0, barH)}
                fill={d.col} rx={3} opacity={hovered === null || hovered === i ? 1 : 0.45}/>
              <text x={x + barW / 2} y={height - PAD.bottom + 14} textAnchor="middle" fontSize={11} fill={T.muted}>{d.name}</text>
            </g>
          );
        })}
      </svg>
      {hovered !== null && tip && (
        <div style={{ position:"fixed", left:tip.x+12, top:tip.y-28, background:"#fff", border:`1px solid ${T.border}`,
          borderRadius:6, padding:"4px 10px", fontSize:13, pointerEvents:"none", zIndex:9999, whiteSpace:"nowrap",
          boxShadow:"0 2px 8px rgba(0,0,0,.1)" }}>
          <b style={{ color:T.text }}>{data[hovered].name}</b>: {data[hovered].count}
        </div>
      )}
    </div>
  );
}

/* ─── TABLE HOOK ─────────────────────────────────────────── */
function useTable<R extends Record<string, unknown>>(data: R[], searchKeys: (keyof R)[], pageSize = 10) {
  const [search, setSearch]   = useState("");
  const [fKey,   setFKey]     = useState("");
  const [fVal,   setFVal]     = useState("");
  const [sortF,  setSortF]    = useState<keyof R | null>(null);
  const [sortD,  setSortD]    = useState<"asc"|"desc">("asc");
  const [page,   setPage]     = useState(1);
  const sort = (f: keyof R) => { if (sortF === f) setSortD(d => d==="asc"?"desc":"asc"); else { setSortF(f); setSortD("asc"); } setPage(1); };
  const filtered = useMemo(() => {
    let d = data;
    if (search) { const q = search.toLowerCase(); d = d.filter(r => searchKeys.some(k => String(r[k]??"").toLowerCase().includes(q))); }
    if (fKey && fVal) d = d.filter(r => String(r[fKey as keyof R]??"").toLowerCase() === fVal.toLowerCase());
    if (sortF) d = [...d].sort((a,b) => { const av = String(a[sortF]??""), bv = String(b[sortF]??""); return sortD==="asc"?av.localeCompare(bv,undefined,{numeric:true}):bv.localeCompare(av,undefined,{numeric:true}); });
    return d;
  }, [data, search, fKey, fVal, sortF, sortD]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const paged      = filtered.slice((safePage-1)*pageSize, safePage*pageSize);
  return { search, setSearch, fKey, setFKey, fVal, setFVal, sort, sortF, sortD, page:safePage, setPage, totalPages, paged, total:filtered.length };
}

/* ─── CERT PRINT ─────────────────────────────────────────── */
function generateCertHTML(appt: Appointment, logoB64: string): string {
  const s = SACR[appt.sacramentType] ?? SACR["No Record"];
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${appt.id}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',sans-serif;background:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
    .cert{width:700px;border:1.5px solid #E4E7EC;border-radius:8px;overflow:hidden}
    .cert-top{background:#1A1400;padding:28px 40px;text-align:center;color:#fff;position:relative}
    .cert-top img{width:64px;height:64px;object-fit:contain;margin-bottom:10px}
    .cert-top h1{font-size:1.05rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase}
    .cert-top p{font-size:.72rem;opacity:.7;margin-top:3px}
    .cert-body{padding:36px 48px}
    .cert-type{font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:${s.col};margin-bottom:8px}
    .cert-title{font-size:1.5rem;font-weight:800;color:#101828;margin-bottom:24px}
    .cert-text{font-size:.88rem;color:#475467;line-height:1.8;margin-bottom:24px}
    .cert-name{font-size:1.25rem;font-weight:700;color:#101828;border-bottom:2px solid #E4E7EC;padding-bottom:8px;margin:12px 0 16px}
    .cert-meta{display:flex;gap:32px;background:#F7F8FA;border:1px solid #E4E7EC;border-radius:6px;padding:14px 18px;margin-bottom:28px}
    .cert-mi .l{font-size:.6rem;text-transform:uppercase;letter-spacing:.08em;color:#98A2B3;margin-bottom:3px}
    .cert-mi .v{font-size:.82rem;font-weight:600;color:#101828}
    .cert-sigs{display:flex;justify-content:space-around;padding-top:24px;border-top:1px solid #E4E7EC}
    .sig-line{border-top:1px solid #101828;padding-top:6px;margin:28px 16px 0;text-align:center}
    .sig-name{font-size:.75rem;font-weight:700;color:#101828}
    .sig-role{font-size:.65rem;color:#98A2B3}
    .cert-no{font-size:.6rem;color:#98A2B3;text-align:center;margin-top:16px}
    @media print{body{padding:0}@page{size:A4 portrait;margin:0}.cert{width:100%;border:none;border-radius:0}}
  </style></head><body>
  <div class="cert">
    <div class="cert-top">
      <img src="${logoB64}" alt="Parish Seal">
      <h1>Parroquia de San Pedro Apostol</h1>
      <p>Diocese of Daet &bull; Vinzons, Camarines Norte &bull; Est. 1611</p>
    </div>
    <div class="cert-body">
      <div class="cert-type">Official Parish Certificate</div>
      <div class="cert-title">Certificate of ${appt.sacramentType === "Pamisa" ? "Mass Intention" : appt.sacramentType}</div>
      <p style="font-size:.8rem;color:#98A2B3;margin-bottom:6px">This is to certify that</p>
      <div class="cert-name">${appt.subjectName}</div>
      <div class="cert-text">
        ${s.cert.charAt(0).toUpperCase() + s.cert.slice(1)}
        ${appt.dateOfSacrament ? `on <strong>${fmt(appt.dateOfSacrament)}</strong>` : ""}
        as recorded in the sacramental register of this Parish.
        <br><br>
        This certificate is issued upon the request of <strong>${appt.parishioner}</strong>
        ${appt.purposeOf ? `for the purpose of <strong>${appt.purposeOf}</strong>` : ""}.
      </div>
      <div class="cert-meta">
        <div class="cert-mi"><div class="l">Certificate No.</div><div class="v">${appt.id}</div></div>
        ${appt.dateOfSacrament ? `<div class="cert-mi"><div class="l">Date of Sacrament</div><div class="v">${fmt(appt.dateOfSacrament)}</div></div>` : ""}
        <div class="cert-mi"><div class="l">Date Issued</div><div class="v">${fmt(todayISO())}</div></div>
      </div>
      <div class="cert-sigs">
        <div><div class="sig-line"><div class="sig-name">REV. FR. RENE TABIOS</div><div class="sig-role">Parish Priest</div></div></div>
        <div><div class="sig-line"><div class="sig-name">PARISH SECRETARY</div><div class="sig-role">Records Office</div></div></div>
      </div>
      <div class="cert-no">${appt.id} &bull; Issued ${fmtShort(todayISO())} &bull; PdSPA Records Office</div>
    </div>
  </div>
  <script>window.onload=()=>window.print()<\/script>
  </body></html>`;
}

/* ─── SIDEBAR ────────────────────────────────────────────── */
const NAV: { view: View; label: string }[] = [
  { view:"dashboard",    label:"Dashboard" },
  { view:"appointments", label:"Appointments" },
  { view:"certificates", label:"Certificates" },
  { view:"book-entries", label:"Book Entries" },
  { view:"funeral",      label:"Funeral / Campo Santo" },
  { view:"calendar",     label:"Calendar" },
  { view:"reports",      label:"Reports" },
];

function Sidebar({ view, setView, name, role, onLogout }:
  { view: View; setView: (v: View) => void; name: string; role: UserRole; onLogout: () => void }) {
  return (
    <aside style={{ width:256, minHeight:"100vh", background:T.surface, borderRight:`1px solid ${T.border}`,
      display:"flex", flexDirection:"column", flexShrink:0, position:"sticky", top:0, height:"100vh" }}>

      {/* Logo */}
      <div style={{ padding:"20px 24px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:32, height:32, flexShrink:0 }}>
          <ImageWithFallback src={logoSrc} alt="PdSPA" style={{ width:"100%", height:"100%", objectFit:"contain" }}/>
        </div>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:T.text, lineHeight:1.2 }}>PdSPA</div>
          <div style={{ fontSize:11, color:T.muted, lineHeight:1.2 }}>SARMS</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:"8px 0", overflowY:"auto" }}>
        {NAV.map(n => {
          const active = view === n.view;
          return (
            <button key={n.view} onClick={() => setView(n.view)}
              style={{ width:"100%", display:"block", padding:"10px 20px", textAlign:"left",
                fontSize:14, fontWeight: active ? 600 : 400,
                color: active ? T.primary : T.sub,
                background: active ? T.priLight : "transparent",
                border:"none", cursor:"pointer",
                borderLeft: active ? `2px solid ${T.primary}` : "2px solid transparent" }}>
              {n.label}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ padding:"12px 18px", borderTop:`1px solid ${T.border}` }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{name}</div>
        <div style={{ fontSize:12, color:T.muted, textTransform:"capitalize", marginBottom:8 }}>{role}</div>
        <button onClick={onLogout}
          style={{ fontSize:13, color:T.muted, background:"none", border:"none", cursor:"pointer", padding:0 }}>
          Sign out
        </button>
      </div>
    </aside>
  );
}

/* ─── LOGIN ──────────────────────────────────────────────── */
const DEMO = [
  { label:"Admin", u:"admin", p:"admin123", r:"admin" as UserRole },
  { label:"Staff", u:"staff", p:"staff123", r:"staff" as UserRole },
];

function LoginView({ onLogin }: { onLogin: (r: UserRole, n: string) => void }) {
  const [user,    setUser]    = useState("");
  const [pass,    setPass]    = useState("");
  const [showPw,  setShowPw]  = useState(false);
  const [err,     setErr]     = useState("");
  const [busy,    setBusy]    = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    const m = DEMO.find(d => d.u === user.trim() && d.p === pass);
    if (!m) { setErr("Incorrect username or password."); return; }
    setBusy(true);
    await new Promise(r => setTimeout(r, 600));
    onLogin(m.r, m.label);
  }

  const ulInp: React.CSSProperties = {
    width:"100%", border:"none", borderBottom:"1.5px solid #D6CC9A",
    padding:"10px 0", fontSize:15, fontFamily:"inherit",
    color:"#1A1400", background:"transparent", outline:"none",
  };

  return (
    <div style={{ minHeight:"100vh", background:"#FFFDF5",
      display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>

      {/* Two-panel card */}
      <div style={{ display:"flex", width:"100%", maxWidth:860,
        borderRadius:16, overflow:"hidden", boxShadow:"0 8px 40px rgba(0,0,0,.12)" }}>

        {/* Left — gradient panel with logo */}
        <div style={{ flex:"0 0 340px", background:"linear-gradient(160deg,#F5A623 0%,#FDDEA0 100%)",
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          padding:"56px 40px", gap:20 }}>
          <div style={{ width:200, height:200 }}>
            <ImageWithFallback src={logoSrc} alt="PdSPA Seal"
              style={{ width:"100%", height:"100%", objectFit:"contain", filter:"drop-shadow(0 2px 8px rgba(0,0,0,.15))" }}/>
          </div>
          <div style={{ textAlign:"center" }}>
            <p style={{ fontSize:20, fontWeight:700, color:"#3D1F00", margin:0, lineHeight:1.3 }}>
              PdSPA Record<br/>Management System
            </p>
          </div>
        </div>

        {/* Right — login form */}
        <div style={{ flex:1, background:"#FFFFFF",
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          padding:"56px 60px 48px" }}>

          <h1 style={{ fontSize:22, fontWeight:800, color:"#C9960A", letterSpacing:".12em",
            textTransform:"uppercase", margin:"0 0 36px" }}>
            User Login
          </h1>

          <form onSubmit={submit} noValidate style={{ width:"100%", maxWidth:360, display:"flex", flexDirection:"column", gap:28 }}>
            {/* Username */}
            <div>
              <input type="text" placeholder="Username" value={user} autoComplete="username"
                onChange={e => { setUser(e.target.value); setErr(""); }}
                style={ulInp}
                onFocus={e => (e.currentTarget.style.borderBottomColor="#C9960A")}
                onBlur={e  => (e.currentTarget.style.borderBottomColor="#D6CC9A")}/>
            </div>

            {/* Password */}
            <div style={{ position:"relative" }}>
              <input type={showPw ? "text" : "password"} placeholder="Password" value={pass}
                autoComplete="current-password"
                onChange={e => { setPass(e.target.value); setErr(""); }}
                style={{ ...ulInp, paddingRight:28 }}
                onFocus={e => (e.currentTarget.style.borderBottomColor="#C9960A")}
                onBlur={e  => (e.currentTarget.style.borderBottomColor="#D6CC9A")}/>
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{ position:"absolute", right:0, top:"50%", transform:"translateY(-50%)",
                  background:"none", border:"none", cursor:"pointer", padding:0, color:"#A8964A", fontSize:16 }}>
                {showPw ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>

            {err && <p style={{ margin:"-16px 0 0", fontSize:13, color:T.red }}>{err}</p>}

            {/* Login button */}
            <button type="submit" disabled={busy}
              style={{ width:"100%", padding:"12px", borderRadius:99,
                background:"#C9960A", color:"#fff", border:"none", cursor:busy?"not-allowed":"pointer",
                fontSize:15, fontWeight:800, letterSpacing:".12em", textTransform:"uppercase",
                opacity:busy?.7:1, transition:"opacity .15s" }}>
              {busy ? "Signing in..." : "Login"}
            </button>
          </form>

          {/* Demo hints */}
          <div style={{ marginTop:32, width:"100%", maxWidth:360 }}>
            <p style={{ fontSize:11, color:T.muted, textTransform:"uppercase", letterSpacing:".06em",
              fontWeight:700, marginBottom:8 }}>Demo accounts</p>
            {DEMO.map(d => (
              <button key={d.r} onClick={() => { setUser(d.u); setPass(d.p); }}
                style={{ display:"flex", justifyContent:"space-between", width:"100%",
                  padding:"4px 0", background:"none", border:"none", cursor:"pointer",
                  fontSize:12, color:T.sub }}>
                <span style={{ fontWeight:600 }}>{d.label}</span>
                <span style={{ fontFamily:"monospace", color:T.muted }}>{d.u} / {d.p}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── DASHBOARD ──────────────────────────────────────────── */
/* ─── MASS INTENTION STATUS ──────────────────────────────── */
const MASS_STATUS_CFG: Record<MassReqStatus, { label: string; col: string; bg: string }> = {
  pending:    { label:"Pending",    col:"#92400E", bg:"#FEF3C7" },
  confirmed:  { label:"Confirmed",  col:"#065F46", bg:"#D1FAE5" },
  celebrated: { label:"Celebrated", col:"#4B5563", bg:"#F3F4F6" },
};

function MassBadge({ status }: { status: MassReqStatus }) {
  const { label, col, bg } = MASS_STATUS_CFG[status];
  return <span style={{ padding:"2px 8px", borderRadius:4, fontSize:12, fontWeight:600,
    background:bg, color:col, whiteSpace:"nowrap" }}>{label}</span>;
}

/* ─── MASS INTENTIONS CARD ───────────────────────────────── */
function MassIntentionsCard({ intentions, setIntentions }:
  { intentions: MassIntention[]; setIntentions: React.Dispatch<React.SetStateAction<MassIntention[]>> }) {

  const [tab,    setTab]    = useState<"list"|"new">("list");
  const [viewM,  setViewM]  = useState<MassIntention|null>(null);
  const [busy,   setBusy]   = useState(false);

  const blank = { requestor:"", contact:"", intention:"", massType:"For the Repose of Soul" as MassType,
    massDate:"", massTime:"6:00 AM", offering:"", celebrant:"", notes:"" };
  const [form, setForm] = useState(blank);
  const [ferr, setFerr] = useState<Record<string,string>>({});
  const sf = (k: string, v: string) => { setForm(p => ({...p,[k]:v})); setFerr(p => ({...p,[k]:""})); };

  const upcoming = intentions
    .filter(m => m.status !== "celebrated")
    .sort((a,b) => a.massDate.localeCompare(b.massDate));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const e2: Record<string,string> = {};
    if (!form.requestor.trim())  e2.requestor  = "Required";
    if (!form.contact.trim())    e2.contact     = "Required";
    if (!form.intention.trim())  e2.intention   = "Required";
    if (!form.massDate)          e2.massDate    = "Required";
    setFerr(e2); if (Object.keys(e2).length) return;
    setBusy(true);
    await new Promise(r => setTimeout(r, 600));
    setIntentions(p => [{ id:nmid(), requestDate:todayISO(), status:"pending", ...form }, ...p]);
    setForm(blank); setFerr({}); setBusy(false); setTab("list");
  }

  const tabBtn = (label: string, t: "list"|"new", count?: number) => (
    <button onClick={() => setTab(t)}
      style={{ padding:"8px 14px", fontSize:13, fontWeight:tab===t?600:400,
        color:tab===t?T.text:T.muted, background:"none", border:"none",
        borderBottom:`2px solid ${tab===t?T.primary:"transparent"}`, cursor:"pointer",
        display:"flex", alignItems:"center", gap:5 }}>
      {label}
      {count !== undefined && count > 0 && (
        <span style={{ background:T.primary, color:"#fff", borderRadius:99,
          fontSize:11, fontWeight:700, padding:"1px 5px" }}>{count}</span>
      )}
    </button>
  );

  const g2: React.CSSProperties = { display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 };
  const pendingCount = intentions.filter(m => m.status === "pending").length;

  return (
    <Card>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"16px 22px", borderBottom:`1px solid ${T.border}` }}>
        <div style={{ fontSize:14, fontWeight:700, color:T.text }}>Mass Intentions</div>
        <div style={{ display:"flex" }}>
          {tabBtn("Schedule", "list", pendingCount)}
          {tabBtn("New Booking", "new")}
        </div>
      </div>

      {/* LIST */}
      {tab === "list" && (
        <>
          {upcoming.length === 0 && (
            <p style={{ padding:"20px 16px", fontSize:14, color:T.muted, textAlign:"center", margin:0 }}>
              No upcoming mass intentions.
            </p>
          )}
          <div style={{ maxHeight:320, overflowY:"auto" }}>
            {upcoming.map((m, i) => (
              <div key={m.id}
                style={{ display:"flex", alignItems:"center", gap:20, padding:"16px 22px",
                  borderBottom:`1px solid ${T.border}`, background: i%2===1 ? T.bg : T.surface }}>

                {/* Date block */}
                <div style={{ flexShrink:0, width:44, textAlign:"center", padding:"4px 6px",
                  background:T.priLight, border:`1px solid ${T.borderMd}`, borderRadius:6 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:T.primary, textTransform:"uppercase" }}>
                    {m.massDate ? new Date(m.massDate+"T00:00:00").toLocaleDateString("en-PH",{month:"short"}) : "—"}
                  </div>
                  <div style={{ fontSize:22, fontWeight:800, color:T.text, lineHeight:1.1 }}>
                    {m.massDate ? new Date(m.massDate+"T00:00:00").getDate() : "—"}
                  </div>
                  <div style={{ fontSize:9, color:T.muted }}>{m.massTime}</div>
                </div>

                {/* Details */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:T.text,
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {m.intention}
                  </div>
                  <div style={{ fontSize:12, color:T.muted }}>
                    {m.massType} &bull; {m.requestor}
                    {m.offering && <span style={{ marginLeft:6 }}>· PHP {m.offering}</span>}
                  </div>
                </div>

                <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                  <MassBadge status={m.status}/>
                  <button onClick={() => setViewM(m)}
                    style={{ fontSize:12, color:T.muted, background:"none", border:"none",
                      cursor:"pointer", padding:"2px 6px" }}>
                    View
                  </button>
                  {m.status === "pending" && (
                    <button onClick={() => setIntentions(p => p.map(x => x.id===m.id?{...x,status:"confirmed"}:x))}
                      style={{ fontSize:12, color:T.green, background:T.greenL, border:`1px solid ${T.greenB}`,
                        borderRadius:4, padding:"2px 8px", cursor:"pointer", fontWeight:600 }}>
                      Confirm
                    </button>
                  )}
                  {m.status === "confirmed" && (
                    <button onClick={() => setIntentions(p => p.map(x => x.id===m.id?{...x,status:"celebrated"}:x))}
                      style={{ fontSize:12, color:T.sub, background:T.bg, border:`1px solid ${T.border}`,
                        borderRadius:4, padding:"2px 8px", cursor:"pointer", fontWeight:600 }}>
                      Done
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Celebrated count */}
          {intentions.filter(m=>m.status==="celebrated").length > 0 && (
            <div style={{ padding:"7px 14px", borderTop:`1px solid ${T.border}`, background:T.bg }}>
              <span style={{ fontSize:12, color:T.muted }}>
                {intentions.filter(m=>m.status==="celebrated").length} celebrated this period
              </span>
            </div>
          )}
        </>
      )}

      {/* NEW BOOKING FORM */}
      {tab === "new" && (
        <form onSubmit={submit} noValidate style={{ padding:14, display:"flex", flexDirection:"column", gap:10 }}>
          <div style={g2}>
            <div>
              <FL req>Requestor Name</FL>
              <FI value={form.requestor} placeholder="Full name" onChange={e => sf("requestor",e.target.value)}/>
              {ferr.requestor && <p style={{ fontSize:12,color:T.red,margin:"2px 0 0" }}>{ferr.requestor}</p>}
            </div>
            <div>
              <FL req>Contact No.</FL>
              <FI value={form.contact} placeholder="09XX-XXX-XXXX" onChange={e => sf("contact",e.target.value)}/>
              {ferr.contact && <p style={{ fontSize:12,color:T.red,margin:"2px 0 0" }}>{ferr.contact}</p>}
            </div>
          </div>
          <div>
            <FL req>Name / Intention</FL>
            <FI value={form.intention} placeholder="e.g., + Juan dela Cruz, For healing of Maria..." onChange={e => sf("intention",e.target.value)}/>
            {ferr.intention && <p style={{ fontSize:12,color:T.red,margin:"2px 0 0" }}>{ferr.intention}</p>}
          </div>
          <div>
            <FL req>Intention Type</FL>
            <FS value={form.massType} onChange={e => sf("massType",e.target.value)}>
              {MASS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </FS>
          </div>
          <div style={g2}>
            <div>
              <FL req>Mass Date</FL>
              <FI type="date" value={form.massDate} min={todayISO()} onChange={e => sf("massDate",e.target.value)}/>
              {ferr.massDate && <p style={{ fontSize:12,color:T.red,margin:"2px 0 0" }}>{ferr.massDate}</p>}
            </div>
            <div>
              <FL>Mass Time</FL>
              <FS value={form.massTime} onChange={e => sf("massTime",e.target.value)}>
                {MASS_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
              </FS>
            </div>
          </div>
          <div style={g2}>
            <div>
              <FL>Offering (PHP)</FL>
              <FI type="number" value={form.offering} placeholder="e.g., 300" onChange={e => sf("offering",e.target.value)}/>
            </div>
            <div>
              <FL>Assigned Celebrant</FL>
              <FI value={form.celebrant} placeholder="Fr. Rene Tabios" onChange={e => sf("celebrant",e.target.value)}/>
            </div>
          </div>
          <div>
            <FL>Notes</FL>
            <FT rows={2} value={form.notes} placeholder="Special instructions..." onChange={e => sf("notes",e.target.value)}/>
          </div>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:12, paddingTop:4 }}>
            <Btn variant="ghost" size="sm" type="button" onClick={() => { setForm(blank); setFerr({}); }}>Clear</Btn>
            <Btn variant="primary" size="sm" type="submit" disabled={busy}>{busy?"Saving...":"Book Mass"}</Btn>
          </div>
        </form>
      )}

      {/* VIEW MODAL */}
      <Modal open={!!viewM} title={viewM?.id ?? ""} onClose={() => setViewM(null)}
        footer={<Btn variant="ghost" onClick={() => setViewM(null)}>Close</Btn>}>
        {viewM && (
          <dl style={{ display:"grid", gridTemplateColumns:"auto 1fr", gap:"8px 20px", fontSize:14 }}>
            {([["ID",viewM.id],["Requestor",viewM.requestor],["Contact",viewM.contact],
              ["Intention",viewM.intention],["Type",viewM.massType],
              ["Mass Date",fmt(viewM.massDate)],["Mass Time",viewM.massTime],
              ["Offering",viewM.offering?`PHP ${viewM.offering}`:"—"],
              ["Celebrant",viewM.celebrant||"—"],["Notes",viewM.notes||"—"]] as [string,string][])
              .map(([k,v]) => (
                <div key={k} style={{ display:"contents" }}>
                  <dt style={{ fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:".04em",color:T.muted,paddingTop:2 }}>{k}</dt>
                  <dd style={{ color:T.text }}>{v}</dd>
                </div>
              ))}
            <div style={{ display:"contents" }}>
              <dt style={{ fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:".04em",color:T.muted }}>Status</dt>
              <dd><MassBadge status={viewM.status}/></dd>
            </div>
          </dl>
        )}
      </Modal>
    </Card>
  );
}

interface Todo { id: number; text: string; done: boolean; }

function QuickTodos() {
  const [todos, setTodos] = useState<Todo[]>([
    { id:1, text:"Verify pending baptismal request (SARMS-2026-004)", done:false },
    { id:2, text:"Update book entry — Burial/Death Vol. 15",           done:false },
    { id:3, text:"Print certificate for Rosario Layug",                done:true  },
  ]);
  const [input, setInput] = useState("");

  function add() {
    const t = input.trim();
    if (!t) return;
    setTodos(p => [...p, { id: Date.now(), text:t, done:false }]);
    setInput("");
  }
  function toggle(id: number) { setTodos(p => p.map(x => x.id===id ? {...x, done:!x.done} : x)); }
  function remove(id: number) { setTodos(p => p.filter(x => x.id !== id)); }

  const done  = todos.filter(x => x.done).length;
  const total = todos.length;

  return (
    <Card>
      <CardHead
        title="Quick To-Dos"
        sub={total ? `${done} of ${total} done` : "No tasks yet"}
        right={
          done > 0 && (
            <button onClick={() => setTodos(p => p.filter(x => !x.done))}
              style={{ fontSize:12, color:T.muted, background:"none", border:"none", cursor:"pointer", padding:0 }}>
              Clear done
            </button>
          )
        }
      />

      {/* Progress bar */}
      {total > 0 && (
        <div style={{ height:3, background:T.border }}>
          <div style={{ height:"100%", background:T.primary, width:`${(done/total)*100}%`, transition:"width .3s" }}/>
        </div>
      )}

      {/* List */}
      <div style={{ maxHeight:260, overflowY:"auto" }}>
        {todos.length === 0 && (
          <p style={{ padding:"20px 16px", fontSize:14, color:T.muted, textAlign:"center", margin:0 }}>
            No tasks. Add one below.
          </p>
        )}
        {todos.map(todo => (
          <div key={todo.id}
            style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 16px",
              borderBottom:`1px solid ${T.border}`, background: todo.done ? T.bg : T.surface }}>
            <button onClick={() => toggle(todo.id)}
              style={{ width:16, height:16, borderRadius:4, flexShrink:0, cursor:"pointer",
                border:`1.5px solid ${todo.done ? T.primary : T.borderMd}`,
                background: todo.done ? T.primary : "transparent",
                display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>
              {todo.done && (
                <svg width="9" height="9" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
            <span style={{ flex:1, fontSize:14, color: todo.done ? T.muted : T.text,
              textDecoration: todo.done ? "line-through" : "none", lineHeight:1.4 }}>
              {todo.text}
            </span>
            <button onClick={() => remove(todo.id)}
              style={{ background:"none", border:"none", cursor:"pointer", color:T.muted,
                fontSize:15, lineHeight:1, padding:"0 2px", opacity:.5 }}
              onMouseEnter={e => (e.currentTarget.style.opacity="1")}
              onMouseLeave={e => (e.currentTarget.style.opacity=".5")}>
              x
            </button>
          </div>
        ))}
      </div>

      {/* Add input */}
      <div style={{ display:"flex", gap:12, padding:"12px 16px", borderTop:`1px solid ${T.border}` }}>
        <input
          type="text"
          placeholder="Add a task..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") add(); }}
          style={{ flex:1, border:"none", borderBottom:`1.5px solid ${T.border}`, padding:"4px 0",
            fontSize:14, fontFamily:"inherit", color:T.text, background:"transparent", outline:"none" }}
          onFocus={e  => (e.currentTarget.style.borderBottomColor = T.primary)}
          onBlur={e   => (e.currentTarget.style.borderBottomColor = T.border)}
        />
        <button onClick={add}
          style={{ padding:"4px 14px", borderRadius:6, background:T.primary, color:"#fff",
            border:"none", cursor:"pointer", fontSize:14, fontWeight:600 }}>
          Add
        </button>
      </div>
    </Card>
  );
}

function DashboardView({ appts, setView, massInts, setMassInts }:
  { appts: Appointment[]; setView: (v: View) => void;
    massInts: MassIntention[]; setMassInts: React.Dispatch<React.SetStateAction<MassIntention[]>> }) {
  const pending   = appts.filter(a => a.status === "pending").length;
  const scheduled = appts.filter(a => a.status === "scheduled").length;
  const completed = appts.filter(a => a.status === "completed").length;
  const total     = appts.length;

  const chartData = SACR_LIST.map(t => ({
    name: t.split("/")[0].split(" ").slice(-1)[0],
    full: t,
    count: appts.filter(a => a.sacramentType === t).length,
    col: SACR[t]?.col ?? T.primary,
  })).filter(x => x.count > 0);

  const stat = (label: string, val: number, note: string) => (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:"22px 26px" }}>
      <div style={{ fontSize:12, fontWeight:600, color:T.sub, textTransform:"uppercase", letterSpacing:".04em", marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:34, fontWeight:800, color:T.text, lineHeight:1 }}>{val}</div>
      <div style={{ fontSize:12, color:T.muted, marginTop:4 }}>{note}</div>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:T.text, margin:0 }}>Dashboard</h1>
        <p style={{ fontSize:15, color:T.muted, marginTop:4 }}>
          {new Date().toLocaleDateString("en-PH", { weekday:"long", month:"long", day:"numeric", year:"numeric" })}
        </p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:20, marginBottom:20 }}>
        {stat("Total Requests", total,     "All time")}
        {stat("Pending",        pending,   "Awaiting action")}
        {stat("Scheduled",      scheduled, "Confirmed")}
        {stat("Completed",      completed, "Processed")}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1.5fr 1fr", gap:28, alignItems:"start" }}>
        {/* Left column */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <Card>
            <CardHead title="Requests by Sacrament Type"/>
            <div style={{ padding:16 }}>
              <SimpleBarChart data={chartData} height={260}/>
            </div>
          </Card>

          <QuickTodos/>
        </div>

        {/* Right column */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <MassIntentionsCard intentions={massInts} setIntentions={setMassInts}/>

          <Card>
            <CardHead title="Recent Activity"/>
            <div>
              {appts.slice(0, 5).map((a, i) => (
                <div key={a.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                  padding:"11px 16px", borderBottom: i < 4 ? `1px solid ${T.border}` : "none", gap:10 }}>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:T.text,
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.subjectName}</div>
                    <div style={{ fontSize:12, color:T.muted }}>{a.sacramentType}</div>
                  </div>
                  <Badge status={a.status}/>
                </div>
              ))}
            </div>
            <div style={{ padding:"16px 22px", borderTop:`1px solid ${T.border}` }}>
              <button onClick={() => setView("appointments")}
                style={{ fontSize:13, color:T.primary, background:"none", border:"none", cursor:"pointer", padding:0 }}>
                View all appointments
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ─── APPOINTMENTS ───────────────────────────────────────── */
function AppointmentsView({ appts, setAppts, push }:
  { appts: Appointment[]; setAppts: React.Dispatch<React.SetStateAction<Appointment[]>>;
    push: (t: Toast["type"], m: string) => void }) {
  const [tab,       setTab]       = useState<"list"|"new">("list");
  const [viewA,     setViewA]     = useState<Appointment|null>(null);
  const [verifying, setVerifying] = useState<Appointment|null>(null);
  const [schedNote, setSchedNote] = useState({ date:"", note:"" });
  const tb = useTable<Appointment>(appts, ["id","parishioner","subjectName","sacramentType","status"] as (keyof Appointment)[], 10);

  const updateStatus = (id: string, status: AppStatus, extra?: Partial<Appointment>) => {
    setAppts(a => a.map(x => x.id === id ? { ...x, status, ...extra } : x));
    push("success", `Appointment ${id} updated to ${status}.`);
  };

  const blank = { parishioner:"", contact:"", email:"", sacramentType:"", subjectName:"",
    dateOfSacrament:"", purposeOf:"", referenceNo:"", staffNotes:"" };
  const [form, setForm] = useState(blank);
  const [ferr, setFerr] = useState<Record<string,string>>({});
  const [busy, setBusy] = useState(false);
  const sf = (k: string, v: string) => { setForm(p => ({ ...p, [k]:v })); setFerr(p => ({ ...p, [k]:"" })); };

  async function submitNew(e: React.FormEvent) {
    e.preventDefault();
    const e2: Record<string,string> = {};
    if (!form.parishioner.trim()) e2.parishioner = "Required";
    if (!form.contact.trim())     e2.contact     = "Required";
    if (!form.sacramentType)      e2.sacramentType = "Required";
    if (!form.subjectName.trim()) e2.subjectName = "Required";
    if (!form.purposeOf.trim())   e2.purposeOf   = "Required";
    setFerr(e2); if (Object.keys(e2).length) return;
    setBusy(true);
    await new Promise(r => setTimeout(r, 700));
    setAppts(p => [{ id:nid(), requestDate:todayISO(), status:"pending", scheduledDate:"", ...form }, ...p]);
    push("success", `New appointment request submitted.`);
    setForm(blank); setBusy(false); setTab("list");
  }

  const g2: React.CSSProperties = { display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 };
  const tabBtn = (label: string, t: "list"|"new") => (
    <button onClick={() => setTab(t)}
      style={{ padding:"8px 14px", fontSize:14, fontWeight:tab===t?600:400,
        color:tab===t?T.text:T.muted, background:"none", border:"none",
        borderBottom:`2px solid ${tab===t?T.primary:"transparent"}`, cursor:"pointer" }}>
      {label}
    </button>
  );

  return (
    <div>
      <div style={{ marginBottom:16 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:T.text, margin:0 }}>Appointments</h1>
      </div>

      <div style={{ borderBottom:`1px solid ${T.border}`, marginBottom:16, display:"flex" }}>
        {tabBtn("All Appointments", "list")}
        {tabBtn("New Request", "new")}
      </div>

      {tab === "list" && (
        <Card>
          {/* Filters */}
          <div style={{ display:"flex", gap:12, padding:"12px 16px", borderBottom:`1px solid ${T.border}`, flexWrap:"wrap" }}>
            <input type="search" placeholder="Search..." value={tb.search}
              onChange={e => { tb.setSearch(e.target.value); tb.setPage(1); }}
              style={{ ...inp, width:256 }}/>
            <FS value={tb.fKey==="status"?tb.fVal:""} style={{ width:140 }}
              onChange={e => { tb.setFKey("status"); tb.setFVal(e.target.value); tb.setPage(1); }}>
              <option value="">All Statuses</option>
              {(["pending","verified","scheduled","completed","cancelled"] as AppStatus[]).map(s =>
                <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
            </FS>
            <FS value={tb.fKey==="sacramentType"?tb.fVal:""} style={{ width:180 }}
              onChange={e => { tb.setFKey("sacramentType"); tb.setFVal(e.target.value); tb.setPage(1); }}>
              <option value="">All Types</option>
              {SACR_LIST.map(s => <option key={s} value={s}>{s}</option>)}
            </FS>
            {(tb.search || tb.fVal) && (
              <Btn variant="ghost" size="sm" onClick={() => { tb.setSearch(""); tb.setFVal(""); tb.setFKey(""); tb.setPage(1); }}>Clear</Btn>
            )}
          </div>

          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr>
                  <th style={TH}>Ref. No.</th>
                  <SortTh label="Parishioner" field="parishioner" sf={tb.sortF} sd={tb.sortD} sort={() => tb.sort("parishioner")}/>
                  <th style={TH}>Subject Name</th>
                  <th style={TH}>Sacrament Type</th>
                  <SortTh label="Date Requested" field="requestDate" sf={tb.sortF} sd={tb.sortD} sort={() => tb.sort("requestDate")}/>
                  <SortTh label="Status" field="status" sf={tb.sortF} sd={tb.sortD} sort={() => tb.sort("status")}/>
                  <th style={{ ...TH, textAlign:"right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tb.paged.length === 0 && (
                  <tr><td colSpan={7} style={{ ...TD, textAlign:"center", color:T.muted, padding:32 }}>No records found.</td></tr>
                )}
                {tb.paged.map((a, i) => (
                  <tr key={a.id} style={{ background: i%2===1 ? T.bg : T.surface }}
                    onMouseEnter={e => (e.currentTarget.style.background = T.priLight)}
                    onMouseLeave={e => (e.currentTarget.style.background = i%2===1 ? T.bg : T.surface)}>
                    <td style={{ ...TD, fontFamily:"monospace", fontSize:12, color:T.muted }}>{a.id}</td>
                    <td style={{ ...TD, fontWeight:500 }}>{a.parishioner}</td>
                    <td style={TD}>{a.subjectName}</td>
                    <td style={TD}><TypeTag type={a.sacramentType}/></td>
                    <td style={{ ...TD, color:T.muted, fontSize:13 }}>{fmtShort(a.requestDate)}</td>
                    <td style={TD}><Badge status={a.status}/></td>
                    <td style={{ ...TD, textAlign:"right", whiteSpace:"nowrap" }}>
                      <Btn variant="ghost" size="sm" style={{ marginRight:4 }} onClick={() => setViewA(a)}>View</Btn>
                      {a.status === "pending"    && <Btn variant="outline" size="sm" onClick={() => setVerifying(a)}>Verify</Btn>}
                      {a.status === "verified"   && <Btn variant="outline" size="sm" onClick={() => setVerifying(a)}>Schedule</Btn>}
                      {a.status === "scheduled"  && <Btn variant="primary" size="sm" onClick={() => updateStatus(a.id,"completed")}>Complete</Btn>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"10px 16px", borderTop:`1px solid ${T.border}`, background:T.bg }}>
            <span style={{ fontSize:13, color:T.muted }}>Showing {tb.paged.length} of {tb.total}</span>
            <Paginator page={tb.page} total={tb.totalPages} set={tb.setPage}/>
          </div>
        </Card>
      )}

      {tab === "new" && (
        <Card style={{ maxWidth:820 }}>
          <CardHead title="New Appointment Request" sub="Submit a sacramental certificate request"/>
          <form onSubmit={submitNew} noValidate style={{ padding:20, display:"flex", flexDirection:"column", gap:12 }}>
            <div style={g2}>
              <div><FL req>Parishioner Name</FL><FI value={form.parishioner} placeholder="Full name" onChange={e => sf("parishioner",e.target.value)}/>{ferr.parishioner&&<p style={{ fontSize:12,color:T.red,margin:"2px 0 0" }}>{ferr.parishioner}</p>}</div>
              <div><FL req>Contact Number</FL><FI value={form.contact} placeholder="09XX-XXX-XXXX" onChange={e => sf("contact",e.target.value)}/>{ferr.contact&&<p style={{ fontSize:12,color:T.red,margin:"2px 0 0" }}>{ferr.contact}</p>}</div>
            </div>
            <div><FL>Email Address</FL><FI type="email" value={form.email} placeholder="email@example.com" onChange={e => sf("email",e.target.value)}/></div>
            <div>
              <FL req>Sacrament / Service Type</FL>
              <FS value={form.sacramentType} onChange={e => sf("sacramentType",e.target.value)}>
                <option value="" disabled>Select type...</option>
                {SACR_LIST.map(s => <option key={s} value={s}>{s}</option>)}
              </FS>
              {ferr.sacramentType && <p style={{ fontSize:12,color:T.red,margin:"2px 0 0" }}>{ferr.sacramentType}</p>}
            </div>
            <div><FL req>Subject Name</FL><FI value={form.subjectName} placeholder="Name as it appears in the register" onChange={e => sf("subjectName",e.target.value)}/>{ferr.subjectName&&<p style={{ fontSize:12,color:T.red,margin:"2px 0 0" }}>{ferr.subjectName}</p>}</div>
            <div style={g2}>
              <div><FL>Date of Sacrament</FL><FI type="date" value={form.dateOfSacrament} onChange={e => sf("dateOfSacrament",e.target.value)}/></div>
              <div><FL>Reference / Payment No.</FL><FI value={form.referenceNo} placeholder="GCash or bank ref." onChange={e => sf("referenceNo",e.target.value)}/></div>
            </div>
            <div><FL req>Purpose of Request</FL><FI value={form.purposeOf} placeholder="e.g., School enrollment, employment..." onChange={e => sf("purposeOf",e.target.value)}/>{ferr.purposeOf&&<p style={{ fontSize:12,color:T.red,margin:"2px 0 0" }}>{ferr.purposeOf}</p>}</div>
            <div><FL>Additional Notes</FL><FT value={form.staffNotes} rows={3} placeholder="Special instructions..." onChange={e => sf("staffNotes",e.target.value)}/></div>
            <Divider/>
            <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
              <Btn variant="ghost" type="button" onClick={() => { setForm(blank); setFerr({}); }}>Clear</Btn>
              <Btn variant="primary" type="submit" disabled={busy}>{busy ? "Submitting..." : "Submit Request"}</Btn>
            </div>
          </form>
        </Card>
      )}

      {/* View modal */}
      <Modal open={!!viewA} title={viewA?.id ?? ""} onClose={() => setViewA(null)}
        footer={<><Btn variant="ghost" onClick={() => setViewA(null)}>Close</Btn>
          {viewA?.status==="pending" && <Btn variant="primary" onClick={() => { setVerifying(viewA); setViewA(null); }}>Verify</Btn>}</>}>
        {viewA && (
          <dl style={{ display:"grid", gridTemplateColumns:"auto 1fr", gap:"8px 20px", fontSize:14 }}>
            {([["ID",viewA.id],["Parishioner",viewA.parishioner],["Contact",viewA.contact],["Email",viewA.email||"—"],
              ["Subject",viewA.subjectName],["Sacrament",viewA.sacramentType],
              ["Date of Sacrament",fmt(viewA.dateOfSacrament)],["Purpose",viewA.purposeOf],
              ["Reference No.",viewA.referenceNo||"—"],["Scheduled",viewA.scheduledDate?fmt(viewA.scheduledDate):"—"],
              ["Notes",viewA.staffNotes||"—"]] as [string,string][]).map(([k,v]) => (
              <div key={k} style={{ display:"contents" }}>
                <dt style={{ fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:".04em",color:T.muted,paddingTop:2 }}>{k}</dt>
                <dd style={{ color:T.text }}>{v}</dd>
              </div>
            ))}
            <div style={{ display:"contents" }}><dt style={{ fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:".04em",color:T.muted }}>Status</dt><dd><Badge status={viewA.status}/></dd></div>
          </dl>
        )}
      </Modal>

      {/* Verify/Schedule modal */}
      <Modal open={!!verifying}
        title={verifying?.status==="pending" ? "Verify Appointment" : "Schedule Appointment"}
        onClose={() => setVerifying(null)}
        footer={<>
          <Btn variant="ghost" onClick={() => setVerifying(null)}>Cancel</Btn>
          <Btn variant="primary" onClick={() => {
            if (!verifying) return;
            if (verifying.status==="pending") updateStatus(verifying.id,"verified",{ staffNotes:schedNote.note||verifying.staffNotes });
            else updateStatus(verifying.id,"scheduled",{ scheduledDate:schedNote.date, staffNotes:schedNote.note||verifying.staffNotes });
            setVerifying(null); setSchedNote({date:"",note:""});
          }}>{verifying?.status==="pending" ? "Mark Verified" : "Confirm Schedule"}</Btn>
        </>}>
        {verifying && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ padding:"10px 16px", background:T.bg, border:`1px solid ${T.border}`, borderRadius:6, fontSize:14 }}>
              <strong>{verifying.id}</strong> — {verifying.subjectName} ({verifying.sacramentType})
            </div>
            {verifying.status==="verified" && (
              <div><FL req>Scheduled Date</FL><FI type="date" value={schedNote.date} min={todayISO()} onChange={e => setSchedNote(p => ({...p,date:e.target.value}))}/></div>
            )}
            <div><FL>Staff Notes</FL><FT rows={3} value={schedNote.note} placeholder="Verification notes, book volume/page..." onChange={e => setSchedNote(p => ({...p,note:e.target.value}))}/></div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ─── CERTIFICATES ───────────────────────────────────────── */
function CertificatesView({ appts, certReqs, setCertReqs, push }:
  { appts: Appointment[];
    certReqs: CertRequest[]; setCertReqs: React.Dispatch<React.SetStateAction<CertRequest[]>>;
    push: (t: Toast["type"], m: string) => void }) {

  const [tab, setTab] = useState<"requests"|"new"|"print">("requests");

  /* ── Print tab state ── */
  const [selected, setSelected] = useState<Appointment|null>(null);
  const [printSearch, setPrintSearch] = useState("");
  const [logoB64, setLogoB64]   = useState("");

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width; c.height = img.height;
      c.getContext("2d")!.drawImage(img, 0, 0);
      setLogoB64(c.toDataURL("image/png"));
    };
    img.src = logoSrc as string;
  }, []);

  const printable = appts.filter(a => a.status === "completed" || a.status === "scheduled" || a.status === "verified");
  const filteredPrint = printable.filter(a =>
    !printSearch || `${a.subjectName} ${a.parishioner} ${a.id} ${a.sacramentType}`.toLowerCase().includes(printSearch.toLowerCase()));

  function doPrint(a: Appointment) {
    const w = window.open("","_blank","width=840,height=700");
    if (!w) { push("error","Allow pop-ups to print."); return; }
    w.document.write(generateCertHTML(a, logoB64 || logoSrc as string));
    w.document.close();
    push("success",`Certificate for ${a.subjectName} sent to printer.`);
  }

  /* ── Requests tab state ── */
  const [viewR,  setViewR]  = useState<CertRequest|null>(null);
  const [procR,  setProcR]  = useState<CertRequest|null>(null);
  const [procNote, setProcNote] = useState("");
  const tb = useTable<CertRequest>(certReqs, ["id","parishioner","subjectName","sacramentType","status"] as (keyof CertRequest)[], 10);

  const updateCertStatus = (id: string, status: CertReqStatus, extra?: Partial<CertRequest>) => {
    setCertReqs(r => r.map(x => x.id === id ? { ...x, status, ...extra } : x));
    push("success", `Certificate request ${id} updated to ${status}.`);
  };

  /* ── New request form ── */
  const blankCR = { parishioner:"", contact:"", email:"", sacramentType:"", subjectName:"",
    dateOfSacrament:"", purposeOf:"", referenceNo:"" };
  const [form, setForm] = useState(blankCR);
  const [ferr, setFerr] = useState<Record<string,string>>({});
  const [busy, setBusy] = useState(false);
  const sf = (k: string, v: string) => { setForm(p => ({...p,[k]:v})); setFerr(p => ({...p,[k]:""})); };

  async function submitNew(e: React.FormEvent) {
    e.preventDefault();
    const e2: Record<string,string> = {};
    if (!form.parishioner.trim()) e2.parishioner   = "Required";
    if (!form.contact.trim())     e2.contact        = "Required";
    if (!form.sacramentType)      e2.sacramentType  = "Required";
    if (!form.subjectName.trim()) e2.subjectName    = "Required";
    if (!form.purposeOf.trim())   e2.purposeOf      = "Required";
    setFerr(e2); if (Object.keys(e2).length) return;
    setBusy(true);
    await new Promise(r => setTimeout(r, 700));
    const newR: CertRequest = { id:ncid(), requestDate:todayISO(), status:"pending",
      staffNotes:"", claimedDate:"", ...form };
    setCertReqs(p => [newR, ...p]);
    push("success", `Certificate request ${newR.id} submitted.`);
    setForm(blankCR); setFerr({}); setBusy(false); setTab("requests");
  }

  const tabBtn = (label: string, t: typeof tab, count?: number) => (
    <button onClick={() => setTab(t)}
      style={{ padding:"8px 14px", fontSize:14, fontWeight:tab===t?600:400,
        color:tab===t?T.text:T.muted, background:"none", border:"none",
        borderBottom:`2px solid ${tab===t?T.primary:"transparent"}`, cursor:"pointer",
        display:"flex", alignItems:"center", gap:6 }}>
      {label}
      {count !== undefined && count > 0 && (
        <span style={{ background:T.primary, color:"#fff", borderRadius:99,
          fontSize:11, fontWeight:700, padding:"1px 6px", lineHeight:1.4 }}>{count}</span>
      )}
    </button>
  );

  const g2: React.CSSProperties = { display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 };
  const pendingCount = certReqs.filter(r => r.status === "pending").length;

  return (
    <div>
      <div style={{ marginBottom:0 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:T.text, margin:0 }}>Certificates</h1>
      </div>

      <div style={{ borderBottom:`1px solid ${T.border}`, marginBottom:16, display:"flex" }}>
        {tabBtn("Certificate Requests", "requests", pendingCount)}
        {tabBtn("New Request",          "new")}
        {tabBtn("Print Certificate",    "print")}
      </div>

      {/* ── REQUESTS LIST TAB ── */}
      {tab === "requests" && (
        <Card>
          <div style={{ display:"flex", gap:12, padding:"12px 16px", borderBottom:`1px solid ${T.border}`, flexWrap:"wrap" }}>
            <input type="search" placeholder="Search..." value={tb.search}
              onChange={e => { tb.setSearch(e.target.value); tb.setPage(1); }}
              style={{ ...inp, width:256 }}/>
            <FS value={tb.fKey==="status"?tb.fVal:""} style={{ width:150 }}
              onChange={e => { tb.setFKey("status"); tb.setFVal(e.target.value); tb.setPage(1); }}>
              <option value="">All Statuses</option>
              {(["pending","processing","ready","released"] as CertReqStatus[]).map(s =>
                <option key={s} value={s}>{CERT_STATUS_CFG[s].label}</option>)}
            </FS>
            <FS value={tb.fKey==="sacramentType"?tb.fVal:""} style={{ width:180 }}
              onChange={e => { tb.setFKey("sacramentType"); tb.setFVal(e.target.value); tb.setPage(1); }}>
              <option value="">All Types</option>
              {SACR_LIST.map(s => <option key={s} value={s}>{s}</option>)}
            </FS>
            {(tb.search || tb.fVal) && (
              <Btn variant="ghost" size="sm" onClick={() => { tb.setSearch(""); tb.setFVal(""); tb.setFKey(""); tb.setPage(1); }}>Clear</Btn>
            )}
          </div>

          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr>
                  <th style={TH}>Ref. No.</th>
                  <SortTh label="Parishioner" field="parishioner" sf={tb.sortF} sd={tb.sortD} sort={() => tb.sort("parishioner")}/>
                  <th style={TH}>Subject Name</th>
                  <th style={TH}>Certificate Type</th>
                  <SortTh label="Requested" field="requestDate" sf={tb.sortF} sd={tb.sortD} sort={() => tb.sort("requestDate")}/>
                  <SortTh label="Status" field="status" sf={tb.sortF} sd={tb.sortD} sort={() => tb.sort("status")}/>
                  <th style={{ ...TH, textAlign:"right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tb.paged.length === 0 && (
                  <tr><td colSpan={7} style={{ ...TD, textAlign:"center", color:T.muted, padding:32 }}>No certificate requests found.</td></tr>
                )}
                {tb.paged.map((r, i) => (
                  <tr key={r.id} style={{ background: i%2===1 ? T.bg : T.surface }}
                    onMouseEnter={e => (e.currentTarget.style.background = T.priLight)}
                    onMouseLeave={e => (e.currentTarget.style.background = i%2===1 ? T.bg : T.surface)}>
                    <td style={{ ...TD, fontFamily:"monospace", fontSize:12, color:T.muted }}>{r.id}</td>
                    <td style={{ ...TD, fontWeight:500 }}>{r.parishioner}</td>
                    <td style={TD}>{r.subjectName}</td>
                    <td style={TD}><TypeTag type={r.sacramentType}/></td>
                    <td style={{ ...TD, fontSize:13, color:T.muted }}>{fmtShort(r.requestDate)}</td>
                    <td style={TD}><CertBadge status={r.status}/></td>
                    <td style={{ ...TD, textAlign:"right", whiteSpace:"nowrap" }}>
                      <Btn variant="ghost" size="sm" style={{ marginRight:4 }} onClick={() => setViewR(r)}>View</Btn>
                      {r.status === "pending"    && <Btn variant="outline" size="sm" onClick={() => { setProcR(r); setProcNote(""); }}>Process</Btn>}
                      {r.status === "processing" && <Btn variant="outline" size="sm" onClick={() => updateCertStatus(r.id,"ready")}>Mark Ready</Btn>}
                      {r.status === "ready"      && <Btn variant="primary" size="sm" onClick={() => updateCertStatus(r.id,"released",{ claimedDate:todayISO() })}>Release</Btn>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"10px 16px", borderTop:`1px solid ${T.border}`, background:T.bg }}>
            <span style={{ fontSize:13, color:T.muted }}>Showing {tb.paged.length} of {tb.total}</span>
            <Paginator page={tb.page} total={tb.totalPages} set={tb.setPage}/>
          </div>
        </Card>
      )}

      {/* ── NEW REQUEST TAB ── */}
      {tab === "new" && (
        <Card style={{ maxWidth:820 }}>
          <CardHead title="New Certificate Request" sub="Submit a request for a sacramental certificate"/>
          <form onSubmit={submitNew} noValidate style={{ padding:20, display:"flex", flexDirection:"column", gap:12 }}>
            <div style={g2}>
              <div>
                <FL req>Parishioner Name</FL>
                <FI value={form.parishioner} placeholder="Full name" onChange={e => sf("parishioner",e.target.value)}/>
                {ferr.parishioner && <p style={{ fontSize:12,color:T.red,margin:"2px 0 0" }}>{ferr.parishioner}</p>}
              </div>
              <div>
                <FL req>Contact Number</FL>
                <FI value={form.contact} placeholder="09XX-XXX-XXXX" onChange={e => sf("contact",e.target.value)}/>
                {ferr.contact && <p style={{ fontSize:12,color:T.red,margin:"2px 0 0" }}>{ferr.contact}</p>}
              </div>
            </div>
            <div>
              <FL>Email Address</FL>
              <FI type="email" value={form.email} placeholder="email@example.com" onChange={e => sf("email",e.target.value)}/>
            </div>
            <div>
              <FL req>Certificate / Sacrament Type</FL>
              <FS value={form.sacramentType} onChange={e => sf("sacramentType",e.target.value)}>
                <option value="" disabled>Select type...</option>
                {SACR_LIST.map(s => <option key={s} value={s}>{s}</option>)}
              </FS>
              {ferr.sacramentType && <p style={{ fontSize:12,color:T.red,margin:"2px 0 0" }}>{ferr.sacramentType}</p>}
            </div>
            <div>
              <FL req>Subject Name</FL>
              <FI value={form.subjectName} placeholder="Name as it appears in the register" onChange={e => sf("subjectName",e.target.value)}/>
              {ferr.subjectName && <p style={{ fontSize:12,color:T.red,margin:"2px 0 0" }}>{ferr.subjectName}</p>}
            </div>
            <div style={g2}>
              <div>
                <FL>Date of Sacrament</FL>
                <FI type="date" value={form.dateOfSacrament} onChange={e => sf("dateOfSacrament",e.target.value)}/>
              </div>
              <div>
                <FL>Reference / Payment No.</FL>
                <FI value={form.referenceNo} placeholder="GCash or bank ref." onChange={e => sf("referenceNo",e.target.value)}/>
              </div>
            </div>
            <div>
              <FL req>Purpose of Request</FL>
              <FI value={form.purposeOf} placeholder="e.g., School enrollment, employment, visa application..." onChange={e => sf("purposeOf",e.target.value)}/>
              {ferr.purposeOf && <p style={{ fontSize:12,color:T.red,margin:"2px 0 0" }}>{ferr.purposeOf}</p>}
            </div>
            <Divider/>
            <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
              <Btn variant="ghost" type="button" onClick={() => { setForm(blankCR); setFerr({}); }}>Clear</Btn>
              <Btn variant="primary" type="submit" disabled={busy}>{busy ? "Submitting..." : "Submit Request"}</Btn>
            </div>
          </form>
        </Card>
      )}

      {/* ── PRINT TAB ── */}
      {tab === "print" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1.2fr", gap:20, alignItems:"start" }}>
          <Card>
            <div style={{ padding:"10px 16px", borderBottom:`1px solid ${T.border}` }}>
              <input type="search" placeholder="Search records..." value={printSearch}
                onChange={e => setPrintSearch(e.target.value)} style={{ ...inp }}/>
            </div>
            <div style={{ maxHeight:480, overflowY:"auto" }}>
              {filteredPrint.length === 0 && (
                <p style={{ padding:24, textAlign:"center", fontSize:14, color:T.muted }}>No printable records found.</p>
              )}
              {filteredPrint.map(a => (
                <button key={a.id} onClick={() => setSelected(a)}
                  style={{ width:"100%", display:"block", padding:"16px 22px", textAlign:"left",
                    background: selected?.id === a.id ? T.priLight : "transparent",
                    border:"none", borderBottom:`1px solid ${T.border}`, cursor:"pointer",
                    borderLeft:`2px solid ${selected?.id===a.id?T.primary:"transparent"}` }}>
                  <div style={{ fontSize:14, fontWeight:600, color:T.text }}>{a.subjectName}</div>
                  <div style={{ fontSize:12, color:T.muted }}>{a.id} &bull; {a.sacramentType}</div>
                  <div style={{ fontSize:12, color:T.muted }}>{a.parishioner} &bull; {fmtShort(a.requestDate)}</div>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <CardHead title="Preview"
              right={selected && <Btn variant="primary" size="sm" onClick={() => doPrint(selected)}>Print Certificate</Btn>}/>
            {!selected ? (
              <div style={{ padding:40, textAlign:"center", color:T.muted, fontSize:14 }}>
                Select a record on the left to preview the certificate.
              </div>
            ) : (
              <div style={{ padding:24 }}>
                <div style={{ border:`1px solid ${T.border}`, borderRadius:8, overflow:"hidden" }}>
                  <div style={{ background:"#1A1400", padding:"20px 24px", textAlign:"center", color:"#fff" }}>
                    <div style={{ width:44,height:44,margin:"0 auto 10px" }}>
                      <ImageWithFallback src={logoSrc} alt="PdSPA" style={{ width:"100%",height:"100%",objectFit:"contain" }}/>
                    </div>
                    <div style={{ fontSize:14, fontWeight:700 }}>Parroquia de San Pedro Apostol</div>
                    <div style={{ fontSize:12, opacity:.7, marginTop:2 }}>Diocese of Daet &bull; Vinzons, Camarines Norte</div>
                  </div>
                  <div style={{ padding:"20px 24px" }}>
                    <div style={{ fontSize:12, fontWeight:700, textTransform:"uppercase",
                      letterSpacing:".08em", color:SACR[selected.sacramentType]?.col ?? T.primary, marginBottom:6 }}>
                      Certificate of {selected.sacramentType === "Pamisa" ? "Mass Intention" : selected.sacramentType}
                    </div>
                    <p style={{ fontSize:12, color:T.muted, marginBottom:6 }}>This is to certify that</p>
                    <div style={{ fontSize:22, fontWeight:800, color:T.text,
                      borderBottom:`1px solid ${T.border}`, paddingBottom:8, marginBottom:12 }}>
                      {selected.subjectName}
                    </div>
                    <p style={{ fontSize:13, color:T.sub, lineHeight:1.7, marginBottom:16 }}>
                      {SACR[selected.sacramentType]?.cert}
                      {selected.dateOfSacrament && <> on <strong>{fmt(selected.dateOfSacrament)}</strong></>}
                      {" "}as recorded in the sacramental register of this Parish.
                    </p>
                    <div style={{ display:"flex", gap:20, padding:"16px 22px",
                      background:T.bg, border:`1px solid ${T.border}`, borderRadius:6, marginBottom:16 }}>
                      {[["Cert. No.", selected.id],["Issued", fmt(todayISO())],
                        ...(selected.dateOfSacrament?[["Date of Sacrament",fmt(selected.dateOfSacrament)]]:[])
                      ].map(([l,v]) => (
                        <div key={l}>
                          <div style={{ fontSize:11, color:T.muted, textTransform:"uppercase", letterSpacing:".06em" }}>{l}</div>
                          <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-around", paddingTop:16, borderTop:`1px solid ${T.border}` }}>
                      {[["REV. FR. RENE TABIOS","Parish Priest"],["PARISH SECRETARY","Records Office"]].map(([n,r]) => (
                        <div key={n} style={{ textAlign:"center" }}>
                          <div style={{ height:20, borderBottom:`1px solid ${T.text}`, margin:"0 12px 6px" }}/>
                          <div style={{ fontSize:12, fontWeight:700, color:T.text }}>{n}</div>
                          <div style={{ fontSize:11, color:T.muted }}>{r}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── VIEW MODAL ── */}
      <Modal open={!!viewR} title={viewR?.id ?? ""} onClose={() => setViewR(null)}
        footer={<><Btn variant="ghost" onClick={() => setViewR(null)}>Close</Btn>
          {viewR?.status==="pending" && <Btn variant="primary" onClick={() => { setProcR(viewR); setProcNote(""); setViewR(null); }}>Process</Btn>}</>}>
        {viewR && (
          <dl style={{ display:"grid", gridTemplateColumns:"auto 1fr", gap:"8px 20px", fontSize:14 }}>
            {([["ID",viewR.id],["Parishioner",viewR.parishioner],["Contact",viewR.contact],
              ["Email",viewR.email||"—"],["Subject",viewR.subjectName],
              ["Cert. Type",viewR.sacramentType],["Date of Sacrament",fmt(viewR.dateOfSacrament)],
              ["Purpose",viewR.purposeOf],["Reference No.",viewR.referenceNo||"—"],
              ["Staff Notes",viewR.staffNotes||"—"],
              ["Date Claimed",viewR.claimedDate?fmt(viewR.claimedDate):"—"]] as [string,string][])
              .map(([k,v]) => (
                <div key={k} style={{ display:"contents" }}>
                  <dt style={{ fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:".04em",color:T.muted,paddingTop:2 }}>{k}</dt>
                  <dd style={{ color:T.text }}>{v}</dd>
                </div>
              ))}
            <div style={{ display:"contents" }}>
              <dt style={{ fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:".04em",color:T.muted }}>Status</dt>
              <dd><CertBadge status={viewR.status}/></dd>
            </div>
          </dl>
        )}
      </Modal>

      {/* ── PROCESS MODAL ── */}
      <Modal open={!!procR} title="Process Certificate Request" onClose={() => setProcR(null)}
        footer={<>
          <Btn variant="ghost" onClick={() => setProcR(null)}>Cancel</Btn>
          <Btn variant="primary" onClick={() => {
            if (!procR) return;
            updateCertStatus(procR.id, "processing", { staffNotes: procNote || procR.staffNotes });
            setProcR(null); setProcNote("");
          }}>Mark as Processing</Btn>
        </>}>
        {procR && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ padding:"10px 16px", background:T.bg, border:`1px solid ${T.border}`, borderRadius:6, fontSize:14 }}>
              <strong>{procR.id}</strong> — {procR.subjectName} ({procR.sacramentType})
              {procR.referenceNo && <div style={{ fontSize:12, color:T.muted, marginTop:3 }}>Ref: {procR.referenceNo}</div>}
            </div>
            <div>
              <FL>Staff Notes</FL>
              <FT rows={3} value={procNote} placeholder="Book volume, page number, verification notes..."
                onChange={e => setProcNote(e.target.value)}/>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ─── BOOK ENTRIES ───────────────────────────────────────── */
function BookEntriesView({ entries, setEntries, push }:
  { entries: BookEntry[]; setEntries: React.Dispatch<React.SetStateAction<BookEntry[]>>;
    push: (t: Toast["type"], m: string) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy]         = useState(false);
  const blank = { sacramentType:"", subjectName:"", dateOfSacrament:"", dateOfArrival:todayISO(), volume:"", page:"", minister:"", remarks:"" };
  const [form, setForm]         = useState(blank);
  const [ferr, setFerr]         = useState<Record<string,string>>({});
  const sf = (k: string, v: string) => { setForm(p => ({...p,[k]:v})); setFerr(p => ({...p,[k]:""})); };
  const tb = useTable<BookEntry>(entries, ["subjectName","sacramentType","minister"] as (keyof BookEntry)[], 10);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const e2: Record<string,string> = {};
    if (!form.sacramentType)      e2.sacramentType = "Required";
    if (!form.subjectName.trim()) e2.subjectName   = "Required";
    if (!form.dateOfArrival)      e2.dateOfArrival  = "Required";
    if (!form.volume.trim())      e2.volume         = "Required";
    if (!form.page.trim())        e2.page           = "Required";
    setFerr(e2); if (Object.keys(e2).length) return;
    setBusy(true);
    await new Promise(r => setTimeout(r, 600));
    setEntries(p => [{ id:`BK-${String(p.length+1).padStart(3,"0")}`, ...form }, ...p]);
    push("success", `Book entry for ${form.subjectName} added.`);
    setForm(blank); setBusy(false); setShowForm(false);
  }

  const g2: React.CSSProperties = { display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 };

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:T.text, margin:0 }}>Book Entries</h1>
          <p style={{ fontSize:15, color:T.muted, marginTop:4 }}>Sacramental register index</p>
        </div>
        <Btn variant="primary" size="sm" onClick={() => setShowForm(s => !s)}>
          {showForm ? "Cancel" : "Add Entry"}
        </Btn>
      </div>

      {showForm && (
        <Card style={{ marginBottom:16 }}>
          <CardHead title="Add Book Entry" sub="Date of Arrival is required"/>
          <form onSubmit={submit} noValidate style={{ padding:20, display:"flex", flexDirection:"column", gap:12 }}>
            <div style={g2}>
              <div>
                <FL req>Sacrament Type</FL>
                <FS value={form.sacramentType} onChange={e => sf("sacramentType",e.target.value)}>
                  <option value="" disabled>Select...</option>
                  {SACR_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                </FS>
                {ferr.sacramentType && <p style={{ fontSize:12,color:T.red,margin:"2px 0 0" }}>{ferr.sacramentType}</p>}
              </div>
              <div><FL req>Subject Name</FL><FI value={form.subjectName} placeholder="Name in register" onChange={e => sf("subjectName",e.target.value)}/>{ferr.subjectName&&<p style={{ fontSize:12,color:T.red,margin:"2px 0 0" }}>{ferr.subjectName}</p>}</div>
            </div>
            <div style={g2}>
              <div><FL>Date of Sacrament</FL><FI type="date" value={form.dateOfSacrament} onChange={e => sf("dateOfSacrament",e.target.value)}/></div>
              <div><FL req>Date of Arrival</FL><FI type="date" value={form.dateOfArrival} onChange={e => sf("dateOfArrival",e.target.value)}/>{ferr.dateOfArrival&&<p style={{ fontSize:12,color:T.red,margin:"2px 0 0" }}>{ferr.dateOfArrival}</p>}</div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 2fr", gap:12 }}>
              <div><FL req>Volume</FL><FI value={form.volume} placeholder="e.g., 12" onChange={e => sf("volume",e.target.value)}/>{ferr.volume&&<p style={{ fontSize:12,color:T.red,margin:"2px 0 0" }}>{ferr.volume}</p>}</div>
              <div><FL req>Page</FL><FI value={form.page} placeholder="e.g., 34" onChange={e => sf("page",e.target.value)}/>{ferr.page&&<p style={{ fontSize:12,color:T.red,margin:"2px 0 0" }}>{ferr.page}</p>}</div>
              <div><FL>Minister</FL><FI value={form.minister} placeholder="e.g., Fr. Rene Tabios" onChange={e => sf("minister",e.target.value)}/></div>
            </div>
            <div><FL>Remarks</FL><FT rows={2} value={form.remarks} placeholder="Parents, sponsors, witnesses..." onChange={e => sf("remarks",e.target.value)}/></div>
            <Divider/>
            <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
              <Btn variant="ghost" type="button" onClick={() => { setForm(blank); setFerr({}); }}>Clear</Btn>
              <Btn variant="primary" type="submit" disabled={busy}>{busy?"Saving...":"Save Entry"}</Btn>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div style={{ padding:"10px 16px", borderBottom:`1px solid ${T.border}` }}>
          <input type="search" placeholder="Search entries..." value={tb.search}
            onChange={e => { tb.setSearch(e.target.value); tb.setPage(1); }} style={{ ...inp, width:260 }}/>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr>
                <th style={TH}>ID</th>
                <SortTh label="Subject Name" field="subjectName" sf={tb.sortF} sd={tb.sortD} sort={() => tb.sort("subjectName")}/>
                <th style={TH}>Sacrament</th>
                <SortTh label="Date of Sacrament" field="dateOfSacrament" sf={tb.sortF} sd={tb.sortD} sort={() => tb.sort("dateOfSacrament")}/>
                <th style={{ ...TH, color:T.primary }}>Date of Arrival</th>
                <th style={TH}>Vol. / Page</th>
                <th style={TH}>Minister</th>
              </tr>
            </thead>
            <tbody>
              {tb.paged.length === 0 && <tr><td colSpan={7} style={{ ...TD, textAlign:"center", color:T.muted, padding:32 }}>No entries found.</td></tr>}
              {tb.paged.map((b, i) => (
                <tr key={b.id} style={{ background: i%2===1 ? T.bg : T.surface }}>
                  <td style={{ ...TD, fontFamily:"monospace", fontSize:12, color:T.muted }}>{b.id}</td>
                  <td style={{ ...TD, fontWeight:500 }}>{b.subjectName}</td>
                  <td style={TD}><TypeTag type={b.sacramentType}/></td>
                  <td style={{ ...TD, fontSize:13, color:T.muted }}>{fmtShort(b.dateOfSacrament)}</td>
                  <td style={{ ...TD, fontWeight:600, color:T.primary }}>{fmtShort(b.dateOfArrival)}</td>
                  <td style={{ ...TD, fontFamily:"monospace", fontSize:13 }}>Vol.{b.volume} / Pg.{b.page}</td>
                  <td style={{ ...TD, fontSize:13, color:T.muted }}>{b.minister||"—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"10px 16px", borderTop:`1px solid ${T.border}`, background:T.bg }}>
          <span style={{ fontSize:13, color:T.muted }}>{tb.total} entries</span>
          <Paginator page={tb.page} total={tb.totalPages} set={tb.setPage}/>
        </div>
      </Card>
    </div>
  );
}

/* ─── FUNERAL ────────────────────────────────────────────── */
function FuneralView({ records, setRecords, push }:
  { records: FuneralRecord[]; setRecords: React.Dispatch<React.SetStateAction<FuneralRecord[]>>;
    push: (t: Toast["type"], m: string) => void }) {
  const [search, setSearch]   = useState("");
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy]       = useState(false);
  const blank = { deceasedName:"", dateOfDeath:"", dateOfBurial:"", block:"", lot:"", section:"Nicho", nextOfKin:"", contact:"", notes:"" };
  const [form, setForm]       = useState(blank);
  const [ferr, setFerr]       = useState<Record<string,string>>({});
  const sf = (k: string, v: string) => { setForm(p => ({...p,[k]:v})); setFerr(p => ({...p,[k]:""})); };
  const filtered = records.filter(r => !search || r.deceasedName.toLowerCase().includes(search.toLowerCase()) || r.nextOfKin.toLowerCase().includes(search.toLowerCase()) || `${r.block}-${r.lot}`.includes(search));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const e2: Record<string,string> = {};
    if (!form.deceasedName.trim()) e2.deceasedName = "Required";
    if (!form.dateOfBurial)        e2.dateOfBurial  = "Required";
    if (!form.block.trim())        e2.block          = "Required";
    if (!form.lot.trim())          e2.lot            = "Required";
    if (!form.nextOfKin.trim())    e2.nextOfKin      = "Required";
    setFerr(e2); if (Object.keys(e2).length) return;
    setBusy(true);
    await new Promise(r => setTimeout(r, 600));
    setRecords(p => [{ id:`FN-${String(p.length+1).padStart(3,"0")}`, ...form }, ...p]);
    push("success", `Burial record for ${form.deceasedName} added.`);
    setForm(blank); setBusy(false); setShowForm(false);
  }

  const g2: React.CSSProperties = { display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 };

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:T.text, margin:0 }}>Funeral / Campo Santo</h1>
          <p style={{ fontSize:15, color:T.muted, marginTop:4 }}>Cemetery records and lookup — PdSPA Campo Santo</p>
        </div>
        <Btn variant="primary" size="sm" onClick={() => setShowForm(s => !s)}>
          {showForm ? "Cancel" : "Add Record"}
        </Btn>
      </div>

      {/* Search */}
      <Card style={{ marginBottom:16 }}>
        <div style={{ padding:"16px 22px", display:"flex", alignItems:"center", gap:12 }}>
          <input type="search" placeholder='Search by name or block/lot (e.g. "A-12")...'
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inp, flex:1, fontSize:15 }}/>
          {search && <Btn variant="ghost" size="sm" onClick={() => setSearch("")}>Clear</Btn>}
        </div>
      </Card>

      {showForm && (
        <Card style={{ marginBottom:16 }}>
          <CardHead title="Add Burial Record"/>
          <form onSubmit={submit} noValidate style={{ padding:20, display:"flex", flexDirection:"column", gap:12 }}>
            <div><FL req>Deceased Name</FL><FI value={form.deceasedName} placeholder="Full name" onChange={e => sf("deceasedName",e.target.value)}/>{ferr.deceasedName&&<p style={{ fontSize:12,color:T.red,margin:"2px 0 0" }}>{ferr.deceasedName}</p>}</div>
            <div style={g2}>
              <div><FL>Date of Death</FL><FI type="date" value={form.dateOfDeath} onChange={e => sf("dateOfDeath",e.target.value)}/></div>
              <div><FL req>Date of Burial</FL><FI type="date" value={form.dateOfBurial} onChange={e => sf("dateOfBurial",e.target.value)}/>{ferr.dateOfBurial&&<p style={{ fontSize:12,color:T.red,margin:"2px 0 0" }}>{ferr.dateOfBurial}</p>}</div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1.5fr", gap:12 }}>
              <div><FL req>Block</FL><FI value={form.block} placeholder="A" onChange={e => sf("block",e.target.value)}/>{ferr.block&&<p style={{ fontSize:12,color:T.red,margin:"2px 0 0" }}>{ferr.block}</p>}</div>
              <div><FL req>Lot</FL><FI value={form.lot} placeholder="12" onChange={e => sf("lot",e.target.value)}/>{ferr.lot&&<p style={{ fontSize:12,color:T.red,margin:"2px 0 0" }}>{ferr.lot}</p>}</div>
              <div><FL>Section</FL><FS value={form.section} onChange={e => sf("section",e.target.value)}>{["Nicho","Lawn","Ground","Wall Vault"].map(s=><option key={s}>{s}</option>)}</FS></div>
            </div>
            <div style={g2}>
              <div><FL req>Next of Kin</FL><FI value={form.nextOfKin} placeholder="Full name" onChange={e => sf("nextOfKin",e.target.value)}/>{ferr.nextOfKin&&<p style={{ fontSize:12,color:T.red,margin:"2px 0 0" }}>{ferr.nextOfKin}</p>}</div>
              <div><FL>Contact</FL><FI value={form.contact} placeholder="09XX-XXX-XXXX" onChange={e => sf("contact",e.target.value)}/></div>
            </div>
            <div><FL>Notes</FL><FT rows={2} value={form.notes} onChange={e => sf("notes",e.target.value)}/></div>
            <Divider/>
            <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
              <Btn variant="ghost" type="button" onClick={() => { setForm(blank); setFerr({}); }}>Clear</Btn>
              <Btn variant="primary" type="submit" disabled={busy}>{busy?"Saving...":"Save Record"}</Btn>
            </div>
          </form>
        </Card>
      )}

      {/* Results */}
      <Card>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr>
                <th style={TH}>Deceased Name</th>
                <th style={TH}>Date of Death</th>
                <th style={TH}>Date of Burial</th>
                <th style={TH}>Location</th>
                <th style={TH}>Next of Kin</th>
                <th style={TH}>Contact</th>
                <th style={TH}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={7} style={{ ...TD, textAlign:"center", color:T.muted, padding:32 }}>No records found{search && ` for "${search}"`}.</td></tr>}
              {filtered.map((r, i) => (
                <tr key={r.id} style={{ background: i%2===1 ? T.bg : T.surface }}>
                  <td style={{ ...TD, fontWeight:600 }}>{r.deceasedName}</td>
                  <td style={{ ...TD, fontSize:13, color:T.muted }}>{fmtShort(r.dateOfDeath)}</td>
                  <td style={{ ...TD, fontSize:13, color:T.muted }}>{fmtShort(r.dateOfBurial)}</td>
                  <td style={TD}>
                    <span style={{ fontWeight:700, color:T.primary }}>Blk {r.block}-{r.lot}</span>
                    <span style={{ fontSize:12, color:T.muted, marginLeft:4 }}>({r.section})</span>
                  </td>
                  <td style={TD}>{r.nextOfKin}</td>
                  <td style={{ ...TD, fontSize:13, color:T.muted }}>{r.contact||"—"}</td>
                  <td style={{ ...TD, fontSize:13, color:T.muted }}>{r.notes||"—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding:"10px 16px", borderTop:`1px solid ${T.border}`, background:T.bg }}>
          <span style={{ fontSize:13, color:T.muted }}>{filtered.length} records</span>
        </div>
      </Card>
    </div>
  );
}

/* ─── CALENDAR ───────────────────────────────────────────── */
function CalendarView({ appts }: { appts: Appointment[] }) {
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [detail, setDetail] = useState<{ date: string; items: Appointment[] }|null>(null);

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const firstDay   = new Date(year, month, 1).getDay();
  const daysInMon  = new Date(year, month+1, 0).getDate();
  const todayKey   = todayISO();

  const apptMap = useMemo(() => {
    const m: Record<string, Appointment[]> = {};
    appts.forEach(a => {
      const key = a.scheduledDate || a.requestDate;
      if (!key) return;
      const y = parseInt(key.slice(0,4)), mo = parseInt(key.slice(5,7))-1;
      if (y === year && mo === month) {
        const d = key.slice(8,10);
        m[d] = [...(m[d]||[]), a];
      }
    });
    return m;
  }, [appts, year, month]);

  function prev() { if (month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); }
  function next() { if (month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); }

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:10 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:T.text, margin:0 }}>Calendar</h1>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Btn variant="ghost" size="sm" onClick={prev}>Prev</Btn>
          <span style={{ fontSize:15, fontWeight:600, color:T.text, minWidth:140, textAlign:"center" }}>{MONTHS[month]} {year}</span>
          <Btn variant="ghost" size="sm" onClick={next}>Next</Btn>
          <Btn variant="outline" size="sm" onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); }}>Today</Btn>
        </div>
      </div>

      <Card>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", borderBottom:`1px solid ${T.border}` }}>
          {DAYS.map(d => (
            <div key={d} style={{ padding:"8px 4px", textAlign:"center", fontSize:12,
              fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:".05em" }}>{d}</div>
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)" }}>
          {Array.from({length:firstDay}).map((_,i) => (
            <div key={`e${i}`} style={{ minHeight:100, borderRight:`1px solid ${T.border}`, borderBottom:`1px solid ${T.border}`, background:T.bg }}/>
          ))}
          {Array.from({length:daysInMon}).map((_,i) => {
            const day = String(i+1).padStart(2,"0");
            const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${day}`;
            const items = apptMap[day] || [];
            const isToday = dateStr === todayKey;
            const col = (firstDay+i)%7;
            const isWeekend = col===0||col===6;
            return (
              <div key={day} onClick={() => items.length && setDetail({ date:dateStr, items })}
                style={{ minHeight:100, padding:"6px 8px", borderRight:`1px solid ${T.border}`,
                  borderBottom:`1px solid ${T.border}`, cursor:items.length?"pointer":"default",
                  background: isToday ? T.priLight : T.surface }}
                onMouseEnter={e => { if(items.length) e.currentTarget.style.background = "#FEF3C7"; }}
                onMouseLeave={e => { e.currentTarget.style.background = isToday ? T.priLight : T.surface; }}>
                <div style={{ fontSize:13, fontWeight:isToday?700:400,
                  color:isToday?T.primary:isWeekend?T.sub:T.sub, marginBottom:4 }}>{i+1}</div>
                {items.slice(0,2).map((a,j) => (
                  <div key={j} style={{ fontSize:11, padding:"1px 4px", borderRadius:3,
                    background:SACR[a.sacramentType]?.light??"#F3F4F6",
                    color:SACR[a.sacramentType]?.col??T.sub,
                    marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                    fontWeight:600 }}>
                    {a.subjectName.split(" ")[0]}
                  </div>
                ))}
                {items.length > 2 && <div style={{ fontSize:11, color:T.muted }}>+{items.length-2}</div>}
              </div>
            );
          })}
        </div>
      </Card>

      <Modal open={!!detail} title={detail ? fmt(detail.date) : ""} onClose={() => setDetail(null)}>
        {detail && (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {detail.items.map(a => (
              <div key={a.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"12px 16px", background:T.bg, border:`1px solid ${T.border}`, borderRadius:6, gap:10 }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:T.text }}>{a.subjectName}</div>
                  <div style={{ fontSize:12, color:T.muted }}>{a.id} &bull; {a.sacramentType}</div>
                </div>
                <Badge status={a.status}/>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ─── REPORTS ────────────────────────────────────────────── */
function ReportsView({ appts }: { appts: Appointment[] }) {
  const [selMonth, setSelMonth] = useState("2026-08");
  const monthAppts = appts.filter(a => (a.scheduledDate || a.requestDate || "").startsWith(selMonth));

  const byType = SACR_LIST.map(t => ({
    name: t.split("/")[0].split(" ").slice(-1)[0],
    full: t,
    count: monthAppts.filter(a => a.sacramentType === t).length,
    col: SACR[t]?.col ?? T.primary,
  })).filter(x => x.count > 0);

  const byStatus = (["pending","verified","scheduled","completed","cancelled"] as AppStatus[]).map(s => ({
    name: STATUS_CFG[s].label,
    count: monthAppts.filter(a => a.status === s).length,
    col: STATUS_CFG[s].col,
  })).filter(x => x.count > 0);

  const completed = monthAppts.filter(a => a.status === "completed").length;
  const rate = monthAppts.length ? Math.round((completed/monthAppts.length)*100) : 0;

  const stat = (label: string, val: number|string) => (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:"14px 16px" }}>
      <div style={{ fontSize:12, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:".04em", marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:24, fontWeight:800, color:T.text }}>{val}</div>
    </div>
  );

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:10 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:T.text, margin:0 }}>Reports</h1>
        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
          <FI type="month" value={selMonth} onChange={e => setSelMonth(e.target.value)} style={{ width:"auto" }}/>
          <Btn variant="outline" size="sm" onClick={() => window.print()}>Print</Btn>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:20, marginBottom:16 }}>
        {stat("Total Requests", monthAppts.length)}
        {stat("Completed",      completed)}
        {stat("Pending",        monthAppts.filter(a=>a.status==="pending").length)}
        {stat("Completion Rate",`${rate}%`)}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:20, marginBottom:16 }}>
        <Card>
          <CardHead title="By Sacrament Type"/>
          <div style={{ padding:16 }}>
            <SimpleBarChart data={byType} height={280} layout="horizontal"/>
          </div>
        </Card>
        <Card>
          <CardHead title="By Status"/>
          <div style={{ padding:16 }}>
            <SimpleBarChart data={byStatus} height={280}/>
          </div>
        </Card>
      </div>

      <Card>
        <CardHead title="Summary Table" sub={`Month: ${selMonth}`}/>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr>
                <th style={TH}>Sacrament / Service</th>
                <th style={{ ...TH, textAlign:"center" }}>Total</th>
                <th style={{ ...TH, textAlign:"center" }}>Completed</th>
                <th style={{ ...TH, textAlign:"center" }}>Pending</th>
                <th style={{ ...TH, textAlign:"center" }}>Cancelled</th>
              </tr>
            </thead>
            <tbody>
              {SACR_LIST.map((t, i) => {
                const rows = monthAppts.filter(a => a.sacramentType === t);
                if (!rows.length) return null;
                return (
                  <tr key={t} style={{ background: i%2===1?T.bg:T.surface }}>
                    <td style={TD}><TypeTag type={t}/></td>
                    <td style={{ ...TD, textAlign:"center", fontWeight:700 }}>{rows.length}</td>
                    <td style={{ ...TD, textAlign:"center", color:T.green }}>{rows.filter(a=>a.status==="completed").length}</td>
                    <td style={{ ...TD, textAlign:"center", color:T.amber }}>{rows.filter(a=>a.status==="pending").length}</td>
                    <td style={{ ...TD, textAlign:"center", color:T.red }}>{rows.filter(a=>a.status==="cancelled").length}</td>
                  </tr>
                );
              })}
              <tr style={{ borderTop:`2px solid ${T.border}`, fontWeight:700, background:T.bg }}>
                <td style={{ ...TD, fontWeight:700 }}>Total</td>
                <td style={{ ...TD, textAlign:"center", fontWeight:800 }}>{monthAppts.length}</td>
                <td style={{ ...TD, textAlign:"center", color:T.green, fontWeight:700 }}>{completed}</td>
                <td style={{ ...TD, textAlign:"center", color:T.amber, fontWeight:700 }}>{monthAppts.filter(a=>a.status==="pending").length}</td>
                <td style={{ ...TD, textAlign:"center", color:T.red, fontWeight:700 }}>{monthAppts.filter(a=>a.status==="cancelled").length}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ─── APP ROOT ───────────────────────────────────────────── */
export default function App() {
  const [auth,     setAuth]     = useState<{ role: UserRole; name: string }|null>(null);
  const [view,     setView]     = useState<View>("dashboard");
  const [appts,     setAppts]     = useState<Appointment[]>(SEED_APPTS);
  const [certReqs,  setCertReqs]  = useState<CertRequest[]>(SEED_CERT_REQUESTS);
  const [massInts,  setMassInts]  = useState<MassIntention[]>(SEED_MASS);
  const [books,     setBooks]     = useState<BookEntry[]>(SEED_BOOKS);
  const [funerals,  setFunerals]  = useState<FuneralRecord[]>(SEED_FUNERAL);
  const { toasts, push, dismiss } = useToasts();

  function login(role: UserRole, name: string) {
    setAuth({ role, name });
    push("success", `Signed in as ${name}.`);
  }
  function logout() { setAuth(null); setView("dashboard"); }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        html, body { height: 100%; margin: 0; padding: 0;
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 15px; background: ${T.bg}; color: ${T.text}; }
        button, input, select, textarea { font-family: inherit; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 2px; }
        @media print { aside { display: none !important; } }
      `}</style>

      {!auth ? (
        <LoginView onLogin={login}/>
      ) : (
        <div style={{ display:"flex", minHeight:"100vh" }}>
          <Sidebar view={view} setView={setView} name={auth.name} role={auth.role} onLogout={logout}/>
          <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
            {/* Top bar */}
            <div style={{ background:T.surface, borderBottom:`1px solid ${T.border}`,
              padding:"10px 24px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span style={{ fontSize:14, fontWeight:600, color:T.text }}>
                {{ dashboard:"Dashboard", appointments:"Appointments", certificates:"Certificates",
                   "book-entries":"Book Entries", funeral:"Funeral / Campo Santo",
                   calendar:"Calendar", reports:"Reports" }[view]}
              </span>
              <span style={{ fontSize:13, color:T.muted }}>
                {auth.name} &bull; <span style={{ textTransform:"capitalize" }}>{auth.role}</span>
              </span>
            </div>
            {/* Content */}
            <main style={{ flex:1, padding:36, overflowY:"auto" }}>
              {view==="dashboard"    && <DashboardView   appts={appts} setView={setView} massInts={massInts} setMassInts={setMassInts}/>}
              {view==="appointments" && <AppointmentsView appts={appts} setAppts={setAppts} push={push}/>}
              {view==="certificates" && <CertificatesView appts={appts} certReqs={certReqs} setCertReqs={setCertReqs} push={push}/>}
              {view==="book-entries" && <BookEntriesView  entries={books} setEntries={setBooks} push={push}/>}
              {view==="funeral"      && <FuneralView      records={funerals} setRecords={setFunerals} push={push}/>}
              {view==="calendar"     && <CalendarView     appts={appts}/>}
              {view==="reports"      && <ReportsView      appts={appts}/>}
            </main>
          </div>
        </div>
      )}

      <Toasts toasts={toasts} dismiss={dismiss}/>
    </>
  );
}
