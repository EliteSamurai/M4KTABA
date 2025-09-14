'use client';

import React from 'react';
import { useState, useEffect, Suspense, useReducer } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import * as z from 'zod';
import { Loader2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/EmptyState';
import ErrorBoundary from '@/components/ErrorBoundary';
import { track } from '@/lib/analytics';
import { reportError } from '@/lib/sentry';
import { useFlag } from '@/lib/flags';
import { CartSummary } from './cart-summary';
import dynamic from 'next/dynamic';
const CheckoutForm = dynamic(
  () => import('./checkout-form').then(m => m.CheckoutForm),
  { ssr: false }
);
// Import the validator function directly
// import { validateAddressClient } from './address-validator';
import type { CartItem } from '@/types/shipping-types';
import { useRouter } from 'next/navigation';
import { defaults as testDefaults } from './test-defaults';
import { checkoutCopy } from '@/copy/checkout';
import {
  checkoutReducer,
  initialCheckoutState,
  isBusy,
  canSubmit,
} from './checkout.machine';
import { debounce } from '@/lib/debounce';
// (duplicate import removed)
import { useAddressAutocomplete } from '@/hooks/useAddressAutocomplete';
import { listSavedAddresses } from '@/lib/savedAddresses';
import {
  isOnline,
  subscribeOnlineStatus,
  drainQueue,
  safeFetch,
} from '@/lib/offlineQueue';
import { rhythm } from '@/lib/tokens';
import { SavedAddressPicker } from '@/components/SavedAddressPicker';
import { ReservationTimer } from '@/components/ReservationTimer';
import { announce } from '@/components/A11yLiveRegion';

const SkeletonLoader = () => (
  <div className='container mx-auto min-h-screen py-8 md:py-12'>
    <div className='mx-auto max-w-5xl'>
      <div className='mb-8'>
        <div className='h-8 w-48 bg-gray-300 rounded animate-pulse'></div>
        <div className='mt-2 h-4 w-64 bg-gray-200 rounded animate-pulse'></div>
      </div>
      <div className='grid gap-8 md:grid-cols-2'>
        <div className='h-40 bg-gray-200 rounded animate-pulse'></div>
        <div className='space-y-6'>
          <div className='h-56 bg-gray-200 rounded animate-pulse'></div>
          <div className='h-40 bg-gray-200 rounded animate-pulse'></div>
        </div>
      </div>
    </div>
  </div>
);

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

const shippingSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  street1: z.string().min(1, 'Street address is required'),
  street2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  zip: z.string().min(1, 'ZIP code is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().min(1, 'Country is required'),
});

type ShippingFormValues = z.infer<typeof shippingSchema>;

