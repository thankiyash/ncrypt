import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAcceptInvite } from "@/hooks/auth/use-accept-invite";
import { LockIcon, Loader2 } from "lucide-react";

export default function AcceptInvitePage() {
  const navigate = useNavigate();
  const { token: urlToken } = useParams();
  const { acceptInvite, isLoading, error } = useAcceptInvite();
  const [formData, setFormData] = useState({
    token: "",
    password: "",
    confirmPassword: "",
  });
  const [validationError, setValidationError] = useState("");

  // Set token from URL params when component mounts
  useEffect(() => {
    if (urlToken) {
      setFormData(prev => ({
        ...prev,
        token: urlToken
      }));
    }
  }, [urlToken]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
    setValidationError(""); // Clear validation error when user types
  };

  const validateForm = () => {
    if (!formData.token) {
      setValidationError("Please enter your invitation token");
      return false;
    }

    if (formData.password.length < 8) {
      setValidationError("Password must be at least 8 characters long");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setValidationError("Passwords do not match");
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
      await acceptInvite({
        token: formData.token,
        password: formData.password,
      });

      navigate("/login");
    } catch (err) {
      console.error("Failed to accept invitation:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <LockIcon className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Accept Invitation</CardTitle>
          <CardDescription className="text-center">
            Set up your account to join your team
          </CardDescription>
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
              <Label htmlFor="token">Invitation Token</Label>
              <Input
                id="token"
                value={formData.token}
                onChange={handleChange}
                placeholder="Paste your invitation token"
                required
                readOnly={!!urlToken}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a secure password"
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
                placeholder="Confirm your password"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up account...
                </>
              ) : (
                "Complete Setup"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}