"use client"

import { useState, useEffect } from 'react'
import { getDoc, doc } from 'firebase/firestore'
import { db } from '@/app/db/firebaseConfig'
import UserInfo from '@/app/components/UserInfo'
import Link from 'next/link'
import { FaHeart } from 'react-icons/fa'
import { useParams } from 'next/navigation'

export default function Page() {
  const [userInfo, setUserInfo] = useState(null)
  const params = useParams()
  const decodedUserId = decodeURIComponent(params.userId).replace('%40', '@')

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const docRef = doc(db, "user", decodedUserId)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          setUserInfo(docSnap.data())
        } else {
          console.log("No such document!")
        }
      } catch (error) {
        console.error("Error fetching user:", error)
      }
    }

    if (decodedUserId) {
      getUserInfo()
    }
  }, [decodedUserId])

  return (
    <div className='bg-[#e9e9e9] min-h-screen flex items-center justify-center'>
      {userInfo ? (
        <div>
          <UserInfo userInfo={userInfo} />
          <Link 
            href={`/dashboard/${decodedUserId}/favorites`}
            className="flex items-center gap-2 p-3 hover:bg-gray-100 rounded-lg"
          >
            <FaHeart /> Favorites
          </Link>
        </div>
      ) : null}
    </div>
  )
}