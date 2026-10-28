import { useState, useCallback, useMemo, useEffect, createContext, useContext } from "react";
import { LayoutDashboard, Inbox, CalendarDays, BookOpen, FileText, ClipboardList, BarChart3, Users, SlidersHorizontal, Settings, ShieldCheck, LogOut, X, HelpCircle, ChevronLeft, ChevronRight, Info, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import logoSrc from "@/imports/logo.png";
import parishBanner from "@/imports/PDSPA1.jpg";
import { form97p1B64, form97p2B64 } from "@/imports/form97base64";
import { T, F, STATUS_CFG, ACTIVITY_CATS, type PillCfg, type ReqStatus } from "./tokens";
import PublicSite from "./public/PublicSite";
import type { OnlineSubmission } from "./public/publicLogic";
/* Recharts removed — custom SimpleBarChart used instead to avoid duplicate-key warnings */

/* Design tokens (T, F) and request status colours are shared with the public website — see ./tokens.ts */

/* ─── SERVICE CONFIG ─────────────────────────────────────── */
const SACR: Record<string, { col: string; light: string; cert: string }> = {
  "Baptism":                  { col:"#2563EB", light:"#EFF6FF", cert:"received the Sacrament of Holy Baptism" },
  "Confirmation":             { col:"#7C3AED", light:"#F5F3FF", cert:"received the Sacrament of Confirmation" },
  "First Holy Communion":     { col:"#B45309", light:"#FFFBEB", cert:"received the Sacrament of First Holy Communion" },
  "Marriage":                 { col:"#BE185D", light:"#FDF2F8", cert:"were united in the Sacrament of Holy Matrimony" },
  "Funeral Mass":             { col:"#475569", light:"#F1F5F9", cert:"was commended to God in the Funeral Mass" },
  "Death Certificate":        { col:"#334155", light:"#F8FAFC", cert:"is recorded in the Register of Dead of this Parish" },
  "No Record":                { col:"#DC2626", light:"#FEF2F2", cert:"no sacramental record was found on file" },
  "Good Standing/Membership": { col:"#16A34A", light:"#F0FDF4", cert:"is a registered parishioner in good standing" },
};
const SACR_LIST = Object.keys(SACR);
/* Only these four have parish-approved printable layouts */
const PRINTABLE = ["Baptism", "Confirmation", "Marriage", "Death Certificate"];
const CERT_CODE: Record<string, string> = { "Baptism":"BAP", "Confirmation":"CON", "Marriage":"MAR", "Death Certificate":"DTH" };

const ACTIVITY_CAT_LIST = Object.keys(ACTIVITY_CATS);
const MASS_CATS = ["Wedding Mass","Funeral Mass","Fiesta Mass","Holy Mass","Barangay Mass"];

const PRIESTS = [
  "Rev. Fr. Rene B. Tabios (Parish Priest)",
  "Rev. Fr. Domingo S. Cruz (Parochial Vicar)",
  "Rev. Fr. Mark Anthony L. Ibasco (Assisting Priest)",
];

const BOOK_TYPES: Record<string, string> = {
  "Baptismal Register":       "Baptism",
  "Confirmation Register":    "Confirmation",
  "First Communion Register": "First Holy Communion",
  "Marriage Register":        "Marriage",
  "Register of Dead":         "Death Certificate",
};
const BOOK_TYPE_LIST = Object.keys(BOOK_TYPES);

type MarSec = "registry"|"husband"|"wife"|"consent"|"details"|"officer"|"witnesses"|"affSol"|"affDel";
const MAR_SECTIONS: { id: MarSec; label: string; hint: string }[] = [
  { id:"registry",  label:"Registry Info",                       hint:"Province, City/Municipality and Registry No." },
  { id:"husband",   label:"Husband's Information",               hint:"Items 1–11 for the husband" },
  { id:"wife",      label:"Wife's Information",                  hint:"Items 1–11 for the wife" },
  { id:"consent",   label:"Consent / Advice",                    hint:"Items 12–14 — person who gave consent or advice" },
  { id:"details",   label:"Marriage Details",                    hint:"Items 15–18 — place, date and time of marriage" },
  { id:"officer",   label:"Solemnizing Officer & License",       hint:"Item 19 — officer and marriage license basis" },
  { id:"witnesses", label:"Witnesses",                           hint:"Item 20 — witnesses (print name)" },
  { id:"affSol",    label:"Affidavit of Solemnizing Officer",    hint:"Reverse side — for marriages exempt from license" },
  { id:"affDel",    label:"Affidavit for Delayed Registration",  hint:"Reverse side — when registration is delayed" },
];

/* ─── TYPES ──────────────────────────────────────────────── */
type View = "dashboard"|"requests"|"calendar"|"book"|"certificates"|"issuance"|"reports"|"staff"|"services"|"settings"|"audit";
type UserRole  = "staff"|"admin";
interface Auth { id: string; name: string; username: string; role: UserRole; superadmin: boolean; since: string; }
interface Focus { requestId?: string; bookPrefill?: string; certRequestId?: string; }
interface MarriageFormData {
  province: string; cityMun: string; registryNo: string;
  hFirst: string; hMiddle: string; hLast: string;
  hDobDay: string; hDobMonth: string; hDobYear: string; hAge: string;
  hPobCity: string; hPobProvince: string; hPobCountry: string;
  hSex: string; hCitizenship: string; hResidence: string;
  hReligion: string; hCivilStatus: string;
  hFatFirst: string; hFatMiddle: string; hFatLast: string; hFatCit: string;
  hMotFirst: string; hMotMiddle: string; hMotLast: string; hMotCit: string;
  hConFirst: string; hConMiddle: string; hConLast: string; hConRel: string; hConRes: string;
  wFirst: string; wMiddle: string; wLast: string;
  wDobDay: string; wDobMonth: string; wDobYear: string; wAge: string;
  wPobCity: string; wPobProvince: string; wPobCountry: string;
  wSex: string; wCitizenship: string; wResidence: string;
  wReligion: string; wCivilStatus: string;
  wFatFirst: string; wFatMiddle: string; wFatLast: string; wFatCit: string;
  wMotFirst: string; wMotMiddle: string; wMotLast: string; wMotCit: string;
  wConFirst: string; wConMiddle: string; wConLast: string; wConRel: string; wConRes: string;
  placeVenue: string; placeCityMun: string; placeProvince: string;
  marDay: string; marMonth: string; marYear: string; marTime: string; marAMPM: string;
  solOfficer: string; solPosition: string; solReligion: string;
  licNo: string; licDate: string; licAt: string; licArt34: boolean; licPD1083: boolean;
  wit1: string; wit2: string; wit3: string; wit4: string;
  affSolInclude: boolean; affSolOfficer: string; affSolAddr: string;
  affSolH: string; affSolW: string; affSolCirc: string;
  affSolDay: string; affSolMonth: string; affSolAt: string;
  affDelInclude: boolean; affDelApplicant: string; affDelCivStat: string; affDelRes: string;
  affDelSpouse: string; affDelMarDate: string; affDelMarPlace: string; affDelCeremony: string;
  affDelLicNo: string; affDelLicOn: string; affDelLicAt: string;
  affDelApCit: string; affDelSpCit: string; affDelReason: string;
  affDelDay: string; affDelMonth: string; affDelAt: string;
}

const BLANK_MARRIAGE: MarriageFormData = {
  province:"Camarines Norte", cityMun:"Vinzons", registryNo:"",
  hFirst:"", hMiddle:"", hLast:"",
  hDobDay:"", hDobMonth:"", hDobYear:"", hAge:"",
  hPobCity:"", hPobProvince:"Camarines Norte", hPobCountry:"Philippines",
  hSex:"Male", hCitizenship:"Filipino", hResidence:"",
  hReligion:"Roman Catholic", hCivilStatus:"Single",
  hFatFirst:"", hFatMiddle:"", hFatLast:"", hFatCit:"Filipino",
  hMotFirst:"", hMotMiddle:"", hMotLast:"", hMotCit:"Filipino",
  hConFirst:"", hConMiddle:"", hConLast:"", hConRel:"", hConRes:"",
  wFirst:"", wMiddle:"", wLast:"",
  wDobDay:"", wDobMonth:"", wDobYear:"", wAge:"",
  wPobCity:"", wPobProvince:"Camarines Norte", wPobCountry:"Philippines",
  wSex:"Female", wCitizenship:"Filipino", wResidence:"",
  wReligion:"Roman Catholic", wCivilStatus:"Single",
  wFatFirst:"", wFatMiddle:"", wFatLast:"", wFatCit:"Filipino",
  wMotFirst:"", wMotMiddle:"", wMotLast:"", wMotCit:"Filipino",
  wConFirst:"", wConMiddle:"", wConLast:"", wConRel:"", wConRes:"",
  placeVenue:"Parroquia de San Pedro Apostol", placeCityMun:"Vinzons", placeProvince:"Camarines Norte",
  marDay:"", marMonth:"", marYear:"", marTime:"", marAMPM:"AM",
  solOfficer:"", solPosition:"Parish Priest", solReligion:"Roman Catholic",
  licNo:"", licDate:"", licAt:"", licArt34:false, licPD1083:false,
  wit1:"", wit2:"", wit3:"", wit4:"",
  affSolInclude:false, affSolOfficer:"", affSolAddr:"", affSolH:"", affSolW:"", affSolCirc:"a",
  affSolDay:"", affSolMonth:"", affSolAt:"",
  affDelInclude:false, affDelApplicant:"", affDelCivStat:"Single", affDelRes:"",
  affDelSpouse:"", affDelMarDate:"", affDelMarPlace:"", affDelCeremony:"religious",
  affDelLicNo:"", affDelLicOn:"", affDelLicAt:"",
  affDelApCit:"Filipino", affDelSpCit:"Filipino", affDelReason:"",
  affDelDay:"", affDelMonth:"", affDelAt:"",
};

interface Appointment {
  id: string; submittedAt: string; parishioner: string;
  contact: string; email: string; address: string; sacramentType: string;
  subjectName: string; dateOfSacrament: string; purposeOf: string;
  status: ReqStatus;
  prefDate: string; prefTime: string;
  apprDate: string; apprStart: string; apprEnd: string;
  orNo: string; orDate: string; staffNotes: string; verifiedBy: string;
  /** "online" = submitted through the public website; absent = encoded by office staff */
  source?: "online";
}
interface Activity {
  id: string; category: string; title: string; date: string;
  start: string; end: string; allDay: boolean; location: string; notes: string;
  blocking: boolean; status: "active"|"cancelled"; priests: string[]; cancelReason: string;
}
interface BookEntry {
  id: string; bookType: string; bookNo: string; page: string; entryNo: string;
  dateOfArrival: string; sacramentType: string; recipient: string; dateOfSacrament: string;
  officiant: string; status: "active"|"corrected"; remarks: string;
  linkedRequestId: string; encodedBy: string; dateEncoded: string;
}
interface Issuance {
  id: string; certNo: string; requestId: string; bookId: string; client: string; type: string;
  issuedBy: string; issuedAt: string; status: "issued"|"voided"; reprintCount: number;
  lastReprintAt: string; lastReprintBy: string; lastReprintReason: string; voidReason: string;
}
interface StaffAccount {
  id: string; empId: string; name: string; username: string; position: string;
  role: UserRole; superadmin: boolean; status: "active"|"inactive"; lastLogin: string;
}
interface Service {
  id: string; name: string; description: string; fee: number;
  requiresPrinting: boolean; schedulable: boolean; requiresAppt: boolean;
  duration: number; calCategory: string; active: boolean;
}
interface AuditLog {
  id: string; at: string; actor: string; username: string; actionType: string; module: string;
  client: string; recordType: string; recordId: string; desc: string; reason: string;
  prev?: Record<string,string>; next?: Record<string,string>; device: string; ip: string;
}
interface ParishSettings {
  parishName: string; diocese: string; address: string; phone: string; email: string; facebook: string;
  hoursWeekday: string; hoursSat: string; hoursSun: string;
  certSignatory: string; certSignatoryTitle: string; certFooter: string;
}
interface Toast { id: number; type: "success"|"error"|"info"|"warning"; message: string; }

/* ─── SEED DATA ──────────────────────────────────────────── */
let _aid = 13; // seed requests use SARMS-2026-001 … 012
const nid = () => `SARMS-2026-${String(_aid++).padStart(3,"0")}`;
let _actid = 10;
const nextActId = () => `ACT-${String(++_actid).padStart(3,"0")}`;
let _bkid = 7;
const nextBkId = () => `BK-${String(++_bkid).padStart(4,"0")}`;
let _ciid = 3;
let _certSeq = 142;
let _logid = 1040;
let _tid = 0;
const tid = () => ++_tid;

const R0 = { email:"", address:"", apprDate:"", apprStart:"", apprEnd:"", orNo:"", orDate:"", staffNotes:"", verifiedBy:"", dateOfSacrament:"" };
const SEED_APPTS: Appointment[] = [
  { ...R0, id:"SARMS-2026-001", submittedAt:"2026-10-02T09:14", parishioner:"Maria Dela Cruz", contact:"09171234567", email:"maria.dc@email.com", address:"Brgy. 3, Vinzons", sacramentType:"Baptism", subjectName:"Juan Carlos Dela Cruz", dateOfSacrament:"2020-03-15", purposeOf:"School enrollment", status:"completed", prefDate:"2026-10-05", prefTime:"09:00", orNo:"OR-2026-004790", orDate:"2026-10-05", verifiedBy:"Maria Santos" },
  { ...R0, id:"SARMS-2026-002", submittedAt:"2026-10-09T10:40", parishioner:"Jose Banaga", contact:"09281234567", email:"jbanaga@email.com", address:"Brgy. Calangcawan Sur", sacramentType:"Confirmation", subjectName:"Jose Banaga Jr.", dateOfSacrament:"2018-04-22", purposeOf:"Marriage requirement", status:"verified", prefDate:"2026-10-22", prefTime:"10:00", orNo:"OR-2026-004805", orDate:"2026-10-12", verifiedBy:"Maria Santos" },
  { ...R0, id:"SARMS-2026-003", submittedAt:"2026-10-06T14:05", parishioner:"Rosario Layug", contact:"09351234567", email:"rosario.layug@email.com", address:"Brgy. 1, Vinzons", sacramentType:"Marriage", subjectName:"Eduardo & Rosario Layug", dateOfSacrament:"2005-06-18", purposeOf:"Visa application", status:"completed", prefDate:"2026-10-08", prefTime:"14:00", orNo:"OR-2026-004796", orDate:"2026-10-08", verifiedBy:"Maria Santos" },
  { ...R0, id:"SARMS-2026-004", submittedAt:"2026-10-13T08:52", parishioner:"Pedro Abalos", contact:"09181234567", email:"pedro.abalos@email.com", address:"Brgy. Sabang", sacramentType:"Death Certificate", subjectName:"Conchita Abalos", dateOfSacrament:"2026-07-30", purposeOf:"Estate settlement", status:"verified", prefDate:"2026-10-20", prefTime:"09:00", orNo:"OR-2026-004811", orDate:"2026-10-14", verifiedBy:"Andrea Quinto" },
  { ...R0, id:"SARMS-2026-005", submittedAt:"2026-10-17T11:20", parishioner:"Lourdes Ramos", contact:"09291234567", email:"lourdes.r@email.com", address:"Brgy. 2, Vinzons", sacramentType:"First Holy Communion", subjectName:"Ana Lourdes Ramos", dateOfSacrament:"2019-05-10", purposeOf:"Confirmation requirement", status:"pending", prefDate:"2026-10-27", prefTime:"10:00" },
  { ...R0, id:"SARMS-2026-006", submittedAt:"2026-10-18T15:33", parishioner:"Antonio Magno", contact:"09371234567", email:"", address:"Brgy. Mangcawayan", sacramentType:"Good Standing/Membership", subjectName:"Antonio Magno", purposeOf:"Sponsorship (Ninong) requirement", status:"pending", prefDate:"2026-10-26", prefTime:"13:30" },
  { ...R0, id:"SARMS-2026-007", submittedAt:"2026-10-11T09:02", parishioner:"Cynthia Obispo", contact:"09461234567", email:"cynthia.o@email.com", address:"Brgy. Banocboc", sacramentType:"No Record", subjectName:"Carlo Obispo", purposeOf:"Late baptism registration", status:"rejected", prefDate:"2026-10-15", prefTime:"09:00", staffNotes:"Record found in Baptismal Register Book 14 — No Record certification not applicable." },
  { ...R0, id:"SARMS-2026-008", submittedAt:"2026-09-21T10:15", parishioner:"Juan Dela Cruz", contact:"09175550123", email:"juan.delacruz@email.com", address:"Purok 4, Brgy. Pinagtigasan", sacramentType:"Marriage", subjectName:"Juan Dela Cruz & Ana Santos", purposeOf:"Wedding Mass", status:"scheduled", prefDate:"2026-11-07", prefTime:"09:00", apprDate:"2026-11-07", apprStart:"10:00", apprEnd:"11:30", orNo:"OR-2026-004821", orDate:"2026-10-21", verifiedBy:"Maria Santos" },
  { ...R0, id:"SARMS-2026-009", submittedAt:"2026-10-20T08:11", parishioner:"Ramon Villareal", contact:"09193337788", email:"rvillareal@email.com", address:"Brgy. Guinacutan", sacramentType:"Baptism", subjectName:"Gabriel Villareal", purposeOf:"Infant baptism", status:"pending", prefDate:"2026-10-24", prefTime:"08:30" },
  { ...R0, id:"SARMS-2026-010", submittedAt:"2026-10-03T13:47", parishioner:"Elena Pascual", contact:"09224448899", email:"", address:"Brgy. Aguit-it", sacramentType:"Baptism", subjectName:"Mika Pascual", purposeOf:"Infant baptism", status:"cancelled", prefDate:"2026-10-10", prefTime:"10:00", staffNotes:"Cancelled at client's request — family relocating." },
  { ...R0, id:"SARMS-2026-011", submittedAt:"2026-10-07T16:02", parishioner:"Grace Llanes", contact:"09087776655", email:"grace.llanes@email.com", address:"Brgy. 3, Vinzons", sacramentType:"Death Certificate", subjectName:"Felix Llanes", dateOfSacrament:"2025-08-15", purposeOf:"SSS claim", status:"completed", prefDate:"2026-10-09", prefTime:"10:00", orNo:"OR-2026-004799", orDate:"2026-10-09", verifiedBy:"Maria Santos" },
  { ...R0, id:"SARMS-2026-012", submittedAt:"2026-10-19T09:25", parishioner:"Teresita Abasola", contact:"09162229090", email:"", address:"Brgy. Sabang", sacramentType:"Funeral Mass", subjectName:"Leonardo Abasola", purposeOf:"Funeral Mass for the late Leonardo Abasola", status:"verified", prefDate:"2026-10-29", prefTime:"14:00", orNo:"OR-2026-004818", orDate:"2026-10-19", verifiedBy:"Maria Santos" },
];

const A0 = { start:"", end:"", allDay:false, location:"Parroquia de San Pedro Apostol", notes:"", blocking:true, status:"active" as const, priests:[] as string[], cancelReason:"" };
const SEED_ACTIVITIES: Activity[] = [
  { ...A0, id:"ACT-001", category:"Funeral Mass", title:"Funeral Mass — Late Conchita Abalos", date:"2026-10-23", start:"14:00", end:"15:00", priests:[PRIESTS[0]] },
  { ...A0, id:"ACT-002", category:"Holy Mass", title:"Anticipated Sunday Mass", date:"2026-10-24", start:"08:00", end:"09:00", priests:[PRIESTS[1]] },
  { ...A0, id:"ACT-003", category:"Holy Mass", title:"Sunday Morning Mass", date:"2026-10-25", start:"06:00", end:"07:00", priests:[PRIESTS[0]] },
  { ...A0, id:"ACT-004", category:"Barangay Mass", title:"Brgy. Calangcawan Norte Mass", date:"2026-10-28", start:"16:00", end:"17:00", location:"Calangcawan Norte Chapel", blocking:false, priests:[PRIESTS[1]] },
  { ...A0, id:"ACT-005", category:"Closed Office Day", title:"Annual Staff Recollection", date:"2026-10-30", allDay:true, location:"Off-site", notes:"Parish office closed" },
  { ...A0, id:"ACT-006", category:"Wedding Mass", title:"Mendoza–Lagman Wedding", date:"2026-10-31", start:"10:00", end:"11:30", status:"cancelled", cancelReason:"Couple moved the wedding to December." },
  { ...A0, id:"ACT-007", category:"Holiday", title:"All Saints' Day", date:"2026-11-01", allDay:true, notes:"Masses at 6:00 AM and 4:00 PM only" },
  { ...A0, id:"ACT-008", category:"Closed Office Day", title:"All Souls' Day — Office Closed", date:"2026-11-02", allDay:true },
  { ...A0, id:"ACT-009", category:"Fiesta Mass", title:"Fiesta of San Isidro Labrador — Concelebration", date:"2026-11-05", start:"09:00", end:"11:00", location:"San Isidro Parish, Labo · Diocese of Daet", priests:[PRIESTS[0], PRIESTS[2]], notes:"PdSPA priests concelebrating at host parish" },
  { ...A0, id:"ACT-011", category:"Parish Activity", title:"Parish Youth Ministry Assembly", date:"2026-10-24", start:"13:00", end:"16:00", location:"Parish Hall", blocking:false, notes:"Open to all parish youth organizations" },
  { ...A0, id:"ACT-010", category:"Barangay Mass", title:"Brgy. Sabang Pintakasi Mass", date:"2026-11-12", start:"17:00", end:"18:00", location:"Sabang Chapel", blocking:false, priests:[PRIESTS[1]] },
];

const B0 = { status:"active" as const, linkedRequestId:"", remarks:"" };
const SEED_BOOKS: BookEntry[] = [
  { ...B0, id:"BK-0001", bookType:"Baptismal Register", bookNo:"12", page:"34", entryNo:"118", dateOfArrival:"2020-03-15", sacramentType:"Baptism", recipient:"Juan Carlos Dela Cruz", dateOfSacrament:"2020-03-15", officiant:"Rev. Fr. Rene B. Tabios", remarks:"Parents: Carlos & Maria Dela Cruz", linkedRequestId:"SARMS-2026-001", encodedBy:"Maria Santos", dateEncoded:"2026-10-05" },
  { ...B0, id:"BK-0002", bookType:"Confirmation Register", bookNo:"9", page:"88", entryNo:"412", dateOfArrival:"2018-04-22", sacramentType:"Confirmation", recipient:"Jose Banaga Jr.", dateOfSacrament:"2018-04-22", officiant:"Most Rev. Rex Andrew C. Alarcon, D.D.", remarks:"Sponsor: Atty. Ramon Banaga", linkedRequestId:"SARMS-2026-002", encodedBy:"Maria Santos", dateEncoded:"2026-10-12" },
  { ...B0, id:"BK-0003", bookType:"First Communion Register", bookNo:"8", page:"102", entryNo:"57", dateOfArrival:"2019-05-10", sacramentType:"First Holy Communion", recipient:"Ana Lourdes Ramos", dateOfSacrament:"2019-05-10", officiant:"Rev. Fr. Rene B. Tabios", remarks:"Batch 2019", encodedBy:"Andrea Quinto", dateEncoded:"2026-09-28" },
  { ...B0, id:"BK-0004", bookType:"Marriage Register", bookNo:"6", page:"57", entryNo:"23", dateOfArrival:"2005-06-18", sacramentType:"Marriage", recipient:"Eduardo & Rosario Layug", dateOfSacrament:"2005-06-18", officiant:"Rev. Fr. Domingo S. Cruz", status:"corrected", remarks:"Bride's middle name corrected per PSA copy", linkedRequestId:"SARMS-2026-003", encodedBy:"Maria Santos", dateEncoded:"2026-10-08" },
  { ...B0, id:"BK-0005", bookType:"Register of Dead", bookNo:"15", page:"4", entryNo:"9", dateOfArrival:"2026-07-30", sacramentType:"Death Certificate", recipient:"Conchita Abalos", dateOfSacrament:"2026-07-28", officiant:"Rev. Fr. Rene B. Tabios", linkedRequestId:"SARMS-2026-004", encodedBy:"Andrea Quinto", dateEncoded:"2026-10-14" },
  { ...B0, id:"BK-0006", bookType:"Register of Dead", bookNo:"14", page:"61", entryNo:"33", dateOfArrival:"2025-08-18", sacramentType:"Death Certificate", recipient:"Felix Llanes", dateOfSacrament:"2025-08-15", officiant:"Rev. Fr. Domingo S. Cruz", linkedRequestId:"SARMS-2026-011", encodedBy:"Maria Santos", dateEncoded:"2026-10-09" },
  { ...B0, id:"BK-0007", bookType:"Baptismal Register", bookNo:"3", page:"211", entryNo:"640", dateOfArrival:"1987-01-11", sacramentType:"Baptism", recipient:"Remedios Villanueva", dateOfSacrament:"1987-01-11", officiant:"Rev. Fr. Ignacio Abante", remarks:"Pre-existing register record (no SARMS request)", encodedBy:"Maria Santos", dateEncoded:"2026-09-15" },
];

const SEED_ISSUANCE: Issuance[] = [
  { id:"CI-0001", certNo:"PdSPA-BAP-2026-0139", requestId:"SARMS-2026-001", bookId:"BK-0001", client:"Maria Dela Cruz", type:"Baptism", issuedBy:"Maria Santos", issuedAt:"2026-10-05T10:12", status:"issued", reprintCount:1, lastReprintAt:"2026-10-06T08:40", lastReprintBy:"Maria Santos", lastReprintReason:"Printer jam — first copy smudged", voidReason:"" },
  { id:"CI-0002", certNo:"PdSPA-MAR-2026-0140", requestId:"SARMS-2026-003", bookId:"BK-0004", client:"Rosario Layug", type:"Marriage", issuedBy:"Maria Santos", issuedAt:"2026-10-08T15:02", status:"voided", reprintCount:0, lastReprintAt:"", lastReprintBy:"", lastReprintReason:"", voidReason:"Bride's middle name misspelled; register corrected and certificate re-issued" },
  { id:"CI-0003", certNo:"PdSPA-DTH-2026-0141", requestId:"SARMS-2026-011", bookId:"BK-0006", client:"Grace Llanes", type:"Death Certificate", issuedBy:"Maria Santos", issuedAt:"2026-10-09T11:30", status:"issued", reprintCount:0, lastReprintAt:"", lastReprintBy:"", lastReprintReason:"", voidReason:"" },
];

const SEED_STAFF: StaffAccount[] = [
  { id:"U-01", empId:"PDSPA-EMP-001", name:"Jose Reyes",    username:"jreyes",    position:"Parish Office Administrator", role:"admin", superadmin:true,  status:"active",   lastLogin:"2026-10-21T08:02" },
  { id:"U-02", empId:"PDSPA-EMP-002", name:"Andrea Quinto", username:"aquinto",   position:"Parish Secretary",            role:"admin", superadmin:false, status:"active",   lastLogin:"2026-10-20T13:15" },
  { id:"U-03", empId:"PDSPA-EMP-003", name:"Maria Santos",  username:"msantos",   position:"Records Clerk",               role:"staff", superadmin:false, status:"active",   lastLogin:"2026-10-21T08:47" },
  { id:"U-04", empId:"PDSPA-EMP-004", name:"Liza Bautista", username:"lbautista", position:"Office Assistant",            role:"staff", superadmin:false, status:"inactive", lastLogin:"2026-08-29T16:20" },
];
/* Demo-only credential check. Never surfaced in UI or audit history. */
const DEMO_CREDENTIALS: Record<string, string> = { jreyes:"admin123", aquinto:"admin123", msantos:"staff123", lbautista:"staff123" };

const SEED_SERVICES: Service[] = [
  { id:"SV-01", name:"Baptism",                  description:"Infant/child baptism and Baptismal Certificate", fee:300,  requiresPrinting:true,  schedulable:true,  requiresAppt:true,  duration:60, calCategory:"Holy Mass",    active:true },
  { id:"SV-02", name:"Confirmation",             description:"Confirmation Certificate issuance",             fee:150,  requiresPrinting:true,  schedulable:false, requiresAppt:false, duration:0,  calCategory:"",             active:true },
  { id:"SV-03", name:"First Holy Communion",     description:"Certification — awaiting parish-approved layout", fee:100, requiresPrinting:false, schedulable:false, requiresAppt:false, duration:0,  calCategory:"",             active:true },
  { id:"SV-04", name:"Marriage",                 description:"Wedding Mass scheduling and Certificate of Marriage (Form 97)", fee:3500, requiresPrinting:true, schedulable:true, requiresAppt:true, duration:90, calCategory:"Wedding Mass", active:true },
  { id:"SV-05", name:"Funeral Mass",             description:"Funeral Mass scheduling",                       fee:1000, requiresPrinting:false, schedulable:true,  requiresAppt:true,  duration:60, calCategory:"Funeral Mass", active:true },
  { id:"SV-06", name:"Death Certificate",        description:"Parish Death Certificate from the Register of Dead", fee:150, requiresPrinting:true, schedulable:false, requiresAppt:false, duration:0, calCategory:"",           active:true },
  { id:"SV-07", name:"No Record",                description:"No Record certification — awaiting parish-approved layout", fee:100, requiresPrinting:false, schedulable:false, requiresAppt:false, duration:0, calCategory:"", active:true },
  { id:"SV-08", name:"Good Standing/Membership", description:"Good Standing certification — awaiting parish-approved layout", fee:100, requiresPrinting:false, schedulable:false, requiresAppt:false, duration:0, calCategory:"", active:true },
];

const DEVICE = "SARMS Desktop 2.4 · Windows 11 · PARISH-OFFICE-PC1";
const L0 = { reason:"", device:DEVICE, ip:"192.168.1.24", client:"", recordType:"", recordId:"" };
const SEED_LOGS: AuditLog[] = [
  { ...L0, id:"LOG-1028", at:"2026-10-21T08:02:11", actor:"Jose Reyes", username:"jreyes", actionType:"Login", module:"Authentication", desc:"Admin Jose Reyes signed in to SARMS at 8:02 AM.", ip:"192.168.1.10", device:"SARMS Desktop 2.4 · Windows 11 · ADMIN-PC" },
  { ...L0, id:"LOG-1029", at:"2026-10-21T08:44:52", actor:"", username:"msantoss", actionType:"Failed Login", module:"Authentication", desc:"Failed sign-in attempt for username \"msantoss\" at 8:44 AM (no matching account).", recordType:"Account" },
  { ...L0, id:"LOG-1030", at:"2026-10-21T08:47:03", actor:"Maria Santos", username:"msantos", actionType:"Login", module:"Authentication", desc:"Maria Santos signed in to SARMS at 8:47 AM." },
  { ...L0, id:"LOG-1031", at:"2026-10-21T11:38:20", actor:"Maria Santos", username:"msantos", actionType:"Certificate Printed", module:"Certificates", client:"Juan Dela Cruz", recordType:"Request", recordId:"SARMS-2026-008", desc:"Maria Santos printed the Marriage Form for client Juan Dela Cruz at 11:38 AM." },
  { ...L0, id:"LOG-1032", at:"2026-10-21T11:42:05", actor:"Maria Santos", username:"msantos", actionType:"Request Approved", module:"Requests", client:"Juan Dela Cruz", recordType:"Request", recordId:"SARMS-2026-008", desc:"Maria Santos approved the appointment request of Juan Dela Cruz at 11:42 AM.", prev:{ Status:"Verified", "Approved Schedule":"—" }, next:{ Status:"Scheduled", "Approved Schedule":"Nov 7, 2026 · 10:00 AM – 11:30 AM" } },
  { ...L0, id:"LOG-1033", at:"2026-10-21T11:46:40", actor:"Maria Santos", username:"msantos", actionType:"OR Recorded", module:"Official Receipt", client:"Juan Dela Cruz", recordType:"Request", recordId:"SARMS-2026-008", desc:"Maria Santos recorded OR No. OR-2026-004821 for Juan Dela Cruz at 11:46 AM.", next:{ "OR No.":"OR-2026-004821", "Receipt Date":"Oct 21, 2026" } },
  { ...L0, id:"LOG-1034", at:"2026-10-21T12:02:18", actor:"Jose Reyes", username:"jreyes", actionType:"Account Deactivated", module:"Staff Accounts", client:"Liza Bautista", recordType:"Staff Account", recordId:"PDSPA-EMP-004", desc:"Admin Jose Reyes deactivated the Staff account of Liza Bautista at 12:02 PM.", reason:"Contract ended August 31, 2026", prev:{ Status:"Active" }, next:{ Status:"Inactive" }, ip:"192.168.1.10", device:"SARMS Desktop 2.4 · Windows 11 · ADMIN-PC" },
  { ...L0, id:"LOG-1035", at:"2026-10-21T12:05:44", actor:"Jose Reyes", username:"jreyes", actionType:"Password Reset", module:"Staff Accounts", client:"Maria Santos", recordType:"Staff Account", recordId:"PDSPA-EMP-003", desc:"Admin Jose Reyes reset the password of Staff account Maria Santos at 12:05 PM.", reason:"Requested by user — forgotten password", ip:"192.168.1.10", device:"SARMS Desktop 2.4 · Windows 11 · ADMIN-PC" },
  { ...L0, id:"LOG-1036", at:"2026-10-20T10:31:09", actor:"Andrea Quinto", username:"aquinto", actionType:"Book Entity Corrected", module:"Book Entity", client:"Eduardo & Rosario Layug", recordType:"Book Entity", recordId:"BK-0004", desc:"Admin Andrea Quinto corrected Book Entity BK-0004 (Marriage Register, Book 6) at 10:31 AM.", reason:"Bride's middle name corrected per PSA copy", prev:{ Recipient:"Eduardo & Rosario Layog" }, next:{ Recipient:"Eduardo & Rosario Layug", Status:"Corrected" } },
  { ...L0, id:"LOG-1037", at:"2026-10-20T14:12:55", actor:"Maria Santos", username:"msantos", actionType:"Activity Cancelled", module:"Calendar", client:"", recordType:"Calendar Activity", recordId:"ACT-006", desc:"Maria Santos cancelled the activity \"Mendoza–Lagman Wedding\" (Oct 31, 2026) at 2:12 PM.", reason:"Couple moved the wedding to December.", prev:{ Status:"Active" }, next:{ Status:"Cancelled" } },
  { ...L0, id:"LOG-1038", at:"2026-10-19T09:40:30", actor:"Maria Santos", username:"msantos", actionType:"Request Verified", module:"Requests", client:"Teresita Abasola", recordType:"Request", recordId:"SARMS-2026-012", desc:"Maria Santos verified the Funeral Mass request of Teresita Abasola at 9:40 AM." },
  { ...L0, id:"LOG-1039", at:"2026-10-19T16:05:12", actor:"Andrea Quinto", username:"aquinto", actionType:"Report Exported", module:"Reports", recordType:"Report", recordId:"Official Receipt Transactions Report", desc:"Admin Andrea Quinto exported the Official Receipt Transactions Report (Oct 1 – Oct 19, 2026) at 4:05 PM." },
  { ...L0, id:"LOG-1040", at:"2026-10-08T15:20:47", actor:"Andrea Quinto", username:"aquinto", actionType:"Certificate Voided", module:"Certificate Issuance", client:"Rosario Layug", recordType:"Certificate Issuance", recordId:"PdSPA-MAR-2026-0140", desc:"Admin Andrea Quinto voided certificate PdSPA-MAR-2026-0140 for Rosario Layug at 3:20 PM.", reason:"Bride's middle name misspelled", prev:{ Status:"Issued" }, next:{ Status:"Voided" } },
];

const SEED_SETTINGS: ParishSettings = {
  parishName:"Parroquia de San Pedro Apostol", diocese:"Diocese of Daet",
  address:"Anacleto Guinto Street, Brgy. 3, Vinzons, Camarines Norte 4603",
  phone:"(054) 731-0142 · 0917 812 4410", email:"pdspa.vinzons@gmail.com", facebook:"facebook.com/PdSPAVinzons",
  hoursWeekday:"8:00 AM – 12:00 NN, 1:00 PM – 5:00 PM", hoursSat:"8:00 AM – 12:00 NN", hoursSun:"Closed (Masses only)",
  certSignatory:"Rev. Fr. Rene B. Tabios", certSignatoryTitle:"Parish Priest", certFooter:"N.B. Any mark or alteration of any kind invalidates this certificate.",
};

/* ─── HELPERS ────────────────────────────────────────────── */
function fmt(iso: string) {
  if (!iso) return "—";
  return new Date(iso.slice(0,10) + "T00:00:00").toLocaleDateString("en-PH", { month:"long", day:"numeric", year:"numeric" });
}
function fmtShort(iso: string) {
  if (!iso) return "—";
  return new Date(iso.slice(0,10) + "T00:00:00").toLocaleDateString("en-PH", { month:"short", day:"numeric", year:"numeric" });
}
const pad = (n: number) => String(n).padStart(2,"0");
function nowStamp() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function todayISO() { return nowStamp().slice(0,10); }
function fmtTime(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${pad(m)} ${h >= 12 ? "PM" : "AM"}`;
}
function fmtDT(s: string) { return s ? `${fmtShort(s)} · ${fmtTime(s.slice(11,16))}` : "—"; }
function fmtRange(start: string, end: string, allDay?: boolean) {
  if (allDay) return "All day";
  if (!start) return "—";
  return end ? `${fmtTime(start)} – ${fmtTime(end)}` : fmtTime(start);
}
const toMin = (t: string) => { if (!t) return 0; const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const addMin = (t: string, mins: number) => { const v = Math.min(toMin(t) + mins, 23 * 60 + 59); return `${pad(Math.floor(v / 60))}:${pad(v % 60)}`; };
const peso = (n: number) => `₱${n.toLocaleString("en-PH", { minimumFractionDigits:2 })}`;

interface Conflict { hard: boolean; label: string; detail: string; }
/* Range-based conflict check: start + end, all-day, blocking activities, scheduled appointments, Closed Office Days */
function findConflicts(date: string, start: string, end: string, activities: Activity[], appts: Appointment[], exclude: { reqId?: string; actId?: string } = {}): Conflict[] {
  if (!date) return [];
  const s = start ? toMin(start) : 0, e = end ? toMin(end) : 24 * 60;
  const overlaps = (s2: number, e2: number) => s < e2 && s2 < e;
  const out: Conflict[] = [];
  activities.forEach(a => {
    if (a.status !== "active" || a.date !== date || a.id === exclude.actId) return;
    const as = a.allDay ? 0 : toMin(a.start), ae = a.allDay ? 24 * 60 : (a.end ? toMin(a.end) : as + 60);
    if (a.category === "Closed Office Day")
      out.push({ hard:true, label:"Closed Office Day", detail:`${a.title} — the parish office is closed. Appointments cannot be scheduled on this date.` });
    else if (a.blocking && overlaps(as, ae))
      out.push({ hard:false, label:a.category, detail:`${a.title} · ${fmtRange(a.start, a.end, a.allDay)}` });
  });
  appts.forEach(r => {
    if (r.status !== "scheduled" || r.apprDate !== date || r.id === exclude.reqId) return;
    if (overlaps(toMin(r.apprStart), toMin(r.apprEnd)))
      out.push({ hard:false, label:"Approved appointment", detail:`${r.id} · ${r.sacramentType} — ${r.subjectName} · ${fmtRange(r.apprStart, r.apprEnd)}` });
  });
  return out;
}

function downloadCSV(name: string, rows: (string|number)[][]) {
  const csv = rows.map(r => r.map(c => `"${String(c ?? "").replace(/"/g,'""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type:"text/csv" }));
  a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

/* ─── APP CONTEXT ────────────────────────────────────────── */
type LogInput = Omit<AuditLog, "id"|"at"|"actor"|"username"|"device"|"ip"|"reason"|"client"|"recordType"|"recordId"> & Partial<Pick<AuditLog,"reason"|"client"|"recordType"|"recordId"|"actor"|"username"|"device"|"ip">>;
interface Ctx {
  auth: Auth;
  push: (t: Toast["type"], m: string) => void;
  log: (e: LogInput) => void;
  go: (v: View, f?: Focus) => void;
}
const AppCtx = createContext<Ctx | null>(null);
const useApp = () => useContext(AppCtx)!;
/* "Maria Santos" / "Admin Jose Reyes" prefix used in readable audit sentences */
const who = (a: Auth) => a.role === "admin" ? `Admin ${a.name}` : a.name;
const clock = () => fmtTime(nowStamp().slice(11,16));

/* ─── STATUS PILLS ───────────────────────────────────────── */
const REQ_STATUSES = Object.keys(STATUS_CFG) as ReqStatus[];
const MISC_CFG: Record<string, PillCfg> = {
  active:    { label:"Active",    col:"#166534", bg:"#F0FDF4" },
  inactive:  { label:"Inactive",  col:"#4B5563", bg:"#F3F4F6" },
  corrected: { label:"Corrected", col:"#92400E", bg:"#FEF3C7" },
  cancelled: { label:"Cancelled", col:"#4B5563", bg:"#F3F4F6" },
  issued:    { label:"Issued",    col:"#065F46", bg:"#D1FAE5" },
  voided:    { label:"Voided",    col:"#991B1B", bg:"#FEE2E2" },
};

function Pill({ cfg }: { cfg: PillCfg }) {
  return <span style={{ padding:"3px 10px", borderRadius:99, fontFamily:F.head, fontSize:13, fontWeight:600, display:"inline-flex", alignItems:"center", gap:6,
    background:cfg.bg, color:cfg.col, whiteSpace:"nowrap" }}><span aria-hidden style={{ width:7, height:7, borderRadius:99, background:cfg.col }}/>{cfg.label}</span>;
}
function Badge({ status }: { status: ReqStatus }) { return <Pill cfg={STATUS_CFG[status]}/>; }
function SPill({ s }: { s: string }) { return <Pill cfg={MISC_CFG[s]}/>; }
function CatTag({ cat, faded }: { cat: string; faded?: boolean }) {
  const c = ACTIVITY_CATS[cat] ?? { col:T.sub, light:T.bg };
  return <span style={{ padding:"2px 8px", borderRadius:4, fontFamily:F.head, fontSize:13, fontWeight:600, whiteSpace:"nowrap",
    background:c.light, color:c.col, opacity: faded ? .55 : 1 }}>{cat}</span>;
}
function RoleTag({ a }: { a: { role: UserRole; superadmin: boolean } }) {
  return (
    <span style={{ display:"inline-flex", gap:4 }}>
      <span style={{ padding:"2px 8px", borderRadius:4, fontFamily:F.head, fontSize:13, fontWeight:600,
        background: a.role === "admin" ? T.priLight : T.bg, color: a.role === "admin" ? T.priHov : T.sub,
        border:`1px solid ${a.role === "admin" ? T.borderMd : T.border}` }}>{a.role === "admin" ? "Admin" : "Staff"}</span>
      {a.superadmin && <span style={{ padding:"2px 8px", borderRadius:4, fontFamily:F.head, fontSize:13, fontWeight:700, background:"#1A1400", color:"#F5D77A" }}>Superadmin</span>}
    </span>
  );
}

function Err({ m }: { m?: string }) { return m ? <p role="alert" style={{ fontSize:15, fontWeight:500, color:T.red, margin:"6px 0 0", display:"flex", alignItems:"center", gap:6 }}><AlertTriangle size={16}/>{m}</p> : null; }

function Toggle({ on, set, label, hint, disabled }:
  { on: boolean; set: (v: boolean) => void; label: string; hint?: string; disabled?: boolean }) {
  return (
    <label style={{ display:"flex", alignItems:"flex-start", gap:10, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? .55 : 1 }}>
      <button type="button" role="switch" aria-checked={on} disabled={disabled} onClick={() => set(!on)}
        style={{ width:46, height:26, borderRadius:99, border:"none", flexShrink:0, marginTop:1, position:"relative",
          background: on ? T.primary : T.borderMd, cursor:"inherit", transition:"background .15s", padding:0 }}>
        <span style={{ position:"absolute", top:3, left: on ? 23 : 3, width:20, height:20, borderRadius:99,
          background:"#fff", boxShadow:"0 1px 2px rgba(0,0,0,.2)", transition:"left .15s" }}/>
      </button>
      <span>
        <span style={{ display:"block", fontSize:16, fontWeight:600, color:T.text }}>{label} <span style={{ fontSize:13, fontWeight:700, marginLeft:6, color: on ? T.green : T.muted }}>{on ? "ON" : "OFF"}</span></span>
        {hint && <span style={{ display:"block", fontSize:14, color:T.muted, marginTop:1 }}>{hint}</span>}
      </span>
    </label>
  );
}

function PageHead({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:22, gap:16, flexWrap:"wrap" }}>
      <div>
        <h1 style={{ fontFamily:F.head, fontSize:28, fontWeight:700, color:T.text, margin:0, letterSpacing:"-.015em", lineHeight:1.2 }}>{title}</h1>
        {sub && <p style={{ fontSize:16, color:T.sub, marginTop:6, marginBottom:0, maxWidth:760, lineHeight:1.5 }}>{sub}</p>}
      </div>
      {right && <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>{right}</div>}
    </div>
  );
}

