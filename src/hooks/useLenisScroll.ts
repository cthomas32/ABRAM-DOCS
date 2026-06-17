'use client'
import { useMotionValue } from 'framer-motion'
import { useLenis } from 'lenis/react'

export function useLenisScroll() {
  const scrollY = useMotionValue(0)
  useLenis(({ scroll }) => {
    scrollY.set(scroll)
  })
  return scrollY
}
