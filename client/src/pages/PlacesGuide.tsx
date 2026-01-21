import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/i18n";
import { MapPin, Phone, ExternalLink, Utensils, Coffee, Scissors, Building2, Camera, ChevronDown, ChevronUp, AlertTriangle, Calculator, MessageCircle, Eye, Wallet, Sparkles, Music, FileText, ShoppingBag, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logoImg from "@assets/BackgroundEraser_20240323_103507859_1768275315346.png";
import jesusStatueImg from "@assets/Screenshot_20260115_113154_Gallery_1768451530261.jpg";
import lighthouseImg from "@assets/736414b25966415e9006dd674ec2aecf_1768452191679.jpeg";
import warMuseumImg from "@assets/20230318＿130556_1768452191689.jpg";
import whitePalaceImg from "@assets/154eaed7-b483-43eb-983f-b52566331719_(1)_1768452191696.jpeg";
import amusementParkImg from "@assets/붕따우호메이파크입장권_1768452191701.jpg";
import buddhistTempleImg from "@assets/static-images.vnncdn.net-vps_images_publish-000001-000003-2025_1768452191705.jpg";
import backBeachImg from "@assets/Things-to-do-in-Vung-Tau-2_1768452191711.jpg";
import frontBeachImg from "@assets/Vung-Tau-3_1768452191715.jpg";
import tamTangTowerImg from "@assets/2442f46d1c7d42b49c86ad80e4bec041_1768452191724.jpeg";
import pigHillImg from "@assets/12-doi-con-heo-vung-tau_1768452191730.jpg";
import monkeyTempleImg from "@assets/z40559387093017e7b56d8300d82363ef9c08685c1f765-167436802698717_1768452191734.jpg";
import seafoodMarketImg from "@assets/cho-dem-vung-tau-2_1768452191738.jpg";
import vungTauMarketImg from "@assets/c3d3213f-cho-vung-tau-2_1768452191743.jpg";
import biRoenImg from "@assets/Screenshot_20260115_210807_Maps_1768486311141.jpg";
import reenMassageImg from "@assets/Screenshot_20260115_210912_Maps_1768486311161.jpg";
import grandMassageImg from "@assets/Screenshot_20260115_210934_Maps_1768486311164.jpg";
import daySpaImg from "@assets/Screenshot_20260115_210959_Maps_1768486311167.jpg";
import ianBbqImg from "@assets/Screenshot_20260115_211048_Maps_1768486311169.jpg";
import club88Img from "@assets/Screenshot_20260116_184507_Maps_1768564285854.jpg";
import revoClubImg from "@assets/Screenshot_20260116_184614_Maps_1768564285861.jpg";
import loxClubImg from "@assets/Screenshot_20260116_185045_Maps_1768564285866.jpg";
import usBarImg from "@assets/Screenshot_20260116_184659_Maps_1768564285873.jpg";
import peaceAndLoveImg from "@assets/20260117_220334_1768668092372.jpg";
import texasBbqImg from "@assets/Screenshot_20260121_234910_Maps_1769014231476.jpg";
import cobaImg from "@assets/Screenshot_20260122_000550_Maps_1769015581771.jpg";
import coba2Img from "@assets/Screenshot_20260122_000613_Maps_1769015581776.jpg";
import ganhHaoImg from "@assets/Screenshot_20260122_000631_Maps_1769015581781.jpg";
import ganhHao2Img from "@assets/Screenshot_20260122_000656_Maps_1769015581784.jpg";
import coThy2Img from "@assets/Screenshot_20260122_000711_Maps_1769015581789.jpg";
import bunChaImg from "@assets/Screenshot_20260122_000727_Maps_1769015581794.jpg";
import foodGarden88Img from "@assets/Screenshot_20260122_000755_Maps_1769015581799.jpg";
import pandaBbqImg from "@assets/Screenshot_20260122_000818_Maps_1769015581803.jpg";
import ocTuNhien3Img from "@assets/Screenshot_20260122_000835_Maps_1769015581806.jpg";
import comNieuImg from "@assets/Screenshot_20260122_000856_Maps_1769015581809.jpg";
import huTieuMucImg from "@assets/Screenshot_20260122_000535_Maps_1769015581719.jpg";
import phoBoImg from "@assets/Screenshot_20260122_000924_Maps_1769015581814.jpg";
import comTamImg from "@assets/Screenshot_20260122_000952_Maps_1769015581817.jpg";
import miVitImg from "@assets/Screenshot_20260122_001013_Maps_1769015581823.jpg";
import thoNuongImg from "@assets/Screenshot_20260122_001100_Maps_1769015581829.jpg";
import coffeeSuoiImg from "@assets/Screenshot_20260122_002226_Maps_1769016389675.jpg";
import katinatImg from "@assets/Screenshot_20260122_002241_Maps_1769016389683.jpg";
import sohoCoffeeImg from "@assets/Screenshot_20260122_002254_Maps_1769016389688.jpg";
import highlandsCoffeeImg from "@assets/Screenshot_20260122_002412_Maps_1769016389696.jpg";
import seaSunImg from "@assets/Screenshot_20260122_002507_Maps_1769016389702.jpg";
import miAmorImg from "@assets/Screenshot_20260122_002546_Maps_1769016389710.jpg";

interface Place {
  name: string;
  nameVi?: string;
  address?: string;
  phone?: string;
  mapUrl: string;
  note?: string;
  recommended?: boolean;
  imageUrl?: string;
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
        imageUrl: jesusStatueImg,
        description: {
          ko: "높이 32m의 거대한 예수상. 붕따우의 대표적인 랜드마크로 811개의 계단을 올라가면 아름다운 해안 전경을 감상할 수 있습니다.",
          en: "A 32m tall statue of Jesus. Iconic landmark of Vung Tau with 811 steps leading to stunning coastal views.",
          zh: "32米高的耶稣像。头顿的标志性地标，攀登811级台阶可欣赏美丽的海岸景观。",
          vi: "Tượng Chúa cao 32m. Biểu tượng của Vũng Tàu với 811 bậc thang dẫn đến tầm nhìn bờ biển tuyệt đẹp.",
          ru: "32-метровая статуя Иисуса. Знаковая достопримечательность с 811 ступенями и потрясающим видом на побережье.",
          ja: "高さ32mの巨大なキリスト像。811段の階段を上ると美しい海岸の景色が楽しめます。"
        }
      },
      { 
        name: "붕따우 등대", 
        nameVi: "Hải Đăng Vũng Tàu", 
        mapUrl: "https://maps.app.goo.gl/HMJbSLCR3bzZxsxy8", 
        note: "largeVehicleNo",
        imageUrl: lighthouseImg,
        description: {
          ko: "1910년 프랑스 식민지 시대에 건설된 역사적인 등대. 도시와 바다의 파노라마 전망을 제공합니다.",
          en: "Historic lighthouse built in 1910 during French colonial era. Offers panoramic views of the city and sea.",
          zh: "1910年法国殖民时期建造的历史灯塔。可欣赏城市和大海的全景。",
          vi: "Hải đăng lịch sử xây năm 1910 thời Pháp thuộc. Tầm nhìn toàn cảnh thành phố và biển.",
          ru: "Исторический маяк 1910 года постройки. Панорамный вид на город и море.",
          ja: "1910年フランス植民地時代に建設された歴史的な灯台。街と海のパノラマビュー。"
        }
      },
      { 
        name: "전쟁기념관", 
        nameVi: "Bà Rịa–Vũng Tàu Provincial museum", 
        phone: "0254 3852 421", 
        mapUrl: "https://maps.app.goo.gl/YiF3HpgZvXtKTfMCA",
        imageUrl: warMuseumImg,
        description: {
          ko: "베트남 전쟁과 지역 역사를 보여주는 박물관. 전쟁 유물과 역사적 사진들이 전시되어 있습니다.",
          en: "Museum showcasing Vietnam War and local history with war artifacts and historical photographs.",
          zh: "展示越战和当地历史的博物馆，有战争文物和历史照片。",
          vi: "Bảo tàng trưng bày lịch sử chiến tranh Việt Nam và địa phương với hiện vật và ảnh lịch sử.",
          ru: "Музей истории Вьетнамской войны с военными артефактами и историческими фотографиями.",
          ja: "ベトナム戦争と地域の歴史を展示する博物館。戦争遺物と歴史的写真を展示。"
        }
      },
      { 
        name: "화이트 펠리스(띠우 별장)", 
        nameVi: "Bạch Dinh (White Palace)", 
        mapUrl: "https://maps.app.goo.gl/LDkeQHy1Watfec51A",
        imageUrl: whitePalaceImg,
        description: {
          ko: "1898년 프랑스 총독의 여름 별장으로 지어진 아름다운 백색 궁전. 열대 정원과 바다 전망이 인상적입니다.",
          en: "Beautiful white palace built in 1898 as French Governor's summer residence. Impressive tropical gardens and sea views.",
          zh: "1898年作为法国总督夏季别墅建造的白色宫殿。热带花园和海景令人印象深刻。",
          vi: "Dinh thự trắng đẹp xây năm 1898 làm nhà nghỉ mùa hè của Toàn quyền Pháp. Vườn nhiệt đới và view biển ấn tượng.",
          ru: "Белый дворец 1898 года - летняя резиденция французского губернатора. Тропические сады и вид на море.",
          ja: "1898年フランス総督の夏の別荘として建てられた白い宮殿。熱帯庭園と海の景色が印象的。"
        }
      },
      { 
        name: "놀이동산", 
        nameVi: "Ho May Amusement Park", 
        mapUrl: "https://maps.app.goo.gl/vM6tXvAXi4tTNhUV6",
        imageUrl: amusementParkImg,
        description: {
          ko: "케이블카로 올라가는 언덕 위 놀이공원. 워터파크, 동물원, 놀이기구를 즐길 수 있습니다.",
          en: "Hilltop amusement park accessible by cable car. Features water park, zoo, and rides.",
          zh: "乘缆车上山的游乐园。有水上乐园、动物园和游乐设施。",
          vi: "Công viên giải trí trên đồi đi bằng cáp treo. Có công viên nước, sở thú và trò chơi.",
          ru: "Парк развлечений на холме с канатной дорогой. Аквапарк, зоопарк и аттракционы.",
          ja: "ケーブルカーで行く丘の上の遊園地。ウォーターパーク、動物園、乗り物があります。"
        }
      },
      { 
        name: "불교사찰", 
        nameVi: "Chơn Không Monastery", 
        mapUrl: "https://maps.app.goo.gl/THctAg3uEvx9q9ZLA", 
        note: "largeVehicleNo",
        imageUrl: buddhistTempleImg,
        description: {
          ko: "산 중턱에 위치한 고요한 불교 사찰. 명상과 평화로운 분위기를 경험할 수 있습니다.",
          en: "Serene Buddhist monastery on the mountainside. Experience meditation and peaceful atmosphere.",
          zh: "位于山腰的宁静佛教寺院。可体验冥想和平静的氛围。",
          vi: "Chùa Phật giáo yên tĩnh trên sườn núi. Trải nghiệm thiền định và không gian thanh bình.",
          ru: "Тихий буддийский монастырь на склоне горы. Медитация и умиротворяющая атмосфера.",
          ja: "山腹にある静かな仏教寺院。瞑想と平和な雰囲気を体験できます。"
        }
      },
      { 
        name: "붕따우 백비치", 
        nameVi: "Bãi Sau", 
        mapUrl: "https://maps.app.goo.gl/UCARs7msTkaUr2HW6",
        imageUrl: backBeachImg,
        description: {
          ko: "붕따우에서 가장 긴 해변. 수영과 해양 스포츠를 즐기기에 좋으며 해변가 레스토랑이 많습니다.",
          en: "Longest beach in Vung Tau. Great for swimming, water sports, with many beachfront restaurants.",
          zh: "头顿最长的海滩。适合游泳和水上运动，有很多海边餐厅。",
          vi: "Bãi biển dài nhất Vũng Tàu. Tuyệt vời để bơi, thể thao nước, có nhiều nhà hàng ven biển.",
          ru: "Самый длинный пляж Вунгтау. Отлично для плавания и водных видов спорта, много ресторанов.",
          ja: "ブンタウで最も長いビーチ。水泳やマリンスポーツに最適。ビーチフロントレストランも多数。"
        }
      },
      { 
        name: "붕따우 프론트 비치", 
        nameVi: "Front Beach", 
        mapUrl: "https://maps.app.goo.gl/Uz5gy2Tsg3kQm4QCA",
        imageUrl: frontBeachImg,
        description: {
          ko: "도심에서 가까운 해변으로 일몰 감상에 최적. 저녁에는 해변 산책로가 활기차게 변합니다.",
          en: "Beach close to downtown, perfect for sunset viewing. The promenade comes alive in the evening.",
          zh: "靠近市中心的海滩，适合看日落。傍晚海滨步道非常热闹。",
          vi: "Bãi biển gần trung tâm, lý tưởng xem hoàng hôn. Đường dạo bờ biển sôi động vào buổi tối.",
          ru: "Пляж рядом с центром, идеален для закатов. Вечером набережная оживает.",
          ja: "ダウンタウン近くのビーチで夕日観賞に最適。夜は遊歩道が賑やかに。"
        }
      },
      { 
        name: "땀탕기념타워", 
        nameVi: "Tháp Tầm", 
        mapUrl: "https://maps.app.goo.gl/HHr2NF7upTr7Djhy9",
        imageUrl: tamTangTowerImg,
        description: {
          ko: "베트남 해군의 역사적인 기념탑. 전쟁 영웅들을 기리는 곳으로 바다가 한눈에 보입니다.",
          en: "Historic naval memorial tower honoring war heroes with panoramic sea views.",
          zh: "纪念战争英雄的海军历史纪念塔，可俯瞰大海。",
          vi: "Tháp tưởng niệm hải quân lịch sử vinh danh các anh hùng chiến tranh với view biển toàn cảnh.",
          ru: "Историческая мемориальная башня в честь героев войны с панорамным видом на море.",
          ja: "戦争の英雄を称える歴史的な海軍記念塔。パノラマの海の景色が楽しめます。"
        }
      },
      { 
        name: "돼지언덕", 
        nameVi: "Đồi Con Heo", 
        mapUrl: "https://maps.app.goo.gl/Y8nMHFU7xAdXH7e48", 
        note: "largeVehicleNo",
        imageUrl: pigHillImg,
        description: {
          ko: "돼지 모양을 닮은 언덕으로 포토존이 많습니다. 일몰 때 방문하면 아름다운 사진을 찍을 수 있습니다.",
          en: "Hill resembling a pig shape with many photo spots. Beautiful sunset photography location.",
          zh: "像猪形状的山丘，有很多拍照点。日落时拍照非常美。",
          vi: "Đồi giống hình con heo với nhiều điểm chụp ảnh. Địa điểm chụp hoàng hôn tuyệt đẹp.",
          ru: "Холм в форме свиньи с множеством фотозон. Прекрасное место для фото на закате.",
          ja: "豚の形をした丘でフォトスポットが多い。夕日の時間は特に美しい写真が撮れます。"
        }
      },
      { 
        name: "원숭이사원", 
        nameVi: "Chùa Khỉ Viba", 
        mapUrl: "https://maps.app.goo.gl/LmQ7U7VDgi9n8aGH8", 
        note: "largeVehicleNo",
        imageUrl: monkeyTempleImg,
        description: {
          ko: "야생 원숭이들이 서식하는 사원. 원숭이들과 교감하며 사진을 찍을 수 있습니다 (소지품 주의).",
          en: "Temple with wild monkeys. Interact and take photos with monkeys (watch your belongings).",
          zh: "有野生猴子的寺庙。可与猴子互动拍照（注意随身物品）。",
          vi: "Chùa có khỉ hoang dã. Tương tác và chụp ảnh với khỉ (chú ý đồ đạc).",
          ru: "Храм с дикими обезьянами. Можно фотографироваться с обезьянами (берегите вещи).",
          ja: "野生の猿がいる寺院。猿と交流して写真が撮れます（持ち物に注意）。"
        }
      },
      { 
        name: "붕따우 해산물 시장", 
        nameVi: "Seafood Market", 
        mapUrl: "https://maps.app.goo.gl/BLVTP1tarzKrXZN28",
        imageUrl: seafoodMarketImg,
        description: {
          ko: "신선한 해산물을 저렴하게 구입할 수 있는 재래시장. 현지인들의 생활을 엿볼 수 있습니다.",
          en: "Traditional market for fresh, affordable seafood. Experience local life and culture.",
          zh: "可以买到便宜新鲜海鲜的传统市场。可以体验当地人的生活。",
          vi: "Chợ truyền thống bán hải sản tươi giá rẻ. Trải nghiệm cuộc sống và văn hóa địa phương.",
          ru: "Традиционный рынок свежих морепродуктов по доступным ценам. Местная жизнь и культура.",
          ja: "新鮮な海産物を安く買える伝統市場。地元の生活を垣間見ることができます。"
        }
      },
      { 
        name: "붕따우 시장", 
        nameVi: "Chợ Vũng Tàu 1985", 
        mapUrl: "https://maps.app.goo.gl/1Zpepi95K4garY268",
        imageUrl: vungTauMarketImg,
        description: {
          ko: "1985년부터 운영된 붕따우 중심부의 전통 시장. 현지 음식, 과일, 기념품을 구입할 수 있습니다.",
          en: "Traditional market in downtown Vung Tau since 1985. Local food, fruits, and souvenirs available.",
          zh: "1985年起运营的头顿中心传统市场。可购买当地食品、水果和纪念品。",
          vi: "Chợ truyền thống ở trung tâm Vũng Tàu từ 1985. Có đồ ăn địa phương, trái cây và quà lưu niệm.",
          ru: "Традиционный рынок в центре с 1985 года. Местная еда, фрукты и сувениры.",
          ja: "1985年から続くブンタウ中心部の伝統市場。地元の食べ物、果物、お土産が買えます。"
        }
      },
    ]
  },
  localFood: {
    id: "localFood",
    icon: Utensils,
    gradient: "from-orange-500 to-red-500",
    places: [
      { 
        name: "꼬바붕따우 1호점 (반콧,반쎄오)", 
        nameVi: "Cô Ba Restaurant", 
        phone: "0254 3526 165", 
        mapUrl: "https://maps.app.goo.gl/LvFosNMLSi1LSRvz6", 
        note: "crowded",
        imageUrl: cobaImg,
        description: {
          ko: "붕따우에서 가장 유명한 반콧, 반쎄오 전문점. 현지인과 관광객 모두에게 사랑받는 맛집입니다.",
          en: "Most famous Bánh Khọt and Bánh Xèo restaurant in Vung Tau. Loved by locals and tourists alike.",
          zh: "头顿最著名的越南煎饼专卖店。深受当地人和游客喜爱。",
          vi: "Quán Bánh Khọt và Bánh Xèo nổi tiếng nhất Vũng Tàu. Được cả người địa phương và du khách yêu thích.",
          ru: "Самый известный ресторан Bánh Khọt и Bánh Xèo в Вунгтау. Любим местными и туристами.",
          ja: "ブンタウで最も有名なバインコット・バインセオ専門店。地元民と観光客に愛されています。"
        }
      },
      { 
        name: "꼬바붕따우 2호점 (반콧,반쎄오)", 
        nameVi: "Cô Ba Restaurant 2", 
        mapUrl: "https://maps.app.goo.gl/ftQz4Z437ZJZn5g68", 
        note: "spacious", 
        recommended: true,
        imageUrl: coba2Img,
        description: {
          ko: "꼬바 2호점은 더 넓고 쾌적한 공간에서 동일한 맛을 즐길 수 있습니다. 단체 손님에게 추천.",
          en: "Cô Ba 2nd branch offers the same great taste in a more spacious setting. Recommended for groups.",
          zh: "Cô Ba 2号店在更宽敞舒适的空间提供同样美味。推荐团体用餐。",
          vi: "Chi nhánh 2 Cô Ba có không gian rộng rãi hơn với cùng hương vị. Phù hợp cho nhóm đông.",
          ru: "2-й филиал Cô Ba предлагает тот же вкус в более просторном помещении. Рекомендуется для групп.",
          ja: "コーバー2号店はより広い空間で同じ味を楽しめます。団体客におすすめ。"
        }
      },
      { 
        name: "해산물 고급 식당", 
        nameVi: "Gành Hào Seafood Restaurant", 
        phone: "0254 3550 909", 
        mapUrl: "https://maps.app.goo.gl/AVh5Qq9HMRNpbjzBA",
        imageUrl: ganhHaoImg,
        description: {
          ko: "바다가 보이는 고급 해산물 레스토랑. 일몰과 함께 신선한 해산물 요리를 즐길 수 있습니다.",
          en: "Premium seafood restaurant with ocean view. Enjoy fresh seafood dishes while watching the sunset.",
          zh: "可以看到海景的高级海鲜餐厅。可以边看日落边享用新鲜海鲜。",
          vi: "Nhà hàng hải sản cao cấp với view biển. Thưởng thức hải sản tươi sống trong khi ngắm hoàng hôn.",
          ru: "Ресторан премиум-класса с видом на море. Свежие морепродукты на закате.",
          ja: "オーシャンビューの高級シーフードレストラン。夕日を見ながら新鮮な海鮮料理を楽しめます。"
        }
      },
      { 
        name: "Texas BBQ", 
        nameVi: "Texas BBQ", 
        mapUrl: "https://maps.app.goo.gl/nUQVw6bfdqiu8jMy7",
        imageUrl: texasBbqImg,
        recommended: true,
        description: {
          ko: "정통 텍사스 스타일 바베큐 레스토랑. 훈연 고기와 시원한 맥주를 즐길 수 있는 분위기 좋은 곳. 영업시간 11AM-9PM.",
          en: "Authentic Texas-style BBQ restaurant. Enjoy smoked meats and cold beers in a great atmosphere. Open 11AM-9PM.",
          zh: "正宗德州风格烧烤餐厅。享受烟熏肉和冰啤酒，氛围极佳。营业时间11AM-9PM。",
          vi: "Nhà hàng BBQ phong cách Texas chính thống. Thưởng thức thịt hun khói và bia lạnh trong không gian tuyệt vời. Mở cửa 11AM-9PM.",
          ru: "Аутентичный техасский барбекю-ресторан. Копчёное мясо и холодное пиво в отличной атмосфере. Время работы 11:00-21:00.",
          ja: "本格テキサススタイルのBBQレストラン。燻製肉と冷たいビールが楽しめる雰囲気の良いお店。営業時間11AM-9PM。"
        }
      },
      { 
        name: "해산물 고급 식당 2호점", 
        nameVi: "Gành Hào 2", 
        mapUrl: "https://maps.app.goo.gl/JLXdK6XZC5SqHntC7", 
        recommended: true,
        imageUrl: ganhHao2Img,
        description: {
          ko: "간하오 2호점은 현대적인 건물에서 대규모 연회와 행사에 적합한 해산물 전문점입니다.",
          en: "Gành Hào 2nd branch features a modern building, perfect for large banquets and events.",
          zh: "Gành Hào 2号店位于现代化建筑，适合大型宴会和活动。",
          vi: "Chi nhánh 2 Gành Hào có kiến trúc hiện đại, phù hợp tiệc lớn và sự kiện.",
          ru: "Филиал 2 Gành Hào в современном здании, идеален для банкетов и мероприятий.",
          ja: "ガンハオ2号店はモダンな建物で、大規模な宴会やイベントに最適です。"
        }
      },
      { 
        name: "해산물 야시장 로컬식당", 
        nameVi: "Hải Sản Cô Thy 2", 
        mapUrl: "https://maps.app.goo.gl/rWUGn1MYyzGH7Xg78",
        imageUrl: coThy2Img,
        description: {
          ko: "야시장 분위기의 해산물 로컬 식당. 합리적인 가격에 신선한 해산물을 즐길 수 있습니다.",
          en: "Local seafood restaurant with night market atmosphere. Fresh seafood at reasonable prices.",
          zh: "夜市风格的当地海鲜餐厅。价格实惠，海鲜新鲜。",
          vi: "Quán hải sản địa phương phong cách chợ đêm. Hải sản tươi giá phải chăng.",
          ru: "Местный ресторан морепродуктов в атмосфере ночного рынка. Свежие морепродукты по разумным ценам.",
          ja: "ナイトマーケット風のローカル海鮮食堂。リーズナブルな価格で新鮮な海鮮が楽しめます。"
        }
      },
      { 
        name: "분짜 하노이", 
        nameVi: "Bún Chả Hà Nội", 
        address: "32 Lê Lai, Phường 3, Vũng Tàu, Bà Rịa - Vũng Tàu 780000", 
        mapUrl: "https://maps.app.goo.gl/DbdLER7cjNZhcMJ19",
        imageUrl: bunChaImg,
        description: {
          ko: "하노이 스타일 분짜 전문점. 숯불에 구운 돼지고기와 쌀국수, 신선한 채소가 어우러진 맛.",
          en: "Hanoi-style Bún Chả specialty restaurant. Charcoal-grilled pork with rice noodles and fresh vegetables.",
          zh: "河内风格烤肉米粉专卖店。炭烤猪肉配米粉和新鲜蔬菜。",
          vi: "Quán chuyên Bún Chả Hà Nội. Thịt nướng than hoa với bún và rau tươi.",
          ru: "Специализированный ресторан Bún Chả в ханойском стиле. Свинина на углях с рисовой лапшой и овощами.",
          ja: "ハノイスタイルのブンチャー専門店。炭火焼き豚肉と米麺、新鮮な野菜のハーモニー。"
        }
      },
      { 
        name: "88 Food Garden (레스토랑)", 
        nameVi: "88 Food Garden", 
        mapUrl: "https://maps.app.goo.gl/iwaEfxbuxutM9y2t9",
        imageUrl: foodGarden88Img,
        description: {
          ko: "세련된 인테리어의 대형 해산물 정원 레스토랑. 가족 모임이나 특별한 날에 적합합니다.",
          en: "Large seafood garden restaurant with stylish interior. Perfect for family gatherings and special occasions.",
          zh: "装修精致的大型海鲜花园餐厅。适合家庭聚会和特殊场合。",
          vi: "Nhà hàng hải sản sân vườn lớn với nội thất sang trọng. Phù hợp họp mặt gia đình và dịp đặc biệt.",
          ru: "Большой ресторан морепродуктов с садом и стильным интерьером. Для семейных встреч и особых случаев.",
          ja: "スタイリッシュな内装の大型シーフードガーデンレストラン。家族の集まりや特別な日に最適。"
        }
      },
      { 
        name: "Panda BBQ (현지 바베큐)", 
        address: "150 Hạ Long, Phường 2, Vũng Tàu", 
        mapUrl: "https://maps.app.goo.gl/9ruaWyxg9txKrJ6eA",
        imageUrl: pandaBbqImg,
        description: {
          ko: "현지에서 인기 있는 바베큐 & 핫팟 레스토랑. 다양한 고기와 해산물을 구워 먹을 수 있습니다.",
          en: "Popular local BBQ & hotpot restaurant. Grill various meats and seafood at your table.",
          zh: "当地人气烧烤火锅餐厅。可以自己烤各种肉类和海鲜。",
          vi: "Quán nướng & lẩu được yêu thích. Tự nướng các loại thịt và hải sản tại bàn.",
          ru: "Популярный местный ресторан барбекю и хот-пот. Жарьте мясо и морепродукты за столом.",
          ja: "地元で人気のBBQ＆鍋レストラン。テーブルで様々な肉と海鮮を焼いて楽しめます。"
        }
      },
      { 
        name: "해산물 식당", 
        nameVi: "Ốc Tự Nhiên 3", 
        address: "20 Trần Phú, Phường 1, Vũng Tàu", 
        mapUrl: "https://maps.app.goo.gl/37gvjz6hhkzP6ip2A",
        imageUrl: ocTuNhien3Img,
        description: {
          ko: "다양한 조개 요리 전문점. 현지인들이 자주 찾는 해산물 맛집입니다.",
          en: "Specialty restaurant for various shellfish dishes. A seafood favorite among locals.",
          zh: "各种贝类料理专卖店。当地人常去的海鲜美食店。",
          vi: "Quán chuyên các món ốc đa dạng. Địa điểm hải sản được người địa phương yêu thích.",
          ru: "Ресторан, специализирующийся на моллюсках. Любимое место местных жителей.",
          ja: "様々な貝料理の専門店。地元民がよく訪れる海鮮の名店です。"
        }
      },
      { 
        name: "베트남 가정식", 
        nameVi: "Cơm Niêu Quê Nhà", 
        phone: "090 645 69 05", 
        mapUrl: "https://maps.app.goo.gl/Qcx6sfwFh7jrm9HU9",
        imageUrl: comNieuImg,
        description: {
          ko: "베트남 전통 가정식을 맛볼 수 있는 식당. 뚝배기 밥과 다양한 반찬이 특징입니다.",
          en: "Restaurant serving traditional Vietnamese home-style dishes. Features clay pot rice with various side dishes.",
          zh: "可以品尝越南传统家常菜的餐厅。特色是砂锅饭配各种小菜。",
          vi: "Nhà hàng phục vụ món ăn gia đình truyền thống Việt Nam. Đặc trưng cơm niêu với nhiều món ăn kèm.",
          ru: "Ресторан традиционной вьетнамской домашней кухни. Рис в глиняном горшке с гарнирами.",
          ja: "ベトナム伝統の家庭料理が味わえるレストラン。土鍋ご飯と様々なおかずが特徴です。"
        }
      },
      { 
        name: "해산물 쌀국수", 
        nameVi: "Old Man Cali - Hủ tiểu Mực", 
        mapUrl: "https://maps.app.goo.gl/hBzPccq4d6E2ufj66", 
        recommended: true,
        imageUrl: huTieuMucImg,
        description: {
          ko: "오징어 쌀국수(후띠우 먹) 전문점. 진한 해산물 육수와 쫄깃한 면이 일품입니다.",
          en: "Specialty squid rice noodle (Hủ Tiếu Mực) restaurant. Rich seafood broth with chewy noodles.",
          zh: "鱿鱼米粉专卖店。浓郁海鲜汤底配弹牙米粉。",
          vi: "Quán chuyên Hủ Tiếu Mực. Nước dùng hải sản đậm đà với sợi hủ tiếu dai.",
          ru: "Ресторан рисовой лапши с кальмаром. Насыщенный бульон из морепродуктов с жевательной лапшой.",
          ja: "イカ入りライスヌードル（フーティウ・ムック）専門店。濃厚な海鮮スープとモチモチ麺が絶品。"
        }
      },
      { 
        name: "소고기 쌀국수 (에어컨)", 
        mapUrl: "https://maps.app.goo.gl/9hYEyyeQ1HFFCqY7A",
        imageUrl: phoBoImg,
        description: {
          ko: "시원한 에어컨이 있는 깔끔한 소고기 쌀국수 전문점. 더운 날씨에 쾌적하게 식사할 수 있습니다.",
          en: "Clean beef noodle restaurant with air conditioning. Enjoy a comfortable meal on hot days.",
          zh: "有空调的干净牛肉粉店。炎热天气可以舒适用餐。",
          vi: "Quán phở bò sạch sẽ có máy lạnh. Dùng bữa thoải mái trong thời tiết nóng.",
          ru: "Чистый ресторан говяжьей лапши с кондиционером. Комфортный обед в жаркую погоду.",
          ja: "エアコン完備の清潔な牛肉フォー専門店。暑い日でも快適に食事できます。"
        }
      },
      { 
        name: "로컬 식당 (껌땀)", 
        nameVi: "Quán Cơm Tấm Lọ Lem", 
        phone: "0254 3521 212", 
        mapUrl: "https://maps.app.goo.gl/M5g8ya358jC1YNYh7",
        imageUrl: comTamImg,
        description: {
          ko: "베트남 대표 음식 껌땀(부서진 쌀밥) 전문점. 구운 돼지갈비와 함께 먹는 현지인 맛집.",
          en: "Specialty Cơm Tấm (broken rice) restaurant. Served with grilled pork ribs, a local favorite.",
          zh: "越南代表美食碎米饭专卖店。配烤猪排，当地人最爱。",
          vi: "Quán chuyên Cơm Tấm. Ăn kèm sườn nướng, được người địa phương yêu thích.",
          ru: "Ресторан Cơm Tấm (дроблёный рис). Подаётся с жареными свиными рёбрышками, любимое место местных.",
          ja: "ベトナム代表料理コムタム（砕き米ご飯）専門店。焼き豚リブと一緒に楽しむ地元の人気店。"
        }
      },
      { 
        name: "오리국수 (오후 3시반 오픈)", 
        mapUrl: "https://maps.app.goo.gl/HrorS5czrq91WqPUA",
        imageUrl: miVitImg,
        description: {
          ko: "오리고기 국수와 완탕 전문점. 오후 3시 30분부터 영업하며 현지인들에게 인기가 많습니다.",
          en: "Duck noodle and wonton specialty restaurant. Opens at 3:30 PM, very popular among locals.",
          zh: "鸭肉面和云吞专卖店。下午3:30开门，深受当地人欢迎。",
          vi: "Quán chuyên mì vịt tiềm và sủi cảo. Mở cửa 3:30 chiều, rất được người địa phương yêu thích.",
          ru: "Ресторан утиной лапши и вонтонов. Открывается в 15:30, очень популярен у местных.",
          ja: "鴨肉麺とワンタン専門店。午後3時半オープン、地元民に大人気です。"
        }
      },
      { 
        name: "토끼구이", 
        mapUrl: "https://maps.app.goo.gl/Cxpum3ne3fnLiBDz6",
        imageUrl: thoNuongImg,
        description: {
          ko: "베트남 스타일 토끼구이 전문점. 독특한 현지 음식을 경험하고 싶다면 추천합니다.",
          en: "Vietnamese-style grilled rabbit specialty restaurant. Recommended for trying unique local cuisine.",
          zh: "越南风格烤兔肉专卖店。想体验独特当地美食推荐尝试。",
          vi: "Quán chuyên thỏ nướng kiểu Việt Nam. Khuyến khích cho ai muốn thử ẩm thực địa phương độc đáo.",
          ru: "Ресторан вьетнамского жареного кролика. Рекомендуется для уникального местного опыта.",
          ja: "ベトナムスタイルのウサギ焼き専門店。ユニークな現地料理を体験したい方におすすめ。"
        }
      },
    ]
  },
  koreanFood: {
    id: "koreanFood",
    icon: Utensils,
    gradient: "from-rose-500 to-pink-600",
    places: [
      { name: "이안 돌판 삼겹살", address: "300A Phan Chu Trinh, Phường 2, Vũng Tàu", mapUrl: "https://maps.app.goo.gl/8FXU2u8Cn2AufLGz9", recommended: true, note: "partnerRestaurant", imageUrl: ianBbqImg },
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
      { 
        name: "Coffee Suối Bên Biển", 
        mapUrl: "https://maps.app.goo.gl/Sd7JGZiZ1n6TrvmJ7",
        imageUrl: coffeeSuoiImg,
        description: {
          ko: "바다를 바라보며 즐기는 야외 카페. 밤에는 조명과 함께 로맨틱한 분위기를 자아냅니다.",
          en: "Outdoor café with ocean views. At night, the lighting creates a romantic atmosphere.",
          zh: "可以欣赏海景的户外咖啡馆。夜晚灯光营造浪漫氛围。",
          vi: "Quán cà phê ngoài trời với view biển. Buổi tối ánh đèn tạo không gian lãng mạn.",
          ru: "Кафе на открытом воздухе с видом на море. Вечером освещение создаёт романтическую атмосферу.",
          ja: "海を眺めながら楽しめる野外カフェ。夜はライトアップでロマンチックな雰囲気に。"
        }
      },
      { 
        name: "KATINAT 커피", 
        mapUrl: "https://maps.app.goo.gl/ptgkTbJnVzwUzYPGA",
        imageUrl: katinatImg,
        description: {
          ko: "베트남 유명 프랜차이즈 커피숍. 해변가 테라스에서 시원한 음료를 즐길 수 있습니다.",
          en: "Famous Vietnamese coffee franchise. Enjoy cool drinks on the beachside terrace.",
          zh: "越南知名连锁咖啡店。可在海边露台享用冷饮。",
          vi: "Thương hiệu cà phê nổi tiếng Việt Nam. Thưởng thức đồ uống mát trên sân thượng view biển.",
          ru: "Известная вьетнамская сеть кофеен. Прохладные напитки на террасе у пляжа.",
          ja: "ベトナムの有名チェーン店。海辺のテラスで冷たいドリンクを楽しめます。"
        }
      },
      { 
        name: "Ten 커피숍", 
        nameVi: "Ten Coffee", 
        mapUrl: "https://maps.app.goo.gl/2c67Nd3hhjFGdZj36",
        description: {
          ko: "현지인들에게 인기 있는 분위기 좋은 커피숍. 다양한 음료와 편안한 공간에서 여유를 즐길 수 있습니다.",
          en: "Popular local coffee shop with great atmosphere. Enjoy various drinks in a cozy space.",
          zh: "深受当地人喜爱的咖啡店，氛围极佳。在舒适的空间享受各种饮品。",
          vi: "Quán cà phê được người địa phương yêu thích với không gian tuyệt vời. Thưởng thức đồ uống đa dạng.",
          ru: "Популярная местная кофейня с отличной атмосферой. Разнообразные напитки в уютном пространстве.",
          ja: "地元で人気の雰囲気の良いコーヒーショップ。居心地の良い空間で様々なドリンクを楽しめます。"
        }
      },
      { 
        name: "Soho Coffee", 
        phone: "094 641 40 31", 
        mapUrl: "https://maps.app.goo.gl/fK1SdiHaNH9SoVeZ6",
        imageUrl: sohoCoffeeImg,
        description: {
          ko: "아치형 창문이 인상적인 세련된 카페. 바다 전망과 함께 고급스러운 분위기를 즐길 수 있습니다.",
          en: "Stylish café with impressive arched windows. Enjoy a luxurious atmosphere with ocean views.",
          zh: "拱形窗户令人印象深刻的时尚咖啡馆。可欣赏海景享受高档氛围。",
          vi: "Quán cà phê sang trọng với cửa sổ vòm ấn tượng. Thưởng thức không gian cao cấp với view biển.",
          ru: "Стильное кафе с впечатляющими арочными окнами. Роскошная атмосфера с видом на море.",
          ja: "アーチ型の窓が印象的なスタイリッシュなカフェ。海の眺めと高級感のある雰囲気を楽しめます。"
        }
      },
      { 
        name: "Highlands Coffee", 
        mapUrl: "https://maps.app.goo.gl/BfdzBXcKDiLBBmd96",
        imageUrl: highlandsCoffeeImg,
        description: {
          ko: "베트남 대표 커피 프랜차이즈. 에어컨이 완비된 쾌적한 공간에서 다양한 커피를 즐길 수 있습니다.",
          en: "Vietnam's leading coffee franchise. Enjoy various coffees in a comfortable air-conditioned space.",
          zh: "越南代表性咖啡连锁品牌。在舒适的空调环境中享用各种咖啡。",
          vi: "Thương hiệu cà phê hàng đầu Việt Nam. Thưởng thức cà phê đa dạng trong không gian máy lạnh thoải mái.",
          ru: "Ведущая вьетнамская сеть кофеен. Разнообразный кофе в комфортном кондиционированном помещении.",
          ja: "ベトナム代表的なコーヒーチェーン。エアコン完備の快適な空間で様々なコーヒーを楽しめます。"
        }
      },
      { 
        name: "Sea & Sun 2", 
        phone: "0822 056 419", 
        mapUrl: "https://maps.app.goo.gl/VKm9bZifEX9Lob477",
        imageUrl: seaSunImg,
        description: {
          ko: "일몰 명소로 유명한 해변 카페. 탁 트인 바다 전망과 함께 석양을 감상하기 좋습니다.",
          en: "Beach café famous for sunset views. Perfect for watching the sunset with panoramic ocean views.",
          zh: "以日落景观闻名的海滩咖啡馆。欣赏壮观海景和日落的好地方。",
          vi: "Quán cà phê bãi biển nổi tiếng với view hoàng hôn. Lý tưởng ngắm hoàng hôn với view biển toàn cảnh.",
          ru: "Пляжное кафе, известное закатами. Идеально для наблюдения заката с панорамным видом на море.",
          ja: "夕日の名所として有名なビーチカフェ。パノラマオーシャンビューで夕焼けを楽しめます。"
        }
      },
      { 
        name: "Mi Amor Beach", 
        mapUrl: "https://maps.app.goo.gl/o12qFzH1ggCwee5Y7",
        imageUrl: miAmorImg,
        description: {
          ko: "벚꽃 장식이 아름다운 해변 카페. 인스타그램 사진 찍기 좋은 포토존이 많습니다.",
          en: "Beach café with beautiful cherry blossom decorations. Many Instagram-worthy photo spots.",
          zh: "樱花装饰美丽的海滩咖啡馆。有很多适合拍照的网红打卡点。",
          vi: "Quán cà phê bãi biển với trang trí hoa anh đào đẹp. Nhiều điểm check-in sống ảo cho Instagram.",
          ru: "Пляжное кафе с красивым декором из сакуры. Много фотозон для Instagram.",
          ja: "桜の装飾が美しいビーチカフェ。インスタ映えするフォトスポットがたくさんあります。"
        }
      },
    ]
  },
  services: {
    id: "services",
    icon: Scissors,
    gradient: "from-purple-500 to-violet-600",
    places: [
      { name: "Re.en 마사지", mapUrl: "https://maps.app.goo.gl/zGjF1ZoN5TJY5jdu8", note: "partnerBarber", imageUrl: reenMassageImg },
      { name: "그랜드 마사지", mapUrl: "https://maps.app.goo.gl/4z3hEL8RF5acvtod7", note: "partnerBarber", imageUrl: grandMassageImg },
      { name: "DAY SPA", address: "63 Trần Hưng Đạo, Phường 1, Vũng Tàu", mapUrl: "https://maps.app.goo.gl/JH3JEHhRRemgAm3VA", note: "partnerBarber", imageUrl: daySpaImg },
      { name: "김마싸 (MASSAGE 12C2)", phone: "0779 090 882", mapUrl: "https://maps.app.goo.gl/WA7Wt63HWcsi5dVQA" },
      { name: "이발소 Salon Kimha", address: "26 Đinh Tiên Hoàng, Phường 2, Vũng Tàu", mapUrl: "https://maps.app.goo.gl/q2HpipbVVMpvMHYj7" },
      { name: "Bi Roen 현지 고급 이발소", address: "518 Thống Nhất Mới, Phường 8, Vũng Tàu", mapUrl: "https://maps.app.goo.gl/yCMh6jYoLXLq8fgn7", recommended: true, note: "partnerBarber", imageUrl: biRoenImg },
    ]
  },
  nightlife: {
    id: "nightlife",
    icon: Music,
    gradient: "from-pink-600 to-purple-700",
    places: [
      { 
        name: "88 비어클럽", 
        nameVi: "88 Beer Club", 
        address: "151 Thùy Vân, Phường Thắng Tam, Vũng Tàu", 
        mapUrl: "https://maps.app.goo.gl/iE9XDvduSDrn1wVc8",
        imageUrl: club88Img,
        description: {
          ko: "붕따우 대표 비어클럽. 라이브 음악과 함께 즐기는 맥주와 야외 분위기.",
          en: "Popular beer club with live music and outdoor atmosphere.",
          zh: "头顿代表性啤酒俱乐部，现场音乐和户外氛围。",
          vi: "Câu lạc bộ bia nổi tiếng với nhạc sống và không gian ngoài trời.",
          ru: "Популярный пивной клуб с живой музыкой и открытой атмосферой.",
          ja: "ライブ音楽と屋外の雰囲気が楽しめる人気のビアクラブ。"
        }
      },
      { 
        name: "Revo 클럽", 
        nameVi: "Revo Club", 
        address: "15 Lý Tự Trọng, Phường 1, Vũng Tàu", 
        mapUrl: "https://maps.app.goo.gl/ddpz3vhHGrWyPo8UA",
        imageUrl: revoClubImg,
        description: {
          ko: "현지인들에게 인기 있는 나이트클럽. EDM 음악과 열정적인 분위기.",
          en: "Popular nightclub with EDM music and vibrant atmosphere.",
          zh: "当地人喜爱的夜店，EDM音乐和热情氛围。",
          vi: "Câu lạc bộ đêm được người địa phương yêu thích với nhạc EDM.",
          ru: "Популярный ночной клуб с EDM музыкой и яркой атмосферой.",
          ja: "EDM音楽と活気ある雰囲気が人気のナイトクラブ。"
        }
      },
      { 
        name: "Lox 클럽", 
        nameVi: "Lox Night Club", 
        address: "12b Hoàng Hoa Thám, Phường 3, Vũng Tàu", 
        mapUrl: "https://maps.app.goo.gl/AaHcBWNUBEWZXxQM7",
        imageUrl: loxClubImg,
        description: {
          ko: "화려한 인테리어의 프리미엄 나이트클럽. VIP 서비스 제공.",
          en: "Premium nightclub with glamorous interior and VIP services.",
          zh: "华丽内饰的高级夜店，提供VIP服务。",
          vi: "Câu lạc bộ đêm cao cấp với nội thất sang trọng và dịch vụ VIP.",
          ru: "Премиальный ночной клуб с гламурным интерьером и VIP-сервисом.",
          ja: "豪華なインテリアとVIPサービスを提供するプレミアムナイトクラブ。"
        }
      },
      { 
        name: "U.S Bar Club", 
        nameVi: "U.S Bar Club", 
        address: "120 Ba Cu, Phường 3, Vũng Tàu", 
        mapUrl: "https://maps.app.goo.gl/p5z6m5vT6qCrEWth6",
        imageUrl: usBarImg,
        description: {
          ko: "아메리칸 스타일 바. 칵테일과 양주를 즐길 수 있는 분위기 좋은 곳.",
          en: "American-style bar with great cocktails and spirits.",
          zh: "美式风格酒吧，鸡尾酒和烈酒选择丰富。",
          vi: "Quán bar phong cách Mỹ với cocktail và rượu mạnh tuyệt vời.",
          ru: "Бар в американском стиле с отличными коктейлями и крепкими напитками.",
          ja: "カクテルとスピリッツが楽しめるアメリカンスタイルのバー。"
        }
      },
      { 
        name: "Peace and Love 라이브바", 
        nameVi: "Peace and Love Live Bar", 
        address: "126A Phan Chu Trinh, Phường 2, Vũng Tàu, Bà Rịa - Vũng Tàu", 
        mapUrl: "https://maps.app.goo.gl/tF2X5pi7R1UmCamC7",
        imageUrl: peaceAndLoveImg,
        description: {
          ko: "금, 토 라이브 공연. 간단히 맥주 즐기며 라이브 밴드 감상.",
          en: "Live band performances on Fri & Sat. Enjoy beer with live music.",
          zh: "周五、周六现场乐队表演，边喝啤酒边欣赏现场音乐。",
          vi: "Biểu diễn nhạc sống thứ Sáu và thứ Bảy. Thưởng thức bia với nhạc sống.",
          ru: "Живые выступления по пятницам и субботам. Наслаждайтесь пивом под живую музыку.",
          ja: "金・土曜はライブバンド演奏。ビールを楽しみながらライブを鑑賞。"
        }
      },
    ]
  }
};

const categoryOrder = ["attractions", "services", "localFood", "koreanFood", "buffet", "chineseFood", "coffee", "exchange", "nightlife"];

const categoryLabels: Record<string, Record<string, string>> = {
  attractions: { ko: "관광명소", en: "Attractions", zh: "景点", vi: "Địa điểm du lịch", ru: "Достопримечательности", ja: "観光スポット" },
  localFood: { ko: "현지 음식점", en: "Local Restaurants", zh: "当地餐厅", vi: "Nhà hàng địa phương", ru: "Местные рестораны", ja: "ローカルレストラン" },
  koreanFood: { ko: "한식", en: "Korean Food", zh: "韩国料理", vi: "Món Hàn Quốc", ru: "Корейская еда", ja: "韓国料理" },
  buffet: { ko: "뷔페", en: "Buffet", zh: "自助餐", vi: "Buffet", ru: "Буфет", ja: "ビュッフェ" },
  chineseFood: { ko: "중식", en: "Chinese Food", zh: "中餐", vi: "Món Trung Quốc", ru: "Китайская еда", ja: "中華料理" },
  exchange: { ko: "환전소", en: "Currency Exchange", zh: "货币兑换", vi: "Đổi tiền", ru: "Обмен валюты", ja: "両替所" },
  coffee: { ko: "커피숍", en: "Coffee Shops", zh: "咖啡店", vi: "Quán cà phê", ru: "Кофейни", ja: "カフェ" },
  services: { ko: "마사지/이발소", en: "Massage & Barber", zh: "按摩/理发", vi: "Massage/Cắt tóc", ru: "Массаж/Парикмахерская", ja: "マッサージ/理髪店" },
  nightlife: { ko: "밤문화", en: "Nightlife", zh: "夜生活", vi: "Cuộc sống về đêm", ru: "Ночная жизнь", ja: "ナイトライフ" }
};

const noteLabels: Record<string, Record<string, string>> = {
  largeVehicleNo: { ko: "대형차량 진입불가", en: "No large vehicles", zh: "大型车辆禁入", vi: "Xe lớn không vào được", ru: "Большие авто запрещены", ja: "大型車両進入禁止" },
  crowded: { ko: "붐빔", en: "Often crowded", zh: "经常拥挤", vi: "Thường đông", ru: "Часто многолюдно", ja: "混雑あり" },
  spacious: { ko: "쾌적", en: "Spacious", zh: "宽敞", vi: "Thoáng mát", ru: "Просторно", ja: "快適" },
  partnerRestaurant: { ko: "붕따우 도깨비 협력식당", en: "Dokkaebi Partner", zh: "道佶比合作餐厅", vi: "Đối tác Dokkaebi", ru: "Партнёр Dokkaebi", ja: "ドッケビ提携店" },
  partnerBarber: { ko: "붕따우 도깨비 협력업체", en: "Dokkaebi Partner", zh: "道佶比合作店", vi: "Đối tác Dokkaebi", ru: "Партнёр Dokkaebi", ja: "ドッケビ提携店" }
};

const discountLabel: Record<string, Record<string, string>> = {
  partnerRestaurant: {
    ko: "붕따우 도깨비 카톡으로 예약 시 10% 할인",
    en: "10% off when booking via Dokkaebi KakaoTalk",
    zh: "通过道佶比KakaoTalk预订享10%折扣",
    vi: "Giảm 10% khi đặt qua KakaoTalk Dokkaebi",
    ru: "Скидка 10% при бронировании через KakaoTalk Dokkaebi",
    ja: "ドッケビカカオトークで予約時10%OFF"
  },
  partnerBarber: {
    ko: "붕따우 도깨비 카톡으로 예약 시 5% 할인",
    en: "5% off when booking via Dokkaebi KakaoTalk",
    zh: "通过道佶比KakaoTalk预订享5%折扣",
    vi: "Giảm 5% khi đặt qua KakaoTalk Dokkaebi",
    ru: "Скидка 5% при бронировании через KakaoTalk Dokkaebi",
    ja: "ドッケビカカオトークで予約時5%OFF"
  }
};

