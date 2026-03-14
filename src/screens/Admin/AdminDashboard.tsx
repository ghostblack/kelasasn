import React, { useState } from 'react';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, BookOpen, LogOut, Menu, X, Ticket, Users, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const menuItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/tryouts', icon: BookOpen, label: 'Kelola Try Out' },
    { path: '/admin/payments', icon: CreditCard, label: 'Kelola Pembayaran' },
    { path: '/admin/claim-codes', icon: Ticket, label: 'Kode Klaim' },
    { path: '/admin/users', icon: Users, label: 'Monitoring Pengguna' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between h-16 px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hover:bg-gray-50 rounded-none border-r border-gray-100 h-16 w-12"
            >
              {sidebarOpen ? <X className="h-4 w-4 text-gray-500" /> : <Menu className="h-4 w-4 text-gray-500" />}
            </Button>

            <Link to="/admin/dashboard" className="flex items-center ml-2">
              <img src="/Frame 1321314500.svg" alt="KelasASN" className="h-8 w-8" />
              <span className="ml-2 font-bold text-gray-900 tracking-tight">KASN <span className="text-gray-400 font-medium">ADMIN</span></span>
            </Link>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs font-semibold text-gray-900 leading-tight">Administrator</span>
              <span className="text-[10px] text-gray-400 font-medium">{user?.email}</span>
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-red-600 hover:bg-transparent border-l border-gray-100 h-16 rounded-none px-6"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <aside
        className={`fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-100 transition-transform duration-300 z-40 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <nav className="flex flex-col py-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-6 py-3.5 transition-all text-sm group relative ${isActive
                  ? 'text-blue-600 font-medium'
                  : 'text-gray-500 hover:text-gray-900'
                  }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 w-0.5 h-full bg-blue-600"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-transparent z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="pt-16 transition-all duration-300" style={{ paddingLeft: sidebarOpen ? '256px' : '0' }}>
        <div className="p-8 bg-white min-h-[calc(100vh-4rem)]">
          <div className="max-w-6xl">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};
