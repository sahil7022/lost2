import { X, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { User } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  users: User[];
  loading: boolean;
}

export default function FollowListModal({ isOpen, onClose, title, users, loading }: FollowListModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-card border border-border rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-xl font-bold text-foreground">{title}</h3>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : users.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <p>No users found.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {users.map((user) => (
                    <Link 
                      key={user.id}
                      to={`/user/${user.id}`}
                      onClick={onClose}
                      className="flex items-center p-3 hover:bg-muted rounded-2xl transition-all group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden border border-border">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-full h-full p-2.5 text-muted-foreground/30" />
                        )}
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <p className="font-bold text-foreground truncate">{user.name}</p>
                        <div className="flex items-center space-x-2">
                          <p className="text-xs text-muted-foreground truncate">@{user.email.split('@')[0]}</p>
                          {user.uucms_number && (
                            <span className="text-[9px] font-mono text-primary bg-primary/5 px-1 rounded">
                              {user.uucms_number}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
