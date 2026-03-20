"use client";
import { useEffect, useState, useCallback } from "react";

const CATEGORIES = ["All", "Vegetables", "Fruits", "Grains", "Dairy", "Other"];
const CATEGORY_ICONS: Record<string, string> = {
  All: "🌾", Vegetables: "🥦", Fruits: "🍎",
  Grains: "🌽", Dairy: "🥛", Other: "📦",
};

export default function RatesPage() {
  const [user, setUser]             = useState<any>(null);
const [tab, setTab] = useState<"mandi"|"agent"|"farmer">("mandi");

useEffect(() => {
  const stored = localStorage.getItem("user");
  if (stored) {
    const u = JSON.parse(stored);
    if (u.role === "agent") setTab("agent");
    else setTab("mandi");
  }
}, []);

  const [mandiRates, setMandiRates] = useState<any[]>([]);
  const [agentRates, setAgentRates] = useState<any[]>([]);
  const [locations, setLocations]   = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState("");
  const [products, setProducts]     = useState<any[]>([]);
  const [category, setCategory]     = useState("All");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch]         = useState("");
  const [loading, setLoading]       = useState(true);
  const [msg, setMsg]               = useState("");
  const [msgType, setMsgType]       = useState<"success"|"danger">("success");
  // Farmer product edit
  const [editId, setEditId]         = useState<string|null>(null);
  const [editPrice, setEditPrice]   = useState("");
  const [editChange, setEditChange] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  // Agent rate edit
  const [agentEditId, setAgentEditId] = useState<string|null>(null);
  const [agentForm, setAgentForm] = useState({ product_name:"", price:"", change:"0%", unit:"kg", location:""});
  const [agentSaving, setAgentSaving] = useState(false);
  // Agent rate add
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ product_name:"", price:"", change:"0%", unit:"kg", location:""});
  const [addSaving, setAddSaving]     = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      setAddForm(f => ({ ...f, location: u.location || "" }));
    }
    fetchAll();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [m, ar] = await Promise.all([
        fetch("http://localhost:5000/rates").then(r => r.json()),
        fetch("http://localhost:5000/agent-rates").then(r => r.json()),
      ]);
      const mandiData = Array.isArray(m)  ? m  : [];
      const agentData = Array.isArray(ar) ? ar : [];
      setMandiRates(mandiData);
      setAgentRates(agentData);

      // Dynamic locations
      const allLocs = agentData
        .map((r: any) => r.location)
        .filter(Boolean);
      setLocations(["All", ...Array.from(new Set<string>(allLocs))]);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

