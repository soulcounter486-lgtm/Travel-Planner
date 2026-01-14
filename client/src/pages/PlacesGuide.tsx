import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/i18n";
import { MapPin, Phone, ExternalLink, Utensils, Coffee, Scissors, Building2, Camera, ChevronDown, ChevronUp, AlertTriangle, Calculator, MessageCircle, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logoImg from "@assets/BackgroundEraser_20240323_103507859_1768371269457.png";

interface Place {
  name: string;
  nameVi?: string;
  address?: string;
  phone?: string;
  mapUrl: string;
  note?: string;
  recommended?: boolean;
  image?: string;
  description?: Record<string, string>;
}

interface Category {
  id: string;
  icon: React.ElementType;
  gradient: string;
  places: Place[];
}

const placesData: Record<string, Category> = {
  attractions: {
    id: "attractions",
    icon: Camera,
    gradient: "from-blue-500 to-indigo-600",
    places: [
      { 
        name: "붕따우 거대 예수상", 
        nameVi: "Tượng Chúa Kitô", 
        mapUrl: "https://maps.app.goo.gl/CgLqYEKGLxodn27B8",
        image: "https://images.unsplash.com/photo-1555086156-e6c7353d283f?w=400&h=300&fit=crop",
        description: {
          ko: "높이 32m의 거대한 예수상으로, 붕따우의 상징적인 랜드마크입니다. 811개의 계단을 올라가면 붕따우 시내와 바다의 아름다운 전경을 감상할 수 있습니다.",
          en: "A 32-meter tall statue of Jesus, an iconic landmark of Vung Tau. Climb 811 steps for stunning views of the city and sea.",
          zh: "32米高的耶稣雕像，是头顿的标志性地标。攀登811级台阶可欣赏城市和大海的壮丽景色。",
          vi: "Tượng Chúa Kitô cao 32m, biểu tượng của Vũng Tàu. Leo 811 bậc thang để ngắm toàn cảnh thành phố và biển.",
          ru: "32-метровая статуя Христа - знаковая достопримечательность Вунгтау. Поднимитесь по 811 ступеням, чтобы насладиться потрясающим видом.",
          ja: "高さ32mの巨大なキリスト像で、ブンタウのシンボルです。811段の階段を登ると、街と海の絶景が楽しめます。"
        }
      },
      { 
        name: "붕따우 등대", 
        nameVi: "Hải Đăng Vũng Tàu", 
        mapUrl: "https://maps.app.goo.gl/HMJbSLCR3bzZxsxy8", 
        note: "largeVehicleNo",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
        description: {
          ko: "1862년 프랑스 식민지 시대에 건설된 역사적인 등대입니다. 붕따우에서 가장 높은 곳에 위치하여 360도 파노라마 전망을 제공합니다.",
          en: "Historic lighthouse built in 1862 during French colonial period. Located at the highest point in Vung Tau with 360-degree panoramic views.",
          zh: "1862年法国殖民时期建造的历史灯塔。位于头顿最高点，可欣赏360度全景。",
          vi: "Ngọn hải đăng lịch sử được xây dựng năm 1862 thời Pháp thuộc. Nằm ở điểm cao nhất Vũng Tàu với tầm nhìn 360 độ.",
          ru: "Исторический маяк, построенный в 1862 году. Расположен в самой высокой точке с панорамным видом на 360 градусов.",
          ja: "1862年フランス植民地時代に建設された歴史的な灯台。ブンタウで最も高い場所にあり、360度のパノラマビューが楽しめます。"
        }
      },
      { 
        name: "전쟁기념관", 
        nameVi: "Bà Rịa–Vũng Tàu Provincial museum", 
        phone: "0254 3852 421", 
        mapUrl: "https://maps.app.goo.gl/YiF3HpgZvXtKTfMCA",
        image: "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=400&h=300&fit=crop",
        description: {
          ko: "베트남 전쟁과 지역 역사를 전시하는 박물관입니다. 전쟁 유물, 사진, 역사적 문서들을 통해 베트남의 역사를 배울 수 있습니다.",
          en: "Museum displaying Vietnam War history and local heritage. Learn about Vietnamese history through war artifacts, photos, and historical documents.",
          zh: "展示越南战争和当地历史的博物馆。通过战争文物、照片和历史文献了解越南历史。",
          vi: "Bảo tàng trưng bày lịch sử chiến tranh Việt Nam và di sản địa phương. Tìm hiểu lịch sử qua hiện vật, ảnh và tài liệu.",
          ru: "Музей истории Вьетнамской войны и местного наследия. Познакомьтесь с историей через артефакты и фотографии.",
          ja: "ベトナム戦争と地域の歴史を展示する博物館。戦争遺物や写真を通じてベトナムの歴史を学べます。"
        }
      },
      { 
        name: "화이트 펠리스(띠우 별장)", 
        nameVi: "Bạch Dinh (White Palace)", 
        mapUrl: "https://maps.app.goo.gl/LDkeQHy1Watfec51A",
        image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop",
        description: {
          ko: "프랑스 식민지 시대에 지어진 우아한 백색 건물로, 과거 총독의 여름 별장이었습니다. 아름다운 정원과 바다 전망이 인상적입니다.",
          en: "Elegant white building from French colonial era, formerly the Governor's summer residence. Features beautiful gardens and sea views.",
          zh: "法国殖民时期建造的优雅白色建筑，曾是总督的夏季别墅。拥有美丽的花园和海景。",
          vi: "Tòa nhà trắng thanh lịch từ thời Pháp thuộc, từng là dinh thự nghỉ mát của Toàn quyền. Có vườn đẹp và view biển.",
          ru: "Элегантное белое здание французской колониальной эпохи, бывшая летняя резиденция губернатора.",
          ja: "フランス植民地時代に建てられた優雅な白い建物で、かつての総督の夏の別荘でした。美しい庭園と海の景色が印象的です。"
        }
      },
      { 
        name: "놀이동산", 
        nameVi: "Ho May Amusement Park", 
        mapUrl: "https://maps.app.goo.gl/vM6tXvAXi4tTNhUV6",
        image: "https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?w=400&h=300&fit=crop",
        description: {
          ko: "케이블카를 타고 올라가는 산 위의 테마파크입니다. 놀이기구, 동물원, 사원 등 다양한 즐길거리가 있으며 가족 여행에 적합합니다.",
          en: "Mountain-top theme park accessible by cable car. Features rides, a zoo, temples, and various attractions perfect for family trips.",
          zh: "乘坐缆车前往的山顶主题公园。有游乐设施、动物园、寺庙等，适合家庭游玩。",
          vi: "Công viên giải trí trên núi đi bằng cáp treo. Có trò chơi, sở thú, chùa, phù hợp cho gia đình.",
          ru: "Тематический парк на горе, доступный по канатной дороге. Аттракционы, зоопарк, храмы - идеально для семьи.",
          ja: "ケーブルカーで登る山頂のテーマパーク。乗り物、動物園、寺院など家族旅行に最適です。"
        }
      },
      { 
        name: "불교사찰", 
        nameVi: "Chơn Không Monastery", 
        mapUrl: "https://maps.app.goo.gl/THctAg3uEvx9q9ZLA", 
        note: "largeVehicleNo",
        image: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&h=300&fit=crop",
        description: {
          ko: "산 중턱에 위치한 평화로운 불교 사찰입니다. 조용한 분위기에서 명상하고 베트남 불교 문화를 체험할 수 있습니다.",
          en: "Peaceful Buddhist monastery located on the mountainside. Experience Vietnamese Buddhist culture in a serene meditation environment.",
          zh: "位于山腰的宁静佛教寺院。在安静的环境中冥想，体验越南佛教文化。",
          vi: "Thiền viện yên bình nằm trên sườn núi. Trải nghiệm văn hóa Phật giáo Việt Nam trong không gian thiền định.",
          ru: "Мирный буддийский монастырь на склоне горы. Познакомьтесь с вьетнамской буддийской культурой.",
          ja: "山の中腹にある平和な仏教寺院。静かな環境で瞑想し、ベトナム仏教文化を体験できます。"
        }
      },
      { 
        name: "붕따우 백비치", 
        nameVi: "Bãi Sau", 
        mapUrl: "https://maps.app.goo.gl/UCARs7msTkaUr2HW6",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop",
        description: {
          ko: "붕따우에서 가장 긴 해변으로, 수영과 해수욕을 즐기기에 최적입니다. 해변을 따라 레스토랑과 카페가 즐비합니다.",
          en: "The longest beach in Vung Tau, perfect for swimming and sunbathing. Lined with restaurants and cafes along the shore.",
          zh: "头顿最长的海滩，非常适合游泳和日光浴。沿岸有众多餐厅和咖啡馆。",
          vi: "Bãi biển dài nhất Vũng Tàu, lý tưởng để bơi lội và tắm nắng. Dọc bờ có nhiều nhà hàng và quán cà phê.",
          ru: "Самый длинный пляж в Вунгтау, идеальный для плавания. Вдоль берега множество ресторанов и кафе.",
          ja: "ブンタウで最も長いビーチで、水泳や海水浴に最適です。ビーチ沿いにはレストランやカフェが並んでいます。"
        }
      },
      { 
        name: "붕따우 프론트 비치", 
        nameVi: "Front Beach", 
        mapUrl: "https://maps.app.goo.gl/Uz5gy2Tsg3kQm4QCA",
        image: "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400&h=300&fit=crop",
        description: {
          ko: "시내 중심에 위치한 편리한 해변입니다. 아침 조깅이나 저녁 산책을 즐기기 좋으며, 일몰 감상 명소로 유명합니다.",
          en: "Convenient beach located in the city center. Great for morning jogs or evening walks, famous for stunning sunset views.",
          zh: "位于市中心的便利海滩。适合晨跑或傍晚散步，以壮观的日落景色闻名。",
          vi: "Bãi biển tiện lợi nằm ở trung tâm thành phố. Tuyệt vời để chạy bộ buổi sáng hoặc đi dạo buổi tối, nổi tiếng với hoàng hôn đẹp.",
          ru: "Удобный пляж в центре города. Отлично подходит для утренних пробежек и знаменит закатами.",
          ja: "市内中心部にある便利なビーチ。朝のジョギングや夕方の散歩に最適で、夕日の名所として有名です。"
        }
      },
      { 
        name: "땀탕기념타워", 
        nameVi: "Tháp Tầm", 
        mapUrl: "https://maps.app.goo.gl/HHr2NF7upTr7Djhy9",
        image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop",
        description: {
          ko: "베트남 전쟁 당시 희생자들을 추모하는 기념탑입니다. 역사적 의미가 깊은 장소로 전망대에서 시내를 조망할 수 있습니다.",
          en: "Memorial tower honoring Vietnam War victims. A historically significant site with an observation deck overlooking the city.",
          zh: "纪念越南战争牺牲者的纪念塔。历史意义重大，观景台可俯瞰城市。",
          vi: "Tháp tưởng niệm các nạn nhân chiến tranh Việt Nam. Địa điểm lịch sử quan trọng với đài quan sát nhìn ra thành phố.",
          ru: "Мемориальная башня в честь жертв Вьетнамской войны. Исторически значимое место со смотровой площадкой.",
          ja: "ベトナム戦争の犠牲者を追悼する記念塔です。歴史的意義のある場所で、展望台から市内を一望できます。"
        }
      },
      { 
        name: "돼지언덕", 
        nameVi: "Đồi Con Heo", 
        mapUrl: "https://maps.app.goo.gl/Y8nMHFU7xAdXH7e48", 
        note: "largeVehicleNo",
        image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
        description: {
          ko: "현지인들에게 사랑받는 작은 언덕입니다. 일출과 일몰 감상 명소로, 사진 촬영하기 좋은 아름다운 경치를 자랑합니다.",
          en: "A small hill beloved by locals. Famous for sunrise and sunset views, offering beautiful scenery perfect for photography.",
          zh: "当地人喜爱的小山丘。以日出日落美景闻名，是拍照的绝佳地点。",
          vi: "Đồi nhỏ được người dân địa phương yêu thích. Nổi tiếng với cảnh bình minh và hoàng hôn, lý tưởng để chụp ảnh.",
          ru: "Небольшой холм, любимый местными жителями. Знаменит видами рассвета и заката, идеален для фотографий.",
          ja: "地元の人々に愛される小さな丘です。日の出と日没の名所で、写真撮影に最適な美しい景色が楽しめます。"
        }
      },
      { 
        name: "원숭이사원", 
        nameVi: "Chùa Khỉ Viba", 
        mapUrl: "https://maps.app.goo.gl/LmQ7U7VDgi9n8aGH8", 
        note: "largeVehicleNo",
        image: "https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?w=400&h=300&fit=crop",
        description: {
          ko: "야생 원숭이들이 서식하는 독특한 사원입니다. 원숭이들과 교감하며 자연과 함께하는 특별한 경험을 할 수 있습니다.",
          en: "Unique temple where wild monkeys reside. Enjoy a special experience interacting with monkeys in a natural setting.",
          zh: "野生猴子栖息的独特寺庙。在自然环境中与猴子互动，享受特别的体验。",
          vi: "Chùa độc đáo nơi khỉ hoang sinh sống. Trải nghiệm đặc biệt tương tác với khỉ trong môi trường tự nhiên.",
          ru: "Уникальный храм, где обитают дикие обезьяны. Особый опыт общения с обезьянами в естественной среде.",
          ja: "野生の猿が生息するユニークな寺院です。猿たちと触れ合い、自然の中で特別な体験ができます。"
        }
      },
      { 
        name: "붕따우 해산물 시장", 
        nameVi: "Seafood Market", 
        mapUrl: "https://maps.app.goo.gl/BLVTP1tarzKrXZN28",
        image: "https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=400&h=300&fit=crop",
        description: {
          ko: "신선한 해산물을 저렴하게 구입할 수 있는 전통 시장입니다. 현지인들의 생생한 일상을 체험하고 다양한 해산물을 맛볼 수 있습니다.",
          en: "Traditional market for fresh seafood at affordable prices. Experience local daily life and taste various seafood.",
          zh: "以实惠价格购买新鲜海鲜的传统市场。体验当地日常生活，品尝各种海鲜。",
          vi: "Chợ truyền thống bán hải sản tươi sống giá rẻ. Trải nghiệm cuộc sống địa phương và thưởng thức các loại hải sản.",
          ru: "Традиционный рынок со свежими морепродуктами по доступным ценам. Окунитесь в местную жизнь.",
          ja: "新鮮な海産物を手頃な価格で購入できる伝統的な市場です。地元の人々の日常を体験し、様々な海産物を味わえます。"
        }
      },
      { 
        name: "붕따우 시장", 
        nameVi: "Chợ Vũng Tàu 1985", 
        mapUrl: "https://maps.app.goo.gl/1Zpepi95K4garY268",
        image: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=400&h=300&fit=crop",
        description: {
          ko: "다양한 상품을 판매하는 현지 시장입니다. 기념품, 의류, 음식 등을 구경하며 베트남 시장 문화를 체험할 수 있습니다.",
          en: "Local market selling various goods. Explore souvenirs, clothing, food, and experience Vietnamese market culture.",
          zh: "出售各种商品的当地市场。探索纪念品、服装、美食，体验越南市场文化。",
          vi: "Chợ địa phương bán đa dạng hàng hóa. Khám phá quà lưu niệm, quần áo, thức ăn và trải nghiệm văn hóa chợ Việt Nam.",
          ru: "Местный рынок с различными товарами. Сувениры, одежда, еда - окунитесь в культуру вьетнамских рынков.",
          ja: "様々な商品を販売する地元の市場です。お土産、衣類、食べ物などを見て回り、ベトナムの市場文化を体験できます。"
        }
      },
    ]
  },
  localFood: {
    id: "localFood",
    icon: Utensils,
    gradient: "from-orange-500 to-red-500",
    places: [
      { name: "꼬바붕따우 1호점 (반콧,반쎄오)", nameVi: "Cô Ba Restaurant", phone: "0254 3526 165", mapUrl: "https://maps.app.goo.gl/LvFosNMLSi1LSRvz6", note: "crowded" },
      { name: "꼬바붕따우 2호점 (반콧,반쎄오)", nameVi: "Cô Ba Restaurant 2", mapUrl: "https://maps.app.goo.gl/ftQz4Z437ZJZn5g68", note: "spacious" },
      { name: "해산물 고급 식당", nameVi: "Gành Hào Seafood Restaurant", phone: "0254 3550 909", mapUrl: "https://maps.app.goo.gl/AVh5Qq9HMRNpbjzBA" },
      { name: "해산물 고급 식당 2호점", nameVi: "Gành Hào 2", mapUrl: "https://maps.app.goo.gl/JLXdK6XZC5SqHntC7" },
      { name: "해산물 야시장 로컬식당", nameVi: "Hải Sản Cô Thy 2", mapUrl: "https://maps.app.goo.gl/rWUGn1MYyzGH7Xg78" },
      { name: "88 Food Garden (레스토랑)", nameVi: "88 Food Garden", mapUrl: "https://maps.app.goo.gl/iwaEfxbuxutM9y2t9" },
      { name: "Panda BBQ (현지 바베큐)", address: "150 Hạ Long, Phường 2, Vũng Tàu", mapUrl: "https://maps.app.goo.gl/9ruaWyxg9txKrJ6eA" },
      { name: "해산물 식당", nameVi: "Ốc Tự Nhiên 3", address: "20 Trần Phú, Phường 1, Vũng Tàu", mapUrl: "https://maps.app.goo.gl/37gvjz6hhkzP6ip2A" },
      { name: "베트남 가정식", nameVi: "Cơm Niêu Quê Nhà", phone: "090 645 69 05", mapUrl: "https://maps.app.goo.gl/Qcx6sfwFh7jrm9HU9" },
      { name: "해산물 쌀국수", nameVi: "Old Man Cali - Hủ tiểu Mực", mapUrl: "https://maps.app.goo.gl/hBzPccq4d6E2ufj66", recommended: true },
      { name: "소고기 쌀국수 (에어컨)", mapUrl: "https://maps.app.goo.gl/9hYEyyeQ1HFFCqY7A" },
      { name: "로컬 식당 (껌땀)", nameVi: "Quán Cơm Tấm Lọ Lem", phone: "0254 3521 212", mapUrl: "https://maps.app.goo.gl/M5g8ya358jC1YNYh7" },
      { name: "오리국수 (오후 3시반 오픈)", mapUrl: "https://maps.app.goo.gl/HrorS5czrq91WqPUA" },
      { name: "토끼구이", mapUrl: "https://maps.app.goo.gl/Cxpum3ne3fnLiBDz6" },
    ]
  },
  koreanFood: {
    id: "koreanFood",
    icon: Utensils,
    gradient: "from-rose-500 to-pink-600",
    places: [
      { name: "이안 돌판 삼겹살", address: "300A Phan Chu Trinh, Phường 2, Vũng Tàu", mapUrl: "https://maps.app.goo.gl/8FXU2u8Cn2AufLGz9", recommended: true },
      { name: "가보정", address: "B12-1/10 Khu Trung Tâm Chí Linh, Phường Nguyễn An Ninh", mapUrl: "https://maps.app.goo.gl/Mr1MXkLFMA5xfBjB6" },
      { name: "비원식당", address: "662A Nguyễn An Ninh, Phường 8, Vũng Tàu", mapUrl: "https://maps.app.goo.gl/UrmsYuMjWGwMhAYq6" },
      { name: "뚱보집 (포차)", address: "151 Thùy Vân, Phường Thắng Tam, Vũng Tàu", mapUrl: "https://maps.app.goo.gl/EXSWLjy4mdcwZkt36" },
    ]
  },
  buffet: {
    id: "buffet",
    icon: Utensils,
    gradient: "from-amber-500 to-orange-600",
    places: [
      { name: "GoGi House", phone: "0254 7300 339", mapUrl: "https://maps.app.goo.gl/Ra6gm28jZwnmWtWx9" },
      { name: "간하오 스시, 샤브샤브 뷔페", mapUrl: "https://maps.app.goo.gl/rrg1m5M57fpwKa5g6" },
      { name: "해산물 뷔페 (저녁 오픈)", note: "간하오 1층 안쪽", mapUrl: "https://maps.app.goo.gl/1xGUZjTk1jfzbDhd9" },
    ]
  },
  chineseFood: {
    id: "chineseFood",
    icon: Utensils,
    gradient: "from-red-600 to-red-700",
    places: [
      { name: "린차이나", address: "422/7 Lê Hồng Phong, Phường 8, Vũng Tàu", mapUrl: "https://maps.app.goo.gl/XhJsqpTm5pjWhN6LA" },
    ]
  },
  exchange: {
    id: "exchange",
    icon: Building2,
    gradient: "from-emerald-500 to-teal-600",
    places: [
      { name: "환전소 (금은방)", nameVi: "Thong Phuong", mapUrl: "https://maps.app.goo.gl/NnvFeTaRFJ4mLMRC6" },
    ]
  },
  coffee: {
    id: "coffee",
    icon: Coffee,
    gradient: "from-amber-700 to-yellow-800",
    places: [
      { name: "Coffee Suối Bên Biển", mapUrl: "https://maps.app.goo.gl/Sd7JGZiZ1n6TrvmJ7" },
      { name: "KATINAT 커피", mapUrl: "https://maps.app.goo.gl/ptgkTbJnVzwUzYPGA" },
      { name: "Snow Cafe", phone: "0896 436 828", mapUrl: "https://maps.app.goo.gl/c3JzVQgq9XTXe9mQA" },
      { name: "Soho Coffee", phone: "094 641 40 31", mapUrl: "https://maps.app.goo.gl/fK1SdiHaNH9SoVeZ6" },
      { name: "Highlands Coffee", mapUrl: "https://maps.app.goo.gl/kuiVrXHGih2vkQQa9" },
      { name: "Sea & Sun 2", phone: "0822 056 419", mapUrl: "https://maps.app.goo.gl/VKm9bZifEX9Lob477" },
      { name: "Mi Amor Beach", mapUrl: "https://maps.app.goo.gl/o12qFzH1ggCwee5Y7" },
    ]
  },
  services: {
    id: "services",
    icon: Scissors,
    gradient: "from-purple-500 to-violet-600",
    places: [
      { name: "Rean 마사지", mapUrl: "https://maps.app.goo.gl/zGjF1ZoN5TJY5jdu8" },
      { name: "그랜드 마사지", mapUrl: "https://maps.app.goo.gl/4z3hEL8RF5acvtod7" },
      { name: "김마싸 (MASSAGE 12C2)", phone: "0779 090 882", mapUrl: "https://maps.app.goo.gl/WA7Wt63HWcsi5dVQA" },
      { name: "이발소 Salon Kimha", address: "26 Đinh Tiên Hoàng, Phường 2, Vũng Tàu", mapUrl: "https://maps.app.goo.gl/q2HpipbVVMpvMHYj7" },
      { name: "Bi Roen 현지 고급 이발소", address: "518 Thống Nhất Mới, Phường 8, Vũng Tàu", mapUrl: "https://maps.app.goo.gl/yCMh6jYoLXLq8fgn7", recommended: true },
    ]
  }
};

const categoryLabels: Record<string, Record<string, string>> = {
  attractions: { ko: "관광명소", en: "Attractions", zh: "景点", vi: "Địa điểm du lịch", ru: "Достопримечательности", ja: "観光スポット" },
  localFood: { ko: "현지 음식점", en: "Local Restaurants", zh: "当地餐厅", vi: "Nhà hàng địa phương", ru: "Местные рестораны", ja: "ローカルレストラン" },
  koreanFood: { ko: "한식", en: "Korean Food", zh: "韩国料理", vi: "Món Hàn Quốc", ru: "Корейская еда", ja: "韓国料理" },
  buffet: { ko: "고기뷔페", en: "Buffet", zh: "自助餐", vi: "Buffet", ru: "Буфет", ja: "ビュッフェ" },
  chineseFood: { ko: "중식", en: "Chinese Food", zh: "中餐", vi: "Món Trung Quốc", ru: "Китайская еда", ja: "中華料理" },
  exchange: { ko: "환전소", en: "Currency Exchange", zh: "货币兑换", vi: "Đổi tiền", ru: "Обмен валюты", ja: "両替所" },
  coffee: { ko: "커피숍", en: "Coffee Shops", zh: "咖啡店", vi: "Quán cà phê", ru: "Кофейни", ja: "カフェ" },
  services: { ko: "마사지/이발소", en: "Massage & Barber", zh: "按摩/理发", vi: "Massage/Cắt tóc", ru: "Массаж/Парикмахерская", ja: "マッサージ/理髪店" }
};

const noteLabels: Record<string, Record<string, string>> = {
  largeVehicleNo: { ko: "대형차량 진입불가", en: "No large vehicles", zh: "大型车辆禁入", vi: "Xe lớn không vào được", ru: "Большие авто запрещены", ja: "大型車両進入禁止" },
  crowded: { ko: "붐빔", en: "Often crowded", zh: "经常拥挤", vi: "Thường đông", ru: "Часто многолюдно", ja: "混雑あり" },
  spacious: { ko: "쾌적", en: "Spacious", zh: "宽敞", vi: "Thoáng mát", ru: "Просторно", ja: "快適" }
};

function PlaceCard({ place, language }: { place: Place; language: string }) {
  const [showMap, setShowMap] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const noteText = place.note ? (noteLabels[place.note]?.[language] || place.note) : null;
  const descriptionText = place.description?.[language] || place.description?.ko || null;

  const embedUrl = place.mapUrl.includes("goo.gl") 
    ? `https://www.google.com/maps?q=${encodeURIComponent(place.nameVi || place.name)},Vung Tau&output=embed`
    : place.mapUrl.replace("/maps/", "/maps/embed?");

  return (
    <Card 
      className={`overflow-hidden hover:shadow-lg transition-all cursor-pointer ${showDetails ? 'ring-2 ring-primary/30' : ''}`}
      onClick={() => place.description && setShowDetails(!showDetails)}
      data-testid={`card-place-${place.name.replace(/\s/g, "-")}`}
    >
      <CardContent className="p-3">
        <div className="flex gap-3">
          {place.image && (
            <div className="flex-shrink-0">
              <img 
                src={place.image} 
                alt={place.name}
                className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg"
                loading="lazy"
              />
            </div>
          )}
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-foreground truncate">{place.name}</h3>
                {place.nameVi && <p className="text-xs text-muted-foreground truncate">{place.nameVi}</p>}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {place.recommended && (
                  <Badge variant="default" className="bg-rose-500 text-[10px] px-1.5">
                    {language === "ko" ? "추천" : "Best"}
                  </Badge>
                )}
                {place.description && (
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showDetails ? 'rotate-180' : ''}`} />
                )}
              </div>
            </div>

            {noteText && (
              <div className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded w-fit">
                <AlertTriangle className="w-3 h-3" />
                {noteText}
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              {place.phone && (
                <a 
                  href={`tel:${place.phone.replace(/\s/g, "")}`} 
                  className="flex items-center gap-1 text-[11px] text-blue-600 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Phone className="w-3 h-3" />
                  {place.phone}
                </a>
              )}
              <a 
                href={place.mapUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-1 text-[11px] text-emerald-600 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3 h-3" />
                Maps
              </a>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showDetails && descriptionText && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {descriptionText}
                </p>

                {place.address && (
                  <p className="text-[11px] text-muted-foreground flex items-start gap-1 mt-2">
                    <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{place.address}</span>
                  </p>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3 text-xs h-8"
                  onClick={(e) => { e.stopPropagation(); setShowMap(!showMap); }}
                  data-testid={`button-toggle-map-${place.name.replace(/\s/g, "-")}`}
                >
                  {showMap ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
                  {showMap ? (language === "ko" ? "지도 닫기" : "Hide Map") : (language === "ko" ? "지도 보기" : "View Map")}
                </Button>

                <AnimatePresence>
                  {showMap && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 200, opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden rounded-lg mt-2"
                    >
                      <iframe
                        src={embedUrl}
                        width="100%"
                        height="200"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        className="rounded-lg"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!place.description && (
          <div className="mt-2">
            {place.address && (
              <p className="text-[11px] text-muted-foreground flex items-start gap-1 mb-2">
                <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-2">{place.address}</span>
              </p>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs h-8"
              onClick={(e) => { e.stopPropagation(); setShowMap(!showMap); }}
              data-testid={`button-toggle-map-simple-${place.name.replace(/\s/g, "-")}`}
            >
              {showMap ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
              {showMap ? (language === "ko" ? "지도 닫기" : "Hide Map") : (language === "ko" ? "지도 보기" : "View Map")}
            </Button>

            <AnimatePresence>
              {showMap && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 200, opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden rounded-lg mt-2"
                >
                  <iframe
                    src={embedUrl}
                    width="100%"
                    height="200"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="rounded-lg"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PlacesGuide() {
  const { language, t } = useLanguage();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["attractions", "localFood"]));
  const [visitorCount, setVisitorCount] = useState<number>(0);

  useEffect(() => {
    apiRequest("POST", "/api/visitor-count/increment")
      .then(res => res.json())
      .then(data => setVisitorCount(data.count))
      .catch(() => {});
  }, []);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const pageTitle: Record<string, string> = {
    ko: "붕따우 관광/맛집 가이드",
    en: "Vung Tau Travel Guide",
    zh: "头顿旅游指南",
    vi: "Hướng dẫn du lịch Vũng Tàu",
    ru: "Путеводитель по Вунгтау",
    ja: "ブンタウ観光ガイド"
  };

  const navLabels = {
    calculator: { ko: "견적 계산기", en: "Quote Calculator", zh: "报价计算器", vi: "Báo giá", ru: "Калькулятор", ja: "見積計算機" },
    guide: { ko: "관광/맛집", en: "Travel Guide", zh: "旅游指南", vi: "Du lịch", ru: "Гид", ja: "ガイド" }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      <div className="relative bg-white border-b border-border/40">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="container mx-auto px-4 py-8 relative z-10">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl flex items-center gap-4">
            <img src={logoImg} alt="붕따우 도깨비" className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-md" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-primary">{pageTitle[language] || pageTitle.ko}</h1>
              <p className="text-sm text-muted-foreground">
                {language === "ko" ? "붕따우 도깨비가 추천하는 관광명소와 맛집" : "Recommended spots by Vung Tau Dokkaebi"}
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 py-3">
            <Link href="/">
              <Button variant="outline" className="flex items-center gap-2" data-testid="nav-calculator">
                <Calculator className="w-4 h-4" />
                {navLabels.calculator[language as keyof typeof navLabels.calculator] || navLabels.calculator.ko}
              </Button>
            </Link>
            <Link href="/guide">
              <Button variant="default" className="flex items-center gap-2" data-testid="nav-guide">
                <MapPin className="w-4 h-4" />
                {navLabels.guide[language as keyof typeof navLabels.guide] || navLabels.guide.ko}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl py-8">

        <div className="space-y-4">
          {Object.entries(placesData).map(([key, category]) => {
            const Icon = category.icon;
            const isExpanded = expandedCategories.has(key);
            const label = categoryLabels[key]?.[language] || categoryLabels[key]?.ko || key;

            return (
              <Card key={key} className="overflow-hidden">
                <CardHeader
                  className={`cursor-pointer bg-gradient-to-r ${category.gradient} text-white py-3 px-4`}
                  onClick={() => toggleCategory(key)}
                  data-testid={`category-header-${key}`}
                >
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5" />
                      <span>{label}</span>
                      <Badge variant="secondary" className="bg-white/20 text-white text-[10px]">
                        {category.places.length}
                      </Badge>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </CardTitle>
                </CardHeader>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {category.places.map((place, idx) => (
                            <PlaceCard key={idx} place={place} language={language} />
                          ))}
                        </div>
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>

        <div className="h-20" />
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-gradient-to-r from-yellow-400 to-amber-500 border-t shadow-lg">
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-black">
                {language === "ko" ? "예약 문의" : 
                 language === "en" ? "Reservation" :
                 language === "zh" ? "预约" :
                 language === "vi" ? "Đặt chỗ" :
                 language === "ru" ? "Бронь" :
                 language === "ja" ? "予約" : "예약 문의"}
              </span>
              <a
                href="http://pf.kakao.com/_TuxoxfG"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-kakao-reservation"
              >
                <Button size="sm" className="bg-black hover:bg-black/90 text-yellow-400 font-bold gap-1.5">
                  <MessageCircle className="w-4 h-4" />
                  {language === "ko" ? "카카오톡 문의" : 
                   language === "en" ? "KakaoTalk" :
                   language === "zh" ? "KakaoTalk" :
                   language === "vi" ? "KakaoTalk" :
                   language === "ru" ? "KakaoTalk" :
                   language === "ja" ? "カカオトーク" : "카카오톡 문의"}
                </Button>
              </a>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 text-center py-1">
          <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <Eye className="w-3 h-3" />
            {language === "ko" ? `방문자 ${visitorCount.toLocaleString()}명` : 
             language === "en" ? `${visitorCount.toLocaleString()} visitors` :
             language === "zh" ? `访客 ${visitorCount.toLocaleString()}` :
             language === "vi" ? `${visitorCount.toLocaleString()} lượt xem` :
             language === "ru" ? `${visitorCount.toLocaleString()} посетителей` :
             language === "ja" ? `訪問者 ${visitorCount.toLocaleString()}人` : `방문자 ${visitorCount.toLocaleString()}명`}
          </span>
        </div>
      </div>
    </div>
  );
}
