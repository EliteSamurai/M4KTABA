import { Metadata } from 'next';
import { ArrowLeft, Cookie, Shield, Settings, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description:
    'Learn about how M4KTABA uses cookies and similar technologies to enhance your browsing experience.',
};

export default function CookiesPage() {
  return (
    <div className='min-h-screen bg-gradient-to-b from-slate-50 to-white'>
      <div className='container mx-auto px-4 py-8 max-w-4xl'>
        {/* Header */}
        <div className='mb-8'>
          <Link
            href='/'
            className='inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4'
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Home
          </Link>
          <h1 className='text-4xl font-bold tracking-tight mb-4'>
            Cookie Policy
          </h1>
          <p className='text-lg text-muted-foreground'>
            This page explains how M4KTABA uses cookies and similar technologies
            when you visit our website.
          </p>
        </div>

        {/* Last Updated */}
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8'>
          <p className='text-sm text-blue-800'>
            <strong>Last Updated:</strong>{' '}
            {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* What Are Cookies */}
        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>What Are Cookies?</h2>
          <p className='text-muted-foreground mb-4'>
            Cookies are small text files that are stored on your device when you
            visit our website. They help us provide you with a better experience
            by remembering your preferences and understanding how you use our
            site.
          </p>
          <p className='text-muted-foreground'>
            We also use similar technologies like web beacons, pixels, and local
            storage to enhance your browsing experience.
          </p>
        </section>

        {/* Types of Cookies */}
        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-6'>
            Types of Cookies We Use
          </h2>
          <div className='grid md:grid-cols-2 gap-6'>
            <Card>
              <CardHeader>
                <div className='flex items-center space-x-2'>
                  <Shield className='h-5 w-5 text-green-600' />
                  <CardTitle className='text-lg'>Essential Cookies</CardTitle>
                </div>
                <CardDescription>
                  Required for basic website functionality
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className='space-y-2 text-sm'>
                  <li>• Authentication and login status</li>
                  <li>• Shopping cart contents</li>
                  <li>• Security and fraud prevention</li>
                  <li>• Language preferences</li>
                  <li>• Form data (temporarily)</li>
                </ul>
                <p className='text-xs text-muted-foreground mt-2'>
                  These cookies are necessary and cannot be disabled.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className='flex items-center space-x-2'>
                  <Settings className='h-5 w-5 text-blue-600' />
                  <CardTitle className='text-lg'>Functional Cookies</CardTitle>
                </div>
                <CardDescription>Enhance your user experience</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className='space-y-2 text-sm'>
                  <li>• Remembered preferences</li>
                  <li>• Customized content</li>
                  <li>• Location settings</li>
                  <li>• Accessibility options</li>
                  <li>• User interface preferences</li>
                </ul>
                <p className='text-xs text-muted-foreground mt-2'>
                  These cookies can be disabled but may affect functionality.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className='flex items-center space-x-2'>
                  <BarChart3 className='h-5 w-5 text-purple-600' />
                  <CardTitle className='text-lg'>Analytics Cookies</CardTitle>
                </div>
                <CardDescription>
                  Help us understand website usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className='space-y-2 text-sm'>
                  <li>• Page views and visits</li>
                  <li>• User behavior patterns</li>
                  <li>• Popular content</li>
                  <li>• Performance metrics</li>
                  <li>• Error tracking</li>
                </ul>
                <p className='text-xs text-muted-foreground mt-2'>
                  These cookies help us improve our website.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className='flex items-center space-x-2'>
                  <Cookie className='h-5 w-5 text-orange-600' />
                  <CardTitle className='text-lg'>Marketing Cookies</CardTitle>
                </div>
                <CardDescription>
                  Used for advertising and marketing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className='space-y-2 text-sm'>
                  <li>• Personalized advertisements</li>
                  <li>• Social media integration</li>
                  <li>• Remarketing campaigns</li>
                  <li>• Conversion tracking</li>
                  <li>• A/B testing</li>
                </ul>
                <p className='text-xs text-muted-foreground mt-2'>
                  These cookies can be disabled in your browser settings.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Third-Party Cookies */}
        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>Third-Party Cookies</h2>
          <p className='text-muted-foreground mb-4'>
            We use third-party services that may set their own cookies:
          </p>
          <div className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Google Analytics</CardTitle>
                <CardDescription>
                  Website analytics and performance tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground'>
                  We use Google Analytics to understand how visitors interact
                  with our website. This helps us improve our content and user
                  experience.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Stripe</CardTitle>
                <CardDescription>
                  Payment processing and security
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground'>
                  Stripe uses cookies to process payments securely and prevent
                  fraud. These are essential for our payment functionality.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Social Media</CardTitle>
                <CardDescription>
                  Social sharing and integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground'>
                  Social media platforms may set cookies when you interact with
                  social sharing buttons or embedded content.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Managing Cookies */}
        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>
            Managing Your Cookie Preferences
          </h2>
          <div className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle>Browser Settings</CardTitle>
                <CardDescription>
                  Control cookies through your web browser
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground mb-4'>
                  Most web browsers allow you to control cookies through their
                  settings. You can:
                </p>
                <ul className='space-y-2 text-sm'>
                  <li>• Block all cookies</li>
                  <li>• Block third-party cookies only</li>
                  <li>• Delete existing cookies</li>
                  <li>• Set preferences for specific websites</li>
                  <li>• Receive notifications when cookies are set</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cookie Consent</CardTitle>
                <CardDescription>
                  Manage your preferences on our website
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground mb-4'>
                  When you first visit our website, you'll see a cookie
                  consent banner where you can:
                </p>
                <ul className='space-y-2 text-sm'>
                  <li>• Accept all cookies</li>
                  <li>• Reject non-essential cookies</li>
                  <li>• Customize your preferences</li>
                  <li>• Learn more about each cookie type</li>
                </ul>
                <p className='text-xs text-muted-foreground mt-4'>
                  You can change your preferences at any time by clicking the
                  cookie settings link in our footer.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Impact of Disabling Cookies */}
        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>
            Impact of Disabling Cookies
          </h2>
          <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-6'>
            <h3 className='font-semibold text-yellow-800 mb-2'>
              Important Note
            </h3>
            <p className='text-sm text-yellow-700 mb-4'>
              If you disable cookies, some features of our website may not work
              properly:
            </p>
            <ul className='space-y-1 text-sm text-yellow-700'>
              <li>• You may need to log in repeatedly</li>
              <li>• Your shopping cart may not persist</li>
              <li>• Personalized content may not be available</li>
              <li>• Some forms may not work correctly</li>
              <li>• Payment processing may be affected</li>
            </ul>
          </div>
        </section>

        {/* Contact Information */}
        <section className='bg-slate-50 rounded-lg p-6'>
          <h2 className='text-2xl font-semibold mb-4'>
            Questions About Cookies?
          </h2>
          <p className='text-muted-foreground mb-4'>
            If you have any questions about our use of cookies or this policy,
            please contact us.
          </p>
          <div className='flex flex-col sm:flex-row gap-4'>
            <Button asChild>
              <Link href='/contact'>Contact Us</Link>
            </Button>
            <Button variant='outline' asChild>
              <Link href='/privacy'>Privacy Policy</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
