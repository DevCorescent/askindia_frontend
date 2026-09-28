import React from 'react';
import { Link } from 'react-router-dom';
import { StaticPageLayout, PageSection } from '../../components/layout/StaticPageLayout';
import { env } from '../../utils/env';

const link = 'font-medium text-brand-600 hover:text-brand-700';

export const TermsAndConditions: React.FC = () => (
  <StaticPageLayout
    title="Terms & Conditions"
    intro={`These terms explain the rules for using ${env.appName}. Please read them before creating an account or placing an order.`}
  >
    <PageSection title="1. Introduction">
      <p>
        {env.appName} (the "platform") is operated by {env.companyName}. By creating an account, browsing the
        platform or placing an order, you agree to these Terms & Conditions. If you do not agree, please do not use
        the platform.
      </p>
    </PageSection>

    <PageSection title="2. Use of the Platform">
      <p>
        {env.appName} is a marketplace that connects customers with independent stores and service providers.
        You may use the platform only for lawful purposes and in line with these terms.
      </p>
      <p>
        You must not misuse the platform — for example by attempting to disrupt it, access it without
        authorisation, or use it to mislead other users.
      </p>
    </PageSection>

    <PageSection title="3. User Accounts">
      <p>
        You are responsible for keeping your account details accurate and your password confidential, and for
        activity that takes place under your account. Let us know promptly if you believe your account has been
        used without your permission.
      </p>
      <p>We may suspend or close accounts that are used in breach of these terms.</p>
    </PageSection>

    <PageSection title="4. Orders and Purchases">
      <p>
        Products and services on {env.appName} are sold by independent stores and service providers. When you
        place an order, the store reviews it and may accept or cancel it — for example, if an item is no longer
        available. You can follow the status of your orders in My Orders.
      </p>
      <p>
        Cancellations and refunds are covered by our{' '}
        <Link to="/refunds" className={link}>Refunds & Cancellations</Link> policy.
      </p>
    </PageSection>

    <PageSection title="5. Payments">
      <p>
        Prices and the available payment methods are shown at checkout. Online payments are processed by a
        third-party payment provider.
      </p>
    </PageSection>

    <PageSection title="6. Product Information">
      <p>
        Product and service descriptions, images and prices are provided by the stores and service providers that
        sell them. We aim to keep information on the platform accurate, but we cannot guarantee that every listing
        is complete or error-free.
      </p>
      <p>Product reviews can only be written by customers who have received the product.</p>
    </PageSection>

    <PageSection title="7. User Responsibilities">
      <p>
        You agree to provide accurate delivery and contact information, to write honest reviews, and not to post
        content that is unlawful, offensive or infringes anyone else's rights.
      </p>
    </PageSection>

    <PageSection title="8. Intellectual Property">
      <p>
        The {env.appName} name, logo and platform content belong to {env.companyName} or its licensors. Content
        supplied by stores and service providers remains theirs. You may not copy or reuse platform content
        without permission.
      </p>
    </PageSection>

    <PageSection title="9. Limitation of Liability">
      <p>
        Stores and service providers are responsible for the products and services they sell. To the extent
        permitted by law, {env.companyName} is not liable for indirect or consequential losses arising from your
        use of the platform.
      </p>
    </PageSection>

    <PageSection title="10. Changes to These Terms">
      <p>
        We may update these terms from time to time. The current version is always available on this page, and
        continuing to use the platform after a change means you accept the updated terms.
      </p>
    </PageSection>

    <PageSection title="11. Contact">
      <p>
        Questions about these terms? Email{' '}
        <a href={`mailto:${env.supportEmail}`} className={`${link} break-all`}>{env.supportEmail}</a> or visit
        our <Link to="/contact" className={link}>Contact Us</Link> page.
      </p>
    </PageSection>
  </StaticPageLayout>
);
