import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, 
  User as UserIcon, 
  LogOut, 
  Shield, 
  Users,
  LayoutDashboard,
  Bell,
  MessageSquare,
  Sun,
  Moon
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import GlobalSearch from './GlobalSearch';
import NotificationDropdown from './NotificationDropdown';
import { useTheme } from '../context/ThemeContext';
import { User } from '../types';
interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const isAdmin = user?.role === 'admin';

  return (
    <nav className="fixed top-0 left-0 z-50 w-full px-4 py-4">
      <div className="max-w-7xl mx-auto bg-background/70 dark:bg-neutral-900/70 backdrop-blur-xl border border-border/20 shadow-2xl rounded-[2rem] px-6 py-3 flex items-center justify-between transition-colors duration-300">
        {/* Logo */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-600/20 group-hover:rotate-12 transition-transform">
              <Search className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tighter hidden sm:block text-foreground">
              CAMPUS<span className="text-orange-600">FOUND</span>
            </span>
          </Link>
        </motion.div>

        {/* Global Search */}
        <div className="hidden md:flex flex-1 justify-center px-8">
          <GlobalSearch />
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 md:space-x-4">

          {user ? (
            <>
              <div className="hidden lg:flex items-center space-x-1 border-r border-border pr-4 mr-2">
                {[
                  { name: 'Browse', path: '/listings' },
                  { name: 'People', path: '/explore' }
                ].map((item) => (
                  <Link 
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-bold transition-colors relative",
                      location.pathname === item.path ? "text-orange-600" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.name}
                    {location.pathname === item.path && (
                      <motion.div 
                        layoutId="nav-active"
                        className="absolute inset-0 bg-orange-50 dark:bg-orange-900/10 rounded-xl -z-10"
                        transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                      />
                    )}
                  </Link>
                ))}
              </div>

              <Link 
                to="/inbox" 
                className="p-2.5 text-muted-foreground hover:bg-secondary rounded-xl transition-all relative"
                title="Messages"
              >
                <MessageSquare className="w-6 h-6" />
              </Link>

              <NotificationDropdown />

              <Link 
                to="/profile" 
                className="w-10 h-10 rounded-2xl bg-secondary overflow-hidden border-2 border-background shadow-sm hover:scale-105 transition-transform"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-full h-full p-2 text-muted-foreground" />
                )}
              </Link>

              {isAdmin && (
                <Link 
                  to="/admin" 
                  className="hidden sm:flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/10"
                >
                  <Shield className="w-3.5 h-3.5 mr-2" />
                  Admin
                </Link>
              )}

              <button 
                onClick={onLogout}
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className="p-2 text-muted-foreground hover:bg-secondary rounded-xl transition-all"
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </motion.button>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Link to="/login" className="px-6 py-2.5 text-sm font-bold text-muted-foreground hover:bg-secondary rounded-xl transition-all">
                Login
              </Link>
              <Link to="/signup" className="px-6 py-2.5 bg-orange-600 text-white text-sm font-bold rounded-xl hover:bg-orange-700 shadow-lg shadow-orange-600/20 transition-all">
                Join Now
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
