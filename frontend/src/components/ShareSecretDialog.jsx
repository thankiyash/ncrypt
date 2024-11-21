// src/components/ShareSecretDialog.jsx
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTeamMembers } from "@/hooks/auth/use-team-members";
import { Users2Icon } from "lucide-react";

function ShareSecretDialog({ 
  secret,
  isOpen,
  onOpenChange,
  onShare,
  currentUserRoleLevel
}) {
  const { getTeamMembers, isLoading, error } = useTeamMembers();
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [shareWithAll, setShareWithAll] = useState(false);

  useEffect(() => {
    const loadTeamMembers = async () => {
      try {
        const members = await getTeamMembers();
        const filteredMembers = members.filter(member => 
          member.id !== secret.created_by_user_id &&
          member.role_level >= currentUserRoleLevel
        );
        setTeamMembers(filteredMembers);
      } catch (err) {
        console.error("Failed to load team members:", err);
      }
    };

    if (isOpen) {
      loadTeamMembers();
    }
  }, [isOpen, secret, currentUserRoleLevel]);

  const handleShare = async () => {
    try {
      await onShare({
        shared_with_user_ids: selectedUsers,
        share_with_all: shareWithAll
      });
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to share secret:", err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Secret</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="shareWithAll"
              checked={shareWithAll}
              onCheckedChange={setShareWithAll}
            />
            <Label htmlFor="shareWithAll">
              Share with all team members (respecting role hierarchy)
            </Label>
          </div>

          {!shareWithAll && (
            <div className="space-y-2">
              <Label>Select users to share with</Label>
              <Select
                onValueChange={(value) => setSelectedUsers(prev => [...prev, parseInt(value)])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select users" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem
                      key={member.id}
                      value={member.id.toString()}
                      disabled={selectedUsers.includes(member.id)}
                    >
                      {member.email} ({member.first_name} {member.last_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedUsers.length > 0 && (
                <div className="mt-4">
                  <Label>Selected Users:</Label>
                  <div className="mt-2 space-y-2">
                    {selectedUsers.map((userId) => {
                      const member = teamMembers.find(m => m.id === userId);
                      return (
                        <div key={userId} className="flex items-center justify-between bg-secondary p-2 rounded-md">
                          <span>{member?.email}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedUsers(prev => prev.filter(id => id !== userId))}
                          >
                            Remove
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={isLoading || (!shareWithAll && selectedUsers.length === 0)}
          >
            <Users2Icon className="mr-2 h-4 w-4" />
            Share Secret
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

ShareSecretDialog.propTypes = {
  secret: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    created_by_user_id: PropTypes.number.isRequired,
  }).isRequired,
  isOpen: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  onShare: PropTypes.func.isRequired,
  currentUserRoleLevel: PropTypes.number.isRequired
};

// Add the default export
export default ShareSecretDialog;