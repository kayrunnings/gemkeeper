"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Gem, Sparkles, Bell, CheckCircle, ChevronRight, ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"

interface OnboardingProps {
  onComplete: () => void
  onSkip: () => void
}

interface OnboardingStep {
  title: string
  description: string
  icon: React.ReactNode
  color: string
}

const STEPS: OnboardingStep[] = [
  {
    title: "Welcome to GemKeeper",
    description: "Your wisdom accountability partner. Capture insights, surface them at the right moments, and stay accountable for applying what you learn.",
    icon: <Gem className="h-12 w-12" />,
    color: "from-primary to-primary/80",
  },
  {
    title: "Capture Gems",
    description: "Save insights from books, podcasts, and life. Keep up to 10 active gems at a time to stay focused on what matters most.",
    icon: <Sparkles className="h-12 w-12" />,
    color: "from-amber-500 to-orange-500",
  },
  {
    title: "Right Moment, Right Wisdom",
    description: "Daily prompts surface your gems when you need them. Each morning, you'll get a gem to focus on for the day.",
    icon: <Bell className="h-12 w-12" />,
    color: "from-blue-500 to-indigo-500",
  },
  {
    title: "Actually Apply It",
    description: "Accountability check-ins track your progress. Apply a gem 5 times to graduate it to your trophy case.",
    icon: <CheckCircle className="h-12 w-12" />,
    color: "from-green-500 to-emerald-500",
  },
]

export function Onboarding({ onComplete, onSkip }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === STEPS.length - 1
  const step = STEPS[currentStep]

  const handleNext = () => {
    if (isLastStep) {
      onComplete()
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      {/* Theme toggle in top-right corner */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-lg">
        <CardContent className="pt-8 pb-6">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div
              className={cn(
                "w-24 h-24 rounded-full bg-gradient-to-br flex items-center justify-center text-white",
                step.color
              )}
            >
              {step.icon}
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-3">{step.title}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-8">
            {STEPS.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all",
                  index === currentStep
                    ? "bg-primary w-6"
                    : "bg-muted hover:bg-muted-foreground/30"
                )}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={onSkip}
              className="text-muted-foreground"
            >
              Skip
            </Button>

            <div className="flex gap-2">
              {!isFirstStep && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
              <Button onClick={handleNext} className="gap-1">
                {isLastStep ? (
                  "Get Started"
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
