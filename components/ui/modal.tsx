"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Button } from "./button"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const [mounted, setMounted] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (isOpen) {
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onClose()
    }, 300)
  }

  if (!mounted) return null
  if (!isOpen && !isClosing) return null

  return createPortal(
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isOpen && !isClosing ? "opacity-100" : "opacity-0"}`}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div className={`relative w-full max-w-2xl transform overflow-hidden rounded-2xl border border-white/10 bg-black/80 p-6 text-left shadow-2xl backdrop-blur-xl transition-all duration-300 ${isOpen && !isClosing ? "scale-100 translate-y-0" : "scale-95 translate-y-4"}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold leading-6 text-white bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            {title}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8 rounded-full hover:bg-white/10 text-white/60 hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
