export type Bar = {
  id: number;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  notes: string | null;
  category: string;
  crowdLevel: "Quiet" | "Moderate" | "Lively";
  priceTier: 1 | 2 | 3;
};

export type BarCreate = {
  name: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  rating?: number | null;
  notes?: string | null;
  category?: string;
  crowdLevel?: "Quiet" | "Moderate" | "Lively";
  priceTier?: 1 | 2 | 3;
};

export type BarResponse = {
  id: number;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  notes: string | null;
  category: string;
  crowdLevel: "Quiet" | "Moderate" | "Lively";
  priceTier: 1 | 2 | 3;
};
