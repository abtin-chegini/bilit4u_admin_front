"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import Image from "next/image"

export function OtpForm() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isVerified, setIsVerified] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [timer, setTimer] = useState(120) // 2 minutes timer
  const [canResend, setCanResend] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const hasSentInitialOtp = useRef(false)
  const router = useRouter()
  const { verifyOtp, needsOtp, sendOtp } = useAuth()

  // Redirect to login if OTP is not needed (only check once on mount)
  useEffect(() => {
    if (!needsOtp) {
      router.push('/login')
    }
  }, [needsOtp, router])

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return // Prevent multiple characters

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setError("") // Clear error when user types

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").slice(0, 6)
    const newOtp = [...otp]

    for (let i = 0; i < pastedData.length && i < 6; i++) {
      if (/^\d$/.test(pastedData[i])) {
        newOtp[i] = pastedData[i]
      }
    }

    setOtp(newOtp)

    // Focus the next empty input or the last input
    const nextEmptyIndex = newOtp.findIndex((digit) => digit === "")
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex
    inputRefs.current[focusIndex]?.focus()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Prevent multiple submissions
    if (isSubmitting || isVerified || isLoading) {
      return
    }

    const otpCode = otp.join("")
    if (otpCode.length === 6) {
      setIsSubmitting(true)
      setIsLoading(true)
      setError("")

      try {
        console.log('🔐 [OTP FORM] Starting OTP verification...')
        const { error: authError } = await verifyOtp(otpCode)

        if (authError) {
          setError(authError.message || "خطا در تایید کد. لطفا مجددا تلاش کنید.")
        } else {
          // OTP verification successful - redirect immediately
          setIsVerified(true)
          setIsRedirecting(true)
          setError("")
          console.log('✅ [OTP FORM] OTP verification successful, redirecting to dashboard...')

          // Redirect immediately without delay
          router.push('/dashboard')
        }
      } catch (err: any) {
        console.error("OTP verification failed:", err)
        setError("خطا در تایید کد. لطفا مجددا تلاش کنید.")
      } finally {
        setIsLoading(false)
        setIsSubmitting(false)
      }
    }
  }

  // Send OTP when component mounts (only once)
  useEffect(() => {
    if (needsOtp && !hasSentInitialOtp.current) {
      hasSentInitialOtp.current = true
      sendOtp()
      // Start timer when OTP is sent
      setTimer(120) // 2 minutes
      setCanResend(false)
    }
  }, [needsOtp, sendOtp])

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (timer > 0 && !isVerified && !isRedirecting) {
      interval = setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer <= 1) {
            setCanResend(true)
            return 0
          }
          return prevTimer - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [timer, isVerified, isRedirecting])

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus()
  }, [])

  const handleResendOtp = async () => {
    if (!canResend) return

    setIsLoading(true)
    setError("")

    try {
      const { error: sendError } = await sendOtp()

      if (sendError) {
        setError(sendError.message || "خطا در ارسال مجدد کد. لطفا مجددا تلاش کنید.")
      } else {
        setError("")
        // Clear OTP inputs
        setOtp(["", "", "", "", "", ""])
        // Reset timer
        setTimer(120) // 2 minutes
        setCanResend(false)
        // Focus first input
        inputRefs.current[0]?.focus()
      }
    } catch (err: any) {
      console.error("Resend OTP failed:", err)
      setError("خطا در ارسال مجدد کد. لطفا مجددا تلاش کنید.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="text-center pb-8">
        <div className="flex items-center justify-center mb-8">
          <Image
            src="/images/bilit4u-logo.png"
            alt="Bilit4U Logo"
            width={200}
            height={60}
            className="h-12 w-auto"
            priority
          />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-iran-yekan-bold text-[#2b2b2b] text-right mb-4">دریافت کد</h1>

        {/* Instruction Text */}
        <p className="text-base text-[#2b2b2b] text-right leading-relaxed font-iran-yekan">
          لطفا کد ارسال شده به برنامه مدیریت پسورد های خود را وارد نمایید :
        </p>

        {/* Timer Display */}
        {!isVerified && !isRedirecting && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-blue-700 font-iran-yekan text-sm">
                {canResend ? "کد منقضی شده است" : `زمان باقی مانده: ${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, '0')}`}
              </span>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Success Message with Spinner */}
          {isVerified && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-right font-iran-yekan">
              <div className="flex items-center justify-end gap-2">
                {isRedirecting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-600 border-t-transparent"></div>
                )}
                <span>کد تایید شد. در حال انتقال به داشبورد...</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-right font-iran-yekan">
              {error}
            </div>
          )}

          {/* OTP Input Fields */}
          <div className="flex justify-center gap-3 rtl:flex-row-reverse">
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => { inputRefs.current[index] = el }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-16 h-16 text-center text-xl font-iran-yekan bg-white border-[#d9d9d9] focus:border-[#0d5990] focus:ring-[#0d5990] rounded-lg"
                dir="ltr"
              />
            ))}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={otp.some((digit) => digit === "") || isLoading || isVerified || isSubmitting || isRedirecting}
            className="w-full bg-[#0d5990] hover:bg-[#0d5990]/90 disabled:bg-[#d9d9d9] disabled:text-[#2b2b2b] text-white font-iran-yekan py-4 text-lg h-14"
          >
            {isLoading ? "در حال تایید..." : isRedirecting ? "در حال انتقال..." : isVerified ? "تایید شد" : "تایید و ورود"}
          </Button>

          {/* Resend Code Link */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={isLoading || isRedirecting || !canResend}
              className={`text-base font-iran-yekan transition-colors ${canResend && !isLoading && !isRedirecting
                ? "text-[#0d5990] hover:underline cursor-pointer"
                : "text-gray-400 cursor-not-allowed"
                }`}
            >
              {isLoading
                ? "در حال ارسال..."
                : isRedirecting
                  ? "در حال انتقال..."
                  : canResend
                    ? "ارسال مجدد کد"
                    : `ارسال مجدد (${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, '0')})`
              }
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
