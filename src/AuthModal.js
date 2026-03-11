import { useState } from "react";
import { supabase } from "./supabaseClient";

const AUTH_STYLES = `
  .auth-overlay {
    position: fixed; inset: 0; z-index: 300;
    background: rgba(0,0,0,0.85); backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 24px; animation: fadeIn 0.2s ease;
  }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  .auth-modal {
    background: #0f1218; border: 1px solid #2a3340;
    border-radius: 16px; width: 100%; max-width: 420px;
    padding: 36px; display: flex; flex-direction: column; gap: 24px;
    animation: slideUp 0.25s ease; position: relative;
  }
  .auth-logo { display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .auth-title { font-family: 'Cinzel', serif; font-size: 22px; font-weight: 700; color: #c9a84c; letter-spacing: 1px; text-align: center; }
  .auth-sub { font-size: 13px; color: #4a5a6a; text-align: center; }
  .auth-tabs { display: flex; gap: 4px; background: #0a0c0f; border-radius: 8px; padding: 4px; }
  .auth-tab { flex: 1; padding: 8px; border-radius: 6px; border: none; cursor: pointer; font-size: 13px; font-weight: 500; font-family: 'Inter', sans-serif; background: transparent; color: #4a5a6a; transition: all 0.2s; }
  .auth-tab.active { background: #161b24; color: #c9a84c; }
  .auth-fields { display: flex; flex-direction: column; gap: 12px; }
  .auth-field { display: flex; flex-direction: column; gap: 6px; }
  .auth-label { font-size: 11px; color: #7a8a9a; text-transform: uppercase; letter-spacing: 0.5px; }
  .auth-input { background: #161b24; border: 1px solid #2a3340; border-radius: 8px; padding: 11px 14px; color: #e8e8e8; font-size: 14px; font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.2s; }
  .auth-input:focus { border-color: #8a6f2e; }
  .auth-input::placeholder { color: #3a4a5a; }
  .auth-input.invalid { border-color: rgba(231,76,60,0.6); }
  .auth-btn { padding: 12px; border-radius: 8px; border: none; cursor: pointer; background: linear-gradient(135deg, #8a6f2e, #c9a84c); color: #000; font-size: 14px; font-weight: 700; font-family: 'Inter', sans-serif; transition: opacity 0.2s; letter-spacing: 0.5px; }
  .auth-btn:hover { opacity: 0.85; }
  .auth-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .auth-error { background: rgba(231,76,60,0.1); border: 1px solid rgba(231,76,60,0.3); border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #e74c3c; display: flex; align-items: flex-start; gap: 8px; }
  .auth-success-screen { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 8px 0; text-align: center; }
  .auth-success-icon { font-size: 48px; }
  .auth-success-title { font-family: 'Cinzel', serif; font-size: 18px; color: #c9a84c; }
  .auth-success-msg { font-size: 13px; color: #7a8a9a; line-height: 1.6; max-width: 300px; }
  .auth-success-btn { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #8a6f2e; background: rgba(201,168,76,0.08); color: #c9a84c; font-size: 14px; font-weight: 600; font-family: 'Inter', sans-serif; cursor: pointer; transition: all 0.2s; }
  .auth-success-btn:hover { background: rgba(201,168,76,0.15); }
  .auth-close { position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; border-radius: 8px; border: 1px solid #2a3340; background: #161b24; color: #7a8a9a; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
  .auth-close:hover { border-color: #e74c3c; color: #e74c3c; }
  .auth-divider { display: flex; align-items: center; gap: 12px; }
  .auth-divider::before, .auth-divider::after { content: ''; flex: 1; height: 1px; background: #2a3340; }
  .auth-divider span { font-size: 11px; color: #4a5a6a; }
  .auth-hint { font-size: 11px; color: #4a5a6a; margin-top: 2px; }
  .auth-strength { display: flex; gap: 4px; margin-top: 4px; }
  .auth-strength-bar { flex: 1; height: 3px; border-radius: 2px; background: #2a3340; transition: background 0.2s; }
  .auth-strength-bar.weak { background: #e74c3c; }
  .auth-strength-bar.medium { background: #c9a84c; }
  .auth-strength-bar.strong { background: #2ecc71; }
`;

function getPasswordStrength(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) || /[0-9]/.test(pw)) score++;
  return score; // 0-3
}

function friendlyError(msg) {
  if (!msg) return "Something went wrong. Please try again.";
  if (msg.includes("Invalid login credentials")) return "Incorrect email or password. Please try again.";
  if (msg.includes("Email not confirmed")) return "Please confirm your email first, then try logging in.";
  if (msg.includes("User already registered")) return "An account with this email already exists. Try logging in instead.";
  if (msg.includes("Password should be")) return "Password must be at least 6 characters.";
  if (msg.includes("Unable to validate email")) return "Please enter a valid email address.";
  if (msg.includes("rate limit") || msg.includes("too many")) return "Too many attempts. Please wait a minute and try again.";
  if (msg.includes("network") || msg.includes("fetch")) return "Connection error. Check your internet and try again.";
  return msg;
}

