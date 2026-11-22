import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getErrorMessage } from "../lib/api.js";
import AuthLayout from "../components/AuthLayout.jsx";

export default function Register() {
  const { register, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", age: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register({ ...form, email: form.email.trim(), age: Number(form.age) });
      await login(form.email.trim(), form.password); // backend doesn't auto-login
      navigate("/", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
      <AuthLayout title={"Welcome to PulseBoard"} subtitle={"Create an Account to Continue"}>
      <form onSubmit={onSubmit} className="w-full space-y-4">
        {error && <div className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</div>}
        <input required placeholder="Full name" className="input" value={form.name} onChange={set("name")} />
        <input type="email" required placeholder="Email" className="input" value={form.email} onChange={set("email")} />
        <input type="number" required min="18" placeholder="Age" className="input" value={form.age} onChange={set("age")} />
        <input type="password" required minLength={8} placeholder="Password (min 8)" className="input"
          value={form.password} onChange={set("password")} />
        <button disabled={busy} className="btn-primary w-full bg-indigo-600 text-white rounded-lg py-2 font-medium disabled:opacity-60">
          {busy ? "Creating…" : "Sign up"}
        </button>
        <p className="text-sm text-slate-500">
          Already have an account? <Link to="/login" className="text-indigo-600 hover:underline">Sign in</Link>
        </p>
      </form>
      </AuthLayout>
  );
}