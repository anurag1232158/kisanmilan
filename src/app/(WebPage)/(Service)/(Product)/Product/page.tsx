"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const CATEGORIES = ["All", "Vegetables", "Fruits", "Grains", "Dairy", "Other"];
const UNITS = ["kg", "g", "litre", "piece", "dozen"];
const CATEGORY_ICONS: Record<string, string> = {
  All: "🌾", Vegetables: "🥦", Fruits: "🍎",
  Grains: "🌽", Dairy: "🥛", Other: "📦",
};

export default function ProductsPage() {
  const router = useRouter();

  const [products, setProducts]             = useState<any[]>([]);
  const [agentRates, setAgentRates]         = useState<any[]>([]);
  const [locations, setLocations]           = useState<string[]>([]);
  const [search, setSearch]                 = useState("");
  const [searchInput, setSearchInput]       = useState("");
  const [category, setCategory]             = useState("All");
  const [locationFilter, setLocationFilter] = useState("");
  const [loading, setLoading]               = useState(true);
  const [user, setUser]                     = useState<any>(null);
  const [msg, setMsg]                       = useState("");
  const [msgType, setMsgType]               = useState<"success"|"danger">("success");

  const [editId, setEditId]         = useState<string|null>(null);
  const [editForm, setEditForm]     = useState({
    name: "", price: "", stock: "", unit: "kg",
    category: "Vegetables", location: "",
    description: "", change: "", is_available: true,
  });
const [editSaving, setEditSaving] = useState(false);
const [showAll, setShowAll]       = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)             params.append("search", search);
      if (category !== "All") params.append("category", category);

      const [prodRes, agentRes] = await Promise.all([
        fetch(`http://localhost:5000/products?${params.toString()}`),
        fetch("http://localhost:5000/agent-rates"),
      ]);

      const prodData  = await prodRes.json();
      const agentData = await agentRes.json();

      const prods  = Array.isArray(prodData)  ? prodData  : [];
      const agents = Array.isArray(agentData) ? agentData : [];

      setProducts(prods);
      setAgentRates(agents);

      const allLocations = [
        ...prods.map((p: any)  => p.location),
        ...agents.map((r: any) => r.location),
      ].filter(Boolean);

      setLocations(["All", ...Array.from(new Set<string>(allLocations))]);
    } catch (err) {
      console.error(err);
      setProducts([]);
      setAgentRates([]);
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const showAlert = (text: string, type: "success"|"danger" = "success") => {
    setMsg(text); setMsgType(type);
    setTimeout(() => setMsg(""), 3000);
  };

  const startEdit = (p: any) => {
    setEditId(p._id);
    setEditForm({
      name:         p.name         || "",
      price:        String(p.price || ""),
      stock:        String(p.stock || ""),
      unit:         p.unit         || "kg",
      category:     p.category     || "Vegetables",
      location:     p.location     || "",
      description:  p.description  || "",
      change:       p.change       || "0%",
      is_available: p.is_available ?? true,
    });
  };

  const handleUpdate = async (id: string) => {
    if (!editForm.name || !editForm.price || !editForm.stock) {
      showAlert("Name, Price aur Stock bharo!", "danger"); return;
    }
    setEditSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name:         editForm.name,
          price:        Number(editForm.price),
          stock:        Number(editForm.stock),
          unit:         editForm.unit,
          category:     editForm.category,
          location:     editForm.location,
          description:  editForm.description,
          change:       editForm.change || "0%",
          is_available: editForm.is_available,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showAlert("Product updated ✅");
      setEditId(null);
      fetchProducts();
    } catch (err: any) {
      showAlert(err.message, "danger");
    } finally { setEditSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Product delete karna chahte ho?")) return;
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:5000/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      showAlert("Product deleted ✅");
      fetchProducts();
    } catch (err: any) {
      showAlert(err.message, "danger");
    }
  };

  const handleAgentRateDelete = async (id: string) => {
    if (!confirm("Delete karna chahte ho?")) return;
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:5000/agent-rates/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    showAlert("Rate deleted ✅");
    fetchProducts();
  };

  // ===== FILTER LOGIC =====
  const visibleProducts = products
    .filter((p: any) => user?.role !== "agent")
    .filter((p: any) =>
      !locationFilter || p.location?.toLowerCase() === locationFilter.toLowerCase()
    );

  const filteredAgentRates = agentRates.filter(r => {
    const matchSearch   = !search || r.product_name?.toLowerCase().includes(search.toLowerCase());
    const matchLocation = !locationFilter || r.location?.toLowerCase() === locationFilter.toLowerCase();
    return matchSearch && matchLocation;
  });

  // Role checks
  const isBuyer   = user?.role === "buyer";
  const isFarmer  = user?.role === "farmer";
  const isAgent   = user?.role === "agent";
  const isGuest   = !user;

  // Farmer ka apna product check
