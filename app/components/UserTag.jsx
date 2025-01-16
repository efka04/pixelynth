"use client"
import Image from 'next/image'
import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { db } from '@/app/db/firebaseConfig'
import { doc, getDoc } from 'firebase/firestore'

function UserTag({ user, color = 'black' }) {
  const { data: session } = useSession()
  const [showMenu, setShowMenu] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [firebaseName, setFirebaseName] = useState(null)

  useEffect(() => {
    const fetchUserName = async () => {
      if (user?.email) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.email));
          if (userDoc.exists()) {
            setFirebaseName(userDoc.data().name);
          }
        } catch (error) {
          console.error('Error fetching user name:', error);
        }
      }
    };

    fetchUserName();
  }, [user?.email]);

  const displayName = firebaseName || user?.userName || 'Pixelynth';

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShowMenu(true)}
      onMouseLeave={() => setShowMenu(false)}
    >
      <div className="flex gap-1 sm:gap-2 items-center cursor-pointer">
        <Image
          src={imgError ? '/images/defaultProfile.jpg' : (user?.image || '/images/defaultProfile.jpg')}
          alt={displayName}
          width={30}
          height={30}
          className='rounded-full sm:w-[40px] sm:h-[40px] w-[30px] h-[px] border border-black'
          onError={() => setImgError(true)}
          unoptimized
        />
        <div className="min-w-0">
          <h2 className={`text-[12px] sm:text-[14px] ${color === 'white' ? 'text-white' : 'text-black'} font-medium truncate max-w-[80px] sm:max-w-full`}>
            {displayName}
          </h2>
        </div>
      </div>
    </div>
  )
}

export default UserTag