import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { Expense } from '../types/expense';
import { Group } from '../types/group';
import AddExpenseModal from '@/components/AddExpenseModal';
import { Swipeable } from 'react-native-gesture-handler';

interface GroupedExpenses {
  [key: string]: Expense[];
}

interface GroupDetailScreenProps {
  onExpenseAdded?: () => void;
}

export default function GroupDetailScreen({
  onExpenseAdded,
}: GroupDetailScreenProps) {
  const { id } = useLocalSearchParams();
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddExpenseModalVisible, setIsAddExpenseModalVisible] =
    useState(false);

  const fetchData = async () => {
    try {
      const [groupData, expensesData] = await Promise.all([
        api.groups.getById(id as string),
        api.groups.getExpenses(id as string),
      ]);

      setGroup(groupData);
      setExpenses(expensesData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (id) {
        fetchData();
      }
    }, [id])
  );

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

  const handleDeleteExpense = async (expenseId: string) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.groups.deleteExpense(id as string, expenseId);
              const updatedExpenses = await api.groups.getExpenses(
                id as string
              );
              setExpenses(updatedExpenses);
            } catch (err) {
              setError(
                err instanceof Error ? err.message : 'Failed to delete expense'
              );
            }
          },
        },
      ]
    );
  };

  const renderRightActions = (expenseId: string) => {
    return (
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteExpense(expenseId)}
      >
        <Ionicons name="trash-outline" size={24} color="#FF3B30" />
      </TouchableOpacity>
    );
  };

  const renderExpenseItem = (expense: Expense) => {
    const isSettlement = expense.type === 'settlement';
    const icon = isSettlement ? 'swap-horizontal' : 'receipt';
    const color = isSettlement ? '#34C759' : '#007AFF';

    return (
      <Swipeable
        key={expense.id}
        renderRightActions={() => renderRightActions(expense.id)}
        rightThreshold={40}
        overshootRight={false}
      >
        <View style={styles.expenseItem}>
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
      </Swipeable>
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

  const handleAddExpense = async (
    description: string,
    amount: number,
    paidBy: string,
    splitBetween: string[]
  ) => {
    try {
      await api.groups.createExpense(id as string, {
        description,
        amount,
        paidBy,
        splitBetween,
      });

      // Refresh the data
      await fetchData();
      setIsAddExpenseModalVisible(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add expense');
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: group?.name,
          headerShown: true,
          headerBackTitle: 'Groups',
        }}
      />
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
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
                    (a, b) =>
                      new Date(b[0]).getTime() - new Date(a[0]).getTime()
                  )
                  .map(([month, monthExpenses]) =>
                    renderExpenseGroup(month, monthExpenses)
                  )}
              </View>
            )}
          </View>
        </ScrollView>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsAddExpenseModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>New Expense</Text>
        </TouchableOpacity>
      </View>

      {group && (
        <AddExpenseModal
          visible={isAddExpenseModalVisible}
          onClose={() => setIsAddExpenseModalVisible(false)}
          onSubmit={handleAddExpense}
          members={group.members}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
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
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
  deleteButton: {
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    marginLeft: 8,
    borderRadius: 8,
  },
});
