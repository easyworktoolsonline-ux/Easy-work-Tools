/* Public, non-secret configuration for the homepage feedback form.
 *
 * The Apps Script Web App URL is intentionally NOT exposed here. The browser
 * posts to the same-origin /api/feedback Pages Function instead. The owner must
 * configure these server-side secrets in Cloudflare Pages:
 *   APPS_SCRIPT_WEBAPP_URL  - the deployed Apps Script Web App URL
 *   FEEDBACK_PROXY_TOKEN    - a high-entropy token shared with Apps Script
 *   TURNSTILE_SECRET        - the Cloudflare Turnstile secret key
 * Never place those values in this file, any public bundle, or Git.
 *
 * Turnstile SITE KEY is public by design. Leave it empty only while the owner
 * has not created a Turnstile widget for this hostname; the server function
 * fails closed until TURNSTILE_SECRET is configured, so an empty site key means
 * the form will not successfully submit until both sides are configured.
 */
window.EWT_FEEDBACK_ENDPOINT = '/api/feedback';
window.EWT_TURNSTILE_SITE_KEY = '0x4AAAAAAGOj057AwPtPxc89';
