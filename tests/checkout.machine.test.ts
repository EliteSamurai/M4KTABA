import {
  checkoutReducer,
  initialCheckoutState,
  isBusy,
  canSubmit,
} from '@/app/checkout/checkout.machine';

describe('checkout.machine', () => {
  test('transitions idle → validating → creating → ready', () => {
    let state = initialCheckoutState;
    expect(state.status).toBe('idle');
    state = checkoutReducer(state, { type: 'SUBMIT' });
    expect(state.status).toBe('validatingAddress');
    state = checkoutReducer(state, { type: 'ADDRESS_OK' });
    expect(state.status).toBe('creatingIntent');
    state = checkoutReducer(state, { type: 'INTENT_OK' });
    expect(state.status).toBe('paymentReady');
  });

  test('guards: cannot submit while busy', () => {
    const validating = checkoutReducer(initialCheckoutState, {
      type: 'SUBMIT',
    });
    expect(isBusy(validating)).toBe(true);
    expect(canSubmit(validating)).toBe(false);
    const creating = checkoutReducer(validating, { type: 'ADDRESS_OK' });
    expect(isBusy(creating)).toBe(true);
    expect(canSubmit(creating)).toBe(false);
  });
});
