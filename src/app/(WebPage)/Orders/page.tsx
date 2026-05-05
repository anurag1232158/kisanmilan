"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API = `${process.env.NEXT_PUBLIC_API_URL}`;

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: string; border: string }> = {
  pending:   { label: "Pending",   color: "#92400e", bg: "#fef3c7", icon: "⏳", border: "#fbbf24" },
  confirmed: { label: "Confirmed", color: "#1e40af", bg: "#dbeafe", icon: "✅", border: "#60a5fa" },
  shipped:   { label: "Shipped",   color: "#5b21b6", bg: "#ede9fe", icon: "🚚", border: "#a78bfa" },
  delivered: { label: "Delivered", color: "#065f46", bg: "#d1fae5", icon: "📦", border: "#34d399" },
  cancelled: { label: "Cancelled", color: "#991b1b", bg: "#fee2e2", icon: "❌", border: "#f87171" },
};

const FILTERS = ["All", "Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"];
const PAGE_SIZE = 5;

export default function MyOrdersPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [msg, setMsg] = useState("");
  const [editOrder, setEditOrder] = useState<any>(null);
  const [editField, setEditField] = useState<"address" | "phone" | null>(null);
  const [newAddress, setNewAddress] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [page, setPage] = useState(1);
  const [viewOrder, setViewOrder] = useState<any>(null); // ← NEW: View modal
  const [deleteId, setDeleteId] = useState<string | null>(null); // ← NEW: Delete confirm

  const showMsg = (text: string) => { setMsg(text); setTimeout(() => setMsg(""), 3000); };

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user") || "null");
    if (!u) { router.push("/Login"); return; }
    setUser(u);
    fetchOrders(u);
  }, []);

  const fetchOrders = async (u: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const uid = u.id || u._id;
      const res = await fetch(`${API}/order?buyer_id=${uid}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setOrders(Array.isArray(data) ? data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async () => {
    if (!cancelId) return;
    setCancelling(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/order/${cancelId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (res.ok) {
        setOrders((prev) => prev.map((o) => o._id === cancelId ? { ...o, status: "cancelled" } : o));
        showMsg("✅ Order cancelled successfully");
      } else {
        showMsg("❌ Could not cancel order");
      }
    } catch {
      showMsg("❌ Network error");
    } finally {
      setCancelling(false);
      setCancelId(null);
    }
  };

  // ── NEW: Delete order permanently ──
  const deleteOrder = async () => {
    if (!deleteId) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/order/${deleteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o._id !== deleteId));
        showMsg("✅ Order deleted successfully");
      } else {
        showMsg("❌ Could not delete order");
      }
    } catch {
      showMsg("❌ Network error");
    } finally {
      setDeleteId(null);
    }
  };

  const saveEdit = async () => {
    if (!editOrder) return;
    setSaving(true);
    let updatedAddress = editOrder.delivery_address || "";

    if (editField === "phone" && newPhone.trim()) {
      if (!/^[6-9]\d{9}$/.test(newPhone.trim())) {
        showMsg("❌ Enter a valid 10-digit phone number");
        setSaving(false);
        return;
      }
      const parts = updatedAddress.split("|");
      if (parts.length >= 3) { parts[2] = ` ${newPhone.trim()}`; updatedAddress = parts.join("|"); }
      else { updatedAddress += ` | ${newPhone.trim()}`; }
    }

    if (editField === "address" && newAddress.trim()) {
      if (newAddress.trim().length < 10) {
        showMsg("❌ Address must be at least 10 characters");
        setSaving(false);
        return;
      }
      const parts = updatedAddress.split("|");
      parts[0] = ` ${newAddress.trim()} `;
      updatedAddress = parts.join("|");
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/order/${editOrder._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ delivery_address: updatedAddress }),
      });
      if (res.ok) {
        setOrders((prev) => prev.map((o) => o._id === editOrder._id ? { ...o, delivery_address: updatedAddress } : o));
        showMsg("✅ Updated successfully!");
        setEditOrder(null);
        setEditField(null);
      } else {
        const d = await res.json();
        showMsg(`❌ ${d.error || "Update failed"}`);
      }
    } catch {
      showMsg("❌ Network error");
    } finally {
      setSaving(false);
    }
  };

  const parseAddress = (raw: string) => {
    if (!raw) return { addr: "—", name: "—", phone: "—" };
    const parts = raw.split("|").map((s) => s.trim());
    return { addr: parts[0] || "—", name: parts[1] || "—", phone: parts[2] || "—" };
  };

  const downloadInvoice = (order: any) => {
    const { addr, name, phone } = parseAddress(order.delivery_address);
    const doc = new jsPDF();
    doc.setFillColor(25, 135, 84);
    doc.rect(0, 0, 210, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("FarmFresh - Order Invoice", 14, 12);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`, 14, 22);
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Order ID: #${order._id?.slice(-10).toUpperCase()}`, 14, 38);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Status: ${STATUS_META[order.status]?.label || order.status}`, 14, 46);
    doc.text(`Date: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}`, 14, 54);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Delivery Details", 14, 66);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Recipient: ${name}`, 14, 74);
    doc.text(`Phone: ${phone}`, 14, 81);
    const splitAddr = doc.splitTextToSize(`Address: ${addr}`, 180);
    doc.text(splitAddr, 14, 88);
    const yStart = 88 + splitAddr.length * 6 + 8;
    autoTable(doc, {
      startY: yStart,
      head: [["Product", "Qty & Unit", "Total Price", "Farmer", "Payment", "Delivery Partner"]],
      body: [[
        order.product_name || "—",
        `${order.quantity} ${order.unit}`,
        `Rs. ${order.total_price?.toLocaleString() || "0"}`,
        order.farmer_name || "—",
        order.payment_method || "—",
        order.dpartner_name || "—",
      ]],
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [25, 135, 84], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [240, 255, 245] },
      margin: { left: 14, right: 14 },
    });
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(25, 135, 84);
    doc.text(`Total Amount: Rs. ${order.total_price?.toLocaleString() || "0"}`, 14, finalY);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text("Thank you for shopping with FarmFresh! For support, contact support@farmfresh.in", 14, finalY + 10);
    doc.save(`Invoice_${order._id?.slice(-10).toUpperCase()}.pdf`);
  };

  // ── NEW: Reorder — go to checkout with existing order data ──
  const reorder = (order: any) => {
    // Store order data in sessionStorage so checkout can pre-fill everything
    sessionStorage.setItem("reorder_data", JSON.stringify({
      orderId:          order._id,
      product_id:       order.product_id,
      product_name:     order.product_name,
      quantity:         order.quantity,
      unit:             order.unit,
      total_price:      order.total_price,
      delivery_address: order.delivery_address,
      farmer_id:        order.seller_id,
    }));
    router.push(`/Checkout?mode=reorder&orderId=${order._id}`);
  };

  const filtered = useMemo(() => {
    setPage(1);
    if (filter === "All") return orders;
    return orders.filter((o) => o.status === filter.toLowerCase());
  }, [orders, filter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const orderCounts = useMemo(() => {
    const counts: Record<string, number> = { All: orders.length };
    FILTERS.slice(1).forEach((f) => {
      counts[f] = orders.filter((o) => o.status === f.toLowerCase()).length;
    });
    return counts;
  }, [orders]);

  if (loading) return (
    <>
   
    </>
  );

  return (
    <div className="bg-light py-4 pt-2">
      <div className="container-fluid">
        {/* HEADER */}
        <div className="bg-success rounded-3 border-bottom shadow-sm text-light">
          <div className="container text-light py-3 d-flex justify-content-between align-items-center">
            <div className="d-flex flex-column text-light">
              <h4 className="mb-0 fw-bold text-dark">📦 My Orders</h4>
              <small className="text-light">{orders.length} total order{orders.length !== 1 ? "s" : ""}</small>
            </div>
            <Link href="/Product" className="btn btn-warning btn-sm px-3" style={{ borderRadius: 8 }}>
              🛒 Shop More
            </Link>
          </div>
        </div>
      </div>

      {/* GLOBAL MESSAGE */}
      {msg && (
        <div className="text-center py-2 fw-semibold mb-0 mx-3"
          style={{ background: msg.startsWith("✅") ? "#d1fae5" : "#fee2e2", color: msg.startsWith("✅") ? "#065f46" : "#991b1b" }}>
          {msg}
        </div>
      )}

      <div className="container py-4 px-0">
        {/* FILTER TABS */}
        <div className="d-flex gap-2 flex-wrap mb-4 pb-2" style={{ overflowX: "auto" }}>
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`btn btn-sm d-flex align-items-center gap-1 flex-shrink-0 fs-6 rounded ${filter === f ? "btn-success" : "btn-outline-secondary"}`}>
              <span>{STATUS_META[f.toLowerCase()]?.icon || "📋"}</span>
              <span>{f}</span>
              {orderCounts[f] > 0 && (
                <span className={`badge rounded-pill ms-1 ${filter === f ? "bg-white text-success" : "bg-secondary"}`} style={{ fontSize: 10 }}>
                  {orderCounts[f]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* EMPTY STATE */}
        {filtered.length === 0 && (
          <div className="text-center py-5">
            <div style={{ fontSize: 72 }}>📭</div>
            <h5 className="mt-3 fw-bold">{filter === "All" ? "No orders yet" : `No ${filter} orders`}</h5>
            <p className="text-muted">Start shopping from our fresh farm products!</p>
            <button className="btn btn-success px-5 py-2 mt-2" style={{ borderRadius: 10 }} onClick={() => router.push("/Product")}>
              🌾 Browse Products
            </button>
          </div>
        )}

        {/* TABLE */}
        {filtered.length > 0 && (
          <div className="card border-0 shadow-sm">
            <div className="table-responsive">
              <table className="table table-bordered table-striped">
                <thead className="table-success">
                  <tr>
                    <th>Order ID</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Delivery Address</th>
                    <th>Contact</th>
                    <th>Farmer</th>
                    <th>Payment</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((order) => {
                    const meta = STATUS_META[order.status] || STATUS_META.pending;
                    const { addr, name, phone } = parseAddress(order.delivery_address);
                    const canEdit = order.status === "pending";
                    return (
                      <tr key={order._id} style={{ borderLeft: `4px solid ${meta.border}` }}>
                        <td>
                          <span className="fw-bold font-monospace fs-7">#{order._id?.slice(-10).toUpperCase()}</span>
                        </td>
                        <td>
                          <div className="fw-semibold fs-7">{order.product_name || "—"}</div>
                        </td>
                        <td>
                          <span className="text-muted fs-7">{order.quantity} {order.unit}</span>
                        </td>
                        <td>
                          <span className="fw-bold text-success fs-7">₹{order.total_price?.toLocaleString()}</span>
                        </td>
                        <td>
                          <span className="badge px-2 py-1 rounded border"
                            style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, fontSize: 11 }}>
                            {meta.icon} {meta.label}
                          </span>
                        </td>
                        <td style={{ maxWidth: 180 }}>
                          <div className="fs-7">{addr}</div>
                          {canEdit && (
                            <button className="btn btn-link p-0 text-primary" style={{ fontSize: 11 }}
                              onClick={() => { setEditOrder(order); setEditField("address"); setNewAddress(addr !== "—" ? addr : ""); }}>
                              ✏️ Edit
                            </button>
                          )}
                        </td>
                        <td>
                          <div className="fw-semibold fs-7">{name}</div>
                          <div className="fs-7">📞 {phone}</div>
                          {canEdit && (
                            <button className="btn btn-link p-0 text-primary" style={{ fontSize: 11 }}
                              onClick={() => { setEditOrder(order); setEditField("phone"); setNewPhone(phone !== "—" ? phone : ""); }}>
                              ✏️ Edit
                            </button>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <span className="fs-7">👨‍🌾 {order.farmer_name || "—"}</span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="fs-7">💳 {order.payment_method || "—"}</span>
                        </td>
                        <td className="px-3 py-3" style={{ whiteSpace: "nowrap" }}>
                          <span className="fs-7">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric", month: "short", year: "numeric",
                            }) : "—"}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="d-flex flex-column gap-1 align-items-center">
                            {/* Invoice button — always visible */}
                            <button className="btn btn-sm btn-outline-success px-2 py-1 w-100"
                              style={{ fontSize: 11, borderRadius: 6, whiteSpace: "nowrap" }}
                              onClick={() => downloadInvoice(order)}>
                              🧾 Invoice
                            </button>

                            {/* ── NEW: View button — only for pending ── */}
                            {canEdit && (
                              <button className="btn btn-sm btn-outline-primary px-2 py-1 w-100"
                                style={{ fontSize: 11, borderRadius: 6, whiteSpace: "nowrap" }}
                                onClick={() => setViewOrder(order)}>
                                👁️ View
                              </button>
                            )}

                            {/* Cancel button — only for pending */}
                            {canEdit && (
                              <button className="btn btn-sm btn-outline-danger px-2 py-1 w-100"
                                style={{ fontSize: 11, borderRadius: 6, whiteSpace: "nowrap" }}
                                onClick={() => setCancelId(order._id)}>
                                🚫 Cancel
                              </button>
                            )}

                            {/* ── NEW: Delete button — only for cancelled orders ── */}
                            {order.status === "cancelled" && (
                              <button className="btn btn-sm btn-danger px-2 py-1 w-100"
                                style={{ fontSize: 11, borderRadius: 6, whiteSpace: "nowrap" }}
                                onClick={() => setDeleteId(order._id)}>
                                🗑️ Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center px-4 py-3 bg-white border-top">
                <span className="text-muted fs-6">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} orders
                </span>
                <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-outline-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                    ← Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button key={p}
                      className={`btn btn-sm ${p === page ? "btn-success" : "btn-outline-secondary"}`}
                      style={{ minWidth: 34 }}
                      onClick={() => setPage(p)}>
                      {p}
                    </button>
                  ))}
                  <button className="btn btn-sm btn-outline-secondary" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── NEW: VIEW ORDER MODAL ── */}
      {viewOrder && (() => {
        const { addr, name, phone } = parseAddress(viewOrder.delivery_address);
        const meta = STATUS_META[viewOrder.status] || STATUS_META.pending;
        return (
          <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{ background: "rgba(0,0,0,0.5)", zIndex: 1050 }}
            onClick={(e) => { if (e.target === e.currentTarget) setViewOrder(null); }}>
            <div className="card border-0 shadow-lg p-0 overflow-hidden" style={{ borderRadius: 16, width: "92%", maxWidth: 480 }}>
              {/* Modal Header */}
              <div className="d-flex justify-content-between align-items-center px-4 py-3"
                style={{ background: "#f0fdf4", borderBottom: "1px solid #bbf7d0" }}>
                <div>
                  <h6 className="fw-bold mb-0">📦 Order Details</h6>
                  <small className="text-muted font-monospace">#{viewOrder._id?.slice(-10).toUpperCase()}</small>
                </div>
                <button className="btn btn-sm btn-light rounded-circle" onClick={() => setViewOrder(null)}>✕</button>
              </div>

              <div className="p-4">
                {/* Status */}
                <div className="d-flex align-items-center gap-2 mb-3">
                  <span className="badge px-3 py-2 rounded border fw-semibold"
                    style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, fontSize: 12 }}>
                    {meta.icon} {meta.label}
                  </span>
                  <span className="text-muted fs-7">
                    {viewOrder.createdAt ? new Date(viewOrder.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"}
                  </span>
                </div>

                {/* Product Info */}
                <div className="bg-light rounded-3 p-3 mb-3">
                  <div className="fw-semibold text-success mb-1 fs-6">🌾 Product</div>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-bold">{viewOrder.product_name || "—"}</div>
                      <div className="text-muted fs-7">{viewOrder.quantity} {viewOrder.unit} · 👨‍🌾 {viewOrder.farmer_name || "—"}</div>
                    </div>
                    <div className="fw-bold text-success fs-5">₹{viewOrder.total_price?.toLocaleString()}</div>
                  </div>
                </div>

                {/* Delivery Info */}
                <div className="bg-light rounded-3 p-3 mb-3">
                  <div className="fw-semibold text-success mb-1 fs-6">📍 Delivery Address</div>
                  <div className="fw-bold">{name}</div>
                  <div className="text-muted fs-7">📞 {phone}</div>
                  <div className="text-muted fs-7 mt-1">{addr}</div>
                </div>

                {/* Payment Info */}
                <div className="bg-light rounded-3 p-3 mb-4">
                  <div className="fw-semibold text-success mb-1 fs-6">💳 Payment</div>
                  <div className="text-muted fs-7">{viewOrder.payment_method || "—"}</div>
                </div>

                {/* Action Buttons */}
                <div className="d-flex gap-2">
                  <button className="btn btn-outline-secondary flex-grow-1 rounded-3"
                    onClick={() => setViewOrder(null)}>
                    Close
                  </button>
                  {/* ── Reorder button — goes to checkout with pre-filled data ── */}
                  <button className="btn btn-success flex-grow-1 rounded-3 fw-bold"
                    onClick={() => { setViewOrder(null); reorder(viewOrder); }}>
                    🔄 Reorder / Change Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* EDIT MODAL */}
      {editOrder && editField && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: "rgba(0,0,0,0.5)", zIndex: 1050 }}
          onClick={(e) => { if (e.target === e.currentTarget) { setEditOrder(null); setEditField(null); } }}>
          <div className="card border-0 shadow-lg p-4" style={{ borderRadius: 16, width: "90%", maxWidth: 420 }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0">
                {editField === "address" ? "📍 Update Delivery Address" : "📞 Update Phone Number"}
              </h6>
              <button className="btn btn-sm btn-light rounded" onClick={() => { setEditOrder(null); setEditField(null); }}>✕</button>
            </div>
            {editField === "address" ? (
              <>
                <label className="form-label text-muted fs-6">New Delivery Address</label>
                <textarea className="form-control" rows={3} value={newAddress} onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="House no, street, city, state - pincode" style={{ borderRadius: 8 }} />
              </>
            ) : (
              <>
                <label className="form-label text-muted fs-6">New Mobile Number</label>
                <input className="form-control" value={newPhone} maxLength={10}
                  onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="10-digit mobile number" style={{ borderRadius: 8 }} />
              </>
            )}
            <div className="d-flex gap-2 mt-4">
              <button className="btn btn-outline-secondary flex-grow-1" style={{ borderRadius: 10 }}
                onClick={() => { setEditOrder(null); setEditField(null); }}>Cancel</button>
              <button className="btn btn-success flex-grow-1" style={{ borderRadius: 10 }}
                onClick={saveEdit} disabled={saving}>
                {saving ? <span className="spinner-border spinner-border-sm" /> : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL CONFIRM MODAL */}
      {cancelId && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
          <div className="card border-0 shadow-lg p-4 text-center" style={{ borderRadius: 16, width: "90%", maxWidth: 360 }}>
            <div style={{ fontSize: 56 }}>🚫</div>
            <h5 className="fw-bold mt-3">Cancel Order?</h5>
            <p className="text-muted mb-4 fs-6">This action cannot be undone. Your order will be marked as cancelled.</p>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-secondary flex-grow-1" style={{ borderRadius: 10 }}
                onClick={() => setCancelId(null)}>Go Back</button>
              <button className="btn btn-danger flex-grow-1" style={{ borderRadius: 10 }}
                onClick={cancelOrder} disabled={cancelling}>
                {cancelling ? <span className="spinner-border spinner-border-sm" /> : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── NEW: DELETE CONFIRM MODAL ── */}
      {deleteId && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
          <div className="card border-0 shadow-lg p-4 text-center" style={{ borderRadius: 16, width: "90%", maxWidth: 360 }}>
            <div style={{ fontSize: 56 }}>🗑️</div>
            <h5 className="fw-bold mt-3">Delete Order?</h5>
            <p className="text-muted mb-4 fs-6">This will permanently remove the order from your history.</p>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-secondary flex-grow-1" style={{ borderRadius: 10 }}
                onClick={() => setDeleteId(null)}>Go Back</button>
              <button className="btn btn-danger flex-grow-1" style={{ borderRadius: 10 }}
                onClick={deleteOrder}>
                🗑️ Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}