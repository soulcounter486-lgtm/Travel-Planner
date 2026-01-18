import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/i18n";
import { MapPin, Phone, ExternalLink, Utensils, Coffee, Scissors, Building2, Camera, ChevronDown, ChevronUp, AlertTriangle, Calculator, MessageCircle, Eye, Wallet, Sparkles, Music, FileText } from "lucide-react";
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
      { name: "꼬바붕따우 1호점 (반콧,반쎄오)", nameVi: "Cô Ba Restaurant", phone: "0254 3526 165", mapUrl: "https://maps.app.goo.gl/LvFosNMLSi1LSRvz6", note: "crowded" },
      { name: "꼬바붕따우 2호점 (반콧,반쎄오)", nameVi: "Cô Ba Restaurant 2", mapUrl: "https://maps.app.goo.gl/ftQz4Z437ZJZn5g68", note: "spacious" },
      { name: "해산물 고급 식당", nameVi: "Gành Hào Seafood Restaurant", phone: "0254 3550 909", mapUrl: "https://maps.app.goo.gl/AVh5Qq9HMRNpbjzBA" },
      { name: "해산물 고급 식당 2호점", nameVi: "Gành Hào 2", mapUrl: "https://maps.app.goo.gl/JLXdK6XZC5SqHntC7" },
      { name: "해산물 야시장 로컬식당", nameVi: "Hải Sản Cô Thy 2", mapUrl: "https://maps.app.goo.gl/rWUGn1MYyzGH7Xg78" },
      { name: "분짜 하노이", nameVi: "Bún Chả Hà Nội", address: "32 Lê Lai, Phường 3, Vũng Tàu, Bà Rịa - Vũng Tàu 780000", mapUrl: "https://maps.app.goo.gl/DbdLER7cjNZhcMJ19" },
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
      { name: "Coffee Suối Bên Biển", mapUrl: "https://maps.app.goo.gl/Sd7JGZiZ1n6TrvmJ7" },
      { name: "KATINAT 커피", mapUrl: "https://maps.app.goo.gl/ptgkTbJnVzwUzYPGA" },
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
            <Link href="/expenses">
              <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs whitespace-nowrap" data-testid="nav-expenses">
                <Wallet className="w-3.5 h-3.5" />
                {navLabels.expenses[language as keyof typeof navLabels.expenses] || navLabels.expenses.ko}
              </Button>
            </Link>
            <Link href="/planner">
              <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs whitespace-nowrap" data-testid="nav-planner">
                <Sparkles className="w-3.5 h-3.5" />
                {t("nav.planner")}
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
                          {[...category.places].sort((a, b) => (b.recommended ? 1 : 0) - (a.recommended ? 1 : 0)).map((place, idx) => (
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
