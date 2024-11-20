import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLogin } from "@/hooks/auth";
import { Separator } from "@/components/ui/separator";
import { Mail } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error } = useLogin();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await login(formData);
      // Navigate to secrets page after successful login
      navigate("/secrets", { replace: true });
    } catch (err) {
      // Error is handled by the hook
      console.error("Login failed:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                {error === "Incorrect username or password" 
                  ? "Invalid email or password" 
                  : error}
              </AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
        <Separator className="my-4" />
        <CardFooter>
          <div className="space-y-4 w-full">
            <div className="text-sm text-muted-foreground text-center">
              Have an invitation?
            </div>
            <Alert className="bg-primary/5 border-primary/10">
              <Mail className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm text-muted-foreground">
                Check your email for an invitation link to set up your account. If you cannott find the email, you can 
                <Link 
                  to="/accept-invite/token" 
                  className="text-primary hover:text-primary/80 font-medium mx-1"
                >
                  manually enter your invite token here
                </Link>.
              </AlertDescription>
            </Alert>
            <div className="text-xs text-center text-muted-foreground">
              <span>Need help? Contact your team administrator</span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}