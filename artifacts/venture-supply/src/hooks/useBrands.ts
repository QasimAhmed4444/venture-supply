import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { brands as mockBrands, type Brand } from "@/data/brands";

export function useBrands() {
  return useQuery<Brand[]>({
    queryKey: ["brands"],
    queryFn: () => apiFetch<Brand[]>("/brands"),
    initialData: mockBrands,
    staleTime: 300_000,
    retry: 1,
  });
}
