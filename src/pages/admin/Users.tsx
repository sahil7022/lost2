import { useState, useEffect } from 'react';
import { Search, User as UserIcon, Mail, Calendar, Shield, MoreVertical, Trash2, Users } from 'lucide-react';
import { userService } from '../../services/api';
import { User } from '../../types';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user? This action is irreversible.")) return;
    // In a real app, we'd have a DELETE /api/users/:id endpoint
    toast.error("User deletion is restricted in this demo.");
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-card-foreground">User Directory</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            placeholder="Search by name, email or UUCMS..."
            className="pl-10 pr-4 py-2 bg-card border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary w-64 text-foreground"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [...Array(6)].map((_, i) => <div key={i} className="h-48 bg-card rounded-3xl animate-pulse" />)
        ) : users.length === 0 ? (
          <div className="col-span-full py-20 text-center text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-10" />
            <p>No users found.</p>
          </div>
        ) : (
          users.map((user) => (
            <div key={user.id} className="bg-card p-6 rounded-3xl border border-border shadow-sm hover:shadow-md transition-all group relative">
              <div className="flex items-start justify-between mb-4">
                <div className="w-16 h-16 rounded-2xl bg-muted overflow-hidden border-2 border-background shadow-sm">
                  {user.avatar ? (
                    <img src={user.avatar} className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-full h-full p-4 text-muted-foreground/30" />
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  {user.role === 'admin' && (
                    <span className="bg-orange-500/10 text-orange-600 dark:text-orange-400 p-1.5 rounded-lg" title="Administrator">
                      <Shield className="w-4 h-4" />
                    </span>
                  )}
                  <button className="p-1.5 text-muted-foreground hover:text-card-foreground rounded-lg">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-card-foreground">{user.name}</h4>
                {user.uucms_number && (
                  <p className="text-[10px] font-mono text-primary bg-primary/5 px-1.5 py-0.5 rounded inline-block mb-1">
                    {user.uucms_number}
                  </p>
                )}
                <p className="text-xs text-muted-foreground flex items-center">
                  <Mail className="w-3 h-3 mr-1.5" />
                  {user.email}
                </p>
                <p className="text-xs text-muted-foreground flex items-center">
                  <Calendar className="w-3 h-3 mr-1.5" />
                  Joined {format(new Date(user.created_at), 'MMM dd, yyyy')}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                <Link to={`/user/${user.id}`} className="text-xs font-bold text-primary hover:underline">
                  View Public Profile
                </Link>
                <button 
                  onClick={() => handleDeleteUser(user.id)}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
