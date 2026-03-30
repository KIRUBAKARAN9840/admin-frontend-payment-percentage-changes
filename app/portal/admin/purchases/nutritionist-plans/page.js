"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import axiosInstance from "@/lib/axios";
import { FaDownload } from "react-icons/fa";

export default function NutritionistPlans() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [exporting, setExporting] = useState(false);

  const isFetchingRef = useRef(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchUsers = useCallback(async () => {
    if (isFetchingRef.current) return;

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit: 10,
      };

      if (debouncedSearchTerm) {
        params.search = debouncedSearchTerm;
      }

      const response = await axiosInstance.get("/api/admin/purchases/nutritionist-plans", { params });

      if (response.data.success) {
        setUsers(response.data.data.users);
        setTotalUsers(response.data.data.total);
      } else {
        throw new Error(response.data.message || "Failed to fetch nutritionist plans");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || "Failed to fetch nutritionist plans";
      setError(errorMsg);
      setUsers([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [debouncedSearchTerm, currentPage]);

  // Fetch users when filters change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleFilterChange = (filterType, value) => {
    setCurrentPage(1);
    if (filterType === "search") setSearchTerm(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getDaysLeftColor = (daysLeft) => {
    if (daysLeft < 0) return "#6b7280"; // Gray - expired
    if (daysLeft <= 2) return "#ef4444"; // Red - expiring very soon
    if (daysLeft <= 5) return "#f59e0b"; // Orange - expiring soon
    return "#10b981"; // Green - plenty of time
  };

  const getDaysLeftLabel = (daysLeft) => {
    if (daysLeft < 0) return "Expired";
    return `${daysLeft} days`;
  };

  const totalPages = Math.ceil(totalUsers / 10);

  const handleExport = async () => {
    try {
      setExporting(true);

      const response = await axiosInstance.get("/api/admin/purchases/export-nutritionist-plans", {
        responseType: "blob",
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      }));
      const link = document.createElement("a");
      link.href = url;

      // Extract filename from Content-Disposition header or generate default
      const contentDisposition = response.headers["content-disposition"];
      let filename = "nutritionist_plans.xlsx";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename=(.+)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/"/g, "");
        }
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export nutritionist plans. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      {/* Header Section */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Search by name, email, mobile..."
              value={searchTerm}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              style={{
                backgroundColor: "#1a1a1a",
                border: "1px solid #333",
                color: "#fff",
              }}
            />
            <button
              className="btn"
              type="button"
              style={{ backgroundColor: "#FF5757", border: "none", color: "#fff" }}
            >
              Search
            </button>
          </div>
        </div>
        <div className="col-md-8 text-end">
          <button
            className="btn"
            onClick={handleExport}
            disabled={exporting || loading}
            style={{
              backgroundColor: exporting || loading ? "#444" : "#28a745",
              border: "none",
              color: "#fff",
              padding: "8px 16px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              cursor: exporting || loading ? "not-allowed" : "pointer",
            }}
          >
            <FaDownload />
            {exporting ? "Exporting..." : "Export Excel"}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-5">
          <div
            style={{
              width: "50px",
              height: "50px",
              border: "4px solid #3a3a3a",
              borderTop: "4px solid #FF5757",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 1rem",
            }}
          />
          <p style={{ fontSize: "14px", color: "#ccc" }}>Loading nutritionist plans...</p>
        </div>
      ) : error ? (
        <div className="text-center py-5">
          <p style={{ fontSize: "16px", color: "#ef4444" }}>Error: {error}</p>
          <button
            className="btn btn-sm mt-3"
            onClick={() => fetchUsers()}
            style={{ backgroundColor: "#FF5757", border: "none", color: "#fff" }}
          >
            Retry
          </button>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-5">
          <p style={{ fontSize: "16px", color: "#888" }}>No nutritionist plans found</p>
        </div>
      ) : (
        <>
          {/* Table Section */}
          <div style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid #333" }}>
            <div className="table-responsive" style={{ margin: 0 }}>
              <table className="purchase-table" style={{ marginBottom: 0 }}>
                <thead style={{ background: "#3d3d3d" }}>
                  <tr>
                    <th style={{ background: "#3d3d3d" }}>Client Name</th>
                    <th style={{ background: "#3d3d3d" }}>Contact</th>
                    <th style={{ background: "#3d3d3d" }}>Gym</th>
                    <th style={{ background: "#3d3d3d" }}>Subscription Period</th>
                    <th style={{ background: "#3d3d3d" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.customer_id}>
                      <td>
                        <div>{user.name}</div>
                        <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>
                          Joined: {formatDate(user.client_joined_date)}
                        </div>
                      </td>
                      <td>
                        <div>{user.mobile}</div>
                        <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>
                          {user.email}
                        </div>
                      </td>
                      <td>
                        <div>{user.gym_name}</div>
                        <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>
                          {user.gym_location}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: "13px" }}>
                          <div style={{ color: "#888" }}>Start: {formatDate(user.subscription_start_date)}</div>
                          <div style={{ color: "#888" }}>End: {formatDate(user.subscription_end_date)}</div>
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: "4px 12px",
                            borderRadius: "12px",
                            fontSize: "13px",
                            fontWeight: "600",
                            backgroundColor: getDaysLeftColor(user.days_left) + "20",
                            color: getDaysLeftColor(user.days_left),
                          }}
                        >
                          {getDaysLeftLabel(user.days_left)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <div className="pagination-info">
                Showing {(currentPage - 1) * 10 + 1} to{" "}
                {Math.min(currentPage * 10, totalUsers)} of {totalUsers} entries
              </div>

              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  ‹
                </button>

                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      className={`pagination-btn ${pageNum === currentPage ? "active" : ""}`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
