import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { budgetService } from '../../services';
import { formatCurrency, formatCurrencySimple } from '../../utils';
import { SkeletonLoader, ErrorView, LoadingButton, LoadingOverlay } from '../../components';
import { useDataStore } from '../../store';
import type { BudgetSummary, CreateBudgetData } from '../../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<MainTabParamList, 'Budget'>;

// Category icons mapping (matching Dashboard/Transaction pages)
const getCategoryIcon = (category: string): string => {
  const categoryMap: Record<string, string> = {
    'food': 'fast-food',
    'dining': 'fast-food',
    'groceries': 'cart',
    'shopping': 'bag-handle',
    'transport': 'car',
    'entertainment': 'film',
    'bills': 'receipt',
    'utilities': 'flash',
    'healthcare': 'medical',
    'health': 'medical',
    'education': 'school',
    'salary': 'cash',
    'investment': 'trending-up',
    'rent': 'home',
    'travel': 'airplane',
    'gym': 'fitness',
    'clothing': 'shirt',
    'electronics': 'phone-portrait',
    'insurance': 'shield-checkmark',
    'subscription': 'repeat',
    'gift': 'gift',
    'default': 'wallet',
  };
  
  const normalizedCategory = category.toLowerCase().replace(/[^a-z]/g, '');
  for (const [key, icon] of Object.entries(categoryMap)) {
    if (normalizedCategory.includes(key)) {
      return icon;
    }
  }
  return categoryMap['default'];
};

// Category colors mapping
const getCategoryColor = (category: string): string => {
  const colorMap: Record<string, string> = {
    food: colors.chartGold,
    dining: colors.chartGold,
    groceries: colors.success,
    shopping: colors.chartPurple,
    transport: colors.info,
    entertainment: colors.chartBronze,
    bills: colors.warning,
    utilities: colors.info,
    healthcare: colors.error,
    health: colors.error,
    education: colors.chartPurple,
    salary: colors.success,
    investment: colors.chartBlue,
    rent: colors.warning,
    travel: colors.chartBlue,
    gym: colors.chartBronze,
    clothing: colors.chartPurple,
    electronics: colors.info,
    insurance: colors.chartBlue,
    subscription: colors.warning,
    gift: colors.chartGold,
  };

  const normalizedCategory = category.toLowerCase().replace(/[^a-z]/g, '');
  for (const [key, color] of Object.entries(colorMap)) {
    if (normalizedCategory.includes(key)) {
      return color;
    }
  }
  return colors.primary;
};

const PREDEFINED_CATEGORIES = [
  'Food', 'Groceries', 'Shopping', 'Transport', 'Entertainment', 'Bills',
  'Utilities', 'Healthcare', 'Education', 'Investment', 'Rent',
  'Travel', 'Gym', 'Clothing', 'Electronics', 'Insurance', 'Subscription', 'Gift', 'Other'
];

