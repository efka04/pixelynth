'use client'
import { useEffect, useState, useRef } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'; // Add this import
import ArticleList from '@/app/components/ArticleList';
import { useSearch } from './context/SearchContext';
import ColorSelector from './components/ColorSelector';
import SortPeople from './components/SortPeople';
import { useColor } from './context/ColorContext';
import SortOrientation from './components/SortOrientation';
import { categories } from '@/app/utils/constants';
import { useCategory } from './context/CategoryContext';

export default function Home() {
    const { 
        searchResults, 
        performSearch, 
        selectedPeople, 
        setSelectedPeople,
        selectedOrientation,
        setSelectedOrientation,
        selectedSort,
        setSelectedSort 
    } = useSearch();
    const { setSelectedColor } = useColor();
    const { selectedCategory, setSelectedCategory } = useCategory();
    const categoriesRef = useRef(null);

    const handleClearFilters = () => {
        setSelectedPeople('all');
        setSelectedColor('');
        setSelectedOrientation('all');
        setSelectedSort('relevance');
    };

    const handleSort = (value) => {
        console.log('Sorting by:', value); // Debug log
        setSelectedSort(value);
    };

    const scroll = (direction) => {
        if (categoriesRef.current) {
            const scrollAmount = 200;
            categoriesRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        performSearch();
    }, []);

    useEffect(() => {
        performSearch();
    }, [selectedCategory]); // Add selectedCategory as dependency

    useEffect(() => {
        console.log('Current people filter:', selectedPeople); // Debug log
    }, [selectedPeople]);

    const handleCategoryClick = (category) => {
        setSelectedCategory(category);
    };

    return (
        <main className="min-h-screen p-4 md:p-2">
            <div className="max-w-7xl mx-auto">
                <div className="relative bg-white mb-4">
                    <button 
                        onClick={() => scroll('left')}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-gradient-to-r from-white to-transparent w-5"
                    >
                        <FaChevronLeft className="text-xl -translate-x-1" />
                    </button>
                    
                    <div 
                        ref={categoriesRef}
                        className="overflow-x-auto whitespace-nowrap py-2 px-6 bg-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                    >
                        <div className="flex gap-4">
                            <button
                                onClick={() => handleCategoryClick('')}
                                className={`px-4 py-1 rounded-full transition-all ${
                                    !selectedCategory 
                                        ? 'bg-black text-white' 
                                        : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                            >
                                All
                            </button>
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => handleCategoryClick(cat)}
                                    className={`px-4 py-1 rounded-full transition-all ${
                                        selectedCategory === cat 
                                            ? 'bg-black text-white' 
                                            : 'bg-white border-[1px] border-black hover:bg-black hover:text-white'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>  
                    </div>

                    <button
                        onClick={() => scroll('right')}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gradient-to-r from-transparent to-white h-9 w-16"
                    >
                        <FaChevronRight className="text-xl translate-x-10" />
                    </button>
                </div>

                {/* Separator Line */}
                <div className="w-full h-px bg-gray-200 mb-4"></div>

                {/* Sort Buttons - Added sticky positioning */}
                <div className="translate-x-5 sticky top-[78px] bg-white z-40 py-2 px-2 hidden sm:block"> {/* Added sticky positioning */}
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-22 translate-y-1">
                                <ColorSelector />
                            </div>
                            <div className="flex items-center gap-2">
                                <SortPeople 
                                    selectedPeople={selectedPeople}
                                    onPeopleChange={setSelectedPeople}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <SortOrientation 
                                    selectedOrientation={selectedOrientation}
                                    onOrientationChange={setSelectedOrientation}
                                />
                            </div>
                            {/* Removed SortBy component */}
                            <button
                                onClick={handleClearFilters}
                                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>

                <ArticleList 
                    listPosts={searchResults}
                    selectedPeople={selectedPeople}
                />
            </div>
        </main>
    );
}