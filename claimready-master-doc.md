# ClaimReady — Master Project Document
### Build What Moves India Hackathon | Submission Plan

**Builder:** Himesh Kota
**Submission deadline:** August 28, 2026, 8:00 PM IST (no grace period)
**Target internal deadline:** August 28, 4:00 PM IST
**Working title:** ClaimReady (provisional — do not spend time on naming)

---

## 0. The Governing Constraint

Today is **August 23**. There are **five working days**, one of which goes to video production and submission mechanics. This single fact dictates every decision in this document.

Any problem statement requiring novel backend infrastructure, real system integrations, or a wide feature surface is disqualified on arrival — not because the idea is weak, but because a partially-working build scores zero on *"Does the main journey actually work?"*, which is the criterion where most submissions will fail.

**The scope rule for this project:** if a feature is not on the critical path of the citizen journey defined in Section 5, it does not get built.

---

## 1. Problem Selection Criteria

The filter is not "what is the most important problem in Indian public services." It is:

1. **Real and high-frequency** — establishable in ten seconds of video, no setup required
2. **Not the crowded lane** — IRCTC and the Income Tax portal will constitute a large share of submissions; competing there means competing on execution against hundreds of near-identical builds
3. **The OpenAI model is load-bearing** — a redesigned UI with a chatbot bolted on will be read as exactly that
4. **Buildable end-to-end in five days** with mock data
5. **Strong answer to end-to-end thinking** — the fix must be more than a prettier screen

---

## 2. Selected Problem Statement

### EPFO PF claim rejections: the feedback loop is broken

**One-line framing:**
> You submit a PF withdrawal claim, wait 15–20 days, and receive a one-line rejection such as *"Name not matching as per records"* or *"DOJ/DOE not correct"* — with no explanation of what to fix, no way to know whether a resubmission will fail the same way, and no indication of whether the fix requires you, your employer, or the field office.

### Why this problem over the alternatives

**It is universal and unglamorous.** Every salaried person in India has a UAN. Rejection rates on withdrawal claims are high, and rejection reasons are cryptic internal codes written for EPFO staff, not for citizens.

**It is not the crowded lane.** IRCTC gets picked because it is visible. EPFO gets picked less often because it is boring. In a field of a thousand-plus submissions, boring is an advantage.

**The LLM is genuinely necessary.** The system needs to read a passbook or UAN screenshot and extract fields, translate bureaucratic rejection language into a plain-language fix path, do so in Hindi and Kannada, and fuzzy-match names across three different spellings. None of that is a rules engine, and none of it is decorative.

**The product insight is defensible.** The real problem is not the interface — it is that **validation happens after submission, asynchronously, with a twenty-day feedback loop**. The fix is to move validation to the front: a pre-flight check that tells the citizen what will fail *before* they submit. This is precisely what the judging criterion *"does the solution address the backend, infrastructure and processes, not just the interface?"* is asking for.

### Authenticity check

The brief specifies "one real problem **you have faced**." Ground the narrative in a real instance — a PF claim from the Reworked.AI internship, or a family member's withdrawal — and state so explicitly on camera.

**Fallback if that is a genuine stretch:** *Seva Sindhu* certificate applications (income / caste / domicile). Same problem shape, same architecture, hyperlocal to Karnataka, and more likely to be personally experienced through scholarship or college paperwork. The entire plan below transfers with minor changes.

---

## 2A. Evidence Base — Scope and Impact

> **Sourcing rule:** every figure below is traceable to a named source. Do not add a number to the video or summary that cannot be attributed. Verify against the EPFO Annual Report directly before Day 1 ends — structured datasets are available via Dataful.

### Population affected

| Metric | Figure | Source |
|---|---|---|
| Total EPF members (with a PF balance) | **32.56 crore** as of 31 March 2024 | EPFO Annual Report via FACTLY |
| Actively contributing salaried employees | **~7 crore** | Ministry of Labour, FY 2024-25 interest rate announcement |

### Core rejection statistics

