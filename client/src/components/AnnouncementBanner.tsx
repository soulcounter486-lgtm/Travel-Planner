import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { cn } from "./lib/utils";

interface Announcement {
  id: number;
  title: string;
  content: string;
  type: string;
  linkUrl?: string;
  imageUrl?: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  sortOrder: number;
  createdAt: string;
}

export function AnnouncementBanner() {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
  });

  if (announcements.length === 0) {
    return null;
  }

  const maxVisibleLines = Math.min(announcements.length, 4);
  const lineHeight = 28;
  const maxHeight = maxVisibleLines * lineHeight;

  return (
    <>
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-b border-amber-200/50 dark:border-amber-800/50">
        <div className="container mx-auto px-4">
          <div 
            className={cn(
              "py-1",
              announcements.length > 4 && "overflow-y-auto"
            )}
            style={{ maxHeight: announcements.length > 4 ? `${maxHeight}px` : "auto" }}
          >
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                onClick={() => setSelectedAnnouncement(announcement)}
                className="flex items-center gap-2 py-0.5 cursor-pointer hover:bg-amber-100/50 dark:hover:bg-amber-800/30 rounded px-1 transition-colors"
                style={{ height: `${lineHeight}px` }}
                data-testid={`announcement-item-${announcement.id}`}
              >
                <Bell className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <span className={cn(
                  "text-xs font-medium px-1.5 py-0.5 rounded flex-shrink-0",
                  announcement.type === "notice" && "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
                  announcement.type === "event" && "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
                  announcement.type === "promotion" && "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
                  announcement.type === "urgent" && "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                )}>
                  {announcement.type === "notice" && "공지"}
                  {announcement.type === "event" && "이벤트"}
                  {announcement.type === "promotion" && "프로모션"}
                  {announcement.type === "urgent" && "긴급"}
                </span>
                <span className="text-xs text-foreground truncate flex-1">
                  {announcement.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={!!selectedAnnouncement} onOpenChange={() => setSelectedAnnouncement(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-600" />
              {selectedAnnouncement?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedAnnouncement?.imageUrl && (
              <img 
                src={selectedAnnouncement.imageUrl} 
                alt={selectedAnnouncement.title}
                className="w-full rounded-lg object-cover max-h-48"
              />
            )}
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {selectedAnnouncement?.content}
            </p>
            {selectedAnnouncement?.linkUrl && (
              <a
                href={selectedAnnouncement.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm text-primary hover:underline"
              >
                자세히 보기 →
              </a>
            )}
            <p className="text-xs text-muted-foreground">
              {selectedAnnouncement?.createdAt && new Date(selectedAnnouncement.createdAt).toLocaleDateString("ko-KR")}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
