import { ChildProfile, ParentProfile, AllowanceBenchmark, StoryTestimonial, FAQItem, PricingPlan } from '../types/pocketFund.ts';

export const initialParent: ParentProfile = {
  name: 'Priya Sharma',
  email: 'priya.sharma@gmail.com',
  password: 'parent@2026',
  avatar: '👩',
  role: 'parent',
  userId: 'parent-1',
};

export const initialChildren: ChildProfile[] = [
  {
    id: 'child-1',
    name: 'Aarav',
    email: 'aarav.sharma@gmail.com',
    password: 'aarav@2026',
    age: 16,
    avatar: '🧑',
    grade: 'Class XI',
    allowance: 2000,
    spent: 1120,
    saved: 480,
    balance: 880,
    foodSpent: 280,
    foodLimit: 400,
    transportSpent: 120,
    transportLimit: 200,
    streakDays: 20,
    challengeCompleted: false,
    goals: [
      { id: 'g-1', name: 'New Headphones', icon: '🎧', current: 1050, target: 1500 },
      { id: 'g-2', name: 'Campus Fest Outing', icon: '🎟️', current: 300, target: 600 },
    ],
    budgets: [
      { id: 'b-1', name: 'Food & drinks', icon: '🍜', spent: 280, limit: 400 },
      { id: 'b-2', name: 'Transport', icon: '🚌', spent: 120, limit: 200 },
    ],
    requests: [
      { id: 'req-1', title: 'School supplies', amount: 350, who: 'Aarav', childId: 'child-1', when: 'Today', icon: '📚', desc: 'notebooks and geometry kit' },
      { id: 'req-2', title: 'Movie with friends', amount: 220, who: 'Aarav', childId: 'child-1', when: 'Tomorrow', icon: '🎬', desc: 'weekend science fiction screening' },
    ],
    walletHistory: [
      '✓ Paid ₹45 at Campus Café · 2 hours ago',
      '✓ Paid ₹25 for Metro · yesterday',
      '✓ Received ₹100 weekly goal deposit · 3 days ago',
      '✓ Paid ₹150 for Stationery Binder · 5 days ago',
    ],
    chores: [
      { id: 'c-1', title: 'Clean room & organize study desk', reward: 50, icon: '🧹', completed: false },
      { id: 'c-2', title: 'Complete Physics mock test', reward: 100, icon: '📝', completed: true },
      { id: 'c-3', title: 'Water balcony plants', reward: 30, icon: '🪴', completed: false },
    ],
  },
  {
    id: 'child-2',
    name: 'Ananya',
    email: 'ananya.sharma@gmail.com',
    password: 'ananya@2026',
    age: 14,
    avatar: '👧',
    grade: 'Class VIII',
    allowance: 1500,
    spent: 650,
    saved: 350,
    balance: 850,
    foodSpent: 180,
    foodLimit: 300,
    transportSpent: 90,
    transportLimit: 150,
    streakDays: 14,
    challengeCompleted: true,
    goals: [
      { id: 'g-3', name: 'Art Sketchbook & Pastels', icon: '🎨', current: 650, target: 900 },
    ],
    budgets: [
      { id: 'b-3', name: 'Art & Books', icon: '📖', spent: 180, limit: 300 },
      { id: 'b-4', name: 'Snacks', icon: '🧃', spent: 90, limit: 150 },
    ],
    requests: [
      { id: 'req-3', title: 'Science project kit', amount: 290, who: 'Ananya', childId: 'child-2', when: 'Yesterday', icon: '🔬', desc: 'components for school science exhibition' },
    ],
    walletHistory: [
      '✓ Paid ₹30 at School Canteen · yesterday',
      '✓ Saved ₹150 to Art Sketchbook · 2 days ago',
      '✓ Paid ₹80 at Book Depot · 4 days ago',
    ],
    chores: [
      { id: 'c-4', title: 'Organize art supply cabinet', reward: 40, icon: '🎨', completed: true },
      { id: 'c-5', title: 'Daily Hindi reading practice', reward: 50, icon: '📚', completed: false },
    ],
  },
  {
    id: 'child-3',
    name: 'Kabir',
    email: 'kabir.sharma@gmail.com',
    password: 'kabir@2026',
    age: 11,
    avatar: '👦',
    grade: 'Class VI',
    allowance: 800,
    spent: 240,
    saved: 200,
    balance: 560,
    foodSpent: 120,
    foodLimit: 200,
    transportSpent: 40,
    transportLimit: 100,
    streakDays: 8,
    challengeCompleted: false,
    goals: [
      { id: 'g-4', name: 'LEGO Space Explorer', icon: '🚀', current: 350, target: 800 },
    ],
    budgets: [
      { id: 'b-5', name: 'Canteen & Juices', icon: '🧃', spent: 120, limit: 200 },
      { id: 'b-6', name: 'School Crafts', icon: '✂️', spent: 60, limit: 150 },
    ],
    requests: [],
    walletHistory: [
      '✓ Paid ₹20 at Fruit Stall · today',
      '✓ Saved ₹50 to LEGO Goal · 3 days ago',
    ],
    chores: [
      { id: 'c-6', title: 'Pack school bag before 8 PM', reward: 25, icon: '🎒', completed: true },
    ],
  },
];

