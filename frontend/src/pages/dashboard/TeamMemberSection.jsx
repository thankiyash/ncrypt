import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTeamMembers } from '@/hooks/auth/use-team-members';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Badge
} from "@/components/ui/badge";
import {
  Users2Icon,
  Loader2Icon,
  Clock,
  AlertCircle
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { isPast } from 'date-fns';

const getRoleBadgeVariant = (roleLevel) => {
  switch (roleLevel) {
    case 7: return "default"; // Owner
    case 6: return "destructive"; // Exec
    case 5: return "secondary"; // Director
    case 4: return "outline"; // Manager
    case 3: return "default"; // Senior
    case 2: return "secondary"; // Junior
    case 1: return "outline"; // Intern
    default: return null;
  }
};

const getRoleName = (roleLevel) => {
  switch (roleLevel) {
    case 7: return "Owner";
    case 6: return "Exec";
    case 5: return "Director";
    case 4: return "Manager";
    case 3: return "Senior";
    case 2: return "Junior";
    case 1: return "Intern";
    default: return "Unknown";
  }
};

const MemberStatus = ({ member }) => {
  if (member.is_active) {
    return (
      <Badge variant="default" className="bg-green-500">
        Active
      </Badge>
    );
  }
  
  if (member.invitation_expires_at) {
    const expiryDate = new Date(member.invitation_expires_at);
    const isExpired = isPast(expiryDate);
    
    if (isExpired) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Expired
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Invited
      </Badge>
    );
  }
  
  return (
    <Badge variant="secondary">
      Inactive
    </Badge>
  );
};

// Add prop-types for MemberStatus
MemberStatus.propTypes = {
  member: PropTypes.shape({
    is_active: PropTypes.bool,
    invitation_expires_at: PropTypes.string
  }).isRequired
};

export default function TeamMembersSection({ onUpdate }) {
  const { getTeamMembers, getPendingInvites, isLoading, error } = useTeamMembers();
  const [members, setMembers] = useState([]);

  const loadAllMembers = async () => {
    try {
      const [activeMembers, invitedMembers] = await Promise.all([
        getTeamMembers(),
        getPendingInvites()
      ]);
      
      // Combine active members and pending invites
      const allMembers = [
        ...activeMembers,
        ...invitedMembers.pending_invites.map(invite => ({
          ...invite,
          is_active: false,
        }))
      ];
      
      // Sort by role level and then by name
      const sortedMembers = allMembers.sort((a, b) => {
        if (b.role_level !== a.role_level) return b.role_level - a.role_level;
        return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
      });
      
      setMembers(sortedMembers);
      if (onUpdate) onUpdate(sortedMembers);
    } catch (err) {
      console.error('Failed to load team members:', err);
    }
  };

  useEffect(() => {
    loadAllMembers();
    // Set up periodic refresh every 30 seconds
    const interval = setInterval(loadAllMembers, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading && members.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2">Loading team members...</span>
        </CardContent>
      </Card>
    );
  }

  const activeCount = members.filter(m => m.is_active).length;
  const pendingCount = members.filter(m => !m.is_active).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users2Icon className="w-6 h-6 text-muted-foreground" />
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Manage your team members and their access levels</CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="default" className="bg-green-500">
              {activeCount} Active
            </Badge>
            {pendingCount > 0 && (
              <Badge variant="secondary">
                {pendingCount} Pending
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id || member.email}>
                <TableCell className="font-medium">
                  {member.first_name} {member.last_name}
                </TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>
                  <Badge variant={getRoleBadgeVariant(member.role_level)}>
                    {getRoleName(member.role_level)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <MemberStatus member={member} />
                </TableCell>
              </TableRow>
            ))}
            {members.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                  No team members found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

TeamMembersSection.propTypes = {
  onUpdate: PropTypes.func
};