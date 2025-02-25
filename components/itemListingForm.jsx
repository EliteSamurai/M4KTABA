"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { readClient, writeClient } from "@/studio-m4ktaba/client";
import { uploadImagesToSanity } from "@/utils/uploadImageToSanity";
import heic2any from "heic2any";

const conditions = [
  { value: "new", label: "New" },
  { value: "like-new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
];

const listingSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  description: z.string().min(1, "Description is required"),
  condition: z.string().min(1, "Condition is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  price: z.number().min(0, "Price must be at least 0"),
  category: z.string().min(1, "Category is required"),
});

export default function ItemListingForm({ bookData }) {
  const [photos, setPhotos] = useState([]);
  const [photoPreview, setPhotoPreview] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();

  const form = useForm({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: bookData.title,
      author: bookData.author,
      description: bookData.description,
      quantity: 1,
      price: 0,
    },
  });

  useEffect(() => {
    async function fetchCategories() {
      try {
        const fetchedCategories = await readClient.fetch(
          `*[_type == "category"]{_id, title}`
        );
        setCategories(fetchedCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast({
          title: "Error",
          description: "Failed to load categories. Please try again.",
          variant: "destructive",
        });
      }
    }
    fetchCategories();
  }, [toast]);

  const MAX_PHOTOS = 5; // Maximum allowed photos

  const handlePhotoUpload = async (event) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);

      // Check if the total number of photos exceeds the limit
      if (files.length + photos.length > MAX_PHOTOS) {
        alert(`You can only upload a maximum of ${MAX_PHOTOS} photos.`);
        return;
      }

      // Convert HEIC files and keep valid ones
      const convertedFiles = await Promise.all(
        files.map(async (file) => {
          if (file.type === "image/heic" || file.name.endsWith(".heic")) {
            try {
              const convertedBlob = await heic2any({
                blob: file,
                toType: "image/jpeg",
              });
              return new File(
                [convertedBlob],
                file.name.replace(".heic", ".jpg"),
                {
                  type: "image/jpeg",
                }
              );
            } catch (error) {
              console.error("Error converting HEIC file:", error);
              return null;
            }
          }
          return file;
        })
      );

      const validFiles = convertedFiles.filter(Boolean);

      // Add new photos to the existing list without exceeding the max limit
      const updatedPhotos = [...photos, ...validFiles].slice(0, MAX_PHOTOS);
      setPhotos(updatedPhotos);

      // Generate previews for the updated photo list
      const previews = updatedPhotos.map((file) => URL.createObjectURL(file));
      setPhotoPreview(previews);
    }
  };

  async function onSubmit(data) {
    if (!session?.user?._id) {
      toast({
        title: "Error",
        description: "You must be logged in to list an item.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (photos.length === 0) {
        throw new Error("At least one photo is required");
      }

      const sanityImages = await uploadImagesToSanity(photos);

      const newBook = {
        _type: "book",
        title: data.title,
        author: data.author,
        description: data.description,
        selectedCondition: data.condition,
        quantity: data.quantity,
        price: data.price,
        selectedCategory: {
          _type: "reference",
          _ref: data.category,
        },
        photos: sanityImages,
        user: {
          _type: "reference",
          _ref: session.user._id,
        },
      };

      const createdBook = await writeClient.create(newBook, {
        perspective: "raw",
      });

      toast({
        title: "Success!",
        description: "Your book has been listed successfully.",
      });

      router.push(`/all/${createdBook._id}`);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to list book",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>List Your Item</CardTitle>
        <CardDescription>
          Fill in the details below to list your book for sale.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter book title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="author"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Author</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter author name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your book"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="condition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condition</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {conditions.map((condition) => (
                        <SelectItem
                          key={condition.value}
                          value={condition.value}
                        >
                          {condition.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Photos</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  <Input
                    type="file"
                    accept="image/heic, image/heif, image/jpeg, image/png"
                    multiple
                    onChange={handlePhotoUpload}
                    className="cursor-pointer file:cursor-pointer"
                  />
                  {photoPreview.length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                      {photoPreview.map((preview, index) => (
                        <div
                          key={index}
                          className="relative aspect-square overflow-hidden rounded-lg border bg-muted"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </FormControl>
              <FormDescription>
                Upload clear photos of your book. HEIC, JPEG, and PNG formats
                are supported. Maximum of 5 photos.
              </FormDescription>
              <FormMessage />
            </FormItem>

            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Make sure to factor in shipping cost.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category._id} value={category._id}>
                          {category.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !form.formState.isValid}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Listing Item...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  List Item
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
