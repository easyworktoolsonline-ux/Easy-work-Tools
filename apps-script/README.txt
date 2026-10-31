EasyWorkTools.online feedback backend

1. Open script.google.com and create a standalone Apps Script project.
2. Paste Code.gs into the project.
3. Deploy > New deployment > Web app.
4. Execute as: Me.
5. Who has access: Anyone.
6. Copy the resulting /exec URL.
7. Put that URL in assets/feedback-config.js as EWT_APPS_SCRIPT_URL.

The web app receives POST data and sends the request to info@easyworktools.online using the Google account that owns the script.

----------------------------------------------------------------------
Turnstile (bot protection) - optional
----------------------------------------------------------------------
1. Cloudflare dashboard > Turnstile > Add widget. Hostname: easyworktools.online. Widget mode: Managed.
2. Put the SITE KEY in assets/feedback-config.js (window.EWT_TURNSTILE_SITE_KEY) and redeploy the site.
3. In the Apps Script editor: Project Settings > Script properties > Add property
   TURNSTILE_SECRET = the SECRET key. Paste the updated Code.gs and create a NEW deployment version.
Until TURNSTILE_SECRET exists, the script does not check tokens. Once it exists, a missing or invalid token is rejected.
