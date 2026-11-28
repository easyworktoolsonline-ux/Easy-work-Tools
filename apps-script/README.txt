EasyWorkTools.online feedback backend

Deployment (owner only)
1. Open script.google.com with the Google account that owns the feedback script.
2. Paste Code.gs into the project and save it.
3. Deploy > New deployment > Web app.
4. Execute as: Me.
5. Who has access: Anyone.
   Google Web Apps add a permissive CORS header that this source cannot change,
   so the browser must never call this URL directly.

Current owner-authorized configuration (2026-11-27)
- A new Apps Script project named "EasyWorkTools Feedback Backend" was created
  in the currently authenticated Google account. No previous unknown project
  or account was recovered or used.
- Code.gs was pasted into that project, saved, and doPost was selected as the
  Web App entry point.
- The Web App was deployed to run as Me with access set to Anyone.
- The deployment /exec URL was read only into the automation session and saved
  as a Cloudflare Pages secret. It is not in source control or reports.
- Script Properties were saved under the two names listed below. Their values
  are deliberately not recorded here or anywhere in the repository.

Script Properties (Project Settings > Script properties)
- FEEDBACK_PROXY_TOKEN: a long, random, high-entropy token shared only with the
  Cloudflare Pages Function. Do not put it in code, public config or Git.
- FEEDBACK_RECIPIENT_EMAIL: the delivery address. It is deliberately not stored
  in Code.gs. Do not paste either value into chat or reports.

Do NOT add TURNSTILE_SECRET here. Turnstile is verified by the Pages Function
before the request reaches Apps Script. A Turnstile token is single-use, so
verifying it twice would reject legitimate submissions.

Cloudflare Pages secrets (dashboard > Pages > project > Settings > Environment variables)
- APPS_SCRIPT_WEBAPP_URL: the deployed /exec URL. Server-side only.
- FEEDBACK_PROXY_TOKEN: the same value as the Script Property above.
- TURNSTILE_SECRET: the Turnstile secret key. Server-side only.

All three production secrets were verified by name/label only. Cloudflare warns
that secret changes take effect on the next deployment; website code has not
been committed, published or deployed, so the live site still serves the old
client and configuration.

Public client config (assets/feedback-config.js)
- EWT_FEEDBACK_ENDPOINT is '/api/feedback'. No Apps Script URL belongs here.
- EWT_TURNSTILE_SITE_KEY is public by design. It must be set together with the
  TURNSTILE_SECRET Pages secret. Until both are configured, submissions fail
  closed with a generic error instead of being silently accepted.

After changing Code.gs, create a new Web App deployment version and update
APPS_SCRIPT_WEBAPP_URL if the /exec URL changes.
