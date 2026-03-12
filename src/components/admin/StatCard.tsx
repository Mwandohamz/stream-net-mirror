import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: string;
  trendUp?: boolean;
}

const StatCard = ({ title, value, icon: Icon, description, trend, trendUp }: StatCardProps) => {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-2xl md:text-3xl font-bold text-foreground">{value}</p>
        {(description || trend) && (
          <div className="flex items-center gap-2 mt-1">
            {trend && (
              <span className={`text-xs font-medium ${trendUp ? "text-green-500" : "text-destructive"}`}>
                {trend}
              </span>
            )}
            {description && <span className="text-xs text-muted-foreground">{description}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
