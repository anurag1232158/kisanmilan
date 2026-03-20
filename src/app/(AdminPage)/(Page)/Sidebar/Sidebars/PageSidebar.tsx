"use client";

import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

interface Admin {
  username: string;
  name: string;
  pic: string;
}
interface SidebarsProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}
const PageSidebar: React.FC<SidebarsProps> = ({
  isSidebarOpen,
  toggleSidebar,
}) => {
  const navigate = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const username = localStorage.getItem("username");
  const name = localStorage.getItem("name") || "Admin";
  const navContainerRef = useRef<HTMLDivElement>(null);
  const [userData, setUserData] = useState<any>(null);

  // ✅ Dropdown state
  const [openDropdown, setOpenDropdown] = useState(false);

  // Helper for active class

  // Toggle dropdown
  const toggleDropdown = () => {
    setOpenDropdown((prev) => !prev);
  };
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  // Redirect if not logged in
  useEffect(() => {
    const userId = localStorage.getItem("userid");
    if (!userId) {
      console.log("Admin not logged in, redirecting...");
      ("/AdminLogin");
    }
  }, [navigate]);

  // Fetch admin data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/admin");
        if (response.ok) {
          const result = await response.json();
          const user = result.find((item: any) => item.id === "33db");
          if (user) setAdmin(user);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, []);
  // Scroll active nav item into view
  useLayoutEffect(() => {
    if (navContainerRef.current) {
      const activeItem = navContainerRef.current.querySelector("a.active");
      if (activeItem)
        activeItem.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  // Helper to add active class
  const getNavClass = (href: string) =>
    `nav-item nav-link ${pathname === href ? "active" : ""}`;

  return (
    <>
      <div className={`sidebar pb-3 ${isSidebarOpen ? "" : "collapsed"}`}>
        <nav className="navbar bg-light navbar-light">
          {/* Logo */}
          <Link
            href="/AdminHome"
            className="navbar-brand mb-3 fs-2 fw-bold mx-3"
            onClick={scrollToTop}
          >
            <span className="text-primary">T</span> <span>-Home</span>
            <span className="sidebar-toggler" onClick={toggleSidebar}>
              <i className="fa fa-close d-lg-none float-end text-primary ms-5"></i>
            </span>
          </Link>

          {/* Profile */}
          <div className="d-flex align-items-center ms-4 mb-4">
            <div className="position-relative">
              <Link href="/AdminHome" onClick={scrollToTop}>
                <img
                  className="rounded-circle me-lg-2"
                  style={{ width: "50px", height: "50px", objectFit: "cover" }}
                  src={
                    admin?.pic
                      ? `/assets/images/${admin.pic}`
                      : "/assets/images/avatar/avatar-1.png"
                  }
                  alt={admin?.name || name}
                />
              </Link>
            </div>
            <div className="mx-3">
              <Link href="/AdminProfile" onClick={scrollToTop}>
                <h6 className="mb-0">{admin?.name || name}</h6>
                <span>{admin?.username || username}</span>
              </Link>
            </div>
          </div>

          {/* ⭐ SIDEBAR NAVIGATION (RESPONSIVE FIX) ⭐ */}
          <div className="col-12">
            {" "}
            {/* FULL WIDTH FOR ALL SCREENS */}
            <div className="navbar-nav" ref={navContainerRef}>
              <Link
                href="/AdminDashboard"
                className={getNavClass("/Dashboard")}
                onClick={scrollToTop}
              >
                <i className="fa fa-tachometer me-2"></i>Dashboard
              </Link>

              <Link
                href="/AdminAC"
                className={getNavClass("/AdminAC")}
                onClick={scrollToTop}
              >
                <i className="fa fa-snowflake-o me-2"></i> AC Service
              </Link>

              <Link
                href="/AdminCleaning"
                className={getNavClass("/AdminCleaning")}
                onClick={scrollToTop}
              >
                <i className="fa fa-street-view me-2"></i> Cleaning Service
              </Link>

              <Link
                href="/AdminFacade"
                className={getNavClass("/AdminFacade")}
                onClick={scrollToTop}
              >
                <i className="fa fa-building me-2"></i> Facade Service
              </Link>

              <Link
                href="/AdminPainting"
                className={getNavClass("/AdminPainting")}
                onClick={scrollToTop}
              >
                <i className="fa fa-paint-brush me-2"></i> Painting Service
              </Link>

              <Link
                href="/AdminCarpenter"
                className={getNavClass("/AdminCarpenter")}
                onClick={scrollToTop}
              >
                <i className="fa fa-wrench me-2"></i> Carpenter Service
              </Link>

              <Link
                href="/AdminCCTV"
                className={getNavClass("/AdminCCTV")}
                onClick={scrollToTop}
              >
                <i className="fa fa-camera me-2"></i>CCTV Service
              </Link>

              <Link
                href="/AdminHomeRepair"
                className={getNavClass("/AdminHomeRepair")}
                onClick={scrollToTop}
              >
                <i className="fa fa-home me-2"></i> Home Repair
              </Link>

              <Link
                href="/AdminPestControl"
                className={getNavClass("/AdminPestControl")}
                onClick={scrollToTop}
              >
                <i className="fa fa-bug me-2"></i> Pest Control
              </Link>

              <Link
                href="/AdminAppRepair"
                className={getNavClass("/AdminAppRepair")}
                onClick={scrollToTop}
              >
                <i className="fa fa-wrench me-2"></i> Appliance Repair
              </Link>

              <Link
                href="/AdminElectrical"
                className={getNavClass("/AdminElectrical")}
                onClick={scrollToTop}
              >
                <i className="fa fa-bolt me-2"></i> Electrical Service
              </Link>

              {/* DROPDOWN */}
              <Link
                href="/OtherService"
                className="nav-link dropdown-toggle"
                data-bs-toggle="dropdown"
              >
                <i className="fa fa-th me-2"></i> Other Service
              </Link>

              <div className="dropdown-menu bg-transparent border-0 w-auto">
                <Link
                  href="/AdminAboutUs"
                  className={`dropdown-item ${
                    pathname === "/AdminAboutUs" ? "active" : ""
                  }`}
                  onClick={scrollToTop}
                >
                  <i className="fa fa-info me-4"></i> About Us
                </Link>

                <Link
                  href="/AdminMessageBox"
                  className={`dropdown-item ${
                    pathname === "/AdminMessageBox" ? "active" : ""
                  }`}
                  onClick={scrollToTop}
                >
                  <i className="fa fa-comment me-2"></i> Message Box
                </Link>

                <Link
                  href="/AdminNewslatter"
                  className={`dropdown-item ${
                    pathname === "/AdminNewslatter" ? "active" : ""
                  }`}
                  onClick={scrollToTop}
                >
                  <i className="fa fa-envelope me-2"></i> Newsletter
                </Link>

                <Link
                  href="/AdminInvestor"
                  className={`dropdown-item ${
                    pathname === "/AdminInvestor" ? "active" : ""
                  }`}
                  onClick={scrollToTop}
                >
                  <i className="fa fa-user me-2"></i> Investor Relations
                </Link>

                <Link
                  href="/AdminLeadership"
                  className={`dropdown-item ${
                    pathname === "/AdminLeadership" ? "active" : ""
                  }`}
                  onClick={scrollToTop}
                >
                  <i className="fa fa-user me-2"></i> Leadership Team
                </Link>

                <Link
                  href="/AdminContactUs"
                  className={`dropdown-item ${
                    pathname === "/AdminContactUs" ? "active" : ""
                  }`}
                  onClick={scrollToTop}
                >
                  <i className="fa fa-send me-2"></i> Submit Form Details
                </Link>
              </div>

              <Link
                href="/AdminContact"
                className={getNavClass("/AdminContact")}
                onClick={scrollToTop}
              >
                <i className="fa fa-phone me-2"></i> Admin Contact
              </Link>

              <Link
                href="/AdminCareer"
                className={getNavClass("/AdminCareer")}
                onClick={scrollToTop}
              >
                <i className="fa fa-briefcase me-2"></i> Career & JoinUs
              </Link>

              <Link
                href="/AdminPayment"
                className={getNavClass("/AdminPayment")}
                onClick={scrollToTop}
              >
                <i className="fa fa-credit-card me-2"></i> Payment Method
              </Link>

              <Link
                href="/AdminApplicationsData"
                className={getNavClass("/AdminApplicationsData")}
                onClick={scrollToTop}
              >
                <i className="fa fa-newspaper-o me-2"></i> Applications Data
              </Link>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
};

export default PageSidebar;
