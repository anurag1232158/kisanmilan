"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
const STATUSES = ["All","pending","confirmed","shipped","delivered","cancelled"];

export default function AdminOrders() {
  const router   = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [orders,   setOrders]   = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [msg,  setMsg]  = useState("");
  const [msgType, setMsgType] = useState<"success"|"danger">("success");
  const [viewOrder, setViewOrder] = useState<any>(null); // ✅ FIX: viewUser → viewOrder
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.push("/AdminLogin"); return; }
    const u = JSON.parse(stored);
    if (u.role !== "admin") { router.push("/"); return; }
    fetchOrders();
  }, []);

  useEffect(() => {
    let data = [...orders];
    if (statusFilter !== "All")
      data = data.filter(o => o.status?.toLowerCase() === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(o =>
        o.buyer_name?.toLowerCase().includes(q)   ||
        o.product_name?.toLowerCase().includes(q) ||
        o.farmer_name?.toLowerCase().includes(q)  ||
        o.delivery_address?.toLowerCase().includes(q)
      );
    }
    setFiltered(data);
  }, [orders, search, statusFilter]);
  const fetchOrders = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/order", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.ok ? await res.json() : [];
      setOrders(Array.isArray(data) ? data : []);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };
  const showAlert = (text:string, type:"success"|"danger"="success") => {
    setMsg(text); setMsgType(type);
    setTimeout(() => setMsg(""), 3000);
  };
  const handleStatusChange = async (id:string, status:string) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/order/${id}`, {
        method: "PUT",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      showAlert(`Status updated: ${status} ✅`);
      fetchOrders();
    } catch(e:any) { showAlert(e.message, "danger"); }
  };
  const handleDelete = async (id:string) => {
    if (!confirm("Order delete karna chahte ho?")) return;
    const token = localStorage.getItem("token");
    try {
      await fetch(`http://localhost:5000/order/${id}`, {
        method: "DELETE", headers: { Authorization:`Bearer ${token}` },
      });
      showAlert("Order deleted ✅");
      fetchOrders();
    } catch(e:any) { showAlert(e.message, "danger"); }
  };
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/AdminLogin");
  };
  const navLinks = [
    { href:"/AdminDashboard", icon:"📊", label:"Dashboard" },
    { href:"/AdminUsers",     icon:"👥", label:"Users"     },
    { href:"/AdminProducts",  icon:"📦", label:"Products"  },
    { href:"/AdminOrders",    icon:"🧾", label:"Orders"    },
    { href:"/AdminRates",     icon:"📈", label:"Rates"     },
  ];
  const th: React.CSSProperties = {
    padding:"10px 14px", fontSize:11, fontWeight:700,
    color:"#64748b", background:"#f8fafc", textAlign:"left",
  };
  const td: React.CSSProperties = {
    padding:"10px 14px", fontSize:13,
    borderTop:"1px solid #f1f5f9", verticalAlign:"middle",
  };
  const statusColor: any = {
    pending:   { bg:"#fef3c7", color:"#b45309" },
    confirmed: { bg:"#dbeafe", color:"#1d4ed8" },
    shipped:   { bg:"#f0fdf4", color:"#15803d" },
    delivered: { bg:"#dcfce7", color:"#16a34a" },
    cancelled: { bg:"#fee2e2", color:"#dc2626" },
  };
  const statusCount = (s:string) => s === "All" ? orders.length : orders.filter(o => o.status?.toLowerCase() === s).length;

  return (
    <div style={{ display:"flex", minHeight:"100vh", fontFamily:"'Baloo 2', cursive", background:"#f1f5f9" }}>

      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? 220 : 62, background:"#0f172a",
        display:"flex", flexDirection:"column",
        transition:"width 0.25s", overflow:"hidden",
        position:"sticky", top:0, height:"100vh", flexShrink:0,
      }}>
        <div style={{ padding:"16px 14px", borderBottom:"1px solid #1e293b",
          display:"flex", alignItems:"center", gap:10, whiteSpace:"nowrap" }}>
          <span style={{ fontSize:22, flexShrink:0 }}>🛡️</span>
          {sidebarOpen && <span style={{ fontWeight:800, fontSize:14, color:"#fbbf24" }}>kisanmilan</span>}
        </div>
        <nav style={{ flex:1, paddingTop:8 }}>
          {navLinks.map(item => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} style={{
                display:"flex", alignItems:"center", gap:12,
                padding:"12px 18px",
                color: active ? "#fbbf24" : "#94a3b8",
                textDecoration:"none", fontSize:13, fontWeight:500,
                background: active ? "#1e293b" : "transparent",
                borderLeft: active ? "3px solid #fbbf24" : "3px solid transparent",
                whiteSpace:"nowrap",
              }}>
                <span style={{ fontSize:17, flexShrink:0 }}>{item.icon}</span>
                {sidebarOpen && item.label}
              </Link>
            );
          })}
        </nav>
        <button onClick={logout} style={{
          margin:10, padding:"10px 14px",
          background:"rgba(239,68,68,0.1)", color:"#ef4444",
          border:"1px solid rgba(239,68,68,0.3)", borderRadius:8,
          cursor:"pointer", fontSize:13, fontWeight:600,
          display:"flex", alignItems:"center", gap:8, whiteSpace:"nowrap",
        }}>
          <span style={{ flexShrink:0 }}>🚪</span>
          {sidebarOpen && "Logout"}
        </button>
      </aside>

      {/* Main */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
        <header style={{
          background:"white", padding:"0 24px", height:56,
          display:"flex", alignItems:"center", justifyContent:"space-between",
          borderBottom:"1px solid #e2e8f0",
          position:"sticky", top:0, zIndex:10,
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <button onClick={() => setSidebarOpen(o => !o)} style={{
              background:"none", border:"none", cursor:"pointer",
              fontSize:20, color:"#64748b", padding:4 }}>☰</button>
            <span style={{ fontWeight:700, color:"#1e293b", fontSize:15 }}>
              🧾 Orders Management
            </span>
          </div>
          <span style={{ background:"#fbbf24", color:"#1e293b",
            borderRadius:20, padding:"3px 12px", fontWeight:700, fontSize:12 }}>🛡️ Admin</span>
        </header>

        <main style={{ padding:24, flex:1 }}>
          {msg && (
            <div style={{
              background: msgType==="success" ? "#dcfce7" : "#fee2e2",
              color:       msgType==="success" ? "#16a34a" : "#dc2626",
              padding:"12px 16px", borderRadius:10, marginBottom:16,
              fontWeight:600, fontSize:13,
            }}>{msg}</div>
          )}

          {/* Status cards */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:18 }}>
            {[
              { s:"All",       color:"#6366f1", icon:"📋" },
              { s:"pending",   color:"#d97706", icon:"⏳" },
              { s:"confirmed", color:"#0284c7", icon:"✅" },
              { s:"delivered", color:"#16a34a", icon:"📦" },
              { s:"cancelled", color:"#dc2626", icon:"❌" },
            ].map(item => (
              <div key={item.s} onClick={() => setStatusFilter(item.s)} style={{
                background:"white", borderRadius:12, padding:"14px 16px",
                borderLeft:`4px solid ${item.color}`,
                boxShadow:"0 1px 4px rgba(0,0,0,0.06)", cursor:"pointer",
                outline: statusFilter===item.s ? `2px solid ${item.color}` : "none",
              }}>
                <div style={{ fontSize:20 }}>{item.icon}</div>
                <div style={{ fontSize:22, fontWeight:800, color:item.color, lineHeight:1, marginTop:4 }}>
                  {statusCount(item.s)}
                </div>
                <div style={{ fontSize:11, color:"#64748b", marginTop:4, fontWeight:600, textTransform:"capitalize" }}>
                  {item.s}
                </div>
              </div>
            ))}
          </div>

          {/* Search bar */}
          <div style={{
            background:"white", borderRadius:12, padding:"14px 18px",
            boxShadow:"0 1px 4px rgba(0,0,0,0.06)", marginBottom:16,
            display:"flex", gap:12, alignItems:"center",
          }}>
            <input
              placeholder="🔍 Buyer, product, farmer, address..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex:1, padding:"8px 12px",
                border:"1px solid #e2e8f0", borderRadius:8, fontSize:13, outline:"none" }}
            />
            <button onClick={fetchOrders} style={{
              padding:"8px 14px", borderRadius:8, fontSize:12, fontWeight:600,
              cursor:"pointer", background:"#f0fdf4", color:"#16a34a",
              border:"1px solid #bbf7d0",
            }}>🔄 Refresh</button>
            <span style={{ fontSize:12, color:"#94a3b8", whiteSpace:"nowrap" }}>
              {filtered.length} / {orders.length}
            </span>
          </div>

          {/* Table */}
          <div style={{ background:"white", borderRadius:12, overflow:"hidden",
            boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
            {loading ? (
              <div style={{ textAlign:"center", padding:60, color:"#64748b" }}>Loading...</div>
            ) : (
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr>
                      {["#","Buyer","Product","Qty / Unit","Total","Payment","Status","Date","Actions"].map(h =>
                        <th key={h} style={th}>{h}</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={9} style={{ ...td, textAlign:"center", color:"#94a3b8", padding:40 }}>
                        📭 Koi order nahi mila
                      </td></tr>
                    ) : filtered.map((o:any, i) => (
                      <tr key={o._id} style={{ background: i%2===0 ? "white" : "#fafafa" }}>
                        <td style={{ ...td, color:"#94a3b8", fontWeight:600 }}>{i+1}</td>

                        {/* Buyer info */}
                        <td style={td}>
                          <div style={{ fontWeight:600, fontSize:13 }}>{o.buyer_name || "—"}</div>
                          <div style={{ fontSize:11, color:"#94a3b8" }}>{o.buyer_phone || ""}</div>
                        </td>

                        {/* Product */}
                        <td style={{ ...td, fontSize:12 }}>
                          <div style={{ fontWeight:600 }}>{o.product_name || "—"}</div>
                          <div style={{ fontSize:11, color:"#94a3b8" }}>by {o.farmer_name || "—"}</div>
                        </td>

                        {/* Qty */}
                        <td style={td}>{o.quantity} {o.unit}</td>

                        {/* Total */}
                        <td style={{ ...td, fontWeight:700, color:"#16a34a" }}>
                          {o.total_price ? `₹${o.total_price}` : "—"}
                        </td>

                        {/* Payment method + status */}
                        <td style={{ ...td, fontSize:11 }}>
                          <div>{o.payment_method || "—"}</div>
                          <div style={{
                            color: o.payment_status==="completed" ? "#16a34a" : "#d97706",
                            fontWeight:600
                          }}>{o.payment_status || "—"}</div>
                        </td>

                        {/* Status dropdown */}
                        <td style={td}>
                          <select
                            value={o.status || "pending"}
                            onChange={e => handleStatusChange(o._id, e.target.value)}
                            style={{
                              padding:"4px 8px", borderRadius:6, fontSize:11, fontWeight:600,
                              cursor:"pointer", border:"1px solid #e2e8f0",
                              background: statusColor[o.status?.toLowerCase()]?.bg || "#f3f4f6",
                              color:      statusColor[o.status?.toLowerCase()]?.color || "#374151",
                            }}>
                            {["pending","confirmed","shipped","delivered","cancelled"].map(s =>
                              <option key={s} value={s}>{s}</option>
                            )}
                          </select>
                        </td>

                        {/* Date */}
                        <td style={{ ...td, fontSize:11, color:"#94a3b8" }}>
                          {o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-IN") : "—"}
                        </td>

                        {/* Actions */}
                        <td style={td}>
                          <div style={{ display:"flex", gap:6 }}>
                            {/* ✅ FIX: setViewDetails(u) → setViewOrder(o) */}
                            <button onClick={() => setViewOrder(o)} style={{
                              padding:"5px 9px", borderRadius:6, fontSize:12,
                              cursor:"pointer", background:"#f0f9ff",
                              color:"#0284c7", border:"none", fontWeight:600,
                            }}>👁️</button>
                            <button onClick={() => handleDelete(o._id)} style={{
                              padding:"5px 10px", borderRadius:6, fontSize:11,
                              fontWeight:600, cursor:"pointer",
                              background:"#fee2e2", color:"#dc2626", border:"none",
                            }}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ✅ VIEW ORDER MODAL — poori details */}
      {viewOrder && (
        <div style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,0.55)",
          display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000,
        }} onClick={() => setViewOrder(null)}>
          <div style={{
            background:"white", borderRadius:16, padding:28,
            width:"100%", maxWidth:520,
            boxShadow:"0 20px 60px rgba(0,0,0,0.3)",
            maxHeight:"90vh", overflowY:"auto",
          }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ display:"flex", justifyContent:"space-between",
              alignItems:"center", marginBottom:20 }}>
              <h5 style={{ fontWeight:700, color:"#1e293b", margin:0, fontSize:16 }}>
                🧾 Order Details
              </h5>
              <button onClick={() => setViewOrder(null)} style={{
                background:"none", border:"none", fontSize:20,
                cursor:"pointer", color:"#94a3b8",
              }}>✕</button>
            </div>

            {/* Order ID + Date */}
            <div style={{ background:"#f8fafc", borderRadius:10, padding:"12px 14px", marginBottom:16 }}>
              <div style={{ fontSize:11, color:"#94a3b8", fontWeight:600 }}>ORDER ID</div>
              <div style={{ fontSize:12, fontFamily:"monospace", color:"#1e293b", marginTop:2 }}>
                {viewOrder._id}
              </div>
              <div style={{ fontSize:11, color:"#94a3b8", marginTop:8 }}>
                {viewOrder.createdAt
                  ? new Date(viewOrder.createdAt).toLocaleString("en-IN")
                  : "—"}
              </div>
            </div>

            {/* 2-col grid for sections */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>

              {/* Buyer */}
              <div style={{ background:"#eff6ff", borderRadius:10, padding:"12px 14px" }}>
                <div style={{ fontSize:11, color:"#1d4ed8", fontWeight:700, marginBottom:6 }}>👤 BUYER</div>
                <div style={{ fontSize:13, fontWeight:600, color:"#1e293b" }}>{viewOrder.buyer_name || "—"}</div>
                <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>{viewOrder.buyer_email || "—"}</div>
                <div style={{ fontSize:12, color:"#64748b" }}>{viewOrder.buyer_phone || "—"}</div>
              </div>

              {/* Farmer / Seller */}
              <div style={{ background:"#f0fdf4", borderRadius:10, padding:"12px 14px" }}>
                <div style={{ fontSize:11, color:"#15803d", fontWeight:700, marginBottom:6 }}>🌾 FARMER</div>
                <div style={{ fontSize:13, fontWeight:600, color:"#1e293b" }}>{viewOrder.farmer_name || "—"}</div>
                <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>{viewOrder.farmer_phone || "—"}</div>
              </div>
            </div>

            {/* Product */}
            <div style={{ background:"#fef3c7", borderRadius:10, padding:"12px 14px", marginBottom:12 }}>
              <div style={{ fontSize:11, color:"#b45309", fontWeight:700, marginBottom:6 }}>📦 PRODUCT</div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:"#1e293b" }}>{viewOrder.product_name || "—"}</div>
                  <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>
                    Qty: {viewOrder.quantity} {viewOrder.unit}
                  </div>
                </div>
                <div style={{ fontSize:18, fontWeight:800, color:"#16a34a" }}>
                  ₹{viewOrder.total_price || "—"}
                </div>
              </div>
            </div>

            {/* Payment */}
            <div style={{ background:"#f5f3ff", borderRadius:10, padding:"12px 14px", marginBottom:12 }}>
              <div style={{ fontSize:11, color:"#7c3aed", fontWeight:700, marginBottom:6 }}>💳 PAYMENT</div>
              <div style={{ display:"flex", gap:16 }}>
                <div>
                  <div style={{ fontSize:11, color:"#94a3b8" }}>Method</div>
                  <div style={{ fontSize:13, fontWeight:600 }}>{viewOrder.payment_method || "—"}</div>
                </div>
                <div>
                  <div style={{ fontSize:11, color:"#94a3b8" }}>Status</div>
                  <div style={{ fontSize:13, fontWeight:600,
                    color: viewOrder.payment_status==="completed" ? "#16a34a" : "#d97706" }}>
                    {viewOrder.payment_status || "—"}
                  </div>
                </div>
                {viewOrder.transaction_id && (
                  <div>
                    <div style={{ fontSize:11, color:"#94a3b8" }}>Txn ID</div>
                    <div style={{ fontSize:11, fontFamily:"monospace" }}>{viewOrder.transaction_id}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery address */}
            <div style={{ background:"#f8fafc", borderRadius:10, padding:"12px 14px", marginBottom:16 }}>
              <div style={{ fontSize:11, color:"#94a3b8", fontWeight:700, marginBottom:4 }}>📍 DELIVERY ADDRESS</div>
              <div style={{ fontSize:13, color:"#1e293b" }}>{viewOrder.delivery_address || "—"}</div>
            </div>

            {/* Order status */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span style={{ fontSize:12, color:"#64748b", fontWeight:600 }}>Order Status:</span>
              <span style={{
                padding:"4px 14px", borderRadius:20, fontSize:12, fontWeight:700,
                background: statusColor[viewOrder.status?.toLowerCase()]?.bg || "#f3f4f6",
                color:      statusColor[viewOrder.status?.toLowerCase()]?.color || "#374151",
              }}>
                {viewOrder.status || "pending"}
              </span>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}