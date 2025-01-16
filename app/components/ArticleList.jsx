"use client"
import React, { useMemo } from 'react';
import ArticleItem from '@/app/components/ArticleItem';
import { useColor } from '../context/ColorContext';
import { useSearch } from '../context/SearchContext';
import { useCategory } from '../context/CategoryContext';
import Masonry from 'react-masonry-css';

const ITEMS_PER_PAGE = 16; // Réduit pour un meilleur chargement initial
const PRELOAD_THRESHOLD = 3; // Nombre de pages à précharger

const breakpointColumns = {
  default: 4,
  1280: 4,
  1024: 3,
  768: 2,
  640: 2
};

const ArticleList = React.memo(({ listPosts }) => {
  const { selectedColor } = useColor();
  const { selectedPeople, selectedOrientation, selectedSort } = useSearch(); // Add selectedOrientation
  const { selectedCategory } = useCategory();

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

  // Render all posts directly
  const displayedPosts = filteredPosts;

  return (
    <>
      {displayedPosts.length === 0 ? (
        <div className="text-center text-gray-500 mt-4">
          No pictures found.
        </div>
      ) : (
        <Masonry
          breakpointCols={breakpointColumns}
          className="flex w-auto px-2 md:px-5"
          columnClassName="bg-clip-padding space-y-6 px-2"
        >
          {displayedPosts.map((item) => (
            <ArticleItem key={item.id} item={item} />
          ))}
        </Masonry>
      )}
    </>
  );
});

ArticleList.displayName = 'ArticleList';
export default ArticleList;
