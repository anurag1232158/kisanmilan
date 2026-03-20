"use client";
import Link from "next/link";
import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import PageFooter from "../../../Sidebar/Footer/page";
import Sidebars from "../../../Sidebar/Sidebars/PageSidebar";
import PageNavbar from "../../../Sidebar/Navbar/PageNavbar";
import ASO from "../../../AOS/AOS";

// Type for Career form data
type CareerForm = {
  department: string;
  title: string;
  pic: string;
  location: string;
  type: string;
  salary: string;
  status: string;
  description1: string;
  description2: string;
  description3: string;
  requirements1: string;
  requirements2: string;
  requirements3: string;
  requirements4: string;
  description: string;
  details: string;
};

function AdminHome() {
  const [ACData, setACData] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const router = useRouter();
  const [errorsMassage, setErrorsMassage] = useState<{ [key: string]: string }>(
    {}
  );
  const [show, setShow] = useState(false);

  const [data, setData] = useState<CareerForm>({
    department: "",
    title: "",
    pic: "",
    location: "",
    type: "",
    salary: "",
    status: "",
    description1: "",
    description2: "",
    description3: "",
    requirements1: "",
    requirements2: "",
    requirements3: "",
    requirements4: "",
    description: "",
    details: "",
  });

  useEffect(() => {
    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => {
        // If your data.json has a key like "mostbooked", use that:
        setACData(data.careers || data);
      })
      .catch((err) => console.error("Error fetching services:", err));
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const getInputData = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, files } = e.target as HTMLInputElement; // type narrow
    if (files && files[0]) {
      setData((prev) => ({ ...prev, [name]: files[0].name }));
    } else {
      setData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const resetForm = () => {
    setData({
      department: "",
      title: "",
      pic: "",
      location: "",
      type: "",
      salary: "",
      status: "",
      description1: "",
      description2: "",
      description3: "",
      requirements1: "",
      requirements2: "",
      requirements3: "",
      requirements4: "",
      description: "",
      details: "",
    });
    setShow(false);
    setErrorsMassage({});
  };

  const postData = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/careers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok) {
        alert("✅ Career Service added successfully!");
        router.push(`/AdminCareer`);
      } else {
        alert(result.error || "Something went wrong.");
      }
    } catch (err) {
      console.error("Submit failed:", err);
    }
  };

  const departmentTitles: Record<string, string[]> = {
    IT: ["Frontend", "Backend", "Fullstack", "Others"],
    HR: ["Recruitment", "Training", "Payroll", "Others"],
    Finance: ["Accounts", "Auditing", "Taxation", "Others"],
    Sales: ["B2B", "B2C", "Field Sales", "Others"],
    Marketing: ["Digital Marketing", "Content", "SEO", "Others"],
  };

  const titles = data.department ? departmentTitles[data.department] || [] : [];

  return (
    <>
      <ASO />
      <div className="wrapper">
        <Sidebars isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className={`content ${isSidebarOpen ? "" : "collapsed"}`}>
          <PageNavbar toggleSidebar={toggleSidebar} />

          {/* ---------- FORM SECTION ---------- */}
          <section className="mb-5 py-5">
            <div className="container-fluid px-4">
              <div className="border">
                <div className="text-center">
                  <h5
                    className="bg-gradient text-center p-3 fw-bold mb-4"
                    data-aos="flip-left"
                    data-aos-easing="ease-out-cubic"
                    data-aos-duration="1500"
                  >
                    Add Career Service
                    <Link href="/AdminCareer">
                      <i className="fa fa-arrow-left ms-2 text-white"></i>
                    </Link>
                  </h5>
                </div>
              </div>

              <div className="row">
                <div className="col-md-12 col-sm-12 m-auto">
                  <div className="card">
                    <div
                      className="card-body bg-grays1 mx-3"
                      data-aos="zoom-in-down"
                      data-aos-duration="1500"
                    >
                      <form onSubmit={postData} className="mt-2">
                        <div className="row mt-4">
                          {/* Department */}
                          <div className="col-md-4 mb-3">
                            <label className="form-label fw-bold">
                              Select Department :
                            </label>
                            <select
                              className="form-control"
                              name="department"
                              value={data.department}
                              onChange={getInputData}
                            >
                              <option value="">-- Select Department --</option>
                              <option value="IT">IT</option>
                              <option value="HR">HR</option>
                              <option value="Finance">Finance</option>
                              <option value="Sales">Sales</option>
                              <option value="Marketing">Marketing</option>
                            </select>
                            {show && errorsMassage.department && (
                              <p className="text-danger fw-normal">
                                {errorsMassage.department}
                              </p>
                            )}
                          </div>

                          {/* Title */}
                          <div className="col-md-4 mb-3">
                            <label className="form-label fw-bold">
                              {" "}
                              Select Title :
                            </label>
                            <select
                              className="form-control"
                              name="title"
                              value={data.title}
                              onChange={getInputData}
                              disabled={!data.department}
                            >
                              <option value="">-- Select Title --</option>
                              {titles.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                            {show && errorsMassage.title && (
                              <p className="text-danger fw-normal">
                                {errorsMassage.title}
                              </p>
                            )}
                          </div>

                          <div className="col-md-4">
                            <label className="form-label fw-bold">
                              Location :
                            </label>
                            <select
                              name="location"
                              value={data.location}
                              onChange={getInputData}
                              className="form-control"
                            >
                              <option value="">Select Location</option>
                              <option value="NCR">NCR</option>
                              <option value="Remote">Remote</option>
                              <option value="Onsite">Onsite</option>
                              <option value="Noida">Noida</option>
                              <option value="Greater Noida">
                                Greater Noida
                              </option>
                              <option value="Others">Others</option>
                            </select>
                          </div>
                        </div>

                        {/* Location, Type, Salary, Status */}
                        <div className="row mb-4">
                          <div className="col-md-4">
                            <label className="form-label fw-bold">Type :</label>
                            <select
                              name="type"
                              value={data.type}
                              onChange={getInputData}
                              className="form-control"
                            >
                              <option value="">Select Type</option>
                              <option value="Full Time">Full Time</option>
                              <option value="Part Time">Part Time</option>
                              <option value="Internship">Internship</option>
                              <option value="Temporary">Temporary</option>
                              <option value="Contract">Contract</option>
                              <option value="Others">Others</option>
                            </select>
                          </div>

                          <div className="col-md-4">
                            <label className="form-label fw-bold">
                              {" "}
                              Salary :
                            </label>
                            <select
                              name="salary"
                              value={data.salary}
                              onChange={getInputData}
                              className="form-control"
                            >
                              <option value="">Select Salary</option>
                              <option value="8K-10K">8K-10K</option>
                              <option value="10K-15K">10K-15K</option>
                              <option value="15K-20K">15K-20K</option>
                              <option value="20K-25K">20K-25K</option>
                              <option value="25K-30K">25K-30K</option>
                            </select>
                          </div>

                          <div className="col-md-4">
                            <label className="form-label fw-bold">
                              {" "}
                              Status :
                            </label>
                            <select
                              name="status"
                              value={data.status}
                              onChange={getInputData}
                              className="form-control"
                            >
                              <option value="">Select Status</option>
                              <option value="Active">Active</option>
                              <option value="Deactive">Deactive</option>
                            </select>
                          </div>
                        </div>

                        {/* Descriptions */}
                        <div className="row my-4">
                          <div className="col-md-4">
                            <label className="form-label fw-bold">
                              {" "}
                              Description 1 :
                            </label>
                            <textarea
                              name="description1"
                              onChange={getInputData}
                              value={data.description1}
                              className="form-control mt-2"
                              placeholder="Enter description 1"
                            ></textarea>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label fw-bold">
                              {" "}
                              Description 2 :
                            </label>
                            <textarea
                              name="description2"
                              onChange={getInputData}
                              value={data.description2}
                              className="form-control mt-2"
                              placeholder="Enter description 2"
                            ></textarea>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label fw-bold">
                              {" "}
                              Description 3 :
                            </label>
                            <textarea
                              name="description3"
                              onChange={getInputData}
                              value={data.description3}
                              className="form-control mt-2"
                              placeholder="Enter description 3"
                            ></textarea>
                          </div>
                        </div>

                        {/* Requirements */}
                        <div className="row my-4">
                          <div className="col-md-4">
                            <div className="col-md-4">
                              <label className="form-label fw-bold">
                                {" "}
                                Requirement 1 :
                              </label>
                              <textarea
                                name="requirements1"
                                value={data.requirements1}
                                onChange={getInputData}
                                className="form-control mt-2"
                                placeholder="Enter Requirement 1"
                              ></textarea>
                            </div>
                            <label className="form-label fw-bold">
                              {" "}
                              Requirement 2 :
                            </label>
                            <textarea
                              name="requirements2"
                              value={data.requirements2}
                              onChange={getInputData}
                              className="form-control mt-2"
                              placeholder="Enter Requirement 2"
                            ></textarea>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label fw-bold">
                              {" "}
                              Requirement 3 :
                            </label>
                            <textarea
                              name="requirements3"
                              value={data.requirements3}
                              onChange={getInputData}
                              className="form-control mt-2"
                              placeholder="Enter Requirement 3"
                            ></textarea>
                          </div>
                        </div>
                        {/* Career Description & Details */}
                        <div className="row my-4">
                          <div className="col-md-4">
                            <label className="form-label fw-bold">
                              {" "}
                              Requirement 4 :
                            </label>
                            <textarea
                              name="requirements4"
                              value={data.requirements4}
                              onChange={getInputData}
                              className="form-control mt-2"
                              placeholder="Enter Requirement 4"
                            ></textarea>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label fw-bold">
                              {" "}
                              Details :
                            </label>
                            <textarea
                              name="details"
                              value={data.details}
                              onChange={getInputData}
                              rows={4}
                              className="form-control mt-2"
                              placeholder="Enter Career Details"
                            ></textarea>
                          </div>

                          <div className="col-md-4">
                            <div className="mb-3 fw-bold">
                              <label>Image :</label>
                              <input
                                type="file"
                                name="pic"
                                className="form-control mt-2"
                                onChange={getInputData}
                              />
                              {data.pic && (
                                <div className="mt-2">
                                  <img
                                    src={`/assets/images/${data.pic}`}
                                    alt={data.pic}
                                    width="150"
                                    height="70"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* Buttons */}
                        <div className="mb-3 btn-group w-100 py-5">
                          <button
                            type="button"
                            onClick={resetForm}
                            className="btn btn-secondary text-light w-50"
                          >
                            Reset
                          </button>
                          <button
                            type="button"
                            onClick={() => router.push("/AdminCareer")}
                            className="btn btn-primary text-light w-50"
                          >
                            Back
                          </button>
                          <button
                            type="submit"
                            className="btn btn-success text-light w-50"
                          >
                            Submit
                          </button>
                        </div>
                      </form>
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
