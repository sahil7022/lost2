import { Link, useLocation } from 'react-router-dom';
import { Home, Search, PlusCircle, User as UserIcon, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import { User } from '../types';

interface BottomNavProps {
  user: User | null;
}

export default function BottomNav({ user }: BottomNavProps) {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Browse', path: '/listings' },
    { icon: PlusCircle, label: 'Post', path: '/post', primary: true },
    { icon: Users, label: 'People', path: '/explore' },
    { icon: UserIcon, label: 'Profile', path: user ? '/profile' : '/login' },
  ];

  return (
    <nav className="md:hidden fixed bottom-6 left-4 right-4 z-50">
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-[2.5rem] px-4 py-3 flex items-center justify-between">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          if (item.primary) {
            return (
              <Link
                key={item.path}
                to={item.path}
                className="w-14 h-14 bg-orange-600 rounded-full flex items-center justify-center shadow-lg shadow-orange-600/30 -mt-10 border-4 border-white transition-transform active:scale-90"
              >
                <Icon className="w-7 h-7 text-white" />
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center space-y-1 transition-colors",
                isActive ? "text-orange-600" : "text-neutral-400"
              )}
            >
              <Icon className={cn("w-6 h-6", isActive && "animate-in zoom-in duration-300")} />
              <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
