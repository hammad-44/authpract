import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { paymentsAPI } from "@/api/payments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await paymentsAPI.login({ username, password });
      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Login failed");
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
            <h3 className="text-2xl font-semibold">Secure Payments</h3>
            <p className="text-primary-100">
              Test and manage payment transactions with industry-leading
              security protocols and compliance standards.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-2xl font-semibold">Subscription Ready</h3>
            <p className="text-primary-100">
              Build and manage recurring billing with flexible subscription
              plans tailored to your business needs.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-2xl font-semibold">Analytics & History</h3>
            <p className="text-primary-100">
              Track all your transactions and subscriptions in one unified
              dashboard with real-time insights.
            </p>
          </div>
        </div>

        <div className="text-primary-100 text-sm">
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 py-12 sm:px-12 lg:px-16 bg-slate-50">
        <div className="max-w-md w-full mx-auto bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-slate-500">
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-700 font-medium">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                className="bg-white border-slate-200 h-11 focus:ring-primary-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-slate-700 font-medium">
                  Password
                </Label>
                <Link to="#" className="text-xs text-primary-600 hover:text-primary-700">Forgot password?</Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="bg-white border-slate-200 h-11 focus:ring-primary-500"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white h-11 transition-all duration-200 shadow-lg shadow-primary-200 flex items-center justify-center gap-2"
              size="lg"
            >
              {loading ? "Signing in..." : "Sign In"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-600">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-primary-600 hover:text-primary-700 font-bold"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
