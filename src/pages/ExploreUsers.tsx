import { useState, useEffect } from 'react';
import { Search, User as UserIcon, ArrowRight, UserPlus, Package, Users2, PackageOpen } from 'lucide-react';
import { userService } from '../services/api';
import { User } from '../types';
import { Link } from 'react-router-dom';
import FollowButton from '../components/FollowButton';
import FollowListModal from '../components/FollowListModal';
import EmptyState from '../components/EmptyState';

export default function ExploreUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalUsers, setModalUsers] = useState<User[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    userService.getUsers(search).then(data => {
      setUsers(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openFollowers = async (userId: string) => {
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

  const openFollowing = async (userId: string) => {
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

  return (
    <div className="max-w-6xl mx-auto space-y-10 px-4">
      <div className="space-y-4 text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-light tracking-tight">Discover <span className="font-bold">Community</span></h1>
        <p className="text-neutral-500">Connect with other students and help each other find lost belongings.</p>
        
        <div className="relative max-w-md mx-auto pt-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            placeholder="Search people..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-neutral-200 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          [...Array(8)].map((_, i) => <div key={i} className="h-64 bg-white rounded-3xl animate-pulse" />)
        ) : users.length === 0 ? (
          <div className="col-span-full">
            <EmptyState 
              icon={Users2}
              title="No Users Found"
              description={search ? `We couldn't find any community members matching "${search}".` : "The community is quiet right now. Invite some friends!"}
              action={search ? {
                label: "Clear Search",
                onClick: () => {
                  setSearch('');
                  fetchUsers();
                }
              } : undefined}
            />
          </div>
        ) : (
          users.map((user) => (
            <div key={user.id} className="bg-white/50 backdrop-blur-sm p-6 rounded-3xl border border-white/20 shadow-xl hover:shadow-2xl transition-all group text-center">
              <Link to={`/user/${user.id}`} className="block relative mx-auto w-24 h-24 mb-4">
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-lg bg-neutral-100 flex items-center justify-center">
                  {user.avatar ? (
                    <img src={user.avatar} className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-full h-full p-6 text-neutral-300" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-orange-600 text-white p-1.5 rounded-full border-2 border-white">
                  <ArrowRight className="w-3 h-3" />
                </div>
              </Link>

              <div className="space-y-1 mb-6">
                <h4 className="font-bold text-neutral-900 truncate">{user.name}</h4>
                <p className="text-xs text-neutral-400 truncate">@{user.email.split('@')[0]}</p>
              </div>

              <div className="flex items-center justify-center space-x-4 mb-6">
                <button onClick={() => openFollowers(user.id.toString())} className="text-center hover:opacity-70 transition-opacity">
                  <p className="text-xs font-bold text-neutral-900">{user.followersCount || 0}</p>
                  <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-widest">Followers</p>
                </button>
                <div className="h-4 w-px bg-neutral-100" />
                <button onClick={() => openFollowing(user.id.toString())} className="text-center hover:opacity-70 transition-opacity">
                  <p className="text-xs font-bold text-neutral-900">{user.followingCount || 0}</p>
                  <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-widest">Following</p>
                </button>
              </div>

              {localStorage.getItem('user') && JSON.parse(localStorage.getItem('user')!).id !== user.id && (
                <FollowButton 
                  userId={user.id.toString()} 
                  className="w-full" 
                  onToggle={() => {
                    userService.getUsers(search).then(setUsers);
                  }}
                />
              )}
            </div>
          ))
        )}
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
