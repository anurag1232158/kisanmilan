"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import PageFooter from "../../../Sidebar/Footer/page";
import Sidebars from "../../../Sidebar/Sidebars/PageSidebar";
import PageNavbar from "../../../Sidebar/Navbar/PageNavbar";
import ASO from "../../../AOS/AOS";

interface Billing {
  name: string;
  email: string;
  phone: string;
  zip?: string;
  address?: string;
  city?: string;
  paymentMethod?: string;
}

interface CartItem {
  id: string;
  name: string;
  price: string;
  discount?: string;
  quantity: number;
}

interface Order {
  id: string;
  billing: Billing;
  cart: CartItem[];
  total: number;
  date?: string;
  status?: string;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [filterStatus, setFilterStatus] = useState("all");

  const itemsPerPage = 4;

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/bookingOrder", { cache: "no-store" });

      if (!res.ok) throw new Error("Failed to fetch booking data");

      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];

      const normalized = arr.map((o: any) => ({
        id: o.id || Math.random().toString(36).substr(2, 9),
        billing: o.billing || {
          name: "",
          email: "",
          phone: "",
          paymentMethod: "cod",
        },
        cart: o.cart || [],
        total: Number(o.total) || 0,
        date: o.date || o.createdAt || new Date().toLocaleString(),
        status: o.status || "pending",
      }));

      setOrders(normalized);
    } catch (err) {
      console.error("fetchOrders error:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const filteredOrders = orders.filter(
    (order) => filterStatus === "all" || order.status === filterStatus
  );

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const indexOfLastItem = (currentPage + 1) * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

  const handleDelete = async (orderId: string) => {
    if (!confirm("Are you sure you want to delete this order?")) return;

    try {
      const res = await fetch(`/api/bookingOrder?id=${orderId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        alert("Delete failed: " + err.error);
        return;
      }

      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      alert("Order deleted successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to delete order");
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/bookingOrder?id=${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert("Update failed: " + err.error);
        return;
      }

      await fetchOrders();
      alert("Status updated");
    } catch (err) {
      console.error("handleStatusUpdate", err);
      alert("Update failed");
    }
  };

  const getStatusBadge = (status: string = "pending") => {
    const map: Record<string, string> = {
      pending: "warning",
      confirmed: "info",
      shipped: "primary",
      delivered: "success",
      cancelled: "danger",
    };
    return `badge bg-${map[status] || "secondary"}`;
  };

  if (loading) return <></>;

  return (
    <>
      <ASO />

      <div className="wrapper">
        <Sidebars isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        <div className={`content ${isSidebarOpen ? "" : "collapsed"}`}>
          <PageNavbar toggleSidebar={toggleSidebar} />

          <section className="mb-5">
            <div className="container-fluid px-4">
              <div className="card">
                <div className="card-body bg-grays1">
                  <h5 className="bg-gradient text-center p-2 fw-bold mb-4">
                    Orders : {orders.length}
                  </h5>

                  {/* Filter Row */}
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Filter by Status:</label>
                      <select
                        className="form-select"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                      >
                        <option value="all">All Orders</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div className="col-md-6 d-flex align-items-end">
                      <button
                        className="btn btn-primary w-100"
                        onClick={fetchOrders}
                      >
                        <i className="fa fa-refresh"></i> Refresh Orders
                      </button>
                    </div>
                  </div>

                  {/* TABLE */}
                  <div
                    className="table"
                    style={{ maxHeight: "500px", overflowY: "auto" }}
                  >
                    <table className="table table-bordered table-hover">
                      <thead>
                        <tr className="text-center bg-gradient">
                          <th>#</th>
                          <th>Customer</th>
                          <th>Contact</th>
                          <th>Items</th>
                          <th>Total</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Payment</th>
                          <th>Actions</th>
                        </tr>
                      </thead>

                      <tbody>
                        {currentOrders.length > 0 ? (
                          currentOrders.map((order, index) => (
                            <tr key={order.id} className="text-center">
                              <td>{indexOfFirstItem + index + 1}</td>

                              <td className="text-start">
                                <strong>{order.billing.name}</strong>
                                <br />
                                <small>{order.billing.email}</small>
                              </td>

                              <td>{order.billing.phone}</td>

                              <td>
                                <small>
                                  {order.cart.length} item(s) <br />
                                  {order.cart.map((i) => i.name).join(", ")}
                                </small>
                              </td>

                              <td>₹{Number(order.total).toFixed(2)}</td>

                              <td>{order.date}</td>

                              <td>
                                <span className={getStatusBadge(order.status)}>
                                  {order.status}
                                </span>
                              </td>

                              <td>
                                <span className="badge bg-info">
                                  {String(
                                    order.billing.paymentMethod || "cod"
                                  ).toUpperCase()}
                                </span>
                              </td>

                              <td>
                                <div className="btn-group">
                                  <Link
                                    className="btn btn-info btn-sm mx-1"
                                    href={`/AdminViewPayment/${order.id}`}
                                  >
                                    <i className="fa fa-eye"></i>
                                  </Link>

                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDelete(order.id)}
                                  >
                                    <i className="fa fa-trash"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={9} className="text-center">
                              No orders found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="d-flex justify-content-center mt-3">
                      <button
                        className="btn btn-outline-primary me-2"
                        disabled={currentPage === 0}
                        onClick={() => setCurrentPage((p) => p - 1)}
                      >
                        Previous
                      </button>

                      <div className="px-3 align-self-center">
                        Page {currentPage + 1} of {totalPages}
                      </div>

                      <button
                        className="btn btn-outline-primary ms-2"
                        disabled={currentPage + 1 >= totalPages}
                        onClick={() => setCurrentPage((p) => p + 1)}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <PageFooter />
        </div>
      </div>
    </>
  );
}
