import { useLanguage, Language, languageNames } from "./lib/i18n";
import { Button } from "./ui/button";
import { cn } from "./lib/utils";

const languages: { code: Language; flag: string }[] = [
  { code: "ko", flag: "KR" },
  { code: "en", flag: "US" },
  { code: "zh", flag: "CN" },
  { code: "vi", flag: "VN" },
  { code: "ru", flag: "RU" },
  { code: "ja", flag: "JP" },
];

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="bg-slate-800/80 border-t border-slate-700/50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {languages.map((lang) => (
            <Button
              key={lang.code}
              variant={language === lang.code ? "default" : "ghost"}
              size="sm"
              onClick={() => setLanguage(lang.code)}
              className={cn(
                "min-w-[90px] h-9 text-sm font-medium transition-all",
                language === lang.code 
                  ? "shadow-md" 
                  : "text-slate-300 hover:text-white hover:bg-slate-700/50"
              )}
              data-testid={`button-language-${lang.code}`}
            >
              <span className="mr-1.5 text-base">{lang.flag === "KR" ? "🇰🇷" : lang.flag === "US" ? "🇺🇸" : lang.flag === "CN" ? "🇨🇳" : lang.flag === "VN" ? "🇻🇳" : lang.flag === "RU" ? "🇷🇺" : "🇯🇵"}</span>
              {languageNames[lang.code]}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
