import { useState, useEffect } from 'react';
import { 
  Search, 
  CheckCircle, 
  User as UserIcon,
  Package,
  Calendar,
  MessageSquare,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { adminService } from '../../services/api';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface AdminClaim {
  id: number;
  item_id: number;
  user_id: number;
  description: string;
  created_at: string;
  item_title: string;
  user_name: string;
}

export default function AdminClaims() {
  const [claims, setClaims] = useState<AdminClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchClaims = () => {
    setLoading(true);
    adminService.getClaims()
      .then(data => {
        setClaims(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching claims:', err);
        toast.error("Failed to load claims");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleResolve = async (itemId: number) => {
    if (!window.confirm("Are you sure you want to mark this item as officially RETURNED?")) return;
    try {
      const res = await fetch(`/api/items/${itemId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.ok) {
        toast.success("Item marked as returned successfully!");
        fetchClaims(); // Refresh list
      }
    } catch (err) {
      toast.error("Failed to resolve item");
    }
  };

  const filteredClaims = claims.filter(c => 
    c.item_title.toLowerCase().includes(search.toLowerCase()) ||
    c.user_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-card-foreground">Claims Management</h2>
          <p className="text-sm text-muted-foreground">Admin oversight for all item recovery requests</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search claims..."
            className="pl-10 pr-4 py-2 bg-card border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary w-64 text-foreground transition-all"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Item & Claimant</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Justification</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Submitted</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-6 py-10"><div className="h-4 bg-muted rounded w-full" /></td>
                  </tr>
                ))
              ) : filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-32 text-center text-muted-foreground">
                    <div className="max-w-xs mx-auto space-y-4">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="w-8 h-8 opacity-20" />
                      </div>
                      <p className="font-bold text-foreground uppercase tracking-widest text-xs">No Pending Claims</p>
                      <p className="text-xs">There are no active claims requiring your oversight at this time.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-muted/30 transition-all group">
                    <td className="px-6 py-6">
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center flex-shrink-0 border border-orange-500/20">
                          <Package className="w-6 h-6 text-orange-600" />
                        </div>
                        <div className="ml-4 space-y-1">
                          <Link 
                            to={`/item/${claim.item_id}`}
                            className="text-sm font-bold text-card-foreground hover:text-orange-600 flex items-center gap-1 group/link"
                          >
                            {claim.item_title}
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                          </Link>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <UserIcon className="w-3 h-3 mr-1" />
                            {claim.user_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <p className="text-sm text-card-foreground max-w-md line-clamp-2 italic leading-relaxed">
                        "{claim.description}"
                      </p>
                    </td>
                    <td className="px-6 py-6 font-mono text-[10px] text-muted-foreground">
                      {format(new Date(claim.created_at), 'MMM dd, HH:mm')}
                    </td>
                    <td className="px-6 py-6">
                      <button 
                        onClick={() => handleResolve(claim.item_id)}
                        className="flex items-center px-5 py-2.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-2" />
                        Mark Returned
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
