import { useState } from "react";
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
import { Users2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Define all available role levels
const ROLE_LEVELS = [
  { value: 1, label: "Intern" },
  { value: 2, label: "Junior" },
  { value: 3, label: "Senior" },
  { value: 4, label: "Manager" },
  { value: 5, label: "Director" },
  { value: 6, label: "Exec" },
  { value: 7, label: "Owner" }
];

function ShareSecretDialog({ 
  isOpen,
  onOpenChange,
  onShare
}) {
  const [error, setError] = useState(null);
  const [shareWithAll, setShareWithAll] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);

  const handleRoleSelect = (value) => {
    const roleLevel = parseInt(value);
    if (!selectedRoles.includes(roleLevel)) {
      setSelectedRoles(prev => [...prev, roleLevel]);
    }
  };

  const removeRole = (roleLevel) => {
    setSelectedRoles(prev => prev.filter(level => level !== roleLevel));
  };

  const handleShare = async () => {
    try {
      if (!shareWithAll && selectedRoles.length === 0) {
        setError("Please select at least one role or share with all");
        return;
      }

      await onShare({
        share_with_all: shareWithAll,
        role_levels: !shareWithAll ? selectedRoles : null
      });

      onOpenChange(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const getRoleBadgeColor = (roleLevel) => {
    switch (roleLevel) {
      case 7: return "default";    // Owner
      case 6: return "destructive";  // Exec
      case 5: return "secondary";    // Director
      case 4: return "default";      // Manager
      case 3: return "outline";      // Senior
      case 2: return "secondary";    // Junior
      case 1: return "outline";      // Intern
      default: return "default";
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
              onCheckedChange={(checked) => {
                setShareWithAll(checked);
                if (checked) {
                  setSelectedRoles([]);
                }
              }}
            />
            <Label htmlFor="shareWithAll">
              Share with all roles
            </Label>
          </div>

          {!shareWithAll && (
            <div className="space-y-2">
              <Label>Select roles to share with</Label>
              <Select onValueChange={handleRoleSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select roles" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_LEVELS.map((role) => (
                    <SelectItem
                      key={role.value}
                      value={role.value.toString()}
                      disabled={selectedRoles.includes(role.value)}
                    >
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedRoles.length > 0 && (
                <div className="mt-4">
                  <Label>Selected Roles:</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedRoles.sort((a, b) => b - a).map((roleLevel) => {
                      const role = ROLE_LEVELS.find(r => r.value === roleLevel);
                      return (
                        <Badge
                          key={roleLevel}
                          variant={getRoleBadgeColor(roleLevel)}
                          className="flex items-center gap-2"
                        >
                          {role?.label}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-transparent"
                            onClick={() => removeRole(roleLevel)}
                          >
                            ×
                          </Button>
                        </Badge>
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
            disabled={!shareWithAll && selectedRoles.length === 0}
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
  isOpen: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  onShare: PropTypes.func.isRequired
};

export default ShareSecretDialog;