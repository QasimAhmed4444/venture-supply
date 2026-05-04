import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Order, OrderStatus } from "@/data/orders";

export function useOrder(tid?: string) {
  return useQuery<Order | null>({
    queryKey: ["order", tid],
    queryFn: () =>
      tid ? apiFetch<Order>(`/orders/${encodeURIComponent(tid)}`) : Promise.resolve(null),
    enabled: !!tid,
    staleTime: 0,
    retry: 1,
  });
}

export function useOrders(filters?: { status?: string; customerId?: string; salespersonId?: string }) {
  const params = new URLSearchParams();
  if (filters?.status && filters.status !== "all") params.set("status", filters.status);
  if (filters?.customerId) params.set("customerId", filters.customerId);
  if (filters?.salespersonId) params.set("salespersonId", filters.salespersonId);
  const qs = params.toString();

  return useQuery<Order[]>({
    queryKey: ["orders", filters],
    queryFn: () => apiFetch<Order[]>(`/orders${qs ? `?${qs}` : ""}`),
    staleTime: 0,
    retry: 1,
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, history }: { id: string; status: OrderStatus; history?: any[] }) =>
      apiFetch(`/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, history }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (order: Record<string, unknown>) =>
      apiFetch<Order>("/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
