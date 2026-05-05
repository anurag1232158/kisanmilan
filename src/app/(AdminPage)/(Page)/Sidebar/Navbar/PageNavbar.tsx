"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface PageNavbarProps {
  toggleSidebar: () => void;
}

interface Admin {
  name: string;
  role: string;
  pic?: string;
}

interface Message {
  name: string;
  message: string;
  time: string;
}

interface Notification {
  text: string;
  time?: string;
}

const PageNavbar: React.FC<PageNavbarProps> = ({ toggleSidebar }) => {
  const router = useRouter();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showAllMessages, setShowAllMessages] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<
    "messages" | "notifications" | null
  >(null);

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
    fetchProducts(); // optional, if you want to fetch products here
  }, []);

  const fetchProducts = async () => {
    // Example fetch logic (optional)
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.ok ? await res.json() : [];
      // handle data
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/AdminLogin");
  };

  return (
    <nav className="navbar navbar-expand bg-light navbar-light sticky-top px-4 py-2 sticky-top-flex">
      {/* Sidebar toggle */}
      <a href="#" className="sidebar-toggler flex-shrink-0" onClick={toggleSidebar}>
        <i className="fa fa-bars"></i>
      </a>

      {/* Search */}
      <form className="d-none d-md-flex ms-4" style={{ width: "40%" }}>
        <div className="position-relative w-100">
          <input type="text" className="form-control ps-5" placeholder="Search..." />
          <i className="fa fa-search position-absolute top-50 start-0 translate-middle-y text-muted ms-3"></i>
        </div>
      </form>

      <div className="navbar-nav align-items-center ms-auto w-100 justify-content-center">
        {/* Messages */}
        <div className={`nav-item dropdown mx-3 ${activeDropdown === "messages" ? "show" : ""}`}>
          <a
            href="#"
            className="nav-link dropdown-toggle"
            onClick={(e) => {
              e.preventDefault();
              setActiveDropdown(activeDropdown === "messages" ? null : "messages");
            }}
          >
            <i className="fa fa-envelope me-lg-2"></i>
            <span className="d-none d-lg-inline-flex">Messages</span>
            {messages.length > 0 && (
              <span className="position-absolute start-100 translate-middle badge rounded-pill bg-danger">
                {messages.length}
              </span>
            )}
          </a>

          <div className={`dropdown-menu bg-light border-0 rounded-0 rounded-bottom m-0 ${activeDropdown === "messages" ? "show" : ""}`}>
            {messages.length > 0 ? (
              (showAllMessages ? messages : messages.slice(0, 4)).map((item, index) => (
                <div key={index}>
                  <Link href="/AdminMessageBox" className="dropdown-item">
                    <div className="d-flex align-items-center">
                      <i className="fa fa-user mx-3 fs-4"></i>
                      <div className="ms-2">
                        <h6 className="fw-normal mb-0">
                          {item.name}: {item.message} <small>{item.time}</small>
                        </h6>
                      </div>
                    </div>
                  </Link>
                  <hr className="dropdown-divider" />
                </div>
              ))
            ) : (
              <span className="dropdown-item text-center">No messages</span>
            )}
            {messages.length > 4 && !showAllMessages && (
              <span onClick={() => setShowAllMessages(true)} className="dropdown-item text-center text-dark" style={{ cursor: "pointer" }}>
                See All Messages
              </span>
            )}
            {showAllMessages && (
              <span onClick={() => setShowAllMessages(false)} className="dropdown-item text-center text-dark" style={{ cursor: "pointer" }}>
                Show Less
              </span>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className={`nav-item dropdown mx-4 ${activeDropdown === "notifications" ? "show" : ""}`}>
          <a
            href="#"
            className="nav-link dropdown-toggle"
            onClick={(e) => {
              e.preventDefault();
              setActiveDropdown(activeDropdown === "notifications" ? null : "notifications");
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

          <div className={`dropdown-menu dropdown-menu-end bg-light border-0 rounded-0 rounded-bottom m-0 ${activeDropdown === "notifications" ? "show" : ""}`}>
            {notifications.length > 0 ? (
              notifications.slice(0, 4).map((n, idx) => (
                <div key={idx}>
                  <Link href="/AdminNewslatter" className="dropdown-item">
                    <h6 className="fw-normal mb-0">{n.text}</h6>
                    <small className="text-secondary">{n.time || "Just now"}</small>
                  </Link>
                  <hr className="dropdown-divider" />
                </div>
              ))
            ) : (
              <span className="dropdown-item text-center">No Notifications</span>
            )}
            {notifications.length > 4 && (
              <Link href="/AdminNewslatter" className="dropdown-item text-center">
                See All Notifications
              </Link>
            )}
          </div>
        </div>

        {/* Profile */}
        <div className="nav-item dropdown mx-3">
          <a href="#" className="nav-link dropdown-toggle" data-bs-toggle="dropdown">
            <i className="fa fa-user me-lg-2"></i>
            <img
              className="rounded-circle me-lg-2"
              style={{ width: "30px", height: "30px", objectFit: "cover" }}
              src={admin?.pic ? `/assets/images/${admin.pic}` : "/assets/images/them-1.jpg"}
              alt="Profile"
            />
            <span className="d-none d-lg-inline-flex">{admin?.name || "Admin"}</span>
          </a>
          <div className="dropdown-menu dropdown-menu-end bg-light border-0 rounded-0 rounded-bottom m-0 w-100">
            <Link href="/AdminProfile" className="dropdown-item">My Profile</Link>
            <span onClick={handleLogout} className="dropdown-item" style={{ cursor: "pointer" }}>Logout</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default PageNavbar;