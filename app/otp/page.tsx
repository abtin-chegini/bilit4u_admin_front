import { OtpForm } from "@/components/login/otp_form"

export default function OtpPage() {
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

      {/* Right side - OTP Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#f8fcff]">
        <div className="w-full max-w-md">
          <OtpForm />
        </div>
      </div>
    </div>
  )
}
