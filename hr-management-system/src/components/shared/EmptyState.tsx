import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/animations";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className={`flex flex-col items-center justify-center p-8 text-center bg-card rounded-lg border shadow-sm ${className || ''}`}
    >
      <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-muted">
        <Icon className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="mb-1 text-lg font-semibold">{title}</h3>
      <p className="max-w-sm mb-6 text-sm text-muted-foreground">{description}</p>
      {action && <div>{action}</div>}
    </motion.div>
  );
}
