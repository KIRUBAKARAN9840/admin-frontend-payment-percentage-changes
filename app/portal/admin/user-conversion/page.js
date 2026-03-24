"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";

export default function UserConversion() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [telecallers, setTelecallers] = useState([]);

  useEffect(() => {
    fetchTelecallers();
  }, []);

  const fetchTelecallers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/api/admin/user-conversion/telecallers");

      if (response.data.success) {
        setTelecallers(response.data.data.telecallers);
      }
    } catch (error) {
      console.error("Error fetching telecallers:", error);
      setTelecallers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTelecallerClick = (telecallerId) => {
    router.push(`/portal/admin/user-conversion/${telecallerId}`);
  };

  if (loading) {
    return (
      <div className="users-container">
        <div className="users-header">
          <h2 className="users-title">
            <span style={{ color: "#FF5757" }}>User</span> Conversion
          </h2>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "300px",
            padding: "40px",
          }}
        >
          <div style={{ textAlign: "center" }}>
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
            <p style={{ fontSize: "14px", color: "#ccc" }}>Loading data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="users-container">
      <div className="users-header">
        <h2 className="users-title">
          <span style={{ color: "#FF5757" }}>User</span> Conversion
        </h2>
        <div className="users-count">Total: {telecallers.length} telecallers</div>
      </div>

      {/* Table Section */}
      <div className="table-container">
        <div className="table-responsive">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Mobile Number</th>
                <th>Total Converted</th>
              </tr>
            </thead>
            <tbody>
              {telecallers.length > 0 ? (
                telecallers.map((telecaller) => (
                  <tr
                    key={telecaller.id}
                    onClick={() => handleTelecallerClick(telecaller.id)}
                    style={{
                      cursor: "pointer",
                      transition: "background-color 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#1a1f1f";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <td>{telecaller.name || "-"}</td>
                    <td>{telecaller.mobile_number || "-"}</td>
                    <td>
                      <span
                        style={{
                          fontWeight: "600",
                          color: telecaller.total_converted > 0 ? "#FF5757" : "#888",
                        }}
                      >
                        {telecaller.total_converted}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="no-data">
                    No telecallers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add spinner animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
