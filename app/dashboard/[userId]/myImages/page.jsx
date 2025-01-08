'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/app/db/firebaseConfig'
import ArticleList from '@/app/components/ArticleList' // Import ArticleList

export default function MyImages() {
    const { data: session } = useSession()
    const [articles, setArticles] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        async function fetchUserImages() {
            if (!session?.user?.email) return;

            try {
                setLoading(true);
                // Change collection reference to UploadImages
                const uploadImagesRef = collection(db, 'users', session.user.email, 'MyImages');
                const snapshot = await getDocs(uploadImagesRef);
                
                const userImages = snapshot.docs.map(doc => ({
                    ...doc.data(),
                    id: doc.data().postId || doc.id,
                    image: doc.data().image // Make sure to use the correct image field
                }));

                console.log('Found images in MyImages:', userImages.length);
                setArticles(userImages);
            } catch (err) {
                console.error('Error fetching images:', err);
                setError('Failed to load your images');
            } finally {
                setLoading(false);
            }
        }

        fetchUserImages();
    }, [session]);

    // Show loading state while fetching
    if (loading) {
        return <div className="text-center p-4">Loading your images...</div>
    }

    // Show error if any
    if (error) {
        return <div className="text-center text-red-500 p-4">{error}</div>
    }

    // Require authentication
    if (!session) {
        return <div className="text-center p-4">Please sign in to view your images</div>
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-2 mb-6">
                <h1 className="text-2xl font-bold">My Images</h1>
                <span className="bg-black text-white px-3 py-1 rounded-full text-sm">
                    {articles.length}
                </span>
            </div>
            {articles.length === 0 ? (
                <p className="text-center text-gray-500">You haven't posted any images yet</p>
            ) : (
                <ArticleList 
                    listPosts={articles} // Pass articles to ArticleList
                    // Add any additional props if ArticleList requires
                />
            )}
        </div>
    )
}