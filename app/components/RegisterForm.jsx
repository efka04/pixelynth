'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { app, db } from '@/app/db/firebaseConfig' // Ensure Firestore is imported
import { doc, setDoc } from 'firebase/firestore' // Import Firestore functions

export default function RegisterForm() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: ''
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false) // Added state for password visibility

    const togglePasswordVisibility = () => {
        setShowPassword(prevState => !prevState)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match')
            setLoading(false)
            return
        }

        if (!/(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            setError('Password must contain at least one uppercase letter and one number')
            setLoading(false)
            return
        }

        try {
            const auth = getAuth(app)
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            )
            const user = userCredential.user

            // Create a user document in Firestore
            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                createdAt: new Date(),
                // Add any additional user fields here
            })

            router.push('/signin')
        } catch (error) {
            console.error('Registration error:', error) // Log the full error

            // Enhanced error handling
            let errorMessage = 'Registration failed'
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'Email already registered'
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address'
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password is too weak'
            }
            // Add more error codes as needed

            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded-lg shadow-md w-96">
                <h1 className="text-2xl font-bold mb-6 text-center">Create Account</h1>
                
                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Email"
                        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"} // Updated type based on state
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Password"
                            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-600"
                        >
                            {showPassword ? 'Hide' : 'Show'}
                        </button>
                    </div>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"} // Updated type based on state
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm Password"
                            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-600"
                        >
                            {showPassword ? 'Hide' : 'Show'}
                        </button>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full p-2 rounded-lg ${
                            loading 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-black hover:bg-gray-800' // Changed from 'bg-blue-500 hover:bg-blue-600' to 'bg-black hover:bg-gray-800'
                        } text-white transition-colors`}
                    >
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>

                <p className="mt-6 text-center text-gray-600">
                    Already have an account?{' '}
                    <Link 
                        href="/signin" 
                        className="text-blue-500 hover:underline font-medium"
                    >
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    )
}