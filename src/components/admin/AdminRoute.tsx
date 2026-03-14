import { Navigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { Loader2, AlertTriangle } from "lucide-react";

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin, loading, authError } = useAdmin();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (authError && !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground text-sm">Authentication check failed. Please try again.</p>
        <a href="/admin/login" className="text-primary hover:underline text-sm">Go to Admin Login</a>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