const fetchProducts = useCallback(async () => {
  setLoading(true);
  try {
    const params: string[] = [];
    if (search.trim())      params.push(`search=${encodeURIComponent(search.trim())}`);
    if (category !== "All") params.push(`category=${encodeURIComponent(category)}`);
    const res  = await fetch(`http://localhost:5000/products${params.length ? "?" + params.join("&") : ""}`);
    const data = await res.json();
    // Sirf apne products dikhao farmer tab mein
    const userId = user?.id || user?._id || "";
    const filtered = Array.isArray(data)
      ? data.filter((p: any) => p.farmer_id?.toString() === userId?.toString())
      : [];
    setProducts(filtered);
  } catch(e) { console.error(e); }
  finally { setLoading(false); }
}, [search, category, user]);

  useEffect(() => {
    if (tab === "farmer") fetchProducts();
  }, [fetchProducts, tab]);

  const showAlert = (text: string, type: "success"|"danger" = "success") => {
    setMsg(text); setMsgType(type);
    setTimeout(() => setMsg(""), 3000);
  };

  const handleProductUpdate = async (id: string) => {
    if (!editPrice) { showAlert("Price bharo!", "danger"); return; }
    setEditSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ price: Number(editPrice), change: editChange || "0%" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showAlert("Rate update ho gaya ✅");
      setEditId(null);
      fetchProducts();
    } catch (err: any) { showAlert(err.message, "danger"); }
    finally { setEditSaving(false); }
  };

  const handleProductDelete = async (id: string) => {
    if (!confirm("Delete karna chahte ho?")) return;
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:5000/products/${id}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    });
    showAlert("Deleted ✅");
    fetchProducts();
  };

  const handleAgentAdd = async () => {
    if (!addForm.product_name || !addForm.price) {
      showAlert("Naam aur price bharo!", "danger"); return;
    }
    setAddSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/agent-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...addForm, price: Number(addForm.price),
          agent_id: user?.id, agent_name: user?.name,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      showAlert("Rate add ho gaya ✅");
      setShowAddForm(false);
      setAddForm(f => ({ ...f, product_name:"", price:"", change:"0%" }));
      fetchAll();
    } catch (err: any) { showAlert(err.message, "danger"); }
    finally { setAddSaving(false); }
  };

  const handleAgentUpdate = async (id: string) => {
    if (!agentForm.price) { showAlert("Price bharo!", "danger"); return; }
    setAgentSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/agent-rates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...agentForm, price: Number(agentForm.price) }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      showAlert("Rate update ho gaya ✅");
      setAgentEditId(null);
      fetchAll();
    } catch (err: any) { showAlert(err.message, "danger"); }
    finally { setAgentSaving(false); }
  };

  const handleAgentDelete = async (id: string) => {
    if (!confirm("Delete karna chahte ho?")) return;
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:5000/agent-rates/${id}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    });
    showAlert("Deleted ✅");
    fetchAll();
  };

  const changeColor = (c: string) =>
    !c || c === "0%" ? "secondary" : c.startsWith("-") ? "danger" : "success";
  const changeIcon  = (c: string) =>
    !c || c === "0%" ? "➡️" : c.startsWith("-") ? "📉" : "📈";

  // Location filter — exact match
  const filteredAgentRates = agentRates.filter(r => {
    const matchLoc = !locationFilter || locationFilter === "All" ||
      r.location?.toLowerCase() === locationFilter.toLowerCase();
    return matchLoc;
  });

  const tabs = [
  // Buyer aur Farmer ko Mandi Rates dikhao
  ...(user?.role === "buyer" || user?.role === "farmer" || !user
    ? [{ key: "mandi", label: "📊 Mandi Rates" }] : []),

  // Agent ko sirf Agent Rates dikhao
  ...(user?.role === "agent"
    ? [{ key: "agent", label: "🏪 Agent Rates" }] : []),

  // Farmer ko My Products bhi dikhao
  ...(user?.role === "farmer"
    ? [{ key: "farmer", label: "🌾 My Products" }] : []),
  ];

  return (
    <div className="min-vh-100 bg-light py-4">
      <div className="container">

        {/* Header */}
        <div className="card border-0 shadow-sm rounded-4 mb-4"
          style={{ background: "linear-gradient(135deg,#198754,#20c997)" }}>
          <div className="card-body p-4 text-white">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div>
                <h4 className="fw-bold mb-1">📊 Rates & Bhaav</h4>
                <p className="mb-0 opacity-75 small">
                  Aaj ke taaza bhaav —{" "}
                  {new Date().toLocaleDateString("hi-IN", {
                    weekday:"long", day:"numeric", month:"long"
                  })}
                </p>
              </div>
              {user?.role === "agent" && (
                <button className="btn fw-semibold"
                  style={{ background:"rgba(255,255,255,0.2)", color:"white" }}
                  onClick={() => { setTab("agent"); setShowAddForm(true); }}>
                  ➕ Rate Add Karo
                </button>
              )}
              {user?.role === "farmer" && (
                <a href="/ProductAdd" className="btn fw-semibold"
                  style={{ background:"rgba(255,255,255,0.2)", color:"white" }}>
                  ➕ Product Add
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Alert */}
        {msg && <div className={`alert alert-${msgType} rounded-3 mb-3`}>{msg}</div>}

        {/* Tabs */}
        <ul className="nav nav-pills gap-2 mb-4">
          {tabs.map(t => (
            <li key={t.key} className="nav-item">
              <button className={`nav-link rounded-pill px-4 ${
                tab === t.key ? "active bg-success" : "text-success border border-success" }`}
                onClick={() => setTab(t.key as any)}>
                {t.label}
              </button>
            </li>
          ))}
        </ul>

        {/* ===== TAB 1: MANDI RATES ===== */}
        {tab === "mandi" && (
          <>
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-success" />
              </div>
            ) : mandiRates.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <div style={{ fontSize:56 }}>📭</div>
                <p className="mt-2">Koi mandi rate nahi hai abhi</p>
              </div>
            ) : (
              <div className="row g-3">
                {mandiRates.map((r: any) => (
                  <div key={r._id} className="col-6 col-md-3 col-lg-2">
                    <div className="card border-0 shadow-sm rounded-4 text-center p-3 h-100">
                      <div className="fw-bold mb-1">{r.name}</div>
                      <div className="text-success fw-bold fs-4">₹{r.price}</div>
                      <small className="text-muted">per quintal</small>
                      <span className={`badge mt-2 bg-${changeColor(r.change)}`}>
                        {changeIcon(r.change)} {r.change || "0%"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ===== TAB 2: AGENT RATES ===== */}
        {tab === "agent" && (
          <>
            {/* Location Filter — dynamic */}
            <div className="card border-0 shadow-sm rounded-4 p-3 mb-4">
              <div className="row g-2 align-items-center">
                <div className="col-md-6">
                  <div className="dropdown w-100">
                    <button className="btn btn-outline-secondary dropdown-toggle w-100 text-start bg-white"
                      type="button" data-bs-toggle="dropdown">
                      📍 {locationFilter || "Sab Locations"}
                    </button>
                    <ul className="dropdown-menu w-100" style={{ maxHeight:200, overflowY:"auto" }}>
                      {locations.map(loc => (
                        <li key={loc}>
                          <a className="dropdown-item" style={{ cursor:"pointer" }}
                            onClick={() => setLocationFilter(loc === "All" ? "" : loc)}>
                            📍 {loc}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {locationFilter && (
                    <button className="btn btn-sm btn-outline-secondary mt-1"
                      onClick={() => setLocationFilter("")}>✕ Clear</button>
                  )}
                </div>
                <div className="col-md-6 text-muted small">
                  {filteredAgentRates.length} rates mil rahe hain
                  {locationFilter && ` — "${locationFilter}"`}
                </div>
              </div>
            </div>

            {/* Agent Add Form */}
            {user?.role === "agent" && showAddForm && (
              <div className="card border-0 shadow-sm rounded-4 p-4 mb-4"
                style={{ borderLeft:"4px solid #ffc107" }}>
                <h6 className="fw-bold text-warning mb-3">➕ Naya Rate Add Karo</h6>
                <div className="row g-2">
                  <div className="col-md-3">
                    <input className="form-control rounded-3" placeholder="Fasal ka naam"
                      value={addForm.product_name}
                      onChange={e => setAddForm({...addForm, product_name: e.target.value})} />
                  </div>
                  <div className="col-md-2">
                    <div className="input-group">
                      <span className="input-group-text">₹</span>
                      <input type="number" className="form-control" placeholder="Price"
                        value={addForm.price}
                        onChange={e => setAddForm({...addForm, price: e.target.value})} />
                    </div>
                  </div>
                  <div className="col-md-2">
                    <input className="form-control rounded-3" placeholder="+2% ya -1%"
                      value={addForm.change}
                      onChange={e => setAddForm({...addForm, change: e.target.value})} />
                  </div>
                  <div className="col-md-2">
                    <select className="form-select rounded-3" value={addForm.unit}
                      onChange={e => setAddForm({...addForm, unit: e.target.value})}>
                      {["kg","quintal","ton","dozen","litre"].map(u =>
                        <option key={u}>{u}</option>
                      )}
                    </select>
                  </div>
                  <div className="col-md-2">
                    <input className="form-control rounded-3" placeholder="Location"
                      value={addForm.location}
                      onChange={e => setAddForm({...addForm, location: e.target.value})} />
                  </div>
                  <div className="col-md-1 d-flex gap-1">
                    <button className="btn btn-warning fw-bold flex-fill"
                      onClick={handleAgentAdd} disabled={addSaving}>
                      {addSaving ? <span className="spinner-border spinner-border-sm" /> : "Add"}
                    </button>
                    <button className="btn btn-outline-secondary"
                      onClick={() => setShowAddForm(false)}>✕</button>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-success" />
              </div>
            ) : filteredAgentRates.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <div style={{ fontSize:56 }}>📭</div>
                <p className="mt-2">
                  {locationFilter
                    ? `"${locationFilter}" mein koi rate nahi`
                    : "Koi agent rate nahi hai abhi"}
                </p>
              </div>
            ) : (
              <div className="row g-3">
                {filteredAgentRates.map((r: any) => (
                  <div key={r._id} className="col-md-4 col-lg-3">

                    {agentEditId === r._id ? (
                      <div className="card border-warning border-2 shadow rounded-4 h-100">
                        <div className="card-body p-3">
                          <h6 className="fw-bold text-warning mb-3">✏️ Edit Rate</h6>
                          <input className="form-control form-control-sm mb-2 rounded-3"
                            placeholder="Fasal naam"
                            value={agentForm.product_name}
                            onChange={e => setAgentForm({...agentForm, product_name: e.target.value})} />
                          <div className="input-group input-group-sm mb-2">
                            <span className="input-group-text">₹</span>
                            <input type="number" className="form-control" placeholder="Price"
                              value={agentForm.price}
                              onChange={e => setAgentForm({...agentForm, price: e.target.value})} />
                          </div>
                          <input className="form-control form-control-sm mb-2 rounded-3"
                            placeholder="+2% ya -1%"
                            value={agentForm.change}
                            onChange={e => setAgentForm({...agentForm, change: e.target.value})} />
                          <input className="form-control form-control-sm mb-3 rounded-3"
                            placeholder="Location"
                            value={agentForm.location}
                            onChange={e => setAgentForm({...agentForm, location: e.target.value})} />
                          <div className="d-flex gap-1">
                            <button className="btn btn-warning btn-sm flex-fill fw-semibold"
                              onClick={() => handleAgentUpdate(r._id)} disabled={agentSaving}>
                              {agentSaving
                                ? <span className="spinner-border spinner-border-sm" />
                                : "✅ Save"}
                            </button>
                            <button className="btn btn-outline-secondary btn-sm"
                              onClick={() => setAgentEditId(null)}>✕</button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="card border-0 shadow-sm rounded-4 h-100">
                        <div className="card-body p-3">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="fw-bold mb-0">{r.product_name}</h6>
                            <span className={`badge bg-${changeColor(r.change)}`}>
                              {changeIcon(r.change)} {r.change}
                            </span>
                          </div>
                          <div className="mb-1">
                            <span className="fs-4 fw-bold text-success">₹{r.price}</span>
                            <small className="text-muted ms-1">/{r.unit}</small>
                          </div>
                          <small className="text-muted d-block">🏪 {r.agent_name}</small>
                          <small className="text-muted d-block mb-2">📍 {r.location}</small>

                          {/* ✅ Fix — toString() comparison */}
                          {user?.role === "agent" &&
                            r.agent_id?.toString() === user?.id?.toString() && (
                            <div className="d-flex gap-1 mt-2">
                              <button className="btn btn-outline-warning btn-sm flex-fill"
                                onClick={() => {
                                  setAgentEditId(r._id);
                                  setAgentForm({
                                    product_name: r.product_name,
                                    price:        String(r.price),
                                    change:       r.change,
                                    unit:         r.unit,
                                    location:     r.location,
                                  });
                                }}>✏️ Edit</button>
                              <button className="btn btn-outline-danger btn-sm"
                                onClick={() => handleAgentDelete(r._id)}>🗑️</button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ===== TAB 3: FARMER PRODUCTS ===== */}
        {tab === "farmer" && user?.role === "farmer" && (
          <>
            <div className="input-group mb-3 shadow-sm">
              <span className="input-group-text bg-white border-end-0">🔍</span>
              <input className="form-control border-start-0"
                placeholder="Product dhundho..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)} />
              {searchInput && (
                <button className="btn btn-outline-secondary"
                  onClick={() => { setSearchInput(""); setSearch(""); }}>✕</button>
              )}
            </div>

            <div className="d-flex gap-2 mb-4 flex-wrap">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className={`btn btn-sm rounded-pill ${
                    category === cat ? "btn-success" : "btn-outline-secondary"
                  }`}>
                  {CATEGORY_ICONS[cat]} {cat}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-success" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <div style={{ fontSize:56 }}>🌾</div>
                <p className="mt-2">Koi product nahi mila</p>
              </div>
            ) : (
              <div className="row g-3">
                {products.map((p: any) => (
                  <div key={p._id} className="col-6 col-md-4 col-lg-3">
                    {editId === p._id ? (
                      <div className="card border-success border-2 shadow rounded-4 h-100">
                        <div className="card-body p-3">
                          <div className="d-flex align-items-center gap-2 mb-3">
                            {p.image_url && (
                              <img src={p.image_url} alt={p.name} className="rounded-2"
                                style={{ width:40, height:40, objectFit:"cover" }} />
                            )}
                            <div>
                              <h6 className="fw-bold text-success mb-0">{p.name}</h6>
                              <small className="text-muted">{p.category}</small>
                            </div>
                          </div>
                          <div className="input-group input-group-sm mb-2">
                            <span className="input-group-text">₹</span>
                            <input type="number" className="form-control" placeholder="New price"
                              value={editPrice}
                              onChange={e => setEditPrice(e.target.value)} />
                          </div>
                          <input className="form-control form-control-sm mb-3"
                            placeholder="+5% ya -3%"
                            value={editChange}
                            onChange={e => setEditChange(e.target.value)} />
                          <div className="d-flex gap-1">
                            <button className="btn btn-success btn-sm flex-fill fw-semibold"
                              onClick={() => handleProductUpdate(p._id)} disabled={editSaving}>
                              {editSaving
                                ? <span className="spinner-border spinner-border-sm" />
                                : "✅ Save"}
                            </button>
                            <button className="btn btn-outline-secondary btn-sm"
                              onClick={() => setEditId(null)}>✕</button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="card border-0 shadow-sm rounded-4 h-100">
                        <div className="card-body p-3">
                          {p.image_url && (
                            <img src={p.image_url} alt={p.name}
                              className="rounded-3 mb-2 w-100"
                              style={{ height:80, objectFit:"cover" }}
                              onError={e => {
                                (e.target as HTMLImageElement).style.display="none";
                              }} />
                          )}
                          <div className="d-flex justify-content-between align-items-start mb-1">
                            <h6 className="fw-bold mb-0 text-truncate" style={{ maxWidth:"70%" }}>
                              {p.name}
                            </h6>
                            <span className={`badge bg-${changeColor(p.change)}`}>
                              {changeIcon(p.change)} {p.change || "0%"}
                            </span>
                          </div>
                          <div className="mb-1">
                            <span className="fs-4 fw-bold text-success">₹{p.price}</span>
                            <small className="text-muted ms-1">/{p.unit}</small>
                          </div>
                          <small className={`d-block mb-1 ${
                            p.stock === 0 ? "text-danger" :
                            p.stock < 10  ? "text-warning" : "text-muted"
                          }`}>📦 {p.stock} {p.unit}</small>
                          <small className="text-muted d-block mb-2 text-truncate">
                            📍 {p.location}
                          </small>
                          <span className="badge bg-success bg-opacity-10 text-white small">
                            {CATEGORY_ICONS[p.category]} {p.category}
                          </span>
                  {/* Sirf apna product edit/delete kar sakta hai */}
{p.farmer_id?.toString() === user?.id?.toString() ||
 p.farmer_id?.toString() === user?._id?.toString() ? (
  <div className="d-flex gap-1 mt-2">
    <button className="btn btn-outline-success btn-sm flex-fill"
      onClick={() => {
        setEditId(p._id);
        setEditPrice(String(p.price));
        setEditChange(p.change || "0%");
      }}>✏️ Edit</button>
    <button className="btn btn-outline-danger btn-sm"
      onClick={() => handleProductDelete(p._id)}>🗑️</button>
  </div>
) : (
  <div className="mt-2">
    <span className="badge bg-secondary w-100 py-2">
      👨‍🌾 {p.farmer_name?.split(" ")[0]} ka product
    </span>
  </div>
)}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}