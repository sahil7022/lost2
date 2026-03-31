import { useState, useEffect } from 'react';
import { 
  Users, 
  Package, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp
} from 'lucide-react';
import { adminService } from '../../services/api';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';

export default function AdminOverview() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getStats().then(data => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {[...Array(5)].map((_, i) => <div key={i} className="h-32 bg-card rounded-3xl animate-pulse" />)}
  </div>;

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Lost Items', value: stats.totalLost, icon: Package, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10' },
    { label: 'Found Items', value: stats.totalFound, icon: CheckCircle2, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10' },
    { label: 'Total Claims', value: stats.totalClaims, icon: AlertCircle, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Total Resolved', value: stats.totalResolved, icon: CheckCircle2, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10' },
  ];

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Link 
              key={i} 
              to={card.label === 'Total Claims' ? '/admin/claims' : '#'}
              className={cn(
                "bg-card p-6 rounded-3xl border border-border shadow-sm hover:shadow-md transition-all group block",
                card.label === 'Total Claims' && "hover:border-primary/50 cursor-pointer"
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-3 rounded-2xl", card.bg)}>
                  <Icon className={cn("w-6 h-6", card.color)} />
                </div>
                <div className="flex items-center text-green-600 dark:text-green-400 text-xs font-bold">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12%
                </div>
              </div>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">{card.label}</p>
              <h3 className="text-3xl font-bold text-card-foreground mt-1">{card.value}</h3>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