export const allowanceBenchmarks: Record<number, AllowanceBenchmark> = {
  12: { age: 12, metroAmount: 1000, tier2Amount: 800, foodShare: 35, transitShare: 15, booksShare: 25, savingsShare: 25 },
  13: { age: 13, metroAmount: 1200, tier2Amount: 950, foodShare: 35, transitShare: 20, booksShare: 20, savingsShare: 25 },
  14: { age: 14, metroAmount: 1500, tier2Amount: 1200, foodShare: 40, transitShare: 20, booksShare: 20, savingsShare: 20 },
  15: { age: 15, metroAmount: 1800, tier2Amount: 1400, foodShare: 40, transitShare: 25, booksShare: 15, savingsShare: 20 },
  16: { age: 16, metroAmount: 2000, tier2Amount: 1600, foodShare: 45, transitShare: 25, booksShare: 15, savingsShare: 15 },
  17: { age: 17, metroAmount: 2500, tier2Amount: 1900, foodShare: 45, transitShare: 30, booksShare: 10, savingsShare: 15 },
};

export const quotes = [
  ['A budget is telling your money where to go instead of wondering where it went.', '— John C. Maxwell'],
  ['Do not save what is left after spending; spend what is left after saving.', '— Warren Buffett'],
  ['Small daily improvements are the key to staggering long-term results.', '— Unknown'],
  ['Financial freedom is available to those who learn about it and work for it.', '— Robert Kiyosaki'],
  ['The habit of saving is itself an education; it fosters every virtue.', '— T. T. Munger'],
];



export const storyTestimonials: StoryTestimonial[] = [
  {
    quote: '"Before Pocket Fund, my 16-year-old was constantly pinging me on WhatsApp for random ₹200-₹300 UPI transfers. Now, he gets his monthly allowance on the 1st and knows exactly how to pace his metro and canteen budget. The constant friction is completely gone."',
    author: 'Sunita Mehra',
    role: 'Mother of two (16 & 14 yrs) · Bengaluru',
    avatar: '👩',
  },
  {
    quote: '"Having my own student wallet makes me feel trusted. When I wanted new noise-cancelling headphones for studying, I set up a savings goal on Pocket Fund. Moving ₹100 every week and watching the progress bar fill up felt so rewarding!"',
    author: 'Dev Malhotra',
    role: 'Class 11 Student · Age 16 · Delhi',
    avatar: '🧑',
  },
  {
    quote: '"Managing two children with different needs was always messy. My 12-year-old daughter only needs a small stationery allowance, while my older boy needs commute money. Pocket Fund allows me to set independent limits for both from one app in 2 minutes."',
    author: 'Rajesh Iyer',
    role: 'Father of two (12 & 15 yrs) · Mumbai',
    avatar: '👨',
  },
];

