"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import axiosInstance from "@/lib/axios";

export default function AICredits() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPurchases, setTotalPurchases] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const isFetchingRef = useRef(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchPurchases = useCallback(async () => {
    if (isFetchingRef.current) return;
    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      const params = { page: currentPage, limit: 10 };
      if (debouncedSearchTerm) params.search = debouncedSearchTerm;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await axiosInstance.get("/api/admin/purchases/ai-credits", { params });

      if (response.data.success) {
        setPurchases(response.data.data.purchases);
        setTotalPurchases(response.data.data.total);
      } else {
        throw new Error(response.data.message || "Failed to fetch AI credits");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || "Failed to fetch AI credits";
      setError(errorMsg);
      setPurchases([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [debouncedSearchTerm, currentPage, startDate, endDate]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const formatDate = (dateString) => {
    if (!dateString || dateString === "N/A") return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const totalPages = Math.ceil(totalPurchases / 10);

  const handleReset = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  return (
    <div style={{ padding: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
        {/* Search */}
        <div className="input-group" style={{ maxWidth: "340px" }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search by client name or mobile..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            style={{ backgroundColor: "#222", border: "1px solid #333", color: "#fff" }}
          />
          <button className="btn" type="button" style={{ backgroundColor: "#FF5757", border: "none", color: "#fff" }}>
            Search
          </button>
        </div>

        {/* Date filters */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <label style={{ fontSize: "11px", color: "#888", display: "block", marginBottom: "3px" }}>From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
              style={{ padding: "7px 10px", background: "#222", border: "1px solid #333", borderRadius: "6px", color: "#fff", fontSize: "13px" }}
            />
          </div>
          <div>
            <label style={{ fontSize: "11px", color: "#888", display: "block", marginBottom: "3px" }}>To</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
              style={{ padding: "7px 10px", background: "#222", border: "1px solid #333", borderRadius: "6px", color: "#fff", fontSize: "13px" }}
            />
          </div>
          {(startDate || endDate || searchTerm) && (
            <button
              onClick={handleReset}
              style={{ marginTop: "18px", padding: "7px 14px", background: "#333", border: "1px solid #444", borderRadius: "6px", color: "#aaa", fontSize: "13px", cursor: "pointer" }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="text-center py-5">
          <div style={{ width: "50px", height: "50px", border: "4px solid #3a3a3a", borderTop: "4px solid #06b6d4", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 1rem" }} />
          <p style={{ fontSize: "14px", color: "#ccc" }}>Loading AI credits...</p>
        </div>
      ) : error ? (
        <div className="text-center py-5">
          <p style={{ fontSize: "16px", color: "#ef4444" }}>Error: {error}</p>
          <button className="btn btn-sm mt-3" onClick={() => fetchPurchases()} style={{ backgroundColor: "#FF5757", border: "none", color: "#fff" }}>
            Retry
          </button>
        </div>
      ) : purchases.length === 0 ? (
        <div className="text-center py-5">
          <p style={{ fontSize: "16px", color: "#888" }}>No AI credits purchases found</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="table-responsive" style={{ overflowX: "auto" }}>
            <table className="table purchases-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Client Name</th>
                  <th>Contact</th>
                  <th>Purchased Date</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((item, idx) => (
                  <tr key={item.id}>
                    <td style={{ color: "#666", fontSize: "13px" }}>
                      {(currentPage - 1) * 10 + idx + 1}
                    </td>
                    <td className="client-name">{item.client_name || "N/A"}</td>
                    <td className="client-contact">{item.mobile || "N/A"}</td>
                    <td>
                      <div style={{ fontSize: "13px", color: "#ccc" }}>{formatDate(item.purchased_date)}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: "14px", color: "#10b981", fontWeight: "600" }}>
                        ₹{item.amount?.toFixed(2) || "0.00"}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="d-flex justify-content-between align-items-center mt-4">
            <div style={{ color: "#888", fontSize: "14px" }}>
              Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, totalPurchases)} of {totalPurchases} entries
            </div>
            <div className="btn-group">
              <button
                className="btn btn-sm"
                disabled={currentPage === 1 || loading}
                onClick={() => setCurrentPage(currentPage - 1)}
                style={{ backgroundColor: "#1a1a1a", border: "1px solid #333", color: currentPage > 1 && !loading ? "#fff" : "#555", cursor: currentPage > 1 && !loading ? "pointer" : "not-allowed" }}
              >
                Previous
              </button>
              <button
                className="btn btn-sm"
                disabled={currentPage >= totalPages || loading}
                onClick={() => setCurrentPage(currentPage + 1)}
                style={{ backgroundColor: "#1a1a1a", border: "1px solid #333", color: currentPage < totalPages && !loading ? "#fff" : "#555", cursor: currentPage < totalPages && !loading ? "pointer" : "not-allowed" }}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      <style jsx global>{`
        .table-responsive { overflow-x: auto !important; position: relative !important; }
        table.purchases-table { width: 100% !important; min-width: 900px !important; border-collapse: separate !important; border-spacing: 0 !important; background-color: #1a1a1a !important; color: #fff !important; border-radius: 8px !important; }
        table.purchases-table > thead { background-color: #222 !important; border-bottom: 2px solid #06b6d4 !important; }
        table.purchases-table > thead > tr > th { padding: 12px !important; font-weight: 600 !important; text-align: left !important; color: #fff !important; border: none !important; background-color: transparent !important; }
        table.purchases-table > tbody > tr { border-bottom: 1px solid #333 !important; transition: background-color 0.2s ease !important; background-color: transparent !important; }
        table.purchases-table > tbody > tr:hover { background-color: #222 !important; }
        table.purchases-table > tbody > tr > td { padding: 12px !important; color: #fff !important; border: none !important; background-color: transparent !important; }
        table.purchases-table .client-name { font-weight: 500 !important; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
