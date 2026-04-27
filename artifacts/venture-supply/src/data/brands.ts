export interface Brand {
  id: string;
  name: string;
  enTagline: string;
  arTagline: string;
  accent: string;
}

export const brands: Brand[] = [
  {
    id: "chef-flavor",
    name: "Chef Flavor",
    enTagline: "Premium rice, oils & spices",
    arTagline: "أرز، زيوت وبهارات فاخرة",
    accent: "hsl(25 47% 24%)",
  },
  {
    id: "malka",
    name: "Malka",
    enTagline: "Authentic spices & Himalayan salt",
    arTagline: "بهارات أصيلة وملح هيمالايا",
    accent: "hsl(0 65% 45%)",
  },
  {
    id: "vital",
    name: "Vital",
    enTagline: "Premium tea, every cup",
    arTagline: "شاي فاخر في كل كوب",
    accent: "hsl(155 40% 30%)",
  },
];
