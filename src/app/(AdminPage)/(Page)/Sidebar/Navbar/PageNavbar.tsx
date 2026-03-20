"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "./auth";

interface PageNavbarProps {
  toggleSidebar: () => void;
}

const PageNavbar: React.FC<PageNavbarProps> = ({ toggleSidebar }) => {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [content, setContent] = useState<any[]>([]);
  const [showAllMessages, setShowAllMessages] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<
    "messages" | "notifications" | null
  >(null);

  // ✅ fetch admin
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
        console.error("Error fetching admin:", err);
      }
    };
    fetchData();
  }, []);

  // ✅ store mock auth user in localStorage safely
  useEffect(() => {
    const authUser = {
      role: "admin",
      name: "John",
      pic: "profile.png",
      expiry: Date.now() + 30 * 60 * 1000, // 30 minutes
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("authUser", JSON.stringify(authUser));
    }
  }, []);

  // ✅ fetch messages
  useEffect(() => {
    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => {
        // If your data.json has a key like "mostbooked", use that:
        setContent(data.message || data);
      })
      .catch((err) => console.error("Error fetching services:", err));
  }, []);
  // ✅ fetch notifications
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [contactsRes, newsletterRes, appsRes, usersRes] =
          await Promise.all([
            fetch("/api/contacts"),
            fetch("/api/newsletter"),
            fetch("/api/applications"),
            fetch("/api/users"),
          ]);

        const contacts = contactsRes.ok ? await contactsRes.json() : [];
        const newsletters = newsletterRes.ok ? await newsletterRes.json() : [];
        const apps = appsRes.ok ? await appsRes.json() : [];
        const users = usersRes.ok ? await usersRes.json() : [];

        const allNotifications = [
          ...contacts.map((c: any) => ({
            type: "Contact",
            text: `${c.name} sent a message`,
            time: c.time,
          })),
          ...newsletters.map((n: any) => ({
            type: "Newsletter",
            text: `${n.email}`,
            time: n.time,
          })),
          ...apps.map((a: any) => ({
            type: "Application",
            text: `${a.name} applied`,
            time: a.time,
          })),
          ...users.map((u: any) => ({
            type: "User",
            text: `${u.name} registered`,
            time: u.time,
          })),
        ];

        setNotifications(allNotifications.reverse());
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };

    fetchAll();
  }, []);

  // ✅ logout handler
  const handleLogout = () => {
    localStorage.removeItem("authUser");
    router.replace("/AdminLogin");
  };

  return (
    <nav className="navbar navbar-expand bg-light navbar-light sticky-top px-4 py-2 sticky-top-flex">
      <Link
        href="#"
        className="sidebar-toggler flex-shrink-0"
        onClick={toggleSidebar}
      >
        <i className="fa fa-bars"></i>
      </Link>

      {/* 🔍 Search */}
      <form className="d-none d-md-flex ms-4" style={{ width: "40%" }}>
        <div className="position-relative w-100">
          <input
            type="text"
            className="form-control ps-5"
            placeholder="Search..."
          />
          <i className="fa fa-search position-absolute top-50 start-0 translate-middle-y text-muted ms-3"></i>
        </div>
      </form>

      <div className="navbar-nav align-items-center ms-lg-auto ms-sm-auto ms-0 w-100 justify-content-center ">
        {/* 📩 Messages */}
        <div
          className={`nav-item dropdown mx-3${
            activeDropdown === "messages" ? "show" : ""
          }`}
        >
          <a
            href="#"
            className="nav-link dropdown-toggle"
            onClick={(e) => {
              e.preventDefault();
              setActiveDropdown(
                activeDropdown === "messages" ? null : "messages"
              );
            }}
          >
            <i className="fa fa-envelope me-lg-2"></i>
            <span className="d-none d-lg-inline-flex">Messages</span>
            {content.length > 0 && (
              <span className="position-absolute start-100 translate-middle badge rounded-pill bg-danger">
                {content.length}
              </span>
            )}
          </a>

          <div
            className={`dropdown-menu bg-light border-0 rounded-0 rounded-bottom m-0 ${
              activeDropdown === "messages" ? "show" : ""
            }`}
          >
            {content.length > 0 ? (
              (showAllMessages ? content : content.slice(0, 4)).map(
                (item: any, index: number) => (
                  <div key={index}>
                    <Link href={`/AdminMessageBox`} className="dropdown-item">
                      <div className="d-flex align-items-center">
                        <i className="fa fa-user mx-3 fs-4"></i>
                        <div className="ms-2">
                          <h6 className="fw-normal mb-0">
                            {item.name} <span>{item.message}</span> {item.time}
                          </h6>
                        </div>
                      </div>
                    </Link>
                    <hr className="dropdown-divider" />
                  </div>
                )
              )
            ) : (
              <Link href="#" className="dropdown-item text-center">
                No messages
              </Link>
            )}
            {!showAllMessages && content.length > 4 && (
              <Link
                onClick={() => setShowAllMessages(true)}
                href={`/AdminMessageBox`}
                className="dropdown-item text-center text-dark"
              >
                See All Messages
              </Link>
            )}
            {showAllMessages && (
              <Link
                onClick={() => setShowAllMessages(false)}
                href="#"
                className="dropdown-item text-center text-dark"
              >
                Show Less
              </Link>
            )}
          </div>
        </div>

        {/* 🔔 Notifications */}
        <div
          className={`nav-item dropdown mx-4 ${
            activeDropdown === "notifications" ? "show" : ""
          }`}
        >
          <a
            href="#"
            className="nav-link dropdown-toggle"
            onClick={(e) => {
              e.preventDefault();
              setActiveDropdown(
                activeDropdown === "notifications" ? null : "notifications"
              );
            }}
          >
            <i className="fa fa-bell me-lg-2"></i>
            <span className="d-none d-lg-inline-flex">Notifications</span>
            {notifications.length > 0 && (
              <span className="position-absolute start-100 translate-middle badge rounded-pill bg-danger">
                {notifications.length}
              </span>
            )}
          </a>

          <div
            className={`dropdown-menu dropdown-menu-end bg-light border-0 rounded-0 rounded-bottom m-0 ${
              activeDropdown === "notifications" ? "show" : ""
            }`}
          >
            {notifications.length > 0 ? (
              notifications.slice(0, 4).map((n, index) => (
                <div key={index}>
                  <Link href="/AdminNewslatter" className="dropdown-item">
                    <h6 className="fw-normal mb-0">{n.text}</h6>
                    <span className="text-secondary small">
                      {n.time || "Just now"}
                    </span>
                  </Link>
                  <hr className="dropdown-divider" />
                </div>
              ))
            ) : (
              <Link href="#" className="dropdown-item text-center">
                No Notifications
              </Link>
            )}
            {notifications.length > 4 && (
              <Link
                href={`/AdminNewslatter`}
                className="dropdown-item text-center"
              >
                See All Notifications
              </Link>
            )}
          </div>
        </div>

        {/* 👤 Profile */}
        <div className="nav-item dropdown  mx-3">
          <Link
            href="#"
            className="nav-link dropdown-toggle"
            data-bs-toggle="dropdown"
          >
            <i className="fa fa-user me-lg-2"></i>
            <img
              className="rounded-circle me-lg-2"
              style={{ width: "30px", height: "30px", objectFit: "cover" }}
              src={
                admin?.pic
                  ? `/assets/images/${admin.pic}`
                  : "/assets/images/them-1.jpg"
              }
              alt="Profile"
            />
            <span className="d-none d-lg-inline-flex">
              {admin?.name || "Admin"}
            </span>
          </Link>
          <div className="dropdown-menu dropdown-menu-end bg-light border-0 rounded-0 rounded-bottom m-0 w-100">
            <Link href="/AdminProfile" className="dropdown-item">
              My Profile
            </Link>
            <span
              onClick={handleLogout}
              className="dropdown-item"
              style={{ cursor: "pointer" }}
            >
              Logout
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default PageNavbar;
