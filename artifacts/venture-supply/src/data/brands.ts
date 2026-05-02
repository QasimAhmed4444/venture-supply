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
  isPhoto?: boolean;
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
  {
    id: "almarai",
    name: "Almarai",
    enTagline: "Fresh dairy, juices & long-life milk",
    arTagline: "ألبان وعصائر طازجة وحليب طويل الأمد",
    accent: "#004B87",
    logo: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80",
    isPhoto: true,
  },
  {
    id: "nadec",
    name: "Nadec",
    enTagline: "Agriculture & dairy, nationwide",
    arTagline: "زراعة وألبان على مستوى المملكة",
    accent: "#00A651",
    logo: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&q=80",
    isPhoto: true,
  },
  {
    id: "nada",
    name: "Nada Dairy",
    enTagline: "Fresh yogurt, cheese & juices",
    arTagline: "زبادي وجبن وعصائر طازجة",
    accent: "#E31837",
    logo: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600&q=80",
    isPhoto: true,
  },
  {
    id: "alyoum",
    name: "Alyoum",
    enTagline: "Premium fresh & frozen poultry",
    arTagline: "دواجن طازجة ومجمدة فاخرة",
    accent: "#FF6B35",
    logo: "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=600&q=80",
    isPhoto: true,
  },
  {
    id: "sunbulah",
    name: "Sunbulah",
    enTagline: "Flour, pastry & baking products",
    arTagline: "طحين ومعجنات ومنتجات المخبوزات",
    accent: "#8B6914",
    logo: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80",
    isPhoto: true,
  },
];

export const ownBrands = brands.filter((b) => ["chef-flavor", "malka", "vital"].includes(b.id));
