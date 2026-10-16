import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';
import { CONTACT } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Shipping, Cancellation & Returns',
  description:
    'Delivery time and charges, how to cancel an order, and our policy on damaged or wrong books at Sangit Shree Prakashan.',
};

export default function ShippingReturnsPage() {
  return (
    <LegalPage
      title="Shipping, Cancellation & Returns"
      intro="How we deliver your books, when you can cancel an order, and what we do if a book arrives damaged or is not the one you ordered."
      sections={[
        {
          heading: 'Shipping and delivery',
          body: (
            <>
              <p>
                <strong className="text-cream/80">Shipping is free</strong> on all orders within India.
              </p>
              <p>
                Orders usually reach you in about <strong className="text-cream/80">7 days</strong> from the day you
                order. This is an estimate, not a guarantee. Courier delays, public holidays and remote locations can
                add time.
              </p>
              <p>
                When your order ships, we send you the courier name and tracking ID by WhatsApp and email. Please make
                sure your phone number and address are correct when you order.
              </p>
            </>
          ),
        },
        {
          heading: 'Cancelling an order',
          body: (
            <>
              <p>
                You can cancel an order <strong className="text-cream/80">before it ships</strong>. Call or WhatsApp
                us on {CONTACT.phone1} (or email {CONTACT.email1}) with your order ID. We will cancel it and refund the
                full amount to the payment method you used.
              </p>
              <p>Once an order has shipped it can no longer be cancelled. See &ldquo;Returns&rdquo; below.</p>
            </>
          ),
        },
        {
          heading: 'Returns and replacements',
          body: (
            <>
              <p>
                We accept returns <strong className="text-cream/80">only if a book arrives damaged or is not the book
                you ordered</strong>. We do not accept returns for a change of mind.
              </p>
              <p>To report a problem:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Contact us within 7 days of delivery with your order ID.</li>
                <li>Send a clear photo of the book and the parcel by WhatsApp or email.</li>
                <li>We will arrange a replacement, or a refund if a replacement is not possible.</li>
              </ul>
            </>
          ),
        },
        {
          heading: 'Refunds',
          body: (
            <p>
              Approved refunds go back to the original payment method. They usually appear within 5&ndash;7 working
              days, depending on your bank.
            </p>
          ),
        },
        {
          heading: 'Contact',
          body: (
            <p>
              Sangit Shree Prakashan, {CONTACT.address}.<br />
              Phone / WhatsApp: {CONTACT.phone1} ·{' '}
              <a href={`mailto:${CONTACT.email1}`} className="text-gold hover:underline">{CONTACT.email1}</a>
            </p>
          ),
        },
      ]}
    />
  );
}
