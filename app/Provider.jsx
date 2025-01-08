"use client"
import { SessionProvider } from "next-auth/react"
import { CategoryProvider } from './context/CategoryContext'
import { SearchProvider } from './context/SearchContext'
import { ColorProvider } from './context/ColorContext'

export default function Provider({children}){
  return(
    <SessionProvider>
      <CategoryProvider>
        <SearchProvider>
          <ColorProvider>
            {children}
          </ColorProvider>
        </SearchProvider>
      </CategoryProvider>
    </SessionProvider>
  )
}