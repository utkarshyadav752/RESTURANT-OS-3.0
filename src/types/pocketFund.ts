export interface Goal {
  id: string;
  name: string;
  icon: string;
  current: number;
  target: number;
}

export interface BudgetCategory {
  id: string;
  name: string;
  icon: string;
  spent: number;
  limit: number;
}

export interface ExpenseRequest {
  id: string;
  title: string;
  amount: number;
  who: string;
  childId: string;
  when: string;
  icon: string;
  desc: string;
  status?: 'pending' | 'approved' | 'declined';
}

export interface ChoreItem {
  id: string;
  title: string;
  reward: number;
  icon: string;
  completed: boolean;
}

export interface ChildProfile {
  id: string;
  name: string;
  email: string;
  password: string;
  age: number;
  avatar: string;
  grade?: string;
  allowance: number;
  spent: number;
  saved: number;
  balance: number;
  foodSpent: number;
  foodLimit: number;
  transportSpent: number;
  transportLimit: number;
  streakDays: number;
  challengeCompleted: boolean;
  goals: Goal[];
  budgets: BudgetCategory[];
  requests: ExpenseRequest[];
  walletHistory: string[];
  chores?: ChoreItem[];
}

export interface ParentProfile {
  name: string;
  email: string;
  password: string;
  avatar: string;
  role: 'parent';
  userId: string;
}

export interface AllowanceBenchmark {
  age: number;
  metroAmount: number;
  tier2Amount: number;
  foodShare: number;
  transitShare: number;
  booksShare: number;
  savingsShare: number;
}


export interface StoryTestimonial {
  quote: string;
  author: string;
  role: string;
  avatar: string;
}

export interface FAQItem {
  q: string;
  a: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  tagline: string;
  price: string;
  priceSub: string;
  badge?: string;
  isFeatured?: boolean;
  features: string[];
  ctaText: string;
}
