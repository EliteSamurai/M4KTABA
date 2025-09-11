import { Metadata } from "next";
import { ArrowLeft, Clock, Package, Shield, Truck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Returns & Refunds",
  description: "Learn about our return and refund policy for books and honey products on M4KTABA.",
};

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Returns & Refunds</h1>
          <p className="text-lg text-muted-foreground">
            We want you to be completely satisfied with your purchase. Here's everything you need to know about our return process.
          </p>
        </div>

        {/* Quick Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader className="text-center">
              <Clock className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <CardTitle className="text-lg">30-Day Returns</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                Return any item within 30 days of delivery for a full refund
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Shield className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <CardTitle className="text-lg">Free Returns</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                We cover return shipping costs for all returns
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Package className="h-8 w-8 mx-auto text-purple-600 mb-2" />
              <CardTitle className="text-lg">Easy Process</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                Simple online return process with tracking
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Return Process */}
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-6">How to Return an Item</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <Badge variant="outline" className="mt-1">1</Badge>
                <div>
                  <h3 className="font-medium">Start Your Return</h3>
                  <p className="text-muted-foreground">
                    Log into your account and go to "My Orders". Click "Return Item" next to the order you want to return.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <Badge variant="outline" className="mt-1">2</Badge>
                <div>
                  <h3 className="font-medium">Select Reason & Items</h3>
                  <p className="text-muted-foreground">
                    Choose why you're returning the item and select which items you want to return.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <Badge variant="outline" className="mt-1">3</Badge>
                <div>
                  <h3 className="font-medium">Print Return Label</h3>
                  <p className="text-muted-foreground">
                    We'll email you a prepaid return shipping label. Print it and attach it to your package.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <Badge variant="outline" className="mt-1">4</Badge>
                <div>
                  <h3 className="font-medium">Ship Your Return</h3>
                  <p className="text-muted-foreground">
                    Drop off your package at any authorized shipping location. You can track your return online.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <Badge variant="outline" className="mt-1">5</Badge>
                <div>
                  <h3 className="font-medium">Receive Refund</h3>
                  <p className="text-muted-foreground">
                    Once we receive and inspect your return, we'll process your refund within 3-5 business days.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Return Conditions */}
          <section>
            <h2 className="text-2xl font-semibold mb-6">Return Conditions</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600">✓ What We Accept</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Books in original condition</li>
                    <li>• Items within 30 days of delivery</li>
                    <li>• Original packaging (if available)</li>
                    <li>• Honey products (unopened)</li>
                    <li>• Damaged items during shipping</li>
                    <li>• Wrong items sent</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">✗ What We Don't Accept</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Items damaged by misuse</li>
                    <li>• Books with writing or highlighting</li>
                    <li>• Opened honey products</li>
                    <li>• Items returned after 30 days</li>
                    <li>• Personalized or custom items</li>
                    <li>• Items without return authorization</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Refund Information */}
          <section>
            <h2 className="text-2xl font-semibold mb-6">Refund Information</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <Truck className="h-6 w-6 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Refund Timeline</h3>
                  <ul className="space-y-1 text-sm text-blue-800">
                    <li>• <strong>Processing Time:</strong> 3-5 business days after we receive your return</li>
                    <li>• <strong>Refund Method:</strong> Original payment method</li>
                    <li>• <strong>Bank Processing:</strong> 3-10 business days depending on your bank</li>
                    <li>• <strong>Email Confirmation:</strong> You'll receive an email when your refund is processed</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Special Cases */}
          <section>
            <h2 className="text-2xl font-semibold mb-6">Special Cases</h2>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Damaged Items</CardTitle>
                  <CardDescription>
                    If your item arrives damaged, please contact us immediately with photos.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    We'll arrange for a replacement or full refund, including return shipping costs.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Wrong Items</CardTitle>
                  <CardDescription>
                    If you receive the wrong item, we'll cover all return costs and expedite your correct order.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Please contact us within 48 hours of delivery to report wrong items.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Honey Products</CardTitle>
                  <CardDescription>
                    Special return policy for our premium honey products.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Honey products must be unopened and in original packaging. Opened honey products cannot be returned for hygiene reasons.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Contact Information */}
          <section className="bg-slate-50 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Need Help?</h2>
            <p className="text-muted-foreground mb-4">
              If you have questions about returns or need assistance, we're here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild>
                <Link href="/contact">Contact Support</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/track">Track Your Order</Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
