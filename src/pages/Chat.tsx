import { useState, useEffect, useRef, FormEvent } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Send, User as UserIcon, ArrowLeft, MoreVertical, Package, Shield } from 'lucide-react';
import { chatService, userService } from '../services/api';
import { User } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
  read_status: number;
}

export default function Chat() {
  const { otherUserId } = useParams<{ otherUserId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const isAI = otherUserId === '0';

  useEffect(() => {
    if (!otherUserId) return;

    if (isAI) {
      setOtherUser({
        id: 0,
        name: 'AI Butler',
        email: 'ai@campus.edu',
        role: 'admin',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Butler'
      } as any);
      setMessages([{
        id: -1,
        sender_id: 0,
        receiver_id: currentUser.id,
        content: "Hello! I'm your AI Campus Butler. Ask me anything about lost or found items!",
        created_at: new Date().toISOString(),
        read_status: 1
      }]);
      setLoading(false);
      return;
    }
    userService.getUser(otherUserId).then(setOtherUser);

    // Fetch message history
    chatService.getMessages(parseInt(otherUserId))
      .then(setMessages)
      .finally(() => {
        setLoading(false);
        setTimeout(scrollToBottom, 100);
      });

    // Setup WebSocket
    const token = localStorage.getItem('token');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}?token=${token}`);

    socket.onopen = () => {
      console.log('[WS] Connected');
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'NEW_MESSAGE' && data.message.sender_id === parseInt(otherUserId)) {
        setMessages(prev => [...prev, data.message]);
        setTimeout(scrollToBottom, 100);
      } else if (data.type === 'MESSAGE_SENT') {
        setMessages(prev => [...prev, data.message]);
        setTimeout(scrollToBottom, 100);
      }
    };

    socket.onclose = () => {
      console.log('[WS] Disconnected');
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [otherUserId]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !otherUserId) return;

    const userMsg: Message = {
      id: Date.now(),
      sender_id: currentUser.id,
      receiver_id: parseInt(otherUserId),
      content: newMessage,
      created_at: new Date().toISOString(),
      read_status: 1
    };

    if (isAI) {
      setMessages(prev => [...prev, userMsg]);
      setNewMessage('');
      setTimeout(scrollToBottom, 100);

      try {
        const res = await fetch('/api/ai/ask', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ question: newMessage })
        });
        const data = await res.json();
        const aiMsg: Message = {
          id: Date.now() + 1,
          sender_id: 0,
          receiver_id: currentUser.id,
          content: data.answer || data.error,
          created_at: new Date().toISOString(),
          read_status: 1
        };
        setMessages(prev => [...prev, aiMsg]);
        setTimeout(scrollToBottom, 100);
      } catch (err) {
        toast.error("AI is currently unavailable");
      }
    } else if (ws) {
      ws.send(JSON.stringify({
        type: 'CHAT_MESSAGE',
        receiver_id: parseInt(otherUserId),
        content: newMessage
      }));
      setNewMessage('');
    }
  };

  if (loading || !otherUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col bg-card border border-border rounded-[2rem] overflow-hidden shadow-2xl transition-colors duration-300">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/inbox')}
            className="p-2 hover:bg-secondary rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <Link to={`/user/${otherUser.id}`} className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-muted overflow-hidden border border-border group-hover:scale-105 transition-transform">
              {otherUser.avatar ? (
                <img src={otherUser.avatar} alt={otherUser.name} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-full h-full p-2 text-muted-foreground" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-foreground flex items-center">
                {otherUser.name}
                {otherUser.role === 'admin' && <Shield className="w-3 h-3 ml-1 text-primary" />}
              </h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Online</p>
            </div>
          </Link>
        </div>
        <button className="p-2 hover:bg-secondary rounded-xl transition-all">
          <MoreVertical className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth">
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => {
            const isMe = msg.sender_id === currentUser.id;
            const showDate = idx === 0 || 
              new Date(messages[idx-1].created_at).toDateString() !== new Date(msg.created_at).toDateString();

            return (
              <div key={msg.id} className="space-y-2">
                {showDate && (
                  <div className="flex justify-center my-4">
                    <span className="px-3 py-1 bg-muted rounded-full text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      {new Date(msg.created_at).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                )}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={cn(
                    "flex w-full",
                    isMe ? "justify-end" : "justify-start"
                  )}
                >
                  <div className={cn(
                    "max-w-[70%] px-4 py-2.5 rounded-2xl shadow-sm",
                    isMe 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-muted text-foreground rounded-tl-none"
                  )}>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <p className={cn(
                      "text-[10px] mt-1 text-right opacity-70",
                      isMe ? "text-primary-foreground" : "text-muted-foreground"
                    )}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-muted/30">
        <div className="flex items-center space-x-2">
          <button 
            type="button"
            className="p-2.5 text-muted-foreground hover:bg-secondary rounded-xl transition-all"
          >
            <Package className="w-5 h-5" />
          </button>
          <input 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-background border border-border rounded-2xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim()}
            className="p-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
