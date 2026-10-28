/* Public parishioner website for Parroquia de San Pedro Apostol.
 * It runs on the same live data as the SARMS staff system:
 *  - services, fees, durations -> Service Configuration
 *  - availability              -> Calendar of Activities + approved appointments (same conflict rules as staff)
 *  - office hours & contact    -> System Settings
 *  - submitted requests        -> staff Requests queue (status Pending)
 *  - request tracking          -> the same Request records staff update */
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, CalendarDays, CheckCircle2, Clock, ExternalLink, FileText, Mail, MapPin, Menu, Phone, Search, X, AlertTriangle } from "lucide-react";
import { T, F, STATUS_CFG, ACTIVITY_CATS } from "../tokens";
import { Card, Eyebrow, Field, Notice, PBtn, Title, Wrap, inputStyle } from "./ui";
import RequestWizard from "./RequestWizard";
import {
  PUBLIC_CATEGORIES, addDaysISO, findRequest, fmtLong, fmtRange, fmtShort, fmtTime, isPublicActivity, officeWindows, peso, statusMessage, todayISO,
  type ConflictsFor, type OnlineSubmission, type PubActivity, type PubRequest, type PubService, type PubSettings,
} from "./publicLogic";

type Page = "home" | "services" | "request" | "track" | "schedule" | "about";
const NAV: { page: Page; label: string }[] = [
  { page: "home", label: "Home" },
  { page: "services", label: "Services" },
  { page: "schedule", label: "Parish Schedule" },
  { page: "track", label: "Track a Request" },
  { page: "about", label: "About & Contact" },
];

export interface PublicSiteProps {
  services: PubService[]; activities: PubActivity[]; requests: PubRequest[]; settings: PubSettings;
  logoSrc: string; bannerSrc: string; conflictsFor: ConflictsFor;
  onSubmit: (s: OnlineSubmission) => string;
}

