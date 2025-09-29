"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import Image from "next/image"

export function OtpForm() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return // Prevent multiple characters

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const otpCode = otp.join("")
    if (otpCode.length === 6) {
      console.log("OTP submitted:", otpCode)
      // Handle OTP verification logic here
    }
  }

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus()
  }, [])

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
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-10">
          {/* OTP Input Fields */}
          <div className="flex justify-center gap-3 rtl:flex-row-reverse">
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
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
            disabled={otp.some((digit) => digit === "")}
            className="w-full bg-[#0d5990] hover:bg-[#0d5990]/90 disabled:bg-[#d9d9d9] disabled:text-[#2b2b2b] text-white font-iran-yekan py-4 text-lg h-14"
          >
            تایید و ورود
          </Button>

          {/* Resend Code Link */}
          <div className="text-center">
            <button type="button" className="text-base text-[#0d5990] hover:underline font-iran-yekan">
              ارسال مجدد کد
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
