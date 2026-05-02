import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface DashboardStats {
  ordersToday: number;
  revenueToday: number;
  newCustomers: number;
  pendingOrders: number;
  lowStock: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
}

const FALLBACK: DashboardStats = {
  ordersToday: 6,
  revenueToday: 0,
  newCustomers: 8,
  pendingOrders: 0,
  lowStock: 0,
  totalOrders: 0,
  totalCustomers: 0,
  totalRevenue: 0,
};

export function useDashboard() {
  return useQuery<DashboardStats>({
    queryKey: ["dashboard"],
    queryFn: () => apiFetch<DashboardStats>("/dashboard/stats"),
    placeholderData: FALLBACK,
    staleTime: 0,
    retry: 1,
  });
}
