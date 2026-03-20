import Link from "next/link";
import React from "react";

const FooterEnd = () => {
  return (
    <div className="row">
      <div className="col-lg-4 col-md-12">
        <div className="mb-0">
          <div className="section-title section-title-sm position-relative pb-3 pt-2 mb-4 d-lg-none d-md-none">
            <h3 className="text-light mb-0">Company Info</h3>
          </div>
          <div className="align-items-center d-lg-flex">
            <Link className="text-white border-bottom" href="/">
              <span>©</span> {new Date().getFullYear()} Demo
            </Link>
            <div className="ms-2 text-white">All Rights Reserved</div>
          </div>
        </div>
      </div>
      <div className="col-lg-8 col-md-12">
        <div className="d-flex align-items-center justify-content-end">
          <p className="mb-0 text-white">
            Designed & Developed By:
            <Link className="text-white border-bottom ms-2" href="#">
              🌱 Demo Team
            </Link>
          </p>
          <Link href="/"
            className="btn btn-sm btn-success rounded ms-3">
            <i className="fa fa-arrow-up"></i>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FooterEnd;