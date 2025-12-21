import { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";
import { supabase } from "../lib/supabase";

export default function NavBar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);

  async function signOut() {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  useEffect(() => {
    const nav = navRef.current;
    if (!open || !nav) {
      const main = document.querySelector(".app-main");
      if (main) main.removeAttribute("aria-hidden");
      return;
    }

    const focusable = Array.from(
      nav.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])")
    ).filter((el) => el.offsetParent !== null);

    focusable[0]?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
      if (e.key === "Tab") {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKey);
    const main = document.querySelector(".app-main");
    if (main) main.setAttribute("aria-hidden", "true");
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      if (main) main.removeAttribute("aria-hidden");
      document.body.style.overflow = prev;
      toggleRef.current?.focus();
    };
  }, [open]);

  return (
    <header className="topnav">
      <div className="topnav-inner">
        <div className="brand">
          <Link to="/" className="brand-link">
            <div className="brand-mark">🧶</div>
            <div className="brand-text">CroKnit</div>
          </Link>
        </div>

        <nav ref={navRef as any} className={`nav-links ${open ? "open" : ""}`} aria-label="Main navigation" aria-hidden={!open} >
        <NavLink to="/" onClick={() => setOpen(false)} className={({ isActive }) => (isActive ? "active nav-item" : "nav-item")}>
          <svg className="nav-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 11.5L12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V11.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span>Home</span>
        </NavLink>



        <NavLink to="/projects/archived" onClick={() => setOpen(false)} className={({ isActive }) => (isActive ? "active nav-item" : "nav-item")}>
          <svg className="nav-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 7h18v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span>Archived</span>
        </NavLink>

        <NavLink to="/inventory" onClick={() => setOpen(false)} className={({ isActive }) => (isActive ? "active nav-item" : "nav-item")}>
          <svg className="nav-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span>Inventory</span>
        </NavLink>



        {user ? (
          <button className="btn-logout" onClick={() => { setOpen(false); signOut(); }}>
            <svg className="nav-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>Sign out</span>
          </button>
        ) : (
          <NavLink to="/login" onClick={() => setOpen(false)} className={({ isActive }) => (isActive ? "active nav-item" : "nav-item")}>
            <svg className="nav-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 17l5-5-5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>Sign in</span>
          </NavLink>
        )}
      </nav>

        <button
          ref={toggleRef as any}
          className={`mobile-toggle ${open ? "open" : ""}`}
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen((s) => !s)}
        >
          <svg className="mobile-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </header>
  );
}
