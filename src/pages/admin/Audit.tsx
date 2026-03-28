import { useState, useEffect } from 'react';
import { 
  History, 
  User as UserIcon, 
  Package, 
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { adminService } from '../../services/api';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

export default function AdminAudit() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getAudit().then(data => {
      setLogs(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-card-foreground">Audit & History</h2>
        <button className="text-xs font-bold text-primary uppercase tracking-widest hover:underline">
          Export Logs (CSV)
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          [...Array(5)].map((_, i) => <div key={i} className="h-24 bg-card rounded-3xl animate-pulse" />)
        ) : logs.length === 0 ? (
          <div className="bg-card p-20 text-center text-muted-foreground rounded-3xl border border-border">
            <History className="w-12 h-12 mx-auto mb-4 opacity-10" />
            <p>No audit logs found.</p>
          </div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="bg-card p-6 rounded-3xl border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:shadow-md transition-all">
              <div className="flex items-center space-x-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center",
                  log.type === 'lost' ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-green-500/10 text-green-600 dark:text-green-400"
                )}>
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-card-foreground">{log.title}</h4>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    Reported {format(new Date(log.date_reported), 'MMM dd, HH:mm')}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Reporter</p>
                  <div className="flex items-center text-sm font-medium text-card-foreground">
                    <UserIcon className="w-3 h-3 mr-1.5 text-muted-foreground" />
                    {log.reporter_name}
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-muted-foreground/30" />

                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Claimer</p>
                  {log.claimer_name ? (
                    <div className="flex items-center text-sm font-medium text-card-foreground">
                      <UserIcon className="w-3 h-3 mr-1.5 text-muted-foreground" />
                      {log.claimer_name}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground/50 italic">No claim</span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Final Status</p>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                    log.status === 'returned' ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "bg-muted text-muted-foreground"
                  )}>
                    {log.status}
                  </span>
                </div>
                {log.status === 'returned' ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                ) : log.status === 'rejected' ? (
                  <XCircle className="w-6 h-6 text-red-500" />
                ) : (
                  <Clock className="w-6 h-6 text-orange-400" />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
