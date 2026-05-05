"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageNavbar from "../Sidebar/Navbar/PageNavbar";
import PageSidebar from "../Sidebar/Sidebar/PageSidebar";
import PageFooter from "../Sidebar/Footer/page";
import ASO from "../AOS/AOS";
import Pagination from "../AOS/Pagination";

/* ─── Constants ──────────────────────────────── */
const CATEGORIES = ["All","Vegetables","Fruits","Grains","Dairy","Other"];

const catColors: Record<string,[string,string]> = {
  Vegetables: ["#f0fdf4","#16a34a"],
  Fruits:     ["#fef3c7","#d97706"],
  Grains:     ["#fef9c3","#a16207"],
  Dairy:      ["#eff6ff","#1d4ed8"],
  Other:      ["#f3f4f6","#374151"],
};

const roleBadge: Record<string,string> = {
  agent:   "bg-warning text-dark",
  farmer:  "bg-success",
  buyer:   "bg-info text-dark",
  unknown: "bg-secondary",
};

type Tab = "products" | "farmerrates" | "agentrates";

/* ─── Helpers ────────────────────────────────── */
const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-IN",{ day:"2-digit", month:"short", year:"numeric" }) : "—";

/* ============================================================
   COMPONENT
   ============================================================ */
export default function AdminAllRates() {
  const router = useRouter();

  /* sidebar */
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen(p => !p);

  /* active tab */
  const [tab, setTab] = useState<Tab>("products");

  /* data */
  const [products,    setProducts]    = useState<any[]>([]);
  const [farmerRates, setFarmerRates] = useState<any[]>([]);
  const [agentRates,  setAgentRates]  = useState<any[]>([]);

  /* loading per-tab */
  const [loading, setLoading] = useState(false);

  /* filters */
  const [search,    setSearch]    = useState("");
  const [catFilter, setCatFilter] = useState("All");

  /* alert */
  const [msg,     setMsg]     = useState("");
  const [msgType, setMsgType] = useState<"success"|"danger">("success");

  /* modals */
  const [viewItem, setViewItem] = useState<any>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [editSaving, setEditSaving] = useState(false);

  /* pagination */
  const [currentPage, setCurrentPage] = useState(0);
  const PER_PAGE = 8;

  /* ── Auth ──────────────────────────────────── */
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.push("/AdminLogin"); return; }
    const u = JSON.parse(stored);
    if (u.role !== "admin") { router.push("/"); return; }
    fetchAll();
  }, []);

  /* ── Fetch all three ───────────────────────── */
  const fetchAll = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const h = { Authorization: `Bearer ${token}` };
    try {
      const [r1, r2, r3] = await Promise.all([
        fetch("http://localhost:5000/products",     { headers: h }),
        fetch("http://localhost:5000/farmer-rates", { headers: h }),
        fetch("http://localhost:5000/agent-rates",  { headers: h }),
      ]);
      const [d1, d2, d3] = await Promise.all([r1.json(), r2.json(), r3.json()]);
      setProducts(   Array.isArray(d1) ? d1 : []);
      setFarmerRates(Array.isArray(d2) ? d2 : []);
      setAgentRates( Array.isArray(d3) ? d3 : []);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  /* ── Current dataset based on tab ─────────── */
  const rawData = tab === "products" ? products
    : tab === "farmerrates" ? farmerRates
    : agentRates;

  /* ── Filter ────────────────────────────────── */
  const filtered = rawData.filter(p => {
    const matchCat  = catFilter === "All" || p.category === catFilter;
    const q         = search.toLowerCase();
    const matchText = !search.trim() || (
      (p.name         || p.product_name || "").toLowerCase().includes(q) ||
      (p.farmer_name  || p.agent_name   || "").toLowerCase().includes(q) ||
      (p.location     || "").toLowerCase().includes(q)
    );
    return matchCat && matchText;
  });

  /* reset page on tab / filter change */
  useEffect(() => { setCurrentPage(0); }, [tab, search, catFilter]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageData   = filtered.slice(currentPage * PER_PAGE, (currentPage+1) * PER_PAGE);

  /* ── Alert ─────────────────────────────────── */
  const showAlert = (text:string, type:"success"|"danger"="success") => {
    setMsg(text); setMsgType(type);
    setTimeout(() => setMsg(""), 3000);
  };

  /* ── Endpoint resolver ─────────────────────── */
  const endpoint = (t: Tab) =>
    t === "products"    ? "http://localhost:5000/products"
    : t === "farmerrates" ? "http://localhost:5000/farmer-rates"
    : "http://localhost:5000/agent-rates";

  /* ── Delete ────────────────────────────────── */
  const handleDelete = async (id:string) => {
    if (!confirm("Delete karna chahte ho?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${endpoint(tab)}/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).error);
      showAlert("Deleted ✅");
      fetchAll();
    } catch(e:any) { showAlert(e.message,"danger"); }
  };

  /* ── Edit Save ─────────────────────────────── */
  const handleEditSave = async () => {
    if (!editItem) return;
    setEditSaving(true);
    const token = localStorage.getItem("token");
    try {
      const body: any = {
        price:        Number(editItem.price),
        category:     editItem.category,
        description:  editItem.description,
        stock:        Number(editItem.stock),
        unit:         editItem.unit,
        location:     editItem.location,
        is_available: editItem.is_available,
      };
      // name field — products uses 'name', rates use 'product_name'
      if (tab === "products")    body.name         = editItem.name;
      else                       body.product_name = editItem.product_name;

      const res = await fetch(`${endpoint(tab)}/${editItem._id}`, {
        method: "PUT",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      showAlert("Updated ✅");
      setEditItem(null);
      fetchAll();
    } catch(e:any) { showAlert(e.message,"danger"); }
    finally { setEditSaving(false); }
  };

  /* ── Row name helper ───────────────────────── */
  const rowName  = (p:any) => p.name || p.product_name || "—";
  const rowOwner = (p:any) => p.farmer_name || p.agent_name || "—";
  const rowImage = (p:any) => p.image_url || p.image || "";

  /* ── Tab summary counts ────────────────────── */
  const tabMeta: { key:Tab; label:string; icon:string; count:number; color:string }[] = [
    { key:"products",    label:"Farmer Products", icon:"🌾", count:products.length,    color:"#16a34a" },
    { key:"farmerrates", label:"Farmer Rates",    icon:"👨‍🌾", count:farmerRates.length, color:"#d97706" },
    { key:"agentrates",  label:"Agent Rates",     icon:"🏪", count:agentRates.length,  color:"#1d4ed8" },
  ];

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <>
      <ASO />
      <div className="wrapper">
        <PageSidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className={`content ${isSidebarOpen ? "" : "collapsed"}`}>
          <PageNavbar toggleSidebar={toggleSidebar} />

          <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
            <section className="mb-5">
              <div className="container-fluid px-4">

                {/* ── Summary Cards ── */}
                <div className="row g-3 mb-4">
                  {tabMeta.map(t => (
                    <div className="col-md-4 col-sm-12" key={t.key}>
                      <div
                        className="card shadow-sm h-100"
                        style={{
                          cursor:"pointer",
                          border: tab === t.key ? `2px solid ${t.color}` : "1px solid #e2e8f0",
                          borderRadius: 12,
                        }}
                        onClick={() => setTab(t.key)}
                      >
                        <div className="card-body d-flex align-items-center gap-3">
                          <div style={{
                            fontSize:32, width:56, height:56,
                            display:"flex", alignItems:"center", justifyContent:"center",
                            background: tab===t.key ? t.color+"22" : "#f8fafc",
                            borderRadius:12,
                          }}>
                            {t.icon}
                          </div>
                          <div>
                            <div className="text-muted fw-semibold" style={{fontSize:12}}>{t.label}</div>
                            <div className="fw-bold" style={{fontSize:26, color: t.color}}>{t.count}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="card">
                  <div className="card-body">

                    {/* ── Tabs ── */}
                    <ul className="nav nav-tabs mb-4">
                      {tabMeta.map(t => (
                        <li className="nav-item" key={t.key}>
                          <button
                            className={`nav-link fw-semibold ${tab===t.key ? "active" : ""}`}
                            onClick={() => setTab(t.key)}
                          >
                            {t.icon} {t.label}
                            <span className="badge ms-2" style={{
                              background: tab===t.key ? t.color : "#e2e8f0",
                              color:      tab===t.key ? "#fff"   : "#374151",
                              fontSize:11,
                            }}>{t.count}</span>
                          </button>
                        </li>
                      ))}
                    </ul>

                    {/* ── Alert ── */}
                    {msg && (
                      <div style={{
                        background: msgType==="success" ? "#dcfce7" : "#fee2e2",
                        color:      msgType==="success" ? "#16a34a" : "#dc2626",
                        padding:"12px 16px", borderRadius:10, marginBottom:16,
                        fontWeight:600, fontSize:13,
                      }}>{msg}</div>
                    )}

                    {/* ── Category Filters ── */}
                    <div className="d-flex flex-wrap gap-2 mb-3">
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setCatFilter(cat)}
                          className={`btn btn-sm rounded-pill fw-semibold ${
                            catFilter===cat ? "btn-dark" : "btn-outline-secondary"
                          }`}
                        >
                          {cat} ({cat==="All" ? rawData.length : rawData.filter(p=>p.category===cat).length})
                        </button>
                      ))}
                    </div>

                    {/* ── Search + Refresh ── */}
                    <div className="d-flex flex-wrap gap-2 align-items-center mb-4">
                      <input
                        type="text"
                        placeholder="🔍 Name, owner, location..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="form-control shadow-sm"
                        style={{ maxWidth:340 }}
                      />
                      <button onClick={fetchAll} className="btn btn-success btn-sm shadow py-2">
                        🔄 Refresh
                      </button>
                      <span className="text-muted fw-semibold fs-6 ms-auto">
                        {filtered.length} / {rawData.length} records
                      </span>
                    </div>

                    {/* ── Table ── */}
                    {loading ? (
                      <div className="text-center my-4 text-muted fw-semibold">Loading...</div>
                    ) : (
                      <div style={{ overflowX:"auto" }}>
                        <table className="table table-bordered table-hover">
                          <thead>
                            <tr className="text-center bg-gradient">
                              {tab === "products" ? (
                                ["#","Image","Product","Farmer","Role","Category","Price","Stock","Location","Status","Actions"]
                              ) : tab === "farmerrates" ? (
                                ["#","Image","Product","Farmer","Category","Price","Stock","Location","Status","Actions"]
                              ) : (
                                ["#","Image","Product","Agent","Category","Price","Stock","Location","Status","Actions"]
                              )}
                              
                            </tr>
                          </thead>
                          <tbody>
                            {pageData.length === 0 ? (
                              <tr>
                                <td colSpan={11} className="text-center text-muted py-4">
                                  📭 Koi record nahi mila
                                </td>
                              </tr>
                            ) : pageData.map((p:any, i) => (
                              <tr key={p._id} className="text-center align-middle">
                                <td>{currentPage * PER_PAGE + i + 1}</td>

                                {/* Image */}
                                <td>
                                  {rowImage(p) ? (
                                    <img
                                      src={rowImage(p)} alt={rowName(p)}
                                      className="rounded img-fluid"
                                      style={{ width:55, height:55, objectFit:"cover", cursor:"pointer" }}
                                      onClick={() => setViewItem({ ...p, _tab: tab })}
                                    />
                                  ) : <span>📦</span>}
                                </td>

                                {/* Name */}
                                <td>
                                  <div className="fw-bold" style={{fontSize:13}}>{rowName(p)}</div>
                                  <div className="text-muted" style={{fontSize:11}}>
                                    {p.description?.slice(0,28)}{p.description?.length>28?"...":""}
                                  </div>
                                </td>

                                {/* Owner */}
                                <td className="text-muted fw-semibold" style={{fontSize:13}}>
                                  {rowOwner(p)}
                                </td>

                                {/* Role (only products tab) */}
                                {tab === "products" && (
                                  <td>
                                    <span className={`badge ${roleBadge[p.role] ?? "bg-secondary"}`}>
                                      {p.role || "unknown"}
                                    </span>
                                  </td>
                                )}

                                {/* Category */}
                                <td>
                                  <span style={{
                                    background: catColors[p.category]?.[0] ?? "#f3f4f6",
                                    color:      catColors[p.category]?.[1] ?? "#374151",
                                    padding:"3px 10px", borderRadius:20,
                                    fontSize:12, fontWeight:600,
                                  }}>{p.category || "—"}</span>
                                </td>

                                {/* Price */}
                                <td className="fw-bold text-success">₹{p.price}/{p.unit}</td>

                                {/* Stock */}
                                <td>
                                  <span style={{
                                    color: p.stock===0 ? "#dc2626" : p.stock<10 ? "#d97706" : "#16a34a",
                                    fontWeight:700,
                                  }}>
                                    {p.stock ?? "—"} {p.unit}
                                  </span>
                                </td>

                                {/* Location */}
                                <td style={{fontSize:12}}>{p.location || "—"}</td>

                                {/* Status */}
                                <td>
                                  <span style={{
                                    background: p.is_available ? "#dcfce7" : "#fee2e2",
                                    color:      p.is_available ? "#16a34a" : "#dc2626",
                                    padding:"3px 10px", borderRadius:20,
                                    fontSize:11, fontWeight:700,
                                  }}>
                                    {p.is_available ? "Available" : "Unavailable"}
                                  </span>
                                </td>

                                {/* Actions */}
                                <td>
                                  <div style={{ display:"flex", gap:6, justifyContent:"center" }}>
                                    <button onClick={() => setViewItem({...p, _tab:tab})} className="btn btn-sm shadow px-2" title="View">👁️</button>
                                    <button onClick={() => setEditItem({...p, _tab:tab})} className="btn btn-sm shadow px-2" title="Edit">✏️</button>
                                    <button onClick={() => handleDelete(p._id)} className="btn btn-sm shadow px-2" title="Delete">🗑️</button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* ── Pagination ── */}
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      handlePrevPage={() => setCurrentPage(p => Math.max(p-1,0))}
                      handleNextPage={() => setCurrentPage(p => Math.min(p+1,totalPages-1))}
                    />

                  </div>
                </div>
              </div>
            </section>
            <PageFooter />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          VIEW MODAL
      ══════════════════════════════════════ */}
      {viewItem && (
        <div className="modal fade show d-block" style={{background:"rgba(0,0,0,0.55)"}} onClick={() => setViewItem(null)}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  {viewItem._tab === "agentrates" ? "🏪 Agent Rate Details"
                    : viewItem._tab === "farmerrates" ? "👨‍🌾 Farmer Rate Details"
                    : "🌾 Product Details"}
                </h5>
                <button className="btn-close" onClick={() => setViewItem(null)} />
              </div>
              <div className="modal-body p-4">
                {/* Image + Title + Badges */}
                <div className="d-flex gap-4 align-items-start mb-4 flex-wrap">
                  <div>
                    {rowImage(viewItem) ? (
                      <img src={rowImage(viewItem)} alt={rowName(viewItem)}
                        className="rounded shadow"
                        style={{ width:120, height:120, objectFit:"cover" }} />
                    ) : (
                      <div className="rounded shadow d-flex align-items-center justify-content-center bg-light text-muted"
                        style={{ width:120, height:120, fontSize:40 }}>📦</div>
                    )}
                  </div>
                  <div className="flex-grow-1">
                    <h4 className="fw-bold mb-2">{rowName(viewItem)}</h4>
                    <div className="d-flex flex-wrap gap-2 mb-2">
                      <span style={{
                        background: catColors[viewItem.category]?.[0] ?? "#f3f4f6",
                        color:      catColors[viewItem.category]?.[1] ?? "#374151",
                        padding:"3px 12px", borderRadius:20, fontSize:12, fontWeight:600,
                      }}>{viewItem.category || "—"}</span>
                      {viewItem._tab === "products" && (
                        <span className={`badge ${roleBadge[viewItem.role] ?? "bg-secondary"}`}>
                          {viewItem.role || "unknown"}
                        </span>
                      )}
                      <span className={`badge ${viewItem.is_available ? "bg-success" : "bg-danger"}`}>
                        {viewItem.is_available ? "Available" : "Unavailable"}
                      </span>
                    </div>
                    {viewItem.description && (
                      <p className="text-muted mb-0" style={{fontSize:13}}>{viewItem.description}</p>
                    )}
                  </div>
                </div>

                {/* Detail grid */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))", gap:12 }}>
                  {[
                    { label:"ID",       value: viewItem._id,                              icon:"🆔" },
                    { label: viewItem._tab==="agentrates" ? "Agent" : "Farmer",
                      value: rowOwner(viewItem),                                           icon:"👤" },
                    { label:"Price",    value:`₹${viewItem.price} / ${viewItem.unit}`,    icon:"💰" },
                    { label:"Stock",    value:`${viewItem.stock ?? "—"} ${viewItem.unit}`,icon:"📦",
                      valueColor: viewItem.stock===0 ? "#dc2626" : viewItem.stock<10 ? "#d97706" : "#16a34a" },
                    { label:"Location", value: viewItem.location || "—",                  icon:"📍" },
                    { label:"Unit",     value: viewItem.unit || "—",                       icon:"⚖️" },
                    { label:"Created",  value: fmtDate(viewItem.createdAt),               icon:"📅" },
                    { label:"Updated",  value: fmtDate(viewItem.updatedAt),               icon:"🔄" },
                  ].map(item => (
                    <div key={item.label} style={{
                      background:"#f8fafc", borderRadius:10,
                      padding:"10px 14px", border:"1px solid #e2e8f0",
                    }}>
                      <div style={{fontSize:11,color:"#94a3b8",fontWeight:600,marginBottom:3}}>
                        {item.icon} {item.label}
                      </div>
                      <div style={{
                        fontSize:13, fontWeight:700,
                        color:(item as any).valueColor || "#1e293b",
                        wordBreak:"break-all",
                      }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary btn-sm"
                  onClick={() => { setEditItem({...viewItem}); setViewItem(null); }}>
                  ✏️ Edit
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setViewItem(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          EDIT MODAL
      ══════════════════════════════════════ */}
      {editItem && (
        <div className="modal fade show d-block" style={{background:"rgba(0,0,0,0.5)"}} onClick={() => setEditItem(null)}>
          <div className="modal-dialog modal-md modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">✏️ Edit — {rowName(editItem)}</h5>
                <button className="btn-close" onClick={() => setEditItem(null)} />
              </div>
              <div className="modal-body">
                <label className="form-label fw-semibold">Product Name</label>
                {editItem._tab === "products" ? (
                  <input className="form-control mb-3" value={editItem.name || ""}
                    onChange={e => setEditItem({...editItem, name: e.target.value})} />
                ) : (
                  <input className="form-control mb-3" value={editItem.product_name || ""}
                    onChange={e => setEditItem({...editItem, product_name: e.target.value})} />
                )}

                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label fw-semibold">Price (₹)</label>
                    <input type="number" className="form-control" value={editItem.price || ""}
                      onChange={e => setEditItem({...editItem, price: e.target.value})} />
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-semibold">Stock</label>
                    <input type="number" className="form-control" value={editItem.stock || 0}
                      onChange={e => setEditItem({...editItem, stock: e.target.value})} />
                  </div>
                </div>

                <label className="form-label fw-semibold">Category</label>
                <select className="form-select mb-3" value={editItem.category || ""}
                  onChange={e => setEditItem({...editItem, category: e.target.value})}>
                  {CATEGORIES.filter(c => c !== "All").map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <label className="form-label fw-semibold">Location</label>
                <input className="form-control mb-3" value={editItem.location || ""}
                  onChange={e => setEditItem({...editItem, location: e.target.value})} />

                <label className="form-label fw-semibold">Description</label>
                <textarea className="form-control mb-3" rows={3} value={editItem.description || ""}
                  onChange={e => setEditItem({...editItem, description: e.target.value})} />

                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" id="avSwitch"
                    checked={!!editItem.is_available}
                    onChange={e => setEditItem({...editItem, is_available: e.target.checked})} />
                  <label className="form-check-label fw-semibold" htmlFor="avSwitch">Available</label>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-success btn-sm" onClick={handleEditSave} disabled={editSaving}>
                  {editSaving ? "Saving..." : "💾 Save"}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setEditItem(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}