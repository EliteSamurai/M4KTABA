'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Camera, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { urlFor } from '@/utils/imageUrlBuilder';
import { event } from '@/lib/fbpixel';
import { TrustBadges } from '@/components/trust/TrustBadges';
import { ContextualHelp } from '@/components/help/HelpTooltip';

function ProfilePageSkeleton() {
  return (
    <div className='container mx-auto relative min-h-screen items-center justify-center py-8 md:grid lg:max-w-none lg:grid-cols-2 lg:px-0'>
      <div className='relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex'>
        <div className='absolute inset-0 bg-purple-900' />
        <div className='relative z-20 flex items-center text-lg font-medium'>
          <Skeleton className='mr-2 h-6 w-6 rounded-full' />
          <Skeleton className='h-6 w-24' />
        </div>
        <div className='relative z-20 mt-auto'>
          <Skeleton className='h-6 w-80 mb-4' />
          <Skeleton className='h-6 w-64' />
        </div>
      </div>
      <div className='lg:p-8'>
        <div className='mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] lg:w-[400px]'>
          <Skeleton className='h-8 w-48 mb-2' />
          <Skeleton className='h-5 w-64 mb-4' />
          <div className='space-y-4'>
            <Skeleton className='h-20 w-20 rounded-full mx-auto mb-4' />
            <div className='space-y-2'>
              <Skeleton className='h-4 w-64' />
              <Skeleton className='h-10 w-full' />
            </div>
            <div className='grid gap-4'>
              <Skeleton className='h-10 w-full' />
              <Skeleton className='h-10 w-full' />
            </div>
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-24 w-full' />
          </div>
          <Skeleton className='h-10 w-full mt-6' />
        </div>
      </div>
    </div>
  );
}

