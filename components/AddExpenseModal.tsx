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

interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (
    description: string,
    amount: number,
    paidBy: string,
    splitBetween: string[]
  ) => void;
  members: string[];
}

export default function AddExpenseModal({
  visible,
  onClose,
  onSubmit,
  members,
}: AddExpenseModalProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showPaidByDropdown, setShowPaidByDropdown] = useState(false);

  useEffect(() => {
    // Select all members by default when modal opens
    if (visible) {
      setSelectedMembers(members);
    }
  }, [visible, members]);

  const handleToggleMember = (member: string) => {
    setSelectedMembers((prev) =>
      prev.includes(member)
        ? prev.filter((m) => m !== member)
        : [...prev, member]
    );
  };

  const handleSubmit = () => {
    if (!description.trim()) {
      setError('Please enter a description');
      return;
    }

    if (!amount.trim() || isNaN(Number(amount))) {
      setError('Please enter a valid amount');
      return;
    }

    if (!paidBy.trim()) {
      setError('Please select who paid');
      return;
    }

    if (selectedMembers.length === 0) {
      setError('Please select at least one member to split with');
      return;
    }

    onSubmit(
      description.trim(),
      Number(amount),
      paidBy.trim(),
      selectedMembers
    );
    setDescription('');
    setAmount('');
    setPaidBy('');
    setSelectedMembers([]);
    setError(null);
  };

  const renderMemberItem = ({ item: member }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.memberItem,
        selectedMembers.includes(member) && styles.selectedMemberItem,
      ]}
      onPress={() => handleToggleMember(member)}
    >
      <Text
        style={[
          styles.memberText,
          selectedMembers.includes(member) && styles.selectedMemberText,
        ]}
      >
        {member}
      </Text>
      {selectedMembers.includes(member) && (
        <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
      )}
    </TouchableOpacity>
  );

  const renderContent = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.formContent}
    >
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          placeholder="Enter expense description"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Amount</Text>
        <View style={styles.amountContainer}>
          <Text style={styles.currencySymbol}>₹</Text>
          <TextInput
            style={[styles.input, styles.amountInput]}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Paid By</Text>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setShowPaidByDropdown(!showPaidByDropdown)}
        >
          <Text
            style={[
              styles.dropdownButtonText,
              !paidBy && styles.placeholderText,
            ]}
          >
            {paidBy || 'Select who paid'}
          </Text>
          <Ionicons
            name={showPaidByDropdown ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#666"
          />
        </TouchableOpacity>
        {showPaidByDropdown && (
          <View style={styles.dropdownList}>
            {members.map((member) => (
              <TouchableOpacity
                key={member}
                style={[
                  styles.dropdownItem,
                  paidBy === member && styles.selectedDropdownItem,
                ]}
                onPress={() => {
                  setPaidBy(member);
                  setShowPaidByDropdown(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    paidBy === member && styles.selectedDropdownItemText,
                  ]}
                >
                  {member}
                </Text>
                {paidBy === member && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Split Between</Text>
        <FlatList
          data={members}
          renderItem={renderMemberItem}
          keyExtractor={(item) => item}
          style={styles.membersList}
        />
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Add Expense</Text>
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
            <Text style={styles.modalTitle}>Add New Expense</Text>
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
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 16,
    color: '#666',
    marginRight: 4,
  },
  amountInput: {
    borderWidth: 0,
    padding: 12,
    flex: 1,
  },
  membersList: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedMemberItem: {
    backgroundColor: '#E3F2FD',
  },
  memberText: {
    fontSize: 16,
    color: '#333',
  },
  selectedMemberText: {
    color: '#007AFF',
  },
  paidByItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedPaidByItem: {
    backgroundColor: '#E3F2FD',
  },
  paidByText: {
    fontSize: 16,
    color: '#333',
  },
  selectedPaidByText: {
    color: '#007AFF',
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
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 4,
    zIndex: 1000,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedDropdownItem: {
    backgroundColor: '#E3F2FD',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedDropdownItemText: {
    color: '#007AFF',
  },
});
