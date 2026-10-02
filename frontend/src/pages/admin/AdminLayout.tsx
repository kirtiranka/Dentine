import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

export const AdminLayout: React.FC = () => {
  const tabs = [
    { label: 'Staff & Employees', path: 'employees', emoji: '👥' },
    { label: 'Clinic Procedures', path: 'procedures', emoji: '🩺' },
    { label: 'Lab Directory & Tests', path: 'labs', emoji: '🔬' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Admin Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Clinic Administration</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure operational staff, fee schedule procedures, and dental laboratory partners.
        </p>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors -mb-[1px] ${
                isActive
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`
            }
          >
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </div>

      {/* Nested Active View */}
      <Outlet />
    </div>
  );
};