const isOwnProduct = (p: any) => {
  const userId = user?.id?.toString() || user?._id?.toString() || "";
  const farmerId = p.farmer_id?.toString() || "";
  return userId !== "" && farmerId !== "" && userId === farmerId;
};

  const totalCount = isAgent
    ? filteredAgentRates.length
    : visibleProducts.length;

  // Product card — reusable image section
  const ProductImage = ({ p }: { p: any }) => (
    <div style={{ position: "relative", height: 180, overflow: "hidden" }}>
      <img
        src={p.image_url || "https://placehold.co/400x180/e8f5e9/198754?text=🌾"}
        alt={p.name}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
        onError={e => {
          (e.target as HTMLImageElement).src =
            "https://placehold.co/400x180/e8f5e9/198754?text=🌾";
        }}
      />
      <span className="badge bg-success position-absolute" style={{ top: 8, left: 8 }}>
        {CATEGORY_ICONS[p.category]} {p.category}
      </span>
      {p.change && p.change !== "0%" && (
        <span className={`badge position-absolute ${
          p.change?.startsWith("-") ? "bg-danger" : "bg-warning text-dark"
        }`} style={{ top: 8, right: 8 }}>
          {p.change?.startsWith("-") ? "📉" : "📈"} {p.change}
        </span>
      )}
      {p.stock === 0 && (
        <div className="position-absolute top-0 start-0 w-100 h-100
          d-flex align-items-center justify-content-center"
          style={{ background: "rgba(0,0,0,0.5)" }}>
          <span className="badge bg-danger fs-6">Out of Stock</span>
        </div>
      )}
      {!p.is_available && p.stock > 0 && (
        <div className="position-absolute top-0 start-0 w-100 h-100
          d-flex align-items-center justify-content-center"
          style={{ background: "rgba(0,0,0,0.4)" }}>
          <span className="badge bg-secondary fs-6">Unavailable</span>
        </div>
      )}
    </div>
  );

  const ProductInfo = ({ p, showFarmer = true }: { p: any; showFarmer?: boolean }) => (
    <div className="card-body p-3">
      <h6 className="fw-bold text-dark mb-1 text-truncate">{p.name}</h6>
      <p className="text-success fw-bold mb-1">
        ₹{p.price}<small className="text-muted fw-normal">/{p.unit}</small>
      </p>
      <p className="text-muted small mb-1 text-truncate">📍 {p.location}</p>
      <div className="d-flex justify-content-between">
        <small className={
          p.stock === 0 ? "text-danger fw-semibold" :
          p.stock < 10  ? "text-warning fw-semibold" : "text-muted"
        }>📦 {p.stock} {p.unit}</small>
        {showFarmer && p.farmer_name && !agentRates.find(
          r => r.agent_id?.toString() === p.farmer_id?.toString()
        ) && (
          <small className="text-muted">👨‍🌾 {p.farmer_name?.split(" ")[0]}</small>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-vh-100 bg-light py-4">
      <div className="container">

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h4 className="fw-bold text-success mb-0">🛒 Products</h4>
            <small className="text-muted">{totalCount} products mile</small>
          </div>
          {(isFarmer || isAgent) && (
            <Link href="/ProductAdd" className="btn btn-success fw-semibold">
              ➕ Add Product
            </Link>
          )}
        </div>

        {/* Alert */}
        {msg && <div className={`alert alert-${msgType} rounded-3 mb-3`}>{msg}</div>}

        {/* Search + Location */}
        <div className="row g-2 mb-3">
          <div className="col-8">
            <div className="input-group shadow-sm">
              <span className="input-group-text bg-white border-end-0">🔍</span>
              <input className="form-control border-start-0 py-2"
                placeholder="Product dhundho..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)} />
              {searchInput && (
                <button className="btn btn-outline-secondary"
                  onClick={() => { setSearchInput(""); setSearch(""); }}>✕</button>
              )}
            </div>
          </div>
          <div className="col-4">
            <div className="dropdown w-100">
      <button className="btn btn-sm btn-outline-secondary dropdown-toggle w-100  py-2"
   type="button" data-bs-toggle="dropdown" aria-expanded="false">
   Filter Location 
 </button>

              <ul className="dropdown-menu w-100" style={{ maxHeight: 220, overflowY: "auto" }}>
                {locations.map(loc => (
                  <li key={loc}>
                    <a className="dropdown-item" style={{ cursor: "pointer" }}
                      onClick={() => setLocationFilter(loc === "All" ? "" : loc)}>
                      📍 {loc}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            {locationFilter && (
              <button className="btn btn-sm btn-outline-secondary mt-1 w-100"
                onClick={() => setLocationFilter("")}>✕ Clear</button>
            )}
          </div>
        </div>

        {/* Category Filter */}
        {!isAgent && (
          <div className="d-flex gap-2 mb-4 flex-wrap">
            {CATEGORIES.map(cat => {
              const count = cat === "All"
                ? visibleProducts.length
                : visibleProducts.filter(p => p.category === cat).length;
              return (
                <button key={cat} onClick={() => setCategory(cat)}
                  className={`btn btn-sm rounded-pill ${
                    category === cat ? "btn-success" : "btn-outline-secondary"
                  }`}>
                  {CATEGORY_ICONS[cat]} {cat}
                  {count > 0 && (
                    <span className={`ms-1 badge rounded-pill ${
                      category === cat ? "bg-white text-success" : "bg-success text-white"
                    }`} style={{ fontSize: 10 }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="row g-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="col-6 col-md-4 col-lg-3">
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                  <div className="bg-secondary bg-opacity-10" style={{ height: 180 }} />
                  <div className="card-body p-3">
                    {[60, 80, 40].map((w, j) => (
                      <div key={j} className="bg-secondary bg-opacity-10 rounded mb-2"
                        style={{ height: 16, width: `${w}%` }} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

           ) : totalCount === 0 ? (
          <div className="text-center py-5">
            <div style={{ fontSize: 64 }}>🌾</div>
            <h5 className="text-muted mt-3">
              {search         ? `"${search}" nahi mila` :
               locationFilter ? `"${locationFilter}" mein koi product nahi` :
               "Koi product nahi hai"}
            </h5>
            {(search || locationFilter) && (
              <button className="btn btn-outline-success mt-2"
                onClick={() => { setSearch(""); setSearchInput(""); setLocationFilter(""); }}>
                🔄 Reset Filters
              </button>
            )}
            {(isFarmer || isAgent) && (
              <div className="mt-3">
                <Link href="/ProductAdd" className="btn btn-success">
                  ➕ Pehla Product Add Karo
                </Link>
              </div>
            )}
          </div>

           ) : (
          <div className="row g-3">
            {/* ===== BUYER + GUEST ===== */}
            {/* {(isBuyer || isGuest) && visibleProducts.map((p: any) => ( */}
             {(isBuyer || isGuest) && (showAll ? visibleProducts : visibleProducts.slice(0, 8)).map((p: any) => (
              <div key={p._id} className="col-6 col-md-4 col-lg-3">
                <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden"
                  style={{ transition: "transform 0.2s, box-shadow 0.2s" }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "";
                  }}>
                  <Link href={`/ProductView/${p._id}`} className="text-decoration-none">
                    <ProductImage p={p} />
                  </Link>
                  <Link href={`/ProductView/${p._id}`} className="text-decoration-none">
                    <ProductInfo p={p} />
                  </Link>
                  <div className="card-footer border-0 bg-white p-3 pt-0">
                    <button className="btn btn-success btn-sm w-100 fw-semibold"
                      onClick={() => {
                        if (!user) { router.push("/Login"); return; }
                        router.push(`/ProductView/${p._id}`);
                      }}
                      disabled={p.stock === 0 || !p.is_available}>
                      {p.stock === 0 ? "Out of Stock" :
                       !p.is_available ? "Unavailable" : "🛒 Order Now"}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* ===== FARMER ===== */}
            {isFarmer && (showAll ? visibleProducts : visibleProducts.slice(0, 8)).map((p: any) => (
              <div key={p._id}
                className={editId === p._id ? "col-12 col-md-6" : "col-6 col-md-4 col-lg-3"}>

                {/* Edit Mode */}
                {editId === p._id ? (
                  <div className="card border-success border-2 shadow rounded-4">
                    <div className="card-body p-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex align-items-center gap-2">
                          <img src={p.image_url || "https://placehold.co/48x48/e8f5e9/198754?text=🌾"}
                            alt={p.name} className="rounded-2"
                            style={{ width: 48, height: 48, objectFit: "cover" }} />
                          <div>
                            <h6 className="fw-bold text-success mb-0">✏️ Edit Product</h6>
                            <small className="text-muted">Sab fields update karo</small>
                          </div>
                        </div>
                        <button className="btn btn-outline-secondary btn-sm"
                          onClick={() => setEditId(null)}>✕</button>
                      </div>
                      <div className="row g-2">
                        <div className="col-12">
                          <label className="form-label small fw-semibold mb-1">Product Name</label>
                          <input className="form-control form-control-sm" value={editForm.name}
                            onChange={e => setEditForm({...editForm, name: e.target.value})} />
                        </div>
                        <div className="col-7">
                          <label className="form-label small fw-semibold mb-1">Price (₹)</label>
                          <div className="input-group input-group-sm">
                            <span className="input-group-text">₹</span>
                            <input className="form-control" type="number" value={editForm.price}
                              onChange={e => setEditForm({...editForm, price: e.target.value})} />
                          </div>
                        </div>
                        <div className="col-5">
                          <label className="form-label small fw-semibold mb-1">Unit</label>
                          <select className="form-select form-select-sm" value={editForm.unit}
                            onChange={e => setEditForm({...editForm, unit: e.target.value})}>
                            {UNITS.map(u => <option key={u}>{u}</option>)}
                          </select>
                        </div>
                        <div className="col-6">
                          <label className="form-label small fw-semibold mb-1">Stock</label>
                          <input className="form-control form-control-sm" type="number"
                            value={editForm.stock}
                            onChange={e => setEditForm({...editForm, stock: e.target.value})} />
                        </div>
                        <div className="col-6">
                          <label className="form-label small fw-semibold mb-1">Change</label>
                          <input className="form-control form-control-sm" value={editForm.change}
                            onChange={e => setEditForm({...editForm, change: e.target.value})} />
                        </div>
                        <div className="col-12">
                          <label className="form-label small fw-semibold mb-1">Category</label>
                          <div className="d-flex gap-1 flex-wrap">
                            {["Vegetables","Fruits","Grains","Dairy","Other"].map(cat => (
                              <button key={cat} type="button"
                                onClick={() => setEditForm({...editForm, category: cat})}
                                className={`btn btn-sm py-0 rounded-pill ${
                                  editForm.category === cat ? "btn-success" : "btn-outline-secondary"
                                }`} style={{ fontSize: 12 }}>
                                {cat}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="col-12">
                          <label className="form-label small fw-semibold mb-1">Location</label>
                          <input className="form-control form-control-sm" value={editForm.location}
                            onChange={e => setEditForm({...editForm, location: e.target.value})} />
                        </div>
                        <div className="col-12">
                          <label className="form-label small fw-semibold mb-1">Description</label>
                          <textarea className="form-control form-control-sm" rows={2}
                            value={editForm.description}
                            onChange={e => setEditForm({...editForm, description: e.target.value})} />
                        </div>
                        <div className="col-12">
                          <div className="form-check form-switch">
                            <input className="form-check-input" type="checkbox"
                              checked={editForm.is_available}
                              onChange={e => setEditForm({...editForm, is_available: e.target.checked})} />
                            <label className="form-check-label small fw-semibold">
                              {editForm.is_available ? "✅ Available" : "❌ Not Available"}
                            </label>
                          </div>
                        </div>
                      </div>
                      <button className="btn btn-success w-100 fw-semibold mt-3"
                        onClick={() => handleUpdate(p._id)} disabled={editSaving}>
                        {editSaving
                          ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</>
                          : "✅ Save All Changes"}
                      </button>
                    </div>
                  </div>

                ) : (
                  /* Normal View */
                  <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden"
                    style={{ transition: "transform 0.2s, box-shadow 0.2s" }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "";
                    }}>
                    <Link href={`/ProductView/${p._id}`} className="text-decoration-none">
                      <ProductImage p={p} />
                    </Link>
                    <Link href={`/ProductView/${p._id}`} className="text-decoration-none">
                      <ProductInfo p={p} showFarmer={true} />
                    </Link>
                    <div className="card-footer border-0 bg-white p-3 pt-0">
                      {isOwnProduct(p) ? (
                        // Apna product — Edit/Delete
                        <div className="d-flex gap-1">
                          <button className="btn btn-outline-success btn-sm flex-fill fw-semibold"
                            onClick={() => startEdit(p)}>✏️ Edit</button>
                          <button className="btn btn-outline-danger btn-sm px-2"
                            onClick={() => handleDelete(p._id)}>🗑️</button>
                        </div>
                      ) : (
                        // Dusre ka product — Order Now
                        <button className="btn btn-success btn-sm w-100 fw-semibold"
                          onClick={() => router.push(`/ProductView/${p._id}`)}
                          disabled={p.stock === 0 || !p.is_available}>
                          {p.stock === 0 ? "Out of Stock" :
                           !p.is_available ? "Unavailable" : "🛒 Order Now"}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* ===== AGENT ===== */}
           {isAgent && (showAll ? filteredAgentRates : filteredAgentRates.slice(0, 8)).map((r: any) => (
              <div key={r._id} className="col-6 col-md-4 col-lg-3">
                <div className="card border-0 shadow-sm rounded-4 h-100">
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h6 className="fw-bold mb-0 text-truncate" style={{ maxWidth: "70%" }}>
                        {r.product_name}
                      </h6>
                      <span className={`badge bg-${
                        !r.change || r.change === "0%" ? "secondary"
                        : r.change.startsWith("-") ? "danger" : "success"
                      }`}>
                        {r.change || "0%"}
                      </span>
                    </div>
                    <div className="mb-1">
                      <span className="fs-4 fw-bold text-success">₹{r.price}</span>
                      <small className="text-muted ms-1">/{r.unit}</small>
                    </div>
                    <small className="text-muted d-block">📍 {r.location}</small>
                    {r.agent_id?.toString() === user?.id?.toString() && (
                      <button className="btn btn-outline-danger btn-sm w-100 mt-2"
                        onClick={() => handleAgentRateDelete(r._id)}>
                        🗑️ Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
         {!loading && totalCount > 8 && (
          <div className="text-center mt-4">
            <button
              className="btn btn-outline-success px-5 rounded-pill fw-semibold"
              onClick={() => setShowAll(!showAll)}>
              {showAll
                ? "📦 Read Less ↑"
                : `🔍 Read More (${totalCount - 8} aur) ↓`}
            </button>
          </div>
        )}
          </div>
        )}

      </div>
    </div>
  );
}