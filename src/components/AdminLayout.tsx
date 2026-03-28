import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  History, 
  ShieldCheck, 
  LogOut, 
  Menu, 
  X,
  Bell,
  Search
} from 'lucide-react';
import { cn } from '../lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/admin' },
    { icon: Package, label: 'Items Management', path: '/admin/items' },
    { icon: Users, label: 'User Directory', path: '/admin/users' },
    { icon: History, label: 'Audit Logs', path: '/admin/audit' },
  ];

  return (
    <div className="min-h-screen bg-background flex transition-colors duration-300">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-neutral-900 dark:bg-neutral-950 text-white transition-transform duration-300 md:relative md:translate-x-0",
        !isSidebarOpen && "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center justify-between">
            <Link to="/" className="text-xl font-bold tracking-tighter">
              ADMIN<span className="text-orange-500">PORTAL</span>
            </Link>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden">
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    isActive 
                      ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20" 
                      : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                  )}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-neutral-800">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center w-full px-4 py-3 text-neutral-400 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Exit Admin
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-background border-b border-border flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden mr-4">
              <Menu className="w-6 h-6 text-foreground" />
            </button>
            <div className="hidden md:flex items-center text-sm text-muted-foreground">
              <ShieldCheck className="w-4 h-4 mr-2 text-orange-600" />
              Authenticated as Administrator
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input 
                placeholder="Quick search..."
                className="pl-10 pr-4 py-1.5 bg-secondary border-none rounded-lg text-xs focus:ring-2 focus:ring-orange-500/50 w-48 text-foreground"
              />
            </div>
            <button className="p-2 text-muted-foreground hover:text-foreground">
              <Bell className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 font-bold text-xs">
              AD
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-10 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
