import React, { useState, useEffect } from 'react';
import { 
  collection, onSnapshot, deleteDoc, doc, updateDoc, addDoc, increment 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  Utensils, Users, Eye, MessageSquare, Trash2, Plus, 
  ShieldCheck, ShieldAlert, CheckCircle, History, X, Filter, Star, Heart
} from 'lucide-react';

export default function DashboardOverview({ activeTab }) {
  const [recipes, setRecipes] = useState([]);
  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [logs, setLogs] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Category Filter State for Recipes View
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Mobile-Identical Add Recipe Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState('CookMate Admin');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Dinner');
  const [prepTime, setPrepTime] = useState('20');
  const [servings, setServings] = useState('2');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [ingredients, setIngredients] = useState(['']);
  const [instructions, setInstructions] = useState(['']);

  const availableCategories = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snacks'];

  // 1. Live Listeners for all collections
  useEffect(() => {
    const unsubRecipes = onSnapshot(collection(db, 'recipes'), (snap) => {
      setRecipes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubFeedback = onSnapshot(collection(db, 'feedback'), (snap) => {
      setFeedback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubReviews = onSnapshot(collection(db, 'reviews'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setAllReviews(list);
    });

    const unsubLogs = onSnapshot(collection(db, 'logs'), (snap) => {
      const logsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setLogs(logsData.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)));
      setLoading(false);
    });

    return () => {
      unsubRecipes();
      unsubUsers();
      unsubFeedback();
      unsubReviews();
      unsubLogs();
    };
  }, []);

  const logActivity = async (action, title, details) => {
    try {
      await addDoc(collection(db, 'logs'), {
        action,
        title,
        details,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error('Error logging activity:', e);
    }
  };

  const handleIngredientChange = (text, idx) => {
    const list = [...ingredients];
    list[idx] = text;
    setIngredients(list);
  };
  const addIngredientField = () => setIngredients([...ingredients, '']);
  const removeIngredientField = (idx) => setIngredients(ingredients.filter((_, i) => i !== idx));

  const handleInstructionChange = (text, idx) => {
    const list = [...instructions];
    list[idx] = text;
    setInstructions(list);
  };
  const addInstructionField = () => setInstructions([...instructions, '']);
  const removeInstructionField = (idx) => setInstructions(instructions.filter((_, i) => i !== idx));

  const handleDeleteRecipe = async (recipe) => {
    if (window.confirm(`Are you sure you want to delete "${recipe.title}"?`)) {
      await deleteDoc(doc(db, 'recipes', recipe.id));
      await logActivity('delete', `Recipe Deleted: ${recipe.title}`, `Deleted by Admin`);
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Delete this user account record?')) {
      await deleteDoc(doc(db, 'users', id));
    }
  };

  const handleDeleteReviewAdmin = async (review) => {
    if (window.confirm(`Delete review comment by "${review.userName}"?`)) {
      await deleteDoc(doc(db, 'reviews', review.id));
      if (review.recipeId) {
        await updateDoc(doc(db, 'recipes', review.recipeId), {
          ratingSum: increment(-review.rating),
          ratingCount: increment(-1)
        });
      }
    }
  };

  const toggleUserRole = async (userId, currentRole) => {
    const nextRole = currentRole === 'admin' ? 'user' : 'admin';
    await updateDoc(doc(db, 'users', userId), { role: nextRole });
  };

  const handleResolveFeedback = async (id) => {
    await updateDoc(doc(db, 'feedback', id), { status: 'resolved' });
  };

  const handleAdminAddRecipe = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalImage = image.trim().startsWith('http') ? image.trim() : 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600';

    await addDoc(collection(db, 'recipes'), {
      title: title.trim(),
      category,
      prepTime: Number(prepTime) || 15,
      servings: Number(servings) || 2,
      description: description.trim() || 'Delicious recipe created by CookMate Admin.',
      image: finalImage,
      ingredients: ingredients.filter(i => i.trim()),
      instructions: instructions.filter(i => i.trim()),
      authorName: selectedAuthor,
      createdBy: 'admin',
      viewsCount: 0,
      favoritesCount: 0,
      ratingSum: 0,
      ratingCount: 0,
      createdAt: new Date().toISOString()
    });

    await logActivity('create', `Recipe Added: ${title.trim()}`, `Created by ${selectedAuthor}`);

    setTitle('');
    setImage('');
    setDescription('');
    setIngredients(['']);
    setInstructions(['']);
    setSelectedAuthor('CookMate Admin');
    setIsAddModalOpen(false);
  };

  const totalViews = recipes.reduce((sum, r) => sum + (r.viewsCount || 0), 0);
  
  // Analytics calculations
  const topRatedRecipe = [...recipes].sort((a, b) => {
    const rateA = a.ratingCount > 0 ? a.ratingSum / a.ratingCount : 0;
    const rateB = b.ratingCount > 0 ? b.ratingSum / b.ratingCount : 0;
    return rateB - rateA;
  })[0];

  const mostFavoritedRecipe = [...recipes].sort((a, b) => (b.favoritesCount || 0) - (a.favoritesCount || 0))[0];

  const mostViewedRecipe = [...recipes].sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0))[0];

  const unreadFeedbackCount = feedback.filter(f => f.status !== 'resolved').length;

  const filteredRecipes = selectedCategory === 'All' 
    ? recipes 
    : recipes.filter(r => r.category === selectedCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-stone-500 font-medium">
        Loading Admin Analytics...
      </div>
    );
  }

  // TAB 1: DASHBOARD OVERVIEW
  if (activeTab === 'dashboard') {
    return (
      <div className="space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-bold text-stone-400">Total Recipes</span>
              <p className="text-3xl font-extrabold text-stone-800 mt-1">{recipes.length}</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
              <Utensils className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-bold text-stone-400">Total Views</span>
              <p className="text-3xl font-extrabold text-stone-800 mt-1">{totalViews}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <Eye className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-bold text-stone-400">Registered Users</span>
              <p className="text-3xl font-extrabold text-stone-800 mt-1">{users.length}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-bold text-stone-400">Feedback Pending</span>
              <p className="text-3xl font-extrabold text-stone-800 mt-1">{unreadFeedbackCount}</p>
            </div>
            <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
              <MessageSquare className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Highlights Grid (Top Rated, Most Favorited, Most Viewed) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topRatedRecipe && (
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-600 flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" /> Top Rated Recipe
              </span>
              <div className="mt-3 flex items-center space-x-4">
                <img 
                  src={topRatedRecipe.image} 
                  alt={topRatedRecipe.title} 
                  className="w-16 h-16 rounded-xl object-cover border border-stone-200 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-stone-800 truncate">{topRatedRecipe.title}</h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Rating: <span className="font-bold text-amber-600">{(topRatedRecipe.ratingCount > 0 ? topRatedRecipe.ratingSum / topRatedRecipe.ratingCount : 0).toFixed(1)} ★</span> ({topRatedRecipe.ratingCount || 0} reviews)
                  </p>
                </div>
              </div>
            </div>
          )}

          {mostFavoritedRecipe && (
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-widest text-rose-600 flex items-center gap-1.5">
                <Heart className="w-4 h-4 fill-rose-500 text-rose-500" /> Most Favorited Recipe
              </span>
              <div className="mt-3 flex items-center space-x-4">
                <img 
                  src={mostFavoritedRecipe.image} 
                  alt={mostFavoritedRecipe.title} 
                  className="w-16 h-16 rounded-xl object-cover border border-stone-200 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-stone-800 truncate">{mostFavoritedRecipe.title}</h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Favorites: <span className="font-bold text-rose-600">{mostFavoritedRecipe.favoritesCount || 0}</span> saves
                  </p>
                </div>
              </div>
            </div>
          )}

          {mostViewedRecipe && (
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-blue-600" /> Most Viewed Recipe
              </span>
              <div className="mt-3 flex items-center space-x-4">
                <img 
                  src={mostViewedRecipe.image} 
                  alt={mostViewedRecipe.title} 
                  className="w-16 h-16 rounded-xl object-cover border border-stone-200 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-stone-800 truncate">{mostViewedRecipe.title}</h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Views: <span className="font-bold text-blue-600">{mostViewedRecipe.viewsCount || 0}</span> views
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Reviews & Ratings Feed Section */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-stone-800 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-600" /> Recent User Reviews & Comments ({allReviews.length})
            </h3>
          </div>

          <div className="divide-y divide-stone-100 max-h-80 overflow-y-auto">
            {allReviews.length > 0 ? (
              allReviews.map(rev => {
                const parentRecipe = recipes.find(r => r.id === rev.recipeId);

                return (
                  <div key={rev.id} className="py-3 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-stone-800">{rev.userName}</span>
                        <div className="flex text-amber-500">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} className={`w-3 h-3 ${s <= rev.rating ? 'fill-amber-400' : 'text-stone-200'}`} />
                          ))}
                        </div>
                        {parentRecipe && (
                          <span className="text-[10px] bg-stone-100 text-stone-600 font-semibold px-2 py-0.5 rounded-md">
                            On: {parentRecipe.title}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-600 mt-1">{rev.comment}</p>
                      <span className="text-[10px] text-stone-400 mt-0.5 block">
                        {rev.createdAt ? new Date(rev.createdAt).toLocaleString() : 'Recently'}
                      </span>
                    </div>

                    <button 
                      onClick={() => handleDeleteReviewAdmin(rev)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete Review"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-stone-400 italic">
                No review comments submitted yet.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // TAB 2: RECIPES & POSTS
  if (activeTab === 'recipes') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-bold text-stone-800">Recipe Catalog ({filteredRecipes.length})</h3>
            
            <div className="flex items-center space-x-2 bg-white px-3 py-1.5 border border-stone-200 rounded-xl shadow-sm">
              <Filter className="w-3.5 h-3.5 text-stone-500" />
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs font-semibold text-stone-700 bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="All">All Categories</option>
                {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-2 bg-[#1C1917] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-stone-800 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Official Recipe</span>
          </button>
        </div>

        {/* Recipes Table */}
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 border-b border-stone-200 font-bold uppercase text-stone-500">
              <tr>
                <th className="p-4">Recipe</th>
                <th className="p-4">Category</th>
                <th className="p-4">Author</th>
                <th className="p-4">Rating</th>
                <th className="p-4">Favorites</th>
                <th className="p-4">Views</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredRecipes.map(r => {
                const avg = r.ratingCount > 0 ? (r.ratingSum / r.ratingCount).toFixed(1) : 'New';
                return (
                  <tr key={r.id} className="hover:bg-stone-50 transition">
                    <td className="p-4 flex items-center space-x-3">
                      <img src={r.image} alt="" className="w-10 h-10 rounded-lg object-cover border border-stone-200" />
                      <span className="font-bold text-stone-800">{r.title}</span>
                    </td>
                    <td className="p-4"><span className="bg-stone-100 px-2.5 py-1 rounded-md text-[10px] uppercase font-bold text-stone-600">{r.category}</span></td>
                    <td className="p-4 font-medium">{r.authorName || 'Community User'}</td>
                    <td className="p-4 font-bold text-amber-600">{avg} ★</td>
                    <td className="p-4 font-bold text-rose-600">{r.favoritesCount || 0}</td>
                    <td className="p-4 font-bold text-stone-800">{r.viewsCount || 0}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleDeleteRecipe(r)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Add Recipe Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-stone-200 my-8">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
                <h3 className="text-base font-bold text-stone-800">Add New Recipe</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAdminAddRecipe} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1 text-xs">
                
                {/* Author Selection Dropdown */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">Author Name / Display Option</label>
                  <select 
                    value={selectedAuthor} 
                    onChange={e => setSelectedAuthor(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-800 cursor-pointer"
                  >
                    <option value="CookMate Admin">CookMate Admin</option>
                    <option value="Cookmate Community User">Cookmate Community User (Anonymous)</option>
                    <optgroup label="Select Registered User Author">
                      {users.map(u => {
                        const name = u.displayName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email;
                        return <option key={u.id} value={name}>{name}</option>;
                      })}
                    </optgroup>
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">Title</label>
                  <input 
                    type="text" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    placeholder="e.g. Honey Glazed Salmon" 
                    required 
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs" 
                  />
                </div>

                {/* Category Buttons */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">Category</label>
                  <div className="flex space-x-1.5 overflow-x-auto pb-1">
                    {availableCategories.map(cat => (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          category === cat ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 border border-stone-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time & Servings */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">Time (Min)</label>
                    <input 
                      type="number" 
                      value={prepTime} 
                      onChange={e => setPrepTime(e.target.value)} 
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">Servings</label>
                    <input 
                      type="number" 
                      value={servings} 
                      onChange={e => setServings(e.target.value)} 
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs" 
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">Description</label>
                  <textarea 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    placeholder="Summary..." 
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs h-16" 
                  />
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">Image Link (URL)</label>
                  <input 
                    type="text" 
                    value={image} 
                    onChange={e => setImage(e.target.value)} 
                    placeholder="Paste image link from postimages.org, imgur, etc." 
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs" 
                  />
                  <span className="text-[10px] text-stone-400 italic block mt-1">* Tip: Upload your photo for free at postimages.org or imgur.com</span>
                </div>

                {/* Dynamic Ingredients */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">Ingredients</label>
                  <div className="space-y-2">
                    {ingredients.map((ing, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={ing}
                          onChange={e => handleIngredientChange(e.target.value, idx)}
                          placeholder={`Ingredient ${idx + 1}`}
                          className="flex-1 p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                        />
                        {ingredients.length > 1 && (
                          <button type="button" onClick={() => removeIngredientField(idx)} className="text-rose-500 p-1">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={addIngredientField} className="flex items-center space-x-1 text-stone-800 text-xs font-semibold mt-2">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add another ingredient</span>
                  </button>
                </div>

                {/* Dynamic Instructions */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">Instructions</label>
                  <div className="space-y-2">
                    {instructions.map((step, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={step}
                          onChange={e => handleInstructionChange(e.target.value, idx)}
                          placeholder={`Step ${idx + 1}`}
                          className="flex-1 p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                        />
                        {instructions.length > 1 && (
                          <button type="button" onClick={() => removeInstructionField(idx)} className="text-rose-500 p-1">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={addInstructionField} className="flex items-center space-x-1 text-stone-800 text-xs font-semibold mt-2">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add another instruction</span>
                  </button>
                </div>

                {/* Form Buttons */}
                <div className="flex justify-end space-x-2 pt-4 border-t border-stone-100">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 border border-stone-200 rounded-lg text-xs font-semibold text-stone-600">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider">
                    Save Recipe
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // TAB 3: USER MANAGEMENT
  if (activeTab === 'users') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-stone-800">User Management ({users.length})</h3>
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 border-b border-stone-200 font-bold uppercase text-stone-500">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-stone-50 transition">
                  <td className="p-4 font-bold text-stone-800">{u.displayName || `${u.firstName || ''} ${u.lastName || ''}`}</td>
                  <td className="p-4">{u.email}</td>
                  <td className="p-4">
                    <button 
                      onClick={() => toggleUserRole(u.id, u.role)}
                      className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase flex items-center space-x-1 ${
                        u.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {u.role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                      <span>{u.role || 'user'}</span>
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // TAB 4: CHANGE LOGS
  if (activeTab === 'logs') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-stone-800">System Activity & Change Logs ({logs.length})</h3>
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden divide-y divide-stone-100">
          {logs.length > 0 ? (
            logs.map(log => (
              <div key={log.id} className="p-4 flex items-start space-x-4 hover:bg-stone-50 transition">
                <div className={`p-2.5 rounded-xl shrink-0 ${
                  log.action === 'delete' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  <History className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-stone-800">{log.title}</p>
                  <p className="text-xs text-stone-500 mt-0.5">{log.details}</p>
                  <span className="text-[10px] text-stone-400 mt-1 block">
                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-stone-400">
              No change activity recorded yet.
            </div>
          )}
        </div>
      </div>
    );
  }

  // TAB 5: REPORTS & FLAGS
  if (activeTab === 'feedback') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-stone-800 font-sans">User Reports & Feedback ({feedback.length})</h3>
        <div className="space-y-4">
          {feedback.map(item => (
            <div key={item.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-stone-800">{item.userName || 'Anonymous'}</span>
                  <span className="bg-stone-100 text-stone-500 px-2 py-0.5 rounded text-[10px] uppercase font-bold">{item.category}</span>
                </div>
                <p className="text-xs text-stone-600 mt-2">{item.message}</p>
                <span className="text-[10px] text-stone-400 mt-2 block">{item.userEmail}</span>
              </div>
              {item.status !== 'resolved' ? (
                <button onClick={() => handleResolveFeedback(item.id)} className="flex items-center space-x-1 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl text-xs font-bold">
                  <CheckCircle className="w-4 h-4" />
                  <span>Mark Resolved</span>
                </button>
              ) : (
                <span className="text-xs text-stone-400 font-semibold">Resolved</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // TAB 6: SETTINGS
  if (activeTab === 'settings') {
    return (
      <div className="space-y-6 max-w-2xl">
        <h3 className="text-lg font-bold text-stone-800">Platform Settings</h3>
        <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-4 shadow-sm">
          <div className="flex items-center justify-between py-2 border-b">
            <div>
              <p className="text-xs font-bold text-stone-800">Firebase Tier</p>
              <p className="text-[10px] text-stone-400">Spark Plan (100% Free Limits)</p>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] uppercase px-2.5 py-1 rounded-full font-bold">Active</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <div>
              <p className="text-xs font-bold text-stone-800">Daily Firestore Read Limit</p>
              <p className="text-[10px] text-stone-400">50,000 Reads / Day</p>
            </div>
            <span className="text-xs font-bold text-stone-700">OK</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-xs font-bold text-stone-800">Daily Firestore Write Limit</p>
              <p className="text-[10px] text-stone-400">20,000 Writes / Day</p>
            </div>
            <span className="text-xs font-bold text-stone-700">OK</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}