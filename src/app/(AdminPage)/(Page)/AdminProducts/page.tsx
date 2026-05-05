// "use client";
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import PageNavbar from "../Sidebar/Navbar/page";
// import PageSidebar from "../Sidebar/Sidebar/page";
// import PageFooter from "../Sidebar/Footer/page";
// import ASO from "../AOS/AOS";
// import Pagination from "../AOS/Pagination";

// const CATEGORIES = ["All", "Vegetables", "Fruits", "Grains", "Dairy", "Other"];

// const catColors: Record<string, [string, string]> = {
//   Vegetables: ["#f0fdf4", "#16a34a"],
//   Fruits:     ["#fef3c7", "#d97706"],
//   Grains:     ["#fef9c3", "#a16207"],
//   Dairy:      ["#eff6ff", "#1d4ed8"],
//   Other:      ["#f3f4f6", "#374151"],
// };

// const roleBadge: Record<string, string> = {
//   agent:   "bg-warning text-dark",
//   farmer:  "bg-success",
//   buyer:   "bg-info text-dark",
//   unknown: "bg-secondary",
// };

// export default function AdminProducts() {
//   const router = useRouter();

//   const [isSidebarOpen, setIsSidebarOpen] = useState(true);
//   const toggleSidebar = () => setIsSidebarOpen((p) => !p);

//   const [products, setProducts]   = useState<any[]>([]);
//   const [filtered, setFiltered]   = useState<any[]>([]);
//   const [loading, setLoading]     = useState(true);
//   const [search, setSearch]       = useState("");
//   const [catFilter, setCatFilter] = useState("All");
//   const [msg, setMsg]             = useState("");
//   const [msgType, setMsgType]     = useState<"success" | "danger">("success");
//   const [viewProduct, setViewProduct] = useState<any>(null);
//   const [editProduct, setEditProduct] = useState<any>(null);
//   const [editSaving, setEditSaving]   = useState(false);
//   const [currentPage, setCurrentPage] = useState(0);
//   const itemsPerPage = 5;

//   // ── Fetch ──────────────────────────────────────────────
//   const fetchProducts = async () => {
//     setLoading(true);
//     const token = localStorage.getItem("token");
//     try {
//       const res  = await fetch("http://localhost:5000/products", {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       const data = res.ok ? await res.json() : [];
//       setProducts(Array.isArray(data) ? data : []);
//     } catch (e) {
//       console.error(e);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     const stored = localStorage.getItem("user");
//     if (!stored) { router.push("/AdminLogin"); return; }
//     const u = JSON.parse(stored);
//     if (u.role !== "admin") { router.push("/"); return; }
//     fetchProducts();
//   }, []);

//   useEffect(() => {
//     let data = [...products];
//     if (catFilter !== "All") data = data.filter((p) => p.category === catFilter);
//     if (search.trim()) {
//       const q = search.toLowerCase();
//       data = data.filter(
//         (p) =>
//           p.name?.toLowerCase().includes(q) ||
//           p.farmer_name?.toLowerCase().includes(q) ||
//           p.location?.toLowerCase().includes(q) ||
//           p.description?.toLowerCase().includes(q)
//       );
//     }
//     setFiltered(data);
//     setCurrentPage(0);
//   }, [products, search, catFilter]);

//   const showAlert = (text: string, type: "success" | "danger" = "success") => {
//     setMsg(text); setMsgType(type);
//     setTimeout(() => setMsg(""), 3000);
//   };

//   const handleDelete = async (id: string) => {
//     if (!confirm("Product delete karna chahte ho?")) return;
//     const token = localStorage.getItem("token");
//     try {
//       const res = await fetch(`http://localhost:5000/products/${id}`, {
//         method: "DELETE",
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (!res.ok) throw new Error((await res.json()).error);
//       showAlert("Product deleted ✅");
//       fetchProducts();
//     } catch (e: any) { showAlert(e.message, "danger"); }
//   };

//   const handleEditSave = async () => {
//     if (!editProduct) return;
//     setEditSaving(true);
//     const token = localStorage.getItem("token");
//     try {
//       const res = await fetch(`http://localhost:5000/products/${editProduct._id}`, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//         body: JSON.stringify({
//           name:         editProduct.name,
//           price:        Number(editProduct.price),
//           category:     editProduct.category,
//           description:  editProduct.description,
//           stock:        Number(editProduct.stock),
//           unit:         editProduct.unit,
//           location:     editProduct.location,
//           is_available: editProduct.is_available,
//         }),
//       });
//       if (!res.ok) throw new Error((await res.json()).error);
//       showAlert("Product updated ✅");
//       setEditProduct(null);
//       fetchProducts();
//     } catch (e: any) { showAlert(e.message, "danger"); }
//     finally { setEditSaving(false); }
//   };