| Metric | Figure | Source |
|---|---|---|
| Claims received, 2023-24 | **623 lakh** | EPFO Annual Report via FACTLY |
| Claims rejected, 2023-24 | **~160 lakh (26%)** | EPFO Annual Report via FACTLY |
| Claims pending | **~20 lakh** | EPFO Annual Report via FACTLY |
| Average rejection rate, 2019-20 to 2023-24 | **27%** | FACTLY analysis |
| Average rejection rate, 2014-15 to 2018-19 | **17%** | FACTLY analysis |

### The returned-vs-rejected split — the addressable segment

EPFO's own published breakdown separates two distinct failure modes:

| Metric | Figure |
|---|---|
| Combined return + rejection rate (all claims) | **21.59%** |
| Returned for corrections | **7.82%** |
| Rejected as ineligible | **13.77%** |
| **Final withdrawal claims — rejection rate** | **11.92%** |
| **Final withdrawal claims — return rate** | **13.44%** |

*Source: EPFO, reported via Business Standard*

**This is the single most important table in the document.** The "returned for corrections" bucket is not made up of ineligible people. It is eligible people whose paperwork had a fixable defect that nobody surfaced until after they had already waited. That segment is the entire addressable problem, and a pre-flight validator eliminates it structurally.

### Downstream grievance cost

| Metric | Figure | Source |
|---|---|---|
| EPFiGMS grievances, FY 2023-24 | **16,14,386** | EPFO Annual Report via FACTLY |
| EPFiGMS grievances, FY 2012-13 | **2,48,072** | EPFO Annual Report via FACTLY |
| Growth | **~6x in eleven years** | — |
| EPFiGMS complaints, CY 2025 | **17,54,297** (17,20,489 disposed, 98%) | Lok Sabha reply, March 2026 |
| CPGRAMS complaints, CY 2025 | **2,33,052** (2,28,461 disposed, 98%) | Lok Sabha reply, March 2026 |

**Roughly 20 lakh formal grievances in a single calendar year.**

Framing note: a 98% disposal rate reads as operational success, but a grievance that should never have existed is not a success — it is a cost absorbed by the citizen in time and by the system in staff hours. Use this framing; do not let the 98% stand unchallenged.

Nearly half of all grievances originate in four areas: **non-transfer of PF accumulations, final PF withdrawal, KYC issues at the PF office, and non-settlement of PF advance claims.**

### Parliamentary acknowledgement — the credibility anchor

On **9 March 2026**, MP Asaduddin Owaisi asked in the Lok Sabha whether the government was aware of high EPFO website downtime and why the claim rejection rate was so high.

**Shobha Karandlaje, Minister of State for Labour and Employment**, replied in writing. Two elements of that reply are directly usable:

**1. The official list of rejection causes** — incomplete details, incorrect claim form, date-of-birth mismatch, exit date, Aadhaar details, bank details, non-submission of required documents (death certificate, legal heir certificate), and contribution-related discrepancies.

**2. The critical sentence:** once details are correctly filled and requisite documents attached, the claim is paid within **20 days** — but in case of missing details or documents, it can be rejected.

> **Read that as a product statement.** The government's own position is that the system works if your details are correct and rejects you if they are not — with **no mechanism to tell the citizen which category they are in before the 20-day wait.** That is the exact gap ClaimReady closes, articulated by the ministry itself. Quote it in the video.

**Additional detail worth using:** the ministry's response to the technical complaints was infrastructure — new servers, storage systems, higher equipment capacity, routers and switches, upgraded core applications, enhanced security, a dedicated operations team. *Servers were the answer to a data-quality problem.* That is the product argument in one line.

---

## 2B. The Counter-Narrative — Prepare For This

EPFO has genuinely improved, and the government has publicised it heavily. Assume a judge — or an invited government official at the Bengaluru finals — raises it.

