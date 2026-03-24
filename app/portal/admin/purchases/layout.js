"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useRole } from "../../layout";

export default function PurchasesLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { role } = useRole();

  const defaultTab = "all";
  const [activeTab, setActiveTab] = useState(defaultTab);


  useEffect(() => {
    if (pathname.includes("/purchase-count")) {
      setActiveTab("purchase-count");
    } else if (pathname.includes("/all")) {
      setActiveTab("all");
    } else if (pathname.includes("/today")) {
      setActiveTab("today");
    } else if (pathname.includes("/gym-memberships")) {
      setActiveTab("gym-memberships");
    } else {
      setActiveTab(defaultTab);
    }
  }, [pathname, defaultTab]);

  // Define tabs - include purchase-count only for non-support roles
  const tabs = [
    { id: "all", name: "Session/Daily pass", path: "/portal/admin/purchases/all" },
    { id: "today", name: "Today's Schedule", path: "/portal/admin/purchases/today" },
    { id: "gym-memberships", name: "Gym Memberships", path: "/portal/admin/purchases/gym-memberships" },
    ...(role !== "support" ? [{ id: "purchase-count", name: "Purchase Analysis", path: "/portal/admin/purchases/purchase-count" }] : []),
  ];

  const handleTabClick = (tab) => {
    setActiveTab(tab.id);
    router.push(tab.path);
  };

  return (
    <div className="dashboard-container">
      <div className="section-container">
        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            borderBottom: "2px solid #333",
            marginBottom: "2rem",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              style={{
                padding: "12px 24px",
                background: "transparent",
                border: "none",
                color: activeTab === tab.id ? "#FF5757" : "#888",
                fontSize: "16px",
                fontWeight: activeTab === tab.id ? "600" : "400",
                cursor: "pointer",
                borderBottom: activeTab === tab.id ? "2px solid #FF5757" : "2px solid transparent",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.target.style.color = "#aaa";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.target.style.color = "#888";
                }
              }}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Content Area - Child routes will be rendered here */}
        {children}
      </div>
    </div>
  );
}