//   const totalPages     = Math.ceil(filtered.length / itemsPerPage);
//   const indexOfFirst   = currentPage * itemsPerPage;
//   const indexOfLast    = indexOfFirst + itemsPerPage;
//   const currentContent = filtered.slice(indexOfFirst, indexOfLast);

//   return (
//     <>
//       <ASO />
//       <div className="wrapper">
//         <PageSidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
//         <div className={`content ${isSidebarOpen ? "" : "collapsed"}`}>
//           <PageNavbar toggleSidebar={toggleSidebar} />

//           <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
//             <section className="mb-5">
//               <div className="container-fluid px-4">
//                 <div className="row">
//                   <div className="col-md-12 col-sm-12 m-auto">
//                     <div className="card">
//                       <div className="card-body">

//                         {/* Header */}
//                         <h5
//                           className="bg-gradient text-center p-2 fw-bold mb-4"
//                           data-aos="flip-left"
//                           data-aos-easing="ease-out-cubic"
//                           data-aos-duration="1500"
//                         >
//                           <i className="fa fa-product-hunt mx-2 color-success"></i>
//                           Total Products : {products.length}
//                         </h5>

//                         {/* Alert */}
//                         {msg && (
//                           <div style={{
//                             background: msgType === "success" ? "#dcfce7" : "#fee2e2",
//                             color:      msgType === "success" ? "#16a34a" : "#dc2626",
//                             padding: "12px 16px", borderRadius: 10,
//                             marginBottom: 16, fontWeight: 600, fontSize: 13,
//                           }}>
//                             {msg}
//                           </div>
//                         )}

//                         {/* Category Filters */}
//                         <div className="d-flex flex-wrap align-items-center my-4 gap-2">
//                           {CATEGORIES.map((cat) => (
//                             <button
//                               key={cat}
//                               onClick={() => setCatFilter(cat)}
//                               className={`btn btn-sm rounded-pill fw-semibold ${
//                                 catFilter === cat ? "btn-dark" : "btn-outline-secondary"
//                               }`}
//                             >
//                               {cat} ({cat === "All" ? products.length : products.filter((p) => p.category === cat).length})
//                             </button>
//                           ))}
//                         </div>

//                         {/* Search + Refresh */}
//                         <div className="d-flex flex-wrap align-items-center justify-content-between my-4 gap-2 w-100">
//                           <input
//                             type="text"
//                             placeholder="🔍 Product, farmer, location..."
//                             value={search}
//                             onChange={(e) => setSearch(e.target.value)}
//                             className="form-control shadow-sm flex-grow-1 w-75"
//                           />
//                           <button onClick={fetchProducts} className="btn btn-success shadow btn-sm py-2">
//                             🔄 Refresh
//                           </button>
//                           <span className="text-muted fw-semibold fs-6">
//                             {filtered.length} / {products.length} products
//                           </span>
//                         </div>

//                         {/* Table */}
//                         {loading ? (
//                           <div className="text-center my-3 fw-semibold fs-6 text-muted">Loading...</div>
//                         ) : (
//                           <div style={{ overflowX: "auto" }}>
//                             <table className="table table-bordered table-hover">
//                               <thead>
//                                 <tr className="text-center bg-gradient">
//                                   {["#","Image","Product","Farmer Name","Role","Category","Price","Stock","Location","Status","Actions"].map((h) => (
//                                     <th className="text-dark" key={h}>{h}</th>
//                                   ))}
//                                 </tr>
//                               </thead>
//                               <tbody>
//                                 {currentContent.length === 0 ? (
//                                   <tr>
//                                     <td colSpan={11} className="text-center fs-6 text-muted">
//                                       📭 Koi product nahi mila
//                                     </td>
//                                   </tr>
//                                 ) : currentContent.map((p: any, i) => (
//                                   <tr key={p._id} className="text-center align-middle">
//                                     <td>{indexOfFirst + i + 1}</td>

//                                     <td>
//                                       {p.image_url ? (
//                                         <img
//                                           src={p.image_url} alt={p.name}
//                                           className="img-fluid rounded"
//                                           style={{ width: 60, height: 60, objectFit: "cover", cursor: "pointer" }}
//                                           onClick={() => setViewProduct(p)}
//                                         />
//                                       ) : <span className="text-muted">📦</span>}
//                                     </td>

//                                     <td>
//                                       <div className="fw-bold" style={{ fontSize: 13 }}>{p.name}</div>
//                                       <div className="text-muted" style={{ fontSize: 11 }}>
//                                         {p.description?.slice(0, 30)}{p.description?.length > 30 ? "..." : ""}
//                                       </div>
//                                     </td>

//                                     <td className="text-muted fw-semibold" style={{ fontSize: 13 }}>
//                                       {p.farmer_name || "—"}
//                                     </td>