| Improvement | Figure |
|---|---|
| Claims settled FY 2024-25 | **5.08 crore**, worth ₹2,05,932.49 crore (vs 4.45 crore / ₹1,82,838.28 crore in FY 2023-24) |
| Auto-claim settlements FY 2024-25 | **1.87 crore**, up from 89.52 lakh in FY 2023-24 |
| Auto-settlement limit | Raised from ₹1 lakh to **₹5 lakh**, disbursal within 72 hours |
| Advance claims via auto mode, 2024-25 | **59%** |
| Advance claims auto-settled, first 2.5 months FY 2025-26 | **76.52 lakh (~70%)** |
| Member profile corrections self-approved | **97.2%** |
| Employer rejection rate on corrections | **1.1%** |
| Regional office rejection rate on corrections | **0.2%** |

### The question you will be asked

> *"EPFO already solved this with auto-settlement. Why does your build exist?"*

### The answer — rehearse it

Auto-settlement covers **advance claims** — illness, education, marriage, housing — where the member is still employed and the record is already internally consistent. It does **not** cover **final settlement on exit**, which is where failure concentrates: final withdrawal claims carry an **11.92% rejection rate and a 13.44% return rate**, the worst combined figure in the system.

**Automation solved the easy path. What remains in the manual pipeline is precisely the hard residue** — exit-date disputes, name mismatches across Aadhaar / bank / EPFO, employer non-attestation, EPS service-history gaps. Automation did not fix these; it isolated them. Every claim that still fails today fails for a data-reconciliation reason that no amount of server capacity addresses.

Delivering this converts the largest vulnerability in the pitch into evidence of domain understanding.

---

## 2C. Figures To Handle With Caution

Do not put these on a slide without primary-source verification:

- **"Pension and insurance claim rejection crosses 40%"** — plausible, but sourced to a commercial blog. Only use if found in the EPFO Annual Report.
- **"Final settlement rejection rose from ~13% in 2017-18 to ~34% in 2022-23"** — attributed to Congress general secretary Jairam Ramesh. The trend direction is corroborated by the FACTLY analysis, but this is a political statement in a press release. **Government officials will be in the room on 12 September.** Attribute it explicitly as a political claim, or drop it entirely. A partisan citation is an unforced error.

**Primary source of record:** EPFO Annual Reports (claims, rejections, zone-wise figures, settlement timelines). Structured downloads via Dataful.

---

## 3. Product Thesis

The thesis, stated in a single sentence for the video and the summary:

> **Move validation from after submission to before submission.**

Everything else in the build is downstream of this. The redesign, the plain language, the multilingual support — all of it is supporting evidence. The thesis is the process change.

---

## 4. Architecture

This section matters more than any individual feature. The system must be explicitly split, and the split must be **stated out loud in the video**. The single largest scoring risk on this project is being perceived as a chatbot wrapper.

### 4.1 Deterministic rules engine — no LLM

| Component | Responsibility |
|---|---|
| Eligibility logic | Final settlement vs. pension withdrawal vs. advance; service duration, unemployment period, age thresholds |
| Field validation | UAN format, IFSC checksum, bank account format, date consistency |
| Name-match scoring | Fuzzy string distance across Aadhaar / bank / EPFO records |
| Form routing | Which form applies (19 / 10C / 31) — decision tree, not a prompt |

### 4.2 OpenAI model — where judgment is actually required

| Component | Responsibility |
|---|---|
| Vision extraction | Parse uploaded mock passbook / UAN card / bank statement screenshots into structured fields |
| Rejection decoder | Rejection string → `{plain_reason, who_must_fix, exact_steps, docs_needed, est_time}` |
| Multilingual output | English / Hindi / Kannada, same structured payload |
| Conversational intake | User describes situation in their own words; system maps to a form and prefills it |

### 4.3 Critical verification task

> **Verify every EPF rule against EPFO's own published material before hardcoding it.**
> Service-duration thresholds, advance categories, and unemployment-period rules must not be built from memory or from an AI-generated recollection. A judge who knows EPFO will catch a wrong rule instantly.
> **Budget: 90 minutes, Day 1.**

---

## 5. The Citizen Journey (MVP — cut anything not on this list)

