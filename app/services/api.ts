import config from '../config';
import { Group } from '../types/group';
import { Expense } from '../types/expense';
import { Member } from '../types/member';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Something went wrong');
  }

  // Handle empty responses (204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  // Handle responses with content
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  // For other responses, return empty object
  return {} as T;
}

export interface CreateGroupData {
  name: string;
  members: string[];
}

export interface CreateExpenseData {
  description: string;
  amount: number;
  paidBy: string;
  splitBetween: string[];
}

export const api = {
  groups: {
    getAll: async (): Promise<Group[]> => {
      const response = await fetch(`${config.apiUrl}/groups`);
      return handleResponse<Group[]>(response);
    },

    getById: async (id: string): Promise<Group> => {
      const response = await fetch(`${config.apiUrl}/groups/${id}`);
      return handleResponse<Group>(response);
    },

    getExpenses: async (id: string): Promise<Expense[]> => {
      const response = await fetch(`${config.apiUrl}/groups/${id}/expenses`);
      return handleResponse<Expense[]>(response);
    },

    create: async (data: CreateGroupData): Promise<Group> => {
      const response = await fetch(`${config.apiUrl}/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return handleResponse<Group>(response);
    },

    createExpense: async (
      groupId: string,
      data: CreateExpenseData
    ): Promise<Expense> => {
      const response = await fetch(
        `${config.apiUrl}/groups/${groupId}/expenses`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );
      return handleResponse<Expense>(response);
    },

    deleteExpense: async (
      groupId: string,
      expenseId: string
    ): Promise<void> => {
      const response = await fetch(
        `${config.apiUrl}/groups/${groupId}/expenses/${expenseId}`,
        {
          method: 'DELETE',
        }
      );
      return handleResponse<void>(response);
    },
  },
  members: {
    getAll: async (): Promise<Member[]> => {
      const response = await fetch(`${config.apiUrl}/members`);
      return handleResponse<Member[]>(response);
    },
    create: async (name: string): Promise<Member> => {
      const response = await fetch(`${config.apiUrl}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });
      return handleResponse<Member>(response);
    },
  },
};
