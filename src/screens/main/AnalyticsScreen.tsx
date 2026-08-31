import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Animated,
  RefreshControl,
} from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { analyticsService } from '../../services';
import { SkeletonLoader, ErrorView, LoadingOverlay, EmptyState } from '../../components';
import { useDataStore } from '../../store';
import { formatCurrency, formatCurrencySimple } from '../../utils';
import type { MonthlyComparison, TopCategory } from '../../types';

const screenWidth = Dimensions.get('window').width;

export const AnalyticsScreen = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparison, setComparison] = useState<MonthlyComparison | null>(null);
  const [topCategories, setTopCategories] = useState<TopCategory[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'year'>('month');
  const [animatedValue] = useState(new Animated.Value(0));
  const [refreshing, setRefreshing] = useState(false);
  const { refreshTrigger } = useDataStore();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  }, [selectedTimeframe]);

  // Refresh analytics on mount or timeframe changes
  useEffect(() => {
    loadAnalytics();
    
    // Animation on first load
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [selectedTimeframe, refreshTrigger]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const now = new Date();
      let startDate = '';
      const endDate = now.toISOString();

      if (selectedTimeframe === 'week') {
        const d = new Date(now);
        d.setDate(now.getDate() - 7);
        startDate = d.toISOString();
      } else if (selectedTimeframe === 'year') {
        const d = new Date(now);
        d.setDate(now.getDate() - 365);
        startDate = d.toISOString();
      } else {
        // month
        const d = new Date(now);
        d.setDate(now.getDate() - 30);
        startDate = d.toISOString();
      }

      const [comparisonData, categoriesData, detailedData] = await Promise.all([
        analyticsService.getMonthlyComparison(selectedTimeframe),
        analyticsService.getTopCategories('expense', 5, startDate, endDate),
        analyticsService.getDetailedAnalytics(startDate, endDate)
      ]);

      setComparison(comparisonData);
      setTopCategories(categoriesData);
      setTrends(detailedData.trends || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const chartConfig = {
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(198, 122, 77, ${opacity})`, // colors.primary
    labelColor: (opacity = 1) => `rgba(122, 114, 107, ${opacity})`, // colors.textSecondary
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: colors.primary,
      fill: colors.white,
    },
  };

  const premiumChartConfig = {
    ...chartConfig,
    fillShadowGradientOpacity: 0.05,
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

  const getChartData = () => {
    const dates: string[] = [];
    const labels: string[] = [];
    const incomeData: number[] = [];
    const expenseData: number[] = [];

    const now = new Date();

    if (selectedTimeframe === 'week') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        dates.push(dateStr);
        labels.push(d.toLocaleDateString('en-IN', { weekday: 'short' }));
      }
    } else if (selectedTimeframe === 'year') {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const yearMonthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        dates.push(yearMonthStr);
        labels.push(d.toLocaleDateString('en-IN', { month: 'short' }));
      }
    } else {
      // Month
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        dates.push(dateStr);
        if (i % 6 === 0) {
          labels.push(d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }));
        } else {
          labels.push('');
        }
      }
    }

    const incomeMap: Record<string, number> = {};
    const expenseMap: Record<string, number> = {};

    trends.forEach((item) => {
      if (item._id && item._id.date) {
        const type = item._id.type;
        const date = item._id.date;
        const amount = item.total || 0;

        if (type === 'income') {
          incomeMap[date] = (incomeMap[date] || 0) + amount;
        } else {
          expenseMap[date] = (expenseMap[date] || 0) + amount;
        }
      }
    });

    if (selectedTimeframe === 'year') {
      dates.forEach((yearMonth) => {
        let monthIncome = 0;
        let monthExpense = 0;

        trends.forEach((item) => {
          if (item._id && item._id.date && item._id.date.startsWith(yearMonth)) {
            if (item._id.type === 'income') {
              monthIncome += item.total || 0;
            } else {
              monthExpense += item.total || 0;
            }
          }
        });

        incomeData.push(monthIncome);
        expenseData.push(monthExpense);
      });
    } else {
      dates.forEach((dateStr) => {
        incomeData.push(incomeMap[dateStr] || 0);
        expenseData.push(expenseMap[dateStr] || 0);
      });
    }

    // Default to at least one zero if no data exists, to prevent line chart errors
    const finalIncome = incomeData.length > 0 ? incomeData : [0];
    const finalExpense = expenseData.length > 0 ? expenseData : [0];
    const finalLabels = labels.length > 0 ? labels : [''];

    return {
      labels: finalLabels,
      datasets: [
        {
          data: finalIncome,
          color: (opacity = 1) => `rgba(46, 139, 87, ${opacity})`, // success
          strokeWidth: 2,
        },
        {
          data: finalExpense,
          color: (opacity = 1) => `rgba(217, 69, 69, ${opacity})`, // error
          strokeWidth: 2,
        },
      ],
      legend: ['Income', 'Expense'],
    };
  };

  // Don't show error during initial load
  if (error && !loading) {
    return <ErrorView message={error} onRetry={loadAnalytics} />;
  }

  // Show loading spinner if comparison data is not yet resolved
  if (loading && !comparison) {
    return (
      <View style={styles.container}>
        <LoadingOverlay visible={true} message="Loading Analytics..." />
      </View>
    );
  }

  // Fallback if data loading failed or comparison is null
  if (!comparison) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="📊"
          title="No Financial Data Yet"
          description="Add income or expense transactions to unlock detailed charts, category breakdowns, and smart insights."
          actionLabel="Add Transaction"
          onAction={() => navigation.navigate('AddTransaction')}
        />
      </View>
    );
  }

  const incomeChange = comparison.changes.income.amount;
  const expenseChange = comparison.changes.expense.amount;
  const incomePercentage = parseFloat(comparison.changes.income.percentage);
  const expensePercentage = parseFloat(comparison.changes.expense.percentage);
  const savingsRate = comparison.currentMonth.income > 0 
    ? ((comparison.currentMonth.savings / comparison.currentMonth.income) * 100) 
    : 0;

  const pieChartData = topCategories.slice(0, 5).map((category) => {
    const iconData = categoryIcons[category.category] || categoryIcons['Default'];
    return {
      name: category.category,
      population: category.total,
      color: iconData.color,
      legendFontColor: colors.text,
      legendFontSize: 12,
    };
  });

  const hasNoData = 
    comparison.currentMonth.income === 0 && 
    comparison.currentMonth.expense === 0 && 
    comparison.previousMonth.income === 0 && 
    comparison.previousMonth.expense === 0;

  if (hasNoData) {
    return (
      <View style={styles.container}>
        <LoadingOverlay visible={loading} message="Loading Analytics..." />
        <LinearGradient
          colors={[colors.background, colors.backgroundSecondary]}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <Text style={styles.title}>Analytics</Text>
          </View>
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
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <EmptyState
            icon="📊"
            title="No Financial Data"
            description="You don't have any transactions recorded for this period. Add income or expense transactions to unlock detailed charts, category breakdowns, and smart insights."
            actionLabel="Add Transaction"
            onAction={() => navigation.navigate('AddTransaction')}
          />
        </ScrollView>
      </View>
    );
  }

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
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

        {/* Enhanced Line Chart for Trends */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>
                {selectedTimeframe === 'week' ? 'Weekly' : selectedTimeframe === 'year' ? 'Yearly' : 'Monthly'} Trends
              </Text>
              <Text style={styles.cardSubtitle}>Income vs Expenses</Text>
            </View>
            <TouchableOpacity style={styles.chartTypeButton}>
              <MaterialIcons name="show-chart" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.chartContainer}>
            <LineChart
              data={getChartData()}
              width={screenWidth - spacing.lg * 4}
              height={220}
              chartConfig={premiumChartConfig}
              style={styles.chart}
              bezier
              withDots
              fromZero
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
                  ? 'Expenses decreased this period. Keep it up!'
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
              <TouchableOpacity style={styles.viewAllButton} onPress={() => navigation.navigate('Transactions')}>
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
            <Text style={styles.cardTitle}>🎯 Period Goals</Text>
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
          <Text style={styles.cardTitle}>Previous Period Comparison</Text>
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
