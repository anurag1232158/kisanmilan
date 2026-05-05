"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Order = {
  _id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  total_price: number;
  status: string;
  delivery_address: string;
  createdAt: string;
  buyer_name?: string;
  buyer_phone?: string;
  buyer_email?: string;
  farmer_name?: string;
  farmer_phone?: string;
  location?: string;
  localStatus?: "pending" | "picked" | "delivered";
};

const API = `${process.env.NEXT_PUBLIC_API_URL}`;

/**
 * STRICT location match:
 * Extract the CITY part (first segment before comma) from both strings
 * and compare them case-insensitively.
 * Format expected: "City, District, State"  e.g. "Allahabad, Allahabad, Uttar Pradesh"
 *
 * If dpartner has no location set → show NO orders (force them to set location).
 * If order has no address         → skip that order (can't verify).
 */
const extractCity = (location: string = "") =>
  location.split(",")[0].trim().toLowerCase();

const matchesLocation = (orderAddr: string = "", userLoc: string = "") => {
  if (!userLoc) return false; // no location → show nothing
  if (!orderAddr) return false; // no address on order → skip

  const orderCity = extractCity(orderAddr);
  const userCity  = extractCity(userLoc);

  return orderCity === userCity; // EXACT city match only
};

export default function DeliveryPage() {
  const router = useRouter();
  const [user, setUser]           = useState<any>(null);
  const [orders, setOrders]       = useState<Order[]>([]);
  const [myOrders, setMyOrders]   = useState<Order[]>([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState<"available" | "active" | "delivered" | "earnings">("available");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updating, setUpdating]   = useState<string | null>(null);
  const [toast, setToast]         = useState<{ msg: string; type: string } | null>(null);
  const [showAll, setShowAll]     = useState(false);

  /* ── Auth ── */
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.replace("/Login"); return; }
    const parsed = JSON.parse(stored);
    if (parsed.role !== "dpartner") { router.replace("/Dashboard"); return; }
    setUser(parsed);

    const saved = localStorage.getItem(`dpartner_orders_${parsed.id}`);
    if (saved) setMyOrders(JSON.parse(saved));

    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/order?status=pending`);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const saveMyOrders = (updated: Order[], u?: any) => {
    const uid = (u || user)?.id;
    if (!uid) return;
    localStorage.setItem(`dpartner_orders_${uid}`, JSON.stringify(updated));
    setMyOrders(updated);
  };

  const showToast = (msg: string, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── STRICT location-filtered available orders ── */
  const locationOrders = orders.filter((o) =>
    matchesLocation(o.delivery_address || o.location, user?.location)
  );

  const MAX_VISIBLE = 6;
  const visibleOrders = showAll ? locationOrders : locationOrders.slice(0, MAX_VISIBLE);

  /* ── Accept ── */
  const acceptOrder = async (order: Order) => {
    // DOUBLE CHECK: only allow accepting if delivery address matches dpartner's city
    if (!matchesLocation(order.delivery_address || order.location, user?.location)) {
      showToast("Yeh order aapke area ka nahi hai! Accept nahi kar sakte.", "error");
      return;
    }

    setUpdating(order._id);
    try {
      const res = await fetch(`${API}/order/${order._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "accepted" }),
      });
      if (res.ok) {
        const accepted = { ...order, localStatus: "pending" as const, status: "accepted" };
        const updated  = [...myOrders, accepted];
        saveMyOrders(updated);
        setOrders((prev) => prev.filter((o) => o._id !== order._id));
        setSelectedOrder(null);
        showToast("Order accept kar liya! Pickup karo 📦");
        setActiveTab("active");
      } else {
        showToast("Accept nahi ho paya, dobara try karo", "error");
      }
    } catch {
      showToast("Server se connect nahi ho pa raha", "error");
    } finally {
      setUpdating(null);
    }
  };

  /* ── Status update ── */
  const updateStatus = async (orderId: string, newLocal: "picked" | "delivered") => {
    setUpdating(orderId);
    try {
      await fetch(`${API}/order/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newLocal }),
      });
    } catch { /* continue */ }

    const updated = myOrders.map((o) =>
      o._id === orderId ? { ...o, localStatus: newLocal } : o
    );
    saveMyOrders(updated);
    if (selectedOrder?._id === orderId)
      setSelectedOrder((p) => p ? { ...p, localStatus: newLocal } : null);
    showToast(
      newLocal === "picked"
        ? "Order pick up kar liya! 🚚"
        : "Order deliver ho gaya! ✅ +₹40 kamai"
    );
    setUpdating(null);
  };

  /* ── Derived ── */
  const activeOrders    = myOrders.filter((o) => o.localStatus !== "delivered");
  const deliveredOrders = myOrders.filter((o) => o.localStatus === "delivered");
  const totalEarnings   = deliveredOrders.length * 40;

  const statusBadge = (local?: string) => {
    const map: Record<string, { color: string; label: string }> = {
      pending:   { color: "warning", label: "📋 Pickup Baaki" },
      picked:    { color: "primary", label: "🚚 Raste Mein"  },
      delivered: { color: "success", label: "✅ Deliver Hua" },
    };
    const s = map[local || "pending"] || map.pending;
    return <span className={`badge bg-${s.color} text-dark`} style={{ fontSize: 12 }}>{s.label}</span>;
  };

  /* ════════════════════ RENDER ════════════════════ */
  return (
    <>
      {/* Toast */}
      {toast && (
        <div
          className="position-fixed top-0 end-0 m-3 alert shadow d-flex align-items-center gap-2"
          style={{
            zIndex: 9999, minWidth: 280, borderRadius: 12,
            background: toast.type === "error" ? "#dc2626" : "#16a34a",
            color: "#fff",
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="p-4 text-white" style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
        <div className="container">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span style={{ fontSize: 26 }}>🚚</span>
                <span className="fw-bold fs-5">Delivery Partner</span>
              </div>
              <h5 className="fw-bold mb-0">Namaste, {user?.name || "Partner"} 👋</h5>
              <small className="opacity-75">
                📍 {user?.location || "Location set nahi hai"}
                {user?.location && (
                  <span className="ms-2 badge bg-white text-dark" style={{ fontSize: 10 }}>
                    Sirf {extractCity(user.location).charAt(0).toUpperCase() + extractCity(user.location).slice(1)} ke orders
                  </span>
                )}
              </small>
            </div>
            <button className="btn btn-light btn-sm rounded-pill px-3" onClick={fetchOrders}>
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="container py-3">

        {/* No location warning */}
        {!user?.location && (
          <div className="alert alert-danger d-flex align-items-center gap-2 mb-3">
            <span>⚠️</span>
            <span>
              <strong>Location set nahi hai!</strong> Apni profile mein location update karo tabhi orders dikhenge.
            </span>
          </div>
        )}

        {/* Stats */}
        <div className="row g-3 mb-4">
          {[
            { icon: "📋", val: locationOrders.length,    label: `${extractCity(user?.location || "") || "Aapke"} Area Mein`, color: "#f59e0b" },
            { icon: "📦", val: activeOrders.length,      label: "Active",           color: "#7c3aed" },
            { icon: "✅", val: deliveredOrders.length,    label: "Delivered",        color: "#16a34a" },
            { icon: "💰", val: `₹${totalEarnings}`,      label: "Aaj Kamai",        color: "#0d6efd" },
          ].map((s, i) => (
            <div className="col-6 col-md-3" key={i}>
              <div className="card border-0 shadow-sm p-3 text-center rounded-4">
                <div style={{ fontSize: 26 }}>{s.icon}</div>
                <div className="fw-bold fs-4" style={{ color: s.color }}>{s.val}</div>
                <div className="text-muted small">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <ul className="nav nav-tabs mb-4">
          {[
            { key: "available", label: "📋 Available", count: locationOrders.length },
            { key: "active",    label: "🚚 Active",    count: activeOrders.length },
            { key: "delivered", label: "✅ Delivered",  count: 0 },
            { key: "earnings",  label: "💰 Kamai",      count: 0 },
          ].map((t) => (
            <li className="nav-item" key={t.key}>
              <button
                className={`nav-link ${activeTab === t.key ? "active" : ""}`}
                onClick={() => setActiveTab(t.key as any)}
              >
                {t.label}
                {t.count > 0 && (
                  <span className="badge bg-danger ms-1 rounded-pill">{t.count}</span>
                )}
              </button>
            </li>
          ))}
        </ul>

        {/* ── Available ── */}
        {activeTab === "available" && (
          <div>
            {user?.location && (
              <div className="alert alert-info py-2 mb-3 d-flex align-items-center gap-2" style={{ fontSize: 13 }}>
                <span>📍</span>
                <span>
                  Sirf <strong>{extractCity(user.location).charAt(0).toUpperCase() + extractCity(user.location).slice(1)}</strong> city ke orders dikh rahe hain.
                  {locationOrders.length === 0
                    ? " Abhi koi order nahi hai."
                    : ` ${locationOrders.length} order${locationOrders.length > 1 ? "s" : ""} available.`}
                </span>
              </div>
            )}

            {loading ? (
              <>
              </>
            ) : !user?.location ? (
              <div className="text-center py-5">
                <div style={{ fontSize: 64 }}>📍</div>
                <h5 className="fw-bold mt-3">Pehle apni location set karo</h5>
                <p className="text-muted">Profile mein jaake city add karo</p>
              </div>
            ) : locationOrders.length === 0 ? (
              <div className="text-center py-5">
                <div style={{ fontSize: 64 }}>📭</div>
                <h5 className="fw-bold mt-3">
                  {extractCity(user.location).charAt(0).toUpperCase() + extractCity(user.location).slice(1)} mein koi pending order nahi
                </h5>
                <p className="text-muted">Thodi der baad refresh karo</p>
                <button
                  className="btn btn-outline-secondary rounded-pill px-4"
                  onClick={fetchOrders}
                >
                  🔄 Refresh
                </button>
              </div>
            ) : (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <small className="text-muted fw-semibold">
                    Showing {visibleOrders.length} of {locationOrders.length} orders
                  </small>
                  {locationOrders.length > MAX_VISIBLE && (
                    <button
                      className="btn btn-sm btn-outline-secondary rounded-pill"
                      onClick={() => setShowAll((v) => !v)}
                    >
                      {showAll ? "Show Less ▲" : `View More (${locationOrders.length - MAX_VISIBLE} more) ▼`}
                    </button>
                  )}
                </div>

                <div className="d-flex flex-column gap-3">
                  {visibleOrders.map((order) => (
                    <div
                      key={order._id}
                      className="card border-0 shadow-sm p-3 rounded-4"
                      style={{ cursor: "pointer", borderLeft: "4px solid #f59e0b" }}
                      onClick={() => setSelectedOrder(order)}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <div className="fw-bold text-dark">🛒 {order.product_name}</div>
                          <div className="text-muted small">
                            {order.quantity} {order.unit} •{" "}
                            <span className="fw-semibold text-success">₹{order.total_price}</span>
                          </div>
                          {order.buyer_name && (
                            <div className="text-muted small">👤 {order.buyer_name}</div>
                          )}
                        </div>
                        <span className="badge bg-warning text-dark">📋 Pending</span>
                      </div>

                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span style={{ fontSize: 14 }}>📍</span>
                        <span className="small fw-semibold">{order.delivery_address}</span>
                      </div>

                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          🕐 {new Date(order.createdAt).toLocaleString("hi-IN", {
                            day: "2-digit", month: "short",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </small>
                        <button
                          className="btn btn-sm btn-success px-3 fw-semibold"
                          disabled={updating === order._id}
                          onClick={(e) => { e.stopPropagation(); acceptOrder(order); }}
                        >
                          {updating === order._id
                            ? <span className="spinner-border spinner-border-sm" />
                            : "✋ Accept Karo"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {locationOrders.length > MAX_VISIBLE && (
                  <div className="text-center mt-3">
                    <button
                      className="btn btn-outline-secondary rounded-pill px-4"
                      onClick={() => setShowAll((v) => !v)}
                    >
                      {showAll
                        ? "▲ Show Less"
                        : `▼ View More (${locationOrders.length - MAX_VISIBLE} more orders)`}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Active ── */}
        {activeTab === "active" && (
          <div>
            {activeOrders.length === 0 ? (
              <div className="text-center py-5">
                <div style={{ fontSize: 64 }}>🎉</div>
                <h5 className="fw-bold mt-3">Koi active order nahi</h5>
                <p className="text-muted">Available tab se order accept karo</p>
                <button
                  className="btn text-white rounded-pill px-4"
                  style={{ background: "#7c3aed" }}
                  onClick={() => setActiveTab("available")}
                >
                  Orders Dekho
                </button>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {activeOrders.map((order) => (
                  <div
                    key={order._id}
                    className="card border-0 shadow-sm p-3 rounded-4"
                    style={{ cursor: "pointer", borderLeft: `4px solid ${order.localStatus === "picked" ? "#0d6efd" : "#f59e0b"}` }}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <div className="fw-bold">🛒 {order.product_name}</div>
                        <div className="text-muted small">
                          {order.quantity} {order.unit} • ₹{order.total_price}
                        </div>
                        {order.buyer_name && (
                          <div className="text-muted small">👤 {order.buyer_name}</div>
                        )}
                      </div>
                      {statusBadge(order.localStatus)}
                    </div>

                    <div className="d-flex align-items-center gap-2 mb-3">
                      <span style={{ fontSize: 14 }}>📍</span>
                      <span className="small fw-semibold">{order.delivery_address}</span>
                    </div>

                    <div
                      className="d-flex gap-2 justify-content-end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {order.localStatus === "pending" && (
                        <button
                          className="btn btn-sm btn-primary px-3 fw-semibold"
                          disabled={updating === order._id}
                          onClick={() => updateStatus(order._id, "picked")}
                        >
                          {updating === order._id
                            ? <span className="spinner-border spinner-border-sm" />
                            : "📦 Pick Up Karo"}
                        </button>
                      )}
                      {order.localStatus === "picked" && (
                        <button
                          className="btn btn-sm btn-success px-3 fw-semibold"
                          disabled={updating === order._id}
                          onClick={() => updateStatus(order._id, "delivered")}
                        >
                          {updating === order._id
                            ? <span className="spinner-border spinner-border-sm" />
                            : "✅ Deliver Kar Diya"}
                        </button>
                      )}
                      {order.buyer_phone && (
                        <a href={`tel:${order.buyer_phone}`} className="btn btn-sm btn-outline-secondary">
                          📞
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Delivered ── */}
        {activeTab === "delivered" && (
          <div className="d-flex flex-column gap-3">
            {deliveredOrders.length === 0 ? (
              <div className="text-center py-5">
                <div style={{ fontSize: 64 }}>📭</div>
                <h5 className="fw-bold mt-3">Abhi koi delivery nahi hui</h5>
              </div>
            ) : (
              deliveredOrders.map((order) => (
                <div
                  key={order._id}
                  className="card border-0 shadow-sm p-3 rounded-4"
                  style={{ borderLeft: "4px solid #16a34a" }}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-bold">🛒 {order.product_name}</div>
                      <div className="text-muted small">{order.quantity} {order.unit}</div>
                      {order.buyer_name && (
                        <div className="text-muted small">👤 {order.buyer_name}</div>
                      )}
                      <div className="text-muted small">📍 {order.delivery_address}</div>
                    </div>
                    <div className="text-end">
                      <span className="badge bg-success">✅ Delivered</span>
                      <div className="fw-bold text-success mt-1">+₹40</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Earnings ── */}
        {activeTab === "earnings" && (
          <div>
            <div
              className="card border-0 rounded-4 p-4 mb-3 text-center text-white"
              style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
            >
              <div style={{ fontSize: 13, opacity: 0.8 }}>Aaj ki Total Kamai</div>
              <div className="fw-bold" style={{ fontSize: 48 }}>₹{totalEarnings}</div>
              <div style={{ fontSize: 13, opacity: 0.8 }}>
                {deliveredOrders.length} deliveries • ₹40 per delivery
              </div>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-6">
                <div className="card border-0 shadow-sm p-3 text-center rounded-4">
                  <div style={{ fontSize: 24 }}>📦</div>
                  <div className="fw-bold fs-5">{myOrders.length}</div>
                  <div className="text-muted small">Total Accept Kiye</div>
                </div>
              </div>
              <div className="col-6">
                <div className="card border-0 shadow-sm p-3 text-center rounded-4">
                  <div style={{ fontSize: 24 }}>✅</div>
                  <div className="fw-bold fs-5">{deliveredOrders.length}</div>
                  <div className="text-muted small">Deliver Kiye</div>
                </div>
              </div>
            </div>

            <div className="card border-0 shadow-sm rounded-4 p-3">
              <h6 className="fw-bold mb-3">📋 Delivery Breakdown</h6>
              {deliveredOrders.length === 0 ? (
                <div className="text-center text-muted py-3">Abhi koi delivery nahi hui</div>
              ) : (
                <>
                  {deliveredOrders.map((order) => (
                    <div
                      key={order._id}
                      className="d-flex justify-content-between align-items-center py-2 border-bottom"
                    >
                      <div>
                        <div className="fw-semibold small">🛒 {order.product_name}</div>
                        <div className="text-muted" style={{ fontSize: 12 }}>
                          {order.buyer_name || order.buyer_id} • {order.delivery_address}
                        </div>
                      </div>
                      <div className="fw-bold text-success">+₹40</div>
                    </div>
                  ))}
                  <div className="d-flex justify-content-between pt-2 fw-bold">
                    <span>Total</span>
                    <span style={{ color: "#7c3aed" }}>₹{totalEarnings}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div style={{ height: 40 }} />
      </div>

      {/* ── Modal ── */}
      {selectedOrder && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-end align-items-md-center justify-content-center"
          style={{ background: "rgba(0,0,0,0.5)", zIndex: 1050 }}
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-white rounded-top-4 rounded-md-4 p-4 w-100"
            style={{ maxWidth: 480, maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0">🛒 {selectedOrder.product_name}</h5>
              <button className="btn btn-sm btn-light rounded-circle" onClick={() => setSelectedOrder(null)}>✕</button>
            </div>

            {/* Map */}
            <div
              className="rounded-3 mb-3 d-flex flex-column align-items-center justify-content-center"
              style={{ background: "#f1f5f9", height: 120 }}
            >
              <div style={{ fontSize: 32 }}>🗺️</div>
              <button
                className="btn btn-sm mt-2 text-white"
                style={{ background: "#7c3aed", borderRadius: 8 }}
                onClick={() =>
                  window.open(
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedOrder.delivery_address)}`,
                    "_blank"
                  )
                }
              >
                📍 Google Maps Pe Dekho
              </button>
            </div>

            {/* Order details */}
            <div className="card border-0 rounded-3 p-3 mb-3" style={{ background: "#f8f9fa" }}>
              <div className="fw-semibold mb-2">📦 Order Details</div>
              <div className="row g-2 small">
                <div className="col-6"><span className="text-muted">Product:</span> <strong>{selectedOrder.product_name}</strong></div>
                <div className="col-6"><span className="text-muted">Qty:</span> <strong>{selectedOrder.quantity} {selectedOrder.unit}</strong></div>
                <div className="col-6"><span className="text-muted">Amount:</span> <strong className="text-success">₹{selectedOrder.total_price}</strong></div>
                <div className="col-6"><span className="text-muted">Status:</span> {statusBadge(selectedOrder.localStatus)}</div>
              </div>
            </div>

            {/* Buyer */}
            {(selectedOrder.buyer_name || selectedOrder.buyer_phone) && (
              <div className="card border-0 rounded-3 p-3 mb-3" style={{ background: "#f8f9fa" }}>
                <div className="fw-semibold mb-1">👤 Buyer</div>
                <div className="small">{selectedOrder.buyer_name || selectedOrder.buyer_id}</div>
                {selectedOrder.buyer_phone && (
                  <div className="d-flex align-items-center gap-2 mt-1">
                    <span className="small text-muted">{selectedOrder.buyer_phone}</span>
                    <a href={`tel:${selectedOrder.buyer_phone}`} className="btn btn-sm btn-outline-success py-0 px-2">
                      📞 Call
                    </a>
                    <a
                      href={`https://wa.me/${selectedOrder.buyer_phone.replace(/\D/g, "")}`}
                      target="_blank" rel="noreferrer"
                      className="btn btn-sm py-0 px-2 text-white"
                      style={{ background: "#25d366" }}
                    >
                      💚 WhatsApp
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Address */}
            <div className="card border-0 rounded-3 p-3 mb-3" style={{ background: "#f8f9fa" }}>
              <div className="fw-semibold mb-1">📍 Delivery Address</div>
              <div className="small fw-semibold">{selectedOrder.delivery_address}</div>
            </div>

            {/* Action — guarded by location check */}
            <div className="d-grid">
              {!selectedOrder.localStatus && (
                matchesLocation(selectedOrder.delivery_address || selectedOrder.location, user?.location) ? (
                  <button
                    className="btn btn-success py-2 fw-bold"
                    disabled={updating === selectedOrder._id}
                    onClick={() => acceptOrder(selectedOrder)}
                  >
                    {updating === selectedOrder._id
                      ? <span className="spinner-border spinner-border-sm me-2" />
                      : "✋ "}
                    Accept Karo
                  </button>
                ) : (
                  <div className="alert alert-danger text-center py-2 mb-0" style={{ fontSize: 13 }}>
                    ⛔ Yeh order aapke area ka nahi hai
                  </div>
                )
              )}
              {selectedOrder.localStatus === "pending" && (
                <button
                  className="btn btn-primary py-2 fw-bold"
                  disabled={updating === selectedOrder._id}
                  onClick={() => updateStatus(selectedOrder._id, "picked")}
                >
                  {updating === selectedOrder._id
                    ? <span className="spinner-border spinner-border-sm me-2" />
                    : "📦 "}
                  Pick Up Kar Lo
                </button>
              )}
              {selectedOrder.localStatus === "picked" && (
                <button
                  className="btn btn-success py-2 fw-bold"
                  disabled={updating === selectedOrder._id}
                  onClick={() => updateStatus(selectedOrder._id, "delivered")}
                >
                  {updating === selectedOrder._id
                    ? <span className="spinner-border spinner-border-sm me-2" />
                    : "✅ "}
                  Deliver Kar Diya
                </button>
              )}
              {selectedOrder.localStatus === "delivered" && (
                <div className="text-center py-2 text-success fw-bold fs-5">
                  ✅ Successfully Delivered!
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}