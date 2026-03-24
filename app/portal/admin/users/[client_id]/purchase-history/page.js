"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaDownload, FaChevronLeft } from "react-icons/fa";
import axiosInstance from "@/lib/axios";
import * as XLSX from "xlsx";

export default function PurchaseHistory() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.client_id;

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dailypass");
  const [dailyPassData, setDailyPassData] = useState([]);
  const [sessionData, setSessionData] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState([]);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [gymMembershipData, setGymMembershipData] = useState([]);
  const [gymMembershipLoading, setGymMembershipLoading] = useState(false);

  // Fetch daily pass data
  const fetchDailyPassData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/admin/users/${clientId}/daily-pass-purchases`);
      if (response.data.success) {
        setDailyPassData(response.data.data);
      } else {
      }
    } catch (err) {
      alert("Failed to load daily pass data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  // Fetch session bookings data
  const fetchSessionData = useCallback(async () => {
    try {
      setSessionsLoading(true);
      const response = await axiosInstance.get(`/api/admin/users/${clientId}/session-bookings`);
      if (response.data.success) {
        setSessionData(response.data.data);
      } else {
      }
    } catch (err) {
      alert("Failed to load session data. Please try again.");
    } finally {
      setSessionsLoading(false);
    }
  }, [clientId]);

  // Fetch Fittbot subscription data
  const fetchSubscriptionData = useCallback(async () => {
    try {
      setSubscriptionLoading(true);
      const response = await axiosInstance.get(`/api/admin/users/${clientId}/fittbot-subscription`);
      if (response.data.success) {
        setSubscriptionData(response.data.data);
      } else {
      }
    } catch (err) {
      alert("Failed to load subscription data. Please try again.");
    } finally {
      setSubscriptionLoading(false);
    }
  }, [clientId]);

  // Fetch Gym Membership data
  const fetchGymMembershipData = useCallback(async () => {
    try {
      setGymMembershipLoading(true);
      const response = await axiosInstance.get(`/api/admin/users/${clientId}/gym-membership`);
      if (response.data.success) {
        setGymMembershipData(response.data.data);
      } else {
      }
    } catch (err) {
      alert("Failed to load gym membership data. Please try again.");
    } finally {
      setGymMembershipLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchDailyPassData();
  }, [fetchDailyPassData]);

  useEffect(() => {
    if (activeTab === "sessions") {
      fetchSessionData();
    } else if (activeTab === "subscription") {
      fetchSubscriptionData();
    } else if (activeTab === "gym-membership") {
      fetchGymMembershipData();
    }
  }, [activeTab, fetchSessionData, fetchSubscriptionData, fetchGymMembershipData]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "-";
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return { color: "#22c55e", bg: "rgba(34, 197, 94, 0.1)", border: "#22c55e" };
      case "completed":
        return { color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)", border: "#3b82f6" };
      case "expired":
        return { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)", border: "#f59e0b" };
      case "canceled":
        return { color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)", border: "#ef4444" };
      default:
        return { color: "#888", bg: "rgba(136, 136, 136, 0.1)", border: "#888" };
    }
  };

  // Export to Excel function - exports all tabs to one Excel file with 4 sheets
  const exportToExcel = useCallback(() => {
    // Check if any data exists
    const hasData =
      dailyPassData.length > 0 ||
      sessionData.length > 0 ||
      subscriptionData.length > 0 ||
      gymMembershipData.length > 0;

    if (!hasData) {
      alert("No data to export!");
      return;
    }

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Daily Pass
    if (dailyPassData.length > 0) {
      const dailyPassWorksheet = XLSX.utils.json_to_sheet(
        dailyPassData.map((pass) => ({
          "Purchase Date": formatDateTime(pass.created_at),
          "Gym Name": pass.gym_name || "-",
          "Valid From": formatDate(pass.valid_from),
          "Valid Until": formatDate(pass.valid_until),
          "Total Days": pass.days_total || "-",
          "Days Used": pass.days_used || 0,
          "Days Remaining": pass.days_remaining || 0,
          "Amount": pass.amount_paid ? `₹${(pass.amount_paid / 100).toFixed(2)}` : "-",
        }))
      );
      XLSX.utils.book_append_sheet(workbook, dailyPassWorksheet, "Daily Pass");
    }

    // Sheet 2: Sessions
    if (sessionData.length > 0) {
      const sessionsWorksheet = XLSX.utils.json_to_sheet(
        sessionData.map((session) => {
          const timeRange =
            session.start_time && session.end_time
              ? `${formatTime(session.start_time)} - ${formatTime(session.end_time)}`
              : session.start_time
              ? formatTime(session.start_time)
              : "-";
          return {
            "Purchase Date": formatDateTime(session.created_at),
            "Booking Date": formatDate(session.booking_date),
            "Session Name": session.session_name
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase()),
            "Gym Name": session.gym_name || "-",
            "Time": timeRange,
            "Amount": session.price_paid ? `₹${session.price_paid}` : "-",
            "Status": session.status || "-",
          };
        })
      );
      XLSX.utils.book_append_sheet(workbook, sessionsWorksheet, "Sessions");
    }

    // Sheet 3: Fymble Subscription
    if (subscriptionData.length > 0) {
      const subscriptionWorksheet = XLSX.utils.json_to_sheet(
        subscriptionData.map((sub) => ({
          "Purchase Date": formatDateTime(sub.captured_at || sub.created_at),
          "Amount": sub.amount ? `₹${(sub.amount / 100).toFixed(2)}` : "-",
        }))
      );
      XLSX.utils.book_append_sheet(workbook, subscriptionWorksheet, "Fymble Subscription");
    }

    // Sheet 4: Gym Membership
    if (gymMembershipData.length > 0) {
      const gymMembershipWorksheet = XLSX.utils.json_to_sheet(
        gymMembershipData.map((membership) => ({
          "Purchase Date": formatDateTime(membership.captured_at || membership.created_at),
          "Gym Name": membership.gym_name || "-",
          "Provider": membership.provider?.replace(/_/g, " ") || "-",
          "Order Status": membership.order_status || membership.status || "-",
          "Amount": membership.amount ? `₹${(membership.amount / 100).toFixed(2)}` : "-",
        }))
      );
      XLSX.utils.book_append_sheet(workbook, gymMembershipWorksheet, "Gym Membership");
    }

    // Export to file
    XLSX.writeFile(workbook, `purchase_history_${clientId}_${new Date().toISOString().split('T')[0]}.xlsx`);
  }, [dailyPassData, sessionData, subscriptionData, gymMembershipData]);

  return (
    <div className="purchase-history-container">
      {/* Header */}
      <div className="purchase-history-header">
        <button
          className="back-button"
          onClick={() => router.back()}
          style={{
            background: "none",
            border: "none",
            color: "#FF5757",
            fontSize: "0.9rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 0",
            transition: "color 0.2s ease",
          }}
          onMouseEnter={(e) => e.target.style.color = "#ff4545"}
          onMouseLeave={(e) => e.target.style.color = "#FF5757"}
        >
          <FaChevronLeft size={16} />
        </button>
        <h2 className="purchase-history-title" style={{ margin: 0, marginLeft: "1rem" }}>
          <span style={{ color: "#FF5757" }}>Purchase</span> History
        </h2>
        <button
          onClick={exportToExcel}
          disabled={
            dailyPassData.length === 0 &&
            sessionData.length === 0 &&
            subscriptionData.length === 0 &&
            gymMembershipData.length === 0
          }
          style={{
            background: "#FF5757",
            border: "none",
            color: "white",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            opacity:
              dailyPassData.length === 0 &&
              sessionData.length === 0 &&
              subscriptionData.length === 0 &&
              gymMembershipData.length === 0
                ? 0.5
                : 1,
          }}
          onMouseEnter={(e) => {
            if (
              !(
                dailyPassData.length === 0 &&
                sessionData.length === 0 &&
                subscriptionData.length === 0 &&
                gymMembershipData.length === 0
              )
            ) {
              e.target.style.backgroundColor = "#e64c4c";
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "#FF5757";
          }}
        >
          <FaDownload />
          Export Excel
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === "dailypass" ? "active" : ""}`}
          onClick={() => setActiveTab("dailypass")}
        >
          Daily Pass
        </button>
        <button
          className={`tab-button ${activeTab === "sessions" ? "active" : ""}`}
          onClick={() => setActiveTab("sessions")}
        >
          Sessions
        </button>
        <button
          className={`tab-button ${activeTab === "subscription" ? "active" : ""}`}
          onClick={() => setActiveTab("subscription")}
        >
          Fymble Subscription
        </button>
        <button
          className={`tab-button ${activeTab === "gym-membership" ? "active" : ""}`}
          onClick={() => setActiveTab("gym-membership")}
        >
          Gym Membership
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === "dailypass" && (
          <div className="dailypass-tab">
            {loading ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "200px",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    border: "3px solid #3a3a3a",
                    borderTop: "3px solid #FF5757",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
              </div>
            ) : dailyPassData.length === 0 ? (
              <div className="no-data-message">
                <div style={{ fontSize: "48px", marginBottom: "1rem" }}>📋</div>
                <p>No daily pass purchases found</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="purchase-table">
                  <thead>
                    <tr>
                      <th>Purchase Date</th>
                      <th>Gym Name</th>
                      <th>Valid From</th>
                      <th>Valid Until</th>
                      <th>Total Days</th>
                      <th>Days Used</th>
                      <th>Days Remaining</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyPassData.map((pass) => {
                      return (
                        <tr key={pass.id}>
                          <td>{formatDateTime(pass.created_at)}</td>
                          <td>{pass.gym_name || "-"}</td>
                          <td>{formatDate(pass.valid_from)}</td>
                          <td>{formatDate(pass.valid_until)}</td>
                          <td>{pass.days_total || "-"}</td>
                          <td>{pass.days_used || 0}</td>
                          <td>{pass.days_remaining || 0}</td>
                          <td>
                            {pass.amount_paid
                              ? `₹${(pass.amount_paid / 100).toFixed(2)}`
                              : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "sessions" && (
          <div className="sessions-tab">
            {sessionsLoading ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "200px",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    border: "3px solid #3a3a3a",
                    borderTop: "3px solid #FF5757",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
              </div>
            ) : sessionData.length === 0 ? (
              <div className="no-data-message">
                <div style={{ fontSize: "48px", marginBottom: "1rem" }}>🏋️</div>
                <p>No session bookings found</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="purchase-table">
                  <thead>
                    <tr>
                      <th>Purchase Date</th>
                      <th>Booking Date</th>
                      <th>Session Name</th>
                      <th>Gym Name</th>
                      <th>Time</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionData.map((session) => {
                      const statusStyle = getStatusColor(session.status);
                      const timeRange =
                        session.start_time && session.end_time
                          ? `${formatTime(session.start_time)} - ${formatTime(session.end_time)}`
                          : session.start_time
                          ? formatTime(session.start_time)
                          : "-";
                      return (
                        <tr key={session.id}>
                          <td>{formatDateTime(session.created_at)}</td>
                          <td>{formatDate(session.booking_date)}</td>
                          <td>
                            <span
                              style={{
                                textTransform: "capitalize",
                                fontWeight: "500",
                              }}
                            >
                              {session.session_name
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                            </span>
                          </td>
                          <td>{session.gym_name || "-"}</td>
                          <td>{timeRange}</td>
                          <td>
                            {session.price_paid
                              ? `₹${session.price_paid}`
                              : "-"}
                          </td>
                          <td>
                            <span
                              className="status-badge"
                              style={{
                                color: statusStyle.color,
                                backgroundColor: statusStyle.bg,
                                borderColor: statusStyle.border,
                              }}
                            >
                              {session.status || "-"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "subscription" && (
          <div className="subscription-tab">
            {subscriptionLoading ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "200px",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    border: "3px solid #3a3a3a",
                    borderTop: "3px solid #FF5757",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
              </div>
            ) : subscriptionData.length === 0 ? (
              <div className="no-data-message">
                <div style={{ fontSize: "48px", marginBottom: "1rem" }}>💎</div>
                <p>No Fymble subscription found</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="purchase-table">
                  <thead>
                    <tr>
                      <th>Purchase Date</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptionData.map((sub) => (
                      <tr key={sub.id}>
                        <td>{formatDateTime(sub.captured_at || sub.created_at)}</td>
                        <td>
                          {sub.amount
                            ? `₹${(sub.amount / 100).toFixed(2)}`
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "gym-membership" && (
          <div className="gym-membership-tab">
            {gymMembershipLoading ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "200px",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    border: "3px solid #3a3a3a",
                    borderTop: "3px solid #FF5757",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
              </div>
            ) : gymMembershipData.length === 0 ? (
              <div className="no-data-message">
                <div style={{ fontSize: "48px", marginBottom: "1rem" }}>🏋️</div>
                <p>No Gym Membership purchases found</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="purchase-table">
                  <thead>
                    <tr>
                      <th>Purchase Date</th>
                      <th>Gym Name</th>
                      <th>Provider</th>
                      <th>Order Status</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gymMembershipData.map((membership) => (
                      <tr key={membership.id}>
                        <td>{formatDateTime(membership.captured_at || membership.created_at)}</td>
                        <td>{membership.gym_name || "-"}</td>
                        <td>
                          <span
                            style={{
                              textTransform: "capitalize",
                              fontWeight: "500",
                            }}
                          >
                            {membership.provider?.replace(/_/g, " ") || "-"}
                          </span>
                        </td>
                        <td>
                          <span
                            className="status-badge"
                            style={{
                              color: "#22c55e",
                              backgroundColor: "rgba(34, 197, 94, 0.1)",
                              borderColor: "#22c55e",
                            }}
                          >
                            {membership.order_status || membership.status || "-"}
                          </span>
                        </td>
                        <td>
                          {membership.amount
                            ? `₹${(membership.amount / 100).toFixed(2)}`
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
