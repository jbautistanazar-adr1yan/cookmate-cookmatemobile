import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, TouchableOpacity, ScrollView, TextInput, 
  Modal, StyleSheet, Image, Alert, RefreshControl, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  doc, getDoc, collection, addDoc, updateDoc, deleteDoc, onSnapshot, increment, getDocs, query, where, arrayUnion, arrayRemove 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  Search, Plus, Heart, BookOpen, 
  LogOut, Clock, Users, Trash2, CheckSquare, Square, X, User, ChefHat, 
  MessageSquare, Shield, Eye, Star, ChevronLeft, ChevronRight 
} from 'lucide-react-native';

import RecipeCard from '../components/RecipeCard';

const DEFAULT_RECIPE_IMAGE = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600';

const INITIAL_RECIPES = [
  {
    title: 'Creamy Garlic Butter Pasta',
    category: 'Dinner',
    prepTime: 20,
    servings: 2,
    description: 'A rich and satisfying 20-minute garlic butter parmesan pasta perfect for quick weeknight dinners.',
    image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600',
    ingredients: ['200g Fettuccine pasta', '4 cloves garlic, minced', '3 tbsp butter', '1/2 cup heavy cream', '1/2 cup grated Parmesan', 'Salt and black pepper to taste'],
    instructions: ['Boil pasta in salted water until al dente.', 'Melt butter in a skillet over medium heat, add minced garlic and saute for 1 min.', 'Pour in cream and bring to a gentle simmer.', 'Stir in grated parmesan until melted and smooth.', 'Toss pasta in sauce and serve hot.'],
    favoritesCount: 12,
    ratingSum: 25,
    ratingCount: 5,
    createdBy: 'system',
    authorName: 'Chef Mario',
    viewsCount: 42,
    createdAt: new Date().toISOString()
  },
  {
    title: 'Fluffy Berry Pancakes',
    category: 'Breakfast',
    prepTime: 15,
    servings: 4,
    description: 'Golden, fluffy homemade pancakes topped with fresh strawberries and warm maple syrup.',
    image: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=600',
    ingredients: ['1.5 cups flour', '3.5 tsp baking powder', '1 tbsp sugar', '1.25 cups milk', '1 egg', '3 tbsp melted butter', 'Fresh berries & syrup'],
    instructions: ['Sift dry ingredients together in a large bowl.', 'Whisk milk, egg, and melted butter together in a separate bowl.', 'Combine wet and dry ingredients until just mixed.', 'Pour batter onto hot greased griddle and cook until golden brown on both sides.'],
    favoritesCount: 8,
    ratingSum: 18,
    ratingCount: 4,
    createdBy: 'system',
    authorName: 'Chef Sarah',
    viewsCount: 18,
    createdAt: new Date().toISOString()
  }
];

