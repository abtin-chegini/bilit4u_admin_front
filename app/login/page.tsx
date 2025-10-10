"use client";

import { LoginForm } from "@/components/login/login_form"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function LoginPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fcff]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0d5990] mx-auto"></div>
          <p className="mt-4 text-[#2b2b2b] font-iran-yekan">در حال بررسی احراز هویت...</p>
        </div>
      </div>
    )
  }

  // If user exists, show loading while redirecting
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fcff]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0d5990] mx-auto"></div>
          <p className="mt-4 text-[#2b2b2b] font-iran-yekan">در حال انتقال به داشبورد...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Background Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-white">
        <div
          className="absolute left-0 top-0 bottom-0 w-full bg-contain bg-left bg-no-repeat"
          style={{
            backgroundImage: `url('/images/login_cover_700px.jpg')`,
          }}
        />
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#f8fcff]">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
