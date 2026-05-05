"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { myLocation } from "../Constants/myLocation";
import { productName } from "../Constants/productName";
const UNITS = ["kg", "g", "litre", "piece", "dozen"];
const CLOUD_NAME = "dshk1fe2l";
const UPLOAD_PRESET = "kisanmilan_preset";
export default function AddProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "Vegetables",
    description: "",
    stock: "",
    unit: "kg",
    change: "0%",
  });
  const [selState, setSelState] = useState("");
  const [selDistrict, setSelDistrict] = useState("");
  const [selCity, setSelCity] = useState("");
  const [location, setLocation] = useState("");
  const [preview, setPreview] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [user, setUser] = useState<any>(null);
  const [step, setStep] = useState(1);
  const isFarmer = user?.role === "farmer";
  const isAgent = user?.role === "agent";
  const categories = [...new Set(productName.map((p) => p.category))];
  const filteredProducts = productName.filter(
    (p) => p.category === form.category,
  );

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      router.push("/Login");
      return;
    }
    const u = JSON.parse(stored);
    if (u.role !== "farmer" && u.role !== "agent") {
      alert("Sirf Farmer product add kar sakta hai!");
      router.push("/Product");
      return;
    }
    setUser(u);
    if (u.location) {
      setLocation(u.location);
      const parts = u.location.split(",");
      if (parts.length === 3) {
        setSelCity(parts[0].trim());
        setSelDistrict(parts[1].trim());
        setSelState(parts[2].trim());
      }
    }
  }, []);

  useEffect(() => {
    const parts = [selCity, selDistrict, selState].filter(Boolean);
    if (parts.length) setLocation(parts.join(", "));
  }, [selCity, selDistrict, selState]);

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setImageLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", UPLOAD_PRESET);
      fd.append("folder", "kisanmilan/products");
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: fd },
      );
      const data = await res.json();
      if (data.secure_url) setImageUrl(data.secure_url);
      else setError(`Image upload failed: ${data.error?.message || "Unknown"}`);
    } catch (err: any) {
      setError("Image upload error: " + err.message);
    } finally {
      setImageLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      setError("Name aur Price required hain!");
      return;
    }
    if (isFarmer && !form.stock) {
      setError("Stock required hai!");
      return;
    }
    if (!imageUrl) {
      setError("Pehle image upload karo!");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const endpoint = isAgent
        ? `${process.env.NEXT_PUBLIC_API_URL}/agent-rates`
        : `${process.env.NEXT_PUBLIC_API_URL}/products`;
      const payload = isAgent
        ? {
            product_name: form.name,
            price: Number(form.price),
            unit: form.unit,
            category: form.category,
            description: form.description,
            change: form.change,
            image_url: imageUrl,
            agent_id: user._id || user.id,
            agent_name: user.name,
            is_available: true,
            stock: Number(form.stock) || 0,
            location,
          }
        : {
            name: form.name,
            product_name: form.name,
            price: Number(form.price),
            unit: form.unit,
            category: form.category,
            description: form.description,
            stock: Number(form.stock),
            location,
            image_url: imageUrl,
            farmer_id: user._id || user.id,
            farmer_name: user.name,
            is_available: true,
            change: form.change,
          };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setSuccess(
        isAgent
          ? "Rate successfully add hua!"
          : "Product successfully add hua!",
      );
      setTimeout(() => router.push("/Product"), 500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-light py-4 pt-2">
      <div className="container-fluid">
        {/* HEADER */}

        {/* ── HEADER ── */}
           <div className="bg-success rounded-3 border-bottom shadow-sm text-light">
        <div className="container text-light py-3 d-flex justify-content-between align-items-center">
          <div className="d-flex flex-column">
            <h4 className="fw-bold text-dark mb-1">
              {isAgent ? "Add Mandi Rate" : "Add New Product"}
            </h4>
            <small className="opacity-75">
              {user && (
                <span className="badge bg-white text-success">
                  {" "}
                  {isFarmer ? "🌾 Farmer" : "📊 Agent"}
                </span>
              )}
            </small>
          </div>
          <p className="text-white-50 small mb-0 d-flex justify-center">
            {isAgent
              ? "Apna mandi rate set karo"
              : "Apna product list karo — buyers seedha khareedenge"}
          </p>
          <p className="text-white-50 small mb-0 d-flex justify-center">
            <Link
              href="/Product"
              className="btn btn-light px-3 py-1 btn-sm fw-semibold"
            >
              {" "}
              ← Back{" "}
            </Link>
          </p>
        </div>
        </div>


        <div className="container py-4">
          <div className="row justify-content-center">
            <div className="col-md-8 col-lg-7">
              {/* STEPPER */}
              <div className="d-flex align-items-center mb-3">
                <div
                  className={`rounded-circle d-flex align-items-center justify-content-center fw-bold`}
                  style={{
                    width: 36,
                    height: 36,
                    fontSize: 14,
                    background: step >= 1 ? "#198754" : "#dee2e6",
                    color: step >= 1 ? "#fff" : "#6c757d",
                  }}
                >
                  1
                </div>
                <span className="ms-2 me-3 small fw-semibold text-success">
                  Product Details
                </span>
                <div
                  className="flex-fill border-top border-2"
                  style={{ borderColor: step >= 2 ? "#198754" : "#dee2e6" }}
                />
                <div
                  className={`rounded-circle d-flex align-items-center justify-content-center fw-bold ms-3`}
                  style={{
                    width: 36,
                    height: 36,
                    fontSize: 14,
                    background: step >= 2 ? "#198754" : "#dee2e6",
                    color: step >= 2 ? "#fff" : "#6c757d",
                  }}
                >
                  2
                </div>
                <span
                  className={`ms-2 small fw-semibold ${step >= 2 ? "text-success" : "text-muted"}`}
                >
                  Photo & Submit
                </span>
              </div>

              {success && (
                <div className="alert alert-success">✅ {success}</div>
              )}
              {error && (
                <div className="alert alert-danger small">⚠️ {error}</div>
              )}

              <form onSubmit={handleSubmit}>
                <div
                  className="card border-0 shadow-sm"
                  style={{ borderRadius: 16 }}
                >
                  {/* STEP 1 */}
                  {step === 1 && (
                    <>
                      <div
                        className="card-header bg-white border-bottom px-4 py-3"
                        style={{ borderRadius: "16px 16px 0 0" }}
                      >
                        <h6 className="mb-0 fw-semibold">
                          Product Details :.{" "}
                          <span className="text-muted">
                            Basic information bharo
                          </span>
                        </h6>
                      </div>
                      <div className="card-body p-4 pt-2">
                        <div className="row g-3 mb-3">
                          <div className="col-6">
                            <label className="form-label small fw-semibold">
                              Category
                            </label>
                            <select
                              className="form-select"
                              value={form.category}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  category: e.target.value,
                                  name: "",
                                })
                              }
                            >
                              {" "}
                              {categories.map((cat) => (
                                <option key={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>
                          <div className="col-6">
                            <label className="form-label small fw-semibold">
                              Product <span className="text-danger">*</span>
                            </label>
                            <select
                              className="form-select"
                              value={form.name}
                              required
                              onChange={(e) =>
                                setForm({ ...form, name: e.target.value })
                              }
                            >
                              <option value="">Select Product</option>
                              {filteredProducts.map((p) => (
                                <option key={p.name} value={p.name}>
                                  {p.icon} {p.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="row g-3">
                          <div className="col-6">
                            {isFarmer && (
                              <div className="mb-3">
                                <label className="form-label small fw-semibold">
                                  Stock <span className="text-danger">*</span>
                                </label>
                                <input
                                  type="number"
                                  className="form-control"
                                  placeholder="100"
                                  min="0"
                                  value={form.stock}
                                  required
                                  onChange={(e) =>
                                    setForm({ ...form, stock: e.target.value })
                                  }
                                />
                              </div>
                            )}
                          </div>
                          <div className="col-6">
                            <div className="mb-4">
                              <label className="form-label small fw-semibold">
                                Description
                              </label>
                              <textarea
                                className="form-control"
                                rows={1}
                                placeholder="Product ke baare mein kuch likho..."
                                value={form.description}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    description: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
                        <div className="row g-3 mb-3">
                          <div className="col-4">
                            <label className="form-label small fw-semibold">
                              Price (₹) <span className="text-danger">*</span>
                            </label>
                            <div className="input-group">
                              <span className="input-group-text">₹</span>
                              <input
                                type="number"
                                className="form-control"
                                placeholder="45"
                                min="0"
                                value={form.price}
                                required
                                onChange={(e) =>
                                  setForm({ ...form, price: e.target.value })
                                }
                              />
                            </div>
                          </div>
                          <div className="col-4">
                            <label className="form-label small fw-semibold">
                              Unit
                            </label>
                            <select
                              className="form-select"
                              value={form.unit}
                              onChange={(e) =>
                                setForm({ ...form, unit: e.target.value })
                              }
                            >
                              {UNITS.map((u) => (
                                <option key={u}>{u}</option>
                              ))}
                            </select>
                          </div>
                          <div className="col-4">
                            <label className="form-label small fw-semibold">
                              Change
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="0%"
                              value={form.change}
                              onChange={(e) =>
                                setForm({ ...form, change: e.target.value })
                              }
                            />
                          </div>
                        </div>

                        <div className="bg-light border rounded-3 p-3 mb-3">
                          <div className="small fw-semibold text-muted mb-2">
                            📍 Location (from profile)
                          </div>
                          <div className="row g-2">
                            {[
                              ["State", selState],
                              ["District", selDistrict],
                              ["City", selCity],
                            ].map(([label, val]) => (
                              <div key={label} className="col-4">
                                <div className="small text-muted">{label}</div>
                                <div className="small fw-semibold">
                                  {val || "—"}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="d-flex justify-content-end">
                          <button
                            type="button"
                            className="btn btn-success px-4"
                            onClick={() => {
                              if (!form.name) {
                                setError("Name required hai!");
                                return;
                              }
                              if (!form.price) {
                                setError("Price required hai!");
                                return;
                              }
                              if (!form.category) {
                                setError("Category required hai!");
                                return;
                              }
                              if (!form.unit) {
                                setError("Unit required hai!");
                                return;
                              }
                              if (!form.stock) {
                                setError("Stock required hai!");
                                return;
                              }
                              if (isFarmer && !form.stock) {
                                setError("Stock bharo!");
                                return;
                              }
                              setError("");
                              setStep(2);
                            }}
                          >
                            Next: Upload Photo →
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* STEP 2 */}
                  {step === 2 && (
                    <>
                      <div
                        className="card-header bg-white border-bottom px-4 py-3"
                        style={{ borderRadius: "16px 16px 0 0" }}
                      >
                        <h6 className="mb-0 fw-semibold">Product Photo</h6>
                        <small className="text-muted">
                          Ek acchi photo buyers ko attract karti hai
                        </small>
                      </div>
                      <div className="card-body p-4">
                        <div className="mb-4">
                          <input
                            type="file"
                            accept="image/*"
                            id="imgUpload"
                            className="d-none"
                            onChange={handleImage}
                          />
                          <label
                            htmlFor="imgUpload"
                            className="d-block border border-2 border-success border-dashed rounded-3 p-4 text-center"
                            style={{ cursor: "pointer", minHeight: 180 }}
                          >
                            {preview ? (
                              <>
                                <img
                                  src={preview}
                                  className="img-fluid rounded-3 mb-2"
                                  style={{ maxHeight: 220, objectFit: "cover" }}
                                />
                                {imageLoading ? (
                                  <>
                                  </>
                                ) : imageUrl ? (
                                  <div className="text-success small fw-semibold">
                                    ✅ Uploaded! Click to change
                                  </div>
                                ) : (
                                  <div className="text-danger small fw-semibold">
                                    ❌ Upload failed — dobara try karo
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                <div
                                  className="text-success mb-2"
                                  style={{ fontSize: 40 }}
                                >
                                  📷
                                </div>
                                <p className="fw-semibold text-success mb-1">
                                  Click to upload image
                                </p>
                                <small className="text-muted">
                                  JPG, PNG, WEBP · Max 10MB
                                </small>
                              </>
                            )}
                          </label>
                        </div>

                        {/* REVIEW SUMMARY */}
                        <div className="bg-light border rounded-3 p-3 mb-4">
                          <div className="fw-semibold text-success small mb-2">
                            📋 Review Summary
                          </div>
                          <div className="row g-2 small">
                            <div className="col-6">
                              <span className="text-muted">Name: </span>
                              <span className="fw-semibold">
                                {form.name || "—"}
                              </span>
                            </div>
                            <div className="col-6">
                              <span className="text-muted">Price: </span>
                              <span className="fw-semibold text-success">
                                ₹{form.price || "—"}/{form.unit}
                              </span>
                            </div>
                            <div className="col-6">
                              <span className="text-muted">Category: </span>
                              <span className="fw-semibold">
                                {form.category}
                              </span>
                            </div>
                            {isFarmer && (
                              <div className="col-6">
                                <span className="text-muted">Stock: </span>
                                <span className="fw-semibold">
                                  {form.stock} {form.unit}
                                </span>
                              </div>
                            )}
                            {location && (
                              <div className="col-12">
                                <span className="text-muted">Location: </span>
                                <span className="fw-semibold">
                                  📍 {location}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setStep(1)}
                          >
                            ← Edit Details
                          </button>
                          <button
                            type="submit"
                            className="btn btn-success flex-fill fw-bold"
                            disabled={loading || imageLoading || !imageUrl}
                          >
                            {loading ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" />
                                Saving...
                              </>
                            ) : imageLoading ? (
                              <>
                              </>
                            ) : !imageUrl ? (
                              "Pehle Image Upload Karo"
                            ) : isAgent ? (
                              "📊 Add Rate"
                            ) : (
                              "🌾 Add Product"
                            )}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
