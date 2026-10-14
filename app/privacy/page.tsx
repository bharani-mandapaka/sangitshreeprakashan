import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';
import { CONTACT } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How Sangit Shree Prakashan collects, uses and protects your personal information when you browse and order from our website.',
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="This policy explains what personal information Sangit Shree Prakashan (Kanpur, Uttar Pradesh) collects through this website, why we collect it, and the choices you have."
      sections={[
        {
          heading: 'Information we collect',
          body: (
            <>
              <p>
                <strong className="text-cream/80">When you place an order:</strong> your name, email address, phone
                number, delivery address, and the books you ordered.
              </p>
              <p>
                <strong className="text-cream/80">When you create an account:</strong> your phone number (and the
                optional email you add), or the name and email shared by your Google account if you sign in with
                Google. We also store the books you save to your wishlist and your order history.
              </p>
              <p>
                <strong className="text-cream/80">On your device:</strong> your cart and basic usage counts (such as
                page visits) are kept in your browser&rsquo;s local storage so the site works as expected.
              </p>
            </>
          ),
        },
        {
          heading: 'How we use it',
          body: (
            <ul className="list-disc pl-5 space-y-1.5">
              <li>To process, deliver and support your order.</li>
              <li>To send order updates (confirmed, shipped, delivered) by email and WhatsApp.</li>
              <li>To send you a one-time code when you sign in with your phone number.</li>
              <li>To keep our records, prevent misuse and meet legal obligations.</li>
            </ul>
          ),
        },
        {
          heading: 'Who we share it with',
          body: (
            <>
              <p>We do not sell your personal information. We share only what is needed with the services that run the site:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Razorpay, to take payment securely (we never see or store your card details).</li>
                <li>Supabase, which hosts our database and sign-in.</li>
                <li>Resend, which delivers our emails.</li>
                <li>Meta (WhatsApp Business), which delivers WhatsApp messages and sign-in codes.</li>
                <li>Google, if you choose to sign in with Google.</li>
                <li>Our courier partner, who receives your name, phone number and address to deliver your order.</li>
                <li>Vercel, which hosts the website.</li>
              </ul>
              <p>We may also disclose information when the law requires it.</p>
            </>
          ),
        },
        {
          heading: 'How long we keep it',
          body: (
            <p>
              We keep order records for as long as needed to support you and meet our accounting and legal duties.
              Sign-in codes expire after 15 minutes.
            </p>
          ),
        },
        {
          heading: 'Your choices',
          body: (
            <p>
              You can ask us to show, correct or delete the personal information we hold about you by writing to{' '}
              <a href={`mailto:${CONTACT.email1}`} className="text-gold hover:underline">{CONTACT.email1}</a>, or by
              calling or messaging {CONTACT.phone1}. Some order records may have to be kept for legal reasons. To
              stop WhatsApp updates, tell us and we will switch them off.
            </p>
          ),
        },
        {
          heading: 'Security',
          body: (
            <p>
              We use reputable services and access controls to protect your information, but no website can promise
              perfect security. Please keep your own login details private.
            </p>
          ),
        },
        {
          heading: 'Changes to this policy',
          body: <p>We may update this policy from time to time. The date at the top shows when it last changed.</p>,
        },
        {
          heading: 'Contact',
          body: (
            <p>
              Sangit Shree Prakashan, {CONTACT.address}.<br />
              Email: <a href={`mailto:${CONTACT.email1}`} className="text-gold hover:underline">{CONTACT.email1}</a> ·
              Phone: {CONTACT.phone1}
            </p>
          ),
        },
      ]}
    />
  );
}