function KV({ k, v, mono }: { k: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"170px 1fr", gap:12, padding:"9px 0", borderBottom:`1px solid ${T.border}` }}>
      <span style={{ fontSize:15, fontWeight:600, color:T.sub, paddingTop:1 }}>{k}</span>
      <span style={{ fontSize:16, color:T.text, fontFamily:F.body, letterSpacing: mono ? ".03em" : undefined, wordBreak:"break-word" }}>{v || "—"}</span>
    </div>
  );
}

function Notice({ tone = "info", children }: { tone?: "info"|"warn"|"error"|"ok"; children: React.ReactNode }) {
  const c = { info:[T.priLight, T.borderMd, T.sub], warn:[T.amberL, T.amberB, T.amber], error:[T.redL, T.redB, T.red], ok:[T.greenL, T.greenB, "#166534"] }[tone];
  const Icon = { info:Info, warn:AlertTriangle, error:XCircle, ok:CheckCircle2 }[tone];
  return <div role={tone === "error" ? "alert" : "status"} style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"12px 14px", borderRadius:8, background:c[0], border:`1px solid ${c[1]}`, borderLeft:`4px solid ${c[2]}`, color:c[2], fontSize:15, lineHeight:1.55 }}><Icon size={19} style={{ flexShrink:0, marginTop:1 }}/><div style={{ flex:1 }}>{children}</div></div>;
}

function Drawer({ open, title, sub, onClose, children, footer }:
  { open: boolean; title: string; sub?: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape" && open) onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position:"fixed", inset:0, zIndex:250, background:"rgba(26,20,0,.28)", display:"flex", justifyContent:"flex-end" }}>
      <div style={{ width:560, maxWidth:"100%", height:"100%", background:"#fff", borderLeft:`1px solid ${T.border}`,
        boxShadow:"-8px 0 32px rgba(0,0,0,.12)", display:"flex", flexDirection:"column" }}>
        <div style={{ padding:"18px 22px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10 }}>
          <div>
            <div style={{ fontFamily:F.head, fontSize:20, fontWeight:700, color:T.text, letterSpacing:"-.01em" }}>{title}</div>
            {sub && <div style={{ fontSize:14, color:T.muted, marginTop:2 }}>{sub}</div>}
          </div>
          <button onClick={onClose} aria-label="Close" title="Close (Esc)" className="sarms-close"><X size={18}/> Close</button>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"16px 22px" }}>{children}</div>
        {footer && <div style={{ padding:"14px 22px", borderTop:`1px solid ${T.border}`, display:"flex", justifyContent:"flex-end", gap:8, background:T.bg }}>{footer}</div>}
      </div>
    </div>
  );
}

/* Generic confirm dialog with an optional required reason */
function ConfirmModal({ open, title, message, confirmLabel, danger, reasonLabel, reasonRequired, onClose, onConfirm, children }:
  { open: boolean; title: string; message: React.ReactNode; confirmLabel: string; danger?: boolean;
    reasonLabel?: string; reasonRequired?: boolean; onClose: () => void; onConfirm: (reason: string) => void; children?: React.ReactNode }) {
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  useEffect(() => { if (open) { setReason(""); setErr(""); } }, [open]);
  return (
    <Modal open={open} title={title} onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant={danger ? "danger" : "primary"} onClick={() => {
          if (reasonRequired && !reason.trim()) { setErr("A reason is required for this action."); return; }
          onConfirm(reason.trim());
        }}>{confirmLabel}</Btn>
      </>}>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <div style={{ fontSize:16, color:T.sub, lineHeight:1.55 }}>{message}</div>
        {children}
        {reasonLabel && (
          <div>
            <FL req={reasonRequired}>{reasonLabel}</FL>
            <FT rows={3} value={reason} onChange={e => { setReason(e.target.value); setErr(""); }} placeholder="Recorded in the Activity Log"/>
            <Err m={err}/>
          </div>
        )}
      </div>
    </Modal>
  );
}

const chipBtn = (active: boolean): React.CSSProperties => ({
  padding:"8px 14px", minHeight:40, fontFamily:F.head, fontSize:14, fontWeight: active ? 700 : 500, borderRadius:99, cursor:"pointer",
  border:`${active ? 2 : 1}px solid ${active ? T.primary : T.borderMd}`, background: active ? T.priLight : T.surface, color: active ? T.priHov : T.sub,
  display:"inline-flex", alignItems:"center", gap:6,
});
const linkBtn: React.CSSProperties = { fontSize:15, color:T.priHov, background:"none", border:"none", cursor:"pointer", padding:"4px 0", fontWeight:600, textDecoration:"underline", textUnderlineOffset:3 };
const g2: React.CSSProperties = { display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 };
const g3: React.CSSProperties = { display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 };
const secLabel: React.CSSProperties = { fontFamily:F.head, fontSize:16, fontWeight:700, color:T.text, margin:"10px 0 4px", paddingBottom:6, borderBottom:`2px solid ${T.priLight}` };
function TypeTag({ type }: { type: string }) {
  const s = SACR[type];
  return (
    <span style={{ padding:"2px 8px", borderRadius:4, fontFamily:F.head, fontSize:13, fontWeight:600,
      background: s?.light ?? "#F3F4F6", color: s?.col ?? T.sub, whiteSpace:"nowrap" }}>
      {type}
    </span>
  );
}

function Btn({ variant = "primary", size = "md", children, style, ...rest }:
  { variant?: "primary"|"outline"|"ghost"|"danger"; size?: "sm"|"md";
    style?: React.CSSProperties; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const p = size === "sm" ? "6px 12px" : "10px 18px";
  const fs = size === "sm" ? 14 : 15;
  const vs: Record<string, React.CSSProperties> = {
    primary: { background:T.priHov, color:"#fff",    border:`1px solid ${T.priHov}` },
    outline: { background:"#fff",    color:T.priHov, border:`1.5px solid ${T.primary}` },
    ghost:   { background:"#fff", color:T.text,     border:`1px solid ${T.borderMd}` },
    danger:  { background:T.red,     color:"#fff",          border:`1px solid ${T.red}` },
  };
  return (
    <button {...rest} className={`sarms-btn sarms-btn-${variant} ${rest.className ?? ""}`} style={{ padding:p, fontSize:fs, fontWeight:600, fontFamily:F.head, letterSpacing:".01em",
      minHeight: size === "sm" ? 36 : 44, borderRadius:8, cursor:rest.disabled?"not-allowed":"pointer", display:"inline-flex", alignItems:"center", justifyContent:"center", gap:7,
      whiteSpace:"nowrap", transition:"background .15s, box-shadow .15s, filter .15s", opacity:rest.disabled?.5:1,
      ...vs[variant], ...style }}>
      {children}
    </button>
  );
}

const inp: React.CSSProperties = {
  width:"100%", padding:"10px 12px", minHeight:44, border:`1px solid ${T.borderMd}`,
  borderRadius:8, fontSize:16, fontFamily:F.body, color:T.text,
  background:"#fff", outline:"none",
};
function FI({ ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} style={{ ...inp, ...rest.style }}
    onFocus={e => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.boxShadow = `0 0 0 3px ${T.priLight}`; rest.onFocus?.(e as never); }}
    onBlur={e => { e.currentTarget.style.borderColor = T.borderMd; e.currentTarget.style.boxShadow = "none"; rest.onBlur?.(e as never); }}/>;
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
    onFocus={e => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.boxShadow = `0 0 0 3px ${T.priLight}`; rest.onFocus?.(e as never); }}
    onBlur={e => { e.currentTarget.style.borderColor = T.borderMd; e.currentTarget.style.boxShadow = "none"; rest.onBlur?.(e as never); }}/>;
}
function FL({ children, req, htmlFor }: { children: React.ReactNode; req?: boolean; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} style={{ display:"block", fontSize:15, fontWeight:600,
      color:T.text, marginBottom:6 }}>
      {children}{req && <span style={{ color:T.red, fontWeight:500, fontSize:14 }}> * required</span>}
    </label>
  );
}

function Divider() { return <div style={{ height:1, background:T.border, margin:"4px 0" }}/>; }

/* ─── CARD ───────────────────────────────────────────────── */
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background:T.surface, border:`1px solid ${T.border}`,
    borderRadius:12, overflow:"hidden", boxShadow:"0 1px 2px rgba(26,20,0,.05)", ...style }}>{children}</div>;
}
function CardHead({ title, sub, right }: { title: React.ReactNode; sub?: string; right?: React.ReactNode }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"16px 20px", borderBottom:`1px solid ${T.border}`, gap:12, flexWrap:"wrap" }}>
      <div>
        <div style={{ fontFamily:F.head, fontSize:18, fontWeight:700, color:T.text, letterSpacing:"-.01em" }}>{title}</div>
        {sub && <div style={{ fontSize:15, color:T.sub, marginTop:3 }}>{sub}</div>}
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
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 7000);
  }, []);
  const dismiss = useCallback((id: number) => setToasts(t => t.filter(x => x.id !== id)), []);
  return { toasts, push, dismiss };
}

const TOAST_COL: Record<Toast["type"], string> = {
  success: T.green, error: T.red, info: T.primary, warning: T.amber,
};

