import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTeamMembers } from "@/hooks/auth/use-team-members";
import TeamMembersSection from "./TeamMemberSection";

const ROLE_LEVELS = [
  { value: 1, label: "Intern" },
  { value: 2, label: "Junior" },
  { value: 3, label: "Senior" },
  { value: 4, label: "Manager" },
  { value: 5, label: "Director" },
  { value: 6, label: "Exec" }
];

export default function InviteUserPage() {
  const navigate = useNavigate();
  const { inviteTeamMember, isLoading, error } = useTeamMembers();
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    roleLevel: ""
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleRoleChange = (value) => {
    setFormData(prev => ({
      ...prev,
      roleLevel: parseInt(value)
    }));
  };

  const handleCancel = () => {
    navigate("/secrets");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await inviteTeamMember({
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        role_level: formData.roleLevel
      });
      
      // Clear form and show success message
      setFormData({
        email: "",
        firstName: "",
        lastName: "",
        roleLevel: ""
      });
      
      // Optionally show success message or redirect
      alert("Invitation sent successfully!");
    } catch (err) {
      console.error("Failed to invite team member:", err);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Invite Team Member</CardTitle>
            <CardDescription>
              Send an invitation to a new team member
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              
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
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Role Level</Label>
                <Select 
                  onValueChange={handleRoleChange}
                  value={formData.roleLevel.toString()}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role level" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_LEVELS.map((role) => (
                      <SelectItem 
                        key={role.value} 
                        value={role.value.toString()}
                      >
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Send Invitation"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Team Members List */}
        <TeamMembersSection />
      </div>
    </div>
  );
}