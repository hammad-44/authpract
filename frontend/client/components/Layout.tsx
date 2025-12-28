import { ReactNode } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  LogOut,
  LayoutDashboard,
  ShoppingCart,
  CreditCard,
  Clock,
} from "lucide-react";
import { clearTokens } from "@/utils/auth";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    clearTokens();
    navigate("/login");
  };

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/products", label: "Products", icon: ShoppingCart },
    { path: "/pricing", label: "Subscriptions", icon: CreditCard },
    { path: "/history", label: "History", icon: Clock },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="text-2xl font-bold text-sidebar-foreground">
            Auth<span className="text-sidebar-primary">Pay</span>
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link key={item.path} to={item.path}>
                <div
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group relative ${active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20 translate-x-1"
                    : "text-sidebar-foreground/50 hover:bg-sidebar-accent/10 hover:text-sidebar-foreground"
                    }`}
                >
                  <Icon className={`w-5 h-5 transition-all duration-300 ${active ? "scale-110" : "group-hover:scale-110 group-hover:text-sidebar-primary"}`} />
                  <span className={`text-xs font-black uppercase tracking-[0.15em] ${active ? "" : "opacity-60 group-hover:opacity-100"}`}>
                    {item.label}
                  </span>
                  {active && (
                    <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-sidebar-primary-foreground shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-sidebar-border">
          <Button onClick={handleLogout} variant="outline" className="w-full">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-background border-b border-border px-8 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">
            Authorized Payment Practice
          </h2>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-8 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
