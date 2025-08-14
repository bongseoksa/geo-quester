import { Globe3D } from "@/components/globe-3d"

interface AnimatedCenterProps {
  size?: "small" | "medium" | "large"
  showAnimation?: boolean
  showSloth?: boolean // showRedPanda를 showSloth로 변경
}

export function AnimatedCenter({ size = "medium", showAnimation = false, showSloth = true }: AnimatedCenterProps) {
  const sizeClasses = {
    small: "w-32 h-32 sm:w-40 sm:h-40",
    medium: "w-40 h-40 sm:w-48 sm:h-48",
    large: "w-48 h-48 sm:w-64 sm:h-64",
  }

  return (
    <div className={`${sizeClasses[size]} mb-6 sm:mb-8 relative`}>
      <Globe3D showSloth={showSloth} showAnimation={showAnimation} />
    </div>
  )
}
