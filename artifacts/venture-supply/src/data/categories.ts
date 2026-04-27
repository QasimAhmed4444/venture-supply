export interface Category {
  id: string;
  slug: string;
  image: string;
  productCount: number;
}

export const categories: Category[] = [
  {
    id: "rice",
    slug: "rice",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=900&q=80&auto=format&fit=crop",
    productCount: 12,
  },
  {
    id: "plain-spices",
    slug: "plain-spices",
    image: "https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=900&q=80&auto=format&fit=crop",
    productCount: 15,
  },
  {
    id: "recipe-mix",
    slug: "recipe-mix",
    image: "https://images.unsplash.com/photo-1599735734820-5f76b88a4146?w=900&q=80&auto=format&fit=crop",
    productCount: 13,
  },
  {
    id: "pulses-lentils",
    slug: "pulses-lentils",
    image: "https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=900&q=80&auto=format&fit=crop",
    productCount: 9,
  },
  {
    id: "oils",
    slug: "oils",
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=900&q=80&auto=format&fit=crop",
    productCount: 1,
  },
  {
    id: "pink-salt",
    slug: "pink-salt",
    image: "https://images.unsplash.com/photo-1518110925495-b37653e00ee9?w=900&q=80&auto=format&fit=crop",
    productCount: 1,
  },
  {
    id: "beverages",
    slug: "beverages",
    image: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=900&q=80&auto=format&fit=crop",
    productCount: 5,
  },
  {
    id: "sauces",
    slug: "sauces",
    image: "https://images.unsplash.com/photo-1589135233689-cb27b3717c1f?w=900&q=80&auto=format&fit=crop",
    productCount: 4,
  },
  {
    id: "specialty-items",
    slug: "specialty-items",
    image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=900&q=80&auto=format&fit=crop",
    productCount: 3,
  },
];