//                                     {/* ✅ Role — backend se aata hai ab */}
//                                     <td>
//                                       <span className={`badge ${roleBadge[p.role] ?? "bg-secondary"}`}>
//                                         {p.role || "unknown"}
//                                       </span>
//                                     </td>

//                                     <td>
//                                       <span style={{
//                                         background: catColors[p.category]?.[0] ?? "#f3f4f6",
//                                         color:      catColors[p.category]?.[1] ?? "#374151",
//                                         padding: "4px 10px", borderRadius: 20,
//                                         fontSize: 12, fontWeight: 600,
//                                       }}>
//                                         {p.category || "—"}
//                                       </span>
//                                     </td>

//                                     <td className="fs-6">₹{p.price}/{p.unit}</td>

//                                     <td>
//                                       <span style={{
//                                         color: p.stock === 0 ? "#dc2626" : p.stock < 10 ? "#d97706" : "#16a34a",
//                                         fontWeight: 700,
//                                       }}>
//                                         {p.stock} {p.unit}
//                                       </span>
//                                     </td>

//                                     <td style={{ fontSize: 13 }}>{p.location || "—"}</td>

//                                     <td>
//                                       <span style={{
//                                         background: p.is_available ? "#dcfce7" : "#fee2e2",
//                                         color:      p.is_available ? "#16a34a" : "#dc2626",
//                                         padding: "4px 10px", borderRadius: 20,
//                                         fontSize: 11, fontWeight: 700,
//                                       }}>
//                                         {p.is_available ? "Available" : "Unavailable"}
//                                       </span>
//                                     </td>

//                                     <td>
//                                       <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
//                                         <button onClick={() => setViewProduct(p)} className="btn btn-sm shadow px-2 py-1" title="View">👁️</button>
//                                         <button onClick={() => setEditProduct({ ...p })} className="btn btn-sm shadow px-2 py-1" title="Edit">✏️</button>
//                                         <button onClick={() => handleDelete(p._id)} className="btn btn-sm shadow px-2 py-1" title="Delete">🗑️</button>
//                                       </div>
//                                     </td>
//                                   </tr>
//                                 ))}
//                               </tbody>
//                             </table>
//                           </div>
//                         )}

//                         {/* Pagination */}
//                         <Pagination
//                           currentPage={currentPage}
//                           totalPages={totalPages}
//                           handlePrevPage={() => setCurrentPage((p) => Math.max(p - 1, 0))}
//                           handleNextPage={() => setCurrentPage((p) => Math.min(p + 1, totalPages - 1))}
//                         />

//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </section>
//             <PageFooter />
//           </div>
//         </div>
//       </div>

//       {/* ══════════════════════════════════════
//           VIEW PRODUCT MODAL  ✅ Improved
//       ══════════════════════════════════════ */}
//       {viewProduct && (
//         <div
//           className="modal fade show d-block"
//           style={{ background: "rgba(0,0,0,0.55)" }}
//           onClick={() => setViewProduct(null)}
//         >
//           <div
//             className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
//             onClick={(e) => e.stopPropagation()}
//           >
//             <div className="modal-content">
//               <div className="modal-header">
//                 <h5 className="modal-title fw-bold">🧾 Product Details</h5>
//                 <button className="btn-close" onClick={() => setViewProduct(null)} />
//               </div>

//               <div className="modal-body p-4">
//                 {/* Top: image + name + badges */}
//                 <div className="d-flex gap-4 align-items-start mb-4 flex-wrap">
//                   <div>
//                     {viewProduct.image_url ? (
//                       <img
//                         src={viewProduct.image_url} alt={viewProduct.name}
//                         className="rounded shadow"
//                         style={{ width: 120, height: 120, objectFit: "cover" }}
//                       />
//                     ) : (
//                       <div className="rounded shadow d-flex align-items-center justify-content-center bg-light text-muted"
//                         style={{ width: 120, height: 120, fontSize: 40 }}>
//                         📦
//                       </div>
//                     )}
//                   </div>

//                   <div className="flex-grow-1">
//                     <h4 className="fw-bold mb-2">{viewProduct.name}</h4>
//                     <div className="d-flex flex-wrap gap-2 mb-2">
//                       <span style={{
//                         background: catColors[viewProduct.category]?.[0] ?? "#f3f4f6",
//                         color:      catColors[viewProduct.category]?.[1] ?? "#374151",
//                         padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
//                       }}>
//                         {viewProduct.category || "—"}
//                       </span>
//                       {/* ✅ Role badge in view modal */}
//                       <span className={`badge ${roleBadge[viewProduct.role] ?? "bg-secondary"}`}>
//                         {viewProduct.role || "unknown"}
//                       </span>
//                       <span className={`badge ${viewProduct.is_available ? "bg-success" : "bg-danger"}`}>
//                         {viewProduct.is_available ? "Available" : "Unavailable"}
//                       </span>
//                     </div>
//                     {viewProduct.description && (
//                       <p className="text-muted mb-0" style={{ fontSize: 13 }}>
//                         {viewProduct.description}
//                       </p>
//                     )}
//                   </div>
//                 </div>

