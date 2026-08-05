import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { Input, LoadingButton, FilterChip, LoadingOverlay } from '../../components';
import { transactionService } from '../../services';
import type { CreateTransactionData, Transaction } from '../../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList } from '../../types/navigation';

const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<MainTabParamList, 'AddTransaction'>;

const transactionSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.string().min(1, 'Amount is required'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof transactionSchema>;

// Predefined categories with premium icons (matching Dashboard)
const categories = {
  income: [
    { id: 'salary', name: 'Salary', icon: 'cash', iconType: 'ionicons', color: colors.success },
    { id: 'business', name: 'Business', icon: 'briefcase', iconType: 'ionicons', color: '#FF9800' },
    { id: 'investment', name: 'Investment', icon: 'trending-up', iconType: 'ionicons', color: colors.chartBlue },
    { id: 'freelance', name: 'Freelance', icon: 'laptop-outline', iconType: 'ionicons', color: '#9C27B0' },
    { id: 'gift', name: 'Gift', icon: 'gift', iconType: 'ionicons', color: '#E91E63' },
    { id: 'other-income', name: 'Other', icon: 'wallet', iconType: 'ionicons', color: colors.textSecondary },
  ],
  expense: [
    { id: 'food', name: 'Food', icon: 'fast-food', iconType: 'ionicons', color: colors.chartGold },
    { id: 'transport', name: 'Transport', icon: 'car', iconType: 'ionicons', color: colors.chartBlue },
    { id: 'shopping', name: 'Shopping', icon: 'bag-handle', iconType: 'ionicons', color: colors.accent },
    { id: 'bills', name: 'Bills', icon: 'receipt', iconType: 'ionicons', color: colors.warning },
    { id: 'entertainment', name: 'Entertainment', icon: 'film', iconType: 'ionicons', color: colors.chartPurple },
    { id: 'healthcare', name: 'Health', icon: 'medical', iconType: 'ionicons', color: colors.chartRed },
    { id: 'education', name: 'Education', icon: 'school', iconType: 'ionicons', color: colors.info },
    { id: 'groceries', name: 'Grocery', icon: 'cart', iconType: 'ionicons', color: colors.chartGreen },
    { id: 'utilities', name: 'Utilities', icon: 'flash', iconType: 'ionicons', color: colors.warning },
    { id: 'travel', name: 'Travel', icon: 'airplane', iconType: 'ionicons', color: colors.chartBlue },
    { id: 'gym', name: 'Gym', icon: 'fitness', iconType: 'ionicons', color: colors.success },
    { id: 'rent', name: 'Rent', icon: 'home', iconType: 'ionicons', color: colors.accent },
    { id: 'clothing', name: 'Clothing', icon: 'shirt', iconType: 'ionicons', color: '#E91E63' },
    { id: 'electronics', name: 'Electronics', icon: 'phone-portrait', iconType: 'ionicons', color: colors.chartBlue },
    { id: 'insurance', name: 'Insurance', icon: 'shield-checkmark', iconType: 'ionicons', color: colors.info },
    { id: 'subscription', name: 'Subscription', icon: 'repeat', iconType: 'ionicons', color: '#673AB7' },
    { id: 'other-expense', name: 'Other', icon: 'wallet', iconType: 'ionicons', color: colors.textSecondary },
  ],
};

// Payment methods with icons (matching Dashboard style)
const paymentMethods = [
  { id: 'cash', name: 'Cash', icon: 'cash-outline', iconType: 'ionicons', color: colors.success },
  { id: 'card', name: 'Card', icon: 'card-outline', iconType: 'ionicons', color: colors.chartBlue },
  { id: 'upi', name: 'UPI', icon: 'phone-portrait-outline', iconType: 'ionicons', color: colors.warning },
  { id: 'bank', name: 'Bank Transfer', icon: 'business-outline', iconType: 'ionicons', color: colors.accent },
];

export const AddTransactionScreen = ({ navigation, route }: Props) => {
  const existingTransaction = route.params?.transaction as Transaction | undefined;
  const isEditing = !!existingTransaction;

  const [type, setType] = useState<'income' | 'expense'>(
    existingTransaction?.type || 'expense'
  );
  const [selectedCategory, setSelectedCategory] = useState(
    existingTransaction?.category || ''
  );
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    existingTransaction?.paymentMethod || ''
  );
  const [selectedDate, setSelectedDate] = useState(
    existingTransaction?.date ? new Date(existingTransaction.date) : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [animatedValue] = useState(new Animated.Value(0));
  const [saving, setSaving] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      description: existingTransaction?.description || '',
      amount: existingTransaction ? Math.abs(existingTransaction.amount).toString() : '',
      notes: existingTransaction?.notes || '',
    },
  });

  // Animation effect
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const onSubmit = async (data: FormData) => {
    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    const categoryList = type === 'income' ? categories.income : categories.expense;
    const category = categoryList.find(cat => cat.id === selectedCategory);

    const transactionData: CreateTransactionData = {
      type,
      category: category?.name || selectedCategory,
      amount: parseFloat(data.amount),
      description: data.description,
      date: selectedDate.toISOString(),
      emoji: category?.icon || '📦',
      paymentMethod: selectedPaymentMethod || undefined,
      notes: data.notes || undefined,
    };

    try {
      setSaving(true);
      
      if (isEditing && existingTransaction) {
        await transactionService.updateTransaction(existingTransaction._id, transactionData);
        Alert.alert('Success', 'Transaction updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        await transactionService.createTransaction(transactionData);
        Alert.alert('Success', 'Transaction added successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save transaction');
    } finally {
      setSaving(false);
    }
  };

  const categoryList = type === 'income' ? categories.income : categories.expense;

  const renderIcon = (iconName: string, iconType: string, color: string, size = 24) => {
    // All icons are ionicons now to match Dashboard
    return <Ionicons name={iconName as any} size={size} color={color} />;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, colors.backgroundSecondary]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>
              {isEditing ? 'Edit Transaction' : 'Add Transaction'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleSubmit(onSubmit)}
            activeOpacity={0.8}
            disabled={saving}
          >
            <LinearGradient
              colors={saving ? [colors.textSecondary, colors.textSecondary] : colors.gradientPrimary}
              style={styles.addButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name={saving ? "hourglass" : isEditing ? "checkmark" : "add"} size={22} color={colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <Animated.ScrollView 
        style={[styles.content, {
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
        {/* Amount Input - Featured */}
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Controller
            control={control}
            name="amount"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.amountInputContainer}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="decimal-pad"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              </View>
            )}
          />
          {errors.amount && <Text style={styles.errorText}>{errors.amount.message}</Text>}
        </View>
        {/* Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction Type</Text>
          <View style={styles.typeContainer}>
            <TouchableOpacity
              style={[styles.typeButton, type === 'income' && styles.incomeButtonActive]}
              onPress={() => {
                setType('income');
                setSelectedCategory('');
              }}
            >
              <LinearGradient
                colors={type === 'income' ? [colors.success, colors.chartGreen] : [colors.surface, colors.surface]}
                style={styles.typeButtonGradient}
              >
                <Ionicons 
                  name="trending-up" 
                  size={32} 
                  color={type === 'income' ? colors.white : colors.success} 
                />
                <Text style={[styles.typeText, type === 'income' && styles.typeTextActive]}>
                  Income
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeButton, type === 'expense' && styles.expenseButtonActive]}
              onPress={() => {
                setType('expense');
                setSelectedCategory('');
              }}
            >
              <LinearGradient
                colors={type === 'expense' ? [colors.expense, colors.chartRed] : [colors.surface, colors.surface]}
                style={styles.typeButtonGradient}
              >
                <Ionicons 
                  name="trending-down" 
                  size={32} 
                  color={type === 'expense' ? colors.white : colors.expense} 
                />
                <Text style={[styles.typeText, type === 'expense' && styles.typeTextActive]}>
                  Expense
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Choose Category
            <Text style={styles.sectionSubtitle}> (Required)</Text>
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            <View style={styles.categoryGrid}>
              {categoryList.map((category, index) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryCard,
                    selectedCategory === category.id && styles.categoryCardSelected,
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <View style={[
                    styles.categoryIconContainer,
                    { backgroundColor: category.color + '20' },
                    selectedCategory === category.id && { backgroundColor: category.color }
                  ]}>
                    {renderIcon(
                      category.icon, 
                      category.iconType, 
                      selectedCategory === category.id ? colors.white : category.color, 
                      28
                    )}
                  </View>
                  <Text style={[
                    styles.categoryName,
                    selectedCategory === category.id && styles.categoryNameSelected
                  ]}>
                    {category.name}
                  </Text>
                  {selectedCategory === category.id && (
                    <View style={styles.selectedIndicator}>
                      <Ionicons name="checkmark" size={16} color={colors.white} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="calendar-outline" size={18} color={colors.accent} />
            {' '}Transaction Date
          </Text>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <View style={styles.datePickerContent}>
              <Ionicons name="calendar" size={24} color={colors.accent} />
              <View style={styles.dateTextContainer}>
                <Text style={styles.dateText}>
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'short',
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </Text>
                <Text style={styles.dateSubtext}>
                  {selectedDate.toDateString() === new Date().toDateString() 
                    ? 'Today' 
                    : `${Math.floor((new Date().getTime() - selectedDate.getTime()) / (1000 * 60 * 60 * 24))} days ago`}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={new Date()}
              onChange={(event, date) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (date) {
                  setSelectedDate(date);
                }
              }}
            />
          )}
        </View>

        {/* Payment Method Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Payment Method
            <Text style={styles.sectionSubtitle}> (Optional)</Text>
          </Text>
          <View style={styles.paymentMethodContainer}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentMethodCard,
                  selectedPaymentMethod === method.id && styles.paymentMethodSelected,
                ]}
                onPress={() => setSelectedPaymentMethod(method.id)}
              >
                <View style={[
                  styles.paymentIconContainer,
                  { backgroundColor: method.color + '20' },
                  selectedPaymentMethod === method.id && { backgroundColor: method.color }
                ]}>
                  {renderIcon(
                    method.icon,
                    method.iconType,
                    selectedPaymentMethod === method.id ? colors.white : method.color,
                    24
                  )}
                </View>
                <Text style={[
                  styles.paymentMethodName,
                  selectedPaymentMethod === method.id && styles.paymentMethodNameSelected
                ]}>
                  {method.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.section}>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  <Ionicons name="document-text-outline" size={18} color={colors.accent} />
                  {' '}Description
                </Text>
                <TextInput
                  style={styles.modernInput}
                  placeholder="Enter description"
                  placeholderTextColor={colors.textSecondary}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
                {errors.description && <Text style={styles.errorText}>{errors.description.message}</Text>}
              </View>
            )}
          />

          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  <Ionicons name="clipboard-outline" size={18} color={colors.accent} />
                  {' '}Notes (Optional)
                </Text>
                <TextInput
                  style={[styles.modernInput, styles.textArea]}
                  placeholder="Add a note..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={3}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              </View>
            )}
          />
        </View>

        <View style={styles.submitContainer}>
          <LoadingButton
            title={
              <View style={styles.submitButtonContent}>
                <Ionicons 
                  name={isEditing ? 'checkmark-done' : 'add'} 
                  size={24} 
                  color={colors.white} 
                />
                <Text style={styles.submitButtonText}>
                  {isEditing ? 'Update Transaction' : 'Add Transaction'}
                </Text>
              </View>
            }
            onPress={handleSubmit(onSubmit)}
            loading={saving}
          />
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
  header: {
    paddingTop: spacing.huge,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.base,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: -spacing.xs,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 22,
    ...shadows.sm,
  },
  addButton: {
    borderRadius: borderRadius.round,
    ...shadows.md,
  },
  addButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  
  // Amount Section
  amountSection: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  amountLabel: {
    ...typography.h3,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginRight: spacing.sm,
  },
  amountInput: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    minWidth: 120,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  
  // Date Picker Styles
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  datePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dateTextContainer: {
    gap: spacing.xxs,
  },
  dateText: {
    ...typography.titleMedium,
    color: colors.text,
    fontWeight: '600',
  },
  dateSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  
  // Section Styles
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  sectionSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: 'normal',
    fontSize: 14,
  },
  
  // Type Selection
  typeContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  typeButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  typeButtonGradient: {
    padding: spacing.lg,
    alignItems: 'center',
    borderRadius: 16,
  },
  incomeButtonActive: {
    shadowColor: colors.success,
    shadowOffset: { width: 0, y: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  expenseButtonActive: {
    shadowColor: colors.expense,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  typeText: {
    ...typography.titleMedium,
    color: colors.text,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  typeTextActive: {
    color: colors.white,
  },
  
  // Category Selection
  categoryScroll: {
    marginHorizontal: -spacing.xs,
  },
  categoryGrid: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xs,
  },
  categoryCard: {
    width: width * 0.28,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  categoryCardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.backgroundSecondary,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    transform: [{ scale: 1.05 }],
  },
  categoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryName: {
    ...typography.titleSmall,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  categoryNameSelected: {
    color: colors.accent,
    fontWeight: 'bold',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Payment Method - 2x2 Grid
  paymentMethodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  paymentMethodCard: {
    width: '47%',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  paymentMethodSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.backgroundSecondary,
  },
  paymentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  paymentMethodName: {
    ...typography.titleSmall,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  paymentMethodNameSelected: {
    color: colors.accent,
    fontWeight: 'bold',
  },
  
  // Input Fields
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.titleMedium,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modernInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  
  // Submit Button
  submitContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    ...typography.titleMedium,
    color: colors.white,
    fontWeight: 'bold',
    marginLeft: spacing.sm,
  },
});
