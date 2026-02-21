import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";
import { Button } from "./ui/button";

export function AppDownloadBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("app-banner-dismissed-v2");
    if (dismissed) {
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("app-banner-dismissed-v2", "true");
    setTimeout(() => setIsVisible(false), 300);
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed top-20 right-4 z-[9999] transition-all duration-300 ${isDismissed ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
      data-testid="app-download-banner"
    >
      <div className="bg-gradient-to-r from-primary to-purple-600 text-white shadow-xl rounded-full border-2 border-white/30">
        <div className="px-3 py-2 flex items-center gap-2">
          <a 
            href="/vungtau-dokkaebi.apk" 
            download="붕따우_도깨비.apk"
            data-testid="btn-download-apk"
          >
            <Button 
              variant="secondary" 
              size="sm" 
              className="bg-white text-primary hover:bg-white/90 font-bold h-8 text-sm px-3 rounded-full shadow-md"
            >
              <Download className="w-4 h-4 mr-1" />
              앱 설치
            </Button>
          </a>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="text-white hover:bg-white/20 h-7 w-7 rounded-full"
            data-testid="btn-dismiss-banner"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