export default function PublicSite(props: PublicSiteProps) {
  const { services, activities, requests, settings, logoSrc, bannerSrc, conflictsFor, onSubmit } = props;
  const [page, setPage] = useState<Page>("home");
  const [pre, setPre] = useState("");
  const [menu, setMenu] = useState(false);
  const [wizardKey, setWizardKey] = useState(0);
  const mainRef = useRef<HTMLElement>(null);
  const active = services.filter(s => s.active);

  const go = (p: Page) => { setPage(p); setMenu(false); window.scrollTo({ top: 0 }); };
  const startRequest = (serviceId = "") => { setPre(serviceId); setWizardKey(k => k + 1); go("request"); };
  useEffect(() => { mainRef.current?.focus({ preventScroll: true }); }, [page]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: T.bg, color: T.text, fontFamily: F.body }}>
      <style>{`
        .pub-btn-primary:hover:not(:disabled){background:${T.priHov}!important;border-color:${T.priHov}!important}
        .pub-btn-outline:hover:not(:disabled){background:${T.priLight}!important}
        .pub-btn-ghost:hover:not(:disabled){background:${T.priLight}!important}
        .pub-btn-light:hover:not(:disabled){background:${T.priLight}!important}
        .pub-link{color:${T.priHov};font-weight:700;text-decoration:underline;text-underline-offset:3px;cursor:pointer;background:none;border:none;padding:0;font-family:${F.head}}
        .pub-nav:hover{background:${T.priLight}}
        .pub-card-hover{transition:transform .15s,box-shadow .15s}.pub-card-hover:hover{transform:translateY(-2px)}
        *:focus-visible{outline:3px solid ${T.primary};outline-offset:2px;border-radius:6px}
        @media (prefers-reduced-motion: reduce){.pub-card-hover{transition:none}.pub-card-hover:hover{transform:none}}
      `}</style>

      <a href="#pub-main" className="fixed left-4 top-4 z-50 -translate-y-24 rounded-lg px-5 py-3 font-bold text-white focus:translate-y-0" style={{ background: T.text }}>Skip to main content</a>

      {/* Header */}
      <header style={{ background: "#fff", borderBottom: `3px solid ${T.primary}`, position: "sticky", top: 0, zIndex: 30 }}>
        <Wrap className="flex items-center justify-between gap-4 py-3">
          <button type="button" onClick={() => go("home")} className="flex items-center gap-3 text-left" aria-label={`${settings.parishName} — home`} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <img src={logoSrc} alt="" width={52} height={52} style={{ width: 52, height: 52, objectFit: "contain" }} />
            <span>
              <span style={{ display: "block", fontFamily: F.head, fontSize: 11, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: T.priHov }}>Parroquia de</span>
              <span style={{ display: "block", fontFamily: F.display, fontSize: 22, fontWeight: 800, letterSpacing: "-.03em", color: T.text, lineHeight: 1.1 }}>San Pedro Apostol</span>
            </span>
          </button>
          <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
            {NAV.map(n => (
              <button key={n.page} type="button" onClick={() => go(n.page)} aria-current={page === n.page ? "page" : undefined} className="pub-nav rounded-lg px-3 py-2"
                style={{ fontFamily: F.head, fontSize: 15, fontWeight: 700, color: page === n.page ? T.priHov : T.text, background: page === n.page ? T.priLight : "transparent", border: "none", cursor: "pointer" }}>
                {n.label}
              </button>
            ))}
            <PBtn onClick={() => startRequest()} style={{ minHeight: 44, padding: "8px 20px", fontSize: 15, marginLeft: 8 }}>Request a Service</PBtn>
          </nav>
          <button type="button" className="inline-flex h-12 w-12 items-center justify-center rounded-lg lg:hidden" aria-label={menu ? "Close menu" : "Open menu"} aria-expanded={menu}
            onClick={() => setMenu(m => !m)} style={{ border: `1.5px solid ${T.borderMd}`, background: "#fff" }}>
            {menu ? <X size={22} /> : <Menu size={22} />}
          </button>
        </Wrap>
        {menu && (
          <nav aria-label="Primary mobile" className="lg:hidden" style={{ borderTop: `1px solid ${T.border}`, background: "#fff" }}>
            <Wrap className="flex flex-col gap-1 py-3">
              {NAV.map(n => (
                <button key={n.page} type="button" onClick={() => go(n.page)} aria-current={page === n.page ? "page" : undefined} className="pub-nav rounded-lg px-3 py-3 text-left"
                  style={{ fontFamily: F.head, fontSize: 16, fontWeight: 700, color: page === n.page ? T.priHov : T.text, background: page === n.page ? T.priLight : "transparent", border: "none", cursor: "pointer" }}>
                  {n.label}
                </button>
              ))}
              <PBtn onClick={() => startRequest()} style={{ marginTop: 6 }}>Request a Service</PBtn>
            </Wrap>
          </nav>
        )}
      </header>

      <main id="pub-main" ref={mainRef} tabIndex={-1} style={{ flex: 1, outline: "none" }}>
        {page === "home" && <Home services={active} activities={activities} settings={settings} bannerSrc={bannerSrc} go={go} startRequest={startRequest} />}
        {page === "services" && <Services services={active} startRequest={startRequest} />}
        {page === "request" && (
          <Wrap className="py-10 sm:py-14">
            <RequestWizard key={wizardKey} services={active} requests={requests} activities={activities} settings={settings} conflictsFor={conflictsFor}
              preService={pre} onSubmit={onSubmit} onTrack={() => go("track")} onHome={() => go("home")} />
          </Wrap>
        )}
        {page === "track" && <Track requests={requests} services={services} />}
        {page === "schedule" && <Schedule activities={activities} settings={settings} />}
        {page === "about" && <About settings={settings} logoSrc={logoSrc} />}
      </main>

      {/* Footer */}
      <footer style={{ background: "#2A2000", color: "#F5EBC8", marginTop: 40 }}>
        <Wrap className="grid gap-8 py-10 md:grid-cols-3">
          <div>
            <p style={{ fontFamily: F.display, fontSize: 22, fontWeight: 800, margin: 0, color: "#fff" }}>{settings.parishName}</p>
            <p style={{ fontSize: 15, lineHeight: 1.6, margin: "8px 0 0", color: "#E4D5A0" }}>{settings.diocese}</p>
            <p style={{ fontSize: 15, lineHeight: 1.6, margin: "4px 0 0", color: "#E4D5A0" }}>{settings.address}</p>
          </div>
          <div style={{ fontSize: 15, lineHeight: 1.7, color: "#E4D5A0" }}>
            <p style={{ fontFamily: F.head, fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>Parish office hours</p>
            <p style={{ margin: 0 }}>Mon–Fri: {settings.hoursWeekday}</p>
            <p style={{ margin: 0 }}>Saturday: {settings.hoursSat}</p>
            <p style={{ margin: 0 }}>Sunday: {settings.hoursSun}</p>
          </div>
          <div style={{ fontSize: 15, lineHeight: 1.7, color: "#E4D5A0" }}>
            <p style={{ fontFamily: F.head, fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>Contact</p>
            <p style={{ margin: 0 }}>{settings.phone}</p>
            <p style={{ margin: 0 }}>{settings.email}</p>
            <p style={{ margin: 0 }}>{settings.facebook}</p>
          </div>
        </Wrap>
        <div style={{ borderTop: "1px solid rgba(255,255,255,.12)" }}>
          <Wrap className="flex flex-wrap items-center justify-between gap-3 py-4">
            <p style={{ fontSize: 13, margin: 0, color: "#CDBB80" }}>© {new Date().getFullYear()} {settings.parishName}. Online requests are processed by the parish office.</p>
          </Wrap>
        </div>
      </footer>
    </div>
  );
}

/* ─── Shared ─── */
function serviceMeta(s: PubService) {
  return s.schedulable ? `Scheduled · about ${s.duration} min` : "No appointment needed";
}

function ActivityRow({ a }: { a: PubActivity }) {
  const c = ACTIVITY_CATS[a.category] ?? { col: T.sub, light: "#F3F4F6" };
  const d = new Date(`${a.date}T12:00:00`);
  return (
    <li className="flex gap-4 py-4" style={{ borderTop: `1px solid ${T.border}` }}>
      <div className="w-16 shrink-0 text-center">
        <p style={{ fontFamily: F.head, fontSize: 12, fontWeight: 700, color: T.muted, margin: 0, textTransform: "uppercase", letterSpacing: ".1em" }}>
          {d.toLocaleDateString("en-PH", { month: "short" })}
        </p>
        <p style={{ fontFamily: F.display, fontSize: 28, fontWeight: 800, margin: 0, lineHeight: 1.1, color: T.text }}>{d.getDate()}</p>
        <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>{d.toLocaleDateString("en-PH", { weekday: "short" })}</p>
      </div>
      <div className="min-w-0 flex-1">
        <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 999, background: c.light, color: c.col, fontFamily: F.head, fontSize: 12, fontWeight: 700 }}>{a.category}</span>
        <p style={{ fontFamily: F.head, fontSize: 17, fontWeight: 700, margin: "6px 0 2px", color: T.text }}>{a.title}</p>
        <p style={{ fontSize: 15, color: T.sub, margin: 0 }}>
          {fmtRange(a.start, a.end, a.allDay)}{a.location ? ` · ${a.location}` : ""}
        </p>
        {a.notes && <p style={{ fontSize: 14, color: T.muted, margin: "4px 0 0" }}>{a.notes}</p>}
      </div>
    </li>
  );
}

