'use client'
import { IoSearchOutline } from "react-icons/io5";
import { FaPlus, FaHeart, FaUser, FaImage, FaSignOutAlt, FaUpload, FaChevronLeft, FaChevronRight, FaTimes, FaClock } from "react-icons/fa"; // Replaced FaRightFromBracket with FaSignOutAlt
import { FiSettings } from "react-icons/fi";
import { IoIosArrowDown, IoIosNotifications } from "react-icons/io";
import Logo from "../../public/logo-pixelynth.svg";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import { doc, getDoc, getFirestore, setDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore"; // Add getDoc import
import { app, db } from '@/app/db/firebaseConfig';
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { categories, colors } from '@/app/utils/constants';
import { useCategory } from '../context/CategoryContext';
import { useSearch } from '../context/SearchContext';
import { useColor } from '../context/ColorContext';
import { getAuth, onAuthStateChanged } from "firebase/auth"; // Import Firebase Auth
import { AiOutlineClose } from "react-icons/ai"; // Import AiOutlineClose for a thinner cross

export default function Header() {
    const { performSearch, isSearching } = useSearch();
    const [searchTerm, setSearchTerm] = useState('');
    const { selectedCategory, setSelectedCategory } = useCategory();
    const { data: session } = useSession();
    const router = useRouter();
    const { selectedColor } = useColor();
    const categoriesRef = useRef(null);
    const [isAdmin, setIsAdmin] = useState(false); // State to track if user is admin

    const debouncedSearch = useCallback(
        async (value, category) => {
            if (value === searchTerm) {
                try {
                    await performSearch(value, category);
                } catch (error) {
                    console.error('Search failed:', error);
                }
            }
        },
        [searchTerm, performSearch]
    );

    useEffect(() => {
        const timer = setTimeout(() => debouncedSearch(searchTerm, selectedCategory), 300);
        return () => clearTimeout(timer);
    }, [searchTerm, debouncedSearch, selectedCategory]);

    useEffect(() => {
        const checkAdmin = async () => {
            const auth = getAuth(app); // Initialize Auth with the Firebase app
            onAuthStateChanged(auth, async (user) => {
                if (user) {
                    const idTokenResult = await user.getIdTokenResult();
                    if (idTokenResult.claims.admin) {
                        setIsAdmin(true);
                    }
                }
            });
        };
        checkAdmin();
    }, []);

    const handleSearch = useCallback((value) => {
        setSearchTerm(value);
        // Only search if there are 2 or more characters, or if clearing the search
        if (value.length >= 2 || value === '') {
            performSearch(value, selectedCategory);
        }
    }, [performSearch, selectedCategory]);

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form submitted with:', searchTerm, selectedCategory); // Debug log
        performSearch(searchTerm, selectedCategory); // Pass selectedCategory
    };

    const handleCategoryClick = (category) => {
        setSelectedCategory(category === 'All Categories' ? 'all' : category);
        debouncedSearch(searchTerm, category === 'All Categories' ? 'all' : category);
    };

    const saveUserInfo = async () => {
        if (session && session.user && session.user.email) {
            await setDoc(doc(db, "user", session.user.email), {
                userName: session.user.name,
                userEmail: session.user.email,
                userImage: session.user.image,
            });
        }
    };

    const onCreateClick = async () => {
        try {
            await router.push('/articles/new');
        } catch (error) {
            console.error("Navigation error:", error);
        }
    };

    const handleSettingsClick = () => {
        if (session?.user?.email) {
            router.push(`/dashboard/${session.user.email}/settings`);
        }
    };

    const renderUserImage = () => {
        const userImage = session?.user?.image || '/default-avatar.jpg';
        if (!userImage) {
            return (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <FaUser className="text-gray-400" />
                </div>
            );
        }
        return (
            <Image 
                width={40}
                height={40}
                className="rounded-full"
                src={userImage}
                alt="User profile"
                unoptimized={true} // Add this line to avoid optimization issues
                onError={(e) => {
                    e.target.src = '/default-avatar.png';
                }}
            />
        );
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

    return (
        <header className="bg-white shadow-sm sticky top-0 z-50">
            <nav className="max-w-7xl mx-auto bg-white">
                <div className="flex flex-col">
                    <div className='flex gap-2 md:gap-4 items-center p-4'>
                        <button onClick={() => router.push('/')} className="flex items-center gap-2">
                            <span className="font-bold text-black md:text-xl">Pixelynth</span>
                        </button>
                        <div className="flex items-center gap-4 flex-grow">
                            <form onSubmit={handleSubmit} 
                                                        className="w-[180px]  sm:w-full"  // Smaller on mobile, larger on small screens
>
                                <div className="bg-gray-200 transition-all rounded-full p-2 flex items-center gap-3 w-full md:hover:bg-gray-300">
                                    <IoSearchOutline className="text-3xl text-gray-500" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        placeholder="Search..."
                                        className="bg-transparent outline-none w-full"
                                    />
                                    {isSearching && searchTerm.length >= 2 && (
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 border-t-transparent"/>
                                    )}
                                    {searchTerm && (
                                        <button
                                            type="button"
                                            onClick={() => handleSearch('')}
                                            className="text-gray-500 hover:text-gray-700 focus:outline-none"
                                            aria-label="Clear search"
                                        >
                                            <AiOutlineClose className="text-3xl" /> {/* Replaced FaTimes with AiOutlineClose and matched size */}
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>

                        {session?.user ? (
                            <div className="flex items-center gap-3">
                                <div className="relative group">
                                <button className="rounded-full">
                                    {renderUserImage()}
                                </button>

                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 invisible 
                                                    group-hover:visible opacity-0 group-hover:opacity-100 
                                                    transition-all duration-300 transform translate-y-1 
                                                    group-hover:translate-y-0">
                                        <Link
                                            href={`/dashboard/${session.user.email}/favorites`}
                                            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
                                        >
                                            <FaHeart className="text-gray-500" />
                                            <span>Favorites</span>
                                        </Link>
                                        <Link
                                            href={`/dashboard/${session.user.email}/downloadHistory`}
                                            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
                                        >
                                            <FaClock className="text-gray-500" /> {/* Replaced FaClockRotateLeft with FaClock */}
                                            <span>Download History</span>
                                        </Link>
                                        <Link
                                            href={`/dashboard/${session.user.email}/myImages`}
                                            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
                                        >
                                            <FaImage className="text-gray-500" />
                                            <span>My Images</span>
                                        </Link>
                                        {session.user.email === 'contact@pixelynth.com' && (
                                            <Link
                                                href={`/dashboard/${session.user.email}/admin`}
                                                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
                                            >
                                                <FaUser className="text-gray-500" />
                                                <span>Admin</span>
                                            </Link>
                                        )}
                                        {session.user.email === 'contact@pixelynth.com' && (
                                            <Link
                                                href={`/dashboard/${session.user.email}/bulk-upload`}
                                                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
                                            >
                                                <FaUpload className="text-gray-500" />
                                                <span>Bulk Upload</span>
                                            </Link>
                                        )}
                                        <button
                                            onClick={handleSettingsClick}
                                            className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
                                        >
                                            <FiSettings className="text-gray-500" />
                                            <span>Settings</span>
                                        </button>
                                        <button
                                            onClick={() => signOut()}
                                            className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-red-500"
                                        >
                                            <FaSignOutAlt />
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onCreateClick()}
                                    className="bg-black hover:bg-red-900 p-4 text-3xl text-sm text-white rounded-full"
                                >
                                    <FaPlus />
                                </button>
                            </div>
                        ) : null}
                    </div>   
                </div>
            </nav>
        </header>
    )
}