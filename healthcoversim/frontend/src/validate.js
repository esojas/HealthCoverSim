// Frontend validation. Mirrors the backend rules in backend/calc.js (validateQuote).
export const COVER_TYPES = ["Single", "Couple", "Family"];
export const HISTORIES = ["Yes", "No", "Not sure"];
export const HOSPITAL_LEVELS = ["None", "Basic", "Bronze", "Silver", "Gold"];
export const EXTRAS_LEVELS = ["None", "Basic", "Standard", "Premium"];
export const FREQUENCIES = ["Monthly", "Yearly"];

function ageError(raw) {
  if (raw === "" || raw == null) return "Enter an age.";
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 18 || n > 100) return "Age must be a whole number from 18 to 100.";
  return null;
}

// Returns an object of { fieldName: message }. Empty object = valid.
export function validateForm(v) {
  const e = {};
  if (!v.customer_name.trim()) e.customer_name = "Enter the customer's name.";
  else if (v.customer_name.length > 100) e.customer_name = "Name must be 100 characters or fewer.";

  if (!v.cover_type) e.cover_type = "Choose a cover type.";
  if (!v.hospital_cover) e.hospital_cover = "Choose a hospital cover level (or None).";
  if (!v.extras_cover) e.extras_cover = "Choose an extras cover level (or None).";
  if (!v.payment_frequency) e.payment_frequency = "Choose a payment frequency.";

  const a1 = ageError(v.applicant1_age);
  if (a1) e.applicant1_age = a1;
  if (!v.applicant1_cover_history) e.applicant1_cover_history = "Choose Yes, No or Not sure.";

  if (v.cover_type === "Couple" || v.cover_type === "Family") {
    const a2 = ageError(v.applicant2_age);
    if (a2) e.applicant2_age = a2.replace("Enter an age.", "Applicant 2 age is required for Couple or Family cover.");
    if (!v.applicant2_cover_history) e.applicant2_cover_history = "Applicant 2 cover history is required.";
  }

  if (v.payment_frequency === "Yearly" && v.annual_discount !== "") {
    const d = Number(v.annual_discount);
    if (Number.isNaN(d) || d < 0 || d > 10) e.annual_discount = "Discount must be between 0% and 10%.";
  }

  if (v.notes.length > 1000) e.notes = "Notes must be 1000 characters or fewer.";
  return e;
}