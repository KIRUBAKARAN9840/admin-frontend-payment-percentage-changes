"use client";
import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";

export default function TaxCompliancePage() {
  const [loading, setLoading] = useState(true);
  const [taxData, setTaxData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingMonth, setEditingMonth] = useState(null);
  const [gstPaidInput, setGstPaidInput] = useState("");
  const [tdsPaidInput, setTdsPaidInput] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchTaxData = async (page = 1) => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/api/admin/tax-compliance/monthly-data?page=${page}&page_size=12`);
      if (response.data && response.data.success) {
        setTaxData(response.data.data);
        setPagination(response.data.pagination);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error("Error fetching tax compliance data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxData(1);
  }, []);

  const handleEdit = (monthData) => {
    setEditingMonth(monthData.month);
    setGstPaidInput(monthData.gst_paid?.toString() || "");
    setTdsPaidInput(monthData.tds_paid?.toString() || "");
  };

  const handleCancel = () => {
    setEditingMonth(null);
    setGstPaidInput("");
    setTdsPaidInput("");
  };

  const handleSave = async () => {
    if (!editingMonth) return;

    // Find the current month data for validation
    const currentMonthData = taxData.find(item => item.month === editingMonth);

    if (currentMonthData) {
      const gstPaidValue = gstPaidInput ? parseFloat(gstPaidInput) : 0;
      const tdsPaidValue = tdsPaidInput ? parseFloat(tdsPaidInput) : 0;

      // Validate GST Paid cannot exceed GST Collected
      if (gstPaidValue > currentMonthData.gst_collected) {
        alert(`GST Paid (₹${gstPaidValue.toFixed(2)}) cannot exceed GST Collected (₹${currentMonthData.gst_collected.toFixed(2)})`);
        return;
      }

      // Validate TDS Paid cannot exceed TDS Collected
      if (tdsPaidValue > currentMonthData.tds_collected) {
        alert(`TDS Paid (₹${tdsPaidValue.toFixed(2)}) cannot exceed TDS Collected (₹${currentMonthData.tds_collected.toFixed(2)})`);
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        month: editingMonth,
        gst_paid: gstPaidInput ? parseFloat(gstPaidInput) : 0,
        tds_paid: tdsPaidInput ? parseFloat(tdsPaidInput) : 0,
      };

      const response = await axiosInstance.post("/api/admin/tax-compliance/update-paid-amounts", payload);

      if (response.data && response.data.success) {
        // Refresh the data on current page
        await fetchTaxData(currentPage);
        handleCancel();
      }
    } catch (error) {
      console.error("Error updating paid amounts:", error);
      alert("Failed to update. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  return (
    <div className="dashboard-container">
      {loading ? (
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "300px",
        }}>
          <div style={{ color: "#888" }}>Loading...</div>
        </div>
      ) : (
        <div className="section-container">
          <div className="dashboard-card">
            <div className="card-header-custom">
              <h6 className="card-title">Tax & Compliance - Monthly Overview</h6>
            </div>
            <div className="card-body-custom">
              <div style={{ overflowX: "auto" }}>
                <table style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.875rem"
                }}>
                  <thead>
                    <tr style={{
                      borderBottom: "1px solid #374151",
                      backgroundColor: "#1f2937"
                    }}>
                      <th style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        color: "#9ca3af",
                        fontWeight: "600",
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em"
                      }}>Month</th>
                      <th style={{
                        padding: "12px 16px",
                        textAlign: "right",
                        color: "#9ca3af",
                        fontWeight: "600",
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em"
                      }}>GST Collected</th>
                      <th style={{
                        padding: "12px 16px",
                        textAlign: "right",
                        color: "#9ca3af",
                        fontWeight: "600",
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em"
                      }}>GST Paid</th>
                      <th style={{
                        padding: "12px 16px",
                        textAlign: "right",
                        color: "#9ca3af",
                        fontWeight: "600",
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em"
                      }}>GST Payable</th>
                      <th style={{
                        padding: "12px 16px",
                        textAlign: "right",
                        color: "#9ca3af",
                        fontWeight: "600",
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em"
                      }}>TDS Collected</th>
                      <th style={{
                        padding: "12px 16px",
                        textAlign: "right",
                        color: "#9ca3af",
                        fontWeight: "600",
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em"
                      }}>TDS Paid</th>
                      <th style={{
                        padding: "12px 16px",
                        textAlign: "right",
                        color: "#9ca3af",
                        fontWeight: "600",
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em"
                      }}>TDS Payable</th>
                      <th style={{
                        padding: "12px 16px",
                        textAlign: "center",
                        color: "#9ca3af",
                        fontWeight: "600",
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em"
                      }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taxData.map((item, index) => (
                      <tr
                        key={item.month}
                        style={{
                          borderBottom: index < taxData.length - 1 ? "1px solid #374151" : "none",
                          backgroundColor: editingMonth === item.month ? "#1f2937" : "transparent"
                        }}
                      >
                        {/* Month */}
                        <td style={{
                          padding: "16px",
                          color: "white",
                          fontWeight: "500"
                        }}>
                          {item.month_display}
                        </td>

                        {/* GST Collected (Read-only) */}
                        <td style={{
                          padding: "16px",
                          textAlign: "right",
                          color: "#22c55e",
                          fontWeight: "500"
                        }}>
                          {formatCurrency(item.gst_collected)}
                        </td>

                        {/* GST Paid (Editable) */}
                        <td style={{
                          padding: "16px",
                          textAlign: "right"
                        }}>
                          {editingMonth === item.month ? (
                            <input
                              type="number"
                              value={gstPaidInput}
                              onChange={(e) => setGstPaidInput(e.target.value)}
                              step="0.01"
                              style={{
                                backgroundColor: "#374151",
                                border: "1px solid #4b5563",
                                borderRadius: "4px",
                                color: "white",
                                padding: "6px 10px",
                                fontSize: "0.875rem",
                                width: "100px",
                                textAlign: "right"
                              }}
                            />
                          ) : (
                            <span style={{ color: "#f59e0b", fontWeight: "500" }}>
                              {formatCurrency(item.gst_paid)}
                            </span>
                          )}
                        </td>

                        {/* GST Payable (Calculated) */}
                        <td style={{
                          padding: "16px",
                          textAlign: "right",
                          color: item.gst_payable >= 0 ? "#3b82f6" : "#ef4444",
                          fontWeight: "600"
                        }}>
                          {formatCurrency(item.gst_payable)}
                        </td>

                        {/* TDS Collected (Read-only) */}
                        <td style={{
                          padding: "16px",
                          textAlign: "right",
                          color: "#22c55e",
                          fontWeight: "500"
                        }}>
                          {formatCurrency(item.tds_collected)}
                        </td>

                        {/* TDS Paid (Editable) */}
                        <td style={{
                          padding: "16px",
                          textAlign: "right"
                        }}>
                          {editingMonth === item.month ? (
                            <input
                              type="number"
                              value={tdsPaidInput}
                              onChange={(e) => setTdsPaidInput(e.target.value)}
                              step="0.01"
                              style={{
                                backgroundColor: "#374151",
                                border: "1px solid #4b5563",
                                borderRadius: "4px",
                                color: "white",
                                padding: "6px 10px",
                                fontSize: "0.875rem",
                                width: "100px",
                                textAlign: "right"
                              }}
                            />
                          ) : (
                            <span style={{ color: "#f59e0b", fontWeight: "500" }}>
                              {formatCurrency(item.tds_paid)}
                            </span>
                          )}
                        </td>

                        {/* TDS Payable (Calculated) */}
                        <td style={{
                          padding: "16px",
                          textAlign: "right",
                          color: item.tds_payable >= 0 ? "#3b82f6" : "#ef4444",
                          fontWeight: "600"
                        }}>
                          {formatCurrency(item.tds_payable)}
                        </td>

                        {/* Actions */}
                        <td style={{
                          padding: "16px",
                          textAlign: "center"
                        }}>
                          {editingMonth === item.month ? (
                            <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                              <button
                                onClick={handleSave}
                                disabled={saving}
                                style={{
                                  backgroundColor: saving ? "#4b5563" : "#22c55e",
                                  color: "white",
                                  border: "none",
                                  padding: "6px 12px",
                                  borderRadius: "4px",
                                  cursor: saving ? "not-allowed" : "pointer",
                                  fontSize: "0.75rem",
                                  fontWeight: "500"
                                }}
                              >
                                {saving ? "Saving..." : "Save"}
                              </button>
                              <button
                                onClick={handleCancel}
                                disabled={saving}
                                style={{
                                  backgroundColor: "#374151",
                                  color: "#9ca3af",
                                  border: "1px solid #4b5563",
                                  padding: "6px 12px",
                                  borderRadius: "4px",
                                  cursor: saving ? "not-allowed" : "pointer",
                                  fontSize: "0.75rem",
                                  fontWeight: "500"
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEdit(item)}
                              style={{
                                backgroundColor: "#3b82f6",
                                color: "white",
                                border: "none",
                                padding: "6px 12px",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "0.75rem",
                                fontWeight: "500"
                              }}
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Legend */}
              <div style={{
                marginTop: "1.5rem",
                paddingTop: "1rem",
                borderTop: "1px solid #374151",
                display: "flex",
                gap: "2rem",
                flexWrap: "wrap"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "2px",
                    backgroundColor: "#22c55e"
                  }}></div>
                  <span style={{ color: "#9ca3af", fontSize: "0.75rem" }}>Collected (Auto-calculated)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "2px",
                    backgroundColor: "#f59e0b"
                  }}></div>
                  <span style={{ color: "#9ca3af", fontSize: "0.75rem" }}>Paid (Manual Entry)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "2px",
                    backgroundColor: "#3b82f6"
                  }}></div>
                  <span style={{ color: "#9ca3af", fontSize: "0.75rem" }}>Payable (Calculated)</span>
                </div>
              </div>

              {/* Pagination Controls */}
              {pagination && pagination.total_pages > 1 && (
                <div style={{
                  marginTop: "1.5rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "1rem 0",
                  borderTop: "1px solid #374151"
                }}>
                  <div style={{ color: "#9ca3af", fontSize: "0.875rem" }}>
                    Showing {((pagination.page - 1) * pagination.page_size) + 1} to {Math.min(pagination.page * pagination.page_size, pagination.total_records)} of {pagination.total_records} records
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => fetchTaxData(currentPage - 1)}
                      disabled={!pagination.has_prev_page}
                      style={{
                        backgroundColor: pagination.has_prev_page ? "#374151" : "transparent",
                        color: pagination.has_prev_page ? "white" : "#4b5563",
                        border: "1px solid #4b5563",
                        padding: "8px 16px",
                        borderRadius: "6px",
                        cursor: pagination.has_prev_page ? "pointer" : "not-allowed",
                        fontSize: "0.875rem",
                        fontWeight: "500"
                      }}
                    >
                      Previous
                    </button>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      backgroundColor: "#374151",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      border: "1px solid #4b5563"
                    }}>
                      <span style={{ color: "white", fontSize: "0.875rem" }}>
                        Page {pagination.page} of {pagination.total_pages}
                      </span>
                    </div>
                    <button
                      onClick={() => fetchTaxData(currentPage + 1)}
                      disabled={!pagination.has_next_page}
                      style={{
                        backgroundColor: pagination.has_next_page ? "#374151" : "transparent",
                        color: pagination.has_next_page ? "white" : "#4b5563",
                        border: "1px solid #4b5563",
                        padding: "8px 16px",
                        borderRadius: "6px",
                        cursor: pagination.has_next_page ? "pointer" : "not-allowed",
                        fontSize: "0.875rem",
                        fontWeight: "500"
                      }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
