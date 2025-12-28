import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { paymentsAPI } from "@/api/payments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await paymentsAPI.register({ username, email, password });
      toast.success("Account created! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Marketing */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-900 flex-col justify-between p-12 text-white">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            Auth<span className="text-primary-200">Pay</span>
          </h1>
          <p className="text-primary-100 text-lg">Authorized Payment Testing</p>
        </div>

        <div className="space-y-8">
          <div className="space-y-3">
            <h3 className="text-2xl font-semibold">Get Started Today</h3>
            <p className="text-primary-100">
              Create your account in minutes and start testing payment
              transactions with our powerful platform.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-2xl font-semibold">No Credit Card Required</h3>
            <p className="text-primary-100">
              Sign up for free and explore all the features of AuthPay without
              any hidden fees or commitments.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-2xl font-semibold">Full Documentation</h3>
            <p className="text-primary-100">
              Access comprehensive guides and API documentation to integrate
              AuthPay into your application.
            </p>
          </div>
        </div>

        <div className="text-primary-100 text-sm">
          © 2024 AuthPay. All rights reserved.
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 py-12 sm:px-12 lg:px-16 bg-slate-50">
        <div className="max-w-md w-full mx-auto bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              Create Account
            </h2>
            <p className="text-slate-500">
              Join AuthPay to start testing payments
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-700 font-medium">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                className="bg-white border-slate-200 h-11 focus:ring-primary-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="bg-white border-slate-200 h-11 focus:ring-primary-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="bg-white border-slate-200 h-11 focus:ring-primary-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-700 font-medium">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className="bg-white border-slate-200 h-11 focus:ring-primary-500"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white h-11 transition-all duration-200 shadow-lg shadow-primary-200 mt-4 flex items-center justify-center gap-2"
              size="lg"
            >
              {loading ? "Creating account..." : "Create Account"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary-600 hover:text-primary-700 font-bold"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
