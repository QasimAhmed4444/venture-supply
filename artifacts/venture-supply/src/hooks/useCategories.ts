import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { categories as mockCategories, type Category } from "@/data/categories";

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => apiFetch<Category[]>("/categories"),
    initialData: mockCategories,
    staleTime: 300_000,
    retry: 1,
  });
}
