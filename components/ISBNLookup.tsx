'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, BookOpen, User, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BookData {
  title: string;
  author: string;
  coverUrl: string;
  description: string;
  language: string;
  category: string;
}

interface ISBNLookupProps {
  onBookFound: (bookData: BookData) => void;
  className?: string;
}

export default function ISBNLookup({
  onBookFound,
  className,
}: ISBNLookupProps) {
  const [isbn, setIsbn] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [bookData, setBookData] = useState<BookData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleLookup = async () => {
    if (!isbn.trim()) {
      setError('Please enter an ISBN');
      return;
    }

    setIsLoading(true);
    setError(null);
    setBookData(null);

    try {
      const response = await fetch(
        `/api/lookup/isbn?isbn=${encodeURIComponent(isbn.trim())}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to lookup ISBN');
      }

      if (data.found && data.data) {
        setBookData(data.data);
        toast({
          title: 'Book Found!',
          description: 'Book information has been loaded successfully.',
        });
      } else {
        setError('Book not found for this ISBN');
      }
    } catch (err) {
      console.error('ISBN lookup error:', err);
      setError(err instanceof Error ? err.message : 'Failed to lookup ISBN');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseBookData = () => {
    if (bookData) {
      onBookFound(bookData);
      toast({
        title: 'Book Information Applied',
        description: 'The book details have been filled in automatically.',
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLookup();
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Search className='w-5 h-5' />
          ISBN Lookup
        </CardTitle>
        <p className='text-sm text-muted-foreground'>
          Enter an ISBN to automatically fill in book details
        </p>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex gap-2'>
          <Input
            placeholder='978-0-123456-78-9'
            value={isbn}
            onChange={e => setIsbn(e.target.value)}
            onKeyPress={handleKeyPress}
            className='flex-1'
          />
          <Button
            onClick={handleLookup}
            disabled={isLoading || !isbn.trim()}
            className='shrink-0'
            aria-label='Lookup ISBN'
          >
            {isLoading ? (
              <Loader2 className='w-4 h-4 animate-spin' />
            ) : (
              <Search className='w-4 h-4' />
            )}
          </Button>
        </div>

        {error && (
          <Alert variant='destructive'>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {bookData && (
          <div className='space-y-4'>
            <div className='flex items-start gap-4'>
              <div className='w-16 h-20 bg-muted rounded overflow-hidden shrink-0'>
                <img
                  src={bookData.coverUrl}
                  alt={bookData.title}
                  className='w-full h-full object-cover'
                />
              </div>
              <div className='flex-1 min-w-0'>
                <h4 className='font-medium line-clamp-2'>{bookData.title}</h4>
                <p className='text-sm text-muted-foreground flex items-center gap-1 mt-1'>
                  <User className='w-3 h-3' />
                  {bookData.author}
                </p>
                <div className='flex gap-2 mt-2'>
                  <Badge variant='outline' className='text-xs'>
                    <Globe className='w-3 h-3 mr-1' />
                    {bookData.language}
                  </Badge>
                  <Badge variant='outline' className='text-xs'>
                    <BookOpen className='w-3 h-3 mr-1' />
                    {bookData.category}
                  </Badge>
                </div>
              </div>
            </div>

            {bookData.description && (
              <p className='text-sm text-muted-foreground line-clamp-3'>
                {bookData.description}
              </p>
            )}

            <Button onClick={handleUseBookData} className='w-full'>
              Use This Book Information
            </Button>
          </div>
        )}

        <div className='text-xs text-muted-foreground'>
          <p>• Enter a valid ISBN-10 or ISBN-13</p>
          <p>• Book information will be automatically filled</p>
          <p>• You can still edit the details after lookup</p>
        </div>
      </CardContent>
    </Card>
  );
}
