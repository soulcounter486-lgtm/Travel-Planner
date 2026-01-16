import { useState, useRef } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/i18n";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useUpload } from "@/hooks/use-upload";
import { 
  Calculator,
  Eye,
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
  LogOut
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import logoImg from "@assets/BackgroundEraser_20240323_103507859_1768275315346.png";
import type { Post, Comment } from "@shared/schema";

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
    addImage: "이미지 첨부",
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
    addImage: "Add Image",
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
    addImage: "添加图片",
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
    addImage: "Thêm ảnh",
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
    addImage: "Добавить изображение",
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
    addImage: "画像を追加",
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
};

export default function Board() {
  const { language, t } = useLanguage();
  const labels = boardLabels[language] || boardLabels.ko;
  const { toast } = useToast();
  
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showNewPostDialog, setShowNewPostDialog] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [commentNickname, setCommentNickname] = useState(() => localStorage.getItem("comment_nickname") || "");
  const [commentContent, setCommentContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response) => {
      const imageMarkdown = `\n![이미지](${response.objectPath})\n`;
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newContent = newPostContent.substring(0, start) + imageMarkdown + newPostContent.substring(end);
        setNewPostContent(newContent);
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + imageMarkdown.length, start + imageMarkdown.length);
        }, 0);
      } else {
        setNewPostContent(prev => prev + imageMarkdown);
      }
      toast({ title: "이미지가 삽입되었습니다" });
    },
    onError: (error) => {
      toast({ title: "이미지 업로드 실패", variant: "destructive" });
    }
  });

  const { data: posts = [], isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
  });

  const { data: adminCheck } = useQuery<{ isAdmin: boolean; isLoggedIn: boolean; userId?: string }>({
    queryKey: ["/api/admin/check"],
    retry: false,
  });

  const isAdmin = adminCheck?.isAdmin || false;
  const isLoggedIn = adminCheck?.isLoggedIn || false;

  const { data: postComments = [], isLoading: commentsLoading } = useQuery<Comment[]>({
    queryKey: ["/api/posts", selectedPost?.id, "comments"],
    enabled: !!selectedPost,
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      const res = await apiRequest("POST", "/api/posts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setShowNewPostDialog(false);
      setNewPostTitle("");
      setNewPostContent("");
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const renderContentWithImages = (content: string) => {
    const parts = content.split(/!\[([^\]]*)\]\(([^)]+)\)/g);
    const result: React.ReactNode[] = [];
    
    for (let i = 0; i < parts.length; i++) {
      if (i % 3 === 0) {
        if (parts[i]) {
          result.push(<span key={i}>{parts[i]}</span>);
        }
      } else if (i % 3 === 2) {
        result.push(
          <img 
            key={i} 
            src={parts[i]} 
            alt={parts[i-1] || "이미지"} 
            className="max-w-full rounded-lg my-4"
          />
        );
      }
    }
    return result;
  };

  const getFirstImageFromContent = (content: string): string | null => {
    const match = content.match(/!\[[^\]]*\]\(([^)]+)\)/);
    return match ? match[1] : null;
  };

  const getTextWithoutImages = (content: string): string => {
    return content.replace(/!\[[^\]]*\]\([^)]+\)/g, "").trim();
  };

  const handleCreatePost = () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      toast({ title: "제목과 내용을 입력해주세요", variant: "destructive" });
      return;
    }
    createPostMutation.mutate({
      title: newPostTitle,
      content: newPostContent,
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src={logoImg} alt="Logo" className="h-10 w-10 object-contain" />
            <span className="font-bold text-lg hidden sm:inline">{t("header.title")}</span>
          </Link>
          <nav className="flex gap-1.5 overflow-x-auto">
            <Link href="/">
              <Button variant="ghost" size="sm" className="flex items-center gap-1.5 text-xs whitespace-nowrap" data-testid="nav-calculator">
                <Calculator className="w-3.5 h-3.5" />
                {navLabels.calculator[language] || navLabels.calculator.ko}
              </Button>
            </Link>
            <Link href="/guide">
              <Button variant="ghost" size="sm" className="flex items-center gap-1.5 text-xs whitespace-nowrap" data-testid="nav-guide">
                <Eye className="w-3.5 h-3.5" />
                {navLabels.guide[language] || navLabels.guide.ko}
              </Button>
            </Link>
            <Link href="/expenses">
              <Button variant="ghost" size="sm" className="flex items-center gap-1.5 text-xs whitespace-nowrap" data-testid="nav-expenses">
                <Wallet className="w-3.5 h-3.5" />
                {navLabels.expenses[language] || navLabels.expenses.ko}
              </Button>
            </Link>
            <Link href="/planner">
              <Button variant="ghost" size="sm" className="flex items-center gap-1.5 text-xs whitespace-nowrap" data-testid="nav-planner">
                <Sparkles className="w-3.5 h-3.5" />
                {navLabels.planner[language] || navLabels.planner.ko}
              </Button>
            </Link>
            <Link href="/chat">
              <Button variant="ghost" size="sm" className="flex items-center gap-1.5 text-xs whitespace-nowrap" data-testid="nav-chat">
                <MessageCircle className="w-3.5 h-3.5" />
                {navLabels.chat[language] || navLabels.chat.ko}
              </Button>
            </Link>
            {isLoggedIn ? (
              <a href="/api/logout">
                <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs whitespace-nowrap" data-testid="btn-logout">
                  <LogOut className="w-3.5 h-3.5" />
                  {labels.logout}
                </Button>
              </a>
            ) : (
              <a href="/api/login">
                <Button variant="default" size="sm" className="flex items-center gap-1.5 text-xs whitespace-nowrap" data-testid="btn-login">
                  <LogIn className="w-3.5 h-3.5" />
                  {labels.login}
                </Button>
              </a>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent flex items-center justify-center gap-2">
            <FileText className="w-8 h-8 text-primary" />
            {labels.title}
          </h1>
          <p className="text-muted-foreground mt-2">{labels.subtitle}</p>
        </div>

        {isAdmin && (
          <div className="mb-6 flex justify-end">
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
                  <div className="flex gap-4">
                    <div className="flex-1 relative">
                      <Textarea
                        ref={textareaRef}
                        placeholder={labels.postContent}
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        rows={10}
                        data-testid="input-post-content"
                      />
                      <div className="absolute bottom-2 right-2">
                        <input
                          type="file"
                          accept="image/*"
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
                                <><ImagePlus className="w-3.5 h-3.5" />{labels.addImage}</>
                              )}
                            </span>
                          </Button>
                        </label>
                      </div>
                    </div>
                    {newPostContent && (
                      <div className="flex-1 border rounded-lg p-3 overflow-auto max-h-64 bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-2">미리보기</p>
                        <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                          {renderContentWithImages(newPostContent)}
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">커서 위치에 이미지가 삽입됩니다</p>
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
            <Button variant="ghost" onClick={() => setSelectedPost(null)} className="mb-4">
              ← 목록으로
            </Button>
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">{selectedPost.title}</CardTitle>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {selectedPost.authorName}
                      </span>
                      <Badge variant="secondary">{labels.admin}</Badge>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {selectedPost.createdAt && format(new Date(selectedPost.createdAt), "yyyy.MM.dd HH:mm")}
                      </span>
                    </div>
                  </div>
                  {isAdmin && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deletePostMutation.mutate(selectedPost.id)}
                      data-testid="btn-delete-post"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                  {renderContentWithImages(selectedPost.content)}
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    {labels.comments} ({postComments.length})
                  </h3>
                  
                  <div className="space-y-4 mb-6">
                    <AnimatePresence>
                      {postComments.map((comment) => (
                        <motion.div
                          key={comment.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-muted/50 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{comment.authorName}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {comment.createdAt && format(new Date(comment.createdAt), "MM.dd HH:mm")}
                              </span>
                              {isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteCommentMutation.mutate(comment.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Trash2 className="w-3 h-3 text-red-500" />
                                </Button>
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
          <div className="grid gap-4">
            {postsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : posts.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{labels.noPosts}</p>
              </Card>
            ) : (
              <AnimatePresence>
                {posts.map((post, idx) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card
                      className="cursor-pointer hover-elevate transition-all"
                      onClick={() => setSelectedPost(post)}
                      data-testid={`post-card-${post.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {(post.imageUrl || getFirstImageFromContent(post.content)) && (
                            <img
                              src={post.imageUrl || getFirstImageFromContent(post.content) || ""}
                              alt=""
                              className="w-24 h-24 object-cover rounded-lg shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg mb-1 truncate">{post.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {getTextWithoutImages(post.content)}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {post.authorName}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {post.createdAt && format(new Date(post.createdAt), "yyyy.MM.dd")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
