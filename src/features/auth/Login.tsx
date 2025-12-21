import React, { use, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);

  async function signUp() {
    setBusy(true);
    const { error } = await supabase.auth.signUp({ email, password: pass });
    setBusy(false);
    if (error) alert(error.message);
    else alert("Check email (if confirm enabled) or continue to sign in.");
    navigate("/", {replace: true});
  }

  async function signIn() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    setBusy(false);
    if (error) alert(error.message);
    navigate("/", {replace: true});
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>🧶 Welcome to Croknit</h2>
        <p className="auth-subtitle">
          Track your projects, stitches, and yarn with ease
        </p>

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          placeholder="Password"
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
        />

        {mode === "login" ? (
          <>
            <button className="primary" onClick={signIn} disabled={busy}>
              Sign in
            </button>
            <button className="secondary" onClick={() => setMode("register")}>
              Create account
            </button>
          </>
        ) : (
          <>
            <button className="primary" onClick={signUp} disabled={busy}>
              Register
            </button>
            <button className="secondary" onClick={() => setMode("login")}>
              Back to login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
