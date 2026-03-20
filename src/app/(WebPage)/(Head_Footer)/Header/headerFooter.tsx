// src/app/(WebPage)/(Head_Footer)/Header/headerFooter.tsx
"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const HeaderFooter = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));

    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]); // pathname change pe re-run — login/logout ke baad update ho

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/");
  };

  const isActive = (path: string) =>
    pathname === path ? "nav-link active fw-semibold text-success" : "nav-link text-dark";

  return (
    <>
    <nav className={`navbar navbar-expand-lg bg-white sticky-top ${scrolled ? "shadow" : "border-bottom"}`}
      style={{ transition: "box-shadow 0.3s" }}>
      <div className="container">

        {/* Logo */}
        <Link href="/" className="navbar-brand d-flex align-items-center gap-2 text-decoration-none">
          <span style={{ fontSize: 28 }}>🌱</span>
          <span className="fw-bold text-success fs-5">demo</span>
        </Link>

        {/* Mobile Toggle */}
        <button className="navbar-toggler border-0" type="button"
          data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">

          {/* Center Links */}
        <ul className="navbar-nav mx-auto gap-1">

  {/* Guest + Buyer + Farmer — Products */}
  {user?.role !== "agent" && (
    <li className="nav-item">
      <Link href="/Product" className={isActive("/Product")}>
        🛒 Products
      </Link>
    </li>
  )}

  {/* Buyer + Farmer — Mandi Rates */}
  {(user?.role === "buyer" || user?.role === "farmer" || !user) && (
    <li className="nav-item">
      <Link href="/Rates" className={isActive("/Rates")}>
        📊 Mandi Rates
      </Link>
    </li>
  )}

  {/* Agent — Agent Rates */}
  {user?.role === "agent" && (
    <li className="nav-item">
      <Link href="/Rates" className={isActive("/Rates")}>
        🏪 Agent Rates
      </Link>
    </li>
  )}

  {/* Logged in — My Orders */}
  {user && (
    <li className="nav-item">
      <Link href="/Orders" className={isActive("/Orders")}>
        📦 My Orders
      </Link>
    </li>
  )}

  {/* Farmer — Add Product */}
  {user?.role === "farmer" && (
    <li className="nav-item">
      <Link href="/ProductAdd" className={isActive("/ProductAdd")}>
        ➕ Add Product
      </Link>
    </li>
  )}

  {/* Agent — Add Product + Rate Manage */}
  {user?.role === "agent" && (
    <>
      <li className="nav-item">
        <Link href="/ProductAdd" className={isActive("/ProductAdd")}>
          ➕ Add Product
        </Link>
      </li>
    </>
  )}

</ul>

          {/* Right Side */}
          <div className="d-flex align-items-center gap-2">
            {user ? (
              <div className="dropdown">
                <button
                  className="btn btn-outline-success dropdown-toggle d-flex align-items-center gap-2"
                  data-bs-toggle="dropdown">
                  <div className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center fw-bold"
                    style={{ width: 32, height: 32, fontSize: 14 }}>
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="d-none d-lg-inline">{user.name?.split(" ")[0]}</span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end shadow border-0 rounded-3 mt-1">
                  <li>
                    <div className="dropdown-item-text px-3 py-2">
                      <div className="fw-semibold">{user.name}</div>
                      <small className="text-muted">{user.email}</small>
                      <div>
                   <span className={`badge ${user.role === "farmer" ? "bg-success" :
                     user.role === "agent"  ? "bg-warning text-dark" : "bg-primary"
                     } mt-1`}> {user.role} </span>
                      </div>
                    </div>
                  </li>
                  <li><hr className="dropdown-divider my-1" /></li>
                  <li>
                    <Link href="/Profile" className="dropdown-item py-2">
                      👤 Profile
                    </Link>
                  </li>
                  <li>
                    <Link href="/Dashboard" className="dropdown-item py-2">
                      📊 Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link href="/Orders" className="dropdown-item py-2">
                      📦 My Orders
                    </Link>
                  </li>
                  {user.role === "farmer" && (
                    <li>
                      <Link href="/AddProduct" className="dropdown-item py-2">
                        ➕ Add Product
                      </Link>
                    </li>
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
                <Link href="/Login" className="btn btn-outline-success btn-sm px-3">
                  Login
                </Link>
                <Link href="/Register" className="btn btn-success btn-sm px-3">
                  Register
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
    </>
  );
};

export default HeaderFooter;
