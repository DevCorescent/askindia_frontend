import React from 'react';
import { Link } from 'react-router-dom';
import { StaticPageLayout, PageSection } from '../../components/layout/StaticPageLayout';
import { env } from '../../utils/env';

const link = 'font-medium text-brand-600 hover:text-brand-700';

export const RefundsPolicy: React.FC = () => (
  <StaticPageLayout
    title="Refunds & Cancellations"
    intro={`Orders on ${env.appName} are fulfilled by independent stores. This page explains how cancellations and refunds work.`}
  >
    <PageSection title="Order cancellation">
      <p>
        A store may cancel an order it cannot fulfil — for example, if an item is out of stock. When that happens,
        the order is marked Cancelled in My Orders and the reason is shown in its tracking details.
      </p>
      <p>If you need to cancel an order yourself, please contact support with your order ID.</p>
    </PageSection>

    <PageSection title="Cancellation before processing">
      <p>
        While an order still shows as Order Placed, it has not yet been accepted by the store. Contact support as
        soon as possible and we will work with the store to cancel it where possible.
      </p>
    </PageSection>

    <PageSection title="Cancellation after processing or shipping">
      <p>
        Once an order has been accepted or dispatched, it may no longer be possible to cancel it. Contact support
        and we will review your request with the store.
      </p>
    </PageSection>

    <PageSection title="Refund eligibility">
      <p>
        Whether a refund applies depends on the order's status, how it was paid for and the circumstances — for
        example, an order cancelled before delivery, or an item that arrived damaged or incorrect. Each request is
        reviewed individually.
      </p>
      <p>Cash on Delivery orders cancelled before delivery have not been charged, so no refund is needed.</p>
    </PageSection>

    <PageSection title="Refund processing">
      <p>
        When a refund is approved, we will confirm how it will be made. How long it takes to reach you can depend
        on your bank or payment provider.
      </p>
    </PageSection>

    <PageSection title="Failed or cancelled payments">
      <p>
        If an online payment fails, or you were charged for an order that was later cancelled, contact support with
        your order ID and payment details so we can check it and arrange a refund if one is due.
      </p>
    </PageSection>

    <PageSection title="Damaged or wrong products">
      <p>
        If you receive an item that is damaged, defective or not what you ordered, contact support as soon as
        possible with your order ID, a short description and photos of the item. We will review it with the store
        and let you know the outcome.
      </p>
    </PageSection>

    <PageSection title="How to contact support">
      <p>
        Email{' '}
        <a href={`mailto:${env.supportEmail}`} className={`${link} break-all`}>{env.supportEmail}</a> with your
        order ID, or see our <Link to="/contact" className={link}>Contact Us</Link> page. Our{' '}
        <Link to="/terms" className={link}>Terms & Conditions</Link> also apply to all orders.
      </p>
    </PageSection>
  </StaticPageLayout>
);