export function CompleteProfileContent() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const [imageBlob, setImage] = useState<string | null>(null);
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('');
  const [bio, setBio] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?._id) {
      setUserId(session.user._id);
    } else if (searchParams.get('userId')) {
      setUserId(searchParams.get('userId') as string);
    }
  }, [session?.user?._id, searchParams]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid File Type',
          description: 'Please select an image file.',
          variant: 'destructive',
        });
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast({
          title: 'File Too Large',
          description: 'Please select an image smaller than 5MB.',
          variant: 'destructive',
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setImage(reader.result as string);
        }
      };
      reader.onerror = () => {
        toast({
          title: 'Image Error',
          description: 'Failed to read image file. Please try again.',
          variant: 'destructive',
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!userId) {
      console.error('No userId found');
      toast({
        title: 'Error',
        description: 'User ID not found',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    // Client-side validation - ensure all address fields are filled
    const trimmedStreet = street.trim();
    const trimmedCity = city.trim();
    const trimmedState = state.trim();
    const trimmedZip = zip.trim();
    const trimmedCountry = country.trim();

    if (!trimmedStreet || !trimmedCity || !trimmedState || !trimmedZip || !trimmedCountry) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all address fields (Street, City, State, ZIP, and Country)',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    // Note: userId is not sent - API uses session.user._id for security
    const profileData = {
      imageBlob,
      location: {
        street: trimmedStreet,
        city: trimmedCity,
        state: trimmedState,
        zip: trimmedZip,
        country: trimmedCountry,
      },
      bio,
    };

    try {
      const response = await fetch('/api/complete-profile', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        throw new Error('Invalid response from server. Please try again.');
      }

      if (response.ok) {
        // Track completion event
        try {
          event('CompleteRegistration');
        } catch (eventError) {
          // Non-critical error, continue
          console.warn('Failed to track completion event:', eventError);
        }

        toast({
          title: 'Profile Completed',
          description: 'Your profile has been successfully completed.',
        });

        // Redirect to returnTo URL or home - session will be updated on next page load
        const returnTo = searchParams.get('returnTo') || '/';
        try {
          router.push(returnTo);
        } catch (navError) {
          // If navigation fails, reload the page to update session
          window.location.href = returnTo;
        }
      } else {
        // Handle specific error messages
        const errorMessage = result?.message || 'Failed to update profile';
        
        // Check for specific error types
        if (response.status === 401) {
          throw new Error('Your session has expired. Please sign in again.');
        } else if (response.status === 400) {
          throw new Error(errorMessage || 'Please check your information and try again.');
        } else {
          throw new Error(errorMessage);
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      
      let errorMessage = 'An error occurred. Please try again.';
      if (error instanceof Error) {
        // Check for network errors
        if (error.message.includes('fetch') || error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: 'Update Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='container relative min-h-screen items-center justify-center py-8 md:grid lg:max-w-none lg:grid-cols-2 lg:px-0'>
      <div className='relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex'>
        <div className='absolute inset-0 bg-purple-900' />
        <div className='relative z-20 flex items-center text-lg font-medium'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='mr-2 h-6 w-6'
          >
            <path d='M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3' />
          </svg>
          M4KTABA
        </div>
        <div className='relative z-20 mt-auto'>
          <blockquote className='space-y-2'>
            <p className='text-lg'>
              "Join our community of book lovers and start your reading journey
              today."
            </p>
          </blockquote>
        </div>
      </div>
      <div className='lg:p-8'>
        <div className='mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] lg:w-[400px]'>
          <Card>
            <CardHeader className='space-y-1'>
              <CardTitle className='text-2xl font-bold'>
                Complete Your Profile
              </CardTitle>
              <CardDescription>
                Add some details to personalize your account
              </CardDescription>
              <ContextualHelp context='profile' />
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className='space-y-6'>
                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='avatar'>Profile Picture (Optional)</Label>
                    <div className='flex items-center gap-4'>
                      <Avatar className='h-20 w-20'>
                        <AvatarImage
                          src={
                            imageBlob ||
                            urlFor(session?.user?.image) ||
                            undefined
                          }
                          alt='Profile picture'
                          className='object-cover'
                        />
                        <AvatarFallback>
                          <Camera className='h-8 w-8 text-muted-foreground' />
                        </AvatarFallback>
                      </Avatar>
                      <Input
                        id='avatar'
                        type='file'
                        accept='image/*'
                        onChange={handleImageChange}
                        className='cursor-pointer file:text-sm'
                      />
                    </div>
                  </div>
                  <div className='grid gap-4'>
                    <div className='grid gap-2'>
                      <Label htmlFor='street'>Street Address</Label>
                      <Input
                        id='street'
                        placeholder='123 Main St'
                        required
                        value={street}
                        onChange={e => setStreet(e.target.value)}
                      />
                    </div>
                    <div className='grid grid-cols-2 gap-4'>
                      <div className='grid gap-2'>
                        <Label htmlFor='city'>City</Label>
                        <Input
                          id='city'
                          placeholder='City'
                          required
                          value={city}
                          onChange={e => setCity(e.target.value)}
                        />
                      </div>
                      <div className='grid gap-2'>
                        <Label htmlFor='state'>State</Label>
                        <Input
                          id='state'
                          placeholder='State'
                          required
                          value={state}
                          onChange={e => setState(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className='grid grid-cols-2 gap-4'>
                      <div className='grid gap-2'>
                        <Label htmlFor='zip'>ZIP Code</Label>
                        <Input
                          id='zip'
                          placeholder='ZIP'
                          required
                          value={zip}
                          onChange={e => setZip(e.target.value)}
                        />
                      </div>
                      <div className='grid gap-2'>
                        <Label htmlFor='country'>Country</Label>
                        <Input
                          id='country'
                          placeholder='Country'
                          required
                          value={country}
                          onChange={e => setCountry(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='bio'>Bio (Optional)</Label>
                    <Textarea
                      id='bio'
                      placeholder='Tell us about yourself...'
                      className='min-h-[100px] resize-none'
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  type='submit'
                  className='w-full bg-purple-600 hover:bg-purple-700'
                  disabled={isLoading}
                >
                  {isLoading && (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  )}
                  Complete Profile
                </Button>
              </form>
              <div className='mt-6'>
                <TrustBadges variant='compact' />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={<ProfilePageSkeleton />}>
      <CompleteProfileContent />
    </Suspense>
  );
}
