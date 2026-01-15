import { DollarSign } from "lucide-react";

interface ExchangeRateWidgetProps {
  language: string;
  rates?: Record<string, number>;
}

const labels: Record<string, Record<string, string>> = {
  title: {
    ko: "환율",
    en: "Rates",
    zh: "汇率",
    vi: "Tỷ giá",
    ru: "Курс",
    ja: "為替"
  },
  source: {
    ko: "네이버 매매기준율",
    en: "Naver Rate",
    zh: "Naver汇率",
    vi: "Tỷ giá Naver",
    ru: "Курс Naver",
    ja: "Naver為替"
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
    <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-md px-2.5 py-1.5 border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-2">
      <DollarSign className="w-5 h-5 text-emerald-600" />
      <div>
        <p className="text-[9px] text-muted-foreground">{labels.title[language] || labels.title.ko} <span className="text-[8px] opacity-70">({labels.source[language] || labels.source.ko})</span></p>
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          {filteredRates.map(({ code, flag, rate }) => (
            <span key={code} className="text-[10px]">
              <span>{flag}</span>
              <span className="font-semibold text-foreground ml-0.5">{formatRate(rate)}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
