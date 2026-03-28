import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Camera, Edit3, Grid, Bookmark, Settings, LogOut, PlusSquare } from 'lucide-react';
import { User, Item } from '../types';
import { userService } from '../services/api';
import FollowListModal from '../components/FollowListModal';
import { cn } from '../lib/utils';

interface ProfileProps {
  user: User;
  onUpdate: (user: User) => void;
}

export default function Profile({ user, onUpdate }: ProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || '');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(user.avatar || '');
  const [userItems, setUserItems] = useState<Item[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalUsers, setModalUsers] = useState<User[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    // Fetch latest user data to get accurate counts
    userService.getUser(user.id.toString()).then(data => {
      onUpdate(data);
    });

    fetch('/api/items')
      .then(res => res.json())
      .then(data => {
        setUserItems(data.filter((item: Item) => item.user_id === user.id));
      });
  }, [user.id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', name);
    formData.append('bio', bio);
    if (avatar) formData.append('avatar', avatar);

    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });

    if (res.ok) {
      const updatedUser = { ...user, name, bio, avatar: previewUrl };
      onUpdate(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setIsEditing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const openFollowers = async () => {
    setModalTitle('Followers');
    setIsModalOpen(true);
    setModalLoading(true);
    try {
      const followers = await userService.getFollowers(user.id.toString());
      setModalUsers(followers);
    } catch (error) {
      console.error(error);
    } finally {
      setModalLoading(false);
    }
  };

  const openFollowing = async () => {
    setModalTitle('Following');
    setIsModalOpen(true);
    setModalLoading(true);
    try {
      const following = await userService.getFollowing(user.id.toString());
      setModalUsers(following);
    } catch (error) {
      console.error(error);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Header - Instagram Style */}
      <section className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-12 px-4">
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <div className="w-24 h-24 md:w-40 md:h-40 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center">
            {previewUrl ? (
              <img src={previewUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-bold text-muted-foreground/30">{user.name[0]}</span>
            )}
          </div>
          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="text-white w-8 h-8" />
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange}
          />
        </div>

        <div className="flex-1 space-y-4 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <h2 className="text-2xl font-light tracking-tight text-foreground">{user.email.split('@')[0]}</h2>
            <div className="flex space-x-2 justify-center">
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-1.5 bg-secondary hover:bg-secondary/80 rounded-lg text-sm font-semibold transition-colors text-foreground"
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
              <button className="p-1.5 bg-secondary hover:bg-secondary/80 rounded-lg text-foreground">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex justify-center md:justify-start space-x-8 text-sm text-muted-foreground">
            <span><strong className="text-foreground">{userItems.length}</strong> posts</span>
            <button onClick={openFollowers} className="hover:opacity-70 transition-opacity">
              <strong className="text-foreground">{user.followersCount || 0}</strong> followers
            </button>
            <button onClick={openFollowing} className="hover:opacity-70 transition-opacity">
              <strong className="text-foreground">{user.followingCount || 0}</strong> following
            </button>
          </div>

          <div className="space-y-1">
            <p className="font-bold text-foreground">{user.name}</p>
            {user.uucms_number && (
              <p className="text-xs font-mono text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded inline-block">
                {user.uucms_number}
              </p>
            )}
            {isEditing ? (
              <form onSubmit={handleUpdate} className="space-y-4 pt-2">
                <input 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border border-border rounded-lg text-sm bg-background text-foreground"
                  placeholder="Full Name"
                />
                <textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-2 border border-border rounded-lg text-sm h-20 bg-background text-foreground"
                  placeholder="Bio"
                />
                <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold">
                  Save Changes
                </button>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{user.bio || 'No bio yet.'}</p>
            )}
          </div>
        </div>
      </section>

      {/* Content Tabs */}
      <div className="border-t border-border">
        <div className="flex justify-center space-x-12 -mt-px">
          <button className="flex items-center space-x-2 py-4 border-t border-foreground text-xs font-bold uppercase tracking-widest text-foreground">
            <Grid className="w-4 h-4" />
            <span>Posts</span>
          </button>
          <button className="flex items-center space-x-2 py-4 text-muted-foreground text-xs font-bold uppercase tracking-widest hover:text-foreground">
            <Bookmark className="w-4 h-4" />
            <span>Saved</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1 md:gap-8 pt-4">
          {userItems.map((item) => (
            <Link key={item.id} to={`/item/${item.id}`} className="aspect-square relative group overflow-hidden bg-muted">
              {item.image_url ? (
                <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                  <PlusSquare className="w-8 h-8" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white font-bold text-xs md:text-sm px-2 text-center uppercase tracking-tighter">
                  {item.type}: {item.title}
                </span>
              </div>
            </Link>
          ))}
          {userItems.length === 0 && (
            <div className="col-span-3 py-20 text-center text-muted-foreground">
              <PlusSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No posts yet. Start by reporting a lost or found item.</p>
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
