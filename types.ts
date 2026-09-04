export interface Option {
  text: string;
  score: number;
  region?: string;
}

export interface Question {
  id: string;
  title: string;
  options: Option[];
}

export interface Plan {
  max: number;
  name: string;
  price: string;
  includes: string;
  benefits: string[];
}

export interface Region {
  label: string;
  plans: Plan[];
}

export interface Config {
  brand: string;
  whatsappNumber: string;
  consultantTitle: string;
  consultantName: string;
  questions: Question[];
  regions: Record<string, Region>;
}

export interface Answer {
  id: string;
  text: string;
  score: number;
  region: string | null;
}
