'use client';

import React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Password from '@/components/PasswordInput';
import GoogleButton from '@/components/GoogleButton';
import SignInArt from '@/public/beautifulart2.jpg'; // TODO: Convert to WebP
import { TrustBadges } from '@/components/trust/TrustBadges';
import { ContextualHelp } from '@/components/help/HelpTooltip';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isChecked) {
      setError('Please accept the terms and conditions');
      return; // <-- THIS STOPS EXECUTION
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const { userId } = await response.json();
        await signIn('credentials', {
          redirect: false,
          email,
          password,
        });
        router.push(`/signup/complete-profile?userId=${userId}`);
      } else {
        const data = await response.json();
        setError(data.message || 'Signup failed');
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    signIn('google', { callbackUrl: '/signup/complete-profile' });
  };

  return (
    <div className='container relative min-h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0'>
      <div className='relative hidden h-full flex-col bg-muted p-10 text-black dark:border-r lg:flex'>
        <div className='absolute inset-0'>
          <Image
            src={SignInArt}
            alt='Authentication background'
            fill
            className='object-cover opacity-90'
          />
          <div className='absolute inset-0' />
        </div>

        <div className='relative z-20 mt-auto'>
          <blockquote className='space-y-2'>
            <p className='text-lg'>
              Sign up to join the community of those who seek knowledge.
            </p>
          </blockquote>
        </div>
      </div>
      <div className='p-4 lg:p-8 h-full flex items-center'>
        <Card className='mx-auto w-full max-w-md'>
          <form onSubmit={handleSubmit}>
            <CardHeader className='space-y-1'>
              <CardTitle className='text-2xl font-bold'>
                Create an account
              </CardTitle>
              <CardDescription>Join thousands buying & selling authentic Islamic books</CardDescription>
              <ContextualHelp context='signup' />
            </CardHeader>
            <CardContent className='space-y-4'>
              <GoogleButton onClick={handleGoogleSignUp} className='w-full' />
              <div className='relative'>
                <div className='absolute inset-0 flex items-center'>
                  <span className='w-full border-t' />
                </div>
                <div className='relative flex justify-center text-xs uppercase'>
                  <span className='bg-background px-2 text-muted-foreground'>
                    or continue with
                  </span>
                </div>
              </div>
              <div className='space-y-4'>
                <div className='space-y-2'>
                  <div className='relative'>
                    <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                    <label htmlFor='email' className='sr-only'>
                      Email
                    </label>
                    <Input
                      id='email'
                      type='email'
                      name='email'
                      placeholder='name@example.com'
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className='pl-10'
                    />
                  </div>
                </div>
                <label htmlFor='password' className='sr-only'>
                  Password
                </label>
                <Password
                  id='password'
                  setPassword={setPassword}
                  disabled={isLoading}
                  type='password'
                  autoComplete='current-password'
                />
              </div>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='terms'
                  checked={isChecked}
                  onCheckedChange={checked => setIsChecked(checked as boolean)}
                  disabled={isLoading}
                />
                <Label
                  htmlFor='terms'
                  className='text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                >
                  I agree to the{' '}
                  <Link
                    href='/terms'
                    className='text-primary underline-offset-4 hover:underline'
                  >
                    terms of service
                  </Link>{' '}
                  and{' '}
                  <Link
                    href='/privacy'
                    className='text-primary underline-offset-4 hover:underline'
                  >
                    privacy policy
                  </Link>
                </Label>
              </div>
              {error && (
                <Alert variant='destructive'>
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className='flex flex-col space-y-4'>
              <Button
                type='submit'
                className='inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300 bg-slate-900 text-slate-50 hover:bg-slate-900/90 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50/90 h-10 px-4 py-2 w-full'
                disabled={isLoading || !isChecked}
                data-testid='sign-up-button'
              >
                {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                Create account
              </Button>
              <p className='text-center text-sm text-muted-foreground'>
                Already have an account?{' '}
                <Link
                  href='/login'
                  className='text-primary underline-offset-4 hover:underline'
                >
                  Sign in
                </Link>
              </p>
              <div className='mt-4'>
                <TrustBadges variant='compact' />
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
