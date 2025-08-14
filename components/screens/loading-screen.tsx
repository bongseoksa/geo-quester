"use client"

import { Button } from "@/components/ui/button"
import { AnimatedCenter } from "@/components/animated-center"

interface LoadingScreenProps {
  onGuestLogin: () => void
}

export function LoadingScreen({ onGuestLogin }: LoadingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen min-h-[100dvh] p-4 safe-area-inset">
      <AnimatedCenter size="large" showAnimation={true} showRedPanda={true} />

      <Button
        onClick={onGuestLogin}
        className="w-full max-w-xs h-12 sm:h-14 bg-[#FFD166] hover:bg-[#FFD166]/90 text-black font-semibold text-base sm:text-lg rounded-full touch-manipulation"
      >
        Guest Login
      </Button>
    </div>
  )
}