function upcoming(activities: PubActivity[], days: number) {
  const from = todayISO(), to = addDaysISO(from, days);
  return activities.filter(a => isPublicActivity(a) && a.date >= from && a.date <= to)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.allDay ? "" : a.start).localeCompare(b.allDay ? "" : b.start));
}

/** Is the parish office open right now? Uses the System Settings hours and any Closed Office Day on the Calendar. */
function officeStatus(activities: PubActivity[], settings: PubSettings): { open: boolean; label: string; detail: string } {
  const today = todayISO();
  const closed = activities.find(a => a.status === "active" && a.category === "Closed Office Day" && a.date === today);
  if (closed) return { open: false, label: "Closed today", detail: closed.title };
  const windows = officeWindows(today, settings);
  if (windows.length === 0) return { open: false, label: "Closed today", detail: "Not an office day. See the hours below." };
  const now = new Date(), mins = now.getHours() * 60 + now.getMinutes();
  const hrs = windows.map(([s, e]) => `${fmtTime(`${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`)} – ${fmtTime(`${String(Math.floor(e / 60)).padStart(2, "0")}:${String(e % 60).padStart(2, "0")}`)}`).join(", ");
  if (windows.some(([s, e]) => mins >= s && mins < e)) return { open: true, label: "Open now", detail: `Today: ${hrs}` };
  return { open: false, label: "Closed right now", detail: `Today: ${hrs}` };
}

/* ─── Home ─── */
function Home({ services, activities, settings, bannerSrc, go, startRequest }:
  { services: PubService[]; activities: PubActivity[]; settings: PubSettings; bannerSrc: string; go: (p: Page) => void; startRequest: (id?: string) => void }) {
  const next = upcoming(activities, 60).slice(0, 4);
  const closures = upcoming(activities, 14).filter(a => a.category === "Closed Office Day");
  const office = officeStatus(activities, settings);
  return (
    <>
      <section style={{ position: "relative", isolation: "isolate", overflow: "hidden", background: "linear-gradient(135deg,#2A2000 0%,#3B2B00 60%,#2A2000 100%)", paddingBottom: 72 }}>
        <div aria-hidden style={{ position: "absolute", zIndex: -1, right: "-8%", top: "-30%", width: 640, height: 640, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,150,10,.35), rgba(201,150,10,0) 65%)" }} />
        <div aria-hidden style={{ position: "absolute", zIndex: -1, left: 0, right: 0, bottom: 0, height: 4, background: "linear-gradient(90deg,#C9980A,#FCD34D 50%,#C9980A)" }} />
        <Wrap className="grid items-center gap-10 pt-10 lg:grid-cols-12 lg:gap-12 lg:pt-16">
          <div className="lg:col-span-5">
            <Eyebrow light>{settings.diocese} · Vinzons, Camarines Norte</Eyebrow>
            <div className="mt-4"><Title as="h1" size={46} color="#fff">Sacramental requests, made simple.</Title></div>
            <p style={{ fontSize: 18, lineHeight: 1.65, color: "#F5EBC8", margin: "18px 0 0" }}>
              Request baptismal, confirmation, marriage and other parish certificates, book Mass services, and follow your request, all connected directly to the parish office records.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PBtn onClick={() => startRequest()}>Request a Service <ArrowRight size={18} /></PBtn>
              <PBtn variant="light" onClick={() => go("track")}><Search size={18} /> Track a Request</PBtn>
            </div>
          </div>
          {/* Full, uncropped 16:9 banner so the "Preserving the Church, Sharing the Faith." tagline stays visible */}
          <div className="relative order-first lg:order-none lg:col-span-7">
            <div aria-hidden className="absolute hidden rounded-3xl lg:block" style={{ inset: 0, transform: "translate(18px, 18px)", border: `2px solid ${T.primary}`, opacity: 0.7 }} />
            <div className="relative overflow-hidden rounded-3xl" style={{ border: "4px solid #fff", boxShadow: "0 30px 60px -20px rgba(0,0,0,.6)" }}>
              <img src={bannerSrc} alt="Preserving the Church, Sharing the Faith. Parishioners gathered before the parish church of San Pedro Apostol." className="block aspect-video w-full object-cover" />
            </div>
          </div>
        </Wrap>
      </section>

      {/* Quick actions overlapping the hero */}
      <Wrap className="relative z-10 -mt-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: <FileText size={22} />, k: "Request", t: "Request a service", d: `${services.length} services · fees paid at the office`, on: () => startRequest() },
            { icon: <Search size={22} />, k: "Track", t: "Track a request", d: "Use your request ID and contact", on: () => go("track") },
            { icon: <CalendarDays size={22} />, k: "Schedule", t: next[0] ? next[0].title : "Parish schedule", d: next[0] ? `${fmtShort(next[0].date)} · ${fmtRange(next[0].start, next[0].end, next[0].allDay)}` : "Masses and parish activities", on: () => go("schedule") },
          ].map(c => (
            <button key={c.k} type="button" onClick={c.on} className="pub-card-hover flex h-full flex-col items-start rounded-2xl p-5 text-left"
              style={{ background: "#fff", border: `1px solid ${T.border}`, boxShadow: "0 18px 36px -18px rgba(61,31,0,.45)", cursor: "pointer" }}>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: T.priLight, color: T.priHov, border: `1px solid ${T.border}` }}>{c.icon}</span>
              <span style={{ fontFamily: F.head, fontSize: 12, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: T.muted, marginTop: 14 }}>{c.k}</span>
              <span style={{ fontFamily: F.head, fontSize: 17, fontWeight: 800, color: T.text, marginTop: 2 }}>{c.t}</span>
              <span style={{ fontSize: 14, color: T.sub, marginTop: 4, lineHeight: 1.45 }}>{c.d}</span>
            </button>
          ))}
          <div className="flex h-full flex-col items-start rounded-2xl p-5" style={{ background: "#fff", border: `1px solid ${T.border}`, boxShadow: "0 18px 36px -18px rgba(61,31,0,.45)" }}>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: office.open ? T.greenL : T.redL, color: office.open ? T.green : T.red, border: `1px solid ${office.open ? T.greenB : T.redB}` }}><Clock size={22} /></span>
            <span style={{ fontFamily: F.head, fontSize: 12, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: T.muted, marginTop: 14 }}>Parish office</span>
            <span style={{ fontFamily: F.head, fontSize: 17, fontWeight: 800, color: office.open ? "#166534" : "#991B1B", marginTop: 2 }}>{office.label}</span>
            <span style={{ fontSize: 14, color: T.sub, marginTop: 4, lineHeight: 1.45 }}>{office.detail}</span>
          </div>
        </div>
      </Wrap>

      {closures.length > 0 && (
        <Wrap className="mt-8">
          <div role="status" className="flex items-start gap-3 rounded-xl p-4" style={{ background: T.redL, border: `1px solid ${T.redB}`, color: "#991B1B" }}>
            <AlertTriangle size={20} className="mt-0.5 shrink-0" />
            <div style={{ fontSize: 16, lineHeight: 1.5 }}>
              <b>Parish office closure{closures.length > 1 ? "s" : ""}:</b>{" "}
              {closures.map(c => `${fmtShort(c.date)} (${c.title})`).join("; ")}
            </div>
          </div>
        </Wrap>
      )}

      <Wrap className="py-14">
        <div><Eyebrow>How it works</Eyebrow><div className="mt-2"><Title>From request to certificate</Title></div></div>
        <ol className="m-0 mt-8 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Submit online", "Choose a service and fill in the request form. Takes about five minutes."],
            ["Pay at the parish office", "Fees are paid in person. The cashier issues your Official Receipt."],
            ["Staff verify", "The parish office checks your request and records the receipt."],
            ["Schedule or release", "Mass services get a confirmed date; certificates are prepared for release."],
          ].map(([t, d], i) => (
            <li key={t}>
              <Card className="h-full p-6">
                <span style={{ display: "inline-flex", width: 36, height: 36, borderRadius: 99, background: T.primary, color: "#fff", fontFamily: F.head, fontWeight: 800, alignItems: "center", justifyContent: "center" }}>{i + 1}</span>
                <h3 style={{ fontFamily: F.head, fontSize: 18, fontWeight: 800, margin: "14px 0 6px" }}>{t}</h3>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: T.sub, margin: 0 }}>{d}</p>
              </Card>
            </li>
          ))}
        </ol>
      </Wrap>

      <section style={{ background: "#fff", borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
        <Wrap className="py-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><Eyebrow>Services</Eyebrow><div className="mt-2"><Title>What we offer</Title></div></div>
            <button type="button" className="pub-link" onClick={() => go("services")}>See all services and fees →</button>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {services.slice(0, 8).map(s => (
              <button key={s.id} type="button" onClick={() => startRequest(s.id)} className="pub-card-hover rounded-2xl p-5 text-left"
                style={{ background: T.bg, border: `1px solid ${T.border}`, cursor: "pointer" }}>
                <span style={{ fontFamily: F.head, fontSize: 17, fontWeight: 800, display: "block", color: T.text }}>{s.name}</span>
                <span style={{ fontFamily: F.head, fontSize: 13, fontWeight: 700, color: T.priHov, display: "block", marginTop: 6 }}>{peso(s.fee)}</span>
                <span style={{ fontSize: 14, color: T.muted, display: "block", marginTop: 4 }}>{serviceMeta(s)}</span>
              </button>
            ))}
          </div>
        </Wrap>
      </section>

      <Wrap className="grid gap-8 py-14 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><Eyebrow>Parish schedule</Eyebrow><div className="mt-2"><Title size={30}>Coming up</Title></div></div>
            <button type="button" className="pub-link" onClick={() => go("schedule")}>Full schedule →</button>
          </div>
          <Card className="mt-6 px-5">
            {next.length === 0 ? <p style={{ padding: "20px 0", margin: 0, color: T.muted }}>No parish activities are posted for the next 60 days.</p>
              : <ul className="m-0 list-none p-0">{next.map(a => <ActivityRow key={a.id} a={a} />)}</ul>}
          </Card>
        </div>
        <div>
          <Eyebrow>Visit us</Eyebrow>
          <div className="mt-2"><Title size={30}>Parish office</Title></div>
          <Card className="mt-6 space-y-4 p-6" style={{ fontSize: 16, color: T.sub, lineHeight: 1.6 }}>
            <div className="flex gap-3"><Clock size={20} color={T.priHov} className="mt-1 shrink-0" />
              <div><p style={{ margin: 0 }}><b>Mon–Fri</b> · {settings.hoursWeekday}</p><p style={{ margin: 0 }}><b>Saturday</b> · {settings.hoursSat}</p><p style={{ margin: 0 }}><b>Sunday</b> · {settings.hoursSun}</p></div></div>
            <div className="flex gap-3"><MapPin size={20} color={T.priHov} className="mt-1 shrink-0" /><p style={{ margin: 0 }}>{settings.address}</p></div>
            <div className="flex gap-3"><Phone size={20} color={T.priHov} className="mt-1 shrink-0" /><p style={{ margin: 0 }}>{settings.phone}</p></div>
          </Card>
        </div>
      </Wrap>
    </>
  );
}

