/* Pure logic for the public parish website.
   Everything here is derived from SARMS data (services, calendar activities, requests, settings),
   so the website can never disagree with what the parish office sees. */
import type { ReqStatus } from "../tokens";

/* Structural views of the SARMS records the website is allowed to read. */
export interface PubService {
  id: string; name: string; description: string; fee: number;
  requiresPrinting: boolean; schedulable: boolean; duration: number; calCategory: string; active: boolean;
}
export interface PubActivity {
  id: string; category: string; title: string; date: string; start: string; end: string;
  allDay: boolean; location: string; notes: string; status: "active" | "cancelled";
}
export interface PubRequest {
  id: string; submittedAt: string; parishioner: string; contact: string; email: string;
  sacramentType: string; subjectName: string; status: ReqStatus; prefDate: string; prefTime: string;
  apprDate: string; apprStart: string; apprEnd: string; orNo: string; orDate: string; staffNotes: string;
}
export interface PubSettings {
  parishName: string; diocese: string; address: string; phone: string; email: string; facebook: string;
  hoursWeekday: string; hoursSat: string; hoursSun: string; certSignatory: string; certSignatoryTitle: string;
}
export interface PubConflict { hard: boolean; label: string; detail: string; }
export type ConflictsFor = (date: string, start: string, end: string) => PubConflict[];

/** What the public form hands to SARMS. SARMS assigns the ID, status and timestamps. */
export interface OnlineSubmission {
  parishioner: string; contact: string; email: string; address: string;
  sacramentType: string; subjectName: string; dateOfSacrament: string; purposeOf: string;
  prefDate: string; prefTime: string;
}

/* ─── Dates & times ─── */
const pad = (n: number) => String(n).padStart(2, "0");
export const toMin = (t: string) => { if (!t) return 0; const [h, m] = t.split(":").map(Number); return h * 60 + m; };
export const fromMin = (v: number) => `${pad(Math.floor(v / 60))}:${pad(v % 60)}`;
export function fmtTime(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${pad(m)} ${h >= 12 ? "PM" : "AM"}`;
}
export const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayISO = () => isoOf(new Date());
export function addDaysISO(iso: string, n: number) {
  const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate() + n); return isoOf(d);
}
export function fmtLong(iso: string) {
  if (!iso) return "";
  return new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}
export function fmtShort(iso: string) {
  if (!iso) return "";
  return new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}
export function fmtRange(start: string, end: string, allDay?: boolean) {
  if (allDay) return "All day";
  if (!start) return "";
  return end ? `${fmtTime(start)} – ${fmtTime(end)}` : fmtTime(start);
}
export const peso = (n: number) => `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

/* ─── Office hours (parsed from SARMS System Settings) ─── */
/** "8:00 AM – 12:00 NN, 1:00 PM – 5:00 PM" -> [[480,720],[780,1020]]. Text without a time range (e.g. "Closed") -> []. */
export function parseHours(text: string): [number, number][] {
  const re = /(\d{1,2}):(\d{2})\s*(AM|PM|NN)\s*[–—-]\s*(\d{1,2}):(\d{2})\s*(AM|PM|NN)/gi;
  const to24 = (h: number, m: number, mer: string) => {
    const x = mer.toUpperCase();
    const hh = x === "NN" ? 12 : x === "AM" ? h % 12 : (h % 12) + 12;
    return hh * 60 + m;
  };
  const out: [number, number][] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const s = to24(+m[1], +m[2], m[3]), e = to24(+m[4], +m[5], m[6]);
    if (e > s) out.push([s, e]);
  }
  return out;
}
export function officeWindows(iso: string, s: PubSettings): [number, number][] {
  const dow = new Date(`${iso}T12:00:00`).getDay();
  return parseHours(dow === 0 ? s.hoursSun : dow === 6 ? s.hoursSat : s.hoursWeekday);
}

/* ─── Availability ─── */
export interface Slot { start: string; end: string; available: boolean; reason: string; }
const STEP = 30;

/** Time slots a request could start at on `iso`: inside office hours, `duration` long, checked against the SARMS conflict rules. */
export function buildSlots(iso: string, duration: number, settings: PubSettings, conflictsFor: ConflictsFor): Slot[] {
  const dur = duration > 0 ? duration : 60;
  const slots: Slot[] = [];
  for (const [ws, we] of officeWindows(iso, settings)) {
    for (let t = ws; t + dur <= we; t += STEP) {
      const start = fromMin(t), end = fromMin(t + dur);
      const c = conflictsFor(iso, start, end);
      slots.push({ start, end, available: c.length === 0, reason: c[0]?.label ?? "" });
    }
  }
  return slots;
}

export type DayState = "open" | "full" | "closed" | "office-closed" | "past";
export interface DayInfo { state: DayState; reason: string; slots: Slot[]; }

/** Public booking window: from tomorrow up to ~6 months ahead. */
export const MIN_LEAD_DAYS = 1;
export const MAX_AHEAD_DAYS = 183;

export function dayInfo(iso: string, duration: number, settings: PubSettings, conflictsFor: ConflictsFor): DayInfo {
  if (iso < addDaysISO(todayISO(), MIN_LEAD_DAYS)) return { state: "past", reason: "Date has passed or is too soon", slots: [] };
  if (iso > addDaysISO(todayISO(), MAX_AHEAD_DAYS)) return { state: "past", reason: "Too far ahead to book", slots: [] };
  const windows = officeWindows(iso, settings);
  const probe = conflictsFor(iso, "00:00", "23:59");
  const closedDay = probe.find(c => c.hard);
  if (closedDay) return { state: "office-closed", reason: "Office closed", slots: [] };
  if (windows.length === 0) return { state: "closed", reason: "Not an office day", slots: [] };
  const slots = buildSlots(iso, duration, settings, conflictsFor);
  if (slots.some(s => s.available)) return { state: "open", reason: "", slots };
  return { state: "full", reason: slots[0]?.reason || "No times available", slots };
}

