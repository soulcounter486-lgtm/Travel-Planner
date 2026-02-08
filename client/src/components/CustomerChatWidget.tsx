import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Send, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import type { CustomerChatMessage } from "@shared/schema";

function getVisitorId(): string {
  let id = localStorage.getItem("customer_chat_visitor_id");
  if (!id) {
    id = "visitor_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem("customer_chat_visitor_id", id);
  }
  return id;
}

export function CustomerChatWidget() {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<CustomerChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [roomId, setRoomId] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const visitorId = isAuthenticated && user ? user.id : getVisitorId();
  const visitorName = isAuthenticated && user ? (user.nickname || user.firstName || "사용자") : "방문자";

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, []);

  const fetchMessages = useCallback(async (rId: number) => {
    try {
      const res = await fetch(`/api/customer-chat/room/${rId}/messages?visitorId=${encodeURIComponent(visitorId)}`);
      if (!res.ok) return;
      const msgs = await res.json();
      setMessages((prev) => {
        if (JSON.stringify(prev.map(m => m.id)) === JSON.stringify(msgs.map((m: any) => m.id))) return prev;
        return msgs;
      });
    } catch {}
  }, [visitorId]);

  useEffect(() => {
    if (isOpen && roomId) {
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
  }, [isOpen, roomId, fetchMessages]);

  const openChat = async () => {
    setIsOpen(true);
    setUnread(0);

    if (!roomId) {
      try {
        const res = await fetch("/api/customer-chat/room", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ visitorId, visitorName }),
        });
        const room = await res.json();
        setRoomId(room.id);

        const msgRes = await fetch(`/api/customer-chat/room/${room.id}/messages?visitorId=${encodeURIComponent(visitorId)}`);
        const msgs = await msgRes.json();
        setMessages(msgs);
        scrollToBottom();
      } catch (err) {
        console.error("채팅방 생성 오류:", err);
      }
    } else {
      scrollToBottom();
    }

    setTimeout(() => inputRef.current?.focus(), 200);
  };

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
      }
    } catch (err) {
      console.error("메시지 전송 오류:", err);
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

  if (isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-[9999]" data-testid="customer-chat-widget">
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
                onClick={() => setIsOpen(false)}
                data-testid="btn-minimize-chat"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-primary-foreground hover:text-primary-foreground/80 no-default-hover-elevate"
                onClick={() => { setIsOpen(false); }}
                data-testid="btn-close-chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-muted/30">
            {messages.length === 0 && (
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
              className="flex-1 h-9 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              data-testid="input-chat-message"
            />
            <Button
              size="icon"
              onClick={sendMessage}
              disabled={!input.trim() || isSending}
              data-testid="btn-send-chat"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999]" data-testid="customer-chat-widget">
      <Button
        size="lg"
        className="h-14 w-14 rounded-full shadow-lg relative"
        onClick={openChat}
        data-testid="btn-open-chat"
      >
        <MessageCircle className="h-6 w-6" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {unread}
          </span>
        )}
      </Button>
    </div>
  );
}
