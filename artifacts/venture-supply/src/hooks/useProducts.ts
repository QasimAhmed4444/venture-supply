import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { products as mockProducts, type Product } from "@/data/products";

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: () => apiFetch<Product[]>("/products"),
    initialData: mockProducts,
    staleTime: 60_000,
    retry: 1,
  });
}

export function useProduct(slug: string | undefined) {
  const { data: all } = useProducts();
  return {
    data: all?.find((p) => p.slug === slug || p.id === slug),
  };
}
