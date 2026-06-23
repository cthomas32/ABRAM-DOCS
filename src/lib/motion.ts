export const ease = {
  cinematic: [0.16, 1, 0.3, 1] as const,
  snap: [0.25, 0.46, 0.45, 0.94] as const,
}

export const revealVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      delay,
      ease: ease.cinematic,
    },
  }),
}

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}
