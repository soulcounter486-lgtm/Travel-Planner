import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/lib/i18n";
import { 
  Calculator,
  Eye,
  Wallet,
  MessageCircle,
  Sparkles,
  Send,
  Users,
  LogIn,
  LogOut,
  Bell,
  BellOff,
  FileText,
  ShoppingBag,
  MapPin,
  Navigation,
  Map,
  Clock,
  ExternalLink
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { AppHeader } from "@/components/AppHeader";
import { TabNavigation } from "@/components/TabNavigation";
import { FixedBottomBar } from "@/components/FixedBottomBar";
import { useAuth } from "@/hooks/use-auth";
import type { UserLocation } from "@shared/schema";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface ChatMessage {
  type: string;
  nickname: string;
  message: string;
  timestamp: string;
}

export default function ChatRoom() {
  const { language, t } = useLanguage();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isAdmin } = useAuth();
  
  const { data: locations = [] } = useQuery<UserLocation[]>({
    queryKey: ["/api/locations"],
    refetchInterval: 30000,
  });
  
  const [nickname, setNickname] = useState(() => {
    if (user?.nickname) return user.nickname;
    return localStorage.getItem("chat_nickname") || "";
  });
  const [isJoined, setIsJoined] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isShareingLocation, setIsSharingLocation] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savedNicknameRef = useRef<string>(localStorage.getItem("chat_nickname") || "");
  const miniMapRef = useRef<L.Map | null>(null);
  const miniMapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted") {
      setNotificationsEnabled(true);
    }
  }, []);

  useEffect(() => {
    if (user?.nickname && !nickname) {
      setNickname(user.nickname);
    }
  }, [user?.nickname]);

  // Auto-join if nickname is saved and user is authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    const savedNick = localStorage.getItem("chat_nickname");
    if (savedNick && !isJoined) {
      savedNicknameRef.current = savedNick;
      setIsJoined(true);
      connectWebSocket(savedNick);
    }
  }, [isAuthenticated]);

  // Initialize mini map
  useEffect(() => {
    if (!miniMapContainerRef.current || !isJoined) return;
    
    // Small delay to ensure container is rendered
    const timer = setTimeout(() => {
      if (!miniMapContainerRef.current) return;
      
      if (!miniMapRef.current) {
        const defaultCenter: L.LatLngExpression = [10.3460, 107.0843];
        miniMapRef.current = L.map(miniMapContainerRef.current, {
          zoomControl: false,
          attributionControl: false,
        }).setView(defaultCenter, 13);
        
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
        }).addTo(miniMapRef.current);
      }
      
      // Invalidate size to fix rendering issues
      miniMapRef.current?.invalidateSize();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (miniMapRef.current) {
        miniMapRef.current.remove();
        miniMapRef.current = null;
      }
    };
  }, [isJoined]);

  // Update mini map markers
  useEffect(() => {
    const updateMarkers = () => {
      if (!miniMapRef.current) return;

      // Clear existing markers
      miniMapRef.current.eachLayer((layer) => {
        if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
          miniMapRef.current?.removeLayer(layer);
        }
      });

      // Add markers for each location
      locations.forEach((loc) => {
        const isMe = loc.nickname === nickname;
        const lat = parseFloat(loc.latitude);
        const lng = parseFloat(loc.longitude);

        L.circleMarker([lat, lng], {
          radius: isMe ? 10 : 8,
          fillColor: isMe ? "#22c55e" : "#3b82f6",
          fillOpacity: 1,
          color: "#ffffff",
          weight: 2,
        }).bindPopup(`<b>${loc.nickname}</b>${loc.message ? `<br/>${loc.message}` : ""}`).addTo(miniMapRef.current!);
      });

      // Fit bounds
      if (locations.length > 0) {
        const bounds = L.latLngBounds(
          locations.map((loc) => [parseFloat(loc.latitude), parseFloat(loc.longitude)] as L.LatLngTuple)
        );
        if (locations.length > 1) {
          miniMapRef.current.fitBounds(bounds, { padding: [20, 20] });
        } else {
          miniMapRef.current.setView([parseFloat(locations[0].latitude), parseFloat(locations[0].longitude)], 14);
        }
      }
      
      miniMapRef.current.invalidateSize();
    };

    // Delay to ensure map is initialized
    const timer = setTimeout(updateMarkers, 200);
    return () => clearTimeout(timer);
  }, [locations, nickname, isJoined]);

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === "granted");
    }
  };

  const sendNotification = (title: string, body: string) => {
    if (notificationsEnabled && document.hidden) {
      new Notification(title, { body, icon: "/favicon.ico" });
    }
  };

  const chatLabels: Record<string, Record<string, string>> = {
    ko: {
      title: "단체 채팅방",
      subtitle: "붕따우 여행자들과 실시간으로 대화하세요",
      nickname: "별명을 입력하세요",
      join: "채팅 참여하기",
      placeholder: "메시지를 입력하세요...",
      send: "전송",
      online: "온라인",
      connecting: "연결 중...",
    },
    en: {
      title: "Group Chat",
      subtitle: "Chat with Vung Tau travelers in real-time",
      nickname: "Enter your nickname",
      join: "Join Chat",
      placeholder: "Type a message...",
      send: "Send",
      online: "Online",
      connecting: "Connecting...",
    },
    zh: {
      title: "群聊",
      subtitle: "与头顿旅行者实时聊天",
      nickname: "输入您的昵称",
      join: "加入聊天",
      placeholder: "输入消息...",
      send: "发送",
      online: "在线",
      connecting: "连接中...",
    },
    vi: {
      title: "Phòng Chat",
      subtitle: "Trò chuyện với du khách Vũng Tàu",
      nickname: "Nhập biệt danh",
      join: "Tham gia",
      placeholder: "Nhập tin nhắn...",
      send: "Gửi",
      online: "Trực tuyến",
      connecting: "Đang kết nối...",
    },
    ru: {
      title: "Групповой чат",
      subtitle: "Общайтесь с путешественниками Вунгтау",
      nickname: "Введите ник",
      join: "Присоединиться",
      placeholder: "Введите сообщение...",
      send: "Отправить",
      online: "Онлайн",
      connecting: "Подключение...",
    },
    ja: {
      title: "グループチャット",
      subtitle: "ブンタウ旅行者とリアルタイムで会話",
      nickname: "ニックネームを入力",
      join: "参加する",
      placeholder: "メッセージを入力...",
      send: "送信",
      online: "オンライン",
      connecting: "接続中...",
    },
  };

  const labels = chatLabels[language] || chatLabels.ko;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const connectWebSocket = (nick?: string) => {
    const useNickname = nick || savedNicknameRef.current;
    if (!useNickname) return;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/chat`);

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({ type: "join", nickname: useNickname }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === "history") {
        // 시스템 메시지 필터링
        const filteredMessages = data.messages.filter((m: ChatMessage) => m.type !== "system");
        setMessages(filteredMessages);
      } else if (data.type === "users") {
        setOnlineUsers(data.users);
      } else if (data.type === "user_joined") {
        // 관리자에게만 새 사용자 입장 알림
        if (isAdmin && data.nickname !== savedNicknameRef.current) {
          sendNotification("채팅방 입장", `${data.nickname}님이 입장했습니다`);
        }
      } else if (data.type === "message") {
        setMessages((prev) => [...prev, data]);
        if (data.nickname !== savedNicknameRef.current) {
          sendNotification(data.nickname, data.message);
        }
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      if (savedNicknameRef.current && isJoined) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 2000);
      }
    };

    ws.onerror = () => {
      setIsConnected(false);
    };

    wsRef.current = ws;
  };

  const handleJoin = () => {
    if (nickname.trim()) {
      const trimmedNick = nickname.trim();
      savedNicknameRef.current = trimmedNick;
      localStorage.setItem("chat_nickname", trimmedNick);
      setIsJoined(true);
      connectWebSocket(trimmedNick);
    }
  };

  const handleLeave = () => {
    localStorage.removeItem("chat_nickname");
    savedNicknameRef.current = "";
    if (wsRef.current) {
      wsRef.current.close();
    }
    setIsJoined(false);
    setMessages([]);
    setOnlineUsers([]);
    setNickname("");
  };

  const handleSend = () => {
    if (!message.trim()) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "message", message: message.trim() }));
      setMessage("");
    } else {
      connectWebSocket();
    }
  };

  const handleShareLocation = async () => {
    if (!navigator.geolocation) {
      alert(language === "ko" ? "위치 서비스를 지원하지 않는 브라우저입니다." : "Geolocation is not supported by your browser.");
      return;
    }
    
    setIsSharingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          await apiRequest("POST", "/api/locations", {
            nickname: savedNicknameRef.current,
            latitude,
            longitude,
            message: language === "ko" ? "현재 여기 있어요!" : "I'm here now!",
          });
          
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            const locationMsg = language === "ko" 
              ? `📍 내 위치를 공유했어요! 위치 지도에서 확인하세요.`
              : `📍 I shared my location! Check it on the location map.`;
            wsRef.current.send(JSON.stringify({ type: "message", message: locationMsg }));
          }
        } catch (error) {
          console.error("Failed to share location:", error);
          alert(language === "ko" ? "위치 공유에 실패했습니다." : "Failed to share location.");
        } finally {
          setIsSharingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsSharingLocation(false);
        alert(language === "ko" ? "위치를 가져올 수 없습니다. 위치 권한을 확인해주세요." : "Could not get your location. Please check location permissions.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isJoined) {
        handleJoin();
      } else {
        handleSend();
      }
    }
  };

  useEffect(() => {
    return () => {
      savedNicknameRef.current = "";
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(language === "ko" ? "ko-KR" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <AppHeader />
      <TabNavigation language={language} />

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent flex items-center justify-center gap-2">
            <MessageCircle className="w-8 h-8 text-primary" />
            {labels.title}
          </h1>
          <p className="text-muted-foreground mt-2">{labels.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <Card className="lg:col-span-3">
            <CardContent className="p-0">
              {!isAuthenticated ? (
                <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-sm space-y-4 text-center"
                  >
                    <div className="w-20 h-20 bg-gradient-to-r from-primary to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <LogIn className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-xl font-semibold">
                      {language === "ko" ? "로그인이 필요합니다" : "Login Required"}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {language === "ko" ? "단체 채팅방은 로그인 후 이용 가능합니다." : "Please log in to join the group chat."}
                    </p>
                    <Button
                      onClick={() => window.location.href = "/"}
                      className="w-full bg-gradient-to-r from-primary to-purple-600"
                      data-testid="btn-login-for-chat"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      {language === "ko" ? "로그인하기" : "Log In"}
                    </Button>
                  </motion.div>
                </div>
              ) : !isJoined ? (
                <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-sm space-y-4"
                  >
                    <div className="text-center mb-6">
                      <div className="w-20 h-20 bg-gradient-to-r from-primary to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LogIn className="w-10 h-10 text-white" />
                      </div>
                      <h2 className="text-xl font-semibold">{labels.nickname}</h2>
                    </div>
                    <Input
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder={labels.nickname}
                      className="text-center text-lg"
                      maxLength={20}
                      data-testid="input-nickname"
                    />
                    <Button
                      onClick={handleJoin}
                      disabled={!nickname.trim()}
                      className="w-full bg-gradient-to-r from-primary to-purple-600"
                      data-testid="btn-join-chat"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      {labels.join}
                    </Button>
                  </motion.div>
                </div>
              ) : (
                <div className="flex flex-col h-[500px]">
                  <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
                    <span className="text-sm font-medium">{savedNicknameRef.current}</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={requestNotificationPermission}
                        className="gap-1"
                        data-testid="btn-toggle-notifications"
                      >
                        {notificationsEnabled ? (
                          <Bell className="w-4 h-4 text-green-500" />
                        ) : (
                          <BellOff className="w-4 h-4 text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLeave}
                        className="gap-1 text-red-500 hover:text-red-600"
                        data-testid="btn-leave-chat"
                      >
                        <LogOut className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 space-y-3"
                  >
                    <AnimatePresence>
                      {messages.map((msg, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${msg.nickname === nickname ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              msg.nickname === nickname
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            {msg.nickname !== nickname && (
                              <p className="text-xs font-semibold mb-1 opacity-70">
                                {msg.nickname}
                              </p>
                            )}
                            <p className="text-sm break-words">{msg.message}</p>
                            <p className="text-xs opacity-50 mt-1 text-right">
                              {formatTime(msg.timestamp)}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                  <div className="p-4 border-t flex gap-2">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder={isConnected ? labels.placeholder : (language === "ko" ? "연결 중..." : "Connecting...")}
                      className="flex-1"
                      data-testid="input-message"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleShareLocation}
                      disabled={isShareingLocation}
                      title={language === "ko" ? "내 위치 공유" : "Share my location"}
                      data-testid="btn-share-location"
                    >
                      {isShareingLocation ? (
                        <div className="w-4 h-4 border-2 border-t-transparent border-primary rounded-full animate-spin" />
                      ) : (
                        <MapPin className="w-4 h-4" />
                      )}
                    </Button>
                    <Link href="/locations">
                      <Button
                        variant="outline"
                        size="icon"
                        title={language === "ko" ? "위치 지도 보기" : "View location map"}
                        data-testid="btn-view-map"
                      >
                        <Map className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      onClick={handleSend}
                      disabled={!message.trim()}
                      data-testid="btn-send-message"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4" />
                {labels.online} ({onlineUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <ScrollArea className="h-[100px]">
                <div className="space-y-1">
                  {onlineUsers.map((user, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-1.5 rounded bg-muted/50 text-xs"
                    >
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="truncate">{user}</span>
                      {user === nickname && (
                        <Badge variant="outline" className="text-[10px] ml-auto h-4">
                          You
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {isJoined && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {language === "ko" ? "위치 공유" : "Locations"} ({locations.length})
                  </span>
                  <Link href="/locations">
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      {language === "ko" ? "전체보기" : "View All"}
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div 
                  ref={miniMapContainerRef}
                  className="w-full h-[250px] rounded-lg z-0 border"
                  style={{ minHeight: "250px" }}
                />
                {locations.length > 0 ? (
                  <ScrollArea className="h-[150px]">
                    <div className="space-y-1.5">
                      {locations.map((loc) => (
                        <div
                          key={loc.id}
                          className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                            loc.nickname === nickname ? "bg-green-500/10 border border-green-500/30" : "bg-muted/50"
                          }`}
                        >
                          <div 
                            className={`w-2 h-2 rounded-full ${
                              loc.nickname === nickname ? "bg-green-500" : "bg-blue-500"
                            }`} 
                          />
                          <span className="font-medium truncate flex-1">{loc.nickname}</span>
                          {loc.message && (
                            <span className="text-muted-foreground truncate max-w-[80px]">{loc.message}</span>
                          )}
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {(() => {
                              const diff = new Date(loc.expiresAt).getTime() - Date.now();
                              const hours = Math.floor(diff / (1000 * 60 * 60));
                              return `${hours}h`;
                            })()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center text-muted-foreground text-xs py-4">
                    <MapPin className="w-6 h-6 mx-auto mb-1 opacity-50" />
                    {language === "ko" ? "공유된 위치 없음" : "No shared locations"}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <FixedBottomBar />
    </div>
  );
}
