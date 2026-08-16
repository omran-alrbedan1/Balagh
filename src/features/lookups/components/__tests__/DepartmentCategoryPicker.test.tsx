/* eslint-disable @typescript-eslint/no-require-imports */
import { render } from '@testing-library/react-native';

import { useCategories } from '@/features/lookups/hooks/useCategories';
import { useDepartments } from '@/features/lookups/hooks/useDepartments';

import { DepartmentCategoryPicker } from '../DepartmentCategoryPicker';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('@/features/lookups/hooks/useCategories', () => ({ useCategories: jest.fn() }));
jest.mock('@/features/lookups/hooks/useDepartments', () => ({ useDepartments: jest.fn() }));
jest.mock('@/components/ui/SelectField', () => ({
  SelectField: ({ label, value }: { label: string; value?: string }) => {
    const { Text } = require('react-native');
    return <Text>{`${label}:${value ?? ''}`}</Text>;
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

beforeEach(() => {
  jest.clearAllMocks();
  mockedDepartments.mockReturnValue({
    data: [department],
    isLoading: false,
  } as ReturnType<typeof useDepartments>);
});

it('does not clear a selected category while its department query is loading or fetching', () => {
  const onCategoryChange = jest.fn();
  mockedCategories.mockReturnValue({
    data: undefined,
    isError: false,
    isFetching: true,
    isLoading: true,
    isSuccess: false,
  } as ReturnType<typeof useCategories>);

  const view = render(
    <DepartmentCategoryPicker
      categoryId={category.id}
      departmentId={department.id}
      onCategoryChange={onCategoryChange}
      onDepartmentChange={jest.fn()}
    />,
  );

  expect(onCategoryChange).not.toHaveBeenCalled();

  mockedCategories.mockReturnValue({
    data: [category],
    isError: false,
    isFetching: false,
    isLoading: false,
    isSuccess: true,
  } as ReturnType<typeof useCategories>);
  view.rerender(
    <DepartmentCategoryPicker
      categoryId={category.id}
      departmentId={department.id}
      onCategoryChange={onCategoryChange}
      onDepartmentChange={jest.fn()}
    />,
  );

  expect(onCategoryChange).not.toHaveBeenCalled();
});
