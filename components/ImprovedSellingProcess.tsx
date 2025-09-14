'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Camera,
  DollarSign,
  CheckCircle,
  Upload,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

const conditions = [
  { value: 'new', label: 'New', description: 'Brand new, never read' },
  {
    value: 'like-new',
    label: 'Like New',
    description: 'Excellent condition, barely used',
  },
  { value: 'good', label: 'Good', description: 'Minor wear, fully functional' },
  { value: 'fair', label: 'Fair', description: 'Some wear, still readable' },
  { value: 'poor', label: 'Poor', description: 'Heavy wear, but complete' },
];

const listingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  author: z
    .string()
    .min(1, 'Author is required')
    .max(100, 'Author name too long'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description too long'),
  price: z
    .number()
    .min(0.01, 'Price must be greater than 0')
    .max(10000, 'Price too high'),
  condition: z.string().min(1, 'Please select a condition'),
  quantity: z
    .number()
    .min(1, 'Quantity must be at least 1')
    .max(100, 'Quantity too high'),
  isbn: z.string().optional(),
  language: z.string().min(1, 'Language is required'),
  category: z.string().min(1, 'Category is required'),
});

type FormData = z.infer<typeof listingSchema>;

const steps = [
  {
    id: 1,
    title: 'Book Details',
    icon: BookOpen,
    description: 'Basic information about your book',
  },
  {
    id: 2,
    title: 'Condition & Price',
    icon: DollarSign,
    description: 'Set the condition and pricing',
  },
  {
    id: 3,
    title: 'Photos',
    icon: Camera,
    description: 'Add photos of your book',
  },
  {
    id: 4,
    title: 'Review & Submit',
    icon: CheckCircle,
    description: 'Review your listing',
  },
];

interface ImprovedSellingProcessProps {
  initialData?: Partial<FormData>;
  onComplete?: (data: FormData) => void;
}

