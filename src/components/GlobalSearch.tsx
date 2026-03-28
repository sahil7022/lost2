import { useState, useEffect, useRef } from 'react';
import { Search, X, Package, User as UserIcon, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ items: any[], users: any[] }>({ items: [], users: [] });
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.length < 2) {
      setResults({ items: [], users: [] });
      return;
    }

    const timer = setTimeout(async () => {
      const [itemsRes, usersRes] = await Promise.all([
        fetch(`/api/items?search=${query}&status=approved`),
        fetch(`/api/users?search=${query}`)
      ]);
      const items = await itemsRes.json();
      const users = await usersRes.json();
      setResults({ items: items.slice(0, 5), users: users.slice(0, 5) });
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative flex-1 max-w-md" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <input 
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search items or users..."
          className="w-full pl-12 pr-10 py-2.5 bg-secondary/50 backdrop-blur-sm border border-border/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 focus:bg-background transition-all text-foreground"
        />
        {query && (
          <button 
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && (query.length >= 2) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card/90 backdrop-blur-xl border border-border shadow-2xl rounded-3xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-[480px] overflow-y-auto">
            {results.items.length > 0 && (
              <div className="p-2">
                <h3 className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Items</h3>
                {results.items.map(item => (
                  <Link 
                    key={item.id} 
                    to={`/item/${item.id}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center p-3 hover:bg-secondary rounded-2xl transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-muted flex-shrink-0 overflow-hidden">
                      {item.image_url ? (
                        <img src={item.image_url} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-full h-full p-2.5 text-muted-foreground/30" />
                      )}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-sm font-bold text-card-foreground truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.category} • {item.location}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground/30 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                  </Link>
                ))}
              </div>
            )}

            {results.users.length > 0 && (
              <div className="p-2 border-t border-border">
                <h3 className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Users</h3>
                {results.users.map(user => (
                  <Link 
                    key={user.id} 
                    to={`/user/${user.id}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center p-3 hover:bg-secondary rounded-2xl transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0 overflow-hidden">
                      {user.avatar ? (
                        <img src={user.avatar} className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-full h-full p-2.5 text-muted-foreground/30" />
                      )}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-sm font-bold text-card-foreground truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">@{user.email.split('@')[0]}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground/30 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                  </Link>
                ))}
              </div>
            )}

            {results.items.length === 0 && results.users.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-sm">No results found for "{query}"</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
