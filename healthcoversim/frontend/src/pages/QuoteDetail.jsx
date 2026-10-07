import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PremiumBreakdown from "../components/PremiumBreakdown.jsx";
import { getQuote, deleteQuote } from "../api.js";

export default function QuoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getQuote(id).then(setData).catch((e) => setError(e.message));
  }, [id]);

  async function handleDelete() {
    if (!window.confirm(`Delete the quote for ${data.quote.customer_name}? This cannot be undone.`)) return;
    try {
      await deleteQuote(id);
      navigate("/");
    } catch (e) {
      setError(e.message);
    }
  }

  if (error) return <><div className="alert alert-error" role="alert">{error}</div><Link to="/">Back to quotes</Link></>;
  if (!data) return <p>Loading quote…</p>;

  const { quote, result } = data;
  return (
    <>
      <div className="page-head">
        <h1>{quote.customer_name}</h1>
        <div className="actions">
          <Link to={`/quotes/${id}/edit`} className="btn">Edit</Link>
          <button type="button" className="btn btn-danger" onClick={handleDelete}>Delete</button>
        </div>
      </div>
      <p className="muted">
        {quote.cover_type} cover · created {quote.created_at} · paying {quote.payment_frequency.toLowerCase()}
      </p>
      {quote.notes && <p className="notes"><strong>Notes:</strong> {quote.notes}</p>}
      <PremiumBreakdown quote={quote} result={result} />
      <p><Link to="/">← Back to quotes</Link></p>
    </>
  );
}