// Type definitions
export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: Ingredient[];
  steps: string[];
  category: string;
  userId: string;
  createdAt: string;
}

export interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}
