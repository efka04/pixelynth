"use client"
import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react'
import UploadImage from '@/app/components/uploadImage'
import { useSession } from "next-auth/react"
import { getDownloadURL, getStorage, ref as storageRef, uploadBytes } from "firebase/storage" // Alias ref to storageRef
import { app, db } from '@/app/db/firebaseConfig'
import { doc, getFirestore, setDoc, addDoc, collection } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import NextImage from 'next/image' // Renamed import to avoid conflict
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { FaHeart, FaChevronDown } from 'react-icons/fa'
import { categories } from '@/app/utils/constants';
import { IoImageOutline, IoPhonePortrait, IoPhoneLandscape, IoClose } from 'react-icons/io5'
import { BiHorizontalCenter, BiVerticalCenter } from 'react-icons/bi'
import { BsPerson, BsPeople, BsPersonFill, BsPeopleFill } from 'react-icons/bs'
import { IoMdMore } from 'react-icons/io'
import { RiLayoutRowLine, RiLayoutColumnLine, RiLayoutGridLine } from 'react-icons/ri'

const colors = [
    { name: 'Black & White', value: 'blackwhite', hex: 'linear-gradient(45deg, #000000 50%, #FFFFFF 50%)' },
    { name: 'Red', value: 'red', hex: '#FF0000' },
    { name: 'Blue', value: 'blue', hex: '#0066FF' },
    { name: 'Green', value: 'green', hex: '#00CC00' },
    { name: 'Yellow', value: 'yellow', hex: '#FFD700' },
    { name: 'Purple', value: 'violet', hex: '#8A2BE2' },
    { name: 'Orange', value: 'orange', hex: '#FF6600' },
    { name: 'Pink', value: 'pink', hex: '#FF1493' },
    { name: 'Brown', value: 'brown', hex: '#8B4513' },
    { name: 'All Colors', value: 'all', hex: 'linear-gradient(45deg, #FF0000, #FF6600, #FFD700, #00CC00, #0066FF, #8A2BE2)' }
]

