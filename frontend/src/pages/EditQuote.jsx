import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import QuoteForm, { EMPTY_FORM } from "../components/QuoteForm.jsx";
import { getQuote, updateQuote } from "../api.js";

// Database values (numbers / null) -> the string values the form inputs use
function toFormValues(q) {
  return {
    ...EMPTY_FORM,
    customer_name: q.customer_name,
    cover_type: q.cover_type,
    applicant1_age: String(q.applicant1_age),
    applicant1_cover_history: q.applicant1_cover_history,
    applicant2_age: q.applicant2_age == null ? "" : String(q.applicant2_age),
    applicant2_cover_history: q.applicant2_cover_history || "",
    hospital_cover: q.hospital_cover,
    extras_cover: q.extras_cover,
    payment_frequency: q.payment_frequency,
    annual_discount: String(q.annual_discount),
    notes: q.notes || "",
  };
}

export default function EditQuote() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getQuote(id).then((d) => setQuote(d.quote)).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <><div className="alert alert-error" role="alert">{error}</div><Link to="/">Back to quotes</Link></>;
  if (!quote) return <p>Loading quote…</p>;

  return (
    <>
      <div className="page-head"><h1>Edit quote</h1></div>
      <QuoteForm
        initial={toFormValues(quote)}
        submitLabel="Save changes"
        onSubmit={async (payload) => {
          await updateQuote(id, payload);
          navigate(`/quotes/${id}`);
        }}
        onCancel={() => navigate(`/quotes/${id}`)}
      />
    </>
  );
}