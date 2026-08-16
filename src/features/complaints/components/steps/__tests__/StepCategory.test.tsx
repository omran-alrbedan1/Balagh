/* eslint-disable @typescript-eslint/no-require-imports */
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import { useDraftComplaintStore } from '@/features/complaints/store/draftComplaintStore';
import { normalizeClassificationConfidence } from '@/features/complaints/utils/classificationConfidence';
import { useCategories } from '@/features/lookups/hooks/useCategories';
import { useDepartments } from '@/features/lookups/hooks/useDepartments';

import { StepCategory } from '../StepCategory';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      key === 'complaints.suggestedCategory'
        ? `Suggested: ${values?.department} → ${values?.category} · ${values?.confidence}% match`
        : key,
  }),
}));
jest.mock('lucide-react-native', () => ({
  Loader2: () => null,
  Sparkles: () => null,
  Tags: () => null,
}));
jest.mock('@/features/lookups/hooks/useCategories', () => ({ useCategories: jest.fn() }));
jest.mock('@/features/lookups/hooks/useDepartments', () => ({ useDepartments: jest.fn() }));
jest.mock('@/hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => ({ isOnline: true, status: 'online' }),
}));
jest.mock('@/features/complaints/components/StepHeader', () => ({ StepHeader: () => null }));
jest.mock('@/features/complaints/components/StepBackButton', () => ({
  StepBackButton: () => null,
}));
jest.mock('@/components/ui/SubmitButton', () => ({ SubmitButton: () => null }));
jest.mock('@/features/lookups/components/DepartmentCategoryPicker', () => ({
  DepartmentCategoryPicker: ({
    categoryId,
    departmentId,
    onCategoryChange,
    onDepartmentChange,
  }: any) => {
    const { Pressable, Text, View } = require('react-native');
    return (
      <View>
        <Text>{`department:${departmentId ?? ''}`}</Text>
        <Text>{`category:${categoryId ?? ''}`}</Text>
        <Pressable
          onPress={() => onDepartmentChange('manual-department')}
          testID="manual-department"
        >
          <Text>change department</Text>
        </Pressable>
        <Pressable onPress={() => onCategoryChange('manual-category')} testID="manual-category">
          <Text>change category</Text>
        </Pressable>
      </View>
    );
  },
}));

const mockedCategories = useCategories as jest.MockedFunction<typeof useCategories>;
const mockedDepartments = useDepartments as jest.MockedFunction<typeof useDepartments>;

const department = { id: 'department-a', name: 'Roads', code: 'roads', is_active: true };
const category = {
  id: 'category-a',
  department_id: department.id,
  name: 'Potholes',
  code: 'potholes',
  is_active: true,
};

function classify(confidence = 75) {
  act(() => {
    useDraftComplaintStore.getState().setClassification({
      categoryId: category.id,
      categoryName: category.name,
      confidence,
      departmentId: department.id,
      departmentName: department.name,
      status: 'success',
    });
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  act(() => useDraftComplaintStore.getState().reset());
  mockedDepartments.mockReturnValue({
    data: [department],
    isFetching: false,
    isSuccess: true,
  } as ReturnType<typeof useDepartments>);
  mockedCategories.mockReturnValue({
    data: [category],
    isFetching: false,
    isSuccess: true,
  } as ReturnType<typeof useCategories>);
});

it('selects the AI department, then retains its category after the category query completes', async () => {
  mockedCategories.mockReturnValue({
    data: undefined,
    isFetching: true,
    isSuccess: false,
  } as ReturnType<typeof useCategories>);
  classify();
  const view = render(<StepCategory onNext={jest.fn()} />);

  await waitFor(() => expect(useDraftComplaintStore.getState().departmentId).toBe(department.id));
  expect(useDraftComplaintStore.getState().categoryId).toBeUndefined();

  mockedCategories.mockReturnValue({
    data: [category],
    isFetching: false,
    isSuccess: true,
  } as ReturnType<typeof useCategories>);
  view.rerender(<StepCategory onNext={jest.fn()} />);

  await waitFor(() => expect(useDraftComplaintStore.getState().categoryId).toBe(category.id));
  expect(view.getByText('Suggested: Roads → Potholes · 75% match')).toBeTruthy();
});

it('clears the category when the department is changed manually', async () => {
  classify();
  const view = render(<StepCategory onNext={jest.fn()} />);
  await waitFor(() => expect(useDraftComplaintStore.getState().categoryId).toBe(category.id));

  fireEvent.press(view.getByTestId('manual-department'));

  expect(useDraftComplaintStore.getState().departmentId).toBe('manual-department');
  expect(useDraftComplaintStore.getState().categoryId).toBeUndefined();
});

it('does not overwrite a manual selection when classification completes later', async () => {
  act(() => useDraftComplaintStore.getState().setClassification({ status: 'loading' }));
  const view = render(<StepCategory onNext={jest.fn()} />);

  fireEvent.press(view.getByTestId('manual-department'));
  fireEvent.press(view.getByTestId('manual-category'));
  classify();
  view.rerender(<StepCategory onNext={jest.fn()} />);

  await waitFor(() => {
    expect(useDraftComplaintStore.getState().departmentId).toBe('manual-department');
    expect(useDraftComplaintStore.getState().categoryId).toBe('manual-category');
  });
});

it('keeps manual selection usable after classification fails', () => {
  act(() => useDraftComplaintStore.getState().setClassification({ status: 'error' }));
  const view = render(<StepCategory onNext={jest.fn()} />);

  fireEvent.press(view.getByTestId('manual-department'));
  fireEvent.press(view.getByTestId('manual-category'));

  expect(useDraftComplaintStore.getState().departmentId).toBe('manual-department');
  expect(useDraftComplaintStore.getState().categoryId).toBe('manual-category');
  expect(view.queryByText(/Suggested:/)).toBeNull();
});

it('normalizes fractional and percent confidence values into the display range', () => {
  expect(normalizeClassificationConfidence(0.75)).toBe(75);
  expect(normalizeClassificationConfidence(75)).toBe(75);
  expect(normalizeClassificationConfidence(125)).toBe(100);
  expect(normalizeClassificationConfidence(-5)).toBe(0);
  expect(normalizeClassificationConfidence(Number.NaN)).toBe(0);
});