const Form = forwardRef(({ initialFile = null, onClose, isBulkUpload = false, isEditing = false, existingData = null }, ref) => {
    const { data: session } = useSession();
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedColor, setSelectedColor] = useState('white');
    const [orientation, setOrientation] = useState('horizontal');
    const [tags, setTags] = useState([]);
    const [currentTag, setCurrentTag] = useState('');
    const [peopleCount, setPeopleCount] = useState(0);
    const [errors, setErrors] = useState([]);
    const [preview, setPreview] = useState(null);
    const [successMessage, setSuccessMessage] = useState(''); // New state for success message

    const router = useRouter();
    const storage = getStorage(app)

    useEffect(() => {
        if (initialFile) {
            setFile(initialFile);
            const objectUrl = URL.createObjectURL(initialFile);
            setPreview(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        }
    }, [initialFile]);

    useEffect(() => {
        // Handle initialization for edit mode
        if (isEditing && existingData) {
            setTitle(existingData.title || "");
            setDesc(existingData.desc || "");
            setPreview(existingData.image || null);
            setSelectedCategories(existingData.categories || []);
            setSelectedColor(existingData.color || 'white');
            setOrientation(existingData.orientation || 'horizontal');
            setTags(existingData.tags || []);
            setPeopleCount(existingData.peopleCount || 0);
        }
    }, [isEditing, existingData]);

    // Helper function to resize image
    const resizeImage = (file, maxWidth, quality) => {
        return new Promise((resolve, reject) => {
            const img = new window.Image(); // Use window.Image to reference the global constructor
            const reader = new FileReader();

            reader.onload = (e) => {
                img.src = e.target.result;
            };

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                const scaleFactor = maxWidth / img.width;
                canvas.width = maxWidth;
                canvas.height = img.height * scaleFactor;

                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const resizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: 'image/jpeg' });
                        resolve(resizedFile);
                    } else {
                        reject(new Error('Canvas is empty'));
                    }
                }, 'image/jpeg', quality / 100);
            };

            img.onerror = (error) => reject(error);
            reader.onerror = (error) => reject(error);

            reader.readAsDataURL(file);
        });
    };

    const submitHandler = async () => {
        if (!validateForm() || !session?.user?.email) {
            return false;
        }

        setLoading(true);
        try {
            let imageUrl = existingData?.image; // Keep existing image if in edit mode

            if (file) { // Only upload new image if file has changed
                // Resize the image
                const resizedFile = await resizeImage(file, 650, 60);

                const imageRef = storageRef(storage, `jpg/${resizedFile.name}`);
                await uploadBytes(imageRef, resizedFile);
                imageUrl = await getDownloadURL(imageRef);
            }

            const imageData = {
                title,
                desc,
                image: imageUrl,
                imageURL: imageUrl,
                category: selectedCategories[0] || '',
                categories: selectedCategories,
                color: selectedColor,
                orientation,
                tags,
                peopleCount,
                userName: session.user.name || 'Anonymous',
                userEmail: session.user.email,
                userImage: session.user.image || '',
                timestamp: new Date()
            };

            if (isEditing && existingData?.id) {
                // Update existing document
                await setDoc(doc(db, "post", existingData.id), imageData);
            } else {
                // Create new document
                const postRef = await addDoc(collection(db, "post"), imageData);
                // ...existing user collection logic...
            }

            setSuccessMessage("Your image has been successfully published."); // Set success message
            // Only navigate if not in bulk upload mode
            if (!isBulkUpload) {
                setTimeout(() => {
                    if (onClose) {
                        onClose();
                    } else {
                        router.push('/');
                    }
                }, 1500); // 1.5 second delay
            }
            return true;
        } catch (error) {
            console.error(error);
            setErrors(["Failed to upload image"]);
            return false;
        } finally {
            setLoading(false);
        }
    };

    useImperativeHandle(ref, () => ({
        submitForm: submitHandler
    }));

    const handleCategoryToggle = (category) => {
        setSelectedCategories(prev => 
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    const handleAddTag = (e) => {
        e.preventDefault();
        if (currentTag.trim() && tags.length < 20 && !tags.includes(currentTag.trim())) {
            setTags([...tags, currentTag.trim()]);
            setCurrentTag('');
        }
    };

    const removeTag = (tagToRemove) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const validateForm = () => {
        const newErrors = [];
        if (!title) newErrors.push("Title is required");
        if (!desc) newErrors.push("Description is required");
        if (!isEditing && !file) newErrors.push("Image is required"); // Only require image for new uploads
        if (selectedCategories.length === 0) newErrors.push("At least one category is required");
        if (selectedColor === 'white') newErrors.push("Please select a color");
        setErrors(newErrors);
        return newErrors.length === 0;
    };

    const peopleOptions = [
        { value: 0, label: 'No people' },
        { value: 1, label: '1 person' },
        { value: 2, label: '2 people' },
        { value: 3, label: '3 people' },
        { value: 4, label: '4 people' },
        { value: 5, label: 'More' },
    ];

    const orientationOptions = [
        { value: 'horizontal', label: 'Horizontal', icon: RiLayoutRowLine },
        { value: 'vertical', label: 'Vertical', icon: RiLayoutColumnLine },
        { value: 'square', label: 'Square', icon: RiLayoutGridLine }
    ];

    return (
        <div className="w-full">
            <div className="flex flex-col max-w-[400px] mx-auto gap-0 overflow-y-auto overflow-x-hidden relative bg-white shadow-lg rounded-xl p-6">
            

                {preview ? (
                    <div className="relative max-h-[200px] aspect-video h-auto">
                        <NextImage 
                            src={preview}
                            alt="Preview"
                            fill // Updated for Next.js 13
                            style={{ objectFit: 'contain' }} // Updated for Next.js 13
                            className="rounded-lg"
                        />
                    </div>
                ) : (
                    <UploadImage setFile={setFile} />
                )}
                
                <input
                    type="text"
                    placeholder="Add your title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-2xl font-bold border-b-2 border-gray-200 outline-none py-2 my-1" 
                />
                
                <textarea
                    placeholder="Add a detailed description"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    className="w-full h-24 border-b border-gray-200 outline-none py-1 my-1 resize-none" 
                />
                
                {/* Rest of your form components */}
                <div className="flex flex-col gap-2 my-1"> {/* Reduced gap and margin */}
                    <h3 className="font-semibold text-sm">Categories</h3> {/* Reduced font size */}
                    <div className="flex flex-wrap gap-1"> {/* Reduced gap */}
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => handleCategoryToggle(cat)}
                                className={`px-3 py-1 rounded-full text-xs
                                    ${selectedCategories.includes(cat)
                                        ? 'bg-black text-white'
                                        : 'bg-gray-100 hover:bg-gray-200'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-1 my-1"> {/* Reduced gap and margin */}
                    <h3 className="font-semibold text-sm">Color</h3> {/* Reduced font size */}
                    <div className="flex flex-wrap gap-1">
                        {colors.map((color) => (
                            <button
                                key={color.value}
                                onClick={() => setSelectedColor(color.value)}
                                className={`w-8 h-8 rounded-full border-2 flex-shrink-0
                                    ${selectedColor === color.value ? 'border-black' : 'border-gray-200'}`}
                                style={{ 
                                    background: color.hex,
                                   
                                }}
                                title={color.name}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-2 my-1"> {/* Reduced gap and margin */}
                    <h3 className="font-semibold text-sm">Orientation</h3> {/* Reduced font size */}
                    <div className="flex gap-2">
                        {orientationOptions.map((option) => {
                            const Icon = option.icon;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setOrientation(option.value)}
                                    className={`p-2 rounded-lg border transition-colors
                                        ${orientation === option.value 
                                            ? 'bg-black text-white' 
                                            : 'bg-white hover:bg-gray-50'}`}
                                    title={option.label}
                                >
                                    <Icon size={24} />
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-col gap-2 my-1"> {/* Reduced gap and margin */}
                    <h3 className="font-semibold text-sm">Number of People</h3> {/* Reduced font size */}
                    <div className="flex flex-wrap gap-2">
                        {peopleOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setPeopleCount(option.value)}
                                className={`px-3 py-1 rounded-lg border transition-colors
                                    ${peopleCount === option.value 
                                        ? 'bg-black text-white' 
                                        : 'bg-white hover:bg-gray-50'}`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-1 my-1"> {/* Reduced gap and margin */}
                    <h3 className="font-semibold text-sm">Tags (max 20)</h3> {/* Reduced font size */}
                    <div className="flex flex-wrap gap-1"> {/* Reduced gap */}
                        {tags.map((tag) => (
                            <span
                                key={tag}
                                className="px-2 py-1 bg-gray-100 rounded-full text-xs flex items-center gap-1" 
                            >
                                {/* Reduced padding and font size */}
                                {tag}
                                <button
                                    onClick={() => removeTag(tag)}
                                    className="text-gray-500 hover:text-gray-700 text-xs" 
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                    <form onSubmit={handleAddTag} className="flex gap-1 mt-1">
                        {/* Reduced padding and font size */}
                        <input
                            type="text"
                            value={currentTag}
                            onChange={(e) => setCurrentTag(e.target.value)}
                            placeholder="Add a tag"
                            className="flex-1 px-3 py-1 border rounded-lg outline-none text-sm" 
                            disabled={tags.length >= 20}
                        />
                        <button
                            type="submit"
                            className="px-3 py-1 bg-black text-white rounded-lg disabled:bg-gray-300 text-xs" 
                            disabled={!currentTag.trim() || tags.length >= 20}
                        >
                            Add
                        </button>
                    </form>
                </div>

                {errors.length > 0 && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        {errors.map((error, index) => (
                            <p key={index} className="text-red-500 text-sm">
                                • {error}
                            </p>
                        ))}
                    </div>
                )}

                <button
                    onClick={submitHandler}
                    disabled={loading}
                    className="bg-black text-white px-4 py-1.5 rounded-lg mt-2 w-full
                        disabled:bg-gray-300 disabled:cursor-not-allowed text-sm" /* Reduced padding, margin, and font size */
                >
                    {loading ? 'Publishing...' : isEditing ? 'Update' : 'Publish'}
                </button>
                {successMessage && (
                    <div className="mt-4 p-2 bg-green-100 border border-green-200 text-green-700 rounded">
                        {successMessage}
                    </div>
                )}
            </div>
        </div>
    );
});

Form.displayName = 'Form'; // Add display name for React DevTools
export default Form;