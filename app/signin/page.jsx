'use client'
import { SessionProvider } from 'next-auth/react'
import SignIn from '@/app/components/SignIn'

export default function SignInPage() {
    return (
        <SessionProvider>
            <SignIn />
        </SessionProvider>
    )
}
