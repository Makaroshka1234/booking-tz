"use client"

import { useEffect, useRef, useState } from "react"

interface UseIncrementalRevealOptions {
  total: number
  pageSize?: number
}

export function useIncrementalReveal({ total, pageSize = 5 }: UseIncrementalRevealOptions) {
  const [visibleCount, setVisibleCount] = useState(Math.min(pageSize, total))
  const containerRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setVisibleCount((v) => Math.min(Math.max(v, pageSize), total))
  }, [total, pageSize])

  useEffect(() => {
    const sentinel = sentinelRef.current
    const root = containerRef.current
    if (!sentinel || !root) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((v) => Math.min(v + pageSize, total))
        }
      },
      { root, rootMargin: "100px" }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [total, pageSize])

  return { visibleCount, containerRef, sentinelRef, hasMore: visibleCount < total }
}
