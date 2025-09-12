import { Metadata } from "next";
import { ArrowLeft, Shield, Eye, Lock, Database, Users, Mail } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how M4KTABA protects your privacy and handles your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Privacy Policy</h1>
          <p className="text-lg text-muted-foreground">
            Your privacy is important to us. This policy explains how we collect, use, and protect your information.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            <strong>Last updated:</strong> {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Quick Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader className="text-center">
              <Shield className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <CardTitle className="text-lg">Secure Data</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                We use industry-standard encryption to protect your information
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Eye className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <CardTitle className="text-lg">Transparent</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                Clear information about what data we collect and why
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Lock className="h-8 w-8 mx-auto text-purple-600 mb-2" />
              <CardTitle className="text-lg">Your Control</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                You can manage your privacy settings and data at any time
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Privacy Policy Content */}
        <div className="space-y-8">
          {/* Information We Collect */}
          <section>
            <h2 className="text-2xl font-semibold mb-6 flex items-center">
              <Database className="mr-3 h-6 w-6 text-blue-600" />
              Information We Collect
            </h2>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Information you provide directly to us</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• <strong>Account Information:</strong> Name, email address, phone number</li>
                    <li>• <strong>Profile Information:</strong> Profile picture, bio, location</li>
                    <li>• <strong>Payment Information:</strong> Billing address, payment method (processed securely by Stripe)</li>
                    <li>• <strong>Communication:</strong> Messages, reviews, and feedback you send us</li>
                    <li>• <strong>Seller Information:</strong> Business details, tax information (for sellers)</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Usage Information</CardTitle>
                  <CardDescription>Information about how you use our platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• <strong>Activity Data:</strong> Pages visited, searches, purchases, listings created</li>
                    <li>• <strong>Device Information:</strong> IP address, browser type, operating system</li>
                    <li>• <strong>Location Data:</strong> General location based on IP address</li>
                    <li>• <strong>Cookies:</strong> Small files stored on your device to improve your experience</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* How We Use Information */}
          <section>
            <h2 className="text-2xl font-semibold mb-6 flex items-center">
              <Users className="mr-3 h-6 w-6 text-green-600" />
              How We Use Your Information
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Service Delivery</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Process orders and payments</li>
                    <li>• Connect buyers and sellers</li>
                    <li>• Provide customer support</li>
                    <li>• Send order confirmations and updates</li>
                    <li>• Manage your account</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Platform Improvement</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Analyze usage patterns</li>
                    <li>• Improve our services</li>
                    <li>• Develop new features</li>
                    <li>• Personalize your experience</li>
                    <li>• Prevent fraud and abuse</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Information Sharing */}
          <section>
            <h2 className="text-2xl font-semibold mb-6">Information Sharing</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="font-semibold text-yellow-900 mb-2">We Do NOT Sell Your Personal Information</h3>
              <p className="text-sm text-yellow-800 mb-4">
                We never sell, rent, or trade your personal information to third parties for marketing purposes.
              </p>
              <div className="space-y-2 text-sm text-yellow-800">
                <p><strong>We may share information only in these limited circumstances:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>With sellers/buyers to complete transactions</li>
                  <li>With service providers who help us operate our platform (under strict confidentiality agreements)</li>
                  <li>When required by law or to protect our rights</li>
                  <li>With your explicit consent</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-2xl font-semibold mb-6 flex items-center">
              <Lock className="mr-3 h-6 w-6 text-red-600" />
              Data Security
            </h2>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Security Measures</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• <strong>Encryption:</strong> All data is encrypted in transit and at rest</li>
                    <li>• <strong>Secure Servers:</strong> We use industry-leading cloud infrastructure</li>
                    <li>• <strong>Access Controls:</strong> Limited access to personal information on a need-to-know basis</li>
                    <li>• <strong>Regular Audits:</strong> We regularly review and update our security practices</li>
                    <li>• <strong>Payment Security:</strong> Payment processing handled by PCI-compliant Stripe</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-semibold mb-6">Your Privacy Rights</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Access & Control</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• View and update your personal information</li>
                    <li>• Download your data</li>
                    <li>• Delete your account</li>
                    <li>• Opt out of marketing communications</li>
                    <li>• Request data portability</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Communication Preferences</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Email notifications settings</li>
                    <li>• SMS preferences</li>
                    <li>• Marketing communications</li>
                    <li>• Cookie preferences</li>
                    <li>• Location tracking settings</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>


          {/* Third-Party Services */}
          <section>
            <h2 className="text-2xl font-semibold mb-6">Third-Party Services</h2>
            <Card>
              <CardHeader>
                <CardTitle>Services We Use</CardTitle>
                <CardDescription>We work with trusted partners to provide our services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Stripe (Payment Processing)</h4>
                    <p className="text-sm text-muted-foreground">
                      Handles all payment processing. Your payment information is never stored on our servers.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Google Analytics</h4>
                    <p className="text-sm text-muted-foreground">
                      Helps us understand website usage with anonymized data. You can opt out.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Sanity (Content Management)</h4>
                    <p className="text-sm text-muted-foreground">
                      Stores product information and blog content. No personal data is stored here.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-semibold mb-6">Children's Privacy</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-sm text-blue-800">
                Our platform is not intended for children under 13. We do not knowingly collect personal information from children under 13. 
                If we learn that we have collected personal information from a child under 13, we will delete that information immediately.
              </p>
            </div>
          </section>

          {/* Changes to Policy */}
          <section>
            <h2 className="text-2xl font-semibold mb-6">Changes to This Policy</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  We may update this privacy policy from time to time. We will notify you of any significant changes by email or through our platform. 
                  Your continued use of our services after changes are posted constitutes acceptance of the updated policy.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Contact Information */}
          <section className="bg-slate-50 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <Mail className="mr-3 h-6 w-6 text-blue-600" />
              Contact Us
            </h2>
            <p className="text-muted-foreground mb-4">
              If you have questions about this privacy policy or want to exercise your privacy rights, please contact us.
            </p>
            <div className="space-y-2 text-sm">
              <p><strong>Email:</strong> contact@m4ktaba.com</p>
              <p><strong>Address:</strong> M4KTABA Privacy Team</p>
              <p><strong>Response Time:</strong> We'll respond within 8 hours</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
