import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface StaffMember {
  id: string;
  email: string;
  name: string;
  role: "admin" | "sales";
  salespersonId: string | null;
  createdAt: string;
}

export interface StaffPayload {
  name: string;
  email: string;
  password?: string;
  role: "admin" | "sales";
  salespersonId?: string | null;
}

export function useStaff() {
  return useQuery<StaffMember[]>({
    queryKey: ["staff"],
    queryFn: () => apiFetch<StaffMember[]>("/staff"),
    placeholderData: [],
    staleTime: 30_000,
  });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: StaffPayload) =>
      apiFetch<StaffMember>("/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });
}

export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<StaffPayload> & { id: string }) =>
      apiFetch<StaffMember>(`/staff/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });
}

export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/staff/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });
}
