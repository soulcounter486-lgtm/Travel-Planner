import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useLocation } from "wouter";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Place as DBPlace, PlaceCategory } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { MapPin, Phone, ExternalLink, Utensils, Coffee, Scissors, Building2, Camera, ChevronDown, ChevronUp, AlertTriangle, Calculator, MessageCircle, Eye, Wallet, Sparkles, Music, FileText, ShoppingBag, UserPlus, Settings, Pencil, ChevronLeft, ChevronRight, X, BookOpen, Map, List } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AppHeader } from "@/components/AppHeader";
import { TabNavigation } from "@/components/TabNavigation";
import jesusStatueImg from "@assets/Screenshot_20260115_113154_Gallery_1768451530261.jpg";
import lighthouseImg from "@assets/736414b25966415e9006dd674ec2aecf_1768452191679.jpeg";
import warMuseumImg from "@assets/20230318＿130556_1768452191689.jpg";
import worldWeaponsMuseumImg from "@assets/Screenshot_20260123_141912_Maps_1769152870673.jpg";
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
import tenCoffeeImg from "@assets/Screenshot_20260122_000040_Maps_1769016584832.jpg";

export interface HardcodedPlace {
  name: string;
  nameVi?: string;
  address?: string;
  phone?: string;
  mapUrl: string;
  note?: string;
  recommended?: boolean;
  imageUrl?: string;
  images?: string[]; // 추가 이미지들
  menuImages?: string[]; // 메뉴판 이미지들
  description?: Record<string, string>;
  dbId?: number; // DB에서 가져온 장소의 ID (수정 가능)
  sortOrder?: number; // 정렬 순서
  isPartner?: boolean; // 협력업체 여부
  discountText?: string; // 할인 안내 문구
  latitude?: string; // 위도
  longitude?: string; // 경도
}

export interface Category {
  id: string;
  icon: React.ElementType;
  gradient: string;
  places: HardcodedPlace[];
}

type Place = HardcodedPlace;

export const placesData: Record<string, Category> = {
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
        name: "세계무기박물관", 
        nameVi: "Bảo tàng vũ khí thế giới", 
        phone: "", 
        mapUrl: "https://maps.app.goo.gl/P6G63jRcSRcpwKcP6",
        imageUrl: worldWeaponsMuseumImg,
        description: {
          ko: "전 세계의 다양한 무기와 갑옷을 전시하는 독특한 박물관. 역사적인 무기 컬렉션을 감상할 수 있습니다.",
          en: "A unique museum showcasing weapons and armor from around the world. Features an impressive collection of historical weapons.",
          zh: "展示世界各地武器和盔甲的独特博物馆，拥有令人印象深刻的历史武器收藏。",
          vi: "Bảo tàng độc đáo trưng bày vũ khí và áo giáp từ khắp nơi trên thế giới với bộ sưu tập vũ khí lịch sử ấn tượng.",
          ru: "Уникальный музей с оружием и доспехами со всего мира. Впечатляющая коллекция исторического оружия.",
          ja: "世界中の武器と鎧を展示するユニークな博物館。歴史的な武器コレクションが見どころ。"
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
    places: []
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
        imageUrl: tenCoffeeImg,
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
      { name: "Bi Roen 현지 고급 이발소", address: "518 Thống Nhất Mới, Phường 8, Vũng Tàu", mapUrl: "https://maps.app.goo.gl/yCMh6jYoLXLq8fgn7", recommended: true, note: "partnerBarber", imageUrl: biRoenImg },
      { name: "Re.en 마사지", mapUrl: "https://maps.app.goo.gl/zGjF1ZoN5TJY5jdu8", note: "partnerBarber", imageUrl: reenMassageImg },
      { name: "그랜드 마사지", mapUrl: "https://maps.app.goo.gl/4z3hEL8RF5acvtod7", note: "partnerBarber", imageUrl: grandMassageImg },
      { name: "DAY SPA", address: "63 Trần Hưng Đạo, Phường 1, Vũng Tàu", mapUrl: "https://maps.app.goo.gl/JH3JEHhRRemgAm3VA", note: "partnerBarber", imageUrl: daySpaImg },
      { name: "김마싸 (MASSAGE 12C2)", phone: "0779 090 882", mapUrl: "https://maps.app.goo.gl/WA7Wt63HWcsi5dVQA" },
      { name: "이발소 Salon Kimha", address: "26 Đinh Tiên Hoàng, Phường 2, Vũng Tàu", mapUrl: "https://maps.app.goo.gl/q2HpipbVVMpvMHYj7" },
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
  },
  nightlife18: {
    id: "nightlife18",
    icon: Music,
    gradient: "from-red-600 to-pink-700",
    places: []
  }
};

const defaultCategoryOrder = ["attractions", "services", "localFood", "koreanFood", "buffet", "chineseFood", "coffee", "exchange", "nightlife", "nightlife18"];

