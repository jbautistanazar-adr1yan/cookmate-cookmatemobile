import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  LayoutDashboard, UtensilsCrossed, Users, History, 
  Flag, Settings, LogOut, Bell, X, Trash2, PlusCircle, MessageSquare
} from 'lucide-react';

export default function AdminLayout({ activeTab, setActiveTab, adminUser, onLogout, children }) {
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Listen to both 'logs' and 'feedback' collections to construct real-time notifications
  useEffect(() => {
    let logsList = [];
    let feedbackList = [];

    const combineAndSort = () => {
      const merged = [...logsList, ...feedbackList].sort((a, b) => {
        const timeA = new Date(a.timestamp || a.createdAt || 0);
        const timeB = new Date(b.timestamp || b.createdAt || 0);
        return timeB - timeA;
      });
      setNotifications(merged.slice(0, 10)); // Keep 10 most recent
    };

    // 1. Listen to logs collection
    const unsubLogs = onSnapshot(collection(db, 'logs'), (snap) => {
      logsList = snap.docs.map(d => ({
        id: d.id,
        type: 'log',
        ...d.data()
      }));
      combineAndSort();
    }, (err) => console.error("Logs error:", err));

    // 2. Listen to feedback collection
    const unsubFeedback = onSnapshot(collection(db, 'feedback'), (snap) => {
      feedbackList = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          type: 'feedback',
          title: `Feedback: ${data.subject || data.category || 'User Feedback'}`,
          details: `${data.userName || data.email || 'User'}: "${data.message || data.feedback || data.comment || ''}"`,
          timestamp: data.timestamp || data.createdAt,
          ...data
        };
      });
      combineAndSort();
    }, (err) => console.error("Feedback error:", err));

    return () => {
      unsubLogs();
      unsubFeedback();
    };
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'recipes', label: 'Recipes & Posts', icon: UtensilsCrossed },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'logs', label: 'Change Logs', icon: History },
    { id: 'feedback', label: 'Reports & Flags', icon: Flag },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const getPageTitle = () => {
    const active = menuItems.find(m => m.id === activeTab);
    return active ? active.label : 'Dashboard';
  };

  return (
    <div className="flex h-screen bg-[#F5F5F0] overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#1C1917] text-white flex flex-col justify-between shrink-0">
        <div>
          <div className="p-5 border-b border-stone-800 flex items-center space-x-3">
            <img 
              src="https://i.postimg.cc/QM75X0g1/cookmatemcnzrlogo.png" 
              alt="CookMate Logo" 
              className="w-10 h-10 rounded-xl object-contain bg-[#3E2723] p-1 shrink-0"
            />
            <div className="flex flex-col justify-center">
              <h1 className="font-bold text-lg leading-tight text-white">CookMate</h1>
              <span className="text-[10px] uppercase tracking-widest text-amber-500 font-bold leading-none">
                Admin Panel
              </span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-amber-600 text-white shadow-md font-semibold'
                      : 'text-stone-400 hover:bg-stone-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Admin Footer */}
        <div className="p-4 border-t border-stone-800">
          <div className="flex items-center justify-between p-2 bg-stone-900 rounded-xl">
            <div className="truncate pr-2">
              <p className="text-xs font-semibold text-stone-200 truncate">{adminUser?.displayName || 'Admin'}</p>
              <p className="text-[10px] text-stone-500 truncate">{adminUser?.email}</p>
            </div>
            <button
              onClick={onLogout}
              className="p-2 text-stone-400 hover:text-red-400 hover:bg-stone-800 rounded-lg transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-stone-200 px-6 flex items-center justify-between shrink-0 relative">
          <h2 className="text-xl font-bold text-stone-800">{getPageTitle()}</h2>

          {/* Top Right Notifications Bell */}
          <div className="relative">
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2 text-stone-600 hover:bg-stone-100 rounded-xl relative transition"
            >
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="w-2.5 h-2.5 bg-amber-600 rounded-full absolute top-1.5 right-1.5 ring-2 ring-white" />
              )}
            </button>

            {/* Notifications Dropdown Panel */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-stone-200 shadow-xl z-50 overflow-hidden">
                <div className="p-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-700">Notifications & Activity</span>
                  <button onClick={() => setIsNotifOpen(false)} className="text-stone-400 hover:text-stone-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
                  {notifications.length > 0 ? (
                    notifications.map(n => (
                      <div key={n.id} className="p-3 text-xs flex items-start space-x-3 hover:bg-stone-50 transition">
                        {n.type === 'feedback' ? (
                          <MessageSquare className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        ) : n.action === 'delete' ? (
                          <Trash2 className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        ) : (
                          <PlusCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-stone-800 truncate">{n.title || n.action}</p>
                          <p className="text-stone-500 text-[11px] mt-0.5 line-clamp-2">{n.details}</p>
                          <span className="text-[9px] text-stone-400 mt-1 block">
                            {n.timestamp ? new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-stone-400">
                      No new notifications
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Dynamic Page Views */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#F5F5F0]">
          {children}
        </main>
      </div>
    </div>
  );
}