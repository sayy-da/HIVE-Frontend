import  { useState } from 'react'
import login  from "../../assets/getstart.webp"
function AdminLogin() {
   const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    return (
      <div className="flex min-h-screen">

        {/* Left Section (illustration / welcome area) */}
        <div className="hidden lg:flex flex-col justify-center items-center w-1/2 bg-gray-100 p-10">
          <img
            src={login}
            alt="Hive Illustration"
            className="max-w-xs md:max-w-sm lg:max-w-md object-contain"
          />
        
        </div>
  
        {/* Right Section - Get Started Form */}
        <div className="flex flex-col justify-center items-start w-full lg:w-1/2 px-6 sm:px-12 relative ">
          {/* HIVE heading positioned top-left of the right panel */}
          <div className="absolute top-40 left-6 lg:left-13">
            <h1 className="text-4xl md:text-5xl font-serif italic text-gray-800 mb-2 text-center">
              HIVE
            </h1>
            <p className="bold text-sm text-gray-700 text-center mb-4">Fly into HIVE!</p>
          </div>
  
          {/* Form container */}
          <div className="w-full max-w-md mt-36 lg:mt-36">
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()} noValidate>
              <div>
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border-b border-gray-300 focus:outline-none focus:border-black px-2 py-2 text-sm"
                  />
                </div>
              </div>
  
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border-b border-gray-300 focus:outline-none focus:border-black px-2 py-2 text-sm"
                  />
  
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-sm opacity-75 px-2"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
  
              <div>
                <button
                  type="button"
                  className={`w-full inline-flex items-center justify-center py-3 rounded-md bg-black text-white text-sm font-medium shadow-xl transform active:translate-y-[1px] transition`}
                >
                  Sign in
                </button>
              </div>
  
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4" />
                  <span className="text-gray-600">Remember me</span>
                </label>
  
                <button type="button" className="text-sm hover:underline">
                  Forgot password?
                </button>
              </div>
            </form>
  
            <p className="text-center text-sm text-gray-600 mt-6">
              Don't have an account?{" "}
              <button type="button" className="text-black font-medium hover:underline">
                Create account
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }
  
export default AdminLogin
