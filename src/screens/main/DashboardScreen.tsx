import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path, Circle, Line, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { SkeletonLoader, ErrorView, LoadingOverlay } from '../../components';
import { transactionService } from '../../services';
import { formatCurrency } from '../../utils';
import { useAuthStore } from '../../store/authStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList } from '../../types/navigation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = NativeStackScreenProps<MainTabParamList, 'Dashboard'>;

interface DashboardData {
  balance: number;
  cardNumber: string;
  cardHolder: string;
  validThru: string;
  weeklyData: { day: string; amount: number }[];
  recentTransactions: any[];
  weeklyChange: number;
  categoryBreakdown: { category: string; amount: number; percentage: string; color: string }[];
}

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

export const DashboardScreen = ({ navigation }: Props) => {
  const { user } = useAuthStore();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const transactionsResponse = await transactionService.getTransactions({ limit: 1000 });
      const transactions = transactionsResponse.data || [];

      // Calculate balance
      let totalIncome = 0;
      let totalExpense = 0;

      transactions.forEach((t) => {
        const amount = Math.abs(Number(t.amount) || 0);
        if (t.type === 'income') {
          totalIncome += amount;
        } else if (t.type === 'expense') {
          totalExpense += amount;
        }
      });

      const balance = totalIncome - totalExpense;

      // Calculate weekly data (last 7 days)
      const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = new Date();
      const weeklyData = [];

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayName = weekDays[date.getDay()];

        const dayTotal = transactions
          .filter((t) => {
            const tDate = new Date(t.date);
            return (
              tDate.getDate() === date.getDate() &&
              tDate.getMonth() === date.getMonth() &&
              tDate.getFullYear() === date.getFullYear()
            );
          })
          .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);

        weeklyData.push({ day: dayName, amount: dayTotal });
      }

      // Calculate weekly change
      const thisWeekTotal = weeklyData.reduce((sum, d) => sum + d.amount, 0);
      const lastWeekStart = new Date(today);
      lastWeekStart.setDate(lastWeekStart.getDate() - 13);
      const lastWeekEnd = new Date(today);
      lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);

      const lastWeekTotal = transactions
        .filter((t) => {
          const tDate = new Date(t.date);
          return tDate >= lastWeekStart && tDate <= lastWeekEnd;
        })
        .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);

      const weeklyChange = lastWeekTotal > 0 ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100 : 0;

      // Calculate category breakdown for expenses
      const categoryMap = new Map<string, { amount: number; count: number }>();

      transactions
        .filter((t) => t.type === 'expense')
        .forEach((t) => {
          const amount = Math.abs(Number(t.amount) || 0);
          const existing = categoryMap.get(t.category) || { amount: 0, count: 0 };
          categoryMap.set(t.category, {
            amount: existing.amount + amount,
            count: existing.count + 1,
          });
        });

      const categoryBreakdown = Array.from(categoryMap.entries())
        .map(([category, data]) => ({
          category,
          amount: data.amount,
          count: data.count,
          percentage: totalExpense > 0 ? ((data.amount / totalExpense) * 100).toFixed(1) : '0',
          color: getCategoryColor(category),
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 4);

      // Get current month/year for card valid thru
      const now = new Date();
      const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
      const currentYear = String(now.getFullYear()).slice(-2);

      setDashboardData({
        balance,
        cardNumber: '**** **** **** 0023',
        cardHolder: user?.name || 'User',
        validThru: `${currentMonth}/${currentYear}`,
        weeklyData,
        recentTransactions: transactions.slice(0, 5),
        weeklyChange,
        categoryBreakdown,
      });
    } catch (err: any) {
      console.error('❌ Error loading dashboard:', err);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    if (hour >= 17 && hour < 21) return 'Good Evening';
    return 'Good Night';
  };

  const playNotificationSound = async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
        { shouldPlay: true, volume: 0.8 }
      );

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error('❌ Could not play sound:', error);
    }
  };

  const handleNotificationPress = async () => {
    await playNotificationSound();
    Alert.alert('Notifications', 'No new notifications', [{ text: 'OK' }]);
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  const handleProfilePress = () => {
    // @ts-ignore - navigation works at runtime
    navigation.navigate('Profile');
  };

  // Don't show error during initial load, only if data failed after loading attempt
  if (error && !loading) {
    return <ErrorView message={error} onRetry={loadDashboardData} />;
  }

  // Show nothing if still loading initial data
  if (!dashboardData) {
    return null;
  }

  // Find min and max for chart scaling
  const amounts = dashboardData.weeklyData.map((d) => d.amount);
  const maxAmount = Math.max(...amounts);
  const minAmount = Math.min(...amounts);

  return (
    <View style={styles.container}>
      <LoadingOverlay visible={loading} message="Loading Dashboard..." />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Dark Header */}
        <View style={styles.darkHeader}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity 
              style={styles.refreshButton} 
              onPress={handleRefresh}
              activeOpacity={0.7}
            >
              <Ionicons name="reload" size={24} color={colors.accent} />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleProfilePress} activeOpacity={0.7}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Greeting */}
          <View style={styles.greetingContainer}>
            <Ionicons name="sunny" size={16} color={colors.accentGold} />
            <Text style={styles.greeting}>{getGreeting()}</Text>
          </View>

          <Text style={styles.welcomeText}>{user?.name || 'User'}</Text>

          {/* Premium Card */}
          <View style={styles.cardContainer}>
            <LinearGradient
              colors={['#3A3A3A', '#2B2B2B', '#4A4A4A']}
              style={styles.premiumCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Contactless Icon */}
              <View style={styles.contactlessIcon}>
                <View style={styles.contactlessWave} />
                <View style={[styles.contactlessWave, { marginLeft: -8 }]} />
                <View style={[styles.contactlessWave, { marginLeft: -8 }]} />
              </View>

              {/* Balance Label */}
              <Text style={styles.balanceLabel}>Available Credit</Text>

              {/* Balance Amount */}
              <Text style={styles.balanceAmount}>₹{dashboardData.balance.toLocaleString('en-IN')}</Text>

              {/* Card Number */}
              <Text style={styles.cardNumber}>{dashboardData.cardNumber}</Text>

              {/* Card Footer */}
              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.cardLabel}>Card Holder</Text>
                  <Text style={styles.cardValue}>{dashboardData.cardHolder}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.cardLabel}>Valid Thru</Text>
                  <Text style={styles.cardValue}>{dashboardData.validThru}</Text>
                </View>
              </View>

              {/* Card Chip */}
              <View style={styles.cardChipContainer}>
                <View style={styles.cardChip1} />
                <View style={styles.cardChip2} />
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Light Content Area */}
        <View style={styles.lightContent}>
          {/* Analytics Section */}
          <View style={styles.analyticsCard}>
            <View style={styles.analyticHeader}>
              <Text style={styles.sectionTitle}>Analytics</Text>
              <View style={styles.dailyBadge}>
                <Text style={styles.dailyText}>Daily</Text>
                <View style={styles.dailyDot} />
              </View>
            </View>

            {/* Chart */}
            <View style={styles.chartContainer}>
              {/* Change Indicator */}
              <View style={styles.changeIndicator}>
                <View style={styles.changeIcon}>
                  <Ionicons 
                    name={dashboardData.weeklyChange >= 0 ? "trending-up" : "trending-down"} 
                    size={24} 
                    color={dashboardData.weeklyChange >= 0 ? colors.success : colors.expense} 
                  />
                </View>
                <Text style={[styles.changeAmount, { color: dashboardData.weeklyChange >= 0 ? colors.success : colors.expense }]}>
                  {dashboardData.weeklyChange >= 0 ? '+' : ''}₹{Math.abs(dashboardData.weeklyChange * 100).toFixed(2)}
                </Text>
              </View>

              {/* Weekly Line Chart */}
              <View style={styles.chartWrapper}>
                <Svg width={SCREEN_WIDTH - 80} height={180} style={styles.svgChart}>
                  <Defs>
                    <SvgGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <Stop offset="0%" stopColor={colors.success} stopOpacity="0.8" />
                      <Stop offset="50%" stopColor={colors.accent} stopOpacity="0.6" />
                      <Stop offset="100%" stopColor={colors.expense} stopOpacity="0.5" />
                    </SvgGradient>
                    <SvgGradient id="fillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <Stop offset="0%" stopColor={colors.backgroundSecondary} stopOpacity="0.6" />
                      <Stop offset="100%" stopColor={colors.backgroundSecondary} stopOpacity="0.1" />
                    </SvgGradient>
                  </Defs>

                  {/* Generate smooth curve path */}
                  {(() => {
                    const chartWidth = SCREEN_WIDTH - 80;
                    const chartHeight = 140;
                    const padding = 20;
                    const pointSpacing = chartWidth / (dashboardData.weeklyData.length + 1);

                    // Calculate points
                    const points = dashboardData.weeklyData.map((item, index) => {
                      const x = padding + pointSpacing * (index + 0.5);
                      const y = chartHeight - (item.amount / maxAmount) * (chartHeight - 40);
                      return { x, y, amount: item.amount };
                    });

                    // Create smooth curve using quadratic bezier
                    let pathData = `M ${points[0].x} ${points[0].y}`;
                    for (let i = 0; i < points.length - 1; i++) {
                      const current = points[i];
                      const next = points[i + 1];
                      const controlX = (current.x + next.x) / 2;
                      pathData += ` Q ${controlX} ${current.y}, ${controlX} ${(current.y + next.y) / 2}`;
                      pathData += ` Q ${controlX} ${next.y}, ${next.x} ${next.y}`;
                    }

                    // Fill path
                    const fillPath = pathData + ` L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

                    return (
                      <>
                        {/* Fill area under curve */}
                        <Path d={fillPath} fill="url(#fillGradient)" />
                        
                        {/* Line curve */}
                        <Path
                          d={pathData}
                          stroke="url(#lineGradient)"
                          strokeWidth="3"
                          fill="none"
                          strokeLinecap="round"
                        />

                        {/* Points and Wednesday highlight */}
                        {points.map((point, index) => {
                          const isWednesday = dashboardData.weeklyData[index].day === 'Wed';
                          return (
                            <Circle
                              key={index}
                              cx={point.x}
                              cy={point.y}
                              r={isWednesday ? 8 : 4}
                              fill={isWednesday ? colors.accent : colors.text}
                              stroke={isWednesday ? colors.white : 'none'}
                              strokeWidth={isWednesday ? 3 : 0}
                            />
                          );
                        })}

                        {/* Wednesday vertical highlight bar */}
                        {(() => {
                          const wednesdayIndex = dashboardData.weeklyData.findIndex((d) => d.day === 'Wed');
                          if (wednesdayIndex !== -1) {
                            const wedPoint = points[wednesdayIndex];
                            return (
                              <>
                                <Line
                                  x1={wedPoint.x}
                                  y1={wedPoint.y + 15}
                                  x2={wedPoint.x}
                                  y2={chartHeight}
                                  stroke={colors.accent}
                                  strokeWidth="2"
                                  strokeOpacity="0.3"
                                />
                              </>
                            );
                          }
                          return null;
                        })()}
                      </>
                    );
                  })()}
                </Svg>

                {/* Day labels */}
                <View style={styles.chartLabels}>
                  {dashboardData.weeklyData.map((item, index) => (
                    <Text
                      key={index}
                      style={[
                        styles.chartLabel,
                        item.day === 'Wed' && styles.chartLabelActive,
                      ]}
                    >
                      {item.day}
                    </Text>
                  ))}
                </View>

                {/* Wednesday tooltip */}
                {(() => {
                  const wednesdayIndex = dashboardData.weeklyData.findIndex((d) => d.day === 'Wed');
                  if (wednesdayIndex !== -1) {
                    const wedData = dashboardData.weeklyData[wednesdayIndex];
                    // Calculate the actual Wednesday date
                    const today = new Date();
                    const wednesdayDate = new Date(today);
                    wednesdayDate.setDate(today.getDate() - (6 - wednesdayIndex));
                    const formattedDate = wednesdayDate.toLocaleDateString('en-US', { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric' 
                    });
                    
                    return (
                      <View style={styles.tooltipContainer}>
                        <View style={styles.tooltip}>
                          <Text style={styles.tooltipAmount}>₹{wedData.amount.toFixed(2)}</Text>
                          <Text style={styles.tooltipDate}>{formattedDate}</Text>
                        </View>
                      </View>
                    );
                  }
                  return null;
                })()}
              </View>
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.activitySection}>
            <View style={styles.activityHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Transactions')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {dashboardData.recentTransactions.map((transaction, index) => {
              const categoryIcon = getCategoryIcon(transaction.category);
              const categoryColor = getCategoryColor(transaction.category);

              return (
                <View key={transaction._id || index} style={styles.transactionItem}>
                  <View style={styles.transactionLeft}>
                    <View style={[styles.transactionIcon, { backgroundColor: categoryColor + '20' }]}>
                      {categoryIcon.type === 'ionicons' ? (
                        <Ionicons name={categoryIcon.name as any} size={24} color={categoryColor} />
                      ) : (
                        <MaterialCommunityIcons name={categoryIcon.name as any} size={24} color={categoryColor} />
                      )}
                    </View>
                    <View>
                      <Text style={styles.transactionTitle}>{transaction.description || transaction.category}</Text>
                      <Text style={styles.transactionDate}>
                        {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.transactionAmount, { color: transaction.type === 'income' ? colors.success : colors.text }]}>
                    {transaction.type === 'income' ? '+' : '-'}₹{Math.abs(Number(transaction.amount)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Category Breakdown */}
          {dashboardData.categoryBreakdown && dashboardData.categoryBreakdown.length > 0 && (
            <View style={styles.categorySection}>
              <Text style={styles.sectionTitle}>Spending by Category</Text>

              {dashboardData.categoryBreakdown.map((item, index) => {
                const categoryIcon = getCategoryIcon(item.category);

                return (
                  <View key={index} style={styles.categoryItem}>
                    <View style={styles.categoryLeft}>
                      <View style={[styles.categoryIcon, { backgroundColor: item.color + '20' }]}>
                        {categoryIcon.type === 'ionicons' ? (
                          <Ionicons name={categoryIcon.name as any} size={22} color={item.color} />
                        ) : (
                          <MaterialCommunityIcons name={categoryIcon.name as any} size={22} color={item.color} />
                        )}
                      </View>
                      <View style={styles.categoryInfo}>
                        <Text style={styles.categoryName}>{item.category}</Text>
                        <View style={styles.progressBarBg}>
                          <View
                            style={[
                              styles.progressBarFill,
                              { width: `${item.percentage}%`, backgroundColor: item.color },
                            ]}
                          />
                        </View>
                      </View>
                    </View>
                    <View style={styles.categoryRight}>
                      <Text style={styles.categoryAmount}>₹{item.amount.toLocaleString('en-IN')}</Text>
                      <Text style={styles.categoryPercentage}>{item.percentage}%</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.massive,
  },
  darkHeader: {
    backgroundColor: colors.cardDark,
    paddingTop: spacing.huge,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(198, 122, 77, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...typography.h4,
    color: colors.white,
    fontWeight: '600',
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  greeting: {
    ...typography.body,
    color: colors.textSecondary,
  },
  welcomeText: {
    ...typography.displayMedium,
    color: colors.white,
    marginBottom: spacing.xl,
  },
  cardContainer: {
    marginTop: spacing.base,
  },
  premiumCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    minHeight: 200,
    ...shadows.xl,
  },
  contactlessIcon: {
    flexDirection: 'row',
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
  },
  contactlessWave: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.white,
    opacity: 0.4,
  },
  balanceLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  balanceAmount: {
    ...typography.displaySmall,
    color: colors.white,
    fontWeight: '700',
    marginBottom: spacing.xl,
  },
  cardNumber: {
    ...typography.titleMedium,
    color: colors.white,
    letterSpacing: 2,
    marginBottom: spacing.lg,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardLabel: {
    ...typography.captionSmall,
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
  },
  cardValue: {
    ...typography.titleMedium,
    color: colors.white,
  },
  cardChipContainer: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  cardChip1: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    opacity: 0.8,
  },
  cardChip2: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.success,
    opacity: 0.8,
  },
  lightContent: {
    padding: spacing.lg,
  },
  analyticsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.base,
    ...shadows.sm,
  },
  analyticHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '600',
  },
  dailyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    gap: spacing.xs,
  },
  dailyText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
  },
  dailyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
  },
  chartContainer: {
    position: 'relative',
  },
  changeIndicator: {
    position: 'absolute',
    top: spacing.base,
    left: spacing.base,
    zIndex: 10,
  },
  changeIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  changeAmount: {
    ...typography.titleMedium,
    fontWeight: '700',
  },
  chartWrapper: {
    position: 'relative',
    width: '100%',
    marginTop: spacing.base,
  },
  svgChart: {
    marginBottom: spacing.sm,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.base,
  },
  chartLabel: {
    ...typography.captionSmall,
    color: colors.textSecondary,
    flex: 1,
    textAlign: 'center',
  },
  chartLabelActive: {
    color: colors.text,
    fontWeight: '700',
  },
  tooltipContainer: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.xl,
    zIndex: 10,
  },
  tooltip: {
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    ...shadows.sm,
  },
  tooltipAmount: {
    ...typography.titleMedium,
    color: colors.accent,
    fontWeight: '700',
    marginBottom: spacing.xxs,
  },
  tooltipDate: {
    ...typography.captionSmall,
    color: colors.textSecondary,
  },
  activitySection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  viewAllText: {
    ...typography.titleSmall,
    color: colors.accent,
    fontWeight: '600',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
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
    color: colors.text,
    fontWeight: '700',
  },
  categorySection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginTop: spacing.base,
    ...shadows.sm,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    ...typography.titleMedium,
    color: colors.text,
    marginBottom: spacing.xs,
    textTransform: 'capitalize',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: borderRadius.round,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: borderRadius.round,
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
});
