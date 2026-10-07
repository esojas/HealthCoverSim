const express = require("express");
const db = require("../db");
const { validateQuote, calculateQuote } = require("../calc");

const router = express.Router();

// Turn the request body into a clean row. Applicant 2 fields become NULL for Single.
function toRow(b) {
  const multi = b.cover_type === "Couple" || b.cover_type === "Family";
  return {
    customer_name: String(b.customer_name).trim(),
    cover_type: b.cover_type,
    applicant1_age: Number(b.applicant1_age),
    applicant1_cover_history: b.applicant1_cover_history,
    applicant2_age: multi ? Number(b.applicant2_age) : null,
    applicant2_cover_history: multi ? b.applicant2_cover_history : null,
    hospital_cover: b.hospital_cover,
    extras_cover: b.extras_cover,
    payment_frequency: b.payment_frequency,
    // discount only matters for Yearly; store 0 for Monthly
    annual_discount: b.payment_frequency === "Yearly" ? Number(b.annual_discount ?? 0) : 0,
    notes: b.notes ? String(b.notes) : null,
  };
}

function parseId(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ errors: ["Quote id must be a positive whole number."] });
    return null;
  }
  return id;
}

// LIST
router.get("/", (req, res) => {
  const rows = db.prepare("SELECT * FROM quotes ORDER BY id DESC").all();
  res.json(
    rows.map((row) => {
      const r = calculateQuote(row);
      return {
        ...row,
        monthly: r.monthly,
        yearly_before_discount: r.yearlyBeforeDiscount,
        yearly_after_discount: r.yearlyAfterDiscount,
      };
    })
  );
});

// DETAIL: stored inputs + calculated quote
router.get("/:id", (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const quote = db.prepare("SELECT * FROM quotes WHERE id = ?").get(id);
  if (!quote) return res.status(404).json({ errors: ["Quote not found."] });
  res.json({ quote, result: calculateQuote(quote) });
});

// CREATE
router.post("/", (req, res) => {
  const errors = validateQuote(req.body);
  if (errors.length) return res.status(400).json({ errors });
  const r = toRow(req.body);
  const info = db
    .prepare(
      `INSERT INTO quotes (customer_name, cover_type, applicant1_age, applicant1_cover_history,
         applicant2_age, applicant2_cover_history, hospital_cover, extras_cover,
         payment_frequency, annual_discount, notes)
       VALUES (@customer_name, @cover_type, @applicant1_age, @applicant1_cover_history,
         @applicant2_age, @applicant2_cover_history, @hospital_cover, @extras_cover,
         @payment_frequency, @annual_discount, @notes)`
    )
    .run(r);
  const quote = db.prepare("SELECT * FROM quotes WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json({ quote, result: calculateQuote(quote) });
});

// UPDATE
router.put("/:id", (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  if (!db.prepare("SELECT 1 FROM quotes WHERE id = ?").get(id))
    return res.status(404).json({ errors: ["Quote not found."] });
  const errors = validateQuote(req.body);
  if (errors.length) return res.status(400).json({ errors });
  const r = toRow(req.body);
  db.prepare(
    `UPDATE quotes SET customer_name=@customer_name, cover_type=@cover_type,
       applicant1_age=@applicant1_age, applicant1_cover_history=@applicant1_cover_history,
       applicant2_age=@applicant2_age, applicant2_cover_history=@applicant2_cover_history,
       hospital_cover=@hospital_cover, extras_cover=@extras_cover,
       payment_frequency=@payment_frequency, annual_discount=@annual_discount, notes=@notes
     WHERE id=@id`
  ).run({ ...r, id });
  const quote = db.prepare("SELECT * FROM quotes WHERE id = ?").get(id);
  res.json({ quote, result: calculateQuote(quote) });
});

// DELETE
router.delete("/:id", (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const info = db.prepare("DELETE FROM quotes WHERE id = ?").run(id);
  if (info.changes === 0) return res.status(404).json({ errors: ["Quote not found."] });
  res.status(204).end();
});

module.exports = router;