'use client'
import { SearchProvider } from './context/SearchContext'
import { CategoryProvider } from './context/CategoryContext'
import { SessionProvider } from "next-auth/react"
import '../styles/globals.css'

export default function RootLayout({ children }) {
    return (
        <html>
            <body className="min-h-screen">
                <SessionProvider>
                    <CategoryProvider>
                        <SearchProvider>
                            <div className="flex flex-col min-h-screen">
                                <div className="pt-[150px]"> {/* Adjusted padding for header */}
                                    {children}
                                </div>
                            </div>
                        </SearchProvider>
                    </CategoryProvider>
                </SessionProvider>
            </body>
        </html>
    )
}