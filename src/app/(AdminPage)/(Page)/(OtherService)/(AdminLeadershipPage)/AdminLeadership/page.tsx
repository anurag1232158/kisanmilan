"use client";
import React, { useState, useEffect } from "react"; // 👈 important
import Link from "next/link";
import PageFooter from "../../../Sidebar/Footer/page";
import Sidebars from "../../../Sidebar/Sidebars/PageSidebar";
import PageNavbar from "../../../Sidebar/Navbar/PageNavbar";
import ASO from "../../../AOS/AOS";
import Pagination from "../../../AOS/Pagination";

type AboutUs = {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  pic: string;
  role: string;
};

function AdminLeadership() {
  const [aboutUsData, setAboutUsData] = useState<AboutUs[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;

  useEffect(() => {
    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => {
        // If your data.json has a key like "mostbooked", use that:
        setAboutUsData(data.leadership || data);
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
      const res = await fetch(`/api/leadership?id=${id}`, {
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
          <section className="">
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
                        Leadership List : {aboutUsData.length}
                        <Link href="/AdminAddLeadership" className="mx-2">
                          <i className="fa fa-plus fw-bold mx-2 text-white"></i>
                        </Link>
                      </h5>

                      <div
                        className="table-responsive"
                        style={{ maxHeight: "500px", overflowY: "auto" }}
                        data-aos="zoom-in-down"
                        data-aos-duration="1500"
                      >
                        <table className="table table-bordered table-hover">
                          <thead className="text-center bg-gradient">
                            <tr>
                              <th className="text-dark">#</th>
                              <th className="text-dark">Name</th>
                              <th className="text-dark">Email</th>
                              <th className="text-dark">Phone</th>
                              <th className="text-dark">Role</th>
                              <th className="text-dark">Message</th>
                              <th className="text-dark">Images</th>
                              <th className="text-dark">Edit</th>
                              <th className="text-dark">Delete</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentContent.length > 0 ? (
                              currentContent.map((item, index) => (
                                <React.Fragment key={item.id}>
                                  <tr className="text-center">
                                    <td className="table-respons">
                                      {index + 1}
                                    </td>
                                    <td className="table-respons">
                                      {item.name}
                                    </td>
                                    <td className="table-respons">
                                      {item.email}
                                    </td>
                                    <td className="table-respons">
                                      {item.phone}
                                    </td>
                                    <td className="table-respons">
                                      {item.role}
                                    </td>
                                    <td className="table-respons">
                                      {item.message}
                                    </td>

                                    <td className="table-respons">
                                      {item.pic && (
                                        <Link
                                          href={`/assets/images/${item.pic}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          <img
                                            src={`/assets/images/${item.pic}`}
                                            alt="Uploaded"
                                            className="img-fluid images-respons"
                                            style={{ maxWidth: "80px" }}
                                          />
                                        </Link>
                                      )}
                                    </td>

                                    <td className="table-respons">
                                      <Link
                                        className="btn btn-success btn-sm my-1"
                                        href={`/AdminUpdateLeadership/${item.id}`}
                                      >
                                        {" "}
                                        <i className="fa fa-edit text-white mx-2"></i>
                                      </Link>
                                    </td>

                                    <td className="table-respons">
                                      <button className="btn btn-danger btn-sm">
                                        <i
                                          className="fa fa-trash text-white mx-2"
                                          onClick={() => handleDelete(item.id)}
                                        ></i>
                                      </button>
                                    </td>
                                  </tr>
                                </React.Fragment>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={10} className="text-center">
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

export default AdminLeadership;
