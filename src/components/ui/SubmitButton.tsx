import { ArrowRight } from 'lucide-react-native';
import { FieldValues, SubmitHandler, UseFormHandleSubmit } from 'react-hook-form';

import { Button, ButtonProps } from '@/components/ui/Button';

interface SubmitButtonProps<TFieldValues extends FieldValues> extends Omit<
  ButtonProps,
  'loading' | 'onPress' | 'size' | 'variant'
> {
  handleSubmit: UseFormHandleSubmit<TFieldValues>;
  isSubmitting?: boolean;
  onSubmit: SubmitHandler<TFieldValues>;
  variant?: ButtonProps['variant'];
}

export function SubmitButton<TFieldValues extends FieldValues>({
  handleSubmit,
  iconRight,
  isSubmitting = false,
  onSubmit,
  variant = 'primary',
  ...buttonProps
}: SubmitButtonProps<TFieldValues>) {
  return (
    <Button
      {...buttonProps}
      iconRight={iconRight ?? <ArrowRight color="#FFFFFF" size={20} />}
      loading={isSubmitting}
      onPress={handleSubmit(onSubmit)}
      size="lg"
      variant={variant}
    />
  );
}
