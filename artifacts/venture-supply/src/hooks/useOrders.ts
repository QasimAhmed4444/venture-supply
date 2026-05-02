import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { orders as mockOrders, type Order, type OrderStatus } from "@/data/orders";

export function useOrder(tid?: string) {
  const placeholder = tid
    ? (mockOrders.find((o) => o.trackingId === tid || o.id === tid) ?? null)
    : null;
  return useQuery<Order | null>({
    queryKey: ["order", tid],
    queryFn: () =>
      tid ? apiFetch<Order>(`/orders/${encodeURIComponent(tid)}`) : Promise.resolve(null),
    enabled: !!tid,
    placeholderData: placeholder,
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
    placeholderData: mockOrders,
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