export const BudgetScreen = ({ navigation }: Props) => {
  const [budgetData, setBudgetData] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(false); // Changed to false
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  
  // Form state
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<'monthly'>('monthly');
  const [alertThreshold, setAlertThreshold] = useState<number>(80);

  const { refreshTrigger, triggerRefresh } = useDataStore();

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refresh budget on mount or trigger
  useEffect(() => {
    loadBudgetData();
  }, [refreshTrigger]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadBudgetData();
    setIsRefreshing(false);
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
    setEditingBudgetId(null);
    setCategory('');
    setAmount('');
    setAlertThreshold(80);
    setModalVisible(true);
  };

  const handleSaveBudget = async () => {
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
        color: getCategoryColor(category),
        alertThreshold: alertThreshold,
      };

      if (editingBudgetId) {
        await budgetService.updateBudget(editingBudgetId, budgetData);
        Alert.alert('Success', 'Budget updated successfully!');
      } else {
        await budgetService.createBudget(budgetData);
        Alert.alert('Success', 'Budget created successfully!');
      }
      
      triggerRefresh();
      
      setModalVisible(false);
      setEditingBudgetId(null);
      setCategory('');
      setAmount('');
      loadBudgetData(); // Reload data
    } catch (err: any) {
      Alert.alert('Error', err.message || (editingBudgetId ? 'Failed to update budget' : 'Failed to create budget'));
    } finally {
      setCreating(false);
    }
  };

  const handleEditBudget = (budget: any) => {
    Alert.alert(
      'Budget Actions',
      `What would you like to do with "${budget.name}" budget?`,
      [
        {
          text: 'Edit',
          onPress: () => {
            setEditingBudgetId(budget.id);
            setCategory(budget.name);
            setAmount(budget.budget.toString());
            setAlertThreshold(budget.alertThreshold || 80);
            setModalVisible(true);
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeleteBudget(budget.id, budget.name),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleDeleteBudget = async (categoryId: string, categoryName: string) => {
    Alert.alert(
      'Delete Budget',
      `Are you sure you want to delete "${categoryName}" budget? This action cannot be undone.`,
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
              setLoading(true);
              await budgetService.deleteBudget(categoryId);
              triggerRefresh();
              Alert.alert('Success', 'Budget deleted successfully!');
              loadBudgetData(); // Reload data
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete budget');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Don't show error during initial load
  if (error && !loading) {
    return <ErrorView message={error} onRetry={loadBudgetData} />;
  }

  // Show nothing if still loading initial data
  if (!budgetData) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      <LoadingOverlay visible={loading} message="Loading Budget..." />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
      {/* Header - matching Transaction page style */}
      <LinearGradient
        colors={[colors.background, colors.backgroundSecondary]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <Text style={styles.title}>Budget</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddBudget}
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

        {/* Circular Progress Chart */}
        <View style={styles.chartContainer}>
          {(() => {
            const radius = 70;
            const strokeWidth = 14;
            const center = radius + strokeWidth;
            const size = center * 2;
            const circumference = 2 * Math.PI * radius;
            const percentage = budgetData.monthly.total > 0 
              ? Math.min((budgetData.monthly.spent / budgetData.monthly.total) * 100, 100)
              : 0;
            const strokeDashoffset = circumference - (percentage / 100) * circumference;
            const isOverBudget = budgetData.monthly.spent > budgetData.monthly.total;
            const chartColor = isOverBudget ? colors.error : (percentage > 80 ? colors.warning : colors.success);

            return (
              <View style={styles.chartWrapper}>
                <Svg width={size} height={size}>
                  <G rotation="-90" origin={`${center}, ${center}`}>
                    <Circle
                      cx={center}
                      cy={center}
                      r={radius}
                      stroke={colors.border}
                      strokeWidth={strokeWidth}
                      fill="transparent"
                    />
                    <Circle
                      cx={center}
                      cy={center}
                      r={radius}
                      stroke={chartColor}
                      strokeWidth={strokeWidth}
                      fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                    />
                  </G>
                </Svg>
                <View style={styles.chartCenterContent}>
                  <Text style={styles.chartCenterPercentage}>{percentage.toFixed(0)}%</Text>
                  <Text style={styles.chartCenterLabel}>{isOverBudget ? 'Over Budget' : 'Spent'}</Text>
                </View>
              </View>
            );
          })()}
        </View>

        {/* Monthly Budget Overview - matching Transaction summary cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconContainer, { backgroundColor: colors.accent + '15' }]}>
              <Ionicons name="wallet" size={20} color={colors.accent} />
            </View>
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryLabel}>Total Budget</Text>
              <Text style={[styles.summaryAmount, { color: colors.accent }]}>
                ₹{budgetData.monthly.total.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconContainer, { backgroundColor: colors.expense + '15' }]}>
              <Ionicons name="trending-up" size={20} color={colors.expense} />
            </View>
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryLabel}>Spent</Text>
              <Text style={[styles.summaryAmount, { color: colors.expense }]}>
                ₹{budgetData.monthly.spent.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Warning Cards - updated styling */}
      {budgetData.warnings && budgetData.warnings.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget Alerts</Text>
          {budgetData.warnings.map((warning, index) => (
            <View key={warning.id} style={styles.warningCard}>
              <View style={[
                styles.warningIconContainer,
                { backgroundColor: warning.severity === 'high' ? colors.error + '20' : colors.warning + '20' }
              ]}>
                <Ionicons 
                  name={warning.severity === 'high' ? 'warning' : 'alert-circle'} 
                  size={24} 
                  color={warning.severity === 'high' ? colors.error : colors.warning} 
                />
              </View>
              <View style={styles.warningContent}>
                <Text style={styles.warningCategory}>{warning.category}</Text>
                <Text style={styles.warningMessage}>{warning.message}</Text>
              </View>
              <View style={[
                styles.severityBadge,
                { backgroundColor: warning.severity === 'high' ? colors.error : colors.warning }
              ]}>
                <Text style={styles.severityText}>
                  {warning.severity === 'high' ? 'High' : 'Medium'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Category Budgets - matching Transaction page style */}
      {budgetData.categories && budgetData.categories.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category Budgets</Text>
          {budgetData.categories.map((category, index) => {
            const categoryIcon = getCategoryIcon(category.name);
            const categoryColor = getCategoryColor(category.name);
            
            return (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => handleEditBudget(category)}
                activeOpacity={0.7}
              >
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryLeft}>
                    <View style={[styles.categoryIconContainer, { backgroundColor: categoryColor + '20' }]}>
                      <Ionicons name={categoryIcon as any} size={24} color={categoryColor} />
                    </View>
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryName}>{category.name}</Text>
                      <Text style={styles.categorySubtext}>
                        ₹{category.spent.toLocaleString('en-IN')} spent
                      </Text>
                    </View>
                  </View>
                  <View style={styles.categoryRight}>
                    <Text style={styles.categoryAmount}>
                      ₹{category.budget.toLocaleString('en-IN')}
                    </Text>
                    <Text style={[
                      styles.categoryRemaining,
                      {
                        color: parseFloat(category.percentage) > 90 ? colors.error
                             : parseFloat(category.percentage) > 75 ? colors.warning
                             : colors.success,
                      },
                    ]}>
                      ₹{category.remaining.toLocaleString('en-IN')} left
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
                          backgroundColor: parseFloat(category.percentage) > 90 ? colors.error
                                         : parseFloat(category.percentage) > 75 ? colors.warning
                                         : categoryColor,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.categoryPercentage}>
                    {parseFloat(category.percentage).toFixed(1)}%
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Empty State - updated styling */}
      {(!budgetData.categories || budgetData.categories.length === 0) && (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="wallet-outline" size={64} color={colors.textSecondary} />
          </View>
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
              
              <Text style={styles.modalTitle}>{editingBudgetId ? 'Edit Budget' : 'Create Budget'}</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Select Category</Text>
                <View style={styles.categoryGrid}>
                  {PREDEFINED_CATEGORIES.map((cat) => {
                    const isSelected = category.toLowerCase() === cat.toLowerCase();
                    const iconName = getCategoryIcon(cat);
                    const iconColor = getCategoryColor(cat);
                    
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.categoryGridItem,
                          isSelected && styles.categoryGridItemSelected,
                          isSelected && { borderColor: iconColor }
                        ]}
                        onPress={() => setCategory(cat)}
                      >
                        <View style={[styles.categoryGridIcon, { backgroundColor: iconColor + '20' }]}>
                          <Ionicons name={iconName as any} size={20} color={iconColor} />
                        </View>
                        <Text style={[
                          styles.categoryGridText,
                          isSelected && { color: iconColor, fontWeight: '600' }
                        ]} numberOfLines={1}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
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
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Alert Threshold</Text>
                <Text style={styles.formSubLabel}>Get notified when you spend this much of your budget</Text>
                <View style={styles.thresholdGrid}>
                  {[50, 75, 80, 90, 100].map((val) => (
                    <TouchableOpacity
                      key={val}
                      style={[
                        styles.thresholdChip,
                        alertThreshold === val && styles.thresholdChipSelected
                      ]}
                      onPress={() => setAlertThreshold(val)}
                    >
                      <Text style={[
                        styles.thresholdText,
                        alertThreshold === val && styles.thresholdTextSelected
                      ]}>{val}%</Text>
                    </TouchableOpacity>
                  ))}
                </View>
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
                  onPress={handleSaveBudget}
                  disabled={creating}
                >
                  <Text style={styles.createButtonText}>
                    {creating ? 'Saving...' : (editingBudgetId ? 'Update Budget' : 'Create Budget')}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Header - matching Transaction page
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
  
  // Chart Styles
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  chartWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartCenterContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartCenterPercentage: {
    ...typography.h2,
    color: colors.text,
    fontWeight: '700',
  },
  chartCenterLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
  
  // Summary Cards - matching Transaction page
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
  
  // Section
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.titleLarge,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  
  // Warning Cards - matching surface style
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  warningIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  warningContent: {
    flex: 1,
  },
  warningCategory: {
    ...typography.titleMedium,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xxs,
  },
  warningMessage: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  severityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
  },
  severityText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: 'bold',
  },
  
  // Category Cards - matching Transaction page
  categoryCard: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.sm,
    ...shadows.sm,
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
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    ...typography.titleMedium,
    color: colors.text,
    marginBottom: spacing.xxs,
  },
  categorySubtext: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    ...typography.titleLarge,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.xxs,
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
    height: 6,
    backgroundColor: colors.border,
    borderRadius: borderRadius.round,
    overflow: 'hidden',
    marginRight: spacing.sm,
  },
  categoryProgressFill: {
    height: '100%',
    borderRadius: borderRadius.round,
  },
  categoryPercentage: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    minWidth: 45,
    textAlign: 'right',
  },
  
  // Empty State - matching Transaction page
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
    marginBottom: spacing.lg,
  },
  emptyButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    ...shadows.md,
  },
  emptyButtonText: {
    ...typography.titleMedium,
    color: colors.white,
    fontWeight: '600',
  },
  
  // Modal - matching Transaction page
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
  modalTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  formLabel: {
    ...typography.titleMedium,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  formInput: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  formSubLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: -spacing.xs,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  categoryGridItem: {
    width: '31%',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryGridItemSelected: {
    backgroundColor: colors.surface,
  },
  categoryGridIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  categoryGridText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 11,
  },
  thresholdGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  thresholdChip: {
    backgroundColor: colors.backgroundSecondary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thresholdChipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  thresholdText: {
    ...typography.button,
    color: colors.text,
  },
  thresholdTextSelected: {
    color: colors.white,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    ...typography.titleMedium,
    color: colors.text,
    fontWeight: '600',
  },
  createButton: {
    flex: 1,
    backgroundColor: colors.accent,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    ...shadows.md,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    ...typography.titleMedium,
    color: colors.white,
    fontWeight: '600',
  },
});
