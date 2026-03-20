import Link from "next/link";
import React from "react";

const FooterOne = () => {
  return (
    <div className="col-lg-4 col-md-6 col-sm-6 col-6 pt-lg-5 mb-lg-5 pt-2">
      <div className="section-title section-title-sm position-relative pb-3 mb-4">
        <h3 className="text-light mb-0">🌱 Demo</h3>
      </div>
      <p className="text-light small mb-3">
        Kisan se seedha aapke ghar tak — Taaza, Sasta, Bharosemand 🌾
      </p>
      <div className="d-flex mb-2">
        <i className="fa fa-map-marker-alt mt-2 color-orange"></i>
        <p className="mb-0 ms-2 text-light">Sector 5, Noida, Uttar Pradesh — 201301</p>
      </div>
      <div className="d-flex mb-2">
        <i className="fa fa-envelope mt-2 color-orange"></i>
        <p className="mb-0 ms-2 text-light">Demo@gmail.com</p>
      </div>
      <div className="d-flex mb-2">
        <i className="fa fa-phone-alt mt-2 color-orange"></i>
        <p className="mb-0 ms-2 text-light">+91 9170973916</p>
      </div>
      <div className="d-flex py-3 gap-2">
        <Link className="btn btn-success btn-square" href="#">
          <i className="fa fa-twitter"></i>
        </Link>
        <Link className="btn btn-success btn-square" href="#">
          <i className="fa fa-facebook"></i>
        </Link>
        <Link className="btn btn-success btn-square" href="#">
          <i className="fa fa-linkedin"></i>
        </Link>
        <Link className="btn btn-success btn-square" href="#">
          <i className="fa fa-instagram"></i>
        </Link>
      </div>
    </div>
  );
};

export default FooterOne;