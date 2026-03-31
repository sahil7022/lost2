import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search, Plus, ArrowRight, MapPin, Clock, CheckCircle } from 'lucide-react';
import { Item } from '../types';
import { cn } from '../lib/utils';

export default function Home() {
  const [recentItems, setRecentItems] = useState<Item[]>([]);

  useEffect(() => {
    fetch('/api/items?status=approved')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch items');
        return res.json();
      })
      .then(data => setRecentItems(data.slice(0, 4)))
      .catch(err => {
        console.error('Error fetching recent items:', err);
        setRecentItems([]);
      });
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
  };

  const heroWordVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", damping: 12, stiffness: 200 } },
  };

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative h-[500px] rounded-3xl overflow-hidden bg-neutral-900 flex items-center px-8 md:px-16 shadow-2xl">
        <motion.div 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.4 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=2000')` }}
        />
        <div className="relative z-10 max-w-2xl space-y-8">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-2"
          >
            <div className="overflow-hidden">
              <motion.h1 variants={heroWordVariants} className="text-4xl sm:text-5xl md:text-7xl font-bold text-white tracking-tighter leading-none">
                LOST IT?
              </motion.h1>
            </div>
            <div className="overflow-hidden">
              <motion.h1 variants={heroWordVariants} className="text-4xl sm:text-5xl md:text-7xl font-bold text-white tracking-tighter leading-none text-orange-500">
                FOUND IT?
              </motion.h1>
            </div>
            <div className="overflow-hidden border-orange-500">
              <motion.h1 variants={heroWordVariants} className="text-4xl sm:text-5xl md:text-7xl font-bold text-white tracking-tighter leading-none uppercase">
                RETURN IT.
              </motion.h1>
            </div>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="text-neutral-300 text-lg md:text-xl max-w-md border-l-2 border-orange-500/50 pl-6"
          >
            The official campus portal to reconnect lost belongings with their owners. Fast, secure, and organized.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="flex flex-wrap gap-4 pt-4"
          >
            <Link to="/post" className="bg-orange-600 text-white px-8 py-4 rounded-full font-bold flex items-center hover:bg-orange-700 transition-all group hover:scale-105 active:scale-95 shadow-lg shadow-orange-600/20">
              Post an Item <Plus className="ml-2 w-5 h-5 group-hover:rotate-90 transition-transform" />
            </Link>
            <Link to="/listings" className="bg-white/10 backdrop-blur-md text-white px-8 py-4 rounded-full font-bold flex items-center hover:bg-white/20 transition-all border border-white/10 hover:scale-105 active:scale-95 shadow-lg">
              Browse All <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      <motion.section 
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {[
          { title: "Report Lost", desc: "Lost something? Post it here with details and location.", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20" },
          { title: "Report Found", desc: "Found an item? Post it to help it find its way home.", color: "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20" },
          { title: "Claim Item", desc: "See something yours? Submit a claim for verification.", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20" },
        ].map((card, i) => (
          <motion.div 
            key={i} 
            variants={itemVariants}
            whileHover={{ y: -8, scale: 1.02, transition: { type: "spring", stiffness: 300 } }}
            className={cn("p-8 rounded-3xl space-y-4 shadow-sm hover:shadow-xl transition-shadow", card.color)}
          >
            <h3 className="text-2xl font-bold">{card.title}</h3>
            <p className="opacity-80">{card.desc}</p>
          </motion.div>
        ))}
      </motion.section>

      {/* Recent Items */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Recent Listings</h2>
          <Link to="/listings" className="text-orange-600 font-semibold flex items-center hover:underline">
            View All <ArrowRight className="ml-1 w-4 h-4" />
          </Link>
        </div>
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {recentItems.map((item) => (
            <motion.div key={item.id} variants={itemVariants}>
              <Link to={`/item/${item.id}`} className="group block h-full">
                <div className={cn(
                  "bg-card rounded-2xl overflow-hidden border transition-all duration-300 h-full",
                  item.status === 'returned' ? "border-green-500/30 hover:shadow-lg opacity-75" : "border-border hover:shadow-2xl hover:border-orange-500/30 group-hover:-translate-y-1"
                )}>
                  <div className="aspect-square relative overflow-hidden bg-muted">
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.title} 
                        className={cn(
                          "w-full h-full object-cover transition-transform duration-700",
                          item.status === 'returned' ? "grayscale" : "group-hover:scale-110"
                        )}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                        No Image
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
        </motion.div>
      </section>
    </div>
  );
}
