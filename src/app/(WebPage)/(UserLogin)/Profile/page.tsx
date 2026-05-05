"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { myLocation } from "../../(Service)/(Product)/Constants/myLocation";

type FormState = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  location: string; // <-- now a string
  vehicle_type: string;
  aadhaar: string;
  confirmPassword: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "buyer",
    location: "", // string now
    vehicle_type: "",
    aadhaar: "",
  });
  const [selState, setSelState] = useState("");
  const [selDistrict, setSelDistrict] = useState("");
  const [selCity, setSelCity] = useState("");
  const stateData = myLocation.find(s => s.state === selState);
  const districtList = stateData?.distict || [];
  const cityList = stateData?.cities || [];
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "danger">("success");
  const [showPass, setShowPass] = useState(false);

  // Load user from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      router.push("/Login");
      return;
    }
    const u = JSON.parse(stored);
    setUser(u);

    // Parse previous location if available
    let state = "", district = "", city = "";
    if (u.location) {
      const parts = u.location.split(",").map((s: string) => s.trim());
      if (parts.length === 3) [city, district, state] = parts;
    }

    setSelState(state);
    setSelDistrict(district);
    setSelCity(city);

    setForm(f => ({
      ...f,
      name: u.name || "",
      phone: u.phone || "",
      location: u.location || "",
      role: u.role || "buyer",
      email: u.email || "",
    }));
    setLoading(false);
  }, []);

  const showAlert = (text: string, type: "success" | "danger" = "success") => {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => setMsg(""), 4000);
  };

  const handleSave = async () => {

if (!form.phone || form.phone.length !== 10) {
  showAlert("Please enter a valid 10-digit phone number", "danger");
  return;
}
    if (form.password && form.password !== form.confirmPassword) {
      showAlert("Password match nahi kar raha!", "danger");
      return;
    }
    if (form.password && form.password.length < 6) {
      showAlert("Password kam se kam 6 characters ka hona chahiye!", "danger");
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem("token");

      // Prepare final location string
      const locationStr = [selCity, selDistrict, selState].filter(Boolean).join(", ");

      const body: any = {
        name: form.name,
        phone: form.phone,
        location: locationStr,
        role: form.role,
        email: form.email,
      };

      if (form.password) body.password = form.password;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/${user.id || user._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const updatedUser = { ...user, ...body };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      setForm(f => ({ ...f, password: "", confirmPassword: "" }));
      showAlert("Profile update ho gaya ✅");
    } catch (err: any) {
      showAlert(err.message, "danger");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <>
      </>
    );

  const roleBadge =
    user?.role === "farmer" ? "👨‍🌾 Farmer" : user?.role === "agent" ? "🏪 Agent" : "🛍️ Buyer";
  const roleColor = user?.role === "farmer" ? "success" : user?.role === "agent" ? "warning" : "primary";
  const shortId = (id: string) => (id ? `${id.slice(-8)}` : "N/A");

  const handleShowPass = () => setShowPass(!showPass);

  return (
    <>
      <div className="min-vh-100 bg-light py-4">
        <div className="container">
          <div className="row justify-content-center">
                 {/* Alert */}
           {msg && (  <div className={`alert alert-${msgType} rounded-3 mb-3 `}>{msg}</div> )}
            <div className="col-md-6">
              {/* Profile Header */}
              <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
                <div className="card-body p-0">
                   <div className="p-4 text-white text-center position-relative"
                   style={{ background: "linear-gradient(135deg,#198754,#20c997)", }}>
                <div className="position-absolute top-0 end-0 m-2">
             <span className={`badge bg-${roleColor}`}>
             {roleBadge}
              </span>
             </div>
         <div className="rounded-circle bg-white text-success fw-bold mx-autod-flex align-items-center justify-content-center mb-3 shadow"
          style={{ width: 90, height: 90, fontSize: 36 }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>

              <h4 className="fw-bold mb-1">{user?.name}</h4>
            <p className="mb-0 opacity-75 small">{user?.email}</p>
          </div>
                  {/* Stats Row */}
                  <div className="row g-0 border-top text-center">
                    <div className="col border-end py-3">
                      <div className="fw-bold text-success">{user?.location || "N/A"}</div>
                      <small className="text-muted">📍 Location</small>
                    </div>
                    <div className="col border-end py-3">
                      <div className="fw-bold text-success">{user?.phone || "N/A"}</div>
                      <small className="text-muted">📱 Phone</small>
                    </div>
                    <div className="col py-3">
                      <div className="fw-bold text-success capitalize">{user?.role}</div>
                      <small className="text-muted">👤 Role</small>
                    </div>
                  </div>
                </div>
              </div>
             </div>
            <div className="col-md-6">
  <div className="card border-0 shadow-sm rounded-4 mb-4">
    <div className="card-body p-4">
      <h6 className="fw-bold text-success mb-3">ℹ️ Account Info</h6>
      {[
       ["🆔 User ID", shortId(user?._id || user?.id)],
        ["📧 Email", user?.email || "N/A"],
        ["👤 Role", roleBadge],
        ["📍 Location", user?.location || "N/A"],
        ["📱 Phone", user?.phone || "N/A"],
      ].map(([label, value]) => (
        <div  key={label}  className="d-flex justify-content-between py-2 border-bottom" >
          <span className="text-muted small">{label}</span>
          <span className="fw-semibold small text-end">{value}</span>
        </div>
      ))}

    </div>
  </div>
            </div>
           <div className="col-md-6">
              {/* Quick Links */}
              <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-body p-4">
                  <h6 className="fw-bold text-success mb-3">⚡ Quick Links</h6>
                  <div className="row g-2">
                    {[
                      { href: "/Dashboard", icon: "📊", label: "Dashboard", bg: "success"   },
                      { href: "/Orders",    icon: "📦", label: "Orders",    bg: "primary"   },
                      { href: "/Product",   icon: "🛒", label: "Products",  bg: "info"      },
                      { href: "/Rates",     icon: "📈", label: "Rates",     bg: "warning"   },
                    ].map(({ href, icon, label, bg }) => (
                      <div key={href} className="col-6">
                        <a href={href} className="text-decoration-none">
                          <div className={`card border-0 bg-${bg} bg-opacity-10 rounded-3 text-center p-3`}>
                            <div style={{ fontSize: 24 }}>{icon}</div>
                            <small className={`fw-semibold text-${bg} d-block mt-1`}>{label}</small>
                          </div>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              </div>
              <div className="col-md-6">
              {/* Edit Form */}
              <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-body p-4">
                  <h6 className="fw-bold text-success mb-4">✏️ Profile Edit Karo</h6>
                  <div className="row g-3">
                    
                    <div className="col-6">
                      <label className="form-label fw-bold fs-7">👤 Name</label>
                      <input className="form-control rounded-3"
                        placeholder="Poora naam"
                        value={form.name}
                        onChange={e => setForm({...form, name: e.target.value})} />
                    </div>
 
                    <div className="col-md-6">
  <label className="form-label fw-bold fs-7">📱 Phone</label>
  <input
    className="form-control rounded-3"
    placeholder="Mobile number"
    type="text"  // use text for phone
    value={form.phone}
    maxLength={10}  // limits digits
    required
    onChange={e => {
      // allow only digits
      const val = e.target.value.replace(/\D/g, "");
      setForm({ ...form, phone: val });
    }}
  />
                   </div>

                    <div className="row g-2">
                          {/* ── Location / Mandi ── */}

                        <div className="col-4">
                        <select
                          className="form-select add-input mb-2"
                          style={{ borderRadius: 10 }}
                          value={selState} 
                          onChange={e => { 
                            const st = e.target.value;
                            setSelState(st);
                            setSelDistrict("");
                            setSelCity("");
                          }} 
                        >
                          <option value="">-- State --</option>
                          {myLocation.map(s => (
                            <option key={s.state} value={s.state}>
                              {s.state}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* District */}
                      <div className="col-4">
                        <select
                          className="form-select add-input mb-2" 
                          style={{ borderRadius: 10 }}
                          value={selDistrict}
                          
                          onChange={e => {
                            setSelDistrict(e.target.value);
                            setSelCity("");
                          }} 
                        >
                          <option value="">-- District --</option>
                          {districtList.map(d => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* City */}
                      <div className="col-4">
                        <select
                          className="form-select add-input"
                          style={{ borderRadius: 10 }}
                          value={selCity}
                        
                          onChange={e => setSelCity(e.target.value)}
                        >
                          <option value="">-- City --</option>
                          {cityList.map(c => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>


                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold">📧 Email</label>
                      <input className="form-control rounded-3"
                        placeholder="Email"
                        value={form.email}
                        onChange={e => setForm({...form, email: e.target.value})} />
                    </div>
                     


                    <div className="col-12">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="form-label fw-semibold mb-0">🔐 New Password</label>
                        <button className="btn btn-sm btn-outline-secondary"
                          onClick={() => setShowPass(!showPass)}>
                          {showPass ? "Hide" : "Show"}
                        </button>
                      </div>
                      <input
                        type={showPass ? "text" : "password"}
                        className="form-control rounded-3"
                        placeholder="Khali rakho agar change nahi karna"
                        value={form.password}
                        onChange={e => setForm({...form, password: e.target.value})} />
                    </div>

                  </div>

                  <button className="btn btn-success w-100 fw-semibold rounded-3 mt-4"
                    onClick={handleSave} disabled={saving}>
                    {saving
                      ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</>
                      : "✅ Profile Save Karo"}
                  </button>
                </div>
              </div>
                </div>
          </div>
        </div>
      </div>
    </>
  );
}