"use client"

import { Button } from "@/components/ui/button"
import { AnimatedCenter } from "@/components/animated-center"

interface LoginScreenProps {
  onLogin: () => void
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen min-h-[100dvh] p-4 safe-area-inset">
      <AnimatedCenter size="medium" showAnimation={true} showSloth={true} />

      <h1 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-center px-4">어서오세요, 길치님!</h1>
      <Button
        onClick={onLogin}
        className="w-full max-w-xs h-12 sm:h-14 bg-[#FFD166] hover:bg-[#FFD166]/90 text-black font-semibold text-base sm:text-lg rounded-full mb-6 sm:mb-8 touch-manipulation"
      >
        Guest Login
      </Button>
      <div className="flex gap-3 sm:gap-4 opacity-50">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-600 rounded-full flex items-center justify-center text-sm sm:text-base touch-manipulation">
          G
        </div>
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-600 rounded-full flex items-center justify-center text-sm sm:text-base touch-manipulation">
          K
        </div>
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-600 rounded-full flex items-center justify-center text-sm sm:text-base touch-manipulation">
          N
        </div>
      </div>
    </div>
  )
}
