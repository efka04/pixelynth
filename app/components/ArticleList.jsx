"use client"
import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import ArticleItem from '@/app/components/ArticleItem';
import { useColor } from '../context/ColorContext';
import { useSearch } from '../context/SearchContext';
import { useCategory } from '../context/CategoryContext';

const ITEMS_PER_PAGE = 8; // Réduit pour un meilleur chargement initial
const PRELOAD_THRESHOLD = 2; // Nombre de pages à précharger

const ArticleList = React.memo(({ listPosts }) => {
  const { selectedColor } = useColor();
  const { selectedPeople, selectedOrientation, selectedSort } = useSearch(); // Add selectedOrientation
  const { selectedCategory } = useCategory();
  const [displayedPosts, setDisplayedPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef(null);
  const [isPreloading, setIsPreloading] = useState(false);

  const filteredPosts = useMemo(() => {
    let posts = [...listPosts].filter(post => {
      const colorMatch = selectedColor ? post.color === selectedColor : true;
      const peopleCount = post.peopleCount || post.numberOfPeople || post.people;
      const peopleMatch = selectedPeople === 'all' ? true : String(peopleCount) === selectedPeople;
      const categoryMatch = !selectedCategory ? true : post.category === selectedCategory;
      const orientationMatch = selectedOrientation === 'all' ? true : post.orientation === selectedOrientation;

      return colorMatch && peopleMatch && categoryMatch && orientationMatch;
    });

    // Apply sorting
    switch (selectedSort) {
      case 'popular':
        return posts.sort((a, b) => (b.favoriteCount || 0) - (a.favoriteCount || 0));
      case 'newest':
        return posts.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
          return dateB - dateA;
        });
      default:
        return posts;
    }
  }, [listPosts, selectedColor, selectedPeople, selectedSort, selectedCategory, selectedOrientation]); // Add selectedOrientation to dependencies

  const preloadNextPage = useCallback(() => {
    if (isPreloading) return;
    setIsPreloading(true);
    
    const nextPageItems = filteredPosts.slice(
      displayedPosts.length,
      displayedPosts.length + ITEMS_PER_PAGE * PRELOAD_THRESHOLD
    );
    
    // Précharger les images
    nextPageItems.forEach(item => {
      const img = new Image();
      img.src = item.image.replace('/images/', '/jpg/').replace('.png', '.jpg');
    });
    
    setIsPreloading(false);
  }, [filteredPosts, displayedPosts.length, isPreloading]);

  const loadMorePosts = useCallback(() => {
    const nextPosts = filteredPosts.slice(0, page * ITEMS_PER_PAGE);
    setDisplayedPosts(nextPosts);
    setHasMore(nextPosts.length < filteredPosts.length);
    
    // Précharger la prochaine page
    if (hasMore) {
      preloadNextPage();
    }
  }, [filteredPosts, page, hasMore, preloadNextPage]);

  // Observer avec threshold plus élevé pour un chargement plus anticipé
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.5, rootMargin: '100px' }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
    setDisplayedPosts([]);
  }, [selectedColor, selectedPeople, selectedCategory, selectedSort]);

  // Load posts when page changes
  useEffect(() => {
    loadMorePosts();
  }, [loadMorePosts, page]);

  return (
    <>
      {displayedPosts.length === 0 ? (
        <div className="text-center text-gray-500 mt-4">
          No pictures found.
        </div>
      ) : (
        <div className='mt-7 px-2 md:px-5 columns-2 md:columns-3 lg:columns-4 mb-4 xl:columns-4 space-y-6 mx-auto'>
          {displayedPosts.map((item, index) => (
            <ArticleItem 
              key={item.id} 
              item={item}
              priority={index < ITEMS_PER_PAGE} // Priorité aux premières images
            />
          ))}
        </div>
      )}
      {hasMore && (
        <div ref={observerTarget} className="h-10 w-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-500 border-t-transparent" />
        </div>
      )}
    </>
  );
});

ArticleList.displayName = 'ArticleList';
export default ArticleList;
