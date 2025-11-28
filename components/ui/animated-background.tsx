"use client"

import { useEffect, useState } from "react"

export function AnimatedBackground() {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <div className="fixed inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-[40%] -left-[20%] h-[80%] w-[80%] rounded-full bg-primary/20 blur-[120px] animate-[float_10s_ease-in-out_infinite]" />
            <div className="absolute top-[20%] -right-[20%] h-[60%] w-[60%] rounded-full bg-secondary/20 blur-[100px] animate-[float_15s_ease-in-out_infinite_reverse]" />
            <div className="absolute -bottom-[40%] left-[20%] h-[80%] w-[80%] rounded-full bg-violet-900/20 blur-[120px] animate-[float_12s_ease-in-out_infinite_1s]" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02] dark:opacity-[0.05]" />
        </div>
    )
}
