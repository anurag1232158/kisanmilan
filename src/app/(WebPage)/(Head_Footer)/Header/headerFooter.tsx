"use client";
import Link from "next/link";
import React, { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
const API = `${process.env.NEXT_PUBLIC_API_URL}`;

const HeaderFooter = () => {
  const router   = useRouter();
  const pathname = usePathname();
  const [user, setUser]           = useState<any>(null);
  const [scrolled, setScrolled]   = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount, setCartCount]         = useState(0);
  const loadUser = useCallback(() => {
    try {
      const stored = localStorage.getItem("user");
      if (!stored) { setUser(null); return; }
      const parsed = JSON.parse(stored);
      const validRoles = ["farmer", "buyer", "agent", "dpartner", "admin"];
      if (parsed && validRoles.includes(parsed.role)) {
        setUser(parsed); 
      } else { 
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  // ✅ Fetch wishlist count from backend
  const fetchWishlistCount = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) { setWishlistCount(0); return; }
    try {
      const res  = await fetch(`${API}/wishlist`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setWishlistCount(Array.isArray(data) ? data.length : 0);
    } catch {
      setWishlistCount(0);
    }
  }, []);

const fetchCartCount = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) { setCartCount(0); return; }
    try {
      const res  = await fetch(`${API}/cart`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setCartCount(Array.isArray(data) ? data.length : 0);
    } catch {
      setCartCount(0);
    }
  }, []);

  useEffect(() => {
    loadUser();
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("storage", loadUser);
    window.addEventListener("authChange", loadUser);
    window.addEventListener("cartUpdate",     fetchCartCount);
    window.addEventListener("wishlistUpdate", fetchWishlistCount);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("storage", loadUser);
      window.removeEventListener("authChange", loadUser);
      window.removeEventListener("cartUpdate",     fetchCartCount);
      window.removeEventListener("wishlistUpdate", fetchWishlistCount);
    };
  }, [loadUser, fetchCartCount, fetchWishlistCount]);

  useEffect(() => {
    loadUser();
  }, [pathname]);

  useEffect(() => {
    if (user) {
      fetchWishlistCount();
      fetchCartCount();
    } else {
      setWishlistCount(0);
      setCartCount(0);
    }
  }, [user, pathname]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("wishlist");
    setUser(null);
    setWishlistCount(0);
    setCartCount(0);
    window.dispatchEvent(new Event("authChange"));
    router.push("/");
  };

  const nav = (path: string) =>
    pathname === path
      ? "nav-link fw-semibold text-success"
      : "nav-link text-dark";

  const isFarmer          = user?.role === "farmer";
  const isAgent           = user?.role === "agent";
  const isDeliveryPartner = user?.role === "dpartner";
  const isBuyer           = user?.role === "buyer";
  const isAdmin           = user?.role === "admin";
  const isGuest           = !user;

  const roleBadgeClass =
    isFarmer            ? "bg-success"
    : isAgent           ? "bg-warning text-dark"
    : isBuyer           ? "bg-danger"
    : isDeliveryPartner ? "bg-info"
    : isAdmin           ? "bg-danger"
    : "bg-primary";

  // ✅ Show wishlist + cart for buyers, farmers, dpartners
  const showWishlistCart = isBuyer || isFarmer || isDeliveryPartner;
