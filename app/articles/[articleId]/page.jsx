'use client'
import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { FaEdit, FaHeart, FaRegHeart } from 'react-icons/fa' // Replace FaPlus and FaCheck with FaHeart and FaRegHeart
import ArticleImage from '../../components/ArticleImage'
import ArticleInfo from '../../components/ArticleInfo'
import { doc, getDoc } from 'firebase/firestore'
import { useRouter, useParams } from 'next/navigation'
import { HiArrowSmallLeft } from 'react-icons/hi2'
import { app, db } from '@/app/db/firebaseConfig'
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { addDoc, collection, query, where, getDocs, deleteDoc, limit } from 'firebase/firestore'; // Import Firestore query functions
import ArticleList from '@/app/components/ArticleList';

export default function ArticlePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const [articleDetails, setArticleDetails] = useState(null)
  const [isFavorite, setIsFavorite] = useState(false); // Track favorite status
  const [morePosts, setMorePosts] = useState([]);
  const storage = getStorage(app);

  useEffect(() => {
    if (params.articleId) {
      getPostDetails()
    }
  }, [params.articleId])

  useEffect(() => {
    if (params.articleId && session?.user?.email) {
      checkIfFavorite();
    }
  }, [params.articleId, session?.user?.email]);

  useEffect(() => {
    if (articleDetails?.category) {
      fetchMorePosts();
    }
  }, [articleDetails]);

  const getPostDetails = async () => {
    try {
      const docRef = doc(db, 'post', params.articleId)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setArticleDetails(docSnap.data())
      } else {
        console.log("No such document!")
      }
    } catch (error) {
      console.error("Error fetching document:", error)
    }
  }

  const checkIfFavorite = async () => {
    try {
      const favoritesRef = collection(db, 'users', session.user.email, 'favorites');
      const favQuery = query(favoritesRef, where('articleId', '==', params.articleId));
      const querySnapshot = await getDocs(favQuery);
      if (!querySnapshot.empty) {
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Error checking favorite status:", error);
    }
  };

  const fetchMorePosts = async () => {
    try {
      const postsRef = collection(db, 'post');
      const q = query(
        postsRef,
        where('category', '==', articleDetails.category), // Filter by same category
        where('__name__', '!=', params.articleId), // Exclude current article
        limit(20)
      );
      
      const querySnapshot = await getDocs(q);
      const posts = [];
      querySnapshot.forEach((doc) => {
        posts.push({ id: doc.id, ...doc.data() });
      });
      setMorePosts(posts);
    } catch (error) {
      console.error('Error fetching more posts:', error);
    }
  };

  const handleEdit = () => {
    router.push(`/articles/${params.articleId}/edit`)
  }

  const handleDownload = async (e) => {
    e.stopPropagation();
    try {
      // Get the download URL
      const storageRef = ref(storage, articleDetails.image);
      const downloadUrl = await getDownloadURL(storageRef);
      
      // Conditionally create user-specific download history collection
      if (session?.user?.email) {
        const userDownloadsRef = collection(db, 'users', session.user.email, 'downloadHistory');
        
        // Save download record
        await addDoc(userDownloadsRef, {
          imageUrl: downloadUrl,
          title: articleDetails.title,
          timestamp: new Date(),
          articleId: params.articleId,
          userName: articleDetails.userName,
        });

        console.log("Download saved to user's history");
      }

      // Download logic
      const xhr = new XMLHttpRequest();
      xhr.responseType = 'blob';
      xhr.onload = function(event) {
        const blob = xhr.response;
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        
        // Decode the URL and extract the file name
        const decodedPath = decodeURIComponent(articleDetails.image);
        const fileName = decodedPath.split('/').pop().split('?')[0] + '.png';
        
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      };
      xhr.open('GET', downloadUrl);
      xhr.send();
    } catch (error) {
      console.error("Error during download:", error);
    }
  };

  const handleAddFavorite = async (e) => {
    e.stopPropagation();
    if (!session?.user?.email) {
      router.push('/signin');
      return;
    }
    try {
      if (isFavorite) {
        // Remove from favorites
        const favoritesRef = collection(db, 'users', session.user.email, 'favorites');
        const favQuery = query(favoritesRef, where('articleId', '==', params.articleId));
        const favSnapshot = await getDocs(favQuery);
        favSnapshot.forEach(doc => {
          deleteDoc(doc.ref);
        });
        setIsFavorite(false);
        console.log("Article removed from favorites");
      } else {
        // Add to favorites
        const favoritesRef = collection(db, 'users', session.user.email, 'favorites');
        await addDoc(favoritesRef, {
          articleId: params.articleId,
          title: articleDetails.title,
          image: articleDetails.image,
          userName: articleDetails.userName,
          userImage: articleDetails.userImage,
        });
        setIsFavorite(true);
        console.log("Article added to favorites");
      }
    } catch (error) {
      console.error("Error toggling favorites:", error);
    }
  };

  if (!articleDetails) return <div>Loading...</div>

  return (
    <div className='bg-white min-h-screen p-4 md:p-8 max-w-7xl mx-auto'> {/* Reduced padding and set max width */}
      <div className='flex justify-between items-center mb-4'> {/* Reduced bottom margin */}
        <button onClick={() => router.back()} className='flex gap-2 items-center hover:bg-gray-100 p-2 rounded-lg'>
          <HiArrowSmallLeft className='text-2xl' />
          <span>Back</span>
        </button>
        <div className='flex gap-2'> {/* Reduced gap */}
          {session?.user?.email === articleDetails?.userEmail && (
            <button 
              onClick={handleEdit}
              className='bg-black text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 flex items-center gap-2'
            >
              <FaEdit />
              <span>Modify</span>
            </button>
          )}
        </div>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'> {/* Reduced gap */}
        <ArticleImage articleId={params.articleId} articleDetails={articleDetails} />
        <div className='flex flex-col'>
          <ArticleInfo articleDetails={articleDetails} />
          <div className='mt-3 flex gap-2'> {/* Reduced top margin and gap */}
             <button 
              onClick={handleDownload} 
              className='bg-black hover:bg-gray-600 px-3 py-2 text-sm text-white rounded-lg'
            >
              Download Image
            </button>
            {/*<button 
              onClick={handleAddFavorite} 
              className={`px-3 py-2 text-sm text-white rounded-lg ${isFavorite ? 'bg-red-500' : 'bg-black hover:bg-gray-600'}`}
              aria-label={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
            >
              {isFavorite ? <FaHeart /> : <FaRegHeart />}
            </button>]*/}

          </div>
        </div>
      </div>
      {/* Similar Articles Section */}
      <div className='mt-16 mb-8'>
        <h2 className='text-2xl font-bold mb-8'>More Articles</h2>
        <div className='w-full'>
          <ArticleList 
            listPosts={morePosts}
          />
        </div>
      </div>
    </div>
  )
}