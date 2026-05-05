"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { productName } from "../../Constants/productName";
const API = `${process.env.NEXT_PUBLIC_API_URL}`;

export default function EditProduct({ params }: any) {
  const id = params.id;
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    price: "",
    stock: "",
    unit: "kg",
    category: "",
    description: "",
    image_url: "",
    is_available: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch(`${API}/products/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setForm({
          name: d.product_name || "",
          price: String(d.price || ""),
          stock: String(d.stock || ""),
          unit: d.unit || "kg",
          category: d.category || "",
          description: d.description || "",
          image_url: d.image_url || "",
          is_available: d.is_available ?? true,
        });
        setLoading(false);
      })
      .catch(() => {
        setError("Product load nahi hua");
        setLoading(false);
      });
  }, [id]);

  const filteredProducts = productName.filter( (p) => p.category === form.category,);
  const categories = [...new Set(productName.map((p) => p.category))];
  const uploadImage = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", "kisanmilan_preset");
    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dshk1fe2l/image/upload",
      { method: "POST", body: fd },
    );
    const data = await res.json();
    setForm((prev) => ({ ...prev, image_url: data.secure_url }));
    setUploading(false);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      setError("Name aur price required hai");
      return;
    }
    setSaving(true);
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}/products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        product_name: form.name,
        price: Number(form.price),
        stock: Number(form.stock),
        unit: form.unit,
        category: form.category,
        description: form.description,
        image_url: form.image_url,
        is_available: form.is_available,
      }),
    });
    if (res.ok) router.push(`/ProductDetails/${id}`);
    else setError("Update failed");
    setSaving(false);
  };

  if (loading)
    return (
      <>
      </>
    );

  return (

       <div className="bg-light py-4 pt-2">
      <div className="container-fluid">
      {/* HEADER */}
      <div className="bg-warning py-3 shadow-sm">
        <div className="container d-flex justify-content-between align-items-center">
          <div className="text-dark">
            <h5 className="fw-bold mb-0">✏️ Edit Product</h5>
            <small className="text-dark opacity-75"> Make changes and save </small>
          </div>
          <Link href="/Product" className="btn btn-dark btn-sm"> ← Back </Link>
        </div>
      </div>

      <div className="container py-4">
        {error && <div className="alert alert-danger">⚠️ {error}</div>}
        <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
          <div className="card-body p-4">
            <div className="row g-4">
              {/* IMAGE PANEL */}
              <div className="col-md-4">

                <div className="text-center">
                  <img  src={form.image_url || "https://placehold.co/400"}  className="img-fluid rounded-3 w-100 mb-3"  style={{ height: 240, objectFit: "cover" }}  alt="product"/>
                  <label className="btn btn-outline-success w-100"  htmlFor="editImg"> 📷 Change Photo</label>
                  <input type="file" id="editImg" className="d-none" onChange={(e) => {   if (e.target.files?.[0]) uploadImage(e.target.files[0]); }} />
                  {uploading && (
                    <>
                    </>
                  )}
                  {/* Availability toggle */}
                  <div className={`mt-3 p-3 rounded-3 border ${form.is_available ? "border-success bg-success bg-opacity-10" : "border-danger bg-danger bg-opacity-10"}`} >
                    <div className="form-check form-switch d-flex justify-content-between align-items-center mb-0">
                      <label  className={`form-check-label fw-semibold ${form.is_available ? "text-success" : "text-danger"}`}  htmlFor="isAvailable">
                        {form.is_available ? "✅ Available" : "❌ Unavailable"}
                      </label>
                      <input  type="checkbox" className="form-check-input"  id="isAvailable"  role="switch"  checked={form.is_available}  onChange={(e) =>    setForm({ ...form, is_available: e.target.checked })  }/>
                    </div>
                  </div>
                </div>
              </div>

              {/* FORM PANEL */}
              <div className="col-md-8">
                <form onSubmit={handleSubmit}>
                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold">  Category</label>
                      <select className="form-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value, name: "",}) }>
                        <option value="">Select Category</option>
                        {categories.map((c) => ( <option key={c} value={c}>  {c}</option>))}
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">  Product Name</label>
                      <select className="form-select"  value={form.name}  onChange={(e) => setForm({ ...form, name: e.target.value })  }>
                        <option value="">Select Product</option>
                        {filteredProducts.map((p) => ( <option key={p.name} value={p.name}>   {p.name} </option> ))}
                      </select>
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-4">
                      <label className="form-label small fw-semibold">  Price (₹)</label>
                      <div className="input-group">
                        <span className="input-group-text">₹</span>
                        <input  type="number"  className="form-control"  placeholder="0"  min="0"  value={form.price}  onChange={(e) =>    setForm({ ...form, price: e.target.value })  }/>
                      </div>
                    </div>
                    <div className="col-4">
                      <label className="form-label small fw-semibold">  Stock</label>
                      <input  type="number"  className="form-control"  placeholder="0"  min="0"  value={form.stock}  onChange={(e) =>    setForm({ ...form, stock: e.target.value })  }/>
                    </div>
                    <div className="col-4"><label className="form-label small fw-semibold">  Unit</label>
                     <select  className="form-select"  value={form.unit}  onChange={(e) =>    setForm({ ...form, unit: e.target.value })  }>
                        <option>kg</option>
                        <option>litre</option>
                        <option>piece</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label small fw-semibold"> Description</label>
                    <textarea  className="form-control"  rows={4}  placeholder="Description..."  value={form.description}  onChange={(e) =>    setForm({ ...form, description: e.target.value })  }/>
                  </div>

                  <div className="d-flex gap-2">
                    <Link href={`/ProductDetails/${id}`} className="btn btn-outline-secondary"> Cancel</Link>
                    <button className="btn btn-warning flex-fill fw-bold" disabled={saving}> 
                     {saving ? ( <> <span className="spinner-border spinner-border-sm me-2" /> Saving...</>  ) : ("💾 Update Product"  )}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
