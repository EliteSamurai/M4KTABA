'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useAutosave } from '@/hooks/useAutosave';
import { DraftManager } from '@/lib/draftManager';
import { listingSchema } from '@/lib/validation/listingSchema';
import ListingPreview from './ListingPreview';
import MobileImageUpload from './MobileImageUpload';
import ISBNLookup from './ISBNLookup';
import PriceSuggestion from './PriceSuggestion';
import FirstTimeSellerTips from './FirstTimeSellerTips';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Camera,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Loader2,
  Save,
  Eye,
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

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

type FormData = z.infer<typeof listingSchema>;

const sections = [
  {
    id: 'basic',
    title: 'Basic Information',
    icon: BookOpen,
    description: 'Tell us about your book',
  },
  {
    id: 'pricing',
    title: 'Condition & Pricing',
    icon: DollarSign,
    description: 'Set condition and price',
  },
  {
    id: 'photos',
    title: 'Photos',
    icon: Camera,
    description: 'Add photos of your book',
  },
  {
    id: 'review',
    title: 'Review & Publish',
    icon: CheckCircle,
    description: 'Review and publish your listing',
  },
];

interface UnifiedSellingFlowProps {
  initialData?: Partial<FormData>;
  onComplete?: (data: FormData) => void;
}

export default function UnifiedSellingFlow({
  initialData = {},
  onComplete,
}: UnifiedSellingFlowProps) {
  const [currentSection, setCurrentSection] = useState('basic');
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showTips, setShowTips] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const draftManager = DraftManager.getInstance();

  const form = useForm<FormData>({
    resolver: zodResolver(listingSchema),
    mode: 'onChange', // Enable real-time validation
    reValidateMode: 'onChange', // Re-validate on change
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
      currency: 'USD',
      images: [], // Initialize with empty array
    },
  });

  // Generate draft ID on mount and load existing draft
  useEffect(() => {
    if (!draftId) {
      try {
        // Check if there's an existing draft in localStorage
        const existingDrafts = draftManager?.getAllDrafts?.() || [];
        let draftToLoad = null;

        if (existingDrafts.length > 0) {
          // Use the most recent draft
          draftToLoad = existingDrafts[0];
          setDraftId(draftToLoad.id);
        } else {
          // Create a new draft ID
          const newDraftId = `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          setDraftId(newDraftId);
          return; // No existing data to load
        }

        // Load existing draft data into form
        if (draftToLoad && draftToLoad.data) {
          form.reset({
            title: draftToLoad.data.title || '',
            author: draftToLoad.data.author || '',
            description: draftToLoad.data.description || '',
            price: draftToLoad.data.price || 0,
            condition: draftToLoad.data.condition || '',
            quantity: draftToLoad.data.quantity || 1,
            isbn: draftToLoad.data.isbn || '',
            language: draftToLoad.data.language || 'Arabic',
            category: draftToLoad.data.category || '',
            currency: draftToLoad.data.currency || 'USD',
            images: draftToLoad.data.images || [],
          });

          // Load images if they exist
          if (
            draftToLoad.data.images &&
            Array.isArray(draftToLoad.data.images)
          ) {
            // For now, we'll just store the image names
            // In a real implementation, you'd need to reconstruct File objects
          }
        }
      } catch (error) {
        // If draft loading fails, just create a new draft ID
        console.warn('Failed to load existing draft:', error);
        const newDraftId = `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setDraftId(newDraftId);
      }
    }
  }, [draftId, form, draftManager]);

  // Autosave functionality
  const {
    isSaving,
    lastSaved,
    error: saveError,
    manualSave,
  } = useAutosave(
    {
      ...form.getValues(),
      images: uploadedImages.map(file => file.name), // Store image names for now
    },
    {
      delay: 1500,
      enabled: !!draftId,
      onSave: async data => {
        if (!draftId) return;

        try {
          // Save to localStorage
          draftManager?.saveDraft?.(draftId, data);

          // TODO: In future PRs, also save to server
        } catch (error) {
          console.warn('Failed to save draft:', error);
          throw error; // Re-throw to trigger onError callback
        }
      },
      onError: error => {
        console.error('Autosave failed:', error);
        toast({
          title: 'Save Failed',
          description: 'Failed to save your progress. Please try again.',
          variant: 'destructive',
        });
      },
    }
  );

  const nextSection = () => {
    const sectionIndex = sections.findIndex(s => s.id === currentSection);
    if (sectionIndex < sections.length - 1) {
      setCurrentSection(sections[sectionIndex + 1].id);
    }
  };

  const prevSection = () => {
    const sectionIndex = sections.findIndex(s => s.id === currentSection);
    if (sectionIndex > 0) {
      setCurrentSection(sections[sectionIndex - 1].id);
    }
  };

  const goToSection = (sectionId: string) => {
    setCurrentSection(sectionId);
  };

  // Sync uploaded images with form
  useEffect(() => {
    form.setValue(
      'images',
      uploadedImages.map(file => file.name)
    );
  }, [uploadedImages, form]);

  // Check if current section is valid
  const isCurrentSectionValid = () => {
    const formValues = form.getValues();

    switch (currentSection) {
      case 'basic':
        // Only validate fields that are in the basic section
        const isValid = !!(
          formValues.title?.trim() &&
          formValues.author?.trim() &&
          formValues.description?.trim() &&
          formValues.description.length >= 10 &&
          formValues.language?.trim() &&
          formValues.category?.trim()
        );
        // Debug logging removed - validation is working correctly
        return isValid;
      case 'pricing':
        return !!(
          formValues.price &&
          formValues.price > 0 &&
          formValues.condition?.trim() &&
          formValues.quantity &&
          formValues.quantity >= 1
        );
      case 'photos':
        return uploadedImages.length > 0;
      case 'review':
        return form.formState.isValid;
      default:
        return false;
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Prepare the listing data for API
      const listingData = {
        ...data,
        images: uploadedImages.map(file => file.name), // This will be replaced with actual image URLs after upload
      };

      // First, upload images to get asset references
      const imageAssets = [];
      for (const file of uploadedImages) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('bookId', 'temp-' + Date.now()); // Temporary ID for upload

          const uploadResponse = await fetch('/api/upload-image', {
            method: 'POST',
            body: formData,
          });

          if (uploadResponse.ok) {
            const { asset } = await uploadResponse.json();
            if (asset && asset._id) {
              imageAssets.push(asset._id);
            } else {
              console.warn(
                `Image upload succeeded but no asset ID returned for: ${file.name}`
              );
            }
          } else {
            const errorText = await uploadResponse.text();
            console.warn(`Failed to upload image: ${file.name}`, errorText);
          }
        } catch (error) {
          console.warn(`Error uploading image ${file.name}:`, error);
        }
      }

      // Ensure we have at least one image before proceeding
      if (imageAssets.length === 0) {
        throw new Error('No images were successfully uploaded');
      }

      // Create the listing with actual asset references
      const finalListingData = {
        ...listingData,
        images: imageAssets,
      };

      // Call the listings API
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalListingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create listing');
      }

      const result = await response.json();

      toast({
        title: 'Success!',
        description:
          'Your listing has been created successfully. Redirecting to product page...',
      });

      if (onComplete) {
        onComplete(data);
      } else {
        // Redirect to the product page
        if (result.id) {
          // Add a small delay to allow Sanity to process the image assets
          setTimeout(() => {
            router.push(`/books/${result.id}`);
          }, 1500);
        } else {
          // Fallback to dashboard if no ID is returned
          router.push('/dashboard?success=listing-created');
        }
      }
    } catch (error) {
      console.error('Error creating listing:', error);

      let errorMessage = 'Failed to create listing. Please try again.';
      let errorTitle = 'Error';

      if (error instanceof Error) {
        if (
          error.message.includes('401') ||
          error.message.includes('Authentication required')
        ) {
          errorTitle = 'Authentication Required';
          errorMessage =
            'Please sign in to create a listing. You may also need to complete your seller profile and Stripe billing setup.';
        } else if (
          error.message.includes('403') ||
          error.message.includes('STRIPE_ACCOUNT_REQUIRED') ||
          error.message.includes('Stripe') ||
          error.message.includes('payment') ||
          error.message.includes('billing')
        ) {
          errorTitle = 'Payment Setup Required';
          errorMessage =
            'Please complete your Stripe setup in the Billing section of your dashboard before creating listings.';
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSectionContent = () => {
    switch (currentSection) {
      case 'basic':
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

            <ISBNLookup
              onBookFound={bookData => {
                form.setValue('title', bookData.title);
                form.setValue('author', bookData.author);
                form.setValue('description', bookData.description);
                form.setValue('language', bookData.language);
                form.setValue('category', bookData.category);
                if (bookData.coverUrl) {
                  // TODO: Handle cover image upload
                }
              }}
              className='mt-6'
            />

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

      case 'pricing':
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

            <PriceSuggestion
              isbn={form.watch('isbn')}
              condition={form.watch('condition')}
              onPriceSelect={price => form.setValue('price', price)}
              className='mt-6'
            />

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

      case 'photos':
        return (
          <div className='space-y-6'>
            <div>
              <h3 className='text-lg font-semibold mb-2'>Book Photos</h3>
              <p className='text-sm text-muted-foreground'>
                Add clear photos of your book to attract buyers
              </p>
            </div>

            <MobileImageUpload
              images={uploadedImages}
              onImagesChange={setUploadedImages}
              maxImages={10}
              maxSizeMB={10}
            />

            {uploadedImages.length === 0 && (
              <Alert>
                <AlertCircle className='h-4 w-4' />
                <AlertTitle>No Photos Uploaded</AlertTitle>
                <AlertDescription>
                  Please upload at least one photo of your book to continue.
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      case 'review':
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

  const currentSectionIndex = sections.findIndex(s => s.id === currentSection);
  const progress = ((currentSectionIndex + 1) / sections.length) * 100;

  return (
    <div className='max-w-7xl mx-auto'>
      {/* Progress Bar */}
      <div className='mb-8'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-2xl font-bold'>List Your Book</h2>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setShowPreview(!showPreview)}
              className='hidden md:flex'
            >
              <Eye className='w-4 h-4 mr-2' />
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
            {isSaving && (
              <Badge variant='outline' className='text-xs'>
                <Loader2 className='w-3 h-3 mr-1 animate-spin' />
                Saving...
              </Badge>
            )}
            {lastSaved && !isSaving && (
              <Badge variant='outline' className='text-xs'>
                <Save className='w-3 h-3 mr-1' />
                Saved • {Math.round((Date.now() - lastSaved.getTime()) / 1000)}s
                ago
              </Badge>
            )}
            {saveError && (
              <Badge variant='destructive' className='text-xs'>
                <AlertCircle className='w-3 h-3 mr-1' />
                Save Failed
              </Badge>
            )}
            <Badge variant='outline'>
              Section {currentSectionIndex + 1} of {sections.length}
            </Badge>
          </div>
        </div>
        <Progress value={progress} className='h-2' />
        <div className='flex justify-between mt-2'>
          {sections.map((section, index) => (
            <div key={section.id} className='flex flex-col items-center group'>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium cursor-pointer transition-all duration-200 border-2 hover:scale-110 ${
                  currentSectionIndex >= index
                    ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                    : 'bg-muted text-muted-foreground border-muted-foreground/20 hover:border-primary/50'
                }`}
                onClick={() => goToSection(section.id)}
                title={`Click to go to ${section.title}`}
              >
                {currentSectionIndex > index ? (
                  <CheckCircle className='w-5 h-5' />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`text-xs mt-2 text-center max-w-20 font-medium ${
                  currentSectionIndex >= index
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                {section.title}
              </span>
              <span className='text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity'>
                Click to navigate
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* First-time seller tips */}
      {showTips && (
        <FirstTimeSellerTips
          onDismiss={() => setShowTips(false)}
          className='mb-6'
        />
      )}

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8'>
        {/* Main Form */}
        <div className='lg:col-span-2'>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              <Card>
                <CardContent className='p-6'>
                  {renderSectionContent()}
                </CardContent>
              </Card>

              {/* Navigation Buttons */}
              <div className='flex justify-between'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={prevSection}
                  disabled={currentSectionIndex === 0}
                >
                  <ArrowLeft className='w-4 h-4 mr-2' />
                  Previous
                </Button>

                <div className='flex gap-2'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={async () => {
                      try {
                        await manualSave();
                        toast({
                          title: 'Draft Saved',
                          description: 'Your progress has been saved.',
                        });
                      } catch (error) {
                        console.error('Manual save failed:', error);
                        toast({
                          title: 'Save Failed',
                          description:
                            'Failed to save your progress. Please try again.',
                          variant: 'destructive',
                        });
                      }
                    }}
                    disabled={isSaving}
                  >
                    <Save className='w-4 h-4 mr-2' />
                    {isSaving ? 'Saving...' : 'Save Draft'}
                  </Button>

                  {currentSectionIndex < sections.length - 1 ? (
                    <Button
                      type='button'
                      onClick={nextSection}
                      disabled={
                        !isCurrentSectionValid() || form.formState.isSubmitting
                      }
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
              </div>
            </form>
          </Form>
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className='lg:col-span-1'>
            <div className='sticky top-8'>
              <div className='mb-4'>
                <h3 className='text-lg font-semibold mb-2'>Live Preview</h3>
                <p className='text-sm text-muted-foreground'>
                  See how your listing will appear to buyers
                </p>
              </div>
              <ListingPreview
                data={{
                  title: form.watch('title'),
                  author: form.watch('author'),
                  description: form.watch('description'),
                  price: form.watch('price'),
                  condition: form.watch('condition'),
                  language: form.watch('language'),
                  category: form.watch('category'),
                  images: uploadedImages,
                }}
                onEdit={() => setCurrentSection('basic')}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
