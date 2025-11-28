"use client"

import { UserButton, useUser } from "@clerk/nextjs"
import Link from "next/link"
import { useEffect, useState } from "react"
import { store } from "@/lib/store"
import { Button } from "@/components/ui/button"

export function Navbar() {
  const { user, isLoaded } = useUser()
  const [userData, setUserData] = useState(store.getUserData())
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    store.init()
    setUserData(store.getUserData())

    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "glass border-b border-white/10 py-2" : "bg-transparent py-4"}`}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-600 text-white shadow-lg shadow-primary/25 transition-transform group-hover:scale-110">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
              <circle cx="7" cy="17" r="2" />
              <path d="M9 17h6" />
              <circle cx="17" cy="17" r="2" />
            </svg>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Drivers24</span>
        </Link>

        <div className="flex items-center space-x-4">
          {isLoaded && user && (
            <>
              {userData?.role && (
                <div className="hidden sm:flex items-center space-x-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md">
                  <span className="text-sm text-muted-foreground">
                    Role:
                  </span>
                  <span className="bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-xs font-bold text-transparent">
                    {userData.role}
                  </span>
                  {userData.city && (
                    <span className="text-sm text-muted-foreground">
                      • {userData.city}
                    </span>
                  )}
                </div>
              )}
              <UserButton afterSignOutUrl="/" appearance={{
                elements: {
                  avatarBox: "h-10 w-10 ring-2 ring-white/20 hover:ring-primary/50 transition-all"
                }
              }} />
            </>
          )}
          {isLoaded && !user && (
            <div className="flex items-center space-x-3">
              <Link href="/sign-in">
                <Button variant="ghost" className="text-muted-foreground hover:text-white">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button className="shadow-lg shadow-primary/20">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
