import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listQuotes, deleteQuote } from "../api.js";
import { money } from "../format.js";

export default function QuoteList() {
  const [quotes, setQuotes] = useState(null);
  const [error, setError] = useState("");

  const load = () =>
    listQuotes().then(setQuotes).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  async function handleDelete(q) {
    if (!window.confirm(`Delete the quote for ${q.customer_name}? This cannot be undone.`)) return;
    try {
      await deleteQuote(q.id);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>Quotes</h1>
        <Link to="/new" className="btn btn-primary">New quote</Link>
      </div>
      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {!quotes && !error && <p>Loading quotes…</p>}
      {quotes && quotes.length === 0 && (
        <p className="empty">No quotes yet. <Link to="/new">Create the first quote.</Link></p>
      )}
      {quotes && quotes.length > 0 && (
        <div className="table-wrap">
          <table className="list">
            <thead>
              <tr>
                <th>Customer</th><th>Cover</th><th>Hospital</th><th>Extras</th><th>Pays</th>
                <th className="num">Monthly</th>
                <th className="num">Yearly before discount</th>
                <th className="num">Yearly after discount</th>
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr key={q.id}>
                  <td><Link to={`/quotes/${q.id}`}>{q.customer_name}</Link></td>
                  <td>{q.cover_type}</td>
                  <td>{q.hospital_cover}</td>
                  <td>{q.extras_cover}</td>
                  <td>{q.payment_frequency}</td>
                  <td className="num">{money(q.monthly)}</td>
                  <td className="num">{money(q.yearly_before_discount)}</td>
                  <td className="num">{q.yearly_after_discount == null ? "—" : money(q.yearly_after_discount)}</td>
                  <td className="row-actions">
                    <Link to={`/quotes/${q.id}`}>View</Link>
                    <Link to={`/quotes/${q.id}/edit`}>Edit</Link>
                    <button type="button" className="link-danger" onClick={() => handleDelete(q)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}