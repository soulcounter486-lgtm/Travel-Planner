import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, X, ArrowLeft, RefreshCw } from "lucide-react";
import type { CustomerChatRoom, CustomerChatMessage } from "@shared/schema";
import { apiRequest, queryClient as qc } from "@/lib/queryClient";

export default function AdminChat() {
  const { user, isAdmin, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [messages, setMessages] = useState<CustomerChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: rooms = [], isLoading } = useQuery<CustomerChatRoom[]>({
    queryKey: ["/api/admin/customer-chat/rooms"],
    enabled: isAdmin,
    refetchInterval: 5000,
  });

  const userId = user?.id || "";

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, []);

  const fetchMessages = useCallback(async (rId: number) => {
    try {
      const res = await fetch(`/api/customer-chat/room/${rId}/messages`, { credentials: "include" });
      if (!res.ok) return;
      const msgs = await res.json();
      setMessages((prev) => {
        if (JSON.stringify(prev.map(m => m.id)) === JSON.stringify(msgs.map((m: any) => m.id))) return prev;
        return msgs;
      });
    } catch {}
  }, []);

  useEffect(() => {
    if (selectedRoomId) {
      pollIntervalRef.current = setInterval(() => {
        fetchMessages(selectedRoomId);
      }, 3000);
    }
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [selectedRoomId, fetchMessages]);

  const selectRoom = async (roomId: number) => {
    setSelectedRoomId(roomId);
    try {
      const res = await fetch(`/api/customer-chat/room/${roomId}/messages`, { credentials: "include" });
      const msgs = await res.json();
      setMessages(msgs);
      scrollToBottom();
    } catch (err) {
      console.error("메시지 로드 실패:", err);
    }
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  const sendMessage = async () => {
    if (!input.trim() || !selectedRoomId || isSending) return;

    const msgText = input.trim();
    setInput("");
    setIsSending(true);

    try {
      const res = await fetch(`/api/customer-chat/room/${selectedRoomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: msgText }),
      });
      if (res.ok) {
        const saved = await res.json();
        setMessages((prev) => {
          const exists = prev.some(m => m.id === saved.id);
          if (exists) return prev;
          return [...prev, saved];
        });
        scrollToBottom();
        queryClient.invalidateQueries({ queryKey: ["/api/admin/customer-chat/rooms"] });
      }
    } catch (err) {
      console.error("메시지 전송 실패:", err);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const closeRoom = async (roomId: number) => {
    try {
      await apiRequest("PATCH", `/api/admin/customer-chat/rooms/${roomId}/close`);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customer-chat/rooms"] });
      if (selectedRoomId === roomId) {
        setSelectedRoomId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error("채팅방 닫기 실패:", err);
    }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "방금";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
    if (diff < 86400000) return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  };

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">관리자 권한이 필요합니다</p>
        </div>
      </div>
    );
  }

  const openRooms = rooms.filter(r => r.status === "open");
  const closedRooms = rooms.filter(r => r.status === "closed");

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center gap-3 mb-4">
          <MessageCircle className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">고객센터 채팅</h1>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/customer-chat/rooms"] })}
            data-testid="btn-refresh-rooms"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-4 h-[calc(100vh-180px)]">
          <Card className={`w-full md:w-80 md:flex-shrink-0 flex flex-col overflow-hidden ${selectedRoomId ? "hidden md:flex" : "flex"}`}>
            <div className="p-3 border-b">
              <h2 className="font-semibold text-sm">
                대화 목록 ({openRooms.length})
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {isLoading && <p className="p-4 text-sm text-muted-foreground">로딩 중...</p>}
              {openRooms.length === 0 && !isLoading && (
                <p className="p-4 text-sm text-muted-foreground text-center">진행 중인 대화가 없습니다</p>
              )}
              {openRooms.map((room) => (
                <div
                  key={room.id}
                  className={`p-3 border-b cursor-pointer hover-elevate ${selectedRoomId === room.id ? "bg-primary/10" : ""}`}
                  onClick={() => selectRoom(room.id)}
                  data-testid={`chat-room-${room.id}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm truncate">{room.visitorName}</span>
                    <div className="flex items-center gap-1">
                      {(room.unreadByAdmin ?? 0) > 0 && (
                        <Badge variant="destructive" className="text-[10px] h-5 min-w-5 flex items-center justify-center">
                          {room.unreadByAdmin}
                        </Badge>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={(e) => { e.stopPropagation(); closeRoom(room.id); }}
                        data-testid={`btn-close-room-${room.id}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {room.lastMessage && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">{room.lastMessage}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatTime(room.lastMessageAt as unknown as string)}
                  </p>
                </div>
              ))}
              {closedRooms.length > 0 && (
                <>
                  <div className="p-3 border-b bg-muted/50">
                    <h3 className="text-xs font-medium text-muted-foreground">종료된 대화 ({closedRooms.length})</h3>
                  </div>
                  {closedRooms.slice(0, 10).map((room) => (
                    <div
                      key={room.id}
                      className="p-3 border-b opacity-60 cursor-pointer hover-elevate"
                      onClick={() => selectRoom(room.id)}
                      data-testid={`chat-room-closed-${room.id}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm truncate">{room.visitorName}</span>
                        <Badge variant="secondary" className="text-[10px]">종료</Badge>
                      </div>
                      {room.lastMessage && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">{room.lastMessage}</p>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          </Card>

          <Card className={`flex-1 flex flex-col overflow-hidden ${!selectedRoomId ? "hidden md:flex" : "flex"}`}>
            {!selectedRoomId ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">왼쪽에서 대화를 선택하세요</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 p-3 border-b">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => { setSelectedRoomId(null); setMessages([]); }}
                    data-testid="btn-back-to-rooms"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-semibold text-sm">
                    {rooms.find(r => r.id === selectedRoomId)?.visitorName || "방문자"}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderRole === "admin" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                          msg.senderRole === "admin"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                        <p className={`text-[10px] mt-1 ${msg.senderRole === "admin" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                          {formatTime(msg.createdAt as unknown as string)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="flex items-center gap-2 p-3 border-t">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="답변을 입력하세요..."
                    className="flex-1 h-9 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    data-testid="input-admin-chat-message"
                  />
                  <Button
                    size="icon"
                    onClick={sendMessage}
                    disabled={!input.trim() || isSending}
                    data-testid="btn-admin-send-chat"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
