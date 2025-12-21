import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";
import { supabase } from "../lib/supabase";

export default function NavBar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  return (
    <header className="topnav">
      <div className="brand">
        <Link to="/" className="brand-link">
          <div className="brand-mark">🧶</div>
          <div className="brand-text">CroKnit</div>
        </Link>
      </div>

      <nav className={`nav-links ${open ? "open" : ""}`} aria-label="Main navigation">
        <NavLink to="/" className={({ isActive }) => (isActive ? "active nav-item" : "nav-item")}>
          <svg className="nav-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 11.5L12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V11.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span>Home</span>
        </NavLink>

        <NavLink to="/" className={({ isActive }) => (isActive ? "active nav-item" : "nav-item")}>
          <svg className="nav-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 7h18M7 7v13M17 7v13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span>Projects</span>
        </NavLink>

        <NavLink to="/" className={({ isActive }) => (isActive ? "active nav-item" : "nav-item")}>
          <svg className="nav-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span>Inventory</span>
        </NavLink>

        <NavLink to="/" className={({ isActive }) => (isActive ? "active nav-item" : "nav-item")}>
          <svg className="nav-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span>Timer</span>
        </NavLink>

        {user ? (
          <button className="btn-logout" onClick={signOut}>
            <svg className="nav-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>Sign out</span>
          </button>
        ) : (
          <NavLink to="/login" className={({ isActive }) => (isActive ? "active nav-item" : "nav-item")}>
            <svg className="nav-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 17l5-5-5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>Sign in</span>
          </NavLink>
        )}
      </nav>

      <button
        className={`mobile-toggle ${open ? "open" : ""}`}
        aria-label="Toggle navigation"
        aria-expanded={open}
        onClick={() => setOpen((s) => !s)}
      >
        <svg className="mobile-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </header>
  );
}
