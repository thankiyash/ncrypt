import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import TeamMembersSection from "./TeamMemberSection";

export default function InviteUserPage() {
  const handleSubmit = (e) => {
    e.preventDefault();
    // Add invite logic here
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Invite Form */}
        <Card>
          <CardHeader>
            <CardTitle>Invite Team Member</CardTitle>
            <CardDescription>
              Send an invitation to a new team member
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@company.com"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
                <Button type="submit">
                  Send Invitation
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