const categoryLabels: Record<string, Record<string, string>> = {
  attractions: { ko: "관광명소", en: "Attractions", zh: "景点", vi: "Địa điểm du lịch", ru: "Достопримечательности", ja: "観光スポット" },
  localFood: { ko: "현지 음식점", en: "Local Restaurants", zh: "当地餐厅", vi: "Nhà hàng địa phương", ru: "Местные рестораны", ja: "ローカルレストラン" },
  koreanFood: { ko: "한식", en: "Korean Food", zh: "韩国料理", vi: "Món Hàn Quốc", ru: "Корейская еда", ja: "韓国料理" },
  buffet: { ko: "뷔페", en: "Buffet", zh: "自助餐", vi: "Buffet", ru: "Буфет", ja: "ビュッフェ" },
  chineseFood: { ko: "중식", en: "Chinese Food", zh: "中餐", vi: "Món Trung Quốc", ru: "Китайская еда", ja: "中華料理" },
  exchange: { ko: "환전소", en: "Currency Exchange", zh: "货币兑换", vi: "Đổi tiền", ru: "Обмен валюты", ja: "両替所" },
  coffee: { ko: "커피숍", en: "Coffee Shops", zh: "咖啡店", vi: "Quán cà phê", ru: "Кофейни", ja: "カフェ" },
  services: { ko: "마사지/이발소", en: "Massage & Barber", zh: "按摩/理发", vi: "Massage/Cắt tóc", ru: "Массаж/Парикмахерская", ja: "マッサージ/理髪店" },
  nightlife: { ko: "밤문화", en: "Nightlife", zh: "夜生活", vi: "Cuộc sống về đêm", ru: "Ночная жизнь", ja: "ナイトライフ" },
  nightlife18: { ko: "밤문화 18+", en: "Nightlife 18+", zh: "夜生活 18+", vi: "Cuộc sống về đêm 18+", ru: "Ночная жизнь 18+", ja: "ナイトライフ 18+" }
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

function PlaceCard({ place, language, isAdmin, categoryId, onEdit }: { 
  place: Place; 
  language: string; 
  isAdmin: boolean;
  categoryId: string;
  onEdit: (place: Place, categoryId: string) => void;
}) {
  const [showMap, setShowMap] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [menuImageIndex, setMenuImageIndex] = useState(0);
  const [showEnlargedImage, setShowEnlargedImage] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const cardMapRef = useRef<HTMLDivElement>(null);
  const cardMapInstanceRef = useRef<L.Map | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEndImage = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe && allImages.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    }
    if (isRightSwipe && allImages.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    }
  };

  const onTouchEndMenu = () => {
    if (!touchStart || !touchEnd || !place.menuImages) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe && place.menuImages.length > 1) {
      setMenuImageIndex((prev) => (prev + 1) % place.menuImages!.length);
    }
    if (isRightSwipe && place.menuImages.length > 1) {
      setMenuImageIndex((prev) => (prev - 1 + place.menuImages!.length) % place.menuImages!.length);
    }
  };
  
  const noteText = place.note ? (noteLabels[place.note]?.[language] || place.note) : null;
  const descriptionText = place.description?.[language] || place.description?.ko;

  // 모든 이미지 배열 (대표 이미지 + 추가 이미지들) - 중복 제거
  const allImages = Array.from(new Set([
    ...(place.imageUrl ? [place.imageUrl] : []),
    ...(place.images || [])
  ].filter(Boolean)));
  
  const hasMultipleImages = allImages.length > 1;
  const hasMenuImages = place.menuImages && place.menuImages.length > 0;

  // 좌표 추출
  const getPlaceCoords = (): [number, number] | null => {
    // 1. 직접 저장된 좌표
    if (place.latitude && place.longitude) {
      const lat = parseFloat(place.latitude);
      const lng = parseFloat(place.longitude);
      if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
    }
    // 2. mapUrl에서 좌표 추출
    if (place.mapUrl?.includes("q=")) {
      const match = place.mapUrl.match(/q=([-\d.]+),([-\d.]+)/);
      if (match) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
      }
    }
    // 3. 기본 좌표 (붕따우 중심)
    return [10.3456, 107.0844];
  };

  // Leaflet 지도 초기화
  useEffect(() => {
    if (!showMap || !cardMapRef.current) return;
    
    // 이미 초기화된 경우
    if (cardMapInstanceRef.current) {
      cardMapInstanceRef.current.invalidateSize();
      return;
    }
    
    const coords = getPlaceCoords();
    if (!coords) return;
    
    const map = L.map(cardMapRef.current, {
      center: coords,
      zoom: 15,
      zoomControl: true,
      scrollWheelZoom: false,
    });
    
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    
    // 커스텀 마커 아이콘 (이미지가 있으면 사용)
    const customIcon = place.imageUrl 
      ? L.divIcon({
          className: 'custom-place-marker',
          html: `<div style="
            width: 40px; height: 40px; border-radius: 8px; overflow: hidden; 
            border: 3px solid #3b82f6; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            background: white;
          ">
            <img src="${place.imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'" />
          </div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 40],
        })
      : L.divIcon({
          className: 'custom-place-marker',
          html: `<div style="
            width: 36px; height: 36px; border-radius: 50%; 
            background: #3b82f6; display: flex; align-items: center; justify-content: center;
            border: 3px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 36],
        });
    
    // 마커 추가
    const marker = L.marker(coords, { icon: customIcon }).addTo(map);
    
    // 팝업에 Google Maps 길찾기 버튼 추가
    const googleMapsUrl = place.mapUrl || `https://www.google.com/maps/dir/?api=1&destination=${coords[0]},${coords[1]}`;
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${coords[0]},${coords[1]}`;
    
    marker.bindPopup(`
      <div style="min-width: 150px; text-align: center;">
        <b style="font-size: 14px;">${place.name}</b>
        ${place.address ? `<p style="font-size: 11px; color: #666; margin: 4px 0;">${place.address}</p>` : ""}
        <div style="margin-top: 8px; display: flex; gap: 4px; justify-content: center;">
          <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" 
            style="background: #4285f4; color: white; padding: 6px 10px; border-radius: 6px; 
            font-size: 11px; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
            🧭 길찾기
          </a>
          <a href="${place.mapUrl || googleMapsUrl}" target="_blank" rel="noopener noreferrer"
            style="background: #34a853; color: white; padding: 6px 10px; border-radius: 6px;
            font-size: 11px; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
            📍 상세
          </a>
        </div>
      </div>
    `).openPopup();
    
    cardMapInstanceRef.current = map;
    
    // 크기 재조정
    setTimeout(() => map.invalidateSize(), 100);
    
    return () => {
      if (cardMapInstanceRef.current) {
        cardMapInstanceRef.current.remove();
        cardMapInstanceRef.current = null;
      }
    };
  }, [showMap, place.latitude, place.longitude, place.mapUrl]);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col gap-2">
          {allImages.length > 0 && (
            <div 
              className="relative w-full aspect-[16/9] rounded-lg overflow-hidden cursor-pointer group"
              onClick={() => setShowEnlargedImage(true)}
              data-testid={`image-${place.name.replace(/\s/g, "-")}`}
            >
              <img 
                src={allImages[currentImageIndex]} 
                alt={place.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              
              {/* 이미지 슬라이드 화살표 */}
              {hasMultipleImages && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition-colors"
                    data-testid="button-prev-image"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition-colors"
                    data-testid="button-next-image"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  {/* 이미지 인디케이터 */}
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1">
                    {allImages.map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                          idx === currentImageIndex ? "bg-white" : "bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2">
                <span className="text-[10px] text-white flex items-center gap-1 drop-shadow-md">
                  {descriptionText ? (
                    <>
                      <Eye className="w-3 h-3" />
                      {language === "ko" ? "클릭하여 설명 보기" : "Click for details"}
                    </>
                  ) : (
                    <>
                      <MapPin className="w-3 h-3" />
                      {language === "ko" ? "사진 보기" : "View photo"}
                    </>
                  )}
                  {hasMultipleImages && (
                    <span className="ml-1 bg-white/20 px-1 rounded">
                      {currentImageIndex + 1}/{allImages.length}
                    </span>
                  )}
                </span>
              </div>
            </div>
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
                {place.isPartner && (
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30">
                    붕따우 도깨비 협력업체
                  </Badge>
                )}
              </div>
              {place.nameVi && <p className="text-xs text-muted-foreground truncate">{place.nameVi}</p>}
              {(place.note === "partnerRestaurant" || place.note === "partnerBarber") && (
                <p className="text-[10px] text-green-600 dark:text-green-400 font-medium mt-0.5">
                  {discountLabel[place.note]?.[language] || discountLabel[place.note]?.ko}
                </p>
              )}
              {place.isPartner && place.discountText && (
                <p className="text-[10px] text-green-600 dark:text-green-400 font-medium mt-0.5">
                  {place.discountText}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {place.recommended && (
                <Badge variant="default" className="bg-rose-500 text-[10px] px-1.5">
                  {language === "ko" ? "추천" : "Best"}
                </Badge>
              )}
              {isAdmin && place.dbId && (
                <Link href="/admin/places">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    data-testid={`button-edit-place-${place.dbId}`}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </Link>
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
            {isAdmin && (
              <button
                onClick={() => onEdit(place, categoryId)}
                className="flex items-center gap-1 text-[11px] text-orange-600 hover:underline"
                data-testid={`button-edit-place-${place.name.replace(/\s/g, "-")}`}
              >
                <Pencil className="w-3 h-3" />
                수정
              </button>
            )}
          </div>

          <div className="flex gap-2 mt-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs h-8"
              onClick={() => setShowMap(!showMap)}
              data-testid={`button-toggle-map-${place.name.replace(/\s/g, "-")}`}
            >
              {showMap ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
              {showMap ? (language === "ko" ? "지도 닫기" : "Hide Map") : (language === "ko" ? "지도 보기" : "View Map")}
            </Button>
            
            {hasMenuImages && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-8 border-amber-400 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                onClick={() => setShowMenuModal(true)}
                data-testid={`button-menu-${place.name.replace(/\s/g, "-")}`}
              >
                <BookOpen className="w-3 h-3 mr-1" />
                {language === "ko" ? "메뉴판 보기" : "View Menu"}
              </Button>
            )}
          </div>

          <AnimatePresence>
            {showMap && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 200, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden rounded-lg"
              >
                <div 
                  ref={cardMapRef}
                  style={{ width: "100%", height: "200px" }}
                  className="rounded-lg"
                  data-testid={`map-${place.name.replace(/\s/g, "-")}`}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
      
      {/* 메뉴판 모달 */}
      <AnimatePresence>
        {showMenuModal && hasMenuImages && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setShowMenuModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-4xl max-h-[90vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 닫기 버튼 */}
              <button
                onClick={() => setShowMenuModal(false)}
                className="absolute -top-10 right-0 text-white hover:text-gray-300"
                data-testid="button-close-menu-modal"
              >
                <X className="w-8 h-8" />
              </button>
              
              {/* 메뉴판 이미지 */}
              <div 
                className="relative"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEndMenu}
              >
                <img
                  src={place.menuImages![menuImageIndex]}
                  alt={`메뉴판 ${menuImageIndex + 1}`}
                  className="w-full h-auto max-h-[80vh] object-contain rounded-lg select-none"
                  draggable={false}
                />
                
                {/* 이미지 슬라이드 화살표 */}
                {place.menuImages!.length > 1 && (
                  <>
                    <button
                      onClick={() => setMenuImageIndex((prev) => (prev - 1 + place.menuImages!.length) % place.menuImages!.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                      data-testid="button-prev-menu"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => setMenuImageIndex((prev) => (prev + 1) % place.menuImages!.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                      data-testid="button-next-menu"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                    {/* 인디케이터 */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {place.menuImages!.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setMenuImageIndex(idx)}
                          className={`w-3 h-3 rounded-full transition-colors ${
                            idx === menuImageIndex ? "bg-white" : "bg-white/50 hover:bg-white/70"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              {/* 이미지 카운터 */}
              <div className="text-center text-white mt-2 text-sm">
                {menuImageIndex + 1} / {place.menuImages!.length}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 이미지 확대 모달 */}
      <AnimatePresence>
        {showEnlargedImage && allImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setShowEnlargedImage(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-4xl max-h-[90vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 닫기 버튼 */}
              <button
                onClick={() => setShowEnlargedImage(false)}
                className="absolute -top-10 right-0 text-white hover:text-gray-300 z-10"
                data-testid="button-close-enlarged-image"
              >
                <X className="w-8 h-8" />
              </button>
              
              {/* 확대 이미지 */}
              <div 
                className="relative"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEndImage}
              >
                <img
                  src={allImages[currentImageIndex]}
                  alt={place.name}
                  className="w-full h-auto max-h-[80vh] object-contain rounded-lg select-none"
                  draggable={false}
                />
                
                {/* 이미지 슬라이드 화살표 */}
                {hasMultipleImages && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
                      data-testid="button-prev-enlarged"
                    >
                      <ChevronLeft className="w-8 h-8" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
                      data-testid="button-next-enlarged"
                    >
                      <ChevronRight className="w-8 h-8" />
                    </button>
                    {/* 인디케이터 */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {allImages.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentImageIndex(idx);
                          }}
                          className={`w-3 h-3 rounded-full transition-colors ${
                            idx === currentImageIndex ? "bg-white" : "bg-white/50 hover:bg-white/70"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              {/* 이미지 카운터 */}
              <div className="text-center text-white mt-2 text-sm">
                {currentImageIndex + 1} / {allImages.length}
              </div>
              
              {/* 설명 텍스트 */}
              {descriptionText && (
                <div className="text-center text-white/80 mt-3 text-sm max-w-2xl mx-auto px-4">
                  {descriptionText}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// DB 카테고리를 기존 카테고리에 매핑
const dbCategoryMap: Record<string, string> = {
  attraction: "attractions",
  services: "services",
  local_food: "localFood",
  korean_food: "koreanFood",
  buffet: "buffet",
  chinese_food: "chineseFood",
  cafe: "coffee",
  exchange: "exchange",
  nightlife: "nightlife",
  nightlife18: "nightlife18",
  restaurant: "localFood",
  other: "exchange",
};

// DB 장소를 Place 형식으로 변환
function convertDBPlace(dbPlace: DBPlace): Place | null {
  // 비활성 장소는 표시하지 않음
  if (!dbPlace.isActive) return null;
  
  const description: Record<string, string> = {};
  if (dbPlace.description) {
    description.ko = dbPlace.description;
    description.en = dbPlace.description;
  }
  
  // mapUrl 결정: 좌표 > 웹사이트 > 기본 구글맵 검색
  let mapUrl = "#";
  if (dbPlace.latitude && dbPlace.longitude) {
    mapUrl = `https://www.google.com/maps?q=${dbPlace.latitude},${dbPlace.longitude}`;
  } else if (dbPlace.website) {
    mapUrl = dbPlace.website;
  } else if (dbPlace.address) {
    mapUrl = `https://www.google.com/maps/search/${encodeURIComponent(dbPlace.address)}`;
  } else if (dbPlace.name) {
    mapUrl = `https://www.google.com/maps/search/${encodeURIComponent(dbPlace.name + ", Vung Tau")}`;
  }
  
  return {
    name: dbPlace.name,
    address: dbPlace.address || undefined,
    phone: dbPlace.phone || undefined,
    mapUrl,
    imageUrl: dbPlace.mainImage || undefined,
    images: dbPlace.images || [], // 추가 이미지들
    menuImages: dbPlace.menuImages || [], // 메뉴판 이미지들
    description: Object.keys(description).length > 0 ? description : undefined,
    dbId: dbPlace.id, // DB 장소 ID 추가 (수정 가능)
    sortOrder: dbPlace.sortOrder ?? 0, // 정렬 순서
    isPartner: dbPlace.isPartner ?? false, // 협력업체 여부
    discountText: dbPlace.discountText || undefined, // 할인 안내 문구
    latitude: dbPlace.latitude || undefined,
    longitude: dbPlace.longitude || undefined,
  };
}

export default function PlacesGuide() {
  const { language, t } = useLanguage();
  const { user, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [visitorCount, setVisitorCount] = useState<number>(0);
  const [totalVisitorCount, setTotalVisitorCount] = useState<number>(15000);
  const [realVisitorCount, setRealVisitorCount] = useState<number>(0);
  const [realTotalVisitorCount, setRealTotalVisitorCount] = useState<number>(0);
  
  // 지도 뷰 관련 상태
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [placesOnMap, setPlacesOnMap] = useState(0);
  const [selectedMapCategories, setSelectedMapCategories] = useState<Set<string>>(new Set()); // 빈 Set = 전체 표시
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);

  // DB에서 장소 데이터 가져오기
  const { data: dbPlaces = [] } = useQuery<DBPlace[]>({
    queryKey: ["/api/places"],
  });
  
  // DB에서 카테고리 데이터 가져오기
  const { data: dbCategories = [] } = useQuery<PlaceCategory[]>({
    queryKey: ["/api/place-categories"],
  });
  
  // DB 카테고리를 우선 사용하고, 없으면 하드코딩된 categoryLabels 사용
  const getCategoryLabel = (categoryId: string): string => {
    // 하드코딩 카테고리ID -> DB 카테고리ID 변환
    const hardcodedToDbMap: Record<string, string> = {
      attractions: "attraction",
      localFood: "local_food",
      koreanFood: "korean_food",
      chineseFood: "chinese_food",
      coffee: "cafe",
    };
    const dbCategoryId = hardcodedToDbMap[categoryId] || categoryId;
    
    // DB 카테고리에서 찾기
    const dbCat = dbCategories.find(c => c.id === dbCategoryId);
    if (dbCat) {
      switch (language) {
        case "ko": return dbCat.labelKo || categoryLabels[categoryId]?.ko || categoryId;
        case "en": return dbCat.labelEn || categoryLabels[categoryId]?.en || categoryId;
        case "zh": return dbCat.labelZh || categoryLabels[categoryId]?.zh || categoryId;
        case "vi": return dbCat.labelVi || categoryLabels[categoryId]?.vi || categoryId;
        case "ru": return dbCat.labelRu || categoryLabels[categoryId]?.ru || categoryId;
        case "ja": return dbCat.labelJa || categoryLabels[categoryId]?.ja || categoryId;
        default: return dbCat.labelKo || categoryLabels[categoryId]?.ko || categoryId;
      }
    }
    
    // 하드코딩된 categoryLabels에서 찾기
    return categoryLabels[categoryId]?.[language] || categoryLabels[categoryId]?.ko || categoryId;
  };

  // DB 카테고리 sortOrder 기반 동적 순서 생성
  const categoryOrder = useMemo(() => {
    if (dbCategories.length === 0) {
      return defaultCategoryOrder;
    }
    
    // DB 카테고리 ID -> 하드코딩 ID 매핑 (역매핑)
    const dbToHardcodedMap: Record<string, string> = {
      attraction: "attractions",
      local_food: "localFood",
      korean_food: "koreanFood",
      chinese_food: "chineseFood",
      cafe: "coffee",
    };
    
    // DB 카테고리를 sortOrder로 정렬하고 하드코딩 ID로 변환
    const sortedDbIds = [...dbCategories]
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map(c => dbToHardcodedMap[c.id] || c.id);
    
    // DB에 없는 기존 하드코딩 카테고리 추가 (예: nightlife18은 관리자만 보는 특수 카테고리)
    const remaining = defaultCategoryOrder.filter(id => !sortedDbIds.includes(id));
    
    return [...sortedDbIds, ...remaining];
  }, [dbCategories]);

  // 장소 수정 핸들러
  const handleEditPlace = async (place: Place, categoryId: string) => {
    if (place.dbId) {
      // DB에 있는 장소는 바로 편집 페이지로
      setLocation(`/admin/places?edit=${place.dbId}`);
    } else {
      // 하드코딩된 장소: 먼저 DB에서 같은 mapUrl의 장소가 있는지 확인
      const existingDbPlace = dbPlaces.find(p => p.website === place.mapUrl);
      if (existingDbPlace) {
        // 이미 DB에 있으면 그 장소 수정 페이지로 이동
        setLocation(`/admin/places?edit=${existingDbPlace.id}`);
        return;
      }
      
      // DB에 없으면 새로 생성
      try {
        const categoryMap: Record<string, string> = {
          attractions: "attraction",
          localFood: "local_food",
          nightlife: "nightlife",
          spa: "spa",
          coffee: "cafe",
          exchange: "other",
        };
        
        const res = await fetch("/api/admin/places", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: place.name,
            category: categoryMap[categoryId] || "attraction",
            address: place.address || "",
            phone: place.phone || "",
            website: place.mapUrl,
            description: place.description?.ko || "",
            sortOrder: place.sortOrder ?? 0,
            isActive: true,
          }),
        });
        
        if (!res.ok) {
          const err = await res.json();
          alert(err.error || "DB에 복사 실패");
          return;
        }
        
        const newPlace = await res.json();
        setLocation(`/admin/places?edit=${newPlace.id}`);
      } catch (error) {
        alert("오류가 발생했습니다");
      }
    }
  };

  // DB 장소를 카테고리별로 분류하고 기존 데이터와 합치기
  const mergedPlacesData = useMemo(() => {
    // DB 장소 이름 및 mapUrl 집합 생성 (중복 제거용)
    const dbPlaceNames = new Set(dbPlaces.filter(p => p.isActive).map(p => p.name));
    const dbPlaceMapUrls = new Set(dbPlaces.filter(p => p.isActive && p.website).map(p => p.website));
    
    // 각 카테고리 처리
    const merged: Record<string, Category> = {};
    
    Object.entries(placesData).forEach(([categoryKey, category]) => {
      const places: Place[] = [];
      
      // 1. 해당 카테고리의 DB 장소 먼저 추가 (sortOrder 순)
      const categoryDbPlaces = dbPlaces
        .filter(p => {
          const key = dbCategoryMap[p.category];
          return key === categoryKey && p.isActive;
        })
        .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
      
      categoryDbPlaces.forEach(dbPlace => {
        const converted = convertDBPlace(dbPlace);
        if (converted) {
          // 하드코딩에서 이미지 가져오기 (DB에 이미지 없는 경우)
          if (!converted.imageUrl) {
            const hardcoded = category.places.find(p => p.name === dbPlace.name || p.mapUrl === dbPlace.website);
            if (hardcoded?.imageUrl) {
              converted.imageUrl = hardcoded.imageUrl;
            }
          }
          places.push(converted);
        }
      });
      
      // 2. DB에 없는 하드코딩 장소 추가 (이름 또는 mapUrl로 중복 체크)
      category.places.forEach(place => {
        const isDuplicateByName = dbPlaceNames.has(place.name);
        const isDuplicateByUrl = place.mapUrl && dbPlaceMapUrls.has(place.mapUrl);
        if (!isDuplicateByName && !isDuplicateByUrl) {
          places.push({ ...place, sortOrder: 1000 });
        }
      });
      
      merged[categoryKey] = {
        ...category,
        places,
      };
    });
    
    return merged;
  }, [dbPlaces]);

  // 모든 장소 (지도용)
  const allPlaces = useMemo(() => {
    const places: (Place & { categoryId: string })[] = [];
    Object.entries(mergedPlacesData).forEach(([categoryId, category]) => {
      category.places.forEach(place => {
        places.push({ ...place, categoryId });
      });
    });
    return places;
  }, [mergedPlacesData]);

  // 지도 초기화
  useEffect(() => {
    if (viewMode !== "map" || !mapContainerRef.current) return;
    
    // 기존 지도가 있으면 크기 재조정 후 반환
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 100);
      return;
    }
    
    // 컨테이너 준비 확인
    const container = mapContainerRef.current;
    if (!container || container.clientHeight === 0) {
      // 컨테이너가 준비되지 않았으면 잠시 후 다시 시도
      const timer = setTimeout(() => {
        if (mapContainerRef.current && !mapRef.current) {
          initializeMap();
        }
      }, 200);
      return () => clearTimeout(timer);
    }
    
    initializeMap();
    
    function initializeMap() {
      if (!mapContainerRef.current || mapRef.current) return;
      
      const center: [number, number] = [10.3456, 107.0844];
      const map = L.map(mapContainerRef.current, {
        center,
        zoom: 13,
        zoomControl: true,
        preferCanvas: true, // 성능 향상
      });
      
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);
      
      // 마커 클러스터 그룹 생성
      const clusterGroup = (L as any).markerClusterGroup({
        maxClusterRadius: 50, // 클러스터 반경
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        disableClusteringAtZoom: 16, // 줌 16 이상에서는 클러스터링 해제
        chunkedLoading: true, // 청크 로딩으로 성능 향상
      });
      map.addLayer(clusterGroup);
      clusterGroupRef.current = clusterGroup;
      
      mapRef.current = map;
      
      // 크기 재조정
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }
    
    return () => {
      if (clusterGroupRef.current) {
        clusterGroupRef.current.clearLayers();
        clusterGroupRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [viewMode]);

  // 마커 업데이트
  useEffect(() => {
    if (!mapRef.current || !clusterGroupRef.current || viewMode !== "map") return;
    
    // 클러스터 그룹 클리어
    clusterGroupRef.current.clearLayers();
    markersRef.current = [];
    
    // 선택된 카테고리에 따라 필터링
    const filteredPlaces = selectedMapCategories.size === 0 
      ? allPlaces 
      : selectedMapCategories.has("partner")
        ? allPlaces.filter(place => place.isPartner)
        : allPlaces.filter(place => selectedMapCategories.has(place.categoryId));
    
    // 좌표가 있는 장소들에 마커 추가
    let placesWithCoords = 0;
    filteredPlaces.forEach(place => {
      let lat: number | null = null;
      let lng: number | null = null;
      
      // 1. 직접 저장된 좌표 사용 (DB 장소)
      if (place.latitude && place.longitude) {
        lat = parseFloat(place.latitude);
        lng = parseFloat(place.longitude);
      }
      // 2. mapUrl에서 좌표 추출 시도
      else if (place.mapUrl.includes("q=")) {
        const match = place.mapUrl.match(/q=([-\d.]+),([-\d.]+)/);
        if (match) {
          lat = parseFloat(match[1]);
          lng = parseFloat(match[2]);
        }
      }
      
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;
      placesWithCoords++;
      
      const categoryColors: Record<string, string> = {
        attractions: "#3b82f6",
        localFood: "#ef4444",
        koreanFood: "#f97316",
        buffet: "#eab308",
        chineseFood: "#22c55e",
        coffee: "#6366f1",
        nightlife: "#ec4899",
        nightlife18: "#dc2626",
        spa: "#8b5cf6",
        exchange: "#64748b",
        services: "#0ea5e9",
      };
      
      const color = categoryColors[place.categoryId] || "#64748b";
      
      // 파트너 업체는 더 크고 특별한 마커
      const markerSize = place.isPartner ? 50 : 40;
      const borderColor = place.isPartner ? '#f59e0b' : (selectedPlace?.name === place.name ? '#3b82f6' : color);
      const borderWidth = place.isPartner ? 4 : 3;
      
      // 파트너 배지 HTML
      const partnerBadge = place.isPartner ? `
        <div style="
          position: absolute; top: -14px; left: 50%; transform: translateX(-50%);
          background: linear-gradient(135deg, #f59e0b, #d97706); color: white;
          padding: 2px 6px; border-radius: 8px; font-size: 8px; font-weight: bold;
          white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          border: 1px solid #fbbf24;
        ">🏆 도깨비 파트너</div>
      ` : '';
      
      const iconHtml = place.imageUrl 
        ? `<div style="position: relative;">
            ${partnerBadge}
            <div style="
              width: ${markerSize}px; height: ${markerSize}px; border-radius: 8px; overflow: hidden; 
              border: ${borderWidth}px solid ${borderColor}; 
              box-shadow: 0 2px 8px rgba(0,0,0,0.3); cursor: pointer;
              background: white;
              ${place.isPartner ? 'animation: partnerGlow 2s ease-in-out infinite;' : ''}
            ">
              <img src="${place.imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
          </div>`
        : `<div style="position: relative;">
            ${partnerBadge}
            <div style="
              width: ${markerSize}px; height: ${markerSize}px; border-radius: 8px; 
              background: ${place.isPartner ? 'linear-gradient(135deg, #f59e0b, #d97706)' : color}; 
              display: flex; align-items: center; justify-content: center;
              border: ${borderWidth}px solid ${place.isPartner ? '#fbbf24' : '#fff'}; 
              box-shadow: 0 2px 8px rgba(0,0,0,0.3); cursor: pointer;
            ">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
          </div>`;
      
      const customIcon = L.divIcon({
        className: 'custom-place-marker',
        html: iconHtml,
        iconSize: [markerSize, markerSize + (place.isPartner ? 14 : 0)],
        iconAnchor: [markerSize / 2, markerSize + (place.isPartner ? 14 : 0)],
      });
      
      // 팝업 HTML 생성
      const categoryLabelsMap: Record<string, string> = {
        attractions: language === "ko" ? "관광명소" : "Attractions",
        localFood: language === "ko" ? "로컬맛집" : "Local Food",
        koreanFood: language === "ko" ? "한식" : "Korean",
        buffet: language === "ko" ? "뷔페" : "Buffet",
        chineseFood: language === "ko" ? "중식" : "Chinese",
        coffee: language === "ko" ? "카페" : "Cafe",
        nightlife: language === "ko" ? "유흥" : "Nightlife",
        nightlife18: language === "ko" ? "밤문화 18+" : "Nightlife 18+",
        spa: language === "ko" ? "스파/마사지" : "Spa",
        exchange: language === "ko" ? "환전" : "Exchange",
        services: language === "ko" ? "서비스" : "Services",
      };
      
      const categoryLabel = categoryLabelsMap[place.categoryId] || place.categoryId;
      const descText = place.description?.[language] || place.description?.ko || "";
      
      const popupHtml = `
        <div style="min-width: 200px; max-width: 280px;">
          ${place.imageUrl ? `
            <img src="${place.imageUrl}" 
              style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" 
              onerror="this.style.display='none'" />
          ` : ""}
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <span style="background: ${color}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px;">
              ${categoryLabel}
            </span>
            ${place.isPartner ? `<span style="background: #f59e0b; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px;">⭐ Partner</span>` : ""}
          </div>
          <h3 style="font-weight: 600; font-size: 14px; margin: 4px 0 6px 0; color: #1f2937;">${place.name}</h3>
          ${place.address ? `<p style="font-size: 11px; color: #6b7280; margin: 2px 0;">📍 ${place.address}</p>` : ""}
          ${place.phone ? `<p style="font-size: 11px; color: #6b7280; margin: 2px 0;">📞 ${place.phone}</p>` : ""}
          ${descText ? `<p style="font-size: 11px; color: #374151; margin: 6px 0 0 0; line-height: 1.4;">${descText.slice(0, 100)}${descText.length > 100 ? "..." : ""}</p>` : ""}
          ${place.isPartner && place.discountText ? `<p style="font-size: 11px; color: #dc2626; font-weight: 500; margin: 6px 0 0 0;">🎁 ${place.discountText}</p>` : ""}
          <div style="margin-top: 8px; display: flex; gap: 6px;">
            <a href="${place.mapUrl}" target="_blank" rel="noopener noreferrer" 
              style="flex: 1; text-align: center; background: #3b82f6; color: white; padding: 6px 10px; border-radius: 6px; font-size: 11px; text-decoration: none;">
              ${language === "ko" ? "길찾기" : "Directions"}
            </a>
            ${place.phone ? `
              <a href="tel:${place.phone}" 
                style="flex: 1; text-align: center; background: #22c55e; color: white; padding: 6px 10px; border-radius: 6px; font-size: 11px; text-decoration: none;">
                ${language === "ko" ? "전화" : "Call"}
              </a>
            ` : ""}
          </div>
        </div>
      `;
      
      const marker = L.marker([lat, lng], { icon: customIcon })
        .bindPopup(popupHtml, {
          maxWidth: 300,
          className: 'custom-popup'
        });
      
      marker.bindTooltip(place.name, { 
        permanent: false, 
        direction: 'top',
        offset: [0, place.isPartner ? -54 : -40]
      });
      
      // 파트너 업체는 클러스터링 없이 항상 표시, 일반 업체는 클러스터 그룹에 추가
      if (place.isPartner) {
        marker.addTo(mapRef.current!);
      } else {
        clusterGroupRef.current!.addLayer(marker);
      }
      markersRef.current.push(marker);
    });
    
    setPlacesOnMap(placesWithCoords);
  }, [allPlaces, viewMode, selectedPlace, selectedMapCategories]);

  useEffect(() => {
    const hasVisited = sessionStorage.getItem('visitor_counted');
    if (hasVisited) {
      // 이미 카운트된 경우 GET으로 현재 값만 가져옴
      fetch("/api/visitor-count")
        .then(res => res.json())
        .then(data => {
          setVisitorCount(data.count);
          setTotalVisitorCount(data.totalCount || 15000);
          setRealVisitorCount(data.realCount || 0);
          setRealTotalVisitorCount(data.realTotalCount || 0);
        })
        .catch(() => {});
    } else {
      // 처음 방문 시에만 카운트 증가
      apiRequest("POST", "/api/visitor-count/increment")
        .then(res => res.json())
        .then(data => {
          setVisitorCount(data.count);
          setTotalVisitorCount(data.totalCount || 15000);
          setRealVisitorCount(data.realCount || 0);
          setRealTotalVisitorCount(data.realTotalCount || 0);
          sessionStorage.setItem('visitor_counted', 'true');
        })
        .catch(() => {});
    }
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
      <AppHeader />

      <TabNavigation language={language} />

      <div className="container mx-auto px-4 max-w-4xl py-8">
        {/* 뷰 모드 토글 버튼 */}
        <div className="flex justify-end mb-4 gap-2">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            data-testid="button-list-view"
          >
            <List className="w-4 h-4 mr-1" />
            {language === "ko" ? "목록" : "List"}
          </Button>
          <Button
            variant={viewMode === "map" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("map")}
            data-testid="button-map-view"
          >
            <Map className="w-4 h-4 mr-1" />
            {language === "ko" ? "지도" : "Map"}
          </Button>
        </div>

        {/* 지도 뷰 */}
        {viewMode === "map" && (
          <div className="mb-6">
            <div 
              ref={mapContainerRef}
              className="w-full rounded-lg border shadow-lg"
              style={{ height: "400px", minHeight: "400px", position: "relative", zIndex: 1 }}
              data-testid="places-map-container"
            />
            
            {/* 선택된 장소 정보 */}
            <AnimatePresence>
              {selectedPlace && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="mt-4"
                >
                  <Card className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {selectedPlace.imageUrl && (
                          <img 
                            src={selectedPlace.imageUrl} 
                            alt={selectedPlace.name}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{selectedPlace.name}</h3>
                          {selectedPlace.nameVi && (
                            <p className="text-sm text-muted-foreground">{selectedPlace.nameVi}</p>
                          )}
                          {selectedPlace.address && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {selectedPlace.address}
                            </p>
                          )}
                          <div className="flex gap-2 mt-2">
                            <a 
                              href={selectedPlace.mapUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <Button size="sm" variant="outline">
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Google Maps
                              </Button>
                            </a>
                            {selectedPlace.phone && (
                              <a href={`tel:${selectedPlace.phone}`}>
                                <Button size="sm" variant="outline">
                                  <Phone className="w-3 h-3 mr-1" />
                                  {language === "ko" ? "전화" : "Call"}
                                </Button>
                              </a>
                            )}
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setSelectedPlace(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* 지도에 표시된 장소 수 */}
            <div className="mt-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {language === "ko" 
                  ? `📍 지도에 ${placesOnMap}개 장소 표시 중 (전체 ${allPlaces.length}개 중 좌표가 있는 장소만 표시됩니다)`
                  : `📍 ${placesOnMap} places shown on map (only places with coordinates from ${allPlaces.length} total)`}
              </p>
            </div>
            
            {/* 카테고리 필터 */}
            <div className="mt-4 p-3 bg-card rounded-lg border">
              <p className="text-xs font-medium mb-2">{language === "ko" ? "카테고리 필터 (클릭하여 선택)" : "Category Filter (click to select)"}</p>
              <div className="flex flex-wrap gap-2">
                {/* 전체 버튼 */}
                <button
                  onClick={() => setSelectedMapCategories(new Set())}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full border transition-all ${
                    selectedMapCategories.size === 0
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 hover:bg-muted border-transparent"
                  }`}
                  data-testid="map-filter-all"
                >
                  <span className="text-[10px] font-medium">{language === "ko" ? "전체" : "All"}</span>
                </button>
                {/* 도깨비 파트너 필터 버튼 */}
                <button
                  onClick={() => {
                    const newSet = new Set(selectedMapCategories);
                    if (newSet.has("partner")) {
                      newSet.delete("partner");
                    } else {
                      newSet.clear();
                      newSet.add("partner");
                    }
                    setSelectedMapCategories(newSet);
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full border transition-all ${
                    selectedMapCategories.has("partner")
                      ? "ring-2 ring-offset-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-500"
                      : "opacity-80 hover:opacity-100 border-amber-500"
                  }`}
                  data-testid="map-filter-partner"
                >
                  <span className="text-[10px]">🏆</span>
                  <span className="text-[10px] font-bold">{language === "ko" ? "도깨비 파트너" : "Dokkaebi Partner"}</span>
                </button>
                {[
                  { id: "attractions", color: "#3b82f6", label: language === "ko" ? "관광명소" : "Attractions" },
                  { id: "localFood", color: "#ef4444", label: language === "ko" ? "로컬맛집" : "Local Food" },
                  { id: "koreanFood", color: "#f97316", label: language === "ko" ? "한식" : "Korean" },
                  { id: "coffee", color: "#6366f1", label: language === "ko" ? "카페" : "Cafe" },
                  { id: "nightlife", color: "#ec4899", label: language === "ko" ? "유흥" : "Nightlife" },
                  // nightlife18은 관리자 또는 카카오 로그인 남성에게만 표시
                  ...(isAdmin || (user?.id?.startsWith("kakao_") && user?.gender === "male") ? [{ id: "nightlife18", color: "#dc2626", label: language === "ko" ? "밤문화 18+" : "Nightlife 18+" }] : []),
                  { id: "spa", color: "#8b5cf6", label: language === "ko" ? "스파" : "Spa" },
                  { id: "massage", color: "#14b8a6", label: language === "ko" ? "마사지" : "Massage" },
                  { id: "golf", color: "#22c55e", label: language === "ko" ? "골프" : "Golf" },
                  { id: "exchange", color: "#eab308", label: language === "ko" ? "환전" : "Exchange" },
                ].map(item => {
                  const isSelected = selectedMapCategories.has(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        const newSet = new Set(selectedMapCategories);
                        if (isSelected) {
                          newSet.delete(item.id);
                        } else {
                          newSet.add(item.id);
                        }
                        setSelectedMapCategories(newSet);
                      }}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full border transition-all ${
                        isSelected
                          ? "ring-2 ring-offset-1"
                          : "opacity-60 hover:opacity-100"
                      }`}
                      style={{ 
                        backgroundColor: isSelected ? item.color : 'transparent',
                        borderColor: item.color,
                        color: isSelected ? 'white' : 'inherit'
                      }}
                      data-testid={`map-filter-${item.id}`}
                    >
                      <div 
                        className="w-2.5 h-2.5 rounded-full" 
                        style={{ backgroundColor: isSelected ? 'white' : item.color }} 
                      />
                      <span className="text-[10px] font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 리스트 뷰 */}
        {viewMode === "list" && (
        <div className="space-y-4">
          {categoryOrder.map((key) => {
            // nightlife18 카테고리는 관리자 또는 카카오 로그인 남성 사용자에게만 표시
            if (key === "nightlife18" && !isAdmin && !(user?.id?.startsWith("kakao_") && user?.gender === "male")) return null;
            const category = mergedPlacesData[key];
            if (!category) return null;
            const Icon = category.icon;
            const isExpanded = expandedCategories.has(key);
            const label = getCategoryLabel(key);

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
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <Link href="/admin/places">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-white hover:bg-white/20"
                            onClick={(e) => e.stopPropagation()}
                            data-testid="button-admin-places"
                          >
                            <Settings className="w-4 h-4 mr-1" />
                            {language === "ko" ? "관리" : "Manage"}
                          </Button>
                        </Link>
                      )}
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
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
                            <PlaceCard 
                              key={idx} 
                              place={place} 
                              language={language} 
                              isAdmin={isAdmin}
                              categoryId={key}
                              onEdit={handleEditPlace}
                            />
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
        )}

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
        <div className="bg-slate-800 py-1 px-3 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {language === "ko" ? `오늘 ${visitorCount.toLocaleString()}명` : 
             language === "en" ? `Today ${visitorCount.toLocaleString()}` :
             language === "zh" ? `今日 ${visitorCount.toLocaleString()}` :
             language === "vi" ? `Hôm nay ${visitorCount.toLocaleString()}` :
             language === "ru" ? `Сегодня ${visitorCount.toLocaleString()}` :
             language === "ja" ? `今日 ${visitorCount.toLocaleString()}人` : `오늘 ${visitorCount.toLocaleString()}명`}
          </span>
          {isAdmin && (
            <span className="text-[10px] text-green-400 flex items-center gap-1">
              실제: {realVisitorCount.toLocaleString()} / {realTotalVisitorCount.toLocaleString()}
            </span>
          )}
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            {language === "ko" ? `누적 ${totalVisitorCount.toLocaleString()}명` : 
             language === "en" ? `Total ${totalVisitorCount.toLocaleString()}` :
             language === "zh" ? `累计 ${totalVisitorCount.toLocaleString()}` :
             language === "vi" ? `Tổng ${totalVisitorCount.toLocaleString()}` :
             language === "ru" ? `Всего ${totalVisitorCount.toLocaleString()}` :
             language === "ja" ? `累計 ${totalVisitorCount.toLocaleString()}人` : `누적 ${totalVisitorCount.toLocaleString()}명`}
          </span>
        </div>
      </div>
    </div>
  );
}
