export type GalleryImage = {
  id: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  gender?: string;
  length?: string;
  hairType?: string;
  hairThickness?: string;
  maintenanceLevel?: string;
  analysis?: {
    haircutName?: string;
    hairType?: string;
    hairSubtype?: string;
    hairThickness?: string;
    length?: string;
    faceShape?: string;
    gender?: string;
    ethnicity?: string;
    upkeep?: string;
    hairColour?: string;
    vibe?: string;
    maintenance?: string;
  };
  features?: string[];
  labels?: string[];
  createdAt?: string;
};

export type Style = {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  gender: string;
  length: string;
  hairType: string;
  hairThickness: string;
  upkeep: string;
  faceShape: string;
  hairColour: string;
  labels: string[];
};

export type UserPhoto = {
  id: string;
  sessionId: string;
  label: string;
  imageData: string;
  description?: string;
  features?: string[];
  createdAt?: string;
};

export type BriefItem = {
  id: string;
  source: "upload" | "favourite" | "saved" | "try-on";
  partition: "me" | "references";
  imageUrl: string;
  name: string;
  styleId?: string;
  referenceStyleId?: string;
  firstChoice?: boolean;
  annotation?: string;
};

export type BriefDetails = {
  colour?: string;
  allergies?: string;
  previousTreatments?: string;
  damage?: string;
  notes?: string;
  detailsOpen?: boolean;
};

export type StyleBrief = {
  id: string;
  sessionId: string;
  items: BriefItem[];
  details: BriefDetails;
  feedback?: Array<{
    id: string;
    author: string;
    note: string;
    rating?: number | null;
    createdAt?: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
};

export type QuizAnswers = Record<string, string[]>;
