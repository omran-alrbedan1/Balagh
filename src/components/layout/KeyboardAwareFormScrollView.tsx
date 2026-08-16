import { ComponentProps } from 'react';
import { Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

type Props = ComponentProps<typeof KeyboardAwareScrollView>;

/**
 * Shared scroll container for forms. It follows the focused input while the
 * native keyboard animates and leaves enough room to reach validation and the
 * final action on both platforms.
 */
export function KeyboardAwareFormScrollView({
  bottomOffset = 24,
  keyboardDismissMode = Platform.OS === 'ios' ? 'interactive' : 'on-drag',
  keyboardShouldPersistTaps = 'handled',
  ...props
}: Props) {
  return (
    <KeyboardAwareScrollView
      bottomOffset={bottomOffset}
      keyboardDismissMode={keyboardDismissMode}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      mode="layout"
      {...props}
    />
  );
}
