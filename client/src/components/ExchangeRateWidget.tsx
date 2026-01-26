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
  VND: "🇻🇳"
};

export function ExchangeRateWidget({ language, rates }: ExchangeRateWidgetProps) {
  if (!rates) {
    return null;
  }

  const displayCurrencies = ["KRW", "VND"];
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
    <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-sm px-1.5 py-1 border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1">
      <DollarSign className="w-3 h-3 text-emerald-600" />
      <div className="flex items-center gap-1.5">
        {filteredRates.map(({ code, flag, rate }) => (
          <span key={code} className="text-[9px]">
            <span>{flag}</span>
            <span className="font-semibold text-foreground ml-0.5">{formatRate(rate)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
