import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography } from '../../theme';
import { Input, LoadingButton, FilterChip } from '../../components';
import { transactionService } from '../../services';
import type { CreateTransactionData, Transaction } from '../../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<MainTabParamList, 'AddTransaction'>;

const transactionSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.string().min(1, 'Amount is required'),
  notes: z.string().optional(),
  paymentMethod: z.string().optional(),
});

type FormData = z.infer<typeof transactionSchema>;

// Predefined categories
const categories = {
  income: [
    { id: 'salary', name: 'Salary', emoji: '💼' },
    { id: 'business', name: 'Business', emoji: '💰' },
    { id: 'investment', name: 'Investment', emoji: '📈' },
    { id: 'freelance', name: 'Freelance', emoji: '💻' },
    { id: 'gift', name: 'Gift', emoji: '🎁' },
    { id: 'other-income', name: 'Other', emoji: '💵' },
  ],
  expense: [
    { id: 'food', name: 'Food & Dining', emoji: '🍔' },
    { id: 'transport', name: 'Transport', emoji: '🚗' },
    { id: 'shopping', name: 'Shopping', emoji: '🛍️' },
    { id: 'bills', name: 'Bills & Utilities', emoji: '📱' },
    { id: 'entertainment', name: 'Entertainment', emoji: '🎬' },
    { id: 'health', name: 'Health', emoji: '⚕️' },
    { id: 'education', name: 'Education', emoji: '📚' },
    { id: 'other-expense', name: 'Other', emoji: '💸' },
  ],
};

export const AddTransactionScreen = ({ navigation, route }: Props) => {
  const existingTransaction = route.params?.transaction as Transaction | undefined;
  const isEditing = !!existingTransaction;

  const [type, setType] = useState<'income' | 'expense'>(
    existingTransaction?.type || 'expense'
  );
  const [selectedCategory, setSelectedCategory] = useState(
    existingTransaction?.category || ''
  );
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
      paymentMethod: existingTransaction?.paymentMethod || '',
    },
  });

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
      date: new Date().toISOString(),
      emoji: category?.emoji || '📦',
      paymentMethod: data.paymentMethod || undefined,
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

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Transaction' : 'Add Transaction'}
          </Text>
          <View style={styles.backButton} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Type</Text>
          <View style={styles.typeContainer}>
            <TouchableOpacity
              style={[styles.typeButton, type === 'income' && styles.typeButtonActive]}
              onPress={() => {
                setType('income');
                setSelectedCategory('');
              }}
            >
              <Text style={styles.typeEmoji}>💵</Text>
              <Text style={[styles.typeText, type === 'income' && styles.typeTextActive]}>
                Income
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeButton, type === 'expense' && styles.typeButtonActive]}
              onPress={() => {
                setType('expense');
                setSelectedCategory('');
              }}
            >
              <Text style={styles.typeEmoji}>💸</Text>
              <Text style={[styles.typeText, type === 'expense' && styles.typeTextActive]}>
                Expense
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.categoryGrid}>
            {categoryList.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  selectedCategory === category.id && styles.categoryCardSelected,
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                <Text style={styles.categoryName}>{category.name}</Text>
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
              <Input
                label="Description"
                placeholder="Enter description"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.description?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="amount"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Amount (₹)"
                placeholder="0.00"
                keyboardType="decimal-pad"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.amount?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Notes (Optional)</Text>
                <TextInput
                  style={styles.textArea}
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

          <Controller
            control={control}
            name="paymentMethod"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Payment Method (Optional)"
                placeholder="e.g., Cash, Credit Card, UPI"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
        </View>

        <LoadingButton
          title={isEditing ? 'Update Transaction' : 'Add Transaction'}
          onPress={handleSubmit(onSubmit)}
          loading={saving}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: spacing.xl * 1.5,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: colors.white,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.white,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  typeButton: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeButtonActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  typeEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  typeText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  typeTextActive: {
    color: colors.primary,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  categoryCard: {
    width: '30%',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    margin: spacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryCardSelected: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  categoryEmoji: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  categoryName: {
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  textArea: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
