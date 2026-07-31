import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Splash: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  OTPVerification: { email: string };
  ResetPassword: { email: string; otp: string };
};

export type MainTabParamList = {
  Tabs: undefined;
  Dashboard: undefined;
  Transactions: undefined;
  Analytics: undefined;
  Budget: undefined;
  Profile: undefined;
  AddTransaction: { transaction?: any };
};
