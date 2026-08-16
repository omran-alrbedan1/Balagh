import { useQuery } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react-native';

import { useComplaintDetail } from '../useComplaintDetail';

jest.mock('@tanstack/react-query', () => ({ useQuery: jest.fn() }));
jest.mock('@/api/endpoints/complaints.api', () => ({ getComplaint: jest.fn() }));

const mockedUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseQuery.mockReturnValue({} as ReturnType<typeof useQuery>);
});

it('always reconciles complaint detail with the server when opened from a stale notification', () => {
  renderHook(() => useComplaintDetail('complaint-7'));

  expect(mockedUseQuery).toHaveBeenCalledWith(
    expect.objectContaining({
      enabled: true,
      queryKey: ['complaints', 'complaint-7'],
      refetchOnMount: 'always',
    }),
  );
});
