import { Badge } from "@/components/ui/badge";
import { CheckCircle2, CircleX, Info, Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type StatusType = "ACTIVE" | "INVITED" | "PRESENT" | "ABSENT" | "PENDING" | "APPROVED" | "REJECTED";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "ghost" | "link";

interface StatusConfig {
  variant: BadgeVariant;
  icon: LucideIcon;
  label: string;
}

const statusMap: Record<StatusType, StatusConfig> = {
  ACTIVE: { variant: "success", icon: CheckCircle2, label: "Active" },
  INVITED: { variant: "info", icon: Info, label: "Invited" },
  PRESENT: { variant: "success", icon: CheckCircle2, label: "Present" },
  ABSENT: { variant: "destructive", icon: CircleX, label: "Absent" },
  PENDING: { variant: "warning", icon: Clock, label: "Pending" },
  APPROVED: { variant: "success", icon: CheckCircle2, label: "Approved" },
  REJECTED: { variant: "destructive", icon: CircleX, label: "Rejected" },
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusMap[status];

  if (!config) {
    return <Badge variant="outline" className={className}>{status}</Badge>;
  }

  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`gap-1.5 ${className}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </Badge>
  );
}
