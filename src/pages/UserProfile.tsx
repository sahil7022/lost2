import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Grid, Bookmark, Calendar, User as UserIcon, MapPin, Package } from 'lucide-react';
import { userService } from '../services/api';
import { User, Item } from '../types';
import FollowButton from '../components/FollowButton';
import FollowListModal from '../components/FollowListModal';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

export default function UserProfile() {
  const { userId } = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalUsers, setModalUsers] = useState<User[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    
    Promise.all([
      userService.getUser(userId),
      fetch(`/api/items?userId=${userId}`).then(r => r.json())
    ]).then(([userData, itemsData]) => {
      setUser(userData);
      setItems(itemsData);
      setLoading(false);
    });
  }, [userId]);

  const openFollowers = async () => {
    if (!userId) return;
    setModalTitle('Followers');
    setIsModalOpen(true);
    setModalLoading(true);
    try {
      const followers = await userService.getFollowers(userId);
      setModalUsers(followers);
    } catch (error) {
      console.error(error);
    } finally {
      setModalLoading(false);
    }
  };

  const openFollowing = async () => {
    if (!userId) return;
    setModalTitle('Following');
    setIsModalOpen(true);
    setModalLoading(true);
    try {
      const following = await userService.getFollowing(userId);
      setModalUsers(following);
    } catch (error) {
      console.error(error);
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) return <div className="py-20 text-center">Loading profile...</div>;
  if (!user) return <div className="py-20 text-center">User not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Header */}
      <section className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-12 px-4">
        <div className="w-24 h-24 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-neutral-100 flex items-center justify-center">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl font-bold text-neutral-300">{user.name[0]}</span>
          )}
        </div>

        <div className="flex-1 space-y-6 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <h2 className="text-3xl font-light tracking-tight">@{user.email.split('@')[0]}</h2>
            <FollowButton 
              userId={user.id.toString()} 
              onToggle={() => {
                userService.getUser(user.id.toString()).then(setUser);
              }}
            />
          </div>

          <div className="flex justify-center md:justify-start space-x-10 text-sm">
            <div className="flex flex-col">
              <span className="font-bold text-lg">{items.length}</span>
              <span className="text-neutral-400 uppercase text-[10px] font-bold tracking-widest">Posts</span>
            </div>
            <button onClick={openFollowers} className="flex flex-col hover:opacity-70 transition-opacity">
              <span className="font-bold text-lg">{user.followersCount || 0}</span>
              <span className="text-neutral-400 uppercase text-[10px] font-bold tracking-widest">Followers</span>
            </button>
            <button onClick={openFollowing} className="flex flex-col hover:opacity-70 transition-opacity">
              <span className="font-bold text-lg">{user.followingCount || 0}</span>
              <span className="text-neutral-400 uppercase text-[10px] font-bold tracking-widest">Following</span>
            </button>
          </div>

          <div className="space-y-2">
            <p className="font-bold text-xl">{user.name}</p>
            <p className="text-neutral-600 max-w-md">{user.bio || 'No bio provided.'}</p>
            <div className="flex items-center justify-center md:justify-start text-xs text-neutral-400 space-x-4 pt-2">
              <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> Joined {format(new Date(user.created_at), 'MMM yyyy')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <div className="border-t border-neutral-200">
        <div className="flex justify-center space-x-12 -mt-px">
          <button className="flex items-center space-x-2 py-4 border-t border-neutral-900 text-xs font-bold uppercase tracking-widest">
            <Grid className="w-4 h-4" />
            <span>Activity</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-6 pt-6">
          {items.map((item) => (
            <Link key={item.id} to={`/item/${item.id}`} className="group relative aspect-square rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200">
              {item.image_url ? (
                <img src={item.image_url} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-300">
                  <Package className="w-10 h-10 opacity-20" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center p-4 text-center">
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest mb-2",
                  item.type === 'lost' ? "bg-red-500 text-white" : "bg-green-500 text-white"
                )}>
                  {item.type}
                </span>
                <p className="text-white font-bold text-sm truncate w-full">{item.title}</p>
                <p className="text-white/70 text-[10px] flex items-center mt-1"><MapPin className="w-2 h-2 mr-1" /> {item.location}</p>
              </div>
            </Link>
          ))}
          {items.length === 0 && (
            <div className="col-span-full py-20 text-center text-neutral-400 space-y-4">
              <Package className="w-12 h-12 mx-auto opacity-10" />
              <p>This user hasn't posted any items yet.</p>
            </div>
          )}
        </div>
      </div>
      
      <FollowListModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalTitle}
        users={modalUsers}
        loading={modalLoading}
      />
    </div>
  );
}