/** Document-only services: any open office day is acceptable for a preferred visit date. */
export function visitDateProblem(iso: string, settings: PubSettings, conflictsFor: ConflictsFor): string {
  if (!iso) return "";
  if (iso < addDaysISO(todayISO(), MIN_LEAD_DAYS)) return "Choose a date from tomorrow onward.";
  if (iso > addDaysISO(todayISO(), MAX_AHEAD_DAYS)) return "Choose a date within the next six months.";
  if (conflictsFor(iso, "00:00", "23:59").some(c => c.hard)) return "The parish office is closed on this date.";
  if (officeWindows(iso, settings).length === 0) return "The parish office is not open on this day.";
  return "";
}

/* ─── Contact validation & matching ─── */
/** Normalises a PH mobile number to 09XXXXXXXXX where possible. */
export function normPhone(v: string) {
  let d = v.replace(/\D/g, "");
  if (d.startsWith("63") && d.length === 12) d = "0" + d.slice(2);
  else if (d.length === 10 && d.startsWith("9")) d = "0" + d;
  return d;
}
export const validPhone = (v: string) => /^09\d{9}$/.test(normPhone(v));
export const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

export function contactMatches(r: { contact: string; email: string }, input: string) {
  const v = input.trim();
  if (!v) return false;
  if (v.includes("@")) return !!r.email && r.email.trim().toLowerCase() === v.toLowerCase();
  const p = normPhone(v);
  return p.length > 0 && normPhone(r.contact) === p;
}

/** Lookup requires BOTH the request ID and the contact detail used when submitting. */
export function findRequest(requests: PubRequest[], id: string, contact: string): PubRequest | undefined {
  const key = id.trim().toUpperCase().replace(/\s+/g, "");
  return requests.find(r => r.id.toUpperCase() === key && contactMatches(r, contact));
}

/* ─── Public parish calendar ─── */
/** Private family events (weddings, funerals) are never published — only parish-wide schedule items. */
export const PUBLIC_CATEGORIES = ["Holy Mass", "Barangay Mass", "Fiesta Mass", "Parish Activity", "Holiday", "Closed Office Day"];
export const isPublicActivity = (a: PubActivity) => a.status === "active" && PUBLIC_CATEGORIES.includes(a.category);

/* ─── Per-service intake details ─── */
export type SubjectKind = "person" | "couple";
export interface ServiceFormSpec {
  kind: SubjectKind;
  subjectLabel: string; subjectHint?: string;
  dateLabel: string; dateMax: boolean; selfAllowed: boolean;
}
export function specFor(serviceName: string): ServiceFormSpec {
  switch (serviceName) {
    case "Baptism":
      return { kind: "person", subjectLabel: "Full name of the person baptized", subjectHint: "Child or recipient as it may appear in the Baptismal Register", dateLabel: "Date of baptism (if known)", dateMax: true, selfAllowed: true };
    case "Confirmation":
      return { kind: "person", subjectLabel: "Full name of the person confirmed", dateLabel: "Date of confirmation (if known)", dateMax: true, selfAllowed: true };
    case "First Holy Communion":
      return { kind: "person", subjectLabel: "Full name of the communicant", dateLabel: "Date of First Holy Communion (if known)", dateMax: true, selfAllowed: true };
    case "Marriage":
      return { kind: "couple", subjectLabel: "Names of the couple", dateLabel: "Date of marriage (if the marriage already took place)", dateMax: false, selfAllowed: false };
    case "Funeral Mass":
      return { kind: "person", subjectLabel: "Full name of the deceased", dateLabel: "Date of death", dateMax: true, selfAllowed: false };
    case "Death Certificate":
      return { kind: "person", subjectLabel: "Full name of the deceased", dateLabel: "Date of death (if known)", dateMax: true, selfAllowed: false };
    case "No Record":
      return { kind: "person", subjectLabel: "Full name to be searched", subjectHint: "Include other spellings in the purpose field if relevant", dateLabel: "Approximate date of the sacrament (if known)", dateMax: true, selfAllowed: true };
    case "Good Standing/Membership":
      return { kind: "person", subjectLabel: "Full name of the parishioner", dateLabel: "", dateMax: true, selfAllowed: true };
    default:
      return { kind: "person", subjectLabel: "Full name on the record", dateLabel: "Date of record (if known)", dateMax: true, selfAllowed: true };
  }
}

export const COMMON_PURPOSES = [
  "School enrollment", "Marriage requirement", "Employment", "Visa or travel application",
  "Estate settlement", "Insurance or SSS claim", "Sponsorship (Ninong/Ninang) requirement", "Personal records",
];

/** What a parishioner is told for each SARMS status. Staff-only data (notes, verifier) is never shown. */
export function statusMessage(r: PubRequest, svc?: PubService): string {
  const fee = svc ? peso(svc.fee) : "the service fee";
  switch (r.status) {
    case "pending": return `Your request was received. Visit the parish office during office hours to pay ${fee}; staff will verify it once the Official Receipt is recorded.`;
    case "verified": return svc?.schedulable
      ? "Payment was recorded and your request is verified. The parish office will confirm your schedule next."
      : "Payment was recorded and your request is verified. The parish office is processing it.";
    case "scheduled": return "Your schedule is confirmed. Please arrive on time on the date shown below.";
    case "completed": return "Your request has been completed.";
    case "rejected": return "Your request could not be approved. See the reason from the parish office below, or visit the office for help.";
    case "cancelled": return "This request was cancelled and is no longer active.";
  }
}
