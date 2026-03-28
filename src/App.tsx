/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
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

const AdminRoutes = () => (
  <AdminLayout>
    <Routes>
      <Route index element={<AdminOverview />} />
      <Route path="items" element={<AdminItems />} />
      <Route path="users" element={<AdminUsers />} />
      <Route path="audit" element={<AdminAudit />} />
    </Routes>
  </AdminLayout>
);

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
        <div className="min-h-screen bg-background text-foreground pb-20 md:pb-0 transition-colors duration-300">
          <Toaster position="top-center" expand={false} richColors />
          
          <Routes>
            {/* Admin Routes - Isolated */}
            <Route 
              path="/admin/*" 
              element={user?.role === 'admin' ? <AdminRoutes /> : <Navigate to="/" />} 
            />

            {/* Public/User Routes */}
            <Route path="*" element={
              <>
                <Navbar user={user} onLogout={handleLogout} />
                <main className="max-w-7xl mx-auto px-4 py-6">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/profile" />} />
                    <Route path="/signup" element={!user ? <Signup onLogin={handleLogin} /> : <Navigate to="/profile" />} />
                    <Route path="/profile" element={user ? <Profile user={user} onUpdate={setUser} /> : <Navigate to="/login" />} />
                    <Route path="/post" element={user ? <PostItem /> : <Navigate to="/login" />} />
                    <Route path="/listings" element={<Listings />} />
                    <Route path="/item/:id" element={<ItemDetails user={user} />} />
                    <Route path="/explore" element={<ExploreUsers />} />
                    <Route path="/inbox" element={user ? <Inbox /> : <Navigate to="/login" />} />
                    <Route path="/chat/:otherUserId" element={user ? <Chat /> : <Navigate to="/login" />} />
                    <Route path="/user/:userId" element={<UserProfile />} />
                  </Routes>
                </main>
                <BottomNav user={user} />
              </>
            } />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}
