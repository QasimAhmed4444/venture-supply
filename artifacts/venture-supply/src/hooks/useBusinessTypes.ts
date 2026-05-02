import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface BusinessType {
  id: string;
  name: string;
  code: string;
  description: string | null;
  defaultDiscount: number;
  minOrderValue: number;
  creditAllowed: boolean;
  creditLimit: number | null;
  status: "active" | "inactive";
  createdAt: string;
}

export function useBusinessTypes() {
  return useQuery<BusinessType[]>({
    queryKey: ["business-types"],
    queryFn: () => apiFetch<BusinessType[]>("/business-types"),
    placeholderData: [],
    staleTime: 60_000,
  });
}

export function useCreateBusinessType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<BusinessType, "id" | "createdAt">) =>
      apiFetch<BusinessType>("/business-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business-types"] }),
  });
}

export function useUpdateBusinessType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<BusinessType> & { id: string }) =>
      apiFetch<BusinessType>(`/business-types/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business-types"] }),
  });
}

export function useDeleteBusinessType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/business-types/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business-types"] }),
  });
}
