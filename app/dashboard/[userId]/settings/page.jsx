"use client"
import { useState, useEffect } from 'react'
import { useSession } from "next-auth/react"
import { useRouter } from 'next/navigation'
import { getAuth, updateEmail, updateProfile, deleteUser, reauthenticateWithCredential, EmailAuthProvider, onAuthStateChanged } from "firebase/auth"
import { doc, deleteDoc, setDoc } from 'firebase/firestore'
import { db, app } from '@/app/db/firebaseConfig'

export default function Settings() {
    const { data: session, update } = useSession()
    const router = useRouter()
    const [name, setName] = useState(session?.user?.name || '')
    const [email, setEmail] = useState(session?.user?.email || '')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [firebaseUser, setFirebaseUser] = useState(null)

    useEffect(() => {
        const auth = getAuth(app);  // Initialize auth with app
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setFirebaseUser(user);
                // Update form with latest user data
                setName(user.displayName || session?.user?.name || '');
                setEmail(user.email || session?.user?.email || '');
            }
        });

        return () => unsubscribe();
    }, [session]);

    useEffect(() => {
        if (session?.user && firebaseUser) {
            setName(session.user.name || '')
            setEmail(session.user.email || '')
        }
    }, [session, firebaseUser])

    const handleUpdateProfile = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const auth = getAuth(app);  // Initialize auth with app
            await new Promise(resolve => setTimeout(resolve, 500)); // Small delay to ensure auth is ready
            const user = auth.currentUser

            if (!user) {
                throw new Error('Please sign in again to update your profile')
            }

            // Only update name if it has changed
            if (name !== user.displayName) {
                await updateProfile(user, {
                    displayName: name
                })
                
                // Update Firestore
                await setDoc(doc(db, 'users', user.email), {
                    name,
                    updatedAt: new Date().toISOString()
                }, { merge: true })

                // Update session with new name
                await update({
                    ...session,
                    user: {
                        ...session.user,
                        name
                    }
                })

                setError('Profile updated successfully!');
            }

            // Handle email update if changed
            if (email !== session?.user?.email) {
                if (!password) {
                    setError('Password required to change email')
                    return
                }

                try {
                    const credential = EmailAuthProvider.credential(user.email, password)
                    await reauthenticateWithCredential(user, credential)
                    await updateEmail(user, email)
                    
                    // Update Firestore with new email
                    await setDoc(doc(db, 'users', email), {
                        email,
                        updatedAt: new Date().toISOString()
                    }, { merge: true })

                    // Update session with new email
                    await update({
                        ...session,
                        user: {
                            ...session.user,
                            email
                        }
                    })
                } catch (error) {
                    throw new Error('Failed to update email: ' + error.message)
                }
            }

        } catch (error) {
            console.error('Update error:', error)
            setError(error.message || 'Failed to update profile')
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteAccount = async () => {
        if (!password) {
            setError('Password required to delete account')
            return
        }

        try {
            setLoading(true)
            const auth = getAuth()
            const user = auth.currentUser

            if (user) {
                // Reauthenticate
                const credential = EmailAuthProvider.credential(user.email, password)
                await reauthenticateWithCredential(user, credential)

                // Delete user data from Firestore
                await deleteDoc(doc(db, 'users', user.email))

                // Delete Firebase auth account
                await deleteUser(user)

                router.push('/login')
            }
        } catch (error) {
            setError(error.message)
        } finally {
            setLoading(false)
            setShowDeleteConfirm(false)
        }
    }

    if (!session) {
        return <div className="text-center p-4">Please sign in to access settings</div>
    }

    return (
        <div className="max-w-2xl mx-auto p-4">
            <h1 className="text-3xl font-bold mb-8">Settings</h1>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div>
                    <label className="block mb-2">Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-2 border rounded"
                    />
                </div>

                <div>
                    <label className="block mb-2">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-2 border rounded"
                    />
                </div>

                {(email !== session?.user?.email) && (
                    <div>
                        <label className="block mb-2">Current Password (required for email change)</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                )}

                {error && <p className="text-red-500">{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                >
                    {loading ? 'Updating...' : 'Update Profile'}
                </button>
            </form>

            <div className="mt-12 border-t pt-8">
                <h2 className="text-2xl font-bold mb-4 text-red-600">Danger Zone</h2>
                {!showDeleteConfirm ? (
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                        Delete Account
                    </button>
                ) : (
                    <div className="space-y-4">
                        <p className="text-red-500">Enter your password to confirm account deletion:</p>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 border rounded"
                            placeholder="Current password"
                        />
                        <div className="space-x-4">
                            <button
                                onClick={handleDeleteAccount}
                                disabled={loading}
                                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
                            >
                                {loading ? 'Deleting...' : 'Confirm Delete'}
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
