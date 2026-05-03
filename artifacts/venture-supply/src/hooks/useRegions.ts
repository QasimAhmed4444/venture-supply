import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface Region {
  id: string;
  name: string;
  nameAr: string | null;
  sortOrder: number;
}

export function useRegions() {
  return useQuery<Region[]>({
    queryKey: ["regions"],
    queryFn: () => apiFetch<Region[]>("/regions"),
    placeholderData: [],
    staleTime: 120_000,
  });
}
