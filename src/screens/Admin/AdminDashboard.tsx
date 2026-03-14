import React, { useState } from 'react';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, BookOpen, LogOut, Menu, X, Ticket, Users, CreditCard } from 'lucide-react';

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
    <div className="min-h-screen bg-gray-50">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between h-16 px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hover:bg-gray-50"
            >
              {sidebarOpen ? <X className="h-5 w-5 text-gray-600" /> : <Menu className="h-5 w-5 text-gray-600" />}
            </Button>

            <Link to="/admin/dashboard" className="flex items-center">
              <img src="/Frame 1321314500.svg" alt="KelasASN" className="h-10 w-10" />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden md:block">{user?.email}</span>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="text-gray-700 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <aside
        className={`fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 transition-transform duration-300 z-40 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <nav className="flex flex-col gap-1 p-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm ${isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="pt-16 transition-all duration-300" style={{ paddingLeft: sidebarOpen ? '256px' : '0' }}>
        <div className="p-6 lg:p-8 bg-gray-50 min-h-[calc(100vh-4rem)]">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};
