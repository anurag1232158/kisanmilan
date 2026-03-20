"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
  const [rates, setRates] = useState<any[]>([]);

  useEffect(() => {
    fetch("http://localhost:5000/rates")
      .then(res => res.json())
      .then(data => setRates(data))
      .catch(() => {});
  }, []);

  return (
    <div className="min-vh-100 bg-light">

      {/* Hero Section */}
      <div className="py-5 text-white text-center"
        style={{ background: "linear-gradient(135deg, #198754, #20c997)" }}>
        <div className="container py-4">
          <div style={{ fontSize: 64 }}>🌱</div>
          <h1 className="display-5 fw-bold mt-2">Hello Demo</h1>
          <p className="lead opacity-75 mb-4">
            Kisan aur Buyer ko seedha jodne wala platform
          </p>
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <Link href="/Product" className="btn btn-white btn-lg fw-semibold"
              style={{ background: "white", color: "#198754" }}>
              🛒 Products Dekho
            </Link>
            <Link href="/Register" className="btn btn-outline-light btn-lg fw-semibold">
              🚀 Join Now
            </Link>
          </div>
        </div>
      </div>

      {/* Mandi Rates */}
      <div className="container py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="fw-bold text-success mb-0">📊 Aaj ke Mandi Rates</h4>
          <Link href="/Rates" className="btn btn-outline-success btn-sm">
            Sab Dekho →
          </Link>
        </div>

        {rates.length === 0 ? (
          <div className="text-center py-4">
            <div className="spinner-border text-success" />
          </div>
        ) : (
          <div className="row g-3">
            {rates.slice(0, 8).map((item: any) => (
              <div key={item._id} className="col-6 col-md-3">
                <div className="card border-0 shadow-sm rounded-4 text-center p-3">
                  <h5 className="fw-bold text-success mb-1">₹{item.price}</h5>
                  <p className="fw-semibold mb-1">{item.name}</p>
                  <span className={`badge bg-${
                    item.change?.startsWith("-") ? "danger" :
                    item.change === "0%" ? "secondary" : "success"
                  }`}>
                    {item.change?.startsWith("-") ? "📉" : "📈"} {item.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Features */}
      <div className="bg-white py-5">
        <div className="container">
          <h4 className="fw-bold text-center text-success mb-4">
            Hello Demo kyun?
          </h4>
          <div className="row g-4 text-center">
            {[
              { icon: "🌾", title: "Direct Farmer",   desc: "Beechiye ke bina seedha kisan se kharido" },
              { icon: "💰", title: "Best Price",       desc: "Mandi rates dekho aur sahi daam mein kharido" },
              { icon: "🚚", title: "Fast Delivery",    desc: "Ghar tak delivery — koi tension nahi" },
              { icon: "🔒", title: "Safe Payment",     desc: "UPI, Card, COD — sab options available" },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="col-6 col-md-3">
                <div className="card border-0 bg-light rounded-4 p-4 h-100">
                  <div style={{ fontSize: 40 }}>{icon}</div>
                  <h6 className="fw-bold mt-3">{title}</h6>
                  <small className="text-muted">{desc}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="container py-5 text-center">
        <h4 className="fw-bold text-success mb-3">Abhi shuru karo! 🚀</h4>
        <div className="d-flex gap-3 justify-content-center flex-wrap">
          <Link href="/Register" className="btn btn-success btn-lg fw-semibold px-4">
            👨‍🌾 Farmer Register
          </Link>
          <Link href="/Product" className="btn btn-outline-success btn-lg fw-semibold px-4">
            🛒 Products Dekho
          </Link>
        </div>
      </div>

    </div>
  );
}