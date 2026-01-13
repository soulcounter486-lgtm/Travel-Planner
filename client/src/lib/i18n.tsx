import { createContext, useContext, useState, ReactNode } from "react";

export type Language = "ko" | "en" | "zh" | "vi" | "ru" | "ja";

export const languageNames: Record<Language, string> = {
  ko: "한국어",
  en: "English",
  zh: "中文",
  vi: "Tiếng Việt",
  ru: "Русский",
  ja: "日本語",
};

export const languageFlags: Record<Language, string> = {
  ko: "🇰🇷",
  en: "🇺🇸",
  zh: "🇨🇳",
  vi: "🇻🇳",
  ru: "🇷🇺",
  ja: "🇯🇵",
};

export const translations: Record<Language, Record<string, string>> = {
  ko: {
    // Header
    "header.title": "붕따우 도깨비",
    "header.subtitle": "여행견적",
    "header.description": "풀빌라, 차량, 가이드 서비스 등 나만의 맞춤 여행 견적을 실시간으로 확인하세요.",
    
    // Villa Section
    "villa.title": "럭셔리 풀빌라 숙박",
    "villa.checkIn": "체크인 날짜",
    "villa.checkOut": "체크아웃 날짜",
    "villa.selectDate": "날짜 선택",
    "villa.weekday": "평일(일-목)",
    "villa.friday": "금요일",
    "villa.saturday": "토요일",
    "villa.priceNote": "* 빌라 방갯수와 컨디션에 따라 가격은 변경될 수 있습니다.",
    "villa.viewMore": "실제 빌라 사진 더보기",
    
    // Vehicle Section
    "vehicle.title": "프라이빗 차량 (일자별 선택)",
    "vehicle.viewMore": "실제 차량 사진 더보기",
    "vehicle.info": "차량 서비스 안내",
    "vehicle.included": "[포함 사항]",
    "vehicle.includedItems": "운전기사, 유류비, 통행료 및 팁|대기료, 야간 할증",
    "vehicle.notIncluded": "[불포함 사항]",
    "vehicle.notIncludedItems": "개별 여행자 보험",
    "vehicle.date": "날짜",
    "vehicle.type": "차량 종류",
    "vehicle.route": "이동 경로",
    "vehicle.addDay": "차량 이용일 추가",
    "vehicle.estimatedPrice": "이용 금액 (예상)",
    "vehicle.select": "선택",
    
    // Vehicle Types
    "vehicle.7_seater": "7인승 SUV",
    "vehicle.16_seater": "16인승 밴",
    "vehicle.9_limo": "9인승 리무진",
    "vehicle.9_lux_limo": "9인승 럭셔리 리무진",
    "vehicle.12_lux_limo": "12인승 럭셔리 리무진",
    "vehicle.16_lux_limo": "16인승 럭셔리 리무진",
    "vehicle.29_seater": "29인승 버스",
    "vehicle.45_seater": "45인승 버스",
    
    // Routes
    "route.city": "붕따우 시내관광",
    "route.oneway": "호치민 ↔ 붕따우 (편도)",
    "route.hocham_oneway": "호치민 ↔ 호짬 (편도)",
    "route.phanthiet_oneway": "호치민 ↔ 판티엣 (편도)",
    "route.roundtrip": "호치민 ↔ 붕따우 (왕복)",
    "route.city_pickup_drop": "호치민 픽업/드랍 + 붕따우 시내",
    
    // Golf Section
    "golf.title": "골프 라운딩",
    "golf.viewMore": "골프장 정보 더보기",
    "golf.info": "골프 서비스 안내",
    "golf.included": "[포함 사항]",
    "golf.includedItems": "그린피, 캐디피, 카트비|락커, 샤워 시설 이용",
    "golf.notIncluded": "[불포함 사항]",
    "golf.notIncludedItems": "캐디팁 (1인당 $15~20 권장)|식사 및 음료",
    "golf.date": "날짜",
    "golf.course": "골프장",
    "golf.players": "인원",
    "golf.addDay": "골프 일정 추가",
    "golf.person": "명",
    
    // Golf Courses
    "golf.paradise": "파라다이스 CC",
    "golf.twin_doves": "트윈도브스 GC",
    "golf.sonadezi": "소나데지 CC",
    "golf.the_bluffs": "더 블러프스 GC",
    "golf.jw_marriott": "JW 메리어트 GC",
    "golf.mamason": "마마손 GC",
    
    // Eco Girl Section
    "ecoGirl.title": "에코걸 서비스",
    "ecoGirl.viewMore": "에코걸 정보 더보기",
    "ecoGirl.count": "인원 수",
    "ecoGirl.nights": "이용 박수",
    "ecoGirl.info": "에코걸 서비스 안내",
    "ecoGirl.infoText": "1박당 1인 기준 요금입니다. 인원과 박수를 선택해주세요.",
    "ecoGirl.person": "명",
    "ecoGirl.night": "박",
    
    // Guide Section
    "guide.title": "한국어 투어 가이드",
    "guide.viewMore": "가이드 정보 더보기",
    "guide.days": "가이드 일수",
    "guide.groupSize": "그룹 인원",
    "guide.info": "가이드 서비스 안내",
    "guide.infoText": "그룹 인원에 따라 1인당 요금이 달라집니다.",
    "guide.day": "일",
    "guide.person": "명",
    
    // Quote Summary
    "quote.title": "예상 견적 금액",
    "quote.villa": "풀빌라 숙박",
    "quote.vehicle": "차량 서비스",
    "quote.golf": "골프 라운딩",
    "quote.ecoGirl": "에코 가이드",
    "quote.guide": "한국어 가이드",
    "quote.note": "실제 가격은 현지 상황에 따라 다를 수 있습니다.",
    "quote.save": "견적서 저장",
    "quote.ready": "준비되셨나요?",
    "quote.readyDesc": "왼쪽 옵션을 조정하여 맞춤 여행 견적을 실시간으로 확인하세요.",
    "quote.calculating": "견적을 계산하고 있습니다...",
    
    // Contact Section
    "contact.title": "문의하기",
    "contact.vietnam": "베트남",
    "contact.korea": "한국",
    "contact.kakao": "카카오톡",
    "contact.blog": "블로그",
    
    // Dialog
    "dialog.customerName": "고객명",
    "dialog.saveQuote": "견적 저장",
    "dialog.cancel": "취소",
    "dialog.save": "저장",
    "dialog.enterName": "고객 이름을 입력하세요",
    
    // Language
    "language.select": "언어 선택",
  },
  
  en: {
    // Header
    "header.title": "Vung Tau Dokkaebi",
    "header.subtitle": "Travel Quote",
    "header.description": "Check your customized travel quote for pool villas, vehicles, and guide services in real-time.",
    
    // Villa Section
    "villa.title": "Luxury Pool Villa Stay",
    "villa.checkIn": "Check-in Date",
    "villa.checkOut": "Check-out Date",
    "villa.selectDate": "Select Date",
    "villa.weekday": "Weekdays (Sun-Thu)",
    "villa.friday": "Friday",
    "villa.saturday": "Saturday",
    "villa.priceNote": "* Prices may vary based on villa size and condition.",
    "villa.viewMore": "View More Villa Photos",
    
    // Vehicle Section
    "vehicle.title": "Private Vehicle (Daily Selection)",
    "vehicle.viewMore": "View More Vehicle Photos",
    "vehicle.info": "Vehicle Service Info",
    "vehicle.included": "[Included]",
    "vehicle.includedItems": "Driver, fuel, tolls, and tips|Waiting fee, night surcharge",
    "vehicle.notIncluded": "[Not Included]",
    "vehicle.notIncludedItems": "Individual travel insurance",
    "vehicle.date": "Date",
    "vehicle.type": "Vehicle Type",
    "vehicle.route": "Route",
    "vehicle.addDay": "Add Vehicle Day",
    "vehicle.estimatedPrice": "Estimated Price",
    "vehicle.select": "Select",
    
    // Vehicle Types
    "vehicle.7_seater": "7-Seater SUV",
    "vehicle.16_seater": "16-Seater Van",
    "vehicle.9_limo": "9-Seater Limousine",
    "vehicle.9_lux_limo": "9-Seater Luxury Limousine",
    "vehicle.12_lux_limo": "12-Seater Luxury Limousine",
    "vehicle.16_lux_limo": "16-Seater Luxury Limousine",
    "vehicle.29_seater": "29-Seater Bus",
    "vehicle.45_seater": "45-Seater Bus",
    
    // Routes
    "route.city": "Vung Tau City Tour",
    "route.oneway": "Ho Chi Minh ↔ Vung Tau (One Way)",
    "route.hocham_oneway": "Ho Chi Minh ↔ Ho Tram (One Way)",
    "route.phanthiet_oneway": "Ho Chi Minh ↔ Phan Thiet (One Way)",
    "route.roundtrip": "Ho Chi Minh ↔ Vung Tau (Round Trip)",
    "route.city_pickup_drop": "HCM Pickup/Drop + Vung Tau City",
    
    // Golf Section
    "golf.title": "Golf Round",
    "golf.viewMore": "View Golf Course Info",
    "golf.info": "Golf Service Info",
    "golf.included": "[Included]",
    "golf.includedItems": "Green fee, caddy fee, cart fee|Locker and shower facilities",
    "golf.notIncluded": "[Not Included]",
    "golf.notIncludedItems": "Caddy tip ($15-20 per person recommended)|Meals and beverages",
    "golf.date": "Date",
    "golf.course": "Golf Course",
    "golf.players": "Players",
    "golf.addDay": "Add Golf Day",
    "golf.person": "person(s)",
    
    // Golf Courses
    "golf.paradise": "Paradise CC",
    "golf.twin_doves": "Twin Doves GC",
    "golf.sonadezi": "Sonadezi CC",
    "golf.the_bluffs": "The Bluffs GC",
    "golf.jw_marriott": "JW Marriott GC",
    "golf.mamason": "Mamason GC",
    
    // Eco Girl Section
    "ecoGirl.title": "Eco Girl Service",
    "ecoGirl.viewMore": "View Eco Girl Info",
    "ecoGirl.count": "Number of People",
    "ecoGirl.nights": "Number of Nights",
    "ecoGirl.info": "Eco Girl Service Info",
    "ecoGirl.infoText": "Price per person per night. Select the number of people and nights.",
    "ecoGirl.person": "person(s)",
    "ecoGirl.night": "night(s)",
    
    // Guide Section
    "guide.title": "Korean Tour Guide",
    "guide.viewMore": "View Guide Info",
    "guide.days": "Guide Days",
    "guide.groupSize": "Group Size",
    "guide.info": "Guide Service Info",
    "guide.infoText": "Price per person varies by group size.",
    "guide.day": "day(s)",
    "guide.person": "person(s)",
    
    // Quote Summary
    "quote.title": "Estimated Quote",
    "quote.villa": "Pool Villa Stay",
    "quote.vehicle": "Vehicle Service",
    "quote.golf": "Golf Round",
    "quote.ecoGirl": "Eco Guide",
    "quote.guide": "Korean Guide",
    "quote.note": "Actual prices may vary depending on local conditions.",
    "quote.save": "Save Quote",
    "quote.ready": "Ready to start?",
    "quote.readyDesc": "Adjust the options on the left to see your customized travel quote in real-time.",
    "quote.calculating": "Calculating your quote...",
    
    // Contact Section
    "contact.title": "Contact Us",
    "contact.vietnam": "Vietnam",
    "contact.korea": "Korea",
    "contact.kakao": "KakaoTalk",
    "contact.blog": "Blog",
    
    // Dialog
    "dialog.customerName": "Customer Name",
    "dialog.saveQuote": "Save Quote",
    "dialog.cancel": "Cancel",
    "dialog.save": "Save",
    "dialog.enterName": "Enter customer name",
    
    // Language
    "language.select": "Select Language",
  },
  
  zh: {
    // Header
    "header.title": "头顿 Dokkaebi",
    "header.subtitle": "旅行报价",
    "header.description": "实时查看您的定制旅行报价，包括别墅、车辆和导游服务。",
    
    // Villa Section
    "villa.title": "豪华泳池别墅住宿",
    "villa.checkIn": "入住日期",
    "villa.checkOut": "退房日期",
    "villa.selectDate": "选择日期",
    "villa.weekday": "平日(周日-周四)",
    "villa.friday": "周五",
    "villa.saturday": "周六",
    "villa.priceNote": "* 价格可能因别墅大小和条件而有所不同。",
    "villa.viewMore": "查看更多别墅照片",
    
    // Vehicle Section
    "vehicle.title": "私人车辆（按日选择）",
    "vehicle.viewMore": "查看更多车辆照片",
    "vehicle.info": "车辆服务信息",
    "vehicle.included": "[包含]",
    "vehicle.includedItems": "司机、燃油费、过路费及小费|等候费、夜间附加费",
    "vehicle.notIncluded": "[不包含]",
    "vehicle.notIncludedItems": "个人旅行保险",
    "vehicle.date": "日期",
    "vehicle.type": "车辆类型",
    "vehicle.route": "路线",
    "vehicle.addDay": "添加用车日",
    "vehicle.estimatedPrice": "预估价格",
    "vehicle.select": "选择",
    
    // Vehicle Types
    "vehicle.7_seater": "7座SUV",
    "vehicle.16_seater": "16座面包车",
    "vehicle.9_limo": "9座豪华轿车",
    "vehicle.9_lux_limo": "9座奢华轿车",
    "vehicle.12_lux_limo": "12座奢华轿车",
    "vehicle.16_lux_limo": "16座奢华轿车",
    "vehicle.29_seater": "29座巴士",
    "vehicle.45_seater": "45座巴士",
    
    // Routes
    "route.city": "头顿市内观光",
    "route.oneway": "胡志明市 ↔ 头顿（单程）",
    "route.hocham_oneway": "胡志明市 ↔ 胡襄（单程）",
    "route.phanthiet_oneway": "胡志明市 ↔ 潘切（单程）",
    "route.roundtrip": "胡志明市 ↔ 头顿（往返）",
    "route.city_pickup_drop": "胡志明市接送 + 头顿市内",
    
    // Golf Section
    "golf.title": "高尔夫球场",
    "golf.viewMore": "查看高尔夫球场信息",
    "golf.info": "高尔夫服务信息",
    "golf.included": "[包含]",
    "golf.includedItems": "果岭费、球童费、球车费|更衣室和淋浴设施",
    "golf.notIncluded": "[不包含]",
    "golf.notIncludedItems": "球童小费（建议每人$15-20）|餐饮",
    "golf.date": "日期",
    "golf.course": "高尔夫球场",
    "golf.players": "人数",
    "golf.addDay": "添加高尔夫日程",
    "golf.person": "人",
    
    // Golf Courses
    "golf.paradise": "天堂CC",
    "golf.twin_doves": "双鸽GC",
    "golf.sonadezi": "Sonadezi CC",
    "golf.the_bluffs": "悬崖GC",
    "golf.jw_marriott": "JW万豪GC",
    "golf.mamason": "Mamason GC",
    
    // Eco Girl Section
    "ecoGirl.title": "Eco Girl服务",
    "ecoGirl.viewMore": "查看Eco Girl信息",
    "ecoGirl.count": "人数",
    "ecoGirl.nights": "住宿天数",
    "ecoGirl.info": "Eco Girl服务信息",
    "ecoGirl.infoText": "每人每晚价格。请选择人数和天数。",
    "ecoGirl.person": "人",
    "ecoGirl.night": "晚",
    
    // Guide Section
    "guide.title": "韩语导游",
    "guide.viewMore": "查看导游信息",
    "guide.days": "导游天数",
    "guide.groupSize": "团队人数",
    "guide.info": "导游服务信息",
    "guide.infoText": "每人价格因团队人数而异。",
    "guide.day": "天",
    "guide.person": "人",
    
    // Quote Summary
    "quote.title": "预估报价",
    "quote.villa": "泳池别墅住宿",
    "quote.vehicle": "车辆服务",
    "quote.golf": "高尔夫球场",
    "quote.ecoGirl": "Eco导游",
    "quote.guide": "韩语导游",
    "quote.note": "实际价格可能因当地情况而有所不同。",
    "quote.save": "保存报价",
    "quote.ready": "准备好了吗？",
    "quote.readyDesc": "调整左侧选项，实时查看您的定制旅行报价。",
    "quote.calculating": "正在计算报价...",
    
    // Contact Section
    "contact.title": "联系我们",
    "contact.vietnam": "越南",
    "contact.korea": "韩国",
    "contact.kakao": "KakaoTalk",
    "contact.blog": "博客",
    
    // Dialog
    "dialog.customerName": "客户姓名",
    "dialog.saveQuote": "保存报价",
    "dialog.cancel": "取消",
    "dialog.save": "保存",
    "dialog.enterName": "请输入客户姓名",
    
    // Language
    "language.select": "选择语言",
  },
  
  vi: {
    // Header
    "header.title": "Vũng Tàu Dokkaebi",
    "header.subtitle": "Báo giá du lịch",
    "header.description": "Kiểm tra báo giá du lịch tùy chỉnh của bạn cho biệt thự, xe và dịch vụ hướng dẫn theo thời gian thực.",
    
    // Villa Section
    "villa.title": "Biệt thự hồ bơi sang trọng",
    "villa.checkIn": "Ngày nhận phòng",
    "villa.checkOut": "Ngày trả phòng",
    "villa.selectDate": "Chọn ngày",
    "villa.weekday": "Ngày thường (CN-T5)",
    "villa.friday": "Thứ Sáu",
    "villa.saturday": "Thứ Bảy",
    "villa.priceNote": "* Giá có thể thay đổi tùy theo kích thước và tình trạng biệt thự.",
    "villa.viewMore": "Xem thêm ảnh biệt thự",
    
    // Vehicle Section
    "vehicle.title": "Xe riêng (Chọn theo ngày)",
    "vehicle.viewMore": "Xem thêm ảnh xe",
    "vehicle.info": "Thông tin dịch vụ xe",
    "vehicle.included": "[Bao gồm]",
    "vehicle.includedItems": "Tài xế, nhiên liệu, phí cầu đường và tiền tip|Phí chờ đợi, phụ phí đêm",
    "vehicle.notIncluded": "[Không bao gồm]",
    "vehicle.notIncludedItems": "Bảo hiểm du lịch cá nhân",
    "vehicle.date": "Ngày",
    "vehicle.type": "Loại xe",
    "vehicle.route": "Lộ trình",
    "vehicle.addDay": "Thêm ngày sử dụng xe",
    "vehicle.estimatedPrice": "Giá ước tính",
    "vehicle.select": "Chọn",
    
    // Vehicle Types
    "vehicle.7_seater": "SUV 7 chỗ",
    "vehicle.16_seater": "Xe van 16 chỗ",
    "vehicle.9_limo": "Limousine 9 chỗ",
    "vehicle.9_lux_limo": "Limousine cao cấp 9 chỗ",
    "vehicle.12_lux_limo": "Limousine cao cấp 12 chỗ",
    "vehicle.16_lux_limo": "Limousine cao cấp 16 chỗ",
    "vehicle.29_seater": "Xe buýt 29 chỗ",
    "vehicle.45_seater": "Xe buýt 45 chỗ",
    
    // Routes
    "route.city": "Tham quan TP Vũng Tàu",
    "route.oneway": "TP.HCM ↔ Vũng Tàu (Một chiều)",
    "route.hocham_oneway": "TP.HCM ↔ Hồ Tràm (Một chiều)",
    "route.phanthiet_oneway": "TP.HCM ↔ Phan Thiết (Một chiều)",
    "route.roundtrip": "TP.HCM ↔ Vũng Tàu (Khứ hồi)",
    "route.city_pickup_drop": "Đón/trả HCM + Nội thành Vũng Tàu",
    
    // Golf Section
    "golf.title": "Chơi golf",
    "golf.viewMore": "Xem thông tin sân golf",
    "golf.info": "Thông tin dịch vụ golf",
    "golf.included": "[Bao gồm]",
    "golf.includedItems": "Phí green, phí caddy, phí xe điện|Tủ đồ và phòng tắm",
    "golf.notIncluded": "[Không bao gồm]",
    "golf.notIncludedItems": "Tiền tip caddy (khuyến nghị $15-20/người)|Ăn uống",
    "golf.date": "Ngày",
    "golf.course": "Sân golf",
    "golf.players": "Số người",
    "golf.addDay": "Thêm lịch golf",
    "golf.person": "người",
    
    // Golf Courses
    "golf.paradise": "Paradise CC",
    "golf.twin_doves": "Twin Doves GC",
    "golf.sonadezi": "Sonadezi CC",
    "golf.the_bluffs": "The Bluffs GC",
    "golf.jw_marriott": "JW Marriott GC",
    "golf.mamason": "Mamason GC",
    
    // Eco Girl Section
    "ecoGirl.title": "Dịch vụ Eco Girl",
    "ecoGirl.viewMore": "Xem thông tin Eco Girl",
    "ecoGirl.count": "Số người",
    "ecoGirl.nights": "Số đêm",
    "ecoGirl.info": "Thông tin dịch vụ Eco Girl",
    "ecoGirl.infoText": "Giá mỗi người mỗi đêm. Chọn số người và số đêm.",
    "ecoGirl.person": "người",
    "ecoGirl.night": "đêm",
    
    // Guide Section
    "guide.title": "Hướng dẫn viên tiếng Hàn",
    "guide.viewMore": "Xem thông tin hướng dẫn viên",
    "guide.days": "Số ngày",
    "guide.groupSize": "Số người trong đoàn",
    "guide.info": "Thông tin dịch vụ hướng dẫn",
    "guide.infoText": "Giá mỗi người thay đổi theo số lượng đoàn.",
    "guide.day": "ngày",
    "guide.person": "người",
    
    // Quote Summary
    "quote.title": "Báo giá ước tính",
    "quote.villa": "Biệt thự hồ bơi",
    "quote.vehicle": "Dịch vụ xe",
    "quote.golf": "Chơi golf",
    "quote.ecoGirl": "Hướng dẫn Eco",
    "quote.guide": "Hướng dẫn tiếng Hàn",
    "quote.note": "Giá thực tế có thể thay đổi tùy theo điều kiện địa phương.",
    "quote.save": "Lưu báo giá",
    "quote.ready": "Bạn đã sẵn sàng?",
    "quote.readyDesc": "Điều chỉnh các tùy chọn bên trái để xem báo giá du lịch tùy chỉnh theo thời gian thực.",
    "quote.calculating": "Đang tính báo giá...",
    
    // Contact Section
    "contact.title": "Liên hệ",
    "contact.vietnam": "Việt Nam",
    "contact.korea": "Hàn Quốc",
    "contact.kakao": "KakaoTalk",
    "contact.blog": "Blog",
    
    // Dialog
    "dialog.customerName": "Tên khách hàng",
    "dialog.saveQuote": "Lưu báo giá",
    "dialog.cancel": "Hủy",
    "dialog.save": "Lưu",
    "dialog.enterName": "Nhập tên khách hàng",
    
    // Language
    "language.select": "Chọn ngôn ngữ",
  },
  
  ru: {
    // Header
    "header.title": "Вунгтау Доккаэби",
    "header.subtitle": "Расчет стоимости",
    "header.description": "Проверьте расчет стоимости вашего индивидуального тура: виллы, транспорт и услуги гида в реальном времени.",
    
    // Villa Section
    "villa.title": "Люксовая вилла с бассейном",
    "villa.checkIn": "Дата заезда",
    "villa.checkOut": "Дата выезда",
    "villa.selectDate": "Выберите дату",
    "villa.weekday": "Будни (Вс-Чт)",
    "villa.friday": "Пятница",
    "villa.saturday": "Суббота",
    "villa.priceNote": "* Цены могут меняться в зависимости от размера и состояния виллы.",
    "villa.viewMore": "Больше фото виллы",
    
    // Vehicle Section
    "vehicle.title": "Частный транспорт (по дням)",
    "vehicle.viewMore": "Больше фото транспорта",
    "vehicle.info": "Информация о транспорте",
    "vehicle.included": "[Включено]",
    "vehicle.includedItems": "Водитель, топливо, дорожные сборы и чаевые|Плата за ожидание, ночная надбавка",
    "vehicle.notIncluded": "[Не включено]",
    "vehicle.notIncludedItems": "Индивидуальная туристическая страховка",
    "vehicle.date": "Дата",
    "vehicle.type": "Тип транспорта",
    "vehicle.route": "Маршрут",
    "vehicle.addDay": "Добавить день",
    "vehicle.estimatedPrice": "Ориентировочная цена",
    "vehicle.select": "Выбрать",
    
    // Vehicle Types
    "vehicle.7_seater": "7-местный внедорожник",
    "vehicle.16_seater": "16-местный микроавтобус",
    "vehicle.9_limo": "9-местный лимузин",
    "vehicle.9_lux_limo": "9-местный люкс лимузин",
    "vehicle.12_lux_limo": "12-местный люкс лимузин",
    "vehicle.16_lux_limo": "16-местный люкс лимузин",
    "vehicle.29_seater": "29-местный автобус",
    "vehicle.45_seater": "45-местный автобус",
    
    // Routes
    "route.city": "Экскурсия по Вунгтау",
    "route.oneway": "Хошимин ↔ Вунгтау (в одну сторону)",
    "route.hocham_oneway": "Хошимин ↔ Хо Трам (в одну сторону)",
    "route.phanthiet_oneway": "Хошимин ↔ Фантьет (в одну сторону)",
    "route.roundtrip": "Хошимин ↔ Вунгтау (туда-обратно)",
    "route.city_pickup_drop": "Трансфер Хошимин + город Вунгтау",
    
    // Golf Section
    "golf.title": "Гольф",
    "golf.viewMore": "Информация о гольф-поле",
    "golf.info": "Информация о гольф-услугах",
    "golf.included": "[Включено]",
    "golf.includedItems": "Грин-фи, кэдди, гольф-кар|Раздевалка и душ",
    "golf.notIncluded": "[Не включено]",
    "golf.notIncludedItems": "Чаевые кэдди (рекомендуется $15-20 на человека)|Питание и напитки",
    "golf.date": "Дата",
    "golf.course": "Гольф-поле",
    "golf.players": "Игроков",
    "golf.addDay": "Добавить день гольфа",
    "golf.person": "чел.",
    
    // Golf Courses
    "golf.paradise": "Paradise CC",
    "golf.twin_doves": "Twin Doves GC",
    "golf.sonadezi": "Sonadezi CC",
    "golf.the_bluffs": "The Bluffs GC",
    "golf.jw_marriott": "JW Marriott GC",
    "golf.mamason": "Mamason GC",
    
    // Eco Girl Section
    "ecoGirl.title": "Услуга Eco Girl",
    "ecoGirl.viewMore": "Информация об Eco Girl",
    "ecoGirl.count": "Количество человек",
    "ecoGirl.nights": "Количество ночей",
    "ecoGirl.info": "Информация об услуге Eco Girl",
    "ecoGirl.infoText": "Цена за человека за ночь. Выберите количество человек и ночей.",
    "ecoGirl.person": "чел.",
    "ecoGirl.night": "ночей",
    
    // Guide Section
    "guide.title": "Корейский гид",
    "guide.viewMore": "Информация о гиде",
    "guide.days": "Количество дней",
    "guide.groupSize": "Размер группы",
    "guide.info": "Информация об услуге гида",
    "guide.infoText": "Цена за человека зависит от размера группы.",
    "guide.day": "дней",
    "guide.person": "чел.",
    
    // Quote Summary
    "quote.title": "Ориентировочная стоимость",
    "quote.villa": "Вилла с бассейном",
    "quote.vehicle": "Транспортные услуги",
    "quote.golf": "Гольф",
    "quote.ecoGirl": "Eco гид",
    "quote.guide": "Корейский гид",
    "quote.note": "Фактические цены могут отличаться в зависимости от местных условий.",
    "quote.save": "Сохранить расчет",
    "quote.ready": "Готовы начать?",
    "quote.readyDesc": "Настройте параметры слева, чтобы увидеть расчет стоимости в реальном времени.",
    "quote.calculating": "Расчет стоимости...",
    
    // Contact Section
    "contact.title": "Связаться с нами",
    "contact.vietnam": "Вьетнам",
    "contact.korea": "Корея",
    "contact.kakao": "KakaoTalk",
    "contact.blog": "Блог",
    
    // Dialog
    "dialog.customerName": "Имя клиента",
    "dialog.saveQuote": "Сохранить расчет",
    "dialog.cancel": "Отмена",
    "dialog.save": "Сохранить",
    "dialog.enterName": "Введите имя клиента",
    
    // Language
    "language.select": "Выберите язык",
  },
  
  ja: {
    // Header
    "header.title": "ブンタウ ドッケビ",
    "header.subtitle": "旅行見積",
    "header.description": "プールヴィラ、車両、ガイドサービスなど、オーダーメイド旅行の見積をリアルタイムで確認できます。",
    
    // Villa Section
    "villa.title": "ラグジュアリープールヴィラ宿泊",
    "villa.checkIn": "チェックイン日",
    "villa.checkOut": "チェックアウト日",
    "villa.selectDate": "日付選択",
    "villa.weekday": "平日（日～木）",
    "villa.friday": "金曜日",
    "villa.saturday": "土曜日",
    "villa.priceNote": "※ヴィラの広さやコンディションにより価格が変動する場合があります。",
    "villa.viewMore": "ヴィラ写真をもっと見る",
    
    // Vehicle Section
    "vehicle.title": "プライベート車両（日別選択）",
    "vehicle.viewMore": "車両写真をもっと見る",
    "vehicle.info": "車両サービス情報",
    "vehicle.included": "【含まれるもの】",
    "vehicle.includedItems": "ドライバー、燃料費、通行料、チップ|待機料、夜間割増",
    "vehicle.notIncluded": "【含まれないもの】",
    "vehicle.notIncludedItems": "個人旅行保険",
    "vehicle.date": "日付",
    "vehicle.type": "車種",
    "vehicle.route": "ルート",
    "vehicle.addDay": "車両利用日を追加",
    "vehicle.estimatedPrice": "予想料金",
    "vehicle.select": "選択",
    
    // Vehicle Types
    "vehicle.7_seater": "7人乗りSUV",
    "vehicle.16_seater": "16人乗りバン",
    "vehicle.9_limo": "9人乗りリムジン",
    "vehicle.9_lux_limo": "9人乗りラグジュアリーリムジン",
    "vehicle.12_lux_limo": "12人乗りラグジュアリーリムジン",
    "vehicle.16_lux_limo": "16人乗りラグジュアリーリムジン",
    "vehicle.29_seater": "29人乗りバス",
    "vehicle.45_seater": "45人乗りバス",
    
    // Routes
    "route.city": "ブンタウ市内観光",
    "route.oneway": "ホーチミン ↔ ブンタウ（片道）",
    "route.hocham_oneway": "ホーチミン ↔ ホーチャム（片道）",
    "route.phanthiet_oneway": "ホーチミン ↔ ファンティエット（片道）",
    "route.roundtrip": "ホーチミン ↔ ブンタウ（往復）",
    "route.city_pickup_drop": "ホーチミン送迎 + ブンタウ市内",
    
    // Golf Section
    "golf.title": "ゴルフラウンド",
    "golf.viewMore": "ゴルフ場情報を見る",
    "golf.info": "ゴルフサービス情報",
    "golf.included": "【含まれるもの】",
    "golf.includedItems": "グリーンフィー、キャディフィー、カート代|ロッカー、シャワー施設",
    "golf.notIncluded": "【含まれないもの】",
    "golf.notIncludedItems": "キャディチップ（1人$15〜20推奨）|食事・飲料",
    "golf.date": "日付",
    "golf.course": "ゴルフ場",
    "golf.players": "人数",
    "golf.addDay": "ゴルフ日程を追加",
    "golf.person": "名",
    
    // Golf Courses
    "golf.paradise": "パラダイスCC",
    "golf.twin_doves": "ツインドーブスGC",
    "golf.sonadezi": "ソナデジCC",
    "golf.the_bluffs": "ザ・ブラフスGC",
    "golf.jw_marriott": "JWマリオットGC",
    "golf.mamason": "ママソンGC",
    
    // Eco Girl Section
    "ecoGirl.title": "エコガールサービス",
    "ecoGirl.viewMore": "エコガール情報を見る",
    "ecoGirl.count": "人数",
    "ecoGirl.nights": "宿泊数",
    "ecoGirl.info": "エコガールサービス情報",
    "ecoGirl.infoText": "1泊1名あたりの料金です。人数と泊数を選択してください。",
    "ecoGirl.person": "名",
    "ecoGirl.night": "泊",
    
    // Guide Section
    "guide.title": "韓国語ツアーガイド",
    "guide.viewMore": "ガイド情報を見る",
    "guide.days": "ガイド日数",
    "guide.groupSize": "グループ人数",
    "guide.info": "ガイドサービス情報",
    "guide.infoText": "グループ人数により1人あたりの料金が変わります。",
    "guide.day": "日",
    "guide.person": "名",
    
    // Quote Summary
    "quote.title": "見積金額",
    "quote.villa": "プールヴィラ宿泊",
    "quote.vehicle": "車両サービス",
    "quote.golf": "ゴルフラウンド",
    "quote.ecoGirl": "エコガイド",
    "quote.guide": "韓国語ガイド",
    "quote.note": "実際の価格は現地の状況により異なる場合があります。",
    "quote.save": "見積書を保存",
    "quote.ready": "準備はできましたか？",
    "quote.readyDesc": "左のオプションを調整して、カスタマイズした旅行見積をリアルタイムで確認してください。",
    "quote.calculating": "見積を計算中...",
    
    // Contact Section
    "contact.title": "お問い合わせ",
    "contact.vietnam": "ベトナム",
    "contact.korea": "韓国",
    "contact.kakao": "カカオトーク",
    "contact.blog": "ブログ",
    
    // Dialog
    "dialog.customerName": "お客様名",
    "dialog.saveQuote": "見積を保存",
    "dialog.cancel": "キャンセル",
    "dialog.save": "保存",
    "dialog.enterName": "お客様名を入力してください",
    
    // Language
    "language.select": "言語選択",
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("language");
      if (saved && Object.keys(translations).includes(saved)) {
        return saved as Language;
      }
    }
    return "ko";
  });

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("language", lang);
    }
  };

  const t = (key: string): string => {
    return translations[language][key] || translations.ko[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
