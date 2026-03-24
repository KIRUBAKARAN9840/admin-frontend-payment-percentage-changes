"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineSearch, HiOutlineFilter } from "react-icons/hi";

export default function ExpensesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Active tab - operational or marketing
  const [activeTab, setActiveTab] = useState("operational");

  // Expenses data
  const [expenses, setExpenses] = useState([]);
  const [expenseTypes, setExpenseTypes] = useState({ operational: [], marketing: [] });
  const [summary, setSummary] = useState(null);

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 50,
    total: 0,
    total_pages: 0
  });

  // Filters
  const [filters, setFilters] = useState({
    expense_type: "",
    start_date: "",
    end_date: "",
    search: ""
  });

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [isCustomType, setIsCustomType] = useState(false);
  const [formData, setFormData] = useState({
    category: "operational",
    expense_type: "",
    amount: "",
    expense_date: new Date().toISOString().split('T')[0],
    description: ""
  });

  // Fetch overview data (summary + types + default operational list)
  const fetchOverview = useCallback(async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) setLoading(true);
      const params = {
        page: pagination.page,
        page_size: pagination.page_size
      };

      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;

      const response = await axiosInstance.get("/api/admin/expenses/summary/overview", { params });

      if (response.data.success) {
        const data = response.data.data;
        setSummary(data);

        // Set expense types from overview response
        setExpenseTypes(data.expense_types);

        // Set expenses list from overview response (only on initial load for operational tab)
        if (isInitialLoad || activeTab === "operational") {
          setExpenses(data.expenses);
          setPagination(data.pagination);
        }
      }
    } catch (err) {
      console.error("Error fetching overview:", err);
    } finally {
      if (isInitialLoad) setLoading(false);
    }
  }, [filters.start_date, filters.end_date, pagination.page, pagination.page_size, activeTab]);

  // Fetch expenses list for specific category (when switching tabs or applying filters)
  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        category: activeTab,
        page: pagination.page,
        page_size: pagination.page_size
      };

      if (filters.expense_type) params.expense_type = filters.expense_type;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (filters.search) params.search = filters.search;

      const response = await axiosInstance.get("/api/admin/expenses", { params });

      if (response.data.success) {
        setExpenses(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      console.error("Error fetching expenses:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, pagination.page, pagination.page_size, filters]);

  // Initial data fetch - only overview API
  useEffect(() => {
    fetchOverview(true);
  }, [filters.start_date, filters.end_date]);

  // Fetch expenses list when tab changes or filters change (not initial load)
  useEffect(() => {
    if (!loading) {
      fetchExpenses();
    }
  }, [activeTab, filters.expense_type, filters.search, pagination.page]);

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingExpense) {
        await axiosInstance.put(`/api/admin/expenses/${editingExpense.id}`, formData);
      } else {
        await axiosInstance.post("/api/admin/expenses", formData);
      }

      // Reset form and refresh data
      setFormData({
        category: activeTab,
        expense_type: "",
        amount: "",
        expense_date: new Date().toISOString().split('T')[0],
        description: ""
      });
      setIsCustomType(false);
      setShowAddForm(false);
      setEditingExpense(null);
      fetchExpenses();
      fetchOverview();
    } catch (err) {
      console.error("Error saving expense:", err);
      alert(err.response?.data?.detail || "Failed to save expense");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (expense) => {
    setEditingExpense(expense);
    const predefinedTypes = expenseTypes[expense.category] || [];
    const isCustom = !predefinedTypes.includes(expense.expense_type);
    setIsCustomType(isCustom);
    setFormData({
      category: expense.category,
      expense_type: expense.expense_type,
      amount: expense.amount,
      expense_date: expense.expense_date,
      description: expense.description || ""
    });
    setShowAddForm(true);
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    try {
      await axiosInstance.delete(`/api/admin/expenses/${id}`);
      fetchExpenses();
      fetchOverview();
    } catch (err) {
      console.error("Error deleting expense:", err);
      alert("Failed to delete expense");
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      expense_type: "",
      start_date: "",
      end_date: "",
      search: ""
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Get current expense types based on active tab
  const getCurrentExpenseTypes = () => {
    return expenseTypes[activeTab] || [];
  };

  const cardStyle = {
    backgroundColor: "#1f2937",
    border: "1px solid #374151",
    borderRadius: "12px",
    padding: "1.5rem",
    marginBottom: "1.5rem"
  };

  const inputStyle = {
    backgroundColor: "#111827",
    border: "1px solid #374151",
    color: "white",
    padding: "0.5rem 0.75rem",
    borderRadius: "6px",
    width: "100%",
    fontSize: "0.875rem"
  };

  const buttonStyle = {
    backgroundColor: "#FF5757",
    color: "white",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem"
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#374151"
  };

  const tableHeaderStyle = {
    backgroundColor: "#1f2937",
    color: "#9ca3af",
    fontWeight: "600",
    fontSize: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    padding: "0.75rem 1rem"
  };

  const tableCellStyle = {
    padding: "0.75rem 1rem",
    borderBottom: "1px solid #374151",
    color: "white",
    fontSize: "0.875rem"
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 1rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "600", color: "white", margin: "0 0 0.25rem 0" }}>
            Expenses Management
          </h1>
          <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: 0 }}>
            Track and manage operational and marketing expenses
          </p>
        </div>
        <button
          onClick={() => {
            setEditingExpense(null);
            setFormData({
              category: activeTab,
              expense_type: "",
              amount: "",
              expense_date: new Date().toISOString().split('T')[0],
              description: ""
            });
            setIsCustomType(false);
            setShowAddForm(!showAddForm);
          }}
          style={buttonStyle}
        >
          <HiOutlinePlus size={18} />
          {showAddForm ? "Cancel" : "Add Expense"}
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          <div style={cardStyle}>
            <div style={{ color: "#9ca3af", fontSize: "0.75rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>Total Expenses</div>
            <div style={{ fontSize: "1.5rem", fontWeight: "600", color: "white" }}>₹{summary.grand_total?.toFixed(2) || "0.00"}</div>
          </div>
          <div style={cardStyle}>
            <div style={{ color: "#9ca3af", fontSize: "0.75rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>Operational</div>
            <div style={{ fontSize: "1.5rem", fontWeight: "600", color: "white" }}>₹{summary.category_totals?.operational?.toFixed(2) || "0.00"}</div>
            <div style={{ color: "#9ca3af", fontSize: "0.75rem", marginTop: "0.25rem" }}>
              {summary.category_percentages?.operational != null ? `${summary.category_percentages.operational}% of total` : `${summary.category_counts?.operational || 0} entries`}
            </div>
          </div>
          <div style={cardStyle}>
            <div style={{ color: "#9ca3af", fontSize: "0.75rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>Marketing</div>
            <div style={{ fontSize: "1.5rem", fontWeight: "600", color: "white" }}>₹{summary.category_totals?.marketing?.toFixed(2) || "0.00"}</div>
            <div style={{ color: "#9ca3af", fontSize: "0.75rem", marginTop: "0.25rem" }}>
              {summary.category_percentages?.marketing != null ? `${summary.category_percentages.marketing}% of total` : `${summary.category_counts?.marketing || 0} entries`}
            </div>
          </div>
        </div>
      )}

      {/* Category Tabs with Filter Button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", gap: "1rem" }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => {
              setActiveTab("operational");
              setPagination(prev => ({ ...prev, page: 1 }));
              setShowAddForm(false);
              setEditingExpense(null);
              setIsCustomType(false);
            }}
            style={{
              ...buttonStyle,
              backgroundColor: activeTab === "operational" ? "#FF5757" : "#374151",
              borderRadius: "8px"
            }}
          >
            Operational Expenses
          </button>
          <button
            onClick={() => {
              setActiveTab("marketing");
              setPagination(prev => ({ ...prev, page: 1 }));
              setShowAddForm(false);
              setEditingExpense(null);
              setIsCustomType(false);
            }}
            style={{
              ...buttonStyle,
              backgroundColor: activeTab === "marketing" ? "#FF5757" : "#374151",
              borderRadius: "8px"
            }}
          >
            Marketing Expenses
          </button>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            backgroundColor: showFilters ? "#FF5757" : "#374151",
            color: "white",
            border: "none",
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "500",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            transition: "all 0.2s",
            flexShrink: 0
          }}
        >
          <HiOutlineFilter size={18} />
          Filters
          {(filters.expense_type || filters.start_date || filters.end_date || filters.search) && (
            <span style={{
              backgroundColor: "#FF5757",
              color: "white",
              borderRadius: "50%",
              width: "18px",
              height: "18px",
              fontSize: "0.65rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>•</span>
          )}
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div style={cardStyle}>
          <h3 style={{ color: "white", fontSize: "1.125rem", fontWeight: "600", margin: "0 0 1rem 0" }}>
            {editingExpense ? "Edit Expense" : "Add New Expense"}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <div>
              <label style={{ color: "#9ca3af", fontSize: "0.875rem", display: "block", marginBottom: "0.25rem" }}>Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={inputStyle}
                disabled={!!editingExpense}
                required
              >
                <option value="operational">Operational</option>
                <option value="marketing">Marketing</option>
              </select>
            </div>
            <div>
              <label style={{ color: "#9ca3af", fontSize: "0.875rem", display: "block", marginBottom: "0.25rem" }}>Expense Type</label>
              <select
                value={isCustomType ? "Other" : formData.expense_type}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "Other") {
                    setIsCustomType(true);
                    setFormData({ ...formData, expense_type: "" });
                  } else {
                    setIsCustomType(false);
                    setFormData({ ...formData, expense_type: value });
                  }
                }}
                style={inputStyle}
                required
              >
                <option value="">Select type...</option>
                {(expenseTypes[formData.category] || []).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
                {/* <option value="Other">Other (Custom)</option> */}
              </select>
            </div>
            {isCustomType && (
              <div>
                <label style={{ color: "#9ca3af", fontSize: "0.875rem", display: "block", marginBottom: "0.25rem" }}>Custom Type</label>
                <input
                  type="text"
                  value={formData.expense_type}
                  onChange={(e) => setFormData({ ...formData, expense_type: e.target.value })}
                  placeholder="Enter custom expense type"
                  style={inputStyle}
                  required
                />
              </div>
            )}
            <div>
              <label style={{ color: "#9ca3af", fontSize: "0.875rem", display: "block", marginBottom: "0.25rem" }}>Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={{ color: "#9ca3af", fontSize: "0.875rem", display: "block", marginBottom: "0.25rem" }}>Date</label>
              <input
                type="date"
                value={formData.expense_date}
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                style={inputStyle}
                required
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ color: "#9ca3af", fontSize: "0.875rem", display: "block", marginBottom: "0.25rem" }}>Description (Optional)</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add a description..."
                style={inputStyle}
              />
            </div>
            <div style={{ gridColumn: "1 / -1", display: "flex", gap: "0.5rem" }}>
              <button
                type="submit"
                disabled={submitting}
                style={{ ...buttonStyle, opacity: submitting ? 0.5 : 1 }}
              >
                {submitting ? "Saving..." : editingExpense ? "Update Expense" : "Add Expense"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingExpense(null);
                  setFormData({
                    category: activeTab,
                    expense_type: "",
                    amount: "",
                    expense_date: new Date().toISOString().split('T')[0],
                    description: ""
                  });
                  setIsCustomType(false);
                }}
                style={secondaryButtonStyle}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Collapsible Filter Card */}
      {showFilters && (
        <div style={{
          ...cardStyle,
          animation: "slideDown 0.2s ease-out"
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
            <div>
              <label style={{ color: "#9ca3af", fontSize: "0.75rem", display: "block", marginBottom: "0.25rem" }}>Expense Type</label>
              <select
                value={filters.expense_type}
                onChange={(e) => setFilters({ ...filters, expense_type: e.target.value })}
                style={inputStyle}
              >
                <option value="">All Types</option>
                {getCurrentExpenseTypes().map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ color: "#9ca3af", fontSize: "0.75rem", display: "block", marginBottom: "0.25rem" }}>From Date</label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ color: "#9ca3af", fontSize: "0.75rem", display: "block", marginBottom: "0.25rem" }}>To Date</label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ color: "#9ca3af", fontSize: "0.75rem", display: "block", marginBottom: "0.25rem" }}>Search</label>
              <div style={{ position: "relative" }}>
                <HiOutlineSearch size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search in type/description..."
                  style={{ ...inputStyle, paddingLeft: "2.25rem" }}
                />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem" }}>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: 1 }))}
                style={buttonStyle}
              >
                Apply Filters
              </button>
              <button
                onClick={resetFilters}
                style={secondaryButtonStyle}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expenses Table */}
      <div style={cardStyle}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>
            Loading expenses...
          </div>
        ) : expenses.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>
            No expenses found. Add your first expense to get started.
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>Date</th>
                    <th style={tableHeaderStyle}>Type</th>
                    <th style={tableHeaderStyle}>Description</th>
                    <th style={{ ...tableHeaderStyle, textAlign: "right" }}>Amount</th>
                    <th style={tableHeaderStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id} style={{ "&:hover": { backgroundColor: "#1f2937" } }}>
                      <td style={tableCellStyle}>
                        {new Date(expense.expense_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td style={tableCellStyle}>
                        <span style={{
                          display: "inline-block",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "4px",
                          backgroundColor: expense.category === "operational" ? "#3b82f620" : "#8b5cf620",
                          color: expense.category === "operational" ? "#60a5fa" : "#a78bfa",
                          fontSize: "0.75rem",
                          fontWeight: "500"
                        }}>
                          {expense.expense_type}
                        </span>
                      </td>
                      <td style={tableCellStyle}>
                        {expense.description || "-"}
                      </td>
                      <td style={{ ...tableCellStyle, textAlign: "right", fontWeight: "600" }}>
                        ₹{parseFloat(expense.amount).toFixed(2)}
                      </td>
                      <td style={tableCellStyle}>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            onClick={() => handleEdit(expense)}
                            style={{
                              backgroundColor: "transparent",
                              border: "1px solid #374151",
                              color: "#9ca3af",
                              padding: "0.25rem 0.5rem",
                              borderRadius: "4px",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center"
                            }}
                            onMouseEnter={(e) => { e.target.style.backgroundColor = "#374151"; e.target.style.color = "white"; }}
                            onMouseLeave={(e) => { e.target.style.backgroundColor = "transparent"; e.target.style.color = "#9ca3af"; }}
                          >
                            <HiOutlinePencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(expense.id)}
                            style={{
                              backgroundColor: "transparent",
                              border: "1px solid #374151",
                              color: "#ef4444",
                              padding: "0.25rem 0.5rem",
                              borderRadius: "4px",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center"
                            }}
                            onMouseEnter={(e) => { e.target.style.backgroundColor = "#374151"; }}
                            onMouseLeave={(e) => { e.target.style.backgroundColor = "transparent"; }}
                          >
                            <HiOutlineTrash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #374151" }}>
                <div style={{ color: "#9ca3af", fontSize: "0.875rem" }}>
                  Showing {((pagination.page - 1) * pagination.page_size) + 1} to {Math.min(pagination.page * pagination.page_size, pagination.total)} of {pagination.total} expenses
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    style={{
                      ...secondaryButtonStyle,
                      opacity: pagination.page === 1 ? 0.5 : 1,
                      cursor: pagination.page === 1 ? "not-allowed" : "pointer"
                    }}
                  >
                    Previous
                  </button>
                  <span style={{ display: "flex", alignItems: "center", color: "white", padding: "0 0.5rem" }}>
                    Page {pagination.page} of {pagination.total_pages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.total_pages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.total_pages}
                    style={{
                      ...secondaryButtonStyle,
                      opacity: pagination.page === pagination.total_pages ? 0.5 : 1,
                      cursor: pagination.page === pagination.total_pages ? "not-allowed" : "pointer"
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
