import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type CalculateQuoteRequest, type InsertQuote } from "@shared/routes";
import { apiRequest } from "@/lib/queryClient";

export function useCalculateQuote() {
  return useMutation({
    mutationFn: async (data: CalculateQuoteRequest) => {
      const res = await apiRequest(
        api.quotes.calculate.method,
        api.quotes.calculate.path,
        data
      );
      return api.quotes.calculate.responses[200].parse(await res.json());
    },
  });
}

export function useCreateQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertQuote) => {
      const res = await apiRequest(
        api.quotes.create.method,
        api.quotes.create.path,
        data
      );
      return api.quotes.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.quotes.list.path] });
    },
  });
}

export function useQuotes() {
  return useQuery({
    queryKey: [api.quotes.list.path],
    queryFn: async () => {
      const res = await fetch(api.quotes.list.path);
      if (!res.ok) throw new Error("Failed to fetch quotes");
      return api.quotes.list.responses[200].parse(await res.json());
    },
  });
}
