import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";
import {
  ShoppingBag,
  Check,
  Leaf,
  Coffee,
  Pill,
  LayoutGrid,
  List,
  Loader2,
  Headphones,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { SiKakaotalk } from "react-icons/si";
import { AppHeader } from "@/components/AppHeader";
import { FixedBottomBar } from "@/components/FixedBottomBar";
import { TabNavigation } from "@/components/TabNavigation";
import type { ShopProduct } from "@shared/schema";
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
  shippingInfo: string;
  freeShipping: string;
  shippingFee: string;
  deliveryTime: string;
  customerService: string;
  purchaseInquiry: string;
  listView: string;
  cardView: string;
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
    shippingInfo: "배송 안내",
    freeShipping: "3박스 이상 구매시 해외 무료배송",
    shippingFee: "3박스 미만 구매시 해외 배송료 10,000원 추가",
    deliveryTime: "배송 소요: 영업일 기준 3~4일",
    customerService: "고객센터",
    purchaseInquiry: "구매문의",
    listView: "목록",
    cardView: "카드",
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
    shippingInfo: "Shipping Info",
    freeShipping: "Free international shipping for 3+ boxes",
    shippingFee: "10,000 KRW shipping fee for less than 3 boxes",
    deliveryTime: "Delivery: 3-4 business days",
    customerService: "Support",
    purchaseInquiry: "Inquire",
    listView: "List",
    cardView: "Card",
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
    shippingInfo: "配送信息",
    freeShipping: "购买3盒以上免国际运费",
    shippingFee: "少于3盒需加收10,000韩元运费",
    deliveryTime: "配送时间：3-4个工作日",
    customerService: "客服",
    purchaseInquiry: "购买咨询",
    listView: "列表",
    cardView: "卡片",
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
    shippingInfo: "Thông tin vận chuyển",
    freeShipping: "Miễn phí vận chuyển quốc tế từ 3 hộp trở lên",
    shippingFee: "Phí vận chuyển 10,000 KRW cho dưới 3 hộp",
    deliveryTime: "Thời gian giao hàng: 3-4 ngày làm việc",
    customerService: "Hỗ trợ",
    purchaseInquiry: "Hỏi mua",
    listView: "Danh sách",
    cardView: "Thẻ",
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
    shippingInfo: "Информация о доставке",
    freeShipping: "Бесплатная международная доставка от 3 упаковок",
    shippingFee: "Стоимость доставки 10,000 KRW при заказе менее 3 упаковок",
    deliveryTime: "Срок доставки: 3-4 рабочих дня",
    customerService: "Поддержка",
    purchaseInquiry: "Запрос",
    listView: "Список",
    cardView: "Карточки",
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
    shippingInfo: "配送について",
    freeShipping: "3箱以上ご購入で海外送料無料",
    shippingFee: "3箱未満のご購入は海外送料10,000ウォン追加",
    deliveryTime: "配送日数：営業日基準3〜4日",
    customerService: "サポート",
    purchaseInquiry: "購入問合せ",
    listView: "リスト",
    cardView: "カード",
  },
};

const hardcodedProducts = [
  {
    id: "diet-coffee",
    name: "다이어트 커피",
    brand: "Pluscoffee Diet",
    image: dietCoffeeImg,
    price: 45000,
    quantity: "15개 (15일분)",
    benefits: ["체중 감량 지원", "신진대사 촉진", "자연 디톡스"],
    ingredients: "녹차, 흰콩, L-카르니틴, DNF-10(효모 추출물), 인스턴트 커피, 코코아 분말, 코코넛 밀크 분말, 덱스트로스, 이눌린 섬유, 비유제품 크리머",
    usage: "아침식사 전 뜨거운물 50ML와 함께 1포를 물에 타서 섭취",
    caution: "임산부, 본 제품의 성분에 민감하거나 금기사항이 있는 사람은 사용하지 마십시오.",
    gradient: "from-amber-500 to-orange-600",
  },
  {
    id: "go-detox",
    name: "고디톡스",
    brand: "Go Detox",
    image: goDetoxImg,
    price: 38000,
    quantity: "28알",
    benefits: ["자연 디톡스", "체중 관리", "피부 개선"],
    ingredients: "복령 100mg, 연잎 100mg, 가르시니아 캄보지아 80mg, 은행 60mg, 사과식초 추출물 60mg, L-carnitine 40mg, Collagen 20mg",
    usage: "1일째 아침 공복에 1알, 2일째 아침 공복에 1알, 3일째부터 아침 공복에 2알씩",
    caution: "하루에 2.5~3리터의 물을 마셔주세요. 음용중에는 각성제 섭취를 자제해 주세요.",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    id: "go-coffee",
    name: "고커피",
    brand: "MAX HEALTH Go Coffee",
    image: goCoffeeImg,
    price: 40000,
    quantity: "12포",
    benefits: ["에너지 증진", "체중 감량", "자연 성분"],
    ingredients: "비유제품 크리머 분말, 인스턴트 커피, 녹색 영지 추출물 분말, 추출물, 말토덱스트린, 추출물 등",
    usage: "따뜻하게 마시기: 뜨거운 물 70ML에 커피 1~2포를 녹여 드세요. 시원하게 마시기: 뜨거운 물 70ML에 커피 2팩을 섞어준 후 얼음을 넣어 드세요.",
    caution: "하루에 2.5~3리터의 물을 마셔주세요. 음용중에는 각성제 섭취를 자제해 주세요.",
    gradient: "from-gray-700 to-gray-900",
  },
];

export default function DietProducts() {
  const { language } = useLanguage();
  const labels = translations[language] || translations.ko;
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [expandedId, setExpandedId] = useState<string | number | null>(null);

  const { data: dbProducts = [], isLoading } = useQuery<ShopProduct[]>({
    queryKey: ["/api/shop-products"],
  });

  const dbMapped = dbProducts.map(p => ({
    id: p.id,
    name: p.name,
    brand: p.brand || "",
    image: p.image || (p.images && p.images.length > 0 ? (p.images as string[])[0] : ""),
    price: p.price,
    quantity: p.quantity || "",
    benefits: (p.benefits || []) as string[],
    ingredients: p.ingredients || "",
    usage: p.usage || "",
    caution: p.caution || "",
    gradient: p.gradient || "from-primary to-purple-600",
    isDb: true,
  }));
  const dbNames = new Set(dbMapped.map(p => p.name.toLowerCase().trim()));
  const filteredHardcoded = hardcodedProducts
    .filter(p => !dbNames.has(p.name.toLowerCase().trim()))
    .map(p => ({ ...p, isDb: false }));
  const allProducts = [...dbMapped, ...filteredHardcoded];

  const handleKakaoInquiry = (productName?: string) => {
    const msg = productName ? `${productName} 구매문의` : "";
    window.open(`http://pf.kakao.com/_ttfxcj/chat${msg ? `?message=${encodeURIComponent(msg)}` : ""}`, "_blank");
  };

  const handleCustomerService = () => {
    const el = document.querySelector('[data-testid="btn-customer-chat"]') as HTMLElement;
    if (el) {
      el.click();
    } else {
      window.open("http://pf.kakao.com/_ttfxcj/chat", "_blank");
    }
  };

  const toggleExpand = (id: string | number) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <AppHeader />
      <TabNavigation language={language} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Leaf className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {labels.title}
            </h1>
          </div>
          <p className="text-muted-foreground">{labels.subtitle}</p>
        </div>

        <div className="flex justify-end mb-4 gap-1">
          <Button
            variant={viewMode === "card" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("card")}
            data-testid="btn-card-view"
          >
            <LayoutGrid className="w-4 h-4 mr-1" />
            {labels.cardView}
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            data-testid="btn-list-view"
          >
            <List className="w-4 h-4 mr-1" />
            {labels.listView}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : viewMode === "list" ? (
          <div className="space-y-2">
            {allProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden" data-testid={`card-product-${product.id}`}>
                <CardContent className="p-0">
                  <div
                    className="flex items-center gap-3 p-3 cursor-pointer"
                    onClick={() => toggleExpand(product.id)}
                    data-testid={`btn-expand-${product.id}`}
                  >
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-14 h-14 rounded-md object-cover flex-shrink-0" />
                    ) : (
                      <div className={`w-14 h-14 rounded-md bg-gradient-to-r ${product.gradient} flex items-center justify-center flex-shrink-0`}>
                        <Coffee className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                      {product.brand && <p className="text-xs text-muted-foreground">{product.brand}</p>}
                      {product.quantity && <p className="text-xs text-muted-foreground">{product.quantity}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-primary">{product.price.toLocaleString()}원</p>
                      {expandedId === product.id ? <ChevronUp className="w-4 h-4 mx-auto mt-1 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 mx-auto mt-1 text-muted-foreground" />}
                    </div>
                  </div>
                  {expandedId === product.id && (
                    <div className="px-3 pb-3 border-t space-y-3 pt-3">
                      {product.image && (
                        <img src={product.image} alt={product.name} className="max-w-full max-h-48 rounded-lg object-contain mx-auto" />
                      )}
                      {product.benefits.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-green-700 dark:text-green-400 flex items-center gap-1 text-sm mb-1">
                            <Check className="w-3 h-3" /> {labels.benefits}
                          </h4>
                          <ul className="space-y-0.5">
                            {product.benefits.map((b, i) => (
                              <li key={i} className="text-xs flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0" />
                                {b}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {product.ingredients && (
                        <div>
                          <h4 className="font-semibold text-sm mb-1">{labels.ingredients}</h4>
                          <p className="text-xs text-muted-foreground">{product.ingredients}</p>
                        </div>
                      )}
                      {product.usage && (
                        <div>
                          <h4 className="font-semibold text-sm mb-1">{labels.usage}</h4>
                          <p className="text-xs">{product.usage}</p>
                        </div>
                      )}
                      {product.caution && (
                        <div className="bg-amber-50 dark:bg-amber-950/30 p-2 rounded-md">
                          <h4 className="font-semibold text-amber-700 dark:text-amber-400 text-xs mb-0.5">{labels.caution}</h4>
                          <p className="text-xs text-amber-600 dark:text-amber-300">{product.caution}</p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-yellow-400 text-black"
                          onClick={(e) => { e.stopPropagation(); handleKakaoInquiry(product.name); }}
                          data-testid={`btn-kakao-inquiry-${product.id}`}
                        >
                          <SiKakaotalk className="w-4 h-4 mr-1" />
                          {labels.purchaseInquiry}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={(e) => { e.stopPropagation(); handleCustomerService(); }}
                          data-testid={`btn-cs-inquiry-${product.id}`}
                        >
                          <Headphones className="w-4 h-4 mr-1" />
                          {labels.customerService}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-6">
            {allProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden" data-testid={`card-product-${product.id}`}>
                <div className={`bg-gradient-to-r ${product.gradient} p-4 text-white`}>
                  <div className="flex items-center gap-3">
                    <Coffee className="w-8 h-8" />
                    <div>
                      <h2 className="text-xl font-bold">{product.name}</h2>
                      {product.brand && <p className="text-sm opacity-90">{product.brand}</p>}
                    </div>
                    <div className="ml-auto text-right">
                      <div className="text-2xl font-bold mb-1">{product.price.toLocaleString()}원</div>
                      {product.quantity && (
                        <span className="bg-white/20 px-3 py-1 rounded-full text-sm">{labels.perBox} {product.quantity}</span>
                      )}
                    </div>
                  </div>
                </div>

                <CardContent className="p-0">
                  <div className="grid md:grid-cols-2">
                    {product.image && (
                      <div className="p-4 border-b md:border-b-0 md:border-r flex items-center justify-center">
                        <img src={product.image} alt={product.name} className="max-w-full max-h-64 rounded-lg object-contain mx-auto" />
                      </div>
                    )}
                    <div className={`p-4 space-y-4 ${!product.image ? "md:col-span-2" : ""}`}>
                      {product.benefits.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-green-700 dark:text-green-400 flex items-center gap-2 mb-2">
                            <Check className="w-4 h-4" /> {labels.benefits}
                          </h3>
                          <ul className="space-y-1">
                            {product.benefits.map((benefit, idx) => (
                              <li key={idx} className="text-sm flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                {benefit}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {product.ingredients && (
                        <div>
                          <h3 className="font-semibold mb-2">{labels.ingredients}</h3>
                          <p className="text-sm text-muted-foreground">{product.ingredients}</p>
                        </div>
                      )}
                      {product.usage && (
                        <div>
                          <h3 className="font-semibold mb-2">{labels.usage}</h3>
                          <p className="text-sm">{product.usage}</p>
                        </div>
                      )}
                      {product.caution && (
                        <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                          <h3 className="font-semibold text-amber-700 dark:text-amber-400 mb-1">{labels.caution}</h3>
                          <p className="text-xs text-amber-600 dark:text-amber-300">{product.caution}</p>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button
                          className="flex-1 bg-yellow-400 text-black"
                          onClick={() => handleKakaoInquiry(product.name)}
                          data-testid={`btn-kakao-inquiry-${product.id}`}
                        >
                          <SiKakaotalk className="w-4 h-4 mr-1.5" />
                          {labels.purchaseInquiry}
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={handleCustomerService}
                          data-testid={`btn-cs-inquiry-${product.id}`}
                        >
                          <Headphones className="w-4 h-4 mr-1.5" />
                          {labels.customerService}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800" data-testid="card-shipping-info">
          <h3 className="text-lg font-bold text-blue-800 dark:text-blue-300 mb-4 text-center">{labels.shippingInfo}</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-green-100 dark:bg-green-950/40 p-3 rounded-lg">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-sm text-green-800 dark:text-green-300 font-medium">{labels.freeShipping}</span>
            </div>
            <div className="flex items-center gap-3 bg-amber-100 dark:bg-amber-950/40 p-3 rounded-lg">
              <ShoppingBag className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <span className="text-sm text-amber-800 dark:text-amber-300 font-medium">{labels.shippingFee}</span>
            </div>
          </div>
        </Card>

        <div className="text-center text-xs text-muted-foreground mt-8 pb-4">
          사업자등록번호: 붕따우 도깨비 350-70-00679
        </div>
      </main>

      <FixedBottomBar />
    </div>
  );
}