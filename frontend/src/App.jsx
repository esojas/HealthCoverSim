import { NavLink, Route, Routes } from "react-router-dom";
import QuoteList from "./pages/QuoteList.jsx";
import CreateQuote from "./pages/CreateQuote.jsx";
import QuoteDetail from "./pages/QuoteDetail.jsx";
import EditQuote from "./pages/EditQuote.jsx";

export default function App() {
  return (
    <>
      <header className="site-header">
        <div className="container header-row">
          <NavLink to="/" className="brand">HealthCoverSim</NavLink>
          <nav>
            <NavLink to="/" end>Quotes</NavLink>
            <NavLink to="/new">New quote</NavLink>
          </nav>
        </div>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<QuoteList />} />
          <Route path="/new" element={<CreateQuote />} />
          <Route path="/quotes/:id" element={<QuoteDetail />} />
          <Route path="/quotes/:id/edit" element={<EditQuote />} />
          <Route path="*" element={<p>Page not found. <NavLink to="/">Back to quotes</NavLink></p>} />
        </Routes>
      </main>
      <footer className="container site-footer">
        Learning simulator only. Not financial advice.
      </footer>
    </>
  );
}