import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, User as UserIcon, Search, ArrowRight } from 'lucide-react';
import { chatService } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';

interface Conversation {
  other_user_id: number;
  other_user_name: string;
  other_user_avatar: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export default function Inbox() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    chatService.getConversations()
      .then(setConversations)
      .finally(() => setLoading(false));
  }, []);

  const filteredConversations = conversations.filter(c => 
    c.other_user_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Messages</h1>
          <p className="text-muted-foreground">Chat with other students about items</p>
        </div>
        <div className="bg-primary/10 text-primary px-4 py-2 rounded-2xl text-sm font-bold flex items-center">
          <MessageSquare className="w-4 h-4 mr-2" />
          {conversations.reduce((acc, c) => acc + c.unread_count, 0)} Unread
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <input 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search conversations..."
          className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground"
        />
      </div>

      <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-xl">
        {filteredConversations.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <MessageSquare className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold text-foreground">No messages yet</p>
              <p className="text-sm text-muted-foreground">Start a conversation from an item details page</p>
            </div>
            <Link 
              to="/listings" 
              className="inline-flex items-center px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-all"
            >
              Browse Items
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredConversations.map((conv) => (
              <Link 
                key={conv.other_user_id}
                to={`/chat/${conv.other_user_id}`}
                className="flex items-center p-4 hover:bg-muted/50 transition-all group"
              >
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-muted overflow-hidden border border-border">
                    {conv.other_user_avatar ? (
                      <img src={conv.other_user_avatar} alt={conv.other_user_name} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-full h-full p-3 text-muted-foreground" />
                    )}
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-card">
                      {conv.unread_count}
                    </span>
                  )}
                </div>

                <div className="ml-4 flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-foreground truncate">{conv.other_user_name}</h3>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {formatDistanceToNow(new Date(conv.last_message_time), { addSuffix: true })}
                    </span>
                  </div>
                  <p className={cn(
                    "text-sm truncate",
                    conv.unread_count > 0 ? "text-foreground font-bold" : "text-muted-foreground"
                  )}>
                    {conv.last_message}
                  </p>
                </div>

                <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all ml-4" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
