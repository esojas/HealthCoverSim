import { useNavigate } from "react-router-dom";
import QuoteForm from "../components/QuoteForm.jsx";
import { createQuote } from "../api.js";

export default function CreateQuote() {
  const navigate = useNavigate();
  return (
    <>
      <div className="page-head"><h1>New quote</h1></div>
      <QuoteForm
        submitLabel="Calculate quote"
        onSubmit={async (payload) => {
          const { quote } = await createQuote(payload);
          navigate(`/quotes/${quote.id}`);
        }}
        onCancel={() => navigate("/")}
      />
    </>
  );
}