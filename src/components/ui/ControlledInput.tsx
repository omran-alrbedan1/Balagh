import { ReactNode } from 'react';
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';
import { TextInputProps } from 'react-native';

import { Input, InputType } from '@/components/ui/Input';

interface ControlledInputProps<TFieldValues extends FieldValues> extends Omit<
  TextInputProps,
  'onChange' | 'onChangeText' | 'value'
> {
  control: Control<TFieldValues>;
  disabled?: boolean;
  helperText?: string;
  label: string;
  leftIcon?: ReactNode;
  name: FieldPath<TFieldValues>;
  rightIcon?: ReactNode;
  type?: InputType;
}

export function ControlledInput<TFieldValues extends FieldValues>({
  control,
  name,
  ...inputProps
}: ControlledInputProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Input
          {...inputProps}
          error={fieldState.error?.message}
          onBlur={field.onBlur}
          onChangeText={field.onChange}
          value={typeof field.value === 'string' ? field.value : ''}
        />
      )}
    />
  );
}
