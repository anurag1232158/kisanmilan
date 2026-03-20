"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import PageFooter from "../../../Sidebar/Footer/page";
import Sidebars from "../../../Sidebar/Sidebars/PageSidebar";
import PageNavbar from "../../../Sidebar/Navbar/PageNavbar";
import ASO from "../../../AOS/AOS";
import Pagination from "../../../AOS/Pagination";

type AboutUs = {
  id: string;
  title?: string;
  description?: string;
  pic?: string;
};

function AdminHome() {
  const [aboutUsData, setAboutUsData] = useState<AboutUs[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;

  useEffect(() => {
    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => {
        // If your data.json has a key like "mostbooked", use that:
        setAboutUsData(data.aboutUs || data);
      })
      .catch((err) => console.error("Error fetching services:", err));
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Pagination logic
  const totalPages = Math.ceil(aboutUsData.length / itemsPerPage);
  const indexOfLastItem = (currentPage + 1) * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentContent = aboutUsData.slice(indexOfFirstItem, indexOfLastItem);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      const res = await fetch(`/api/aboutUs?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        alert("✅ Deleted successfully!");
        setAboutUsData((prev) => prev.filter((item) => item.id !== id));
      } else {
        console.error("Failed to delete, server responded:", await res.text());
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <>
      <ASO />
      <div className="wrapper">
        <Sidebars isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className={`content ${isSidebarOpen ? "" : "collapsed"}`}>
          <PageNavbar toggleSidebar={toggleSidebar} />
          <section className="mb-5">
            <div className="container-fluid px-4">
              <div className="row">
                <div className="col-md-12 col-sm-12 m-auto">
                  <div className="card">
                    <div className="card-body bg-grays1">
                      <h5
                        className="bg-gradient text-center p-2 fw-bold mb-4"
                        data-aos="flip-left"
                        data-aos-easing="ease-out-cubic"
                        data-aos-duration="1500"
                      >
                        About Us : {aboutUsData.length}
                      </h5>

                      {/* ✅ Big Side Card Layout */}
                      <div className="row">
                        {currentContent.length > 0 ? (
                          currentContent.map((item) => (
                            <div key={item.id} className="col-md-12 mb-4">
                              <div className="card shadow-lg border-0">
                                <div className="row g-0">
                                  {/* Left Image */}
                                  <div className="col-md-4">
                                    {item.pic ? (
                                      <Link
                                        href={`/assets/images/${item.pic}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <img
                                          src={`/assets/images/${item.pic}`}
                                          alt="Uploaded"
                                          className="img-fluid rounded-start h-100 w-100 object-fit-cover"
                                        />
                                      </Link>
                                    ) : (
                                      <div className="d-flex align-items-center justify-content-center bg-light h-100">
                                        <span className="text-muted">
                                          No Image
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Right Content */}
                                  <div className="col-md-8">
                                    <div className="card-body">
                                      <h4 className="fw-bold mb-3">
                                        {item.title || "Untitled"}
                                      </h4>
                                      <p
                                        className="text-muted"
                                        style={{ whiteSpace: "pre-wrap" }}
                                      >
                                        {item.description ||
                                          "No description available."}
                                      </p>

                                      <div className="d-flex justify-content-end mt-3">
                                        <button
                                          className="btn btn-sm btn-danger me-2"
                                          onClick={() => handleDelete(item.id)}
                                        >
                                          Delete
                                        </button>
                                        <button className="btn btn-sm btn-primary">
                                          Edit
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-md-12 text-center">
                            <p>No About Us content found</p>
                          </div>
                        )}
                      </div>

                      {/* Pagination */}
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        handlePrevPage={() =>
                          setCurrentPage((p) => Math.max(p - 1, 0))
                        }
                        handleNextPage={() =>
                          setCurrentPage((p) => Math.min(p + 1, totalPages - 1))
                        }
                      />
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

export default AdminHome;
