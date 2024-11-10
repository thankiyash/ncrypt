// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useOwnerCheck } from './hooks/auth/use-owner-check';
import { useAuth } from './hooks/auth/use-auth-context';

// Pages
import LoginPage from './pages/auth/LoginPage';
import InvitePage from './pages/auth/InvitePage';
import OwnerSetupPage from './pages/auth/OwnerSetupPage';
import SecretsListPage from './pages/dashboard/SecretsListPage';
import InviteUserPage from './pages/dashboard/InviteUserPage';
import ErrorPage from './pages/ErrorPage';
import { AuthProvider } from './hooks/auth/use-auth-context';
import DashboardLayout from './components/layout/DashboardLayout';

// Wrap component with layout
const withDashboard = (Component) => {
  const WrappedComponent = (props) => (
    <DashboardLayout>
      <Component {...props} />
    </DashboardLayout>
  );

  // Set display name for the wrapped component
  WrappedComponent.displayName = `withDashboard(${Component.displayName || Component.name || 'Component'})`;
  
  return WrappedComponent;
};

function AppRoutes() {
  const { checkOwnerExists, isLoading: ownerCheckLoading } = useOwnerCheck();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [ownerExists, setOwnerExists] = useState(null);

  useEffect(() => {
    const checkOwner = async () => {
      try {
        const { owner_exists } = await checkOwnerExists();
        setOwnerExists(owner_exists);
      } catch (error) {
        console.error('Failed to check owner status:', error);
        setOwnerExists(true);
      }
    };
    
    checkOwner();
  }, []);

  if (ownerCheckLoading || authLoading || ownerExists === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      {/* Root route */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/secrets" replace />
          ) : ownerExists ? (
            <Navigate to="/login" replace />
          ) : (
            <Navigate to="/setup" replace />
          )
        }
      />
      
      {/* Auth Routes */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/secrets" replace />
          ) : ownerExists ? (
            <LoginPage />
          ) : (
            <Navigate to="/setup" replace />
          )
        }
      />
      <Route
        path="/setup"
        element={
          !ownerExists ? (
            <OwnerSetupPage />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="/invite/:token" element={<InvitePage />} />

      {/* Protected Routes - with Dashboard Layout */}
      <Route
        path="/secrets"
        element={
          isAuthenticated ? (
            withDashboard(SecretsListPage)()
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/invite-user"
        element={
          isAuthenticated ? (
            withDashboard(InviteUserPage)()
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Error Route */}
      <Route path="*" element={<ErrorPage />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;