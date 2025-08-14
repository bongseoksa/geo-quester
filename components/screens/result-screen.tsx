"use client"

import { Button } from "@/components/ui/button"
import { Zap } from "lucide-react"

interface ResultScreenProps {
  onRetry: () => void
  onBackToLobby: () => void
}

export function ResultScreen({ onRetry, onBackToLobby }: ResultScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen min-h-[100dvh] p-4 safe-area-inset">
      <h1 className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8 text-[#FFD166]">클리어!</h1>

      <div className="bg-white/10 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 w-full max-w-sm">
        <div className="text-center space-y-3">
          <div className="flex justify-between text-sm sm:text-base">
            <span>Time:</span>
            <span className="font-semibold">02:34</span>
          </div>
          <div className="flex justify-between text-sm sm:text-base">
            <span>Score:</span>
            <span className="font-semibold">1,250</span>
          </div>
          <div className="flex justify-between items-center text-sm sm:text-base">
            <span>Reward:</span>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#FFD166]" />
              <span className="font-semibold">+2</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 sm:gap-4 w-full max-w-sm">
        <Button
          onClick={onRetry}
          variant="outline"
          className="flex-1 h-10 sm:h-12 border-white/30 text-white hover:bg-white/10 bg-transparent touch-manipulation"
        >
          Retry
        </Button>
        <Button
          onClick={onBackToLobby}
          className="flex-1 h-10 sm:h-12 bg-[#FFD166] hover:bg-[#FFD166]/90 text-black font-semibold touch-manipulation"
        >
          Back to Lobby
        </Button>
      </div>
    </div>
  )
}
