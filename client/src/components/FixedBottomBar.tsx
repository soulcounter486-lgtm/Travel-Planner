import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, MessageCircle, Eye, Users } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";

export function FixedBottomBar() {
  const { language } = useLanguage();
  const { isAdmin } = useAuth();

  const [visitorCount, setVisitorCount] = useState<number>(0);
  const [totalVisitorCount, setTotalVisitorCount] = useState<number>(15000);
  const [realVisitorCount, setRealVisitorCount] = useState<number>(0);
  const [realTotalVisitorCount, setRealTotalVisitorCount] = useState<number>(0);
  const [fakeMemberCount, setFakeMemberCount] = useState<number>(563);
  const [realMemberCount, setRealMemberCount] = useState<number>(0);

  useEffect(() => {
    const hasVisited = sessionStorage.getItem('visitor_counted');
    if (hasVisited) {
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
      fetch("/api/visitor-count/increment", { method: "POST" })
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
    fetch("/api/member-count")
      .then(res => res.json())
      .then(data => {
        setFakeMemberCount(data.fakeMemberCount || 563);
        setRealMemberCount(data.realMemberCount || 0);
      })
      .catch(() => {});
  }, []);

  const contactLabel = language === "ko" ? "예약/환전/부동산 문의" : 
    language === "en" ? "Reservation / Exchange / Real Estate" :
    language === "zh" ? "预约/换汇/房产" :
    language === "vi" ? "Đặt chỗ / Đổi tiền / Bất động sản" :
    language === "ru" ? "Бронь / Обмен / Недвижимость" :
    language === "ja" ? "予約/両替/不動産" : "예약/환전/부동산 문의";

  const addFriendLabel = language === "ko" ? "카톡친추" : 
    language === "en" ? "Add Friend" :
    language === "zh" ? "加好友" :
    language === "vi" ? "Kết bạn" :
    language === "ru" ? "Добавить" :
    language === "ja" ? "友達追加" : "카톡친추";

  const channelLabel = language === "ko" ? "카톡채널문의" : 
    language === "en" ? "Channel" :
    language === "zh" ? "频道咨询" :
    language === "vi" ? "Kênh" :
    language === "ru" ? "Канал" :
    language === "ja" ? "チャンネル" : "카톡채널문의";

  const todayLabel = language === "ko" ? `오늘 ${visitorCount.toLocaleString()}명` : 
    language === "en" ? `Today ${visitorCount.toLocaleString()}` :
    language === "zh" ? `今日 ${visitorCount.toLocaleString()}` :
    language === "vi" ? `Hôm nay ${visitorCount.toLocaleString()}` :
    language === "ru" ? `Сегодня ${visitorCount.toLocaleString()}` :
    language === "ja" ? `今日 ${visitorCount.toLocaleString()}人` : `오늘 ${visitorCount.toLocaleString()}명`;

  const memberLabel = language === "ko" ? `회원 ${fakeMemberCount.toLocaleString()}명` :
    language === "en" ? `Members ${fakeMemberCount.toLocaleString()}` :
    language === "zh" ? `会员 ${fakeMemberCount.toLocaleString()}` :
    language === "vi" ? `Thành viên ${fakeMemberCount.toLocaleString()}` :
    language === "ru" ? `Участники ${fakeMemberCount.toLocaleString()}` :
    language === "ja" ? `会員 ${fakeMemberCount.toLocaleString()}人` : `회원 ${fakeMemberCount.toLocaleString()}명`;

  const totalLabel = language === "ko" ? `누적 ${totalVisitorCount.toLocaleString()}명` : 
    language === "en" ? `Total ${totalVisitorCount.toLocaleString()}` :
    language === "zh" ? `累计 ${totalVisitorCount.toLocaleString()}` :
    language === "vi" ? `Tổng ${totalVisitorCount.toLocaleString()}` :
    language === "ru" ? `Всего ${totalVisitorCount.toLocaleString()}` :
    language === "ja" ? `累計 ${totalVisitorCount.toLocaleString()}人` : `누적 ${totalVisitorCount.toLocaleString()}명`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-gradient-to-r from-yellow-400 to-amber-500 border-t shadow-lg">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-black whitespace-nowrap">
              {contactLabel}
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
                  {addFriendLabel}
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
                  {channelLabel}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-slate-800 py-1 px-3 flex items-center justify-between gap-1 flex-wrap">
        <span className="text-[10px] text-slate-400 flex items-center gap-1" data-testid="text-visitor-today">
          <Eye className="w-3 h-3" />
          {todayLabel}
        </span>
        <span className="text-[10px] text-cyan-400 flex items-center gap-1" data-testid="text-member-count">
          <Users className="w-3 h-3" />
          {memberLabel}
        </span>
        {isAdmin && (
          <span className="text-[10px] text-green-400 flex items-center gap-1" data-testid="text-real-counts">
            실제: {realVisitorCount.toLocaleString()} / {realTotalVisitorCount.toLocaleString()} | 회원: {realMemberCount.toLocaleString()}명
          </span>
        )}
        <span className="text-[10px] text-slate-400 flex items-center gap-1" data-testid="text-visitor-total">
          {totalLabel}
        </span>
      </div>
    </div>
  );
}
