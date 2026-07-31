import { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, ScrollView } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { TransactionItem, SearchBar, FilterChip, SkeletonLoader, ErrorView } from '../../components';
import { transactionService } from '../../services';
import { formatCurrency } from '../../utils';
import { API_BASE_URL } from '../../constants';
import type { Transaction } from '../../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<MainTabParamList, 'Transactions'>;

export const TransactionsScreen = ({ navigation }: Props) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, [selectedType]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching transactions from backend...');
      console.log('API URL:', API_BASE_URL);
      
      const params = selectedType !== 'all' ? { type: selectedType } : undefined;
      const response = await transactionService.getTransactions(params);
      
      console.log('✅ Transactions received:', response);
      console.log('📊 Transaction count:', response.data?.length || 0);
      
      setTransactions(response.data || []);
    } catch (err: any) {
      console.error('❌ Error loading transactions:', err);
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesSearch =
        (transaction.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesSearch;
    });
  }, [transactions, searchQuery]);

  // Calculate totals
  const totals = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = Math.abs(
      filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)
    );

    return { income, expense };
  }, [filteredTransactions]);

  const handleTransactionPress = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setModalVisible(true);
  };

  const handleEdit = () => {
    setModalVisible(false);
    setTimeout(() => {
      navigation.navigate('AddTransaction', { transaction: selectedTransaction });
    }, 300);
  };

  const handleDelete = async () => {
    if (!selectedTransaction) return;

    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await transactionService.deleteTransaction(selectedTransaction._id);
              setTransactions(prev => prev.filter(t => t._id !== selectedTransaction._id));
              setModalVisible(false);
              Alert.alert('Success', 'Transaction deleted successfully');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete transaction');
            }
          },
        },
      ]
    );
  };

  const renderTransaction = ({ item, index }: { item: Transaction; index: number }) => (
    <TransactionItem
      transaction={item}
      index={index}
      onPress={() => handleTransactionPress(item)}
    />
  );

  if (loading) {
    return <SkeletonLoader />;
  }

  if (error) {
    return <ErrorView message={error} onRetry={loadTransactions} />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddTransaction', {})}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, { backgroundColor: colors.success + '20' }]}>
          <Text style={styles.summaryLabel}>Income</Text>
          <Text style={[styles.summaryAmount, { color: colors.success }]}>
            +{formatCurrency(totals.income)}
          </Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.error + '20' }]}>
          <Text style={styles.summaryLabel}>Expenses</Text>
          <Text style={[styles.summaryAmount, { color: colors.error }]}>
            -{formatCurrency(totals.expense)}
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search transactions..."
        />
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        <FilterChip
          label="All"
          selected={selectedType === 'all'}
          onPress={() => setSelectedType('all')}
        />
        <FilterChip
          label="Income"
          selected={selectedType === 'income'}
          onPress={() => setSelectedType('income')}
        />
        <FilterChip
          label="Expense"
          selected={selectedType === 'expense'}
          onPress={() => setSelectedType('expense')}
        />
      </View>

      {/* Transaction List */}
      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>No transactions found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search term' : 'Add your first transaction'}
            </Text>
          </View>
        }
      />

      {/* Transaction Details Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <View style={styles.modalContent}>
            {selectedTransaction && (
              <ScrollView style={styles.modalScroll}>
                <View style={styles.sheetHandle} />
                
                <View style={styles.transactionDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailIcon}>{selectedTransaction.emoji || (selectedTransaction.type === 'income' ? '💰' : '💸')}</Text>
                    <View style={styles.detailInfo}>
                      <Text style={styles.detailTitle}>{selectedTransaction.description || selectedTransaction.category}</Text>
                      <Text style={styles.detailCategory}>{selectedTransaction.category}</Text>
                    </View>
                    <Text
                      style={[
                        styles.detailAmount,
                        {
                          color:
                            selectedTransaction.type === 'income'
                              ? colors.success
                              : colors.error,
                        },
                      ]}
                    >
                      {selectedTransaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(Math.abs(selectedTransaction.amount))}
                    </Text>
                  </View>

                  {selectedTransaction.notes && (
                    <View style={styles.descriptionContainer}>
                      <Text style={styles.descriptionLabel}>Notes</Text>
                      <Text style={styles.descriptionText}>{selectedTransaction.notes}</Text>
                    </View>
                  )}

                  <View style={styles.metaContainer}>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Date</Text>
                      <Text style={styles.metaValue}>
                        {new Date(selectedTransaction.date).toLocaleDateString('en-IN')}
                      </Text>
                    </View>
                    {selectedTransaction.paymentMethod && (
                      <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Method</Text>
                        <Text style={styles.metaValue}>{selectedTransaction.paymentMethod}</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                    <Text style={styles.editButtonText}>✏️ Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                    <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  summaryCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  listContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 3,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 12,
  },
  modalScroll: {
    padding: spacing.lg,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  transactionDetails: {},
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  detailIcon: {
    fontSize: 40,
    marginRight: spacing.md,
  },
  detailInfo: {
    flex: 1,
  },
  detailTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  detailCategory: {
    ...typography.body,
    color: colors.textSecondary,
  },
  detailAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  descriptionContainer: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  descriptionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  descriptionText: {
    ...typography.body,
    color: colors.text,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metaItem: {
    flex: 1,
    minWidth: '30%',
  },
  metaLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  metaValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  editButton: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  editButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: colors.error,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
