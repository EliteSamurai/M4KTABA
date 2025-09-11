'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { TrustBadges } from '@/components/trust/TrustBadges';
import { UserReviews } from '@/components/trust/UserReviews';
import {
  BookOpen,
  Users,
  Shield,
  Star,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import { onboardingManager } from '@/lib/onboarding';

export default function WelcomePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [showWizard, setShowWizard] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (session?.user) {
      const onboardingProgress = onboardingManager.getProgress();
      setProgress(onboardingProgress.progress);
    }
  }, [session]);

  const handleStartWizard = () => {
    setShowWizard(true);
  };

  const handleCompleteWizard = () => {
    setShowWizard(false);
    onboardingManager.completeStep('tutorial');
    router.push('/');
  };

  const handleSkipWizard = () => {
    setShowWizard(false);
    router.push('/');
  };

  const handleGetStarted = () => {
    router.push('/all');
  };

  const handleStartSelling = () => {
    router.push('/sell');
  };

  if (showWizard) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4'>
        <OnboardingWizard
          onComplete={handleCompleteWizard}
          onSkip={handleSkipWizard}
          className='max-w-2xl'
        />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-purple-50 to-blue-50'>
      <div className='container mx-auto px-4 py-8'>
        {/* Header */}
        <div className='text-center mb-12'>
          <div className='inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium mb-4'>
            <CheckCircle className='w-4 h-4' />
            Welcome to M4ktaba!
          </div>
          <h1 className='text-4xl md:text-5xl font-bold text-gray-900 mb-4'>
            Your Journey Starts Here
          </h1>
          <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
            Join thousands of book lovers in discovering, buying, and selling
            Islamic literature in Arabic.
          </p>
        </div>

        {/* Progress Card */}
        {progress > 0 && (
          <Card className='mb-8 max-w-md mx-auto'>
            <CardHeader>
              <CardTitle className='text-lg'>Your Progress</CardTitle>
              <CardDescription>
                Complete your profile to unlock all features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span>Profile Completion</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className='h-2' />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12'>
          <Card
            className='text-center hover:shadow-lg transition-shadow cursor-pointer'
            onClick={handleGetStarted}
          >
            <CardHeader>
              <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2'>
                <BookOpen className='w-6 h-6 text-blue-600' />
              </div>
              <CardTitle className='text-lg'>Browse Books</CardTitle>
              <CardDescription>
                Discover our collection of Islamic literature
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className='w-full' variant='outline'>
                Start Browsing
                <ArrowRight className='ml-2 w-4 h-4' />
              </Button>
            </CardContent>
          </Card>

          <Card
            className='text-center hover:shadow-lg transition-shadow cursor-pointer'
            onClick={handleStartSelling}
          >
            <CardHeader>
              <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2'>
                <Users className='w-6 h-6 text-green-600' />
              </div>
              <CardTitle className='text-lg'>Start Selling</CardTitle>
              <CardDescription>List your books and earn money</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className='w-full' variant='outline'>
                List Books
                <ArrowRight className='ml-2 w-4 h-4' />
              </Button>
            </CardContent>
          </Card>

          <Card
            className='text-center hover:shadow-lg transition-shadow cursor-pointer'
            onClick={handleStartWizard}
          >
            <CardHeader>
              <div className='w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2'>
                <Star className='w-6 h-6 text-purple-600' />
              </div>
              <CardTitle className='text-lg'>Take a Tour</CardTitle>
              <CardDescription>Learn how to use the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className='w-full' variant='outline'>
                Start Tour
                <ArrowRight className='ml-2 w-4 h-4' />
              </Button>
            </CardContent>
          </Card>

          <Card className='text-center hover:shadow-lg transition-shadow'>
            <CardHeader>
              <div className='w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2'>
                <Shield className='w-6 h-6 text-orange-600' />
              </div>
              <CardTitle className='text-lg'>Security</CardTitle>
              <CardDescription>Your data is safe with us</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                <Badge variant='secondary' className='w-full justify-center'>
                  SSL Secured
                </Badge>
                <Badge variant='secondary' className='w-full justify-center'>
                  Stripe Payments
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trust Section */}
        <div className='mb-12'>
          <h2 className='text-2xl font-bold text-center mb-6'>
            Why Trust M4ktaba?
          </h2>
          <TrustBadges variant='detailed' />
        </div>

        {/* Reviews Section */}
        <div className='mb-12'>
          <h2 className='text-2xl font-bold text-center mb-6'>
            What Our Users Say
          </h2>
          <UserReviews variant='grid' maxReviews={4} reviews={[]} />
        </div>

        {/* Features Grid */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8 mb-12'>
          <div className='text-center'>
            <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <BookOpen className='w-8 h-8 text-blue-600' />
            </div>
            <h3 className='text-xl font-semibold mb-2'>Wide Selection</h3>
            <p className='text-gray-600'>
              Browse through thousands of Islamic books in Arabic covering
              various topics and genres.
            </p>
          </div>

          <div className='text-center'>
            <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <Users className='w-8 h-8 text-green-600' />
            </div>
            <h3 className='text-xl font-semibold mb-2'>Community Driven</h3>
            <p className='text-gray-600'>
              Connect with fellow book lovers and build a community around
              Islamic literature.
            </p>
          </div>

          <div className='text-center'>
            <div className='w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <Shield className='w-8 h-8 text-purple-600' />
            </div>
            <h3 className='text-xl font-semibold mb-2'>Secure & Safe</h3>
            <p className='text-gray-600'>
              All transactions are protected by industry-standard security
              measures.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className='text-center bg-white rounded-2xl p-8 shadow-lg'>
          <h2 className='text-3xl font-bold mb-4'>Ready to Get Started?</h2>
          <p className='text-lg text-gray-600 mb-6'>
            Join our community and start your journey with Islamic literature
            today.
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Button
              size='lg'
              onClick={handleGetStarted}
              className='bg-purple-600 hover:bg-purple-700'
            >
              Browse Books
              <ArrowRight className='ml-2 w-4 h-4' />
            </Button>
            <Button size='lg' variant='outline' onClick={handleStartSelling}>
              Start Selling
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