const closeNavbar = () => {
  const navbar = document.getElementById('navbarNav');
  if (navbar && navbar.classList.contains('show')) {
    navbar.classList.remove('show');
  }
};
  return (
    <>
      <nav className={`navbar navbar-expand-lg px-md-5 p-2 sticky-top bg-white ${scrolled ? "shadow-sm" : ""}`}
        style={{ transition: "box-shadow 0.2s", borderBottom: "1px solid #e9ecef", zIndex: 1030 }}>
      
        {/* ── Logo ── */}
        <Link href="/" className="navbar-brand d-flex align-items-center gap-2 text-decoration-none">
          <span style={{ fontSize: 26 }}>🌱</span>
          <span className="fw-bold text-success fs-5">kisanmilan</span>
        </Link>

        {/* ── Mobile Toggle ── */}
        <button className="btn btn-sm navbar-toggler border text-dark" 
        type="button"  data-bs-toggle="collapse" data-bs-target="#navbarNav"> 
         <span className="navbar-toggler-icon text-dark" />
        </button>

          <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav mx-auto gap-1">
            {!isAgent && (
              <li className="nav-item">
                <Link href="/Product" className={nav("/Product")} onClick={closeNavbar}>🛒 Products</Link>
              </li>
              )}

            <li className="nav-item">
              <Link href="/Rates" className={nav("/Rates")} onClick={closeNavbar}>
                {isAgent ? "🏪 Add Rate" : "📊 Mandi Rates"}
              </Link>
            </li>

            {(isBuyer || isFarmer) && (
              <li className="nav-item">
                <Link href="/Orders" className={nav("/Orders")} onClick={closeNavbar}>📦 Orders</Link>
              </li>
            )}

            {isFarmer && (
              <li className="nav-item">
                <Link href="/ProductAdd" className={nav("/ProductAdd")} onClick={closeNavbar}>➕ Add Product</Link>
              </li>
            )}

            {isAgent && (
              <>
                <li className="nav-item">
                  <Link href="/Dashboard" className={nav("/Dashboard")} onClick={closeNavbar}>📊 Dashboard</Link>
                </li>
                <li className="nav-item">
                  <Link href="/Product" className={nav("/Product")} onClick={closeNavbar}>🔍 View Products</Link>
                </li>
              </>
            )}

            {isDeliveryPartner && (
              <>
                <li className="nav-item">
                  <Link href="/Orders" className={nav("/Orders")} onClick={closeNavbar}>📦 Assigned Orders</Link>
                </li>
                <li className="nav-item">
                  <Link href="/Delivery" className={nav("/Delivery")} onClick={closeNavbar}>🚚 Deliveries</Link>
                </li>
              </>
            )}
          </ul>

          {/* ── Right Side ── */}
          <div className="d-flex align-items-center gap-3">

            {/* ✅ Wishlist Icon with badge */}
            {showWishlistCart && user && (
              <>
                <Link href="/Wishlist" className="position-relative text-decoration-none" title="Wishlist" style={{ lineHeight: 1 }} onClick={closeNavbar}>
                  <span style={{ fontSize: 22 }}>❤️</span>
                  
                  {wishlistCount > 0 && (
                    <span className="position-absolute badge rounded-pill bg-danger" 
                    style={{   top: -6, right: -8,   fontSize: 10, minWidth: 18, height: 18,   display: "flex", alignItems: "center", justifyContent: "center",   padding: "0 4px", }}>
                      {wishlistCount > 99 ? "99+" : wishlistCount}
                    </span>
                  )}
                </Link>

                {/* ✅ Cart Icon with badge */}
                <Link  href="/Cart"  className="position-relative text-decoration-none"  title="Cart"  style={{ lineHeight: 1 }} onClick={closeNavbar}>
                  <span style={{ fontSize: 22 }}>🛒</span>
                  {cartCount > 0 && (
                    <span  className="position-absolute badge rounded-pill bg-success" 
                     style={{top: -6, right: -8,fontSize: 10, minWidth: 18, height: 18,  display: "flex", alignItems: "center", justifyContent: "center",    padding: "0 4px",  }}>
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </Link>
              </>
            )}

            {/* ── User Dropdown / Login ── */}
            {user ? (
              <div className="dropdown">
                <button  className="btn btn-outline-success btn-sm dropdown-toggle d-flex align-items-center gap-2"  data-bs-toggle="dropdown">
                  <div className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center fw-bold"
                    style={{ width: 24, height: 24, fontSize: 12, flexShrink: 0 }}>
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="d-none d-lg-inline">{user.name?.split(" ")[0]}</span>
                </button>

                <ul className="dropdown-menu dropdown-menu-end shadow border-0 rounded-3 mt-1" style={{ minWidth: 220 }}>
                  {/* User Info */}
                  <li>
                    <div className="dropdown-item-text px-3 py-2">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <div className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                          style={{ width: 36, height: 36, fontSize: 14 }}>
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="fw-semibold" style={{ fontSize: 14 }}>{user.name}</div>
                          <small className="text-muted">{user.email}</small>
                        </div>
                      </div>
                      <span className={`badge ${roleBadgeClass} mt-1`} style={{ fontSize: 11 }}>
                        {user.role?.toUpperCase()}
                      </span>
                    </div>
                  </li>
                  <li><hr className="dropdown-divider my-1" /></li>
                  <li><Link href="/Profile"   className="dropdown-item py-2">👤 Profile</Link></li>
                  <li><Link href="/Dashboard" className="dropdown-item py-2">📊 Dashboard</Link></li>

                  {showWishlistCart && (
                    <>
                      <li><Link href="/Orders" className="dropdown-item py-2">📦 My Orders</Link></li>
                    </>
                  )}
                  {isFarmer && (
                    <li><Link href="/ProductAdd" className="dropdown-item py-2">➕ Add Product</Link></li>
                  )}
                  {isDeliveryPartner && (
                    <li><Link href="/Delivery" className="dropdown-item py-2">🚚 My Deliveries</Link></li>
                  )}
                  {isAdmin && (
                    <li><Link href="/AdminDashboard" className="dropdown-item py-2">🔧 Admin Panel</Link></li>
                  )}
                  <li><hr className="dropdown-divider my-1" /></li>
                  <li>
                    <button className="dropdown-item text-danger py-2" onClick={logout}>
                      🚪 Logout
                    </button>
                  </li>
                </ul> 
              </div>
            ) : (
              <div className="d-flex gap-2">
                <Link href="/Login"    className="btn btn-outline-success btn-sm px-3">Login</Link>
                <Link href="/Register" className="btn btn-success btn-sm px-3">Register</Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default HeaderFooter;