import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import getStart from "../../assets/getstart.webp";
import { registerCompany } from "../../API/company.auth";
import { errorPopup } from "../../utils/popup";

const GetStartPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false); // New: Loading state

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) {
      errorPopup("Please enter your email");
      return;
    }

    setIsLoading(true); // Start loading

    try {
      await registerCompany(email);
      navigate("/otp", { state: { email } });
      setEmail(""); 
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || "Something went wrong. Please try again.";
      errorPopup(errorMessage);
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  return (
    <div className="flex min-h-screen" >
      {/* Left Column: Illustration */}
      <div className="hidden lg:flex flex-col justify-center items-center w-1/2 bg-gray-100 p-10">
        <img
          src={getStart}
          alt="Hive Illustration"
          className="w-full max-w-lg md:max-w-xl lg:max-w-2xl object-contain"
        />
      </div>

      {/* Right Column: Form */}
      <div className=" flex flex-col justify-center items-start w-full lg:w-1/2 px-6 sm:px-12 relative">
        <div className="absolute top-8 left-6 lg:left-13">
          <h1 className="text-4xl md:text-5xl font-serif italic text-gray-800 mb-2">
            HIVE
          </h1>
          <p className="bold text-sm text-gray-700 mb-4">Get started with HIVE</p>
        </div>

        <div className="w-full max-w-md mt-40 lg:mt-36">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="relative">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border-b border-gray-300 focus:outline-none focus:border-black px-2 py-2 text-sm"
                  required // HTML5 validation
                  disabled={isLoading} // Disable input while loading
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                // New: Disable button while loading
                disabled={isLoading} 
                className={`
                  w-full inline-flex items-center justify-center py-3 rounded-md text-white text-sm font-medium shadow-xl transition
                  ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-black transform active:translate-y-[1px]'}
                `}
              >
                {/* New: Conditional button text/spinner */}
                {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  "Submit"
                )}
              </button>
            </div>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-black font-medium hover:underline"
              disabled={isLoading}
            >
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default GetStartPage;