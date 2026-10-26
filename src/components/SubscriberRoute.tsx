import { Navigate } from "react-router-dom";
import { useSubscriber } from "@/hooks/useSubscriber";
import PlayLoader from "@/components/PlayLoader";

/**
 * Any signed-in account may open the dashboard. Paid and unpaid members share
 * the same shell — unpaid accounts simply see locked cards and upgrade CTAs,
 * and the protected URLs are withheld by the database, not just by the UI.
 */
const SubscriberRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useSubscriber();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <PlayLoader />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
};

export default SubscriberRoute;

