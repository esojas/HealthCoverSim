# HealthCoverSim

A small full-stack web app that simulates a private health insurance quote system (Assignment 1, CSE3CWA / CSE5006). Users can create, view, edit and delete quotes. For each quote the app calculates a monthly and yearly premium from the cover type, hospital and extras cover, applicant ages, Lifetime Health Cover (LHC) loading, the family upgrade fee and the annual-payment discount.

This is a learning simulator only. It is not financial advice and does not match any real insurer's pricing.

**Tech stack:** React (Vite) · Node.js + Express · SQLite (better-sqlite3) · plain CSS

## 1. How to install and run

**Requirements:** Node.js 18 or newer and npm.

Open two terminals.

**Terminal 1: backend (port 3001)**

```bash
cd backend
npm install
npm start
```

You should see `HealthCoverSim API on http://localhost:3001`.

**Terminal 2: frontend (port 5173)**

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser. The frontend proxies `/api` requests to the backend, so no extra configuration is needed. Start the backend first.

To check the calculation logic on its own, run `npm run test:calc` inside `backend/`. It runs the Section 7 worked example and prints `PASS` if the result is $472 / $5,664 / $5,380.80.

## 2. How the database is created

The database is a single SQLite file, `backend/healthcover.db`.

- `backend/init.sql` contains the `CREATE TABLE IF NOT EXISTS quotes (...)` statement.
- `backend/db.js` opens the database file and runs `init.sql` every time the server starts.

No manual setup is needed: starting the backend creates the file and table automatically. Data persists between restarts. To reset everything, stop the server and delete `backend/healthcover.db`.

The table stores only the inputs (customer name, cover type, ages, cover histories, hospital and extras levels, payment frequency, discount, notes, created time). `applicant2_age` and `applicant2_cover_history` are `NULL` for Single cover. The premium is **not** stored. It is calculated when a quote is displayed, so the calculation logic lives in one place (`backend/calc.js`).

The table also has `CHECK` constraints (valid cover types, age 18–100, discount 0–10) as a second safety net behind the API validation.

## 3. How the quote calculation works

All logic is in `backend/calc.js`. Hospital and extras are priced separately and then added.

```
hospital (per adult) = hospital tier price × (1 + that adult's LHC loading)
hospital total       = sum over adults (1 for Single, 2 for Couple / Family)
extras total         = extras tier price × adult count
family fee           = $30 if Family, otherwise $0
monthly premium      = hospital total + extras total + family fee
yearly before discount = monthly premium × 12
yearly after discount  = yearly before × (1 − annual discount)   [Yearly payment only]
```

**Base prices (per adult, per month)**

| Hospital | Price | Extras | Price |
|---|---|---|---|
| None | $0 | None | $0 |
| Basic | $90 | Basic | $25 |
| Bronze | $120 | Standard | $45 |
| Silver | $160 | Premium | $70 |
| Gold | $220 | | |

**LHC loading** applies to hospital cover only, never to extras, and is calculated separately for each applicant:

| Cover history | Loading |
|---|---|
| Yes | 0% |
| No | (age − 30) × 2% if age > 30, otherwise 0% |
| Not sure | 0%, plus a warning that the quote may be inaccurate |

If hospital cover is None, no loading is applied.

**Monthly vs yearly.** The annual-payment discount is applied only when the payment frequency is Yearly. Monthly payers see the monthly premium and the yearly premium before discount, and the discount is ignored (the API stores 0% for Monthly quotes). Yearly payers also see the yearly premium after the discount.

**Worked example (Section 7):** Family, Applicant 1 age 40 with no history, Applicant 2 age 35 with history, Silver hospital, Standard extras, paying yearly with a 5% discount.

| Step | Result |
|---|---|
| Applicant 1 | $160 × 1.20 = $192 |
| Applicant 2 | $160 × 1.00 = $160 |
| Hospital total | $352 |
| Extras total | $45 × 2 = $90 |
| Family fee | $30 |
| Monthly premium | $472 |
| Yearly before discount | $5,664 |
| Yearly after 5% discount | $5,380.80 |

## 4. How Family cover is calculated

Family cover counts **2 adults**, exactly like Couple. Each adult pays their own hospital price (with their own LHC loading) and their own extras price. On top of that, a flat **$30 per month family upgrade fee** is added **once**. It covers dependent children under one policy. Children are not entered or priced individually, and the user never enters the fee. It is added automatically for Family cover only.

## 5. Validation

- **Frontend** (`frontend/src/validate.js`): required fields, ages 18–100, discount 0–10%, and Applicant 2 age and history required for Couple / Family. Applicant 2 fields only appear for Couple / Family (React conditional rendering).
- **Backend** (`backend/calc.js`, `validateQuote`): the same rules, checked again on every create and update. Invalid or missing data returns a `400` with a list of clear messages, not a `500`. Malformed JSON and invalid ids also return a `400`.

## 6. API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/quotes` | List quotes (with calculated premiums) |
| GET | `/api/quotes/:id` | One quote plus its full calculated breakdown |
| POST | `/api/quotes` | Create a quote |
| PUT | `/api/quotes/:id` | Update a quote |
| DELETE | `/api/quotes/:id` | Delete a quote |

## 7. Project structure

```
healthcoversim/
├── backend/
│   ├── server.js          Express app
│   ├── db.js              opens SQLite and runs init.sql
│   ├── init.sql           table definition
│   ├── calc.js            validation + premium calculation
│   └── routes/quotes.js   CRUD endpoints
└── frontend/
    └── src/
        ├── App.jsx, main.jsx, styles.css
        ├── api.js, validate.js, format.js
        ├── components/    QuoteForm, PremiumBreakdown
        └── pages/         QuoteList, CreateQuote, QuoteDetail, EditQuote
```

## 8. AI-use statement

- **Tool used:** [Claude, Chatgpt]
- **What it helped with:** [e.g. starter code for the Express routes and React components, debugging, README wording, brainstorming validation cases, double checking logic]
- **What I personally checked or implemented:** [I implement calc, backend, tested Section 7 worked example and confirmed $472 / $5,664 / $5,380.80, tested the edge cases (Couple with Applicant 2 missing, age 0 / 17 / 200, discount 11%, hospital None, extras only, "Not sure")]
- **One decision I made myself:** [I decided to handle the discount by using a bool to check if the user checked yearly or not. If its not yearly then it defaults to 0.]

## 9. Limitation

The LHC loading is simplified as the assignment specifies: `(age − 30) × 2%`. The real scheme caps the loading and removes it after years of continuous cover, and this simulator does not model that, so the numbers should not be used to estimate a real premium.