//                 {/* Detail cards grid */}
//                 <div style={{
//                   display: "grid",
//                   gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
//                   gap: 12,
//                 }}>
//                   {[
//                     { label: "Product ID",  value: viewProduct._id,                                  icon: "🆔" },
//                     { label: "Farmer Name", value: viewProduct.farmer_name || "—",                   icon: "👨‍🌾" },
//                     { label: "Role",        value: viewProduct.role || "unknown",                    icon: "🏷️" },
//                     { label: "Price",       value: `₹${viewProduct.price} / ${viewProduct.unit}`,   icon: "💰" },
//                     {
//                       label: "Stock",
//                       value: `${viewProduct.stock} ${viewProduct.unit}`,
//                       icon: "📦",
//                       valueColor:
//                         viewProduct.stock === 0 ? "#dc2626" :
//                         viewProduct.stock < 10  ? "#d97706" : "#16a34a",
//                     },
//                     { label: "Location",   value: viewProduct.location || "—",                      icon: "📍" },
//                     { label: "Unit",       value: viewProduct.unit || "—",                           icon: "⚖️" },
//                     {
//                       label: "Created At",
//                       value: viewProduct.createdAt
//                         ? new Date(viewProduct.createdAt).toLocaleDateString("en-IN", {
//                             day: "2-digit", month: "short", year: "numeric",
//                           })
//                         : "—",
//                       icon: "📅",
//                     },
//                     {
//                       label: "Updated At",
//                       value: viewProduct.updatedAt
//                         ? new Date(viewProduct.updatedAt).toLocaleDateString("en-IN", {
//                             day: "2-digit", month: "short", year: "numeric",
//                           })
//                         : "—",
//                       icon: "🔄",
//                     },
//                   ].map((item) => (
//                     <div key={item.label} style={{
//                       background: "#f8fafc", borderRadius: 10,
//                       padding: "10px 14px", border: "1px solid #e2e8f0",
//                     }}>
//                       <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 3 }}>
//                         {item.icon} {item.label}
//                       </div>
//                       <div style={{
//                         fontSize: 13, fontWeight: 700,
//                         color: (item as any).valueColor || "#1e293b",
//                         wordBreak: "break-all",
//                       }}>
//                         {item.value}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               <div className="modal-footer">
//                 <button
//                   className="btn btn-primary btn-sm"
//                   onClick={() => { setEditProduct({ ...viewProduct }); setViewProduct(null); }}
//                 >
//                   ✏️ Edit
//                 </button>
//                 <button className="btn btn-secondary btn-sm" onClick={() => setViewProduct(null)}>
//                   Close
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ══════════════════════════════════════
//           EDIT PRODUCT MODAL  ✅ More fields
//       ══════════════════════════════════════ */}
//       {editProduct && (
//         <div
//           className="modal fade show d-block"
//           style={{ background: "rgba(0,0,0,0.5)" }}
//           onClick={() => setEditProduct(null)}
//         >
//           <div
//             className="modal-dialog modal-md modal-dialog-centered"
//             onClick={(e) => e.stopPropagation()}
//           >
//             <div className="modal-content">
//               <div className="modal-header">
//                 <h5 className="modal-title fw-bold">✏️ Edit Product</h5>
//                 <button className="btn-close" onClick={() => setEditProduct(null)} />
//               </div>

//               <div className="modal-body">
//                 <label className="form-label fw-semibold">Product Name</label>
//                 <input
//                   className="form-control mb-3"
//                   placeholder="Product Name"
//                   value={editProduct.name || ""}
//                   onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
//                 />

//                 <div className="row g-2 mb-3">
//                   <div className="col-6">
//                     <label className="form-label fw-semibold">Price (₹)</label>
//                     <input
//                       type="number" className="form-control"
//                       value={editProduct.price || ""}
//                       onChange={(e) => setEditProduct({ ...editProduct, price: Number(e.target.value) })}
//                     />
//                   </div>
//                   <div className="col-6">
//                     <label className="form-label fw-semibold">Stock</label>
//                     <input
//                       type="number" className="form-control"
//                       value={editProduct.stock || 0}
//                       onChange={(e) => setEditProduct({ ...editProduct, stock: Number(e.target.value) })}
//                     />
//                   </div>
//                 </div>

