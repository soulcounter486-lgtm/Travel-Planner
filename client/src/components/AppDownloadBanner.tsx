import { useState, useEffect } from "react";
import { X, Download, Smartphone } from "lucide-react";
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
      className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${isDismissed ? "translate-y-full" : "translate-y-0"}`}
      data-testid="app-download-banner"
    >
      <div className="bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-2">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm sm:text-base">붕따우 도깨비 앱 다운로드</span>
                <span className="text-xs text-white/80 hidden sm:block">언제 어디서나 편리하게!</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a 
                href="/vungtau-dokkaebi.apk" 
                download="붕따우_도깨비.apk"
                data-testid="btn-download-apk"
              >
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="bg-white text-primary hover:bg-white/90 font-semibold"
                >
                  <Download className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">앱 다운로드</span>
                  <span className="sm:hidden">다운로드</span>
                </Button>
              </a>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
                className="text-white hover:bg-white/20 h-8 w-8"
                data-testid="btn-dismiss-banner"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
