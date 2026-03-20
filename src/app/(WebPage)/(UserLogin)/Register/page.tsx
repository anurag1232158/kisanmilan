"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    password: "", role: "buyer", location: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:5000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // ✅ Role ke hisaab se redirect
      if (data.user.role === "agent") {
        router.push("/agent");
      } else {
        router.push("/Dashboard");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    {
      value: "buyer",
      icon:  "🛍️",
      label: "Buyer",
      desc:  "Khareedaar",
      color: "success",
    },
    {
      value: "farmer",
      icon:  "👨‍🌾",
      label: "Farmer",
      desc:  "Kisan",
      color: "success",
    },
    {
      value: "agent",
      icon:  "🏪",
      label: "Agent",
      desc:  "Market Agent",
      color: "primary",
    },
  ];

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5">
      <div className="card border-0 shadow rounded-4 w-100" style={{ maxWidth: 480 }}>
        <div className="card-body p-5">

          {/* Header */}
          <div className="text-center mb-4">
            <div style={{ fontSize: 48 }}>🌱</div>
            <h4 className="fw-bold text-success mt-2">Hello Demo Register</h4>
            <p className="text-muted small">Naya account banao — bilkul free!</p>
          </div>

          {error && (
            <div className="alert alert-danger py-2 text-center small">{error}</div>
          )}

          <form onSubmit={handleSubmit}>

            {/* ✅ Role Select — 3 options */}
            <div className="mb-4">
              <label className="form-label fw-semibold">Aap kaun hain?</label>
              <div className="d-flex gap-2">
                {roles.map(({ value, icon, label, desc, color }) => (
                  <div key={value}
                    onClick={() => setForm({ ...form, role: value })}
                    className="flex-fill text-center p-3 rounded-3"
                    style={{
                      cursor:      "pointer",
                      border:      `2px solid ${form.role === value
                        ? (color === "primary" ? "#0d6efd" : "#198754")
                        : "#dee2e6"}`,
                      background:  form.role === value
                        ? (color === "primary"
                            ? "rgba(13,110,253,0.1)"
                            : "rgba(25,135,84,0.1)")
                        : "white",
                      transition:  "all 0.2s",
                    }}>
                    <div style={{ fontSize: 28 }}>{icon}</div>
                    <div className={`fw-bold small mt-1 ${
                      form.role === value
                        ? (color === "primary" ? "text-primary" : "text-success")
                        : "text-dark"
                    }`}>
                      {label}
                    </div>
                    <div className="text-muted" style={{ fontSize: 11 }}>{desc}</div>
                  </div>
                ))}
              </div>

              {/* Role description */}
              <div className="mt-2">
                {form.role === "buyer" && (
                  <small className="text-success">
                    🛍️ Kisan se seedha product khareedoge
                  </small>
                )}
                {form.role === "farmer" && (
                  <small className="text-success">
                    👨‍🌾 Apne products list kar sakte ho aur sell kar sakte ho
                  </small>
                )}
                {form.role === "agent" && (
                  <small className="text-primary">
                    🏪 Apni location ke market rates set kar sakte ho
                  </small>
                )}
              </div>
            </div>

            {/* Name */}
            <div className="mb-3">
              <label className="form-label fw-semibold">Full Name</label>
              <input className="form-control"
                placeholder="Anurag Kumar"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required />
            </div>

            {/* Email */}
            <div className="mb-3">
              <label className="form-label fw-semibold">Email</label>
              <input className="form-control"
                type="email"
                placeholder="apna@email.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required />
            </div>

            {/* Phone + Location */}
            <div className="row g-3 mb-3">
              <div className="col-6">
                <label className="form-label fw-semibold">Phone</label>
                <input className="form-control"
                  placeholder="9999999999"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  required />
              </div>
              <div className="col-6">
                <label className="form-label fw-semibold">
                  Location
                  {form.role === "agent" && (
                    <span className="text-primary ms-1 small">*Agent ke liye zaruri</span>
                  )}
                </label>
                <input className="form-control"
                  placeholder="Noida, UP"
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  required={form.role === "agent"} />
              </div>
            </div>

            {/* Password */}
            <div className="mb-4">
              <label className="form-label fw-semibold">Password</label>
              <input className="form-control"
                type="password"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                minLength={6} />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`btn w-100 py-2 fw-semibold ${
                form.role === "agent" ? "btn-primary" : "btn-success"
              }`}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Registering...
                </>
              ) : (
                <>
                  {form.role === "buyer"  && "🛍️ Buyer Register Karo"}
                  {form.role === "farmer" && "👨‍🌾 Farmer Register Karo"}
                  {form.role === "agent"  && "🏪 Agent Register Karo"}
                </>
              )}
            </button>
          </form>

          <p className="text-center text-muted small mt-4">
            Already have account?{" "}
            <a href="/Login" className="text-success fw-semibold text-decoration-none">
              Login here
            </a>
          </p>

        </div>
      </div>
    </div>
  );
}