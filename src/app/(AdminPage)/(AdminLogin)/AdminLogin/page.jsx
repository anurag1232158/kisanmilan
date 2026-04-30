"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // ✅ FIX: res variable mein store karo
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },  
        body: JSON.stringify({
          email: form.email,       // ✅ form se lo, hardcoded nahi
          password: form.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // ✅ Only admin allowed
      if (data.user.role !== "admin") {
        throw new Error("❌ Only admin allowed");
      }

      // Save login
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect
      router.push("/AdminDashboard");

    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{ background: "linear-gradient(135deg,#141e30,#243b55)" }}
    >
      <div
        className="card border-0 shadow-lg rounded-4 w-100"
        style={{ maxWidth: 420 }}
      >
        <div className="card-body p-5">

          {/* Header */}
          <div className="text-center mb-4">
            <div style={{ fontSize: 50 }}>🛡️</div>
            <h4 className="fw-bold mt-2">Admin Login</h4>
            <p className="text-muted small">
              Secure access for administrators only
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="alert alert-danger text-center py-2 small">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>

            {/* Email */}
            <div className="mb-3">
              <label className="form-label fw-semibold">Email</label>
              <input
                type="email"
                className="form-control rounded-3"
                placeholder="admin@gmail.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            {/* Password */}
            <div className="mb-4">
              <label className="form-label fw-semibold">Password</label>
              <input
                type="password"
                className="form-control rounded-3"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-dark w-100 py-2 fw-semibold rounded-3"
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Logging in...
                </>
              ) : (
                "🔐 Login as Admin"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="text-center mt-4">
            <small className="text-muted">
              Only authorized admins allowed
            </small>
          </div>

        </div>
      </div>
    </div>
  );
}