import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Category } from "@/data/categories";

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => apiFetch<Category[]>("/categories"),
    staleTime: 0,
    retry: 1,
  });
}
