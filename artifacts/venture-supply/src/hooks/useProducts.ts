import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { products as mockProducts, type Product } from "@/data/products";

export function useProducts(filters?: { category?: string; brand?: string; search?: string }) {
  const params = new URLSearchParams();
  if (filters?.category) params.set("category", filters.category);
  if (filters?.brand)    params.set("brand", filters.brand);
  if (filters?.search)   params.set("search", filters.search);
  const qs = params.toString();

  return useQuery<Product[]>({
    queryKey: ["products", filters],
    queryFn: () => apiFetch<Product[]>(`/products${qs ? `?${qs}` : ""}`),
    placeholderData: mockProducts,
    staleTime: 0,
    retry: 1,
  });
}

export function useProduct(slug: string | undefined) {
  const { data: all } = useProducts();
  return {
    data: all?.find((p) => p.slug === slug || p.id === slug),
  };
}
