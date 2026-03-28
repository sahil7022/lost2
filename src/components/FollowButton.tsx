import { useState, useEffect } from 'react';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { userService } from '../services/api';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface FollowButtonProps {
  userId: string;
  className?: string;
  onToggle?: (isFollowing: boolean) => void;
}

export default function FollowButton({ userId, className, onToggle }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    userService.isFollowing(userId).then(data => {
      setIsFollowing(data.isFollowing);
      setLoading(false);
    });
  }, [userId]);

  const handleToggle = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      if (isFollowing) {
        await userService.unfollow(userId);
        setIsFollowing(false);
        onToggle?.(false);
        toast.success("Unfollowed user");
      } else {
        await userService.follow(userId);
        setIsFollowing(true);
        onToggle?.(true);
        toast.success("Following user");
      }
    } catch (e) {
      toast.error("Failed to update follow status");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="w-24 h-9 bg-neutral-100 animate-pulse rounded-lg" />;

  return (
    <button
      onClick={handleToggle}
      disabled={actionLoading}
      className={cn(
        "px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center min-w-[120px]",
        isFollowing 
          ? "bg-neutral-100 text-neutral-600 hover:bg-neutral-200" 
          : "bg-orange-600 text-white hover:bg-orange-700 shadow-lg shadow-orange-600/20",
        className
      )}
    >
      {actionLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus className="w-4 h-4 mr-2" /> Unfollow
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4 mr-2" /> Follow
        </>
      )}
    </button>
  );
}
