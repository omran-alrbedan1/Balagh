import { render } from '@testing-library/react-native';

import { StatusBadge } from '@/features/complaints/components/StatusBadge';

it('renders an unknown legacy status with a safe fallback instead of crashing', () => {
  const view = render(<StatusBadge status="pending_external_review" />);

  expect(view.getByText('Pending External Review')).toBeTruthy();
});