//                 <label className="form-label fw-semibold">Category</label>
//                 <select
//                   className="form-select mb-3"
//                   value={editProduct.category || ""}
//                   onChange={(e) => setEditProduct({ ...editProduct, category: e.target.value })}
//                 >
//                   {CATEGORIES.filter((c) => c !== "All").map((c) => (
//                     <option key={c} value={c}>{c}</option>
//                   ))}
//                 </select>

//                 <label className="form-label fw-semibold">Location</label>
//                 <input
//                   className="form-control mb-3"
//                   placeholder="Location"
//                   value={editProduct.location || ""}
//                   onChange={(e) => setEditProduct({ ...editProduct, location: e.target.value })}
//                 />

//                 <label className="form-label fw-semibold">Description</label>
//                 <textarea
//                   className="form-control mb-3" rows={3}
//                   placeholder="Description"
//                   value={editProduct.description || ""}
//                   onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })}
//                 />

//                 <div className="form-check form-switch">
//                   <input
//                     className="form-check-input" type="checkbox"
//                     id="isAvailableSwitch"
//                     checked={!!editProduct.is_available}
//                     onChange={(e) => setEditProduct({ ...editProduct, is_available: e.target.checked })}
//                   />
//                   <label className="form-check-label fw-semibold" htmlFor="isAvailableSwitch">
//                     Available
//                   </label>
//                 </div>
//               </div>

//               <div className="modal-footer">
//                 <button
//                   className="btn btn-success btn-sm"
//                   onClick={handleEditSave}
//                   disabled={editSaving}
//                 >
//                   {editSaving ? "Saving..." : "💾 Save"}
//                 </button>
//                 <button className="btn btn-secondary btn-sm" onClick={() => setEditProduct(null)}>
//                   Cancel
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageNavbar from "../Sidebar/Navbar/PageNavbar";
import PageSidebar from "../Sidebar/Sidebar/PageSidebar";
import ASO from "../AOS/AOS";
import Pagination from "../AOS/Pagination";

const CATEGORIES = ["All", "Vegetables", "Fruits", "Grains", "Dairy", "Other"];

const catColors: Record<string, [string, string]> = {
  Vegetables: ["#f0fdf4", "#16a34a"],
  Fruits:     ["#fef3c7", "#d97706"],
  Grains:     ["#fef9c3", "#a16207"],
  Dairy:      ["#eff6ff", "#1d4ed8"],
  Other:      ["#f3f4f6", "#374151"],
};

const statusStyle: Record<string, { bg: string; color: string }> = {
  pending:   { bg: "#fef9c3", color: "#a16207" },
  confirmed: { bg: "#dcfce7", color: "#16a34a" },
  shipped:   { bg: "#bfdbfe", color: "#1d4ed8" },
  delivered: { bg: "#d1fae5", color: "#15803d" },
  cancelled: { bg: "#fee2e2", color: "#dc2626" },
};

const roleStyle: Record<string, { bg: string; color: string }> = {
  farmer:  { bg: "#dcfce7", color: "#16a34a" },
  agent:   { bg: "#fef9c3", color: "#a16207" },
  buyer:   { bg: "#bfdbfe", color: "#1d4ed8" },
  admin:   { bg: "#fee2e2", color: "#dc2626" },
  default: { bg: "#f3f4f6", color: "#374151" },
};

