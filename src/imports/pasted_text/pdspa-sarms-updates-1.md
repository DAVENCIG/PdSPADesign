You are updating an existing design: **PdSPA SARMS** (Sacramental and Administrative Records Management System) for Parroquia de San Pedro Apostol, Vinzons, Camarines Norte. Keep the existing visual language — warm gold/cream palette (primary gold ~#C9960A, off-white background ~#FFFDF5, near-black text ~#1A1400), Inter typeface, left sidebar navigation, card-based layout with soft borders and rounded corners. Apply the following changes on top of the current screens: Dashboard, Appointments, Certificates, Book Entries, Funeral / Campo Santo, Calendar, Reports.

---

## 1. Remove Pamisa / Mass Intentions entirely

- Delete the "Mass Intentions" card/section from the Dashboard (the schedule list + "New Booking" tab).
- Remove "Pamisa" from every sacrament/appointment type list, dropdown, and color-coded tag.
- Nothing on Dashboard should reference mass bookings anymore — replace that space with a compact "Upcoming Activities" preview pulling from the new Calendar of Activities (see #2).

## 2. Editable Calendar of Activities

Turn the Calendar screen from a read-only appointment view into a staff-editable activity planner.

- Add an **"Add Activity"** button (top-right of the Calendar header, styled like the existing primary gold button).
- Clicking it opens a form (modal or side panel) with:
  - **Category** (select): Wedding Mass, Funeral Mass, Holy Mass, Barangay Mass, Holiday, Closed Office Day
  - **Title / Description** (text)
  - **Date** (date picker)
  - **Time** (optional, time picker)
  - **Notes** (textarea)
- Each category gets its own accent color, shown as a small color-coded chip/label on the calendar day cell (same visual pattern as the existing sacrament-type tags).
- Clicking a day with entries opens a detail view listing that day's activities and appointments together, with **Edit** and **Delete** actions on each activity (appointments stay read-only here — they're managed from the Appointments screen).
- Appointment-linked dates (existing behavior) should still show alongside the new manually-added activities on the same grid.

## 3. In-person transactions only — remove online-payment styling

The parish now processes everything walk-in / in-person, not online.

- On the **New Appointment Request** and **New Certificate Request** forms, remove the "Reference / Payment No." field styled around online payment (placeholder text like "GCash or bank ref.").
- Replace it with an **"OR No. (Official Receipt)"** field — simple text input, placeholder like "e.g., OR-2026-0001" — reflecting an in-person receipt issued at the counter.

## 4. Marriage record intake — full civil-registry data capture

Add a dedicated, multi-section **"Marriage Details"** form (opened from an appointment/certificate row when the sacrament type is Matrimony), modeled on PSA Municipal Form No. 97. This is a back-office data-entry form — NOT what gets printed for the parishioner (that's #5).

Organize as collapsible sections or a stepped/tabbed form:
1. **Registry Info** — Province, City/Municipality, Registry No.
2. **Husband's Info** — full name, date of birth, age, place of birth, sex, citizenship, residence, religion, civil status, father's name & citizenship, mother's name & citizenship
3. **Wife's Info** — same fields as Husband
4. **Consent / Advice** (conditional, e.g. for a minor party) — name, relationship, residence
5. **Marriage Details** — place of marriage, date, time
6. **Solemnizing Officer & License** — officer name, position/designation, religion/registry no.; license number + issued on/at, OR basis if no license (Family Code Art. 34 exemption / PD 1083 Muslim rites)
7. **Witnesses** — expandable list, at least 4 name fields
8. **Affidavit of Solemnizing Officer** (toggle to include) — officer name & address, names of parties, circumstance (articulo mortis / no transportation available / Muslim or ethnic community rites), date & place signed
9. **Affidavit for Delayed Registration** (toggle to include) — applicant name, civil status, residence, spouse name, marriage date/place, solemnized by, ceremony type, license basis, citizenship (both parties), reason for delay, date & place signed

Use the existing form styling (labeled fields, gold focus states, section headers) — this will be a long form, so lean on clear section dividers and generous spacing.

## 5. Certificate print templates — match the parish's actual paper certificates

Replace the current generic certificate print output with **type-specific templates that replicate the parish's real physical certificates** (reference photos provided separately). Each renders as a bordered, portrait-oriented printable page — double-line rectangular border, parish crest top-left, Diocese of Daet crest top-right (Baptism / Marriage / Death only), centered header text:

> Diocese of Daet
> **PARROQUIA DE SAN PEDRO APOSTOL**
> Anacleto Guinto Street, Brgy. 3, Vinzons, Camarines Norte

...followed by a bold centered certificate title, then the certificate body, and a consistent footer: parish seal placeholder + signature line at bottom-right, a "by:" line at bottom-left, and the disclaimer note *"N.B. Any mark or alteration of any invalidates this certificate."*

**Certificate of Baptism:**
- Centered line: "(Name of Child)"
- "Child of ___ (Father's Name) Of ___ (Place of Birth)"
- "And ___ (Mother's name) Of ___ (Place of Birth)"
- "Was Born in ___ Legitimacy ___"
- "On the ___ day of ___ In the year ___"
- Centered bold italic: **"Was Solemnly Baptized"**
- "On the ___ day of ___ in the year ___"
- "By the Rev. ___"
- "The sponsors being ___ and ___"
- "As appear on Baptismal register no. ___ Page no. ___ Entry no. ___"
- "This Certificate was given for the purpose of ___"
- "Date Issued: ___"
- Signature line labeled **"Parish Priest"**

**Certificate of Marriage** (parish version — simpler than the Form 97 data captured in #4):
- "This Certifies that"
- Two-column layout (Husband | Wife, joined by "and"): Name, Age/Status, Native of, Residence, Father, Mother
- "Were united in HOLY MATRIMONY according to the rites of the Holy Roman Catholic on the ___ day of ___."
- "The Marriage was solemnized by ___"
- "In the presence of ___ and ___" / "Residence of ___" / "Witness as appears from the Marriage Records of this Church."
- "Book no. ___ Page no. ___ Entry no. ___"
- "Date issued: ___"
- Signature line labeled **"Parish Administrator / Parochial Vicar"**

**Certificate of Death:**
- Narrative paragraph style: "This is to certify that ___, a resident of ___, husband/wife/son/daughter of ___, died on the ___ day of ___ at the age of ___, and was buried in the Roman Catholic Cemetery of this Parish on the ___ day of ___. The cause of death was ___. He/She received the last Sacrament of confession, Extreme Unction and Holy Viaticum before death or he/she was not able to receive any Sacrament before death."
- "This is a true copy of the original record as it appears in the Register of Dead of this Parish, Book No. ___, Year ___, Page ___, Line no. ___."
- "In witness whereof I affix my signature and put the seal of this Parroquia de San Pedro Apostol, Vinzons, Camarines Norte, on the ___ day of ___."
- Signature line labeled **"Parish Priest / Parochial Vicar"**

**Certificate of Confirmation** (simpler header — parish crest only, centered, no diocese line):
- Name / Age / Father / Mother / Place of Baptism / Date of Confirmation / Minister / Sponsor (each its own labeled line)
- "Book no. ___ Page no. ___ Entry no. ___" alongside "Remarks: ___"
- "Date issued: ___"
- Signature line labeled **"Parish Priest /Parochial Vicar"**

Each template should pull from the structured record data (child/parties' names, dates, sponsors/witnesses, register references, etc.) captured at intake, and render ready for A4/Letter portrait printing.

---

Keep everything else — Dashboard stat cards, Appointments table, Certificates request flow, Book Entries, Funeral/Campo Santo, Reports — as currently designed. This prompt only covers the changes above.