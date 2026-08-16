import { resolveNotificationDestination } from '../notificationNavigation';

describe('resolveNotificationDestination', () => {
  it.each([42, '42'] as const)('routes a complaint event with id %s', (complaintId) => {
    expect(
      resolveNotificationDestination({
        type: 'complaint_status_updated',
        complaint_id: complaintId,
      }),
    ).toEqual({
      pathname: '/(app)/(tabs)/complaints/[id]',
      params: { id: '42' },
    });
  });

  it('accepts the backend trusted click action for forward-compatible event types', () => {
    expect(
      resolveNotificationDestination({
        type: 'future_complaint_event',
        click_action: 'OPEN_COMPLAINT',
        complaint_id: 7,
      }),
    ).not.toBeNull();
  });

  it.each([
    undefined,
    null,
    'payload',
    {},
    { type: 'complaint_created' },
    { type: 'complaint_created', complaint_id: '../settings' },
    { type: 'system', complaint_id: 1 },
  ])('rejects malformed or non-navigable payload %#', (payload) => {
    expect(resolveNotificationDestination(payload)).toBeNull();
  });

  it('does not navigate arbitrary url_hint values', () => {
    expect(
      resolveNotificationDestination({
        type: 'system',
        complaint_id: 1,
        url_hint: '/(app)/(tabs)/profile',
      }),
    ).toBeNull();
  });

  it('routes additional-information events by complaint_id without inspecting localized copy', () => {
    expect(
      resolveNotificationDestination({
        body: 'مطلوب ردك',
        complaint_id: 23,
        title: 'مطلوب معلومات إضافية',
        type: 'complaint_status_updated',
      }),
    ).toEqual({
      pathname: '/(app)/(tabs)/complaints/[id]',
      params: { id: '23' },
    });
  });
});
