"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Clock, Lightbulb } from "lucide-react"

interface GameScreenProps {
  onBack: () => void
  onComplete: () => void
}

export function GameScreen({ onBack, onComplete }: GameScreenProps) {
  const [progress, setProgress] = useState(45)

  return (
    <div className="flex flex-col min-h-screen min-h-[100dvh] p-3 sm:p-4 safe-area-inset">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-white hover:bg-white/10 w-10 h-10 sm:w-12 sm:h-12 touch-manipulation"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </Button>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="font-mono text-sm sm:text-base">02:34</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10 w-10 h-10 sm:w-12 sm:h-12 touch-manipulation"
        >
          <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6" />
        </Button>
      </div>

      {/* Puzzle Area */}
      <div className="flex-1 flex items-center justify-center px-2">
        <div className="w-full max-w-xs aspect-square bg-gray-700 rounded-lg grid grid-cols-3 gap-1 p-2">
          {Array.from({ length: 9 }, (_, i) => (
            <div
              key={i}
              className="bg-gray-600 rounded flex items-center justify-center cursor-pointer hover:bg-gray-500 active:bg-gray-400 transition-colors touch-manipulation min-h-[60px] sm:min-h-[80px]"
            >
              <span className="text-xs sm:text-sm text-gray-300">{i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4 sm:mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm">Progress</span>
          <span className="text-sm font-semibold">{progress}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2 sm:h-3">
          <div
            className="bg-[#FFD166] h-2 sm:h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Demo Complete Button */}
      <Button
        onClick={onComplete}
        className="w-full h-11 sm:h-12 bg-[#06D6A0] hover:bg-[#06D6A0]/90 text-white font-semibold touch-manipulation"
      >
        Complete Puzzle (Demo)
      </Button>
    </div>
  )
}
