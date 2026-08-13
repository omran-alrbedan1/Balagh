import { ReactNode } from 'react';
import { Text, View } from 'react-native';

interface StepHeaderProps {
  icon: ReactNode;
  subtitle: string;
  title: string;
}

export function StepHeader({ icon, subtitle, title }: StepHeaderProps) {
  return (
    <View className="flex-row items-start gap-4">
      <View className="h-12 w-12 items-center justify-center rounded-lg border border-primary-300 bg-primary-50 shadow-md shadow-primary-900/10">
        {icon}
      </View>
      <View className="flex-1 gap-1">
        <Text className="text-[22px] font-black leading-7 text-base-900">{title}</Text>
        <Text className="text-[15px] leading-[21px] text-base-500">{subtitle}</Text>
      </View>
    </View>
  );
}
