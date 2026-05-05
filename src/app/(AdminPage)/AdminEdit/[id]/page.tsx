"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";

const BASE = `${process.env.NEXT_PUBLIC_API_URL}`;

const CC: Record<string, { endpoint: string; label: string; icon: string; color: string }> = {
  users:       { endpoint: "/user",         label: "User",        icon: "👤", color: "primary" },
  products:    { endpoint: "/products",     label: "Product",     icon: "📦", color: "info"    },
  orders:      { endpoint: "/order",        label: "Order",       icon: "🧾", color: "danger"  },
  payments:    { endpoint: "/payment",      label: "Payment",     icon: "💳", color: "success" },
  farmerrates: { endpoint: "/farmer-rates", label: "Farmer Rate", icon: "🌾", color: "success" },
  agentrates:  { endpoint: "/agent-rates",  label: "Agent Rate",  icon: "🏪", color: "warning" },
  reviews:     { endpoint: "/review",       label: "Review",      icon: "⭐", color: "warning" },
};
const SELECT_OPTS: Record<string, string[]> = {
  role:           ["farmer", "buyer", "agent", "dpartner", "admin"],
  status:         ["pending", "confirmed", "shipped", "delivered", "cancelled", "completed", "failed", "refunded"],
  payment_status: ["pending", "completed", "failed", "refunded"],
  payment_method: ["UPI", "NetBanking", "Card", "COD"],
  unit:           ["kg", "g", "litre", "ml", "dozen", "piece", "quintal"],
  vehicle_type:   ["bike", "bicycle", "auto", "truck", "van"],
};
const STATUS_COLORS: Record<string, string> = {
  pending: "warning", confirmed: "primary", shipped: "info",
  delivered: "success", cancelled: "danger", completed: "success",
  failed: "danger", refunded: "secondary",
};
const SKIP = ["_id", "__v", "createdAt", "updatedAt", "password"];
const CLOUDINARY_CLOUD  = "dshk1fe2l";
const CLOUDINARY_PRESET = "kisanmilan_preset";
const FIELD_GROUPS: Record<string, { title: string; icon: string; fields: string[] }[]> = {
  products: [
    { title: "Basic Info",    icon: "📋", fields: ["product_name","name","category","description"] },
    { title: "Pricing",       icon: "💰", fields: ["price","unit","stock"] },
    { title: "Farmer & Location", icon: "🌾", fields: ["farmer_name","farmer_id","location"] },
    { title: "Availability",  icon: "✅", fields: ["is_available"] },
    { title: "Image",         icon: "🖼️", fields: ["image_url"] },
  ],
  orders: [
    { title: "Buyer Info",    icon: "🛒", fields: ["buyer_name","buyer_email","buyer_phone","buyer_id"] },
    { title: "Product Info",  icon: "📦", fields: ["product_name","product_id","quantity","unit","total_price"] },
    { title: "Seller & Delivery", icon: "🚚", fields: ["farmer_name","farmer_id","dpartner_name","dpartner_id","delivery_address"] },
    { title: "Status",        icon: "📊", fields: ["status","payment_method","payment_status"] },
  ],
  users: [
    { title: "Personal Info", icon: "👤", fields: ["name","email","phone"] },
    { title: "Role & Access", icon: "🔐", fields: ["role","is_verified","is_active"] },
    { title: "Location",      icon: "📍", fields: ["location","address","aadhaar"] },
    { title: "Vehicle",       icon: "🚗", fields: ["vehicle_type","vehicle_number"] },
  ],
};

