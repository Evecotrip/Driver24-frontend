"use client"

import { UserButton, useUser } from "@clerk/nextjs"
import Link from "next/link"
import { useEffect, useState } from "react"
import { store } from "@/lib/store"

export function Navbar() {
  const { user, isLoaded } = useUser()
  const [userData, setUserData] = useState(store.getUserData())

  useEffect(() => {
    store.init()
    setUserData(store.getUserData())
  }, [])

  return (
    <nav className="border-b-2 border-black/10 bg-white dark:border-white/10 dark:bg-black">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black text-white dark:bg-white dark:text-black">
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
          <span className="text-xl font-bold">Driver Save</span>
        </Link>

        <div className="flex items-center space-x-4">
          {isLoaded && user && (
            <>
              {userData?.role && (
                <div className="hidden sm:flex items-center space-x-2">
                  <span className="text-sm text-black/60 dark:text-white/60">
                    Role:
                  </span>
                  <span className="rounded-full bg-black px-3 py-1 text-xs font-medium text-white dark:bg-white dark:text-black">
                    {userData.role}
                  </span>
                  {userData.city && (
                    <span className="text-sm text-black/60 dark:text-white/60">
                      • {userData.city}
                    </span>
                  )}
                </div>
              )}
              <UserButton afterSignOutUrl="/" />
            </>
          )}
          {isLoaded && !user && (
            <div className="flex items-center space-x-2">
              <Link
                href="/sign-in"
                className="rounded-lg px-4 py-2 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
