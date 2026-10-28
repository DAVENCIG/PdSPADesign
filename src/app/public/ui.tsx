import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { T, F } from "../tokens";

export const Wrap = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`mx-auto w-full max-w-[1200px] px-5 sm:px-8 ${className}`}>{children}</div>
);

export function Eyebrow({ children, light }: { children: ReactNode; light?: boolean }) {
  return (
    <p style={{ fontFamily: F.head, fontSize: 13, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", margin: 0, color: light ? "#FDDEA0" : T.priHov }}>
      {children}
    </p>
  );
}

export function Title({ children, size = 36, color = T.text, as: Tag = "h2" }: { children: ReactNode; size?: number; color?: string; as?: "h1" | "h2" | "h3" }) {
  return (
    <Tag style={{ fontFamily: F.display, fontSize: size, fontWeight: 700, lineHeight: 1.12, letterSpacing: "-.02em", margin: 0, color }}>
      {children}
    </Tag>
  );
}

type Variant = "primary" | "outline" | "ghost" | "light";
export function PBtn({ variant = "primary", style, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base: CSSProperties = {
    fontFamily: F.head, fontWeight: 700, fontSize: 16, minHeight: 48, padding: "12px 24px", borderRadius: 999,
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: rest.disabled ? "not-allowed" : "pointer",
    opacity: rest.disabled ? 0.5 : 1, transition: "background .15s, box-shadow .15s", border: "2px solid transparent",
  };
  const v: Record<Variant, CSSProperties> = {
    primary: { background: T.primary, color: "#fff", borderColor: T.primary, boxShadow: "0 8px 18px -8px rgba(201,150,10,.7)" },
    outline: { background: "#fff", color: T.text, borderColor: T.borderMd },
    ghost: { background: "transparent", color: T.priHov, borderColor: "transparent", padding: "12px 12px" },
    light: { background: "#fff", color: T.text, borderColor: "#fff" },
  };
  return <button type="button" {...rest} className={`pub-btn pub-btn-${variant} ${rest.className ?? ""}`} style={{ ...base, ...v[variant], ...style }}>{children}</button>;
}

export const Card = ({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) => (
  <div className={`rounded-2xl ${className}`} style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 1px 2px rgba(61,31,0,.05), 0 10px 24px -14px rgba(61,31,0,.22)", ...style }}>
    {children}
  </div>
);

export const inputStyle: CSSProperties = {
  width: "100%", minHeight: 48, padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${T.borderMd}`,
  background: "#fff", color: T.text, fontFamily: F.body, fontSize: 17, outline: "none",
};

export function Field({ label, htmlFor, required, hint, error, children }:
  { label: string; htmlFor: string; required?: boolean; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} style={{ display: "block", fontFamily: F.head, fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 6 }}>
        {label}{required && <span aria-hidden style={{ color: T.red }}> *</span>}
        {required && <span className="sr-only"> (required)</span>}
      </label>
      {children}
      {hint && !error && <p style={{ fontSize: 14, color: T.muted, margin: "6px 0 0", lineHeight: 1.45 }}>{hint}</p>}
      {error && <p role="alert" id={`${htmlFor}-err`} style={{ fontSize: 14, color: T.red, fontWeight: 600, margin: "6px 0 0" }}>{error}</p>}
    </div>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warn" | "error" | "ok"; children: ReactNode }) {
  const c = {
    info: { bg: T.priLight, bd: T.borderMd, fg: T.text },
    warn: { bg: T.amberL, bd: T.amberB, fg: T.amber },
    error: { bg: T.redL, bd: T.redB, fg: "#991B1B" },
    ok: { bg: T.greenL, bd: T.greenB, fg: "#166534" },
  }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} style={{ background: c.bg, border: `1px solid ${c.bd}`, color: c.fg, borderRadius: 12, padding: "14px 16px", fontSize: 16, lineHeight: 1.5 }}>
      {children}
    </div>
  );
}