/* ─── Services ─── */
function Services({ services, startRequest }: { services: PubService[]; startRequest: (id?: string) => void }) {
  return (
    <Wrap className="py-12 sm:py-16">
      <Eyebrow>Services & fees</Eyebrow>
      <div className="mt-2"><Title as="h1" size={40}>Choose a service</Title></div>
      <p style={{ fontSize: 18, lineHeight: 1.6, color: T.sub, maxWidth: 700, margin: "14px 0 0" }}>
        Fees are paid in person at the parish office, which issues your Official Receipt. There is no online payment.
      </p>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {services.map(s => (
          <Card key={s.id} className="flex flex-col p-6">
            <div className="flex items-start justify-between gap-4">
              <h2 style={{ fontFamily: F.head, fontSize: 21, fontWeight: 800, margin: 0 }}>{s.name}</h2>
              <span style={{ fontFamily: F.head, fontSize: 18, fontWeight: 800, color: T.priHov, whiteSpace: "nowrap" }}>{peso(s.fee)}</span>
            </div>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: T.sub, margin: "10px 0 14px" }}>{s.description}</p>
            <ul className="m-0 mb-5 list-none space-y-1.5 p-0" style={{ fontSize: 14, color: T.muted }}>
              <li className="flex items-center gap-2"><CalendarDays size={16} /> {serviceMeta(s)}</li>
              {s.requiresPrinting && <li className="flex items-center gap-2"><FileText size={16} /> Printed certificate issued by the parish office</li>}
            </ul>
            <div className="mt-auto"><PBtn onClick={() => startRequest(s.id)}>Request this service</PBtn></div>
          </Card>
        ))}
      </div>
    </Wrap>
  );
}

