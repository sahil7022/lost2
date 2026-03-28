import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, Clock, User as UserIcon, Tag, ChevronLeft, Send, CheckCircle, ShieldCheck, MessageCircle, Trash2 } from 'lucide-react';
import { Item, User } from '../types';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export default function ItemDetails({ user }: { user: User | null }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<Item | null>(null);
  const [claimDescription, setClaimDescription] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimSent, setClaimSent] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      const res = await fetch(`/api/items/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.ok) {
        toast.success("Item deleted successfully");
        navigate('/listings');
      } else {
        toast.error("Failed to delete item");
      }
    } catch (e) {
      toast.error("Error deleting item");
    }
  };

  useEffect(() => {
    setLoading(true);
    fetch(`/api/items/${id}`)
      .then(res => res.json())
      .then(data => {
        setItem(data);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load item details");
        setLoading(false);
      });
  }, [id]);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    
    const res = await fetch('/api/claims', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ item_id: id, description: claimDescription })
    });

    if (res.ok) {
      setClaimSent(true);
      setIsClaiming(false);
      toast.success("Claim request submitted successfully!");
    } else {
      toast.error("Failed to submit claim request");
    }
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto animate-pulse space-y-8">
      <div className="h-8 w-24 bg-muted rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="aspect-square bg-muted rounded-3xl" />
        <div className="space-y-4">
          <div className="h-10 w-3/4 bg-muted rounded-lg" />
          <div className="h-20 w-full bg-muted rounded-lg" />
          <div className="h-32 w-full bg-muted rounded-lg" />
        </div>
      </div>
    </div>
  );

  if (!item) return (
    <div className="py-20 text-center space-y-4">
      <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
        <Tag className="w-10 h-10 text-muted-foreground/30" />
      </div>
      <h2 className="text-2xl font-bold text-foreground">Item not found</h2>
      <button onClick={() => navigate('/listings')} className="text-orange-600 font-bold hover:underline">
        Back to listings
      </button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <button 
        onClick={() => navigate(-1)} 
        className="group flex items-center text-muted-foreground hover:text-foreground transition-all font-bold text-sm"
      >
        <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" /> 
        Back to Browse
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Image Section */}
        <div className="lg:col-span-7 space-y-6">
          <div className="aspect-[4/3] rounded-[2.5rem] overflow-hidden bg-muted border border-border shadow-2xl relative group">
            {item.image_url ? (
              <img src={item.image_url} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 bg-muted">
                <Tag className="w-24 h-24 opacity-20" />
              </div>
            )}
            <div className={cn(
              "absolute top-6 left-6 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg backdrop-blur-md",
              item.type === 'lost' ? "bg-red-500/90 text-white" : "bg-green-500/90 text-white"
            )}>
              {item.type}
            </div>
          </div>

          <div className="bg-card/50 backdrop-blur-sm p-8 rounded-[2.5rem] border border-border space-y-6">
            <div className="space-y-2">
              <h3 className="text-xs font-black text-muted-foreground/60 uppercase tracking-[0.2em]">Description</h3>
              <p className="text-muted-foreground leading-relaxed text-lg">{item.description}</p>
            </div>

            <div className="flex items-center p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20">
              <ShieldCheck className="w-5 h-5 text-orange-600 mr-3" />
              <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                Verified by Campus Security Protocol. Always meet in public places for item exchange.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Info & Actions */}
        <div className="lg:col-span-5 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-muted text-muted-foreground rounded-lg text-[10px] font-black uppercase tracking-widest">
                {item.category}
              </span>
              <span className="text-muted-foreground/30">•</span>
              <span className="text-xs text-muted-foreground font-bold">
                ID: #{item.id.toString().padStart(4, '0')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <h1 className="text-5xl font-black tracking-tight text-foreground leading-[1.1]">{item.title}</h1>
              {user && (user.id === item.user_id || user.role === 'admin') && (
                <button 
                  onClick={handleDelete}
                  className="p-3 bg-red-500/10 text-red-600 hover:bg-red-500/20 rounded-2xl transition-all"
                  title="Delete Item"
                >
                  <Trash2 className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="p-6 bg-card border border-border rounded-3xl flex items-center group hover:border-orange-500/30 transition-colors">
              <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <MapPin className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-widest block mb-0.5">Location</span>
                <span className="font-bold text-foreground">{item.location}</span>
              </div>
            </div>
            <div className="p-6 bg-card border border-border rounded-3xl flex items-center group hover:border-orange-500/30 transition-colors">
              <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-widest block mb-0.5">Reported On</span>
                <span className="font-bold text-foreground">{new Date(item.date_reported).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
              </div>
            </div>
          </div>

          <Link 
            to={`/user/${item.user_id}`}
            className="flex items-center p-6 bg-primary text-primary-foreground rounded-[2rem] group hover:opacity-90 transition-all shadow-xl shadow-primary/20"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mr-4 overflow-hidden">
              <UserIcon className="w-7 h-7 text-white/50" />
            </div>
            <div className="flex-1">
              <span className="text-[10px] uppercase font-black text-white/40 tracking-widest block mb-0.5">Reported By</span>
              <span className="font-bold text-lg">{item.user_name}</span>
            </div>
            <ChevronLeft className="w-5 h-5 rotate-180 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </Link>

          <div className="pt-4 space-y-4">
            {user && user.id !== item.user_id && (
              <Link 
                to={`/chat/${item.user_id}`}
                className="w-full bg-secondary text-foreground py-6 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-muted transition-all flex items-center justify-center border border-border"
              >
                <MessageCircle className="w-5 h-5 mr-3" />
                Message {item.user_name.split(' ')[0]}
              </Link>
            )}

            {claimSent ? (
              <div className="p-8 bg-green-500/10 border border-green-500/20 rounded-[2.5rem] text-center space-y-4">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-green-600">Claim Request Sent!</h4>
                  <p className="text-sm text-green-600/80 mt-2">The admin will review your request and contact you via email soon.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {isClaiming ? (
                  <form onSubmit={handleClaim} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-muted-foreground/60 uppercase tracking-widest ml-1">Claim Details</label>
                      <textarea
                        required
                        value={claimDescription}
                        onChange={(e) => setClaimDescription(e.target.value)}
                        placeholder="Provide proof of ownership (e.g. serial number, unique marks, wallpaper description)..."
                        className="w-full p-6 bg-secondary border border-border rounded-3xl h-40 outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all resize-none text-foreground"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button 
                        type="submit" 
                        className="flex-[2] bg-orange-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20"
                      >
                        Submit Claim <Send className="ml-3 w-4 h-4" />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setIsClaiming(false)} 
                        className="flex-1 bg-secondary text-muted-foreground rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-muted transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button 
                    onClick={() => user ? setIsClaiming(true) : navigate('/login')}
                    className="w-full bg-orange-600 text-white py-6 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-orange-700 transition-all shadow-2xl shadow-orange-600/30 active:scale-[0.98]"
                  >
                    {item.type === 'lost' ? "I found this item" : "This is mine / I know the owner"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
