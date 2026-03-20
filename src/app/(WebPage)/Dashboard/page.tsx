"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";


interface Order {
  _id: string;
  product_name: string;
  total_price: number;
  status: string;
  quantity: number;
  unit: string;
  createdAt: string;
  buyer_id: string;
  seller_id: string;
}

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  totalSpent: number;
  totalProducts: number;
  totalEarned: number;
}

const STATUS_COLORS: Record<string, string> = {
  pending:   "warning",
  confirmed: "primary",
  shipped:   "info",
  delivered: "success",
  cancelled: "danger",
};

const STATUS_ICONS: Record<string, string> = {
  pending:   "⏳",
  confirmed: "✅",
  shipped:   "🚚",
  delivered: "🎉",
  cancelled: "❌",
};

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser]                 = useState<any>(null);
  const [stats, setStats]               = useState<Stats>({
    totalOrders: 0, pendingOrders: 0, deliveredOrders: 0,
    totalSpent: 0, totalProducts: 0, totalEarned: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [myProducts, setMyProducts]     = useState<any[]>([]);
  const [agentRates, setAgentRates]     = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.push("/Login"); return; }
    const u = JSON.parse(stored);
    setUser(u);
    fetchDashboardData(u);
  }, []);

  const fetchDashboardData = async (u: any) => {
    try {
      const token   = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // Orders
      const ordersRes = await fetch("http://localhost:5000/order", { headers });
      const allOrders = await ordersRes.json();

      const myOrders = allOrders.filter((o: Order) =>
        o.buyer_id?.toString()  === u.id?.toString() ||
        o.seller_id?.toString() === u.id?.toString()
      );

      const pending   = myOrders.filter((o: Order) => o.status === "pending").length;
      const delivered = myOrders.filter((o: Order) => o.status === "delivered").length;

      const totalSpent = myOrders
        .filter((o: Order) => o.buyer_id?.toString() === u.id?.toString())
        .reduce((sum: number, o: Order) => sum + o.total_price, 0);

      const totalEarned = myOrders
        .filter((o: Order) => o.seller_id?.toString() === u.id?.toString())
        .reduce((sum: number, o: Order) => sum + o.total_price, 0);

      // Farmer — apne products
      let totalProducts = 0;
   if (u.role === "farmer") {
  const token   = localStorage.getItem("token");
  const meRes   = await fetch("http://localhost:5000/auth/me", {
    headers: { Authorization: `Bearer ${token}` }
  });
  const meData  = await meRes.json();
  const myId    = meData._id?.toString() || u.id?.toString() || "";

  const prodRes  = await fetch("http://localhost:5000/products");
  const allProds = await prodRes.json();
  const mine     = allProds.filter((p: any) =>
    p.farmer_id?.toString() === myId
  );
  totalProducts = mine.length;
  setMyProducts(mine.slice(0, 5));
}

      // Agent — apne rates
      if (u.role === "agent") {
        const ratesRes  = await fetch(
          `http://localhost:5000/agent-rates?agent_id=${u.id}`, { headers }
        );
        const ratesData = await ratesRes.json();
        setAgentRates(Array.isArray(ratesData) ? ratesData : []);
      }

      setStats({
        totalOrders: myOrders.length, pendingOrders: pending,
        deliveredOrders: delivered, totalSpent, totalProducts, totalEarned,
      });
      setRecentOrders(myOrders.slice(0, 5));

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center">
      <div className="spinner-border text-success" style={{ width: 48, height: 48 }} />
    </div>
  );

  const isFarmer = user?.role === "farmer";
  const isAgent  = user?.role === "agent";

  const roleBadge = isFarmer ? "👨‍🌾 Farmer"
    : isAgent ? "🏪 Agent" : "🛍️ Buyer";

  const statsCards = [
    { icon: "📦", value: stats.totalOrders,     label: "Total Orders", color: "success" },
    { icon: "⏳", value: stats.pendingOrders,   label: "Pending",      color: "warning" },
    { icon: "🎉", value: stats.deliveredOrders, label: "Delivered",    color: "success" },
    isFarmer
      ? { icon: "🌾", value: stats.totalProducts,    label: "My Products", color: "info"    }
      : isAgent
      ? { icon: "🏪", value: agentRates.length,       label: "My Rates",    color: "warning" }
      : { icon: "💸", value: `₹${stats.totalSpent}`, label: "Total Spent", color: "primary" },
  ];

  const quickActions = [
    { href: "/Product", icon: "🛒", label: "Products", bg: "success"   },
    { href: "/Orders",  icon: "📦", label: "Orders",   bg: "primary"   },
    { href: "/Profile", icon: "👤", label: "Profile",  bg: "secondary" },
    ...(isFarmer ? [
      { href: "/Rates",      icon: "📊", label: "Rates",       bg: "info"    },
      { href: "/ProductAdd", icon: "➕", label: "Add Product", bg: "warning" },
    ] : []),
    ...(isAgent ? [
      { href: "/Rates",      icon: "📊", label: "Mandi Rates", bg: "info"    },
      { href: "/ProductAdd", icon: "➕", label: "Add Product", bg: "success" },
    ] : []),
    ...(!isFarmer && !isAgent ? [
      { href: "/Rates", icon: "📊", label: "Rates", bg: "info" },
    ] : []),
  ];

  return (
    <>

      <div className="min-vh-100 bg-light py-4">
        <div className="container">

          {/* Welcome Banner */}
          <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
            <div className="card-body p-4 text-white"
              style={{ background: "linear-gradient(135deg,#198754,#20c997)" }}>
              <div className="row align-items-center">
                <div className="col">
                  <div className="d-flex align-items-center gap-3">
                    <div className="rounded-circle bg-white text-success fw-bold
                      d-flex align-items-center justify-content-center"
                      style={{ width: 60, height: 60, fontSize: 24 }}>
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="fw-bold mb-1">Namaste, {user?.name}! 🙏</h4>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span className="badge bg-white text-success">{roleBadge}</span>
                        <span className="opacity-75 small">📍 {user?.location || "India"}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-auto d-none d-md-block text-end">
                  <div className="opacity-75 small mb-1">Aaj ka din</div>
                  <div className="fw-semibold">
                    {new Date().toLocaleDateString("hi-IN", {
                      weekday: "long", day: "numeric", month: "long"
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="row g-3 mb-4">
            {statsCards.map((s, i) => (
              <div key={i} className="col-6 col-md-3">
                <div className="card border-0 shadow-sm rounded-4 h-100">
                  <div className="card-body p-3 text-center">
                    <div style={{ fontSize: 36 }}>{s.icon}</div>
                    <h3 className={`fw-bold text-${s.color} mb-0 mt-1`}>{s.value}</h3>
                    <small className="text-muted">{s.label}</small>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Farmer Earning */}
          {isFarmer && (
            <div className="card border-0 shadow-sm rounded-4 mb-4"
              style={{ background: "linear-gradient(135deg,#fff3cd,#ffeeba)" }}>
              <div className="card-body p-4 d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Kul Kamai</h6>
                  <h2 className="fw-bold text-success mb-0">₹{stats.totalEarned}</h2>
                  <small className="text-muted">Saare orders se</small>
                </div>
                <div style={{ fontSize: 56 }}>💰</div>
              </div>
            </div>
          )}

          {/* Agent Info */}
          {isAgent && (
            <div className="card border-0 shadow-sm rounded-4 mb-4"
              style={{ background: "linear-gradient(135deg,#fff3cd,#ffe69c)" }}>
              <div className="card-body p-4 d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Aapki Location</h6>
                  <h2 className="fw-bold text-warning mb-0">{user?.location || "N/A"}</h2>
                  <small className="text-muted">{agentRates.length} rates add kiye hain</small>
                </div>
                <div style={{ fontSize: 56 }}>🏪</div>
              </div>
            </div>
          )}

          <div className="row g-4">
            <div className={isFarmer || isAgent ? "col-lg-8" : "col-12"}>

              {/* Recent Orders */}
              <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold text-success mb-0">🕐 Recent Orders</h6>
                    <Link href="/Orders" className="btn btn-sm btn-outline-success">
                      View All →
                    </Link>
                  </div>
                  {recentOrders.length === 0 ? (
                    <div className="text-center py-4">
                      <div style={{ fontSize: 48 }}>📭</div>
                      <p className="text-muted mt-2">Koi order nahi hai abhi</p>
                      {!isAgent && (
                        <Link href="/Product" className="btn btn-success btn-sm">
                          🛒 Shop Now
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-2">
                      {recentOrders.map((order) => (
                        <Link key={order._id} href={`/Orders/${order._id}`}
                          className="text-decoration-none">
                          <div className="d-flex justify-content-between align-items-center
                            p-3 bg-light rounded-3">
                            <div className="d-flex align-items-center gap-3">
                              <div style={{ fontSize: 24 }}>{STATUS_ICONS[order.status]}</div>
                              <div>
                                <div className="fw-semibold text-dark">{order.product_name}</div>
                                <small className="text-muted">
                                  {order.quantity} {order.unit} •{" "}
                                  {new Date(order.createdAt).toLocaleDateString("hi-IN")}
                                </small>
                              </div>
                            </div>
                            <div className="text-end">
                              <div className="fw-bold text-success">₹{order.total_price}</div>
                              <span className={`badge bg-${STATUS_COLORS[order.status]}`}>
                                {order.status}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body p-4">
                  <h6 className="fw-bold text-success mb-3">⚡ Quick Actions</h6>
                  <div className="row g-2">
                    {quickActions.map(({ href, icon, label, bg }) => (
                      <div key={href + label} className="col-4 col-md-3">
                        <Link href={href} className="text-decoration-none">
                          <div className={`card border-0 bg-${bg} bg-opacity-10 rounded-3 text-center p-3`}>
                            <div style={{ fontSize: 28 }}>{icon}</div>
                            <small className={`fw-semibold text-${bg} d-block mt-1`}>{label}</small>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right — Farmer */}
            {isFarmer && (
              <div className="col-lg-4">
                <div className="card border-0 shadow-sm rounded-4">
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold text-success mb-0">🌾 My Products</h6>
                      <Link href="/ProductAdd" className="btn btn-sm btn-success">➕ Add</Link>
                    </div>
                    {myProducts.length === 0 ? (
                      <div className="text-center py-3">
                        <p className="text-muted small">Koi product nahi hai</p>
                        <Link href="/ProductAdd" className="btn btn-success btn-sm">
                          ➕ Add Product
                        </Link>
                      </div>
                    ) : (
                      <div className="d-flex flex-column gap-2">
                        {myProducts.map((p: any) => (
                          <Link key={p._id} href={`/ProductView/${p._id}`}
                            className="text-decoration-none">
                            <div className="d-flex align-items-center gap-3 p-2 bg-light rounded-3">
                              <img
                                src={p.image_url || "https://placehold.co/48x48/e8f5e9/198754?text=🌾"}
                                alt={p.name} className="rounded-2"
                                style={{ width: 48, height: 48, objectFit: "cover" }}
                              />
                              <div className="flex-fill">
                                <div className="fw-semibold text-dark small">{p.name}</div>
                                <div className="text-success fw-bold small">
                                  ₹{p.price}/{p.unit}
                                </div>
                              </div>
                              <span className={`badge bg-${p.is_available ? "danger" : "secondary"}`}>
                                {p.is_available ? "Live" : "Off"}
                              </span>
                            </div>
                          </Link>
                        ))}
                        <Link href="/Product" className="btn btn-outline-success btn-sm mt-1">
                          View All →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Right — Agent */}
            {isAgent && (
              <div className="col-lg-4">
                <div className="card border-0 shadow-sm rounded-4">
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold text-warning mb-0">🏪 My Rates</h6>
                      <Link href="/Rates" className="btn btn-sm btn-warning text-white">
                        ➕ Add Rate
                      </Link>
                    </div>
                    {agentRates.length === 0 ? (
                      <div className="text-center py-3">
                        <p className="text-muted small">Koi rate add nahi kiya abhi</p>
                        <Link href="/Rates" className="btn btn-warning btn-sm text-white">
                          ➕ Rate Add Karo
                        </Link>
                      </div>
                    ) : (
                      <div className="d-flex flex-column gap-2">
                        {agentRates.slice(0, 5).map((r: any) => (
                          <div key={r._id}
                            className="d-flex align-items-center justify-content-between
                              p-2 bg-light rounded-3">
                            <div>
                              <div className="fw-semibold text-dark small">{r.product_name}</div>
                              <small className="text-muted">📍 {r.location}</small>
                            </div>
                            <div className="text-end">
                              <div className="text-success fw-bold small">
                                ₹{r.price}/{r.unit}
                              </div>
                              <span className={`badge bg-${
                                !r.change || r.change === "0%" ? "secondary"
                                : r.change.startsWith("-") ? "danger" : "success"
                              }`}>
                                {r.change || "0%"}
                              </span>
                            </div>
                          </div>
                        ))}
                        <Link href="/Rates" className="btn btn-outline-warning btn-sm mt-1">
                          Sab Rates Dekho →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}