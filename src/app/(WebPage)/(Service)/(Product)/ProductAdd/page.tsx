"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = ["Vegetables", "Fruits", "Grains", "Dairy", "Other"];
const UNITS = ["kg", "g", "litre", "piece", "dozen"];
const CLOUD_NAME = "dshk1fe2l";
const UPLOAD_PRESET = "kisanmilan_preset";

export default function AddProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", price: "", category: "Vegetables",
    description: "", stock: "", unit: "kg", location: "",
  });
  const [preview, setPreview] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.push("/Login"); return; }
    const u = JSON.parse(stored);
    if (u.role !== "farmer") {
      alert("Sirf Farmer product add kar sakta hai!");
      router.push("/Product");
      return;
    }
    setUser(u);
  }, []);

  const handleImage = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setImageLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);
      formData.append("folder", "kisanmilan/products");

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json();

      if (data.secure_url) {
        setImageUrl(data.secure_url);
      } else {
        setError(`Image upload failed: ${data.error?.message || "Unknown error"}`);
      }
    } catch (err: any) {
      setError("Image upload error: " + err.message);
    } finally {
      setImageLoading(false);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!imageUrl) { setError("Pehle image upload karo!"); return; }
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          image_url: imageUrl,
          farmer_name: user.name,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const productId = data?.data?._id;
      router.push(`/Product`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 bg-light py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-7">

            {/* Header */}
            <div className="card border-0 shadow-sm rounded-4 mb-4"
              style={{ background: "linear-gradient(135deg, #198754, #20c997)" }}>
              <div className="card-body p-4 text-white">
                <h4 className="fw-bold mb-1">🌾 Add New Product</h4>
                <p className="mb-0 opacity-75 small">
                  Apna product add karo — buyers seedha khareedenge
                </p>
              </div>
            </div>

            {/* Form Card */}
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body p-4">

                {error && (
                  <div className="alert alert-danger py-2 small rounded-3">
                    ❌ {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>

                  {/* Product Name */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Product Name <span className="text-danger">*</span>
                    </label>
                    <input
                      className="form-control"
                      placeholder="e.g. Tomato, Wheat, Milk"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>

                  {/* Price + Unit */}
                  <div className="row g-3 mb-3">
                    <div className="col-7">
                      <label className="form-label fw-semibold">
                        Price (₹) <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">₹</span>
                        <input
                          className="form-control"
                          type="number"
                          placeholder="45"
                          min="0"
                          value={form.price}
                          onChange={e => setForm({ ...form, price: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-5">
                      <label className="form-label fw-semibold">Unit</label>
                      <select
                        className="form-select"
                        value={form.unit}
                        onChange={e => setForm({ ...form, unit: e.target.value })}>
                        {UNITS.map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Category */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Category</label>
                    <div className="d-flex gap-2 flex-wrap">
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setForm({ ...form, category: cat })}
                          className={`btn btn-sm rounded-pill ${
                            form.category === cat
                              ? "btn-success"
                              : "btn-outline-secondary"
                          }`}>
                          {cat === "Vegetables" && "🥦 "}
                          {cat === "Fruits"     && "🍎 "}
                          {cat === "Grains"     && "🌽 "}
                          {cat === "Dairy"      && "🥛 "}
                          {cat === "Other"      && "📦 "}
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Stock + Location */}
                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold">
                        Stock <span className="text-danger">*</span>
                      </label>
                      <input
                        className="form-control"
                        type="number"
                        placeholder="100"
                        min="0"
                        value={form.stock}
                        onChange={e => setForm({ ...form, stock: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold">Location</label>
                      <input
                        className="form-control"
                        placeholder="Noida, UP"
                        value={form.location}
                        onChange={e => setForm({ ...form, location: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Description</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Product ke baare mein likhो..."
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                    />
                  </div>

                  {/* Image Upload */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold">
                      Product Image <span className="text-danger">*</span>
                    </label>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImage}
                      className="d-none"
                      id="imgUpload"
                    />

                    <label
                      htmlFor="imgUpload"
                      className={`d-block border-2 rounded-4 p-4 text-center cursor-pointer
                        ${imageUrl
                          ? "border-success bg-success bg-opacity-10"
                          : "border-dashed"}`}
                      style={{
                        border: "2px dashed",
                        borderColor: imageUrl ? "#198754" : "#dee2e6",
                        cursor: "pointer",
                      }}>

                      {/* Preview */}
                      {preview ? (
                        <div>
                          <img
                            src={preview}
                            alt="preview"
                            className="rounded-3 mb-2"
                            style={{
                              width: "100%", maxHeight: 200,
                              objectFit: "cover",
                            }}
                          />
                          {imageLoading ? (
                            <div className="d-flex align-items-center justify-content-center gap-2">
                              <span className="spinner-border spinner-border-sm text-warning" />
                              <small className="text-warning fw-semibold">
                                Uploading...
                              </small>
                            </div>
                          ) : imageUrl ? (
                            <small className="text-success fw-semibold">
                              ✅ Image uploaded! Click to change
                            </small>
                          ) : (
                            <small className="text-danger">
                              ❌ Upload failed — dobara try karo
                            </small>
                          )}
                        </div>
                      ) : (
                        <div className="py-3">
                          <div style={{ fontSize: 40 }}>📷</div>
                          <p className="text-success fw-semibold mb-1 mt-2">
                            Click to upload image
                          </p>
                          <small className="text-muted">
                            JPG, PNG, WEBP — Max 10MB
                          </small>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* Buttons */}
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary flex-fill"
                      onClick={() => router.back()}
                      disabled={loading}>
                      ← Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading || imageLoading}
                      className="btn btn-success flex-fill fw-semibold">
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Saving...
                        </>
                      ) : "Save Product ✅"}
                    </button>
                  </div>

                </form>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}