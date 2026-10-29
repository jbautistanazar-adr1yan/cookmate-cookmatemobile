import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Heart, Clock, Users } from 'lucide-react-native';

const DEFAULT_RECIPE_IMAGE = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600';

export default function RecipeCard({ recipe, onSelect, onToggleFavorite }) {
  const [imageUri, setImageUri] = useState(recipe.image || DEFAULT_RECIPE_IMAGE);

  return (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.8} 
      onPress={() => onSelect(recipe)}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: imageUri }} 
          style={styles.image} 
          onError={() => setImageUri(DEFAULT_RECIPE_IMAGE)}
        />
        <TouchableOpacity 
          style={styles.favoriteBtn} 
          onPress={() => onToggleFavorite(recipe.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Heart 
            size={16} 
            color={recipe.isFavorite ? '#F43F5E' : '#FFFFFF'} 
            fill={recipe.isFavorite ? '#F43F5E' : 'rgba(0,0,0,0.3)'} 
          />
          <Text style={styles.favoriteCountText}>{recipe.favoritesCount || 0}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>{recipe.title}</Text>
          <Text style={styles.categoryBadge}>{recipe.category}</Text>
        </View>

        <Text style={styles.description} numberOfLines={2}>{recipe.description}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Clock size={12} color="#78716C" />
            <Text style={styles.metaText}>{recipe.prepTime} min</Text>
          </View>
          <View style={styles.metaItem}>
            <Users size={12} color="#78716C" />
            <Text style={styles.metaText}>{recipe.servings} servings</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  imageContainer: {
    height: 160,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  favoriteBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  favoriteCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1917',
    flex: 1,
  },
  categoryBadge: {
    fontSize: 9,
    textTransform: 'uppercase',
    backgroundColor: '#F5F5F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    color: '#57534E',
    fontWeight: '600',
  },
  description: {
    fontSize: 12,
    color: '#78716C',
    lineHeight: 16,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#78716C',
  },
});