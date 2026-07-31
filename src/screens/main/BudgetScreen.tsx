import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography } from '../../theme';
import { budgetService } from '../../services';
import { formatCurrency, formatCurrencySimple } from '../../utils';
import { SkeletonLoader, ErrorView, LoadingButton } from '../../components';
import type { BudgetSummary, CreateBudgetData } from '../../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<MainTabParamList, 'Budget'>;

export const BudgetScreen = ({ navigation }: Props) => {
  const [budgetData, setBudgetData] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Form state
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<'monthly'>('monthly');

  useEffect(() => {
    loadBudgetData();
  }, []);

  const loadBudgetData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await budgetService.getBudgetSummary();
      setBudgetData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load budget data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBudget = () => {
    setModalVisible(true);
  };

  const handleCreateBudget = async () => {
    if (!category.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }
    if (!amount.trim() || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      setCreating(true);
      
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const budgetData: CreateBudgetData = {
        category: category.trim(),
        amount: parseFloat(amount),
        period: 'monthly',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        emoji: '💰',
        color: '#007AFF',
        alertThreshold: 80,
      };

      await budgetService.createBudget(budgetData);
      
      Alert.alert('Success', 'Budget created successfully!');
      setModalVisible(false);
      setCategory('');
      setAmount('');
      loadBudgetData(); // Reload data
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create budget');
    } finally {
      setCreating(false);
    }
  };

  const handleEditBudget = (categoryId: string) => {
    Alert.alert('Edit Budget', `Edit budget for category ${categoryId} - Coming soon!`);
  };

  if (loading) {
    return <SkeletonLoader />;
  }

  if (error || !budgetData) {
    return <ErrorView message={error || 'Failed to load budgets'} onRetry={loadBudgetData} />;
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Budget</Text>
          <Text style={styles.subtitle}>Track your spending limits</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddBudget}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Monthly Budget Overview */}
      <View>
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.overviewCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.overviewLabel}>Monthly Budget</Text>
          <Text style={styles.overviewAmount}>
            {formatCurrencySimple(budgetData.monthly.total)}
          </Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(parseFloat(budgetData.monthly.percentage), 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressPercentage}>
              {parseFloat(budgetData.monthly.percentage).toFixed(1)}%
            </Text>
          </View>
          <View style={styles.overviewRow}>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewItemLabel}>Spent</Text>
              <Text style={styles.overviewItemValue}>
                {formatCurrencySimple(budgetData.monthly.spent)}
              </Text>
            </View>
            <View style={styles.overviewDivider} />
            <View style={styles.overviewItem}>
              <Text style={styles.overviewItemLabel}>Remaining</Text>
              <Text style={styles.overviewItemValue}>
                {formatCurrencySimple(budgetData.monthly.remaining)}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Warning Cards */}
      {budgetData.warnings && budgetData.warnings.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Budget Alerts</Text>
          {budgetData.warnings.map((warning, index) => (
            <View
              key={warning.id}
              style={[
                styles.warningCard,
                {
                  backgroundColor:
                    warning.severity === 'high'
                      ? colors.error + '15'
                      : colors.warning + '15',
                },
              ]}
            >
              <Text style={styles.warningEmoji}>{warning.emoji}</Text>
              <View style={styles.warningContent}>
                <Text style={styles.warningCategory}>{warning.category}</Text>
                <Text style={styles.warningMessage}>{warning.message}</Text>
              </View>
              <View
                style={[
                  styles.severityBadge,
                  {
                    backgroundColor:
                      warning.severity === 'high' ? colors.error : colors.warning,
                  },
                ]}
              >
                <Text style={styles.severityText}>
                  {warning.severity === 'high' ? 'High' : 'Medium'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Category Budgets */}
      {budgetData.categories && budgetData.categories.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category Budgets</Text>
          {budgetData.categories.map((category, index) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryCard}
              onPress={() => handleEditBudget(category.id)}
            >
              <View style={styles.categoryHeader}>
                <View style={styles.categoryLeft}>
                  <View
                    style={[
                      styles.categoryIcon,
                      { backgroundColor: category.color + '20' },
                    ]}
                  >
                    <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.categorySubtext}>
                      {formatCurrencySimple(category.spent)} spent
                    </Text>
                  </View>
                </View>
                <View style={styles.categoryRight}>
                  <Text style={styles.categoryAmount}>
                    {formatCurrencySimple(category.budget)}
                  </Text>
                  <Text
                    style={[
                      styles.categoryRemaining,
                      {
                        color:
                          parseFloat(category.percentage) > 90
                            ? colors.error
                            : parseFloat(category.percentage) > 75
                            ? colors.warning
                            : colors.success,
                      },
                    ]}
                  >
                    {formatCurrencySimple(category.remaining)} left
                  </Text>
                </View>
              </View>
              <View style={styles.categoryProgressContainer}>
                <View style={styles.categoryProgressBar}>
                  <View
                    style={[
                      styles.categoryProgressFill,
                      {
                        width: `${Math.min(parseFloat(category.percentage), 100)}%`,
                        backgroundColor:
                          parseFloat(category.percentage) > 90
                            ? colors.error
                            : parseFloat(category.percentage) > 75
                            ? colors.warning
                            : category.color,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.categoryPercentage}>
                  {parseFloat(category.percentage).toFixed(1)}%
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Empty State */}
      {(!budgetData.categories || budgetData.categories.length === 0) && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>💰</Text>
          <Text style={styles.emptyText}>No budgets yet</Text>
          <Text style={styles.emptySubtext}>Start by creating your first budget</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={handleAddBudget}>
            <Text style={styles.emptyButtonText}>Create Budget</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Add Budget Modal */}
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
            <ScrollView style={styles.modalScroll}>
              <View style={styles.sheetHandle} />
              
              <Text style={styles.modalTitle}>Create Budget</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Category Name</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., Food & Dining"
                  placeholderTextColor={colors.textSecondary}
                  value={category}
                  onChangeText={setCategory}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Monthly Budget Amount (₹)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., 5000"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => setModalVisible(false)}
                  disabled={creating}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.createButton, creating && styles.createButtonDisabled]} 
                  onPress={handleCreateBudget}
                  disabled={creating}
                >
                  <Text style={styles.createButtonText}>
                    {creating ? 'Creating...' : 'Create Budget'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
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
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
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
  overviewCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  overviewLabel: {
    ...typography.body,
    color: colors.white,
    opacity: 0.9,
    marginBottom: spacing.xs,
  },
  overviewAmount: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.md,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: 4,
  },
  progressPercentage: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
    minWidth: 50,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewItem: {
    flex: 1,
  },
  overviewItemLabel: {
    ...typography.caption,
    color: colors.white,
    opacity: 0.8,
    marginBottom: spacing.xs,
  },
  overviewItemValue: {
    ...typography.h3,
    color: colors.white,
    fontWeight: 'bold',
  },
  overviewDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: spacing.md,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  warningEmoji: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  warningContent: {
    flex: 1,
  },
  warningCategory: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  warningMessage: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  severityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    ...typography.caption,
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  categoryCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  categorySubtext: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    ...typography.body,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  categoryRemaining: {
    ...typography.caption,
    fontWeight: '600',
  },
  categoryProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: spacing.sm,
  },
  categoryProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  categoryPercentage: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    minWidth: 45,
    textAlign: 'right',
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
    marginBottom: spacing.lg,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
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
    maxHeight: '60%',
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
  modalTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  formLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  formInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
