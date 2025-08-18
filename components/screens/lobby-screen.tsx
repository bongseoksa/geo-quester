"use client"

import { Button } from "@/components/ui/button"
import { Settings, Zap } from "lucide-react"
import * as d3 from "d3";

interface LobbyScreenProps {
  energy: number
  maxEnergy: number
  onPlay: () => void
  onSettings: () => void
}

export function LobbyScreen({ energy, maxEnergy, onPlay, onSettings }: LobbyScreenProps) {
  return (
    <div className="flex flex-col min-h-screen min-h-[100dvh] p-4 safe-area-inset">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 sm:mb-8">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-[#FFD166]" />
          <span className="text-base sm:text-lg font-semibold">
            {energy}/{maxEnergy}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onSettings}
          className="text-white hover:bg-white/10 w-10 h-10 sm:w-12 sm:h-12 touch-manipulation"
        >
          <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
        </Button>
      </div>

      {/* Puzzle Card */}
      <div className="flex-1 flex flex-col items-center justify-center px-2">
        <div className="w-full max-w-sm aspect-[4/3] bg-white rounded-lg mb-4 sm:mb-6 flex items-center justify-center p-4 shadow-lg">
          <img src="/images/korea-map.svg" alt="Map of Korea" className="w-full h-full object-contain" />
        </div>
        <Button
          onClick={onPlay}
          className="w-32 sm:w-40 h-10 sm:h-12 bg-[#06D6A0] hover:bg-[#06D6A0]/90 text-white font-semibold text-base sm:text-lg rounded-full touch-manipulation"
        >
          Play
        </Button>
      </div>

      {/* Ad Banner */}
      <div className="w-full h-10 sm:h-12 bg-gray-600 rounded flex items-center justify-center mt-6 sm:mt-8">
        <span className="text-gray-400 text-xs sm:text-sm">Ad Banner (320x50px)</span>
      </div>
    </div>
  )
}
