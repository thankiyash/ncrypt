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
import { 
  PlusCircle, 
  LockIcon, 
  EyeIcon, 
  EyeOffIcon, 
  CopyIcon, 
  CheckIcon,
  Trash2Icon
} from "lucide-react";
import { useSecrets } from "@/hooks/auth";

function SecretViewDialog({ secret, open, onOpenChange, onDelete }) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

            <DialogFooter>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full sm:w-auto"
              >
                <Trash2Icon className="h-4 w-4 mr-2" />
                Delete Secret
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

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
    updated_at: PropTypes.string
  }).isRequired,
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

export default function SecretsListPage() {
  const { createSecret, getSecrets, deleteSecret, isLoading, error } = useSecrets();
  const [secrets, setSecrets] = useState([]);
  const [newSecret, setNewSecret] = useState({
    title: '',
    password: '',
    description: ''
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSecret, setSelectedSecret] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  useEffect(() => {
    loadSecrets();
  }, []);

  const loadSecrets = async () => {
    try {
      const fetchedSecrets = await getSecrets();
      setSecrets(fetchedSecrets);
    } catch (err) {
      console.error('Failed to load secrets:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createSecret(newSecret);
      setNewSecret({ title: '', password: '', description: '' });
      setIsDialogOpen(false);
      await loadSecrets();
    } catch (err) {
      console.error('Failed to create secret:', err);
    }
  };

  const handleViewSecret = (secret) => {
    setSelectedSecret(secret);
    setIsViewDialogOpen(true);
  };

  const handleDeleteSecret = async () => {
    if (!selectedSecret) return;
    
    try {
      await deleteSecret(selectedSecret.id);
      await loadSecrets();
    } catch (err) {
      console.error('Failed to delete secret:', err);
    }
  };

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
                  {isLoading ? 'Creating...' : 'Create Secret'}
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

        <div className="grid gap-4">
          {secrets.map((secret) => (
            <Card key={secret.id}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center space-x-4">
                  <LockIcon className="h-6 w-6 text-muted-foreground" />
                  <div>
                    <h3 className="font-semibold">{secret.title}</h3>
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
          ))}
        </div>

        {selectedSecret && (
          <SecretViewDialog
            secret={selectedSecret}
            open={isViewDialogOpen}
            onOpenChange={setIsViewDialogOpen}
            onDelete={handleDeleteSecret}
          />
        )}
      </div>
    </div>
  );
}