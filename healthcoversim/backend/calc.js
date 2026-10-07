
const HOSPITAL = { None: 0, Basic: 90, Bronze: 120, Silver: 160, Gold: 220 };
const EXTRAS = { None: 0, Basic: 25, Standard: 45, Premium: 70 };
const COVER_TYPES = ["Single", "Couple", "Family"];
const HISTORIES = ["Yes", "No", "Not sure"];
const FAMILY_FEE = 30;

const LHC_STATEMENT =
  "Lifetime Health Cover loading applies only to hospital cover. It does not apply to extras cover.";

const isInt = (n) => Number.isInteger(n);

function validateQuote(q) {
  const errors = [];
  if (!q || typeof q !== "object") return ["Request body is missing."];

  if (!q.customer_name || !String(q.customer_name).trim())
    errors.push("Customer name is required.");
  else if (String(q.customer_name).length > 100)
    errors.push("Customer name must be 100 characters or fewer.");
  if (q.notes != null && String(q.notes).length > 1000)
    errors.push("Notes must be 1000 characters or fewer.");
  if (!COVER_TYPES.includes(q.cover_type))
    errors.push("Cover type must be Single, Couple or Family.");
  if (!Object.hasOwn(HOSPITAL, q.hospital_cover))
    errors.push("Hospital cover must be None, Basic, Bronze, Silver or Gold.");
  if (!Object.hasOwn(EXTRAS, q.extras_cover))
    errors.push("Extras cover must be None, Basic, Standard or Premium.");
  if (!["Monthly", "Yearly"].includes(q.payment_frequency))
    errors.push("Payment frequency must be Monthly or Yearly.");

  const a1 = Number(q.applicant1_age);
  if (q.applicant1_age === "" || q.applicant1_age == null || !isInt(a1) || a1 < 18 || a1 > 100)
    errors.push("Applicant 1 age must be a whole number from 18 to 100.");
  if (!HISTORIES.includes(q.applicant1_cover_history))
    errors.push("Applicant 1 cover history must be Yes, No or Not sure.");

  if (q.cover_type === "Couple" || q.cover_type === "Family") {
    const a2 = Number(q.applicant2_age);
    if (q.applicant2_age === "" || q.applicant2_age == null)
      errors.push("Applicant 2 age is required for Couple or Family cover.");
    else if (!isInt(a2) || a2 < 18 || a2 > 100)
      errors.push("Applicant 2 age must be a whole number from 18 to 100.");
    if (!HISTORIES.includes(q.applicant2_cover_history))
      errors.push("Applicant 2 cover history is required for Couple or Family cover.");
  }

  const d = Number(q.annual_discount ?? 0);
  if (Number.isNaN(d) || d < 0 || d > 10)
    errors.push("Annual discount must be between 0% and 10%.");

  return errors;
}

function lhcLoading(age, history, hospital) {
  if (hospital === "None") return 0;
  if (history === "No" && age > 30) return (age - 30) * 0.02;
  return 0; 
}

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

function calculateQuote(q) {
  const adults = q.cover_type === "Single" ? 1 : 2;
  const hospitalPrice = HOSPITAL[q.hospital_cover];
  const extrasPrice = EXTRAS[q.extras_cover];

  const applicants = [
    { label: "Applicant 1", age: Number(q.applicant1_age), history: q.applicant1_cover_history },
  ];
  if (adults === 2 && q.applicant2_age != null && q.applicant2_cover_history != null) {
    applicants.push({
      label: "Applicant 2",
      age: Number(q.applicant2_age),
      history: q.applicant2_cover_history,
    });
  }

  const warnings = [];
  let hospitalTotal = 0;
  const breakdown = applicants.map((a) => {
    const loading = lhcLoading(a.age, a.history, q.hospital_cover);
    const premium = hospitalPrice * (1 + loading);
    hospitalTotal += premium;
    if (a.history === "Not sure")
      warnings.push(
        `${a.label}: Cover history is unknown — LHC loading has not been applied. This quote may be inaccurate.`
      );
    return { label: a.label, age: a.age, history: a.history, loadingPercent: round2(loading * 100), hospitalPremium: round2(premium) };
  });

  const extrasTotal = extrasPrice * adults;
  const familyFee = q.cover_type === "Family" ? FAMILY_FEE : 0;
  const monthly = hospitalTotal + extrasTotal + familyFee;
  const yearlyBefore = monthly * 12;

  const isYearly = q.payment_frequency === "Yearly";
  const discountPercent = isYearly ? Number(q.annual_discount ?? 0) : 0;
  const yearlyAfter = isYearly ? yearlyBefore * (1 - discountPercent / 100) : null;

  return {
    adults,
    hospitalBasePrice: hospitalPrice,
    extrasBasePrice: extrasPrice,
    applicants: breakdown,
    hospitalTotal: round2(hospitalTotal),
    extrasTotal: round2(extrasTotal),
    familyFee,
    monthly: round2(monthly),
    yearlyBeforeDiscount: round2(yearlyBefore),
    discountPercent,
    yearlyAfterDiscount: yearlyAfter === null ? null : round2(yearlyAfter),
    finalTotal: isYearly ? round2(yearlyAfter) : round2(monthly),
    finalTotalLabel: isYearly ? "per year (after discount)" : "per month",
    warnings,
    lhcStatement: LHC_STATEMENT,
  };
}

module.exports = { validateQuote, calculateQuote, lhcLoading, LHC_STATEMENT };

if (require.main === module) {
  const example = {
    customer_name: "Test",
    cover_type: "Family",
    applicant1_age: 40, applicant1_cover_history: "No",
    applicant2_age: 35, applicant2_cover_history: "Yes",
    hospital_cover: "Silver", extras_cover: "Standard",
    payment_frequency: "Yearly", annual_discount: 5,
  };
  console.log("Errors:", validateQuote(example));
  const r = calculateQuote(example);
  console.log(r);
  const ok = r.monthly === 472 && r.yearlyBeforeDiscount === 5664 && r.yearlyAfterDiscount === 5380.8;
  console.log(ok ? "PASS: matches worked example" : "FAIL: does not match worked example");
}