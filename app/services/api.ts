import config from '../config';
import { Group } from '../types/group';
import { Expense } from '../types/expense';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    throw new ApiError(
      response.status,
      `HTTP error! status: ${response.status}`
    );
  }
  return response.json();
};

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
  },
};
