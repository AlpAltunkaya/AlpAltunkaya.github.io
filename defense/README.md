# Defense date poll

A small page where the five examiners mark when they are free for Alp's PhD defense.
It follows the When2meet idea: enter a name, mark free times in 15 minute boxes, and
see everyone's overlap.

- Page: `index.html`, one file, no outside scripts, fonts or images. It sets no cookies
  and stores nothing in the browser.
- Days: Thu 17 Dec 2026, Fri 18 Dec 2026, Tue 5 Jan, Thu 7 Jan, Fri 8 Jan 2027,
  8:00 to 18:00 Munich time. Suggested times 10:00 to 12:00, 13:00 to 15:00,
  14:00 to 16:00, plus a "Whole day" button per day.
- "Everyone" tab: shaded overlap, the times when everyone who answered is free, the
  times when at least 4 are free (the in-person minimum), notes, and a tap on a box shows who is free.
- Answer store: `backend/Code.gs`, a Google Apps Script web app under Alp's Google
  account. It keeps the answers in the Google Sheet "Defense date poll answers" and
  mails Alp on every save.

## Test mode

While `API_URL` in `index.html` is empty, the page runs in test mode: a yellow banner
shows, and answers stay in the open browser tab.

## Connect the answer store (once, about 3 minutes)

1. Open https://script.new while signed in to Google.
2. Replace the sample code with the content of `backend/Code.gs`. Save.
3. Choose the function `setup` and press Run. Allow the access it asks for
   (Google shows "unverified app" for personal scripts: Advanced, then Go to project).
4. Deploy, New deployment, type Web app. Execute as: Me. Who has access: Anyone. Deploy.
5. Copy the Web app URL (it ends in `/exec`) and set it as `API_URL` in `index.html`.

## Change the days

Edit `DAYS` in both `index.html` and `backend/Code.gs`, and redeploy the script
(Deploy, Manage deployments, Edit, New version) so the URL stays the same.
