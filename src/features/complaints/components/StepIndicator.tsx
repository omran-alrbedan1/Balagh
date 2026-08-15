import { Check } from 'lucide-react-native';
import { Text, View } from 'react-native';
import Animated, { FadeIn, LinearTransition, ZoomIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

const STEPS = ['details', 'category', 'photos', 'location', 'review'] as const;

export function StepIndicator({ current }: { current: number }) {
  const { t } = useTranslation();

  return (
    <View className="flex-row justify-between pt-1">
      {STEPS.map((label, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === current;
        const isDone = stepNumber < current;

        return (
          <Animated.View
            className="flex-1 items-center"
            entering={FadeIn.delay(index * 55).duration(220)}
            key={label}
            layout={LinearTransition.springify().damping(18)}
          >
            <View className="w-full flex-row items-center">
              <View
                className={`mr-1 h-0.5 flex-1 ${
                  index === 0 ? 'opacity-0' : isDone || isActive ? 'bg-primary-600' : 'bg-base-200'
                }`}
              />

              <Animated.View
                className={`z-10 h-12 w-12 items-center justify-center rounded-full border ${
                  isDone
                    ? 'border-primary-600 bg-primary-600'
                    : isActive
                      ? 'border-2 border-primary-600 bg-primary-50'
                      : 'border-base-200 bg-surface'
                }`}
              >
                {isDone ? (
                  <Check color="#FFFFFF" size={15} />
                ) : (
                  <Text
                    className={`text-xs font-black ${
                      isActive ? 'text-primary-600' : 'text-primary-600'
                    }`}
                  >
                    {stepNumber}
                  </Text>
                )}
              </Animated.View>

              <View
                className={`ml-1 h-0.5 flex-1 ${
                  index === STEPS.length - 1
                    ? 'opacity-0'
                    : stepNumber < current
                      ? 'bg-primary-600'
                      : 'bg-base-200'
                }`}
              />
            </View>

            <Animated.Text
              className={`mt-1 text-center text-[10px] ${
                isActive ? 'font-extrabold text-primary-600' : 'text-base-500'
              }`}
              entering={ZoomIn.delay(index * 55).duration(220)}
              layout={LinearTransition.duration(180)}
              numberOfLines={1}
            >
              {t(`steps.${label}`)}
            </Animated.Text>
          </Animated.View>
        );
      })}
    </View>
  );
}
