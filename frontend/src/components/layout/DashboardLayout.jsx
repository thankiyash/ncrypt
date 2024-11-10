// src/components/layout/DashboardLayout.jsx
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  LockIcon,
  MenuIcon,
  UserPlusIcon,
  LogOutIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/auth";
import { cn } from "@/lib/utils";

const navItems = [
  {
    title: "Secrets",
    href: "/secrets",
    icon: LockIcon
  },
  {
    title: "Invite User",
    href: "/invite-user",
    icon: UserPlusIcon
  }
];

export default function DashboardLayout({ children }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(true)}
            className="mr-2 md:hidden"
          >
            <MenuIcon className="h-5 w-5" />
          </Button>
          <div className="ml-auto flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              {user?.email}
            </span>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[240px] sm:w-[280px]">
          <SheetHeader>
            <SheetTitle>Password Manager</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col space-y-4 py-4">
            {navItems.map(({ title, href, icon: Icon }) => (
              <Link
                key={href}
                to={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center space-x-2 text-sm font-medium rounded-md p-2",
                  location.pathname === href
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-secondary/50"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{title}</span>
              </Link>
            ))}
            <Separator />
            <Button
              variant="ghost"
              className="justify-start space-x-2"
              onClick={handleLogout}
            >
              <LogOutIcon className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r bg-background px-6 pb-4">
          <div className="flex h-14 items-center">
            <h2 className="text-lg font-semibold">Password Manager</h2>
          </div>
          <nav className="flex flex-1 flex-col space-y-2">
            {navItems.map(({ title, href, icon: Icon }) => (
              <Link
                key={href}
                to={href}
                className={cn(
                  "flex items-center space-x-2 text-sm font-medium rounded-md p-2",
                  location.pathname === href
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-secondary/50"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{title}</span>
              </Link>
            ))}
            <Separator />
            <Button
              variant="ghost"
              className="justify-start space-x-2"
              onClick={handleLogout}
            >
              <LogOutIcon className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:pl-64">
        <main className="py-6">
          <div className="px-4 sm:px-6 md:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

// Add PropTypes validation
DashboardLayout.propTypes = {
  children: PropTypes.node.isRequired
};