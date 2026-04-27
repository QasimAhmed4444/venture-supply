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
}

export const salespersons: Salesperson[] = [
  {
    id: "sp-001",
    name: "Omar Al-Shehri",
    email: "omar.shehri@venturesupply.sa",
    phone: "+966 50 111 2233",
    region: "Central / Madinah",
    monthlyTarget: 80000,
    monthlySales: 64200,
    customersCount: 12,
    ordersThisMonth: 28,
    pendingOrders: 3,
    status: "active",
    joinedDate: "2024-09-12",
  },
  {
    id: "sp-002",
    name: "Hamad Al-Zahrani",
    email: "hamad.zahrani@venturesupply.sa",
    phone: "+966 56 222 3344",
    region: "Western (Jeddah, Makkah)",
    monthlyTarget: 100000,
    monthlySales: 92800,
    customersCount: 18,
    ordersThisMonth: 41,
    pendingOrders: 5,
    status: "active",
    joinedDate: "2024-06-04",
  },
  {
    id: "sp-003",
    name: "Bandar Al-Mansouri",
    email: "bandar.mansouri@venturesupply.sa",
    phone: "+966 55 333 4455",
    region: "Eastern Province",
    monthlyTarget: 70000,
    monthlySales: 51400,
    customersCount: 9,
    ordersThisMonth: 19,
    pendingOrders: 2,
    status: "active",
    joinedDate: "2025-01-22",
  },
  {
    id: "sp-004",
    name: "Mansour Al-Otaibi",
    email: "mansour.otaibi@venturesupply.sa",
    phone: "+966 54 444 5566",
    region: "Riyadh / Wholesale",
    monthlyTarget: 120000,
    monthlySales: 108700,
    customersCount: 14,
    ordersThisMonth: 36,
    pendingOrders: 4,
    status: "active",
    joinedDate: "2024-03-15",
  },
];

export const getSalespersonById = (id: string) => salespersons.find((s) => s.id === id);

export const DEMO_SALES = salespersons[0];
