import { useState } from "react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLanguage } from "@/lib/i18n";
import { 
  Utensils, 
  Palmtree, 
  CircleDot, 
  Mountain, 
  Landmark, 
  Users,
  CalendarIcon,
  Sparkles,
  MapPin,
  Clock,
  Lightbulb,
  RefreshCw,
  Loader2,
  Calculator,
  Eye,
  Wallet,
  MessageCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays } from "date-fns";
import type { Locale } from "date-fns";
import { ko, enUS, zhCN, vi, ru, ja } from "date-fns/locale";
import logoImg from "@assets/BackgroundEraser_20240323_103507859_1768275315346.png";

interface ScheduleItem {
  time: string;
  activity: string;
  place: string;
  placeVi?: string;
  type: string;
  note?: string;
}

interface DayPlan {
  day: number;
  date: string;
  theme: string;
  schedule: ScheduleItem[];
}

interface TravelPlan {
  title: string;
  summary: string;
  days: DayPlan[];
  tips: string[];
}

const purposeOptions = [
  { id: "gourmet", icon: Utensils, gradient: "from-orange-500 to-red-500" },
  { id: "relaxing", icon: Palmtree, gradient: "from-green-500 to-teal-500" },
  { id: "golf", icon: CircleDot, gradient: "from-emerald-500 to-green-600" },
  { id: "adventure", icon: Mountain, gradient: "from-blue-500 to-indigo-600" },
  { id: "culture", icon: Landmark, gradient: "from-purple-500 to-violet-600" },
  { id: "family", icon: Users, gradient: "from-pink-500 to-rose-500" },
];

const typeIcons: Record<string, React.ElementType> = {
  attraction: MapPin,
  restaurant: Utensils,
  cafe: Utensils,
  massage: Palmtree,
  golf: CircleDot,
  beach: Palmtree,
};

const typeColors: Record<string, string> = {
  attraction: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  restaurant: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  cafe: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  massage: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  golf: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  beach: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
};

export default function TravelPlanner() {
  const { language, t } = useLanguage();
  const [selectedPurpose, setSelectedPurpose] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [travelPlan, setTravelPlan] = useState<TravelPlan | null>(null);

  const locales: Record<string, Locale> = { ko, en: enUS, zh: zhCN, vi, ru, ja };
  const currentLocale = locales[language] || ko;

  const generatePlanMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPurpose || !startDate || !endDate) {
        throw new Error("Please fill all fields");
      }
      const response = await apiRequest("POST", "/api/travel-plan", {
        purpose: selectedPurpose,
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        language,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setTravelPlan(data);
    },
  });

  const handleGenerate = () => {
    generatePlanMutation.mutate();
  };

  const handleRegenerate = () => {
    setTravelPlan(null);
    generatePlanMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src={logoImg} alt="Logo" className="h-10 w-10 object-contain" />
            <span className="font-bold text-lg">{t("header.title")}</span>
          </Link>
          <nav className="flex gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="nav-calculator">
                <Calculator className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">{t("nav.calculator")}</span>
              </Button>
            </Link>
            <Link href="/guide">
              <Button variant="ghost" size="sm" data-testid="nav-guide">
                <Eye className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">{t("nav.guide")}</span>
              </Button>
            </Link>
            <Link href="/expenses">
              <Button variant="ghost" size="sm" data-testid="nav-expenses">
                <Wallet className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">{t("nav.expenses")}</span>
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/10 to-purple-500/10 px-4 py-2 rounded-full mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{t("nav.planner")}</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{t("planner.title")}</h1>
          <p className="text-muted-foreground">{t("planner.subtitle")}</p>
        </div>

        {!travelPlan && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                {t("planner.purpose")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {purposeOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = selectedPurpose === option.id;
                  return (
                    <motion.button
                      key={option.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedPurpose(option.id)}
                      className={`relative p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover-elevate"
                      }`}
                      data-testid={`purpose-${option.id}`}
                    >
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${option.gradient} flex items-center justify-center mx-auto mb-2`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <span className="text-sm font-medium block">
                        {t(`planner.purpose.${option.id}`)}
                      </span>
                      {isSelected && (
                        <motion.div
                          layoutId="purpose-indicator"
                          className="absolute inset-0 border-2 border-primary rounded-xl"
                          initial={false}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">{t("planner.startDate")}</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        data-testid="start-date-picker"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP", { locale: currentLocale }) : t("planner.selectDates")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => {
                          setStartDate(date);
                          if (date && (!endDate || endDate < date)) {
                            setEndDate(addDays(date, 2));
                          }
                        }}
                        disabled={(date) => date < new Date()}
                        locale={currentLocale}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">{t("planner.endDate")}</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        data-testid="end-date-picker"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP", { locale: currentLocale }) : t("planner.selectDates")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={(date) => date < (startDate || new Date())}
                        locale={currentLocale}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleGenerate}
                disabled={!selectedPurpose || !startDate || !endDate || generatePlanMutation.isPending}
                data-testid="generate-plan-btn"
              >
                {generatePlanMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t("planner.generating")}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    {t("planner.generate")}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        <AnimatePresence mode="wait">
          {travelPlan && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-purple-500/5">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl">{travelPlan.title}</CardTitle>
                      <p className="text-muted-foreground mt-2">{travelPlan.summary}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRegenerate}
                      disabled={generatePlanMutation.isPending}
                      data-testid="regenerate-btn"
                    >
                      <RefreshCw className={`h-4 w-4 mr-1 ${generatePlanMutation.isPending ? 'animate-spin' : ''}`} />
                      {t("planner.regenerate")}
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              {travelPlan.days.map((day, dayIndex) => (
                <motion.div
                  key={day.day}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: dayIndex * 0.1 }}
                >
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                          {day.day}
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {t("planner.day")} {day.day} - {day.theme}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">{day.date}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {day.schedule.map((item, itemIndex) => {
                          const TypeIcon = typeIcons[item.type] || MapPin;
                          const typeColor = typeColors[item.type] || "bg-gray-100 text-gray-700";
                          return (
                            <motion.div
                              key={itemIndex}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: dayIndex * 0.1 + itemIndex * 0.05 }}
                              className="flex gap-4 items-start"
                            >
                              <div className="flex flex-col items-center">
                                <Badge variant="outline" className="font-mono text-xs">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {item.time}
                                </Badge>
                                {itemIndex < day.schedule.length - 1 && (
                                  <div className="w-px h-8 bg-border mt-2" />
                                )}
                              </div>
                              <div className="flex-1 bg-muted/50 rounded-lg p-3">
                                <div className="flex items-start gap-2 flex-wrap">
                                  <Badge className={typeColor}>
                                    <TypeIcon className="h-3 w-3 mr-1" />
                                    {item.type}
                                  </Badge>
                                  <span className="font-medium">{item.activity}</span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  <MapPin className="h-3 w-3 inline mr-1" />
                                  {item.place}
                                  {item.placeVi && <span className="text-xs ml-1">({item.placeVi})</span>}
                                </p>
                                {item.note && (
                                  <p className="text-xs text-muted-foreground mt-1 italic">{item.note}</p>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {travelPlan.tips && travelPlan.tips.length > 0 && (
                <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                      <Lightbulb className="h-5 w-5" />
                      {t("planner.tips")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {travelPlan.tips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-amber-600 dark:text-amber-400 font-bold">{index + 1}.</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => setTravelPlan(null)}
                  data-testid="new-plan-btn"
                >
                  {t("planner.selectPurpose")}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
