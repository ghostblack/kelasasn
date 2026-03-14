import React, { useState } from 'react';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, BookOpen, LogOut, Menu, X, Ticket, Users, CreditCard, Search, Command, Bell, Activity, User as UserIcon } from 'lucide-react';
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

  const menuSections = [
    {
      title: 'MANAGEMENT',
      items: [
        { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/admin/tryouts', icon: BookOpen, label: 'Kelola Try Out' },
      ]
    },
    {
      title: 'SERVICES',
      items: [
        { path: '/admin/payments', icon: CreditCard, label: 'Kelola Pembayaran' },
        { path: '/admin/claim-codes', icon: Ticket, label: 'Kode Klaim' },
      ]
    },
    {
      title: 'ADMINISTRATION',
      items: [
        { path: '/admin/users', icon: Users, label: 'Monitoring Pengguna' },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Top Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between h-16 px-4 lg:px-8">
          <div className="flex items-center gap-8">
            <div className="flex items-center">
               <button
                 onClick={() => setSidebarOpen(!sidebarOpen)}
                 className="p-2 hover:bg-gray-50 transition-colors mr-4"
               >
                 <Menu className="h-4 w-4 text-gray-500" />
               </button>
               <Link to="/admin/dashboard" className="flex items-center">
                 <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-2">
                    <img src="/Frame 1321314500.svg" alt="K" className="h-5 w-5 brightness-0 invert" />
                 </div>
                 <span className="font-bold text-gray-900 tracking-tight text-sm">KelasASN <span className="text-gray-400 font-medium ml-1 text-xs">Admin</span></span>
               </Link>
            </div>

            <div className="hidden lg:flex items-center">
               <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none text-gray-400">
                    <Search className="h-3.5 w-3.5" />
                  </div>
                  <input
                    type="text"
                    placeholder="Ask Ai...."
                    className="h-9 w-[280px] bg-gray-50 border border-gray-100 pl-9 pr-12 text-xs focus:outline-none focus:border-gray-200 focus:bg-white transition-all"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none bg-white border border-gray-100 px-1.5 py-0.5 rounded text-[10px] text-gray-400">
                     <Command className="h-3 w-3" />
                     <span>K</span>
                  </div>
               </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1 mr-2 text-gray-400">
                <button className="p-2 hover:bg-gray-50 rounded-full transition-colors relative">
                   <Bell className="h-4 w-4" />
                   <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
                </button>
             </div>
             
             <div className="h-8 w-[1px] bg-gray-100 mx-2" />

             <div className="flex items-center gap-3">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-xs font-semibold text-gray-900 leading-tight">Administrator</span>
                  <span className="text-[10px] text-gray-400 font-medium">{user?.email?.split('@')[0]}</span>
                </div>
                <div className="w-9 h-9 border border-gray-100 p-0.5 rounded-full overflow-hidden">
                   <div className="w-full h-full bg-gray-50 rounded-full flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-gray-400" />
                   </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-gray-50 transition-colors text-gray-400 hover:text-red-600 rounded-none bg-transparent h-16"
                >
                  <LogOut className="h-4 w-4" />
                </button>
             </div>
          </div>
        </div>
      </nav>

      <aside
        className={`fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-100 transition-transform duration-300 z-40 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
          <div className="py-6 px-4 space-y-8">
            {menuSections.map((section) => (
              <div key={section.title} className="space-y-1.5">
                <h3 className="px-3 text-[10px] font-bold text-gray-300 tracking-widest uppercase">
                  {section.title}
                </h3>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-3 px-3 py-2.5 transition-all text-[13px] rounded-lg group ${isActive
                          ? 'bg-blue-50/50 text-blue-600 font-semibold'
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                      >
                        <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                        <span className="grow">{item.label}</span>
                        {isActive && (
                           <motion.div layoutId="active-pill" className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto p-4 border-t border-gray-100">
             <div className="bg-gray-50 px-4 py-3 border border-gray-200 text-xs font-semibold text-gray-500 text-center rounded-none cursor-pointer hover:bg-white transition-all uppercase tracking-widest">
                Class: Admin Panel
             </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-transparent z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="pt-16 transition-all duration-300" style={{ paddingLeft: sidebarOpen ? '256px' : '0' }}>
        <div className="p-10 min-h-[calc(100vh-4rem)]">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};
