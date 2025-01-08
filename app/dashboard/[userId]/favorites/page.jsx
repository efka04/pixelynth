"use client"
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getFavorites } from '@/app/components/favoriteUtils';
import ArticleItem from '@/app/components/ArticleItem';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!session?.user?.email) return;
      setLoading(true);
      try {
        const userFavorites = await getFavorites(session.user.email);
        console.log('Raw favorites data:', userFavorites); // Debug log
        if (userFavorites && Array.isArray(userFavorites)) {
          // Transform data to match ArticleItem requirements
          const transformedFavorites = userFavorites.map(fav => ({
            id: fav.articleId,
            title: fav.title,
            image: fav.image,
            userName: fav.userName,
            userImage: fav.userImage,
            ...fav
          }));
          console.log('Transformed favorites:', transformedFavorites); // Debug log
          setFavorites(transformedFavorites);
        }
      } catch (error) {
        console.error('Error fetching favorites:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [session?.user?.email]);

  if (!session?.user?.email) return null;
  if (loading) return <div>Loading favorites...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">My Favorites ({favorites.length})</h1>
      <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
        {favorites.length > 0 ? (
          favorites.map((favorite) => (
            <div key={favorite.id} className="mb-4 break-inside-avoid">
              <ArticleItem item={favorite} />
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500">
            No favorites yet
          </div>
        )}
      </div>
    </div>
  );
}