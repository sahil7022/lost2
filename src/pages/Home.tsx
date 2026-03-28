import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search, Plus, ArrowRight, MapPin, Clock } from 'lucide-react';
import { Item } from '../types';
import { cn } from '../lib/utils';

export default function Home() {
  const [recentItems, setRecentItems] = useState<Item[]>([]);

  useEffect(() => {
    fetch('/api/items?status=approved')
      .then(res => res.json())
      .then(data => setRecentItems(data.slice(0, 4)));
  }, []);

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative h-[500px] rounded-3xl overflow-hidden bg-neutral-900 flex items-center px-8 md:px-16">
        <div className="absolute inset-0 opacity-40">
          <img 
            src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=2000" 
            alt="Campus" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="relative z-10 max-w-2xl space-y-6">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold text-white tracking-tighter leading-[0.9]"
          >
            LOST IT?<br />FOUND IT?<br /><span className="text-orange-500">RETURN IT.</span>
          </motion.h1>
          <p className="text-neutral-300 text-lg md:text-xl max-w-md">
            The official campus portal to reconnect lost belongings with their owners. Fast, secure, and organized.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <Link to="/post" className="bg-orange-600 text-white px-8 py-4 rounded-full font-bold flex items-center hover:bg-orange-700 transition-all group">
              Post an Item <Plus className="ml-2 w-5 h-5 group-hover:rotate-90 transition-transform" />
            </Link>
            <Link to="/listings" className="bg-secondary text-secondary-foreground px-8 py-4 rounded-full font-bold flex items-center hover:bg-secondary/80 transition-all">
              Browse All <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Stats / Info */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "Report Lost", desc: "Lost something? Post it here with details and location.", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
          { title: "Report Found", desc: "Found an item? Post it to help it find its way home.", color: "bg-green-500/10 text-green-600 dark:text-green-400" },
          { title: "Claim Item", desc: "See something yours? Submit a claim for verification.", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
        ].map((card, i) => (
          <div key={i} className={cn("p-8 rounded-3xl space-y-4", card.color)}>
            <h3 className="text-2xl font-bold">{card.title}</h3>
            <p className="opacity-80">{card.desc}</p>
          </div>
        ))}
      </section>

      {/* Recent Items */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Recent Listings</h2>
          <Link to="/listings" className="text-orange-600 font-semibold flex items-center hover:underline">
            View All <ArrowRight className="ml-1 w-4 h-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {recentItems.map((item) => (
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
                      No Image
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
      </section>
    </div>
  );
}
