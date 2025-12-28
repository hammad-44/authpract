import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { isAuthenticated } from "@/utils/auth";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Pricing from "./pages/Pricing";
import History from "./pages/History";
import NotFound from "./pages/NotFound";

// Protected Route Component
function ProtectedRoute({ element }: { element: React.ReactNode }) {
  return isAuthenticated() ? element : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={<ProtectedRoute element={<Dashboard />} />}
        />
        <Route
          path="/products"
          element={<ProtectedRoute element={<Products />} />}
        />
        <Route
          path="/pricing"
          element={<ProtectedRoute element={<Pricing />} />}
        />
        <Route
          path="/history"
          element={<ProtectedRoute element={<History />} />}
        />

        {/* Home redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
