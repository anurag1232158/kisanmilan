// sabnew/src/app/(AdminPage)/(Page)/(OtherService)/(PaymentMethod)/AdminViewPayment/[id]/page.tsx
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import PageFooter from "../../../../Sidebar/Footer/page";
import Sidebars from "../../../../Sidebar/Sidebars/PageSidebar";
import PageNavbar from "../../../../Sidebar/Navbar/PageNavbar";
import ASO from "../../../../AOS/AOS";
import { useParams, useRouter } from "next/navigation";

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
  createdAt?: string;
}

function AdminViewPayment() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const params = useParams();
  const router = useRouter();

  // ---------------------------------------
  // Fetch Single Order
  // ---------------------------------------
  useEffect(() => {
    const fetchOrder = async () => {
      if (!params?.id) return;

      try {
        const res = await fetch(`/api/bookingOrder`);
        if (res.ok) {
          const orders = await res.json();

          const foundOrder = Array.isArray(orders)
            ? orders.find((o: Order) => o.id === params.id)
            : null;

          setOrder(foundOrder || null);
        }
      } catch (err) {
        console.error("❌ Error fetching order:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [params?.id]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // ---------------------------------------
  // Delete Order
  // ---------------------------------------
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this order?")) return;

    try {
      const res = await fetch(`/api/bookingOrder?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Order deleted successfully!");
        router.push("/AdminPayment");
      }
    } catch (err) {
      console.error("❌ Delete failed:", err);
    }
  };

  // ---------------------------------------
  // Update Status
  // ---------------------------------------
  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;

    try {
      const res = await fetch(`/api/bookingOrder?id=${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setOrder({ ...order, status: newStatus });
        alert("Status updated successfully!");
      }
    } catch (err) {
      console.error("❌ Status update failed:", err);
    }
  };

  // ---------------------------------------
  // Calculate Item Total
  // ---------------------------------------
  const calculateItemTotal = (item: CartItem) => {
    const price = Number(item.price.replace(/,/g, "")) || 0;
    const discount = Number(item.discount) || 0;
    const qty = item.quantity || 1;
    const finalPrice = price - (price * discount) / 100;
    return finalPrice * qty;
  };

  if (loading) return <></>;
  if (!order) return <></>;

  return (
    <>
      <ASO />
      <div className="wrapper">
        <Sidebars isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        <div className={`content ${isSidebarOpen ? "" : "collapsed"}`}>
          <PageNavbar toggleSidebar={toggleSidebar} />

          <section className="mb-5 py-5">
            <div className="container-fluid px-4">
              <div className="row">
                <div className="col-md-12 m-auto">
                  <div className="card">
                    <div className="card-body bg-grays1">
                      {/* Header */}
                      <h5
                        className="bg-gradient text-center p-2 fw-bold mb-4"
                        data-aos="flip-left"
                        data-aos-easing="ease-out-cubic"
                        data-aos-duration="1500"
                      >
                        Order Details - #{order.id}
                        <Link href="/AdminPayment">
                          <i className="fa fa-arrow-left fw-bold mx-2 text-white"></i>
                        </Link>
                      </h5>

                      <div className="row">
                        {/* Billing */}
                        <div className="col-md-6 mb-4">
                          <div className="card">
                            <div className="card-header bg-primary text-white">
                              <h6 className="mb-0">Billing Information</h6>
                            </div>
                            <div className="card-body">
                              <table className="table table-bordered">
                                <tbody>
                                  <tr>
                                    <td>
                                      <b>Name:</b>
                                    </td>
                                    <td>{order.billing.name}</td>
                                  </tr>
                                  <tr>
                                    <td>
                                      <b>Email:</b>
                                    </td>
                                    <td>{order.billing.email}</td>
                                  </tr>
                                  <tr>
                                    <td>
                                      <b>Phone:</b>
                                    </td>
                                    <td>{order.billing.phone}</td>
                                  </tr>
                                  <tr>
                                    <td>
                                      <b>Address:</b>
                                    </td>
                                    <td>{order.billing.address}</td>
                                  </tr>
                                  <tr>
                                    <td>
                                      <b>City:</b>
                                    </td>
                                    <td>{order.billing.city}</td>
                                  </tr>
                                  <tr>
                                    <td>
                                      <b>ZIP:</b>
                                    </td>
                                    <td>{order.billing.zip}</td>
                                  </tr>
                                  <tr>
                                    <td>
                                      <b>Payment Method:</b>
                                    </td>
                                    <td>
                                      <span className="badge bg-info">
                                        {(
                                          order.billing.paymentMethod || "COD"
                                        ).toUpperCase()}
                                      </span>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>

                        {/* Order Summary */}
                        <div className="col-md-6 mb-4">
                          <div className="card">
                            <div className="card-header bg-success text-white">
                              <h6 className="mb-0">Order Summary</h6>
                            </div>
                            <div className="card-body">
                              <table className="table table-bordered">
                                <tbody>
                                  <tr>
                                    <td>
                                      <b>Order ID:</b>
                                    </td>
                                    <td>#{order.id}</td>
                                  </tr>
                                  <tr>
                                    <td>
                                      <b>Order Date:</b>
                                    </td>
                                    <td>{order.date || order.createdAt}</td>
                                  </tr>

                                  <tr>
                                    <td>
                                      <b>Status:</b>
                                    </td>
                                    <td>
                                      <select
                                        className="form-select form-select-sm"
                                        value={order.status || "pending"}
                                        onChange={(e) =>
                                          handleStatusUpdate(e.target.value)
                                        }
                                      >
                                        <option value="pending">Pending</option>
                                        <option value="confirmed">
                                          Confirmed
                                        </option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">
                                          Delivered
                                        </option>
                                        <option value="cancelled">
                                          Cancelled
                                        </option>
                                      </select>
                                    </td>
                                  </tr>

                                  <tr>
                                    <td>
                                      <b>Total Amount:</b>
                                    </td>
                                    <td className="fw-bold text-success">
                                      ₹{order.total.toFixed(2)}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="card mb-4">
                        <div className="card-header bg-warning text-dark">
                          <h6 className="mb-0">Order Items</h6>
                        </div>
                        <div className="card-body">
                          <div className="table-responsive">
                            <table className="table table-bordered table-hover">
                              <thead>
                                <tr>
                                  <th>#</th>
                                  <th>Item Name</th>
                                  <th>Qty</th>
                                  <th>Price</th>
                                  <th>Discount</th>
                                  <th>Total</th>
                                </tr>
                              </thead>

                              <tbody>
                                {order.cart.map((item, i) => (
                                  <tr key={item.id}>
                                    <td>{i + 1}</td>
                                    <td>{item.name}</td>
                                    <td>{item.quantity}</td>
                                    <td>
                                      ₹
                                      {Number(
                                        item.price.replace(/,/g, "")
                                      ).toFixed(2)}
                                    </td>
                                    <td>{item.discount || "0"}%</td>
                                    <td>
                                      ₹{calculateItemTotal(item).toFixed(2)}
                                    </td>
                                  </tr>
                                ))}

                                <tr className="fw-bold">
                                  <td colSpan={5} className="text-end">
                                    Grand Total:
                                  </td>
                                  <td className="text-success">
                                    ₹{order.total.toFixed(2)}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="text-center">
                        <Link
                          href="/AdminPayment"
                          className="btn btn-warning btn-sm mx-1"
                        >
                          <i className="fa fa-arrow-left"></i> Back
                        </Link>

                        <button
                          className="btn btn-danger btn-sm mx-1"
                          onClick={() => handleDelete(order.id)}
                        >
                          <i className="fa fa-trash"></i> Delete
                        </button>
                      </div>
                    </div>
                  </div>
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

export default AdminViewPayment;
