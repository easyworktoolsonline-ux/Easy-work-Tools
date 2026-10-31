window.EWT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzoi7XUZumPl662BnD0edDZuK5s_5EJ-R8ZKWilPv9Wtg_v3qh_wQ7llEWEe1iryHN_/exec';

/* Cloudflare Turnstile (bot protection for the Help & Feedback form).
   Leave empty to keep the form exactly as it is. To turn it on:
     1. Cloudflare dashboard > Turnstile > Add widget > hostname easyworktools.online, mode Managed.
     2. Paste the SITE KEY (public) between the quotes below.
     3. In the Apps Script project: Project Settings > Script properties > add TURNSTILE_SECRET = the SECRET key.
        Until that property exists the script accepts submissions without checking the token. */
window.EWT_TURNSTILE_SITE_KEY = '';