1. **Landing** — two doors: *"Will my claim get rejected?"* and *"My claim was rejected — why?"*
2. **Pre-flight check** — mock UAN login → pulls mock EPFO record → runs deterministic validation → red / amber / green readout with each specific mismatch surfaced
3. **Fix path** — for each issue: who fixes it (you / employer / field office), exact steps, documents needed, realistic time estimate
4. **Guided claim** — plain-language conversational intake, correct form auto-selected and prefilled, no jargon
5. **Rejection decoder** — paste or select a real-world rejection string → structured plain-language explanation, fix, and resubmit path
6. **"What's real, what's mocked"** — a dedicated page. Scores directly on the *Honesty* criterion, and almost nobody will build it.

**Stretch — only if Day 4 finishes clean:**
- Auto-drafted EPFiGMS grievance letter
- Status timeline showing predicted vs. actual processing time

**Explicitly cut:**
Admin panels · real auth · databases · animation · dark mode · landing-page hero video · anything decorative

---

## 6. Technical Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js + Tailwind | Boring on purpose |
| Hosting | Vercel | Zero deployment risk |
| Data | Seeded JSON, 4–5 fictional citizens | No database, no migration risk |
| AI | OpenAI API, **server-side only**, structured outputs mode | Keys never exposed; UI renders only validated JSON |
| Build tool | **Codex, tracked visibly in commit history** | Brief requires Codex to be meaningful to the build; video minute two needs receipts |

### Mock citizen profiles — one per failure mode

| Profile | Failure mode |
|---|---|
| Citizen A | Name mismatch across Aadhaar / bank / EPFO |
| Citizen B | Wrong or invalid IFSC |
| Citizen C | Employer has not approved exit / DOE not marked |
| Citizen D | KYC incomplete |
| Citizen E | Clean case — passes pre-flight, submits successfully |

---

## 7. Day-by-Day Execution Plan

### Day 1 — Saturday, August 23 (tonight)
- Lock scope against Section 5. No additions after this.
- **Verify EPF rules from EPFO source material** (90 min, non-negotiable)
- Collect 8–12 real rejection reason strings from public forums — **paraphrase, no personal data**
- Initialise repo, deploy hello-world to Vercel

**Exit condition:** *The deployment pipeline works.* Do not leave this to Day 5.

### Day 2 — Sunday, August 24
- Build deterministic rules engine
- Build mock data model and seed the five citizen profiles
- Build all screen skeletons; every route navigable with dummy content

**Exit condition:** You can click through the entire journey, even if the content is fake.

### Day 3 — Monday, August 25
- Vision extraction from uploaded mock documents
- Rejection decoder with structured output schema
- Language toggle (EN / HI / KN)

**Exit condition:** Both AI features return correct, well-formed structured JSON reliably across repeated calls.

### Day 4 — Tuesday, August 26
- Wire everything end-to-end
- Mobile-first pass
- Slow-connection handling: skeleton states, small bundles, no heavy assets

**Exit condition:** A stranger can complete the journey on a phone without you narrating.

### Day 5 — Wednesday, August 27
- Build the "What's real, what's mocked" page
- Accessibility pass: font size, contrast, tap targets, screen-reader labels
- Seed and document demo credentials
- **FEATURE FREEZE**
- Rough-cut the video

**Exit condition:** No new features exist after today.

### Day 6 — Thursday, August 28 — SUBMIT BY 4:00 PM
- Test on a real budget Android device on throttled 3G
- Final video edit
- 250-word summary
- Submit

**Exit condition:** Every link opens without requesting access.

---

## 8. Video Plan (2:00 hard cap)

| Timestamp | Content |
|---|---|
| **0:00–0:15** | The pain, concretely. Show a real cryptic rejection string on screen. Say who it happened to. |
| **0:15–1:00** | Full citizen journey, one continuous take if possible. Pre-flight catches the error → fix path → clean submission. Do the task; do not narrate features. |
| **1:00–1:40** | Architecture split (deterministic vs. model). Why validation moved to the front. How Codex was used in the build. |
| **1:40–2:00** | What is mocked. How this works at scale — validation exposed as an API EPFO calls at submission time, not twenty days after. |

