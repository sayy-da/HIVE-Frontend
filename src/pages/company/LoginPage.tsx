
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import loginImage from "../../assets/login-image.png";
import { loginCompany } from "../../API/company.auth";
import { login } from "../../features/company/companySlice";
import { AppDispatch } from "../../store";
import { errorPopup } from "../../utils/popup";

export default function LoginPage() {
  const dispatch: AppDispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/company";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password) {
      errorPopup("Please enter email and password");
      return;
    }

    setIsLoading(true);
    try {
      const data = await loginCompany(email, password);
      if (!data) return;
      dispatch(login(data));
      navigate(from, { replace: true });
    } catch (err: any) {
      const data = err?.response?.data;
      let msg = "Login failed. Please try again.";

      const raw = data?.error ?? data?.message ?? data;

      const parseMessagesFromString = (str: string) => {
        try {
          const parsed = JSON.parse(str);
          if (Array.isArray(parsed)) {
            const joined = parsed.map((e: any) => e?.message).filter(Boolean).join(", ");
            return joined || str;
          }
        } catch {
          // not JSON
        }
        return str;
      };

      if (Array.isArray(raw)) {
        const joined = raw.map((e: any) => e?.message).filter(Boolean).join(", ");
        msg = joined || msg;
      } else if (typeof raw === "string") {
        msg = parseMessagesFromString(raw);
      } else if (raw?.message) {
        msg = raw.message;
      }

      errorPopup(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex flex-col justify-center items-center w-1/2 bg-gray-100 p-10">
        <img
          src={loginImage}
          alt="Hive Illustration"
          className="max-w-xs md:max-w-sm lg:max-w-md object-contain"
        />
      </div>

      <div className="flex flex-col justify-center items-start w-full lg:w-1/2 px-6 sm:px-12 relative ">
        <div className="absolute top-40 left-6 lg:left-13">
          <h1 className="text-4xl md:text-5xl font-serif italic text-gray-800 mb-2 text-center">
            HIVE
          </h1>
          <p className="bold text-sm text-gray-700 text-center mb-4">
            Fly into HIVE!
          </p>
        </div>

        <div className="w-full max-w-md mt-36 lg:mt-36">
          <form className="space-y-6" onSubmit={handleLogin} noValidate>
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
                  required
                  disabled={isLoading}
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
                  required
                  disabled={isLoading}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-sm opacity-75 px-2"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isLoading}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full inline-flex items-center justify-center py-3 rounded-md text-white text-sm font-medium shadow-xl transform transition ${
                  isLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-black active:translate-y-[1px]"
                }`}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4"
                  disabled={isLoading}
                />
                <span className="text-gray-600">Remember me</span>
              </label>

              <button
                type="button"
                className="text-sm hover:underline"
                disabled={isLoading}
              >
                Forgot password?
              </button>
            </div>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/getStart")}
              className="text-black font-medium hover:underline"
              disabled={isLoading}
            >
              Create account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
