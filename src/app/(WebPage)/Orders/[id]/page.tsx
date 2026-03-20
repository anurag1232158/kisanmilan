"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const STATUS_COLORS: Record<string, string> = {
  pending:   "warning",
  confirmed: "primary",
  shipped:   "info",
  delivered: "success",
  cancelled: "danger",
};

const NEXT_STATUS: Record<string, string> = {
  pending:   "confirmed",
  confirmed: "shipped",
  shipped:   "delivered",
};

const STATUS_LABEL: Record<string, string> = {
  pending:   "⏳ Pending",
  confirmed: "✅ Confirmed",
  shipped:   "🚚 Shipped",
  delivered: "🎉 Delivered",
  cancelled: "❌ Cancelled",
};

export default function OrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [order, setOrder]       = useState<any>(null);
  const [payment, setPayment]   = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [updating, setUpdating] = useState(false);
  const [user, setUser]         = useState<any>(null);
  const [msg, setMsg]           = useState("");
  const [msgType, setMsgType]   = useState<"success"|"danger">("success");

  // Payment change states
  const [showPayChange, setShowPayChange] = useState(false);
  const [newMethod, setNewMethod]         = useState("UPI");
  const [upiId, setUpiId]                 = useState("");
  const [cardNo, setCardNo]               = useState("");
  const [cardName, setCardName]           = useState("");
  const [cardExpiry, setCardExpiry]       = useState("");
  const [cardCvv, setCardCvv]             = useState("");
  const [bank, setBank]                   = useState("");
  const [payChanging, setPayChanging]     = useState(false);

  const fetchOrder = async () => {
    try {
      const res  = await fetch(`http://localhost:5000/order/${id}`);
      const data = await res.json();
      setOrder(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchPayment = async () => {
    try {
      const res  = await fetch(`http://localhost:5000/payment/order/${id}`);
      const data = await res.json();
      if (!data.error) setPayment(data);
      else setPayment(null);
    } catch {}
  };

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.push("/Login"); return; }
    setUser(JSON.parse(stored));
    if (!id) return;
    fetchOrder();
    fetchPayment();
  }, [id]);

  const showAlert = (text: string, type: "success"|"danger" = "success") => {
    setMsg(text); setMsgType(type);
    setTimeout(() => setMsg(""), 5000);
  };

  // ✅ Status Update
  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/order/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrder((prev: any) => ({ ...prev, status: newStatus }));
      showAlert(`✅ Status: ${newStatus}`);
    } catch (err: any) {
      showAlert(err.message, "danger");
    } finally { setUpdating(false); }
  };

  // ✅ Payment save/update helper
  const savePayment = async (
    method: string,
    status: string,
    txnId: string,
    extra: Record<string, any> = {}
  ) => {
    const token = localStorage.getItem("token");
    if (payment?._id) {
      await fetch(`http://localhost:5000/payment/${payment._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ payment_method: method, status, transaction_id: txnId, ...extra }),
      });
    } else {
      await fetch("http://localhost:5000/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          order_id: id,
          buyer_id: order.buyer_id,
          seller_id: order.seller_id,
          amount: order.total_price,
          payment_method: method,
          transaction_id: txnId,
          status,
          ...extra,
        }),
      });
    }
    await fetchPayment();
  };

  // ✅ COD Payment Received (Farmer)
  const markCODPaid = async () => {
    if (!confirm("COD payment mili? Confirm karo")) return;
    setUpdating(true);
    try {
      await savePayment("COD", "completed", "COD" + Date.now());
      await updateStatus("delivered");
      showAlert("💵 COD received! Order delivered 🎉");
    } catch (err: any) {
      showAlert(err.message, "danger");
    } finally { setUpdating(false); }
  };

  // ✅ Online Payment — Pehle payment, phir auto next status
  const changePayment = async () => {
    if (newMethod === "UPI" && !upiId.includes("@")) {
      showAlert("Valid UPI ID enter karo!", "danger"); return;
    }
    if (newMethod === "Card" &&
      (cardNo.length < 16 || !cardName || !cardExpiry || cardCvv.length < 3)) {
      showAlert("Card details sahi bharo!", "danger"); return;
    }
    if (newMethod === "NetBanking" && !bank) {
      showAlert("Bank select karo!", "danger"); return;
    }

    setPayChanging(true);
    try {
      const txnId = "TXN" + Date.now();
      await savePayment(newMethod, "completed", txnId, {
        upi_id: newMethod === "UPI" ? upiId : "",
      });

      // ✅ Payment hone ke baad auto next status
      const currentStatus = order.status;
      const nextSt = NEXT_STATUS[currentStatus];
      if (nextSt) {
        await updateStatus(nextSt);
      }

      setShowPayChange(false);
      showAlert(`✅ Payment done! Order ${nextSt || currentStatus}`);
    } catch (err: any) {
      showAlert(err.message, "danger");
    } finally { setPayChanging(false); }
  };

  const cancelOrder = async () => {
    if (!confirm("Order cancel karna chahte ho?")) return;
    await updateStatus("cancelled");
  };

  // ✅ PDF Download
  const downloadPDF = async () => {
    const element = document.getElementById("order-receipt");
    if (!element) return;
    const canvas   = await html2canvas(element, { scale: 2 });
    const imgData  = canvas.toDataURL("image/png");
    const pdf      = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`KisanMilan_Order_${id?.slice(-6)}.pdf`);
  };

  // ─── Loading ───
 if (loading) return (
  <div className="min-vh-100 d-flex align-items-center justify-content-center">
    <div className="spinner-border text-success" />
  </div>
);

  // ─── Not Found ───
  if (!order || order.error) return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center">
      <div className="text-center">
        <div style={{ fontSize: 64 }}>😔</div>
        <p className="text-muted mt-3">Order not found</p>
        <button className="btn btn-success mt-2"
          onClick={() => router.push("/Orders")}>
          ← My Orders
        </button>
      </div>
    </div>
  );

  // ✅ Role checks
const isFarmer   = user?.role === "farmer";
const isAgent    = user?.role === "agent";
const isBuyer    = user?.id?.toString() === order?.buyer_id?.toString();
const isSeller   = user?.id?.toString() === order?.seller_id?.toString();

  const isCOD      = payment?.payment_method === "COD" || !payment?._id;
  const isPaid     = payment?.status === "completed";
  const nextStatus = NEXT_STATUS[order.status];
  const steps      = ["pending", "confirmed", "shipped", "delivered"];
  const curStep    = steps.indexOf(order.status);

  return (
    <div className="min-vh-100 bg-light py-4">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-7">

            {/* ── Status Header ── */}
            <div className="card border-0 shadow-sm rounded-4 mb-3">
              <div className="card-body p-4 text-center">
                <div style={{ fontSize: 56 }}>
                  {order.status === "delivered" ? "🎉" :
                   order.status === "shipped"   ? "🚚" :
                   order.status === "confirmed" ? "✅" :
                   order.status === "cancelled" ? "❌" : "⏳"}
                </div>
                <h5 className="fw-bold mt-2">{STATUS_LABEL[order.status]}</h5>
                <span className={`badge bg-${STATUS_COLORS[order.status]} px-3 py-2`}>
                  {order.status.toUpperCase()}
                </span>
                <div className="mt-2 d-flex justify-content-center gap-2 align-items-center">
                  <small className="text-muted">ID: ...{id?.slice(-8)}</small>
                  <button
                    className="btn btn-outline-success btn-sm py-0 px-2"
                    style={{ fontSize: 11 }}
                    onClick={() => {
                      setLoading(true);
                      fetchOrder();
                      fetchPayment();
                    }}>
                    🔄 Refresh
                  </button>
                </div>
              </div>
            </div>

            {/* ── Progress Steps ── */}
            {order.status !== "cancelled" && (
              <div className="card border-0 shadow-sm rounded-4 mb-3">
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between align-items-center">
                    {steps.map((s, i) => (
                      <div key={s} className="text-center flex-fill">
                        <div
                          className={`rounded-circle mx-auto d-flex align-items-center justify-content-center fw-bold
                            ${curStep >= i
                              ? "bg-success text-white"
                              : "bg-light border text-muted"}`}
                          style={{ width: 36, height: 36, fontSize: 14 }}>
                          {curStep > i ? "✓" : i + 1}
                        </div>
                        <small
                          className={`d-block mt-1 ${
                            curStep >= i ? "text-success fw-semibold" : "text-muted"
                          }`}
                          style={{ fontSize: 11 }}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </small>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Receipt / Order Details ── */}
            <div id="order-receipt" className="card border-0 shadow-sm rounded-4 mb-3">
              <div className="card-body p-4">

                {/* Receipt Header */}
                <div className="text-center border-bottom pb-3 mb-3">
                  <div style={{ fontSize: 28 }}>🌱</div>
                  <h6 className="fw-bold text-success mb-0">Hello Demo Receipt</h6>
                  <small className="text-muted">
                    {new Date().toLocaleDateString("hi-IN")}
                  </small>
                </div>

                <h6 className="fw-bold text-success mb-3">📦 Order Details</h6>
                {[
                  ["Order ID",  `...${id?.slice(-10)}`],
                  ["Product",   order.product_name],
                  ["Quantity",  `${order.quantity} ${order.unit}`],
                  ["Amount",    `₹${order.total_price}`],
                  ["Status",    order.status.toUpperCase()],
                  ["Address",   order.delivery_address],
                  ["Date",      new Date(order.createdAt).toLocaleDateString("hi-IN")],
                  ["Payment",   payment?.payment_method || "COD"],
                  ["Pay Status",isPaid ? "✅ Paid" : "⏳ Pending"],
                  ["Txn ID",    payment?.transaction_id || "N/A"],
                ].map(([label, value]) => (
                  <div key={label}
                    className="d-flex justify-content-between border-bottom py-2">
                    <span className="text-muted small">{label}</span>
                    <span className="fw-semibold text-end small"
                      style={{ maxWidth: "60%" }}>{value}</span>
                  </div>
                ))}

                {/* Receipt Footer */}
                <div className="text-center mt-3">
                  <small className="text-muted">
                    🌱 Hello Demo — Kisan aur Buyer ko jodne wala platform
                  </small>
                </div>
              </div>
            </div>

            {/* ── PDF Download ── */}
            <button
              className="btn btn-outline-success w-100 mb-3 fw-semibold"
              onClick={downloadPDF}>
              📄 Download Receipt PDF
            </button>

            {/* ── Payment Info ── */}
            <div className="card border-0 shadow-sm rounded-4 mb-3">
              <div className="card-body p-4">
                <h6 className="fw-bold text-success mb-3">💳 Payment Status</h6>

                <div className="d-flex justify-content-between py-2 border-bottom">
                  <span className="text-muted">Method</span>
                  <span className="fw-semibold">
                    {payment?.payment_method || "COD"} {isCOD && "💵"}
                  </span>
                </div>

                <div className="d-flex justify-content-between py-2 border-bottom">
                  <span className="text-muted">Status</span>
                  <span className={`badge px-3 py-2 bg-${isPaid ? "success" : "warning"}`}>
                    {isPaid ? "✅ Paid" : "⏳ Pending"}
                  </span>
                </div>

                {payment?.transaction_id && (
                  <div className="d-flex justify-content-between py-2">
                    <span className="text-muted">Txn ID</span>
                    <small className="fw-semibold">{payment.transaction_id}</small>
                  </div>
                )}

                {isBuyer && isCOD && !isPaid && order.status !== "cancelled" && (
                  <div className="alert alert-warning rounded-3 mt-3 mb-0 small">
                    <strong>💵 COD</strong> — Delivery pe ₹{order.total_price} cash dena hoga.
                  </div>
                )}
                {isBuyer && isPaid && (
                  <div className="alert alert-success rounded-3 mt-3 mb-0 small">
                    ✅ Payment complete hai!
                  </div>
                )}
              </div>
            </div>

            {/* ── Alert ── */}
            {msg && (
              <div className={`alert alert-${msgType} rounded-3`}>{msg}</div>
            )}

            {/* ══════════ FARMER ACTIONS ══════════ */}
          {isSeller &&
 order.status !== "cancelled" &&
 order.status !== "delivered" && (
              <div className="card border-0 shadow rounded-4 mb-3"
                style={{ borderLeft: "4px solid #198754" }}>
                <div className="card-body p-4">
                  <h6 className="fw-bold text-success mb-1">
                    👨‍🌾 Farmer — Order Update
                  </h6>
                  <small className="text-muted d-block mb-3">
                    Flow: Pending → Confirmed → Shipped
                    {isCOD ? " → 💵 COD Receive" : ""} → Delivered
                  </small>

                  <div className="d-flex gap-2 flex-wrap">

                    {/* ✅ Next Status — payment honi chahiye ya COD */}
                    {nextStatus && !(isCOD && !isPaid && order.status === "shipped") && (
                      <button
                        className="btn btn-success fw-semibold"
                        onClick={() => updateStatus(nextStatus)}
                        disabled={updating}>
                        {updating
                          ? <span className="spinner-border spinner-border-sm me-1" />
                          : null}
                        Mark as {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)} →
                      </button>
                    )}

                    {/* ✅ COD Payment Received — sirf shipped pe */}
                    {isCOD && !isPaid && order.status === "shipped" && (
                      <button
                        className="btn btn-warning fw-bold"
                        onClick={markCODPaid}
                        disabled={updating}>
                        {updating
                          ? <span className="spinner-border spinner-border-sm me-1" />
                          : "💵 "}
                        COD Mili → Deliver ✅
                      </button>
                    )}

                    {/* Cancel */}
                    {order.status === "pending" && (
                      <button
                        className="btn btn-outline-danger"
                        onClick={cancelOrder}
                        disabled={updating}>
                        ❌ Cancel
                      </button>
                    )}
                  </div>

                  {/* COD reminder */}
                  {isCOD && !isPaid && order.status === "shipped" && (
                    <div className="alert alert-warning mt-3 mb-0 small rounded-3">
                      ⚠️ Pehle buyer se <strong>₹{order.total_price}</strong> cash lo,
                      phir button dabao.
                    </div>
                  )}

                  {/* ✅ Online paid — auto next show karo */}
                  {!isCOD && isPaid && nextStatus && (
                    <div className="alert alert-info mt-3 mb-0 small rounded-3">
                      💡 Payment ho gayi hai! Ab{" "}
                      <strong>Mark as {nextStatus}</strong> karo.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══════════ BUYER ACTIONS ══════════ */}
            {isBuyer && (
              <div className="card border-0 shadow-sm rounded-4 mb-3">
                <div className="card-body p-4">
                  <h6 className="fw-bold text-success mb-3">🛍️ Buyer Actions</h6>

                  <div className="d-flex gap-2 flex-wrap mb-3">

                    {order.status === "pending" && (
                      <button className="btn btn-outline-danger"
                        onClick={cancelOrder} disabled={updating}>
                        ❌ Cancel Order
                      </button>
                    )}

                    {/* ✅ COD → Online Pay */}
                    {isCOD && !isPaid &&
                     order.status !== "cancelled" &&
                     order.status !== "delivered" && (
                      <button
                        className="btn btn-success fw-semibold"
                        onClick={() => setShowPayChange(!showPayChange)}>
                        💳 Online Pay Karo
                      </button>
                    )}

                    {order.status === "delivered" && (
                      <button
                        className="btn btn-outline-warning"
                        onClick={() => router.push(`/review/${order.product_id}`)}>
                        ⭐ Write Review
                      </button>
                    )}

                    <button className="btn btn-outline-secondary"
                      onClick={() => router.push("/Orders")}>
                      ← My Orders
                    </button>

                    <button className="btn btn-outline-success"
                      onClick={() => router.push("/products")}>
                      🛒 Shop More
                    </button>
                  </div>

                  {/* ✅ Online Payment Form */}
                  {showPayChange && (
                    <div className="border rounded-4 p-4 bg-white">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fw-bold text-success mb-0">
                          💳 COD → Online Pay
                        </h6>
                        <button className="btn btn-sm btn-outline-secondary"
                          onClick={() => setShowPayChange(false)}>✕</button>
                      </div>

                      <div className="alert alert-success py-2 text-center mb-3">
                        <strong>Amount: ₹{order.total_price}</strong>
                      </div>

                      {/* Method Tabs */}
                      <div className="d-flex gap-2 mb-3 flex-wrap">
                        {[
                          { key: "UPI",        icon: "📱" },
                          { key: "Card",       icon: "💳" },
                          { key: "NetBanking", icon: "🏦" },
                        ].map(({ key, icon }) => (
                          <button key={key} type="button"
                            onClick={() => setNewMethod(key)}
                            className={`btn btn-sm ${
                              newMethod === key
                                ? "btn-success"
                                : "btn-outline-secondary"
                            }`}>
                            {icon} {key}
                          </button>
                        ))}
                      </div>

                      {/* UPI */}
                      {newMethod === "UPI" && (
                        <div className="mb-3">
                          <input className="form-control mb-2"
                            placeholder="yourname@upi"
                            value={upiId}
                            onChange={e => setUpiId(e.target.value)} />
                          <div className="d-flex gap-2 flex-wrap">
                            {["GPay", "PhonePe", "Paytm", "BHIM"].map(app => (
                              <span key={app}
                                className="badge bg-light text-dark border px-3 py-2"
                                style={{ cursor: "pointer" }}>
                                {app}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Card */}
                      {newMethod === "Card" && (
                        <div className="row g-2 mb-3">
                          <div className="col-12">
                            <input className="form-control"
                              placeholder="Card Number (16 digits)"
                              maxLength={16} value={cardNo}
                              onChange={e => setCardNo(e.target.value.replace(/\D/g, ""))} />
                          </div>
                          <div className="col-12">
                            <input className="form-control"
                              placeholder="Name on Card"
                              value={cardName}
                              onChange={e => setCardName(e.target.value)} />
                          </div>
                          <div className="col-6">
                            <input className="form-control"
                              placeholder="MM/YY" maxLength={5}
                              value={cardExpiry}
                              onChange={e => setCardExpiry(e.target.value)} />
                          </div>
                          <div className="col-6">
                            <input className="form-control"
                              placeholder="CVV" type="password" maxLength={3}
                              value={cardCvv}
                              onChange={e => setCardCvv(e.target.value)} />
                          </div>
                        </div>
                      )}

                      {/* NetBanking */}
                      {newMethod === "NetBanking" && (
                        <div className="mb-3">
                          <select className="form-select"
                            value={bank}
                            onChange={e => setBank(e.target.value)}>
                            <option value="">-- Bank chuniye --</option>
                            {["SBI","HDFC","ICICI","Axis","PNB","Kotak","Canara"].map(b => (
                              <option key={b} value={b}>{b}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      <small className="text-muted d-block mb-3">
                        💡 Demo mode — koi real payment nahi hogi
                      </small>

                      <button
                        className="btn btn-success w-100 fw-semibold"
                        onClick={changePayment}
                        disabled={payChanging}>
                        {payChanging ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Processing...
                          </>
                        ) : `✅ Pay ₹${order.total_price} via ${newMethod}`}
                      </button>
                    </div>
                  )}

                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