function EditForm() {
  const router       = useRouter();
  const params       = useParams();
  const searchParams = useSearchParams();
  const id         = params?.id as string;
  const collection = searchParams?.get("col") || "";
  const [original, setOriginal] = useState<any>(null);
  const [form,     setForm]     = useState<any>({});
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState<{ text: string; ok: boolean } | null>(null);
  const getToken = () => typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
  const flash = (text: string, ok: boolean) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 4000);
  };

  useEffect(() => {
    if (!id || !collection) { setLoading(false); return; }
    const cfg = CC[collection];
    if (!cfg) { setLoading(false); return; }
    fetch(`${BASE}${cfg.endpoint}/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(d => {
        const record = Array.isArray(d) ? d[0] : d;
        setOriginal(record);
        setForm({ ...record });
      })
      .catch(() => flash("❌ Record load nahi hua.", false))
      .finally(() => setLoading(false));
  }, [id, collection]);
  const handleImageUpload = async (file: File, fieldKey: string) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", CLOUDINARY_PRESET);
    setForm((f: any) => ({ ...f, [`${fieldKey}_uploading`]: true }));
    try {
      const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, { method: "POST", body: fd });
      const data = await res.json();
      if (data.secure_url) {
        setForm((f: any) => ({ ...f, [fieldKey]: data.secure_url, [`${fieldKey}_uploading`]: false }));
      } else {
        flash("❌ Upload failed: " + (data.error?.message || "Unknown"), false);
        setForm((f: any) => ({ ...f, [`${fieldKey}_uploading`]: false }));
      }
    } catch {
      flash("❌ Network error during upload", false);
      setForm((f: any) => ({ ...f, [`${fieldKey}_uploading`]: false }));
    }
  };
  const handleSave = async () => {
    const cfg = CC[collection];
    if (!cfg || !id) return;
    setSaving(true);
    try {
      const payload = { ...form };
      SKIP.forEach(k => delete payload[k]);
      Object.keys(payload).forEach(k => { if (k.endsWith("_uploading")) delete payload[k]; });
      const r = await fetch(`${BASE}${cfg.endpoint}/${id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || d.message || "Update failed");
      flash(`✅ ${cfg.label} successfully updated!`, true);
      const returnTab = searchParams?.get("tab") || collection;
      setTimeout(() => router.push(`/AdminDashboard?tab=${returnTab}`), 200);
    } catch (e: any) {
      flash(`❌ ${e.message}`, false);
    }
    setSaving(false);
  };
  const renderField = (k: string) => {
    const v = form[k];
    if (v === undefined && !["image_url"].includes(k)) return null;
    if (k.endsWith("_uploading")) return null;

    const isBool      = typeof v === "boolean";
    const isSelect    = k in SELECT_OPTS;
    const isNum       = ["price","stock","quantity","amount","rating","total_price"].includes(k);
    const isTextArea  = ["description","delivery_address","comment","review"].includes(k);
    const isImage     = k === "image_url";
    const isUploading = !!form[`${k}_uploading`];
    const imgSrc      = String(form[k] ?? "").trim();
    const isStatus    = k === "status";

    return (
      <div key={k} className={isTextArea || isImage ? "col-12" : "col-md-6 col-12"}>
        {/* Label */}
        <label className="form-label fw-semibold text-capitalize mb-1 d-flex align-items-center gap-1"
          style={{ fontSize: "0.78rem", color: "#64748b", letterSpacing: "0.02em" }}>
          {k.replace(/_/g, " ")}
          {isStatus && <span className="badge bg-warning text-dark" style={{ fontSize: "0.6rem" }}>KEY FIELD</span>}
          {isImage  && <span className="badge bg-info text-white"   style={{ fontSize: "0.6rem" }}>IMAGE</span>}
        </label>

        {/* Status special — badge preview */}
        {isStatus && form[k] && (
          <div className="mb-2">
            <span className={`badge bg-${STATUS_COLORS[form[k]] || "secondary"} px-3 py-2`}
              style={{ fontSize: "0.78rem" }}>
              Current: {form[k]}
            </span>
          </div>
        )}

        {isBool ? (
          <div className="d-flex gap-2">
            {["true","false"].map(val => (
              <div key={val} className="form-check form-check-inline">
                <input className="form-check-input" type="radio"
                  checked={String(form[k]) === val}
                  onChange={() => setForm((f: any) => ({ ...f, [k]: val === "true" }))}
                  id={`${k}_${val}`} />
                <label className="form-check-label fw-semibold"
                  style={{ fontSize: "0.82rem", color: val === "true" ? "#16a34a" : "#dc2626" }}
                  htmlFor={`${k}_${val}`}>
                  {val === "true" ? "✅ Yes" : "❌ No"}
                </label>
              </div>
            ))}
          </div>

        ) : isSelect ? (
          <select className="form-select form-select-sm border-2"
            style={{ borderColor: "#e2e8f0", background: "#f8fafc", fontSize: "0.85rem" }}
            value={String(form[k] || "")}
            onChange={e => setForm((f: any) => ({ ...f, [k]: e.target.value }))}>
            {SELECT_OPTS[k].map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>

        ) : isTextArea ? (
          <textarea className="form-control form-control-sm border-2"
            style={{ borderColor: "#e2e8f0", background: "#f8fafc", fontSize: "0.85rem", resize: "vertical" }}
            rows={3}
            value={String(form[k] ?? "")}
            onChange={e => setForm((f: any) => ({ ...f, [k]: e.target.value }))} />

        ) : isImage ? (
          <div className="d-flex flex-column gap-3">
            {/* Preview card */}
            <div className="rounded-4 overflow-hidden border-2 bg-light d-flex align-items-center justify-content-center"
              style={{ minHeight: 200, position: "relative", border: "2px dashed #cbd5e1", background: "#f8fafc" }}>
              {isUploading ? (
                <div className="d-flex flex-column align-items-center gap-3 py-5 text-primary">
                  <div className="spinner-border" style={{ width: 40, height: 40 }} />
                  <span className="fw-semibold" style={{ fontSize: "0.85rem" }}>Cloudinary pe upload ho raha hai…</span>
                </div>
              ) : imgSrc ? (
                <>
                  <img src={imgSrc} alt="preview"
                    className="w-100"
                    style={{ maxHeight: 240, objectFit: "cover", display: "block" }}
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  <span className="badge bg-dark position-absolute top-0 end-0 m-2 opacity-75"
                    style={{ fontSize: "0.65rem" }}>Current Image</span>
                </>
              ) : (
                <div className="d-flex flex-column align-items-center gap-2 py-5 text-muted">
                  <span style={{ fontSize: "3rem" }}>📷</span>
                  <span style={{ fontSize: "0.85rem" }}>Koi image nahi</span>
                </div>
              )}
            </div>

            {/* Upload zone */}
            <div className="rounded-3 p-3" style={{ background: "#eff6ff", border: "2px dashed #3b82f6" }}>
              <div className="fw-bold text-primary mb-2" style={{ fontSize: "0.8rem" }}>📤 Nayi Image Upload karo</div>
              <input type="file" accept="image/*" className="form-control form-control-sm bg-white"
                disabled={isUploading}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = ev => setForm((f: any) => ({ ...f, [k]: ev.target?.result as string }));
                    reader.readAsDataURL(file);
                    handleImageUpload(file, k);
                  }
                }} />
              <small className="text-muted mt-1 d-block" style={{ fontSize: "0.7rem" }}>JPG, PNG, WEBP — Max 10MB. Cloudinary pe upload hogi.</small>
            </div>

            {/* URL input */}
            <div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <hr className="flex-grow-1 my-0 border-secondary-subtle" />
                <small className="text-muted fw-semibold px-2" style={{ fontSize: "0.72rem", whiteSpace: "nowrap" }}>YA Direct URL daalo</small>
                <hr className="flex-grow-1 my-0 border-secondary-subtle" />
              </div>
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-2" style={{ borderColor: "#e2e8f0" }}>🔗</span>
                <input className="form-control border-2" type="text"
                  placeholder="https://res.cloudinary.com/..."
                  style={{ borderColor: "#e2e8f0", fontSize: "0.82rem" }}
                  value={imgSrc.startsWith("data:") ? "" : imgSrc}
                  disabled={isUploading}
                  onChange={e => setForm((f: any) => ({ ...f, [k]: e.target.value }))} />
                {imgSrc && !isUploading && (
                  <button className="btn btn-outline-danger border-2" type="button"
                    onClick={() => setForm((f: any) => ({ ...f, [k]: "" }))}>✕</button>
                )}
              </div>
            </div>

            {imgSrc && !imgSrc.startsWith("data:") && !isUploading && (
              <a href={imgSrc} target="_blank" rel="noopener noreferrer"
                className="btn btn-outline-info btn-sm align-self-start"
                style={{ fontSize: "0.75rem" }}>
                🖼️ Full size mein dekho
              </a>
            )}
          </div>

        ) : (
          <input className="form-control form-control-sm border-2"
            style={{ borderColor: "#e2e8f0", background: "#f8fafc", fontSize: "0.85rem" }}
            type={isNum ? "number" : "text"}
            value={String(form[k] ?? "")}
            onChange={e => setForm((f: any) => ({
              ...f, [k]: isNum ? Number(e.target.value) : e.target.value,
            }))} />
        )}
      </div>
    );
  };
  const renderFields = () => {
    const groups = FIELD_GROUPS[collection];
    const allEntries = Object.entries(form).filter(([k]) => !SKIP.includes(k) && !k.endsWith("_uploading"));

    if (groups) {
      // collect grouped keys
      const groupedKeys = new Set(groups.flatMap(g => g.fields));
      // ungrouped leftovers
      const leftover = allEntries.filter(([k]) => !groupedKeys.has(k)).map(([k]) => k);

      return (
        <>
          {groups.map(group => {
            const present = group.fields.filter(k => form[k] !== undefined || k === "image_url");
            if (!present.length) return null;
            return (
              <div key={group.title} className="mb-4">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <span style={{ fontSize: "1.1rem" }}>{group.icon}</span>
                  <span className="fw-bold text-dark" style={{ fontSize: "0.88rem" }}>{group.title}</span>
                  <hr className="flex-grow-1 my-0 border-secondary-subtle" />
                </div>
                <div className="row g-3">
                  {present.map(k => renderField(k))}
                </div>
              </div>
            );
          })}

          {leftover.length > 0 && (
            <div className="mb-2">
              <div className="d-flex align-items-center gap-2 mb-3">
                <span style={{ fontSize: "1.1rem" }}>🔧</span>
                <span className="fw-bold text-dark" style={{ fontSize: "0.88rem" }}>Other Fields</span>
                <hr className="flex-grow-1 my-0 border-secondary-subtle" />
              </div>
              <div className="row g-3">
                {leftover.map(k => renderField(k))}
              </div>
            </div>
          )}
        </>
      );
    }

    // flat layout for unknown collections
    return (
      <div className="row g-3">
        {allEntries.map(([k]) => renderField(k))}
      </div>
    );
  };
  const cfg       = CC[collection];
  const anyUpload = Object.keys(form).some(k => k.endsWith("_uploading") && form[k]);
  const colColor  = cfg?.color || "success";
  
  return (
   <div className="bg-light py-4 pt-2">
      {/* ══ FLASH ══ */}
      {msg && (
        <div className={`alert ${msg.ok ? "alert-success" : "alert-danger"} rounded-0 border-0 border-start border-4 ${msg.ok ? "border-success" : "border-danger"} py-2 px-4 mb-0 fw-semibold d-flex align-items-center justify-content-between`}
          style={{ fontSize: "0.88rem" }}>
          {msg.text}
          <button className="btn-close btn-sm" onClick={() => setMsg(null)} />
        </div>
      )}

      {/* ══ HERO STRIP ══ */}
      {!loading && original && cfg && (
        <div className={`bg-${colColor} bg-opacity-10 border-bottom border-${colColor} border-opacity-25 px-4 py-3`}>
          <div className="container-fluid">
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <div className={`rounded-circle bg-${colColor} d-flex align-items-center justify-content-center text-white shadow`}
                style={{ width: 48, height: 48, fontSize: "1.4rem", flexShrink: 0 }}>
                {cfg.icon}
              </div>
              <div>
                <div className="fw-bold fs-5 text-dark">
                  {form.product_name || form.name || form.buyer_name || form.farmer_name || form.agent_name || `${cfg.label} #${id?.slice(-6)}`}
                </div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <small className="text-muted fs-7">Collection: <strong>{collection}</strong></small>

                  {form.status && (
                    <span className={`badge fs-7 bg-${STATUS_COLORS[form.status] || "secondary"}`}>
                      {form.status}
                    </span>
                  )}
                  {form.role && (
                    <span className="badge bg-primary fs-7">{form.role}</span>
                  )}
                  {form.price && (
                    <span className="badge bg-success fs-7">₹{form.price}</span>
                  )}
                </div>
              </div>
              <div className="ms-auto d-none d-md-flex align-items-center gap-2 ">
                <span className="badge bg-warning text-dark px-3 py-2 fs-7 mx-2">
                  🛡️ Admin Edit Mode
                </span>
             <button className="btn btn-light btn-sm fw-semibold" onClick={() => router.back()}>
            ← Back
          </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ MAIN CONTENT ══ */}
      <div className="container-fluid px-4 py-4" style={{ maxWidth: 1100 }}>

        {/* Loading */}
        {loading && (
          <div className="d-flex flex-column align-items-center justify-content-center gap-3" style={{ minHeight: 400 }}>
            <div className={`spinner-border text-${colColor}`} style={{ width: 52, height: 52 }} />
            <div className="text-muted fw-semibold">Record load ho raha hai…</div>
          </div>
        )}

        {/* Invalid collection */}
        {!loading && !cfg && (
          <div className="alert alert-danger rounded-4 border-0 shadow-sm">
            ❌ Invalid collection: <strong>{collection}</strong>
          </div>
        )}

        {/* Not found */}
        {!loading && cfg && !original && (
          <div className="alert alert-warning rounded-4 border-0 shadow-sm">
            ⚠️ Record nahi mila. ID ya collection check karo.
          </div>
        )}

        {/* ══ FORM CARD ══ */}
        {!loading && cfg && original && (
          <>
            {/* Orders tip */}
            {collection === "orders" && (
              <div className="alert alert-info rounded-4 border-0 shadow-sm py-2 mb-3 d-flex align-items-center gap-2"
                style={{ fontSize: "0.82rem" }}>
                💡 <strong>Tip:</strong> <code>status</code> field badlo to order directly update ho jayega.
              </div>
            )}

            <div className="card border-0 shadow rounded-4 overflow-hidden">

              {/* Card header */}
              <div className="card-header bg-white border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <span className={`badge bg-${colColor} rounded-pill px-3 py-2`} style={{ fontSize: "0.78rem" }}>
                    {cfg.icon} {cfg.label}
                  </span>
                  <span className="text-muted" style={{ fontSize: "0.78rem" }}>
                    {Object.keys(form).filter(k => !SKIP.includes(k) && !k.endsWith("_uploading")).length} fields
                  </span>
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-outline-secondary btn-sm px-3" style={{ fontSize: "0.78rem" }}
                    onClick={() => { if (original) setForm({ ...original }); }}>
                    ↩️ Reset
                  </button>
                  <button className={`btn btn-${colColor} btn-sm fw-bold px-4`}
                    style={{ fontSize: "0.78rem" }}
                    onClick={handleSave}
                    disabled={saving || anyUpload}>
                    {saving
                      ? <><span className="spinner-border spinner-border-sm me-1" style={{ width: 12, height: 12 }} />Saving…</>
                      : "💾 Save"}
                  </button>
                </div>
              </div>

              {/* Card body */}
              <div className="card-body p-4 bg-white">
                {renderFields()}
              </div>

              {/* Card footer */}
              <div className="card-footer bg-light border-top py-3 px-4 d-flex align-items-center justify-content-between">
                <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                  ID: <code className="text-dark">{id}</code>
                </small>
                <div className="d-flex gap-2">
                  <button className="btn btn-outline-secondary px-4 fw-semibold" style={{ fontSize: "0.82rem" }}
                    onClick={() => router.back()}>
                    Cancel
                  </button>
                  <button className={`btn btn-${colColor} fw-bold px-5`}
                    style={{ fontSize: "0.85rem" }}
                    onClick={handleSave}
                    disabled={saving || anyUpload}>
                    {saving
                      ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
                      : "💾 Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


export default function AdminEditPage() {
  return (
    <Suspense
      fallback={
        <div  className="d-flex flex-column align-items-center justify-content-center gap-3 bg-light"
          style={{ minHeight: "100vh" }} >
          <div className="spinner-border text-success"  style={{ width: 52, height: 52 }}>
          <div className="text-muted fw-semibold">
            Loading editor…
          </div>
        </div>
        </div>
      }>
      <EditForm />
    </Suspense>
  );
}
