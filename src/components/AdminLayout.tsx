import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Users, Store, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ChatBot } from './ChatBot';

const AdminLayout = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { signOut, user } = useAuth();

  const navigation = [
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Restaurants', href: '/admin/restaurants', icon: Store },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex flex-grow flex-col overflow-y-auto bg-gradient-to-b from-[#0EA5E9] to-[#33C3F0] pt-5">
          <div className="flex flex-shrink-0 items-center px-4">
            <h1 className="text-xl font-bold text-white">Restaurant Admin</h1>
          </div>
          
          {/* Welcome message */}
          <div className="mt-4 px-4">
            <p className="text-sm text-white/90">
              Welcome, {user?.email?.split('@')[0] || 'User'}!
            </p>
          </div>

          <div className="mt-5 flex flex-grow flex-col">
            <nav className="flex-1 space-y-1 px-2 pb-4">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-white/80 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-6 w-6 flex-shrink-0 ${
                        isActive ? 'text-white' : 'text-white/80'
                      }`}
                    />
                    {item.name}
                  </Link>
                );
              })}
              <Button
                variant="ghost"
                className="w-full justify-start text-white/80 hover:bg-white/5 hover:text-white"
                onClick={signOut}
              >
                <LogOut className="mr-3 h-6 w-6" />
                Logout
              </Button>
            </nav>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col md:pl-64">
        <main className="flex-1">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      <ChatBot />
    </div>
  );
};

export default AdminLayout;
