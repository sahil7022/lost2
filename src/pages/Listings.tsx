import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, MapPin, Clock, Tag } from 'lucide-react';
import { Item } from '../types';
import { cn } from '../lib/utils';

const CATEGORIES = ['All', 'Electronics', 'Documents', 'Books', 'Clothing', 'Keys', 'Wallets', 'Others'];

export default function Listings() {
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [type, setType] = useState<'all' | 'lost' | 'found'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category !== 'All') params.append('category', category);
    if (type !== 'all') params.append('type', type);
    params.append('status', 'approved');

    fetch(`/api/items?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setItems(data);
        setLoading(false);
      });
  }, [search, category, type]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-4xl font-bold tracking-tight">Browse Items</h1>
        
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items..."
            className="w-full pl-12 pr-4 py-3 bg-secondary border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary text-foreground"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all",
              category === c ? "bg-primary text-primary-foreground" : "bg-secondary border border-border text-muted-foreground hover:border-muted-foreground/50"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="flex p-1 bg-muted rounded-2xl w-fit">
        {['all', 'lost', 'found'].map((t) => (
          <button
            key={t}
            onClick={() => setType(t as any)}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-all",
              type === t ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-square bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <Link key={item.id} to={`/item/${item.id}`} className="group">
              <div className="bg-card rounded-2xl overflow-hidden border border-border hover:shadow-xl transition-all duration-300">
                <div className="aspect-square relative overflow-hidden bg-muted">
                  {item.image_url ? (
                    <img 
                      src={item.image_url} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                      <Tag className="w-8 h-8 opacity-20" />
                    </div>
                  )}
                  <div className={cn(
                    "absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    item.type === 'lost' ? "bg-red-500 text-white" : "bg-green-500 text-white"
                  )}>
                    {item.type}
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <h4 className="font-bold text-card-foreground truncate">{item.title}</h4>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3 mr-1" />
                    <span className="truncate">{item.location}</span>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>{new Date(item.date_reported).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="text-center py-20 space-y-4">
          <Search className="w-16 h-16 mx-auto text-muted" />
          <p className="text-muted-foreground font-medium">No items found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
