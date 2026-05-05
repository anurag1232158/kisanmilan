import Link from "next/link";
import React from "react";

const FooterThree = () => {
  return (
    <div className="col-lg-4 col-md-6 col-sm-6 col-6 pt-0 pt-lg-5 mb-lg-3 pt-2 mb-3 fs-log-8">
      <div className="section-title section-title-sm position-relative pb-2 pb-lg-3 mb-2 mb-lg-2">
        <h3 className="text-light mb-0">Hamari Seva</h3>
      </div>
      <div className="link-animated d-flex flex-column justify-content-start">
        <Link className="text-light  mb-1 mb-lg-2 fw" href="#">
          <i className="fa fa-arrow-right color-orange mx-2"></i> 👨‍🌾 Kisan Register
        </Link>
        <Link className="text-light  mb-1 mb-lg-2 fw" href="#">
          <i className="fa fa-arrow-right color-orange mx-2"></i> 🛍️ Buyer Register
        </Link>
        <Link className="text-light  mb-1 mb-lg-2 fw" href="#">
          <i className="fa fa-arrow-right color-orange mx-2"></i> 🏪 Agent Register
        </Link>
        <Link className="text-light  mb-1 mb-lg-2 fw" href="/Rates">
          <i className="fa fa-arrow-right color-orange mx-2"></i> 📈 Bhaav Dekho
        </Link>
        <Link className="text-light  mb-1 mb-lg-2 fw" href="/Product">
          <i className="fa fa-arrow-right color-orange mx-2"></i> 🌾 Fasal Khareedein
        </Link>
      </div>
    </div>
  );
};

export default FooterThree;