import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function OfflineBanner() {
  // Use navigator.onLine if available, fallback to true for SSR
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false
  );

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 bg-warning px-4 py-2 text-warning-foreground shadow-md"
        >
          <WifiOff className="h-4 w-4" />
          <p className="text-sm font-medium">
            You are offline. Some actions may not be available.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
