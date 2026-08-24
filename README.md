# ClaimReady

A pre-flight check for EPFO PF withdrawal claims. Live: https://claimready-epfo.vercel.app

Moves validation from *after* submission (a 15-20 day wait ending in a one-line rejection) to
*before* submission — a deterministic rules engine checks the same things EPFO checks, upfront,
and an OpenAI model handles the genuinely judgment-shaped parts (reading cryptic rejection text,
conversational intake, document extraction). See [`claimready-master-doc.md`](./claimready-master-doc.md)
for the full plan, and [`/mocked`](https://claimready-epfo.vercel.app/mocked) for exactly what's
real vs simulated in this build.

## Demo credentials

All logins are mock — synthetic citizens seeded in [`src/lib/citizens.ts`](./src/lib/citizens.ts),
not a real EPFO integration. Password for all five: `demo123`.

| UAN | Profile | Failure mode |
|---|---|---|
| `100200300401` | Citizen A | Name mismatch (bank vs EPFO record) |
| `100200300402` | Citizen B | Invalid IFSC |
| `100200300403` | Citizen C | Employer hasn't approved exit |
| `100200300404` | Citizen D | KYC incomplete (Aadhaar not verified) |
| `100200300405` | Citizen E | Clean case — passes pre-flight |

Log in at `/preflight` — a one-click picker for these five profiles is on that page.

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

## Deploy

Auto-deploys to Vercel on every push to `master`.