/* ─── Parish schedule ─── */
function Schedule({ activities, settings }: { activities: PubActivity[]; settings: PubSettings }) {
  const [cat, setCat] = useState("All");
  const rows = useMemo(() => upcoming(activities, 120).filter(a => cat === "All" || a.category === cat), [activities, cat]);
  return (
    <Wrap className="py-12 sm:py-16">
      <Eyebrow>Calendar of activities</Eyebrow>
      <div className="mt-2"><Title as="h1" size={40}>Parish schedule</Title></div>
      <p style={{ fontSize: 18, lineHeight: 1.6, color: T.sub, maxWidth: 700, margin: "14px 0 0" }}>
        Masses, holidays, parish activities and office closures for the next four months. Private family celebrations are not listed.
      </p>
      <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        {["All", ...PUBLIC_CATEGORIES].map(c => (
          <button key={c} type="button" onClick={() => setCat(c)} aria-pressed={cat === c} className="rounded-full px-4 py-2"
            style={{ fontFamily: F.head, fontSize: 14, fontWeight: 700, minHeight: 44, cursor: "pointer", background: cat === c ? T.primary : "#fff", color: cat === c ? "#fff" : T.text, border: `1.5px solid ${cat === c ? T.primary : T.borderMd}` }}>
            {c}
          </button>
        ))}
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <Card className="px-5">
          {rows.length === 0 ? <p style={{ padding: "24px 0", margin: 0, color: T.muted }}>No matching activities are posted.</p>
            : <ul className="m-0 list-none p-0">{rows.map(a => <ActivityRow key={a.id} a={a} />)}</ul>}
        </Card>
        <Card className="h-fit p-6">
          <h2 style={{ fontFamily: F.head, fontSize: 18, fontWeight: 800, margin: "0 0 10px" }}>Parish office hours</h2>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: T.sub, margin: 0 }}>
            <b>Mon–Fri</b> · {settings.hoursWeekday}<br /><b>Saturday</b> · {settings.hoursSat}<br /><b>Sunday</b> · {settings.hoursSun}
          </p>
          <p style={{ fontSize: 14, color: T.muted, margin: "12px 0 0" }}>The office is closed on days marked Closed Office Day.</p>
        </Card>
      </div>
    </Wrap>
  );
}

