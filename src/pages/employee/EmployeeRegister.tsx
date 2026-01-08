import { useState } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import signup from "../../assets/register-image.png"
import { completeEmployeeRegister } from '../../API/employee.api'
import { errorPopup } from '../../utils/popup'
import { setEmployeeData } from '../../features/employee/employeeSlice'

function EmployeeRegister() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const [searchParams] = useSearchParams()
  const [isLoading, setIsLoading] = useState(false);
  
  // Get companyid from URL query params (preferred) or state
  const companyIdFromUrl = searchParams.get("companyid") || location.state?.companyid || '';
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: location.state?.email || '',
    position: '',
    address: '',
    companyId: companyIdFromUrl
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
    if (!formData.name || !formData.email || !formData.position || !formData.address) {
      errorPopup("Please fill in all fields");
      return;
    }

    if (!formData.companyId) {
      errorPopup("Company ID is missing. Please start registration again.");
      navigate("/employee/login");
      return;
    }

    setIsLoading(true);

    try {
      await completeEmployeeRegister({
        name: formData.name,
        email: formData.email,
        position: formData.position,
        address: formData.address,
        companyId: formData.companyId
      });

      // Store employee data in Redux
      dispatch(setEmployeeData({
        name: formData.name,
        email: formData.email,
        position: formData.position,
        address: formData.address,
        companyId: formData.companyId,
        status: "requested"
      }));

      navigate(`/employee/login?companyid=${formData.companyId}`);
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
          alt="Employee Illustration"
          src={signup}
          className="max-w-xs md:max-w-sm lg:max-w-md object-contain"
        />
      </div>

      {/* Right Section - Employee Registration Form */}
      <div className="flex flex-col justify-center items-start w-full lg:w-1/2 px-6 sm:px-12 relative">
        {/* HIVE heading positioned top-left of the right panel */}
        <div className="absolute top-12 left-6 lg:left-13">
          <h1 className="text-4xl md:text-5xl font-serif italic text-gray-800 mb-2 text-center">
            HIVE
          </h1>
          <p className="bold text-sm text-gray-700 text-center mb-4">Complete your profile</p>
        </div>

        {/* Form container */}
        <div className="w-full max-w-md mt-36 lg:mt-36">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {/* Name */}
            <div>
              <input
                type="text"
                name="name"
                placeholder="Full Name"
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

            {/* Position */}
            <div>
              <input
                type="text"
                name="position"
                placeholder="Position"
                value={formData.position}
                onChange={handleChange}
                className="w-full border-b border-gray-300 focus:outline-none focus:border-black px-2 py-2 text-sm"
                required
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
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Registering...
                  </>
                ) : (
                  "Complete Registration"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EmployeeRegister

