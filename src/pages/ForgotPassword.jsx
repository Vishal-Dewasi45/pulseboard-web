import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, getErrorMessage } from "../lib/api.js";
import AuthLayout from "../components/AuthLayout.jsx";

const titles = {
  1: { title: "Forgot password?", subtitle: "Enter your email and we'll send you a 6-digit code." },
  2: { title: "Check your email", subtitle: "Enter the code we sent you." },
  3: { title: "New password", subtitle: "Choose a strong password you haven't used before." },
};

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [pw, setPw] = useState({ newPassword: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (fn) => {
    setError(""); setInfo(""); setBusy(true);
    try { await fn(); } catch (err) { setError(getErrorMessage(err)); } finally { setBusy(false); }
  };

  const sendOtp = (e) => {
    e?.preventDefault();
    run(async () => {
      await api.post("/auth/forgot-password", { email: email.trim() });
      setStep(2);
      setInfo("If an account exists, a code has been sent. It expires in 5 minutes.");
    });
  };

  const verify = (e) => {
    e.preventDefault();
    run(async () => {
      const { data } = await api.post("/auth/verify-reset-otp", { email: email.trim(), otp });
      setResetToken(data.resetToken);
      setStep(3);
    });
  };

  const reset = (e) => {
    e.preventDefault();
    run(async () => {
      await api.post("/auth/reset-password", { resetToken, ...pw });
      navigate("/login", { replace: true });
    });
  };

  return (
    <AuthLayout title={titles[step].title} subtitle={titles[step].subtitle}>
      <div className="mb-4 flex gap-1.5">
        {[1, 2, 3].map((n) => (
          <div key={n} className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-blue-600" : "bg-slate-200"}`} />
        ))}
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 p-2.5 text-sm text-red-600">{error}</div>}
      {info && <div className="mb-4 rounded-lg bg-blue-50 p-2.5 text-sm text-blue-700">{info}</div>}

      {step === 1 && (
        <form onSubmit={sendOtp} className="space-y-4">
          <input type="email" required placeholder="Your account email" autoComplete="email" className="input"
            value={email} onChange={(e) => setEmail(e.target.value)} />
          <button disabled={busy} className="btn-primary w-full">{busy ? "Sending…" : "Send code"}</button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={verify} className="space-y-4">
          <input required inputMode="numeric" maxLength={6} placeholder="000000" autoComplete="one-time-code"
            className="input text-center text-xl tracking-[0.5em]"
            value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} />
          <button disabled={busy || otp.length !== 6} className="btn-primary w-full">
            {busy ? "Verifying…" : "Verify code"}
          </button>
          <button type="button" onClick={sendOtp} disabled={busy}
            className="w-full text-sm text-slate-500 hover:underline">
            Resend code
          </button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={reset} className="space-y-4">
          <input type="password" required minLength={8} maxLength={72} placeholder="New password (min 8)"
            autoComplete="new-password" className="input"
            value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
          <input type="password" required placeholder="Confirm new password"
            autoComplete="new-password" className="input"
            value={pw.confirmPassword} onChange={(e) => setPw({ ...pw, confirmPassword: e.target.value })} />
          <button disabled={busy} className="btn-primary w-full">{busy ? "Saving…" : "Reset password"}</button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-slate-500">
        <Link to="/login" className="font-medium text-blue-600 hover:underline">Back to sign in</Link>
      </p>
    </AuthLayout>
  );
}