'use client'
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../db/firebaseConfig';

const SearchContext = createContext();

export function SearchProvider({ children }) {
    const [searchResults, setSearchResults] = useState([]);
    const [selectedPeople, setSelectedPeople] = useState('all');
    const [allPosts, setAllPosts] = useState([]); // Store all posts
    const [isSearching, setIsSearching] = useState(false);
    const [selectedOrientation, setSelectedOrientation] = useState('all');
    const [selectedSort, setSelectedSort] = useState('relevance'); // Make sure this is defined
    const [selectedCategory, setSelectedCategory] = useState(''); // Add selectedCategory state
    const [searchCache, setSearchCache] = useState({}); // Add cache for search results
    const searchTimeout = useRef(null);

    // Fetch all posts initially
    const fetchAllPosts = async () => {
        try {
            const postsRef = collection(db, 'post');
            const querySnapshot = await getDocs(postsRef);
            const posts = [];
            querySnapshot.forEach((doc) => {
                posts.push({ id: doc.id, ...doc.data() });
            });
            setAllPosts(posts);
            setSearchResults(posts);
        } catch (error) {
            console.error('Error fetching posts:', error);
        }
    };

    const checkExactWordMatch = (text, searchTerm) => {
        if (!text) return false;
        const words = text.toLowerCase().split(/\s+/);
        return words.includes(searchTerm.toLowerCase());
    };

    const performSearch = async (searchTerm = '', category = '') => {
        const trimmedSearchTerm = searchTerm.trim(); // Trim the search term

        // Don't set loading state for empty searches
        if (!trimmedSearchTerm) {
            setSearchResults(allPosts);
            setIsSearching(false);
            return;
        }

        const cacheKey = `${trimmedSearchTerm}-${category}`; // Use trimmed search term for cache key
        if (searchCache[cacheKey]) {
            setSearchResults(searchCache[cacheKey]);
            return;
        }

        setIsSearching(true);
        try {
            // Clear previous timeout
            if (searchTimeout.current) {
                clearTimeout(searchTimeout.current);
            }

            // Set new timeout
            searchTimeout.current = setTimeout(async () => {
                const searchTerms = trimmedSearchTerm.toLowerCase().split(' ').filter(term => term);

                const results = allPosts.filter(post => {
                    const title = post.title || '';
                    const desc = post.desc || '';
                    const tags = post.tags || [];

                    const categoryMatch = category === 'all' || 
                        !category || 
                        post.categories?.includes(category) || 
                        post.category === category;
                    const orientationMatch = selectedOrientation === 'all' ? true : 
                        post.orientation === selectedOrientation;

                    // Check if all search terms are exact matches in title, desc, or tags
                    const allTermsMatch = searchTerms.every(term => 
                        checkExactWordMatch(title, term) || 
                        checkExactWordMatch(desc, term) || 
                        tags.some(tag => checkExactWordMatch(tag, term))
                    );

                    return allTermsMatch && categoryMatch && orientationMatch;
                });

                setSearchCache(prev => ({
                    ...prev,
                    [cacheKey]: results
                }));
                setSearchResults(results);
                setIsSearching(false);
            }, 300); // Debounce time

        } catch (error) {
            console.error('Search error:', error);
            setSearchResults([]);
            setIsSearching(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchAllPosts();
    }, []);

    // Re-run search when people filter changes
    useEffect(() => {
        performSearch();
    }, [selectedPeople, selectedOrientation, selectedSort, selectedCategory]);

    useEffect(() => {
        return () => {
            if (searchTimeout.current) {
                clearTimeout(searchTimeout.current);
            }
        };
    }, []);

    const value = {
        searchResults,
        performSearch,
        selectedPeople,
        setSelectedPeople,
        allPosts,
        isSearching,
        selectedOrientation,
        setSelectedOrientation,
        selectedSort,
        setSelectedSort, // Make sure this is included
        selectedCategory,
        setSelectedCategory, // Add setSelectedCategory to context value
    };

    return (
        <SearchContext.Provider value={value}>
            {children}
        </SearchContext.Provider>
    );
}

export const useSearch = () => {
    const context = useContext(SearchContext);
    if (!context) {
        throw new Error('useSearch must be used within a SearchProvider');
    }
    return context;
};