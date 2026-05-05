"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type FormState = {
  email:    string;
  password: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

const ROLE_META: Record<string, { icon: string; label: string; bg: string; text: string }> = {
  buyer:    { icon: "🛍️", label: "Buyer",            bg: "success", text: "success" },
  farmer:   { icon: "👨‍🌾", label: "Farmer",           bg: "success", text: "success" },
  agent:    { icon: "🏪",  label: "Market Agent",     bg: "primary", text: "primary" },
  dpartner: { icon: "🚚",  label: "Delivery Partner", bg: "purple",  text: "purple"  },
};

/* ══════════════════════════════════════════
   ✅ LoginContent — useSearchParams yahan
══════════════════════════════════════════ */
function LoginContent() {
  const router      = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl  = searchParams.get("callbackUrl") || "/";

  const [form, setForm]               = useState<FormState>({ email: "", password: "" });
  const [errors, setErrors]           = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading]         = useState(false);
  const [showPass, setShowPass]       = useState(false);
  const [detectedRole, setDetectedRole] = useState<string | null>(null);

  /* ── Validation ── */
  const getError = (field: keyof FormState, value: string): string => {
    if (field === "email") {
      if (!value.trim()) return "Email daalna zaroori hai";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "Sahi email format likho";
    }
    if (field === "password") {
      if (!value) return "Password daalna zaroori hai";
      if (value.length < 6) return "Password minimum 6 characters ka hona chahiye";
    }
    return "";
  };

  const validateField = (field: keyof FormState, value: string): boolean => {
    const msg = getError(field, value);
    setErrors((p) => ({ ...p, [field]: msg }));
    return msg === "";
  };

  const validateAll = (): boolean => {
    const e = validateField("email",    form.email);
    const p = validateField("password", form.password);
    return e && p;
  };

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError("");
    if (!validateAll()) return;
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email:    form.email.trim().toLowerCase(),
          password: form.password,
        }),
      });

      const data: {
        token?: string;
        user?:  { role: string; name?: string };
        error?: string;
      } = await res.json();

      if (!res.ok) {
        const msg = data.error || "Login failed — email ya password galat hai";
        if (msg.toLowerCase().includes("email") || msg.toLowerCase().includes("user"))
          setErrors((p) => ({ ...p, email: "Yeh email registered nahi hai" }));
        else if (msg.toLowerCase().includes("password"))
          setErrors((p) => ({ ...p, password: "Password galat hai" }));
        else
          setServerError(msg);
        return;
      }

      if (!data.token || !data.user?.role) {
        setServerError("Server response invalid hai. Dobara try karo.");
        return;
      }

      setDetectedRole(data.user.role);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("authChange"));

      // ✅ Login ke baad → callbackUrl (ProductDetails) ya home
      setTimeout(() => router.push(callbackUrl), 800);

    } catch {
      setServerError("Server se connect nahi ho pa raha. Internet check karo.");
    } finally {
      setLoading(false);
    }
  };

  const roleMeta = detectedRole ? ROLE_META[detectedRole] : null;

  /* ════════════════════ RENDER ════════════════════ */
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light1 py-4">
      <div
        className="card border-0 shadow rounded-4 p-4 p-md-5"
        style={{ width: "100%", maxWidth: 440 }}
      >

        {/* Header */}
        <div className="text-center mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-4 mb-3"
            style={{ width: 64, height: 64, fontSize: 32, background: "#dcfce7" }}
          >
            🌱
          </div>
          <h4 className="fw-bold text-success mb-1">Wapas Aao!</h4>
          <p className="text-muted small mb-0">Apne account mein login karo</p>
        </div>

        {/* Role detected banner */}
        {roleMeta && (
          <div
            className={`alert alert-${roleMeta.bg === "purple" ? "secondary" : roleMeta.bg} d-flex align-items-center gap-2 py-2 rounded-3 mb-3`}
            style={roleMeta.bg === "purple" ? { background: "#f5f3ff", borderColor: "#c4b5fd", color: "#7c3aed" } : {}}
          >
            <span style={{ fontSize: 20 }}>{roleMeta.icon}</span>
            <span className="fw-semibold small">{roleMeta.label} ke roop mein login ho rahe ho...</span>
            <div
              className="spinner-border spinner-border-sm ms-auto"
              style={roleMeta.bg === "purple" ? { color: "#7c3aed" } : {}}
            />
          </div>
        )}

        {/* Server error */}
        {serverError && (
          <div className="alert alert-danger d-flex align-items-center gap-2 py-2 rounded-3 small mb-3">
            <span>⚠️</span>
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          {/* Email */}
          <div className="mb-3">
            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
              Email Address <span className="text-danger">*</span>
            </label>
            <input
              className={`form-control rounded-3 ${
                errors.email              ? "is-invalid" :
                form.email && !errors.email ? "is-valid"   : ""
              }`}
              type="email"
              placeholder="abc@gmail.com"
              value={form.email}
              autoComplete="email"
              onChange={(e) => {
                setForm((p) => ({ ...p, email: e.target.value }));
                if (errors.email) validateField("email", e.target.value);
              }}
              onBlur={(e) => validateField("email", e.target.value)}
            />
            {errors.email && (
              <div className="invalid-feedback d-block" style={{ fontSize: 12 }}>
                ⚠ {errors.email}
              </div>
            )}
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
              Password <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <input
                className={`form-control rounded-start-3 ${errors.password ? "is-invalid" : ""}`}
                type={showPass ? "text" : "password"}
                placeholder="Apna password daalo"
                value={form.password}
                autoComplete="current-password"
                onChange={(e) => {
                  setForm((p) => ({ ...p, password: e.target.value }));
                  if (errors.password) validateField("password", e.target.value);
                }}
                onBlur={(e) => validateField("password", e.target.value)}
              />
              <button
                type="button"
                className="btn btn-outline-secondary rounded-end-3"
                onClick={() => setShowPass((v) => !v)}
                tabIndex={-1}
                style={{ fontSize: 16, borderLeft: "none" }}
              >
                {showPass ? "🙈" : "👁️"}
              </button>
              {errors.password && (
                <div className="invalid-feedback d-block w-100" style={{ fontSize: 12 }}>
                  ⚠ {errors.password}
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-success w-100 py-2 fw-bold rounded-3"
            style={{ fontSize: 15 }}
            disabled={loading || !!detectedRole}
          >
            {loading ? (
              <div className="spinner-border spinner-border-sm" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            ) : (
              "🌱 Login Karo"
            )}
          </button>

        </form>

        {/* Divider */}
        <div className="d-flex align-items-center gap-2 my-3">
          <hr className="flex-grow-1 m-0" />
          <span className="text-muted small">ya</span>
          <hr className="flex-grow-1 m-0" />
        </div>

        {/* Register link */}
        <p className="text-center text-muted small mb-0">
          Account nahi hai?{" "}
          <a href="/Register" className="text-success fw-bold text-decoration-none">
            Register karo — free hai!
          </a>
        </p>

      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   ✅ Default Export — Suspense wrap karo
══════════════════════════════════════════ */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-vh-100 d-flex align-items-center justify-content-center">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}