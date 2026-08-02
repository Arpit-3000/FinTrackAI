import { useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Animated, PanResponder } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../types/navigation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.35;

interface SwipeableTabContainerProps {
  children: React.ReactNode;
  currentTab: keyof MainTabParamList;
}

const TAB_ORDER: Array<keyof MainTabParamList> = [
  'Dashboard',
  'Transactions',
  'Analytics',
  'Budget',
  'Profile',
];

export const SwipeableTabContainer = ({ children, currentTab }: SwipeableTabContainerProps) => {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const isNavigating = useRef(false);

  // Reset animation values when tab changes
  useEffect(() => {
    if (!isNavigating.current) {
      translateX.setValue(0);
      opacity.setValue(1);
    }
  }, [currentTab, translateX, opacity]);

  const getCurrentTabIndex = useCallback(() => {
    return TAB_ORDER.indexOf(currentTab);
  }, [currentTab]);

  const navigateToTab = useCallback((index: number) => {
    if (index >= 0 && index < TAB_ORDER.length) {
      isNavigating.current = true;
      const tabName = TAB_ORDER[index];
      navigation.navigate(tabName as any);
      
      // Reset after navigation
      setTimeout(() => {
        isNavigating.current = false;
      }, 100);
    }
  }, [navigation]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes that are stronger than vertical
        const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2;
        const hasMinimumDistance = Math.abs(gestureState.dx) > 15;
        return isHorizontalSwipe && hasMinimumDistance;
      },
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2;
        const hasMinimumDistance = Math.abs(gestureState.dx) > 15;
        return isHorizontalSwipe && hasMinimumDistance;
      },
      onPanResponderGrant: () => {
        // Stop any ongoing animations
        translateX.stopAnimation();
        opacity.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        const currentIndex = getCurrentTabIndex();
        const isFirstTab = currentIndex === 0;
        const isLastTab = currentIndex === TAB_ORDER.length - 1;
        
        // Prevent swiping beyond boundaries
        if ((isFirstTab && gestureState.dx > 0) || (isLastTab && gestureState.dx < 0)) {
          return;
        }

        // Real-time translation and opacity during swipe
        const dragDistance = gestureState.dx;
        const dragRatio = Math.abs(dragDistance) / SCREEN_WIDTH;
        
        // Move the screen with resistance
        translateX.setValue(dragDistance * 0.3);
        
        // Fade out as user swipes (opacity decreases as swipe progresses)
        const newOpacity = Math.max(0.3, 1 - (dragRatio * 0.7));
        opacity.setValue(newOpacity);
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentIndex = getCurrentTabIndex();
        const swipeDistance = gestureState.dx;
        const swipeVelocity = gestureState.vx;
        
        // Determine if swipe threshold is met
        const shouldNavigate = 
          Math.abs(swipeDistance) > SWIPE_THRESHOLD || 
          Math.abs(swipeVelocity) > 0.5;
        
        // Swipe right (go to previous tab)
        if (swipeDistance > 0 && currentIndex > 0 && shouldNavigate) {
          // Complete the swipe animation
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: SCREEN_WIDTH * 0.3,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start(() => {
            navigateToTab(currentIndex - 1);
          });
        }
        // Swipe left (go to next tab)
        else if (swipeDistance < 0 && currentIndex < TAB_ORDER.length - 1 && shouldNavigate) {
          // Complete the swipe animation
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: -SCREEN_WIDTH * 0.3,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start(() => {
            navigateToTab(currentIndex + 1);
          });
        }
        // Spring back if threshold not met
        else {
          Animated.parallel([
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
              tension: 100,
              friction: 10,
            }),
            Animated.spring(opacity, {
              toValue: 1,
              useNativeDriver: true,
              tension: 100,
              friction: 10,
            }),
          ]).start();
        }
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <Animated.View 
        {...panResponder.panHandlers} 
        style={[
          styles.gestureLayer,
          {
            transform: [{ translateX }],
            opacity,
          },
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gestureLayer: {
    flex: 1,
  },
});
