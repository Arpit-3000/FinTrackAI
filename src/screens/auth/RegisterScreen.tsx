import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { Input, LoadingButton } from '../../components';
import { authService } from '../../services';
import { useAuthStore } from '../../store/authStore';
import { registerSchema, type RegisterFormData } from '../../validations';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../types/navigation';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { RootStackParamList } from '../../types/navigation';

type Props = CompositeScreenProps<
  NativeStackScreenProps<AuthStackParamList, 'Register'>,
  NativeStackScreenProps<RootStackParamList>
>;

export const RegisterScreen = ({ navigation }: Props) => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const chart1 = useRef(new Animated.Value(0)).current;
  const chart2 = useRef(new Animated.Value(0)).current;
  const chart3 = useRef(new Animated.Value(0)).current;

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

    // Floating fintech icons animation
    const animateIcon = (icon: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(icon, {
            toValue: 1,
            duration: 2500,
            useNativeDriver: true,
          }),
          Animated.timing(icon, {
            toValue: 0,
            duration: 2500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animateIcon(chart1, 0);
    animateIcon(chart2, 600);
    animateIcon(chart3, 1200);
  }, [fadeAnim, scaleAnim, chart1, chart2, chart3]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    try {
      const response = await authService.register(data);
      await login(response.user, response.token, response.refreshToken);
      // Navigation handled automatically by RootNavigator
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header - matching Transaction page style */}
        <LinearGradient
          colors={[colors.background, colors.backgroundSecondary]}
          style={styles.header}
        >
          {/* Floating fintech icons */}
          <Animated.View style={[styles.floatingIcon, styles.icon1, { 
            opacity: chart1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 1, 0.3] }),
            transform: [
              { translateY: chart1.interpolate({ inputRange: [0, 1], outputRange: [0, -30] }) },
              { rotate: chart1.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '15deg'] }) }
            ]
          }]}>
            <Ionicons name="trending-up" size={26} color={colors.success} />
          </Animated.View>
          
          <Animated.View style={[styles.floatingIcon, styles.icon2, { 
            opacity: chart2.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 1, 0.3] }),
            transform: [
              { translateY: chart2.interpolate({ inputRange: [0, 1], outputRange: [0, -28] }) },
              { rotate: chart2.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-12deg'] }) }
            ]
          }]}>
            <Ionicons name="pie-chart" size={24} color={colors.chartBlue} />
          </Animated.View>
          
          <Animated.View style={[styles.floatingIcon, styles.icon3, { 
            opacity: chart3.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 1, 0.3] }),
            transform: [
              { translateY: chart3.interpolate({ inputRange: [0, 1], outputRange: [0, -32] }) },
              { rotate: chart3.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '10deg'] }) }
            ]
          }]}>
            <Ionicons name="stats-chart" size={22} color={colors.warning} />
          </Animated.View>

          <Animated.View style={[styles.logoContainer, { 
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }]}>
            <Ionicons name="person-add" size={64} color={colors.accent} />
          </Animated.View>
          
          <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={styles.brandName}>FinTrackAI</Text>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>AI-Powered Financial Insights</Text>
          </Animated.View>
        </LinearGradient>

        <View style={styles.form}>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.fullName?.message}
              />
            )}
          />

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
                placeholder="Create a password"
                secureTextEntry
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.password?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Confirm Password"
                placeholder="Re-enter your password"
                secureTextEntry
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.confirmPassword?.message}
              />
            )}
          />

          <LoadingButton
            title="Sign Up"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
          />

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Login</Text>
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
  contentContainer: {
    flexGrow: 1,
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
  floatingIcon: {
    position: 'absolute',
  },
  icon1: {
    top: 70,
    left: 35,
  },
  icon2: {
    top: 110,
    right: 45,
  },
  icon3: {
    top: 150,
    right: 25,
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  loginText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  loginLink: {
    ...typography.titleMedium,
    color: colors.accent,
    fontWeight: '700',
  },
});
