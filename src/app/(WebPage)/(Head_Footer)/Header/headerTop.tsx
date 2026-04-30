"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import GoogleTranslate from "../../Dynamic/GoogleTranslate/GoogleTranslate";

const HeaderTop = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // ✅ Central function to load user from localStorage
  const loadUser = () => {
    const stored = localStorage.getItem("user");
    setUser(stored ? JSON.parse(stored) : null);
  };
  useEffect(() => {
    loadUser();
    setReady(true);
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("storage", loadUser);
    window.addEventListener("authChange", loadUser);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("storage", loadUser);
      window.removeEventListener("authChange", loadUser);
    };
  }, []);
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.dispatchEvent(new Event("authChange"));
    router.push("/");
  };
  const isFarmer          = user?.role === "farmer";
  const isAgent           = user?.role === "agent";
  const isDeliveryPartner = user?.role === "dpartner";
  const isBuyer           = user?.role === "buyer";
  const isAdmin           = user?.role === "admin";
  if (!ready) return null;

  return (
    <header>
      <div className="top-bg d-lg-block-1">
        <div className="container-fluid py-2 d-lg-block px-lg-5">
          <div className="row gx-0">

            {/* LEFT */}
            <div className="col-lg-8 d-none d-sm-inline text-lg-start text-center">
              <div className="d-inline-flex">
                <small className="me-3 text-light">📍 Noida, Uttar Pradesh</small>
                <small className="me-3 text-light">📞 +91-9170973916</small>
                <small className="text-light">✉ demo453@gmail.com</small>
              </div>
            </div>

            {/* RIGHT */}
            <div className="col-lg-4 text-center text-lg-end">
              <div className="d-inline-flex align-items-center gap-2">

                {/* ACCOUNT DROPDOWN */}
                <div className="dropdown">
                  <Link href="#"
                    className="nav-link dropdown-toggle text-white p-2"
                    data-bs-toggle="dropdown">
                    {user ? user.name?.split(" ")[0] : "My Account"}
                  </Link>

                   <ul className="dropdown-menu dropdown-menu-end">
                    {user && (
                      <>
                        <li className="px-3 py-2">
                          <div className="fw-semibold">{user.name}</div>
                          <small className="text-muted">{user.email}</small>
                          <div>
                            <span className="badge bg-primary mt-1">{user.role}</span>
                          </div>
                        </li>
                        <li><hr className="dropdown-divider" /></li>
                      </>
                    )}

                    <li>
                      <Link href="/Product" className="dropdown-item">🛒 Products</Link>
                    </li>
                    <li>
                      <Link href="/Rates" className="dropdown-item">
                        {isAgent ? "🏪 Agent Rates" : "📊 Mandi Rates"}
                      </Link>
                    </li>

                    {(isBuyer || isFarmer || isDeliveryPartner) && (
                      <li>
                        <Link href="/Orders" className="dropdown-item">📦 Orders</Link>
                      </li>
                    )}

                    {isFarmer && (
                      <li>
                        <Link href="/ProductAdd" className="dropdown-item">➕ Add Product</Link>
                      </li>
                    )}

                    {isAgent && (
                      <>
                        <li>
                          <Link href="/Dashboard" className="dropdown-item">📊 Dashboard</Link>
                        </li>
                        <li>
                          <Link href="/ProductAdd" className="dropdown-item">➕ Add Product</Link>
                        </li>
                      </>
                    )}

                    {isDeliveryPartner && (
                      <>
                        <li>
                          <Link href="/Orders" className="dropdown-item">📦 Assigned Orders</Link>
                        </li>
                        <li>
                          <Link href="/Delivery" className="dropdown-item">🚚 Deliveries</Link>
                        </li>
                      </>
                    )}

                    <li><hr className="dropdown-divider" /></li>

                    {user ? (
                      <li>
                        <button onClick={logout} className="dropdown-item text-danger">
                          🚪 Logout
                        </button>
                      </li>
                    ) : (
                      <>
                        <li>
                          <Link href="/Login" className="dropdown-item">Login</Link>
                        </li>
                        <li>
                          <Link href="/Register" className="dropdown-item">Register</Link>
                        </li>
                      </>
                    )}
                  </ul>
                </div>

                {/* Language */}
                <div className="nav-item dropdown">
                  <Link
                    href="#"
                    className="nav-link dropdown-toggle text-white p-2"
                    data-bs-toggle="dropdown"
                  >
                    Language
                  </Link>
                  <div className="dropdown-menu m-0" translate="no">
                    <GoogleTranslate />
                  </div>
                </div>

                {/* Theme */}
                <div className="nav-item dropdown">
                  <Link
                    href="#"
                    className="nav-link dropdown-toggle text-white p-2"
                    data-bs-toggle="dropdown"
                  >
                    Theme
                  </Link>
                  <div className="dropdown-menu m-0">
                    <Link href="#" className="dropdown-item">
                      Light
                    </Link>
                    <Link href="#" className="dropdown-item">
                      Dark
                    </Link>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderTop;