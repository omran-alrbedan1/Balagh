import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing } from '@/theme/spacing';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export function PageHeader({ title }: PageHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="min-h-[72px] w-full items-center justify-center rounded-b-[22px] bg-primary-600 px-6 pb-4"
      style={{ paddingTop: insets.top + spacing.md }}
    >
      <Text className="text-center text-[22px] font-black leading-7 text-white">{title}</Text>
    </View>
  );
}
