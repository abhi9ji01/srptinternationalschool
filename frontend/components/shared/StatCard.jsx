import { Card, CardContent } from "@/components/ui/card";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

export default function StatCard({ title, value, icon = "Activity", hint, color = "text-primary", className }) {
  const Icon = Icons[icon] || Icons.Activity;
  return (
    <Card className={className}>
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
        </div>
        <div className={cn("h-12 w-12 rounded-full bg-muted flex items-center justify-center", color)}>
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  );
}
