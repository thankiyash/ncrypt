import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { 
  PlusCircle, 
  LockIcon, 
  EyeIcon, 
  EyeOffIcon, 
  CopyIcon, 
  CheckIcon,
  Trash2Icon,
  Share2Icon,
  Loader2Icon,
  Users2Icon
} from "lucide-react";
import { useAuth, useSecrets } from "@/hooks/auth";
import ShareSecretDialog from "@/components/ShareSecretDialog";

const ROLE_LEVELS = [
  { value: 1, label: "Intern" },
  { value: 2, label: "Junior" },
  { value: 3, label: "Senior" },
  { value: 4, label: "Manager" },
  { value: 5, label: "Director" },
  { value: 6, label: "Exec" }
];

function SecretViewDialog({ secret, open, onOpenChange, onDelete, onShare }) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const { user } = useAuth();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(secret.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDelete = async () => {
    await onDelete();
    setShowDeleteConfirm(false);
    onOpenChange(false);
  };

  const getRoleBadgeColor = (roleLevel) => {
    switch (roleLevel) {
      case 6: return "destructive";  // Exec
      case 5: return "secondary";    // Director
      case 4: return "default";      // Manager
      case 3: return "outline";      // Senior
      case 2: return "secondary";    // Junior
      case 1: return "outline";      // Intern
      default: return "default";
    }
  };

  const canShare = true;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{secret.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Description</Label>
              <p className="text-sm">{secret.description || 'No description provided'}</p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Password</Label>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={secret.password}
                    readOnly
                    className="w-full px-3 py-2 border rounded-md bg-muted"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={togglePasswordVisibility}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                  title={copied ? 'Copied!' : 'Copy to clipboard'}
                >
                  {copied ? (
                    <CheckIcon className="h-4 w-4 text-green-500" />
                  ) : (
                    <CopyIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Last updated: {new Date(secret.updated_at || secret.created_at).toLocaleDateString()}
            </div>

            {secret.is_shared && (
              <div className="text-sm text-muted-foreground bg-secondary/50 p-2 rounded space-y-2">
                {secret.share_with_all ? (
                  <div className="flex items-center gap-2">
                    <Users2Icon className="h-4 w-4" />
                    <span>
                      Shared with all roles {secret.min_role_level ? `${ROLE_LEVELS.find(r => r.value === secret.min_role_level)?.label} and above` : ''}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users2Icon className="h-4 w-4" />
                      <span>Shared with roles:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {secret.role_shares.map((share) => (
                        <Badge
                          key={share.id}
                          variant={getRoleBadgeColor(share.role_level)}
                        >
                          {ROLE_LEVELS.find(r => r.value === share.role_level)?.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="flex justify-between">
              {canShare && (
                <Button
                  variant="outline"
                  onClick={() => setShowShareDialog(true)}
                >
                  <Share2Icon className="h-4 w-4 mr-2" />
                  Share
                </Button>
              )}
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2Icon className="h-4 w-4 mr-2" />
                Delete Secret
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <ShareSecretDialog
        secret={secret}
        isOpen={showShareDialog}
        onOpenChange={setShowShareDialog}
        onShare={onShare}
        currentUserRoleLevel={user?.role_level}
      />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the secret {secret.title}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

SecretViewDialog.propTypes = {
  secret: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    password: PropTypes.string.isRequired,
    created_at: PropTypes.string.isRequired,
    updated_at: PropTypes.string,
    created_by_user_id: PropTypes.number.isRequired,
    is_shared: PropTypes.bool,
    share_with_all: PropTypes.bool,
    min_role_level: PropTypes.number,
    role_shares: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number.isRequired,
      role_level: PropTypes.number.isRequired
    }))
  }).isRequired,
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onShare: PropTypes.func.isRequired
};

export default function SecretsListPage() {
  const { createSecret, getSecrets, getSharedSecrets, deleteSecret, shareSecret } = useSecrets();
  const [secrets, setSecrets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newSecret, setNewSecret] = useState({
    title: '',
    password: '',
    description: ''
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSecret, setSelectedSecret] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const loadSecrets = async () => {
    setIsLoading(true);
    try {
      const secrets = await getSecrets();
      const sortedSecrets = secrets.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );

      setSecrets(sortedSecrets);
    } catch (err) {
      console.error('Failed to load secrets:', err);
      setError('Failed to load secrets. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSecrets();
  }, []);

  useEffect(() => {
    loadSecrets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createSecret(newSecret);
      setNewSecret({ title: '', password: '', description: '' });
      setIsDialogOpen(false);
      await loadSecrets();
    } catch (err) {
      console.error('Failed to create secret:', err);
      setError('Failed to create secret. Please try again.');
    }
  };

  const handleViewSecret = (secret) => {
    setSelectedSecret(secret);
    setIsViewDialogOpen(true);
  };

  const handleShare = async (secretId, shareData) => {
    try {
      await shareSecret(secretId, shareData);
      await loadSecrets();
    } catch (err) {
      console.error('Failed to share secret:', err);
      setError('Failed to share secret. Please try again.');
    }
  };

  const handleDeleteSecret = async () => {
    if (!selectedSecret) return;
    
    try {
      await deleteSecret(selectedSecret.id);
      await loadSecrets();
    } catch (err) {
      console.error('Failed to delete secret:', err);
      setError('Failed to delete secret. Please try again.');
    }
  };

  const renderSecretCard = (secret) => (
    <Card key={secret.id}>
      <CardContent className="flex items-center justify-between p-6">
        <div className="flex items-center space-x-4">
          <LockIcon className="h-6 w-6 text-muted-foreground" />
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold">{secret.title}</h3>
              {secret.is_shared && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Users2Icon className="h-3 w-3" />
                  {secret.share_with_all ? "Shared with all" : "Role shared"}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {secret.description || 'No description'}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => handleViewSecret(secret)}>
          View
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Secrets</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Secret
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Secret</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newSecret.title}
                    onChange={(e) => setNewSecret(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newSecret.password}
                    onChange={(e) => setNewSecret(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={newSecret.description}
                    onChange={(e) => setNewSecret(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : ('Create Secret'
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2Icon className="mr-2 h-6 w-6 animate-spin" />
            <span>Loading secrets...</span>
          </div>
        ) : secrets.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            No secrets found. Click &quot;Add Secret&quot; to create one.
          </div>
        ) : (
          <div className="grid gap-4">
            {secrets.map(renderSecretCard)}
          </div>
        )}

        {selectedSecret && (
          <SecretViewDialog
            secret={selectedSecret}
            open={isViewDialogOpen}
            onOpenChange={setIsViewDialogOpen}
            onDelete={handleDeleteSecret}
            onShare={(shareData) => handleShare(selectedSecret.id, shareData)}
          />
        )}
      </div>
    </div>
  );
}