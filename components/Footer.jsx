import Link from 'next/link';
import { Facebook, Instagram, Twitter } from 'lucide-react';
import SubscribeForm from '@/components/SubscribeForm';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const footerLinks = [
  {
    title: 'Product',
    links: [
      { href: '/all', label: 'All Books' },
      { href: '/honey', label: 'Honey' },
      { href: '/blog', label: 'Blog' },
      { href: '/sell', label: 'Sell' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About' },
      { href: '/contact', label: 'Contact' },
      { href: '/terms', label: 'Terms' },
      { href: '/privacy', label: 'Privacy' },
    ],
  },
  {
    title: 'Support',
    links: [
      { href: '/faq', label: 'FAQ' },
      { href: '/shipping', label: 'Shipping' },
      { href: '/returns', label: 'Returns' },
      { href: '/track', label: 'Track Order' },
    ],
  },
];

const socialLinks = [
  {
    name: 'Facebook',
    href: 'https://facebook.com/m4ktaba',
    icon: Facebook,
  },
  {
    name: 'Instagram',
    href: 'https://instagram.com/m4ktaba',
    icon: Instagram,
  },
  {
    name: 'Twitter',
    href: 'https://x.com/M4KTABA',
    icon: Twitter,
  },
];

export default function Footer() {
  return (
    <footer className='w-full border-t bg-background'>
      {/* Newsletter Section */}
      <section className='container mx-auto px-4 py-16'>
        <div className='mx-auto max-w-3xl text-center'>
          <h2 className='mb-4 text-3xl font-bold tracking-tight'>
            Join our newsletter
          </h2>
          <p className='mb-8 text-lg text-muted-foreground'>
            Stay up to date with the latest products, announcements, and blog
            posts.
          </p>
          <div className='mx-auto max-w-md'>
            <SubscribeForm />
          </div>
        </div>
      </section>

      <Separator />

      {/* Main Footer */}
      <section className='container mx-auto px-4 py-12'>
        <div className='grid gap-12 md:grid-cols-2 lg:grid-cols-[1.5fr,1fr,1fr,1fr]'>
          {/* Brand Section */}
          <div className='space-y-4'>
            <Link href='/' className='text-2xl font-bold tracking-tight'>
              M4KTABA
            </Link>
            <p className='text-muted-foreground'>
              Find great Islamic books quickly and easily, all in one place.
            </p>
            <div className='flex gap-4'>
              {socialLinks.map(social => (
                <Button
                  key={social.name}
                  variant='ghost'
                  size='icon'
                  className='hover:text-primary'
                  asChild
                >
                  <Link href={social.href}>
                    <social.icon className='h-5 w-5' />
                    <span className='sr-only'>{social.name}</span>
                  </Link>
                </Button>
              ))}
            </div>
          </div>

          {/* Links Sections */}
          {footerLinks.map(section => (
            <div key={section.title} className='space-y-4'>
              <h3 className='text-sm font-semibold uppercase tracking-wider'>
                {section.title}
              </h3>
              <ul className='space-y-3'>
                {section.links.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className='text-muted-foreground transition-colors hover:text-foreground'
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Bar */}
      <section className='border-t bg-muted/50'>
        <div className='container mx-auto flex flex-col gap-4 px-4 py-6 text-center text-sm text-muted-foreground sm:flex-row sm:justify-between sm:text-left'>
          <p>© {new Date().getFullYear()} M4KTABA. All rights reserved.</p>
          <div className='flex justify-center gap-8 sm:justify-end'>
            <Link
              href='/terms'
              className='transition-colors hover:text-foreground'
            >
              Terms
            </Link>
            <Link
              href='/privacy'
              className='transition-colors hover:text-foreground'
            >
              Privacy
            </Link>
            <Link
              href='/cookies'
              className='transition-colors hover:text-foreground'
            >
              Cookies
            </Link>
          </div>
        </div>
      </section>
    </footer>
  );
}