export const faqList: FAQItem[] = [
  {
    q: 'Does each child get their own separate login Gmail and password?',
    a: 'Yes! Every child receives their own unique Gmail login and independent password (e.g., student.name@gmail.com). When a child logs in on their phone or tablet, they access only their personal wallet, transactions, and savings goals—without access to siblings’ data or parent admin controls.',
  },
  {
    q: 'How does Pocket Fund handle UPI payments safely for teenagers?',
    a: 'Pocket Fund works through RBI-compliant Prepaid Payment Instrument (PPI) partner rails. Parents fund a designated companion wallet with strict daily limits. Minors cannot take credit, exceed limits, or connect directly to primary bank accounts without parent authorization.',
  },
  {
    q: 'Can I manage multiple children with different ages and rules?',
    a: 'Yes! Pocket Fund is built specifically for Indian families with 1, 2, or 3+ children. You can set a ₹1,000/month allowance with tight food restrictions for a 12-year-old, and ₹2,000/month with higher daily transit limits for a 16-year-old, all from one unified parent console.',
  },
  {
    q: 'Are merchant categories blocked for teen wallets?',
    a: 'Absolutely. All transactions are filtered through merchant category codes (MCC). High-risk or age-inappropriate merchants—including alcohol, betting, lottery, adult services, and unauthorized gaming tokens—are automatically declined at the network level.',
  },
  {
    q: 'What happens when a child runs out of money before the month ends?',
    a: 'This is the most powerful learning moment! The child can review their spending history to understand where their funds went, or submit a top-up request with an itemized explanation (e.g., school project materials) for parent approval via 1-tap UPI.',
  },
  {
    q: 'Is Pocket Fund a bank or a fintech platform?',
    a: 'Pocket Fund is a financial technology company partnering with licensed, RBI-regulated scheduled commercial banks and authorized PPI issuers to provide secure wallet and payment processing services.',
  },
  {
    q: 'How do I participate in the early access family pilot?',
    a: 'Click "Join the Pilot" on this website, enter your email and family details. We invite batches of 50 families each month to provide feedback, test companion features, and receive zero fees for life on their starter accounts.',
  },
  {
    q: 'How do I contact Customer Support?',
    a: 'You can reach our dedicated customer care desk at support@pocketfund.in or through our in-app support chat (available 7 days a week, 8:00 AM – 10:00 PM IST) for quick setup assistance or account questions.',
  },
];

export const pricingPlans: PricingPlan[] = [
  {
    id: 'pilot',
    name: 'Family Pilot Tier',
    tagline: 'Full parent console with multi-child companion accounts during our beta testing period.',
    price: '₹0',
    priceSub: '/ month for pilot families',
    badge: 'PILOT BETA · 100% FREE',
    isFeatured: true,
    features: [
      'Up to 4 child companion accounts',
      'Automated allowance scheduling',
      'Category limits (Food, Transit, Stationery)',
      'Instant UPI approval top-up loop',
      'Pocket Fund AI money habits advisor',
      'Downloadable family monthly statements',
    ],
    ctaText: 'Apply for Free Pilot',
  },
  {
    id: 'pro',
    name: 'Family Pro (Coming Soon)',
    tagline: 'Advanced features including physical RuPay companion cards and family chore rewards.',
    price: '₹199',
    priceSub: '/ month per family',
    features: [
      'Everything in Family Pilot',
      'Physical contactless RuPay student cards',
      'Instant card freeze / unfreeze from parent phone',
      'Chore & milestone earning frameworks',
      'Parent savings matching bonus',
      'Priority 24/7 family concierge support',
    ],
    ctaText: 'Join Pro Waitlist',
  },
];
