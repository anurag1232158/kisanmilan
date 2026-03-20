"use client";
import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import { useRouter, useParams } from "next/navigation";

import PageFooter from "../../../Sidebar/Footer/page";
import Sidebars from "../../../Sidebar/Sidebars/PageSidebar";
import PageNavbar from "../../../Sidebar/Navbar/PageNavbar";
import ASO from "../../../AOS/AOS";

type AC = {
  id: string;
  name: string;
  pic: string;
  description: string;
  price: string;
  duration: string;
  createdAt: string;
  updatedAt: string;
  rating: string;
  status: string;
  details: string;
  category: string;
  discount?: string;
};

function AdminUpdateAC() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [data, setData] = useState<AC>({
    id: "",
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
  const [errorsMassage, setErrorsMassage] = useState<{ [key: string]: string }>(
    {}
  );
  const [show, setShow] = useState(false);
  const router = useRouter();
  const params = useParams();

  // 🟢 Fetch AC by ID
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/acService?id=${params.id}`);
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch (err) {
        console.error("Error fetching AC:", err);
      }
    };
    if (params?.id) fetchData();
  }, [params?.id]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // 🟠 Handle input changes
  const getInputData = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, files } = e.target as HTMLInputElement;
    if (files && files[0]) {
      setData((prev) => ({ ...prev, [name]: files[0].name }));
    } else {
      setData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // 🔵 Handle update
  const updateData = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setShow(true);

    let errors: any = {};
    if (!data.name) errors.name = "AC Name is required";
    setErrorsMassage(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      const res = await fetch(`/api/acService?id=${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        alert("✅ Updated successfully!");
        router.push("/AdminAC");
      }
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <>
      <ASO />
      <div className="wrapper">
        <Sidebars isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className={`content ${isSidebarOpen ? "" : "collapsed"}`}>
          <PageNavbar toggleSidebar={toggleSidebar} />
          <section className="mb-5 py-5">
            <div className="container-fluid px-4">
              <div className="border p-3 mb-3 bg-gradient">
                <div className="text-center">
                  <h5 className="mb-0 font-weight-medium fw-bold text-white">
                    {" "}
                    Update AC
                  </h5>
                </div>
              </div>
              <div className="row">
                <div className="col-md-12 col-sm-12 m-auto">
                  <div className="card">
                    <div className="card-body bg-grays1">
                      <form onSubmit={updateData} className="mt-2">
                        <div className="row">
                          <div className="col-md-4">
                            <div className="mb-3 fw-bold">
                              <label>Select Name :</label>
                              <select
                                name="name"
                                onChange={getInputData}
                                value={data.name}
                                className="form-control mt-2"
                              >
                                <option value="AC">Select Name</option>
                                <option value="AC Repair">AC Repair</option>
                                <option value="AC Cleaning">AC Cleaning</option>
                                <option value="AC Gas Refill">
                                  AC Gas Refill
                                </option>
                                <option value="AC Installation">
                                  AC Installation
                                </option>
                                <option value="AC Uninstallation">
                                  AC Uninstallation
                                </option>
                                <option value="Thermostat Repair">
                                  Thermostat Repair
                                </option>
                                <option value="PCB Board Replacement">
                                  PCB Board Replacement
                                </option>
                                <option value="Compressor Replacement">
                                  Compressor Replacement
                                </option>
                                <option value="Condenser Coil Cleaning">
                                  Condenser Coil Cleaning
                                </option>
                                <option value="Fan Motor Replacement">
                                  Fan Motor Replacement
                                </option>
                              </select>
                              {show && errorsMassage.name && (
                                <p className="text-danger">
                                  {errorsMassage.name}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="col-md-4">
                            <div className="mb-3 fw-bold">
                              <label> Select Category </label>
                              <select
                                name="category"
                                onChange={getInputData}
                                value={data.category}
                                className="form-control mt-2"
                              >
                                <option value="AC">Select Category</option>
                                <option value="Repair">Repair</option>
                                <option value="Installation">
                                  Installation
                                </option>
                                <option value="Maintenance">Maintenance</option>
                                <option value="Parts Replacement">
                                  Parts Replacement
                                </option>
                              </select>
                            </div>
                          </div>

                          <div className="col-md-4">
                            <label className="fw-bold">Duration Time </label>
                            <select
                              name="duration"
                              onChange={getInputData}
                              autoFocus
                              value={data.duration}
                              className="form-control mt-2"
                            >
                              <option value="">Select Duration Time</option>
                              <option value="1 hours">1 hour</option>
                              <option value="2 hours">2 hours</option>
                              <option value="3 hours">3 hours</option>
                              <option value="4 hours">4 hours</option>
                              <option value="5 hours">5 hours</option>
                              <option value="1-2 hours">1-2 hours</option>
                              <option value="2-3 hours">2-3 hours</option>
                              <option value="3-4 hours">3-4 hours</option>
                              <option value="4-5 hours">4-5 hours</option>
                              <option value="5-6 hours">5-6 hours</option>
                              <option value="30 minutes">30 minutes</option>
                            </select>
                          </div>
                        </div>

                        <div className="row">
                          <div className="col-md-4">
                            <label className="fw-bold">CreatedAt </label>
                            <input
                              type="date"
                              name="createdAt"
                              onChange={getInputData}
                              autoFocus
                              value={
                                data.createdAt
                                  ? data.createdAt.split("T")[0]
                                  : ""
                              }
                              className="form-control mt-2"
                            />
                          </div>

                          <div className="col-md-4">
                            <div className="mb-3 fw-bold">
                              <label>UpdatedAt :</label>
                              <input
                                type="date"
                                name="updatedAt"
                                onChange={getInputData}
                                autoFocus
                                value={
                                  data.updatedAt
                                    ? data.updatedAt.split("T")[0]
                                    : ""
                                }
                                className="form-control mt-2"
                              />
                            </div>
                          </div>

                          <div className="col-md-4">
                            <div className="mb-3 fw-bold">
                              <label>Status </label>
                              <select
                                name="status"
                                onChange={getInputData}
                                value={data.status}
                                className="form-control mt-2"
                              >
                                <option value="Select Status">
                                  {" "}
                                  Select Status
                                </option>
                                <option value="Active">Active</option>
                                <option value="Deactive">Deactive</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="row">
                          <div className="col-md-4">
                            <div className="mb-3 fw-bold">
                              <label>Rating </label>
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
                                      onChange={(e) =>
                                        setData((prev) => ({
                                          ...prev,
                                          rating: e.target.value,
                                        }))
                                      }
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
                            </div>
                          </div>

                          <div className="col-md-4">
                            <div className="mb-3 fw-bold">
                              <label>Price :</label>
                              <input
                                type="number"
                                name="price"
                                onChange={getInputData}
                                autoComplete="off"
                                autoFocus
                                value={data.price}
                                placeholder="Enter  Price"
                                className={`form-control mt-2 ${
                                  show && errorsMassage.price
                                    ? "is-invalid"
                                    : ""
                                }`}
                              />
                              {show && errorsMassage.price && (
                                <p className="text-danger">
                                  {errorsMassage.price}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="col-md-4">
                            <div className="mb-3 fw-bold">
                              <label>Discount :</label>
                              <input
                                type="number"
                                name="discount"
                                onChange={getInputData}
                                autoComplete="off"
                                autoFocus
                                value={data.discount}
                                placeholder="Enter  Discount"
                                className="form-control mt-2"
                              />
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

                          <div className="col-md-4">
                            <div className="mb-3 fw-bold">
                              <label>Description :</label>
                              <textarea
                                name="description"
                                rows={6}
                                onChange={getInputData}
                                value={data.description}
                                className="form-control"
                                id=""
                              ></textarea>
                            </div>
                          </div>

                          <div className="col-md-4">
                            <div className="mb-3 fw-bold">
                              <label>Details :</label>
                              <textarea
                                name="details"
                                rows={6}
                                onChange={getInputData}
                                value={data.details}
                                className="form-control"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mb-3 btn-group w-100 py-5">
                          <button
                            type="button"
                            onClick={() => router.push("/AdminAC")}
                            className="btn btn-primary text-light w-50"
                          >
                            {" "}
                            Back{" "}
                          </button>
                          <button
                            onClick={scrollToTop}
                            type="submit"
                            className="btn btn-success text-light w-50"
                          >
                            Update
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

export default AdminUpdateAC;
