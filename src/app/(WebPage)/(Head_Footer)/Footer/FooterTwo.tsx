import Link from "next/link";
import React from "react";

const FooterTwo = () => {
  return (
    <div className="col-lg-4 col-md-6 col-sm-6 col-6 pt-lg-5 mb-lg-5 pt-2">
      <div className="section-title section-title-sm position-relative pb-3 mb-4">
        <h3 className="text-light mb-0">Quick Links</h3>
      </div>
      <div className="link-animated d-flex flex-column justify-content-start">
        <Link className="text-light mb-2 fw" href="/Product">
          <i className="fa fa-arrow-right color-orange mx-2"></i> 🛒 Products
        </Link>
        <Link className="text-light mb-2 fw" href="/Rates">
          <i className="fa fa-arrow-right color-orange mx-2"></i> 📊 Mandi Rates
        </Link>
        <Link className="text-light mb-2 fw" href="/Orders">
          <i className="fa fa-arrow-right color-orange mx-2"></i> 📦 My Orders
        </Link>
        <Link className="text-light mb-2 fw" href="/Dashboard">
          <i className="fa fa-arrow-right color-orange mx-2"></i> 📊 Dashboard
        </Link>
        <Link className="text-light mb-2 fw" href="/Profile">
          <i className="fa fa-arrow-right color-orange mx-2"></i> 👤 Profile
        </Link>
        <Link className="text-light mb-2 fw" href="/ProductAdd">
          <i className="fa fa-arrow-right color-orange mx-2"></i> ➕ Product Add
        </Link>
      </div>
    </div>
  );
};

export default FooterTwo;