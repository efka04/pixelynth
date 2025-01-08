"use client"
import { useState } from 'react'
import { useSession } from "next-auth/react"
import { useRouter } from 'next/navigation'
import { getAuth, updateEmail, updateProfile, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth"
import { doc, deleteDoc } from 'firebase/firestore'
import { db } from '@/app/db/firebaseConfig'

export default function Settings() {
    const { data: session, update } = useSession()
    const router = useRouter()
    const [name, setName] = useState(session?.user?.name || '')
    const [email, setEmail] = useState(session?.user?.email || '')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const handleUpdateProfile = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const auth = getAuth()
            const user = auth.currentUser

            if (user) {
                // Update display name
                if (name !== session?.user?.name) {
                    await updateProfile(user, { displayName: name })
                    await update({ ...session, user: { ...session.user, name } })
                }

                // Update email
                if (email !== session?.user?.email) {
                    // Require reauthentication for email change
                    if (!password) {
                        setError('Password required to change email')
                        return
                    }

                    const credential = EmailAuthProvider.credential(user.email, password)
                    await reauthenticateWithCredential(user, credential)
                    await updateEmail(user, email)
                    await update({ ...session, user: { ...session.user, email } })
                }
            }
        } catch (error) {
            setError(error.message)
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
