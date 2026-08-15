import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  FlatList,
  Image,
  ImageSourcePropType,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  image: ImageSourcePropType;
}

const ONBOARDING: OnboardingSlide[] = [
  {
    id: 'report',
    title: 'Report civic issues in minutes',
    description: 'Submit complaints with clear details, photos, and the right department.',
    image: require('../../../../assets/onboarding/welcome-report.png'),
  },
  {
    id: 'location',
    title: 'Pin the exact location',
    description: 'Attach your address or current location so teams know where to respond.',
    image: require('../../../../assets/onboarding/welcome-location.png'),
  },
  {
    id: 'updates',
    title: 'Track every update',
    description: 'Follow status changes, timelines, and resolution progress from your phone.',
    image: require('../../../../assets/onboarding/welcome-tracking.png'),
  },
];

export function WelcomeScreen() {
  const listRef = useRef<FlatList<OnboardingSlide>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { width } = useWindowDimensions();
  const isLastSlide = activeIndex === ONBOARDING.length - 1;

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(nextIndex);
  };

  const goNext = () => {
    if (isLastSlide) {
      router.replace('/(auth)/register');
      return;
    }

    listRef.current?.scrollToIndex({ animated: true, index: activeIndex + 1 });
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-light">
      <View className="flex-row items-center justify-between px-6 pt-2">
        <View className="flex-row items-center gap-2">
          <Image
            accessibilityIgnoresInvertColors
            className="h-9 w-9"
            resizeMode="contain"
            source={require('../../../../assets/symbol.png')}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          className="px-4 py-2"
          onPress={() => router.replace('/(auth)/register')}
        >
          <Text className="text-[15px] font-black text-primary-600">Skip</Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={ONBOARDING}
        horizontal
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={handleScrollEnd}
        pagingEnabled
        renderItem={({ item }) => <Slide item={item} width={width} />}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
      />

      <View className="gap-4 p-6 pt-4">
        <View className="flex-row items-center justify-center gap-2">
          {ONBOARDING.map((item, index) => (
            <View
              className={`h-[5px] rounded-full ${
                index === activeIndex ? 'w-[34px] bg-primary-600' : 'w-[22px] bg-base-200'
              }`}
              key={item.id}
            />
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          className="min-h-[54px] items-center justify-center rounded-lg bg-primary-600 px-4 shadow-lg shadow-primary-900/20 active:opacity-90"
          onPress={goNext}
        >
          <Text className="text-base font-black text-white">
            {isLastSlide ? 'Get Started' : 'Next'}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          className="min-h-12 items-center justify-center rounded-lg px-4 active:bg-primary-50"
          onPress={() => router.push('/(auth)/login')}
        >
          <Text className="text-base font-black text-primary-600">I already have an account</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Slide({ item, width }: { item: OnboardingSlide; width: number }) {
  return (
    <View className="items-center justify-center pb-6" style={{ width }}>
      <Image
        className="mb-8 h-[310px] w-[82%] rounded-[50px]"
        resizeMode="contain"
        source={item.image}
      />

      <View className="gap-4 px-8">
        <Text className="text-center text-[30px] font-black leading-9 text-base-900">
          {item.title}
        </Text>
        <Text className="text-center text-[17px] leading-[25px] text-base-500">
          {item.description}
        </Text>
      </View>
    </View>
  );
}
