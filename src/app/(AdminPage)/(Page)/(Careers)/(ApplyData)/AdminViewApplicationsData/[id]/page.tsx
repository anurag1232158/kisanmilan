"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import PageFooter from "../../../../Sidebar/Footer/page";
import Sidebars from "../../../../Sidebar/Sidebars/PageSidebar";
import PageNavbar from "../../../../Sidebar/Navbar/PageNavbar";
import ASO from "../../../../AOS/AOS";

type Job = {
  id: string;
  jobId: string;
  title: string;
  department: string;
  location: string;
  type: string;
  salary: string;
  name: string;
  email: string;
  phone: string;
  skills: string;
  experience: string;
  coverLetter: string;
  resume: string;
  status: string;
  appliedAt: string;
};

export default function JobDetailsPage() {
  const { id } = useParams();
  const [data, setData] = useState<Job | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const params = useParams();
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/applicationsData/${params.id}`);
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    if (params?.id) fetchData();
  }, [params?.id]);
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      const res = await fetch(`/api/applicationsData/${id}`, {
        method: "DELETE",
      });
      if (res.ok) setData(null);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <>
      <ASO />
      <div className="wrapper d-flex">
        <Sidebars isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div
          className={`content flex-grow-1 ${isSidebarOpen ? "" : "collapsed"}`}
        >
          <PageNavbar toggleSidebar={toggleSidebar} />

          <section className="container py-4 px-3 px-md-4 border-1 border">
            {/* HEADER */}
            <div className="d-flex bg-body shadow-sm rounded-4 py-4 px-md-3 justify-content-between align-items-center mb-4">
              <h3 className="fw-bold text-dark m-0">
                <i className="fa fa-briefcase me-2"></i>
                Application Details
              </h3>
              <button
                className="btn btn-outline-danger btn-sm px-3"
                onClick={() => handleDelete(data?.id || "")}
              >
                <i className="fa fa-trash me-1"></i> Delete
              </button>
              .
            </div>

            {/* MAIN CARD */}
            <div className="card shadow-sm border-0 rounded-4">
              {/* PERSONAL INFO */}
              <div className="mb-4">
                <h5 className="fw-bold text-secondary mb-3 px-3">
                  <i className="fa fa-user me-2"></i> Personal Information
                </h5>
                <div className="container">
                  <div className="row g-2 shadow-sm">
                    <div className="col-lg-4">
                      <div className="p-3 bg-light shadow-sm border rounded">
                        <small className="text-muted">Name</small>
                        <div className="fw-semibold">{data?.name}</div>
                      </div>
                    </div>

                    <div className="col-lg-4">
                      <div className="p-3 bg-light shadow-sm border rounded">
                        <small className="text-muted">Email</small>
                        <div className="fw-semibold">{data?.email}</div>
                      </div>
                    </div>

                    <div className="col-lg-4">
                      <div className="p-3 bg-light shadow-sm border rounded">
                        <small className="text-muted">Phone</small>
                        <div className="fw-semibold">{data?.phone}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <hr />
              {/* JOB DETAILS */}
              <div className="mb-4">
                <h5 className="fw-bold text-secondary mb-3 px-3">
                  <i className="fa fa-briefcase me-2"></i>
                  Job Details
                </h5>

                <div className="container">
                  <div className="row g-2 shadow-sm">
                    <div className="col-md-4">
                      <div className="p-3 bg-light shadow-sm border rounded">
                        <small className="text-muted">Position</small>
                        <div className="fw-semibold">{data?.title}</div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className=" p-3 bg-light shadow-sm border rounded">
                        <small className="text-muted">Department</small>
                        <div className="fw-semibold">{data?.department}</div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className=" p-3 bg-light shadow-sm border rounded">
                        <small className="text-muted">Location</small>
                        <div className="fw-semibold">{data?.location}</div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className=" p-3 bg-light shadow-sm border rounded">
                        <small className="text-muted">Job Type</small>
                        <div className="fw-semibold">{data?.type}</div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className=" p-3 bg-light shadow-sm border rounded">
                        <small className="text-muted">Salary</small>
                        <div className="fw-semibold">{data?.salary}</div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className=" p-3 bg-light shadow-sm border rounded">
                        <small className="text-muted">Status</small>
                        <div className="badge rounded-pill float-end bg-primary px-3 py-2 fs-6">
                          {data?.status}
                        </div>
                        <div className="fw-semibold">{data?.status}</div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className=" p-3 bg-light shadow-sm border rounded">
                        <small className="text-muted">Applied At</small>
                        <div className="fw-semibold">
                          {new Date(data?.appliedAt || "").toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <hr />
              {/* SKILLS & EXPERIENCE & DOCUMENTS */}
              <div className="row px-2">
                <div className="col-md-6">
                  <div className="mb-4">
                    <h5 className="fw-bold text-secondary mb-3 px-2">
                      <i className="fa fa-cogs me-2"></i>
                      Skills & Experience
                    </h5>

                    <div className="p-3 bg-light shadow-sm border rounded mb-2">
                      <small className="text-muted">Skills</small>
                      <div className="fw-semibold">{data?.skills}</div>
                    </div>

                    <div className="p-3 bg-light shadow-sm border rounded">
                      <small className="text-muted">Experience</small>
                      <div className="fw-semibold">{data?.experience}</div>
                    </div>
                  </div>
                  <hr />
                  {/* DOCUMENTS */}
                </div>
                <div className="col-md-6">
                  <div className="mb-4">
                    <h5 className="fw-bold text-secondary mb-3">
                      <i className="fa fa-file me-2"></i>
                      Documents
                    </h5>
                    {/* Resume */}
                    <div className="p-3 border rounded d-flex justify-content-between align-items-center mb-3 bg-light">
                      <div>
                        <small className="text-muted d-block">Resume</small>
                        {data?.resume ? (
                          <span className="fw-semibold">{data.resume}</span>
                        ) : (
                          "No Resume Uploaded"
                        )}
                      </div>

                      {data?.resume && (
                        <a
                          href={`/assets/resumes/${data.resume}`}
                          target="_blank"
                          className="btn btn-sm btn-outline-primary"
                        >
                          <i className="fa fa-download me-1"></i>
                          Download
                        </a>
                      )}
                    </div>
                    {/* Cover Letter */}
                    <div className="p-3 bg-light rounded border rounded shadow-sm">
                      <small className="text-muted d-block mb-1">
                        Cover Letter
                      </small>
                      <div className="fw-semibold">
                        {data?.coverLetter || "No cover letter provided"}
                      </div>
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
