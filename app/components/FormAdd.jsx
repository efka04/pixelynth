"use client"
import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react'
import UploadImage from '@/app/components/uploadImage'
import { useSession } from "next-auth/react"
import { getDownloadURL, getStorage, ref as storageRef, uploadBytes } from "firebase/storage" // Alias ref to storageRef
import { app, db } from '@/app/db/firebaseConfig'
import { doc, getFirestore, setDoc, addDoc, collection } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { FaHeart, FaChevronDown } from 'react-icons/fa'
import { categories } from '@/app/utils/constants';
import { IoImageOutline, IoPhonePortrait, IoPhoneLandscape } from 'react-icons/io5'
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

const Form = forwardRef(({ initialFile = null }, ref) => {
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

    const submitHandler = async () => {
        if (!validateForm() || !session?.user?.email) {
            return false;
        }

        setLoading(true);
        try {
            // 1. Upload image
            const imageRef = storageRef(storage, `images/${Date.now()}-${file.name}`); // Use storageRef instead of ref
            await uploadBytes(imageRef, file);
            const url = await getDownloadURL(imageRef);

            // 2. Create image data
            const imageData = {
                title,
                desc,
                image: url,
                imageURL: url, // Add this line to ensure imageURL is available
                category: selectedCategories[0] || '',
                categories: selectedCategories,
                color: selectedColor,
                orientation,
                tags,
                peopleCount,
                userName: session.user.name || 'Anonymous', // Provide default if undefined
                userEmail: session.user.email || 'no-email@example.com', // Provide default if undefined
                userImage: session.user.image || '', // Provide default empty string if undefined
                timestamp: new Date()
            };

            // 3. Save to main posts collection
            const postRef = await addDoc(collection(db, "post"), imageData);

            // 4. Save to user's MyImages collection
            const userMyImagesRef = collection(db, 'users', session.user.email, 'MyImages');
            await setDoc(doc(userMyImagesRef, postRef.id), {
                ...imageData,
                postId: postRef.id
            });

            setSuccessMessage("Your image has been successfully published."); // Set success message
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
        if (!file) newErrors.push("Image is required");
        if (selectedCategories.length === 0) newErrors.push("At least one category is required");
        if (selectedColor === 'white') newErrors.push("Please select a color");
        setErrors(newErrors);
        return newErrors.length === 0;
    };

    const peopleOptions = [
        { value: 0, label: 'No people', icon: BsPerson },
        { value: 1, label: '1 person', icon: BsPersonFill },
        { value: 2, label: '2 people', icon: BsPeople },
        { value: 3, label: '3 people', icon: BsPeopleFill },
        { value: 4, label: '4 people', icon: BsPeopleFill },
        { value: 5, label: 'More', icon: IoMdMore },
    ];

    const orientationOptions = [
        { value: 'horizontal', label: 'Horizontal', icon: RiLayoutRowLine },
        { value: 'vertical', label: 'Vertical', icon: RiLayoutColumnLine },
        { value: 'square', label: 'Square', icon: RiLayoutGridLine }
    ];

    return (
        <div>
            <div className="flex flex-col gap-4">
                {preview ? (
                    <div className="relative aspect-video h-auto">
                        <Image 
                            src={preview}
                            alt="Preview"
                            layout="fill"
                            objectFit="contain"
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

                <div className="flex flex-col gap-2 my-1"> {/* Reduced gap and margin */}
                    <h3 className="font-semibold text-sm">Color</h3> {/* Reduced font size */}
                    <div className="flex flex-wrap gap-2">
                        {colors.map((color) => (
                            <button
                                key={color.value}
                                onClick={() => setSelectedColor(color.value)}
                                className={`w-10 h-10 rounded-full border-2 flex-shrink-0
                                    ${selectedColor === color.value ? 'border-black' : 'border-gray-200'}`}
                                style={{ 
                                    background: color.hex,
                                    minWidth: '2.5rem' // ensures circle shape
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
                        {peopleOptions.map((option) => {
                            const Icon = option.icon;
                            return (
                                <button
                                    key={option.value}
                                    onClick={() => setPeopleCount(option.value)}
                                    className={`p-2 rounded-lg border transition-colors flex flex-col items-center gap-1
                                        ${peopleCount === option.value 
                                            ? 'bg-black text-white' 
                                            : 'bg-white hover:bg-gray-50'}`}
                                    title={option.label}
                                >
                                    <Icon size={24} />
                                    <span className="text-xs">{option.value === 5 ? 'More' : option.value}</span>
                                </button>
                            );
                        })}
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
                    {loading ? 'Publishing...' : 'Publish'}
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