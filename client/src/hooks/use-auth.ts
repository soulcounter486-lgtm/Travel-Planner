import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { User } from "@shared/models/auth";

async function fetchUser(): Promise<User | null> {
  const response = await fetch("/api/auth/user", {
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function syncAuthorName(): Promise<void> {
  try {
    await fetch("/api/sync-author-name", {
      method: "POST",
      credentials: "include",
    });
  } catch (err) {
    console.error("Failed to sync author name:", err);
  }
}

async function logout(): Promise<void> {
  window.location.href = "/api/logout";
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // 로그인 시 게시글 작성자 이름 동기화
  useEffect(() => {
    if (user) {
      syncAuthorName();
    }
  }, [user?.id]);

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
    },
  });

  // 관리자 확인 (Replit email: soulcounter486@gmail.com, Kakao email: vungtau1004@daum.net)
  const ADMIN_EMAILS = ["soulcounter486@gmail.com", "vungtau1004@daum.net"];
  const isAdmin = user ? ADMIN_EMAILS.includes(user.email || "") : false;

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