export default function HomeScreen({ user, onSignOut }) {
  const [recipes, setRecipes] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [activeTab, setActiveTab] = useState('explore');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [userProfileData, setUserProfileData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLatestData = useCallback(async () => {
    setRefreshing(true);
    try {
      if (user?.uid) {
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        if (userSnap.exists()) setUserProfileData(userSnap.data());
      }
      const snapshot = await getDocs(collection(db, 'recipes'));
      const firestoreRecipes = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      setRecipes(firestoreRecipes);
    } catch (err) {
      console.log('Error refreshing data:', err);
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubUser = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setUserProfileData(docSnap.data());
      }
    });
    return () => unsubUser();
  }, [user]);

  useEffect(() => {
    const recipesRef = collection(db, 'recipes');
    const unsubscribe = onSnapshot(recipesRef, async (snapshot) => {
      if (snapshot.empty) {
        for (const recipe of INITIAL_RECIPES) {
          await addDoc(recipesRef, recipe);
        }
      } else {
        const firestoreRecipes = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
        setRecipes(firestoreRecipes);
      }
    }, (error) => {
      console.error('Error listening to recipes:', error);
    });

    return () => unsubscribe();
  }, []);

  const handleSelectRecipe = async (recipe) => {
    setSelectedRecipe({ ...recipe, viewsCount: (recipe.viewsCount || 0) + 1 });

    try {
      const recipeRef = doc(db, 'recipes', recipe.id);
      await updateDoc(recipeRef, { viewsCount: increment(1) });
    } catch (e) {
      console.log('Firestore view count update failed:', e);
    }
  };

  const toggleFavorite = async (recipeId) => {
    if (!user?.uid) {
      Alert.alert('Sign In Required', 'Please sign in to favorite recipes.');
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const recipeRef = doc(db, 'recipes', recipeId);
    const userFavorites = userProfileData?.favorites || [];
    const isCurrentlyFav = userFavorites.includes(recipeId);

    const updatedFavorites = isCurrentlyFav
      ? userFavorites.filter(id => id !== recipeId)
      : [...userFavorites, recipeId];

    setUserProfileData(prev => ({ ...prev, favorites: updatedFavorites }));

    setRecipes(prev => prev.map(r => {
      if (r.id === recipeId) {
        return {
          ...r,
          favoritesCount: Math.max(0, (r.favoritesCount || 0) + (isCurrentlyFav ? -1 : 1))
        };
      }
      return r;
    }));

    if (selectedRecipe && selectedRecipe.id === recipeId) {
      setSelectedRecipe(prev => ({
        ...prev,
        favoritesCount: Math.max(0, (prev.favoritesCount || 0) + (isCurrentlyFav ? -1 : 1))
      }));
    }

    try {
      if (isCurrentlyFav) {
        await updateDoc(userRef, { favorites: arrayRemove(recipeId) });
        await updateDoc(recipeRef, { favoritesCount: increment(-1) });
      } else {
        await updateDoc(userRef, { favorites: arrayUnion(recipeId) });
        await updateDoc(recipeRef, { favoritesCount: increment(1) });
      }
    } catch (error) {
      console.error('Error toggling favorite in Firestore:', error);
      fetchLatestData();
    }
  };

  const handleAddRecipe = async (newRecipeData) => {
    const author = newRecipeData.isAnonymous 
      ? 'Cookmate Community User' 
      : (userProfileData?.displayName || user?.displayName || `${userProfileData?.firstName || ''} ${userProfileData?.lastName || ''}`.trim() || 'Cookmate Community User');

    try {
      await addDoc(collection(db, 'recipes'), {
        ...newRecipeData,
        createdBy: user?.uid || 'anonymous',
        authorName: author,
        viewsCount: 0,
        favoritesCount: 0,
        ratingSum: 0,
        ratingCount: 0,
        createdAt: new Date().toISOString()
      });
      Alert.alert('Success', 'Recipe uploaded to cloud database!');
    } catch (error) {
      console.error('Error saving recipe to Firestore:', error);
      Alert.alert('Error', 'Failed to save recipe to cloud database.');
    }
  };

  const handleDeleteRecipe = async (id) => {
    try {
      await deleteDoc(doc(db, 'recipes', id));
      setSelectedRecipe(null);
      Alert.alert('Deleted', 'Recipe deleted successfully.');
    } catch (error) {
      console.error('Error deleting recipe from Firestore:', error);
      Alert.alert('Error', 'Failed to delete recipe.');
    }
  };

  const categories = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snacks'];
  const userFavoritesList = userProfileData?.favorites || [];

  const filteredRecipes = recipes.filter(r => {
    const matchesCategory = selectedCategory === 'All' || r.category === selectedCategory;
    const matchesSearch = (r.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesTab = true;
    if (activeTab === 'favorites') {
      matchesTab = userFavoritesList.includes(r.id);
    } else if (activeTab === 'myRecipes') {
      matchesTab = r.createdBy === user?.uid;
    }

    return matchesCategory && matchesSearch && matchesTab;
  });

  const userCreatedCount = recipes.filter(r => r.createdBy === user?.uid).length;

  const getSectionTitle = () => {
    if (activeTab === 'favorites') return 'Favorite Recipes';
    if (activeTab === 'myRecipes') return 'My Created Recipes';
    return `${selectedCategory} Recipes`;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.brandContainer} 
              onPress={fetchLatestData}
              activeOpacity={0.7}
            >
              <Image 
                source={require('../../assets/images/icon.png')} 
                style={styles.headerLogo} 
                resizeMode="contain" 
              />
              <Text style={styles.brandTitle}>CookMate</Text>
            </TouchableOpacity>
            
            {user && (
              <View style={styles.userHeaderActions}>
                <TouchableOpacity style={styles.iconHeaderBtn} onPress={() => setIsFeedbackOpen(true)}>
                  <MessageSquare size={16} color="#44403C" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.profileChip} onPress={() => setIsProfileOpen(true)}>
                  <User size={14} color="#1C1917" />
                  <Text style={styles.profileChipText}>{userProfileData?.firstName || 'Profile'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.signOutBtn} onPress={onSignOut}>
                  <LogOut size={16} color="#44403C" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Search Bar & Add Button */}
          <View style={styles.searchRow}>
            <View style={styles.searchContainer}>
              <Search size={16} color="#A8A29E" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search recipes..."
                placeholderTextColor="#A8A29E"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <TouchableOpacity style={styles.addBtn} onPress={() => setIsAddOpen(true)}>
              <Plus size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Navigation Tab Bar */}
          <View style={styles.tabBar}>
            <TouchableOpacity 
              style={[styles.tabItem, activeTab === 'explore' && styles.activeTabItem]}
              onPress={() => setActiveTab('explore')}
            >
              <BookOpen size={13} color={activeTab === 'explore' ? '#FFFFFF' : '#57534E'} />
              <Text style={[styles.tabText, activeTab === 'explore' && styles.activeTabText]}>All Recipes</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.tabItem, activeTab === 'favorites' && styles.activeTabItem]}
              onPress={() => setActiveTab('favorites')}
            >
              <Heart size={13} color={activeTab === 'favorites' ? '#FFFFFF' : '#57534E'} />
              <Text style={[styles.tabText, activeTab === 'favorites' && styles.activeTabText]}>Favorites</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.tabItem, activeTab === 'myRecipes' && styles.activeTabItem]}
              onPress={() => setActiveTab('myRecipes')}
            >
              <ChefHat size={13} color={activeTab === 'myRecipes' ? '#FFFFFF' : '#57534E'} />
              <Text style={[styles.tabText, activeTab === 'myRecipes' && styles.activeTabText]}>My Recipes</Text>
            </TouchableOpacity>
          </View>

          {/* Categories Horizontal Scroll */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[styles.categoryChip, selectedCategory === cat && styles.activeCategoryChip]}
              >
                <Text style={[styles.categoryText, selectedCategory === cat && styles.activeCategoryText]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Recipe Cards List Area */}
        <View style={styles.recipeListWrapper}>
          <Image 
            source={require('../../assets/images/splash-icon.png')} 
            style={styles.bgImage}
            resizeMode="cover"
          />

          <ScrollView 
            style={styles.scrollViewContainer}
            contentContainerStyle={styles.recipeListContent}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={fetchLatestData} 
                colors={['#FFFFFF']}
                tintColor="#FFFFFF"
              />
            }
          >
            <View style={styles.listHeader}>
              <Text style={styles.sectionTitle}>{getSectionTitle()}</Text>
              <Text style={styles.recipeCount}>
                {filteredRecipes.length} {filteredRecipes.length === 1 ? 'recipe' : 'recipes'} available
              </Text>
            </View>

            {filteredRecipes.length > 0 ? (
              <View style={styles.grid}>
                {filteredRecipes.map(recipe => (
                  <RecipeCard 
                    key={recipe.id} 
                    recipe={{
                      ...recipe,
                      isFavorite: userFavoritesList.includes(recipe.id)
                    }} 
                    onSelect={handleSelectRecipe} 
                    onToggleFavorite={toggleFavorite} 
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <ChefHat color="#78716C" size={40} />
                <Text style={styles.emptyTitle}>
                  {activeTab === 'myRecipes' ? 'You haven\'t created any recipes yet' : activeTab === 'favorites' ? 'No favorite recipes yet' : 'No recipes found'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {activeTab === 'favorites' 
                    ? 'Tap the heart icon on any recipe to save it to your favorites!'
                    : selectedCategory !== 'All' 
                    ? `No recipes currently under "${selectedCategory}". Tap "All" to view all recipes.` 
                    : 'Tap the "+" button at the top to add your first recipe!'}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Profile Modal */}
        <UserProfileModal 
          isOpen={isProfileOpen} 
          onClose={() => setIsProfileOpen(false)} 
          profile={userProfileData}
          email={user?.email}
          recipeCount={userCreatedCount}
        />

        {/* Feedback / Contact Us Modal */}
        <FeedbackModal 
          isOpen={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
          user={user}
          userProfile={userProfileData}
        />

        {/* Add Recipe Modal */}
        <AddRecipeModal 
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onAddRecipe={handleAddRecipe}
        />

        {/* Recipe Detail View Modal */}
        {selectedRecipe && (
          <RecipeDetailModal 
            recipe={{
              ...selectedRecipe,
              isFavorite: userFavoritesList.includes(selectedRecipe.id)
            }} 
            currentUser={user}
            userRole={userProfileData?.role}
            userName={userProfileData?.displayName || `${userProfileData?.firstName || ''} ${userProfileData?.lastName || ''}`.trim()}
            onClose={() => setSelectedRecipe(null)}
            onToggleFavorite={toggleFavorite}
            onDelete={handleDeleteRecipe}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

{/* User Profile Modal */}
function UserProfileModal({ isOpen, onClose, profile, email, recipeCount }) {
  if (!isOpen) return null;

  const firstName = profile?.firstName || 'CookMate';
  const lastName = profile?.lastName || 'User';
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return (
    <Modal visible={isOpen} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        <View style={styles.profileModalCard}>
          <View style={styles.profileHeader}>
            <Text style={styles.formTitle}>Chef Profile</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color="#1C1917" />
            </TouchableOpacity>
          </View>

          <View style={styles.profileBody}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>

            <Text style={styles.profileName}>{profile?.displayName || `${firstName} ${lastName}`}</Text>
            <Text style={styles.profileEmail}>{email}</Text>

            <View style={styles.badgeRow}>
              <Text style={styles.roleBadge}>Role: {profile?.role?.toUpperCase() || 'USER'}</Text>
            </View>

            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Birthdate:</Text>
                <Text style={styles.infoVal}>{profile?.birthdate || 'Not set'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>My Recipes Created:</Text>
                <Text style={styles.infoVal}>{recipeCount}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

{/* Contact Us / Feedback Modal */}
function FeedbackModal({ isOpen, onClose, user, userProfile }) {
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('General Feedback');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const categories = ['General Feedback', 'Bug Report', 'Recipe Suggestion', 'Account Issue'];

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert('Empty Message', 'Please write a message before sending.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        userId: user?.uid || 'anonymous',
        userName: userProfile?.displayName || user?.displayName || 'Anonymous User',
        userEmail: user?.email || 'N/A',
        category,
        message: message.trim(),
        createdAt: new Date().toISOString(),
        status: 'unread'
      });

      Alert.alert('Thank You!', 'Your message has been sent directly to our team.');
      setMessage('');
      onClose();
    } catch (e) {
      Alert.alert('Error', 'Failed to send feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={isOpen} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        <View style={styles.addModalCardContainer}>
          <View style={styles.modalFormHeader}>
            <Text style={styles.formTitle}>Contact Us & Feedback</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color="#1C1917" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollView} contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[styles.pickerChip, category === cat && styles.activePickerChip]}
                >
                  <Text style={[styles.pickerChipText, category === cat && styles.activePickerChipText]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Message</Text>
            <TextInput 
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]} 
              value={message} 
              onChangeText={setMessage} 
              multiline 
              numberOfLines={4} 
              placeholder="How can we improve CookMate?" 
              placeholderTextColor="#A8A29E" 
            />

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={isSubmitting}>
                <Text style={styles.saveBtnText}>{isSubmitting ? 'Sending...' : 'Send Message'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

{/* Recipe Detail View Modal - Fixed Touch & Scroll, Added Comment Deletion */}
function RecipeDetailModal({ recipe, currentUser, userRole, userName, onClose, onToggleFavorite, onDelete }) {
  const [checkedIngredients, setCheckedIngredients] = useState({});
  const [imgUri, setImgUri] = useState(recipe.image || DEFAULT_RECIPE_IMAGE);

  const [userRating, setUserRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviews, setReviews] = useState([]);
  const [hasUserReviewed, setHasUserReviewed] = useState(false);
  const [page, setPage] = useState(1);

  const REVIEWS_PER_PAGE = 3;
  const isOwner = currentUser && recipe.createdBy === currentUser.uid;
  const isAdmin = userRole === 'admin';
  const canDeleteRecipe = isOwner || isAdmin;

  const toggleIngredient = (idx) => {
    setCheckedIngredients(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  useEffect(() => {
    const q = query(collection(db, 'reviews'), where('recipeId', '==', recipe.id));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setReviews(list);

      if (currentUser?.uid) {
        const existing = list.find(r => r.userId === currentUser.uid);
        setHasUserReviewed(!!existing);
      }
    });
    return () => unsub();
  }, [recipe.id, currentUser]);

  const handleAddReview = async () => {
    if (!reviewText.trim()) {
      Alert.alert('Empty Review', 'Please write a short review before submitting.');
      return;
    }

    const wordCount = reviewText.trim().split(/\s+/).length;
    if (wordCount > 50) {
      Alert.alert('Limit Exceeded', 'Review must be 50 words or fewer.');
      return;
    }

    try {
      await addDoc(collection(db, 'reviews'), {
        recipeId: recipe.id,
        userId: currentUser?.uid || 'anonymous',
        userName: userName || 'CookMate User',
        rating: userRating,
        comment: reviewText.trim(),
        createdAt: new Date().toISOString()
      });

      await updateDoc(doc(db, 'recipes', recipe.id), {
        ratingSum: increment(userRating),
        ratingCount: increment(1)
      });

      setReviewText('');
      setHasUserReviewed(true);
      Alert.alert('Thank you!', 'Your review has been saved.');
    } catch (e) {
      Alert.alert('Error', 'Failed to save review.');
    }
  };

  // Delete User's Own Comment Handler
  const handleDeleteReview = async (review) => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete your review comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'reviews', review.id));
              await updateDoc(doc(db, 'recipes', recipe.id), {
                ratingSum: increment(-review.rating),
                ratingCount: increment(-1)
              });
              if (review.userId === currentUser?.uid) {
                setHasUserReviewed(false);
              }
              Alert.alert('Deleted', 'Your review comment has been removed.');
            } catch (err) {
              Alert.alert('Error', 'Failed to delete review.');
            }
          }
        }
      ]
    );
  };

  const avgRating = recipe.ratingCount > 0 ? (recipe.ratingSum / recipe.ratingCount).toFixed(1) : 'New';
  const totalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE) || 1;
  const currentReviews = reviews.slice((page - 1) * REVIEWS_PER_PAGE, page * REVIEWS_PER_PAGE);

  return (
    <Modal visible={true} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />

        <View style={styles.modalCardContainer}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <X size={18} color="#FFFFFF" />
          </TouchableOpacity>

          <ScrollView 
            style={styles.modalScrollView} 
            contentContainerStyle={styles.detailScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalImageContainer}>
              <Image 
                source={{ uri: imgUri }} 
                style={styles.modalImage} 
                resizeMode="cover" 
                onError={() => setImgUri(DEFAULT_RECIPE_IMAGE)}
              />
            </View>

            <View style={{ padding: 16 }}>
              <View style={styles.detailHeader}>
                <View style={styles.detailHeaderLeft}>
                  <Text style={styles.categoryBadge}>{recipe.category}</Text>
                  <Text style={styles.detailTitle}>{recipe.title}</Text>
                  
                  <Text style={styles.authorText}>
                    Created by: <Text style={{ fontWeight: '700', color: '#1C1917' }}>{recipe.authorName || 'Cookmate Community User'}</Text>
                  </Text>

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Clock size={12} color="#78716C" />
                      <Text style={styles.metaText}>{recipe.prepTime} min</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Users size={12} color="#78716C" />
                      <Text style={styles.metaText}>{recipe.servings} servings</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Star size={12} color="#EAB308" fill="#EAB308" />
                      <Text style={styles.metaText}>{avgRating} ({recipe.ratingCount || 0})</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Eye size={12} color="#78716C" />
                      <Text style={styles.metaText}>{recipe.viewsCount || 0} views</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.actionSquareBtn} onPress={() => onToggleFavorite(recipe.id)}>
                    <Heart size={16} color={recipe.isFavorite ? '#F43F5E' : '#57534E'} fill={recipe.isFavorite ? '#F43F5E' : 'transparent'} />
                  </TouchableOpacity>

                  {canDeleteRecipe && (
                    <TouchableOpacity style={[styles.actionSquareBtn, styles.deleteSquareBtn]} onPress={() => onDelete(recipe.id)}>
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <Text style={styles.description}>{recipe.description}</Text>

              {/* Ingredients Checklist */}
              <View style={styles.sectionContainer}>
                <Text style={styles.subHeading}>Ingredients</Text>
                {(recipe.ingredients || []).map((ing, i) => (
                  <TouchableOpacity 
                    key={i} 
                    onPress={() => toggleIngredient(i)}
                    style={[styles.checkListItem, checkedIngredients[i] && styles.checkedItem]}
                    activeOpacity={0.7}
                  >
                    {checkedIngredients[i] ? <CheckSquare size={16} color="#A8A29E" /> : <Square size={16} color="#A8A29E" />}
                    <Text style={[styles.checkListText, checkedIngredients[i] && styles.lineThrough]}>{ing}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Instructions List */}
              <View style={styles.sectionContainer}>
                <Text style={styles.subHeading}>Instructions</Text>
                {(recipe.instructions || []).map((step, i) => (
                  <View key={i} style={styles.instructionStep}>
                    <Text style={styles.stepNum}>{i + 1}.</Text>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>

              {/* Leave Review Form */}
              {!hasUserReviewed && currentUser && (
                <View style={[styles.sectionContainer, { backgroundColor: '#F5F5F0', padding: 12, borderRadius: 8 }]}>
                  <Text style={styles.subHeading}>Rate & Review</Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <TouchableOpacity key={s} onPress={() => setUserRating(s)}>
                        <Star size={20} color="#EAB308" fill={s <= userRating ? '#EAB308' : 'transparent'} />
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    style={[styles.input, { height: 60, backgroundColor: '#FFFFFF' }]}
                    placeholder="Write a short review (max 50 words)..."
                    placeholderTextColor="#A8A29E"
                    multiline
                    value={reviewText}
                    onChangeText={setReviewText}
                  />
                  <TouchableOpacity style={[styles.saveBtn, { marginTop: 8, alignSelf: 'flex-end' }]} onPress={handleAddReview}>
                    <Text style={styles.saveBtnText}>Submit Review</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Reviews List (3 per page) */}
              <View style={styles.sectionContainer}>
                <Text style={styles.subHeading}>Reviews ({reviews.length})</Text>
                {currentReviews.length > 0 ? (
                  currentReviews.map(rev => {
                    const isCommentAuthor = currentUser && rev.userId === currentUser.uid;
                    const canDeleteComment = isCommentAuthor || isAdmin;

                    return (
                      <View key={rev.id} style={{ backgroundColor: '#F5F5F0', padding: 10, borderRadius: 6, marginBottom: 6 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#1C1917' }}>{rev.userName}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <View style={{ flexDirection: 'row' }}>
                              {[1, 2, 3, 4, 5].map(s => (
                                <Star key={s} size={10} color="#EAB308" fill={s <= rev.rating ? '#EAB308' : 'transparent'} />
                              ))}
                            </View>
                            {canDeleteComment && (
                              <TouchableOpacity onPress={() => handleDeleteReview(rev)} style={{ padding: 2 }}>
                                <Trash2 size={12} color="#EF4444" />
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                        <Text style={{ fontSize: 11, color: '#44403C', marginTop: 4 }}>{rev.comment}</Text>
                      </View>
                    );
                  })
                ) : (
                  <Text style={{ fontSize: 11, color: '#78716C', fontStyle: 'italic' }}>No reviews yet.</Text>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 10 }}>
                    <TouchableOpacity disabled={page === 1} onPress={() => setPage(p => p - 1)} style={[{ padding: 6, backgroundColor: '#F5F5F0', borderRadius: 4 }, page === 1 && { opacity: 0.4 }]}>
                      <ChevronLeft size={14} color="#1C1917" />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#57534E' }}>Page {page} of {totalPages}</Text>
                    <TouchableOpacity disabled={page === totalPages} onPress={() => setPage(p => p + 1)} style={[{ padding: 6, backgroundColor: '#F5F5F0', borderRadius: 4 }, page === totalPages && { opacity: 0.4 }]}>
                      <ChevronRight size={14} color="#1C1917" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

{/* Add Recipe Modal */}
function AddRecipeModal({ isOpen, onClose, onAddRecipe }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Dinner');
  const [prepTime, setPrepTime] = useState('20');
  const [servings, setServings] = useState('2');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [ingredients, setIngredients] = useState(['']);
  const [instructions, setInstructions] = useState(['']);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const availableCategories = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snacks'];

  if (!isOpen) return null;

  const handleIngredientChange = (text, index) => {
    const list = [...ingredients];
    list[index] = text;
    setIngredients(list);
  };

  const addIngredientField = () => setIngredients(prev => [...prev, '']);
  const removeIngredientField = (index) => {
    if (ingredients.length === 1) return;
    setIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const handleInstructionChange = (text, index) => {
    const list = [...instructions];
    list[index] = text;
    setInstructions(list);
  };

  const addInstructionField = () => setInstructions(prev => [...prev, '']);
  const removeInstructionField = (index) => {
    if (instructions.length === 1) return;
    setInstructions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a recipe title.');
      return;
    }

    const finalImage = image.trim().startsWith('http') ? image.trim() : DEFAULT_RECIPE_IMAGE;

    onAddRecipe({
      title,
      category,
      prepTime: Number(prepTime) || 15,
      servings: Number(servings) || 2,
      description,
      image: finalImage,
      ingredients: ingredients.filter(i => i.trim()),
      instructions: instructions.filter(i => i.trim()),
      isAnonymous
    });

    onClose();
    setTitle('');
    setDescription('');
    setImage('');
    setIngredients(['']);
    setInstructions(['']);
    setIsAnonymous(false);
  };

  return (
    <Modal visible={isOpen} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        
        <View style={styles.addModalCardContainer}>
          <View style={styles.modalFormHeader}>
            <Text style={styles.formTitle}>Add New Recipe</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color="#1C1917" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollView} contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled">
            
            <TouchableOpacity 
              style={styles.anonymousCheckboxRow} 
              onPress={() => setIsAnonymous(!isAnonymous)}
            >
              {isAnonymous ? <CheckSquare size={18} color="#1C1917" /> : <Square size={18} color="#A8A29E" />}
              <Text style={styles.anonymousText}>Do you want to be displayed anonymously?</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Title</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Honey Glazed Salmon" placeholderTextColor="#A8A29E" />

            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
              {availableCategories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[styles.pickerChip, category === cat && styles.activePickerChip]}
                >
                  <Text style={[styles.pickerChipText, category === cat && styles.activePickerChipText]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Time (min)</Text>
                <TextInput style={styles.input} value={prepTime} onChangeText={setPrepTime} keyboardType="numeric" />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Servings</Text>
                <TextInput style={styles.input} value={servings} onChangeText={setServings} keyboardType="numeric" />
              </View>
            </View>

            <Text style={styles.label}>Description</Text>
            <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline numberOfLines={2} placeholder="Summary..." placeholderTextColor="#A8A29E" />

            <Text style={styles.label}>Image Link (URL)</Text>
            <TextInput style={styles.input} value={image} onChangeText={setImage} placeholder="Paste image link from postimages.org, imgur, etc." placeholderTextColor="#A8A29E" />
            <Text style={styles.helperText}>* Tip: Upload your photo for free at postimages.org or imgur.com and paste the direct link here.</Text>

            <Text style={styles.label}>Ingredients</Text>
            {ingredients.map((ing, index) => (
              <View key={index} style={styles.dynamicRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={ing}
                  onChangeText={(text) => handleIngredientChange(text, index)}
                  placeholder={`Ingredient ${index + 1}`}
                  placeholderTextColor="#A8A29E"
                />
                {ingredients.length > 1 && (
                  <TouchableOpacity style={styles.removeFieldBtn} onPress={() => removeIngredientField(index)}>
                    <X size={16} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity style={styles.addFieldBtn} onPress={addIngredientField}>
              <Plus size={14} color="#1C1917" />
              <Text style={styles.addFieldText}>Add another ingredient</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Instructions</Text>
            {instructions.map((step, index) => (
              <View key={index} style={styles.dynamicRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={step}
                  onChangeText={(text) => handleInstructionChange(text, index)}
                  placeholder={`Step ${index + 1}`}
                  placeholderTextColor="#A8A29E"
                />
                {instructions.length > 1 && (
                  <TouchableOpacity style={styles.removeFieldBtn} onPress={() => removeInstructionField(index)}>
                    <X size={16} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity style={styles.addFieldBtn} onPress={addInstructionField}>
              <Plus size={14} color="#1C1917" />
              <Text style={styles.addFieldText}>Add another instruction</Text>
            </TouchableOpacity>

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit}>
                <Text style={styles.saveBtnText}>Save Recipe</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, backgroundColor: '#F5F5F0' },
  header: { 
    paddingHorizontal: 16, 
    paddingBottom: 16, 
    paddingTop: Platform.OS === 'ios' ? 8 : 12, 
    backgroundColor: '#FFFFFF', 
    borderBottomWidth: 1, 
    borderColor: '#E7E5E4', 
    zIndex: 10 
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  brandContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerLogo: { width: 32, height: 32, borderRadius: 8 },
  brandTitle: { fontSize: 22, fontWeight: '700', color: '#1C1917' },
  userHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconHeaderBtn: { padding: 6, backgroundColor: '#F5F5F0', borderRadius: 16, borderWidth: 1, borderColor: '#E7E5E4' },
  profileChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F5F5F0', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#E7E5E4' },
  profileChipText: { fontSize: 12, fontWeight: '600', color: '#1C1917' },
  signOutBtn: { padding: 4 },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F0', borderWidth: 1, borderColor: '#E7E5E4', paddingHorizontal: 10, height: 38 },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, fontSize: 13, color: '#1C1917' },
  addBtn: { width: 38, height: 38, backgroundColor: '#1C1917', justifyContent: 'center', alignItems: 'center' },
  tabBar: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  tabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, backgroundColor: '#F5F5F0', borderWidth: 1, borderColor: '#E7E5E4' },
  activeTabItem: { backgroundColor: '#1C1917', borderColor: '#1C1917' },
  tabText: { fontSize: 11, fontWeight: '600', color: '#57534E' },
  activeTabText: { color: '#FFFFFF' },
  categoryScroll: { flexDirection: 'row' },
  categoryChip: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#F5F5F0', marginRight: 6, borderWidth: 1, borderColor: '#E7E5E4' },
  activeCategoryChip: { backgroundColor: '#E7E5E4', borderColor: '#1C1917' },
  categoryText: { fontSize: 11, color: '#57534E' },
  activeCategoryText: { fontWeight: '700', color: '#1C1917' },

  recipeListWrapper: { flex: 1, position: 'relative' },
  bgImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', zIndex: 0 },
  scrollViewContainer: { flex: 1, zIndex: 1 },
  recipeListContent: { padding: 16 },
  listHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', textShadowColor: 'rgba(0, 0, 0, 0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  recipeCount: { fontSize: 11, color: '#F5F5F0', marginTop: 2, textShadowColor: 'rgba(0, 0, 0, 0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  grid: { gap: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 40, backgroundColor: 'rgba(255, 255, 255, 0.95)', borderWidth: 1, borderColor: '#E7E5E4', paddingHorizontal: 20, borderRadius: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#1C1917', marginTop: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 12, color: '#78716C', marginTop: 4, textAlign: 'center' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCardContainer: { backgroundColor: '#FFFFFF', width: '92%', height: '80%', borderRadius: 12, overflow: 'hidden', position: 'relative', alignSelf: 'center' },
  addModalCardContainer: { backgroundColor: '#FFFFFF', width: '94%', height: '80%', borderRadius: 12, overflow: 'hidden', alignSelf: 'center' },
  profileModalCard: { backgroundColor: '#FFFFFF', width: '90%', borderRadius: 12, overflow: 'hidden' },
  profileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#E7E5E4' },
  profileBody: { padding: 20, alignItems: 'center' },
  avatarCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#1C1917', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  profileName: { fontSize: 18, fontWeight: '700', color: '#1C1917' },
  profileEmail: { fontSize: 12, color: '#78716C', marginTop: 2 },
  badgeRow: { marginTop: 8 },
  roleBadge: { fontSize: 10, fontWeight: '700', backgroundColor: '#F5F5F0', color: '#57534E', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, overflow: 'hidden' },
  infoBox: { width: '100%', marginTop: 16, backgroundColor: '#F5F5F0', padding: 12, borderRadius: 6, gap: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { fontSize: 12, color: '#78716C' },
  infoVal: { fontSize: 12, fontWeight: '700', color: '#1C1917' },

  anonymousCheckboxRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderBottomWidth: 1, borderColor: '#F5F5F0', marginBottom: 6 },
  anonymousText: { fontSize: 12, color: '#1C1917', fontWeight: '500' },

  pickerScroll: { flexDirection: 'row', marginTop: 4, marginBottom: 8 },
  pickerChip: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#F5F5F0', marginRight: 6, borderWidth: 1, borderColor: '#E7E5E4', borderRadius: 4 },
  activePickerChip: { backgroundColor: '#1C1917', borderColor: '#1C1917' },
  pickerChipText: { fontSize: 11, color: '#57534E' },
  activePickerChipText: { color: '#FFFFFF', fontWeight: '700' },

  dynamicRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  removeFieldBtn: { padding: 6 },
  addFieldBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, marginBottom: 8 },
  addFieldText: { fontSize: 12, fontWeight: '600', color: '#1C1917' },

  modalScrollView: { flex: 1 },
  modalScrollContent: { padding: 16, paddingBottom: 24 },
  detailScrollContent: { paddingBottom: 20 },
  modalImageContainer: { height: 220, width: '100%' },
  modalImage: { width: '100%', height: '100%' },
  closeBtn: { position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 30 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 1, borderColor: '#E7E5E4', paddingBottom: 12, marginBottom: 12 },
  detailHeaderLeft: { flex: 1, paddingRight: 8 },
  categoryBadge: { fontSize: 10, textTransform: 'uppercase', backgroundColor: '#F5F5F0', paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 4, color: '#44403C' },
  detailTitle: { fontSize: 18, fontWeight: '700', color: '#1C1917' },
  authorText: { fontSize: 11, color: '#78716C', marginTop: 2 },
  metaRow: { flexDirection: 'row', gap: 12, marginTop: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: '#78716C' },
  actionRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  actionSquareBtn: { width: 36, height: 36, borderWidth: 1, borderColor: '#E7E5E4', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' },
  deleteSquareBtn: { borderColor: '#FECDD3', backgroundColor: '#FFF1F2' },
  description: { fontSize: 12, color: '#44403C', lineHeight: 18, marginBottom: 16 },
  sectionContainer: { marginTop: 12 },
  subHeading: { fontSize: 14, fontWeight: '700', color: '#1C1917', marginBottom: 8 },
  checkListItem: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, borderWidth: 1, borderColor: '#F5F5F0', marginBottom: 4 },
  checkedItem: { backgroundColor: '#F5F5F0' },
  checkListText: { fontSize: 12, color: '#1C1917' },
  lineThrough: { textDecorationLine: 'line-through', color: '#A8A29E' },
  instructionStep: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  stepNum: { fontSize: 12, fontWeight: '700', color: '#78716C' },
  stepText: { fontSize: 12, color: '#44403C', flex: 1, lineHeight: 18 },
  modalFormHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#E7E5E4' },
  formTitle: { fontSize: 16, fontWeight: '700', color: '#1C1917' },
  label: { fontSize: 11, textTransform: 'uppercase', color: '#57534E', marginTop: 12, marginBottom: 6, fontWeight: '600' },
  helperText: { fontSize: 10, color: '#78716C', marginTop: 4, fontStyle: 'italic' },
  input: { borderWidth: 1, borderColor: '#E7E5E4', backgroundColor: '#F5F5F0', padding: 10, fontSize: 13, color: '#1C1917', borderRadius: 6 },
  textArea: { height: 72, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 8 },
  col: { flex: 1 },
  btnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 20, marginBottom: 12 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: '#E7E5E4', borderRadius: 6 },
  cancelBtnText: { fontSize: 12, color: '#57534E', fontWeight: '600' },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#1C1917', borderRadius: 6 },
  saveBtnText: { fontSize: 12, color: '#FFFFFF', fontWeight: '700', textTransform: 'uppercase' },
});