import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface Coupon {
  id: string;
  code: string;
  enTitle: string;
  arTitle: string;
  type: "percent" | "fixed" | "free_delivery";
  value: number;
  minOrder: number;
  audience: "b2c" | "b2b" | "both";
  maxUses: number | null;
  usesCount: number;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export function useCoupons() {
  return useQuery<Coupon[]>({
    queryKey: ["coupons"],
    queryFn: () => apiFetch<Coupon[]>("/coupons"),
    placeholderData: [],
    staleTime: 0,
  });
}

export function useCreateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Coupon>) =>
      apiFetch<Coupon>("/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coupons"] }),
  });
}

export function useUpdateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Coupon> & { id: string }) =>
      apiFetch<Coupon>(`/coupons/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coupons"] }),
  });
}

export function useDeleteCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/coupons/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coupons"] }),
  });
}
