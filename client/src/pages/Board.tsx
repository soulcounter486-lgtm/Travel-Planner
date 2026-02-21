import { useState, useRef, useEffect } from "react";
import { Link, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/i18n";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useUpload } from "@/hooks/use-upload";
import { 
  Calculator,
  Eye,
  EyeOff,
  Wallet,
  MessageCircle,
  Sparkles,
  FileText,
  Plus,
  Trash2,
  Edit,
  Send,
  ImagePlus,
  Loader2,
  Calendar,
  User,
  LogIn,
  LogOut,
  RefreshCw,
  ExternalLink,
  ShoppingBag,
  UserPlus,
  Bell,
  BellOff,
  Share2,
  Link2,
  Search,
  X
} from "lucide-react";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { SiInstagram } from "react-icons/si";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { AppHeader } from "../components/AppHeader";
import { TabNavigation } from "../components/TabNavigation";
import { FixedBottomBar } from "../components/FixedBottomBar";
import type { Post, Comment } from "@shared/schema";

// 링크 미리보기 컴포넌트
function LinkPreview({ url }: { url: string }) {
  const [metadata, setMetadata] = useState<{
    title: string;
    description: string;
    image: string | null;
    siteName: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const res = await fetch(`/api/url-metadata?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        setMetadata(data);
        setImageError(false);
      } catch (e) {
        setMetadata({ title: url, description: "", image: null, siteName: new URL(url).hostname });
      } finally {
        setLoading(false);
      }
    };
    fetchMetadata();
  }, [url]);

  if (loading) {
    return (
      <div className="border rounded-lg p-3 my-2 animate-pulse bg-muted/50">
        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-muted rounded w-1/2"></div>
      </div>
    );
  }

  if (!metadata) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block border rounded-lg overflow-hidden my-2 bg-muted/30 hover:bg-muted/50 transition-all"
      onClick={(e) => e.stopPropagation()}
    >
      {metadata.image && !imageError && (
        <div className="w-full h-40 bg-muted">
          <img
            src={metadata.image}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
          />
        </div>
      )}
      <div className="p-3">
        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
          <ExternalLink className="w-3 h-3" />
          {metadata.siteName}
        </p>
        <h4 className="font-medium text-sm line-clamp-2 break-words">{metadata.title}</h4>
        {metadata.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1 break-words">{metadata.description}</p>
        )}
      </div>
    </a>
  );
}

const boardLabels: Record<string, Record<string, string>> = {
  ko: {
    title: "게시판",
    subtitle: "붕따우 도깨비 소식 및 공지사항",
    newPost: "글쓰기",
    postTitle: "제목",
    postContent: "내용",
    publish: "발행",
    cancel: "취소",
    comments: "댓글",
    writeComment: "댓글을 입력하세요...",
    nickname: "닉네임",
    submit: "등록",
    noPosts: "아직 게시글이 없습니다",
    delete: "삭제",
    edit: "수정",
    save: "저장",
    addMedia: "첨부",
    uploading: "업로드 중...",
    admin: "관리자",
    readMore: "자세히 보기",
    login: "로그인",
    logout: "로그아웃",
  },
  en: {
    title: "Board",
    subtitle: "Vung Tau Dokkaebi News & Announcements",
    newPost: "New Post",
    postTitle: "Title",
    postContent: "Content",
    publish: "Publish",
    cancel: "Cancel",
    comments: "Comments",
    writeComment: "Write a comment...",
    nickname: "Nickname",
    submit: "Submit",
    noPosts: "No posts yet",
    delete: "Delete",
    edit: "Edit",
    save: "Save",
    addMedia: "Attach",
    uploading: "Uploading...",
    admin: "Admin",
    readMore: "Read More",
    login: "Login",
    logout: "Logout",
  },
  zh: {
    title: "公告板",
    subtitle: "头顿多凯比新闻与公告",
    newPost: "发帖",
    postTitle: "标题",
    postContent: "内容",
    publish: "发布",
    cancel: "取消",
    comments: "评论",
    writeComment: "写评论...",
    nickname: "昵称",
    submit: "提交",
    noPosts: "暂无帖子",
    delete: "删除",
    edit: "编辑",
    save: "保存",
    addMedia: "附件",
    uploading: "上传中...",
    admin: "管理员",
    readMore: "查看详情",
    login: "登录",
    logout: "登出",
  },
  vi: {
    title: "Bảng tin",
    subtitle: "Tin tức & Thông báo Vũng Tàu Dokkaebi",
    newPost: "Đăng bài",
    postTitle: "Tiêu đề",
    postContent: "Nội dung",
    publish: "Đăng",
    cancel: "Hủy",
    comments: "Bình luận",
    writeComment: "Viết bình luận...",
    nickname: "Biệt danh",
    submit: "Gửi",
    noPosts: "Chưa có bài đăng",
    delete: "Xóa",
    edit: "Sửa",
    save: "Lưu",
    addMedia: "Đính kèm",
    uploading: "Đang tải...",
    admin: "Quản trị",
    readMore: "Xem thêm",
    login: "Đăng nhập",
    logout: "Đăng xuất",
  },
  ru: {
    title: "Доска",
    subtitle: "Новости и объявления Vung Tau Dokkaebi",
    newPost: "Новый пост",
    postTitle: "Заголовок",
    postContent: "Содержание",
    publish: "Опубликовать",
    cancel: "Отмена",
    comments: "Комментарии",
    writeComment: "Напишите комментарий...",
    nickname: "Никнейм",
    submit: "Отправить",
    noPosts: "Пока нет постов",
    delete: "Удалить",
    edit: "Редактировать",
    save: "Сохранить",
    addMedia: "Прикрепить",
    uploading: "Загрузка...",
    admin: "Админ",
    readMore: "Подробнее",
    login: "Вход",
    logout: "Выход",
  },
  ja: {
    title: "掲示板",
    subtitle: "ブンタウトッケビのお知らせ",
    newPost: "投稿",
    postTitle: "タイトル",
    postContent: "内容",
    publish: "公開",
    cancel: "キャンセル",
    comments: "コメント",
    writeComment: "コメントを書く...",
    nickname: "ニックネーム",
    submit: "送信",
    noPosts: "まだ投稿がありません",
    delete: "削除",
    edit: "編集",
    save: "保存",
    addMedia: "添付",
    uploading: "アップロード中...",
    admin: "管理者",
    readMore: "詳細を見る",
    login: "ログイン",
    logout: "ログアウト",
  },
};

const navLabels: Record<string, Record<string, string>> = {
  calculator: { ko: "견적", en: "Quote", zh: "报价", vi: "Báo giá", ru: "Расчёт", ja: "見積" },
  guide: { ko: "관광", en: "Guide", zh: "指南", vi: "Hướng dẫn", ru: "Гид", ja: "ガイド" },
  expenses: { ko: "가계부", en: "Expenses", zh: "账本", vi: "Chi tiêu", ru: "Расходы", ja: "家計簿" },
  planner: { ko: "AI 플래너", en: "AI Planner", zh: "AI规划", vi: "AI Lên kế hoạch", ru: "AI Планер", ja: "AIプランナー" },
  chat: { ko: "채팅", en: "Chat", zh: "聊天", vi: "Chat", ru: "Чат", ja: "チャット" },
  board: { ko: "게시판", en: "Board", zh: "公告板", vi: "Bảng tin", ru: "Доска", ja: "掲示板" },
  diet: { ko: "쇼핑", en: "Shop", zh: "购物", vi: "Mua sắm", ru: "Магазин", ja: "ショッピング" },
};

export default function Board() {
  const { language, t } = useLanguage();
  const labels = boardLabels[language] || boardLabels.ko;
  const { toast } = useToast();
  const { isSupported, isSubscribed, isLoading: pushLoading, subscribe, unsubscribe } = usePushNotifications(false, false);
  const [matchRoute, params] = useRoute("/board/:id");
  
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showNewPostDialog, setShowNewPostDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [commentNickname, setCommentNickname] = useState(() => localStorage.getItem("comment_nickname") || "");
  const [commentContent, setCommentContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isEditUploading, setIsEditUploading] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [videoThumbnailUrl, setVideoThumbnailUrl] = useState<string | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === "/board") {
        setSelectedPost(null);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleSelectPost = async (post: Post) => {
    window.history.replaceState({ viewingPost: true, postId: post.id }, "", `/board/${post.id}`);
    setSelectedPost(post);
    
    try {
      await apiRequest("POST", `/api/posts/${post.id}/view`);
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    } catch (error) {
      console.error("Failed to increment view count:", error);
    }
  };

  const handleBackToList = () => {
    window.history.replaceState({ viewingPost: false }, "", "/board");
    setSelectedPost(null);
  };

  const saveSelection = () => {
    const selection = window.getSelection();
    const editor = editorRef.current;
    if (selection && selection.rangeCount > 0 && editor) {
      const range = selection.getRangeAt(0);
      if (editor.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
      }
    }
  };

  const captureVideoThumbnail = (videoUrl: string): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.muted = true;
      video.preload = "auto";
      video.playsInline = true;
      video.src = videoUrl;
      video.currentTime = 0.5;
      const timeout = setTimeout(() => { video.remove(); resolve(null); }, 10000);
      video.addEventListener("seeked", () => {
        clearTimeout(timeout);
        try {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth || 1280;
          canvas.height = video.videoHeight || 720;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => { video.remove(); resolve(blob); }, "image/jpeg", 0.85);
          } else { video.remove(); resolve(null); }
        } catch { video.remove(); resolve(null); }
      }, { once: true });
      video.addEventListener("error", () => { clearTimeout(timeout); video.remove(); resolve(null); });
      video.load();
    });
  };

  const uploadThumbnailBlob = async (blob: Blob): Promise<string | null> => {
    try {
      const file = new File([blob], `thumb_${Date.now()}.jpg`, { type: "image/jpeg" });
      const res = await fetch("/api/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const putRes = await fetch(data.uploadURL, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!putRes.ok) return null;
      return data.objectPath;
    } catch { return null; }
  };

  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response) => {
      const editor = editorRef.current;
      if (editor) {
        const isVideo = response.metadata.contentType?.startsWith("video/");
        let mediaEl: HTMLElement;

        if (isVideo) {
          captureVideoThumbnail(response.objectPath).then(async (blob) => {
            if (blob) {
              const thumbUrl = await uploadThumbnailBlob(blob);
              if (thumbUrl) setVideoThumbnailUrl(thumbUrl);
            }
          });
          const wrapper = document.createElement("div");
          wrapper.contentEditable = "false";
          wrapper.className = "my-2";
          wrapper.setAttribute("data-video-wrapper", "true");
          const video = document.createElement("video");
          video.src = response.objectPath;
          video.controls = true;
          video.playsInline = true;
          video.preload = "metadata";
          video.className = "max-w-full rounded-lg";
          video.style.maxHeight = "400px";
          wrapper.appendChild(video);
          mediaEl = wrapper;
        } else {
          const img = document.createElement("img");
          img.src = response.objectPath;
          img.alt = "이미지";
          img.className = "max-w-full rounded-lg my-2 inline-block";
          img.style.maxHeight = "300px";
          mediaEl = img;
        }

        const afterParagraph = document.createElement("div");
        afterParagraph.innerHTML = "<br>";
        
        editor.focus();
        
        if (savedRangeRef.current && editor.contains(savedRangeRef.current.commonAncestorContainer)) {
          const range = savedRangeRef.current;
          range.deleteContents();
          range.insertNode(afterParagraph);
          range.insertNode(mediaEl);
          range.setStart(afterParagraph, 0);
          range.collapse(true);
          
          const selection = window.getSelection();
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
          }
        } else {
          editor.appendChild(document.createElement("br"));
          editor.appendChild(mediaEl);
          editor.appendChild(afterParagraph);
        }
        
        savedRangeRef.current = null;
        updateContentFromEditor();
      }
      toast({ title: response.metadata.contentType?.startsWith("video/") ? "동영상이 삽입되었습니다" : "이미지가 삽입되었습니다" });
    },
    onError: (error) => {
      toast({ title: "파일 업로드 실패", variant: "destructive" });
    }
  });

  const updateContentFromEditor = () => {
    const editor = editorRef.current;
    if (!editor) return;
    
    const processNode = (node: ChildNode): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || "";
      } else if (node.nodeName === "IMG") {
        const img = node as HTMLImageElement;
        return `![이미지](${img.src})`;
      } else if (node.nodeName === "VIDEO") {
        const video = node as HTMLVideoElement;
        return `![video](${video.src})`;
      } else if (node instanceof HTMLElement && node.getAttribute("data-video-wrapper") === "true") {
        const video = node.querySelector("video");
        if (video) return `\n![video](${video.src})\n`;
        return "";
      } else if (node.nodeName === "DIV" || node.nodeName === "P" || node.nodeName === "BR") {
        let text = "\n";
        if (node.childNodes.length > 0) {
          node.childNodes.forEach((child) => {
            text += processNode(child);
          });
        }
        return text;
      }
      return "";
    };
    
    let content = "";
    editor.childNodes.forEach((node) => {
      content += processNode(node);
    });
    setNewPostContent(content);
  };

  const { data: posts = [], isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
  });

  const { data: adminCheck } = useQuery<{ isAdmin: boolean; isLoggedIn: boolean; userId?: string }>({
    queryKey: ["/api/admin/check"],
    retry: false,
  });

  const isAdmin = adminCheck?.isAdmin || false;
  const isLoggedIn = adminCheck?.isLoggedIn || false;

  useEffect(() => {
    if (matchRoute && params?.id && posts.length > 0) {
      const postId = parseInt(params.id);
      if (selectedPost?.id !== postId) {
        const post = posts.find((p) => p.id === postId);
        if (post) {
          setSelectedPost(post);
          apiRequest("POST", `/api/posts/${post.id}/view`).catch(() => {});
        }
      }
    }
  }, [matchRoute, params?.id, posts]);

  const { data: postComments = [], isLoading: commentsLoading } = useQuery<Comment[]>({
    queryKey: ["/api/posts", selectedPost?.id, "comments"],
    enabled: !!selectedPost,
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; imageUrl?: string }) => {
      const res = await apiRequest("POST", "/api/posts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setShowNewPostDialog(false);
      setNewPostTitle("");
      setNewPostContent("");
      setVideoThumbnailUrl(null);
      if (editorRef.current) {
        editorRef.current.innerHTML = "";
      }
      toast({ title: "게시글이 등록되었습니다" });
    },
    onError: (error: any) => {
      toast({ title: error.message || "게시글 등록 실패", variant: "destructive" });
    }
  });

  const deletePostMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/posts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setSelectedPost(null);
      toast({ title: "게시글이 삭제되었습니다" });
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: async (data: { id: number; title: string; content: string }) => {
      const res = await apiRequest("PUT", `/api/posts/${data.id}`, { title: data.title, content: data.content });
      return res.json();
    },
    onSuccess: (updatedPost) => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setSelectedPost(updatedPost);
      setIsEditing(false);
      setEditTitle("");
      setEditContent("");
      toast({ title: "게시글이 수정되었습니다" });
    },
    onError: (error: any) => {
      toast({ title: error.message || "게시글 수정 실패", variant: "destructive" });
    },
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/posts/${id}/toggle-visibility`);
      return res.json();
    },
    onSuccess: (updatedPost) => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setSelectedPost(updatedPost);
      toast({ title: updatedPost.isHidden ? "게시글이 숨겨졌습니다" : "게시글이 공개되었습니다" });
    },
    onError: (error: any) => {
      toast({ title: error.message || "게시글 상태 변경 실패", variant: "destructive" });
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async (data: { postId: number; authorName: string; content: string }) => {
      const res = await apiRequest("POST", `/api/posts/${data.postId}/comments`, { 
        authorName: data.authorName, 
        content: data.content 
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", selectedPost?.id, "comments"] });
      localStorage.setItem("comment_nickname", commentNickname);
      setCommentContent("");
      toast({ title: "댓글이 등록되었습니다" });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/comments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", selectedPost?.id, "comments"] });
      toast({ title: "댓글이 삭제되었습니다" });
    },
  });

  const instagramSyncMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/instagram/sync");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({ title: data.message || "인스타그램 동기화 완료" });
    },
    onError: (error: any) => {
      toast({ title: error.message || "인스타그램 동기화 실패", variant: "destructive" });
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      await uploadFile(files[i]);
    }
    e.target.value = "";
  };

  const handleEditFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsEditUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await fetch("/api/uploads/request-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type || "application/octet-stream" }),
        });
        if (!res.ok) { toast({ title: "업로드 실패", variant: "destructive" }); continue; }
        const data = await res.json();
        const putRes = await fetch(data.uploadURL, { method: "PUT", body: file, headers: { "Content-Type": file.type || "application/octet-stream" } });
        if (!putRes.ok) { toast({ title: "업로드 실패", variant: "destructive" }); continue; }
        const isVideo = file.type.startsWith("video/");
        const mdTag = isVideo ? `\n![동영상](${data.objectPath})\n` : `\n![이미지](${data.objectPath})\n`;
        setEditContent(prev => prev + mdTag);
        toast({ title: isVideo ? "동영상이 삽입되었습니다" : "이미지가 삽입되었습니다" });
      }
    } catch {
      toast({ title: "파일 업로드 실패", variant: "destructive" });
    } finally {
      setIsEditUploading(false);
      if (editFileInputRef.current) editFileInputRef.current.value = "";
    }
  };

  const renderTextWithLinks = (text: string, keyPrefix: string) => {
    const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/g;
    const parts = text.split(urlRegex);
    const urls: string[] = [];
    
    const result = parts.map((part, idx) => {
      if (urlRegex.test(part)) {
        urlRegex.lastIndex = 0;
        urls.push(part);
        return (
          <a
            key={`${keyPrefix}-link-${idx}`}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return <span key={`${keyPrefix}-text-${idx}`}>{part}</span>;
    });

    return { elements: result, urls };
  };

  const renderContentWithImages = (content: string) => {
    const parts = content.split(/!\[([^\]]*)\]\(([^)]+)\)/g);
    const result: React.ReactNode[] = [];
    const allUrls: string[] = [];
    
    for (let i = 0; i < parts.length; i++) {
      if (i % 3 === 0) {
        if (parts[i]) {
          const { elements, urls } = renderTextWithLinks(parts[i], `part-${i}`);
          result.push(<span key={i} className="break-words">{elements}</span>);
          allUrls.push(...urls);
        }
      } else if (i % 3 === 2) {
        const alt = parts[i-1] || "";
        const src = parts[i];
        const isVideo = alt === "동영상" || alt === "video" || /\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(src);
        if (isVideo) {
          result.push(
            <video
              key={i}
              src={src}
              controls
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              className="w-full max-w-full rounded-lg my-4"
              style={{ maxHeight: "500px" }}
              data-testid={`video-content-${i}`}
              onPlay={(e) => {
                const v = e.currentTarget;
                if (v.muted) {
                  v.muted = false;
                  v.play().catch(() => { v.muted = true; });
                }
              }}
            />
          );
        } else {
          result.push(
            <img 
              key={i} 
              src={src} 
              alt={alt || "이미지"} 
              className="w-full max-w-full h-auto rounded-lg my-4 object-contain"
            />
          );
        }
      }
    }

    const currentHost = window.location.hostname;
    const filteredUrls = allUrls.filter(u => {
      try { return new URL(u).hostname !== currentHost && !u.includes("vungtau.blog"); } catch { return true; }
    });
    const uniqueUrls = Array.from(new Set(filteredUrls)).slice(0, 3);
    if (uniqueUrls.length > 0) {
      result.push(
        <div key="link-previews" className="mt-4 space-y-2">
          {uniqueUrls.map((url, idx) => (
            <LinkPreview key={`preview-${idx}`} url={url} />
          ))}
        </div>
      );
    }

    return result;
  };

  const getFirstMediaFromContent = (content: string): { src: string; isVideo: boolean } | null => {
    const match = content.match(/!\[([^\]]*)\]\(([^)]+)\)/);
    if (!match) return null;
    const alt = match[1];
    const src = match[2];
    const isVideo = alt === "동영상" || alt === "video" || /\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(src);
    return { src, isVideo };
  };
  const getFirstImageFromContent = (content: string): string | null => {
    const media = getFirstMediaFromContent(content);
    return media ? media.src : null;
  };

  const getTextWithoutImages = (content: string): string => {
    return content.replace(/!\[[^\]]*\]\([^)]+\)/g, "").trim();
  };

  const getFirstUrlFromContent = (content: string): string | null => {
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g;
    const matches = content.match(urlRegex);
    if (!matches) return null;
    const currentHost = window.location.hostname;
    return matches.find(u => {
      try { return new URL(u).hostname !== currentHost && !u.includes("vungtau.blog"); } catch { return true; }
    }) || null;
  };

  const handleCreatePost = () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      toast({ title: "제목과 내용을 입력해주세요", variant: "destructive" });
      return;
    }
    createPostMutation.mutate({
      title: newPostTitle,
      content: newPostContent,
      ...(videoThumbnailUrl ? { imageUrl: videoThumbnailUrl } : {}),
    });
  };

  const handleCreateComment = () => {
    if (!commentNickname.trim() || !commentContent.trim() || !selectedPost) {
      toast({ title: "닉네임과 댓글을 입력해주세요", variant: "destructive" });
      return;
    }
    createCommentMutation.mutate({
      postId: selectedPost.id,
      authorName: commentNickname,
      content: commentContent,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 overflow-x-hidden">
      <AppHeader />
      <TabNavigation language={language} />

      <main className="container mx-auto px-4 py-6 overflow-hidden" style={{ maxWidth: "min(72rem, 100vw - 2rem)" }}>
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
              <FileText className="w-8 h-8 text-primary" />
              {labels.title}
            </h1>
            {isSupported && (
              <Button
                variant={isSubscribed ? "default" : "outline"}
                size="icon"
                onClick={async () => {
                  if (isSubscribed) {
                    await unsubscribe();
                    toast({ title: "알림이 해제되었습니다" });
                  } else {
                    const success = await subscribe();
                    if (success) {
                      toast({ title: "알림이 설정되었습니다", description: "새 게시물이 등록되면 알림을 받습니다" });
                    } else {
                      toast({ title: "알림 설정 실패", description: "알림 권한을 허용해주세요", variant: "destructive" });
                    }
                  }
                }}
                disabled={pushLoading}
                data-testid="btn-notification"
                title={isSubscribed ? "알림 해제" : "알림 받기"}
              >
                {pushLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isSubscribed ? (
                  <Bell className="w-4 h-4" />
                ) : (
                  <BellOff className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
          <p className="text-muted-foreground mt-2">{labels.subtitle}</p>
        </div>

        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="게시글 검색... / Tìm kiếm bài viết..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-board-search"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchQuery("")}
              data-testid="button-clear-search"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {isAdmin && (
          <div className="mb-6 flex justify-end gap-2">
            <Button 
              variant="outline" 
              className="gap-2" 
              onClick={() => instagramSyncMutation.mutate()}
              disabled={instagramSyncMutation.isPending}
              data-testid="btn-instagram-sync"
            >
              {instagramSyncMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <SiInstagram className="w-4 h-4" />
              )}
              Instagram 동기화
            </Button>
            <Dialog open={showNewPostDialog} onOpenChange={setShowNewPostDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2" data-testid="btn-new-post">
                  <Plus className="w-4 h-4" />
                  {labels.newPost}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{labels.newPost}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder={labels.postTitle}
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    data-testid="input-post-title"
                  />
                  <div className="space-y-2">
                    <div
                      ref={editorRef}
                      contentEditable
                      className="min-h-[200px] max-h-[400px] overflow-auto p-3 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring prose prose-sm max-w-none dark:prose-invert"
                      onInput={updateContentFromEditor}
                      onBlur={saveSelection}
                      onMouseUp={saveSelection}
                      onKeyUp={saveSelection}
                      data-testid="input-post-content"
                      data-placeholder={labels.postContent}
                      style={{ whiteSpace: "pre-wrap" }}
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">클릭하고 글을 입력하세요. 이미지/동영상은 커서 위치에 삽입됩니다.</p>
                      <div>
                        <input
                          type="file"
                          accept="image/*,video/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                          disabled={isUploading}
                        />
                        <label htmlFor="image-upload">
                          <Button variant="outline" size="sm" asChild disabled={isUploading}>
                            <span className="gap-1.5 cursor-pointer">
                              {isUploading ? (
                                <><Loader2 className="w-3.5 h-3.5 animate-spin" /></>
                              ) : (
                                <><ImagePlus className="w-3.5 h-3.5" />{labels.addMedia}</>
                              )}
                            </span>
                          </Button>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowNewPostDialog(false)}>
                      {labels.cancel}
                    </Button>
                    <Button onClick={handleCreatePost} disabled={createPostMutation.isPending} data-testid="btn-publish-post">
                      {createPostMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : labels.publish}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {selectedPost ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between gap-2 mb-4">
              <Button variant="ghost" onClick={handleBackToList} data-testid="button-back-to-list">
                ← 목록으로
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const postUrl = `${window.location.origin}/board/${selectedPost.id}`;
                  apiRequest("POST", `/api/posts/${selectedPost.id}/refresh-og`).catch(() => {});
                  if (navigator.share) {
                    navigator.share({
                      title: selectedPost.title,
                      url: postUrl,
                    }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(postUrl).then(() => {
                      toast({ title: "링크가 복사되었습니다", description: postUrl });
                    }).catch(() => {
                      toast({ title: "링크 복사 실패", variant: "destructive" });
                    });
                  }
                }}
                data-testid="button-share-post"
              >
                <Share2 className="w-4 h-4 mr-1" />
                공유
              </Button>
            </div>
            <Card className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-2xl mb-2 break-words">{selectedPost.title}</CardTitle>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {selectedPost.authorName}
                      </span>
                      <Badge variant="secondary">{labels.admin}</Badge>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {selectedPost.createdAt && format(new Date(selectedPost.createdAt), "yyyy.MM.dd HH:mm")}
                      </span>
                      {isAdmin && (
                        <span className="flex items-center gap-1 text-primary">
                          <Eye className="w-4 h-4" />
                          {selectedPost.viewCount || 0} {language === "ko" ? "조회" : "views"}
                        </span>
                      )}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsEditing(true);
                          setEditTitle(selectedPost.title);
                          setEditContent(selectedPost.content);
                        }}
                        data-testid="btn-edit-post"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleVisibilityMutation.mutate(selectedPost.id)}
                        data-testid="btn-toggle-visibility"
                      >
                        {selectedPost.isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            data-testid="btn-delete-post"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>게시글 삭제</AlertDialogTitle>
                            <AlertDialogDescription>
                              이 게시글을 정말 삭제하시겠습니까? 삭제된 게시글은 복구할 수 없습니다.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>취소</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deletePostMutation.mutate(selectedPost.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              삭제
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6 overflow-hidden">
                {isEditing ? (
                  <div className="space-y-4">
                    <Input
                      placeholder={labels.postTitle}
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      data-testid="input-edit-title"
                    />
                    <Textarea
                      placeholder={labels.postContent}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[200px]"
                      data-testid="input-edit-content"
                    />
                    <div className="flex gap-2 justify-between flex-wrap">
                      <label className="cursor-pointer">
                        <input
                          ref={editFileInputRef}
                          type="file"
                          accept="image/*,video/*"
                          multiple
                          onChange={handleEditFileUpload}
                          className="hidden"
                          data-testid="input-edit-file"
                        />
                        <Button variant="outline" size="sm" asChild disabled={isEditUploading}>
                          <span className="gap-1.5 cursor-pointer">
                            {isEditUploading ? (
                              <><Loader2 className="w-3.5 h-3.5 animate-spin" /></>
                            ) : (
                              <><ImagePlus className="w-3.5 h-3.5" />{labels.addMedia}</>
                            )}
                          </span>
                        </Button>
                      </label>
                      <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setEditTitle("");
                          setEditContent("");
                        }}
                      >
                        {labels.cancel}
                      </Button>
                      <Button
                        onClick={() => {
                          if (editTitle.trim() && editContent.trim()) {
                            updatePostMutation.mutate({
                              id: selectedPost.id,
                              title: editTitle,
                              content: editContent,
                            });
                          } else {
                            toast({ title: "제목과 내용을 입력해주세요", variant: "destructive" });
                          }
                        }}
                        disabled={updatePostMutation.isPending}
                        data-testid="btn-save-edit"
                      >
                        {updatePostMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : labels.save}
                      </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap break-words overflow-hidden">
                    {renderContentWithImages(selectedPost.content)}
                  </div>
                )}

                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    {labels.comments} ({postComments.length})
                  </h3>
                  
                  <div className="space-y-0 mb-6">
                    <AnimatePresence>
                      {postComments.map((comment) => (
                        <motion.div
                          key={comment.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="py-2 border-b border-muted last:border-b-0"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground font-medium">{comment.authorName}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {comment.createdAt && format(new Date(comment.createdAt), "MM.dd HH:mm")}
                              </span>
                              {isAdmin && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                    >
                                      <Trash2 className="w-3 h-3 text-red-500" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>댓글 삭제</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        이 댓글을 정말 삭제하시겠습니까?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>취소</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteCommentMutation.mutate(comment.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        삭제
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {postComments.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">아직 댓글이 없습니다</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder={labels.nickname}
                      value={commentNickname}
                      onChange={(e) => setCommentNickname(e.target.value)}
                      className="w-32"
                      data-testid="input-comment-nickname"
                    />
                    <Input
                      placeholder={labels.writeComment}
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      className="flex-1"
                      onKeyPress={(e) => e.key === "Enter" && handleCreateComment()}
                      data-testid="input-comment-content"
                    />
                    <Button
                      onClick={handleCreateComment}
                      disabled={createCommentMutation.isPending}
                      data-testid="btn-submit-comment"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-4">
            {postsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : posts.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{labels.noPosts}</p>
              </Card>
            ) : (() => {
              const q = searchQuery.trim().toLowerCase();
              const filtered = posts
                .filter(post => isAdmin || !post.isHidden)
                .filter(post => {
                  if (!q) return true;
                  return post.title.toLowerCase().includes(q) || post.content.toLowerCase().includes(q) || (post.authorName || "").toLowerCase().includes(q);
                });
              if (q && filtered.length === 0) {
                return (
                  <Card className="p-12 text-center">
                    <Search className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">검색 결과가 없습니다</p>
                    <p className="text-xs text-muted-foreground mt-1">Không tìm thấy kết quả</p>
                  </Card>
                );
              }
              return (
              <AnimatePresence>
                {filtered
                  .map((post, idx) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card
                      className={`cursor-pointer hover-elevate transition-all ${post.isHidden ? 'opacity-50' : ''}`}
                      onClick={() => handleSelectPost(post)}
                      data-testid={`post-card-${post.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {(() => {
                            const media = getFirstMediaFromContent(post.content);
                            const imgSrc = post.imageUrl || media?.src;
                            const isVideo = !post.imageUrl && media?.isVideo;
                            if (!imgSrc) return null;
                            if (isVideo) {
                              return (
                                <div className="w-24 h-24 rounded-lg shrink-0 relative overflow-hidden bg-muted">
                                  <video src={imgSrc} preload="metadata" className="w-full h-full object-cover" muted />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                    <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center">
                                      <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[10px] border-l-black ml-0.5" />
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return (
                              <img src={imgSrc} alt="" className="w-24 h-24 object-cover rounded-lg shrink-0" />
                            );
                          })()}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg mb-1 line-clamp-2">{post.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {getTextWithoutImages(post.content)}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {post.authorName}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {post.createdAt && format(new Date(post.createdAt), "yyyy.MM.dd")}
                              </span>
                              <span
                                className="flex items-center gap-1 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const postUrl = `${window.location.origin}/board/${post.id}`;
                                  if (navigator.share) {
                                    navigator.share({ title: post.title, url: postUrl }).catch(() => {});
                                  } else {
                                    navigator.clipboard.writeText(postUrl).then(() => {
                                      toast({ title: "링크가 복사되었습니다" });
                                    }).catch(() => {});
                                  }
                                }}
                                data-testid={`button-share-post-${post.id}`}
                              >
                                <Share2 className="w-3 h-3" />
                              </span>
                              {(post as any).commentCount > 0 && (
                                <span className="flex items-center gap-1 text-primary">
                                  <MessageCircle className="w-3 h-3" />
                                  {(post as any).commentCount}
                                </span>
                              )}
                              {isAdmin && (post.viewCount || 0) > 0 && (
                                <span className="flex items-center gap-1 text-blue-500">
                                  <Eye className="w-3 h-3" />
                                  {post.viewCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {getFirstUrlFromContent(post.content) && (
                          <div className="mt-3">
                            <LinkPreview url={getFirstUrlFromContent(post.content)!} />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
              );
            })()}
          </div>
        )}
      </main>

      <FixedBottomBar />
    </div>
  );
}
