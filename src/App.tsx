/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import MessageNotification from './components/MessageNotification';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import PostItem from './pages/PostItem';
import Listings from './pages/Listings';
import ItemDetails from './pages/ItemDetails';
import ExploreUsers from './pages/ExploreUsers';
import Inbox from './pages/Inbox';
import Chat from './pages/Chat';
import { User } from './types';

// Admin Pages
import AdminLayout from './components/AdminLayout';
import AdminOverview from './pages/admin/Overview';
import AdminItems from './pages/admin/Items';
import AdminUsers from './pages/admin/Users';
import AdminAudit from './pages/admin/Audit';
import AdminClaims from './pages/admin/Claims';

const AdminRoutes = () => (
  <AdminLayout>
    <Routes>
      <Route index element={<AdminOverview />} />
      <Route path="items" element={<AdminItems />} />
      <Route path="users" element={<AdminUsers />} />
      <Route path="audit" element={<AdminAudit />} />
      <Route path="claims" element={<AdminClaims />} />
    </Routes>
  </AdminLayout>
);

interface MessageNotif {
  id: string;
  senderName: string;
  content: string;
  senderAvatar?: string;
  senderId: number;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;


  return (
    <ThemeProvider>
      <Router>
        <AppWithNotifications user={user} onLogout={handleLogout} onLogin={handleLogin} />
      </Router>
    </ThemeProvider>
  );
}

function AppWithNotifications({ 
  user, 
  onLogout, 
  onLogin 
}: { 
  user: User | null; 
  onLogout: () => void;
  onLogin: (userData: User, token: string) => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [messageNotifs, setMessageNotifs] = useState<MessageNotif[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (!user) return;

    // Setup WebSocket connection
    const token = localStorage.getItem('token');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}?token=${token}`);

    socket.onopen = () => {
      console.log('[WS] Connected for notifications');
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'NEW_MESSAGE' && data.message.sender_id !== user.id) {
          const senderName = data.senderName || 'Someone';
          const notifId = `msg-${Date.now()}-${Math.random()}`;
          
          const notif: MessageNotif = {
            id: notifId,
            senderName,
            content: data.message.content,
            senderAvatar: data.senderAvatar,
            senderId: data.message.sender_id,
          };

          setMessageNotifs(prev => [...prev, notif]);

          // Trigger a toast if not on the chat page with this user
          const isAtChatWithSender = location.pathname === `/chat/${data.message.sender_id}`;
          if (!isAtChatWithSender) {
            toast.info(`New message from ${senderName}`, {
              description: data.message.content.length > 50 
                ? data.message.content.substring(0, 50) + '...' 
                : data.message.content,
              action: {
                label: 'Reply',
                onClick: () => navigate(`/chat/${data.message.sender_id}`)
              },
              duration: 5000,
            });
          }

          // Auto-remove after 8 seconds
          setTimeout(() => {
            setMessageNotifs(prev => prev.filter(m => m.id !== notifId));
          }, 8000);
        } else if (data.type === 'NEW_NOTIFICATION') {
          const title = data.notification.type === 'FOUND_MATCH' ? 'Match Found!' : 'New Notification';
          toast.success(title, {
            description: data.notification.sender_name + " " + data.notification.message,
            duration: 8000,
          });
        }
      } catch (err) {
        console.error('[WS] Error parsing message:', err);
      }
    };

    socket.onclose = () => {
      console.log('[WS] Disconnected');
    };

    socket.onerror = (err) => {
      console.error('[WS] Error:', err);
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [user, navigate, location.pathname]); // Added dependencies to ensure toast logic has latest context

  const handleDismissMessage = (id: string) => {
    setMessageNotifs(prev => prev.filter(m => m.id !== id));
  };

  const handleOpenChat = (senderId: number) => {
    navigate(`/chat/${senderId}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 md:pb-0 transition-colors duration-300">
      <Toaster position="top-center" expand={false} richColors />
      <MessageNotification 
        messages={messageNotifs}
        onDismiss={handleDismissMessage}
        onOpen={handleOpenChat}
      />
      
      <Routes>
        {/* Admin Routes - Isolated */}
        <Route 
          path="/admin/*" 
          element={user?.role === 'admin' ? <AdminRoutes /> : <Navigate to="/" />} 
        />

        {/* Public/User Routes */}
        <Route path="*" element={
          <>
            <Navbar user={user} onLogout={onLogout} />
            <main className="max-w-7xl mx-auto px-4 py-6 pt-24">
              <AnimatePresence mode="wait">
                <Routes location={location}>
                  <Route path="/" element={
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                      <Home />
                    </motion.div>
                  } />
                  <Route path="/login" element={
                    !user ? (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                        <Login onLogin={onLogin} />
                      </motion.div>
                    ) : <Navigate to="/profile" />
                  } />
                  <Route path="/signup" element={
                    !user ? (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                        <Signup onLogin={onLogin} />
                      </motion.div>
                    ) : <Navigate to="/profile" />
                  } />
                  <Route path="/profile" element={
                    user ? (
                      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.3 }}>
                        <Profile user={user} onUpdate={(u) => onLogin(u, localStorage.getItem('token') || '')} />
                      </motion.div>
                    ) : <Navigate to="/login" />
                  } />
                  <Route path="/post" element={
                    user ? (
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                        <PostItem />
                      </motion.div>
                    ) : <Navigate to="/login" />
                  } />
                  <Route path="/listings" element={
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                      <Listings />
                    </motion.div>
                  } />
                  <Route path="/item/:id" element={
                    <motion.div initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 0.3 }}>
                      <ItemDetails user={user} />
                    </motion.div>
                  } />
                  <Route path="/explore" element={
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                      <ExploreUsers />
                    </motion.div>
                  } />
                  <Route path="/inbox" element={
                    user ? (
                      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
                        <Inbox />
                      </motion.div>
                    ) : <Navigate to="/login" />
                  } />
                  <Route path="/chat/:otherUserId" element={
                    user ? (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                        <Chat />
                      </motion.div>
                    ) : <Navigate to="/login" />
                  } />
                  <Route path="/user/:userId" element={
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                      <UserProfile />
                    </motion.div>
                  } />
                </Routes>
              </AnimatePresence>
            </main>
            <BottomNav user={user} />
          </>
        } />
      </Routes>
    </div>
  );
}
