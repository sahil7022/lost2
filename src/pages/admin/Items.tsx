import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Eye,
  Package,
  MapPin,
  Calendar
} from 'lucide-react';
import { adminService } from '../../services/api';
import { Item } from '../../types';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AdminItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchItems = () => {
    setLoading(true);
    fetch(`/api/items?status=${filter === 'all' ? '' : filter}&search=${search}`)
      .then(r => r.json())
      .then(data => {
        setItems(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchItems();
  }, [filter]);

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await adminService.updateItemStatus(id, status);
      toast.success(`Item status updated to ${status}`);
      fetchItems();
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      const res = await fetch(`/api/items/${id}`, { 
        method: 'DELETE', 
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } 
      });
      if (res.ok) {
        toast.success("Item deleted successfully");
        fetchItems();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete item");
      }
    } catch (e) {
      toast.error("Failed to delete item");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-card-foreground">Items Management</h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchItems()}
              placeholder="Search items..."
              className="pl-10 pr-4 py-2 bg-card border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary w-64 text-foreground"
            />
          </div>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-card border border-border rounded-xl px-4 py-2 text-sm outline-none text-foreground"
          >
            <option value="all" className="bg-background">All Status</option>
            <option value="pending" className="bg-background">Pending</option>
            <option value="approved" className="bg-background">Approved</option>
            <option value="returned" className="bg-background">Returned</option>
            <option value="rejected" className="bg-background">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Item</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Reporter</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Date</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-8"><div className="h-4 bg-muted rounded w-full" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-10" />
                    <p>No items found matching your criteria.</p>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                          {item.image_url ? (
                            <img src={item.image_url} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-full h-full p-2.5 text-muted-foreground/30" />
                          )}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-bold text-card-foreground">{item.title}</p>
                          <p className="text-xs text-muted-foreground flex items-center">
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full mr-1.5",
                              item.type === 'lost' ? "bg-red-500" : "bg-green-500"
                            )} />
                            {item.category}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-muted-foreground">{item.user_name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-muted-foreground">{format(new Date(item.date_reported), 'MMM dd, yyyy')}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                        item.status === 'approved' && "bg-green-500/10 text-green-600 dark:text-green-400",
                        item.status === 'pending' && "bg-orange-500/10 text-orange-600 dark:text-orange-400",
                        item.status === 'rejected' && "bg-red-500/10 text-red-600 dark:text-red-400",
                        item.status === 'returned' && "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                      )}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {item.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleStatusUpdate(item.id, 'approved')}
                              className="p-2 text-green-600 dark:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleStatusUpdate(item.id, 'rejected')}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {item.status === 'approved' && (
                          <button 
                            onClick={() => handleStatusUpdate(item.id, 'returned')}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Mark as Returned"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
