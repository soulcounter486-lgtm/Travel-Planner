import { DollarSign } from "lucide-react";

interface ExchangeRateWidgetProps {
  language: string;
  rates?: Record<string, number>;
}

const labels: Record<string, Record<string, string>> = {
  title: {
    ko: "오늘의 환율",
    en: "Exchange Rates",
    zh: "今日汇率",
    vi: "Tỷ giá hôm nay",
    ru: "Курс валют",
    ja: "本日の為替"
  },
  base: {
    ko: "1 USD 기준",
    en: "Based on 1 USD",
    zh: "基于1美元",
    vi: "Dựa trên 1 USD",
    ru: "На 1 USD",
    ja: "1 USD基準"
  }
};

const currencyFlags: Record<string, string> = {
  KRW: "🇰🇷",
  VND: "🇻🇳",
  CNY: "🇨🇳",
  JPY: "🇯🇵",
  RUB: "🇷🇺"
};

export function ExchangeRateWidget({ language, rates }: ExchangeRateWidgetProps) {
  if (!rates) {
    return null;
  }

  const displayCurrencies = ["KRW", "VND", "CNY", "JPY", "RUB"];
  const filteredRates = displayCurrencies
    .filter(code => rates[code])
    .map(code => ({
      code,
      flag: currencyFlags[code],
      rate: rates[code]
    }));

  if (filteredRates.length === 0) return null;

  const formatRate = (rate: number) => {
    if (rate >= 1000) {
      return rate.toLocaleString("en-US", { maximumFractionDigits: 0 });
    }
    return rate.toLocaleString("en-US", { maximumFractionDigits: 2 });
  };

  return (
    <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800">
      <div className="flex items-center gap-2 mb-2">
        <DollarSign className="w-4 h-4 text-emerald-600" />
        <span className="text-xs font-medium text-muted-foreground">{labels.title[language] || labels.title.ko}</span>
        <span className="text-[9px] text-muted-foreground/70">({labels.base[language] || labels.base.ko})</span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {filteredRates.map(({ code, flag, rate }) => (
          <div key={code} className="flex items-center gap-1 text-[11px]">
            <span>{flag}</span>
            <span className="text-muted-foreground">{code}:</span>
            <span className="font-semibold text-foreground">{formatRate(rate)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