function PlaceCard({ place, language }: { place: Place; language: string }) {
  const [showMap, setShowMap] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const noteText = place.note ? (noteLabels[place.note]?.[language] || place.note) : null;
  const descriptionText = place.description?.[language] || place.description?.ko;

  const embedUrl = place.mapUrl.includes("goo.gl") 
    ? `https://www.google.com/maps?q=${encodeURIComponent(place.nameVi || place.name)},Vung Tau&output=embed`
    : place.mapUrl.replace("/maps/", "/maps/embed?");

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col gap-2">
          {place.imageUrl && (
            descriptionText ? (
              <div 
                className="relative w-full aspect-[16/9] rounded-lg overflow-hidden cursor-pointer group"
                onClick={() => setShowDescription(!showDescription)}
                data-testid={`image-${place.name.replace(/\s/g, "-")}`}
              >
                <img 
                  src={place.imageUrl} 
                  alt={place.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2">
                  <span className="text-[10px] text-white flex items-center gap-1 drop-shadow-md">
                    <Eye className="w-3 h-3" />
                    {language === "ko" ? "클릭하여 설명 보기" : "Click for details"}
                  </span>
                </div>
              </div>
            ) : (
              <a 
                href={place.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="relative w-full aspect-[16/9] rounded-lg overflow-hidden cursor-pointer group block"
                data-testid={`image-link-${place.name.replace(/\s/g, "-")}`}
              >
                <img 
                  src={place.imageUrl} 
                  alt={place.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2">
                  <span className="text-[10px] text-white flex items-center gap-1 drop-shadow-md">
                    <MapPin className="w-3 h-3" />
                    {language === "ko" ? "클릭시 위치보기" : language === "en" ? "Click for location" : language === "zh" ? "点击查看位置" : language === "vi" ? "Nhấn để xem vị trí" : language === "ru" ? "Нажмите для просмотра" : "クリックで位置表示"}
                  </span>
                </div>
              </a>
            )
          )}

          <AnimatePresence>
            {showDescription && descriptionText && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {descriptionText}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm text-foreground">{place.name}</h3>
                {(place.note === "partnerRestaurant" || place.note === "partnerBarber") && (
                  <Badge variant="outline" className="text-[9px] px-1 py-0 border-primary text-primary">
                    {noteLabels[place.note]?.[language] || noteLabels[place.note]?.ko}
                  </Badge>
                )}
              </div>
              {place.nameVi && <p className="text-xs text-muted-foreground truncate">{place.nameVi}</p>}
              {(place.note === "partnerRestaurant" || place.note === "partnerBarber") && (
                <p className="text-[10px] text-green-600 dark:text-green-400 font-medium mt-0.5">
                  {discountLabel[place.note]?.[language] || discountLabel[place.note]?.ko}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {place.recommended && (
                <Badge variant="default" className="bg-rose-500 text-[10px] px-1.5">
                  {language === "ko" ? "추천" : "Best"}
                </Badge>
              )}
            </div>
          </div>

          {noteText && place.note !== "partnerRestaurant" && place.note !== "partnerBarber" && (
            <div className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded">
              <AlertTriangle className="w-3 h-3" />
              {noteText}
            </div>
          )}

          {place.address && (
            <p className="text-[11px] text-muted-foreground flex items-start gap-1">
              <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{place.address}</span>
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {place.phone && (
              <a href={`tel:${place.phone.replace(/\s/g, "")}`} className="flex items-center gap-1 text-[11px] text-blue-600 hover:underline">
                <Phone className="w-3 h-3" />
                {place.phone}
              </a>
            )}
            <a href={place.mapUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] text-emerald-600 hover:underline">
              <ExternalLink className="w-3 h-3" />
              Google Maps
            </a>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full mt-1 text-xs h-8"
            onClick={() => setShowMap(!showMap)}
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
                className="overflow-hidden rounded-lg"
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
    guide: { ko: "관광/맛집", en: "Travel Guide", zh: "旅游指南", vi: "Du lịch", ru: "Гид", ja: "ガイド" },
    expenses: { ko: "여행 가계부", en: "Travel Expenses", zh: "旅行费用", vi: "Chi phí", ru: "Расходы", ja: "旅費" }
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
        <div className="container mx-auto px-4 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-1.5 py-3 min-w-max">
            <Link href="/">
              <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs whitespace-nowrap" data-testid="nav-calculator">
                <Calculator className="w-3.5 h-3.5" />
                {navLabels.calculator[language as keyof typeof navLabels.calculator] || navLabels.calculator.ko}
              </Button>
            </Link>
            <Link href="/guide">
              <Button variant="default" size="sm" className="flex items-center gap-1.5 text-xs whitespace-nowrap" data-testid="nav-guide">
                <MapPin className="w-3.5 h-3.5" />
                {navLabels.guide[language as keyof typeof navLabels.guide] || navLabels.guide.ko}
              </Button>
            </Link>
            <Link href="/board">
              <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs whitespace-nowrap" data-testid="nav-board">
                <FileText className="w-3.5 h-3.5" />
                {t("nav.board")}
              </Button>
            </Link>
            <Link href="/diet">
              <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs whitespace-nowrap" data-testid="nav-diet">
                <ShoppingBag className="w-3.5 h-3.5" />
                {t("nav.diet")}
              </Button>
            </Link>
            <Link href="/planner">
              <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs whitespace-nowrap" data-testid="nav-planner">
                <Sparkles className="w-3.5 h-3.5" />
                {t("nav.planner")}
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
                {t("nav.chat")}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl py-8">

        <div className="space-y-4">
          {categoryOrder.map((key) => {
            const category = placesData[key];
            if (!category) return null;
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
              <span className="text-sm font-semibold text-black whitespace-nowrap">
                {language === "ko" ? "예약/환전/부동산 문의" : 
                 language === "en" ? "Reservation / Exchange / Real Estate" :
                 language === "zh" ? "预约/换汇/房产" :
                 language === "vi" ? "Đặt chỗ / Đổi tiền / Bất động sản" :
                 language === "ru" ? "Бронь / Обмен / Недвижимость" :
                 language === "ja" ? "予約/両替/不動産" : "예약/환전/부동산 문의"}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href="http://qr.kakao.com/talk/5tbdn6_YLR1F7MHQC58jo_O5Gqo-"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="link-kakao-friend"
                >
                  <Button size="sm" className="bg-black hover:bg-black/90 text-yellow-400 font-bold gap-1.5">
                    <UserPlus className="w-4 h-4" />
                    {language === "ko" ? "카톡친추" : 
                     language === "en" ? "Add Friend" :
                     language === "zh" ? "加好友" :
                     language === "vi" ? "Kết bạn" :
                     language === "ru" ? "Добавить" :
                     language === "ja" ? "友達追加" : "카톡친추"}
                  </Button>
                </a>
                <a
                  href="http://pf.kakao.com/_TuxoxfG"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="link-kakao-reservation"
                >
                  <Button size="sm" className="bg-black hover:bg-black/90 text-yellow-400 font-bold gap-1.5">
                    <MessageCircle className="w-4 h-4" />
                    {language === "ko" ? "카톡채널문의" : 
                     language === "en" ? "Channel" :
                     language === "zh" ? "频道咨询" :
                     language === "vi" ? "Kênh" :
                     language === "ru" ? "Канал" :
                     language === "ja" ? "チャンネル" : "카톡채널문의"}
                  </Button>
                </a>
              </div>
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
