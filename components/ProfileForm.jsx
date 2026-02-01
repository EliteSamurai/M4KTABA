'use client';

import { useState, useEffect } from 'react';
import { Camera, Loader2, Pencil, Trash2, User } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { urlFor } from '@/utils/imageUrlBuilder';
import getInitial from '@/utils/initials';

// Safely extract bio text with null checks
function getBioText(userData) {
  if (!userData?.bio) return '';
  if (!Array.isArray(userData.bio) || userData.bio.length === 0) return '';
  const firstBlock = userData.bio[0];
  if (!firstBlock?.children || !Array.isArray(firstBlock.children) || firstBlock.children.length === 0) return '';
  return firstBlock.children[0]?.text || '';
}

export default function ProfileForm({ session, user }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    bio: getBioText(user || {}),
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
  });
  const [image, setImage] = useState(user?.image ? urlFor(user.image) : '');
  const [imageFile, setImageFile] = useState(null);

  // State abbreviations map
  const stateNameToAbbreviation = {
    Alabama: 'AL',
    Alaska: 'AK',
    Arizona: 'AZ',
    Arkansas: 'AR',
    California: 'CA',
    Colorado: 'CO',
    Connecticut: 'CT',
    Delaware: 'DE',
    'District of Columbia': 'DC',
    Florida: 'FL',
    Georgia: 'GA',
    Hawaii: 'HI',
    Idaho: 'ID',
    Illinois: 'IL',
    Indiana: 'IN',
    Iowa: 'IA',
    Kansas: 'KS',
    Kentucky: 'KY',
    Louisiana: 'LA',
    Maine: 'ME',
    Maryland: 'MD',
    Massachusetts: 'MA',
    Michigan: 'MI',
    Minnesota: 'MN',
    Mississippi: 'MS',
    Missouri: 'MO',
    Montana: 'MT',
    Nebraska: 'NE',
    Nevada: 'NV',
    'New Hampshire': 'NH',
    'New Jersey': 'NJ',
    'New Mexico': 'NM',
    'New York': 'NY',
    'North Carolina': 'NC',
    'North Dakota': 'ND',
    Ohio: 'OH',
    Oklahoma: 'OK',
    Oregon: 'OR',
    Pennsylvania: 'PA',
    'Rhode Island': 'RI',
    'South Carolina': 'SC',
    'South Dakota': 'SD',
    Tennessee: 'TN',
    Texas: 'TX',
    Utah: 'UT',
    Vermont: 'VT',
    Virginia: 'VA',
    Washington: 'WA',
    'West Virginia': 'WV',
    Wisconsin: 'WI',
    Wyoming: 'WY',
  };

  const states = Object.entries(stateNameToAbbreviation).map(
    ([name, abbr]) => ({
      label: name,
      value: abbr,
    })
  );

  useEffect(() => {
    if (session?.user?.location) {
      const stateAbbr =
        stateNameToAbbreviation[session.user.location.state] ||
        session.user.location.state;

      setFormData(prev => ({
        ...prev,
        street: session.user.location.street || '',
        city: session.user.location.city || '',
        state: stateAbbr || '',
        country: session.user.location.country || 'US',
        zip: session.user.location.zip || '',
      }));
    }
  }, [session]);

  const handleImageChange = e => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleResetImage = () => {
    setImage('');
    setImageFile(null);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        submitData.append(key, value);
      });
      if (imageFile) submitData.append('image', imageFile);
      submitData.append('userId', session?.user?._id);

      const response = await fetch('/api/update-profile', {
        method: 'POST',
        body: submitData,
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Profile updated',
          description: 'Your changes have been saved successfully.',
        });
        await fetch('/api/auth/session');
      } else {
        throw new Error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='mx-auto max-w-2xl space-y-8'>
      <div className='space-y-2'>
        <h1 className='text-3xl font-bold tracking-tight'>Profile Settings</h1>
        <p className='text-muted-foreground'>
          Manage your profile information and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <User className='h-5 w-5' />
            Profile Picture
          </CardTitle>
          <CardDescription>
            Choose a profile picture for your account
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center gap-6'>
            <Avatar className='h-24 w-24'>
              {image ? (
                <AvatarImage
                  src={image}
                  alt='Profile'
                  className='object-cover'
                />
              ) : (
                <AvatarFallback className='text-xl'>
                  {getInitial(session.user.email.split('@')[0])}
                </AvatarFallback>
              )}
            </Avatar>
            <div className='flex flex-col gap-4 sm:flex-row'>
              <div className='relative'>
                <Button className='w-full sm:w-auto'>
                  <Camera className='mr-2 h-4 w-4' />
                  Change Picture
                </Button>
                <input
                  type='file'
                  accept='image/*'
                  onChange={handleImageChange}
                  className='absolute inset-0 cursor-pointer opacity-0'
                />
              </div>
              {image && (
                <Button
                  variant='destructive'
                  onClick={handleResetImage}
                  className='w-full sm:w-auto'
                >
                  <Trash2 className='mr-2 h-4 w-4' />
                  Remove Picture
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Pencil className='h-5 w-5' />
            Personal Information
          </CardTitle>
          <CardDescription>
            Update your address and personal details
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='space-y-4'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='street'>Street Address</Label>
                <Input
                  id='street'
                  value={formData.street}
                  onChange={e =>
                    setFormData({ ...formData, street: e.target.value })
                  }
                  placeholder='123 Main St'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='city'>City</Label>
                <Input
                  id='city'
                  value={formData.city}
                  onChange={e =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder='San Francisco'
                />
              </div>
            </div>

            <div className='grid gap-4 sm:grid-cols-3'>
              <div className='space-y-2'>
                <Label htmlFor='country'>Country</Label>
                <Select
                  value={formData.country}
                  onValueChange={value =>
                    setFormData(prev => ({ ...prev, country: value }))
                  }
                >
                  <SelectTrigger id='country'>
                    <SelectValue placeholder='Select country' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='US'>United States</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='state'>State</Label>
                <Select
                  value={formData.state}
                  onValueChange={value =>
                    setFormData({ ...formData, state: value })
                  }
                >
                  <SelectTrigger id='state'>
                    <SelectValue placeholder='Select state' />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map(({ label, value }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='zip'>ZIP Code</Label>
                <Input
                  id='zip'
                  value={formData.zip}
                  onChange={e =>
                    setFormData({ ...formData, zip: e.target.value })
                  }
                  placeholder='94103'
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className='space-y-2'>
            <Label htmlFor='bio'>Bio</Label>
            <Textarea
              id='bio'
              value={formData.bio}
              onChange={e => setFormData({ ...formData, bio: e.target.value })}
              placeholder='Tell us a little about yourself'
              className='min-h-[100px]'
            />
          </div>

          <div className='flex justify-end'>
            <Button
              size='lg'
              onClick={handleSubmit}
              disabled={isSubmitting}
              className='min-w-[140px]'
            >
              {isSubmitting && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              {isSubmitting ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