function Toasts({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: number) => void }) {
  return (
    <div style={{ position:"fixed", top:76, right:24, zIndex:400,
      display:"flex", flexDirection:"column", gap:10, maxWidth:420 }}>
      {toasts.map(t => (
        <div key={t.id} role="status" style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px",
          background:"#fff", border:`1px solid ${T.border}`, borderLeft:`5px solid ${TOAST_COL[t.type]}`,
          borderRadius:10, boxShadow:"0 10px 28px rgba(26,20,0,.14)", fontSize:16, fontWeight:500, color:T.text }}>
          {(() => { const I = { success:CheckCircle2, error:XCircle, info:Info, warning:AlertTriangle }[t.type]; return <I size={22} color={TOAST_COL[t.type]} style={{ flexShrink:0 }}/>; })()}
          <span style={{ flex:1 }}>{t.message}</span>
          <button onClick={() => dismiss(t.id)} aria-label="Dismiss" style={{ background:"none", border:"none",
            cursor:"pointer", color:T.muted, lineHeight:0, padding:4 }}><X size={18}/></button>
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
        display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div role="dialog" aria-modal="true" aria-label={title} style={{ background:"#fff", borderRadius:14, border:`1px solid ${T.border}`,
        width:"100%", maxWidth:maxW, boxShadow:"0 8px 32px rgba(0,0,0,.12)", maxHeight:"90vh", display:"flex", flexDirection:"column" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"16px 22px", borderBottom:`1px solid ${T.border}` }}>
          <span style={{ fontFamily:F.head, fontWeight:700, fontSize:20, color:T.text, letterSpacing:"-.01em" }}>{title}</span>
          <button onClick={onClose} aria-label="Close" title="Close (Esc)" className="sarms-close"><X size={18}/> Close</button>
        </div>
        <div style={{ padding:"20px 22px", overflowY:"auto", flex:1 }}>{children}</div>
        {footer && (
          <div style={{ display:"flex", justifyContent:"flex-end", gap:10,
            padding:"14px 22px", borderTop:`1px solid ${T.border}`, background:T.bg, borderRadius:"0 0 14px 14px" }}>{footer}</div>
        )}
      </div>
    </div>
  );
}

/* ─── TABLE HELPERS ──────────────────────────────────────── */
const TH: React.CSSProperties = {
  padding:"12px 14px", textAlign:"left", fontFamily:F.head, fontSize:14, fontWeight:700, letterSpacing:".01em",
  color:T.text, borderBottom:`2px solid ${T.borderMd}`, background:"#FBF6E4", whiteSpace:"nowrap",
  position:"sticky", top:0, zIndex:1,
};
const TD: React.CSSProperties = { padding:"13px 14px", fontFamily:F.body, fontSize:16, lineHeight:1.4, color:T.text, verticalAlign:"middle" };

function SortTh({ label, field, sf, sd, sort }: { label: string; field: string; sf: unknown; sd: string; sort: () => void }) {
  const active = sf === field;
  return (
    <th style={{ ...TH, cursor:"pointer", userSelect:"none" }} onClick={sort} title="Click to sort" aria-sort={active ? (sd === "asc" ? "ascending" : "descending") : "none"}>
      {label} <span style={{ opacity: active ? 1 : .4 }}>{active ? (sd === "asc" ? "↑" : "↓") : "↕"}</span>
    </th>
  );
}

function Paginator({ page, total, set }: { page: number; total: number; set: (p: number) => void }) {
  if (total <= 1) return null;
  return (
    <div style={{ display:"flex", gap:6, alignItems:"center" }}>
      <span style={{ fontSize:15, color:T.sub, marginRight:8 }}>Page <b style={{ color:T.text }}>{page}</b> of {total}</span>
      <button aria-label="Previous page" onClick={() => set(Math.max(1, page - 1))} disabled={page === 1}
        style={{ minWidth:40, height:40, border:`1px solid ${T.border}`, borderRadius:8,
          background:"#fff", cursor:page===1?"not-allowed":"pointer", opacity:page===1?.4:1, fontSize:15, display:"inline-flex", alignItems:"center", justifyContent:"center" }}><ChevronLeft size={18}/></button>
      {Array.from({ length: total }, (_, i) => i + 1)
        .filter(p => p === 1 || p === total || Math.abs(p - page) <= 1)
        .map((p, i, arr) => (
          <span key={p} style={{ display:"contents" }}>
            {i > 0 && arr[i - 1] !== p - 1 && <span style={{ color:T.muted, fontSize:15 }}>…</span>}
            <button onClick={() => set(p)}
              style={{ minWidth:40, height:40, border:`1px solid ${p===page?T.primary:T.border}`,
                borderRadius:4, background:p===page?T.primary:"#fff",
                color:p===page?"#fff":T.sub, cursor:"pointer", fontSize:15, fontWeight:p===page?700:400 }}>{p}</button>
          </span>
        ))}
      <button aria-label="Next page" onClick={() => set(Math.min(total, page + 1))} disabled={page === total}
        style={{ minWidth:40, height:40, border:`1px solid ${T.border}`, borderRadius:4,
          background:"#fff", cursor:page===total?"not-allowed":"pointer", opacity:page===total?.4:1, fontSize:15, display:"inline-flex", alignItems:"center", justifyContent:"center" }}><ChevronRight size={18}/></button>
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
function openBlobPrint(html: string, width = 960, height = 820): boolean {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank", `width=${width},height=${height}`);
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return !!w;
}
function generateCertHTML(appt: Appointment, logoB64: string, mf?: MarriageFormData, form97Imgs?: { p1: string; p2: string }): string {
  const issued = new Date().toLocaleDateString("en-PH",{month:"long",day:"numeric",year:"numeric"});
  const logoTag = `<img src="${logoB64}" alt="Parish Seal" style="width:70px;height:70px;object-fit:contain">`;
  const ln = (w = 180) => `<span style="border-bottom:1px solid #333;display:inline-block;min-width:${w}px;vertical-align:bottom">&nbsp;</span>`;
  const parts = appt.subjectName.split("&").map(s => s.trim());

  const base = (title: string, body: string, sigLabel: string) => `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800&display=swap" rel="stylesheet">
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:Arial,Helvetica,sans-serif;background:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
      .cert{width:680px;padding:28px 36px;border:4px double #1A1400}
      .cert-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
      .cert-center{flex:1;text-align:center;padding:0 10px}
      .cert-center .diocese{font-family:'Montserrat',sans-serif;font-size:10px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:#555;margin-bottom:3px}
      .cert-center .parish{font-family:'Montserrat',sans-serif;font-size:15px;font-weight:800;color:#1A1400;letter-spacing:.06em;line-height:1.2}
      .cert-center .address{font-size:10px;color:#666;margin-top:3px}
      .cert-title{text-align:center;font-family:'Garet','Montserrat',sans-serif;font-size:23px;font-weight:800;line-height:1.2;letter-spacing:-.03em;color:#1A1400;margin:12px 0 16px;border-top:1px solid #ccc;border-bottom:1px solid #ccc;padding:6px 0 8px}
      .display{font-family:'Garet','Montserrat',sans-serif;font-weight:700}
      .cert-body{font-size:12.5px;line-height:1.9;color:#1A1400}
      .cert-body p{margin-bottom:10px}
      .cert-body strong{font-weight:700}
      .cert-footer{margin-top:28px;display:flex;justify-content:space-between;align-items:flex-end}
      .sig-block .line{border-top:1px solid #333;padding-top:5px;margin-top:32px;width:220px}
      .sig-block .name{font-family:'Montserrat',sans-serif;font-size:10.5px;font-weight:700;text-align:center;letter-spacing:.04em}
      .nb{font-size:9.5px;color:#666;text-align:center;margin-top:16px;font-style:italic}
      .two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px}
      .two-col .head{font-weight:700;text-decoration:underline;margin-bottom:6px;font-size:13px}
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
        <div style="width:70px">${logoTag}</div>
      </div>
      <div class="cert-title">${title}</div>
      <div class="cert-body">${body}</div>
      <div class="nb">N.B. Any mark or alteration of any kind invalidates this certificate.</div>
      <div class="cert-footer">
        <div style="font-size:11px;color:#555">by: ___________________________</div>
        ${logoTag}
        <div class="sig-block"><div class="line"><div class="name">${sigLabel}</div></div></div>
      </div>
    </div>
    <script>window.onload=()=>{(document.fonts?document.fonts.ready:Promise.resolve()).then(()=>window.print())}<\/script></body></html>`;

  switch (appt.sacramentType) {
    case "Baptism":
      return base("Certificate of Baptism", `
        <p class="display" style="text-align:center;font-size:17px;line-height:1.3;margin-bottom:8px">${appt.subjectName}</p>
        <p>Child of ${ln(190)} (Father's Name) &nbsp; Of ${ln(160)} (Place of Birth)</p>
        <p>And ${ln(210)} (Mother's Name) &nbsp; Of ${ln(160)} (Place of Birth)</p>
        <p>Was Born in ${ln(200)} &nbsp; Legitimacy ${ln(120)}</p>
        <p>On the ${ln(60)} day of ${ln(140)} In the year ${ln(80)}</p>
        <p class="display" style="text-align:center;font-size:15px;line-height:1.3;margin:8px 0">Was Solemnly Baptized</p>
        <p>On the ${ln(60)} day of ${ln(140)} in the year ${ln(80)}</p>
        <p>By the Rev. ${ln(240)}</p>
        <p>The sponsors being ${ln(190)} and ${ln(190)}</p>
        <p>As appear on Baptismal register no. ${ln(60)} Page no. ${ln(60)} Entry no. ${ln(60)}</p>
        <p>This Certificate was given for the purpose of ${ln(240)}</p>
        <p>Date Issued: <strong>${issued}</strong></p>`, "Parish Priest");

    case "Marriage": {
      const m = mf ?? BLANK_MARRIAGE;
      const p1 = form97Imgs?.p1 ?? "";
      const p2 = form97Imgs?.p2 ?? "";
      const FD = "position:absolute;font-family:Arial,Helvetica,sans-serif;font-weight:bold;font-size:9pt;color:#000;line-height:1.1;white-space:nowrap;overflow:hidden;z-index:2";
      const CK = "position:absolute;font-family:Arial,Helvetica,sans-serif;font-size:12pt;color:#000;font-weight:bold;z-index:2;line-height:1";
      // f: render a data value — all styles inline, no class dependency
      const f = (v: string, top: string, left: string, maxW = "auto") =>
        v ? `<span style="${FD};top:${top};left:${left};max-width:${maxW}">${v}</span>` : "";
      // ck: render a checkmark — all styles inline
      const ck = (b: boolean, top: string, left: string) =>
        b ? `<span style="${CK};top:${top};left:${left}">&#10003;</span>` : "";
      const pg = (src: string) =>
        `<div style="position:relative;width:8.5in;height:13in;overflow:hidden;page-break-after:always">` +
        `<img src="${src}" style="position:absolute;top:0;left:0;width:100%;height:100%;z-index:0;display:block">`;
      return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>*{box-sizing:border-box;margin:0;padding:0}body{margin:0;padding:0}@page{size:8.5in 13in;margin:0}@media print{body{margin:0}}</style>
</head><body>

${pg(p1)}
  <!-- Province / Registry No / City-Municipality -->
  ${f(m.province,    "8.0%", "10%","35%")}
  ${f(m.registryNo,  "8.0%", "74%","16%")}
  ${f(m.cityMun,     "10.2%","13%","38%")}

  <!-- Item 1: Husband Name -->
  ${f(m.hFirst,  "15.1%","10%","31%")}
  ${f(m.hMiddle, "16.8%","10%","31%")}
  ${f(m.hLast,   "18.5%","10%","31%")}
  <!-- Item 1: Wife Name -->
  ${f(m.wFirst,  "15.1%","51.5%","46%")}
  ${f(m.wMiddle, "16.8%","51.5%","46%")}
  ${f(m.wLast,   "18.5%","51.5%","46%")}

  <!-- Item 2: Date of Birth + Age - Husband -->
  ${f(m.hDobDay,   "20.7%","10%",  "5%")}
  ${f(m.hDobMonth, "20.7%","18%",  "9%")}
  ${f(m.hDobYear,  "20.7%","30%",  "6%")}
  ${f(m.hAge,      "20.7%","41%",  "5%")}
  <!-- Item 2: Wife -->
  ${f(m.wDobDay,   "20.7%","51.5%","5%")}
  ${f(m.wDobMonth, "20.7%","60%",  "9%")}
  ${f(m.wDobYear,  "20.7%","71%",  "6%")}
  ${f(m.wAge,      "20.7%","81%",  "5%")}

  <!-- Item 3: Place of Birth - Husband -->
  ${f(m.hPobCity,     "22.9%","10%","11%")}
  ${f(m.hPobProvince, "22.9%","22%","9%")}
  ${f(m.hPobCountry,  "22.9%","33%","9%")}
  <!-- Item 3: Wife -->
  ${f(m.wPobCity,     "22.9%","51.5%","11%")}
  ${f(m.wPobProvince, "22.9%","64%", "9%")}
  ${f(m.wPobCountry,  "22.9%","75%", "9%")}

  <!-- Item 4: Sex / Citizenship - Husband -->
  ${f(m.hSex,        "25.5%","10%","10%")}
  ${f(m.hCitizenship,"25.5%","22%","20%")}
  <!-- Item 4: Wife -->
  ${f(m.wSex,        "25.5%","51.5%","10%")}
  ${f(m.wCitizenship,"25.5%","63%", "20%")}

  <!-- Item 5: Residence -->
  ${f(m.hResidence,"28.5%","10%","38%")}
  ${f(m.wResidence,"28.5%","51.5%","46%")}

  <!-- Item 6: Religion -->
  ${f(m.hReligion,"34.5%","10%","37%")}
  ${f(m.wReligion,"34.5%","51.5%","46%")}

  <!-- Item 7: Civil Status -->
  ${f(m.hCivilStatus,"37.5%","10%","37%")}
  ${f(m.wCivilStatus,"37.5%","51.5%","46%")}

  <!-- Item 8: Father's Name - Husband -->
  ${f(m.hFatFirst,  "40%","10%","11%")}
  ${f(m.hFatMiddle, "40%","22%","10%")}
  ${f(m.hFatLast,   "40%","34%","10%")}
  <!-- Item 8: Wife -->
  ${f(m.wFatFirst,  "40%","51.5%","11%")}
  ${f(m.wFatMiddle, "40%","64%", "10%")}
  ${f(m.wFatLast,   "40%","75%", "10%")}

  <!-- Item 9: Father Citizenship -->
  ${f(m.hFatCit,"43.3%","10%","37%")}
  ${f(m.wFatCit,"43.3%","51.5%","46%")}

  <!-- Item 10: Mother's Name - Husband -->
  ${f(m.hMotFirst,  "46.1%","10%","11%")}
  ${f(m.hMotMiddle, "46.1%","22%","10%")}
  ${f(m.hMotLast,   "46.1%","34%","10%")}
  <!-- Item 10: Wife -->
  ${f(m.wMotFirst,  "46.1%","51.5%","11%")}
  ${f(m.wMotMiddle, "46.1%","64%", "10%")}
  ${f(m.wMotLast,   "46.1%","75%", "10%")}

  <!-- Item 11: Mother Citizenship -->
  ${f(m.hMotCit,"49%","10%","37%")}
  ${f(m.wMotCit,"49%","51.5%","46%")}

  <!-- Item 12: Consent Giver - Husband -->
  ${f(m.hConFirst,  "51.8%","10%","11%")}
  ${f(m.hConMiddle, "51.8%","22%","10%")}
  ${f(m.hConLast,   "51.8%","34%","10%")}
  <!-- Item 12: Wife -->
  ${f(m.wConFirst,  "51.8%","51.5%","11%")}
  ${f(m.wConMiddle, "51.8%","64%", "10%")}
  ${f(m.wConLast,   "51.8%","75%", "10%")}

  <!-- Item 13: Relationship -->
  ${f(m.hConRel,"55.9%","10%","37%")}
  ${f(m.wConRel,"55.9%","51.5%","46%")}

  <!-- Item 14: Consent Giver Residence -->
  ${f(m.hConRes,"58.4%","10%","38%")}
  ${f(m.wConRes,"58.4%","51.5%","46%")}

  <!-- Item 15: Place of Marriage (venue line + city/province sub-line) -->
  ${f(m.placeVenue,    "59.2%","10%","32%")}
  ${f(m.placeCityMun,  "61.2%","43%","19%")}
  ${f(m.placeProvince, "61.2%","67%","20%")}

  <!-- Item 16/17: Date + Time -->
  ${f(m.marDay,                    "63.0%","10%", "6%")}
  ${f(m.marMonth,                  "63.0%","19%", "10%")}
  ${f(m.marYear,                   "63.0%","31%", "7%")}
  ${f(`${m.marTime} ${m.marAMPM}`, "63.0%","63%", "12%")}

  <!-- Item 18: Names within certification text -->
  ${f(`${m.hFirst} ${m.hMiddle} ${m.hLast}`,"67.0%","16%","27%")}
  ${f(`${m.wFirst} ${m.wMiddle} ${m.wLast}`,"67.0%","52%","38%")}

  <!-- Item 19: License checkboxes -->
  ${ck(!m.licArt34 && !m.licPD1083, "76.0%","1.8%")}
  ${ck(m.licArt34,                   "77.3%","1.8%")}
  ${ck(m.licPD1083,                  "78.7%","1.8%")}
  ${f(m.licNo,   "76.0%","24%","17%")}
  ${f(m.licDate, "76.0%","46%","13%")}
  ${f(m.licAt,   "76.0%","64%","22%")}
  ${m.licArt34 ? f("34","77.3%","43%","4%") : ""}

  <!-- Item 19: Solemnizing Officer -->
  ${f(m.solOfficer, "82.0%","10%","25%")}
  ${f(m.solPosition,"82.0%","40%","18%")}
  ${f(m.solReligion,"82.0%","60%","31%")}

  <!-- Item 20a: Witnesses -->
  ${f(m.wit1,"86.0%","10%","18%")}
  ${f(m.wit2,"86.0%","30%","18%")}
  ${f(m.wit3,"86.0%","51%","18%")}
  ${f(m.wit4,"86.0%","71%","18%")}
</div>

${pg(p2)}`
      + /* 20b witnesses (print name lines) */
        f(m.wit1,"3.5%","4.5%","22%") + f(m.wit2,"3.5%","28.5%","22%") + f(m.wit3,"3.5%","54%","22%") + f(m.wit4,"3.5%","79%","13%")
      /* Affidavit of Solemnizing Officer — "I, [name]" and address */
      + f(m.affSolOfficer,"13%","5%","40%") + f(m.affSolAddr,"14.3%","5%","82%")
      /* Sol Item 1: marriage between H and W */
      + f(m.affSolH,"16.5%","40%","17%") + f(m.affSolW,"16.5%","61%","30%")
      /* Sol circumstance checkboxes */
      + ck(m.affSolCirc==="a","18.5%","1.8%") + ck(m.affSolCirc==="b","20.5%","1.8%")
      + ck(m.affSolCirc==="c","25%",  "1.8%") + ck(m.affSolCirc==="d","29.5%","1.8%")
      + ck(m.affSolCirc==="e","31%",  "1.8%")
      /* Sol "In truth whereof" */
      + f(m.affSolDay,"38%","22%","5%") + f(m.affSolMonth,"38%","28.5%","12%") + f(m.affSolAt,"38%","39%","25%")
      /* Delayed Registration Affidavit — applicant name and residence */
      + f(m.affDelApplicant,"58%","5%","45%") + f(m.affDelRes,"58%","68%","25%")
      /* Del Item 1: spouse / place / date */
      + f(m.affDelSpouse,   "63%","18%","22%") + f(m.affDelMarPlace,"63%","44%","15%") + f(m.affDelMarDate,"63%","63%","15%")
      /* Del Item 2: solemnized by (officer on same row) */
      + f(m.affDelMarPlace,"66.5%","24%","28%")
      /* Del ceremony checkboxes */
      + ck(m.affDelCeremony==="religious","69%","8.5%") + ck(m.affDelCeremony==="civil","69%","25%")
      + ck(m.affDelCeremony==="muslim",   "69%","41%")  + ck(m.affDelCeremony==="tribal","69%","57%")
      /* Del Item 3: license */
      + ck(true,"71.5%","1.8%")
      + f(m.affDelLicNo,"71.5%","15%","17%") + f(m.affDelLicOn,"71.5%","36%","13%") + f(m.affDelLicAt,"71.5%","52%","22%")
      /* Del Item 4: citizenships */
      + f(m.affDelApCit,"75.5%","40%","17%") + f(m.affDelSpCit,"75.5%","66%","20%")
      /* Del Item 5: reason */
      + f(m.affDelReason,"78.5%","33%","55%")
      /* Del "In truth whereof" */
      + f(m.affDelDay,"82.5%","22%","5%") + f(m.affDelMonth,"82.5%","29%","12%") + f(m.affDelAt,"82.5%","40%","25%")
      + `
</div>

<script>window.onload=()=>window.print()<\/script>
</body></html>`;
    }

    case "Death Certificate":
      return base("Certificate of Death", `
        <p>This is to certify that <strong>${appt.subjectName}</strong>, a resident of ${ln(200)},
        husband/wife/son/daughter of ${ln(200)}, died on the ${ln(60)} day of ${ln(140)} at the age of ${ln(60)},
        and the Funeral Rites were celebrated in this Parish on the ${ln(60)} day of ${ln(140)}.
        The cause of death was ${ln(240)}. He/She received the last Sacrament of confession, Extreme Unction
        and Holy Viaticum before death <em>or</em> he/she was not able to receive any Sacrament before death.</p>
        <p>This is a true copy of the original record as it appears in the Register of Dead of this Parish,
        Book No. ${ln(60)}, Year ${ln(70)}, Page ${ln(60)}, Line no. ${ln(60)}.</p>
        <p>In witness whereof I affix my signature and put the seal of this Parroquia de San Pedro Apostol,
        Vinzons, Camarines Norte, on the ${ln(60)} day of ${ln(180)}.</p>`,
        "Parish Priest / Parochial Vicar");

    case "Confirmation":
      return `<!DOCTYPE html><html><head><meta charset="UTF-8">
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800&display=swap" rel="stylesheet">
        <style>
          *{box-sizing:border-box;margin:0;padding:0}
          body{font-family:Arial,Helvetica,sans-serif;background:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
          .cert{width:660px;padding:28px 36px;border:4px double #1A1400}
          .cert-top{text-align:center;margin-bottom:16px}
          .cert-top .parish{font-family:'Montserrat',sans-serif;font-size:15px;font-weight:800;color:#1A1400;letter-spacing:.06em}
          .cert-top .address{font-size:10px;color:#666;margin-top:3px}
          .cert-title{text-align:center;font-family:'Garet','Montserrat',sans-serif;font-size:23px;font-weight:800;line-height:1.2;letter-spacing:-.03em;color:#1A1400;margin:12px 0 16px;border-top:1px solid #ccc;border-bottom:1px solid #ccc;padding:6px 0 8px}
      .display{font-family:'Garet','Montserrat',sans-serif;font-weight:700}
          .cert-body{font-size:12.5px;line-height:2;color:#1A1400}
          .cert-body p{margin-bottom:6px}
          .ln{border-bottom:1px solid #333;display:inline-block;min-width:160px;vertical-align:bottom}
          .cert-footer{margin-top:28px;display:flex;justify-content:space-between;align-items:flex-end}
          .sig-block .line{border-top:1px solid #333;padding-top:5px;margin-top:32px;width:220px}
          .sig-block .name{font-family:'Montserrat',sans-serif;font-size:10.5px;font-weight:700;text-align:center;letter-spacing:.04em}
          .nb{font-size:9.5px;color:#666;text-align:center;margin-top:16px;font-style:italic}
          @media print{body{padding:0}@page{size:A4 portrait;margin:14mm}}
        </style></head><body>
        <div class="cert">
          <div class="cert-top">
            <img src="${logoB64}" alt="Seal" style="width:70px;height:70px;object-fit:contain;display:block;margin:0 auto 10px">
            <div class="parish">PARROQUIA DE SAN PEDRO APOSTOL</div>
            <div class="address">Anacleto Guinto Street, Brgy. 3, Vinzons, Camarines Norte</div>
          </div>
          <div class="cert-title">Certificate of Confirmation</div>
          <div class="cert-body">
            <p>Name: <strong>${appt.subjectName}</strong></p>
            <p>Age: <span class="ln">&nbsp;</span></p>
            <p>Father: <span class="ln" style="min-width:240px">&nbsp;</span></p>
            <p>Mother: <span class="ln" style="min-width:240px">&nbsp;</span></p>
            <p>Place of Baptism: <span class="ln" style="min-width:240px">&nbsp;</span></p>
            <p>Date of Confirmation: <strong>${appt.dateOfSacrament ? fmt(appt.dateOfSacrament) : '<span class="ln" style="min-width:200px">&nbsp;</span>'}</strong></p>
            <p>Minister: <span class="ln" style="min-width:240px">&nbsp;</span></p>
            <p>Sponsor: <span class="ln" style="min-width:240px">&nbsp;</span></p>
            <p>Book no. <span class="ln" style="min-width:60px">&nbsp;</span> Page no. <span class="ln" style="min-width:60px">&nbsp;</span> Entry no. <span class="ln" style="min-width:60px">&nbsp;</span> &nbsp; Remarks: <span class="ln" style="min-width:160px">&nbsp;</span></p>
            <p>Date issued: <strong>${issued}</strong></p>
          </div>
          <div class="nb">N.B. Any mark or alteration of any kind invalidates this certificate.</div>
          <div class="cert-footer">
            <div style="font-size:11px;color:#555">by: ___________________________</div>
            <img src="${logoB64}" alt="Seal" style="width:50px;height:50px;object-fit:contain">
            <div class="sig-block"><div class="line"><div class="name">Parish Priest / Parochial Vicar</div></div></div>
          </div>
        </div>
        <script>window.onload=()=>{(document.fonts?document.fonts.ready:Promise.resolve()).then(()=>window.print())}<\/script></body></html>`;

    default: {
      const s = SACR[appt.sacramentType] ?? SACR["No Record"];
      return base(`Certificate of ${appt.sacramentType}`, `
        <p>This is to certify that <strong>${appt.subjectName}</strong>
        ${s.cert.charAt(0).toUpperCase() + s.cert.slice(1)}
        ${appt.dateOfSacrament ? `on <strong>${fmt(appt.dateOfSacrament)}</strong>` : ""}
        as recorded in the sacramental register of this Parish.</p>
        <p>This certificate is issued upon the request of <strong>${appt.parishioner}</strong>
        ${appt.purposeOf ? `for the purpose of <strong>${appt.purposeOf}</strong>` : ""}.</p>
        <p>Date Issued: <strong>${issued}</strong> &bull; Ref: ${appt.id}</p>`,
        "Parish Priest / Parochial Vicar");
    }
  }
}/* ─── SIMPLE BAR CHART (SVG) ─────────────────────────────── */
function SimpleBarChart({ data, height = 200 }:
  { data: { name: string; full: string; count: number }[]; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  if (data.length === 0) {
    return <div style={{ height, display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:16, color:T.muted }}>No data to display.</div>;
  }
  const padL = 28, padB = 28, padT = 8;
  const W = 100;                         // viewBox width units (responsive via width:100%)
  const H = height;
  const max = Math.max(...data.map(d => d.count), 1);
  const step = max <= 4 ? 1 : Math.ceil(max / 4);
  const ticks: number[] = [];
  for (let v = 0; v <= max; v += step) ticks.push(v);
  if (ticks[ticks.length - 1] !== max) ticks.push(max);
  const plotH = H - padB - padT;
  const y = (v: number) => padT + plotH * (1 - v / max);
  const bandW = (W - padL) / data.length;
  const barW = bandW * 0.5;

  return (
    <div style={{ position:"relative", width:"100%" }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
        style={{ width:"100%", height, display:"block", overflow:"visible" }}>
        {/* gridlines + y labels */}
        {ticks.map(t => (
          <g key={`grid-${t}`}>
            <line x1={padL} x2={W} y1={y(t)} y2={y(t)}
              stroke={T.border} strokeWidth="0.3" strokeDasharray="1 1"
              vectorEffect="non-scaling-stroke"/>
            <text x={padL - 3} y={y(t) + 3} textAnchor="end"
              fontSize="6" fill={T.muted} style={{ fontFamily:"inherit" }}>{t}</text>
          </g>
        ))}
        {/* bars */}
        {data.map((d, i) => {
          const bx = padL + i * bandW + (bandW - barW) / 2;
          const bh = plotH * (d.count / max);
          return (
            <g key={`bar-${d.full}`}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={bx} y={y(d.count)} width={barW} height={bh}
                rx="1" fill={SACR[d.full]?.col ?? T.primary}
                opacity={hover === null || hover === i ? 1 : 0.55}
                style={{ transition:"opacity .15s" }}/>
              <text x={bx + barW / 2} y={H - padB + 8} textAnchor="middle"
                fontSize="6" fill={T.muted} style={{ fontFamily:"inherit" }}>{d.name}</text>
            </g>
          );
        })}
      </svg>
      {/* tooltip */}
      {hover !== null && (
        <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)",
          background:"#fff", border:`1px solid ${T.border}`, borderRadius:6,
          padding:"4px 8px", fontSize:15, color:T.text, pointerEvents:"none",
          boxShadow:"0 2px 8px rgba(0,0,0,.08)", whiteSpace:"nowrap" }}>
          <strong>{data[hover].full}</strong>: {data[hover].count} request{data[hover].count === 1 ? "" : "s"}
        </div>
      )}
    </div>
  );
}

/* ─── SIMPLE HORIZONTAL BARS (div-based) ─────────────────── */
function HBars({ data }: { data: { name: string; count: number; color: string }[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {data.map(d => (
        <div key={d.name} style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:96, flexShrink:0, fontSize:14, color:T.sub, textAlign:"right",
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{d.name}</div>
          <div style={{ flex:1, height:16, background:T.bg, border:`1px solid ${T.border}`,
            borderRadius:4, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${(d.count / max) * 100}%`,
              background:d.color, borderRadius:4, minWidth: d.count > 0 ? 3 : 0,
              transition:"width .3s" }}/>
          </div>
          <div style={{ width:24, flexShrink:0, fontSize:15, fontWeight:700, color:T.text }}>{d.count}</div>
        </div>
      ))}
    </div>
  );
}
function MarriageDetailsModal({ open, onClose, subjectName, initialData, onSave }:
  { open: boolean; onClose: () => void; subjectName: string;
    initialData: MarriageFormData; onSave: (d: MarriageFormData) => void }) {
  const [d, setD] = useState<MarriageFormData>(initialData);
  const [sec, setSec] = useState<MarSec>("registry");
  const upd = (k: keyof MarriageFormData, v: string|boolean) => setD(p => ({...p,[k]:v}));

  useEffect(() => { if (open) { setD(initialData); setSec("registry"); } }, [open]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const g3: React.CSSProperties = { display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 };
  const g4: React.CSSProperties = { display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:10 };
  const g2: React.CSSProperties = { display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 };
  const idx = MAR_SECTIONS.findIndex(s => s.id === sec);
  const cur = MAR_SECTIONS[idx];
  return (
    <div onClick={e => { if(e.target===e.currentTarget) onClose(); }}
      style={{ position:"fixed", inset:0, zIndex:300, background:"rgba(0,0,0,.4)",
        display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"#fff", borderRadius:10, border:`1px solid ${T.border}`, width:"100%", maxWidth:1080,
        boxShadow:"0 12px 40px rgba(0,0,0,.18)", maxHeight:"94vh", display:"flex", flexDirection:"column" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between",
          padding:"14px 18px 10px", borderBottom:`1px solid ${T.border}` }}>
          <div>
            <div style={{ fontFamily:F.head, fontWeight:700, fontSize:19, color:T.text, letterSpacing:"-.01em" }}>Marriage Details — {subjectName}</div>
            <div style={{ fontSize:14, color:T.muted, marginTop:2 }}>PSA Municipal Form No. 97 — Certificate of Marriage · Back-office structured data · auto-fills the printed Form 97</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:25, color:T.muted, lineHeight:1, padding:0 }}>×</button>
        </div>
        <div style={{ display:"flex", flex:1, minHeight:0 }}>
          <nav style={{ width:232, flexShrink:0, borderRight:`1px solid ${T.border}`, background:T.bg, padding:"10px 0", overflowY:"auto" }}>
            {MAR_SECTIONS.map((s, i) => {
              const a = s.id === sec;
              return (
                <button key={s.id} onClick={() => setSec(s.id)}
                  style={{ width:"100%", display:"flex", gap:10, alignItems:"center", padding:"8px 16px", textAlign:"left",
                    background: a ? T.surface : "transparent", border:"none", cursor:"pointer",
                    borderLeft: a ? `2px solid ${T.primary}` : "2px solid transparent" }}>
                  <span style={{ width:20, height:20, borderRadius:99, flexShrink:0, fontSize:13, fontWeight:700,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    background: a ? T.primary : T.surface, color: a ? "#fff" : T.muted, border:`1px solid ${a ? T.primary : T.borderMd}` }}>{i+1}</span>
                  <span style={{ fontFamily:F.head, fontSize:14, fontWeight: a ? 700 : 500, color: a ? T.text : T.sub, lineHeight:1.3 }}>{s.label}</span>
                </button>
              );
            })}
          </nav>
          <div style={{ flex:1, padding:"16px 20px", overflowY:"auto" }}>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontFamily:F.head, fontSize:12, color:T.muted, textTransform:"uppercase", letterSpacing:".12em", fontWeight:700 }}>Section {idx+1} of {MAR_SECTIONS.length}</div>
              <div style={{ fontFamily:F.head, fontSize:19, fontWeight:700, color:T.text, letterSpacing:"-.01em" }}>{cur.label}</div>
              <div style={{ fontSize:15, color:T.muted }}>{cur.hint}</div>
            </div>
{sec === "registry" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
          <div><FL>Province</FL><FI value={d.province} onChange={e=>upd("province",e.target.value)}/></div>
          <div><FL>City / Municipality</FL><FI value={d.cityMun} onChange={e=>upd("cityMun",e.target.value)}/></div>
          <div><FL>Registry No.</FL><FI value={d.registryNo} onChange={e=>upd("registryNo",e.target.value)}/></div>
        </div>
)}
{sec === "husband" && (
<div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div style={g3}><div><FL>1. First Name</FL><FI value={d.hFirst} onChange={e=>upd("hFirst",e.target.value)}/></div><div><FL>Middle Name</FL><FI value={d.hMiddle} onChange={e=>upd("hMiddle",e.target.value)}/></div><div><FL>Last Name</FL><FI value={d.hLast} onChange={e=>upd("hLast",e.target.value)}/></div></div>
                <div style={g4}><div><FL>2a. DOB Day</FL><FI value={d.hDobDay} onChange={e=>upd("hDobDay",e.target.value)} placeholder="DD"/></div><div><FL>Month</FL><FI value={d.hDobMonth} onChange={e=>upd("hDobMonth",e.target.value)} placeholder="January"/></div><div><FL>Year</FL><FI value={d.hDobYear} onChange={e=>upd("hDobYear",e.target.value)} placeholder="YYYY"/></div><div><FL>2b. Age</FL><FI value={d.hAge} onChange={e=>upd("hAge",e.target.value)}/></div></div>
                <div style={g3}><div><FL>3. POB City/Mun.</FL><FI value={d.hPobCity} onChange={e=>upd("hPobCity",e.target.value)}/></div><div><FL>Province</FL><FI value={d.hPobProvince} onChange={e=>upd("hPobProvince",e.target.value)}/></div><div><FL>Country</FL><FI value={d.hPobCountry} onChange={e=>upd("hPobCountry",e.target.value)}/></div></div>
                <div style={g2}><div><FL>4a. Sex</FL><FS value={d.hSex} onChange={e=>upd("hSex",e.target.value)}><option>Male</option><option>Female</option></FS></div><div><FL>4b. Citizenship</FL><FI value={d.hCitizenship} onChange={e=>upd("hCitizenship",e.target.value)}/></div></div>
                <div><FL>5. Residence (House No., Street, City/Mun., Province, Country)</FL><FI value={d.hResidence} onChange={e=>upd("hResidence",e.target.value)}/></div>
                <div><FL>6. Religion / Religious Sect</FL><FI value={d.hReligion} onChange={e=>upd("hReligion",e.target.value)}/></div>
                <div><FL>7. Civil Status</FL><FI value={d.hCivilStatus} onChange={e=>upd("hCivilStatus",e.target.value)}/></div>
                <div style={g3}><div><FL>8. Father First</FL><FI value={d.hFatFirst} onChange={e=>upd("hFatFirst",e.target.value)}/></div><div><FL>Middle</FL><FI value={d.hFatMiddle} onChange={e=>upd("hFatMiddle",e.target.value)}/></div><div><FL>Last</FL><FI value={d.hFatLast} onChange={e=>upd("hFatLast",e.target.value)}/></div></div>
                <div><FL>9. Father's Citizenship</FL><FI value={d.hFatCit} onChange={e=>upd("hFatCit",e.target.value)}/></div>
                <div style={g3}><div><FL>10. Mother First</FL><FI value={d.hMotFirst} onChange={e=>upd("hMotFirst",e.target.value)}/></div><div><FL>Middle</FL><FI value={d.hMotMiddle} onChange={e=>upd("hMotMiddle",e.target.value)}/></div><div><FL>Last</FL><FI value={d.hMotLast} onChange={e=>upd("hMotLast",e.target.value)}/></div></div>
                <div><FL>11. Mother's Citizenship</FL><FI value={d.hMotCit} onChange={e=>upd("hMotCit",e.target.value)}/></div>
</div>
)}
{sec === "wife" && (
<div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div style={g3}><div><FL>1. First Name</FL><FI value={d.wFirst} onChange={e=>upd("wFirst",e.target.value)}/></div><div><FL>Middle Name</FL><FI value={d.wMiddle} onChange={e=>upd("wMiddle",e.target.value)}/></div><div><FL>Last Name</FL><FI value={d.wLast} onChange={e=>upd("wLast",e.target.value)}/></div></div>
                <div style={g4}><div><FL>2a. DOB Day</FL><FI value={d.wDobDay} onChange={e=>upd("wDobDay",e.target.value)} placeholder="DD"/></div><div><FL>Month</FL><FI value={d.wDobMonth} onChange={e=>upd("wDobMonth",e.target.value)} placeholder="January"/></div><div><FL>Year</FL><FI value={d.wDobYear} onChange={e=>upd("wDobYear",e.target.value)} placeholder="YYYY"/></div><div><FL>2b. Age</FL><FI value={d.wAge} onChange={e=>upd("wAge",e.target.value)}/></div></div>
                <div style={g3}><div><FL>3. POB City/Mun.</FL><FI value={d.wPobCity} onChange={e=>upd("wPobCity",e.target.value)}/></div><div><FL>Province</FL><FI value={d.wPobProvince} onChange={e=>upd("wPobProvince",e.target.value)}/></div><div><FL>Country</FL><FI value={d.wPobCountry} onChange={e=>upd("wPobCountry",e.target.value)}/></div></div>
                <div style={g2}><div><FL>4a. Sex</FL><FS value={d.wSex} onChange={e=>upd("wSex",e.target.value)}><option>Female</option><option>Male</option></FS></div><div><FL>4b. Citizenship</FL><FI value={d.wCitizenship} onChange={e=>upd("wCitizenship",e.target.value)}/></div></div>
                <div><FL>5. Residence (House No., Street, City/Mun., Province, Country)</FL><FI value={d.wResidence} onChange={e=>upd("wResidence",e.target.value)}/></div>
                <div><FL>6. Religion / Religious Sect</FL><FI value={d.wReligion} onChange={e=>upd("wReligion",e.target.value)}/></div>
                <div><FL>7. Civil Status</FL><FI value={d.wCivilStatus} onChange={e=>upd("wCivilStatus",e.target.value)}/></div>
                <div style={g3}><div><FL>8. Father First</FL><FI value={d.wFatFirst} onChange={e=>upd("wFatFirst",e.target.value)}/></div><div><FL>Middle</FL><FI value={d.wFatMiddle} onChange={e=>upd("wFatMiddle",e.target.value)}/></div><div><FL>Last</FL><FI value={d.wFatLast} onChange={e=>upd("wFatLast",e.target.value)}/></div></div>
                <div><FL>9. Father's Citizenship</FL><FI value={d.wFatCit} onChange={e=>upd("wFatCit",e.target.value)}/></div>
                <div style={g3}><div><FL>10. Mother First</FL><FI value={d.wMotFirst} onChange={e=>upd("wMotFirst",e.target.value)}/></div><div><FL>Middle</FL><FI value={d.wMotMiddle} onChange={e=>upd("wMotMiddle",e.target.value)}/></div><div><FL>Last</FL><FI value={d.wMotLast} onChange={e=>upd("wMotLast",e.target.value)}/></div></div>
                <div><FL>11. Mother's Citizenship</FL><FI value={d.wMotCit} onChange={e=>upd("wMotCit",e.target.value)}/></div>
</div>
)}
{sec === "consent" && (
<div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
<div style={{ display:"flex", flexDirection:"column", gap:12 }}>
<div style={{ fontFamily:F.head, fontWeight:700, fontSize:14, color:T.primary, textTransform:"uppercase", letterSpacing:".08em" }}>Husband — Person giving consent / advice</div>
                <div style={g3}><div><FL>12. Consent Giver First</FL><FI value={d.hConFirst} onChange={e=>upd("hConFirst",e.target.value)}/></div><div><FL>Middle</FL><FI value={d.hConMiddle} onChange={e=>upd("hConMiddle",e.target.value)}/></div><div><FL>Last</FL><FI value={d.hConLast} onChange={e=>upd("hConLast",e.target.value)}/></div></div>
                <div style={g2}><div><FL>13. Relationship</FL><FI value={d.hConRel} onChange={e=>upd("hConRel",e.target.value)}/></div><div><FL>14. Consent Giver Residence</FL><FI value={d.hConRes} onChange={e=>upd("hConRes",e.target.value)}/></div></div>
</div>
<div style={{ display:"flex", flexDirection:"column", gap:12 }}>
<div style={{ fontFamily:F.head, fontWeight:700, fontSize:14, color:T.primary, textTransform:"uppercase", letterSpacing:".08em" }}>Wife — Person giving consent / advice</div>
                <div style={g3}><div><FL>12. Consent Giver First</FL><FI value={d.wConFirst} onChange={e=>upd("wConFirst",e.target.value)}/></div><div><FL>Middle</FL><FI value={d.wConMiddle} onChange={e=>upd("wConMiddle",e.target.value)}/></div><div><FL>Last</FL><FI value={d.wConLast} onChange={e=>upd("wConLast",e.target.value)}/></div></div>
                <div style={g2}><div><FL>13. Relationship</FL><FI value={d.wConRel} onChange={e=>upd("wConRel",e.target.value)}/></div><div><FL>14. Consent Giver Residence</FL><FI value={d.wConRes} onChange={e=>upd("wConRes",e.target.value)}/></div></div>
</div>
</div>
)}
{sec === "details" && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ fontFamily:F.head, fontWeight:700, fontSize:14, color:T.sub, textTransform:"uppercase", letterSpacing:".08em" }}>15. Place of Marriage</div>
              <div style={g3}>
                <div><FL>Office/House/Church/Mosque of</FL><FI value={d.placeVenue} onChange={e=>upd("placeVenue",e.target.value)}/></div>
                <div><FL>City / Municipality</FL><FI value={d.placeCityMun} onChange={e=>upd("placeCityMun",e.target.value)}/></div>
                <div><FL>Province</FL><FI value={d.placeProvince} onChange={e=>upd("placeProvince",e.target.value)}/></div>
              </div>
              <div style={{ fontFamily:F.head, fontWeight:700, fontSize:14, color:T.sub, textTransform:"uppercase", letterSpacing:".08em", marginTop:8 }}>16. Date of Marriage</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr", gap:10 }}>
                <div><FL>Day</FL><FI value={d.marDay} onChange={e=>upd("marDay",e.target.value)} placeholder="e.g., 12"/></div>
                <div><FL>Month</FL><FI value={d.marMonth} onChange={e=>upd("marMonth",e.target.value)} placeholder="e.g., September"/></div>
                <div><FL>Year</FL><FI value={d.marYear} onChange={e=>upd("marYear",e.target.value)} placeholder="e.g., 2026"/></div>
                <div><FL>17. Time</FL><FI value={d.marTime} onChange={e=>upd("marTime",e.target.value)} placeholder="e.g., 10:00"/></div>
                <div><FL>AM / PM</FL><FS value={d.marAMPM} onChange={e=>upd("marAMPM",e.target.value)}><option>AM</option><option>PM</option></FS></div>
              </div>
              <div style={{ marginTop:10, padding:14, background:T.priLight, borderRadius:8, border:`1px solid ${T.borderMd}`, fontSize:15, color:T.sub }}>
                <strong>Item 18 — Certification of Contracting Parties:</strong> Signatures of husband and wife are affixed on the printed certificate at the time of ceremony.
              </div>
            </div>
)}
{sec === "officer" && (
<div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ fontFamily:F.head, fontWeight:700, fontSize:14, color:T.sub, textTransform:"uppercase", letterSpacing:".08em" }}>19. Certification of the Solemnizing Officer</div>
              <div style={g3}>
                <div><FL>Officer Name</FL><FI value={d.solOfficer} onChange={e=>upd("solOfficer",e.target.value)}/></div>
                <div><FL>Position / Designation</FL><FI value={d.solPosition} onChange={e=>upd("solPosition",e.target.value)}/></div>
                <div><FL>Religion / Registry No.</FL><FI value={d.solReligion} onChange={e=>upd("solReligion",e.target.value)}/></div>
              </div>
              <div style={{ border:`1px solid ${T.border}`, borderRadius:8, padding:14 }}>
                <label style={{ display:"flex", alignItems:"flex-start", gap:8, fontSize:16, color:T.text, marginBottom:12 }}>
                  <input type="radio" name="lic-basis" checked={!d.licArt34&&!d.licPD1083}
                    onChange={() => { upd("licArt34",false); upd("licPD1083",false); }} style={{ marginTop:2 }}/>
                  <span><strong>a. Marriage License was required</strong> — provide details below:</span>
                </label>
                <div style={{ ...g3, marginLeft:24 }}>
                  <div><FL>License No.</FL><FI value={d.licNo} onChange={e=>upd("licNo",e.target.value)}/></div>
                  <div><FL>Issued On</FL><FI value={d.licDate} onChange={e=>upd("licDate",e.target.value)} placeholder="e.g., January 5, 2026"/></div>
                  <div><FL>Issued At</FL><FI value={d.licAt} onChange={e=>upd("licAt",e.target.value)} placeholder="Place"/></div>
                </div>
                <label style={{ display:"flex", alignItems:"flex-start", gap:8, fontSize:16, color:T.text, margin:"12px 0 6px" }}>
                  <input type="radio" name="lic-basis" checked={d.licArt34}
                    onChange={() => { upd("licArt34",true); upd("licPD1083",false); }} style={{ marginTop:2 }}/>
                  <span><strong>b. No marriage license</strong> — solemnized under Art. 34, Executive Order No. 209 (5-year cohabitation)</span>
                </label>
                <label style={{ display:"flex", alignItems:"flex-start", gap:8, fontSize:16, color:T.text }}>
                  <input type="radio" name="lic-basis" checked={d.licPD1083}
                    onChange={() => { upd("licArt34",false); upd("licPD1083",true); }} style={{ marginTop:2 }}/>
                  <span><strong>c. Solemnized</strong> in accordance with Presidential Decree No. 1083</span>
                </label>
              </div>
</div>
)}
{sec === "witnesses" && (
<div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ fontFamily:F.head, fontWeight:700, fontSize:14, color:T.sub, textTransform:"uppercase", letterSpacing:".08em", marginTop:4 }}>20. Witnesses (Print Name)</div>
              <div style={g2}>
                <div><FL>Witness 1</FL><FI value={d.wit1} onChange={e=>upd("wit1",e.target.value)}/></div>
                <div><FL>Witness 2</FL><FI value={d.wit2} onChange={e=>upd("wit2",e.target.value)}/></div>
                <div><FL>Witness 3</FL><FI value={d.wit3} onChange={e=>upd("wit3",e.target.value)}/></div>
                <div><FL>Witness 4</FL><FI value={d.wit4} onChange={e=>upd("wit4",e.target.value)}/></div>
              </div>
</div>
)}
{sec === "affSol" && (
              <div style={{ border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
                <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", marginBottom:d.affSolInclude?14:0 }}>
                  <input type="checkbox" checked={d.affSolInclude} onChange={e=>upd("affSolInclude",e.target.checked)}/>
                  <span style={{ fontFamily:F.head, fontSize:14, fontWeight:700, color:T.sub, textTransform:"uppercase", letterSpacing:".08em" }}>Affidavit of Solemnizing Officer</span>
                </label>
                {d.affSolInclude && (
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    <div style={g2}><div><FL>Officer Name</FL><FI value={d.affSolOfficer} onChange={e=>upd("affSolOfficer",e.target.value)}/></div><div><FL>Address</FL><FI value={d.affSolAddr} onChange={e=>upd("affSolAddr",e.target.value)}/></div></div>
                    <div style={g2}><div><FL>Husband's Full Name</FL><FI value={d.affSolH} onChange={e=>upd("affSolH",e.target.value)}/></div><div><FL>Wife's Full Name</FL><FI value={d.affSolW} onChange={e=>upd("affSolW",e.target.value)}/></div></div>
                    <div>
                      <FL>Circumstance (check applicable)</FL>
                      {[["a","a. Article 34 — no legal impediment, qualifications ascertained"],
                        ["b","b. Articulo mortis — at point of death"],
                        ["c","c. Contracting party physically unable to sign"],
                        ["d","d. No transportation available"],
                        ["e","e. Muslim or ethnic community rites"]].map(([v,label]) => (
                        <label key={v} style={{ display:"flex", alignItems:"center", gap:6, fontSize:15, color:T.text, marginBottom:5 }}>
                          <input type="radio" name="aff-sol-circ" checked={d.affSolCirc===v} onChange={() => upd("affSolCirc",v)}/> {label}
                        </label>
                      ))}
                    </div>
                    <div style={g3}><div><FL>Day Signed</FL><FI value={d.affSolDay} onChange={e=>upd("affSolDay",e.target.value)}/></div><div><FL>Month</FL><FI value={d.affSolMonth} onChange={e=>upd("affSolMonth",e.target.value)}/></div><div><FL>At (Place)</FL><FI value={d.affSolAt} onChange={e=>upd("affSolAt",e.target.value)}/></div></div>
                  </div>
                )}
              </div>
)}
{sec === "affDel" && (
              <div style={{ border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
                <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", marginBottom:d.affDelInclude?14:0 }}>
                  <input type="checkbox" checked={d.affDelInclude} onChange={e=>upd("affDelInclude",e.target.checked)}/>
                  <span style={{ fontFamily:F.head, fontSize:14, fontWeight:700, color:T.sub, textTransform:"uppercase", letterSpacing:".08em" }}>Affidavit for Delayed Registration of Marriage</span>
                </label>
                {d.affDelInclude && (
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    <div style={g3}><div><FL>Applicant Name</FL><FI value={d.affDelApplicant} onChange={e=>upd("affDelApplicant",e.target.value)}/></div><div><FL>Civil Status</FL><FI value={d.affDelCivStat} onChange={e=>upd("affDelCivStat",e.target.value)}/></div><div><FL>Residence</FL><FI value={d.affDelRes} onChange={e=>upd("affDelRes",e.target.value)}/></div></div>
                    <div style={g3}><div><FL>Spouse Name</FL><FI value={d.affDelSpouse} onChange={e=>upd("affDelSpouse",e.target.value)}/></div><div><FL>Marriage Date</FL><FI value={d.affDelMarDate} onChange={e=>upd("affDelMarDate",e.target.value)}/></div><div><FL>Marriage Place</FL><FI value={d.affDelMarPlace} onChange={e=>upd("affDelMarPlace",e.target.value)}/></div></div>
                    <div>
                      <FL>Ceremony Type</FL>
                      <div style={{ display:"flex", gap:20, marginTop:4 }}>
                        {[["religious","Religious"],["civil","Civil"],["muslim","Muslim Rites"],["tribal","Tribal Rites"]].map(([v,label]) => (
                          <label key={v} style={{ display:"flex", alignItems:"center", gap:4, fontSize:15, color:T.text }}>
                            <input type="radio" name="aff-del-cer" checked={d.affDelCeremony===v} onChange={() => upd("affDelCeremony",v)}/> {label}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div style={g3}><div><FL>License No.</FL><FI value={d.affDelLicNo} onChange={e=>upd("affDelLicNo",e.target.value)}/></div><div><FL>Issued On</FL><FI value={d.affDelLicOn} onChange={e=>upd("affDelLicOn",e.target.value)}/></div><div><FL>Issued At</FL><FI value={d.affDelLicAt} onChange={e=>upd("affDelLicAt",e.target.value)}/></div></div>
                    <div style={g2}><div><FL>Applicant's Citizenship</FL><FI value={d.affDelApCit} onChange={e=>upd("affDelApCit",e.target.value)}/></div><div><FL>Spouse's Citizenship</FL><FI value={d.affDelSpCit} onChange={e=>upd("affDelSpCit",e.target.value)}/></div></div>
                    <div><FL>Reason for Delay</FL><FT rows={2} value={d.affDelReason} onChange={e=>upd("affDelReason",e.target.value)}/></div>
                    <div style={g3}><div><FL>Day Signed</FL><FI value={d.affDelDay} onChange={e=>upd("affDelDay",e.target.value)}/></div><div><FL>Month</FL><FI value={d.affDelMonth} onChange={e=>upd("affDelMonth",e.target.value)}/></div><div><FL>At (Place)</FL><FI value={d.affDelAt} onChange={e=>upd("affDelAt",e.target.value)}/></div></div>
                  </div>
                )}
              </div>
)}
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 18px", borderTop:`1px solid ${T.border}`, background:T.bg }}>
          <div style={{ display:"flex", gap:8 }}>
            <Btn variant="ghost" size="sm" disabled={idx===0} onClick={() => setSec(MAR_SECTIONS[Math.max(0,idx-1)].id)}>Previous</Btn>
            <Btn variant="ghost" size="sm" disabled={idx===MAR_SECTIONS.length-1} onClick={() => setSec(MAR_SECTIONS[Math.min(MAR_SECTIONS.length-1,idx+1)].id)}>Next section</Btn>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
            <Btn variant="primary" onClick={() => { onSave(d); onClose(); }}>Save Form 97 Data</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── SIDEBAR ────────────────────────────────────────────── */

const NAV_ICON: Record<View, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  dashboard:LayoutDashboard, requests:Inbox, calendar:CalendarDays, book:BookOpen, certificates:FileText,
  issuance:ClipboardList, reports:BarChart3, staff:Users, services:SlidersHorizontal, settings:Settings, audit:ShieldCheck,
};
/* Plain-language "how to use this page" steps, shown from the header Help button */
const VIEW_HELP: Record<View, string[]> = {
  dashboard:["See today's schedule and pending work at a glance.","Click any item to jump straight to it."],
  requests:["Find a request with the search box or status filters.","Open it, check the documents, then press Verify → Approve.","Record the OR No. once the fee is paid."],
  calendar:["Approved appointments appear automatically.","Use \"Add Activity\" for parish Masses, holidays, or closed office days.","The system warns you about schedule conflicts."],
  book:["Record the Book, Page and Entry No. from the physical register.","Corrections always require a reason."],
  certificates:["Choose the approved request.","Press Preview to check the details, then Print & Issue."],
  issuance:["Every printed certificate is listed here.","Search by name or certificate number. Records cannot be deleted."],
  reports:["Choose a report type.","Set the date range, then press Generate.","Print or Export to CSV."],
  staff:["Add staff and set their role.","Deactivate an account to remove access — accounts are never deleted."],
  services:["Set fees and scheduling rules for each service.","Changes apply to new requests only."],
  settings:["Update the parish profile, office hours, and logo.","Make regular backups of the data."],
  audit:["Every action is recorded automatically.","Filter by user, module, or date to find an event."],
};
const NAV_OPS: { view: View; label: string }[] = [
  { view:"dashboard",    label:"Dashboard" },
  { view:"requests",     label:"Requests" },
  { view:"calendar",     label:"Calendar" },
  { view:"book",         label:"Book Entity" },
  { view:"certificates", label:"Certificates" },
  { view:"issuance",     label:"Certificate Issuance" },
  { view:"reports",      label:"Reports" },
];
const NAV_ADMIN: { view: View; label: string }[] = [
  { view:"staff",    label:"Staff Accounts" },
  { view:"services", label:"Service Configuration" },
  { view:"settings", label:"System Settings" },
];
const VIEW_LABEL: Record<View, string> = {
  dashboard:"Dashboard", requests:"Requests", calendar:"Calendar of Activities", book:"Book Entity",
  certificates:"Certificates", issuance:"Certificate Issuance", reports:"Reports", staff:"Staff Accounts",
  services:"Service Configuration", settings:"System Settings", audit:"Activity Logs / Audit Logs",
};
function canSee(v: View, a: Auth) {
  if (v === "audit") return a.superadmin;
  if (NAV_ADMIN.some(n => n.view === v)) return a.role === "admin";
  return true;
}

function Sidebar({ view, setView, auth, pending, onLogout }:
  { view: View; setView: (v: View) => void; auth: Auth; pending: number; onLogout: () => void }) {
  const item = (n: { view: View; label: string }) => {
    const active = view === n.view;
    return (
      <button key={n.view} onClick={() => setView(n.view)}
        aria-current={active ? "page" : undefined} className="sarms-nav"
        style={{ width:"calc(100% - 20px)", margin:"2px 10px", display:"flex", alignItems:"center", gap:12, padding:"11px 14px", textAlign:"left",
          fontSize:15, fontWeight: active ? 700 : 500, lineHeight:1.3, minHeight:46, borderRadius:10,
          color: active ? "#fff" : T.text,
          background: active ? T.priHov : "transparent",
          border:"none", cursor:"pointer", fontFamily:F.head }}>
        {(() => { const I = NAV_ICON[n.view]; return <I size={20} strokeWidth={active ? 2.4 : 2}/>; })()}
        <span style={{ flex:1 }}>{n.label}</span>
        {n.view === "requests" && pending > 0 && (
          <span title={`${pending} pending`} style={{ fontFamily:F.head, fontSize:13, fontWeight:700, minWidth:26, padding:"2px 8px", borderRadius:99, background: active ? "#fff" : T.red, color: active ? T.priHov : "#fff", textAlign:"center" }}>{pending}</span>
        )}
      </button>
    );
  };
  const group = (label: string) => (
    <div style={{ padding:"18px 24px 6px", fontFamily:F.head, fontSize:12, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:".14em" }}>{label}</div>
  );
  return (
    <aside aria-label="Main navigation" style={{ width:"clamp(240px, 15vw, 280px)", minHeight:"100vh", background:T.surface, borderRight:`1px solid ${T.border}`,
      display:"flex", flexDirection:"column", flexShrink:0, position:"sticky", top:0, height:"100vh" }}>

      {/* Logo */}
      <div style={{ padding:"16px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:40, height:40, flexShrink:0 }}>
          <ImageWithFallback src={logoSrc} alt="PdSPA" style={{ width:"100%", height:"100%", objectFit:"contain" }}/>
        </div>
        <div style={{ minWidth:0 }}>
          <div style={{ fontFamily:F.display, fontSize:"clamp(15px, 1.05vw, 18px)", fontWeight:800, color:T.priHov, lineHeight:1.15, letterSpacing:"-.02em", whiteSpace:"nowrap" }}>San Pedro Apostol</div>
          <div style={{ fontFamily:F.head, fontSize:11, fontWeight:600, color:T.muted, lineHeight:1.3, marginTop:4, textTransform:"uppercase", letterSpacing:".14em" }}>Parish Records · SARMS</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:"4px 0 8px", overflowY:"auto" }}>
        {group("Operations")}
        {NAV_OPS.map(item)}
        {auth.role === "admin" && <>{group("Administration")}{NAV_ADMIN.map(item)}</>}
        {auth.superadmin && <>{group("Superadmin")}{item({ view:"audit", label:"Activity Logs / Audit Logs" })}</>}
      </nav>

      {/* User */}
      <div style={{ padding:"14px 18px", borderTop:`1px solid ${T.border}`, background:T.bg }}>
        <div style={{ fontSize:15, color:T.muted }}>Signed in as</div>
        <div style={{ fontFamily:F.head, fontSize:16, fontWeight:700, color:T.text }}>{auth.name}</div>
        <div style={{ fontSize:14, color:T.muted, marginBottom:6 }}>@{auth.username}</div>
        <div style={{ marginBottom:8 }}><RoleTag a={auth}/></div>
        <Btn variant="ghost" onClick={onLogout} style={{ width:"100%" }}><LogOut size={18}/> Sign out</Btn>
      </div>
    </aside>
  );
}

/* ─── LOGIN ──────────────────────────────────────────────── */
const DEMO = [
  { label:"Staff",                   u:"msantos", p:"staff123" },
  { label:"Admin",                   u:"aquinto", p:"admin123" },
  { label:"Admin (designated Superadmin)", u:"jreyes",  p:"admin123" },
];

function LoginView({ accounts, onLogin, onFail, onPublic }:
  { accounts: StaffAccount[]; onLogin: (a: StaffAccount) => void; onFail: (username: string, why: string) => void; onPublic: () => void }) {
  const [user,    setUser]    = useState("");
  const [pass,    setPass]    = useState("");
  const [showPw,  setShowPw]  = useState(false);
  const [err,     setErr]     = useState("");
  const [busy,    setBusy]    = useState(false);
  const [fails,   setFails]   = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [, tick] = useState(0);

  useEffect(() => {
    if (!lockedUntil) return;
    const i = setInterval(() => { tick(x => x + 1); if (Date.now() > lockedUntil) { setLockedUntil(0); setFails(0); setErr(""); } }, 1000);
    return () => clearInterval(i);
  }, [lockedUntil]);
  const lockLeft = lockedUntil ? Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000)) : 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    if (lockLeft) return;
    const u = user.trim().toLowerCase();
    if (!u || !pass) { setErr("Enter your username and password."); return; }
    setBusy(true);
    await new Promise(r => setTimeout(r, 500));
    const acc = accounts.find(a => a.username === u);
    if (!acc || DEMO_CREDENTIALS[u] !== pass) {
      const n = fails + 1; setFails(n);
      onFail(u, acc ? "incorrect password" : "no matching account");
      setBusy(false); setPass("");
      if (n >= 3) { setLockedUntil(Date.now() + 30000); setErr("Too many failed attempts. Sign-in is paused for 30 seconds."); }
      else setErr(`Incorrect username or password. ${3 - n} attempt${3 - n === 1 ? "" : "s"} remaining.`);
      return;
    }
    if (acc.status === "inactive") {
      onFail(u, "account inactive");
      setBusy(false); setErr("This account is inactive. Please contact the parish administrator.");
      return;
    }
    onLogin(acc);
  }

  const ulInp: React.CSSProperties = {
    width:"100%", border:"none", borderBottom:"1.5px solid #D6CC9A",
    padding:"10px 0", fontSize:17, fontFamily:F.body,
    color:"#1A1400", background:"transparent", outline:"none",
  };

  return (
    <div style={{ minHeight:"100vh", position:"relative", isolation:"isolate", overflow:"hidden",
      display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div aria-hidden style={{ position:"absolute", inset:-60, zIndex:-2,
        background:`url(${parishBanner}) center/cover no-repeat`, filter:"blur(14px)", transform:"scale(1.05)" }} />
      <div aria-hidden style={{ position:"absolute", inset:0, zIndex:-1,
        background:"linear-gradient(rgba(255,253,245,.5), rgba(255,253,245,.65))" }} />

      <div style={{ display:"flex", width:"100%", maxWidth:780,
        borderRadius:16, overflow:"hidden", border:"1px solid rgba(201,150,10,.18)",
        boxShadow:"0 1px 2px rgba(61,31,0,.08), 0 8px 20px -6px rgba(61,31,0,.18), 0 32px 72px -16px rgba(61,31,0,.38)" }}>

        {/* Left — gradient panel with logo */}
        <div style={{ flex:"0 0 340px", background:"linear-gradient(160deg,#F5A623 0%,#FDDEA0 100%)",
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          padding:"48px 32px", gap:20, position:"relative", zIndex:1,
          boxShadow:"6px 0 24px -8px rgba(107,63,0,.35)" }}>
          <div style={{ width:180, height:180 }}>
            <ImageWithFallback src={logoSrc} alt="PdSPA Seal"
              style={{ width:"100%", height:"100%", objectFit:"contain", filter:"drop-shadow(0 2px 8px rgba(0,0,0,.15))" }}/>
          </div>
          <div style={{ textAlign:"center" }}>
            <p style={{ fontFamily:F.head, fontSize:12, fontWeight:600, color:"#6B3F00", margin:0, letterSpacing:".22em", textTransform:"uppercase" }}>Parroquia de</p>
            <p style={{ fontFamily:F.display, fontSize:28, fontWeight:800, color:"#3D1F00", margin:"5px 0 12px", lineHeight:1.15, letterSpacing:"-.035em", whiteSpace:"nowrap" }}>San Pedro Apostol</p>
            <p style={{ fontFamily:F.head, fontSize:15, fontWeight:700, color:"#3D1F00", margin:0, lineHeight:1.35, letterSpacing:".01em" }}>
              PdSPA Record<br/>Management System
            </p>
            <p style={{ fontFamily:F.head, fontSize:12, color:"#6B3F00", margin:"12px 0 0", letterSpacing:".16em", textTransform:"uppercase", fontWeight:600 }}>Staff &amp; Admin Access</p>
          </div>
        </div>

        {/* Right — login form */}
        <div style={{ flex:1, background:"#FFFFFF",
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          padding:"48px 48px 40px" }}>

          <p aria-hidden style={{ fontFamily:F.display, fontSize:25, fontWeight:700, color:"#8A6706", margin:"0 0 8px", lineHeight:1.15, letterSpacing:"-.025em" }}>Welcome</p>
          <h1 style={{ fontFamily:F.head, fontSize:20, fontWeight:800, color:"#C9960A", letterSpacing:".18em",
            textTransform:"uppercase", margin:"0 0 34px" }}>
            User Login
          </h1>

          <form onSubmit={submit} noValidate style={{ width:"100%", maxWidth:300, display:"flex", flexDirection:"column", gap:28 }}>
            <div>
              <input type="text" placeholder="Username" value={user} autoComplete="username" disabled={!!lockLeft}
                onChange={e => { setUser(e.target.value); setErr(""); }}
                style={{ ...ulInp, borderBottomColor: err ? T.red : "#D6CC9A" }}
                onFocus={e => (e.currentTarget.style.borderBottomColor="#C9960A")}
                onBlur={e  => (e.currentTarget.style.borderBottomColor="#D6CC9A")}/>
            </div>

            <div style={{ position:"relative" }}>
              <input type={showPw ? "text" : "password"} placeholder="Password" value={pass} disabled={!!lockLeft}
                autoComplete="current-password"
                onChange={e => { setPass(e.target.value); setErr(""); }}
                style={{ ...ulInp, paddingRight:28, borderBottomColor: err ? T.red : "#D6CC9A" }}
                onFocus={e => (e.currentTarget.style.borderBottomColor="#C9960A")}
                onBlur={e  => (e.currentTarget.style.borderBottomColor="#D6CC9A")}/>
              <button type="button" onClick={() => setShowPw(v => !v)} aria-label={showPw ? "Hide password" : "Show password"}
                style={{ position:"absolute", right:0, top:"50%", transform:"translateY(-50%)",
                  background:"none", border:"none", cursor:"pointer", padding:0, color:"#A8964A", fontSize:19 }}>
                {showPw ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>

            {err && <p role="alert" style={{ margin:"-16px 0 0", fontSize:15, color:T.red, lineHeight:1.4 }}>{err}{lockLeft ? ` (${lockLeft}s)` : ""}</p>}

            <button type="submit" disabled={busy || !!lockLeft}
              style={{ width:"100%", padding:"12px", borderRadius:99,
                background:"#C9960A", color:"#fff", border:"none", cursor:busy||lockLeft?"not-allowed":"pointer",
                fontFamily:F.head, fontSize:16, fontWeight:800, letterSpacing:".16em", textTransform:"uppercase",
                opacity:busy||lockLeft?.6:1, transition:"opacity .15s",
                boxShadow:"0 2px 4px rgba(150,105,0,.25), 0 8px 18px -6px rgba(201,150,10,.55)" }}>
              {busy ? "Signing in..." : "Login"}
            </button>
          </form>

          <div style={{ marginTop:32, width:"100%", maxWidth:300 }}>
            <p style={{ fontFamily:F.head, fontSize:12, color:T.muted, textTransform:"uppercase", letterSpacing:".14em",
              fontWeight:700, marginBottom:8 }}>Demo accounts</p>
            {DEMO.map(d => (
              <button key={d.u} onClick={() => { setUser(d.u); setPass(d.p); setErr(""); }}
                style={{ display:"flex", justifyContent:"space-between", width:"100%",
                  padding:"4px 0", background:"none", border:"none", cursor:"pointer",
                  fontFamily:F.body, fontSize:14, color:T.sub }}>
                <span style={{ fontWeight:600 }}>{d.label}</span>
                <span style={{ fontFamily:F.body, letterSpacing:".03em", color:T.muted }}>{d.u} / {d.p}</span>
              </button>
            ))}
            <p style={{ fontSize:13, color:T.muted, marginTop:10, lineHeight:1.5 }}>All sign-in attempts are recorded. Contact the parish administrator for account access.</p>
            <button type="button" onClick={onPublic} style={{ ...linkBtn, fontSize:14, marginTop:6 }}>← Parishioner website</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── DASHBOARD ──────────────────────────────────────────── */
interface UpItem { key: string; date: string; start: string; end: string; allDay: boolean; title: string; cat: string; kind: "Appointment"|"Activity"; sub: string; }
function buildUpcoming(appts: Appointment[], activities: Activity[], days = 21): UpItem[] {
  const from = todayISO();
  const toD = new Date(); toD.setDate(toD.getDate() + days);
  const to = `${toD.getFullYear()}-${pad(toD.getMonth()+1)}-${pad(toD.getDate())}`;
  const items: UpItem[] = [
    ...activities.filter(a => a.status === "active" && a.date >= from && a.date <= to).map(a => ({
      key:a.id, date:a.date, start:a.start, end:a.end, allDay:a.allDay, title:a.title, cat:a.category, kind:"Activity" as const, sub:a.location })),
    ...appts.filter(r => r.status === "scheduled" && r.apprDate >= from && r.apprDate <= to).map(r => ({
      key:r.id, date:r.apprDate, start:r.apprStart, end:r.apprEnd, allDay:false, title:`${r.sacramentType} — ${r.subjectName}`, cat:r.sacramentType, kind:"Appointment" as const, sub:r.id })),
  ];
  return items.sort((a, b) => (a.date + (a.allDay ? "00:00" : a.start)).localeCompare(b.date + (b.allDay ? "00:00" : b.start)));
}

function DashboardView({ appts, activities, issuance, logs, accounts }:
  { appts: Appointment[]; activities: Activity[]; issuance: Issuance[]; logs: AuditLog[]; accounts: StaffAccount[] }) {
  const { auth, go } = useApp();
  const isAdmin = auth.role === "admin";
  const count = (s: ReqStatus) => appts.filter(a => a.status === s).length;
  const ym = todayISO().slice(0,7);
  const issuedMonth = issuance.filter(i => i.status === "issued" && i.issuedAt.startsWith(ym)).length;
  const upcoming = buildUpcoming(appts, activities).slice(0, 7);

  const chartData = SACR_LIST.map(t => ({
    name: t === "Good Standing/Membership" ? "Good Stdg." : t === "First Holy Communion" ? "Communion" : t.replace(" Certificate",""),
    full: t, count: appts.filter(a => a.sacramentType === t).length,
  })).filter(x => x.count > 0);

  const stat = (label: string, val: number, note: string, onClick: () => void, accent?: string) => (
    <button onClick={onClick} style={{ textAlign:"left", background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:"16px 18px", cursor:"pointer",
      borderTop:`3px solid ${accent ?? T.border}` }}>
      <div style={{ fontFamily:F.head, fontSize:12, fontWeight:700, color:T.sub, textTransform:"uppercase", letterSpacing:".1em", marginBottom:8 }}>{label}</div>
      <div style={{ fontFamily:F.head, fontSize:32, fontWeight:800, color:T.text, lineHeight:1, letterSpacing:"-.02em" }}>{val}</div>
      <div style={{ fontSize:14, color:T.muted, marginTop:4 }}>{note}</div>
    </button>
  );

  const shortcuts: { label: string; sub: string; v: View }[] = [
    { label:"Review Pending Requests", sub:`${count("pending")} awaiting verification`, v:"requests" },
    { label:"Open Calendar",           sub:"Activities & approved schedules", v:"calendar" },
    { label:"Encode Book Entity",      sub:"Digital index of parish registers", v:"book" },
    { label:"View Certificate Issuance", sub:"Permanent issuance history", v:"issuance" },
  ];
  const adminShortcuts: { label: string; sub: string; v: View }[] = [
    { label:"Staff Accounts", sub:`${accounts.filter(a => a.status === "active").length} active accounts`, v:"staff" },
    { label:"Service Configuration", sub:"Fees, durations, scheduling rules", v:"services" },
    { label:"Reports", sub:"Generate, preview, export", v:"reports" },
    { label:"Calendar", sub:"Calendar administration", v:"calendar" },
    { label:"System Settings", sub:"Parish profile, backup", v:"settings" },
    ...(auth.superadmin ? [{ label:"Activity Logs / Audit Logs", sub:"Read-only audit history", v:"audit" as View }] : []),
  ];

  const weekAgo = (() => { const d = new Date(); d.setDate(d.getDate() - 7); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; })();
  const staffSummary = accounts.map(a => {
    const mine = logs.filter(l => l.username === a.username && l.at.slice(0,10) >= weekAgo);
    return { a, total: mine.length, last: mine[0]?.at ?? "" };
  });

  const shortcutGrid = (list: typeof shortcuts) => (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, padding:12 }}>
      {list.map(s => (
        <button key={s.label} onClick={() => go(s.v, s.v === "requests" ? {} : undefined)}
          style={{ textAlign:"left", padding:"10px 12px", border:`1px solid ${T.border}`, borderRadius:6, background:T.bg, cursor:"pointer" }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = T.primary)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}>
          <div style={{ fontFamily:F.head, fontSize:15, fontWeight:600, color:T.text }}>{s.label} <span style={{ color:T.primary }}>→</span></div>
          <div style={{ fontSize:14, color:T.muted, marginTop:2 }}>{s.sub}</div>
        </button>
      ))}
    </div>
  );

  return (
    <div>
      {(() => {
        const now = new Date();
        const h = now.getHours();
        const greet = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
        const first = auth.name.split(" ")[0];
        const todayStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
        const todayCount = upcoming.filter(u => u.date === todayStr).length;
        return (
          <section style={{ position:"relative", overflow:"hidden", borderRadius:14, marginBottom:18, padding:"34px 40px",
            background:`linear-gradient(115deg, #FFFDF5 0%, #FBF1D3 48%, #F2DC9A 100%)`, border:`1px solid ${T.borderMd}`,
            boxShadow:"0 10px 30px -18px rgba(140,100,0,.45)" }}>
            {/* Parish banner photo — church & procession, faded into the gold wash */}
            <img src={parishBanner as string} alt="" aria-hidden style={{ position:"absolute", top:0, right:0, height:"100%", width:"62%",
              objectFit:"cover", objectPosition:"right 40%",
              WebkitMaskImage:"linear-gradient(90deg, transparent 0%, #000 45%)", maskImage:"linear-gradient(90deg, transparent 0%, #000 45%)" }}/>
            {/* Arched window motif */}
            <svg viewBox="0 0 220 260" aria-hidden style={{ display:"none" }}>
              <g fill="none" stroke="#C9960A" strokeWidth="2">
                <path d="M20 260 V110 A90 90 0 0 1 200 110 V260"/>
                <path d="M45 260 V115 A65 65 0 0 1 175 115 V260"/>
                <path d="M110 50 V260 M45 160 H175"/>
                <circle cx="110" cy="105" r="22"/>
                <path d="M110 83 V127 M88 105 H132"/>
              </g>
            </svg>
            <div style={{ position:"absolute", right:-60, bottom:-90, width:300, height:300, borderRadius:"50%",
              display:"none" }}/>
            <div style={{ position:"relative", display:"flex", alignItems:"center", gap:28 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:F.head, fontSize:12, fontWeight:700, color:T.priHov, textTransform:"uppercase", letterSpacing:".2em", marginBottom:6 }}>
                  Parroquia de San Pedro Apostol · Vinzons
                </div>
                <h1 style={{ fontFamily:F.display, margin:"0 0 10px", fontSize:"clamp(38px, 3vw, 52px)", lineHeight:1.08, fontWeight:800, letterSpacing:"-.04em", color:T.text }}>
                  {greet}, <span style={{ color:T.priHov }}>{first}</span>
                </h1>
                <div style={{ fontFamily:F.body, fontSize:18, color:T.sub, maxWidth:560, lineHeight:1.5 }}>
                  {count("pending") > 0
                    ? <>You have <b style={{ color:T.text }}>{count("pending")} pending request{count("pending") === 1 ? "" : "s"}</b> and <b style={{ color:T.text }}>{todayCount} activit{todayCount === 1 ? "y" : "ies"}</b> today.</>
                    : <>All requests are clear — <b style={{ color:T.text }}>{todayCount} activit{todayCount === 1 ? "y" : "ies"}</b> on today's calendar.</>}
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 }}>
        {stat("Pending Requests",   count("pending"),   "Awaiting verification", () => go("requests"), STATUS_CFG.pending.col)}
        {stat("Verified Requests",  count("verified"),  "OR recorded · awaiting schedule/completion", () => go("requests"), STATUS_CFG.verified.col)}
        {stat("Scheduled Requests", count("scheduled"), "Final schedule approved", () => go("requests"), STATUS_CFG.scheduled.col)}
        {stat("Certificates Issued This Month", issuedMonth, new Date().toLocaleDateString("en-PH",{ month:"long", year:"numeric" }), () => go("issuance"), T.primary)}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1.45fr 1fr", gap:16, alignItems:"start" }}>
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <Card>
            <CardHead title="Upcoming Activities" sub="Approved appointments and parish activities · next 3 weeks"
              right={<Btn variant="outline" size="sm" onClick={() => go("calendar")}>Open Calendar</Btn>}/>
            {upcoming.length === 0 && <p style={{ padding:"20px 16px", fontSize:16, color:T.muted, textAlign:"center", margin:0 }}>Nothing scheduled in the next three weeks.</p>}
            {upcoming.map(u => {
              const d = new Date(u.date + "T00:00:00");
              const isAppt = u.kind === "Appointment";
              const col = isAppt ? (SACR[u.cat]?.col ?? T.sub) : (ACTIVITY_CATS[u.cat]?.col ?? T.sub);
              return (
                <div key={u.key} style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 14px", borderBottom:`1px solid ${T.border}` }}>
                  <div style={{ flexShrink:0, width:46, textAlign:"center", padding:"4px 6px", background:T.priLight, border:`1px solid ${T.borderMd}`, borderRadius:6 }}>
                    <div style={{ fontFamily:F.head, fontSize:12, fontWeight:700, color:col, textTransform:"uppercase", letterSpacing:".08em" }}>{d.toLocaleDateString("en-PH",{month:"short"})}</div>
                    <div style={{ fontFamily:F.head, fontSize:21, fontWeight:800, color:T.text, lineHeight:1.1 }}>{d.getDate()}</div>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:16, fontWeight:600, color:T.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.title}</div>
                    <div style={{ display:"flex", gap:6, alignItems:"center", marginTop:3, flexWrap:"wrap" }}>
                      {isAppt
                        ? <span style={{ padding:"1px 7px", borderRadius:4, fontSize:14, fontWeight:600, border:`1px solid ${col}`, color:col }}>Appointment</span>
                        : <CatTag cat={u.cat}/>}
                      <span style={{ fontSize:14, color:T.muted }}>{fmtRange(u.start, u.end, u.allDay)} · {u.sub}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </Card>

          <Card>
            <CardHead title="Requests by Service" sub="All requests on file"/>
            <div style={{ padding:16 }}><SimpleBarChart data={chartData} height={190}/></div>
          </Card>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <Card>
            <CardHead title="Shortcuts"/>
            {shortcutGrid(shortcuts)}
          </Card>

          {isAdmin && (
            <Card>
              <CardHead title="Administration" sub={auth.superadmin ? "Signed in as designated Superadmin" : undefined}/>
              {shortcutGrid(adminShortcuts)}
            </Card>
          )}

          {isAdmin && (
            <Card>
              <CardHead title="Staff Activity Summary" sub="Logged actions · last 7 days"/>
              {staffSummary.map(({ a, total, last }, i) => (
                <div key={a.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, padding:"9px 14px",
                  borderBottom: i < staffSummary.length - 1 ? `1px solid ${T.border}` : "none", opacity: a.status === "inactive" ? .6 : 1 }}>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:15, fontWeight:600, color:T.text }}>{a.name} {a.status === "inactive" && <SPill s="inactive"/>}</div>
                    <div style={{ fontSize:14, color:T.muted }}>{a.position} · last action {last ? fmtDT(last) : "—"}</div>
                  </div>
                  <span style={{ fontFamily:F.head, fontSize:19, fontWeight:800, color:T.text }}>{total}</span>
                </div>
              ))}
            </Card>
          )}

          {!isAdmin && (
            <Card>
              <CardHead title="Needs Attention" right={<button style={linkBtn} onClick={() => go("requests")}>All requests →</button>}/>
              {appts.filter(a => a.status === "pending" || a.status === "verified").slice(0, 6).map((a, i, arr) => (
                <button key={a.id} onClick={() => go("requests", { requestId:a.id })}
                  style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, padding:"9px 14px",
                    background:"none", border:"none", borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : "none", cursor:"pointer", textAlign:"left" }}>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:15, fontWeight:600, color:T.text }}>{a.parishioner}</div>
                    <div style={{ fontSize:14, color:T.muted }}>{a.id} · {a.sacramentType}</div>
                  </div>
                  <Badge status={a.status}/>
                </button>
              ))}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── REQUESTS ───────────────────────────────────────────── */
type SetA<X> = React.Dispatch<React.SetStateAction<X>>;

function SearchBox({ value, set, placeholder, width = 280 }: { value: string; set: (v: string) => void; placeholder: string; width?: number }) {
  return <FI value={value} onChange={e => set(e.target.value)} placeholder={placeholder} style={{ width }}/>;
}

function EmptyRow({ cols, text }: { cols: number; text: string }) {
  return <tr><td colSpan={cols} style={{ ...TD, textAlign:"center", color:T.muted, padding:"28px 12px" }}>{text}</td></tr>;
}

function ConflictPanel({ conflicts }: { conflicts: Conflict[] }) {
  if (!conflicts.length) return <Notice tone="ok">No conflicts found for this date and time.</Notice>;
  const hard = conflicts.some(c => c.hard);
  return (
    <Notice tone={hard ? "error" : "warn"}>
      <div style={{ fontWeight:700, marginBottom:4 }}>
        {hard ? "This date is a Closed Office Day. Scheduling is not allowed." : "Schedule conflict detected. This time overlaps with an existing parish activity."}
      </div>
      {conflicts.map((c, i) => <div key={i}>• <b>{c.label}</b>: {c.detail}</div>)}
    </Notice>
  );
}

function RequestsView({ appts, setAppts, activities, services, books, issuance, focusId, clearFocus, openMarriage }:
  { appts: Appointment[]; setAppts: SetA<Appointment[]>; activities: Activity[]; services: Service[];
    books: BookEntry[]; issuance: Issuance[]; focusId?: string; clearFocus: () => void; openMarriage: (id: string) => void }) {
  const [filter, setFilter] = useState<ReqStatus | "all">("all");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(focusId ?? null);
  useEffect(() => { if (focusId) { setOpenId(focusId); clearFocus(); } }, [focusId]);

  const rows = appts.filter(a => (filter === "all" || a.status === filter) &&
    (!q || [a.id, a.parishioner, a.subjectName, a.sacramentType, a.orNo].some(v => v.toLowerCase().includes(q.toLowerCase()))))
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  const open = appts.find(a => a.id === openId);
  if (open) return <RequestDetail r={open} setAppts={setAppts} appts={appts} activities={activities} services={services}
    books={books} issuance={issuance} onBack={() => setOpenId(null)} openMarriage={openMarriage}/>;

  return (
    <div>
      <PageHead title="Requests" sub="All service requests from parishioners · one queue for every status"
        right={<SearchBox value={q} set={setQ} placeholder="Search ID, name, service or OR No."/>}/>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
        {(["all", ...REQ_STATUSES] as const).map(s => (
          <button key={s} style={chipBtn(filter === s)} onClick={() => setFilter(s)}>
            {s === "all" ? "All" : STATUS_CFG[s].label}
            <span style={{ fontSize:13, color:T.muted }}>{s === "all" ? appts.length : appts.filter(a => a.status === s).length}</span>
          </button>
        ))}
      </div>
      <Card>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr>{["ID","Client","Service","Submitted","Preferred Schedule","Approved Schedule","OR No.","Status",""].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.length === 0 && <EmptyRow cols={9} text="No requests match these filters."/>}
              {rows.map(a => (
                <tr key={a.id} style={{ borderTop:`1px solid ${T.border}`, cursor:"pointer" }} onClick={() => setOpenId(a.id)}
                  onMouseEnter={e => (e.currentTarget.style.background = T.bg)} onMouseLeave={e => (e.currentTarget.style.background = "")}>
                  <td style={{ ...TD, fontFamily:F.body, letterSpacing:".03em", fontSize:15 }}>{a.id}</td>
                  <td style={TD}><div style={{ fontWeight:600 }}>{a.parishioner}{a.source === "online" && <span style={{ marginLeft:8, padding:"1px 7px", borderRadius:4, background:T.blueL, color:T.blue, fontFamily:F.head, fontSize:12, fontWeight:700 }}>Online</span>}</div><div style={{ fontSize:14, color:T.muted }}>for {a.subjectName}</div></td>
                  <td style={TD}><TypeTag type={a.sacramentType}/></td>
                  <td style={{ ...TD, fontSize:15 }}>{fmtShort(a.submittedAt)}</td>
                  <td style={{ ...TD, fontSize:15 }}>{a.prefDate ? `${fmtShort(a.prefDate)} · ${fmtTime(a.prefTime)}` : "—"}</td>
                  <td style={{ ...TD, fontSize:15, fontWeight: a.apprDate ? 600 : 400 }}>{a.apprDate ? `${fmtShort(a.apprDate)} · ${fmtRange(a.apprStart, a.apprEnd)}` : "—"}</td>
                  <td style={{ ...TD, fontFamily:F.body, letterSpacing:".03em", fontSize:15 }}>{a.orNo || "—"}</td>
                  <td style={TD}><Badge status={a.status}/></td>
                  <td style={TD}><button style={linkBtn}>Open →</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function RequestDetail({ r, appts, setAppts, activities, services, books, issuance, onBack, openMarriage }:
  { r: Appointment; appts: Appointment[]; setAppts: SetA<Appointment[]>; activities: Activity[]; services: Service[];
    books: BookEntry[]; issuance: Issuance[]; onBack: () => void; openMarriage: (id: string) => void }) {
  const { auth, push, log, go } = useApp();
  const svc = services.find(s => s.name === r.sacramentType);
  const schedulable = svc?.schedulable ?? false;
  const [action, setAction] = useState<null | "verify" | "approve" | "reject" | "complete" | "cancel" | "or">(null);
  const [orNo, setOrNo] = useState(r.orNo); const [orDate, setOrDate] = useState(r.orDate || todayISO());
  const [orErr, setOrErr] = useState("");
  const [ad, setAd] = useState(r.apprDate || r.prefDate); const [as_, setAs] = useState(r.apprStart || r.prefTime);
  const [ae, setAe] = useState(r.apprEnd || (r.prefTime ? addMin(r.prefTime, svc?.duration ?? 60) : ""));
  const [remarks, setRemarks] = useState(""); const [override, setOverride] = useState(""); const [apErr, setApErr] = useState("");

  const conflicts = useMemo(() => findConflicts(ad, as_, ae, activities, appts, { reqId:r.id }), [ad, as_, ae, activities, appts, r.id]);
  const hard = conflicts.some(c => c.hard);
  const patch = (p: Partial<Appointment>) => setAppts(list => list.map(a => a.id === r.id ? { ...a, ...p } : a));
  const base = { module:"Requests", client:r.parishioner, recordType:"Request", recordId:r.id };
  const linkedBook = books.find(b => b.linkedRequestId === r.id);
  const linkedCert = issuance.filter(i => i.requestId === r.id);

  function doVerify() {
    if (!orNo.trim()) { setOrErr("Official Receipt No. is required to verify."); return; }
    if (appts.some(a => a.id !== r.id && a.orNo && a.orNo.toLowerCase() === orNo.trim().toLowerCase())) { setOrErr("This OR No. is already recorded on another request."); return; }
    patch({ status:"verified", orNo:orNo.trim(), orDate, verifiedBy:auth.name, staffNotes: remarks || r.staffNotes });
    log({ ...base, actionType:"Verify", desc:`${who(auth)} verified the ${r.sacramentType} request of ${r.parishioner} with OR No. ${orNo.trim()} at ${clock()}.`, reason:remarks,
      prev:{ Status:"Pending" }, next:{ Status:"Verified", "OR No.":orNo.trim(), "Receipt Date":orDate } });
    push("success", `${r.id} verified.`); setAction(null);
  }
  function doApprove() {
    if (!ad || !as_ || !ae) { setApErr("Date, start time and end time are required."); return; }
    if (toMin(ae) <= toMin(as_)) { setApErr("End time must be after start time."); return; }
    if (hard) { setApErr("Closed Office Day — choose another date."); return; }
    if (conflicts.length && auth.role !== "admin") { setApErr("Resolve the conflict or ask an Admin to approve with an override."); return; }
    if (conflicts.length && !override.trim()) { setApErr("Enter an override reason to approve despite the conflict."); return; }
    patch({ status:"scheduled", apprDate:ad, apprStart:as_, apprEnd:ae, staffNotes: remarks || r.staffNotes });
    log({ ...base, actionType:"Approve Schedule", desc:`${who(auth)} approved the appointment request of ${r.parishioner} for ${fmt(ad)}, ${fmtRange(as_, ae)} at ${clock()}.`,
      reason: [remarks, override && `Conflict override: ${override}`].filter(Boolean).join(" · "),
      prev:{ Status:STATUS_CFG[r.status].label, "Approved Schedule": r.apprDate ? `${r.apprDate} ${r.apprStart}-${r.apprEnd}` : "—" },
      next:{ Status:"Scheduled", "Approved Schedule":`${ad} ${as_}-${ae}` } });
    if (override) log({ ...base, actionType:"Schedule conflict override", desc:`${who(auth)} approved ${r.id} despite a schedule conflict (${conflicts.map(c => c.label).join(", ")}).`, reason:override });
    push("success", `${r.id} scheduled for ${fmtShort(ad)}.`); setAction(null);
  }
  function simple(status: ReqStatus, verb: string, actionType: string) {
    return (reason: string) => {
      patch({ status, staffNotes: reason || r.staffNotes });
      log({ ...base, actionType, desc:`${who(auth)} ${verb} the ${r.sacramentType} request of ${r.parishioner} at ${clock()}.`, reason,
        prev:{ Status:STATUS_CFG[r.status].label }, next:{ Status:STATUS_CFG[status].label } });
      push(status === "completed" ? "success" : "info", `${r.id} marked ${STATUS_CFG[status].label}.`); setAction(null);
    };
  }
  function saveOR(reason: string) {
    if (!orNo.trim()) { push("error", "OR No. cannot be blank."); return; }
    patch({ orNo:orNo.trim(), orDate });
    log({ ...base, actionType:"Correct OR", desc:`${who(auth)} corrected the Official Receipt details of ${r.id} at ${clock()}.`, reason,
      prev:{ "OR No.":r.orNo, "Receipt Date":r.orDate }, next:{ "OR No.":orNo.trim(), "Receipt Date":orDate } });
    push("success", "Official Receipt updated."); setAction(null);
  }

  const open = r.status === "pending" || r.status === "verified" || r.status === "scheduled";
  const section = (title: string, children: React.ReactNode, right?: React.ReactNode) => (
    <Card><CardHead title={title} right={right}/><div style={{ padding:"6px 16px 12px" }}>{children}</div></Card>
  );

  return (
    <div>
      <button onClick={onBack} style={{ ...linkBtn, marginBottom:10 }}>← Back to Requests</button>
      <PageHead title={`${r.sacramentType} · ${r.subjectName}`} sub={`${r.id} · submitted ${fmt(r.submittedAt)}`}
        right={<><Badge status={r.status}/>
          {r.sacramentType === "Marriage" && <Btn variant="outline" size="sm" onClick={() => openMarriage(r.id)}>Form 97 Intake</Btn>}
          <Btn variant="outline" size="sm" onClick={() => go("book", { bookPrefill:r.id })}>{linkedBook ? `Book Entity ${linkedBook.id}` : "Encode Book Entity"}</Btn>
          {PRINTABLE.includes(r.sacramentType) && <Btn variant="outline" size="sm" onClick={() => go("certificates", { certRequestId:r.id })}>Certificates</Btn>}
        </>}/>

      <div style={{ display:"grid", gridTemplateColumns:"1.5fr 1fr", gap:16, alignItems:"start" }}>
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {section("Request Information", <>
            <KV k="Request ID" v={r.id} mono/><KV k="Service" v={<TypeTag type={r.sacramentType}/>}/>
            <KV k="Subject / Recipient" v={r.subjectName}/><KV k="Date of Sacrament" v={r.dateOfSacrament ? fmt(r.dateOfSacrament) : ""}/>
            <KV k="Purpose" v={r.purposeOf}/><KV k="Submitted" v={fmt(r.submittedAt)}/>
            <KV k="Base fee" v={svc ? peso(svc.fee) : ""}/><KV k="Submitted via" v={r.source === "online" ? "Public website (online request)" : "Parish office"}/><KV k="Staff remarks" v={r.staffNotes}/>
          </>)}
          {section("Client Information", <>
            <KV k="Client" v={r.parishioner}/><KV k="Contact" v={r.contact}/><KV k="Email" v={r.email}/><KV k="Address" v={r.address}/>
          </>)}
          {section("Schedule", schedulable ? (
            <div style={g2}>
              <div style={{ padding:12, border:`1px dashed ${T.borderMd}`, borderRadius:6 }}>
                <div style={secLabel}>Preferred by client</div>
                <div style={{ fontSize:17, fontWeight:600, marginTop:4 }}>{r.prefDate ? fmt(r.prefDate) : "—"}</div>
                <div style={{ fontSize:15, color:T.sub }}>{r.prefTime ? fmtTime(r.prefTime) : ""}</div>
                <div style={{ fontSize:14, color:T.muted, marginTop:6 }}>Request only — not a confirmed schedule.</div>
              </div>
              <div style={{ padding:12, border:`1px solid ${r.apprDate ? T.greenB : T.border}`, background: r.apprDate ? T.greenL : T.bg, borderRadius:6 }}>
                <div style={secLabel}>Approved by parish</div>
                <div style={{ fontSize:17, fontWeight:600, marginTop:4 }}>{r.apprDate ? fmt(r.apprDate) : "Not yet approved"}</div>
                <div style={{ fontSize:15, color:T.sub }}>{r.apprDate ? fmtRange(r.apprStart, r.apprEnd) : ""}</div>
                {r.apprDate && <div style={{ fontSize:14, color:"#166534", marginTop:6 }}>Shown on the Calendar as an appointment.</div>}
              </div>
            </div>
          ) : <p style={{ fontSize:16, color:T.muted, margin:"6px 0" }}>{r.sacramentType} is a document service and is not scheduled on the Calendar.</p>)}
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {section("Official Receipt", <>
            <KV k="OR No." v={r.orNo} mono/><KV k="Receipt Date" v={r.orDate ? fmt(r.orDate) : ""}/><KV k="Verified by" v={r.verifiedBy}/>
            <p style={{ fontSize:14, color:T.muted, margin:"8px 0 0" }}>Payment is made at the parish office. Record the OR issued by the cashier.</p>
          </>, r.orNo ? <button style={linkBtn} onClick={() => { setOrNo(r.orNo); setOrDate(r.orDate); setAction("or"); }}>Correct</button> : undefined)}

          {section("Actions", <div style={{ display:"flex", flexDirection:"column", gap:8, paddingTop:6 }}>
            {r.status === "pending" && <Btn onClick={() => { setOrErr(""); setRemarks(""); setAction("verify"); }}>Verify (record OR)</Btn>}
            {schedulable && (r.status === "verified" || r.status === "scheduled") &&
              <Btn onClick={() => { setApErr(""); setOverride(""); setRemarks(""); setAction("approve"); }}>{r.status === "scheduled" ? "Reschedule" : "Approve Schedule"}</Btn>}
            {(r.status === "scheduled" || (r.status === "verified" && !schedulable)) && <Btn variant="outline" onClick={() => setAction("complete")}>Mark Completed</Btn>}
            {(r.status === "pending" || r.status === "verified") && <Btn variant="danger" onClick={() => setAction("reject")}>Reject</Btn>}
            {open && <Btn variant="ghost" onClick={() => setAction("cancel")}>Cancel Request</Btn>}
            {!open && <p style={{ fontSize:15, color:T.muted, margin:0 }}>This request is {STATUS_CFG[r.status].label.toLowerCase()}. No further actions.</p>}
          </div>)}

          {linkedCert.length > 0 && section("Certificates Issued", linkedCert.map(c => (
            <KV key={c.id} k={c.certNo} v={<span>{fmtDT(c.issuedAt)} <SPill s={c.status}/></span>}/>
          )))}
        </div>
      </div>

      {/* Verify */}
      <Modal open={action === "verify"} title={`Verify ${r.id}`} onClose={() => setAction(null)}
        footer={<><Btn variant="ghost" onClick={() => setAction(null)}>Cancel</Btn><Btn onClick={doVerify}>Verify Request</Btn></>}>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <Notice>Confirm the requirements are complete and the fee was paid at the parish office.</Notice>
          <div style={g2}>
            <div><FL req>OR No.</FL><FI value={orNo} onChange={e => { setOrNo(e.target.value); setOrErr(""); }} placeholder="OR-2026-000000"/></div>
            <div><FL req>Receipt Date</FL><FI type="date" value={orDate} onChange={e => setOrDate(e.target.value)}/></div>
          </div>
          <Err m={orErr}/>
          <div><FL>Remarks</FL><FT rows={2} value={remarks} onChange={e => setRemarks(e.target.value)}/></div>
        </div>
      </Modal>

      {/* Approve */}
      <Modal open={action === "approve"} title={`Approve Schedule · ${r.id}`} onClose={() => setAction(null)} maxW={560}
        footer={<><Btn variant="ghost" onClick={() => setAction(null)}>Cancel</Btn><Btn onClick={doApprove} disabled={hard}>Approve Schedule</Btn></>}>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {r.prefDate && <div style={{ fontSize:15, color:T.sub }}>Client preferred: <b>{fmt(r.prefDate)} · {fmtTime(r.prefTime)}</b></div>}
          <div style={g3}>
            <div><FL req>Date</FL><FI type="date" value={ad} onChange={e => { setAd(e.target.value); setApErr(""); }}/></div>
            <div><FL req>Start</FL><FI type="time" value={as_} onChange={e => { setAs(e.target.value); if (!ae || toMin(ae) <= toMin(e.target.value)) setAe(addMin(e.target.value, svc?.duration ?? 60)); setApErr(""); }}/></div>
            <div><FL req>End</FL><FI type="time" value={ae} onChange={e => { setAe(e.target.value); setApErr(""); }}/></div>
          </div>
          {ad && as_ && ae && <ConflictPanel conflicts={conflicts}/>}
          {conflicts.length > 0 && !hard && auth.role === "admin" && (
            <div><FL>Override reason (Admin)</FL><FI value={override} onChange={e => setOverride(e.target.value)} placeholder="Why this overlap is acceptable"/></div>
          )}
          {conflicts.length > 0 && !hard && auth.role !== "admin" && <p style={{ fontSize:14, color:T.muted, margin:0 }}>Only an Admin can approve over a conflict.</p>}
          <div><FL>Remarks</FL><FT rows={2} value={remarks} onChange={e => setRemarks(e.target.value)}/></div>
          <Err m={apErr}/>
        </div>
      </Modal>

      <ConfirmModal open={action === "reject"} title={`Reject ${r.id}`} danger confirmLabel="Reject Request"
        message={<>Reject the {r.sacramentType} request of <b>{r.parishioner}</b>? The client will be informed of the reason.</>}
        reasonLabel="Rejection reason" reasonRequired onClose={() => setAction(null)} onConfirm={simple("rejected", "rejected", "Reject")}/>
      <ConfirmModal open={action === "complete"} title={`Complete ${r.id}`} confirmLabel="Mark Completed"
        message="Mark this request as completed. The service has been rendered." reasonLabel="Remarks" onClose={() => setAction(null)}
        onConfirm={simple("completed", "completed", "Complete")}/>
      <ConfirmModal open={action === "cancel"} title={`Cancel ${r.id}`} danger confirmLabel="Cancel Request"
        message="Cancel this request? It stays on file with status Cancelled and its schedule is released from the Calendar."
        reasonLabel="Cancellation reason" reasonRequired onClose={() => setAction(null)} onConfirm={simple("cancelled", "cancelled", "Cancel")}/>
      <ConfirmModal open={action === "or"} title="Correct Official Receipt" confirmLabel="Save Correction"
        message="Corrections to receipt details are recorded in the Activity Log." reasonLabel="Reason for correction" reasonRequired
        onClose={() => setAction(null)} onConfirm={saveOR}>
        <div style={g2}>
          <div><FL req>OR No.</FL><FI value={orNo} onChange={e => setOrNo(e.target.value)}/></div>
          <div><FL req>Receipt Date</FL><FI type="date" value={orDate} onChange={e => setOrDate(e.target.value)}/></div>
        </div>
      </ConfirmModal>
    </div>
  );
}

/* ─── CALENDAR ───────────────────────────────────────────── */
const WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const BLANK_ACT = (date: string): Activity => ({ id:"", category:"Holy Mass", title:"", date, ...A0, start:"08:00", end:"09:00", priests:[] });

function CalendarView({ activities, setActivities, appts }:
  { activities: Activity[]; setActivities: SetA<Activity[]>; appts: Appointment[] }) {
  const { auth, push, log, go } = useApp();
  const t = new Date();
  const [ym, setYm] = useState({ y:t.getFullYear(), m:t.getMonth() });
  const [showCancelled, setShowCancelled] = useState(false);
  const [catF, setCatF] = useState<string>("all");
  const [day, setDay] = useState<string | null>(null);
  const [edit, setEdit] = useState<Activity | null>(null);
  const [cancelAct, setCancelAct] = useState<Activity | null>(null);

  const iso = (d: number) => `${ym.y}-${pad(ym.m + 1)}-${pad(d)}`;
  const first = new Date(ym.y, ym.m, 1).getDay();
  const days = new Date(ym.y, ym.m + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length:days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);

  const actsOn = (d: string) => activities.filter(a => a.date === d && (showCancelled || a.status === "active") && (catF === "all" || a.category === catF))
    .sort((a, b) => (a.allDay ? "" : a.start).localeCompare(b.allDay ? "" : b.start));
  const apptsOn = (d: string) => appts.filter(r => r.status === "scheduled" && r.apprDate === d).sort((a, b) => a.apprStart.localeCompare(b.apprStart));
  const move = (n: number) => setYm(p => { const d = new Date(p.y, p.m + n, 1); return { y:d.getFullYear(), m:d.getMonth() }; });

  return (
    <div>
      <PageHead title="Calendar of Activities" sub="Approved appointments come from Requests (read-only). Parish activities are added here."
        right={<><Btn variant="outline" size="sm" onClick={() => move(-1)}>‹</Btn>
          <span style={{ fontFamily:F.head, fontSize:17, fontWeight:700, minWidth:150, textAlign:"center" }}>{new Date(ym.y, ym.m, 1).toLocaleDateString("en-PH",{ month:"long", year:"numeric" })}</span>
          <Btn variant="outline" size="sm" onClick={() => move(1)}>›</Btn>
          <Btn variant="ghost" size="sm" onClick={() => setYm({ y:t.getFullYear(), m:t.getMonth() })}>Today</Btn>
          <Btn size="sm" onClick={() => setEdit(BLANK_ACT(todayISO()))}>+ Add Activity</Btn></>}/>

      <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center", marginBottom:12 }}>
        <button style={chipBtn(catF === "all")} onClick={() => setCatF("all")}>All categories</button>
        {ACTIVITY_CAT_LIST.map(c => (
          <button key={c} style={chipBtn(catF === c)} onClick={() => setCatF(c)}>
            <span style={{ width:8, height:8, borderRadius:2, background:ACTIVITY_CATS[c].col }}/>{c}
          </button>
        ))}
        <span style={{ flex:1 }}/>
        <Toggle on={showCancelled} set={setShowCancelled} label="Show cancelled"/>
      </div>

      <Card>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)" }}>
          {WEEKDAYS.map(w => <div key={w} style={{ ...TH, textAlign:"center", borderBottom:`1px solid ${T.border}` }}>{w}</div>)}
          {cells.map((d, i) => {
            if (!d) return <div key={i} style={{ minHeight:104, background:T.bg, borderRight:`1px solid ${T.border}`, borderBottom:`1px solid ${T.border}` }}/>;
            const ds = iso(d); const acts = actsOn(ds); const ap = apptsOn(ds);
            const closed = activities.some(a => a.date === ds && a.status === "active" && a.category === "Closed Office Day");
            const today = ds === todayISO();
            const items = [...ap.map(r => ({ k:r.id, appt:true, label:`${fmtTime(r.apprStart)} ${r.sacramentType}`, col:SACR[r.sacramentType]?.col ?? T.sub, cancelled:false })),
              ...acts.map(a => ({ k:a.id, appt:false, label:`${a.allDay ? "" : fmtTime(a.start) + " "}${a.title}`, col:ACTIVITY_CATS[a.category]?.col ?? T.sub, cancelled:a.status === "cancelled" }))];
            return (
              <button key={i} onClick={() => setDay(ds)}
                style={{ minHeight:104, padding:6, textAlign:"left", verticalAlign:"top", border:"none", borderRight:`1px solid ${T.border}`, borderBottom:`1px solid ${T.border}`,
                  cursor:"pointer", display:"flex", flexDirection:"column", gap:3,
                  background: closed ? "repeating-linear-gradient(135deg,#FEF2F2 0 6px,#FFFFFF 6px 12px)" : "#fff" }}
                onMouseEnter={e => { if (!closed) e.currentTarget.style.background = T.priLight; }}
                onMouseLeave={e => { if (!closed) e.currentTarget.style.background = "#fff"; }}>
                <span style={{ fontSize:15, fontWeight:700, color: today ? "#fff" : T.text, background: today ? T.primary : "transparent",
                  borderRadius:99, width:22, height:22, display:"inline-flex", alignItems:"center", justifyContent:"center" }}>{d}</span>
                {items.slice(0, 3).map(it => (
                  <span key={it.k} style={{ fontSize:13, lineHeight:1.3, padding:"2px 5px", borderRadius:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", width:"100%",
                    ...(it.appt ? { background:"#fff", border:`1px solid ${it.col}`, color:it.col, fontWeight:600 }
                      : { background:it.col, color:"#fff", opacity: it.cancelled ? .4 : 1, textDecoration: it.cancelled ? "line-through" : "none" }) }}>
                    {it.appt ? "◆ " : ""}{it.label}
                  </span>
                ))}
                {items.length > 3 && <span style={{ fontSize:13, color:T.muted }}>+{items.length - 3} more</span>}
              </button>
            );
          })}
        </div>
      </Card>
      <div style={{ display:"flex", gap:16, marginTop:10, fontSize:14, color:T.sub }}>
        <span><span style={{ padding:"0 5px", border:`1px solid ${T.sub}`, borderRadius:3 }}>◆</span> Approved appointment (from Requests)</span>
        <span><span style={{ padding:"0 8px", background:T.sub, borderRadius:3 }}/> Parish activity</span>
        <span><span style={{ padding:"0 8px", background:"repeating-linear-gradient(135deg,#FECACA 0 3px,#fff 3px 6px)", border:`1px solid ${T.redB}` }}/> Closed Office Day — blocks all scheduling</span>
      </div>

      {/* Day detail */}
      <Modal open={!!day} title={day ? fmt(day) : ""} onClose={() => setDay(null)} maxW={620}
        footer={<Btn onClick={() => { const d = day!; setDay(null); setEdit(BLANK_ACT(d)); }}>+ Add Activity on this day</Btn>}>
        {day && (() => {
          const ap = apptsOn(day); const acts = activities.filter(a => a.date === day && (showCancelled || a.status === "active"));
          return (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div>
                <div style={secLabel}>Approved appointments · read-only</div>
                {ap.length === 0 && <p style={{ fontSize:15, color:T.muted, margin:"4px 0" }}>None.</p>}
                {ap.map(r => (
                  <div key={r.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 10px", marginTop:6, border:`1px solid ${T.border}`, borderRadius:6 }}>
                    <div><div style={{ fontSize:16, fontWeight:600 }}>{r.sacramentType} — {r.subjectName}</div>
                      <div style={{ fontSize:14, color:T.muted }}>{fmtRange(r.apprStart, r.apprEnd)} · {r.id} · {r.parishioner}</div></div>
                    <button style={linkBtn} onClick={() => { setDay(null); go("requests", { requestId:r.id }); }}>Open Request →</button>
                  </div>
                ))}
              </div>
              <div>
                <div style={secLabel}>Parish activities</div>
                {acts.length === 0 && <p style={{ fontSize:15, color:T.muted, margin:"4px 0" }}>None.</p>}
                {acts.map(a => (
                  <div key={a.id} style={{ padding:"8px 10px", marginTop:6, border:`1px solid ${T.border}`, borderLeft:`3px solid ${ACTIVITY_CATS[a.category]?.col}`, borderRadius:6, opacity: a.status === "cancelled" ? .6 : 1 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", gap:8 }}>
                      <div>
                        <div style={{ fontSize:16, fontWeight:600 }}>{a.title} {a.status === "cancelled" && <SPill s="cancelled"/>}</div>
                        <div style={{ display:"flex", gap:6, alignItems:"center", marginTop:3, flexWrap:"wrap" }}>
                          <CatTag cat={a.category}/><span style={{ fontSize:14, color:T.muted }}>{fmtRange(a.start, a.end, a.allDay)} · {a.location}{a.blocking ? " · blocking" : ""}</span>
                        </div>
                        {a.priests.length > 0 && <div style={{ fontSize:14, color:T.sub, marginTop:3 }}>Priest(s): {a.priests.join("; ")}</div>}
                        {a.notes && <div style={{ fontSize:14, color:T.sub, marginTop:2 }}>{a.notes}</div>}
                        {a.cancelReason && <div style={{ fontSize:14, color:T.red, marginTop:2 }}>Cancelled: {a.cancelReason}</div>}
                      </div>
                      {a.status === "active" && <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                        <button style={linkBtn} onClick={() => { setDay(null); setEdit(a); }}>Edit</button>
                        <button style={{ ...linkBtn, color:T.red }} onClick={() => setCancelAct(a)}>Cancel</button>
                      </div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </Modal>

      <ActivityModal act={edit} onClose={() => setEdit(null)} activities={activities} appts={appts}
        onSave={(a, reason) => {
          const isNew = !a.id;
          const saved = isNew ? { ...a, id:nextActId() } : a;
          const prev = activities.find(x => x.id === a.id);
          setActivities(list => isNew ? [...list, saved] : list.map(x => x.id === a.id ? saved : x));
          log({ module:"Calendar", actionType: isNew ? "Add Activity" : "Edit Activity", recordType:"Calendar Activity", recordId:saved.id, reason,
            desc: isNew ? `${who(auth)} added the ${a.category} "${a.title}" on ${fmt(a.date)} at ${clock()}.` : `${who(auth)} edited the ${a.category} "${a.title}" at ${clock()}.`,
            prev: prev ? { Date:prev.date, Time:fmtRange(prev.start, prev.end, prev.allDay), Title:prev.title, Location:prev.location } : undefined,
            next: { Date:a.date, Time:fmtRange(a.start, a.end, a.allDay), Title:a.title, Location:a.location } });
          push("success", isNew ? "Activity added to the Calendar." : "Activity updated."); setEdit(null);
        }}/>

      <ConfirmModal open={!!cancelAct} title="Cancel Activity" danger confirmLabel="Cancel Activity"
        message={<>Cancel <b>{cancelAct?.title}</b>? It stays on record with status Cancelled and no longer blocks scheduling.</>}
        reasonLabel="Cancellation reason" reasonRequired onClose={() => setCancelAct(null)}
        onConfirm={reason => {
          const a = cancelAct!;
          setActivities(list => list.map(x => x.id === a.id ? { ...x, status:"cancelled", cancelReason:reason } : x));
          log({ module:"Calendar", actionType:"Cancel Activity", recordType:"Calendar Activity", recordId:a.id, reason,
            desc:`${who(auth)} cancelled the ${a.category} "${a.title}" on ${fmt(a.date)} at ${clock()}.`, prev:{ Status:"Active" }, next:{ Status:"Cancelled" } });
          push("info", "Activity cancelled."); setCancelAct(null);
        }}/>
    </div>
  );
}

function ActivityModal({ act, onClose, onSave, activities, appts }:
  { act: Activity | null; onClose: () => void; onSave: (a: Activity, reason: string) => void; activities: Activity[]; appts: Appointment[] }) {
  const [a, setA] = useState<Activity | null>(act);
  const [reason, setReason] = useState(""); const [err, setErr] = useState("");
  useEffect(() => { setA(act); setReason(""); setErr(""); }, [act]);
  const conflicts = useMemo(() => a && a.category !== "Closed Office Day" && a.blocking
    ? findConflicts(a.date, a.allDay ? "00:00" : a.start, a.allDay ? "23:59" : a.end, activities, appts, { actId:a.id }) : [], [a, activities, appts]);
  if (!a) return null;
  const set = (p: Partial<Activity>) => { setA({ ...a, ...p }); setErr(""); };
  const isEdit = !!a.id;
  const isMass = MASS_CATS.includes(a.category);
  function save() {
    if (!a) return;
    if (!a.title.trim() || !a.date) { setErr("Title and date are required."); return; }
    if (!a.allDay && (!a.start || !a.end || toMin(a.end) <= toMin(a.start))) { setErr("Enter a start and end time; end must be after start."); return; }
    if (isEdit && !reason.trim()) { setErr("A Reason for Change is required when editing."); return; }
    if (conflicts.some(c => c.hard)) { setErr("This date is a Closed Office Day."); return; }
    onSave({ ...a, title:a.title.trim() }, reason.trim());
  }
  return (
    <Modal open title={isEdit ? `Edit Activity · ${a.id}` : "Add Activity"} onClose={onClose} maxW={640}
      footer={<><Btn variant="ghost" onClick={onClose}>Close</Btn><Btn onClick={save}>{isEdit ? "Save Changes" : "Add to Calendar"}</Btn></>}>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <div style={g2}>
          <div><FL req>Category</FL><FS value={a.category} onChange={e => set({ category:e.target.value, blocking: e.target.value === "Closed Office Day" ? true : a.blocking, allDay: ["Closed Office Day","Holiday"].includes(e.target.value) ? true : a.allDay })}>
            {ACTIVITY_CAT_LIST.map(c => <option key={c}>{c}</option>)}</FS></div>
          <div><FL>Status</FL><FS value={a.status} disabled={!isEdit} onChange={e => set({ status:e.target.value as Activity["status"] })}><option value="active">Active</option><option value="cancelled" disabled>Cancelled (use Cancel)</option></FS></div>
        </div>
        <div><FL req>Title</FL><FI value={a.title} onChange={e => set({ title:e.target.value })} placeholder={a.category === "Fiesta Mass" ? "e.g. Fiesta of Sto. Niño — Parish of Sta. Cruz" : "Activity title"}/></div>
        <div style={g3}>
          <div><FL req>Date</FL><FI type="date" value={a.date} onChange={e => set({ date:e.target.value })}/></div>
          <div><FL req={!a.allDay}>Start</FL><FI type="time" value={a.start} disabled={a.allDay} onChange={e => set({ start:e.target.value })}/></div>
          <div><FL req={!a.allDay}>End</FL><FI type="time" value={a.end} disabled={a.allDay} onChange={e => set({ end:e.target.value })}/></div>
        </div>
        <div style={g2}>
          <Toggle on={a.allDay} set={v => set({ allDay:v })} label="All-day"/>
          <Toggle on={a.blocking} set={v => set({ blocking:v })} disabled={a.category === "Closed Office Day"} label="Blocking"
            hint={a.category === "Closed Office Day" ? "Closed Office Days always block scheduling" : "Prevents overlapping appointments"}/>
        </div>
        <div><FL>Location</FL><FI value={a.location} onChange={e => set({ location:e.target.value })}/></div>
        {isMass && (
          <div>
            <FL>Priest(s)</FL>
            <div style={{ display:"flex", flexDirection:"column", gap:4, marginTop:2 }}>
              {PRIESTS.map(p => (
                <label key={p} style={{ fontSize:16, display:"flex", gap:8, alignItems:"center", cursor:"pointer" }}>
                  <input type="checkbox" checked={a.priests.includes(p)} style={{ accentColor:T.primary }}
                    onChange={e => set({ priests: e.target.checked ? [...a.priests, p] : a.priests.filter(x => x !== p) })}/>{p}
                </label>
              ))}
            </div>
            {a.category === "Fiesta Mass" && <p style={{ fontSize:14, color:T.muted, margin:"6px 0 0" }}>For a fiesta in another parish or diocese, set the Location to that parish and note "concelebrating" in Notes. Turn off Blocking if the PdSPA office stays open.</p>}
          </div>
        )}
        <div><FL>Notes</FL><FT rows={2} value={a.notes} onChange={e => set({ notes:e.target.value })}/></div>
        {conflicts.length > 0 && <ConflictPanel conflicts={conflicts}/>}
        {isEdit && <div><FL req>Reason for Change</FL><FT rows={2} value={reason} onChange={e => { setReason(e.target.value); setErr(""); }} placeholder="Recorded in the Activity Log"/></div>}
        <Err m={err}/>
      </div>
    </Modal>
  );
}

/* ─── BOOK ENTITY ────────────────────────────────────────── */
function BookEntityView({ books, setBooks, appts, prefill, clearFocus }:
  { books: BookEntry[]; setBooks: SetA<BookEntry[]>; appts: Appointment[]; prefill?: string; clearFocus: () => void }) {
  const { auth, push, log, go } = useApp();
  const [q, setQ] = useState(""); const [typeF, setTypeF] = useState("all"); const [statusF, setStatusF] = useState("all");
  const [form, setForm] = useState<BookEntry | null>(null);
  const [view, setView] = useState<BookEntry | null>(null);
  const [correct, setCorrect] = useState<BookEntry | null>(null);
  const [err, setErr] = useState("");

  const blank = (req?: Appointment): BookEntry => {
    const bt = BOOK_TYPE_LIST.find(k => BOOK_TYPES[k] === req?.sacramentType) ?? "Baptismal Register";
    return { id:"", bookType:bt, bookNo:"", page:"", entryNo:"", dateOfArrival:"", sacramentType:BOOK_TYPES[bt],
      recipient:req?.subjectName ?? "", dateOfSacrament:req?.dateOfSacrament || req?.apprDate || "", officiant:"", ...B0,
      linkedRequestId:req?.id ?? "", encodedBy:auth.name, dateEncoded:todayISO() };
  };
  useEffect(() => {
    if (!prefill) return;
    const ex = books.find(b => b.linkedRequestId === prefill);
    if (ex) setView(ex); else setForm(blank(appts.find(a => a.id === prefill)));
    clearFocus();
  }, [prefill]);

  const rows = books.filter(b => (typeF === "all" || b.bookType === typeF) && (statusF === "all" || b.status === statusF) &&
    (!q || [b.id, b.recipient, b.bookNo, b.entryNo, b.linkedRequestId, b.officiant].some(v => v.toLowerCase().includes(q.toLowerCase()))));

  function save() {
    const f = form!;
    if (!f.bookNo || !f.page || !f.entryNo || !f.recipient.trim() || !f.dateOfSacrament) { setErr("Book No., Page, Entry No., Recipient and Date of Sacrament are required."); return; }
    if (books.some(b => b.bookType === f.bookType && b.bookNo === f.bookNo && b.page === f.page && b.entryNo === f.entryNo)) { setErr("An entry with the same Book No., Page and Entry No. already exists in this register."); return; }
    const saved = { ...f, id:nextBkId() };
    setBooks(l => [saved, ...l]);
    log({ module:"Book Entity", actionType:"Encode", client:f.recipient, recordType:"Book Entity", recordId:saved.id,
      desc:`${who(auth)} encoded the ${f.sacramentType} record of ${f.recipient} (${f.bookType} Book ${f.bookNo}, Page ${f.page}, Entry ${f.entryNo}) at ${clock()}.` });
    push("success", `${saved.id} encoded.`); setForm(null);
  }

  const bset = (p: Partial<BookEntry>) => { setForm(f => f ? { ...f, ...p } : f); setErr(""); };

  return (
    <div>
      <PageHead title="Book Entity" sub="Digital index of the parish registers. The physical register remains the official record."
        right={<><SearchBox value={q} set={setQ} placeholder="Search recipient, Book/Entry No., request" width={260}/><Btn onClick={() => { setErr(""); setForm(blank()); }}>+ Encode Entry</Btn></>}/>
      <div style={{ display:"flex", gap:8, marginBottom:12 }}>
        <FS value={typeF} onChange={e => setTypeF(e.target.value)} style={{ width:220 }}><option value="all">All registers</option>{BOOK_TYPE_LIST.map(b => <option key={b}>{b}</option>)}</FS>
        <FS value={statusF} onChange={e => setStatusF(e.target.value)} style={{ width:160 }}><option value="all">All statuses</option><option value="active">Active</option><option value="corrected">Corrected</option></FS>
      </div>
      <Card>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr>{["ID","Register","Book / Page / Entry","Recipient","Date of Sacrament","Officiant","Linked Request","Status",""].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.length === 0 && <EmptyRow cols={9} text="No entries found."/>}
            {rows.map(b => (
              <tr key={b.id} style={{ borderTop:`1px solid ${T.border}` }}>
                <td style={{ ...TD, fontFamily:F.body, letterSpacing:".03em", fontSize:15 }}>{b.id}</td>
                <td style={{ ...TD, fontSize:15 }}>{b.bookType}</td>
                <td style={{ ...TD, fontFamily:F.body, letterSpacing:".03em", fontSize:15 }}>{b.bookNo} / {b.page} / {b.entryNo}</td>
                <td style={{ ...TD, fontWeight:600 }}>{b.recipient}</td>
                <td style={{ ...TD, fontSize:15 }}>{fmtShort(b.dateOfSacrament)}</td>
                <td style={{ ...TD, fontSize:15 }}>{b.officiant || "—"}</td>
                <td style={{ ...TD, fontFamily:F.body, letterSpacing:".03em", fontSize:15 }}>{b.linkedRequestId || "—"}</td>
                <td style={TD}><SPill s={b.status}/></td>
                <td style={{ ...TD, whiteSpace:"nowrap" }}>
                  <button style={linkBtn} onClick={() => setView(b)}>View</button>{"  ·  "}
                  <button style={linkBtn} onClick={() => setCorrect(b)}>Correct</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Encode */}
      <Modal open={!!form} title="Encode Book Entity" onClose={() => setForm(null)} maxW={680}
        footer={<><Btn variant="ghost" onClick={() => setForm(null)}>Cancel</Btn><Btn onClick={save}>Save Entry</Btn></>}>
        {form && <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={g2}>
            <div><FL req>Book Type</FL><FS value={form.bookType} onChange={e => bset({ bookType:e.target.value, sacramentType:BOOK_TYPES[e.target.value] })}>{BOOK_TYPE_LIST.map(b => <option key={b}>{b}</option>)}</FS></div>
            <div><FL>Sacrament Type</FL><FI value={form.sacramentType} readOnly style={{ background:T.bg }}/></div>
          </div>
          <div style={g3}>
            <div><FL req>Book No.</FL><FI value={form.bookNo} onChange={e => bset({ bookNo:e.target.value })}/></div>
            <div><FL req>Page</FL><FI value={form.page} onChange={e => bset({ page:e.target.value })}/></div>
            <div><FL req>Entry No.</FL><FI value={form.entryNo} onChange={e => bset({ entryNo:e.target.value })}/></div>
          </div>
          <div style={g2}>
            <div><FL req>Recipient</FL><FI value={form.recipient} onChange={e => bset({ recipient:e.target.value })}/></div>
            <div><FL>Officiant</FL><FS value={form.officiant} onChange={e => bset({ officiant:e.target.value })}><option value="">—</option>{PRIESTS.map(p => <option key={p}>{p}</option>)}</FS></div>
          </div>
          <div style={g2}>
            <div><FL req>Date of Sacrament</FL><FI type="date" value={form.dateOfSacrament} onChange={e => bset({ dateOfSacrament:e.target.value })}/></div>
            <div><FL>Date of Arrival</FL><FI type="date" value={form.dateOfArrival} onChange={e => bset({ dateOfArrival:e.target.value })}/>
              <p style={{ fontSize:13, color:T.muted, margin:"3px 0 0" }}>As written in the register — not the request submission date.</p></div>
          </div>
          <div style={g2}>
            <div><FL>Linked Request ID</FL><FS value={form.linkedRequestId} onChange={e => bset({ linkedRequestId:e.target.value })}><option value="">None (pre-existing record)</option>
              {appts.map(a => <option key={a.id} value={a.id}>{a.id} · {a.subjectName}</option>)}</FS></div>
            <div><FL>Encoded By / Date</FL><FI value={`${form.encodedBy} · ${fmt(form.dateEncoded)}`} readOnly style={{ background:T.bg }}/></div>
          </div>
          <div><FL>Remarks</FL><FT rows={2} value={form.remarks} onChange={e => bset({ remarks:e.target.value })}/></div>
          <Err m={err}/>
        </div>}
      </Modal>

      <Drawer open={!!view} title={view ? view.recipient : ""} sub={view ? `${view.id} · ${view.bookType}` : ""} onClose={() => setView(null)}
        footer={view && <>
          {view.linkedRequestId && <Btn variant="outline" size="sm" onClick={() => go("requests", { requestId:view.linkedRequestId })}>Open Request</Btn>}
          {view.linkedRequestId && PRINTABLE.includes(view.sacramentType) && <Btn size="sm" onClick={() => go("certificates", { certRequestId:view.linkedRequestId })}>Generate Certificate</Btn>}
          <Btn variant="outline" size="sm" onClick={() => { setCorrect(view); setView(null); }}>Correct</Btn>
        </>}>
        {view && <>
          <KV k="Book Type" v={view.bookType}/><KV k="Book No." v={view.bookNo} mono/><KV k="Page" v={view.page} mono/><KV k="Entry No." v={view.entryNo} mono/>
          <KV k="Date of Arrival" v={view.dateOfArrival ? fmt(view.dateOfArrival) : ""}/><KV k="Sacrament Type" v={view.sacramentType}/>
          <KV k="Recipient" v={view.recipient}/><KV k="Date of Sacrament" v={fmt(view.dateOfSacrament)}/><KV k="Officiant" v={view.officiant}/>
          <KV k="Status" v={<SPill s={view.status}/>}/><KV k="Remarks" v={view.remarks}/><KV k="Linked Request" v={view.linkedRequestId} mono/>
          <KV k="Encoded By" v={view.encodedBy}/><KV k="Date Encoded" v={fmt(view.dateEncoded)}/>
          <div style={{ marginTop:12 }}><Notice>Entries cannot be deleted. Use Correct to amend the index; the physical register governs.</Notice></div>
        </>}
      </Drawer>

      <CorrectBookModal entry={correct} onClose={() => setCorrect(null)} onSave={(n, reason) => {
        const o = correct!;
        const prev: Record<string,string> = {}, next: Record<string,string> = {};
        (["bookNo","page","entryNo","recipient","dateOfSacrament","dateOfArrival","officiant","remarks"] as const).forEach(k => { if (o[k] !== n[k]) { prev[k] = o[k]; next[k] = n[k]; } });
        setBooks(l => l.map(b => b.id === o.id ? { ...n, status:"corrected" } : b));
        log({ module:"Book Entity", actionType:"Correct", client:n.recipient, recordType:"Book Entity", recordId:o.id, reason, prev, next,
          desc:`${who(auth)} corrected the Book Entity record ${o.id} of ${n.recipient} at ${clock()}.` });
        push("success", `${o.id} corrected.`); setCorrect(null);
      }}/>
    </div>
  );
}

function CorrectBookModal({ entry, onClose, onSave }: { entry: BookEntry | null; onClose: () => void; onSave: (b: BookEntry, reason: string) => void }) {
  const [b, setB] = useState<BookEntry | null>(entry); const [reason, setReason] = useState(""); const [err, setErr] = useState("");
  useEffect(() => { setB(entry); setReason(""); setErr(""); }, [entry]);
  if (!b) return null;
  const s = (p: Partial<BookEntry>) => setB({ ...b, ...p });
  return (
    <Modal open title={`Correct ${b.id}`} onClose={onClose} maxW={620}
      footer={<><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={() => { if (!reason.trim()) { setErr("A reason for correction is required."); return; } onSave(b, reason.trim()); }}>Save Correction</Btn></>}>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <div style={g3}>
          <div><FL>Book No.</FL><FI value={b.bookNo} onChange={e => s({ bookNo:e.target.value })}/></div>
          <div><FL>Page</FL><FI value={b.page} onChange={e => s({ page:e.target.value })}/></div>
          <div><FL>Entry No.</FL><FI value={b.entryNo} onChange={e => s({ entryNo:e.target.value })}/></div>
        </div>
        <div style={g2}>
          <div><FL>Recipient</FL><FI value={b.recipient} onChange={e => s({ recipient:e.target.value })}/></div>
          <div><FL>Officiant</FL><FI value={b.officiant} onChange={e => s({ officiant:e.target.value })}/></div>
        </div>
        <div style={g2}>
          <div><FL>Date of Sacrament</FL><FI type="date" value={b.dateOfSacrament} onChange={e => s({ dateOfSacrament:e.target.value })}/></div>
          <div><FL>Date of Arrival</FL><FI type="date" value={b.dateOfArrival} onChange={e => s({ dateOfArrival:e.target.value })}/></div>
        </div>
        <div><FL>Remarks</FL><FT rows={2} value={b.remarks} onChange={e => s({ remarks:e.target.value })}/></div>
        <div><FL req>Reason for correction</FL><FT rows={2} value={reason} onChange={e => { setReason(e.target.value); setErr(""); }}/><Err m={err}/></div>
      </div>
    </Modal>
  );
}

/* ─── CERTIFICATES ───────────────────────────────────────── */
const stripAutoPrint = (html: string) => html.replace(/<script>[\s\S]*?<\/script>/g, "");

function CertificatesView({ appts, issuance, setIssuance, books, renderCert, focusId, clearFocus, openMarriage }:
  { appts: Appointment[]; issuance: Issuance[]; setIssuance: SetA<Issuance[]>; books: BookEntry[];
    renderCert: (a: Appointment) => string; focusId?: string; clearFocus: () => void; openMarriage: (id: string) => void }) {
  const { auth, push, log, go } = useApp();
  const [q, setQ] = useState(""); const [typeF, setTypeF] = useState("all");
  const [prev, setPrev] = useState<Appointment | null>(null);
  const [reprint, setReprint] = useState<{ a: Appointment; iss: Issuance } | null>(null);
  useEffect(() => { if (focusId) { const a = appts.find(x => x.id === focusId); if (a) setPrev(a); clearFocus(); } }, [focusId]);

  const eligible = appts.filter(a => PRINTABLE.includes(a.sacramentType) && ["verified","scheduled","completed"].includes(a.status) &&
    (typeF === "all" || a.sacramentType === typeF) && (!q || [a.id, a.parishioner, a.subjectName, a.orNo].some(v => v.toLowerCase().includes(q.toLowerCase()))));
  const issuedFor = (id: string) => issuance.find(i => i.requestId === id && i.status === "issued");

  function print(a: Appointment) { return openBlobPrint(renderCert(a)); }
  function issue(a: Appointment) {
    if (!print(a)) { push("error", "Pop-up blocked. Allow pop-ups to print."); return; }
    const certNo = `PdSPA-${CERT_CODE[a.sacramentType]}-2026-${String(++_certSeq).padStart(4,"0")}`;
    const rec: Issuance = { id:`CI-${String(++_ciid).padStart(4,"0")}`, certNo, requestId:a.id, bookId:books.find(b => b.linkedRequestId === a.id)?.id ?? "",
      client:a.parishioner, type:a.sacramentType, issuedBy:auth.name, issuedAt:nowStamp(), status:"issued", reprintCount:0,
      lastReprintAt:"", lastReprintBy:"", lastReprintReason:"", voidReason:"" };
    setIssuance(l => [rec, ...l]);
    log({ module:"Certificates", actionType:"Print / Issue", client:a.parishioner, recordType:"Certificate", recordId:certNo,
      desc:`${who(auth)} printed and issued ${a.sacramentType} certificate ${certNo} for ${a.parishioner} at ${clock()}.` });
    push("success", `Certificate ${certNo} issued.`); setPrev(null);
  }
  function doReprint(reason: string) {
    const { a, iss } = reprint!;
    if (!print(a)) { push("error", "Pop-up blocked. Allow pop-ups to print."); return; }
    setIssuance(l => l.map(i => i.id === iss.id ? { ...i, reprintCount:i.reprintCount + 1, lastReprintAt:nowStamp(), lastReprintBy:auth.name, lastReprintReason:reason } : i));
    log({ module:"Certificates", actionType:"Reprint", client:a.parishioner, recordType:"Certificate", recordId:iss.certNo, reason,
      prev:{ "Reprint Count":String(iss.reprintCount) }, next:{ "Reprint Count":String(iss.reprintCount + 1) },
      desc:`${who(auth)} reprinted certificate ${iss.certNo} for ${a.parishioner} at ${clock()}.` });
    push("success", `${iss.certNo} reprinted.`); setReprint(null); setPrev(null);
  }

  return (
    <div>
      <PageHead title="Certificates" sub="Preview, then print and issue. Every print is recorded in Certificate Issuance."
        right={<><SearchBox value={q} set={setQ} placeholder="Search request, client or OR No." width={240}/>
          <FS value={typeF} onChange={e => setTypeF(e.target.value)} style={{ width:180 }}><option value="all">All types</option>{PRINTABLE.map(p => <option key={p}>{p}</option>)}</FS></>}/>
      <div style={{ marginBottom:12 }}>
        <Notice>Printable templates: Baptism, Confirmation, Marriage and Death Certificate. First Holy Communion, No Record and Good Standing/Membership remain available as services; their templates are awaiting parish-approved layouts.</Notice>
      </div>
      <Card>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr>{["Request","Client","Type","Subject","OR No.","Request Status","Certificate",""].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
          <tbody>
            {eligible.length === 0 && <EmptyRow cols={8} text="No verified requests with a printable certificate."/>}
            {eligible.map(a => {
              const iss = issuedFor(a.id);
              return (
                <tr key={a.id} style={{ borderTop:`1px solid ${T.border}` }}>
                  <td style={{ ...TD, fontFamily:F.body, letterSpacing:".03em", fontSize:15 }}>{a.id}</td>
                  <td style={{ ...TD, fontWeight:600 }}>{a.parishioner}</td>
                  <td style={TD}><TypeTag type={a.sacramentType}/></td>
                  <td style={TD}>{a.subjectName}</td>
                  <td style={{ ...TD, fontFamily:F.body, letterSpacing:".03em", fontSize:15 }}>{a.orNo || "—"}</td>
                  <td style={TD}><Badge status={a.status}/></td>
                  <td style={{ ...TD, fontSize:15 }}>{iss ? <><b>{iss.certNo}</b>{iss.reprintCount ? ` · ${iss.reprintCount} reprint(s)` : ""}</> : <span style={{ color:T.muted }}>Not issued</span>}</td>
                  <td style={{ ...TD, whiteSpace:"nowrap" }}>
                    <button style={linkBtn} onClick={() => setPrev(a)}>Preview</button>
                    {a.sacramentType === "Marriage" && <>{"  ·  "}<button style={linkBtn} onClick={() => openMarriage(a.id)}>Form 97</button></>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Modal open={!!prev} title={prev ? `Preview · ${prev.sacramentType} — ${prev.subjectName}` : ""} onClose={() => setPrev(null)} maxW={900}
        footer={prev && (() => { const iss = issuedFor(prev.id); return <>
          <Btn variant="ghost" onClick={() => setPrev(null)}>Cancel</Btn>
          <Btn variant="outline" onClick={() => go("requests", { requestId:prev.id })}>Open Request</Btn>
          {iss ? <Btn onClick={() => setReprint({ a:prev, iss })}>Reprint {iss.certNo}</Btn> : <Btn onClick={() => issue(prev)}>Print / Issue</Btn>}
        </>; })()}>
        {prev && <>
          {issuedFor(prev.id) && <div style={{ marginBottom:10 }}><Notice tone="warn">Already issued as {issuedFor(prev.id)!.certNo}. Reprinting requires a reason and is logged.</Notice></div>}
          <iframe title="Certificate preview" srcDoc={stripAutoPrint(renderCert(prev))}
            style={{ width:"100%", height:520, border:`1px solid ${T.border}`, borderRadius:6, background:"#fff" }}/>
        </>}
      </Modal>

      <ConfirmModal open={!!reprint} title="Reprint Certificate" confirmLabel="Reprint"
        message={<>Reprint <b>{reprint?.iss.certNo}</b>? This uses the same certificate number and increases its reprint count.</>}
        reasonLabel="Reason for reprint" reasonRequired onClose={() => setReprint(null)} onConfirm={doReprint}/>
    </div>
  );
}

/* ─── CERTIFICATE ISSUANCE ───────────────────────────────── */
function IssuanceView({ issuance, setIssuance, appts, renderCert }:
  { issuance: Issuance[]; setIssuance: SetA<Issuance[]>; appts: Appointment[]; renderCert: (a: Appointment) => string }) {
  const { auth, push, log, go } = useApp();
  const [q, setQ] = useState(""); const [st, setSt] = useState("all");
  const [sel, setSel] = useState<Issuance | null>(null);
  const [act, setAct] = useState<"reprint"|"void"|null>(null);
  const rows = issuance.filter(i => (st === "all" || i.status === st) && (!q || [i.certNo, i.client, i.requestId, i.type, i.issuedBy].some(v => v.toLowerCase().includes(q.toLowerCase()))));
  const cur = sel ? issuance.find(i => i.id === sel.id) ?? null : null;

  return (
    <div>
      <PageHead title="Certificate Issuance" sub="Permanent record of every certificate issued. Records are never deleted."
        right={<><SearchBox value={q} set={setQ} placeholder="Search Cert No., client, request" width={240}/>
          <FS value={st} onChange={e => setSt(e.target.value)} style={{ width:140 }}><option value="all">All</option><option value="issued">Issued</option><option value="voided">Voided</option></FS>
          <Btn variant="outline" size="sm" onClick={() => downloadCSV("certificate-issuance.csv", [["Cert No.","Client","Request ID","Type","Issued By","Date/Time","Status","Reprint Count"],
            ...rows.map(i => [i.certNo, i.client, i.requestId, i.type, i.issuedBy, i.issuedAt, i.status, i.reprintCount])])}>Export CSV</Btn></>}/>
      <Card>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr>{["Cert No.","Client","Request ID","Type","Issued By","Date / Time","Status","Reprints",""].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.length === 0 && <EmptyRow cols={9} text="No issuance records."/>}
            {rows.map(i => (
              <tr key={i.id} style={{ borderTop:`1px solid ${T.border}` }}>
                <td style={{ ...TD, fontFamily:F.body, letterSpacing:".03em", fontSize:15, fontWeight:600 }}>{i.certNo}</td>
                <td style={TD}>{i.client}</td>
                <td style={{ ...TD, fontFamily:F.body, letterSpacing:".03em", fontSize:15 }}>{i.requestId}</td>
                <td style={TD}><TypeTag type={i.type}/></td>
                <td style={{ ...TD, fontSize:15 }}>{i.issuedBy}</td>
                <td style={{ ...TD, fontSize:15 }}>{fmtDT(i.issuedAt)}</td>
                <td style={TD}><SPill s={i.status}/></td>
                <td style={{ ...TD, textAlign:"center" }}>{i.reprintCount}</td>
                <td style={TD}><button style={linkBtn} onClick={() => setSel(i)}>Details</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Drawer open={!!cur} title={cur?.certNo ?? ""} sub={cur ? `${cur.type} · ${cur.client}` : ""} onClose={() => setSel(null)}
        footer={cur && <>
          <Btn variant="outline" size="sm" onClick={() => go("requests", { requestId:cur.requestId })}>Open Request</Btn>
          {cur.status === "issued" && <Btn size="sm" onClick={() => setAct("reprint")}>Reprint</Btn>}
          {cur.status === "issued" && auth.role === "admin" && <Btn variant="danger" size="sm" onClick={() => setAct("void")}>Void</Btn>}
        </>}>
        {cur && <>
          <KV k="Issuance ID" v={cur.id} mono/><KV k="Certificate No." v={cur.certNo} mono/><KV k="Type" v={cur.type}/><KV k="Client" v={cur.client}/>
          <KV k="Request ID" v={cur.requestId} mono/><KV k="Book Entity" v={cur.bookId} mono/><KV k="Issued By" v={cur.issuedBy}/><KV k="Issued At" v={fmtDT(cur.issuedAt)}/>
          <KV k="Status" v={<SPill s={cur.status}/>}/><KV k="Reprint Count" v={String(cur.reprintCount)}/>
          <KV k="Last Reprint" v={cur.lastReprintAt ? fmtDT(cur.lastReprintAt) : ""}/><KV k="Last Reprint By" v={cur.lastReprintBy}/>
          <KV k="Last Reprint Reason" v={cur.lastReprintReason}/>{cur.status === "voided" && <KV k="Void Reason" v={cur.voidReason}/>}
        </>}
      </Drawer>

      <ConfirmModal open={act === "reprint"} title="Reprint Certificate" confirmLabel="Reprint" reasonLabel="Reason for reprint" reasonRequired
        message={<>Reprint <b>{cur?.certNo}</b>? The reprint is counted and logged.</>} onClose={() => setAct(null)}
        onConfirm={reason => {
          const i = cur!; const a = appts.find(x => x.id === i.requestId);
          if (!a || !openBlobPrint(renderCert(a))) { push("error", "Unable to open the print window."); return; }
          setIssuance(l => l.map(x => x.id === i.id ? { ...x, reprintCount:x.reprintCount + 1, lastReprintAt:nowStamp(), lastReprintBy:auth.name, lastReprintReason:reason } : x));
          log({ module:"Certificate Issuance", actionType:"Reprint", client:i.client, recordType:"Certificate", recordId:i.certNo, reason,
            prev:{ "Reprint Count":String(i.reprintCount) }, next:{ "Reprint Count":String(i.reprintCount + 1) },
            desc:`${who(auth)} reprinted certificate ${i.certNo} for ${i.client} at ${clock()}.` });
          push("success", "Reprint recorded."); setAct(null);
        }}/>
      <ConfirmModal open={act === "void"} title="Void Certificate" danger confirmLabel="Void Certificate" reasonLabel="Reason for voiding" reasonRequired
        message={<>Void <b>{cur?.certNo}</b>? The record stays on file with status Voided.</>} onClose={() => setAct(null)}
        onConfirm={reason => {
          const i = cur!;
          setIssuance(l => l.map(x => x.id === i.id ? { ...x, status:"voided", voidReason:reason } : x));
          log({ module:"Certificate Issuance", actionType:"Void", client:i.client, recordType:"Certificate", recordId:i.certNo, reason,
            prev:{ Status:"Issued" }, next:{ Status:"Voided" }, desc:`${who(auth)} voided certificate ${i.certNo} at ${clock()}.` });
          push("info", `${i.certNo} voided.`); setAct(null);
        }}/>
    </div>
  );
}

/* ─── REPORTS ────────────────────────────────────────────── */
const REPORTS = [
  "Monthly Client Report", "Certificate Issuance Log", "Pending Requests Report", "OR Transactions Report", "Book Entity Summary",
  "Verification Status Report", "Service Type Demand Report", "Staff Activity Report", "Annual Summary Report", "Calendar of Activities Report",
] as const;
type ReportName = typeof REPORTS[number];
interface ArchiveRow { id: string; name: string; range: string; by: string; at: string; rows: number; }

function ReportsView({ appts, issuance, books, activities, logs, services }:
  { appts: Appointment[]; issuance: Issuance[]; books: BookEntry[]; activities: Activity[]; logs: AuditLog[]; services: Service[] }) {
  const { auth, push, log } = useApp();
  const [tab, setTab] = useState<"generate"|"archive">("generate");
  const [rep, setRep] = useState<ReportName>("Monthly Client Report");
  const ym = todayISO().slice(0,7);
  const [from, setFrom] = useState(`${ym}-01`); const [to, setTo] = useState(todayISO());
  const [svcF, setSvcF] = useState("all");
  const [out, setOut] = useState<{ name: ReportName; head: string[]; rows: (string|number)[][]; range: string } | null>(null);
  const [archive, setArchive] = useState<ArchiveRow[]>([
    { id:"RPT-0012", name:"Monthly Client Report", range:"Sep 1 – Sep 30, 2026", by:"Jose Reyes", at:"2026-10-01 09:12", rows:41 },
    { id:"RPT-0011", name:"Certificate Issuance Log", range:"Sep 1 – Sep 30, 2026", by:"Andrea Quinto", at:"2026-10-01 09:20", rows:28 },
    { id:"RPT-0010", name:"OR Transactions Report", range:"Sep 1 – Sep 30, 2026", by:"Andrea Quinto", at:"2026-10-01 09:31", rows:37 },
  ]);
  const inR = (d: string) => !!d && d.slice(0,10) >= from && d.slice(0,10) <= to;
  const svcOk = (s: string) => svcF === "all" || s === svcF;

  function build(): { head: string[]; rows: (string|number)[][] } {
    const A = appts.filter(a => inR(a.submittedAt) && svcOk(a.sacramentType));
    const count = (list: string[]) => Object.entries(list.reduce<Record<string,number>>((m, k) => (m[k] = (m[k] ?? 0) + 1, m), {})).sort((a, b) => b[1] - a[1]);
    switch (rep) {
      case "Monthly Client Report": return { head:["Request","Client","Service","Submitted","Status"], rows:A.map(a => [a.id, a.parishioner, a.sacramentType, a.submittedAt, STATUS_CFG[a.status].label]) };
      case "Certificate Issuance Log": return { head:["Cert No.","Client","Type","Issued By","Date/Time","Status","Reprints"],
        rows:issuance.filter(i => inR(i.issuedAt) && svcOk(i.type)).map(i => [i.certNo, i.client, i.type, i.issuedBy, fmtDT(i.issuedAt), i.status === "issued" ? "Issued" : "Voided", i.reprintCount]) };
      case "Pending Requests Report": return { head:["Request","Client","Service","Submitted","Days waiting"],
        rows:appts.filter(a => a.status === "pending" && svcOk(a.sacramentType)).map(a => [a.id, a.parishioner, a.sacramentType, a.submittedAt, Math.max(0, Math.round((Date.now() - new Date(a.submittedAt).getTime()) / 864e5))]) };
      case "OR Transactions Report": return { head:["OR No.","Receipt Date","Request","Client","Service","Fee"],
        rows:appts.filter(a => a.orNo && inR(a.orDate) && svcOk(a.sacramentType)).map(a => [a.orNo, a.orDate, a.id, a.parishioner, a.sacramentType, peso(services.find(s => s.name === a.sacramentType)?.fee ?? 0)]) };
      case "Book Entity Summary": return { head:["Register","Entries","Corrected","Linked to requests"],
        rows:BOOK_TYPE_LIST.map(t => { const b = books.filter(x => x.bookType === t); return [t, b.length, b.filter(x => x.status === "corrected").length, b.filter(x => x.linkedRequestId).length]; }) };
      case "Verification Status Report": return { head:["Status","Requests"], rows:REQ_STATUSES.map(s => [STATUS_CFG[s].label, A.filter(a => a.status === s).length]) };
      case "Service Type Demand Report": return { head:["Service","Requests"], rows:count(A.map(a => a.sacramentType)) };
      case "Staff Activity Report": return { head:["Staff/Admin","Actions logged","Last action"],
        rows:Object.entries(logs.filter(l => inR(l.at) && l.actionType !== "Failed Login").reduce<Record<string,AuditLog[]>>((m, l) => ((m[l.actor] ??= []).push(l), m), {}))
          .map(([n, ls]) => [n, ls.length, fmtDT(ls[0].at)]) };
      case "Annual Summary Report": {
        const y = from.slice(0,4);
        return { head:["Month","Requests","Completed","Certificates issued"], rows:Array.from({ length:12 }, (_, m) => {
          const k = `${y}-${pad(m + 1)}`;
          return [new Date(+y, m, 1).toLocaleDateString("en-PH",{ month:"long" }), appts.filter(a => a.submittedAt.startsWith(k)).length,
            appts.filter(a => a.submittedAt.startsWith(k) && a.status === "completed").length, issuance.filter(i => i.issuedAt.startsWith(k) && i.status === "issued").length];
        }) };
      }
      case "Calendar of Activities Report": return { head:["Date","Time","Kind","Category / Service","Title","Status"],
        rows:[...activities.filter(a => inR(a.date)).map(a => [a.date, fmtRange(a.start, a.end, a.allDay), "Activity", a.category, a.title, a.status === "active" ? "Active" : "Cancelled"]),
          ...appts.filter(a => a.status === "scheduled" && inR(a.apprDate)).map(a => [a.apprDate, fmtRange(a.apprStart, a.apprEnd), "Appointment", a.sacramentType, a.subjectName, "Scheduled"])]
          .sort((a, b) => String(a[0]).localeCompare(String(b[0]))) };
    }
  }
  const range = `${fmtShort(from)} – ${fmtShort(to)}`;
  function generate() {
    if (from > to) { push("error", "The start date must be before the end date."); return; }
    const r = build(); setOut({ name:rep, ...r, range });
    setArchive(l => [{ id:`RPT-${String(13 + l.length - 3).padStart(4,"0")}`, name:rep, range, by:auth.name, at:nowStamp(), rows:r.rows.length }, ...l]);
    log({ module:"Reports", actionType:"Generate Report", recordType:"Report", recordId:rep, desc:`${who(auth)} generated the ${rep} for ${range} at ${clock()}.` });
  }
  function exportCSV() {
    if (!out) return;
    downloadCSV(`${out.name.toLowerCase().replace(/\s+/g,"-")}.csv`, [out.head, ...out.rows]);
    log({ module:"Reports", actionType:"Export Report", recordType:"Report", recordId:out.name, desc:`${who(auth)} exported the ${out.name} (${out.range}) at ${clock()}.` });
  }
  function printRep() {
    if (!out) return;
    const html = `<!doctype html><html><head><title>${out.name}</title><link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700&display=swap" rel="stylesheet"><style>body{font-family:Arial,Helvetica,sans-serif;color:#1A1400;padding:32px}h1{font-family:'Montserrat',sans-serif;font-size:18px;font-weight:700;margin:0}th{font-family:'Montserrat',sans-serif;font-weight:700}p{color:#5C5020;font-size:12px}table{width:100%;border-collapse:collapse;margin-top:16px;font-size:12px}th{text-align:left;background:#FEF9E7;border-bottom:2px solid #C9960A;padding:6px}td{border-bottom:1px solid #EDE8D4;padding:6px}</style></head><body>
      <h1>Parroquia de San Pedro Apostol — ${out.name}</h1><p>${out.range} · Generated by ${auth.name} · ${fmtDT(nowStamp())}</p>
      <table><thead><tr>${out.head.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${out.rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>
      <script>window.onload=()=>{(document.fonts?document.fonts.ready:Promise.resolve()).then(()=>window.print())}</script></body></html>`;
    openBlobPrint(html);
    log({ module:"Reports", actionType:"Print Report", recordType:"Report", recordId:out.name, desc:`${who(auth)} printed the ${out.name} (${out.range}) at ${clock()}.` });
  }

  return (
    <div>
      <PageHead title="Reports" sub="Choose a report, set the date range and filters, then generate."
        right={auth.role === "admin" && <div style={{ display:"flex", gap:6 }}>
          <button style={chipBtn(tab === "generate")} onClick={() => setTab("generate")}>Generate</button>
          <button style={chipBtn(tab === "archive")} onClick={() => setTab("archive")}>Reports Archive / Export</button></div>}/>
      {tab === "generate" ? (
        <div style={{ display:"grid", gridTemplateColumns:"260px 1fr", gap:16, alignItems:"start" }}>
          <Card>
            <CardHead title="Report type"/>
            {REPORTS.map(r => (
              <button key={r} onClick={() => { setRep(r); setOut(null); }}
                style={{ width:"100%", textAlign:"left", padding:"8px 14px", border:"none", borderBottom:`1px solid ${T.border}`, cursor:"pointer", fontSize:16,
                  background: rep === r ? T.priLight : "#fff", color: rep === r ? T.priHov : T.text, fontWeight: rep === r ? 700 : 400,
                  borderLeft: rep === r ? `2px solid ${T.primary}` : "2px solid transparent" }}>{r}</button>
            ))}
          </Card>
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <Card>
              <div style={{ padding:14, display:"flex", gap:12, alignItems:"flex-end", flexWrap:"wrap" }}>
                <div><FL>From</FL><FI type="date" value={from} onChange={e => setFrom(e.target.value)}/></div>
                <div><FL>To</FL><FI type="date" value={to} onChange={e => setTo(e.target.value)}/></div>
                <div style={{ width:220 }}><FL>Service</FL><FS value={svcF} onChange={e => setSvcF(e.target.value)}><option value="all">All services</option>{SACR_LIST.map(s => <option key={s}>{s}</option>)}</FS></div>
                <span style={{ flex:1 }}/>
                <Btn onClick={generate}>Generate</Btn>
                <Btn variant="outline" disabled={!out} onClick={exportCSV}>Export CSV</Btn>
                <Btn variant="outline" disabled={!out} onClick={printRep}>Print</Btn>
              </div>
            </Card>
            <Card>
              <CardHead title={out ? `Preview · ${out.name}` : "Preview"} sub={out ? `${out.range} · ${out.rows.length} row(s)` : "Generate a report to preview it here."}/>
              {out && <div style={{ overflowX:"auto", maxHeight:460 }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead><tr>{out.head.map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                  <tbody>{out.rows.length === 0 ? <EmptyRow cols={out.head.length} text="No data in this range."/> :
                    out.rows.map((r, i) => <tr key={i} style={{ borderTop:`1px solid ${T.border}` }}>{r.map((c, j) => <td key={j} style={{ ...TD, fontSize:15 }}>{c}</td>)}</tr>)}</tbody>
                </table>
              </div>}
            </Card>
          </div>
        </div>
      ) : (
        <Card>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr>{["ID","Report","Range","Generated By","Generated At","Rows",""].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
            <tbody>{archive.map(a => (
              <tr key={a.id} style={{ borderTop:`1px solid ${T.border}` }}>
                <td style={{ ...TD, fontFamily:F.body, letterSpacing:".03em", fontSize:15 }}>{a.id}</td><td style={{ ...TD, fontWeight:600 }}>{a.name}</td>
                <td style={TD}>{a.range}</td><td style={TD}>{a.by}</td><td style={{ ...TD, fontSize:15 }}>{fmtDT(a.at)}</td><td style={TD}>{a.rows}</td>
                <td style={TD}><button style={linkBtn} onClick={() => { setRep(a.name as ReportName); setTab("generate"); setOut(null); }}>Regenerate</button></td>
              </tr>))}</tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

/* ─── STAFF ACCOUNTS ─────────────────────────────────────── */
function StaffAccountsView({ accounts, setAccounts }: { accounts: StaffAccount[]; setAccounts: SetA<StaffAccount[]> }) {
  const { auth, push, log } = useApp();
  const [q, setQ] = useState("");
  const [form, setForm] = useState<StaffAccount | null>(null);
  const [err, setErr] = useState("");
  const [confirm, setConfirm] = useState<{ kind: "deactivate"|"activate"|"reset"|"role"; acc: StaffAccount; pending?: StaffAccount } | null>(null);
  const rows = accounts.filter(a => !q || [a.empId, a.name, a.username, a.position].some(v => v.toLowerCase().includes(q.toLowerCase())));
  const base = (a: StaffAccount) => ({ module:"Staff Accounts", client:a.name, recordType:"Staff Account", recordId:a.empId });

  function commit(f: StaffAccount, reason = "") {
    const isNew = !f.id;
    const old = accounts.find(a => a.id === f.id);
    if (isNew) {
      const saved = { ...f, id:`U-${accounts.length + 1}`, lastLogin:"" };
      setAccounts(l => [...l, saved]);
      log({ ...base(saved), actionType:"Create Account", desc:`${who(auth)} created the ${saved.role === "admin" ? "Admin" : "Staff"} account of ${saved.name} (@${saved.username}) at ${clock()}.`,
        next:{ Username:saved.username, Role:saved.role === "admin" ? "Admin" : "Staff", Position:saved.position } });
      push("success", `Account created. A temporary password was issued to ${saved.name} privately.`);
    } else {
      setAccounts(l => l.map(a => a.id === f.id ? f : a));
      const prev: Record<string,string> = {}, next: Record<string,string> = {};
      (["name","username","position","role"] as const).forEach(k => { if (old![k] !== f[k]) { prev[k] = String(old![k]); next[k] = String(f[k]); } });
      log({ ...base(f), actionType: old!.role !== f.role ? "Change Role" : "Edit Account", reason, prev, next,
        desc: old!.role !== f.role ? `${who(auth)} changed the role of ${f.name} from ${old!.role === "admin" ? "Admin" : "Staff"} to ${f.role === "admin" ? "Admin" : "Staff"} at ${clock()}.`
          : `${who(auth)} edited the account of ${f.name} at ${clock()}.` });
      push("success", "Account updated.");
    }
    setForm(null); setConfirm(null);
  }
  function save() {
    const f = form!;
    if (!f.empId.trim() || !f.name.trim() || !f.username.trim() || !f.position.trim()) { setErr("All fields are required."); return; }
    if (!/^[a-z0-9._]{3,}$/.test(f.username)) { setErr("Username: at least 3 lowercase letters, digits, dots or underscores."); return; }
    if (accounts.some(a => a.id !== f.id && a.username === f.username)) { setErr("That username is taken."); return; }
    if (accounts.some(a => a.id !== f.id && a.empId === f.empId)) { setErr("That Employee ID is already in use."); return; }
    const old = accounts.find(a => a.id === f.id);
    if (old && old.role !== f.role) { setConfirm({ kind:"role", acc:old, pending:f }); return; }
    commit(f);
  }
  function onConfirm(reason: string) {
    const c = confirm!; const a = c.acc;
    if (c.kind === "role") return commit(c.pending!, reason);
    if (c.kind === "reset") {
      log({ ...base(a), actionType:"Password Reset", reason, desc:`${who(auth)} reset the password of ${a.name} at ${clock()}.` });
      push("success", `Password reset. ${a.name} must set a new password at next sign-in.`);
    } else {
      const status = c.kind === "deactivate" ? "inactive" : "active";
      setAccounts(l => l.map(x => x.id === a.id ? { ...x, status } : x));
      log({ ...base(a), actionType: c.kind === "deactivate" ? "Deactivate Account" : "Activate Account", reason,
        prev:{ Status: a.status === "active" ? "Active" : "Inactive" }, next:{ Status: status === "active" ? "Active" : "Inactive" },
        desc:`${who(auth)} ${c.kind === "deactivate" ? "deactivated" : "reactivated"} the account of ${a.name} at ${clock()}.` });
      push("info", `${a.name} is now ${status === "active" ? "Active" : "Inactive"}.`);
    }
    setConfirm(null);
  }
  const fs = (p: Partial<StaffAccount>) => { setForm(f => f ? { ...f, ...p } : f); setErr(""); };

  return (
    <div>
      <PageHead title="Staff Accounts" sub="Accounts are never deleted. Deactivate to remove access."
        right={<><SearchBox value={q} set={setQ} placeholder="Search name, username, Employee ID" width={240}/>
          <Btn onClick={() => { setErr(""); setForm({ id:"", empId:`PDSPA-EMP-${pad(accounts.length + 1).padStart(3,"0")}`, name:"", username:"", position:"Parish Secretary", role:"staff", superadmin:false, status:"active", lastLogin:"" }); }}>+ Create Account</Btn></>}/>
      <Card>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr>{["Employee ID","Full Name","Username","Position","Role","Status","Last Login",""].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
          <tbody>{rows.map(a => {
            const self = a.username === auth.username;
            return (
              <tr key={a.id} style={{ borderTop:`1px solid ${T.border}`, opacity: a.status === "inactive" ? .7 : 1 }}>
                <td style={{ ...TD, fontFamily:F.body, letterSpacing:".03em", fontSize:15 }}>{a.empId}</td>
                <td style={{ ...TD, fontWeight:600 }}>{a.name}{self && <span style={{ fontSize:14, color:T.muted, fontWeight:400 }}> (you)</span>}</td>
                <td style={{ ...TD, fontFamily:F.body, letterSpacing:".03em", fontSize:15 }}>@{a.username}</td>
                <td style={{ ...TD, fontSize:15 }}>{a.position}</td>
                <td style={TD}><RoleTag a={a}/></td>
                <td style={TD}><SPill s={a.status}/></td>
                <td style={{ ...TD, fontSize:15 }}>{a.lastLogin ? fmtDT(a.lastLogin) : "—"}</td>
                <td style={{ ...TD, whiteSpace:"nowrap" }}>
                  <button style={linkBtn} disabled={a.superadmin && !auth.superadmin} onClick={() => { setErr(""); setForm(a); }}>Edit</button>{"  ·  "}
                  <button style={linkBtn} onClick={() => setConfirm({ kind:"reset", acc:a })}>Reset Password</button>{"  ·  "}
                  {a.status === "active"
                    ? <button style={{ ...linkBtn, color: self || a.superadmin ? T.muted : T.red, cursor: self || a.superadmin ? "not-allowed" : "pointer" }} disabled={self || a.superadmin}
                        title={a.superadmin ? "The designated Superadmin account cannot be deactivated here" : self ? "You cannot deactivate your own account" : ""}
                        onClick={() => setConfirm({ kind:"deactivate", acc:a })}>Deactivate</button>
                    : <button style={linkBtn} onClick={() => setConfirm({ kind:"activate", acc:a })}>Activate</button>}
                </td>
              </tr>
            );
          })}</tbody>
        </table>
      </Card>
      <p style={{ fontSize:14, color:T.muted, marginTop:8 }}>The Superadmin is a designated Admin account and is not assignable from this screen.</p>

      <Modal open={!!form} title={form?.id ? `Edit ${form.name}` : "Create Account"} onClose={() => setForm(null)} maxW={560}
        footer={<><Btn variant="ghost" onClick={() => setForm(null)}>Cancel</Btn><Btn onClick={save}>{form?.id ? "Save Changes" : "Create Account"}</Btn></>}>
        {form && <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={g2}>
            <div><FL req>Employee ID</FL><FI value={form.empId} onChange={e => fs({ empId:e.target.value })}/></div>
            <div><FL req>Full Name</FL><FI value={form.name} onChange={e => fs({ name:e.target.value })}/></div>
          </div>
          <div style={g2}>
            <div><FL req>Username</FL><FI value={form.username} onChange={e => fs({ username:e.target.value.toLowerCase() })}/></div>
            <div><FL req>Position</FL><FI value={form.position} onChange={e => fs({ position:e.target.value })}/></div>
          </div>
          <div style={g2}>
            <div><FL req>Role</FL><FS value={form.role} disabled={form.superadmin || form.username === auth.username} onChange={e => fs({ role:e.target.value as UserRole })}>
              <option value="staff">Staff</option><option value="admin">Admin</option></FS></div>
            <div><FL>Status</FL><FI value={form.status === "active" ? "Active" : "Inactive"} readOnly style={{ background:T.bg }}/></div>
          </div>
          {!form.id && <Notice>A one-time temporary password is generated and handed to the user privately. It is never shown on screen or in the Activity Log.</Notice>}
          <Err m={err}/>
        </div>}
      </Modal>

      <ConfirmModal open={!!confirm} danger={confirm?.kind === "deactivate"}
        title={{ deactivate:"Deactivate Account", activate:"Activate Account", reset:"Reset Password", role:"Change Role" }[confirm?.kind ?? "reset"]}
        confirmLabel={{ deactivate:"Deactivate", activate:"Activate", reset:"Reset Password", role:"Change Role" }[confirm?.kind ?? "reset"]}
        message={confirm && ({
          deactivate:<>Deactivate <b>{confirm.acc.name}</b>? They can no longer sign in. The account and its history stay on file.</>,
          activate:<>Reactivate <b>{confirm.acc.name}</b>? They will be able to sign in again.</>,
          reset:<>Reset the password of <b>{confirm.acc.name}</b>? A temporary password is issued privately and they must change it at next sign-in.</>,
          role:<>Change the role of <b>{confirm.acc.name}</b> to <b>{confirm.pending?.role === "admin" ? "Admin" : "Staff"}</b>? This changes what they can access.</>,
        }[confirm.kind])}
        reasonLabel="Reason" reasonRequired onClose={() => setConfirm(null)} onConfirm={onConfirm}/>
    </div>
  );
}

/* ─── SERVICE CONFIGURATION ──────────────────────────────── */
function ServicesView({ services, setServices }: { services: Service[]; setServices: SetA<Service[]> }) {
  const { auth, push, log } = useApp();
  const [sel, setSel] = useState<string>(services[0]?.id ?? "");
  const cur = services.find(s => s.id === sel)!;
  const [d, setD] = useState<Service>(cur);
  useEffect(() => { const s = services.find(x => x.id === sel); if (s) setD(s); }, [sel]);
  const dirty = JSON.stringify(d) !== JSON.stringify(cur);
  const set = (p: Partial<Service>) => setD(x => ({ ...x, ...p }));
  function save() {
    if (d.fee < 0 || (d.schedulable && d.duration < 15)) { push("error", "Check the fee and duration (minimum 15 minutes)."); return; }
    const prev: Record<string,string> = {}, next: Record<string,string> = {};
    (Object.keys(d) as (keyof Service)[]).forEach(k => { if (d[k] !== cur[k]) { prev[k] = String(cur[k]); next[k] = String(d[k]); } });
    setServices(l => l.map(s => s.id === d.id ? d : s));
    log({ module:"Service Configuration", actionType:"Update Service", recordType:"Service", recordId:d.name, prev, next,
      desc:`${who(auth)} updated the ${d.name} service configuration at ${clock()}.` });
    push("success", `${d.name} saved.`);
  }
  return (
    <div>
      <PageHead title="Service Configuration" sub="Fees, printing and scheduling rules for each parish service."/>
      <div style={{ display:"grid", gridTemplateColumns:"280px 1fr", gap:16, alignItems:"start" }}>
        <Card>
          {services.map(s => (
            <button key={s.id} onClick={() => setSel(s.id)}
              style={{ width:"100%", textAlign:"left", padding:"10px 14px", border:"none", borderBottom:`1px solid ${T.border}`, cursor:"pointer",
                background: sel === s.id ? T.priLight : "#fff", borderLeft: sel === s.id ? `2px solid ${T.primary}` : "2px solid transparent" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:16, fontWeight:600, color:T.text }}>{s.name}</span>
                <SPill s={s.active ? "active" : "inactive"}/>
              </div>
              <div style={{ fontSize:14, color:T.muted, marginTop:2 }}>{peso(s.fee)}{s.schedulable ? ` · ${s.duration} min · ${s.calCategory}` : " · document service"}</div>
            </button>
          ))}
        </Card>
        {cur && <Card>
          <CardHead title={d.name} sub="Changes apply to new requests" right={<><Btn variant="ghost" size="sm" disabled={!dirty} onClick={() => setD(cur)}>Discard</Btn><Btn size="sm" disabled={!dirty} onClick={save}>Save</Btn></>}/>
          <div style={{ padding:16, display:"flex", flexDirection:"column", gap:14 }}>
            <div style={g2}>
              <div><FL>Service name</FL><FI value={d.name} readOnly style={{ background:T.bg }}/></div>
              <div><FL req>Base fee (₱)</FL><FI type="number" min={0} step={50} value={d.fee} onChange={e => set({ fee:Number(e.target.value) })}/></div>
            </div>
            <div><FL>Description</FL><FT rows={2} value={d.description} onChange={e => set({ description:e.target.value })}/></div>
            <Divider/>
            <div style={g2}>
              <Toggle on={d.requiresPrinting} set={v => set({ requiresPrinting:v })} label="Requires Printing" hint={PRINTABLE.includes(d.name) ? "Uses an approved certificate template" : "No approved template yet"}/>
              <Toggle on={d.active} set={v => set({ active:v })} label="Active" hint="Inactive services cannot be requested"/>
              <Toggle on={d.schedulable} set={v => set({ schedulable:v, requiresAppt: v ? d.requiresAppt : false })} label="Is Schedulable" hint="Appears on the Calendar once approved"/>
              <Toggle on={d.requiresAppt} disabled={!d.schedulable} set={v => set({ requiresAppt:v })} label="Requires Appointment" hint="Client must request a preferred schedule"/>
            </div>
            <div style={g2}>
              <div><FL>Default Duration</FL><FS value={d.duration} disabled={!d.schedulable} onChange={e => set({ duration:Number(e.target.value) })}>
                {[15,30,45,60,90,120,180].map(m => <option key={m} value={m}>{m} minutes</option>)}</FS></div>
              <div><FL>Calendar Category</FL><FS value={d.calCategory} disabled={!d.schedulable} onChange={e => set({ calCategory:e.target.value })}>
                <option value="">— none —</option>{MASS_CATS.map(c => <option key={c}>{c}</option>)}</FS></div>
            </div>
          </div>
        </Card>}
      </div>
    </div>
  );
}

/* ─── SYSTEM SETTINGS ────────────────────────────────────── */
function SettingsView({ settings, setSettings, logoB64 }: { settings: ParishSettings; setSettings: SetA<ParishSettings>; logoB64: string }) {
  const { auth, push, log } = useApp();
  const [d, setD] = useState(settings);
  const [restore, setRestore] = useState(false);
  const dirty = JSON.stringify(d) !== JSON.stringify(settings);
  const f = (k: keyof ParishSettings, label: string, area?: boolean) => (
    <div><FL>{label}</FL>{area ? <FT rows={2} value={d[k]} onChange={e => setD({ ...d, [k]:e.target.value })}/> : <FI value={d[k]} onChange={e => setD({ ...d, [k]:e.target.value })}/>}</div>
  );
  function save() {
    const prev: Record<string,string> = {}, next: Record<string,string> = {};
    (Object.keys(d) as (keyof ParishSettings)[]).forEach(k => { if (d[k] !== settings[k]) { prev[k] = settings[k]; next[k] = d[k]; } });
    setSettings(d);
    log({ module:"System Settings", actionType:"Update Settings", recordType:"Settings", recordId:"Parish Profile", prev, next, desc:`${who(auth)} updated the system settings at ${clock()}.` });
    push("success", "Settings saved.");
  }
  return (
    <div>
      <PageHead title="System Settings" sub="Parish profile, office hours, branding and data backup. Service fees and rules are in Service Configuration."
        right={<><Btn variant="ghost" disabled={!dirty} onClick={() => setD(settings)}>Discard</Btn><Btn disabled={!dirty} onClick={save}>Save Settings</Btn></>}/>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, alignItems:"start" }}>
        <Card><CardHead title="Parish Profile"/><div style={{ padding:16, display:"flex", flexDirection:"column", gap:12 }}>
          {f("parishName","Parish name")}{f("diocese","Diocese")}{f("address","Address", true)}
          <div style={g2}>{f("phone","Phone")}{f("email","Email")}</div>{f("facebook","Facebook page")}
        </div></Card>
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <Card><CardHead title="Office Hours" sub="Use Closed Office Day on the Calendar for exceptions"/><div style={{ padding:16, display:"flex", flexDirection:"column", gap:12 }}>
            {f("hoursWeekday","Monday – Friday")}<div style={g2}>{f("hoursSat","Saturday")}{f("hoursSun","Sunday")}</div>
          </div></Card>
          <Card><CardHead title="Branding & Certificate Header"/><div style={{ padding:16, display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ display:"flex", gap:14, alignItems:"center" }}>
              <div style={{ width:64, height:64, border:`1px solid ${T.border}`, borderRadius:8, padding:4 }}><ImageWithFallback src={logoB64 || logoSrc} alt="Parish seal" style={{ width:"100%", height:"100%", objectFit:"contain" }}/></div>
              <div><div style={{ fontSize:16, fontWeight:600 }}>Parish seal</div><div style={{ fontSize:14, color:T.muted }}>Used on the sidebar, login and certificate header. PNG, square.</div>
                <Btn variant="outline" size="sm" style={{ marginTop:6 }} onClick={() => push("info", "Logo upload is handled by the system administrator.")}>Replace logo</Btn></div>
            </div>
            <div style={g2}>{f("certSignatory","Certificate signatory")}{f("certSignatoryTitle","Signatory title")}</div>
            {f("certFooter","Certificate footer note", true)}
          </div></Card>
          <Card><CardHead title="Backup & Restore"/><div style={{ padding:16, display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ fontSize:15, color:T.sub }}>Last automatic backup: <b>{fmtDT(`${todayISO()}T02:00:00`)}</b></div>
            <div style={{ display:"flex", gap:8 }}>
              <Btn variant="outline" size="sm" onClick={() => { log({ module:"System Settings", actionType:"Backup", recordType:"Backup", recordId:`BKP-${todayISO()}`, desc:`${who(auth)} created a manual backup at ${clock()}.` }); push("success", "Backup created."); }}>Create Backup Now</Btn>
              <Btn variant="danger" size="sm" disabled={!auth.superadmin} onClick={() => setRestore(true)}>Restore from Backup</Btn>
            </div>
            {!auth.superadmin && <p style={{ fontSize:14, color:T.muted, margin:0 }}>Restore is limited to the designated Superadmin.</p>}
          </div></Card>
        </div>
      </div>
      <ConfirmModal open={restore} title="Restore from Backup" danger confirmLabel="Restore" reasonLabel="Reason for restore" reasonRequired
        message="Restoring replaces current records with the selected backup. The Activity Log is preserved." onClose={() => setRestore(false)}
        onConfirm={reason => { log({ module:"System Settings", actionType:"Restore", recordType:"Backup", recordId:`BKP-${todayISO()}`, reason, desc:`${who(auth)} requested a restore from backup at ${clock()}.` }); push("info", "Restore request recorded."); setRestore(false); }}/>
    </div>
  );
}

/* ─── ACTIVITY LOGS / AUDIT LOGS ─────────────────────────── */
function AuditLogsView({ logs, accounts }: { logs: AuditLog[]; accounts: StaffAccount[] }) {
  const { auth, log } = useApp();
  const [acct, setAcct] = useState("all"); const [mod, setMod] = useState("all"); const [act, setAct] = useState("all");
  const [from, setFrom] = useState(""); const [to, setTo] = useState(""); const [client, setClient] = useState(""); const [q, setQ] = useState("");
  const [sel, setSel] = useState<AuditLog | null>(null);
  const modules = [...new Set(logs.map(l => l.module))].sort();
  const actions = [...new Set(logs.map(l => l.actionType))].sort();
  const rows = logs.filter(l => (acct === "all" || l.username === acct) && (mod === "all" || l.module === mod) && (act === "all" || l.actionType === act) &&
    (!from || l.at.slice(0,10) >= from) && (!to || l.at.slice(0,10) <= to) &&
    (!client || `${l.client} ${l.recordId}`.toLowerCase().includes(client.toLowerCase())) &&
    (!q || `${l.desc} ${l.reason} ${l.actor} ${l.username}`.toLowerCase().includes(q.toLowerCase())));
  const reset = () => { setAcct("all"); setMod("all"); setAct("all"); setFrom(""); setTo(""); setClient(""); setQ(""); };
  function exp() {
    downloadCSV("activity-log.csv", [["Log ID","Date & Time","Staff/Admin","Username","Action","Module","Client/Record","Details","Reason"],
      ...rows.map(l => [l.id, l.at.replace("T"," "), l.actor || "—", l.username, l.actionType, l.module, [l.client, l.recordId].filter(Boolean).join(" · "), l.desc, l.reason])]);
    log({ module:"Activity Logs", actionType:"Export Logs", recordType:"Activity Log", recordId:`${rows.length} entries`, desc:`${who(auth)} exported ${rows.length} Activity Log entries at ${clock()}.` });
  }
  const kv = (o?: Record<string,string>) => o && Object.keys(o).length ? Object.entries(o).map(([k, v]) => `${k}: ${v}`).join("\n") : "";

  return (
    <div>
      <PageHead title="Activity Logs / Audit Logs" sub="Every action in SARMS is recorded automatically. Historical records are read-only."
        right={<Btn variant="outline" onClick={exp}>Export CSV</Btn>}/>
      <Card style={{ marginBottom:12 }}>
        <div style={{ padding:12, display:"grid", gridTemplateColumns:"1.1fr 1fr 1fr .8fr .8fr 1fr 1.3fr auto", gap:8, alignItems:"end" }}>
          <div><FL>Account</FL><FS value={acct} onChange={e => setAcct(e.target.value)}><option value="all">All accounts</option>{accounts.map(a => <option key={a.id} value={a.username}>{a.name}</option>)}</FS></div>
          <div><FL>Module</FL><FS value={mod} onChange={e => setMod(e.target.value)}><option value="all">All modules</option>{modules.map(m => <option key={m}>{m}</option>)}</FS></div>
          <div><FL>Action type</FL><FS value={act} onChange={e => setAct(e.target.value)}><option value="all">All actions</option>{actions.map(m => <option key={m}>{m}</option>)}</FS></div>
          <div><FL>From</FL><FI type="date" value={from} onChange={e => setFrom(e.target.value)}/></div>
          <div><FL>To</FL><FI type="date" value={to} onChange={e => setTo(e.target.value)}/></div>
          <div><FL>Client / Record</FL><FI value={client} onChange={e => setClient(e.target.value)} placeholder="Name or ID"/></div>
          <div><FL>Search</FL><FI value={q} onChange={e => setQ(e.target.value)} placeholder="Search details"/></div>
          <Btn variant="ghost" size="sm" onClick={reset}>Reset</Btn>
        </div>
      </Card>
      <Card>
        <CardHead title={`${rows.length} entr${rows.length === 1 ? "y" : "ies"}`} sub="Read-only · export only"/>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr>{["Date & Time","Staff / Admin","Action","Module","Client / Record","Details"].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.length === 0 && <EmptyRow cols={6} text="No log entries match these filters."/>}
            {rows.map(l => (
              <tr key={l.id} onClick={() => setSel(l)} style={{ borderTop:`1px solid ${T.border}`, cursor:"pointer" }}
                onMouseEnter={e => (e.currentTarget.style.background = T.bg)} onMouseLeave={e => (e.currentTarget.style.background = "")}>
                <td style={{ ...TD, fontSize:15, whiteSpace:"nowrap" }}>{fmtDT(l.at)}</td>
                <td style={{ ...TD, fontSize:15 }}>{l.actor || <span style={{ color:T.muted }}>— ({l.username})</span>}</td>
                <td style={TD}><span style={{ fontSize:14, fontWeight:600, padding:"2px 7px", borderRadius:4,
                  background: l.actionType === "Failed Login" ? T.redL : T.priLight, color: l.actionType === "Failed Login" ? T.red : T.priHov, whiteSpace:"nowrap" }}>{l.actionType}</span></td>
                <td style={{ ...TD, fontSize:15 }}>{l.module}</td>
                <td style={{ ...TD, fontSize:15 }}>{l.client || "—"}{l.recordId && <div style={{ fontSize:14, color:T.muted, fontFamily:F.body, letterSpacing:".03em" }}>{l.recordId}</div>}</td>
                <td style={{ ...TD, fontSize:15, color:T.sub, maxWidth:420 }}>{l.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Drawer open={!!sel} title={sel?.actionType ?? ""} sub={sel ? `${sel.id} · ${fmtDT(sel.at)}` : ""} onClose={() => setSel(null)}>
        {sel && <>
          <p style={{ fontSize:16, color:T.text, lineHeight:1.55, marginTop:0 }}>{sel.desc}</p>
          <KV k="Log ID" v={sel.id} mono/><KV k="Date & Time" v={fmtDT(sel.at)}/><KV k="Staff / Admin" v={sel.actor}/>
          <KV k={sel.actionType === "Failed Login" ? "Attempted username" : "Username"} v={sel.username} mono/>
          <KV k="Action Type" v={sel.actionType}/><KV k="Module" v={sel.module}/><KV k="Client" v={sel.client}/>
          <KV k="Record Type" v={sel.recordType}/><KV k="Record ID" v={sel.recordId} mono/><KV k="Reason" v={sel.reason}/>
          <KV k="Previous Value" v={kv(sel.prev) && <span style={{ whiteSpace:"pre-line" }}>{kv(sel.prev)}</span>}/>
          <KV k="New Value" v={kv(sel.next) && <span style={{ whiteSpace:"pre-line" }}>{kv(sel.next)}</span>}/>
          <KV k="Device" v={sel.device}/><KV k="IP Address" v={sel.ip} mono/>
          <div style={{ marginTop:12 }}><Notice>This record is read-only and cannot be edited or deleted. Passwords are never recorded.</Notice></div>
        </>}
      </Drawer>
    </div>
  );
}

/* ─── APP ROOT ───────────────────────────────────────────── */
export default function App() {
  const hashMode = () => (typeof window !== "undefined" && window.location.hash.startsWith("#/website") ? "public" : "staff") as "staff" | "public";
  const [mode, setMode] = useState<"public" | "staff">(hashMode);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [view, setView] = useState<View>("dashboard");
  const [focus, setFocus] = useState<Focus>({});
  const [appts, setAppts] = useState(SEED_APPTS);
  const [activities, setActivities] = useState(SEED_ACTIVITIES);
  const [books, setBooks] = useState(SEED_BOOKS);
  const [issuance, setIssuance] = useState(SEED_ISSUANCE);
  const [accounts, setAccounts] = useState(SEED_STAFF);
  const [services, setServices] = useState(SEED_SERVICES);
  const [logs, setLogs] = useState(SEED_LOGS);
  const [settings, setSettings] = useState(SEED_SETTINGS);
  const [marriageData, setMarriageData] = useState<Record<string, MarriageFormData>>({});
  const [marriageFor, setMarriageFor] = useState<string | null>(null);
  const [logoB64, setLogoB64] = useState("");
  const { toasts, push, dismiss } = useToasts();

  /* SARMS (default) and the public website share this one App state; #/website opens the public website. */
  useEffect(() => {
    const onHash = () => setMode(hashMode());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
    const openPublic = () => { window.location.hash = "#/website"; setMode("public"); window.scrollTo({ top:0 }); };

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
  const form97Imgs = { p1: form97p1B64, p2: form97p2B64 };
  const renderCert = (a: Appointment) => generateCertHTML(a, logoB64 || logoSrc as string, marriageData[a.id] ?? BLANK_MARRIAGE, form97Imgs);

  const addLog = useCallback((e: LogInput, who?: Auth) => {
    const a = who ?? auth;
    const entry: AuditLog = { client:"", recordType:"", recordId:"", reason:"", ...e, id:"", at:nowStamp(),
      actor: e.actor ?? a?.name ?? "", username: e.username ?? a?.username ?? "", device:e.device ?? DEVICE, ip:e.ip ?? "192.168.1.24" };
    setLogs(l => {
      const max = l.reduce((m, x) => Math.max(m, parseInt(x.id.replace(/\D/g, ""), 10) || 0), _logid);
      _logid = max + 1;
      return [{ ...entry, id:`LOG-${_logid}` }, ...l];
    });
  }, [auth]);

  /* A request submitted on the public website becomes a normal Pending request in the staff queue. */
  function submitOnline(s: OnlineSubmission): string {
    const id = nid();
    const rec: Appointment = { ...R0, id, submittedAt:nowStamp(), status:"pending", source:"online", parishioner:s.parishioner, contact:s.contact, email:s.email,
      address:s.address, sacramentType:s.sacramentType, subjectName:s.subjectName, dateOfSacrament:s.dateOfSacrament, purposeOf:s.purposeOf, prefDate:s.prefDate, prefTime:s.prefTime };
    setAppts(l => [rec, ...l]);
    addLog({ module:"Requests", actionType:"Online Request Received", actor:"Online Portal", username:"public-website", client:s.parishioner, recordType:"Request", recordId:id,
      desc:`${s.parishioner} submitted a ${s.sacramentType} request for ${s.subjectName} through the public website at ${clock()}.`,
      device:"Public website", ip:"—", next:{ Status:"Pending", Service:s.sacramentType, "Preferred Schedule": s.prefDate ? `${s.prefDate}${s.prefTime ? ` ${s.prefTime}` : ""}` : "—" } });
    return id;
  }

  function login(acc: StaffAccount) {
    const a: Auth = { id:acc.id, name:acc.name, username:acc.username, role:acc.role, superadmin:acc.superadmin, since:nowStamp() };
    setAuth(a); setView("dashboard");
    setAccounts(l => l.map(x => x.id === acc.id ? { ...x, lastLogin:nowStamp() } : x));
    addLog({ module:"Authentication", actionType:"Login", recordType:"Account", recordId:acc.empId, desc:`${who(a)} signed in to SARMS at ${clock()}.` }, a);
    push("success", `Signed in as ${acc.name}.`);
  }
  function failed(username: string, why: string) {
    addLog({ module:"Authentication", actionType:"Failed Login", actor:"", username, recordType:"Account",
      desc:`Failed sign-in attempt for username "${username}" at ${clock()} (${why}).` });
  }
  function logout() {
    if (auth) addLog({ module:"Authentication", actionType:"Logout", recordType:"Account", desc:`${who(auth)} signed out of SARMS at ${clock()}.` });
    setAuth(null); setFocus({});
  }

  const style = <style>{`
    *:focus-visible { outline: 3px solid ${T.primary}; outline-offset: 2px; border-radius: 6px; }
    .sarms-btn-primary:hover:not(:disabled) { background: ${T.text} !important; border-color: ${T.text} !important; }
    .sarms-btn-outline:hover:not(:disabled), .sarms-btn-ghost:hover:not(:disabled) { background: ${T.priLight} !important; }
    .sarms-btn-danger:hover:not(:disabled) { filter: brightness(.9); }
    .sarms-nav:not([aria-current]):hover { background: ${T.priLight} !important; }
    .sarms-close { display:inline-flex; align-items:center; gap:6px; padding:6px 12px; min-height:38px; border-radius:8px; border:1px solid ${T.borderMd}; background:#fff; color:${T.text}; font:600 14px ${F.head}; cursor:pointer; flex-shrink:0; }
    .sarms-close:hover { background:${T.priLight}; }
    tbody tr { transition: background .1s; } tbody tr:nth-child(even) { background: #FFFDF7; } tbody tr:hover { background: ${T.priLight}; }
    input::placeholder, textarea::placeholder { color: #8A7D4C; }
    input[type=checkbox], input[type=radio] { width: 18px; height: 18px; accent-color: ${T.priHov}; }
    body { font-family: ${F.body}; font-size: 16px; line-height: 1.5; background: ${T.bg}; color: ${T.text}; }
    ::-webkit-scrollbar { width: 12px; height: 12px; } ::-webkit-scrollbar-thumb { background: ${T.borderMd}; border-radius: 99px; }
    h1, h2, h3, h4, th { font-family: ${F.head}; }
    @media print { aside { display: none !important; } }
  `}</style>;

  if (mode === "public") {
    return <PublicSite services={services} activities={activities} requests={appts} settings={settings}
      logoSrc={logoSrc as string} bannerSrc={parishBanner as string}
      conflictsFor={(d, st, en) => findConflicts(d, st, en, activities, appts)}
      onSubmit={submitOnline}/>;
  }
  if (!auth) return <>{style}<LoginView accounts={accounts} onLogin={login} onFail={failed} onPublic={openPublic}/><Toasts toasts={toasts} dismiss={dismiss}/></>;

  const go = (v: View, f?: Focus) => { if (!canSee(v, auth)) return; setView(v); setFocus(f ?? {}); };
  const safeView: View = canSee(view, auth) ? view : "dashboard";
  const clearFocus = () => setFocus({});
  const marrAppt = appts.find(a => a.id === marriageFor);
  const ctx: Ctx = { auth, push, log: e => addLog(e), go };

  return (
    <AppCtx.Provider value={ctx}>
      {style}
      <div style={{ display:"flex", minHeight:"100vh", background:T.bg }}>
        <Sidebar view={safeView} setView={v => go(v)} auth={auth} pending={appts.filter(a => a.status === "pending").length} onLogout={logout}/>
        <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column" }}>
          <header style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, padding:"12px 32px", display:"flex", justifyContent:"space-between", alignItems:"center", position:"sticky", top:0, zIndex:20, gap:16 }}>
            <span style={{ display:"flex", alignItems:"center", gap:10, fontSize:15, color:T.sub }}>
              SARMS <ChevronRight size={16}/> <b style={{ fontFamily:F.head, fontSize:16, fontWeight:700, color:T.text }}>{VIEW_LABEL[safeView]}</b>
            </span>
            <span style={{ display:"flex", alignItems:"center", gap:14, fontSize:15, color:T.sub }}>
              <span>{new Date().toLocaleDateString("en-PH", { weekday:"long", month:"long", day:"numeric", year:"numeric" })}</span>
              <Btn variant="ghost" size="sm" onClick={openPublic}>Public website</Btn>
              <Btn variant={helpOpen ? "primary" : "outline"} size="sm" onClick={() => setHelpOpen(h => !h)} aria-expanded={helpOpen}><HelpCircle size={18}/> How to use this page</Btn>
            </span>
          </header>
          {helpOpen && (
            <div style={{ background:T.priLight, borderBottom:`1px solid ${T.borderMd}`, padding:"14px 32px", display:"flex", gap:28, alignItems:"flex-start", flexWrap:"wrap" }}>
              {VIEW_HELP[safeView].map((step, i) => (
                <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", maxWidth:420, fontSize:16, color:T.text, lineHeight:1.45 }}>
                  <span style={{ width:28, height:28, borderRadius:99, background:T.priHov, color:"#fff", fontFamily:F.head, fontWeight:700, display:"inline-flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:15 }}>{i + 1}</span>
                  {step}
                </div>
              ))}
              <button onClick={() => setHelpOpen(false)} className="sarms-close" style={{ marginLeft:"auto" }}><X size={18}/> Hide</button>
            </div>
          )}
          <main style={{ flex:1, padding:"28px 32px 56px", maxWidth:1600, width:"100%" }}>
            {safeView === "dashboard"    && <DashboardView appts={appts} activities={activities} issuance={issuance} logs={logs} accounts={accounts}/>}
            {safeView === "requests"     && <RequestsView appts={appts} setAppts={setAppts} activities={activities} services={services} books={books} issuance={issuance}
                                              focusId={focus.requestId} clearFocus={clearFocus} openMarriage={setMarriageFor}/>}
            {safeView === "calendar"     && <CalendarView activities={activities} setActivities={setActivities} appts={appts}/>}
            {safeView === "book"         && <BookEntityView books={books} setBooks={setBooks} appts={appts} prefill={focus.bookPrefill} clearFocus={clearFocus}/>}
            {safeView === "certificates" && <CertificatesView appts={appts} issuance={issuance} setIssuance={setIssuance} books={books} renderCert={renderCert}
                                              focusId={focus.certRequestId} clearFocus={clearFocus} openMarriage={setMarriageFor}/>}
            {safeView === "issuance"     && <IssuanceView issuance={issuance} setIssuance={setIssuance} appts={appts} renderCert={renderCert}/>}
            {safeView === "reports"      && <ReportsView appts={appts} issuance={issuance} books={books} activities={activities} logs={logs} services={services}/>}
            {safeView === "staff"        && <StaffAccountsView accounts={accounts} setAccounts={setAccounts}/>}
            {safeView === "services"     && <ServicesView services={services} setServices={setServices}/>}
            {safeView === "settings"     && <SettingsView settings={settings} setSettings={setSettings} logoB64={logoB64}/>}
            {safeView === "audit"        && <AuditLogsView logs={logs} accounts={accounts}/>}
          </main>
        </div>
      </div>
      {marrAppt && (
        <MarriageDetailsModal open onClose={() => setMarriageFor(null)} subjectName={marrAppt.subjectName}
          initialData={marriageData[marrAppt.id] ?? BLANK_MARRIAGE}
          onSave={d => {
            setMarriageData(m => ({ ...m, [marrAppt.id]: d }));
            addLog({ module:"Requests", actionType:"Form 97 Saved", client:marrAppt.parishioner, recordType:"Request", recordId:marrAppt.id,
              desc:`${who(auth)} saved the Form 97 marriage data for ${marrAppt.subjectName} at ${clock()}.` });
            push("success", "Form 97 data saved."); setMarriageFor(null);
          }}/>
      )}
      <Toasts toasts={toasts} dismiss={dismiss}/>
    </AppCtx.Provider>
  );
}