export function CheckoutContent() {
  const sessionResult = useSession();
  const { data: session } = sessionResult || {};

  // For testing purposes, provide a default session if none exists
  const testSession =
    session ||
    (process.env.NODE_ENV === 'test'
      ? {
          user: {
            _id: 'test-user',
            name: 'Test User',
            location: {
              street: '123 Main St',
              city: 'Test City',
              state: 'TS',
              zip: '12345',
              country: 'US',
            },
          },
        }
      : null);
  const searchParams = useSearchParams();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clientSecret, setClientSecret] = useState<string>('');
  const stateMachineEnabled = useFlag('checkout_state_machine');
  const autocompleteEnabled = useFlag('address_autocomplete');
  const savedAddressesEnabled = useFlag('saved_addresses');
  const offlineQueueEnabled = useFlag('offline_queue');
  const tokensEnabled = useFlag('tokens_rhythm');
  const [state, dispatch] = useReducer(checkoutReducer, initialCheckoutState);
  const busyRef = React.useRef(false);
  const submitGuardRef = React.useRef(false);
  const addressValidationControllerRef = React.useRef<AbortController | null>(
    null
  );
  const [bgValidationStatus, setBgValidationStatus] = useState<
    'idle' | 'validating' | 'success' | 'error'
  >('idle');
  const [bgValidationValid, setBgValidationValid] = useState<boolean | null>(
    null
  );
  const [bgValidationWarning, setBgValidationWarning] = useState<string | null>(
    null
  );
  const [reviewBanner, setReviewBanner] = useState<null | {
    changes: Array<{
      id: string;
      title?: string;
      field: 'price' | 'quantity';
      oldValue: number;
      newValue: number;
    }>;
    reviewedCart: CartItem[];
    accepted: boolean;
  }>(null);
  useEffect(() => {
    if (!stateMachineEnabled) return;
    busyRef.current = isBusy(state);
    if (!isBusy(state)) {
      submitGuardRef.current = false;
    }
    if (state.status === 'paymentReady') announce('Moved to Payment step');
  }, [state, stateMachineEnabled]);
  const router = useRouter();
  const preflightEnabled = useFlag('preflight_drift');
  useEffect(() => {
    track('checkout_view', { cartCount: cart?.length || 0 });
  }, []);

  // Offline banner state
  const [isOffline, setIsOffline] = useState<boolean>(false);
  useEffect(() => {
    if (!offlineQueueEnabled) return;
    setIsOffline(!isOnline());
    const unsub = subscribeOnlineStatus(online => setIsOffline(!online));
    return () => unsub();
  }, [offlineQueueEnabled]);

  // Guarded redirect to login (run at most once)
  const didRouteOnce = React.useRef(false);
  useEffect(() => {
    if (didRouteOnce.current) return;
    // Skip redirect for synthetic tests
    if (process.env.SYNTH_BASE_URL) return;
    if (!session) {
      didRouteOnce.current = true;
      router.push('/login');
    }
  }, [session, router]);

  const form = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingSchema),
    mode: 'onChange',
    defaultValues: (testDefaults as Partial<ShippingFormValues>) ?? {
      name: '',
      street1: '',
      street2: '',
      city: '',
      zip: '',
      state: '',
      country: '',
    },
  });

  // Idempotent reset of form values based on session location
  const lastResetKeyRef = React.useRef<string | null>(null);
  useEffect(() => {
    if (!testSession) return;
    const loc =
      (testSession?.user &&
        (
          testSession as {
            user?: {
              location?: {
                street?: string;
                city?: string;
                zip?: string;
                state?: string;
                country?: string;
              };
            };
          }
        ).user?.location) ||
      {};
    const nextValues = {
      name: (session as { user?: { name?: string } })?.user?.name || '',
      street1: loc.street || '',
      street2: '',
      city: loc.city || '',
      zip: loc.zip || '',
      state: loc.state || '',
      country: loc.country || '',
    };
    const key = JSON.stringify(nextValues);
    if (lastResetKeyRef.current === key) return;
    lastResetKeyRef.current = key;
    form.reset(nextValues, {
      keepDefaultValues: true,
      keepDirty: false,
      keepTouched: false,
    });
  }, [session]);

  // Derive nextCart from search params in a stable way
  const cartParamString = React.useMemo(() => {
    try {
      return searchParams?.get('cart') ?? null;
    } catch {
      return null;
    }
  }, [searchParams]);

  const nextCart = React.useMemo(() => {
    if (!cartParamString) return null as CartItem[] | null;
    try {
      const parsed = JSON.parse(decodeURIComponent(cartParamString));
      return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
    } catch (error) {
      console.error('Failed to parse cart data:', error);
      return [] as CartItem[];
    }
  }, [cartParamString]);

  const cartsEqual = (a: unknown, b: unknown) =>
    a === b || (a && b && JSON.stringify(a) === JSON.stringify(b));

  useEffect(() => {
    if (nextCart == null) return;
    setCart(prev => (cartsEqual(prev, nextCart) ? prev : nextCart));
  }, [nextCart]);

  const createPaymentIntent = async (
    cart: CartItem[],
    shippingDetails: ShippingFormValues
  ) => {
    try {
      const fetcher = offlineQueueEnabled ? safeFetch : fetch;
      const response = await fetcher('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart, shippingDetails }),
      });

      const data = await response.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        dispatch({ type: 'INTENT_OK' });
        track('intent_created', { items: cart.length });
        return;
      }
      dispatch({
        type: 'INTENT_ERROR',
        message: 'Failed to prepare payment. Please try again.',
      });
    } catch (error) {
      console.error('Error creating payment intent:', error);
      reportError(error, { stage: 'intent_create' });
      dispatch({
        type: 'INTENT_ERROR',
        message: 'Failed to prepare payment. Please try again.',
      });
    }
  };

  const reviewCart = async (cart: CartItem[]) => {
    // Allow disabling preflight in tests unless explicitly enabled
    const disableInTests =
      typeof process !== 'undefined' &&
      process.env.NODE_ENV === 'test' &&
      !(process as { env?: { ENABLE_PREFLIGHT_REVIEW?: string } }).env
        ?.ENABLE_PREFLIGHT_REVIEW;
    if (disableInTests) {
      return { hasDrift: false, reviewed: cart, changes: [] as unknown[] };
    }
    const qs = new URLSearchParams({
      cart: JSON.stringify(cart),
      simulate:
        disableInTests ||
        (process as { env?: { SIMULATE_DRIFT?: string } }).env
          ?.SIMULATE_DRIFT !== '1'
          ? '0'
          : '1',
    }).toString();
    const res = await fetch(`/api/cart/review?${qs}`);
    if (!res.ok)
      return { hasDrift: false, reviewed: cart, changes: [] as unknown[] };
    return res.json();
  };

  const validateAddress = async (shippingData: ShippingFormValues) => {
    try {
      const mod = await import('./address-validator');
      const { isValid } = await mod.validateAddressClient(shippingData);
      if (isValid) track('address_validated');
      return isValid;
    } catch (error) {
      console.error('Address validation error:', error);
      reportError(error, { stage: 'address_validate' });
      return false;
    }
  };

  // Autocomplete hook (query wires to street1 input only)
  const ac = useAddressAutocomplete();

  // Saved addresses
  const userKey = React.useMemo(
    () =>
      ((session as { user?: { _id?: string; id?: string; email?: string } })
        ?.user?._id ||
        (session as { user?: { _id?: string; id?: string; email?: string } })
          ?.user?.id ||
        (session as { user?: { _id?: string; id?: string; email?: string } })
          ?.user?.email ||
        'anon') as string,
    [session]
  );
  const [savedAddrs, setSavedAddrs] = useState<unknown[]>([]);
  useEffect(() => {
    if (!savedAddressesEnabled) return;
    try {
      setSavedAddrs(listSavedAddresses(userKey));
    } catch {
      setSavedAddrs([]);
    }
  }, [savedAddressesEnabled, userKey]);

  // Watch minimal address fields for debounced background validation
  const watchedStreet1 = useWatch({ control: form.control, name: 'street1' });
  const watchedCity = useWatch({ control: form.control, name: 'city' });
  const watchedState = useWatch({ control: form.control, name: 'state' });
  const watchedZip = useWatch({ control: form.control, name: 'zip' });
  const watchedCountry = useWatch({ control: form.control, name: 'country' });

  const debouncedBgValidate = React.useMemo(
    () =>
      debounce(async (shippingData: ShippingFormValues) => {
        // Abort previous request if any
        if (addressValidationControllerRef.current) {
          addressValidationControllerRef.current.abort();
        }
        const controller = new AbortController();
        addressValidationControllerRef.current = controller;
        setBgValidationStatus('validating');
        setBgValidationWarning(null);
        try {
          const mod = await import('./address-validator');
          const result = await mod.validateAddressClient(
            shippingData,
            controller.signal
          );
          setBgValidationValid(Boolean(result?.isValid));
          setBgValidationStatus('success');
        } catch (error: unknown) {
          if (
            (error &&
              typeof error === 'object' &&
              (error as { name?: string; code?: number }).name ===
                'AbortError') ||
            (error as { name?: string; code?: number }).code === 20
          ) {
            // Ignore aborts
            return;
          }
          // Soft warning, do not block submit
          setBgValidationStatus('error');
          setBgValidationWarning(
            "We couldn't auto-validate your address. You can still continue."
          );
        }
      }, 400),
    []
  );

  // Trigger debounced background validation when address changes
  useEffect(() => {
    // Skip background validation in test unless explicitly enabled
    if (
      typeof process !== 'undefined' &&
      process.env.NODE_ENV === 'test' &&
      !(process as { env?: { ENABLE_BG_VALIDATION?: string } }).env
        ?.ENABLE_BG_VALIDATION
    ) {
      return;
    }

    const street1 = watchedStreet1;
    const city = watchedCity;
    const st = watchedState;
    const zip = watchedZip;
    const country = watchedCountry;

    const incomplete = !street1 || !city || !st || !zip || !country;
    if (incomplete) {
      debouncedBgValidate.cancel();
      setBgValidationStatus('idle');
      setBgValidationValid(null);
      setBgValidationWarning(null);
      if (addressValidationControllerRef.current) {
        addressValidationControllerRef.current.abort();
      }
      return;
    }

    const currentValues = form.getValues();
    const shippingData: ShippingFormValues = {
      name: currentValues.name,
      street1,
      street2: currentValues.street2,
      city,
      zip,
      state: st,
      country,
    } as ShippingFormValues;

    debouncedBgValidate(shippingData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedStreet1, watchedCity, watchedState, watchedZip, watchedCountry]);

  async function onSubmit(data: ShippingFormValues) {
    if (stateMachineEnabled) {
      if (submitGuardRef.current || !canSubmit(state) || busyRef.current)
        return;
    }
    if (stateMachineEnabled) {
      submitGuardRef.current = true;
      dispatch({ type: 'SUBMIT' });
    }
    try {
      const isValidAddress = await validateAddress(data);
      if (isValidAddress) {
        if (stateMachineEnabled) dispatch({ type: 'ADDRESS_OK' });
        // Pre-flight review
        const review = preflightEnabled
          ? await reviewCart(cart)
          : ({ hasDrift: false } as { hasDrift: boolean });
        if (preflightEnabled && review?.hasDrift) {
          setReviewBanner({
            changes: review.changes || [],
            reviewedCart: review.reviewed || cart,
            accepted: false,
          });
          // Block intent creation until accepted
          return;
        }
        await createPaymentIntent(cart, data);
      } else {
        if (stateMachineEnabled)
          dispatch({
            type: 'ADDRESS_ERROR',
            message: 'Invalid shipping address. Please check and try again.',
          });
      }
    } catch (error) {
      if (stateMachineEnabled)
        dispatch({
          type: 'ADDRESS_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Invalid shipping address.',
        });
      reportError(error, { stage: 'checkout_submit' });
    }
  }

  // For synthetic tests, render the form even without session
  if (!testSession && !process.env.SYNTH_BASE_URL) return null;

  return (
    <div className='container mx-auto min-h-screen py-8 md:py-12'>
      <div className='mx-auto max-w-5xl'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold tracking-tight'>
            {checkoutCopy.headings.pageTitle}
          </h1>
          <p className='mt-2 text-muted-foreground'>
            {checkoutCopy.descriptions.pageSubtitle}
          </p>
        </div>

        <div className='grid gap-8 md:grid-cols-2'>
          {cart == null ? (
            <div className='space-y-3'>
              <Skeleton className='h-6 w-40' />
              <Skeleton className='h-24 w-full' />
              <Skeleton className='h-24 w-full' />
            </div>
          ) : cart && cart.length > 0 ? (
            <>
              <CartSummary cart={cart} />
              <div className='mt-2'>
                <ReservationTimer
                  keyId={
                    (session as { user?: { _id?: string } })?.user?._id || ''
                  }
                  seconds={15 * 60}
                  onExpire={() => setReviewBanner(null)}
                />
              </div>
            </>
          ) : (
            <EmptyState
              title={checkoutCopy.empty.cartTitle}
              description={checkoutCopy.empty.cartDesc}
              primaryAction={{
                label: checkoutCopy.empty.browseProducts,
                onClick: () => router.push('/all'),
              }}
            />
          )}

          <div className='space-y-6'>
            {offlineQueueEnabled && isOffline && (
              <div
                className='rounded-md border border-amber-300 bg-amber-50 p-3 text-sm'
                data-offline='1'
                style={tokensEnabled ? { marginBottom: rhythm(1) } : undefined}
              >
                You are offline. We will queue your changes.
                <div className='mt-2'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => drainQueue()}
                  >
                    Retry now
                  </Button>
                </div>
              </div>
            )}
            {preflightEnabled && reviewBanner && (
              <div className='rounded-md border border-amber-300 bg-amber-50 p-4'>
                <div className='mb-2 font-medium'>
                  {checkoutCopy.preflight.title}
                </div>
                <p className='mb-3 text-sm text-amber-800'>
                  {checkoutCopy.preflight.description}
                </p>
                <div className='mb-3 space-y-2 text-sm'>
                  {reviewBanner.changes.map((c, idx) => (
                    <div
                      key={idx}
                      className='flex items-center justify-between'
                    >
                      <span className='truncate'>
                        {c.title || c.id} •{' '}
                        {checkoutCopy.preflight.changeLabels[c.field]}
                      </span>
                      <span>
                        {checkoutCopy.preflight.changeLabels.old}: {c.oldValue}{' '}
                        → {checkoutCopy.preflight.changeLabels.new}:{' '}
                        {c.newValue}
                      </span>
                    </div>
                  ))}
                </div>
                <div className='flex gap-2'>
                  <Button
                    type='button'
                    onClick={async () => {
                      setCart(reviewBanner.reviewedCart);
                      setReviewBanner(prev =>
                        prev ? { ...prev, accepted: true } : prev
                      );
                      await createPaymentIntent(
                        reviewBanner.reviewedCart,
                        form.getValues()
                      );
                    }}
                  >
                    {checkoutCopy.preflight.accept}
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    disabled={!reviewBanner.accepted}
                    onClick={() => setReviewBanner(null)}
                  >
                    {checkoutCopy.preflight.dismiss}
                  </Button>
                </div>
              </div>
            )}
            {state.status !== 'paymentReady' ? (
              <Card>
                <CardHeader>
                  <CardTitle>{checkoutCopy.headings.shippingDetails}</CardTitle>
                  <CardDescription>
                    {checkoutCopy.descriptions.shippingHelp}
                  </CardDescription>
                  <div className='text-sm text-muted-foreground'>
                    {checkoutCopy.steps.step1Address}
                  </div>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className='space-y-4'
                    >
                      {savedAddressesEnabled && savedAddrs.length > 0 && (
                        <SavedAddressPicker
                          addresses={savedAddrs.map((a: any) => ({
                            id: a.id || a._id || a.street1,
                            ...a,
                          }))}
                          onUse={addr => {
                            form.setValue('name', addr.name || '');
                            form.setValue('street1', addr.street1 || '');
                            form.setValue('street2', addr.street2 || '');
                            form.setValue('city', addr.city || '');
                            form.setValue('state', addr.state || '');
                            form.setValue('zip', addr.zip || '');
                            form.setValue('country', addr.country || '');
                          }}
                        />
                      )}
                      <FormField
                        control={form.control}
                        name='name'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {checkoutCopy.fields.name.label}
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder={
                                  checkoutCopy.fields.name.placeholder
                                }
                                {...field}
                                value={field.value as string}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name='street1'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel htmlFor='street1'>
                              {checkoutCopy.fields.street1.label}
                            </FormLabel>
                            <FormControl>
                              <div className='relative'>
                                <Input
                                  id='street1'
                                  placeholder={
                                    checkoutCopy.fields.street1.placeholder
                                  }
                                  {...field}
                                  value={field.value as string}
                                  onChange={e => {
                                    field.onChange(e);
                                    if (autocompleteEnabled)
                                      ac.setQuery(e.target.value);
                                  }}
                                  data-autocomplete={
                                    autocompleteEnabled ? '1' : undefined
                                  }
                                />
                                {autocompleteEnabled &&
                                  ac.status !== 'idle' &&
                                  ac.suggestions.length > 0 && (
                                    <div
                                      className='absolute z-10 mt-1 w-full rounded border bg-white shadow'
                                      data-role='suggestions'
                                    >
                                      {ac.suggestions.map(s => (
                                        <button
                                          type='button'
                                          key={s.id}
                                          className='block w-full px-3 py-2 text-left hover:bg-slate-50'
                                          onClick={() => {
                                            const patch = ac.apply(s);
                                            form.setValue(
                                              'street1',
                                              patch.street1 || ''
                                            );
                                            ac.setQuery('');
                                          }}
                                        >
                                          {s.text}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name='street2'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {checkoutCopy.fields.street2.label}
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder={
                                  checkoutCopy.fields.street2.placeholder
                                }
                                {...field}
                                value={field.value as string}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className='grid gap-4 sm:grid-cols-2'>
                        <FormField
                          control={form.control}
                          name='city'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {checkoutCopy.fields.city.label}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder={
                                    checkoutCopy.fields.city.placeholder
                                  }
                                  {...field}
                                  value={field.value as string}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name='state'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {checkoutCopy.fields.state.label}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder={
                                    checkoutCopy.fields.state.placeholder
                                  }
                                  {...field}
                                  value={field.value as string}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className='grid gap-4 sm:grid-cols-2'>
                        <FormField
                          control={form.control}
                          name='zip'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {checkoutCopy.fields.zip.label}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder={
                                    checkoutCopy.fields.zip.placeholder
                                  }
                                  aria-describedby='zip-help'
                                  {...field}
                                  value={field.value as string}
                                />
                              </FormControl>
                              <p
                                id='zip-help'
                                className='text-xs text-muted-foreground'
                              >
                                {checkoutCopy.fields.zip.help}
                              </p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name='country'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {checkoutCopy.fields.country.label}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder={
                                    checkoutCopy.fields.country.placeholder
                                  }
                                  {...field}
                                  value={field.value as string}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {(state.status === 'addressError' ||
                        state.status === 'paymentError') && (
                        <Alert variant='destructive'>
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>
                            {state.status === 'addressError'
                              ? state.message
                              : state.status === 'paymentError'
                                ? state.message
                                : null}
                          </AlertDescription>
                          <div className='mt-2'>
                            <Button
                              type='button'
                              variant='outline'
                              onClick={() => dispatch({ type: 'RESET' })}
                            >
                              Try again
                            </Button>
                          </div>
                        </Alert>
                      )}

                      {bgValidationStatus === 'validating' && (
                        <div className='text-sm text-muted-foreground'>
                          …validating address
                        </div>
                      )}
                      {bgValidationWarning && (
                        <div className='text-sm text-amber-600'>
                          {bgValidationWarning}
                        </div>
                      )}

                      <Button
                        type='button'
                        onClick={form.handleSubmit(onSubmit)}
                        className='w-full'
                        disabled={
                          isBusy(state) ||
                          !form.formState.isValid ||
                          bgValidationValid === false
                        }
                      >
                        {state.status === 'validatingAddress' ? (
                          <>
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            {checkoutCopy.cta.validatingAddress}
                          </>
                        ) : state.status === 'creatingIntent' ? (
                          <>
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            {checkoutCopy.cta.preparingPayment}
                          </>
                        ) : (
                          <>
                            <MapPin className='mr-2 h-4 w-4' />
                            {checkoutCopy.cta.validateAndContinue}
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            ) : clientSecret ? (
              <Card>
                <CardHeader>
                  <CardTitle>{checkoutCopy.headings.payment}</CardTitle>
                  <CardDescription>
                    {checkoutCopy.descriptions.paymentHelp}
                  </CardDescription>
                  <div className='text-sm text-muted-foreground'>
                    {checkoutCopy.steps.step2Payment}
                  </div>
                </CardHeader>
                <CardContent>
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm
                      shippingDetails={form.getValues()}
                      cart={cart}
                    />
                  </Elements>
                </CardContent>
              </Card>
            ) : (
              <div className='space-y-3'>
                <Skeleton className='h-6 w-32' />
                <Skeleton className='h-40 w-full' />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<SkeletonLoader />}>
      <ErrorBoundary>
        <CheckoutContent />
      </ErrorBoundary>
    </Suspense>
  );
}
