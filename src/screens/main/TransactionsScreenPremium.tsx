import { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { SearchBar, FilterChip, SkeletonLoader, ErrorView } from '../../components';
import { transactionService } from '../../services';
import { formatCurrency } from '../../utils';
import { API_BASE_URL } from '../../constants';
import type { Transaction } from '../../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<MainTabParamList, 'Transactions'>;

// Category icons mapping with premium vector icons
const getCategoryIcon = (category: string): { name: string; type: 'ionicons' | 'material' } => {
  const categoryMap: Record<string, { name: string; type: 'ionicons' | 'material' }> = {
    food: { name: 'fast-food', type: 'ionicons' },
    groceries: { name: 'cart', type: 'ionicons' },
    shopping: { name: 'bag-handle', type: 'ionicons' },
    transport: { name: 'car', type: 'ionicons' },
    entertainment: { name: 'film', type: 'ionicons' },
    bills: { name: 'receipt', type: 'ionicons' },
    utilities: { name: 'flash', type: 'ionicons' },
    healthcare: { name: 'medical', type: 'ionicons' },
    education: { name: 'school', type: 'ionicons' },
    salary: { name: 'cash', type: 'ionicons' },
    investment: { name: 'trending-up', type: 'ionicons' },
    rent: { name: 'home', type: 'ionicons' },
    travel: { name: 'airplane', type: 'ionicons' },
    gym: { name: 'fitness', type: 'ionicons' },
    restaurant: { name: 'restaurant', type: 'ionicons' },
    clothing: { name: 'shirt', type: 'ionicons' },
    electronics: { name: 'phone-portrait', type: 'ionicons' },
    insurance: { name: 'shield-checkmark', type: 'ionicons' },
    subscription: { name: 'repeat', type: 'ionicons' },
    gift: { name: 'gift', type: 'ionicons' },
    other: { name: 'wallet', type: 'ionicons' },
  };
  return categoryMap[category.toLowerCase()] || { name: 'wallet', type: 'ionicons' };
};

// Category colors
const getCategoryColor = (category: string): string => {
  const colorMap: Record<string, string> = {
    food: colors.chartGold,
    groceries: colors.chartGreen,
    shopping: colors.accent,
    transport: colors.chartBlue,
    entertainment: colors.chartPurple,
    bills: colors.warning,
    healthcare: colors.chartRed,
    education: colors.info,
    salary: colors.success,
    investment: colors.chartBronze,
    rent: colors.accent,
    utilities: colors.warning,
    travel: colors.chartBlue,
    other: colors.textSecondary,
  };
  return colorMap[category.toLowerCase()] || colors.textSecondary;
};

export const TransactionsScreen = ({ navigation }: Props) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [selectedType])
  );

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = selectedType !== 'all' ? { type: selectedType } : undefined;
      const response = await transactionService.getTransactions(params);
      
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
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const expense = Math.abs(
      filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    );

    return { income, expense };
  }, [filteredTransactions]);

  const handleTransactionPress = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setModalVisible(true);
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

  const renderTransaction = ({ item, index }: { item: Transaction; index: number }) => {
    const categoryIcon = getCategoryIcon(item.category);
    const categoryColor = getCategoryColor(item.category);

    return (
      <TouchableOpacity
        style={styles.transactionCard}
        onPress={() => handleTransactionPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.transactionLeft}>
          <View style={[styles.transactionIcon, { backgroundColor: categoryColor + '20' }]}>
            {categoryIcon.type === 'ionicons' ? (
              <Ionicons name={categoryIcon.name as any} size={24} color={categoryColor} />
            ) : (
              <MaterialCommunityIcons name={categoryIcon.name as any} size={24} color={categoryColor} />
            )}
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionTitle}>{item.description || item.category}</Text>
            <Text style={styles.transactionDate}>
              {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
        </View>
        <Text
          style={[
            styles.transactionAmount,
            { color: item.type === 'income' ? colors.success : colors.text },
          ]}
        >
          {item.type === 'income' ? '+' : '-'}₹{Math.abs(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <SkeletonLoader />;
  }

  if (error) {
    return <ErrorView message={error} onRetry={loadTransactions} />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[colors.background, colors.backgroundSecondary]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <Text style={styles.title}>Transactions</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddTransaction', {})}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={colors.gradientPrimary}
              style={styles.addButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="add" size={24} color={colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconContainer, { backgroundColor: colors.success + '15' }]}>
              <Ionicons name="arrow-down" size={20} color={colors.success} />
            </View>
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryLabel}>Income</Text>
              <Text style={[styles.summaryAmount, { color: colors.success }]}>
                ₹{totals.income.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconContainer, { backgroundColor: colors.expense + '15' }]}>
              <Ionicons name="arrow-up" size={20} color={colors.expense} />
            </View>
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryLabel}>Expenses</Text>
              <Text style={[styles.summaryAmount, { color: colors.expense }]}>
                ₹{totals.expense.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

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
            <View style={styles.emptyIcon}>
              <Ionicons name="receipt-outline" size={64} color={colors.textSecondary} />
            </View>
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
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.sheetHandle} />
                
                <View style={styles.transactionDetails}>
                  <View style={styles.detailHeader}>
                    {(() => {
                      const categoryIcon = getCategoryIcon(selectedTransaction.category);
                      const categoryColor = getCategoryColor(selectedTransaction.category);
                      return (
                        <View style={[styles.detailIconLarge, { backgroundColor: categoryColor + '20' }]}>
                          {categoryIcon.type === 'ionicons' ? (
                            <Ionicons name={categoryIcon.name as any} size={32} color={categoryColor} />
                          ) : (
                            <MaterialCommunityIcons name={categoryIcon.name as any} size={32} color={categoryColor} />
                          )}
                        </View>
                      );
                    })()}
                    <Text style={styles.detailTitle}>{selectedTransaction.description || selectedTransaction.category}</Text>
                    <Text style={styles.detailCategory}>{selectedTransaction.category}</Text>
                    <Text
                      style={[
                        styles.detailAmountLarge,
                        {
                          color:
                            selectedTransaction.type === 'income'
                              ? colors.success
                              : colors.expense,
                        },
                      ]}
                    >
                      {selectedTransaction.type === 'income' ? '+' : '-'}
                      ₹{Math.abs(selectedTransaction.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                  </View>

                  {selectedTransaction.notes && (
                    <View style={styles.notesContainer}>
                      <View style={styles.notesHeader}>
                        <Ionicons name="document-text-outline" size={18} color={colors.textSecondary} />
                        <Text style={styles.notesLabel}>Notes</Text>
                      </View>
                      <Text style={styles.notesText}>{selectedTransaction.notes}</Text>
                    </View>
                  )}

                  <View style={styles.metaContainer}>
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar-outline" size={18} color={colors.accent} />
                      <View style={styles.metaInfo}>
                        <Text style={styles.metaLabel}>Date</Text>
                        <Text style={styles.metaValue}>
                          {new Date(selectedTransaction.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </Text>
                      </View>
                    </View>
                    {selectedTransaction.paymentMethod && (
                      <View style={styles.metaItem}>
                        <Ionicons name="card-outline" size={18} color={colors.accent} />
                        <View style={styles.metaInfo}>
                          <Text style={styles.metaLabel}>Payment Method</Text>
                          <Text style={styles.metaValue}>{selectedTransaction.paymentMethod}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                    <Ionicons name="trash-outline" size={20} color={colors.white} />
                    <Text style={styles.deleteButtonText}>Delete</Text>
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
    paddingTop: spacing.huge,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.displaySmall,
    color: colors.text,
  },
  addButton: {
    borderRadius: borderRadius.round,
    ...shadows.md,
  },
  addButtonGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  summaryCard: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    ...shadows.sm,
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
  },
  summaryAmount: {
    ...typography.titleLarge,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.base,
    marginBottom: spacing.base,
    gap: spacing.sm,
  },
  listContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    ...typography.titleMedium,
    color: colors.text,
    marginBottom: spacing.xxs,
  },
  transactionDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  transactionAmount: {
    ...typography.titleLarge,
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.massive,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
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
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    maxHeight: '75%',
    ...shadows.xl,
  },
  modalScroll: {
    padding: spacing.lg,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: borderRadius.round,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  transactionDetails: {},
  detailHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  detailIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  detailTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  detailCategory: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.base,
    textTransform: 'capitalize',
  },
  detailAmountLarge: {
    fontSize: 36,
    fontWeight: '700',
  },
  notesContainer: {
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.base,
    borderRadius: borderRadius.base,
    marginBottom: spacing.base,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  notesLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  notesText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
  },
  metaContainer: {
    gap: spacing.base,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.base,
    borderRadius: borderRadius.base,
    gap: spacing.md,
  },
  metaInfo: {
    flex: 1,
  },
  metaLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
  },
  metaValue: {
    ...typography.titleMedium,
    color: colors.text,
  },
  actionButtons: {
    marginTop: spacing.xl,
  },
  deleteButton: {
    flexDirection: 'row',
    backgroundColor: colors.error,
    padding: spacing.base,
    borderRadius: borderRadius.base,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.md,
  },
  deleteButtonText: {
    ...typography.button,
    color: colors.white,
  },
});
