import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, Copy, Info } from "lucide-react";
import { T, F } from "../tokens";
import { Card, Eyebrow, Field, Notice, PBtn, ServiceIcon, Title, inputStyle } from "./ui";
import {
  COMMON_PURPOSES, MAX_AHEAD_DAYS, MIN_LEAD_DAYS, addDaysISO, dayInfo, fmtLong, fmtRange, fmtTime, fromMin, isoOf,
  normPhone, peso, specFor, todayISO, toMin, validEmail, validPhone, visitDateProblem,
  type ConflictsFor, type DayInfo, type OnlineSubmission, type PubActivity, type PubRequest, type PubService, type PubSettings,
} from "./publicLogic";

/* ─── Availability calendar ─── */
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function SlotCalendar({ value, onChange, duration, settings, conflictsFor, activities }:
  { value: string; onChange: (iso: string) => void; duration: number; settings: PubSettings; conflictsFor: ConflictsFor; activities: PubActivity[] }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); d.setHours(12); return d; });
  const year = cursor.getFullYear(), month = cursor.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const dim = new Date(year, month + 1, 0).getDate();
  const now = new Date();
  const canPrev = year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth());
  const last = new Date(`${addDaysISO(todayISO(), MAX_AHEAD_DAYS)}T12:00:00`);
  const canNext = year < last.getFullYear() || (year === last.getFullYear() && month < last.getMonth());

  const days = Array.from({ length: dim }, (_, i) => {
    const iso = isoOf(new Date(year, month, i + 1, 12));
    return { n: i + 1, iso, info: dayInfo(iso, duration, settings, conflictsFor) as DayInfo };
  });
  const notices = activities
    .filter(a => a.status === "active" && (a.category === "Closed Office Day" || a.category === "Holiday") && a.date.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`))
    .sort((a, b) => a.date.localeCompare(b.date));

  const label: Record<DayInfo["state"], string> = { open: "available", full: "no times available", "office-closed": "office closed", closed: "not an office day", past: "not bookable" };
  const cellStyle = (d: typeof days[number]) => {
    const sel = value === d.iso;
    if (sel) return { background: T.primary, color: "#fff", border: `1.5px solid ${T.primary}`, fontWeight: 800 };
    if (d.info.state === "open") return { background: "#fff", color: T.text, border: `1.5px solid ${T.borderMd}`, fontWeight: 700 };
    if (d.info.state === "office-closed") return { background: T.redL, color: "#B91C1C", border: `1.5px solid ${T.redB}`, fontWeight: 600 };
    if (d.info.state === "full") return { background: T.amberL, color: T.amber, border: `1.5px solid ${T.amberB}`, fontWeight: 600, textDecoration: "line-through" };
    return { background: "#F6F3E6", color: "#A39A72", border: "1.5px solid #F6F3E6", fontWeight: 500 };
  };

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden", background: "#fff" }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ background: T.priLight, borderBottom: `1px solid ${T.border}` }}>
        <button type="button" aria-label="Previous month" disabled={!canPrev} onClick={() => setCursor(new Date(year, month - 1, 1, 12))}
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg disabled:opacity-30" style={{ border: `1.5px solid ${T.borderMd}`, background: "#fff" }}>
          <ChevronLeft size={20} />
        </button>
        <strong style={{ fontFamily: F.head, fontSize: 18, color: T.text }}>
          {cursor.toLocaleDateString("en-PH", { month: "long", year: "numeric" })}
        </strong>
        <button type="button" aria-label="Next month" disabled={!canNext} onClick={() => setCursor(new Date(year, month + 1, 1, 12))}
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg disabled:opacity-30" style={{ border: `1.5px solid ${T.borderMd}`, background: "#fff" }}>
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="grid grid-cols-7" style={{ borderBottom: `1px solid ${T.border}` }}>
        {DOW.map(d => <div key={d} className="py-2 text-center" style={{ fontFamily: F.head, fontSize: 13, fontWeight: 700, color: T.muted }}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1 p-2 sm:gap-1.5 sm:p-3">
        {Array.from({ length: firstDow }, (_, i) => <div key={`e${i}`} />)}
        {days.map(d => {
          const ok = d.info.state === "open";
          return (
            <button key={d.iso} type="button" disabled={!ok} onClick={() => onChange(d.iso)}
              aria-label={`${fmtLong(d.iso)}, ${label[d.info.state]}${value === d.iso ? ", selected" : ""}`} aria-pressed={value === d.iso}
              title={ok ? "Available" : d.info.reason}
              className="min-h-11 rounded-lg text-sm sm:min-h-12 sm:text-base" style={{ ...cellStyle(d), cursor: ok ? "pointer" : "not-allowed", fontFamily: F.head }}>
              {d.n}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 px-4 py-3" style={{ background: T.priLight, borderTop: `1px solid ${T.border}`, fontSize: 13, color: T.sub }}>
        <span><b>White</b> — available</span>
        <span><b style={{ color: T.amber }}>Struck through</b> — no free times</span>
        <span><b style={{ color: "#B91C1C" }}>Red</b> — office closed</span>
        <span><b>Grey</b> — not an office day / not bookable</span>
      </div>
      {notices.length > 0 && (
        <ul className="m-0 list-none space-y-1 px-4 py-3" style={{ borderTop: `1px solid ${T.border}`, fontSize: 14, color: T.sub }}>
          {notices.map(n => (
            <li key={n.id}>
              <b>{new Date(`${n.date}T12:00:00`).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}</b> · {n.category === "Closed Office Day" ? "Office closed" : "Holiday"} — {n.title}
              {n.notes ? ` (${n.notes})` : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ─── Wizard ─── */
type StepKey = "service" | "reminders" | "requester" | "details" | "schedule" | "review";
const STEP_LABEL: Record<StepKey, string> = { service: "Service", reminders: "Reminders", requester: "Your details", details: "Request details", schedule: "Schedule", review: "Review" };

interface FormState {
  first: string; middle: string; last: string; suffix: string; contact: string; email: string; address: string;
  self: boolean; subject: string; groom: string; bride: string; dateOfSacrament: string; purpose: string;
  prefDate: string; prefTime: string; ack: boolean; consent: boolean;
}
const EMPTY: FormState = {
  first: "", middle: "", last: "", suffix: "", contact: "", email: "", address: "",
  self: false, subject: "", groom: "", bride: "", dateOfSacrament: "", purpose: "",
  prefDate: "", prefTime: "", ack: false, consent: false,
};

export default function RequestWizard({ services, requests, activities, settings, conflictsFor, preService, onSubmit, onTrack, onHome }:
  {
    services: PubService[]; requests: PubRequest[]; activities: PubActivity[]; settings: PubSettings; conflictsFor: ConflictsFor;
    preService: string; onSubmit: (s: OnlineSubmission) => string; onTrack: () => void; onHome: () => void;
  }) {
  const [serviceId, setServiceId] = useState(preService);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [step, setStep] = useState<StepKey>(preService ? "reminders" : "service");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState<{ id: string; svc: PubService; schedule: string } | null>(null);
  const [copied, setCopied] = useState<"" | "ok" | "fail">("");
  const headRef = useRef<HTMLDivElement>(null);

  const svc = services.find(s => s.id === serviceId);
  const spec = specFor(svc?.name ?? "");
  const steps: StepKey[] = svc
    ? ["service", "reminders", "requester", "details", ...(svc.schedulable ? ["schedule" as const] : []), "review"]
    : ["service"];
  const idx = steps.indexOf(step);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: "" })); setSubmitError(""); };

  const fullName = [form.first, form.middle, form.last, form.suffix].map(s => s.trim()).filter(Boolean).join(" ");
  const subjectName = spec.kind === "couple" ? `${form.groom.trim()} & ${form.bride.trim()}` : form.self ? fullName : form.subject.trim();
  const duration = svc?.duration ?? 60;
  const slot = svc?.schedulable && form.prefDate && form.prefTime ? { start: form.prefTime, end: fromMin(toMin(form.prefTime) + duration) } : null;
  const dayDetail = useMemo(
    () => (svc?.schedulable && form.prefDate ? dayInfo(form.prefDate, duration, settings, conflictsFor) : null),
    [svc, form.prefDate, duration, settings, conflictsFor],
  );

  useEffect(() => { headRef.current?.scrollIntoView({ block: "start" }); window.scrollTo({ top: 0 }); }, [step, done]);

  function pickService(id: string) {
    if (id !== serviceId) setForm(f => ({ ...f, prefDate: "", prefTime: "", subject: "", self: false, groom: "", bride: "", dateOfSacrament: "" }));
    setServiceId(id); setStep("reminders"); setErrors({});
  }

  function validate(s: StepKey): Record<string, string> {
    const e: Record<string, string> = {};
    if (s === "reminders" && !form.ack) e.ack = "Please confirm that you understand the reminders.";
    if (s === "requester") {
      if (!form.first.trim()) e.first = "Enter your first name.";
      if (!form.last.trim()) e.last = "Enter your last name.";
      if (!form.contact.trim()) e.contact = "Enter a mobile number.";
      else if (!validPhone(form.contact)) e.contact = "Enter a valid Philippine mobile number, e.g. 0917 123 4567.";
      if (form.email.trim() && !validEmail(form.email)) e.email = "Enter a valid email address or leave it blank.";
      if (form.address.trim().length < 5) e.address = "Enter your complete address (barangay and municipality).";
    }
    if (s === "details") {
      if (spec.kind === "couple") {
        if (!form.groom.trim()) e.groom = "Enter the groom's full name.";
        if (!form.bride.trim()) e.bride = "Enter the bride's full name.";
      } else if (!form.self && !form.subject.trim()) e.subject = "Enter the full name.";
      if (!form.purpose.trim()) e.purpose = "Tell the parish office why you are making this request.";
      if (form.dateOfSacrament && spec.dateMax && form.dateOfSacrament > todayISO()) e.dateOfSacrament = "This date cannot be in the future.";
      if (svc && !svc.schedulable && form.prefDate) {
        const p = visitDateProblem(form.prefDate, settings, conflictsFor);
        if (p) e.prefDate = p;
      }
    }
    if (s === "schedule") {
      if (!form.prefDate) e.prefDate = "Select an available date.";
      else if (!form.prefTime) e.prefTime = "Select a time.";
    }
    if (s === "review" && !form.consent) e.consent = "Please confirm before submitting.";
    return e;
  }

  function next() {
    const e = validate(step);
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;
    setStep(steps[idx + 1]);
  }
  const back = () => { setErrors({}); if (idx > 0) setStep(steps[idx - 1]); };

  function submit() {
    const e = validate("review");
    setErrors(e);
    if (!svc || Object.values(e).some(Boolean)) return;
    if (svc.schedulable) {
      const clash = !slot || conflictsFor(form.prefDate, slot.start, slot.end).length > 0;
      if (clash) { setSubmitError("That time is no longer available. Please choose another schedule."); setForm(f => ({ ...f, prefTime: "" })); setStep("schedule"); return; }
    }
    const open = ["pending", "verified", "scheduled"];
    const duplicate = requests.some(r => open.includes(r.status) && r.sacramentType === svc.name &&
      normPhone(r.contact) === normPhone(form.contact) && r.subjectName.trim().toLowerCase() === subjectName.toLowerCase());
    if (duplicate) {
      setSubmitError("A similar request for this service and person is already on file. Use Track a Request, or contact the parish office if you need to change it.");
      return;
    }
    const id = onSubmit({
      parishioner: fullName, contact: normPhone(form.contact), email: form.email.trim(), address: form.address.trim(),
      sacramentType: svc.name, subjectName, dateOfSacrament: form.dateOfSacrament, purposeOf: form.purpose.trim(),
      prefDate: form.prefDate, prefTime: svc.schedulable ? form.prefTime : "",
    });
    setDone({ id, svc, schedule: svc.schedulable && slot ? `${fmtLong(form.prefDate)} · ${fmtRange(slot.start, slot.end)}` : form.prefDate ? fmtLong(form.prefDate) : "" });
  }

  async function copy(id: string) {
    try { await navigator.clipboard.writeText(id); setCopied("ok"); } catch { setCopied("fail"); }
  }

  /* ─── Confirmation ─── */
  if (done) {
    return (
      <div ref={headRef} className="mx-auto max-w-2xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full" style={{ background: T.greenL, color: T.green, border: `2px solid ${T.greenB}` }}><CheckCircle2 size={34} /></div>
        <div className="mt-5"><Title as="h1" size={34}>Request submitted</Title></div>
        <p style={{ fontSize: 17, lineHeight: 1.6, color: T.sub, margin: "12px 0 0" }}>
          The parish office received your request. Keep your request ID. You will need it, together with your contact number or email, to track progress.
        </p>
        <Card className="mt-7 p-6 text-left sm:p-8">
          <p style={{ fontFamily: F.head, fontSize: 12, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: T.muted, margin: 0 }}>Request ID</p>
          <p style={{ fontFamily: F.body, fontSize: 30, fontWeight: 700, letterSpacing: ".04em", color: T.text, margin: "6px 0 0", wordBreak: "break-all" }}>{done.id}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <PBtn variant="outline" onClick={() => copy(done.id)} style={{ minHeight: 44, padding: "8px 18px", fontSize: 15 }}><Copy size={16} /> {copied === "ok" ? "Copied" : "Copy request ID"}</PBtn>
            <span aria-live="polite" style={{ fontSize: 14, color: T.muted }}>{copied === "fail" ? "Copy was blocked. Please write the ID down." : ""}</span>
          </div>
          <dl className="mt-6 grid gap-4 pt-5 sm:grid-cols-2" style={{ borderTop: `1px solid ${T.border}` }}>
            <div><dt style={{ fontFamily: F.head, fontSize: 13, fontWeight: 700, color: T.muted }}>Service</dt><dd style={{ margin: "4px 0 0", fontSize: 17 }}>{done.svc.name}</dd></div>
            <div><dt style={{ fontFamily: F.head, fontSize: 13, fontWeight: 700, color: T.muted }}>Status</dt><dd style={{ margin: "4px 0 0", fontSize: 17, fontWeight: 700, color: "#92400E" }}>Pending</dd></div>
            <div><dt style={{ fontFamily: F.head, fontSize: 13, fontWeight: 700, color: T.muted }}>Service fee</dt><dd style={{ margin: "4px 0 0", fontSize: 17 }}>{peso(done.svc.fee)}</dd></div>
            <div><dt style={{ fontFamily: F.head, fontSize: 13, fontWeight: 700, color: T.muted }}>{done.svc.schedulable ? "Requested schedule" : "Preferred visit date"}</dt><dd style={{ margin: "4px 0 0", fontSize: 17 }}>{done.schedule || "None given"}</dd></div>
          </dl>
        </Card>
        <Card className="mt-5 p-6 text-left">
          <h2 style={{ fontFamily: F.head, fontSize: 18, fontWeight: 800, margin: "0 0 10px" }}>What happens next</h2>
          <ol className="m-0 space-y-2 pl-5" style={{ fontSize: 16, lineHeight: 1.55, color: T.sub }}>
            <li>Visit the parish office during office hours and pay {peso(done.svc.fee)}. The cashier issues your Official Receipt (OR).</li>
            <li>Parish staff verify your request and record the OR number.</li>
            {done.svc.schedulable
              ? <li>The parish office confirms or adjusts your schedule. Your requested date is not final until it shows as <b>Scheduled</b>.</li>
              : <li>The parish office processes your request{done.svc.requiresPrinting ? " and prepares the certificate" : ""}.</li>}
          </ol>
        </Card>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <PBtn onClick={onTrack}>Track this request</PBtn>
          <PBtn variant="outline" onClick={onHome}>Back to home</PBtn>
        </div>
      </div>
    );
  }

  /* ─── Progress ─── */
  const progress = (
    <ol className="m-0 mb-8 flex list-none flex-wrap gap-2 p-0" aria-label="Request progress">
      {steps.map((k, i) => {
        const state = i < idx ? "done" : i === idx ? "now" : "todo";
        return (
          <li key={k} aria-current={state === "now" ? "step" : undefined} className="flex items-center gap-2 rounded-full px-3 py-1.5"
            style={{
              fontFamily: F.head, fontSize: 13, fontWeight: 700,
              background: state === "now" ? T.primary : state === "done" ? T.priLight : "#fff",
              color: state === "now" ? "#fff" : state === "done" ? T.priHov : T.muted,
              border: `1.5px solid ${state === "todo" ? T.border : T.primary}`,
            }}>
            <span>{i + 1}</span><span className={state === "now" ? "" : "hidden sm:inline"}>{STEP_LABEL[k]}</span>
          </li>
        );
      })}
    </ol>
  );

  const Nav = ({ nextLabel = "Continue", onNext = next, hideBack }: { nextLabel?: string; onNext?: () => void; hideBack?: boolean }) => (
    <div className="mt-8 flex flex-col-reverse justify-between gap-3 sm:flex-row">
      {hideBack ? <span /> : <PBtn variant="outline" onClick={back}>Back</PBtn>}
      <PBtn onClick={onNext}>{nextLabel}</PBtn>
    </div>
  );
  const grid2 = "grid gap-5 sm:grid-cols-2";
  const errStyle = (k: string) => (errors[k] ? { borderColor: T.red } : {});

  return (
    <div ref={headRef} className="mx-auto max-w-3xl">
      <Eyebrow>Request a service</Eyebrow>
      <div className="mt-2 mb-6 flex items-center gap-4">
        {svc && step !== "service" && <ServiceIcon name={svc.name} size={52} />}
        <Title as="h1" size={34}>{svc && step !== "service" ? svc.name : "Choose a service"}</Title>
      </div>
      {progress}

      {step === "service" && (
        <div>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: T.sub, margin: "0 0 20px" }}>Select the service you need. Fees and scheduling rules come directly from the parish office.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {services.filter(s => s.active).map(s => (
              <button key={s.id} type="button" onClick={() => pickService(s.id)} aria-pressed={serviceId === s.id}
                className="flex items-start gap-4 rounded-2xl p-5 text-left" style={{ background: "#fff", border: `2px solid ${serviceId === s.id ? T.primary : T.border}`, cursor: "pointer" }}>
                <ServiceIcon name={s.name} size={48} />
                <span className="min-w-0 flex-1">
                  <span style={{ fontFamily: F.head, fontSize: 18, fontWeight: 800, color: T.text, display: "block" }}>{s.name}</span>
                  <span style={{ fontSize: 15, color: T.sub, lineHeight: 1.5, display: "block", margin: "6px 0 10px" }}>{s.description}</span>
                  <span style={{ fontFamily: F.head, fontSize: 14, fontWeight: 700, color: T.priHov }}>{peso(s.fee)} · {s.schedulable ? "Scheduled" : "No appointment needed"}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {svc && step === "reminders" && (
        <div>
          <Card className="p-6 sm:p-8">
            <h2 style={{ fontFamily: F.head, fontSize: 20, fontWeight: 800, margin: "0 0 14px" }}>Before you continue</h2>
            <ul className="m-0 space-y-3 pl-5" style={{ fontSize: 16, lineHeight: 1.6, color: T.sub }}>
              <li><b>No online payment.</b> The service fee of <b>{peso(svc.fee)}</b> is paid in person at the parish office, where the cashier issues the Official Receipt.</li>
              <li><b>Submitting is not approval.</b> Parish staff verify every request. It is verified only after the Official Receipt is recorded.</li>
              {svc.schedulable
                ? <li><b>Your schedule is a request.</b> The parish office confirms the final date and time (about {svc.duration} minutes) and may adjust it.</li>
                : <li><b>No appointment is needed.</b> This is a document service; you do not have to book a time.</li>}
              {svc.requiresPrinting && <li>The certificate is printed and released by the parish office.</li>}
              <li>Office hours — Mon–Fri: {settings.hoursWeekday}; Sat: {settings.hoursSat}; Sun: {settings.hoursSun}.</li>
            </ul>
            <label className="mt-6 flex cursor-pointer items-start gap-3" style={{ fontSize: 16, color: T.text }}>
              <input type="checkbox" checked={form.ack} onChange={e => set("ack", e.target.checked)} className="mt-1 h-5 w-5" aria-describedby={errors.ack ? "ack-err" : undefined} />
              <span>I understand these reminders.</span>
            </label>
            {errors.ack && <p role="alert" id="ack-err" style={{ fontSize: 14, color: T.red, fontWeight: 600, margin: "8px 0 0" }}>{errors.ack}</p>}
          </Card>
          <div className="mt-8 flex flex-col-reverse justify-between gap-3 sm:flex-row">
            <PBtn variant="outline" onClick={() => { setStep("service"); setErrors({}); }}>Change service</PBtn>
            <PBtn onClick={next}>Continue</PBtn>
          </div>
        </div>
      )}

      {svc && step === "requester" && (
        <div>
          <p style={{ fontSize: 17, color: T.sub, margin: "0 0 20px", lineHeight: 1.6 }}>Tell us who is making the request so the parish office can reach you.</p>
          <Card className="space-y-5 p-6 sm:p-8">
            <div className={grid2}>
              <Field label="First name" htmlFor="first" required error={errors.first}><input id="first" autoComplete="given-name" style={{ ...inputStyle, ...errStyle("first") }} value={form.first} onChange={e => set("first", e.target.value)} /></Field>
              <Field label="Middle name" htmlFor="middle"><input id="middle" autoComplete="additional-name" style={inputStyle} value={form.middle} onChange={e => set("middle", e.target.value)} /></Field>
              <Field label="Last name" htmlFor="last" required error={errors.last}><input id="last" autoComplete="family-name" style={{ ...inputStyle, ...errStyle("last") }} value={form.last} onChange={e => set("last", e.target.value)} /></Field>
              <Field label="Suffix" htmlFor="suffix"><input id="suffix" style={inputStyle} placeholder="Jr., Sr., III" value={form.suffix} onChange={e => set("suffix", e.target.value)} /></Field>
            </div>
            <div className={grid2}>
              <Field label="Mobile number" htmlFor="contact" required error={errors.contact} hint="Used with your request ID to verify you when tracking.">
                <input id="contact" type="tel" inputMode="tel" autoComplete="tel" placeholder="09XX XXX XXXX" style={{ ...inputStyle, ...errStyle("contact") }} value={form.contact} onChange={e => set("contact", e.target.value)} />
              </Field>
              <Field label="Email address" htmlFor="email" error={errors.email} hint="Optional. Can also be used for tracking.">
                <input id="email" type="email" autoComplete="email" style={{ ...inputStyle, ...errStyle("email") }} value={form.email} onChange={e => set("email", e.target.value)} />
              </Field>
            </div>
            <Field label="Complete address" htmlFor="address" required error={errors.address} hint="House or purok, barangay, municipality, province.">
              <textarea id="address" rows={3} autoComplete="street-address" style={{ ...inputStyle, ...errStyle("address"), resize: "vertical" }} value={form.address} onChange={e => set("address", e.target.value)} />
            </Field>
          </Card>
          <Nav />
        </div>
      )}

      {svc && step === "details" && (
        <div>
          <Card className="space-y-5 p-6 sm:p-8">
            {spec.kind === "couple" ? (
              <div className={grid2}>
                <Field label="Groom — full name" htmlFor="groom" required error={errors.groom}><input id="groom" style={{ ...inputStyle, ...errStyle("groom") }} value={form.groom} onChange={e => set("groom", e.target.value)} /></Field>
                <Field label="Bride — full name" htmlFor="bride" required error={errors.bride}><input id="bride" style={{ ...inputStyle, ...errStyle("bride") }} value={form.bride} onChange={e => set("bride", e.target.value)} /></Field>
              </div>
            ) : (
              <div className="space-y-3">
                {spec.selfAllowed && (
                  <label className="flex cursor-pointer items-center gap-3" style={{ fontSize: 16 }}>
                    <input type="checkbox" checked={form.self} onChange={e => set("self", e.target.checked)} className="h-5 w-5" />
                    <span>This request is for myself ({fullName || "name entered in the previous step"})</span>
                  </label>
                )}
                {!form.self && (
                  <Field label={spec.subjectLabel} htmlFor="subject" required error={errors.subject} hint={spec.subjectHint}>
                    <input id="subject" style={{ ...inputStyle, ...errStyle("subject") }} value={form.subject} onChange={e => set("subject", e.target.value)} />
                  </Field>
                )}
              </div>
            )}
            {spec.dateLabel && (
              <Field label={spec.dateLabel} htmlFor="dos" error={errors.dateOfSacrament}>
                <input id="dos" type="date" max={spec.dateMax ? todayISO() : undefined} style={{ ...inputStyle, ...errStyle("dateOfSacrament") }} value={form.dateOfSacrament} onChange={e => set("dateOfSacrament", e.target.value)} />
              </Field>
            )}
            <Field label="Purpose of the request" htmlFor="purpose" required error={errors.purpose}>
              <input id="purpose" list="purposes" style={{ ...inputStyle, ...errStyle("purpose") }} value={form.purpose} onChange={e => set("purpose", e.target.value)} placeholder="Choose a suggestion or type your own" />
              <datalist id="purposes">{COMMON_PURPOSES.map(p => <option key={p} value={p} />)}</datalist>
            </Field>
            {!svc.schedulable && (
              <Field label="Preferred date to visit the parish office" htmlFor="visit" error={errors.prefDate} hint="Optional. Visit during office hours to pay the fee.">
                <input id="visit" type="date" min={addDaysISO(todayISO(), MIN_LEAD_DAYS)} max={addDaysISO(todayISO(), MAX_AHEAD_DAYS)} style={{ ...inputStyle, ...errStyle("prefDate") }} value={form.prefDate} onChange={e => set("prefDate", e.target.value)} />
              </Field>
            )}
            <p style={{ fontSize: 14, color: T.muted, margin: 0 }}>Do not enter government ID numbers or payment information.</p>
          </Card>
          <Nav />
        </div>
      )}

      {svc && step === "schedule" && (
        <div>
          <Notice>Your chosen date and time are a request. The parish office confirms the final schedule after verification.</Notice>
          <div className="mt-5 grid gap-6 md:grid-cols-[1.1fr_1fr]">
            <div>
              <p style={{ fontFamily: F.head, fontSize: 15, fontWeight: 700, margin: "0 0 10px" }}>Select a date <span style={{ color: T.red }}>*</span></p>
              <SlotCalendar value={form.prefDate} onChange={iso => { setForm(f => ({ ...f, prefDate: iso, prefTime: "" })); setErrors({}); }}
                duration={duration} settings={settings} conflictsFor={conflictsFor} activities={activities} />
              {errors.prefDate && <p role="alert" style={{ fontSize: 14, color: T.red, fontWeight: 600, margin: "8px 0 0" }}>{errors.prefDate}</p>}
            </div>
            <div>
              <p style={{ fontFamily: F.head, fontSize: 15, fontWeight: 700, margin: "0 0 10px" }}>
                Select a time <span style={{ color: T.red }}>*</span> <span style={{ fontWeight: 500, color: T.muted }}>(about {duration} min)</span>
              </p>
              {!form.prefDate && <p style={{ fontSize: 15, color: T.muted, margin: 0 }}>Choose a date to see available times.</p>}
              {dayDetail && (
                <>
                  <p style={{ fontSize: 15, color: T.sub, margin: "0 0 10px" }}><Clock size={15} style={{ display: "inline", verticalAlign: "-2px" }} /> {fmtLong(form.prefDate)}</p>
                  <div className="grid grid-cols-2 gap-2" role="group" aria-label="Available times">
                    {dayDetail.slots.map(s => (
                      <button key={s.start} type="button" disabled={!s.available} onClick={() => set("prefTime", s.start)} aria-pressed={form.prefTime === s.start}
                        title={s.available ? "Available" : `Unavailable — ${s.reason}`}
                        className="rounded-lg px-2 py-2.5" style={{
                          fontFamily: F.head, fontSize: 14, fontWeight: 700, minHeight: 46,
                          cursor: s.available ? "pointer" : "not-allowed",
                          background: form.prefTime === s.start ? T.primary : s.available ? "#fff" : "#F6F3E6",
                          color: form.prefTime === s.start ? "#fff" : s.available ? T.text : "#A39A72",
                          border: `1.5px solid ${form.prefTime === s.start ? T.primary : s.available ? T.borderMd : "#F6F3E6"}`,
                          textDecoration: s.available ? "none" : "line-through",
                        }}>
                        {fmtTime(s.start)} – {fmtTime(s.end)}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {errors.prefTime && <p role="alert" style={{ fontSize: 14, color: T.red, fontWeight: 600, margin: "10px 0 0" }}>{errors.prefTime}</p>}
            </div>
          </div>
          <Nav />
        </div>
      )}

      {svc && step === "review" && (
        <div>
          <Card className="p-6 sm:p-8">
            <div className="mb-3 flex flex-wrap justify-end gap-2">
              <PBtn variant="ghost" style={{ minHeight: 40, fontSize: 14 }} onClick={() => setStep("requester")}>Edit your details</PBtn>
              <PBtn variant="ghost" style={{ minHeight: 40, fontSize: 14 }} onClick={() => setStep("details")}>Edit request details</PBtn>
              {svc.schedulable && <PBtn variant="ghost" style={{ minHeight: 40, fontSize: 14 }} onClick={() => setStep("schedule")}>Edit schedule</PBtn>}
            </div>
            <dl className="m-0">
              {([
                ["Service", svc.name],
                ["Service fee", `${peso(svc.fee)} — paid at the parish office`],
                ["Requester", fullName],
                ["Mobile number", normPhone(form.contact)],
                ["Email", form.email.trim() || "Not provided"],
                ["Address", form.address.trim()],
                [spec.kind === "couple" ? "Couple" : "Name on the record", subjectName],
                ...(spec.dateLabel ? [[spec.dateLabel.replace(/ \(.*\)$/, ""), form.dateOfSacrament ? fmtLong(form.dateOfSacrament) : "Not provided"]] : []),
                ["Purpose", form.purpose.trim()],
                ...(svc.schedulable
                  ? [["Requested schedule", slot ? `${fmtLong(form.prefDate)} · ${fmtRange(slot.start, slot.end)}` : "—"]]
                  : [["Preferred visit date", form.prefDate ? fmtLong(form.prefDate) : "Not provided"]]),
              ] as string[][]).map(([k, v]) => (
                <div key={k} className="grid gap-1 py-3 sm:grid-cols-[13rem_1fr] sm:gap-5" style={{ borderTop: `1px solid ${T.border}` }}>
                  <dt style={{ fontFamily: F.head, fontSize: 14, fontWeight: 700, color: T.muted }}>{k}</dt>
                  <dd style={{ margin: 0, fontSize: 16, color: T.text, wordBreak: "break-word" }}>{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <div className="mt-5" style={{ background: T.priLight, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18 }}>
            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" checked={form.consent} onChange={e => set("consent", e.target.checked)} className="mt-1 h-5 w-5" aria-describedby={errors.consent ? "consent-err" : undefined} />
              <span style={{ fontSize: 15, lineHeight: 1.6, color: T.sub }}>
                I confirm the information is accurate and consent to the parish office using it to verify and process this request. I understand that submitting is not approval and that payment is made in person.
              </span>
            </label>
            {errors.consent && <p role="alert" id="consent-err" style={{ fontSize: 14, color: T.red, fontWeight: 600, margin: "8px 0 0" }}>{errors.consent}</p>}
          </div>
          {submitError && <div className="mt-4"><Notice tone="error">{submitError}</Notice></div>}
          <Nav nextLabel="Submit request" onNext={submit} />
          <p className="mt-4 flex items-start gap-2" style={{ fontSize: 14, color: T.muted }}><Info size={16} className="mt-0.5 shrink-0" /> You will receive a request ID on the next screen.</p>
        </div>
      )}
    </div>
  );
}
