# Lekoteka

Aplikacja do zarządzania przyjmowaniem leków i suplementów. Logowanie przez Google, harmonogramy dawkowania, widok dzienny z potwierdzaniem/pomijaniem dawek, śledzenie zapasu opakowań, tryb dostępności i tryb ciemny.

## Stack

- Angular 19 (standalone components, signals)
- Angular Material 19 (theming M3)
- Firebase Auth (logowanie Google) + Firestore
- Dane o lekach: lokalny zbiór wygenerowany z eksportu Rejestru Produktów Leczniczych (RPL), bez zależności od zewnętrznego API w runtime

## Wymagania

- Node.js 22.22+ lub 24.15+ (wymóg najnowszego Angular CLI; przy starszych wersjach Node użyj `@angular/cli@19`, jak w tym projekcie)
- Konto Firebase z włączonym Auth (Google) i Firestore

## Instalacja

```bash
npm install
```

## Konfiguracja Firebase

Wklej dane swojego projektu Firebase do `src/environments/environment.ts` i `environment.prod.ts` (pole `firebase`). Klucze API Firebase są publiczne po stronie klienta — bezpieczeństwo zapewniają reguły Firestore (`firestore.rules` w konsoli Firebase), nie tajność klucza.

Reguły bezpieczeństwa Firestore (Firebase Console → Firestore Database → Rules) muszą ograniczać dostęp do dokumentów wyłącznie do ich właściciela (porównanie `request.auth.uid` z polem `userId`/identyfikatorem dokumentu).

## Uruchomienie lokalne

```bash
npm start
```

Aplikacja dostępna pod `http://localhost:4200/`.

## Build

```bash
npm run build
```

Artefakty trafiają do `dist/lekoteka/browser`.

## Testy

```bash
npm test
```

## Dane o lekach (RPL)

Wyszukiwarka leków działa na lokalnym zbiorze `public/rpl-medications.json`, wygenerowanym ze pliku eksportu rejestru w `data/`. Publiczne API RPL blokuje ruch spoza własnej aplikacji rządowej, więc integracja live nie jest możliwa — stąd podejście ze statycznym zbiorem.

Aby odświeżyć dane (np. nowszym eksportem z rejestrów RPL):

1. Pobierz aktualny plik `.xlsx` z eksportem rejestru i umieść go w `data/`.
2. Zaktualizuj nazwę pliku w `scripts/convert-rpl-dataset.js`, jeśli się zmieniła.
3. Uruchom:

```bash
npm run convert:rpl
```

## Struktura projektu

```
src/app/
├── core/
│   ├── services/    # Auth, Firestore (schedules/doses/settings), wyszukiwarka leków
│   ├── guards/       # authGuard / loginGuard
│   └── models/       # Schedule, Dose
├── features/         # login, today, schedules (+ add-schedule, refill-stock-dialog), settings
└── shared/
    └── components/   # navbar
```

## Deploy

Projekt jest czystą aplikacją statyczną (bez backendu/serverless) — może być hostowany na GitHub Pages, Firebase Hosting, Vercel lub innym hostingu statycznym. Pamiętaj o dodaniu domeny produkcyjnej do Firebase Console → Authentication → Authorized domains.
