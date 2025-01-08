"use client"
import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import ArticleItem from '@/app/components/ArticleItem';
import { useColor } from '../context/ColorContext';
import { useSearch } from '../context/SearchContext';
import { useCategory } from '../context/CategoryContext';

const ITEMS_PER_PAGE = 24; // Increased from 12 to 24
const PRELOAD_THRESHOLD = 0.5; // Start loading when 50% of the way through current items

const ArticleList = React.memo(({ listPosts }) => {
  const { selectedColor } = useColor();
  const { selectedPeople, selectedSort } = useSearch();
  const { selectedCategory } = useCategory();
  const [displayedPosts, setDisplayedPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef(null);

  const filteredPosts = useMemo(() => {
    let posts = [...listPosts].filter(post => {
      const colorMatch = selectedColor ? post.color === selectedColor : true;
      const peopleCount = post.peopleCount || post.numberOfPeople || post.people;
      const peopleMatch = selectedPeople === 'all' ? true : String(peopleCount) === selectedPeople;
      const categoryMatch = !selectedCategory ? true : post.category === selectedCategory;
      return colorMatch && peopleMatch && categoryMatch;
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
  }, [listPosts, selectedColor, selectedPeople, selectedSort, selectedCategory]);

  // Modify loadMorePosts to load two pages worth of posts at once
  const loadMorePosts = useCallback(() => {
    const nextPosts = filteredPosts.slice(0, page * ITEMS_PER_PAGE);
    setDisplayedPosts(prevPosts => {
      // Remove duplicates when adding new posts
      const newPosts = [...new Set([...prevPosts, ...nextPosts])];
      return newPosts;
    });
    setHasMore(nextPosts.length < filteredPosts.length);
  }, [filteredPosts, page]);

  // Observer with earlier trigger point
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore) {
          // Load next page earlier
          setPage(prev => prev + 2); // Increment by 2 to load more content at once
        }
      },
      { 
        threshold: PRELOAD_THRESHOLD,
        rootMargin: '500px' // Start loading 500px before reaching the end
      }
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
      <div className='mt-7 px-2 md:px-5 columns-2 md:columns-3 lg:columns-4 mb-4 xl:columns-4 space-y-6 mx-auto'>
        {displayedPosts.map(item => (
          <ArticleItem key={item.id} item={item} />
        ))}
      </div>
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
