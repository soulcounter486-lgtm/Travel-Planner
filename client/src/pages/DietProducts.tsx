import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";
import { 
  Calculator, 
  MapPin, 
  Wallet, 
  MessageCircle, 
  Sparkles, 
  FileText,
  ShoppingBag,
  Phone,
  Check,
  Leaf,
  Coffee,
  Pill
} from "lucide-react";
import { SiKakaotalk } from "react-icons/si";
import logoImg from "@assets/BackgroundEraser_20240323_103507859_1768275315346.png";
import dietCoffeeImg from "@assets/호아캡슐의_사본의_사본의_사본_20251026_153621_0000_1768826502337.png";
import goDetoxImg from "@assets/Photo_1715141472014_1768826502343.png";
import goCoffeeImg from "@assets/Photo_1715141466258_1768837758578.png";

const translations: Record<string, {
  title: string;
  subtitle: string;
  inquiry: string;
  benefits: string;
  ingredients: string;
  usage: string;
  caution: string;
  perBox: string;
  priceLabel: string;
  shippingInfo: string;
  freeShipping: string;
  shippingFee: string;
  deliveryTime: string;
}> = {
  ko: {
    title: "베트남 쇼핑",
    subtitle: "베트남 프리미엄 제품을 만나보세요",
    inquiry: "카카오톡 문의",
    benefits: "효과",
    ingredients: "성분",
    usage: "복용방법",
    caution: "주의사항",
    perBox: "1박스",
    priceLabel: "가격",
    shippingInfo: "배송 안내",
    freeShipping: "3박스 이상 구매시 해외 무료배송",
    shippingFee: "3박스 미만 구매시 해외 배송료 10,000원 추가",
    deliveryTime: "배송 소요: 영업일 기준 3~4일",
  },
  en: {
    title: "Vietnam Shop",
    subtitle: "Discover premium Vietnamese products",
    inquiry: "KakaoTalk Inquiry",
    benefits: "Benefits",
    ingredients: "Ingredients",
    usage: "How to Use",
    caution: "Caution",
    perBox: "1 Box",
    priceLabel: "Price",
    shippingInfo: "Shipping Info",
    freeShipping: "Free international shipping for 3+ boxes",
    shippingFee: "10,000 KRW shipping fee for less than 3 boxes",
    deliveryTime: "Delivery: 3-4 business days",
  },
  zh: {
    title: "越南购物",
    subtitle: "探索越南优质产品",
    inquiry: "KakaoTalk咨询",
    benefits: "效果",
    ingredients: "成分",
    usage: "服用方法",
    caution: "注意事项",
    perBox: "1盒",
    priceLabel: "价格",
    shippingInfo: "配送信息",
    freeShipping: "购买3盒以上免国际运费",
    shippingFee: "少于3盒需加收10,000韩元运费",
    deliveryTime: "配送时间：3-4个工作日",
  },
  vi: {
    title: "Mua sắm Việt Nam",
    subtitle: "Khám phá sản phẩm cao cấp Việt Nam",
    inquiry: "Liên hệ KakaoTalk",
    benefits: "Hiệu quả",
    ingredients: "Thành phần",
    usage: "Cách dùng",
    caution: "Lưu ý",
    perBox: "1 hộp",
    priceLabel: "Giá",
    shippingInfo: "Thông tin vận chuyển",
    freeShipping: "Miễn phí vận chuyển quốc tế từ 3 hộp trở lên",
    shippingFee: "Phí vận chuyển 10,000 KRW cho dưới 3 hộp",
    deliveryTime: "Thời gian giao hàng: 3-4 ngày làm việc",
  },
  ru: {
    title: "Вьетнамский магазин",
    subtitle: "Откройте для себя премиальные вьетнамские продукты",
    inquiry: "Запрос KakaoTalk",
    benefits: "Преимущества",
    ingredients: "Ингредиенты",
    usage: "Способ применения",
    caution: "Предупреждение",
    perBox: "1 упаковка",
    priceLabel: "Цена",
    shippingInfo: "Информация о доставке",
    freeShipping: "Бесплатная международная доставка от 3 упаковок",
    shippingFee: "Стоимость доставки 10,000 KRW при заказе менее 3 упаковок",
    deliveryTime: "Срок доставки: 3-4 рабочих дня",
  },
  ja: {
    title: "ベトナムショッピング",
    subtitle: "ベトナムプレミアム製品をご紹介",
    inquiry: "カカオトーク問い合わせ",
    benefits: "効果",
    ingredients: "成分",
    usage: "服用方法",
    caution: "注意事項",
    perBox: "1箱",
    priceLabel: "価格",
    shippingInfo: "配送について",
    freeShipping: "3箱以上ご購入で海外送料無料",
    shippingFee: "3箱未満のご購入は海外送料10,000ウォン追加",
    deliveryTime: "配送日数：営業日基準3〜4日",
  },
};

