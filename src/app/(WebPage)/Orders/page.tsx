"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";


const STATUS_COLORS: Record<string, string> = {
  pending:   "warning",
  confirmed: "primary",
  shipped:   "info",
  delivered: "success",
  cancelled: "danger",
};

const STATUS_LABEL: Record<string, string> = {
  pending:   "⏳ Pending",
  confirmed: "✅ Confirmed",
  shipped:   "🚚 Shipped",
  delivered: "🎉 Delivered",
  cancelled: "❌ Cancelled",
};

const STATUS_ICON: Record<string, string> = {
  pending:   "⏳",
  confirmed: "✅",
  shipped:   "🚚",
  delivered: "🎉",
  cancelled: "❌",
};

const TABS = ["All", "Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"];

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders]       = useState<any[]>([]);
  const [payments, setPayments]   = useState<Record<string, any>>({});
  const [loading, setLoading]     = useState(true);
  const [user, setUser]           = useState<any>(null);
const [activeTab, setActiveTab] = useState("All");
const [role, setRole]           = useState<"buyer"|"seller"|"all">("all");
const [showAll, setShowAll]     = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.push("/Login"); return; }
    const u = JSON.parse(stored);
    setUser(u);
    if (u.role === "farmer") setRole("seller");
    fetchOrders(u);
  }, []);

  const fetchOrders = async (u: any) => {
    try {
      const res = await fetch("http://localhost:5000/order", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();

      // Farmer — sirf seller orders, Buyer/Agent — apne sab orders
      // let myOrders: any[] = [];
     const myOrders = data.filter((o: any) =>
  o.buyer_id?.toString()  === u.id?.toString() ||
  o.seller_id?.toString() === u.id?.toString()
);

      setOrders(myOrders);

      const paymentMap: Record<string, any> = {};
      await Promise.all(
        myOrders.map(async (order: any) => {
          try {
            const pRes  = await fetch(`http://localhost:5000/payment/order/${order._id}`);
            const pData = await pRes.json();
            if (!pData.error) paymentMap[order._id] = pData;
          } catch {}
        })
      );
      setPayments(paymentMap);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((o: any) => {
    const tabMatch = activeTab === "All" ||
      o.status.toLowerCase() === activeTab.toLowerCase();
    return tabMatch;
  });

  const countByStatus = (status: string) =>
    status === "All"
      ? orders.length
      : orders.filter(o =>
          o.status.toLowerCase() === status.toLowerCase()
        ).length;

  const isFarmer = user?.role === "farmer";
  const isAgent  = user?.role === "agent";
  const isBuyer  = user?.role === "buyer";

  if (loading) return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center">
      <div className="spinner-border text-success" />
    </div>
  );

  return (
    <>
   
      <div className="min-vh-100 bg-light py-4">
        <div className="container">

          {/* Header */}
          <div className="card border-0 shadow-sm rounded-4 mb-4"
            style={{ background: "linear-gradient(135deg,#198754,#20c997)" }}>
            <div className="card-body p-4 text-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="fw-bold mb-1">📦 My Orders</h4>
                  <p className="mb-0 opacity-75 small">
                    {isFarmer ? "👨‍🌾 Tumhare farmer orders" :
                     isAgent  ? "🏪 Tumhare agent orders" :
                     "🛍️ Tumhare saare orders"}
                    {" — "}{orders.length} total
                  </p>
                </div>
                {!isAgent && (
                  <Link href="/Product" className="btn fw-semibold"
                    style={{ background:"rgba(255,255,255,0.2)", color:"white" }}>
                    🛒 Shop More
                  </Link>
                )}
                {isAgent && (
                  <Link href="/ProductAdd" className="btn fw-semibold"
                    style={{ background:"rgba(255,255,255,0.2)", color:"white" }}>
                    ➕ Add Product
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="d-flex gap-2 mb-4 flex-wrap">
            {TABS.map(tab => {
              const count = countByStatus(tab);
              return (
                <button key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`btn btn-sm rounded-pill ${
                    activeTab === tab ? "btn-success" : "btn-outline-secondary"
                  }`}>
                  {tab}
                  {count > 0 && (
                    <span className={`badge ms-1 ${
                      activeTab === tab ? "bg-white text-success" : "bg-success text-white"
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}

            {filteredOrders.length > 6 && (
            <div className="ms-auto">
              <button
                className="btn btn-outline-success px-5 rounded-pill fw-semibold"
                onClick={() => setShowAll(!showAll)}>
                {showAll
                  ? "📦 Read Less ↑"
                  : `🔍 Read More (${filteredOrders.length - 8} aur) ↓`}
              </button>
            </div>
          )}
          </div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div className="text-center py-5">
              <div style={{ fontSize: 64 }}>📭</div>
              <p className="text-muted fs-5 mt-3">
                {activeTab === "All"
                  ? "Koi order nahi mila"
                  : `Koi ${activeTab} order nahi`}
              </p>
              {!isAgent && (
                <Link href="/Product" className="btn btn-success mt-2">
                  🛒 Shop Now
                </Link>
              )}
            </div>
          ) : (
           <div className="row g-3">
               {(showAll ? filteredOrders : filteredOrders.slice(0, 6)).map((order: any) => {
                const payment       = payments[order._id];
                const isCOD         = payment?.payment_method === "COD" || !payment?._id;
                const isPaid        = payment?.status === "completed";
                const isOrderBuyer  = order.buyer_id?.toString()  === user?.id?.toString();
                const isOrderSeller = order.seller_id?.toString() === user?.id?.toString();

                return (
                  <div key={order._id} className="col-md-6">
                    <Link href={`/Orders/${order._id}`} className="text-decoration-none">
                      <div className="card border-0 shadow-sm rounded-4 h-100"
                        style={{ transition: "transform 0.2s" }}
                        onMouseEnter={e =>
                          (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"
                        }
                        onMouseLeave={e =>
                          (e.currentTarget as HTMLElement).style.transform = "translateY(0)"
                        }>
                        <div className="card-body p-4">

                          {/* Top Row */}
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div className="d-flex align-items-center gap-2">
                              <span style={{ fontSize: 24 }}>
                                {STATUS_ICON[order.status]}
                              </span>
                              <div>
                                <h6 className="fw-bold text-dark mb-0 text-truncate"
                                  style={{ maxWidth: 160 }}>
                                  {order.product_name}
                                </h6>
                                <small className="text-muted">
                                  {isOrderBuyer
                                    ? "🛍️ Buyer"
                                    : isFarmer
                                    ? "👨‍🌾 Seller"
                                    : isAgent
                                    ? "🏪 Agent Seller"
                                    : "👤"}
                                </small>
                              </div>
                            </div>
                            <span className={`badge bg-${STATUS_COLORS[order.status]}`}>
                              {STATUS_LABEL[order.status]}
                            </span>
                          </div>

                          {/* Details */}
                          <div className="d-flex justify-content-between align-items-center mt-3">
                            <div>
                              <p className="text-muted small mb-1">
                                📦 {order.quantity} {order.unit}
                              </p>
                              <p className="text-success fw-bold fs-5 mb-1">
                                ₹{order.total_price}
                              </p>
                              {order.delivery_address && (
                                <p className="text-muted small mb-0 text-truncate"
                                  style={{ maxWidth: 180 }}>
                                  📍 {order.delivery_address}
                                </p>
                              )}
                            </div>
                            <div className="text-end">
                              {isCOD ? (
                                <span className={`badge ${
                                  isPaid ? "bg-success" : "bg-warning text-dark"
                                } d-block mb-1`}>
                                  {isPaid ? "✅ COD Paid" : "💵 COD Pending"}
                                </span>
                              ) : (
                                <span className="badge bg-success d-block mb-1">
                                  ✅ Paid Online
                                </span>
                              )}
                              <small className="text-muted">
                                {new Date(order.createdAt).toLocaleDateString("hi-IN")}
                              </small>
                            </div>
                          </div>

                          {/* COD Pay Now — Buyer ke liye */}
                          {isOrderBuyer && isCOD && !isPaid &&
                           order.status !== "cancelled" &&
                           order.status !== "delivered" && (
                            <div className="mt-3">
                              <div className="alert alert-warning py-2 small mb-2 rounded-3">
                                💡 COD hai — online pay karna chahte ho?
                              </div>
                              <button className="btn btn-success btn-sm w-100 fw-semibold"
                                onClick={(e) => {
                                  e.preventDefault();
                                  router.push(`/Orders/${order._id}`);
                                }}>
                                💳 Online Pay Karo →
                              </button>
                            </div>
                          )}

                          {/* Seller Action needed */}
                          {isOrderSeller &&
                           order.status !== "cancelled" &&
                           order.status !== "delivered" && (
                            <div className="mt-2">
                              <span className="badge bg-info text-dark small">
                                🔔 Action needed
                              </span>
                            </div>
                          )}

                        </div>
                      </div>
                    </Link>

                    
                  </div>

                  
                );
              })}
            </div>
          )}

        </div>
        
        
      </div>
    </>
  );
}