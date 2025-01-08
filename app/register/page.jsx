'use client'
import { SessionProvider } from 'next-auth/react'
import RegisterForm from '@/app/components/RegisterForm'

export default function RegisterPage() {
    return (
        <SessionProvider>
            <RegisterForm />
        </SessionProvider>
    )
}