export default function AdminProducts() {
  const router = useRouter();

  // Sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen((v) => !v);

  // Data
  const [products, setProducts]     = useState<any[]>([]);
  const [filtered, setFiltered]     = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);

  // Filters
  const [search, setSearch]         = useState("");
  const [catFilter, setCatFilter]   = useState("All");

  // Alert
  const [msg, setMsg]               = useState("");
  const [msgType, setMsgType]       = useState<"success" | "danger">("success");

  // Modals
  const [viewProduct, setViewProduct]   = useState<any>(null);
  const [editProduct, setEditProduct]   = useState<any>(null);
  const [editSaving, setEditSaving]     = useState(false);

  // Pagination
  const [currentPage, setCurrentPage]   = useState(0);
  const itemsPerPage = 5;

  /* ─── Fetch ─────────────────────────────────────── */
  const fetchProducts = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res  = await fetch("http://localhost:5000/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.ok ? await res.json() : [];
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  /* ─── Auth check ─────────────────────────────────── */
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.push("/AdminLogin"); return; }
    const u = JSON.parse(stored);
    if (u.role !== "admin") { router.push("/"); return; }
    fetchProducts();
  }, []);

  /* ─── Filter ─────────────────────────────────────── */
  useEffect(() => {
    let data = [...products];
    if (catFilter !== "All") data = data.filter((p) => p.category === catFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.farmer_name?.toLowerCase().includes(q) ||
          p.location?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }
    setFiltered(data);
    setCurrentPage(0);
  }, [products, search, catFilter]);

  /* ─── Alert ──────────────────────────────────────── */
  const showAlert = (text: string, type: "success" | "danger" = "success") => {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => setMsg(""), 3500);
  };

  /* ─── Delete ─────────────────────────────────────── */
  const handleDelete = async (id: string) => {
    if (!confirm("Is product ko delete karna chahte ho?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).error);
      showAlert("Product deleted ✅");
      fetchProducts();
    } catch (e: any) {
      showAlert(e.message, "danger");
    }
  };

  /* ─── Edit Save ──────────────────────────────────── */
  const handleEditSave = async () => {
    if (!editProduct) return;
    setEditSaving(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/products/${editProduct._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name:         editProduct.name,
          price:        Number(editProduct.price),
          category:     editProduct.category,
          description:  editProduct.description,
          stock:        Number(editProduct.stock),
          unit:         editProduct.unit,
          location:     editProduct.location,
          is_available: editProduct.is_available,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      showAlert("Product updated ✅");
      setEditProduct(null);
      fetchProducts();
    } catch (e: any) {
      showAlert(e.message, "danger");
    } finally {
      setEditSaving(false);
    }
  };

  /* ─── Pagination ─────────────────────────────────── */
  const totalPages      = Math.ceil(filtered.length / itemsPerPage);
  const indexOfLast     = (currentPage + 1) * itemsPerPage;
  const indexOfFirst    = indexOfLast - itemsPerPage;
  const currentContent  = filtered.slice(indexOfFirst, indexOfLast);

  /* ─── Role badge helper ──────────────────────────── */
  const getRoleStyle = (role: string) =>
    roleStyle[role?.toLowerCase()] ?? roleStyle.default;

  /* ══════════════ RENDER ══════════════ */
  return (
    <>
      <ASO />
      <div className="wrapper">
        <PageSidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        <div className={`content ${isSidebarOpen ? "" : "collapsed"}`}>
          <PageNavbar toggleSidebar={toggleSidebar} />

          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
            <section className="mb-5">
              <div className="container-fluid px-4">
                <div className="row">
                  <div className="col-md-12 col-sm-12 m-auto">
                    <div className="card">
                      <div className="card-body">

                        {/* ── Page Header ── */}
                        <h5
                          className="bg-gradient text-center p-2 fw-bold mb-4"
                          data-aos="flip-left"
                          data-aos-easing="ease-out-cubic"
                          data-aos-duration="1500"
                        >
                          <i className="fa fa-product-hunt mx-2 color-success"></i>
                          Total Products : {products.length}
                        </h5>

                        {/* ── Alert ── */}
                        {msg && (
                          <div
                            style={{
                              background: msgType === "success" ? "#dcfce7" : "#fee2e2",
                              color:      msgType === "success" ? "#16a34a" : "#dc2626",
                              padding: "12px 16px",
                              borderRadius: 10,
                              marginBottom: 16,
                              fontWeight: 600,
                              fontSize: 13,
                            }}
                          >
                            {msg}
                          </div>
                        )}

                        {/* ── Category filters ── */}
                        <div className="d-flex flex-wrap align-items-center my-4 gap-2">
                          {CATEGORIES.map((cat) => (
                            <button
                              key={cat}
                              onClick={() => setCatFilter(cat)}
                              className={`btn btn-sm rounded-pill fw-semibold ${
                                catFilter === cat ? "btn-dark" : "btn-outline-secondary"
                              }`}
                            >
                              {cat} (
                              {cat === "All"
                                ? products.length
                                : products.filter((p) => p.category === cat).length}
                              )
                            </button>
                          ))}
                        </div>

                        {/* ── Search + Refresh ── */}
                        <div className="d-flex flex-wrap align-items-center justify-content-between my-4 gap-2 w-100">
                          <input
                            type="text"
                            placeholder="🔍 Product, farmer, location..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="form-control shadow-sm flex-grow-1"
                            style={{ maxWidth: 400 }}
                          />
                          <button
                            onClick={fetchProducts}
                            className="btn btn-success shadow btn-sm py-2"
                          >
                            🔄 Refresh
                          </button>
                          <span className="text-muted fw-semibold fs-6">
                            {filtered.length} / {products.length} products
                          </span>
                        </div>

                        {/* ── Table ── */}
                        {loading ? (
                          <div className="text-center my-4 fw-semibold fs-6 text-muted">
                            Loading...
                          </div>
                        ) : (
                          <div style={{ overflowX: "auto" }}>
                            <table className="table table-bordered table-hover">
                              <thead>
                                <tr className="text-center bg-gradient">
                                  {[
                                    "#",
                                    "Image",
                                    "Product",
                                    "Farmer Name",
                                    "Role",
                                    "Category",
                                    "Price",
                                    "Stock",
                                    "Location",
                                    "Available",
                                    "Actions",
                                  ].map((h) => (
                                    <th className="text-dark" key={h}>
                                      {h}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {currentContent.length === 0 ? (
                                  <tr>
                                    <td colSpan={11} className="text-center fs-6 text-muted py-4">
                                      📭 Koi product nahi mila
                                    </td>
                                  </tr>
                                ) : (
                                  currentContent.map((p: any, i: number) => {
                                    const role =
                                      p.farmer_id?.role || p.role || "farmer";
                                    const rs = getRoleStyle(role);
                                    const [catBg, catColor] =
                                      catColors[p.category] ?? ["#f3f4f6", "#374151"];

                                    return (
                                      <tr key={p._id} className="text-center align-middle">
                                        {/* # */}
                                        <td style={{ fontSize: 13 }}>
                                          {indexOfFirst + i + 1}
                                        </td>

                                        {/* Image */}
                                        <td>
                                          {p.image_url ? (
                                            <img
                                              src={p.image_url}
                                              alt={p.name}
                                              className="rounded"
                                              style={{
                                                width: 56,
                                                height: 56,
                                                objectFit: "cover",
                                                cursor: "pointer",
                                              }}
                                              onClick={() => setViewProduct(p)}
                                            />
                                          ) : (
                                            <span style={{ fontSize: 24 }}>📦</span>
                                          )}
                                        </td>

                                        {/* Product name + description */}
                                        <td style={{ minWidth: 140, textAlign: "left" }}>
                                          <div className="fw-bold" style={{ fontSize: 13 }}>
                                            {p.name}
                                          </div>
                                          <div
                                            className="text-muted"
                                            style={{ fontSize: 11 }}
                                          >
                                            {p.description?.slice(0, 35)}
                                            {p.description?.length > 35 ? "…" : ""}
                                          </div>
                                        </td>

                                        {/* Farmer name */}
                                        <td
                                          className="fw-semibold"
                                          style={{ fontSize: 13, whiteSpace: "nowrap" }}
                                        >
                                          {p.farmer_name || p.farmer_id?.name || "—"}
                                        </td>

                                        {/* Role badge — reads from farmer_id.role (populated) OR p.role */}
                                        <td>
                                          <span
                                            style={{
                                              background: rs.bg,
                                              color: rs.color,
                                              padding: "3px 10px",
                                              borderRadius: 20,
                                              fontSize: 12,
                                              fontWeight: 600,
                                            }}
                                          >
                                            {role}
                                          </span>
                                        </td>

                                        {/* Category */}
                                        <td>
                                          <span
                                            style={{
                                              background: catBg,
                                              color: catColor,
                                              padding: "3px 10px",
                                              borderRadius: 20,
                                              fontSize: 12,
                                              fontWeight: 600,
                                            }}
                                          >
                                            {p.category || "—"}
                                          </span>
                                        </td>

                                        {/* Price */}
                                        <td className="fw-bold" style={{ fontSize: 13 }}>
                                          ₹{p.price}/{p.unit || "kg"}
                                        </td>

                                        {/* Stock */}
                                        <td
                                          style={{
                                            fontSize: 13,
                                            color:
                                              p.stock < 10
                                                ? "#dc2626"
                                                : p.stock < 50
                                                ? "#d97706"
                                                : "#16a34a",
                                            fontWeight: 600,
                                          }}
                                        >
                                          {p.stock}
                                        </td>

                                        {/* Location */}
                                        <td
                                          className="text-muted"
                                          style={{ fontSize: 12 }}
                                        >
                                          {p.location || "—"}
                                        </td>

                                        {/* Available */}
                                        <td>
                                          <span
                                            style={{
                                              background: p.is_available
                                                ? "#dcfce7"
                                                : "#fee2e2",
                                              color: p.is_available
                                                ? "#16a34a"
                                                : "#dc2626",
                                              padding: "3px 10px",
                                              borderRadius: 20,
                                              fontSize: 12,
                                              fontWeight: 600,
                                            }}
                                          >
                                            {p.is_available ? "Yes" : "No"}
                                          </span>
                                        </td>

                                        {/* Actions */}
                                        <td style={{ whiteSpace: "nowrap" }}>
                                          <button
                                            className="btn btn-sm btn-outline-info me-1"
                                            title="View"
                                            onClick={() => setViewProduct(p)}
                                          >
                                            <i className="fa fa-eye" />
                                          </button>
                                          <button
                                            className="btn btn-sm btn-outline-warning me-1"
                                            title="Edit"
                                            onClick={() =>
                                              setEditProduct({ ...p })
                                            }
                                          >
                                            <i className="fa fa-edit" />
                                          </button>
                                          <button
                                            className="btn btn-sm btn-outline-danger"
                                            title="Delete"
                                            onClick={() => handleDelete(p._id)}
                                          >
                                            <i className="fa fa-trash" />
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* ── Pagination ── */}
                        {totalPages > 1 && (
                          <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            handlePrevPage={() =>
                              setCurrentPage((p) => Math.max(p - 1, 0))
                            }
                            handleNextPage={() =>
                              setCurrentPage((p) => Math.min(p + 1, totalPages - 1))
                            }
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* ══════════ VIEW MODAL ══════════ */}
      {viewProduct && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setViewProduct(null)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 28,
              maxWidth: 520,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {viewProduct.image_url && (
              <img
                src={viewProduct.image_url}
                alt={viewProduct.name}
                style={{
                  width: "100%",
                  height: 220,
                  objectFit: "cover",
                  borderRadius: 10,
                  marginBottom: 16,
                }}
              />
            )}
            <h5 className="fw-bold mb-1">{viewProduct.name}</h5>
            <p className="text-muted mb-3" style={{ fontSize: 13 }}>
              {viewProduct.description || "No description"}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13 }}>
              {[
                ["Farmer",   viewProduct.farmer_name || viewProduct.farmer_id?.name || "—"],
                ["Role",     viewProduct.farmer_id?.role || viewProduct.role || "—"],
                ["Category", viewProduct.category || "—"],
                ["Price",    `₹${viewProduct.price} / ${viewProduct.unit || "kg"}`],
                ["Stock",    viewProduct.stock],
                ["Location", viewProduct.location || "—"],
                ["Available",viewProduct.is_available ? "Yes" : "No"],
              ].map(([label, val]) => (
                <div key={label as string}>
                  <div style={{ color: "#888", fontSize: 11 }}>{label}</div>
                  <div className="fw-semibold">{val as string}</div>
                </div>
              ))}
            </div>
            <button
              className="btn btn-secondary w-100 mt-4"
              onClick={() => setViewProduct(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ══════════ EDIT MODAL ══════════ */}
      {editProduct && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setEditProduct(null)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 28,
              maxWidth: 540,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h5 className="fw-bold mb-4">Edit Product</h5>

            <div className="row g-3">
              {/* Name */}
              <div className="col-12">
                <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
                  Product Name
                </label>
                <input
                  className="form-control"
                  value={editProduct.name}
                  onChange={(e) =>
                    setEditProduct({ ...editProduct, name: e.target.value })
                  }
                />
              </div>

              {/* Price + Stock */}
              <div className="col-6">
                <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
                  Price (₹)
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={editProduct.price}
                  onChange={(e) =>
                    setEditProduct({ ...editProduct, price: e.target.value })
                  }
                />
              </div>
              <div className="col-6">
                <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
                  Stock
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={editProduct.stock}
                  onChange={(e) =>
                    setEditProduct({ ...editProduct, stock: e.target.value })
                  }
                />
              </div>

              {/* Category + Unit */}
              <div className="col-6">
                <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
                  Category
                </label>
                <select
                  className="form-select"
                  value={editProduct.category}
                  onChange={(e) =>
                    setEditProduct({ ...editProduct, category: e.target.value })
                  }
                >
                  {CATEGORIES.filter((c) => c !== "All").map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="col-6">
                <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
                  Unit
                </label>
                <select
                  className="form-select"
                  value={editProduct.unit}
                  onChange={(e) =>
                    setEditProduct({ ...editProduct, unit: e.target.value })
                  }
                >
                  {["kg", "g", "litre", "dozen", "piece", "quintal"].map((u) => (
                    <option key={u}>{u}</option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div className="col-12">
                <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
                  Location
                </label>
                <input
                  className="form-control"
                  value={editProduct.location}
                  onChange={(e) =>
                    setEditProduct({ ...editProduct, location: e.target.value })
                  }
                />
              </div>

              {/* Description */}
              <div className="col-12">
                <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
                  Description
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={editProduct.description}
                  onChange={(e) =>
                    setEditProduct({ ...editProduct, description: e.target.value })
                  }
                />
              </div>

              {/* Available toggle */}
              <div className="col-12 d-flex align-items-center gap-2">
                <input
                  type="checkbox"
                  id="availChk"
                  checked={editProduct.is_available}
                  onChange={(e) =>
                    setEditProduct({ ...editProduct, is_available: e.target.checked })
                  }
                />
                <label htmlFor="availChk" className="fw-semibold" style={{ fontSize: 13 }}>
                  Available for sale
                </label>
              </div>
            </div>

            <div className="d-flex gap-2 mt-4">
              <button
                className="btn btn-success flex-grow-1"
                onClick={handleEditSave}
                disabled={editSaving}
              >
                {editSaving ? "Saving..." : "Save Changes"}
              </button>
              <button
                className="btn btn-outline-secondary"
                onClick={() => setEditProduct(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}