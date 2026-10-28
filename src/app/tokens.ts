/* Shared design tokens — used by the SARMS staff app and the public parish website. */

export type ReqStatus = "pending"|"verified"|"scheduled"|"rejected"|"completed"|"cancelled";

/* ─── TOKENS ─────────────────────────────────────────────── */
export const T = {
  bg:       "#FFFDF5",
  surface:  "#FFFFFF",
  border:   "#E3DCC0",
  borderMd: "#BFB27A",
  text:     "#1A1400",
  sub:      "#4A4018",
  muted:    "#6E5F28",
  primary:  "#C9960A",
  priHov:   "#8A6706",
  priLight: "#FEF9E7",
  green:    "#15803D", greenL: "#F0FDF4", greenB: "#BBF7D0",
  amber:    "#92400E", amberL: "#FFFBEB", amberB: "#FDE68A",
  red:      "#DC2626", redL:   "#FEF2F2", redB:   "#FECACA",
  blue:     "#1D4ED8", blueL:  "#EFF6FF", blueB:  "#BFDBFE",
  purple:   "#7C3AED", purpleL:"#F5F3FF", purpleB:"#DDD6FE",
};

/* ─── TYPE HIERARCHY ─────────────────────────────────────────
   Tier 1 · Garet       — major titles, parish branding & ceremonial headings
   Tier 2 · Montserrat  — structure: titles, headings, nav, buttons, table heads, labels
   Tier 3 · Arial       — records layer: body copy, data, inputs (same face as PSA Form 97 overlay) */
export const F = {
  display: "'Garet', 'Montserrat', 'Segoe UI', system-ui, sans-serif",
  head:   "'Montserrat', 'Segoe UI', system-ui, sans-serif",
  body:   "Arial, Helvetica, sans-serif",
};


export type PillCfg = { label: string; col: string; bg: string };
export const STATUS_CFG: Record<ReqStatus, PillCfg> = {
  pending:   { label:"Pending",   col:"#92400E", bg:"#FEF3C7" },
  verified:  { label:"Verified",  col:"#1E40AF", bg:"#DBEAFE" },
  scheduled: { label:"Scheduled", col:"#065F46", bg:"#D1FAE5" },
  rejected:  { label:"Rejected",  col:"#991B1B", bg:"#FEE2E2" },
  completed: { label:"Completed", col:"#166534", bg:"#F0FDF4" },
  cancelled: { label:"Cancelled", col:"#4B5563", bg:"#F3F4F6" },
};

/* Calendar of Activities categories */
export const ACTIVITY_CATS: Record<string, { col: string; light: string }> = {
  "Wedding Mass":      { col:"#BE185D", light:"#FDF2F8" },
  "Funeral Mass":      { col:"#475569", light:"#F1F5F9" },
  "Fiesta Mass":       { col:"#C2410C", light:"#FFF7ED" },
  "Holy Mass":         { col:"#2563EB", light:"#EFF6FF" },
  "Barangay Mass":     { col:"#A16207", light:"#FEFCE8" },
  "Parish Activity":   { col:"#7C3AED", light:"#F5F3FF" },
  "Holiday":           { col:"#0F766E", light:"#F0FDFA" },
  "Closed Office Day": { col:"#DC2626", light:"#FEF2F2" },
};

/* Service colours (and certificate wording) keyed by SARMS service name */
export const SACR: Record<string, { col: string; light: string; cert: string }> = {
  "Baptism":                  { col:"#2563EB", light:"#EFF6FF", cert:"received the Sacrament of Holy Baptism" },
  "Confirmation":             { col:"#7C3AED", light:"#F5F3FF", cert:"received the Sacrament of Confirmation" },
  "First Holy Communion":     { col:"#B45309", light:"#FFFBEB", cert:"received the Sacrament of First Holy Communion" },
  "Marriage":                 { col:"#BE185D", light:"#FDF2F8", cert:"were united in the Sacrament of Holy Matrimony" },
  "Funeral Mass":             { col:"#475569", light:"#F1F5F9", cert:"was commended to God in the Funeral Mass" },
  "Death Certificate":        { col:"#334155", light:"#F8FAFC", cert:"is recorded in the Register of Dead of this Parish" },
  "No Record":                { col:"#DC2626", light:"#FEF2F2", cert:"no sacramental record was found on file" },
  "Good Standing/Membership": { col:"#16A34A", light:"#F0FDF4", cert:"is a registered parishioner in good standing" },
};
