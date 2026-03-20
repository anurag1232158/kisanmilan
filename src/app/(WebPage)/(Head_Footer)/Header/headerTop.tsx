"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
// import { useTheme } from "../../../ThemeProvider/ThemeProvider";
import GoogleTranslate from "../../Dynamic/GoogleTranslate/GoogleTranslate";

const HeaderTop = () => {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState(""); // Track role
  // const { theme, setTheme } = useTheme();

  // ✅ Check login + role
  useEffect(() => {
    const checkAuth = () => {
  const savedUser = localStorage.getItem("user");
if (savedUser) {
  const parsed = JSON.parse(savedUser);
  setIsLoggedIn(true);
  setRole(parsed.role || "");
} else {
  setIsLoggedIn(false);
  setRole("");
}
    };
    checkAuth();
    window.addEventListener("pageshow", checkAuth);
    return () => window.removeEventListener("pageshow", checkAuth);
  }, []);

  // ✅ Logout handler
  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");
    if (confirmLogout) {
      localStorage.removeItem("user");
localStorage.removeItem("token");
      setIsLoggedIn(false);
      setRole("");
      router.replace("/");
    }
  };

  return (
    <header>
      <div className="top-bg d-lg-block-1">
        <div className="container-fluid py-2 d-lg-block px-lg-5">
          <div className="row gx-0">
            {/* Left side contact info */}
            <div className="col-lg-8 text-center text-lg-start mb-2 mb-lg-0 d-none d-sm-inline">
              <div className="d-inline-flex">
                <small className="me-3 fw text-light">
                  <Link
                    target="_blank"
                    href="https://www.google.com/maps/search/Varanasi,+Shri Kashi Vishwanath Temple Dwar,+Uttar+Pradesh"
                    className="mobils text-white"
                  >
                    B-128 Harola, Sector 5, Noida, U.P. 201301
                  </Link>
                </small>
                <small className="me-3 fw text-light">
                  <Link
                    target="_blank"
                    href="https://wa.me/+919170973916"
                    className="mobils text-white"
                  >
                    +91-9170973916{" "}
                  </Link>
                </small>
                <small className="text-light fw">
                  <Link
                    target="_blank"
                    href="mailto:demo453@gmail.com"
                    className="text-white"
                  >
                    demo453@gmail.com
                  </Link>
                </small>
              </div>
            </div>

            {/* Right side */}
            <div className="col-lg-4 text-center text-lg-end">
              <div className="d-inline-flex">
                {/* ✅ My Account dropdown (role-based items) */}
                <div className="nav-item dropdown">
                  <Link
                    href="#"
                    className="nav-link dropdown-toggle text-white p-2"
                    data-bs-toggle="dropdown"
                  >
                    My Account
                  </Link>

                  <div className="dropdown-menu m-0">
                    {/* ---- GUEST (not logged in) ---- */}
                    {!isLoggedIn && (
                      <>
                        <Link href="/Login" className="dropdown-item">
                          Login
                        </Link>
                        <Link href="/Register" className="dropdown-item">
                          Register
                        </Link>
                      </>
                    )}

                    {/* ---- USER ---- */}
                 {isLoggedIn && (role === "buyer" || role === "farmer" || role === "agent") && (
                 <>
    <Link href="/Dashboard" className="dropdown-item">📊 Dashboard</Link>
    <Link href="/Profile" className="dropdown-item">👤 Profile</Link>
    <Link href="/Orders" className="dropdown-item">📦 My Orders</Link>
    {(role === "farmer" || role === "agent") && (
      <Link href="/ProductAdd" className="dropdown-item">➕ Add Product</Link>
    )}
    <button onClick={handleLogout}
      className="dropdown-item text-start bg-transparent border-0 w-100 text-danger">
      🚪 Logout
    </button>
                 </>
                 )}
                    {/* ---- ADMIN ---- */}
                    {isLoggedIn && role === "admin" && (
                      <>
                        <Link href="/AdminDashboard" className="dropdown-item">
                          Admin Dashboard
                        </Link>
                        <Link href="/AdminHome" className="dropdown-item">
                          Admin Home
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="dropdown-item text-start bg-transparent border-0 w-100"
                        >
                          Logout
                        </button>
                      </>
                    )}
                  </div>
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
