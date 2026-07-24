import { TextInputProps } from 'react-native';

import { Input } from '@/components/ui/Input';

export function PasswordField(props: TextInputProps) {
  return <Input {...props} type="password" />;
}
