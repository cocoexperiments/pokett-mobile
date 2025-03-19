import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../app/services/api';
import { Member } from '../app/types/member';

interface CreateGroupModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (name: string, members: string[]) => void;
}

export default function CreateGroupModal({
  visible,
  onClose,
  onSubmit,
}: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Member[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = allMembers.filter((member) =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, allMembers]);

  const fetchMembers = async () => {
    try {
      const data = await api.members.getAll();
      setAllMembers(data);
    } catch (err) {
      console.error('Failed to fetch members:', err);
    }
  };

  const handleRemoveMember = (memberToRemove: string) => {
    setSelectedMembers(
      selectedMembers.filter((member) => member !== memberToRemove)
    );
  };

  const handleSelectMember = async (member: Member) => {
    if (!selectedMembers.includes(member.name)) {
      setSelectedMembers([...selectedMembers, member.name]);
    }
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleCreateMember = async (name: string) => {
    try {
      const newMember = await api.members.create(name);
      setSelectedMembers([...selectedMembers, newMember.name]);
      setAllMembers([...allMembers, newMember]);
      setSearchQuery('');
      setShowSuggestions(false);
    } catch (err) {
      console.error('Failed to create member:', err);
      setError('Failed to create member. Please try again.');
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Please enter a group name');
      return;
    }

    if (selectedMembers.length < 2) {
      setError('Please add at least 2 members');
      return;
    }

    onSubmit(name.trim(), selectedMembers);
    setName('');
    setSelectedMembers([]);
    setError(null);
  };

  const renderMemberTag = ({ item: member }: { item: string }) => (
    <View style={styles.memberTag}>
      <Text style={styles.memberTagText}>{member}</Text>
      <TouchableOpacity
        onPress={() => handleRemoveMember(member)}
        style={styles.removeButton}
      >
        <Ionicons name="close-circle" size={16} color="#666" />
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.formContent}
    >
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Group Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter group name"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.membersContainer}>
        <Text style={styles.label}>Members</Text>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#666"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search or add members"
            placeholderTextColor="#999"
            onFocus={() => setShowSuggestions(true)}
          />
        </View>

        {showSuggestions && (
          <View style={styles.suggestionsContainer}>
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleSelectMember(item)}
                >
                  <Text style={styles.suggestionText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleCreateMember(searchQuery)}
                >
                  <Text style={styles.suggestionText}>
                    Create "{searchQuery}"
                  </Text>
                </TouchableOpacity>
              }
            />
          </View>
        )}

        <View style={styles.selectedMembersContainer}>
          <FlatList
            data={selectedMembers}
            renderItem={renderMemberTag}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.selectedMembersList}
          />
        </View>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Create Group</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Group</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={[{ key: 'content' }]}
            renderItem={() => renderContent()}
            keyExtractor={(item) => item.key}
            contentContainerStyle={styles.form}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  form: {
    flexGrow: 1,
  },
  formContent: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  membersContainer: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  suggestionsContainer: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 12,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedMembersContainer: {
    marginTop: 12,
  },
  selectedMembersList: {
    flexGrow: 1,
  },
  memberTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  memberTagText: {
    fontSize: 14,
    color: '#333',
    marginRight: 4,
  },
  removeButton: {
    padding: 2,
    marginLeft: 2,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
