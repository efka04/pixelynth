"use client"
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/app/db/firebaseConfig'
import { useSession } from "next-auth/react"
import ArticleItem from '@/app/components/ArticleItem'

export default function DownloadHistory() {
    const [downloads, setDownloads] = useState([])
    const [loading, setLoading] = useState(true)
    const { data: session } = useSession()
    const userEmail = session?.user?.email

    useEffect(() => {
        async function fetchDownloadHistory() {
            if (!userEmail) {
                console.log("No user email found")
                setLoading(false)
                return
            }

            try {
                console.log("Fetching downloads for user:", userEmail)
                const userDownloadsRef = collection(db, 'users', userEmail, 'downloadHistory')
                const querySnapshot = await getDocs(userDownloadsRef)
                const downloadData = []

                querySnapshot.forEach((doc) => {
                    const data = doc.data()
                    // Format data to match ArticleItem expectations
                    downloadData.push({
                        id: doc.id,
                        image: data.imageUrl,
                        title: data.title,
                        userName: data.userName,
                        timestamp: data.timestamp,
                    })
                })

                console.log("Total downloads found:", downloadData.length)
                setDownloads(downloadData)
            } catch (error) {
                console.error('Error fetching download history:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchDownloadHistory()
    }, [userEmail])

    if (!session) {
        return <div className="text-center p-4">Please sign in to view your download history</div>
    }

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
    }

    return (
        <div className="px-4 md:px-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-[30px] font-bold">Download History</h1>
            </div>
            
            {downloads.length === 0 ? (
                <div className="flex-1 flex items-center justify-center min-h-[200px]">
                    <p className="text-gray-500 text-center">No downloads yet</p>
                </div>
            ) : (
                <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4 pb-4">
                    {downloads.map((download) => (
                        <div key={download.id} className="break-inside-avoid">
                            <ArticleItem item={download} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
