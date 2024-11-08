// src/pages/auth/OwnerSetupPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useOwnerSetup, useAuth } from "@/hooks/auth";

export default function OwnerSetupPage() {
  const navigate = useNavigate();
  const { setupOwner, isLoading, error } = useOwnerSetup();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [validationError, setValidationError] = useState("");

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
    // Clear validation error when user starts typing
    setValidationError("");
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setValidationError("Passwords don't match");
      return false;
    }

    if (formData.password.length < 8) {
      setValidationError("Password must be at least 8 characters");
      return false;
    }

    if (!formData.firstName.trim()) {
      setValidationError("First name is required");
      return false;
    }

    if (!formData.email.trim()) {
      setValidationError("Email is required");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    if (!validateForm()) {
      return;
    }

    try {
      const response = await setupOwner({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName
      });

      // Update auth context with the new user data
      login(response);

      // Redirect to secrets page after successful setup
      navigate("/secrets");
    } catch (err) {
      console.error("Setup failed:", err);
      // Error is handled by the hook and displayed via the error prop
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Setup Admin Account</CardTitle>
          <CardDescription>Create your administrator account to get started</CardDescription>
        </CardHeader>
        <CardContent>
          {(error || validationError) && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                {validationError || error}
              </AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input 
                id="firstName"
                placeholder="John"
                value={formData.firstName}
                onChange={handleChange}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input 
                id="lastName"
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                required 
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
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input 
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required 
                minLength={8}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}