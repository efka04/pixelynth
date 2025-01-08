'use client'
import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { doc, getDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/app/db/firebaseConfig'
import FormAdd from '@/app/components/FormAdd'
import { getStorage, ref, deleteObject } from 'firebase/storage'

export default function EditArticle() {
    const { data: session } = useSession()
    const router = useRouter()
    const [articleData, setArticleData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        if (params.articleId) {
            getArticleData()
        }
    }, [params.articleId])

    useEffect(() => {
        if (!loading && articleData) {
            if (!session?.user || session.user.email !== articleData?.userEmail) {
                router.push('/')
            }
        }
    }, [session, articleData, loading])

    const getArticleData = async () => {
        try {
            const docRef = doc(db, 'post', params.articleId)
            const docSnap = await getDoc(docRef)
            
            if (docSnap.exists()) {
                setArticleData(docSnap.data())
            }
        } catch (error) {
            console.error('Error fetching article:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure to delete this image?')) return

        setIsDeleting(true)
        try {
            await deleteDoc(doc(db, 'post', params.articleId))
            alert('Image deleted successfully')
            router.push('/')
        } catch (error) {
            console.error('Error deleting image:', error)
            alert('Failed to delete image')
        } finally {
            setIsDeleting(false)
        }
    }

    if (loading) return <div>Loading...</div>
    
    if (!articleData) return <div>Article not found</div>

    return (
        <div className='bg-[#e9e9e9] min-h-screen p-8 px-[100px] md:px-[150px]'>
            <FormAdd 
                isEditing={true} 
                existingData={articleData} 
                articleId={params.articleId} 
            />
            <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-500 text-white px-4 py-2 rounded-lg mt-4"
            >
                {isDeleting ? 'Deleting...' : 'Delete Image'}
            </button>
        </div>
    )
}