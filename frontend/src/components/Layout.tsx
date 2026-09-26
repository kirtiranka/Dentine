import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { label: 'Dashboard', path: '/' },
  { label: 'Calendar', path: '/calendar' },
  { label: 'All Patients', path: '/patients' },
  { label: 'Lab Tests', path: '/lab-tests' },
  { label: 'Prescriptions', path: '/prescriptions' },
  { label: 'Financials', path: '/financials' },
  { label: 'Admin', path: '/admin' },
];

export const Layout: React.FC = () => {
  return (
    <div className="flex min-h-screen font-sans">
  {/* Persistent Sidebar */}
  <aside className="w-60 bg-slate-900 text-slate-50 flex flex-col py-6 px-4 border-r border-slate-800 shrink-0">
    <div className="text-xl font-bold mb-8 pl-2 tracking-tight">
      Clinic OS
    </div>
    
    <nav className="flex flex-col gap-1.5">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
          className={({ isActive }) =>
            `block px-3.5 py-2.5 rounded-md text-sm transition-colors ${
              isActive
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-400 font-normal hover:bg-slate-800/60 hover:text-slate-200'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  </aside>

  {/* Main Content Area */}
  <main className="flex-1 bg-slate-50 p-8 overflow-y-auto">
    <Outlet />
  </main>
</div>
  );
};