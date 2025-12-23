import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import signup from "../../assets/register-image.png"
import { completeRegister } from '../../API/company.auth'
import { errorPopup, successPopup } from '../../utils/popup'

function CompanyRegister() {
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: location.state?.email || '',
    count: '',
    address: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.email || !formData.count || !formData.address || !formData.password) {
      errorPopup("Please fill in all fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      errorPopup("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      errorPopup("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      await completeRegister({
        email: formData.email,
        name: formData.name,
        count: parseInt(formData.count),
        address: formData.address,
        password: formData.password
      });

      successPopup("Registration completed successfully! You can now login.");
      navigate("/login");
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || "Registration failed. Please try again.";
      errorPopup(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Section (illustration / welcome area) */}
      <div className="hidden lg:flex flex-col justify-center items-center w-1/2 bg-gray-100 p-10">
        <img
          alt="Company Illustration"
          src={signup}
          className="max-w-xs md:max-w-sm lg:max-w-md object-contain"
        />
      </div>

      {/* Right Section - Company Registration Form */}
      <div className="flex flex-col justify-center items-start w-full lg:w-1/2 px-6 sm:px-12 relative">
        {/* HIVE heading positioned top-left of the right panel */}
        <div className="absolute top-12 left-6 lg:left-13">
          <h1 className="text-4xl md:text-5xl font-serif italic text-gray-800 mb-2 text-center">
            HIVE
          </h1>
          <p className="bold text-sm text-gray-700 text-center mb-4">Let's make it official</p>
        </div>

        {/* Form container */}
        <div className="w-full max-w-md mt-36 lg:mt-36">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {/* Company Name */}
            <div>
              <input
                type="text"
                name="name"
                placeholder="Company Name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border-b border-gray-300 focus:outline-none focus:border-black px-2 py-2 text-sm"
                required
                disabled={isLoading}
              />
            </div>

            {/* Email (read-only if from OTP flow) */}
            <div>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border-b border-gray-300 focus:outline-none focus:border-black px-2 py-2 text-sm"
                required
                disabled={isLoading || !!location.state?.email}
              />
            </div>

            {/* Number of Employees */}
            <div>
              <input
                type="number"
                name="count"
                placeholder="Number of Employees"
                value={formData.count}
                onChange={handleChange}
                className="w-full border-b border-gray-300 focus:outline-none focus:border-black px-2 py-2 text-sm"
                required
                min="1"
                disabled={isLoading}
              />
            </div>

            {/* Address */}
            <div>
              <input
                type="text"
                name="address"
                placeholder="Address"
                value={formData.address}
                onChange={handleChange}
                className="w-full border-b border-gray-300 focus:outline-none focus:border-black px-2 py-2 text-sm"
                required
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="w-full border-b border-gray-300 focus:outline-none focus:border-black px-2 py-2 text-sm"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-sm opacity-75 px-2"
                disabled={isLoading}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full border-b border-gray-300 focus:outline-none focus:border-black px-2 py-2 text-sm"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-sm opacity-75 px-2"
                disabled={isLoading}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>

            {/* Submit */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full inline-flex items-center justify-center py-3 rounded-md text-white text-sm font-medium shadow-xl transform transition ${
                  isLoading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-black active:translate-y-[1px]'
                }`}
              >
                {isLoading ? "Registering..." : "Register Company"}
              </button>
            </div>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Already registered?{" "}
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
  )
}

export default CompanyRegister
