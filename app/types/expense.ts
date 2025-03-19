export interface Expense {
  _id: string;
  id: string;
  groupId: string;
  description: string;
  amount: number;
  paidBy: string;
  splitBetween: string[];
  createdAt: string;
  type: 'expense' | 'settlement';
}
