"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";
import PageNavbar from "../Sidebar/Navbar/PageNavbar";
import PageFooter from "../Sidebar/Footer/page";
import Sidebars from "../Sidebar/Sidebars/PageSidebar";

function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [dataCounts, setDataCounts] = useState<any>({});
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [recentNewsletter, setRecentNewsletter] = useState<any[]>([]);
  const [mostBookedServices, setMostBookedServices] = useState<any[]>([]);
  const [recentMessage, setRecentMessage] = useState<any[]>([]);
  const [recentSMS, setRecentSMS] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [barChart, setBarChart] = useState<any[]>([]);
  const [toolChart, setToolChart] = useState<any[]>([]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const endpoints = [
    {
      key: "applicationsData",
      icon: <i className="fa fa-briefcase mx-2"></i>,
      bgClass: "card-gradient-1",
    },
    {
      key: "newsletter",
      icon: <i className="fa fa-newspaper-o mx-2"></i>,
      link: "/AdminNewsletter",
      bgClass: "card-gradient-2",
    },
    {
      key: "bookingOrder",
      icon: <i className="fa fa-book mx-2"></i>,
      link: "/AdminPayment",
      bgClass: "card-gradient-3",
    },
    {
      key: "user",
      icon: <i className="fa fa-users mx-2"></i>,
      link: "/AdminContact",
      bgClass: "card-gradient-4",
    },
    {
      key: "admin",
      icon: <i className="fa fa-user mx-2"></i>,
      link: "/AdminContact",
      bgClass: "card-gradient-5",
    },
    {
      key: "contactUs",
      icon: <i className="fa fa-envelope mx-2"></i>,
      bgClass: "card-gradient-6",
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      const counts: any = {};

      for (const item of endpoints) {
        try {
          const res = await fetch(`/api/${item.key}`);
          if (res.ok) {
            const result = await res.json();
            counts[item.key] = Array.isArray(result) ? result.length : 1;

            // Set recent items
            if (item.key === "applicationsData")
              setRecentApplications(result.slice(-5).reverse());
            if (item.key === "newsletter")
              setRecentNewsletter(result.slice(-6).reverse());
            if (item.key === "bookingOrder")
              setMostBookedServices(result.slice(-5).reverse());
            if (item.key === "contactUs")
              setRecentMessage(result.slice(-5).reverse());
            if (item.key === "message")
              setRecentSMS(result.slice(-5).reverse());
          } else {
            counts[item.key] = 0;
          }
        } catch {
          counts[item.key] = 0;
        }
      }
      // Fetch messages separately
      try {
        const res = await fetch("/api/contactUs");
        if (res.ok) {
          const messageData = await res.json();
          counts.message = messageData.length;
          setRecentMessage(messageData.slice(-2).reverse());
        } else {
          counts.message = 0;
        }
      } catch {
        counts.message = 0;
      }
      try {
        const res = await fetch("/api/message");
        if (res.ok) {
          const messageData = await res.json();
          counts.message = messageData.length;
          setRecentSMS(messageData.slice(-5).reverse());
        } else {
          counts.message = 0;
        }
      } catch {
        counts.message = 0;
      }
      setDataCounts(counts);

      // LineChart
      setChartData([
        { name: "Applications", value: counts.applicationsData || 0 },
        { name: "Newsletter", value: counts.newsletter || 0 },
        { name: "Most Booked", value: counts.bookingOrder || 0 },
        { name: "Users", value: counts.user || 0 },
        { name: "Admin", value: counts.admin || 0 },
      ]);

      // AreaChart
      setBarChart([
        { name: "Message", value: counts.message || 0 },
        { name: "Investor", value: counts.admin || 0 },
        { name: "Contact List", value: counts.contactUs || 0 },
      ]);

      // BarChart (toolChart)
      setToolChart([
        { name: "Applications", value: counts.applicationsData || 0 },
        { name: "Newsletter", value: counts.newsletter || 0 },
        { name: "Most Booked", value: counts.bookingOrder || 0 },
        { name: "Message", value: counts.user || 0 },
        { name: "Contact List", value: counts.admin || 0 },
      ]);
    };

    fetchData();
  }, []);

  return (
    <div className="wrapper">
      <Sidebars isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className={`content ${isSidebarOpen ? "" : "collapsed"}`}>
        <PageNavbar toggleSidebar={toggleSidebar} />

        <section className="mb-5 pt-4">
          <div className="container-fluid px-4">
            <h3 className="bg-gradient text-center p-3 fw-bold mb-4 rounded shadow-lg text-white">
              Admin Dashboard
            </h3>

            {/* Cards */}
            <div className="row g-4 mb-4">
              {endpoints.map((item, i) => {
                const formattedKey =
                  item.key.charAt(0).toUpperCase() + item.key.slice(1);
                const adminLink =
                  item.link || `/Admin${formattedKey.replace(/\s+/g, "")}`;

                return (
                  <div
                    className="col-sm-6 col-md-4 col-xl-4"
                    key={`${item.key}-${i}`}
                  >
                    <div
                      className={`rounded shadow-lg p-4 d-flex align-items-center admin-card justify-content-between hover-scale ${item.bgClass}`}
                    >
                      <div className="me-3">
                        <h5 className="mb-1 text-capitalize fw-semibold text-white">
                          {item.key}
                        </h5>
                        <h3 className="mb-2 text-white">
                          {dataCounts[item.key]}
                        </h3>
                        <Link
                          href={adminLink}
                          className="btn btn-sm btn-primary"
                        >
                          Manage {item.icon}
                        </Link>
                      </div>
                      <i className=" fa-2x">{item.icon}</i>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* LineChart */}
            <div className="bg-light rounded shadow-lg p-4 mb-5">
              <h5 className="mb-4">Overview Graph</h5>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#8884d8"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Recent Applications */}
            <div className="bg-light rounded shadow-lg p-4 mb-5">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Recent Applications</h6>
                <Link
                  href="/AdminApplicationsData"
                  className="btn btn-sm btn-primary"
                >
                  View All
                </Link>
              </div>
              <div className="table-responsive">
                <table className="table table-hover table-bordered text-center mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Department</th>
                      <th>Title</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentApplications.length > 0 ? (
                      recentApplications.map((item, index) => (
                        <tr key={`${item.id}-${index}`}>
                          <td>{index + 1}</td>
                          <td>{item.name}</td>
                          <td>{item.email}</td>
                          <td>{item.phone}</td>
                          <td>{item.department}</td>
                          <td>{item.title}</td>
                          <td>{item.status}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center">
                          No applications found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Newsletter & Message */}
            <div className="row">
              <div className="col-lg-6">
                <div className="bg-light rounded shadow-lg p-4 mb-5">
                  <h5 className="mb-4">Overview Bar Chart</h5>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart layout="vertical" data={toolChart}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="col-lg-6">
                <div className="bg-light rounded shadow-lg p-4 mb-5">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0">Recent Conact Messages</h6>
                    <Link
                      href="/AdminMessage"
                      className="btn btn-sm btn-primary"
                    >
                      View All
                    </Link>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-hover table-bordered text-center mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>#</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Message</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentMessage.length > 0 ? (
                          recentMessage.map((item, index) => (
                            <tr key={`${item.id}-${index}`}>
                              <td>{index + 1}</td>
                              <td>{item.name}</td>
                              <td>{item.email}</td>
                              <td>{item.phone}</td>
                              <td>{item.message}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="text-center">
                              No recent messages
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Area & Bar Charts */}
            <div className="row">
              <div className="col-lg-6">
                <div className="bg-light rounded shadow-lg p-4 mb-5">
                  <h5 className="mb-4">Overview Area Chart</h5>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart
                      data={barChart}
                      margin={{ top: 10, right: 5, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorValue"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#8884d8"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#8884d8"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <CartesianGrid strokeDasharray="3 3" />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#8884d8"
                        fillOpacity={1}
                        fill="url(#colorValue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="col-lg-6">
                <div className="bg-light rounded shadow-lg p-4 mb-5">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0">Recent Newsletter</h6>
                    <Link
                      href="/AdminNewsletter"
                      className="btn btn-sm btn-primary"
                    >
                      View All
                    </Link>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-hover table-bordered text-center mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>#</th>
                          <th>Email</th>
                          <th>Status</th>
                          <th>Date Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentNewsletter.length > 0 ? (
                          recentNewsletter.slice(0, 6).map((item, index) => (
                            <tr key={`${item.id}-${index}`}>
                              <td>{index + 1}</td>
                              <td>{item.email}</td>
                              <td>{item.status}</td>
                              <td>{item.joindate}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={2} className="text-center">
                              No newsletter subscribers
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <PageFooter />
      </div>
    </div>
  );
}

export default Dashboard;
