"use client"

import { useState } from "react"
import { LoadingScreen } from "@/components/screens/loading-screen"
import { LoginScreen } from "@/components/screens/login-screen"
import { LobbyScreen } from "@/components/screens/lobby-screen"
import { GameScreen } from "@/components/screens/game-screen"
import { ResultScreen } from "@/components/screens/result-screen"
import { SettingsScreen } from "@/components/screens/settings-screen"

type Screen = "loading" | "login" | "lobby" | "game" | "result" | "settings"

export default function GeoQuesterApp() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("loading")
  const [energy, setEnergy] = useState(5)
  const [maxEnergy] = useState(10)

  const navigateTo = (screen: Screen) => {
    setCurrentScreen(screen)
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case "loading":
        return <LoadingScreen onGuestLogin={() => navigateTo("login")} />
      case "login":
        return <LoginScreen onLogin={() => navigateTo("lobby")} />
      case "lobby":
        return (
          <LobbyScreen
            energy={energy}
            maxEnergy={maxEnergy}
            onPlay={() => navigateTo("game")}
            onSettings={() => navigateTo("settings")}
          />
        )
      case "game":
        return <GameScreen onBack={() => navigateTo("lobby")} onComplete={() => navigateTo("result")} />
      case "result":
        return <ResultScreen onRetry={() => navigateTo("game")} onBackToLobby={() => navigateTo("lobby")} />
      case "settings":
        return <SettingsScreen onBack={() => navigateTo("lobby")} />
      default:
        return <LoadingScreen onGuestLogin={() => navigateTo("login")} />
    }
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-[#073B4C] to-[#0A4A5C] text-white overflow-hidden">
      {renderScreen()}
    </div>
  )
}
