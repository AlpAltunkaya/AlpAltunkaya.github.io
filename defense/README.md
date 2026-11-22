# Defense date poll

A small page where the five examiners mark when they are free for Alp's PhD defense.
It follows the When2meet idea: enter a name, mark free times in 15 minute boxes, and
see everyone's overlap.

- Page: `index.html`, one file, no outside scripts, fonts or images. It sets no cookies
  and stores nothing in the browser.
- Days: Thu 17 Dec 2026, Fri 18 Dec 2026, Tue 5 Jan, Thu 7 Jan, Fri 8 Jan 2027,
  8:00 to 18:00 Munich time, one row per day. Tap "All day", 10 to 12, 13 to 15 or
  14 to 16, or drag along the row for exact times.
- "Everyone's times" stays hidden until the person has saved, or has loaded a saved
  answer by name. It lists first every time, however short, that everyone who
  answered can attend, one line per day. Once five have answered, a second list gives
  the times that exactly 4 of the 5 can attend. It repeats no time of the first list,
  and starts a new time where the group of four changes. A colour row per day follows:
  four blue steps for 1, 2, 3 and 4 people, and orange for everyone who answered.
  The rows show no numbers. A tap on a block names who can attend. With more than
  5 names it lists no time and asks for a check for a double entry.
- The page is always light, also on a device in dark mode.
- Hiding the section is not access control: the answer store is readable by anyone
  with the link, and the name field offers the saved names.
- The same name loads and changes an earlier answer. Before a save the page reads the
  store again, so an older tab does not replace a newer answer.
- Answer store: `backend/Code.gs`, a Google Apps Script web app under Alp's Google
  account. It keeps the answers in the Google Sheet "Defense date poll answers" and
  mails Alp on every save.

## Test mode

While `API_URL` in `index.html` is empty, the page runs in test mode: a notice
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
