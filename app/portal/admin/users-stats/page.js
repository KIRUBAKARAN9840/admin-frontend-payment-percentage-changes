"use client";
import { useState, useEffect, useRef } from "react";
import axiosInstance from "@/lib/axios";

export default function UsersStatsPage() {
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [payingUsers, setPayingUsers] = useState(0);
  const [repeatUsers, setRepeatUsers] = useState(0);
  const [usersByCity, setUsersByCity] = useState([]);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Pagination states
  const [offset, setOffset] = useState(30);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCities, setTotalCities] = useState(0);
  const scrollContainerRef = useRef(null);

  // Fetch users stats data
  const fetchUsersData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/api/admin/users-stats/data");

      if (response.data.success) {
        setTotalUsers(response.data.data.total_users);
        setActiveUsers(response.data.data.active_users);
        setPayingUsers(response.data.data.paying_users);
        setRepeatUsers(response.data.data.repeat_users);
        const cityData = response.data.data.users_by_city || [];
        setUsersByCity(cityData);
        setTotalCities(response.data.data.total_cities || 0);

        // Set initial offset for pagination
        setOffset(cityData.length);
        setHasMore(cityData.length >= 30);
      }
    } catch (err) {
      console.error("Error fetching users data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch more cities (pagination)
  const fetchMoreCities = async () => {
    if (!hasMore || loadingMore) return;

    try {
      setLoadingMore(true);
      const response = await axiosInstance.get("/api/admin/users-stats/cities", {
        params: { offset: offset, limit: 30 }
      });

      if (response.data.success) {
        const newCities = response.data.data || [];
        setUsersByCity((prev) => [...prev, ...newCities]);
        setOffset(response.data.next_offset);
        setHasMore(response.data.has_more);
      }
    } catch (err) {
      console.error("Error fetching more cities:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Handle scroll for infinite scroll
  const handleScroll = (e) => {
    const { scrollLeft, scrollWidth, clientWidth } = e.target;
    const scrollPercentage = (scrollLeft + clientWidth) / scrollWidth;
    // Load more when scrolled to 90% of the content
    if (scrollPercentage >= 0.9) {
      fetchMoreCities();
    }
  };

  useEffect(() => {
    fetchUsersData();
  }, []);

  return (
    <div className="dashboard-container">
      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "300px",
          }}
        >
          <div style={{ color: "#888" }}>Loading...</div>
        </div>
      ) : (
        <div className="section-container">
          <div className="row g-4">
            {/* Total Users Card */}
            <div className="col-xl-3 col-lg-6">
              <div className="dashboard-card">
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">Total Users</h6>
                </div>
                <div className="card-body-custom">
                  <div className="metric-number" style={{ fontSize: "32px", fontWeight: "700", color: "#FF5757" }}>
                    {totalUsers.toLocaleString()}
                  </div>
                  <div style={{ fontSize: "13px", color: "#888", marginTop: "8px" }}>
                    Registered users count
                  </div>
                </div>
              </div>
            </div>

            {/* Active Users Card */}
            <div className="col-xl-3 col-lg-6">
              <div className="dashboard-card">
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">Active Users</h6>
                </div>
                <div className="card-body-custom">
                  <div className="metric-number" style={{ fontSize: "32px", fontWeight: "700", color: "#22c55e" }}>
                    {activeUsers.toLocaleString()}
                  </div>
                  <div style={{ fontSize: "13px", color: "#888", marginTop: "8px" }}>
                    Active users (last 30 days)
                  </div>
                </div>
              </div>
            </div>

            {/* Total Paying Users Card */}
            <div className="col-xl-3 col-lg-6">
              <div className="dashboard-card">
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">Total Paying Users</h6>
                </div>
                <div className="card-body-custom">
                  <div className="metric-number" style={{ fontSize: "32px", fontWeight: "700", color: "#f59e0b" }}>
                    {payingUsers.toLocaleString()}
                  </div>
                  <div style={{ fontSize: "13px", color: "#888", marginTop: "8px" }}>
                    Unique users with payments
                  </div>
                  {totalUsers > 0 && (
                    <div style={{ fontSize: "12px", color: "#f59e0b", marginTop: "4px", fontWeight: "600" }}>
                      {((payingUsers / totalUsers) * 100).toFixed(1)}% of Total users
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Repeat Users Card */}
            <div className="col-xl-3 col-lg-6">
              <div className="dashboard-card">
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">Repeat Users</h6>
                </div>
                <div className="card-body-custom">
                  <div className="metric-number" style={{ fontSize: "32px", fontWeight: "700", color: "#a855f7" }}>
                    {repeatUsers.toLocaleString()}
                  </div>
                  <div style={{ fontSize: "13px", color: "#888", marginTop: "8px" }}>
                    Customers with 1+ payments
                  </div>
                  {payingUsers > 0 && (
                    <div style={{ fontSize: "12px", color: "#a855f7", marginTop: "4px", fontWeight: "600" }}>
                      {((repeatUsers / payingUsers) * 100).toFixed(1)}% of Total paying users
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Users per City Bar Chart */}
          {usersByCity.length > 0 && (
            <div className="row" style={{ marginTop: "1.5rem" }}>
              <div className="col-12">
                <div className="dashboard-card">
                  <div className="card-header-custom extra-space">
                    <h6 className="card-title">Users per City ({totalCities} cities)</h6>
                  </div>
                  <div className="card-body-custom">
                    <div
                      ref={scrollContainerRef}
                      onScroll={handleScroll}
                      style={{ overflowX: "auto", overflowY: "hidden" }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-around", gap: "1rem", height: "250px", paddingTop: "2rem", minWidth: "max-content" }}>
                        {usersByCity.map((city, index) => {
                          const maxUsers = Math.max(...usersByCity.map(c => c.users_count));
                          const barHeight = maxUsers > 0 ? (city.users_count / maxUsers) * 180 : 0;

                          return (
                            <div
                              key={`${city.city}-${index}`}
                              style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "70px", flexShrink: 0 }}
                            >
                              <div style={{
                                fontSize: "11px",
                                fontWeight: "600",
                                color: "#fff",
                                marginBottom: "6px",
                                height: "16px"
                              }}>
                                {city.users_count.toLocaleString()}
                              </div>
                              <div
                                style={{
                                  width: "100%",
                                  height: `${barHeight}px`,
                                  backgroundColor: "#FF5757",
                                  borderRadius: "4px 4px 0 0",
                                  transition: "height 0.3s ease, backgroundColor 0.2s ease",
                                  minHeight: "4px",
                                  cursor: "pointer"
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = "#ff6b6b";
                                  setHoveredBar(city);
                                  setTooltipPos({
                                    x: e.clientX,
                                    y: e.clientY
                                  });
                                }}
                                onMouseLeave={() => {
                                  setHoveredBar(null);
                                }}
                              />
                              <div
                                style={{
                                  fontSize: "10px",
                                  color: "#888",
                                  marginTop: "8px",
                                  textAlign: "center",
                                  wordBreak: "break-word",
                                  textTransform: "capitalize",
                                  height: "32px",
                                  overflow: "hidden",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical"
                                }}
                                onMouseEnter={(e) => {
                                  setHoveredBar(city);
                                  setTooltipPos({
                                    x: e.clientX,
                                    y: e.clientY
                                  });
                                }}
                                onMouseLeave={() => setHoveredBar(null)}
                              >
                                {city.city}
                              </div>
                            </div>
                          );
                        })}

                        {/* Loading indicator for pagination */}
                        {loadingMore && (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "70px", flexShrink: 0, justifyContent: "flex-end" }}>
                            <div style={{
                              width: "30px",
                              height: "30px",
                              border: "3px solid #333",
                              borderTop: "3px solid #FF5757",
                              borderRadius: "50%",
                              animation: "spin 1s linear infinite"
                            }}></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Custom Tooltip - Outside overflow container */}
          {hoveredBar && (
            <div
              style={{
                position: "fixed",
                left: `${tooltipPos.x + 15}px`,
                top: `${tooltipPos.y - 50}px`,
                backgroundColor: "#1e1e1e",
                color: "#fff",
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "500",
                whiteSpace: "nowrap",
                zIndex: 10000,
                boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
                border: "1px solid #FF5757",
                pointerEvents: "none"
              }}
            >
              <div style={{ marginBottom: "3px", color: "#FF5757", fontWeight: "700", fontSize: "14px" }}>
                {hoveredBar.city}
              </div>
              <div style={{ fontSize: "12px", color: "#ccc" }}>
                {hoveredBar.users_count.toLocaleString()} users
              </div>
            </div>
          )}

          {/* CSS animation for loading spinner */}
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
