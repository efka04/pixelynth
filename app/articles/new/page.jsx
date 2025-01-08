'use client'
import React from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import FormAdd from '@/app/components/FormAdd'

export default function NewArticle() {
    const { data: session } = useSession()
    const router = useRouter()

    if (!session?.user) {
        router.push('/login')
        return null
    }

    return (
        <div className='bg-[#e9e9e9] min-h-screen p-8 px-[100px] md:px-[150px]'>
            <FormAdd />
        </div>
    )
}