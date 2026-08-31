import { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, ScrollView, RefreshControl } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { SearchBar, FilterChip, SkeletonLoader, ErrorView, LoadingOverlay } from '../../components';
import { useDataStore } from '../../store';
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
  const [loading, setLoading] = useState(false); // Changed to false
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { refreshTrigger, triggerRefresh } = useDataStore();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const categoryOptions = [
    { id: 'all', label: 'All', icon: 'apps', color: colors.accent },
    { id: 'food', label: 'Food', icon: 'fast-food', color: colors.chartGold },
    { id: 'groceries', label: 'Groceries', icon: 'cart', color: colors.chartGreen },
    { id: 'shopping', label: 'Shopping', icon: 'bag-handle', color: colors.accent },
    { id: 'transport', label: 'Transport', icon: 'car', color: colors.chartBlue },
    { id: 'bills', label: 'Bills', icon: 'receipt', color: colors.warning },
    { id: 'entertainment', label: 'Entertainment', icon: 'film', color: colors.chartPurple },
    { id: 'healthcare', label: 'Health', icon: 'medical', color: colors.chartRed },
    { id: 'education', label: 'Education', icon: 'school', color: colors.info },
    { id: 'salary', label: 'Salary', icon: 'cash', color: colors.success },
    { id: 'rent', label: 'Rent', icon: 'home', color: colors.accent },
    { id: 'travel', label: 'Travel', icon: 'airplane', color: colors.chartBlue },
  ];

  // Refresh transactions on mount or type changes
  useEffect(() => {
    loadTransactions();
  }, [selectedType, refreshTrigger]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadTransactions();
    setIsRefreshing(false);
  }, [selectedType]);

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

      const matchesCategory =
        selectedCategory === 'all' ||
        transaction.category.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [transactions, searchQuery, selectedCategory]);

  // Calculate totals
  const totals = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const expense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const net = income - expense;

    return { income, expense, net };
  }, [filteredTransactions]);

  const handleTransactionPress = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setModalVisible(true);
  };

  const handleEdit = () => {
    if (!selectedTransaction) return;
    const tToEdit = selectedTransaction;
    setModalVisible(false);
    navigation.navigate('AddTransaction', { transaction: tToEdit });
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
              triggerRefresh();
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
          <View style={[styles.transactionIcon, { backgroundColor: categoryColor + '18' }]}>
            {categoryIcon.type === 'ionicons' ? (
              <Ionicons name={categoryIcon.name as any} size={22} color={categoryColor} />
            ) : (
              <MaterialCommunityIcons name={categoryIcon.name as any} size={22} color={categoryColor} />
            )}
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionTitle} numberOfLines={1}>
              {item.description || item.category}
            </Text>
            <View style={styles.transactionMetaRow}>
              <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '15' }]}>
                <Text style={[styles.categoryBadgeText, { color: categoryColor }]}>
                  {item.category}
                </Text>
              </View>
              <Text style={styles.transactionDate}>
                {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.transactionRight}>
          <Text
            style={[
              styles.transactionAmount,
              { color: item.type === 'income' ? colors.success : colors.expense },
            ]}
          >
            {item.type === 'income' ? '+' : '-'}₹{Math.abs(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          {item.paymentMethod ? (
            <Text style={styles.paymentMethodTag}>{item.paymentMethod}</Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  // Don't show error during initial load
  if (error && !loading) {
    return <ErrorView message={error} onRetry={loadTransactions} />;
  }

  return (
    <View style={styles.container}>
      <LoadingOverlay visible={loading} message="Loading Transactions..." />
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
              colors={colors.gradientPrimary as [string, string, ...string[]]}
              style={styles.addButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="add" size={24} color={colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Summary Cards (Income, Expenses, Net Balance) */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconContainer, { backgroundColor: colors.success + '15' }]}>
              <Ionicons name="arrow-down" size={18} color={colors.success} />
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
              <Ionicons name="arrow-up" size={18} color={colors.expense} />
            </View>
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryLabel}>Expenses</Text>
              <Text style={[styles.summaryAmount, { color: colors.expense }]}>
                ₹{totals.expense.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconContainer, { backgroundColor: (totals.net >= 0 ? colors.accent : colors.warning) + '15' }]}>
              <Ionicons name={totals.net >= 0 ? "wallet-outline" : "alert-circle-outline"} size={18} color={totals.net >= 0 ? colors.accent : colors.warning} />
            </View>
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryLabel}>Net Flow</Text>
              <Text style={[styles.summaryAmount, { color: totals.net >= 0 ? colors.accent : colors.warning }]}>
                {totals.net >= 0 ? '+' : ''}₹{totals.net.toLocaleString('en-IN')}
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

      {/* Type Filter Chips (All / Income / Expense) */}
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

      {/* Category Dropdown Selector */}
      <View style={styles.categoryDropdownSection}>
        <TouchableOpacity
          style={[
            styles.categoryDropdownTrigger,
            categoryDropdownOpen && styles.categoryDropdownTriggerActive,
          ]}
          onPress={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
          activeOpacity={0.8}
        >
          {(() => {
            const currentCat = categoryOptions.find(c => c.id === selectedCategory) || categoryOptions[0];
            return (
              <View style={styles.dropdownSelectedContainer}>
                <View style={[styles.dropdownIconBadge, { backgroundColor: currentCat.color + '20' }]}>
                  <Ionicons name={currentCat.icon as any} size={18} color={currentCat.color} />
                </View>
                <Text style={styles.dropdownSelectedText}>
                  Category: <Text style={{ color: currentCat.color, fontWeight: '700' }}>{currentCat.label}</Text>
                </Text>
              </View>
            );
          })()}
          <Ionicons
            name={categoryDropdownOpen ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.accent}
          />
        </TouchableOpacity>

        {/* Dropdown Options List */}
        {categoryDropdownOpen && (
          <View style={styles.categoryDropdownListContainer}>
            <ScrollView style={styles.dropdownListScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {categoryOptions.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.dropdownItem,
                      isSelected && styles.dropdownItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedCategory(cat.id);
                      setCategoryDropdownOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dropdownItemLeft}>
                      <View style={[styles.dropdownItemIcon, { backgroundColor: cat.color + '20' }, isSelected && { backgroundColor: cat.color }]}>
                        <Ionicons name={cat.icon as any} size={16} color={isSelected ? colors.white : cat.color} />
                      </View>
                      <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextSelected]}>
                        {cat.label}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Active Category Breakdown Banner */}
      {selectedCategory !== 'all' && (
        <View style={styles.categoryBanner}>
          <Ionicons name="funnel-outline" size={16} color={colors.accent} />
          <Text style={styles.categoryBannerText}>
            Showing <Text style={{ fontWeight: '700', color: colors.accent }}>{filteredTransactions.length}</Text> transaction(s) in{' '}
            <Text style={{ fontWeight: '700', color: colors.text }}>{categoryOptions.find(c => c.id === selectedCategory)?.label}</Text>
          </Text>
        </View>
      )}

      {/* Transaction List */}
      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="receipt-outline" size={56} color={colors.accent} />
            </View>
            <Text style={styles.emptyText}>No transactions found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery || selectedCategory !== 'all' || selectedType !== 'all' 
                ? 'Try adjusting your filters or search terms' 
                : 'Start tracking your spending and income'}
            </Text>
            <TouchableOpacity
              style={styles.emptyAddButton}
              onPress={() => navigation.navigate('AddTransaction', {})}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.white} />
              <Text style={styles.emptyAddButtonText}>Add Transaction</Text>
            </TouchableOpacity>
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
                  <TouchableOpacity style={styles.editButton} onPress={handleEdit} activeOpacity={0.8}>
                    <LinearGradient
                      colors={colors.gradientPrimary as [string, string, ...string[]]}
                      style={styles.editButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons name="create-outline" size={20} color={colors.white} />
                      <Text style={styles.editButtonText}>Edit Transaction</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} activeOpacity={0.8}>
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
    gap: spacing.xs,
  },
  summaryCard: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border + '60',
    ...shadows.sm,
  },
  summaryIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  summaryInfo: {
    width: '100%',
  },
  summaryLabel: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
    fontWeight: '500',
  },
  summaryAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  listContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl + 40,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border + '40',
    ...shadows.sm,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.round,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  transactionDate: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    ...typography.titleMedium,
    fontWeight: '700',
    fontSize: 16,
  },
  paymentMethodTag: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.massive,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.accent + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyText: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    gap: spacing.xs,
    ...shadows.md,
  },
  emptyAddButtonText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '700',
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
  categoryDropdownSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    zIndex: 20,
  },
  categoryDropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  categoryDropdownTriggerActive: {
    borderColor: colors.accent,
    backgroundColor: colors.backgroundSecondary,
  },
  dropdownSelectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dropdownIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownSelectedText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  categoryDropdownListContainer: {
    marginTop: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: 220,
    overflow: 'hidden',
    ...shadows.md,
  },
  dropdownListScroll: {
    paddingVertical: spacing.xxs,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '30',
  },
  dropdownItemSelected: {
    backgroundColor: colors.accent + '10',
  },
  dropdownItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dropdownItemIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownItemText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '500',
  },
  dropdownItemTextSelected: {
    color: colors.accent,
    fontWeight: '700',
  },
  categoryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryBannerText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  actionButtons: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    gap: spacing.md,
  },
  editButton: {
    flex: 1,
    borderRadius: borderRadius.base,
    overflow: 'hidden',
    ...shadows.sm,
  },
  editButtonGradient: {
    flexDirection: 'row',
    padding: spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  editButtonText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '700',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.error,
    padding: spacing.base,
    borderRadius: borderRadius.base,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.sm,
  },
  deleteButtonText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '700',
  },
});
