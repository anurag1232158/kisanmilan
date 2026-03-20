"use client";
import Link from "next/link";
import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import PageFooter from "../../Sidebar/Footer/page";
import Sidebars from "../../Sidebar/Sidebars/PageSidebar";
import PageNavbar from "../../Sidebar/Navbar/PageNavbar";
import ASO from "../../AOS/AOS";
type AC = {
  id: string;
  name: "";
  pic: "";
  description: "";
  price: "";
  duration: "";
  createdAt: "";
  updatedAt: "";
  rating: "";
  status: "";
  details: "";
  category: "";
  discount: "";
};

function AdminHome() {
  const [ACData, setACData] = useState<AC[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const router = useRouter();

  // ---------------- FORM STATES ----------------
  const [errorsMassage, setErrorsMassage] = useState<{ [key: string]: string }>(
    {}
  );
  const [show, setShow] = useState(false);
  const [data, setData] = useState({
    name: "",
    pic: "",
    description: "",
    price: "",
    duration: "",
    createdAt: "",
    updatedAt: "",
    rating: "",
    status: "",
    details: "",
    category: "",
    discount: "",
  });

  // ---------------- FETCH LIST ----------------
  useEffect(() => {
    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => {
        // If your data.json has a key like "mostbooked", use that:
        setACData(data.cleaningService || data);
      })
      .catch((err) => console.error("Error fetching services:", err));
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // ---------------- FORM HANDLERS ----------------
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

  const postData = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/cleaningService", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok) {
        alert("✅ Cleaning Service added successfully!");
        router.push(`/`);
      } else {
        alert(result.error || "Something went wrong.");
      }
    } catch (err) {
      console.error("Submit failed:", err);
    }
  };

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
                    Add Cleaning Service
                    <Link href="/AdminCleaning">
                      {" "}
                      <i className="fa fa-arrow-left ms-2 text-white"></i>
                    </Link>
                  </h5>
                </div>
              </div>
              <div className="row">
                <div className="col-md-12 col-sm-12 m-auto">
                  <div className="card">
                    <div
                      className="card-body bg-grays1"
                      data-aos="zoom-in-down"
                      data-aos-duration="1500"
                    >
                      <form onSubmit={postData} className="mt-2">
                        <div className="row">
                          <div className="col-md-4">
                            <div className="mb-3 fw-bold">
                              <label> Select Name :</label>
                              <select
                                name="name"
                                onChange={getInputData}
                                value={data.name}
                                className="form-control mt-2"
                              >
                                <option value="">Select Name</option>
                                <option value="Home Deep Cleaning">
                                  Home Cleaning
                                </option>
                                <option value="Office Cleaning">
                                  Office Cleaning
                                </option>
                                <option value="Bathroom Cleaning">
                                  Bathroom Cleaning
                                </option>
                                <option value="Industrial Cleaning">
                                  Industrial Cleaning
                                </option>
                                <option value="Society Cleaning">
                                  Society Cleaning
                                </option>
                                <option value="Apartment Cleaning">
                                  Apartment Cleaning
                                </option>
                                <option value="Hospital Cleaning">
                                  Hospital Cleaning{" "}
                                </option>
                                <option value="Hotal Cleaning">
                                  Hotal Cleaning{" "}
                                </option>
                                <option value="Events Cleanup">
                                  Events Cleanup
                                </option>
                                <option value="Pool Cleaning">
                                  Pool Cleaning
                                </option>
                                <option value="Pantry & Kitchenette Cleaning">
                                  Pantry & Kitchenette Cleaning{" "}
                                </option>
                                <option value="Carpet & Upholstery Cleaning ">
                                  Carpet & Upholstery Cleaning
                                </option>
                                <option value="Balcony & Terrace Cleaning">
                                  Balcony & Terrace Cleaning
                                </option>
                                <option value="Garage & Basement Cleaning">
                                  Garage & Basement Cleaning
                                </option>
                                <option value="School & College Cleaning ">
                                  School & College Cleaning{" "}
                                </option>
                              </select>
                              {show && errorsMassage.name && (
                                <p className="text-danger fw-normal">
                                  {errorsMassage.name}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="col-md-4">
                            <div className="mb-3 fw-bold">
                              <label> Select Category :</label>
                              <select
                                name="category"
                                onChange={getInputData}
                                value={data.category}
                                className="form-control mt-2"
                              >
                                <option value="">Select Category</option>
                                <option value="Community">Community</option>
                                <option value="Residential">Residential</option>
                                <option value="Commercial">Commercial</option>
                                <option value="Institutional">
                                  Institutional
                                </option>
                                <option value="Residential/Commercial">
                                  Residential/Commercial
                                </option>
                              </select>
                              {show && errorsMassage.category && (
                                <p className="text-danger fw-normal">
                                  {errorsMassage.category}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="col-md-4">
                            <div className="mb-3 fw-bold">
                              <label>Duration Time :</label>
                              <select
                                name="duration"
                                onChange={getInputData}
                                value={data.duration}
                                className="form-control mt-2"
                              >
                                <option value="">Select Duration Time</option>
                                <option value="Half day">Half day</option>
                                <option value="1 days">1 day</option>
                                <option value="2 days">2 days</option>
                                <option value="3 days">3 days</option>
                                <option value="4 days">4 days</option>
                                <option value="5 days">5 days</option>
                                <option value="1-2 days">1-2 days</option>
                                <option value="2-3 days">2-3 days</option>
                                <option value="3-4 days">3-4 days</option>
                                <option value="4-5 days">4-5 days</option>
                                <option value="5-6 days">5-6 days</option>
                              </select>
                              {show && errorsMassage.duration && (
                                <p className="text-danger fw-normal">
                                  {errorsMassage.duration}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="row">
                          <div className="col-md-4">
                            <div className="mb-3 fw-bold">
                              <label>CreatedAt :</label>
                              <input
                                type="date"
                                name="createdAt"
                                onChange={getInputData}
                                value={data.createdAt}
                                placeholder="Enter createdAt"
                                className={`form-control mt-2 ${
                                  show && errorsMassage.createdAt
                                    ? "is-invalid"
                                    : ""
                                }`}
                              />
                              {show && errorsMassage.createdAt && (
                                <p className="text-danger fw-normal">
                                  {errorsMassage.createdAt}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="col-md-4">
                            <div className="mb-3 fw-bold">
                              <label>UpdatedAt :</label>
                              <input
                                type="date"
                                name="updatedAt"
                                className="form-control mt-2"
                                onChange={getInputData}
                              />
                              {show && errorsMassage.updatedAt && (
                                <p className="text-danger fw-normal">
                                  {errorsMassage.updatedAt}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="col-md-4">
                            <div className="mb-3 fw-bold">
                              <label>Status :</label>
                              <select
                                name="status"
                                id="status"
                                onChange={getInputData}
                                value={data.status}
                                className="form-control mt-2"
                              >
                                <option value="Select"> Select Status</option>
                                <option value="Active">Active</option>
                                <option value="Deactive">Deactive</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="row">
                          <div className="col-md-4">
                            <div className="mb-3 fw-bold">
                              <label>Rating :</label>
                              <div className="d-flex gap-2 mt-2 form-control p-0">
                                {[1, 2, 3, 4, 5].map((num) => (
                                  <label
                                    key={num}
                                    style={{ cursor: "pointer" }}
                                  >
                                    <input
                                      type="radio"
                                      name="rating"
                                      value={num}
                                      checked={data.rating === String(num)}
                                      onChange={getInputData}
                                      className="d-none mx-3"
                                    />
                                    <span
                                      className="px-1"
                                      style={{
                                        fontSize: "25px",
                                        paddingLeft: "10px",
                                        color:
                                          num <= Number(data.rating)
                                            ? "#ff0000ff"
                                            : "#2f5fffff",
                                      }}
                                    >
                                      ★
                                    </span>
                                  </label>
                                ))}
                              </div>
                              {show && errorsMassage.rating && (
                                <p className="text-danger fw-normal">
                                  {errorsMassage.rating}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="col-md-4">
                            <div className="mb-3 fw-bold">
                              <label>Price :</label>
                              <input
                                type="text"
                                name="price"
                                onChange={getInputData}
                                value={data.price}
                                placeholder="Enter Price"
                                className={`form-control mt-2 ${
                                  show && errorsMassage.price
                                    ? "is-invalid"
                                    : ""
                                }`}
                              />
                              {show && errorsMassage.price && (
                                <p className="text-danger fw-normal">
                                  {errorsMassage.price}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="col-md-4">
                            <div className="mb-3 fw-bold">
                              <label> Discount :</label>
                              <input
                                type="number"
                                name="discount"
                                className="form-control mt-2"
                                value={data.discount}
                                placeholder="Enter Discount"
                                onChange={getInputData}
                              />
                              {show && errorsMassage.discount && (
                                <p className="text-danger fw-normal">
                                  {errorsMassage.discount}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="row">
                          <div className="col-md-6">
                            <div className="mb-3 fw-bold">
                              <label>Description :</label>
                              <textarea
                                name="description"
                                className="form-control mt-2"
                                id=""
                                placeholder="Enter AC Description"
                                value={data.description}
                                rows={4}
                                onChange={getInputData}
                              ></textarea>
                              {show && errorsMassage.description && (
                                <p className="text-danger fw-normal">
                                  {errorsMassage.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="col-md-6">
                            <div className="mb-3 fw-bold">
                              <label> Details :</label>
                              <textarea
                                name="details"
                                className="form-control mt-2"
                                id=""
                                placeholder="Enter AC Details"
                                value={data.details}
                                rows={4}
                                onChange={getInputData}
                              ></textarea>
                              {show && errorsMassage.details && (
                                <p className="text-danger fw-normal">
                                  {errorsMassage.details}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="row">
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
                                    alt="AC"
                                    width="100"
                                    height="100"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mb-3 btn-group w-100 py-5">
                          <button
                            type="reset"
                            className="btn btn-secondary text-light w-50"
                          >
                            Reset
                          </button>
                          <button
                            type="button"
                            onClick={() => router.push("/AdminCleaning")}
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
