/* eslint-disable @typescript-eslint/no-require-imports */
import { act, fireEvent, render } from '@testing-library/react-native';

import { useDraftComplaintStore } from '@/features/complaints/store/draftComplaintStore';

import NewComplaintScreen from '../new';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  const transition = { duration: () => ({}) };
  return {
    __esModule: true,
    default: { View },
    FadeIn: transition,
    LinearTransition: transition,
    SlideInLeft: transition,
    SlideInRight: transition,
    SlideOutLeft: transition,
    SlideOutRight: transition,
  };
});
jest.mock('@/components/layout/Screen', () => ({
  Screen: ({ children }: any) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));
jest.mock('@/features/complaints/components/StepIndicator', () => ({
  StepIndicator: ({ current }: { current: number }) => {
    const { Text } = require('react-native');
    return <Text>{`step:${current}`}</Text>;
  },
}));

jest.mock('@/features/complaints/components/steps/StepDetails', () => ({
  StepDetails: ({ onNext }: any) => {
    const { Pressable, Text } = require('react-native');
    return (
      <Pressable onPress={onNext} testID="next">
        <Text>details</Text>
      </Pressable>
    );
  },
}));
jest.mock('@/features/complaints/components/steps/StepCategory', () => ({
  StepCategory: ({ onNext }: any) => {
    const { Pressable, Text } = require('react-native');
    return (
      <Pressable onPress={onNext} testID="next">
        <Text>category</Text>
      </Pressable>
    );
  },
}));
jest.mock('@/features/complaints/components/steps/StepPhotos', () => ({
  StepPhotos: ({ onNext }: any) => {
    const { Pressable, Text } = require('react-native');
    return (
      <Pressable onPress={onNext} testID="next">
        <Text>photos</Text>
      </Pressable>
    );
  },
}));
jest.mock('@/features/complaints/components/steps/StepLocation', () => ({
  StepLocation: ({ onNext }: any) => {
    const { Pressable, Text } = require('react-native');
    return (
      <Pressable onPress={onNext} testID="next">
        <Text>location</Text>
      </Pressable>
    );
  },
}));
jest.mock('@/features/complaints/components/steps/StepReview', () => ({
  StepReview: ({ onSubmissionSuccess }: any) => {
    const { Pressable, Text } = require('react-native');
    return (
      <Pressable onPress={onSubmissionSuccess} testID="submit-success">
        <Text>review</Text>
      </Pressable>
    );
  },
}));

beforeEach(() => {
  act(() => useDraftComplaintStore.getState().reset());
});

it('starts a new complaint at step 1', () => {
  const view = render(<NewComplaintScreen />);

  expect(view.getByText('step:1')).toBeTruthy();
  expect(view.getByText('details')).toBeTruthy();
});

it('returns to step 1 after a successful submission callback', () => {
  const view = render(<NewComplaintScreen />);

  fireEvent.press(view.getByTestId('next'));
  fireEvent.press(view.getByTestId('next'));
  fireEvent.press(view.getByTestId('next'));
  fireEvent.press(view.getByTestId('next'));
  expect(view.getByText('step:5')).toBeTruthy();

  fireEvent.press(view.getByTestId('submit-success'));

  expect(view.getByText('step:1')).toBeTruthy();
  expect(view.getByText('details')).toBeTruthy();
});

it('keeps an unfinished draft and wizard step when the tab screen remains mounted', () => {
  act(() => useDraftComplaintStore.getState().setTitleDescription('Unfinished', 'Keep this draft'));
  const view = render(<NewComplaintScreen />);

  fireEvent.press(view.getByTestId('next'));
  view.rerender(<NewComplaintScreen />);

  expect(view.getByText('step:2')).toBeTruthy();
  expect(useDraftComplaintStore.getState().title).toBe('Unfinished');
  expect(useDraftComplaintStore.getState().description).toBe('Keep this draft');
});
