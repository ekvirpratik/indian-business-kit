import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { pageTransition } from "@/lib/animations";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`p-4 md:p-6 w-full max-w-[1600px] mx-auto ${className}`}
    >
      {children}
    </motion.div>
  );
}
