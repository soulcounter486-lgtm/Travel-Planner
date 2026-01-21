import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppDownloadBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("app-banner-dismissed");
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem("app-banner-dismissed", "true");
    setTimeout(() => setIsVisible(false), 300);
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${isDismissed ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
      data-testid="app-download-banner"
    >
      <div className="bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg rounded-lg">
        <div className="px-3 py-2 flex items-center gap-2">
          <a 
            href="/vungtau-dokkaebi.apk" 
            download="붕따우_도깨비.apk"
            data-testid="btn-download-apk"
          >
            <Button 
              variant="secondary" 
              size="sm" 
              className="bg-white text-primary hover:bg-white/90 font-semibold h-7 text-xs px-2"
            >
              <Download className="w-3 h-3 mr-1" />
              앱 설치
            </Button>
          </a>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="text-white hover:bg-white/20 h-6 w-6"
            data-testid="btn-dismiss-banner"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
