"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, Save, X } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { readClient } from "@/studio-m4ktaba/client";

const conditions = [
  { value: "new", label: "New" },
  { value: "like-new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
];

const editProductSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  author: z
    .string()
    .min(1, "Author is required")
    .max(50, "Author must be less than 50 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be less than 1000 characters"),
  selectedCondition: z.string().min(1, "Condition is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  price: z.number().min(0, "Price must be at least 0"),
  category: z.string().min(1, "Category is required"),
});

interface EditProductFormProps {
  book: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditProductForm({
  book,
  isOpen,
  onClose,
  onSuccess,
}: EditProductFormProps) {
  const [categories, setCategories] = useState<
    Array<{ _id: string; title: string }>
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();

  const form = useForm({
    resolver: zodResolver(editProductSchema),
    defaultValues: {
      title: book?.title || "",
      author: book?.author || "",
      description: book?.description || "",
      selectedCondition: book?.selectedCondition || "",
      quantity: book?.quantity || 1,
      price: book?.price || 0,
      category: book?.selectedCategory?._id || "",
    },
  });

  // Reset form when book data changes
  useEffect(() => {
    if (book) {
      form.reset({
        title: book.title || "",
        author: book.author || "",
        description: book.description || "",
        selectedCondition: book.selectedCondition || "",
        quantity: book.quantity || 1,
        price: book.price || 0,
        category: book.selectedCategory?._id || "",
      });
    }
  }, [book, form]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch("/api/get-categories");
        if (response.ok) {
          const fetchedCategories = await response.json();
          setCategories(fetchedCategories);
        } else {
          // Fallback categories if API fails
          setCategories([
            { _id: "fiction", title: "Fiction" },
            { _id: "non-fiction", title: "Non-Fiction" },
            { _id: "academic", title: "Academic" },
            { _id: "religious", title: "Religious" },
            { _id: "children", title: "Children's Books" },
            { _id: "other", title: "Other" },
          ]);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        // Fallback categories
        setCategories([
          { _id: "fiction", title: "Fiction" },
          { _id: "non-fiction", title: "Non-Fiction" },
          { _id: "academic", title: "Academic" },
          { _id: "religious", title: "Religious" },
          { _id: "children", title: "Children's Books" },
          { _id: "other", title: "Other" },
        ]);
        toast({
          title: "Warning",
          description:
            "Using default categories. Some features may be limited.",
          variant: "default",
        });
      }
    }
    fetchCategories();
  }, [toast]);

  async function onSubmit(data: z.infer<typeof editProductSchema>) {
    if (!session?.user?._id) {
      toast({
        title: "Error",
        description: "You must be logged in to edit this item.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const requestBody = {
        bookId: book._id,
        updates: {
          title: data.title,
          author: data.author,
          description: data.description,
          selectedCondition: data.selectedCondition,
          quantity: data.quantity,
          price: data.price,
          category: data.category,
        },
      };

      console.log("Sending update request:", {
        bookId: book._id,
        sessionUserId: session.user._id,
        bookUserId: book.user?._id,
        requestBody,
      });

      const response = await fetch("/api/update-book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Update failed:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });
        throw new Error(errorData.message || "Failed to update book");
      }

      toast({
        title: "Success!",
        description: "Your book has been updated successfully.",
      });

      onSuccess();
      onClose();

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update book",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product Listing</DialogTitle>
          <DialogDescription>
            Update your product details below. Images can be edited separately
            on the product page.
          </DialogDescription>
        </DialogHeader>

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
              name="selectedCondition"
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
                        step={0.01}
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === "" ? 0 : Number(value));
                        }}
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
                      {categories.map((category: any) => (
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

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting || !form.formState.isValid}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Listing
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
