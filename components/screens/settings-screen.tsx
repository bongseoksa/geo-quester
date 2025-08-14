"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface SettingsScreenProps {
  onBack: () => void
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [language, setLanguage] = useState("Korean")

  return (
    <div className="flex flex-col min-h-screen min-h-[100dvh] p-4 safe-area-inset">
      <div className="flex items-center mb-6 sm:mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-white hover:bg-white/10 mr-3 sm:mr-4 w-10 h-10 sm:w-12 sm:h-12 touch-manipulation"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </Button>
        <h1 className="text-xl sm:text-2xl font-bold">Settings</h1>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <div className="flex justify-between items-center py-2">
          <span className="text-base sm:text-lg">Sound</span>
          <Button
            onClick={() => setSoundEnabled(!soundEnabled)}
            variant={soundEnabled ? "default" : "outline"}
            className={`h-9 sm:h-10 px-4 sm:px-6 touch-manipulation ${
              soundEnabled ? "bg-[#06D6A0] hover:bg-[#06D6A0]/90" : "border-white/30 text-white hover:bg-white/10"
            }`}
          >
            {soundEnabled ? "On" : "Off"}
          </Button>
        </div>

        <div className="flex justify-between items-center py-2">
          <span className="text-base sm:text-lg">Language</span>
          <Button
            onClick={() => setLanguage(language === "Korean" ? "English" : "Korean")}
            variant="outline"
            className="h-9 sm:h-10 px-4 sm:px-6 border-white/30 text-white hover:bg-white/10 touch-manipulation"
          >
            {language}
          </Button>
        </div>

        <div className="pt-6 sm:pt-8 border-t border-white/20">
          <span className="text-xs sm:text-sm text-gray-400">App Version: 1.0.0</span>
        </div>
      </div>
    </div>
  )
}
