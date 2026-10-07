import { useState } from "react";
import {
  COVER_TYPES, HISTORIES, HOSPITAL_LEVELS, EXTRAS_LEVELS, FREQUENCIES, validateForm,
} from "../validate.js";

export const EMPTY_FORM = {
  customer_name: "",
  cover_type: "",
  applicant1_age: "",
  applicant1_cover_history: "",
  applicant2_age: "",
  applicant2_cover_history: "",
  hospital_cover: "",
  extras_cover: "",
  payment_frequency: "",
  annual_discount: "0",
  notes: "",
};

function Field({ id, label, error, hint, children }) {
  return (
    <div className={`field${error ? " has-error" : ""}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && !error && <p className="hint">{hint}</p>}
      {error && <p className="error-text" id={`${id}-error`}>{error}</p>}
    </div>
  );
}

function Select({ id, value, onChange, options, placeholder, error }) {
  return (
    <select id={id} value={value} onChange={onChange} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined}>
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

// Turns the string-based form state into the JSON the API expects
function buildPayload(v) {
  const multi = v.cover_type === "Couple" || v.cover_type === "Family";
  const yearly = v.payment_frequency === "Yearly";
  return {
    customer_name: v.customer_name.trim(),
    cover_type: v.cover_type,
    applicant1_age: Number(v.applicant1_age),
    applicant1_cover_history: v.applicant1_cover_history,
    applicant2_age: multi ? Number(v.applicant2_age) : null,
    applicant2_cover_history: multi ? v.applicant2_cover_history : null,
    hospital_cover: v.hospital_cover,
    extras_cover: v.extras_cover,
    payment_frequency: v.payment_frequency,
    annual_discount: yearly ? Number(v.annual_discount || 0) : 0,
    notes: v.notes.trim() || null,
  };
}

export default function QuoteForm({ initial = EMPTY_FORM, submitLabel, onSubmit, onCancel }) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [serverErrors, setServerErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  const multi = values.cover_type === "Couple" || values.cover_type === "Family";
  const yearly = values.payment_frequency === "Yearly";
  const set = (name) => (e) => setValues((v) => ({ ...v, [name]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validateForm(values);
    setErrors(found);
    setServerErrors([]);
    if (Object.keys(found).length > 0) return; // frontend validation blocks the request
    setSaving(true);
    try {
      await onSubmit(buildPayload(values));
    } catch (err) {
      setServerErrors(err.errors || [err.message]);
      setSaving(false);
    }
  }

  const errorCount = Object.keys(errors).length;

  return (
    <form onSubmit={handleSubmit} noValidate className="quote-form">
      {(errorCount > 0 || serverErrors.length > 0) && (
        <div className="alert alert-error" role="alert">
          <strong>
            {errorCount > 0 ? "Fix the highlighted fields to calculate a quote." : "The server could not save this quote."}
          </strong>
          {serverErrors.length > 0 && (
            <ul>{serverErrors.map((m) => <li key={m}>{m}</li>)}</ul>
          )}
        </div>
      )}

      <fieldset>
        <legend>Customer</legend>
        <Field id="customer_name" label="Customer name" error={errors.customer_name}>
          <input id="customer_name" type="text" value={values.customer_name} onChange={set("customer_name")} maxLength={100} />
        </Field>
        <Field id="cover_type" label="Cover type" error={errors.cover_type}
          hint="Family adds a flat $30 per month for dependent children.">
          <Select id="cover_type" value={values.cover_type} onChange={set("cover_type")} options={COVER_TYPES} placeholder="Select cover type" error={errors.cover_type} />
        </Field>
      </fieldset>

      <fieldset>
        <legend>Applicant 1</legend>
        <div className="row">
          <Field id="applicant1_age" label="Age (18–100)" error={errors.applicant1_age}>
            <input id="applicant1_age" type="number" min="18" max="100" step="1" value={values.applicant1_age} onChange={set("applicant1_age")} />
          </Field>
          <Field id="applicant1_cover_history" label="Had hospital cover before?" error={errors.applicant1_cover_history}>
            <Select id="applicant1_cover_history" value={values.applicant1_cover_history} onChange={set("applicant1_cover_history")} options={HISTORIES} placeholder="Select" error={errors.applicant1_cover_history} />
          </Field>
        </div>
      </fieldset>

      {/* Conditional rendering: Applicant 2 only exists for Couple or Family */}
      {multi && (
        <fieldset>
          <legend>Applicant 2</legend>
          <div className="row">
            <Field id="applicant2_age" label="Age (18–100)" error={errors.applicant2_age}>
              <input id="applicant2_age" type="number" min="18" max="100" step="1" value={values.applicant2_age} onChange={set("applicant2_age")} />
            </Field>
            <Field id="applicant2_cover_history" label="Had hospital cover before?" error={errors.applicant2_cover_history}>
              <Select id="applicant2_cover_history" value={values.applicant2_cover_history} onChange={set("applicant2_cover_history")} options={HISTORIES} placeholder="Select" error={errors.applicant2_cover_history} />
            </Field>
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend>Cover and payment</legend>
        <div className="row">
          <Field id="hospital_cover" label="Hospital cover" error={errors.hospital_cover}>
            <Select id="hospital_cover" value={values.hospital_cover} onChange={set("hospital_cover")} options={HOSPITAL_LEVELS} placeholder="Select level" error={errors.hospital_cover} />
          </Field>
          <Field id="extras_cover" label="Extras cover" error={errors.extras_cover}>
            <Select id="extras_cover" value={values.extras_cover} onChange={set("extras_cover")} options={EXTRAS_LEVELS} placeholder="Select level" error={errors.extras_cover} />
          </Field>
        </div>
        <div className="row">
          <Field id="payment_frequency" label="Payment frequency" error={errors.payment_frequency}>
            <Select id="payment_frequency" value={values.payment_frequency} onChange={set("payment_frequency")} options={FREQUENCIES} placeholder="Select frequency" error={errors.payment_frequency} />
          </Field>
          <Field id="annual_discount" label="Annual-payment discount (0–10%)" error={errors.annual_discount}
            hint={yearly ? "Applied to the yearly total." : "Only used when paying Yearly."}>
            <input id="annual_discount" type="number" min="0" max="10" step="0.5" value={values.annual_discount} onChange={set("annual_discount")} disabled={!yearly} />
          </Field>
        </div>
      </fieldset>

      <Field id="notes" label="Notes (optional)" error={errors.notes}>
        <textarea id="notes" rows="3" value={values.notes} onChange={set("notes")} maxLength={1000} />
      </Field>

      <div className="actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : submitLabel}</button>
        {onCancel && <button type="button" className="btn" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}