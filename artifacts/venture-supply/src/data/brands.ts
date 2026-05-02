import chefLogo from "@assets/Brand_Chef_logo_1777479525959.png";
import malkaLogo from "@assets/Brand_Malka_logo_1777479525961.png";
import vitalLogo from "@assets/Brand_Vital_logo_1777479525962.png";

export interface Brand {
  id: string;
  name: string;
  enTagline: string;
  arTagline: string;
  accent: string;
  logo?: string;
}

export const brands: Brand[] = [
  {
    id: "chef-flavor",
    name: "Chef Flavor",
    enTagline: "Premium rice, oils & spices",
    arTagline: "أرز، زيوت وبهارات فاخرة",
    accent: "#C73838",
    logo: chefLogo,
  },
  {
    id: "malka",
    name: "Malka",
    enTagline: "Authentic spices & Himalayan salt",
    arTagline: "بهارات أصيلة وملح هيمالايا",
    accent: "#7A2A1A",
    logo: malkaLogo,
  },
  {
    id: "vital",
    name: "Vital",
    enTagline: "Premium tea, every cup",
    arTagline: "شاي فاخر في كل كوب",
    accent: "#0E5C2F",
    logo: vitalLogo,
  },
  {
    id: "almari",
    name: "Al Mari",
    enTagline: "Trusted everyday essentials",
    arTagline: "أساسيات يومية موثوقة",
    accent: "#085890",
  },
];
