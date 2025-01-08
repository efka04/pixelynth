'use client'
import { useState } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/app/db/firebaseConfig';
import Papa from 'papaparse'; // You'll need to install this: npm install papaparse

function BulkUploadPage() {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [error, setError] = useState(null);

    const processCSV = async (file) => {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                complete: (results) => resolve(results.data),
                error: (error) => reject(error)
            });
        });
    };

    const downloadImage = async (url) => {
        try {
            // Try different proxy services
            const proxyUrls = [
                `https://corsproxy.io/?${encodeURIComponent(url)}`,
                `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
                `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
            ];

            for (let proxyUrl of proxyUrls) {
                try {
                    console.log(`Trying proxy: ${proxyUrl}`);
                    const response = await fetch(proxyUrl);
                    
                    if (response.ok) {
                        const blob = await response.blob();
                        // Verify we got an image
                        if (blob.type.startsWith('image/')) {
                            console.log('Successfully downloaded image via proxy');
                            return blob;
                        }
                    }
                } catch (proxyError) {
                    console.log(`Proxy attempt failed: ${proxyError.message}`);
                    continue;
                }
            }

            // If all proxies fail, try direct fetch as last resort
            const directResponse = await fetch(url, {
                mode: 'no-cors',
                headers: {
                    'Accept': 'image/*'
                }
            });

            if (directResponse.ok) {
                return await directResponse.blob();
            }

            throw new Error('All download attempts failed');
        } catch (error) {
            console.error('Error downloading image:', error);
            throw new Error(`Failed to fetch image: ${error.message}`);
        }
    };

    const handleFileUpload = async (e) => {
        try {
            const file = e.target.files[0];
            if (!file) return;

            setUploading(true);
            setError(null);
            
            // Parse CSV
            const data = await processCSV(file);
            setProgress({ current: 0, total: data.length });

            // Process each row
            for (let [index, row] of data.entries()) {
                try {
                    console.log(`Processing row ${index + 1}:`, row);
                    
                    // Try to get original resolution URL if it's a WordPress image
                    let sourceUrl = row.Images.trim();
                    if (sourceUrl.includes('wp-content/uploads')) {
                        sourceUrl = sourceUrl.replace(/-\d+x\d+(?=\.[a-z]+$)/i, '');
                    }
                    console.log('Attempting to download:', sourceUrl);
                    
                    // Download image from URL
                    const imageBlob = await downloadImage(sourceUrl);
                    console.log('Image downloaded successfully');
                    
                    // Upload to Firebase Storage
                    const storage = getStorage();
                    const imageRef = ref(storage, `images/${Date.now()}-${row.Name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`);
                    await uploadBytes(imageRef, imageBlob);
                    const downloadUrl = await getDownloadURL(imageRef);  // Changed from imageUrl to downloadUrl

                    // Prepare post data
                    const postData = {
                        title: row.Name,
                        desc: row['Short description'],
                        image: downloadUrl,  // Use downloadUrl here
                        categories: row.Categories.split(',').map(cat => cat.trim()),
                        tags: row.Tags.split(',').map(tag => tag.trim()),
                        userName: 'Pixelynth',
                        userEmail: 'contact@pixelynth.com',
                        timestamp: new Date()
                    };

                    // Add to Firestore
                    await addDoc(collection(db, 'post'), postData);
                    
                    setProgress(prev => ({ ...prev, current: index + 1 }));
                } catch (err) {
                    console.error(`Error processing row ${index + 1}:`, err);
                    setError(`Error processing "${row.Name}": ${err.message}`);
                    // Continue with next row instead of stopping
                    continue;
                }
            }

            alert('Bulk upload completed successfully!');
        } catch (err) {
            console.error('Bulk upload error:', err);
            setError(`Upload failed: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-2xl font-bold mb-4">Bulk Upload Images</h1>
            
            <div className="mb-8">
                <h2 className="text-lg font-semibold mb-2">CSV Format Requirements:</h2>
                <ul className="list-disc ml-6">
                    <li>Name: Image title</li>
                    <li>Short description: Image description</li>
                    <li>Images: URL to the image</li>
                    <li>Categories: Comma-separated categories</li>
                    <li>Tags: Comma-separated tags</li>
                </ul>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                    id="csv-upload"
                />
                <label
                    htmlFor="csv-upload"
                    className={`inline-block px-6 py-3 rounded-lg cursor-pointer
                        ${uploading 
                            ? 'bg-gray-400'
                            : 'bg-black text-white hover:bg-gray-800'}`}
                >
                    {uploading ? 'Uploading...' : 'Select CSV File'}
                </label>
            </div>

            {uploading && (
                <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${(progress.current / progress.total) * 100}%` }}
                        ></div>
                    </div>
                    <p className="text-center mt-2">
                        Processed {progress.current} of {progress.total} images
                    </p>
                </div>
            )}

            {error && (
                <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}
        </div>
    );
}

BulkUploadPage.displayName = 'BulkUploadPage';  // Add display name
export default BulkUploadPage;  // Named export
