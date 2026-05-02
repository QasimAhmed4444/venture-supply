import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { customers as mockCustomers, type Customer } from "@/data/customers";

export function useCustomers(type?: "b2c" | "b2b" | "all") {
  const qs = type && type !== "all" ? `?type=${type}` : "";
  return useQuery<Customer[]>({
    queryKey: ["customers", type],
    queryFn: () => apiFetch<Customer[]>(`/customers${qs}`),
    placeholderData: mockCustomers,
    staleTime: 0,
    retry: 1,
  });
}
