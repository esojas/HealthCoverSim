import { money } from "../format.js";

function explain(quote, r) {
  const s = (n) => (n === 1 ? "" : "s");
  const lines = [];
  lines.push(`This is a ${quote.cover_type} quote, so ${r.adults} adult${s(r.adults)} ${r.adults === 1 ? "is" : "are"} counted.`);

  if (quote.hospital_cover === "None") {
    lines.push("No hospital cover was selected, so the hospital premium is $0 and no Lifetime Health Cover loading applies.");
  } else {
    lines.push(
      `Hospital cover (${quote.hospital_cover}) costs ${money(r.hospitalBasePrice)} per adult per month. Each applicant's own LHC loading is added on top of that price, which gives a hospital total of ${money(r.hospitalTotal)} per month.`
    );
  }

  if (quote.extras_cover === "None") {
    lines.push("No extras cover was selected, so the extras premium is $0.");
  } else {
    lines.push(
      `Extras cover (${quote.extras_cover}) costs ${money(r.extrasBasePrice)} per adult per month, so ${r.adults} adult${s(r.adults)} pay ${money(r.extrasTotal)} per month. Extras are never loaded.`
    );
  }

  if (quote.cover_type === "Family") {
    lines.push(`Family cover adds a flat ${money(r.familyFee)} per month, once, to cover dependent children. Children are not priced individually.`);
  }

  lines.push(
    `Monthly premium = hospital + extras${quote.cover_type === "Family" ? " + family fee" : ""} = ${money(r.monthly)}. Yearly before discount = monthly × 12 = ${money(r.yearlyBeforeDiscount)}.`
  );

  if (quote.payment_frequency === "Yearly") {
    lines.push(`You chose to pay yearly, so the ${r.discountPercent}% annual-payment discount is applied: ${money(r.yearlyBeforeDiscount)} × (1 − ${r.discountPercent}%) = ${money(r.yearlyAfterDiscount)}.`);
  } else {
    lines.push("You chose to pay monthly, so the annual-payment discount does not apply.");
  }
  return lines;
}

export default function PremiumBreakdown({ quote, result: r }) {
  const yearly = quote.payment_frequency === "Yearly";
  const discountAmount = yearly ? r.yearlyBeforeDiscount - r.yearlyAfterDiscount : 0;

  return (
    <section className="breakdown" aria-labelledby="breakdown-title">
      <h2 id="breakdown-title">Explanation sheet</h2>

      <div className="estimate">
        <div>
          <p className="estimate-label">Final estimate</p>
          <p className="estimate-value">{money(r.finalTotal)}</p>
          <p className="estimate-sub">{r.finalTotalLabel}</p>
        </div>
        <dl className="estimate-side">
          <div><dt>Monthly premium</dt><dd>{money(r.monthly)}</dd></div>
          <div><dt>Yearly before discount</dt><dd>{money(r.yearlyBeforeDiscount)}</dd></div>
          {yearly && <div><dt>Yearly after {r.discountPercent}% discount</dt><dd>{money(r.yearlyAfterDiscount)}</dd></div>}
        </dl>
      </div>

      {r.warnings.length > 0 && (
        <div className="alert alert-warn" role="alert">
          <strong>Warning: this quote may be inaccurate</strong>
          <ul>{r.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
        </div>
      )}

      <h3>Line items (per month unless stated)</h3>
      <div className="table-wrap">
        <table className="lines">
          <thead>
            <tr><th>Item</th><th>LHC loading</th><th className="num">Amount</th></tr>
          </thead>
          <tbody>
            <tr className="group"><td colSpan="2">Hospital cover: {quote.hospital_cover}</td><td className="num">{money(r.hospitalTotal)}</td></tr>
            {r.applicants.map((a) => (
              <tr key={a.label} className="sub">
                <td>{a.label} (age {a.age}, history: {a.history})</td>
                <td>{a.loadingPercent}%</td>
                <td className="num">{money(a.hospitalPremium)}</td>
              </tr>
            ))}
            <tr className="group"><td colSpan="2">Extras cover: {quote.extras_cover}</td><td className="num">{money(r.extrasTotal)}</td></tr>
            {quote.cover_type === "Family" && (
              <tr className="group"><td colSpan="2">Family upgrade fee</td><td className="num">{money(r.familyFee)}</td></tr>
            )}
            <tr className="total"><td colSpan="2">Monthly premium</td><td className="num">{money(r.monthly)}</td></tr>
            <tr><td colSpan="2">Yearly before discount (monthly × 12)</td><td className="num">{money(r.yearlyBeforeDiscount)}</td></tr>
            {yearly && (
              <>
                <tr><td colSpan="2">Annual-payment discount ({r.discountPercent}%)</td><td className="num">−{money(discountAmount)}</td></tr>
                <tr className="total"><td colSpan="2">Yearly after discount</td><td className="num">{money(r.yearlyAfterDiscount)}</td></tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      <p className="lhc-note">{r.lhcStatement}</p>

      <h3>How this quote was calculated</h3>
      {explain(quote, r).map((line, i) => <p key={i}>{line}</p>)}
      <p className="muted">
        {yearly
          ? "Paying yearly shows the monthly premium, the yearly premium before discount, and the yearly premium after the discount."
          : "Paying monthly shows the monthly premium and the yearly premium before discount. No discount is applied."}
      </p>
    </section>
  );
}