"use client";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const txn = searchParams.get("txn");
  const amount = searchParams.get("amount");
  const method = searchParams.get("method");

  return (
    <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
      <div className="card border-0 shadow rounded-4 text-center p-5" style={{ maxWidth: 420 }}>

        <div className="mb-3" style={{ fontSize: 72 }}>
          {method === "COD" ? "📦" : "✅"}
        </div>

        <h4 className="fw-bold text-success">
          {method === "COD" ? "Order Confirmed!" : "Payment Successful!"}
        </h4>

        <p className="text-muted mb-4">
          {method === "COD"
            ? "Delivery ke waqt cash payment karna hoga"
            : "Aapka payment complete ho gaya!"}
        </p>

        <div className="bg-light rounded-3 p-3 mb-4 text-start">
          <div className="d-flex justify-content-between mb-2">
            <small className="text-muted">Amount</small>
            <span className="fw-bold text-success">₹{amount}</span>
          </div>
          <div className="d-flex justify-content-between mb-2">
            <small className="text-muted">Method</small>
            <span className="fw-semibold">{method}</span>
          </div>
          <div className="d-flex justify-content-between">
            <small className="text-muted">Transaction ID</small>
            <small className="fw-semibold">{txn}</small>
          </div>
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-outline-success flex-fill"
            onClick={() => router.push("/Orders")}>
            📦 My Orders
          </button>
          <button className="btn btn-success flex-fill"
            onClick={() => router.push("/Product")}>
            🛒 Shop More
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-success" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
