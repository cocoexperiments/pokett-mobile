import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { Expense } from '../types/expense';
import { Group } from '../types/group';

interface GroupedExpenses {
  [key: string]: Expense[];
}

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams();
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupData, expensesData] = await Promise.all([
          api.groups.getById(id as string),
          api.groups.getExpenses(id as string),
        ]);

        setGroup(groupData);
        setExpenses(expensesData);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : 'Failed to fetch data'
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Group not found</Text>
      </View>
    );
  }

  const groupExpensesByMonth = (expenses: Expense[]): GroupedExpenses => {
    return expenses.reduce((groups: GroupedExpenses, expense) => {
      const date = new Date(expense.createdAt);
      const monthKey = date.toLocaleString('default', {
        month: 'long',
        year: 'numeric',
      });
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(expense);
      return groups;
    }, {});
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const renderExpenseItem = (expense: Expense) => {
    const isSettlement = expense.type === 'settlement';
    const icon = isSettlement ? 'swap-horizontal' : 'receipt';
    const color = isSettlement ? '#34C759' : '#007AFF';

    return (
      <View key={expense.id} style={styles.expenseItem}>
        <View
          style={[
            styles.expenseIcon,
            { backgroundColor: isSettlement ? '#E8F5E9' : '#E3F2FD' },
          ]}
        >
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <View style={styles.expenseDetails}>
          {isSettlement ? (
            <Text style={styles.expenseDescription}>
              {expense.paidBy} paid {expense.splitBetween[0]}
            </Text>
          ) : (
            <>
              <Text style={styles.expenseDescription}>
                {expense.description}
              </Text>
              <Text style={styles.expenseMeta}>
                {expense.paidBy} • {expense.splitBetween.join(', ')}
              </Text>
            </>
          )}
        </View>
        <View style={styles.expenseAmount}>
          <Text style={[styles.amountText, { color }]}>
            ₹{expense.amount.toFixed(2)}
          </Text>
          <Text style={styles.expenseDate}>
            {formatDate(expense.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  const renderExpenseGroup = (month: string, expenses: Expense[]) => {
    return (
      <View key={month} style={styles.expenseGroup}>
        <Text style={styles.monthHeader}>{month}</Text>
        {expenses.map(renderExpenseItem)}
      </View>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: group.name,
          headerShown: true,
          headerBackTitle: 'Groups',
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.totalExpensesContainer}>
          <Text style={styles.totalExpenses}>
            Total Expenses: ₹{group.totalExpenses.toFixed(2)}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Members</Text>
          <View style={styles.membersList}>
            {group.members.map((member, index) => (
              <View key={index} style={styles.memberItem}>
                <Text style={styles.memberName}>{member}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Expenses</Text>
            <Text style={styles.expenseCount}>{expenses.length} items</Text>
          </View>
          {expenses.length === 0 ? (
            <Text style={styles.noExpensesText}>No expenses yet</Text>
          ) : (
            <View style={styles.expensesList}>
              {Object.entries(groupExpensesByMonth(expenses))
                .sort(
                  (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
                )
                .map(([month, monthExpenses]) =>
                  renderExpenseGroup(month, monthExpenses)
                )}
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.addExpenseButton}>
          <Text style={styles.addExpenseButtonText}>Add New Expense</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalExpensesContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  totalExpenses: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  expenseCount: {
    fontSize: 14,
    color: '#666',
  },
  membersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  memberItem: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  memberName: {
    fontSize: 14,
    color: '#333',
  },
  expensesList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  expenseIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseDetails: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
  },
  expenseMeta: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  expenseAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 15,
    fontWeight: '600',
  },
  expenseDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  noExpensesText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 20,
  },
  addExpenseButton: {
    backgroundColor: '#007AFF',
    margin: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addExpenseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  expenseGroup: {
    marginBottom: 8,
  },
  monthHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginTop: 16,
  },
});