export default function ImprovedSellingProcess({
  initialData = {},
  onComplete,
}: ImprovedSellingProcessProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: initialData.title || '',
      author: initialData.author || '',
      description: initialData.description || '',
      price: initialData.price || 0,
      condition: initialData.condition || '',
      quantity: initialData.quantity || 1,
      isbn: initialData.isbn || '',
      language: initialData.language || 'Arabic',
      category: initialData.category || '',
    },
  });

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Here you would typically save the listing
      console.log('Listing data:', data);
      console.log('Uploaded images:', uploadedImages);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (onComplete) {
        onComplete(data);
      } else {
        // Redirect to success page or dashboard
        router.push('/dashboard?success=listing-created');
      }
    } catch (error) {
      console.error('Error creating listing:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedImages(prev => [...prev, ...files].slice(0, 10)); // Max 10 images
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className='space-y-6'>
            <div>
              <h3 className='text-lg font-semibold mb-2'>Book Information</h3>
              <p className='text-sm text-muted-foreground'>
                Tell us about the book you want to sell
              </p>
            </div>

            <div className='grid gap-4 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='title'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Book Title *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter the full title'
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
                name='author'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Author *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Author's name"
                        {...field}
                        value={field.value as string}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Describe the book, its content, and why someone would want to buy it...'
                      className='min-h-[100px]'
                      {...field}
                      value={field.value as string}
                    />
                  </FormControl>
                  <FormDescription>
                    A good description helps buyers understand what they're
                    getting
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid gap-4 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='isbn'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ISBN (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='978-0-123456-78-9'
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
                name='language'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select language' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='Arabic'>Arabic</SelectItem>
                        <SelectItem value='English'>English</SelectItem>
                        <SelectItem value='Urdu'>Urdu</SelectItem>
                        <SelectItem value='Turkish'>Turkish</SelectItem>
                        <SelectItem value='Other'>Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='category'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select category' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='Quran'>Quran & Tafseer</SelectItem>
                      <SelectItem value='Hadith'>Hadith & Sunnah</SelectItem>
                      <SelectItem value='Fiqh'>Fiqh & Jurisprudence</SelectItem>
                      <SelectItem value='Aqeedah'>Aqeedah & Creed</SelectItem>
                      <SelectItem value='Seerah'>Seerah & History</SelectItem>
                      <SelectItem value='Tasawwuf'>
                        Tasawwuf & Spirituality
                      </SelectItem>
                      <SelectItem value='Arabic'>Arabic Language</SelectItem>
                      <SelectItem value='Other'>Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 2:
        return (
          <div className='space-y-6'>
            <div>
              <h3 className='text-lg font-semibold mb-2'>
                Condition & Pricing
              </h3>
              <p className='text-sm text-muted-foreground'>
                Set the condition and price for your book
              </p>
            </div>

            <FormField
              control={form.control}
              name='condition'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Book Condition *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select condition' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {conditions.map(condition => (
                        <SelectItem
                          key={condition.value}
                          value={condition.value}
                        >
                          <div className='flex flex-col'>
                            <span>{condition.label}</span>
                            <span className='text-xs text-muted-foreground'>
                              {condition.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid gap-4 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='price'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (USD) *</FormLabel>
                    <FormControl>
                      <div className='relative'>
                        <DollarSign className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                        <Input
                          type='number'
                          step='0.01'
                          min='0.01'
                          placeholder='0.00'
                          className='pl-10'
                          {...field}
                          value={field.value as unknown as string}
                          onChange={e =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Set a competitive price to attract buyers
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='quantity'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity *</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min='1'
                        placeholder='1'
                        {...field}
                        value={field.value as unknown as string}
                        onChange={e =>
                          field.onChange(parseInt(e.target.value) || 1)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Alert>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>
                <strong>No platform fees!</strong> You keep 100% of your sale
                price. We only charge for payment processing (Stripe fees
                apply).
              </AlertDescription>
            </Alert>
          </div>
        );

      case 3:
        return (
          <div className='space-y-6'>
            <div>
              <h3 className='text-lg font-semibold mb-2'>Book Photos</h3>
              <p className='text-sm text-muted-foreground'>
                Add clear photos of your book to attract buyers
              </p>
            </div>

            <div className='space-y-4'>
              <div className='border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center'>
                <Upload className='mx-auto h-12 w-12 text-muted-foreground mb-4' />
                <div className='space-y-2'>
                  <h4 className='text-sm font-medium'>Upload Photos</h4>
                  <p className='text-xs text-muted-foreground'>
                    Drag and drop images here, or click to select
                  </p>
                  <input
                    ref={fileInputRef}
                    type='file'
                    multiple
                    accept='image/*'
                    onChange={handleImageUpload}
                    className='hidden'
                    id='image-upload'
                  />
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose Images
                  </Button>
                </div>
              </div>

              {uploadedImages.length > 0 && (
                <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                  {uploadedImages.map((file, index) => (
                    <div key={index} className='relative group'>
                      <Image
                        src={URL.createObjectURL(file)}
                        alt={`Upload ${index + 1}`}
                        width={96}
                        height={96}
                        className='w-full h-24 object-cover rounded-lg border'
                      />
                      <Button
                        type='button'
                        variant='destructive'
                        size='sm'
                        className='absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity'
                        onClick={() => removeImage(index)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className='text-xs text-muted-foreground'>
                <p>• Upload 1-10 clear photos of your book</p>
                <p>• Include front cover, back cover, and any damage</p>
                <p>• Good lighting helps show the true condition</p>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className='space-y-6'>
            <div>
              <h3 className='text-lg font-semibold mb-2'>
                Review Your Listing
              </h3>
              <p className='text-sm text-muted-foreground'>
                Make sure everything looks good before publishing
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>{form.watch('title')}</CardTitle>
                <CardDescription>by {form.watch('author')}</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid gap-4 md:grid-cols-2'>
                  <div>
                    <h4 className='font-medium mb-2'>Details</h4>
                    <div className='space-y-1 text-sm'>
                      <p>
                        <strong>Language:</strong> {form.watch('language')}
                      </p>
                      <p>
                        <strong>Category:</strong> {form.watch('category')}
                      </p>
                      <p>
                        <strong>Condition:</strong>{' '}
                        {
                          conditions.find(
                            c => c.value === form.watch('condition')
                          )?.label
                        }
                      </p>
                      <p>
                        <strong>Quantity:</strong> {form.watch('quantity')}
                      </p>
                      {form.watch('isbn') && (
                        <p>
                          <strong>ISBN:</strong> {form.watch('isbn')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className='font-medium mb-2'>Pricing</h4>
                    <div className='text-2xl font-bold text-green-600'>
                      ${form.watch('price')?.toFixed(2)}
                    </div>
                    <p className='text-sm text-muted-foreground'>
                      You keep 100% of this amount
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className='font-medium mb-2'>Description</h4>
                  <p className='text-sm text-muted-foreground'>
                    {form.watch('description')}
                  </p>
                </div>

                {uploadedImages.length > 0 && (
                  <div>
                    <h4 className='font-medium mb-2'>
                      Photos ({uploadedImages.length})
                    </h4>
                    <div className='grid grid-cols-4 gap-2'>
                      {uploadedImages.map((file, index) => (
                        <Image
                          key={index}
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          width={64}
                          height={64}
                          className='w-full h-16 object-cover rounded border'
                        />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className='max-w-4xl mx-auto'>
      {/* Progress Bar */}
      <div className='mb-8'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-2xl font-bold'>List Your Book</h2>
          <Badge variant='outline'>
            Step {currentStep} of {steps.length}
          </Badge>
        </div>
        <Progress value={(currentStep / steps.length) * 100} className='h-2' />
        <div className='flex justify-between mt-2'>
          {steps.map(step => (
            <div key={step.id} className='flex flex-col items-center'>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {currentStep > step.id ? (
                  <CheckCircle className='w-4 h-4' />
                ) : (
                  step.id
                )}
              </div>
              <span className='text-xs mt-1 text-center max-w-20'>
                {step.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          <Card>
            <CardContent className='p-6'>{renderStepContent()}</CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className='flex justify-between'>
            <Button
              type='button'
              variant='outline'
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ArrowLeft className='w-4 h-4 mr-2' />
              Previous
            </Button>

            {currentStep < steps.length ? (
              <Button
                type='button'
                onClick={nextStep}
                disabled={!form.formState.isValid}
              >
                Next
                <ArrowRight className='w-4 h-4 ml-2' />
              </Button>
            ) : (
              <Button
                type='submit'
                disabled={isSubmitting || uploadedImages.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    Publishing...
                  </>
                ) : (
                  <>
                    <CheckCircle className='w-4 h-4 mr-2' />
                    Publish Listing
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
