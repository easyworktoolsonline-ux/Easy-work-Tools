EasyWorkTools.online feedback backend

1. Open script.google.com and create a standalone Apps Script project.
2. Paste Code.gs into the project.
3. Deploy > New deployment > Web app.
4. Execute as: Me.
5. Who has access: Anyone.
6. Copy the resulting /exec URL.
7. Put that URL in assets/feedback-config.js as EWT_APPS_SCRIPT_URL.

The web app receives POST data and sends the request to EasyWorkTools.online@gmail.com using the Google account that owns the script.
