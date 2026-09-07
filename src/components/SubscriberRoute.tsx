import { Navigate } from "react-router-dom";
import { useSubscriber } from "@/hooks/useSubscriber";
import { Loader2 } from "lucide-react";
import MembershipLocked from "@/pages/MembershipLocked";

const SubscriberRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isSubscriber, subscription, loading } = useSubscriber();

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

  // Signed in but not paid (or expired): show plans instead of the streaming links.
  if (!isSubscriber) {
    return <MembershipLocked subscription={subscription} />;
  }

  return <>{children}</>;
};

export default SubscriberRoute;
