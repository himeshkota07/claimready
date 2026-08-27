# ClaimReady

A pre-flight check for EPFO PF withdrawal claims. Live: https://claimready-epfo.vercel.app

Moves validation from *after* submission (a 15-20 day wait ending in a one-line rejection) to
*before* submission — a deterministic rules engine checks the same things EPFO checks, upfront,
and an OpenAI model handles the genuinely judgment-shaped parts (reading cryptic rejection text,
conversational intake, document extraction). See [`claimready-master-doc.md`](./claimready-master-doc.md)
for the full plan, and [`/mocked`](https://claimready-epfo.vercel.app/mocked) for exactly what's
real vs simulated in this build.

## Demo credentials

All logins are mock — a 50-profile synthetic database, not a real EPFO integration. Password for
every account: `demo123`.

- **5 hand-authored "flagship" profiles** in [`src/lib/citizens.ts`](./src/lib/citizens.ts), one
  per failure mode called out in the project plan:

  | UAN | Profile | Failure mode |
  |---|---|---|
  | `100200300401` | Citizen A | Name mismatch on both Aadhaar and bank (2 issues) |
  | `100200300402` | Citizen B | Invalid IFSC + bank KYC not seeded (2 issues) |
  | `100200300403` | Citizen C | Employer hasn't approved exit + bank KYC not seeded (2 issues) |
  | `100200300404` | Citizen D | Aadhaar KYC incomplete + bank KYC not seeded (2 issues) |
  | `100200300405` | Citizen E | Clean case — passes pre-flight |

  4 of the 5 featured profiles surface multiple simultaneous issues on
  purpose — the pre-flight check lists every issue it finds, not just one,
  and each gets its own "mark as fixed" simulate toggle.

- **45 procedurally generated profiles** in [`src/lib/citizen-generator.ts`](./src/lib/citizen-generator.ts) —
  a seeded PRNG rolls random name/date/KYC combinations (and independently rolls name mismatches,
  invalid IFSCs, missing KYC, unapproved exits), so the rules engine is genuinely exercised
  against varied data rather than 5 special-cased objects. The seed is fixed, so the set is
  stable across restarts/deploys.

Log in at `/preflight` — one-click buttons for the 5 flagship profiles, plus a search box over
all 50. Each profile's row links to a UAN card and passbook image, **rendered on the fly** from
that citizen's own record (`/api/mock-documents/[uan]/[type]`) — not static files — so vision
extraction can be tested against any of the 50, not just a couple of pre-made samples.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Optional: copy `.env.example` to `.env.local` and set `OPENAI_API_KEY` to enable live AI
features (rejection decoder, guided-claim intake, document extraction). Without it, those
features run a deterministic fallback template — the UI always labels which one ran.

## Architecture

- **Deterministic, no LLM** (`src/lib/rules-engine.ts`, `src/lib/name-match.ts`): eligibility
  logic (Form 19 / 10C / 31), field format validation (UAN, IFSC), fuzzy name-match scoring.
- **OpenAI model** (`src/lib/ai.ts`, called from `src/app/api/*`): rejection decoding, free-text
  intake classification, document vision extraction — the parts that need judgment, not rules.
- **Mock data layer** (`src/lib/citizens.ts`, `citizen-generator.ts`, `bank-lookup.ts`): the
  50-profile synthetic database described above.
- **Mock document rendering** (`src/lib/mock-doc-svg.ts`, `src/app/api/mock-documents/[uan]/[type]`):
  builds a watermarked UAN-card/passbook SVG from a citizen's record and rasterizes it with
  `sharp` at request time — no pre-baked image files.

## Deploy

Auto-deploys to Vercel on every push to `master`.
