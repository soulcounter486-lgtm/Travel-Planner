import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Send, Minimize2, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useAuth } from "@/hooks/use-auth";
import type { CustomerChatMessage } from "@shared/schema";

interface CustomerChatWindowProps {
  onClose: () => void;
}

export function CustomerChatWindow({ onClose }: CustomerChatWindowProps) {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<CustomerChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [roomId, setRoomId] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const visitorId = user?.id || "";
  const visitorName = user?.nickname || user?.firstName || "사용자";

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, []);

  const fetchMessages = useCallback(async (rId: number) => {
    try {
      const res = await fetch(`/api/customer-chat/room/${rId}/messages?visitorId=${encodeURIComponent(visitorId)}`, {
        credentials: "include",
      });
      if (!res.ok) return;
      const msgs = await res.json();
      setMessages((prev) => {
        if (JSON.stringify(prev.map(m => m.id)) === JSON.stringify(msgs.map((m: any) => m.id))) return prev;
        return msgs;
      });
    } catch {}
  }, [visitorId]);

  const initRoom = useCallback(async () => {
    if (!isAuthenticated || !visitorId) {
      setError("로그인이 필요합니다. 다시 로그인해주세요.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/customer-chat/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ visitorId, visitorName }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error("[CHAT] 채팅방 생성 실패:", res.status, errData);
        setError("채팅 연결에 실패했습니다. 다시 시도해주세요.");
        setIsLoading(false);
        return;
      }
      const room = await res.json();
      setRoomId(room.id);

      const msgRes = await fetch(`/api/customer-chat/room/${room.id}/messages?visitorId=${encodeURIComponent(visitorId)}`, {
        credentials: "include",
      });
      if (msgRes.ok) {
        const msgs = await msgRes.json();
        setMessages(msgs);
      }
      scrollToBottom();
    } catch (err) {
      console.error("[CHAT] 채팅방 연결 오류:", err);
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, visitorId, visitorName, scrollToBottom]);

  useEffect(() => {
    initRoom();
  }, [initRoom]);

  useEffect(() => {
    if (roomId) {
      pollIntervalRef.current = setInterval(() => {
        fetchMessages(roomId);
      }, 3000);
    }
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [roomId, fetchMessages]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || !roomId || isSending) return;

    const msgText = input.trim();
    setInput("");
    setIsSending(true);

    try {
      const res = await fetch(`/api/customer-chat/room/${roomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ visitorId, message: msgText, senderName: visitorName }),
      });
      if (res.ok) {
        const saved = await res.json();
        setMessages((prev) => {
          const exists = prev.some(m => m.id === saved.id);
          if (exists) return prev;
          return [...prev, saved];
        });
        scrollToBottom();
      } else {
        setInput(msgText);
      }
    } catch (err) {
      console.error("메시지 전송 오류:", err);
      setInput(msgText);
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

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="fixed bottom-14 right-2 z-[9999]" data-testid="customer-chat-widget">
      <Card className="w-80 sm:w-96 h-[480px] flex flex-col overflow-hidden shadow-lg">
        <div className="flex items-center justify-between gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-t-md">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <span className="font-semibold text-sm">고객센터</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-primary-foreground hover:text-primary-foreground/80 no-default-hover-elevate"
              onClick={onClose}
              data-testid="btn-minimize-chat"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-primary-foreground hover:text-primary-foreground/80 no-default-hover-elevate"
              onClick={onClose}
              data-testid="btn-close-chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-muted/30">
          {isLoading && (
            <div className="text-center text-sm text-muted-foreground py-8">
              <p>연결 중...</p>
            </div>
          )}
          {error && (
            <div className="text-center py-8">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-destructive opacity-70" />
              <p className="text-sm text-destructive">{error}</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={initRoom}
                data-testid="btn-retry-chat"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                다시 시도
              </Button>
            </div>
          )}
          {!isLoading && !error && messages.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>안녕하세요! 무엇을 도와드릴까요?</p>
              <p className="text-xs mt-1">메시지를 보내주시면 빠르게 답변드리겠습니다.</p>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderRole === "customer" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                  msg.senderRole === "customer"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border text-card-foreground"
                }`}
              >
                {msg.senderRole === "admin" && (
                  <p className="text-xs font-medium mb-0.5 opacity-70">관리자</p>
                )}
                <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                <p className={`text-[10px] mt-1 ${msg.senderRole === "customer" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {formatTime(msg.createdAt as unknown as string)}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex items-center gap-2 p-3 border-t bg-background">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요..."
            disabled={!roomId || !!error}
            className="flex-1 h-9 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            data-testid="input-chat-message"
          />
          <Button
            size="icon"
            onClick={sendMessage}
            disabled={!input.trim() || isSending || !roomId || !!error}
            data-testid="btn-send-chat"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