---

## 9. Submission Checklist

- [ ] Live public link — opens in a browser, **no access request**, no app download
- [ ] Mock consumer login credentials included and tested from a logged-out browser
- [ ] Video ≤ 2:00, hosted on a link that requires no access request
- [ ] Project summary under 250 words
- [ ] Partner's registered email (if team of two) — both partners register and cross-reference
- [ ] Same email address used at every step of the process
- [ ] Tested on a real low-end Android on a throttled connection

---

## 10. Judging Criteria Mapping

| Criterion | Answer |
|---|---|
| **Problem** | Universal, high-volume, personally experienced |
| **Working build** | Full journey, deployed, mobile-tested |
| **Usability** | Plain language, multilingual, low-literacy design, works on slow connections |
| **Product thinking** | Validation moved from post-submission to pre-submission — the entire thesis |
| **End-to-end thinking** | Explicit argument about the process and backend fix, not just screens |
| **Honesty** | Dedicated page listing every mock and every dependency |

---

## 11. Compliance — Brief's Prohibited Actions

Every item below is a hard constraint from the brief. Violation is disqualifying.

- **No** accessing, testing, or interfering with any live government system
- **No** reverse-engineering private systems or using undocumented private APIs
- **No** scraping personal or restricted information
- **No** real Aadhaar numbers, PAN details, passwords, OTPs, payment details, or health data — everything synthetic and labelled
- **No** presenting the prototype as an official government product
- **No** government logos used in a way suggesting approval or partnership
- **No** resubmitting an old project with minor changes
- **No** code, assets, or data used without permission

---

## 12. Risk Register

| Risk | Severity | Mitigation |
|---|---|---|
| **Five days solo is tight** | High | Find a partner within 24 hours. The brief allows teams of two and it roughly doubles capacity. Both must register and cross-reference emails. |
| **"Chatbot wrapper" perception** | High | The deterministic/model split is the defense — but it must be *stated aloud* in the video, not assumed visible. |
| **Wrong EPF rules encoded** | High | Verify from EPFO source material on Day 1. A domain-aware judge will catch errors instantly. |
| **API key exposure / credit drain** | Medium | OpenAI calls server-side only, rate-limited. A reviewer stress-testing the demo must not drain credits mid-judging. |
| **Deployment failure at the deadline** | Medium | Pipeline proven working on Day 1, not Day 5. |
| **Scope creep** | Medium | Section 5 is the contract. Feature freeze on Day 5 is absolute. |
| **Link requires access on submission** | Medium | Test every link from a logged-out incognito browser before submitting. |

---

## 13. Post-Submission Timeline

| Date | Event |
|---|---|
| Aug 28 – Sep 1 | Review; top 250 shortlisted; all submitters emailed |
| Sep 1 – Sep 7 | Mentorship week — WhatsApp group with five mentors from engineering, tech, and OpenAI |
| **Sep 7** | Resubmit improved build, same format, **same email addresses** |
| Sep 8 – 12 | Ten finalists announced; top 250 honoured publicly |
| **Sep 12** | Finalists present live in Bengaluru to founders, creators, mentors, and invited government officials. Winners announced same day. |

**Prizes:** Top 10 — one year of Codex Pro + a Codex Micro · Top 3 — a MacBook additionally · Winner — a trip to San Francisco (subject to visa)

> Note: selection does not guarantee government adoption. The initiative is framed as starting a conversation about better public digital experiences.

---

## 14. Immediate Next Actions

1. Confirm the authenticity anchor — EPFO or the Seva Sindhu fallback
2. Decide solo vs. partner **within 24 hours**
3. Verify EPF rules from EPFO source material (90 min)
4. Initialise repo and prove the Vercel deployment pipeline **tonight**
5. Collect and paraphrase 8–12 rejection reason strings

---

*Choose the problem. Build the solution. Show what better looks like.*
