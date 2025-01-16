'use client'
import Image from 'next/image';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import UserTag from './UserTag';  // Fixed casing to match actual filename
import { useRouter } from 'next/navigation';
import { MdOutlineFileDownload } from "react-icons/md";
import { FaPlus, FaCheck } from 'react-icons/fa'; // Corrected import path from 'react-icons/fa'
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { app, db } from '@/app/db/firebaseConfig';
import { useSession } from "next-auth/react";
import { toggleFavorite, getFavorites } from '@/app/components/favoriteUtils';
import { addDoc, collection } from 'firebase/firestore';

const BLUR_DATA_URL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4dHRsdHR4dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR3/2wBDABUREREeHR0jIyMeHR0eHR0eHR0eHR0eHR0eHR0eHR0eHR0eHR0eHR0eHR0eHR0eHR0eHR0eHR0eHR0eHR0eHR3/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';

const ArticleItem = React.memo(({ item }) => {
  if (!item || !item.id) {
    return null; // Don't render if no article or no ID
  }

  const [isFavorite, setIsFavorite] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const storage = getStorage(app);
  
  const articleUser = useMemo(() => {
    console.log('Item data:', item); // Add debug log
    return {
      userName: item?.userName,
      name: item?.userName,
      image: item?.userImage,
      email: item?.userEmail
    };
  }, [item?.userName, item?.userImage, item?.userEmail]);

  useEffect(() => {
    let mounted = true;
    
    const checkFavorite = async () => {
      if (!session?.user?.email) return;
      try {
        const favorites = await getFavorites(session.user.email);
        if (mounted) {
          setIsFavorite(favorites.some(fav => fav.articleId === item.id));
        }
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    };
  
    checkFavorite();
    return () => {
      mounted = false;
    };
  }, [session?.user?.email, item.id]);

  const handleFavoriteClick = useCallback(async (e) => {
    e.stopPropagation();
    
    if (!session?.user.email) {
      router.push('/signin');
      return;
    }

    try {
      const result = await toggleFavorite(session.user.email, item.id, {
        title: item.title,
        image: item.image,
        userName: item.userName,
        userImage: item.userImage,
      });
      
      setIsFavorite(result);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }, [session, router, item]);

  const handleDownload = useCallback(async (e) => {
    e.stopPropagation();
    e.preventDefault();

    try {
        // Get a fresh download URL
        const storageRef = ref(storage, item.image);
        const downloadUrl = await getDownloadURL(storageRef);

        // Log download in user history if logged in
        if (session?.user?.email) {
            try {
                const userDownloadsRef = collection(db, 'users', session.user.email, 'downloadHistory');
                await addDoc(userDownloadsRef, {
                    imageUrl: item.image, // Store original path instead of URL
                    title: item.title,
                    timestamp: new Date(),
                    articleId: item.id,
                    userName: item.userName,
                });
            } catch (error) {
                console.error("Error saving download history:", error);
                // Continue with download even if history saving fails
            }
        }

        // Perform the download
        const response = await fetch(downloadUrl);
        if (!response.ok) throw new Error('Download failed');

        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Get filename from path
        const decodedPath = decodeURIComponent(item.image);
        const fileName = decodedPath.split('/').pop().split('?')[0] + '.png';

        // Create download link
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(link);

    } catch (error) {
        console.error("Download error:", error);
        alert("Failed to download image. Please try again.");
    }
}, [item, storage, session?.user?.email]);

  const getJpgUrl = (pngUrl) => {
    if (!pngUrl) return '';
    
    // Extraire le nom du fichier de l'URL PNG
    const filename = pngUrl
      .split('/o/')[1]  // Prendre la partie après /o/
      .split('?')[0]    // Enlever les paramètres
      .split('%2F')[1]  // Prendre le nom après images%2F
      .replace('.png', '');  // Enlever l'extension
      
    // Construire l'URL JPG avec la même structure
    return `https://firebasestorage.googleapis.com/v0/b/pixelynth-c41ea.firebasestorage.app/o/jpg%2F${filename}.jpg?alt=media`;
  }

  return (
    <div className='relative group'>
      {/* Temporarily hidden favorite button
      <button 
        onClick={handleFavoriteClick}
        className={`absolute p-4 text-sm text-white rounded-[10px] z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isFavorite ? 'bg-red-500' : 'bg-black hover:bg-gray-600'} left-[10px] top-[10px]`}
        aria-label={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
      >
        {isFavorite ? <FaCheck /> : <FaPlus />}
      </button>
      */}

      <div
        className='relative before:absolute before:inset-0 before:rounded-3xl before:z-20 hover:before:bg-gray-600/50 before:transition-colors before:duration-300 cursor-pointer'
        onClick={() => router.push("/articles/" + item.id)}
      >
        {item?.image && (
          <>
            <Image
              src={getJpgUrl(item?.image)}
              alt={item?.title || "Image"}
              width={500}
              height={500}
              className='rounded-3xl cursor-pointer z-10'
              quality={60}
              sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {/* Add gradient overlay */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent rounded-b-3xl z-20" />
          </>
        )}
      </div>

      <div className='w-full absolute bottom-[10px] z-30 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300'>
        <div className='flex justify-between items-center px-1 mx-2'>
          <div className='flex-none'>
            <UserTag user={articleUser} color='white' />
          </div>
          <div className='flex-none'>
            <button 
              onClick={handleDownload} 
              className='bg-black hover:bg-gray-600 p-2 sm:p-4 text-sm text-white rounded-[10px]'
            >
              <MdOutlineFileDownload className="w-4 h-4 sm:w-5 sm:h-5"/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

ArticleItem.displayName = 'ArticleItem';
export default ArticleItem;