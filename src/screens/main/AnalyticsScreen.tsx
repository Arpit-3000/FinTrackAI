import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { analyticsService } from '../../services';
import { SkeletonLoader, ErrorView, LoadingOverlay } from '../../components';
import { formatCurrency, formatCurrencySimple } from '../../utils';
import type { MonthlyComparison, TopCategory } from '../../types';

const screenWidth = Dimensions.get('window').width;

export const AnalyticsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comparison, setComparison] = useState<MonthlyComparison | null>(null);
  const [topCategories, setTopCategories] = useState<TopCategory[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'year'>('month');
  const [animatedValue] = useState(new Animated.Value(0));

  useEffect(() => {
    loadAnalytics();
    // Animation
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [selectedTimeframe]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const [comparisonData, categoriesData] = await Promise.all([
        analyticsService.getMonthlyComparison(),
        analyticsService.getTopCategories('expense', 5)
      ]);
      setComparison(comparisonData);
      setTopCategories(categoriesData);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'transparent',
    backgroundGradientTo: 'transparent',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '8',
      strokeWidth: '3',
      stroke: colors.primary,
      fill: colors.white,
    },
  };

  const premiumChartConfig = {
    ...chartConfig,
    fillShadowGradient: colors.primary,
    fillShadowGradientOpacity: 0.3,
  };

  // Enhanced category data with premium icons (matching Dashboard/Transaction pages)
  const categoryIcons: Record<string, { icon: string; color: string }> = {
    'Food': { icon: 'fast-food', color: colors.chartGold },
    'Transport': { icon: 'car', color: colors.chartBlue },
    'Shopping': { icon: 'bag-handle', color: colors.accent },
    'Bills': { icon: 'receipt', color: colors.warning },
    'Entertainment': { icon: 'film', color: colors.chartPurple },
    'Health': { icon: 'medical', color: colors.chartRed },
    'Education': { icon: 'school', color: colors.info },
    'Grocery': { icon: 'cart', color: colors.chartGreen },
    'Groceries': { icon: 'cart', color: colors.chartGreen },
    'Fuel': { icon: 'car', color: colors.warning },
    'Travel': { icon: 'airplane', color: colors.chartBlue },
    'Rent': { icon: 'home', color: colors.accent },
    'Utilities': { icon: 'flash', color: colors.warning },
    'Salary': { icon: 'cash', color: colors.success },
    'Investment': { icon: 'trending-up', color: colors.chartBronze },
    'Default': { icon: 'wallet', color: colors.textSecondary },
  };

  const renderIcon = (categoryName: string, size = 24) => {
    const iconData = categoryIcons[categoryName] || categoryIcons['Default'];
    return <Ionicons name={iconData.icon as any} size={size} color={iconData.color} />;
  };

  const getInsightIcon = (type: 'positive' | 'negative' | 'neutral') => {
    switch (type) {
      case 'positive':
        return <Ionicons name="trending-up" size={20} color={colors.success} />;
      case 'negative':
        return <Ionicons name="trending-down" size={20} color={colors.error} />;
      default:
        return <Ionicons name="remove" size={20} color={colors.textSecondary} />;
    }
  };

  // Don't show error during initial load
  if (error && !loading) {
    return <ErrorView message={error} onRetry={loadAnalytics} />;
  }

  // Show nothing if still loading initial data
  if (!comparison) {
    return null;
  }

  const incomeChange = comparison.changes.income.amount;
  const expenseChange = comparison.changes.expense.amount;
  const incomePercentage = parseFloat(comparison.changes.income.percentage);
  const expensePercentage = parseFloat(comparison.changes.expense.percentage);
  const savingsRate = comparison.currentMonth.income > 0 
    ? ((comparison.currentMonth.savings / comparison.currentMonth.income) * 100) 
    : 0;

  const pieChartData = topCategories.slice(0, 5).map((category, index) => {
    const iconData = categoryIcons[category.category] || categoryIcons['Default'];
    return {
      name: category.category,
      population: category.total,
      color: iconData.color,
      legendFontColor: colors.text,
      legendFontSize: 12,
    };
  });

  return (
    <View style={styles.container}>
      <LoadingOverlay visible={loading} message="Loading Analytics..." />
      {/* Header - matching Transaction page style */}
      <LinearGradient
        colors={[colors.background, colors.backgroundSecondary]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <Text style={styles.title}>Analytics</Text>
          <TouchableOpacity style={styles.insightsButton}>
            <Ionicons name="stats-chart" size={24} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {/* Time Frame Selector */}
        <View style={styles.timeframeContainer}>
          {(['week', 'month', 'year'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.timeframeButton,
                selectedTimeframe === period && styles.timeframeButtonActive,
              ]}
              onPress={() => setSelectedTimeframe(period)}
            >
              <Text
                style={[
                  styles.timeframeText,
                  selectedTimeframe === period && styles.timeframeTextActive,
                ]}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <Animated.ScrollView 
        style={[styles.scrollView, {
          opacity: animatedValue,
          transform: [{
            translateY: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0]
            })
          }]
        }]} 
        showsVerticalScrollIndicator={false}
      >

        {/* Summary Cards - matching Transaction page style */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconContainer, { backgroundColor: colors.success + '15' }]}>
              <Ionicons name="trending-up" size={20} color={colors.success} />
            </View>
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryLabel}>Income</Text>
              <Text style={[styles.summaryAmount, { color: colors.success }]}>
                ₹{comparison.currentMonth.income.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.summaryChange}>
                {incomeChange >= 0 ? '+' : ''}{Math.abs(incomePercentage).toFixed(1)}%
              </Text>
            </View>
          </View>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconContainer, { backgroundColor: colors.expense + '15' }]}>
              <Ionicons name="trending-down" size={20} color={colors.expense} />
            </View>
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryLabel}>Expenses</Text>
              <Text style={[styles.summaryAmount, { color: colors.expense }]}>
                ₹{comparison.currentMonth.expense.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.summaryChange}>
                {expenseChange >= 0 ? '+' : ''}{Math.abs(expensePercentage).toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Savings Card - matching surface style */}
        <View style={styles.savingsCard}>
          <View style={styles.savingsHeader}>
            <View style={[styles.savingsIconContainer, { backgroundColor: colors.accent + '20' }]}>
              <Ionicons name="wallet" size={24} color={colors.accent} />
            </View>
            <View style={styles.savingsInfo}>
              <Text style={styles.savingsLabel}>Total Savings</Text>
              <Text style={styles.savingsAmount}>
                ₹{comparison.currentMonth.savings.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.savingsRate}>
                {savingsRate.toFixed(1)}% of income saved
              </Text>
            </View>
            <View style={styles.savingsIndicator}>
              <Text style={styles.savingsIndicatorText}>{savingsRate >= 20 ? '🎉' : '💪'}</Text>
            </View>
          </View>
        </View>

        {/* Enhanced Monthly Comparison Chart */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Monthly Trends</Text>
              <Text style={styles.cardSubtitle}>Income vs Expenses</Text>
            </View>
            <TouchableOpacity style={styles.chartTypeButton}>
              <MaterialIcons name="show-chart" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.chartContainer}>
            <BarChart
              data={{
                labels: ['Income', 'Expense', 'Savings'],
                datasets: [
                  {
                    data: [
                      comparison.currentMonth.income / 1000,
                      comparison.currentMonth.expense / 1000,
                      comparison.currentMonth.savings / 1000,
                    ],
                    colors: [
                      () => '#10B981',
                      () => '#EF4444',
                      () => colors.primary,
                    ],
                  },
                ],
              }}
              width={screenWidth - spacing.lg * 4}
              height={220}
              yAxisLabel="₹"
              yAxisSuffix="k"
              chartConfig={premiumChartConfig}
              style={styles.chart}
              withInnerLines={false}
              fromZero
              showBarTops={false}
              withCustomBarColorFromData
            />
          </View>
        </View>

        {/* Smart Insights */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>💡 Smart Insights</Text>
            <MaterialIcons name="auto-awesome" size={24} color={colors.warning} />
          </View>
          <View style={styles.insightsContainer}>
            <View style={styles.insightItem}>
              {getInsightIcon(savingsRate >= 20 ? 'positive' : 'negative')}
              <Text style={styles.insightText}>
                {savingsRate >= 20 
                  ? `Great job! You're saving ${savingsRate.toFixed(1)}% of your income.`
                  : `Try to save at least 20% of your income. Currently at ${savingsRate.toFixed(1)}%.`}
              </Text>
            </View>
            <View style={styles.insightItem}>
              {getInsightIcon(expensePercentage <= 0 ? 'positive' : 'negative')}
              <Text style={styles.insightText}>
                {expensePercentage <= 0 
                  ? 'Expenses decreased this month. Keep it up!'
                  : `Expenses increased by ${Math.abs(expensePercentage).toFixed(1)}%. Consider reviewing your spending.`}
              </Text>
            </View>
          </View>
        </View>

        {/* Enhanced Categories with Pie Chart */}
        {topCategories.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Spending Breakdown</Text>
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>View All</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
            
            {/* Pie Chart */}
            <View style={styles.pieChartContainer}>
              <PieChart
                data={pieChartData}
                width={screenWidth - spacing.lg * 4}
                height={200}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                center={[10, 0]}
                hasLegend={false}
              />
            </View>

            {/* Category List - matching Transaction page style */}
            <View style={styles.categoriesContainer}>
              {topCategories.slice(0, 5).map((category, index) => {
                const iconData = categoryIcons[category.category] || categoryIcons['Default'];
                
                return (
                  <TouchableOpacity key={index} style={styles.categoryItem}>
                    <View style={styles.categoryLeft}>
                      <View style={[styles.categoryIconContainer, { backgroundColor: iconData.color + '20' }]}>
                        {renderIcon(category.category, 24)}
                      </View>
                      <View style={styles.categoryInfo}>
                        <Text style={styles.categoryName}>{category.category}</Text>
                        <Text style={styles.categoryTransactions}>
                          {category.count} transactions
                        </Text>
                      </View>
                    </View>
                    <View style={styles.categoryRight}>
                      <Text style={styles.categoryAmount}>₹{category.total.toLocaleString('en-IN')}</Text>
                      <Text style={styles.categoryPercentage}>
                        {parseFloat(category.percentage).toFixed(1)}%
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Monthly Goals Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>🎯 Monthly Goals</Text>
            <TouchableOpacity>
              <MaterialIcons name="edit" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.goalsContainer}>
            <View style={styles.goalItem}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalLabel}>Savings Target</Text>
                <Text style={styles.goalPercentage}>{Math.min(savingsRate / 20 * 100, 100).toFixed(0)}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${Math.min(savingsRate / 20 * 100, 100)}%`,
                      backgroundColor: savingsRate >= 20 ? colors.success : colors.warning
                    }
                  ]} 
                />
              </View>
              <Text style={styles.goalTarget}>Target: ₹{formatCurrencySimple(comparison.currentMonth.income * 0.2)}</Text>
            </View>
          </View>
        </View>

        {/* Previous Month Comparison */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Previous Month</Text>
          <View style={styles.comparisonGrid}>
            <View style={styles.comparisonItem}>
              <Ionicons name="trending-up" size={20} color={colors.success} />
              <Text style={styles.comparisonLabel}>Income</Text>
              <Text style={[styles.comparisonAmount, { color: colors.success }]}>
                {formatCurrencySimple(comparison.previousMonth.income)}
              </Text>
            </View>
            <View style={styles.comparisonItem}>
              <Ionicons name="trending-down" size={20} color={colors.error} />
              <Text style={styles.comparisonLabel}>Expense</Text>
              <Text style={[styles.comparisonAmount, { color: colors.error }]}>
                {formatCurrencySimple(comparison.previousMonth.expense)}
              </Text>
            </View>
            <View style={styles.comparisonItem}>
              <MaterialIcons name="savings" size={20} color={colors.primary} />
              <Text style={styles.comparisonLabel}>Savings</Text>
              <Text style={[styles.comparisonAmount, { color: colors.primary }]}>
                {formatCurrencySimple(comparison.previousMonth.savings)}
              </Text>
            </View>
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Header Styles - matching Transaction page
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
  insightsButton: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(198, 122, 77, 0.15)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Timeframe Selector - matching FilterChip style
  timeframeContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  timeframeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  timeframeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeframeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  timeframeTextActive: {
    color: colors.white,
  },
  
  // Scroll View
  scrollView: {
    flex: 1,
    paddingTop: spacing.lg,
  },
  
  // Summary Cards - matching Transaction page
  summaryContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
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
    marginBottom: spacing.xxs,
  },
  summaryChange: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  
  // Savings Card - matching surface style
  savingsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  savingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savingsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  savingsInfo: {
    flex: 1,
  },
  savingsLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
  },
  savingsAmount: {
    ...typography.titleLarge,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.xxs,
  },
  savingsRate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  savingsIndicator: {
    alignItems: 'center',
  },
  savingsIndicatorText: {
    fontSize: 32,
  },
  
  // Card Styles - matching Transaction page
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  cardTitle: {
    ...typography.titleLarge,
    color: colors.text,
    fontWeight: '600',
  },
  cardSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  chartTypeButton: {
    width: 40,
    height: 40,
    backgroundColor: colors.accent + '20',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Chart Styles
  chartContainer: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
  },
  chart: {
    borderRadius: 16,
  },
  pieChartContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  
  // Insights
  insightsContainer: {
    gap: spacing.md,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  insightText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  
  // Categories - matching Transaction page
  categoriesContainer: {
    gap: spacing.sm,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.base,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.sm,
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
    textTransform: 'capitalize',
  },
  categoryTransactions: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  categoryRight: {
    alignItems: 'flex-end',
    marginLeft: spacing.md,
  },
  categoryAmount: {
    ...typography.titleMedium,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.xxs,
  },
  categoryPercentage: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  viewAllText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Goals
  goalsContainer: {
    gap: spacing.md,
  },
  goalItem: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  goalLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  goalPercentage: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalTarget: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  
  // Comparison Grid
  comparisonGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  comparisonItem: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  comparisonLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginVertical: spacing.xs,
  },
  comparisonAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
