import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { brands as mockBrands, type Brand } from "@/data/brands";

export function useBrands() {
  return useQuery<Brand[]>({
    queryKey: ["brands"],
    queryFn: () => apiFetch<Brand[]>("/brands"),
    placeholderData: mockBrands,
    staleTime: 0,
    retry: 1,
  });
}
