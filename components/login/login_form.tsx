"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { EyeIcon } from "@/components/ui/icons_custom/EyeIcon"
import { EyeOffIcon } from "@/components/ui/icons_custom/EyeOffIcon"
import Image from "next/image"

export function LoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const { error: authError, needsOtp } = await signIn(username, password)

      if (authError) {
        setError(authError.message || "خطا در ورود. لطفا مجددا تلاش کنید.")
        return
      }

      if (needsOtp) {
        console.log("OTP required, redirecting to OTP page")
        // Navigate to OTP page
        router.push("/otp")
      } else {
        console.log("Login successful")
        // Navigate to dashboard on successful login
        router.push("/dashboard")
      }
    } catch (err: any) {
      console.error("Login failed:", err)
      setError("خطا در ورود. لطفا مجددا تلاش کنید.")
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
        <h1 className="text-2xl font-iran-yekan-bold text-[#2b2b2b] text-right">ورود به پنل مدیریت کاربران</h1>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-right font-iran-yekan">
              {error}
            </div>
          )}

          {/* Username Field */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-right block text-[#2b2b2b] font-iran-yekan text-base">
              نام کاربری
            </Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="text-right bg-white border-[#d9d9d9] focus:border-[#0d5990] focus:ring-[#0d5990] font-iran-yekan h-12 text-base px-4"
              dir="rtl"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-right block text-[#2b2b2b] font-iran-yekan text-base">
              رمز عبور
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-right bg-white border-[#d9d9d9] focus:border-[#0d5990] focus:ring-[#0d5990] font-iran-yekan h-12 text-base px-4 pr-12"
                dir="rtl"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOffIcon size={20} className="text-gray-400" />
                ) : (
                  <EyeIcon size={20} className="text-gray-400" />
                )}
              </button>
            </div>
          </div>


          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#0d5990] hover:bg-[#0d5990]/90 disabled:bg-[#0d5990]/50 text-white font-iran-yekan py-4 text-lg h-14"
          >
            {isLoading ? "در حال ورود..." : "تایید و ورود"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
