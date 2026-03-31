import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, MapPin, Clock, Tag, CheckCircle, PackageSearch } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Item } from '../types';
import { cn } from '../lib/utils';
import EmptyState from '../components/EmptyState';

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

    setLoading(true);
    fetch(`/api/items?${params.toString()}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch items');
        return res.json();
      })
      .then(data => {
        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching items:', err);
        setItems([]);
        setLoading(false);
      });
  }, [search, category, type]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        type: "spring", 
        stiffness: 100,
        damping: 15
      } 
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Browse Items</h1>
        
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
              type === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-2xl overflow-hidden border border-border"
            >
              <div className="aspect-square w-full bg-muted animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-muted animate-pulse rounded-md w-3/4" />
                <div className="h-3 bg-muted animate-pulse rounded-md w-1/2" />
                <div className="h-3 bg-muted animate-pulse rounded-md w-1/3" />
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <AnimatePresence>
            {items.map((item) => (
              <motion.div 
                key={item.id} 
                variants={itemVariants}
                layout
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Link to={`/item/${item.id}`} className="group block h-full">
                  <div className={cn(
                    "bg-card rounded-2xl overflow-hidden border transition-all duration-300 h-full",
                    item.status === 'returned' ? "border-green-500/30 hover:shadow-lg opacity-75" : "border-border hover:shadow-2xl hover:border-orange-500/30 group-hover:-translate-y-1"
                  )}>
                    <div className="aspect-square relative overflow-hidden bg-muted">
                      {item.image_url ? (
                        <motion.img 
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.6 }}
                          src={item.image_url} 
                          alt={item.title} 
                          className={cn(
                            "w-full h-full object-cover",
                            item.status === 'returned' ? "grayscale" : ""
                          )}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/40 text-sm italic">
                          No Image Provided
                        </div>
                      )}
                      
                      <div className={cn(
                        "absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm",
                        item.type === 'lost' ? "bg-red-500 text-white" : "bg-green-500 text-white"
                      )}>
                        {item.type}
                      </div>

                      {item.status === 'returned' && (
                        <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500 text-white flex items-center gap-1 shadow-sm">
                          <CheckCircle className="w-3 h-3" />
                          Returned
                        </div>
                      )}
                    </div>

                    <div className={cn(
                      "p-4 space-y-2",
                      item.status === 'returned' && "opacity-60"
                    )}>
                      <h4 className="font-bold text-card-foreground truncate group-hover:text-orange-600 transition-colors">{item.title}</h4>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3 mr-1 text-orange-500" />
                        <span className="truncate">{item.location}</span>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="w-3 h-3 mr-1 text-orange-500" />
                        <span>{new Date(item.date_reported).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {!loading && items.length === 0 && (
        <EmptyState 
          icon={PackageSearch}
          title="No Items Found"
          description="We couldn't find any items matching your current filters. Try adjusting your search or category selection."
          action={{
            label: "Clear All Filters",
            onClick: () => {
              setSearch('');
              setCategory('All');
              setType('all');
            }
          }}
        />
      )}
    </div>
  );
}