export default function AuthModal({ onClose, onAuth }) {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  // emailConfirmRequired tracked via showSuccess state

  const strength = getPasswordStrength(password);
  const strengthLabel = ["", "Weak", "Medium", "Strong"][strength];

  function reset() { setEmail(""); setPassword(""); setUsername(""); setError(""); setShowSuccess(false); }
  function switchTab(t) { setTab(t); reset(); }

  async function handleSubmit() {
    setError("");
    setLoading(true);

    if (!email.trim() || !password) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    if (tab === "signup") {
      if (!username.trim()) { setError("Please enter a username."); setLoading(false); return; }
      if (password.length < 6) { setError("Password must be at least 6 characters."); setLoading(false); return; }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { username: username.trim() } }
      });

      if (signUpError) {
        setError(friendlyError(signUpError.message));
      } else if (data?.user?.identities?.length === 0) {
        setError("An account with this email already exists. Try logging in instead.");
      } else if (data?.session) {
        // Email confirmation is OFF — user is logged in immediately
        onAuth(data.user);
        onClose();
      } else {
        // Email confirmation is ON — show confirmation message
        setShowSuccess(true);
      }
    } else {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(friendlyError(signInError.message));
      } else {
        onAuth(data.user);
        onClose();
      }
    }

    setLoading(false);
  }

  // ── Success screen (email confirmation required) ──
  if (showSuccess) {
    return (
      <>
        <style>{AUTH_STYLES}</style>
        <div className="auth-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
          <div className="auth-modal">
            <button className="auth-close" onClick={onClose}>✕</button>
            <div className="auth-success-screen">
              <div className="auth-success-icon">📬</div>
              <div className="auth-success-title">Check Your Email</div>
              <div className="auth-success-msg">
                We sent a confirmation link to <strong style={{ color: "#e8e8e8" }}>{email}</strong>.<br /><br />
                Click the link in your email to activate your account, then come back and log in.
              </div>
              <button className="auth-success-btn" onClick={() => switchTab("login")}>
                → Back to Log In
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{AUTH_STYLES}</style>
      <div className="auth-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="auth-modal">
          <button className="auth-close" onClick={onClose}>✕</button>

          <div className="auth-logo">
            <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
              <rect x="2" y="2" width="44" height="44" rx="10" fill="rgba(201,168,76,0.1)" stroke="#c9a84c" strokeWidth="1.5"/>
              <path d="M10 13 L10 35" stroke="#c9a84c" strokeWidth="3" strokeLinecap="round"/>
              <path d="M10 13 L20 13 Q26 13 26 19 Q26 25 20 25 L10 25" stroke="#c9a84c" strokeWidth="3" strokeLinecap="round" fill="none"/>
              <path d="M18 25 L26 35" stroke="#c9a84c" strokeWidth="3" strokeLinecap="round"/>
              <path d="M30 13 L44 13" stroke="#e8c96a" strokeWidth="3" strokeLinecap="round"/>
              <path d="M37 13 L37 35" stroke="#e8c96a" strokeWidth="3" strokeLinecap="round"/>
            </svg>
            <div className="auth-title">RuneTrader.gg</div>
            <div className="auth-sub">{tab === "login" ? "Welcome back, adventurer" : "Join the alpha — it's free"}</div>
          </div>

          <div className="auth-tabs">
            <button className={`auth-tab ${tab === "login" ? "active" : ""}`} onClick={() => switchTab("login")}>Log In</button>
            <button className={`auth-tab ${tab === "signup" ? "active" : ""}`} onClick={() => switchTab("signup")}>Sign Up</button>
          </div>

          {error && (
            <div className="auth-error">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="auth-fields">
            {tab === "signup" && (
              <div className="auth-field">
                <label className="auth-label">Username</label>
                <input className="auth-input" placeholder="e.g. zulrah_slayer" value={username}
                  onChange={e => setUsername(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()} />
              </div>
            )}
            <div className="auth-field">
              <label className="auth-label">Email</label>
              <input className="auth-input" type="email" placeholder="your@email.com" value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()} />
            </div>
            <div className="auth-field">
              <label className="auth-label">Password</label>
              <input className="auth-input" type="password" placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()} />
              {tab === "signup" && password.length > 0 && (
                <>
                  <div className="auth-strength">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`auth-strength-bar ${strength >= i ? (strength === 1 ? "weak" : strength === 2 ? "medium" : "strong") : ""}`} />
                    ))}
                  </div>
                  <div className="auth-hint" style={{ color: strength === 1 ? "#e74c3c" : strength === 2 ? "#c9a84c" : "#2ecc71" }}>
                    {strengthLabel} password
                  </div>
                </>
              )}
            </div>
          </div>

          <button className="auth-btn" disabled={loading} onClick={handleSubmit}>
            {loading ? "Please wait..." : tab === "login" ? "Log In →" : "Create Free Account →"}
          </button>

          <div className="auth-divider">
            <span>{tab === "signup" ? "Free forever · No credit card needed" : "New here? Sign up above — it's free"}</span>
          </div>
        </div>
      </div>
    </>
  );
}