const products = [
  {
    id: "diet-coffee",
    name: { ko: "다이어트 커피", en: "Diet Coffee", zh: "减肥咖啡", vi: "Cà phê giảm cân", ru: "Диетический кофе", ja: "ダイエットコーヒー" },
    brand: "Pluscoffee Diet",
    image: dietCoffeeImg,
    price: 45000,
    quantity: { ko: "15개 (15일분)", en: "15 packs (15 days)", zh: "15包（15天）", vi: "15 gói (15 ngày)", ru: "15 пакетов (15 дней)", ja: "15個（15日分）" },
    icon: Coffee,
    gradient: "from-amber-500 to-orange-600",
    benefits: {
      ko: ["체중 감량 지원", "신진대사 촉진", "자연 디톡스"],
      en: ["Weight loss support", "Metabolism boost", "Natural detox"],
      zh: ["支持减重", "促进新陈代谢", "自然排毒"],
      vi: ["Hỗ trợ giảm cân", "Tăng cường trao đổi chất", "Thải độc tự nhiên"],
      ru: ["Поддержка похудения", "Ускорение метаболизма", "Натуральный детокс"],
      ja: ["体重減少サポート", "新陳代謝促進", "自然デトックス"],
    },
    ingredients: {
      ko: "녹차, 흰콩, L-카르니틴, DNF-10(효모 추출물), 인스턴트 커피, 코코아 분말, 코코넛 밀크 분말, 덱스트로스, 이눌린 섬유, 비유제품 크리머",
      en: "Green tea, white beans, L-carnitine, DNF-10, instant coffee, cocoa powder, coconut milk powder, dextrose, inulin fiber, non-dairy creamer",
      zh: "绿茶、白芸豆、左旋肉碱、DNF-10、速溶咖啡、可可粉、椰奶粉、葡萄糖、菊粉纤维、植脂末",
      vi: "Trà xanh, đậu trắng, L-carnitine, DNF-10, cà phê hòa tan, bột cacao, bột sữa dừa, dextrose, chất xơ inulin, kem không sữa",
      ru: "Зеленый чай, белая фасоль, L-карнитин, DNF-10, растворимый кофе, какао-порошок, кокосовое молоко, декстроза, инулин, сливки",
      ja: "緑茶、白インゲン、L-カルニチン、DNF-10、インスタントコーヒー、ココアパウダー、ココナッツミルクパウダー、デキストロース、イヌリン繊維",
    },
    usage: {
      ko: "아침식사 전 뜨거운물 50ML와 함께 1포를 물에 타서 섭취",
      en: "Mix 1 pack with 50ML hot water before breakfast",
      zh: "早餐前用50ML热水冲服1包",
      vi: "Pha 1 gói với 50ML nước nóng trước bữa sáng",
      ru: "Растворить 1 пакет в 50 мл горячей воды перед завтраком",
      ja: "朝食前に50MLの熱湯で1袋を溶かして摂取",
    },
    caution: {
      ko: "임산부, 본 제품의 성분에 민감하거나 금기사항이 있는 사람은 사용하지 마십시오.",
      en: "Not recommended for pregnant women or those sensitive to ingredients.",
      zh: "孕妇或对成分敏感者不建议使用",
      vi: "Không khuyến cáo cho phụ nữ mang thai hoặc người nhạy cảm với thành phần",
      ru: "Не рекомендуется беременным или чувствительным к ингредиентам",
      ja: "妊婦または成分に敏感な方は使用しないでください",
    },
  },
  {
    id: "go-detox",
    name: { ko: "고디톡스", en: "Go Detox", zh: "Go Detox", vi: "Go Detox", ru: "Go Detox", ja: "ゴーデトックス" },
    brand: "Go Detox",
    image: goDetoxImg,
    price: 38000,
    quantity: { ko: "28알", en: "28 pills", zh: "28粒", vi: "28 viên", ru: "28 таблеток", ja: "28錠" },
    icon: Pill,
    gradient: "from-emerald-500 to-teal-600",
    benefits: {
      ko: ["자연 디톡스", "체중 관리", "피부 개선"],
      en: ["Natural detox", "Weight management", "Skin improvement"],
      zh: ["自然排毒", "体重管理", "改善皮肤"],
      vi: ["Thải độc tự nhiên", "Quản lý cân nặng", "Cải thiện da"],
      ru: ["Натуральный детокс", "Контроль веса", "Улучшение кожи"],
      ja: ["自然デトックス", "体重管理", "肌改善"],
    },
    ingredients: {
      ko: "복령 100mg, 연잎 100mg, 가르시니아 캄보지아 80mg, 은행 60mg, 사과식초 추출물 60mg, L-carnitine 40mg, Collagen 20mg",
      en: "Poria 100mg, Lotus leaf 100mg, Garcinia Cambogia 80mg, Ginkgo 60mg, Apple cider vinegar extract 60mg, L-carnitine 40mg, Collagen 20mg",
      zh: "茯苓100mg、荷叶100mg、藤黄果80mg、银杏60mg、苹果醋提取物60mg、左旋肉碱40mg、胶原蛋白20mg",
      vi: "Phục linh 100mg, Lá sen 100mg, Garcinia Cambogia 80mg, Bạch quả 60mg, Chiết xuất giấm táo 60mg, L-carnitine 40mg, Collagen 20mg",
      ru: "Пория 100мг, Лист лотоса 100мг, Гарциния камбоджийская 80мг, Гинкго 60мг, Экстракт яблочного уксуса 60мг, L-карнитин 40мг, Коллаген 20мг",
      ja: "茯苓100mg、蓮葉100mg、ガルシニアカンボジア80mg、銀杏60mg、りんご酢エキス60mg、L-カルニチン40mg、コラーゲン20mg",
    },
    usage: {
      ko: "1일째 아침 공복에 1알, 2일째 아침 공복에 1알, 3일째부터 아침 공복에 2알씩",
      en: "Day 1: 1 pill on empty stomach, Day 2: 1 pill, Day 3+: 2 pills on empty stomach",
      zh: "第1天空腹1粒，第2天空腹1粒，第3天起空腹2粒",
      vi: "Ngày 1: 1 viên lúc bụng đói, Ngày 2: 1 viên, Ngày 3+: 2 viên lúc bụng đói",
      ru: "День 1: 1 таблетка натощак, День 2: 1 таблетка, День 3+: 2 таблетки натощак",
      ja: "1日目：空腹時に1錠、2日目：1錠、3日目以降：空腹時に2錠",
    },
    caution: {
      ko: "하루에 2.5~3리터의 물을 마셔주세요. 음용중에는 각성제 섭취를 자제해 주세요.",
      en: "Drink 2.5-3 liters of water daily. Avoid stimulants while taking.",
      zh: "每天喝2.5-3升水。服用期间避免刺激性物质",
      vi: "Uống 2.5-3 lít nước mỗi ngày. Tránh chất kích thích khi dùng",
      ru: "Пейте 2.5-3 литра воды в день. Избегайте стимуляторов при приеме",
      ja: "1日2.5〜3リットルの水を飲んでください。服用中は刺激物を控えてください",
    },
  },
  {
    id: "go-coffee",
    name: { ko: "고커피", en: "Go Coffee", zh: "Go Coffee", vi: "Go Coffee", ru: "Go Coffee", ja: "ゴーコーヒー" },
    brand: "MAX HEALTH Go Coffee",
    image: goCoffeeImg,
    price: 38000,
    quantity: { ko: "12포", en: "12 packs", zh: "12包", vi: "12 gói", ru: "12 пакетов", ja: "12包" },
    icon: Coffee,
    gradient: "from-gray-700 to-gray-900",
    benefits: {
      ko: ["에너지 증진", "체중 감량", "자연 성분"],
      en: ["Energy boost", "Weight loss", "Natural ingredients"],
      zh: ["增加能量", "减轻体重", "天然成分"],
      vi: ["Tăng năng lượng", "Giảm cân", "Thành phần tự nhiên"],
      ru: ["Прилив энергии", "Снижение веса", "Натуральные ингредиенты"],
      ja: ["エネルギー増進", "体重減少", "天然成分"],
    },
    ingredients: {
      ko: "비유제품 크리머 분말, 인스턴트 커피, 녹색 영지 추출물 분말, 추출물, 말토덱스트린, 추출물 등",
      en: "Non-dairy creamer powder, instant coffee, green lingzhi extract, maltodextrin, extracts",
      zh: "植脂末、速溶咖啡、绿灵芝提取物、麦芽糊精、提取物等",
      vi: "Bột kem không sữa, cà phê hòa tan, chiết xuất linh chi xanh, maltodextrin, chiết xuất",
      ru: "Безмолочные сливки, растворимый кофе, экстракт зеленой линчжи, мальтодекстрин, экстракты",
      ja: "非乳製品クリーマー、インスタントコーヒー、緑霊芝エキス、マルトデキストリン、エキス等",
    },
    usage: {
      ko: "따뜻하게 마시기: 뜨거운 물 70ML에 커피 1~2포를 녹여 드세요. 시원하게 마시기: 뜨거운 물 70ML에 커피 2팩을 섞어준 후 얼음을 넣어 드세요.",
      en: "Hot: Mix 1-2 packs with 70ML hot water. Cold: Mix 2 packs with 70ML hot water, add ice.",
      zh: "热饮：将1-2包与70ML热水混合。冷饮：将2包与70ML热水混合后加冰",
      vi: "Nóng: Pha 1-2 gói với 70ML nước nóng. Lạnh: Pha 2 gói với 70ML nước nóng, thêm đá",
      ru: "Горячий: Смешайте 1-2 пакета с 70 мл горячей воды. Холодный: Смешайте 2 пакета, добавьте лед",
      ja: "ホット：70MLの熱湯に1〜2包を溶かす。アイス：70MLの熱湯に2包を溶かし、氷を入れる",
    },
    caution: {
      ko: "하루에 2.5~3리터의 물을 마셔주세요. 음용중에는 각성제 섭취를 자제해 주세요.",
      en: "Drink 2.5-3 liters of water daily. Avoid stimulants while taking.",
      zh: "每天喝2.5-3升水。服用期间避免刺激性物质",
      vi: "Uống 2.5-3 lít nước mỗi ngày. Tránh chất kích thích khi dùng",
      ru: "Пейте 2.5-3 литра воды в день. Избегайте стимуляторов при приеме",
      ja: "1日2.5〜3リットルの水を飲んでください。服用中は刺激物を控えてください",
    },
  },
];

