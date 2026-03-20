"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import PageFooter from "../../Sidebar/Footer/page";
import Sidebars from "../../Sidebar/Sidebars/PageSidebar";
import PageNavbar from "../../Sidebar/Navbar/PageNavbar";
import ASO from "../../AOS/AOS";
import Pagination from "../../AOS/Pagination";

type AboutUs = {
  id: string;
  email: string;
  status: string;
  joindate: string;
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
        setAboutUsData(data.newsletter || data);
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
      const res = await fetch(`/api/newsletter?id=${id}`, {
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
                        {" "}
                        Newsletter : {aboutUsData.length}
                      </h5>

                      <div
                        className="table"
                        style={{ maxHeight: "400px", overflowY: "auto" }}
                        data-aos="zoom-in-down"
                        data-aos-duration="1500"
                      >
                        <table className="table table-bordered table-hover">
                          <thead>
                            <tr className="text-center bg-gradient">
                              <th className="text-dark">#</th>
                              <th className="text-dark">Email</th>
                              <th className="text-dark">Status</th>
                              <th className="text-dark">Join Date</th>
                              <th className="text-dark">Edit & Delete</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentContent.length > 0 ? (
                              currentContent.map((item, index) => (
                                <tr key={item.id} className="text-center">
                                  <td>{indexOfFirstItem + index + 1}</td>
                                  <td>{item.email}</td>
                                  <td>{item.status}</td>
                                  <td>{item.joindate}</td>

                                  <td>
                                    <button
                                      className="btn btn-danger btn-sm"
                                      onClick={() => handleDelete(item.id)}
                                    >
                                      <i className="fa fa-trash"></i>
                                    </button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={6} className="text-center">
                                  No content found
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Controls */}
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
