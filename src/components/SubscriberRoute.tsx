import { Navigate } from "react-router-dom";
import { useSubscriber } from "@/hooks/useSubscriber";
import { Loader2 } from "lucide-react";

const SubscriberRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isSubscriber, loading } = useSubscriber();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (!isSubscriber) {
    return <Navigate to="/payment" replace />;
  }

  return <>{children}</>;
};

export default SubscriberRoute;
