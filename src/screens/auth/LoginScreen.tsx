import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { Input, LoadingButton } from '../../components';
import { authService } from '../../services';
import { useAuthStore } from '../../store/authStore';
import { loginSchema, type LoginFormData } from '../../validations';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../types/navigation';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { RootStackParamList } from '../../types/navigation';

type Props = CompositeScreenProps<
  NativeStackScreenProps<AuthStackParamList, 'Login'>,
  NativeStackScreenProps<RootStackParamList>
>;

export const LoginScreen = ({ navigation }: Props) => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const coin1 = useRef(new Animated.Value(0)).current;
  const coin2 = useRef(new Animated.Value(0)).current;
  const coin3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Floating coins animation
    const animateCoin = (coin: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(coin, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(coin, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animateCoin(coin1, 0);
    animateCoin(coin2, 400);
    animateCoin(coin3, 800);
  }, [fadeAnim, scaleAnim, coin1, coin2, coin3]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const response = await authService.login(data);
      await login(response.user, response.token, response.refreshToken);
      // Navigation handled automatically by RootNavigator
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header - matching Transaction page style */}
        <LinearGradient
          colors={[colors.background, colors.backgroundSecondary]}
          style={styles.header}
        >
          {/* Floating coins animation */}
          <Animated.View style={[styles.floatingCoin, styles.coin1, { 
            opacity: coin1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 1, 0.3] }),
            transform: [{ translateY: coin1.interpolate({ inputRange: [0, 1], outputRange: [0, -30] }) }]
          }]}>
            <Ionicons name="logo-bitcoin" size={24} color={colors.chartGold} />
          </Animated.View>
          
          <Animated.View style={[styles.floatingCoin, styles.coin2, { 
            opacity: coin2.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 1, 0.3] }),
            transform: [{ translateY: coin2.interpolate({ inputRange: [0, 1], outputRange: [0, -25] }) }]
          }]}>
            <Ionicons name="cash" size={20} color={colors.success} />
          </Animated.View>
          
          <Animated.View style={[styles.floatingCoin, styles.coin3, { 
            opacity: coin3.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 1, 0.3] }),
            transform: [{ translateY: coin3.interpolate({ inputRange: [0, 1], outputRange: [0, -35] }) }]
          }]}>
            <Ionicons name="card" size={22} color={colors.accent} />
          </Animated.View>

          <Animated.View style={[styles.logoContainer, { 
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }]}>
            <Ionicons name="wallet" size={64} color={colors.accent} />
          </Animated.View>
          
          <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={styles.brandName}>FinTrackAI</Text>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Smart Finance Management</Text>
          </Animated.View>
        </LinearGradient>

        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Password"
                placeholder="Enter your password"
                secureTextEntry
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.password?.message}
              />
            )}
          />

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotButton}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <LoadingButton
            title="Login"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
          />

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingBottom: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  brandName: {
    ...typography.displayLarge,
    color: colors.accent,
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: spacing.xs,
    letterSpacing: 1,
  },
  title: {
    ...typography.titleLarge,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  floatingCoin: {
    position: 'absolute',
  },
  coin1: {
    top: 80,
    left: 40,
  },
  coin2: {
    top: 100,
    right: 50,
  },
  coin3: {
    top: 140,
    right: 30,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  
  // Form
  form: {
    padding: spacing.xl,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
    marginTop: -spacing.sm,
  },
  forgotText: {
    ...typography.titleSmall,
    color: colors.accent,
    fontWeight: '600',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  registerText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  registerLink: {
    ...typography.titleMedium,
    color: colors.accent,
    fontWeight: '700',
  },
});
