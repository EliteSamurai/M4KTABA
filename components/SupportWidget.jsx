"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PaperclipIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSupport } from "@/contexts/support-context";

export default function SupportWidget() {
  const { isOpen, openSupport, closeSupport } = useSupport();
  const [attachments, setAttachments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e) => {
    setAttachments(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    // Add attachments to form data
    attachments.forEach((file) => {
      formData.append("attachments", file);
    });

    try {
      const response = await fetch("/api/send-support-email", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Support request sent",
          description: "We'll get back to you as soon as possible.",
        });
        closeSupport()
      } else {
        throw new Error(result.error || "Failed to send email");
      }
    } catch (error) {
      toast({
        title: "Failed to send support request",
        description: "Please try again later or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        onClick={openSupport}
        className="fixed bottom-6 right-6 rounded-full size-10 lg:size-14 p-0 px-10 shadow-lg hover:shadow-xl"
      >
        <p>Support</p>
        <span className="sr-only">Open support</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={closeSupport}>
        <DialogContent className="max-w-lg h-screen flex flex-col justify-center">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Contact Support
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-lg font-semibold">
                Email address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-lg font-semibold">
                I am contacting regarding:
              </label>
              <p className="text-gray-500">
                We would like to assist you as fast as possible, please give us
                the reason of your contact so we can route you to the correct
                department.
              </p>
              <Select name="contactReason">
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Support</SelectItem>
                  <SelectItem value="technical">Technical Support</SelectItem>
                  <SelectItem value="billing">Billing Support</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="orderNumber" className="text-lg font-semibold">
                Order # (optional)
              </label>
              <p className="text-gray-500">
                If you have your order number, please input it here:
              </p>
              <Input
                id="orderNumber"
                name="orderNumber"
                type="text"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="text-lg font-semibold">
                How can we help you?
              </label>
              <Textarea
                id="message"
                name="message"
                required
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              {/* File Picker */}
              <div className="flex items-center gap-2">
                <label htmlFor="attachments" className="relative">
                  <Button type="button" variant="outline" className="gap-2">
                    <PaperclipIcon className="size-4" />
                    Add attachments
                  </Button>
                  <input
                    id="attachments"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </label>
                {attachments.length > 0 && (
                  <span className="text-sm text-gray-500">
                    {attachments.length} file(s) selected
                  </span>
                )}
              </div>

              {/* File List */}
              {attachments.length > 0 && (
                <ul className="text-sm text-gray-500">
                  {attachments.map((file, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <PaperclipIcon className="size-3" />
                      {file.name}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="size-4 p-0"
                        onClick={
                          () =>
                            setAttachments(
                              attachments.filter((_, i) => i !== index)
                            ) // Remove file
                        }
                      >
                        <X className="size-3" />
                        <span className="sr-only">Remove {file.name}</span>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
