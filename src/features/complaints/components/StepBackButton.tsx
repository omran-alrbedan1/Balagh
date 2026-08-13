import { ChevronLeft } from 'lucide-react-native';
import { Pressable, Text } from 'react-native';

import { colors } from '@/theme/colors';

interface StepBackButtonProps {
  label: string;
  onPress: () => void;
}

export function StepBackButton({ label, onPress }: StepBackButtonProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      className="min-h-[54px] flex-row items-center justify-center gap-2 rounded-xl border border-primary-200 bg-white px-5 active:bg-primary-50"
      onPress={onPress}
    >
      <ChevronLeft color={colors.primary} size={20} />
      <Text className="text-base font-extrabold text-primary-600">{label}</Text>
    </Pressable>
  );
}
