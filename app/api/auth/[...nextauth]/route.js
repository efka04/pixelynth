import NextAuth from 'next-auth'
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { app } from '@/app/db/firebaseConfig'

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null

                try {
                    const auth = getAuth(app)
                    const userCredential = await signInWithEmailAndPassword(
                        auth,
                        credentials.email,
                        credentials.password
                    )
                    const user = userCredential.user

                    return {
                        id: user.uid,
                        email: user.email,
                        name: user.displayName || user.email
                    }
                } catch (error) {
                    console.error('Firebase auth error:', error)
                    return null
                }
            }
        })
    ],
    secret: process.env.NEXTAUTH_SECRET, // Added secret
    pages: {
        signIn: '/signin',
        error: '/signin' // Redirect to sign-in page on error
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
            }
            return token
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id
            }
            return session
        }
    }
})

export { handler as GET, handler as POST }

