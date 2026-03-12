import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center px-4">
        <h1 className="mb-4 font-display text-6xl md:text-8xl text-primary">404</h1>
        <p className="mb-6 text-lg md:text-xl text-muted-foreground">Oops! Page not found</p>
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/80">
          <a href="/">Return to Home</a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
