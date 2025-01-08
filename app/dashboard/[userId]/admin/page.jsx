'use client'
import { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import { db } from '@/app/db/firebaseConfig';
import Image from 'next/image';
import { FaTimes } from 'react-icons/fa';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function AdminDashboard() {
    const { userId } = useParams();
    const [images, setImages] = useState([]);
    const [selectedImages, setSelectedImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                setLoading(true);
                const postsSnapshot = await getDocs(collection(db, 'post'));
                console.log('Raw posts data:', postsSnapshot.docs.map(doc => doc.data()));

                const postsData = postsSnapshot.docs.map(doc => {
                    const data = doc.data();
                    console.log('Processing document:', doc.id, data);
                    
                    // Check all possible image URL fields
                    const imageURL = data.imageURL || data.url || data.downloadURL || data.image;
                    console.log('Found imageURL:', imageURL);

                    return {
                        id: doc.id,
                        imageURL: imageURL,
                        title: data.title || 'Untitled',
                        userEmail: data.userEmail || 'Unknown user',
                        timestamp: data.timestamp?.toDate?.() || new Date(),
                    };
                });

                console.log('Processed posts before filter:', postsData);
                const filteredPosts = postsData.filter(post => {
                    const hasImage = Boolean(post.imageURL);
                    console.log(`Post ${post.id} has image: ${hasImage}, URL: ${post.imageURL}`);
                    return hasImage;
                });

                console.log('Final filtered posts:', filteredPosts);
                setImages(filteredPosts);
            } catch (err) {
                console.error('Error fetching posts:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, []);

    const handleDelete = async (id, imageURL) => {
        try {
            // Delete from Firestore post collection
            await deleteDoc(doc(db, 'post', id));

            // Delete from Firebase Storage using the image URL
            const storage = getStorage();
            
            // Remove the gs:// prefix if present and decode the URL
            const cleanImageURL = imageURL.replace('gs://', '').split('?')[0];
            const fileRef = ref(storage, cleanImageURL);
            
            try {
                await deleteObject(fileRef);
                console.log('Image deleted from storage');
            } catch (storageError) {
                console.error('Error deleting from storage:', storageError);
                // Continue even if storage deletion fails
            }

            // Update UI
            setImages(prevImages => prevImages.filter(img => img.id !== id));
            console.log('Document and image deleted successfully');

        } catch (err) {
            console.error('Error deleting:', err);
            setError('Failed to delete: ' + err.message);
        }
    };

    const handleSelect = (id) => {
        setSelectedImages(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleDeleteSelected = async () => {
        try {
            for (const id of selectedImages) {
                const image = images.find(img => img.id === id);
                if (image?.imageURL) {
                    await handleDelete(id, image.imageURL);
                }
            }
            setSelectedImages([]);
        } catch (err) {
            console.error('Bulk delete failed:', err);
            setError(err.message);
        }
    };

    if (loading) return <div className="text-center p-4">Loading...</div>;
    if (error) return <div className="text-red-500 text-center p-4">Error: {error}</div>;

    return (
        <div className="container mx-auto p-4">
            <div className="mb-4">
                <Link href={`/dashboard/${userId}/admin`}>Admin</Link>
                <span className="mx-2">|</span>
                <Link href={`/dashboard/${userId}/admin/upload`}>Upload</Link>
            </div>
            <h1 className="text-2xl font-bold mb-4">Admin Dashboard ({images.length} images)</h1>
            {selectedImages.length > 0 && (
                <button 
                    onClick={handleDeleteSelected} 
                    className="bg-red-500 text-white px-4 py-2 rounded mb-4"
                >
                    Delete Selected ({selectedImages.length})
                </button>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {images.map(image => (
                    <div key={image.id} className="relative group bg-gray-100 rounded-lg p-2">
                        <input 
                            type="checkbox" 
                            checked={selectedImages.includes(image.id)} 
                            onChange={() => handleSelect(image.id)} 
                            className="absolute top-4 left-4 z-10 w-4 h-4"
                        />
                        <div className="relative aspect-square">
                            <Image 
                                src={image.imageURL}
                                alt={image.title}
                                fill
                                style={{ objectFit: 'cover' }}
                                className={`rounded-lg ${
                                    selectedImages.includes(image.id) ? 'border-4 border-blue-500' : ''
                                }`}
                            />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-50 text-white text-xs">
                            <p className="font-bold truncate">{image.title}</p>
                            <p className="truncate">{image.userEmail}</p>
                            <p className="text-gray-300">{new Date(image.timestamp).toLocaleDateString()}</p>
                        </div>
                        <button 
                            onClick={() => handleDelete(image.id, image.imageURL)}
                            className="absolute top-4 right-4 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <FaTimes />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
