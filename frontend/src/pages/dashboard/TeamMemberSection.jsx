import { useState, useEffect } from 'react';
import { useTeamMembers } from '@/hooks/auth/use-team-member';
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
  Loader2Icon
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

export default function TeamMembersSection() {
  const { getTeamMembers, isLoading, error } = useTeamMembers();
  const [members, setMembers] = useState([]);

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const data = await getTeamMembers();
        setMembers(data);
      } catch (err) {
        console.error('Failed to load team members:', err);
      }
    };
    
    loadMembers();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2">Loading team members...</span>
        </CardContent>
      </Card>
    );
  }

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
          <Badge variant="outline" className="ml-auto">
            {members.length} {members.length === 1 ? 'Member' : 'Members'}
          </Badge>
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
              <TableRow key={member.id}>
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
                  <Badge 
                    variant={member.is_active ? "default" : "secondary"}
                    className={member.is_active ? "bg-green-500" : ""}
                  >
                    {member.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {members.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
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