const navLabels = {
  calculator: { ko: "견적", en: "Quote", zh: "报价", vi: "Báo giá", ru: "Цена", ja: "見積" },
  guide: { ko: "관광/맛집", en: "Guide", zh: "指南", vi: "Hướng dẫn", ru: "Гид", ja: "ガイド" },
  board: { ko: "소식", en: "News", zh: "新闻", vi: "Tin tức", ru: "Новости", ja: "ニュース" },
  diet: { ko: "쇼핑", en: "Shop", zh: "购物", vi: "Mua sắm", ru: "Магазин", ja: "ショッピング" },
  planner: { ko: "AI플래너", en: "AI Planner", zh: "AI计划", vi: "AI Planner", ru: "AI Планер", ja: "AIプランナー" },
  expenses: { ko: "가계부", en: "Expenses", zh: "记账", vi: "Chi tiêu", ru: "Расходы", ja: "家計簿" },
  chat: { ko: "단톡방", en: "Chat", zh: "聊天", vi: "Trò chuyện", ru: "Чат", ja: "チャット" },
};

export default function DietProducts() {
  const { language, t } = useLanguage();
  const labels = translations[language] || translations.ko;

  const handleInquiry = () => {
    window.open("http://pf.kakao.com/_ttfxcj/chat", "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src={logoImg} alt="Logo" className="h-10 w-10 object-contain" />
            <span className="font-bold text-lg hidden sm:inline">{t("header.title")}</span>
          </Link>
        </div>
      </header>

      <div className="bg-background border-b shadow-sm sticky top-[60px] z-40">
        <div className="max-w-4xl mx-auto px-4 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-1.5 py-3 min-w-max">
            <Link href="/">
              <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs whitespace-nowrap" data-testid="nav-calculator">
                <Calculator className="w-3.5 h-3.5" />
                {navLabels.calculator[language as keyof typeof navLabels.calculator] || navLabels.calculator.ko}
              </Button>
            </Link>
            <Link href="/guide">
              <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs whitespace-nowrap" data-testid="nav-guide">
                <MapPin className="w-3.5 h-3.5" />
                {navLabels.guide[language as keyof typeof navLabels.guide] || navLabels.guide.ko}
              </Button>
            </Link>
            <Link href="/board">
              <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs whitespace-nowrap" data-testid="nav-board">
                <FileText className="w-3.5 h-3.5" />
                {navLabels.board[language as keyof typeof navLabels.board] || navLabels.board.ko}
              </Button>
            </Link>
            <Button variant="default" size="sm" className="flex items-center gap-1.5 text-xs whitespace-nowrap" data-testid="nav-diet">
              <ShoppingBag className="w-3.5 h-3.5" />
              {navLabels.diet[language as keyof typeof navLabels.diet] || navLabels.diet.ko}
            </Button>
            <Link href="/planner">
              <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs whitespace-nowrap" data-testid="nav-planner">
                <Sparkles className="w-3.5 h-3.5" />
                {navLabels.planner[language as keyof typeof navLabels.planner] || navLabels.planner.ko}
              </Button>
            </Link>
            <Link href="/expenses">
              <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs whitespace-nowrap" data-testid="nav-expenses">
                <Wallet className="w-3.5 h-3.5" />
                {navLabels.expenses[language as keyof typeof navLabels.expenses] || navLabels.expenses.ko}
              </Button>
            </Link>
            <Link href="/chat">
              <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs whitespace-nowrap" data-testid="nav-chat">
                <MessageCircle className="w-3.5 h-3.5" />
                {navLabels.chat[language as keyof typeof navLabels.chat] || navLabels.chat.ko}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Leaf className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {labels.title}
            </h1>
          </div>
          <p className="text-muted-foreground">{labels.subtitle}</p>
        </div>

        <div className="grid gap-6">
          {products.map((product) => {
            const ProductIcon = product.icon;
            const productName = product.name[language as keyof typeof product.name] || product.name.ko;
            const productQuantity = product.quantity[language as keyof typeof product.quantity] || product.quantity.ko;
            const productBenefits = product.benefits[language as keyof typeof product.benefits] || product.benefits.ko;
            const productIngredients = product.ingredients[language as keyof typeof product.ingredients] || product.ingredients.ko;
            const productUsage = product.usage[language as keyof typeof product.usage] || product.usage.ko;
            const productCaution = product.caution[language as keyof typeof product.caution] || product.caution.ko;

            return (
              <Card key={product.id} className="overflow-hidden" data-testid={`card-product-${product.id}`}>
                <div className={`bg-gradient-to-r ${product.gradient} p-4 text-white`}>
                  <div className="flex items-center gap-3">
                    <ProductIcon className="w-8 h-8" />
                    <div>
                      <h2 className="text-xl font-bold">{productName}</h2>
                      <p className="text-sm opacity-90">{product.brand}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <div className="text-2xl font-bold mb-1">
                        {product.price.toLocaleString()}원
                      </div>
                      <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                        {labels.perBox} {productQuantity}
                      </span>
                    </div>
                  </div>
                </div>

                <CardContent className="p-0">
                  <div className="grid md:grid-cols-2">
                    <div className="p-4 border-b md:border-b-0 md:border-r flex items-center justify-center">
                      <img 
                        src={product.image} 
                        alt={productName} 
                        className="max-w-full max-h-64 rounded-lg object-contain mx-auto"
                      />
                    </div>

                    <div className="p-4 space-y-4">
                      <div>
                        <h3 className="font-semibold text-green-700 flex items-center gap-2 mb-2">
                          <Check className="w-4 h-4" />
                          {labels.benefits}
                        </h3>
                        <ul className="space-y-1">
                          {productBenefits.map((benefit, idx) => (
                            <li key={idx} className="text-sm flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h3 className="font-semibold text-blue-700 mb-2">{labels.ingredients}</h3>
                        <p className="text-sm text-muted-foreground">{productIngredients}</p>
                      </div>

                      <div>
                        <h3 className="font-semibold text-purple-700 mb-2">{labels.usage}</h3>
                        <p className="text-sm">{productUsage}</p>
                      </div>

                      <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                        <h3 className="font-semibold text-amber-700 mb-1">{labels.caution}</h3>
                        <p className="text-xs text-amber-600">{productCaution}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200" data-testid="card-shipping-info">
          <h3 className="text-lg font-bold text-blue-800 mb-4 text-center">{labels.shippingInfo}</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-green-100 p-3 rounded-lg">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-sm text-green-800 font-medium">{labels.freeShipping}</span>
            </div>
            <div className="flex items-center gap-3 bg-amber-100 p-3 rounded-lg">
              <ShoppingBag className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <span className="text-sm text-amber-800 font-medium">{labels.shippingFee}</span>
            </div>
            <div className="flex items-center gap-3 bg-blue-100 p-3 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <span className="text-sm text-blue-800 font-medium">{labels.deliveryTime}</span>
            </div>
          </div>
        </Card>

        </main>

      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          onClick={handleInquiry}
          size="sm"
          className="bg-yellow-400 hover:bg-yellow-500 text-black shadow-lg"
          data-testid="button-fixed-inquiry"
        >
          <SiKakaotalk className="w-4 h-4 mr-1.5" />
          {labels.inquiry}
        </Button>
      </div>
    </div>
  );
}
