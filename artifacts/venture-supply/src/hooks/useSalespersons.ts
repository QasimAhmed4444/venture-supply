import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface Salesperson {
  id: string;
  name: string;
  email: string;
  phone: string;
  region: string;
  monthlyTarget: number;
  monthlySales: number;
  customersCount: number;
  ordersThisMonth: number;
  pendingOrders: number;
  status: "active" | "inactive";
  joinedDate: string;
  createdAt: string;
  categoriesServed?: string[];
  assignedCustomerIds?: string[];
}

export function useSalespersons() {
  return useQuery<Salesperson[]>({
    queryKey: ["salespersons"],
    queryFn: () => apiFetch<Salesperson[]>("/salespersons"),
    placeholderData: [],
    staleTime: 30_000,
  });
}

export function useSalesperson(id: string | null) {
  return useQuery<Salesperson>({
    queryKey: ["salespersons", id],
    queryFn: () => apiFetch<Salesperson>(`/salespersons/${id}`),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useCreateSalesperson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Salesperson, "id" | "createdAt">) =>
      apiFetch<Salesperson>("/salespersons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["salespersons"] }),
  });
}

export function useUpdateSalesperson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Salesperson> & { id: string }) =>
      apiFetch<Salesperson>(`/salespersons/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["salespersons"] }),
  });
}

export function useDeleteSalesperson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/salespersons/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["salespersons"] }),
  });
}
