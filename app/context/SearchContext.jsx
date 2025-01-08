'use client'
import { createContext, useContext, useState, useEffect } from 'react';
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

    const performSearch = async (searchTerm = '') => {
        setIsSearching(true);
        try {
            let filtered = [...allPosts];

            // Debug log for first post
            if (filtered.length > 0) {
                console.log('First post data:', {
                    ...filtered[0],
                    keys: Object.keys(filtered[0])
                });
            }

            // Apply category filter first
            if (selectedCategory) {
                filtered = filtered.filter(post => post.category === selectedCategory);
            }

            // Apply orientation filter
            if (selectedOrientation !== 'all') {
                filtered = filtered.filter(post => post.orientation === selectedOrientation);
            }

            if (selectedPeople !== 'all') {
                filtered = filtered.filter(post => {
                    const peopleCount = post.peopleCount || post.numberOfPeople || post.people;
                    return String(peopleCount) === selectedPeople;
                });
            }

            if (searchTerm.trim()) {
                filtered = filtered.filter(post => {
                    const descMatch = String(post.desc || '').toLowerCase().includes(searchTerm.toLowerCase());
                    const titleMatch = String(post.title || '').toLowerCase().includes(searchTerm.toLowerCase());
                    return descMatch || titleMatch;
                });
            }

            // Apply sorting
            switch (selectedSort) {
                case 'popular':
                    filtered.sort((a, b) => (b.favoriteCount || 0) - (a.favoriteCount || 0));
                    break;
                case 'newest':
                    filtered.sort((a, b) => b.createdAt - a.createdAt);
                    break;
                default: // 'relevance'
                    // Keep default order or implement relevance logic
                    break;
            }

            setSearchResults(filtered);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
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