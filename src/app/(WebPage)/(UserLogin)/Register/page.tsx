"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { myLocation } from "../../(Service)/(Product)/Constants/myLocation";

type FormState = {
  name:         string;
  email:        string;
  phone:        string;
  password:     string;
  cpassword:    string;  // ✅ confirm password
  role:         string;
  location:     string;
  vehicle_type: string;
  aadhaar:      string;
};

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    name: "", email: "", phone: "",
    password: "", cpassword: "",
    role: "buyer", location: "",
    vehicle_type: "", aadhaar: "",
  });

  const [selState,    setSelState]    = useState("");
  const [selDistrict, setSelDistrict] = useState("");
  const [selCity,     setSelCity]     = useState("");

  const stateData    = myLocation.find((s) => s.state === selState);
  const districtList: string[] = (stateData as any)?.district || (stateData as any)?.distict || [];
  const cityList:     string[] = stateData?.cities || [];

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading]         = useState(false);
  const [showPass,  setShowPass]      = useState(false);
  const [showCPass, setShowCPass]     = useState(false);

  const isDelivery = form.role === "dpartner";
  const isAgent    = form.role === "agent";
  const isBuyer    = form.role === "buyer";
  const isFarmer   = form.role === "farmer";

  const getError = (field: string, value: string): string => {
    switch (field) {
      case "name":
        return value.trim().length < 2 ? "Naam kam se kam 2 characters ka hona chahiye" : "";
      case "email":
        if (!value.trim()) return "Email required hai";
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? "" : "Sahi email format likho";
      case "phone":
        if (!value.trim()) return "Phone required hai";
        return /^[6-9]\d{9}$/.test(value.trim()) ? "" : "10-digit Indian mobile number (6-9 se shuru)";
      case "password":
        return value.length < 6 ? "Password minimum 6 characters ka hona chahiye" : "";
      case "cpassword":
        if (!value.trim()) return "Confirm password required hai";
        return value === form.password ? "" : "Dono passwords match nahi kar rahe ❌";
      case "location":
        return (isAgent || isDelivery || isBuyer || isFarmer) && !value.trim()
          ? "Location zaruri hai — City tak select karo"
          : "";
      case "vehicle_type":
        return isDelivery && !value ? "Vehicle type select karo" : "";
      case "aadhaar":
        if (!value.trim()) return "Aadhaar number required hai";
        return /^\d{12}$/.test(value.replace(/\s/g, "")) ? "" : "12-digit Aadhaar number likho";
      default:
        return "";
    }
  };

  const validate = (field: string, value: string) => {
    const msg = getError(field, value);
    setFieldErrors((p) => ({ ...p, [field]: msg }));
    return msg === "";
  };

  const validateAll = () => {
    const errors: Record<string, string> = {};
    let ok = true;
    const check = (f: string, v: string) => {
      const msg = getError(f, v);
      if (msg) { errors[f] = msg; ok = false; }
    };
    check("name",         form.name);
    check("email",        form.email);
    check("phone",        form.phone);
    check("password",     form.password);
    check("cpassword",    form.cpassword);
    check("location",     form.location);
    check("vehicle_type", form.vehicle_type);
    check("aadhaar",      form.aadhaar);
    setFieldErrors(errors);
    return ok;
  };

  const buildLocation = (city: string, district: string, state: string) =>
    [city, district, state].filter(Boolean).join(", ");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    if ((isAgent || isDelivery || isBuyer || isFarmer) && !selCity) {
      setFieldErrors((p) => ({ ...p, location: "City select karna zaroori hai" }));
      return;
    }
    if (!validateAll()) return;
    setLoading(true);

    try {
      const payload: Record<string, string> = {
        name:     form.name.trim(),
        email:    form.email.trim().toLowerCase(),
        phone:    form.phone.trim(),
        password: form.password,
        role:     form.role,
        location: form.location.trim(),
        aadhaar:  form.aadhaar.replace(/\s/g, ""),
      };
      if (isDelivery) {
        payload.vehicle_type = form.vehicle_type;
      }

      const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg: string = data.error || data.message || "Registration failed";
        if (msg.toLowerCase().includes("email"))
          setFieldErrors((p) => ({ ...p, email: "Yeh email pehle se registered hai" }));
        else if (msg.toLowerCase().includes("phone"))
          setFieldErrors((p) => ({ ...p, phone: "Yeh number pehle se registered hai" }));
        else if (msg.toLowerCase().includes("aadhaar"))
          setFieldErrors((p) => ({ ...p, aadhaar: "Yeh Aadhaar pehle se registered hai" }));
        else
          setServerError(msg);
        return;
      }

      if (!data.token || !data.user?.role) {
        setServerError("Server response invalid hai. Dobara try karo.");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("authChange"));
      router.push("/Dashboard");

    } catch {
      setServerError("Server se connect nahi ho pa raha. Dobara try karo.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Static data ── */
  const roles = [
    { value: "buyer",    icon: "🛍️", label: "Buyer",    desc: "Khareedaar",       color: "#16a34a" },
    { value: "farmer",   icon: "👨‍🌾", label: "Farmer",   desc: "Kisan",            color: "#16a34a" },
    { value: "agent",    icon: "🏪",  label: "Agent",    desc: "Market Agent",     color: "#0d6efd" },
    { value: "dpartner", icon: "🚚",  label: "Delivery", desc: "Delivery Partner", color: "#7c3aed" },
  ];
  const roleHints: Record<string, string> = {
    buyer:    "🛍️ Kisan se seedha product khareedoge",
    farmer:   "👨‍🌾 Apne products list karke sell kar sakte ho",
    agent:    "🏪 Apni location ke market rates set kar sakte ho",
    dpartner: "🚚 Orders deliver karoge aur delivery commission kamao",
  };
  const activeColor =
    form.role === "agent"    ? "#0d6efd" :
    form.role === "dpartner" ? "#7c3aed" : "#16a34a";

  const vehicles = [
    { value: "bike",    label: "🏍️ Bike"       },
    { value: "bicycle", label: "🚲 Bicycle"     },
    { value: "auto",    label: "🛺 Auto"        },
    { value: "truck",   label: "🚛 Truck"       },
    { value: "van",     label: "🚐 Van / Tempo" },
  ];

  const getStrength = (p: string) => {
    if (!p) return 0;
    if (p.length < 6)  return 1;
    if (p.length < 8)  return 2;
    if (p.length < 12) return 3;
    return 4;
  };
  const strengthColors = ["", "#dc2626", "#d97706", "#16a34a", "#15803d"];
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
  const strength = getStrength(form.password);

  const cpassMatch    = form.cpassword.length > 0 && form.cpassword === form.password;
  const cpassMismatch = form.cpassword.length > 0 && form.cpassword !== form.password;

  const ErrMsg = ({ field }: { field: string }) =>
    fieldErrors[field] ? (
      <div style={{ fontSize: 12, color: "#dc2626", marginTop: 4 }}>⚠ {fieldErrors[field]}</div>
    ) : null;

  /* ════════════════════ RENDER ════════════════════ */
  return (
    <div className="bg-light">
      <div className="container">

        {/* Header */}
        <div className="text-center py-1">
          <div className="display-1">🌱</div>
          <h4 className="fw-bold mt-1 text-success">Register Karo</h4>
        </div>

        {serverError && (
          <div className="mb-3 text-center small py-2 px-3 text-white bg-danger rounded-3">
            ⚠ {serverError}
          </div>
        )}

        <div className="row g-3">

          <div className="col-sm-5 col-12">
            <div className="p-4 shadow-sm rounded-4 bg-white h-100">
              <span className="small py-4">Naya account banao — bilkul free!</span>
              <label className="form-label fw-semibold px-2  py-2 text-success">Aap kaun hain?</label>
              <div className="d-flex gap-2 flex-wrap">
                {roles.map(({ value, icon, label, desc, color }) => {
                  const sel = form.role === value;
                  return (
                    <div key={value} onClick={() => {
                       setForm({ ...form, role: value, vehicle_type: "", aadhaar: "" });
                      setFieldErrors({});
                      }}
                      style={{
                        cursor: "pointer",
                        border: `2px solid ${sel ? color : "#e5e7eb"}`,
                        background: sel ? `${color}14` : "white",
                        borderRadius: 12, padding: "10px 12px",
                        textAlign: "center", minWidth: 100,
                        flex: "1 1 100px", transition: "all 0.2s",
                      }}>
                      <div className="fs-5">{icon}</div>
                      <div className="fw-bold mt-2 mb-1 text-dark">{label}</div>
                      <div className="text-muted small">{desc}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: 12, marginTop: 8, color: activeColor }}>
                {roleHints[form.role]}
              </div>
              <div className="pt-4 m-auto">
            <h5 className="text-center small fs-6">
          Already have account?{" "}
          <a href="/Login" style={{ color: "#16a34a", fontWeight: 600, textDecoration: "underline" }}>
            Login here
          </a>
        </h5>
        </div>
            </div>
          </div>

          {/* RIGHT — Form */}
          <div className="col-sm-7 col-12">
            <div className="p-4 shadow-sm rounded-4 bg-white">
              <form onSubmit={handleSubmit} noValidate>

                {/* Row 1: Name + Email */}
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label fw-semibold fs-7">
                      Full Name <span className="text-danger">*</span>
                    </label>
                    <input className={`form-control ${fieldErrors.name ? "is-invalid" : ""}`}
                      placeholder="e.g. Ramesh Kumar" value={form.name}
                      onChange={(e) => { setForm({ ...form, name: e.target.value }); if (fieldErrors.name) validate("name", e.target.value); }}
                      onBlur={(e) => validate("name", e.target.value)} />
                    <ErrMsg field="name" />
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-semibold fs-7">
                      Email Address <span className="text-danger">*</span>
                    </label>
                    <input className={`form-control ${fieldErrors.email ? "is-invalid" : ""}`}
                      type="email" placeholder="abc@gmail.com" value={form.email}
                      onChange={(e) => { setForm({ ...form, email: e.target.value }); if (fieldErrors.email) validate("email", e.target.value); }}
                      onBlur={(e) => validate("email", e.target.value)} />
                    <ErrMsg field="email" />
                  </div>
                </div>

                {/* Row 2: Phone + Aadhaar (Aadhaar only for dpartner) */}
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label fw-semibold fs-7">
                      Mobile Number <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text fw-semibold"
                        style={{ background: "#f0fdf4", fontSize: 13 }}>+91</span>
                      <input
                        className={`form-control ${fieldErrors.phone ? "is-invalid" : ""}`}
                        type="tel" placeholder="9876543210" maxLength={10}
                        value={form.phone}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "").slice(0, 10);
                          setForm({ ...form, phone: v });
                          if (fieldErrors.phone) validate("phone", v);
                        }}
                        onBlur={(e) => validate("phone", e.target.value)}
                      />
                    </div>
                    <ErrMsg field="phone" />
                    <div className="text-muted mt-1" style={{ fontSize: 11 }}>10-digit (6–9 se shuru)</div>
                  </div>

                  {/* Aadhaar — all roles */}
                  <div className="col-6">
                    <label className="form-label fw-semibold fs-7">
                      Aadhaar Number <span className="text-danger">*</span>
                    </label>
                    <input
                      className={`form-control ${fieldErrors.aadhaar ? "is-invalid" : ""}`}
                      placeholder="1234 5678 9012" maxLength={14}
                      value={form.aadhaar}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "").slice(0, 12);
                        const fmt = raw.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
                        setForm({ ...form, aadhaar: fmt });
                        if (fieldErrors.aadhaar) validate("aadhaar", fmt);
                      }}
                      onBlur={(e) => validate("aadhaar", e.target.value)}
                    />
                    <ErrMsg field="aadhaar" />
                    <div className="text-muted mt-1" style={{ fontSize: 11 }}>12-digit, auto format hoga</div>
                  </div>
                </div>

                {/* Location — State / District / City */}
                <div className="mb-3">
                  <label className="form-label fw-semibold fs-7">
                    Location {(isAgent || isDelivery || isBuyer || isFarmer) && <span className="text-danger">*</span>}
                  </label>
                  <div className="row g-2">
                    <div className="col-4">
                      <select
                        className={`form-select ${fieldErrors.location && !selState ? "is-invalid" : ""}`}
                        value={selState}
                        onChange={(e) => {
                          const st = e.target.value;
                          setSelState(st); setSelDistrict(""); setSelCity("");
                          setForm({ ...form, location: "" });
                          if (fieldErrors.location) validate("location", "");
                        }}>
                        <option value="">-- State --</option>
                        {myLocation.map((s) => <option key={s.state} value={s.state}>{s.state}</option>)}
                      </select>
                    </div>
                    <div className="col-4">
                      <select className="form-select" value={selDistrict} disabled={!selState}
                        onChange={(e) => {
                          const dist = e.target.value;
                          setSelDistrict(dist); setSelCity("");
                          setForm({ ...form, location: "" });
                        }}>
                        <option value="">-- District --</option>
                        {districtList.map((d: string) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="col-4">
                      <select
                        className={`form-select ${fieldErrors.location ? "is-invalid" : ""}`}
                        value={selCity} disabled={!selState}
                        onChange={(e) => {
                          const city = e.target.value;
                          setSelCity(city);
                          const loc = buildLocation(city, selDistrict, selState);
                          setForm({ ...form, location: loc });
                          if (fieldErrors.location) validate("location", loc);
                        }}>
                        <option value="">-- City --</option>
                        {cityList.map((c: string) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <ErrMsg field="location" />
                  {form.location && (
                    <div className="mt-2 px-2 py-1 rounded-2 d-flex align-items-center gap-1"
                      style={{ background: `${activeColor}12`, fontSize: 12, color: activeColor }}>
                      📍 <strong>{form.location}</strong>
                    </div>
                  )}
                </div>

                {/* Vehicle Type — dpartner only */}
                {isDelivery && (
                  <div className="mb-3 p-3 rounded-3"
                    style={{ background: "#f5f3ff", border: "1.5px solid #c4b5fd" }}>
                    <div className="fw-semibold mb-2" style={{ fontSize: 13, color: "#7c3aed" }}>
                      🚚 Vehicle Type <span className="text-danger">*</span>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      {vehicles.map(({ value, label }) => {
                        const sel = form.vehicle_type === value;
                        return (
                          <div key={value}
                            onClick={() => { setForm({ ...form, vehicle_type: value }); if (fieldErrors.vehicle_type) validate("vehicle_type", value); }}
                            style={{
                              cursor: "pointer",
                              border: `2px solid ${sel ? "#7c3aed" : "#e5e7eb"}`,
                              background: sel ? "#ede9fe" : "white",
                              borderRadius: 10, padding: "8px 14px",
                              fontSize: 13, fontWeight: sel ? 600 : 400,
                              color: sel ? "#7c3aed" : "#374151",
                              transition: "all 0.2s",
                            }}>
                            {label}
                          </div>
                        );
                      })}
                    </div>
                    <ErrMsg field="vehicle_type" />
                  </div>
                )}

                {/* Row 3: Password + Confirm Password */}
                <div className="row g-2 mb-4">
                  {/* Password */}
                  <div className="col-6">
                    <label className="form-label fw-semibold fs-7">
                      Password <span className="text-danger">*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        className={`form-control ${fieldErrors.password ? "is-invalid" : ""}`}
                        type={showPass ? "text" : "password"}
                        placeholder="Min 6 characters"
                        value={form.password}
                        onChange={(e) => {
                          setForm({ ...form, password: e.target.value });
                          if (fieldErrors.password) validate("password", e.target.value);
                          if (form.cpassword) validate("cpassword", form.cpassword);
                        }}
                        onBlur={(e) => validate("password", e.target.value)}
                        style={{ paddingRight: 40 }}
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 15, padding: 0 }}>
                        {showPass ? "🙈" : "👁️"}
                      </button>
                    </div>
                    <ErrMsg field="password" />
                    {form.password.length > 0 && (
                      <div style={{ marginTop: 6 }}>
                        <div style={{ display: "flex", gap: 3, marginBottom: 2 }}>
                          {[1, 2, 3, 4].map((n) => (
                            <div key={n} style={{
                              flex: 1, height: 4, borderRadius: 2,
                              background: n <= strength ? strengthColors[strength] : "#e5e7eb",
                              transition: "background 0.3s",
                            }} />
                          ))}
                        </div>
                        <div style={{ fontSize: 11, color: strengthColors[strength] }}>
                          {strengthLabels[strength]} password
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="col-6">
                    <label className="form-label fw-semibold fs-7">
                      Confirm Password <span className="text-danger">*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        className={`form-control ${fieldErrors.cpassword ? "is-invalid" : cpassMatch ? "is-valid" : ""}`}
                        type={showCPass ? "text" : "password"}
                        placeholder="Password dobara likho"
                        value={form.cpassword}
                        onChange={(e) => {
                          setForm({ ...form, cpassword: e.target.value });
                          if (fieldErrors.cpassword) validate("cpassword", e.target.value);
                        }}
                        onBlur={(e) => validate("cpassword", e.target.value)}
                        style={{ paddingRight: 40 }}
                      />
                      <button type="button" onClick={() => setShowCPass(!showCPass)}
                        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 15, padding: 0 }}>
                        {showCPass ? "🙈" : "👁️"}
                      </button>
                    </div>
                    <ErrMsg field="cpassword" />
                    {form.cpassword.length > 0 && !fieldErrors.cpassword && (
                      <div style={{ fontSize: 11, marginTop: 4, color: cpassMatch ? "#16a34a" : "#dc2626" }}>
                        {cpassMatch ? "✅ Passwords match ho rahe hain" : "❌ Passwords match nahi kar rahe"}
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit */}
                <button type="submit" disabled={loading}
                  className="btn w-100 py-2 fw-semibold"
                  style={{ background: loading ? "#d1d5db" : activeColor, border: "none", color: "white", borderRadius: 10, fontSize: 15 }}>
                  {loading ? (
                    <></>
                  ) : (
                    <>
                      {form.role === "buyer"    && "🛍️ Buyer Register Karo"}
                      {form.role === "farmer"   && "👨‍🌾 Farmer Register Karo"}
                      {form.role === "agent"    && "🏪 Agent Register Karo"}
                      {form.role === "dpartner" && "🚚 Delivery Partner Register Karo"}
                    </>
                  )}
                </button>

              </form>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}