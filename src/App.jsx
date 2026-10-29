import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, checkAdminRole } from './config/firebase';
import AdminLayout from './components/AdminLayout';
import DashboardOverview from './components/DashboardOverview';

export default function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const adminStatus = await checkAdminRole(currentUser);
        if (adminStatus) {
          setUser(currentUser);
          setIsAdmin(true);
        } else {
          setError('Access Denied: This account is not authorized as an Administrator.');
          await signOut(auth);
          setUser(null);
          setIsAdmin(false);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError('Invalid email or password.');
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1C1917] flex items-center justify-center text-stone-200 font-sans">
        <p className="font-semibold text-lg">Verifying Admin Access...</p>
      </div>
    );
  }

  // Render Login Form if user is not authenticated or not an Admin
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-md border border-stone-200 w-full max-w-md">
          {/* Header with Full Logo */}
          <div className="flex flex-col items-center mb-6">
            <img 
              src="https://i.postimg.cc/GhMvzBhP/cookmatemcnzrfull.png" 
              alt="CookMate Logo" 
              className="h-16 w-auto object-contain mb-2"
            />
            <span className="text-xs uppercase tracking-widest text-amber-600 font-bold">
              Admin Portal
            </span>
          </div>

          {error && <p className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</p>}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">Admin Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500" 
                placeholder="admin@cookmate.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500" 
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-amber-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-amber-700 transition"
            >
              Sign In to Admin Portal
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Render Admin Dashboard when authenticated
  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab} adminUser={user} onLogout={handleLogout}>
      {/* Dynamic Tab Renderer */}
      <DashboardOverview activeTab={activeTab} />
    </AdminLayout>
  );
}