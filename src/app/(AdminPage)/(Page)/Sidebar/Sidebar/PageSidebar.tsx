"use client";

import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

interface Admin {
  username: string;
  name: string;
  pic?: string;
  role: string;
}

interface SidebarsProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const PageSidebar: React.FC<SidebarsProps> = ({ isSidebarOpen, toggleSidebar }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const navContainerRef = useRef<HTMLDivElement>(null);
  const [openDropdown, setOpenDropdown] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      router.push("/AdminLogin");
      return;
    }
    const user: Admin = JSON.parse(stored);
    if (user.role !== "admin") {
      router.push("/");
      return;
    }
    setAdmin(user);
  }, []);

  useLayoutEffect(() => {
    if (navContainerRef.current) {
      navContainerRef.current.style.height = `${window.innerHeight - navContainerRef.current.offsetTop}px`;
    }
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/AdminLogin");
  };

  const navLinks = [
    { href: "/AdminDashboard", icon: "📊", label: "Dashboard" },
    { href: "/AdminUsers", icon: "👥", label: "Users" },
    { href: "/AdminProducts", icon: "📦", label: "Products" },
    { href: "/AdminOrders", icon: "🧾", label: "Orders" },
    { href: "/AdminRates", icon: "📈", label: "Rates" },
  ];

  const getNavClass = (href: string) => `nav-link ${pathname === href ? "active" : ""}`;

  return (
    <div className={`sidebar pb-3 ${isSidebarOpen ? "" : "collapsed"}`}>
      <nav className="navbar bg-light navbar-light">
        {/* Logo */}
        <Link href="/AdminHome" className="navbar-brand mb-3 fs-2 fw-bold mx-3" onClick={scrollToTop}>
          <span className="text-primary">T</span>-Home
          <span className="sidebar-toggler" onClick={toggleSidebar}>
            <i className="fa fa-close d-lg-none float-end text-primary ms-5"></i>
          </span>
        </Link>

        {/* Profile */}
        <div className="d-flex align-items-center ms-4 mb-4">
          <div className="position-relative">
            <Link href="/AdminProfile" onClick={scrollToTop}>
              <img
                className="rounded-circle me-lg-2"
                style={{ width: "50px", height: "50px", objectFit: "cover" }}
                src={admin?.pic ? `/assets/images/${admin.pic}` : "/assets/images/avatar/avatar-1.png"}
                alt={admin?.name || "Admin"}
              />
            </Link>
          </div>
          <div className="mx-3">
            <Link href="/AdminProfile" onClick={scrollToTop}>
              <h6 className="mb-0">{admin?.name || "Admin"}</h6>
              <span>{admin?.username || "username"}</span>
            </Link>
          </div>
        </div>

        {/* Sidebar Links */}
        <div className="col-12">
          <div className="navbar-nav" ref={navContainerRef}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={getNavClass(link.href)}
                onClick={scrollToTop}
              >
                <span className="me-2">{link.icon}</span>
                {link.label}
              </Link>
            ))}

            {/* Dropdown Example */}
            <div className="nav-item dropdown">
              <a
                href="#"
                className="nav-link dropdown-toggle"
                onClick={(e) => {
                  e.preventDefault();
                  setOpenDropdown(!openDropdown);
                }}
              >
                <span className="me-2">⚙️</span>Other Services
              </a>
              {openDropdown && (
                <div className="dropdown-menu bg-transparent border-0 w-auto show">
                  <Link
                    href="/AdminAboutUs"
                    className={`dropdown-item ${pathname === "/AdminAboutUs" ? "active" : ""}`}
                    onClick={scrollToTop}
                  >
                    <i className="fa fa-info me-2"></i> About Us
                  </Link>
                  <Link
                    href="/AdminMessageBox"
                    className={`dropdown-item ${pathname === "/AdminMessageBox" ? "active" : ""}`}
                    onClick={scrollToTop}
                  >
                    <i className="fa fa-comment me-2"></i> Message Box
                  </Link>
                </div>
              )}
            </div>

            {/* Logout */}
            <div className="nav-item mt-3">
              <span className="nav-link" style={{ cursor: "pointer" }} onClick={handleLogout}>
                <i className="fa fa-sign-out me-2"></i> Logout
              </span>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default PageSidebar;