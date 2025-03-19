import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router, Stack, useFocusEffect } from 'expo-router';
import { Group } from '../types/group';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import CreateGroupModal from '@/components/CreateGroupModal';

export default function HomeScreen() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

  const fetchGroups = async () => {
    try {
      const data = await api.groups.getAll();
      setGroups(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch groups');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch groups when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchGroups();
    }, [])
  );

  const handleCreateGroup = async (name: string, members: string[]) => {
    try {
      const newGroup = await api.groups.create({ name, members });
      setGroups([...groups, newGroup]);
      setIsCreateModalVisible(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group');
    }
  };

  const renderGroupItem = ({ item }: { item: Group }) => (
    <TouchableOpacity
      style={styles.groupItem}
      onPress={() => {
        router.push({
          pathname: '/group/[id]',
          params: { id: item.id },
        });
      }}
    >
      <View style={styles.groupIcon}>
        <Ionicons name="people" size={24} color="#007AFF" />
      </View>
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{item.name}</Text>
        <Text style={styles.groupMeta}>
          {item.members.length} members • ₹{item.totalExpenses.toFixed(2)}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
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

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Groups',
          headerShown: true,
        }}
      />
      <View style={styles.container}>
        {groups.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#999" />
            <Text style={styles.emptyStateText}>No groups yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Create a new group to get started
            </Text>
          </View>
        ) : (
          <FlatList
            data={groups}
            renderItem={renderGroupItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
          />
        )}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsCreateModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>New Group</Text>
        </TouchableOpacity>
      </View>

      <CreateGroupModal
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        onSubmit={handleCreateGroup}
      />
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
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  groupMeta: {
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 90,
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
});
