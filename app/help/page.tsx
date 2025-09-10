'use client';

import React, { useState } from 'react';
import { Search, HelpCircle, MessageCircle, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HelpSection } from '@/components/help/HelpTooltip';
import {
  getHelpItems,
  searchHelp,
  getFrequentlyAskedQuestions,
  getQuickStartGuide,
} from '@/lib/help-system';

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<unknown[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setIsSearching(true);
      const results = searchHelp(query, 10);
      setSearchResults(results);
      setIsSearching(false);
    } else {
      setSearchResults([]);
    }
  };

  const faqItems = getFrequentlyAskedQuestions().map(item => ({
    question: item.title,
    answer: item.content,
  }));

  const quickStartItems = getQuickStartGuide().map(item => ({
    question: item.title,
    answer: item.content,
  }));

  const contactMethods = [
    {
      title: 'Email Support',
      description: 'Get help via email within 24 hours',
      icon: Mail,
      action: 'Send Email',
      href: 'mailto:support@m4ktaba.com',
    },
    {
      title: 'Live Chat',
      description: 'Chat with our support team',
      icon: MessageCircle,
      action: 'Start Chat',
      href: '#',
    },
    {
      title: 'Phone Support',
      description: 'Call us for immediate assistance',
      icon: Phone,
      action: 'Call Now',
      href: 'tel:+1-555-0123',
    },
  ];

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='container mx-auto px-4 py-8'>
        {/* Header */}
        <div className='text-center mb-12'>
          <h1 className='text-4xl font-bold text-gray-900 mb-4'>
            How can we help you?
          </h1>
          <p className='text-xl text-gray-600 max-w-2xl mx-auto mb-8'>
            Find answers to common questions or get in touch with our support
            team.
          </p>

          {/* Search Bar */}
          <div className='max-w-2xl mx-auto relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
            <Input
              type='text'
              placeholder='Search for help...'
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              className='pl-10 pr-4 py-3 text-lg'
            />
            {isSearching && (
              <div className='absolute right-3 top-1/2 transform -translate-y-1/2'>
                <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600'></div>
              </div>
            )}
          </div>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className='mb-12'>
            <h2 className='text-2xl font-semibold mb-6'>Search Results</h2>
            <div className='space-y-4'>
              {searchResults.map((result, index) => (
                <Card key={index} className='hover:shadow-md transition-shadow'>
                  <CardHeader>
                    <div className='flex items-center justify-between'>
                      <CardTitle className='text-lg'>
                        {result.item.title}
                      </CardTitle>
                      <Badge variant='secondary'>{result.item.category}</Badge>
                    </div>
                    <CardDescription>
                      {result.item.content.substring(0, 150)}...
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Quick Start Guide */}
        <div className='mb-12'>
          <h2 className='text-2xl font-semibold mb-6'>Quick Start Guide</h2>
          <HelpSection title='Getting Started' items={quickStartItems} />
        </div>

        {/* FAQ Section */}
        <div className='mb-12'>
          <h2 className='text-2xl font-semibold mb-6'>
            Frequently Asked Questions
          </h2>
          <HelpSection title='Common Questions' items={faqItems} />
        </div>

        {/* Contact Support */}
        <div className='mb-12'>
          <h2 className='text-2xl font-semibold mb-6'>Contact Support</h2>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {contactMethods.map((method, index) => (
              <Card
                key={index}
                className='text-center hover:shadow-lg transition-shadow'
              >
                <CardHeader>
                  <div className='w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                    <method.icon className='w-6 h-6 text-purple-600' />
                  </div>
                  <CardTitle className='text-lg'>{method.title}</CardTitle>
                  <CardDescription>{method.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className='w-full'>
                    <a href={method.href}>{method.action}</a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Help Categories */}
        <div className='mb-12'>
          <h2 className='text-2xl font-semibold mb-6'>Browse by Category</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {[
              {
                title: 'Getting Started',
                description: 'Learn the basics of using M4ktaba',
                icon: 'Play',
                color: 'blue',
                count: getHelpItems('getting-started').length,
              },
              {
                title: 'Buying Books',
                description: 'How to find and purchase books',
                icon: 'ShoppingCart',
                color: 'green',
                count: getHelpItems('buying').length,
              },
              {
                title: 'Selling Books',
                description: 'How to list and sell your books',
                icon: 'DollarSign',
                color: 'purple',
                count: getHelpItems('selling').length,
              },
              {
                title: 'Account & Profile',
                description: 'Managing your account and profile',
                icon: 'User',
                color: 'orange',
                count: getHelpItems('account').length,
              },
              {
                title: 'Payments & Billing',
                description: 'Payment methods and billing information',
                icon: 'CreditCard',
                color: 'red',
                count: getHelpItems('payments').length,
              },
              {
                title: 'Shipping & Delivery',
                description: 'Shipping options and delivery information',
                icon: 'Truck',
                color: 'indigo',
                count: getHelpItems('shipping').length,
              },
            ].map((category, index) => (
              <Card
                key={index}
                className='hover:shadow-lg transition-shadow cursor-pointer'
              >
                <CardHeader>
                  <div className='flex items-center justify-between mb-2'>
                    <div
                      className={`w-10 h-10 bg-${category.color}-100 rounded-full flex items-center justify-center`}
                    >
                      <HelpCircle
                        className={`w-5 h-5 text-${category.color}-600`}
                      />
                    </div>
                    <Badge variant='secondary'>{category.count} articles</Badge>
                  </div>
                  <CardTitle className='text-lg'>{category.title}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Still Need Help? */}
        <div className='text-center bg-white rounded-2xl p-8 shadow-lg'>
          <h2 className='text-2xl font-bold mb-4'>Still Need Help?</h2>
          <p className='text-gray-600 mb-6'>
            Can&apos;t find what you&apos;re looking for? Our support team is here to
            help.
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Button size='lg' asChild>
              <a href='mailto:support@m4ktaba.com'>
                <Mail className='mr-2 w-4 h-4' />
                Email Support
              </a>
            </Button>
            <Button size='lg' variant='outline' asChild>
              <a href='tel:+1-555-0123'>
                <Phone className='mr-2 w-4 h-4' />
                Call Support
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
