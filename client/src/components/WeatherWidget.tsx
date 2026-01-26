import { useQuery } from "@tanstack/react-query";
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Loader2 } from "lucide-react";

interface WeatherData {
  temp: string;
  condition: string;
  humidity: string;
  wind: string;
  lastUpdated: number;
}

function getWeatherIcon(condition: string) {
  const lowerCondition = condition.toLowerCase();
  if (lowerCondition.includes("sun") || lowerCondition.includes("clear")) {
    return <Sun className="w-3 h-3 text-yellow-500" />;
  } else if (lowerCondition.includes("rain") || lowerCondition.includes("shower")) {
    return <CloudRain className="w-3 h-3 text-blue-500" />;
  } else if (lowerCondition.includes("snow")) {
    return <CloudSnow className="w-3 h-3 text-blue-300" />;
  } else if (lowerCondition.includes("thunder") || lowerCondition.includes("storm")) {
    return <CloudLightning className="w-3 h-3 text-purple-500" />;
  } else if (lowerCondition.includes("cloud") || lowerCondition.includes("overcast")) {
    return <Cloud className="w-3 h-3 text-gray-500" />;
  } else {
    return <Sun className="w-3 h-3 text-yellow-500" />;
  }
}

export function WeatherWidget({ language }: { language: string }) {
  const { data: weather, isLoading, isError } = useQuery<WeatherData>({
    queryKey: ["/api/weather"],
    refetchInterval: 30 * 60 * 1000,
    staleTime: 30 * 60 * 1000,
    retry: 3,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-1 bg-gradient-to-r from-sky-500/10 to-blue-500/10 rounded-sm px-1.5 py-1 border border-sky-200 dark:border-sky-800">
        <Loader2 className="w-2.5 h-2.5 animate-spin text-sky-500" />
        <span className="text-[9px] text-muted-foreground">...</span>
      </div>
    );
  }

  if (isError || !weather) {
    return (
      <div className="flex items-center gap-1 bg-gradient-to-r from-gray-500/10 to-slate-500/10 rounded-sm px-1.5 py-1 border border-gray-200 dark:border-gray-800">
        <Cloud className="w-2.5 h-2.5 text-gray-400" />
        <span className="text-[9px] text-muted-foreground">-</span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-sky-500/10 to-blue-500/10 rounded-sm px-1.5 py-1 border border-sky-200 dark:border-sky-800 inline-flex items-center gap-1">
      {getWeatherIcon(weather.condition)}
      <span className="text-[9px] font-semibold text-foreground">{weather.temp}°C</span>
      <span className="text-[9px] text-muted-foreground">{weather.humidity}%</span>
    </div>
  );
}
