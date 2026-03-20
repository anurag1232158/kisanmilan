"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm]       = useState({ email: "", password: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res  = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/Dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card border-0 shadow rounded-4 w-100" style={{ maxWidth: 420 }}>
        <div className="card-body p-5">

          <div className="text-center mb-4">
            <div style={{ fontSize: 48 }}>🌱</div>
            <h4 className="fw-bold text-success mt-2">Demo Login</h4>
            <p className="text-muted small">Apne account mein login karo</p>
          </div>

          {error && (
            <div className="alert alert-danger py-2 text-center small">{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold">📧 Email</label>
              <input className="form-control rounded-3"
                type="email" placeholder="apna@email.com"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                required />
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold">🔐 Password</label>
              <input className="form-control rounded-3"
                type="password" placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                required />
            </div>

            <button type="submit" disabled={loading}
              className="btn btn-success w-100 py-2 fw-semibold rounded-3">
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2" />Login ho raha hai...</>
              ) : "🚀 Login Karo"}
            </button>
          </form>

          <p className="text-center text-muted small mt-4 mb-0">
            Naya user?{" "}
            <a href="/Register" className="text-success fw-semibold text-decoration-none">
              Register karo →
            </a>
          </p>

        </div>
      </div>
    </div>
  );
}