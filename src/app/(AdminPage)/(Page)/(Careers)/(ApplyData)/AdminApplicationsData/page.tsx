"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import PageFooter from "../../../Sidebar/Footer/page";
import Sidebars from "../../../Sidebar/Sidebars/PageSidebar";
import PageNavbar from "../../../Sidebar/Navbar/PageNavbar";
import ASO from "../../../AOS/AOS";
import Pagination from "../../../AOS/Pagination";

type Application = {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  title: string;
  location: string;
  type: string;
  salary: string;
  status: string;
  resume: string;
  experience: string;
  skills: string[] | string;
  coverLetter: string;
  appliedAt: string;
};

function AdminApplicationsData() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 3;

  // 🟩 FETCH APPLICATIONS DATA
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("🔄 Fetching applications data...");

        const response = await fetch("/api/applicationsData");

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log("✅ Applications loaded:", data);
        setApplications(data);
      } catch (err: any) {
        console.error("❌ Error fetching applications:", err);
        setError(err.message || "Failed to load applications");
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Pagination logic
  const totalPages = Math.ceil(applications.length / itemsPerPage);
  const indexOfLastItem = (currentPage + 1) * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentContent = applications.slice(indexOfFirstItem, indexOfLastItem);

  // 🟩 DELETE APPLICATION
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this application?")) return;

    try {
      console.log("🗑️ Deleting application:", id);
      const res = await fetch(`/api/applicationsData/${id}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (res.ok && result.success) {
        alert("✅ " + result.message);
        // Update local state
        setApplications((prev) => {
          const updated = prev.filter((item) => item.id !== id);
          // Adjust pagination if needed
          if (updated.length <= currentPage * itemsPerPage && currentPage > 0) {
            setCurrentPage((p) => Math.max(p - 1, 0));
          }
          return updated;
        });
      } else {
        alert("❌ " + (result.error || "Failed to delete application"));
      }
    } catch (err) {
      console.error("❌ Delete failed:", err);
      alert("❌ Error deleting application. Please try again.");
    }
  };

  return (
    <>
      <ASO />
      <div className="wrapper">
        <Sidebars isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className={`content ${isSidebarOpen ? "" : "collapsed"}`}>
          <PageNavbar toggleSidebar={toggleSidebar} />
          <section>
            <div className="container-fluid px-4">
              <div className="row">
                <div className="col-md-12 col-sm-12 m-auto">
                  <div className="card">
                    <div className="card-body bg-grays1">
                      <h5
                        className="bg-gradient text-center p-2 fw-bold mb-4 text-white"
                        data-aos="flip-left"
                        data-aos-easing="ease-out-cubic"
                        data-aos-duration="1500"
                      >
                        <i className="fa fa-file-text me-2"></i>
                        Total Applications Submitted: {applications.length}
                      </h5>

                      {/* Loading State */}
                      {loading && <> </>}

                      {/* Error State */}
                      {error && (
                        <div className="alert alert-danger text-center">
                          <h5>Error Loading Applications</h5>
                          <p>{error}</p>
                          <button
                            className="btn btn-primary"
                            onClick={() => window.location.reload()}
                          >
                            Try Again
                          </button>
                        </div>
                      )}

                      {/* Applications Table */}
                      {!loading && !error && (
                        <>
                          <div
                            className="table-responsive"
                            style={{ maxHeight: "500px", overflowY: "auto" }}
                            data-aos="zoom-in-down"
                            data-aos-duration="1500"
                          >
                            <table className="table table-bordered table-hover">
                              <thead className="text-center bg-gradient text-white">
                                <tr>
                                  <th>#</th>
                                  <th>Name</th>
                                  <th>Email</th>
                                  <th>Department</th>
                                  <th>Title</th>
                                  <th>Location</th>
                                  <th>Type</th>
                                  <th>Salary</th>
                                  <th>Status</th>
                                  <th>Applied Date</th>
                                  <th>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {currentContent.length > 0 ? (
                                  currentContent.map((item, index) => (
                                    <tr className="text-center" key={item.id}>
                                      <td>{indexOfFirstItem + index + 1}</td>
                                      <td>
                                        <strong>{item.name}</strong>
                                        <br />
                                        <small className="text-muted">
                                          {item.phone}
                                        </small>
                                      </td>
                                      <td>{item.email}</td>
                                      <td>{item.department}</td>
                                      <td>{item.title}</td>
                                      <td>{item.location}</td>
                                      <td>
                                        <span
                                          className={`badge ${
                                            item.type === "Full-time"
                                              ? "bg-primary"
                                              : item.type === "Part-time"
                                              ? "bg-success"
                                              : "bg-secondary"
                                          }`}
                                        >
                                          {item.type}
                                        </span>
                                      </td>
                                      <td>
                                        {item.salary
                                          ? `₹${item.salary}`
                                          : "Not specified"}
                                      </td>
                                      <td>
                                        <span
                                          className={`badge ${
                                            item.status === "Pending"
                                              ? "bg-warning"
                                              : item.status === "Approved"
                                              ? "bg-success"
                                              : item.status === "Rejected"
                                              ? "bg-danger"
                                              : "bg-secondary"
                                          }`}
                                        >
                                          {item.status}
                                        </span>
                                      </td>
                                      <td>
                                        {new Date(
                                          item.appliedAt
                                        ).toLocaleDateString()}
                                      </td>
                                      <td>
                                        <div className="btn-group" role="group">
                                          <Link
                                            className="btn btn-info btn-sm mx-1"
                                            href={`/AdminViewApplicationsData/${item.id}`}
                                            title="View Details"
                                          >
                                            <i className="fa fa-eye text-white"></i>
                                          </Link>
                                          <button
                                            className="btn btn-danger btn-sm mx-1"
                                            onClick={() =>
                                              handleDelete(item.id)
                                            }
                                            title="Delete Application"
                                          >
                                            <i className="fa fa-trash text-white"></i>
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td
                                      colSpan={11}
                                      className="text-center py-4"
                                    >
                                      <div className="text-muted">
                                        <i className="fa fa-folder-open fa-2x mb-2"></i>
                                        <p>No applications found</p>
                                        <small>
                                          When applications are submitted, they
                                          will appear here.
                                        </small>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>

                          {/* Pagination Controls */}
                          {applications.length > 0 && (
                            <Pagination
                              currentPage={currentPage}
                              totalPages={totalPages}
                              handlePrevPage={() =>
                                setCurrentPage((p) => Math.max(p - 1, 0))
                              }
                              handleNextPage={() =>
                                setCurrentPage((p) =>
                                  Math.min(p + 1, totalPages - 1)
                                )
                              }
                            />
                          )}
                        </>
                      )}
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

export default AdminApplicationsData;
