export const STRIPE_TEST_PRO_CHECKOUT_URL = 'https://buy.stripe.com/test_00wfZgdHUch25wC98Vao801';

export const previewBilling = {
  mode:'test' as const,
  plan:'VocabFast Pro',
  monthlyPriceEur:19.99,
  checkoutUrl:STRIPE_TEST_PRO_CHECKOUT_URL
};

export function checkoutSucceededInPreview() {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('upgrade') === 'success' && Boolean(params.get('session_id'));
}

export function clearCheckoutQuery() {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.delete('upgrade');
  url.searchParams.delete('session_id');
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}