/* ─── Track ─── */
const LOCK_AFTER = 5, LOCK_MS = 30_000;

function Track({ requests, services }: { requests: PubRequest[]; services: PubService[] }) {
  const [id, setId] = useState("");
  const [contact, setContact] = useState("");
  const [foundId, setFoundId] = useState<string | null>(null);
  const [miss, setMiss] = useState(false);
  const [fails, setFails] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [, tick] = useState(0);
  useEffect(() => {
    if (!lockedUntil) return;
    const t = setInterval(() => { tick(x => x + 1); if (Date.now() >= lockedUntil) { setLockedUntil(0); setFails(0); } }, 1000);
    return () => clearInterval(t);
  }, [lockedUntil]);
  const lockLeft = lockedUntil ? Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000)) : 0;

  // Always read the live record so status changes made by staff appear immediately.
  const r = foundId ? requests.find(x => x.id === foundId) : undefined;
  const svc = r ? services.find(s => s.name === r.sacramentType) : undefined;

  function search(e: React.FormEvent) {
    e.preventDefault();
    if (lockLeft) return;
    const hit = findRequest(requests, id, contact);
    if (hit) { setFoundId(hit.id); setMiss(false); setFails(0); return; }
    setFoundId(null); setMiss(true);
    const n = fails + 1; setFails(n);
    if (n >= LOCK_AFTER) setLockedUntil(Date.now() + LOCK_MS);
  }

  const timeline = r ? [
    { label: "Submitted", done: true, note: fmtShort(r.submittedAt) },
    { label: "Verified", done: ["verified", "scheduled", "completed"].includes(r.status), note: r.orNo ? `OR No. ${r.orNo}` : "Awaiting payment at the parish office" },
    ...(svc?.schedulable ? [{ label: "Schedule confirmed", done: ["scheduled", "completed"].includes(r.status), note: r.apprDate ? `${fmtShort(r.apprDate)} · ${fmtRange(r.apprStart, r.apprEnd)}` : "Pending parish approval" }] : []),
    { label: "Completed", done: r.status === "completed", note: "" },
  ] : [];

  return (
    <Wrap className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <Eyebrow>Request status</Eyebrow>
        <div className="mt-2"><Title as="h1" size={40}>Track a request</Title></div>
        <p style={{ fontSize: 18, lineHeight: 1.6, color: T.sub, margin: "14px 0 0" }}>
          Enter your request ID and the mobile number or email you used when you submitted. Both must match.
        </p>
        <Card className="mt-8 p-6 sm:p-8">
          <form onSubmit={search} noValidate className="space-y-5">
            <Field label="Request ID" htmlFor="trk-id" required><input id="trk-id" style={inputStyle} value={id} placeholder="SARMS-2026-000" autoComplete="off"
              onChange={e => { setId(e.target.value); setMiss(false); setFoundId(null); }} /></Field>
            <Field label="Mobile number or email used" htmlFor="trk-contact" required><input id="trk-contact" style={inputStyle} value={contact} autoComplete="off"
              onChange={e => { setContact(e.target.value); setMiss(false); setFoundId(null); }} /></Field>
            <PBtn type="submit" disabled={!id.trim() || !contact.trim() || !!lockLeft}><Search size={18} /> {lockLeft ? `Try again in ${lockLeft}s` : "Find my request"}</PBtn>
          </form>
        </Card>
        {miss && !lockLeft && <div className="mt-5"><Notice tone="error">We could not match those details to a request. Check the ID and contact, then try again.</Notice></div>}
        {lockLeft > 0 && <div className="mt-5"><Notice tone="warn">Too many unsuccessful attempts. Please wait {lockLeft} seconds before trying again.</Notice></div>}

        {r && (
          <Card className="mt-8 overflow-hidden">
            <div className="flex flex-col justify-between gap-4 p-6 sm:flex-row sm:p-8" style={{ borderBottom: `1px solid ${T.border}` }}>
              <div>
                <p style={{ fontFamily: F.body, fontSize: 15, color: T.muted, margin: 0, letterSpacing: ".04em" }}>{r.id}</p>
                <h2 style={{ fontFamily: F.head, fontSize: 24, fontWeight: 800, margin: "6px 0 8px" }}>{r.sacramentType}</h2>
                <p style={{ fontSize: 16, lineHeight: 1.6, color: T.sub, margin: 0 }}>{statusMessage(r, svc)}</p>
              </div>
              <span style={{ alignSelf: "flex-start", padding: "6px 16px", borderRadius: 999, fontFamily: F.head, fontWeight: 800, fontSize: 14, background: STATUS_CFG[r.status].bg, color: STATUS_CFG[r.status].col }}>
                {STATUS_CFG[r.status].label}
              </span>
            </div>
            <div className="p-6 sm:p-8">
              {r.status === "scheduled" && r.apprDate && (
                <div className="mb-6 rounded-xl p-5" style={{ background: T.greenL, border: `1px solid ${T.greenB}` }}>
                  <p style={{ fontFamily: F.head, fontSize: 13, fontWeight: 700, color: "#166534", margin: 0, textTransform: "uppercase", letterSpacing: ".12em" }}>Confirmed schedule</p>
                  <p style={{ fontFamily: F.head, fontSize: 20, fontWeight: 800, color: "#14532D", margin: "6px 0 0" }}>{fmtLong(r.apprDate)}</p>
                  <p style={{ fontSize: 17, color: "#14532D", margin: "2px 0 0" }}>{fmtRange(r.apprStart, r.apprEnd)}</p>
                </div>
              )}
              {r.status === "rejected" && r.staffNotes && (
                <div className="mb-6"><Notice tone="warn"><b>Reason from the parish office:</b> {r.staffNotes}</Notice></div>
              )}
              {(r.status === "pending" || r.status === "verified") && r.prefDate && (
                <p style={{ fontSize: 16, color: T.sub, margin: "0 0 20px" }}>
                  {svc?.schedulable ? "Requested schedule" : "Preferred visit date"}: <b>{fmtLong(r.prefDate)}{r.prefTime ? ` · ${fmtTime(r.prefTime)}` : ""}</b>
                  {svc?.schedulable && <span style={{ color: T.muted }}> — not final until the parish office confirms it.</span>}
                </p>
              )}
              {r.status !== "cancelled" && r.status !== "rejected" && (
                <ol className="m-0 list-none space-y-4 p-0" aria-label="Request progress">
                  {timeline.map(t => (
                    <li key={t.label} className="flex items-start gap-3">
                      <span style={{ marginTop: 2, color: t.done ? T.green : T.borderMd }}>{t.done ? <CheckCircle2 size={22} /> : <span style={{ display: "block", width: 22, height: 22, borderRadius: 99, border: `2px solid ${T.borderMd}` }} />}</span>
                      <div>
                        <p style={{ fontFamily: F.head, fontSize: 16, fontWeight: 700, margin: 0, color: t.done ? T.text : T.muted }}>{t.label}</p>
                        {t.note && <p style={{ fontSize: 14, color: T.muted, margin: "2px 0 0" }}>{t.note}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
              <p style={{ fontSize: 13, color: T.muted, margin: "24px 0 0" }}>Submitted {fmtLong(r.submittedAt)}. Internal staff notes are not shown here.</p>
            </div>
          </Card>
        )}
      </div>
    </Wrap>
  );
}

/* ─── About & Contact ─── */
function About({ settings, logoSrc }: { settings: PubSettings; logoSrc: string }) {
  const map = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${settings.parishName}, ${settings.address}`)}`;
  return (
    <Wrap className="py-12 sm:py-16">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <img src={logoSrc} alt="" width={96} height={96} style={{ width: 96, height: 96, objectFit: "contain" }} />
        <div>
          <Eyebrow>About & contact</Eyebrow>
          <div className="mt-2"><Title as="h1" size={40}>{settings.parishName}</Title></div>
          <p style={{ fontSize: 18, color: T.sub, margin: "10px 0 0" }}>{settings.diocese} · Vinzons, Camarines Norte</p>
        </div>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <Card className="space-y-5 p-6 sm:p-8" style={{ fontSize: 17, lineHeight: 1.6, color: T.sub }}>
          <h2 style={{ fontFamily: F.head, fontSize: 20, fontWeight: 800, color: T.text, margin: 0 }}>Parish office</h2>
          <div className="flex gap-3"><MapPin size={20} color={T.priHov} className="mt-1 shrink-0" /><p style={{ margin: 0 }}>{settings.address}</p></div>
          <div className="flex gap-3"><Phone size={20} color={T.priHov} className="mt-1 shrink-0" /><p style={{ margin: 0 }}>{settings.phone}</p></div>
          <div className="flex gap-3"><Mail size={20} color={T.priHov} className="mt-1 shrink-0" /><a href={`mailto:${settings.email}`} style={{ color: T.priHov, fontWeight: 700 }}>{settings.email}</a></div>
          <div className="flex gap-3"><ExternalLink size={20} color={T.priHov} className="mt-1 shrink-0" /><p style={{ margin: 0 }}>{settings.facebook}</p></div>
          <a href={map} target="_blank" rel="noreferrer" className="pub-link" style={{ fontSize: 16 }}>Open in Google Maps →</a>
        </Card>
        <Card className="p-6 sm:p-8" style={{ fontSize: 17, lineHeight: 1.7, color: T.sub }}>
          <h2 style={{ fontFamily: F.head, fontSize: 20, fontWeight: 800, color: T.text, margin: "0 0 14px" }}>Office hours</h2>
          <p style={{ margin: 0 }}><b>Monday – Friday</b><br />{settings.hoursWeekday}</p>
          <p style={{ margin: "12px 0 0" }}><b>Saturday</b><br />{settings.hoursSat}</p>
          <p style={{ margin: "12px 0 0" }}><b>Sunday</b><br />{settings.hoursSun}</p>
          <p style={{ margin: "20px 0 0", paddingTop: 16, borderTop: `1px solid ${T.border}`, fontSize: 15 }}>
            Certificates are signed by <b>{settings.certSignatory}</b>, {settings.certSignatoryTitle}.
          </p>
        </Card>
      </div>
    </Wrap>
  );
}
