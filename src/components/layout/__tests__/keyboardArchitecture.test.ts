/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const formScreens = [
  'src/features/auth/screens/LoginScreen.tsx',
  'src/features/auth/screens/RegisterScreen.tsx',
  'src/features/auth/screens/ForgotPasswordScreen.tsx',
  'src/features/auth/screens/OtpScreen.tsx',
  'src/features/auth/screens/ResetPasswordScreen.tsx',
  'src/features/auth/screens/ChangePasswordScreen.tsx',
  'src/features/profile/screens/EditProfileScreen.tsx',
];

it.each(formScreens)('%s uses the shared focus-aware form scroller', (file) => {
  const source = fs.readFileSync(path.join(process.cwd(), file), 'utf8');

  expect(source).toContain('KeyboardAwareFormScrollView');
  expect(source).not.toContain('KeyboardAvoidingView');
});

it('opts complaint creation and detail into shared keyboard-aware scrolling', () => {
  const createSource = fs.readFileSync(
    path.join(process.cwd(), 'app/(app)/(tabs)/complaints/new.tsx'),
    'utf8',
  );
  const detailSource = fs.readFileSync(
    path.join(process.cwd(), 'app/(app)/(tabs)/complaints/[id].tsx'),
    'utf8',
  );

  expect(createSource).toMatch(/<Screen\s+keyboardAware/);
  expect(detailSource).toMatch(/<Screen\s+keyboardAware/);
});

it('provides the native keyboard controller once and keeps tabs stable', () => {
  const providers = fs.readFileSync(path.join(process.cwd(), 'src/lib/AppProviders.tsx'), 'utf8');
  const tabs = fs.readFileSync(path.join(process.cwd(), 'app/(app)/(tabs)/_layout.tsx'), 'utf8');

  expect(providers).toContain('<KeyboardProvider preload={false}>');
  expect(tabs).toContain('tabBarHideOnKeyboard: false');
});

it('keeps the searchable select sheet above the keyboard', () => {
  const selectField = fs.readFileSync(
    path.join(process.cwd(), 'src/components/ui/SelectField.tsx'),
    'utf8',
  );

  expect(selectField).toContain("from 'react-native-keyboard-controller'");
  expect(selectField).toContain('<KeyboardAvoidingView');
  expect(selectField).toContain('keyboardDismissMode="on-drag"');
});
