import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title: string;
  icon: LucideIcon;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  children: ReactNode;
  className?: string;
  gradient?: string;
}

export function SectionCard({ 
  title, 
  icon: Icon, 
  isEnabled, 
  onToggle, 
  children, 
  className,
  gradient = "from-primary/10 to-transparent"
}: SectionCardProps) {
  return (
    <Card className={cn(
      "border border-border/60 transition-all duration-300",
      isEnabled ? "ring-2 ring-primary/20 shadow-lg shadow-primary/5" : "opacity-80 grayscale-[0.5] hover:opacity-100 hover:grayscale-0",
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative overflow-hidden">
        <div className={cn("absolute inset-0 opacity-20 bg-gradient-to-r", gradient)} />
        <CardTitle className="text-xl flex items-center gap-3 relative z-10">
          <div className={cn(
            "p-2.5 rounded-xl transition-colors",
            isEnabled ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground"
          )}>
            <Icon className="w-5 h-5" />
          </div>
          {title}
        </CardTitle>
        <Switch 
          checked={isEnabled} 
          onCheckedChange={onToggle}
          className="relative z-10 data-[state=checked]:bg-primary"
        />
      </CardHeader>
      <CardContent className="relative z-10">
        <div className={cn(
          "transition-all duration-300 grid gap-6",
          isEnabled ? "opacity-100 max-h-[500px]" : "opacity-50 pointer-events-none max-h-0 overflow-hidden"
        )}>
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
