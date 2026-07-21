import { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function NetworkManager() {
  const [isOffline, setIsOffline] = useState(false);
  const [justCameOnline, setJustCameOnline] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check initial state
    setIsOffline(!window.navigator.onLine);

    const handleOffline = () => {
      setIsOffline(true);
      setJustCameOnline(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setJustCameOnline(true);
      
      // Hide the "Back online" message after 3 seconds
      setTimeout(() => {
        setJustCameOnline(false);
      }, 3000);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {(isOffline || justCameOnline) && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="fixed bottom-4 left-0 right-0 z-[100] mx-auto w-fit max-w-[90vw] overflow-hidden rounded-2xl shadow-2xl"
        >
          {isOffline ? (
            <div className="flex items-center gap-3 bg-amber-600/95 px-6 py-4 text-white backdrop-blur-md">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
                <WifiOff className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm sm:text-base">الاتصال ضعيف — نعرض آخر البيانات المحفوظة</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-emerald-600/95 px-6 py-4 text-white backdrop-blur-md">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
                <Wifi className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold">عاد الاتصال بالإنترنت</span>
                <span className="text-sm opacity-90">تم تحديث البيانات، أنت متصل الآن.</span>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
