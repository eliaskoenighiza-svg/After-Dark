# After[Dark – ALL-IN-ONE (Stand V4.2)

Diese Ausgabe bündelt den gesamten bisherigen Stand in **einem Projektordner**.

Enthalten sind die vollständige Expo/React-Native-App, Google Maps, Supabase-Anbindung, Crew-Erstellung, Crew-Codes, Live-Spots, Cloud-Bestenliste, KI-Proxy sowie alle bislang benötigten SQL-Skripte.

## Einmalige Einrichtung

Unter Windows kannst du `ERSTE_EINRICHTUNG.bat` starten. Das Script fragt nur nach:

- Supabase Project URL
- Supabase Publishable Key

und erzeugt daraus lokal die `.env`.

Keine geheimen Server-Schlüssel in `.env` eintragen.

## Start

- `START_AFTER_DARK.bat` – App
- `START_AI_PROXY.bat` – lokale KI für den Android-Emulator

## Supabase

Die bisherigen SQL-Dateien befinden sich unter `supabase/`:

- `01_basis_profile_crews.sql`
- `02_crew_live_spots.sql`
- `03_crew_leaderboard.sql`

Wenn sie in deinem bestehenden After[Dark-Supabase-Projekt bereits erfolgreich ausgeführt wurden, nicht erneut ausführen.

## Ab jetzt

Neue Funktionen sollten jeweils in diesem **Master-Projekt** weitergeführt werden, statt einzelne Patch-Dateien zu verteilen.
