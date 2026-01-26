import { useState, useEffect } from "react";
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind, Loader2 } from "lucide-react";

interface WeatherData {
  temp: string;
  condition: string;
  humidity: string;
  wind: string;
  icon: string;
}

const weatherLabels: Record<string, Record<string, string>> = {
  title: {
    ko: "붕따우 날씨",
    en: "Vung Tau Weather",
    zh: "头顿天气",
    vi: "Thời tiết Vũng Tàu",
    ru: "Погода Вунг Тау",
    ja: "ブンタウの天気"
  },
  humidity: {
    ko: "습도",
    en: "Humidity",
    zh: "湿度",
    vi: "Độ ẩm",
    ru: "Влажность",
    ja: "湿度"
  },
  wind: {
    ko: "바람",
    en: "Wind",
    zh: "风速",
    vi: "Gió",
    ru: "Ветер",
    ja: "風速"
  },
  loading: {
    ko: "날씨 로딩중...",
    en: "Loading weather...",
    zh: "加载天气...",
    vi: "Đang tải thời tiết...",
    ru: "Загрузка погоды...",
    ja: "天気読み込み中..."
  },
  error: {
    ko: "날씨 정보를 불러올 수 없습니다",
    en: "Unable to load weather",
    zh: "无法加载天气",
    vi: "Không thể tải thời tiết",
    ru: "Не удалось загрузить погоду",
    ja: "天気を読み込めません"
  }
};

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
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch("https://wttr.in/Vung+Tau?format=j1");
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        
        const current = data.current_condition[0];
        setWeather({
          temp: current.temp_C,
          condition: current.weatherDesc[0].value,
          humidity: current.humidity,
          wind: current.windspeedKmph,
          icon: current.weatherCode
        });
        setLoading(false);
      } catch (err) {
        setError(true);
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-1 bg-gradient-to-r from-sky-500/10 to-blue-500/10 rounded-sm px-1.5 py-1 border border-sky-200 dark:border-sky-800">
        <Loader2 className="w-2.5 h-2.5 animate-spin text-sky-500" />
        <span className="text-[9px] text-muted-foreground">...</span>
      </div>
    );
  }

  if (error || !weather) {
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
