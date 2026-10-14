import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage from '@/components/LegalPage';
import { CONTACT } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description:
    'The terms that apply when you browse and order books from Sangit Shree Prakashan, Kanpur.',
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      intro="By using this website and placing an order, you agree to these terms. Please read them together with our Privacy Policy and our Shipping, Cancellation & Returns policy."
      sections={[
        {
          heading: 'About us',
          body: (
            <p>
              This website is run by Sangit Shree Prakashan, a publisher and distributor of Hindustani Classical Music
              books, based at {CONTACT.address}.
            </p>
          ),
        },
        {
          heading: 'Orders and prices',
          body: (
            <>
              <p>All prices are in Indian Rupees (INR). No GST is charged on books, so the price you see is the price you pay.</p>
              <p>
                An order is accepted when we confirm it. We may cancel an order, with a full refund, if a book is
                unavailable or a price was listed in error.
              </p>
            </>
          ),
        },
        {
          heading: 'Payment',
          body: (
            <p>
              Payments are processed securely online by Razorpay. We do not see or store your card, UPI or bank
              details.
            </p>
          ),
        },
        {
          heading: 'Delivery, cancellation and returns',
          body: (
            <p>
              These are set out in our{' '}
              <Link href="/shipping-returns" className="text-gold hover:underline">
                Shipping, Cancellation &amp; Returns
              </Link>{' '}
              policy, which forms part of these terms.
            </p>
          ),
        },
        {
          heading: 'Your account',
          body: (
            <p>
              If you create an account, you are responsible for keeping your phone and sign-in details secure and for
              what happens under your account. Please give us accurate contact and delivery details.
            </p>
          ),
        },
        {
          heading: 'Our content',
          body: (
            <p>
              The books, book covers, text, photographs and design on this site belong to Sangit Shree Prakashan and
              their respective authors. You may not copy, republish or sell them without our written permission.
            </p>
          ),
        },
        {
          heading: 'Acceptable use',
          body: (
            <p>
              Please do not misuse the site: no attempts to break into it, overload it, or place false or fraudulent
              orders.
            </p>
          ),
        },
        {
          heading: 'Limits on our responsibility',
          body: (
            <p>
              We take care to keep the site and its information accurate and available, but we cannot promise it will
              always be free of errors or interruptions. To the extent the law allows, our liability for any order is
              limited to the amount you paid for it.
            </p>
          ),
        },
        {
          heading: 'Governing law',
          body: <p>These terms are governed by the laws of India. Any dispute falls under the courts at Kanpur, Uttar Pradesh.</p>,
        },
        {
          heading: 'Changes and contact',
          body: (
            <p>
              We may update these terms; the date at the top shows the latest version. Questions? Write to{' '}
              <a href={`mailto:${CONTACT.email1}`} className="text-gold hover:underline">{CONTACT.email1}</a> or call{' '}
              {CONTACT.phone1}.
            </p>
          ),
        },
      ]}
    />
  );
}
