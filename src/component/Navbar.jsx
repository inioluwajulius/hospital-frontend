import React from "react";
import { useLocation } from "react-router-dom";
import BrandLogo from "./BrandLogo";

const Navbar = () => {
  const location = useLocation();

  const pageNames = {
    "/dashboard": "Dashboard",
    "/patients": "Patients",
    "/doctors": "Doctors",
    "/appointments": "Appointments",
    "/billing": "Billing",
  };

  const currentPage = pageNames[location.pathname] || "Page";

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm sticky top-0 z-40">
      <div className="flex items-center justify-between">
        {/* Page Title */}
        <div className="flex items-center gap-4">
          <BrandLogo compact size="sm" />
          <div>
          <h2 className="heading-3 text-gray-900">{currentPage}</h2>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back! Here's your {currentPage.toLowerCase()} overview.
          </p>
        </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Search..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
          />

          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            🔔
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Settings */}
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            ⚙️
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;