export type CustomerType = "b2c" | "b2b";
export type BusinessType = "retailer" | "wholesaler" | "horeca";

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  type: CustomerType;
  totalOrders: number;
  lifetimeValue: number;
  assignedSalespersonId?: string;
  joinedDate: string;
  business?: {
    name: string;
    type: BusinessType;
    crNumber: string;
    vatNumber: string;
  };
  addresses: Array<{
    id: string;
    label: string;
    fullAddress: string;
    city: string;
    isDefault: boolean;
  }>;
}

export const customers: Customer[] = [
  {
    id: "c-001",
    name: "Ahmed Al-Qahtani",
    email: "ahmed.qahtani@example.sa",
    phone: "+966 54 123 4567",
    city: "Riyadh",
    type: "b2c",
    totalOrders: 14,
    lifetimeValue: 1820,
    joinedDate: "2025-08-12",
    addresses: [
      { id: "a-1", label: "Home", fullAddress: "King Fahd Rd, Al Olaya District, Building 24, Apt 4", city: "Riyadh", isDefault: true },
      { id: "a-2", label: "Office", fullAddress: "Prince Sultan Rd, Al Sahafa, Tower 3, Floor 7", city: "Riyadh", isDefault: false },
    ],
  },
  {
    id: "c-002",
    name: "Fatima Al-Saud",
    email: "fatima.saud@example.sa",
    phone: "+966 56 234 5678",
    city: "Jeddah",
    type: "b2c",
    totalOrders: 22,
    lifetimeValue: 3140,
    joinedDate: "2025-05-03",
    addresses: [
      { id: "a-3", label: "Home", fullAddress: "Al Tahlia St, Al Andalus District", city: "Jeddah", isDefault: true },
    ],
  },
  {
    id: "c-003",
    name: "Mohammad Al-Ghamdi",
    email: "m.ghamdi@example.sa",
    phone: "+966 55 345 6789",
    city: "Madinah",
    type: "b2c",
    totalOrders: 7,
    lifetimeValue: 940,
    joinedDate: "2026-01-18",
    addresses: [
      { id: "a-4", label: "Home", fullAddress: "Quba Rd, Al Aziziyah", city: "Madinah", isDefault: true },
    ],
  },
  {
    id: "c-004",
    name: "Noura Al-Rashid",
    email: "noura.rashid@example.sa",
    phone: "+966 50 456 7890",
    city: "Dammam",
    type: "b2c",
    totalOrders: 11,
    lifetimeValue: 1560,
    joinedDate: "2025-09-22",
    addresses: [
      { id: "a-5", label: "Home", fullAddress: "King Saud Rd, Al Faisaliyah", city: "Dammam", isDefault: true },
    ],
  },
  {
    id: "c-005",
    name: "Khalid Al-Harbi (Al Andalus Restaurant Group)",
    email: "purchasing@alandalus-restaurants.sa",
    phone: "+966 11 567 8901",
    city: "Riyadh",
    type: "b2b",
    totalOrders: 48,
    lifetimeValue: 184500,
    assignedSalespersonId: "sp-001",
    joinedDate: "2024-11-05",
    business: {
      name: "Al Andalus Restaurant Group",
      type: "horeca",
      crNumber: "1010 234 567",
      vatNumber: "300 123 456 7800003",
    },
    addresses: [
      { id: "a-6", label: "Main Kitchen", fullAddress: "Industrial Area Phase 3, Warehouse 24", city: "Riyadh", isDefault: true },
      { id: "a-7", label: "Branch — Olaya", fullAddress: "Olaya Plaza, Ground Floor", city: "Riyadh", isDefault: false },
    ],
  },
  {
    id: "c-006",
    name: "Sara Al-Mutairi (Hilal Mart Chain)",
    email: "procurement@hilalmart.sa",
    phone: "+966 12 678 9012",
    city: "Jeddah",
    type: "b2b",
    totalOrders: 64,
    lifetimeValue: 246800,
    assignedSalespersonId: "sp-002",
    joinedDate: "2024-07-20",
    business: {
      name: "Hilal Mart Chain",
      type: "retailer",
      crNumber: "4030 345 678",
      vatNumber: "300 234 567 8900003",
    },
    addresses: [
      { id: "a-8", label: "Central Warehouse", fullAddress: "Al Khumrah Industrial Zone", city: "Jeddah", isDefault: true },
    ],
  },
  {
    id: "c-007",
    name: "Yousef Al-Anazi (Madinah Hospitality Group)",
    email: "supply@madinah-hospitality.sa",
    phone: "+966 14 789 0123",
    city: "Madinah",
    type: "b2b",
    totalOrders: 36,
    lifetimeValue: 142300,
    assignedSalespersonId: "sp-001",
    joinedDate: "2025-02-14",
    business: {
      name: "Madinah Hospitality Group",
      type: "horeca",
      crNumber: "4650 456 789",
      vatNumber: "300 345 678 9000003",
    },
    addresses: [
      { id: "a-9", label: "Main Hotel Kitchen", fullAddress: "Quba Rd, Hilton Tower", city: "Madinah", isDefault: true },
    ],
  },
  {
    id: "c-008",
    name: "Rashed Al-Dosari (Saffron Catering Co.)",
    email: "ops@saffroncatering.sa",
    phone: "+966 13 890 1234",
    city: "Dammam",
    type: "b2b",
    totalOrders: 19,
    lifetimeValue: 78400,
    assignedSalespersonId: "sp-003",
    joinedDate: "2025-06-30",
    business: {
      name: "Saffron Catering Co.",
      type: "horeca",
      crNumber: "2050 567 890",
      vatNumber: "300 456 789 0100003",
    },
    addresses: [
      { id: "a-10", label: "Catering HQ", fullAddress: "Al Khobar Industrial Area", city: "Dammam", isDefault: true },
    ],
  },
  {
    id: "c-009",
    name: "Abdulrahman Al-Subaie (Riyadh Wholesale Foods)",
    email: "buying@rwf.sa",
    phone: "+966 11 901 2345",
    city: "Riyadh",
    type: "b2b",
    totalOrders: 82,
    lifetimeValue: 312900,
    assignedSalespersonId: "sp-004",
    joinedDate: "2024-04-12",
    business: {
      name: "Riyadh Wholesale Foods",
      type: "wholesaler",
      crNumber: "1010 678 901",
      vatNumber: "300 567 890 1200003",
    },
    addresses: [
      { id: "a-11", label: "Main Warehouse", fullAddress: "Al Sulay Industrial Area", city: "Riyadh", isDefault: true },
    ],
  },
  {
    id: "c-010",
    name: "Layla Al-Otaibi",
    email: "layla.otaibi@example.sa",
    phone: "+966 53 012 3456",
    city: "Makkah",
    type: "b2c",
    totalOrders: 4,
    lifetimeValue: 460,
    joinedDate: "2026-03-01",
    addresses: [
      { id: "a-12", label: "Home", fullAddress: "Aziziyah, Building 12", city: "Makkah", isDefault: true },
    ],
  },
];

export const getCustomerById = (id: string) => customers.find((c) => c.id === id);
export const getCustomersByType = (type: CustomerType) => customers.filter((c) => c.type === type);
export const getCustomersBySalesperson = (spId: string) =>
  customers.filter((c) => c.assignedSalespersonId === spId);

// Demo customers used by role auto-login
export const DEMO_B2C = customers[0];
export const DEMO_B2B = customers[4];
