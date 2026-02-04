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

async function applyPendingRegistration(): Promise<void> {
  try {
    const pendingData = localStorage.getItem('pendingRegistration');
    if (!pendingData) return;
    
    const data = JSON.parse(pendingData);
    if (!data.nickname && !data.gender && !data.birthDate) return;
    
    const response = await fetch("/api/auth/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        nickname: data.nickname || undefined,
        gender: data.gender || undefined,
        birthDate: data.birthDate || undefined,
      }),
    });
    
    if (response.ok) {
      localStorage.removeItem('pendingRegistration');
      console.log("Pending registration data applied successfully");
    }
  } catch (err) {
    console.error("Failed to apply pending registration:", err);
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

  // 로그인 시 게시글 작성자 이름 동기화 및 대기 중인 회원가입 정보 적용
  useEffect(() => {
    if (user) {
      syncAuthorName();
      applyPendingRegistration().then(() => {
        // 프로필 업데이트 후 사용자 정보 새로고침
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      });
    }
  }, [user?.id, queryClient]);

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
