# KEYBOARD WARRIOR // Koło Naukowe Informatyków (KNI)

> **"Mniej klikania. Więcej kodowania."**

**KEYBOARD WARRIOR** to dynamiczna gra zręcznościowa typu *arcade* sprawdzająca szybkość i dokładność pisania na klawiaturze, zaprojektowana specjalnie na **Dzień Otwarty** stoiska **Koła Naukowego Informatyków (KNI)**.

Aplikacja łączy estetykę cyberpunkowego terminala z natychmiastową dostępnością dla odwiedzających — w tym osób, które nigdy wcześniej nie pisały kodu.

---

## 1. Główne funkcje (Features)

- **Pełna ścieżka gracza (4 ekrany + pełny ranking)**:
  - **Ekran A (Home Arcade)**: Branding KNI, status systemu `SYSTEM ONLINE`, statystyki wydarzenia na żywo, podgląd podium **TOP WARRIORS (Top 3)** oraz przycisk `START CHALLENGE`.
  - **Ekran B (Player Setup)**: Szybka konfiguracja w mniej niż 10 sekund — walidacja nicku (1–16 znaków, odrzucanie znaków sterujących), losowe propozycje nicków jednym kliknięciem, wybór jednego z 3 trybów gry oraz czasu (`30s` domyślnie lub `60s`).
  - **Ekran C (Active Game)**: Licznik czasu uruchamiany dopiero w momencie wpisania **pierwszego znaku**, podświetlanie poprawnych znaków (neonowa zieleń), czytelne oznaczanie błędów (czerwone tło + podkreślenie), naturalna obsługa klawisza `Backspace` z przeliczaniem celności na żywo, automatyczne ładowanie kolejnego tekstu po ukończeniu bieżącego bez resetowania zegara.
  - **Ekran D (Results)**: Prezentacja wyniku punktowego (`PKT`), prędkości (`WPM`), celności (`%`), liczby błędów, porównania z aktualnym liderem `#1`, odznaki rekordu osobistego (`NOWY REKORD OSOBISTY`) oraz szybkie akcje: `ZAGRAJ PONOWNIE` (ten sam gracz) lub `NASTĘPNY GRACZ` (czyszczenie nicku dla kolejnego uczestnika przy stoisku).
- **Trzy zróżnicowane tryby gry**:
  1. `EASY MODE` — przystępny tekst w języku polskim z polskimi znakami diakrytycznymi, niewymagający wiedzy programistycznej.
  2. `HACKER MODE` — komunikaty ze świata sieci, cyberbezpieczeństwa i technologii łączące język polski z popularnymi terminami IT.
  3. `CODE MODE` — wyzwanie dla chętnych: krótkie, poprawne składniowo fragmenty kodu JavaScript / TypeScript z nawiasami, operatorami i średnikami (bez wykonywania kodu przez `eval`).
- **System punktacji i Leaderboard**:
  - Wzór na wynik: `Score = round(WPM * (Accuracy / 100)^2 * 100)`.
  - Tie-breakery: `Score DESC -> Accuracy DESC -> WPM DESC -> Errors ASC -> Timestamp ASC`.
  - Filtrowanie tabeli według trybu (`WSZYSTKIE`, `EASY`, `HACKER`, `CODE`) oraz czasu trwania (`WSZYSTKIE`, `30s`, `60s`).
- **Tryb Kiosku i Narzędzia Organizatora (`Ctrl+Shift+O`)**:
  - Przycisk `KIOSK` w nagłówku przełącza aplikację w pełnoekranowy widok stoiskowy.
  - Panel organizatora (`Ctrl+Shift+O` lub link w stopce) pozwala załadować wyraźnie oznaczone rekordy `[DEMO]`, przełączać ich widoczność (domyślnie ukryte w oficjalnym rankingu) oraz wykonać bezpieczny, dwuetapowy reset wszystkich wyników (wymaga wpisania słowa `RESET`).

---

## 2. Stos technologiczny (Tech Stack)

- **Frontend**: React 19 + TypeScript + Vite
- **Stylizacja**: Czysty, modularny CSS z efektem siatki taktycznej, linii skanowania CRT i obsługą `prefers-reduced-motion`
- **Backend / Persystencja**:
  - Wbudowane middleware API (`/api/scores`, `/api/scores/demo`, `/api/scores/reset`) oraz samodzielny serwer produkcyjny Node.js (`server/prod-server.mjs`).
  - Silnik bazy danych wykorzystujący wbudowany w Node.js moduł `node:sqlite` (`data/leaderboard.sqlite`) z automatyczną kopią lustrzaną JSON (`data/leaderboard.json`) oraz synchronizacją po stronie klienta (`localStorage` + pamięć podręczna `memory-fallback`).
- **Testy automatyczne**: Vitest + React Testing Library + JSDOM

---

## 3. Wymagania wstępne (Prerequisites)

- **Node.js**: zalecana wersja `>= 20.x` (w wersji Node `>= 22.5` / `24.x` automatycznie aktywuje się natywny silnik `node:sqlite` bez potrzeby kompilacji paczek C++).
- **npm**: wersja `>= 10.x`.

---

## 4. Instalacja i uruchomienie (Installation & Startup)

W katalogu projektu wykonaj:

```bash
# 1. Instalacja zależności
npm install

# 2. Uruchomienie serwera deweloperskiego (z aktywnym API SQLite/JSON)
npm run dev
```

Aplikacja będzie dostępna pod adresem wyświetlanym w terminalu (domyślnie `http://localhost:5173`).

---

## 5. Testy i budowanie wersji produkcyjnej (Testing & Production Build)

```bash
# Uruchomienie wszystkich testów automatycznych (Vitest)
npm test

# Zbudowanie zoptymalizowanej paczki produkcyjnej (TypeScript check + Vite build)
npm run build

# Uruchomienie serwera produkcyjnego obsługującego pliki statyczne z dist/ oraz /api/*
npm start
```

Po uruchomieniu `npm start` serwer produkcyjny działa pod adresem `http://localhost:4173`.

---

## 6. Jak działa zapis wyników (Leaderboard Persistence)

Aplikacja stosuje wielowarstwową architekturę zapisu danych (`HybridLeaderboardStorage` w `src/services/storage.ts` oraz `LeaderboardDatabase` w `server/db.mjs`):

1. **Zapis na serwerze (`data/leaderboard.sqlite` oraz `data/leaderboard.json`)**:
   - Każdy ukończony bieg jest walidowany zarówno po stronie klienta, jak i serwera (`validateScorePayload`) i zapisywany w bazie SQLite oraz pliku JSON na dysku komputera obsługującego stoisko.
   - Przetrwa odświeżenie karty, zamknięcie przeglądarki oraz restart serwera aplikacji.
2. **Zapis w przeglądarce (`localStorage` pod kluczem `kw_leaderboard_v1`)**:
   - Działa jako natychmiastowy bufor oraz tryb awaryjny (*offline fallback*). Jeśli aplikacja zostanie otwarta jako czysto statyczna strona bez serwera Node, wyniki są zapisywane w `localStorage` danej przeglądarki.
   - Przy ponownym połączeniu z serwerem lokalne wyniki są automatycznie synchronizowane z bazą serwera.
3. **Ochrona przed duplikatami**:
   - Każda rozgrywka otrzymuje unikalny identyfikator sesji (`sessionId`). Próba wielokrotnego wysłania tego samego wyniku jest odrzucana zarówno przez serwis kliencki, jak i klucz główny `PRIMARY KEY` w bazie danych.

---

## 7. Konfiguracja na wydarzenie i sieć lokalną (Event & Shared LAN Setup)

### Pojedynczy komputer na stoisku (zalecane)
1. Uruchom aplikację poleceniem `npm run dev` lub po zbudowaniu `npm run build && npm start`.
2. Kliknij przycisk **`KIOSK`** w prawym górnym rogu (lub naciśnij `F11` w przeglądarce), aby przejść w tryb pełnoekranowy.
3. Po każdym uczestniku kliknij **`NASTĘPNY GRACZ`** na ekranie wyników — poprzedni nick zostanie wyczyszczony, a kolejna osoba od razu może wpisać swój nick.

### Wspólny ranking dla wielu komputerów w tej samej sieci Wi-Fi / LAN
Dzięki wbudowanemu serwerowi HTTP + SQLite możesz udostępnić grę i wspólny ranking na kilku laptopach w sieci lokalnej stoiska:
1. Na głównym komputerze-hoście uruchom:
   ```bash
   npm run host
   ```
   *(lub produkcyjnie: `npm run build && npm start` — serwer nasłuchuje na `0.0.0.0:4173`)*.
2. Odczytaj lokalny adres IP komputera-hosta (np. `192.168.1.50`).
3. Na pozostałych komputerach oraz na dużym ekranie prezentującym Leaderboard otwórz w przeglądarce adres `http://192.168.1.50:5173` (lub `:4173`). Wszystkie stanowiska będą zapisywać i odczytywać wyniki ze wspólnej bazy na komputerze-hoście.

---

## 8. Bezpieczne czyszczenie danych i tryb DEMO (Organizer Utilities)

1. Na ekranie głównym lub w rankingu naciśnij skrót klawiszowy **`Ctrl + Shift + O`** (lub kliknij dyskretny przycisk `[PANEL ORGANIZATORA // CTRL+SHIFT+O]` w stopce).
2. **Dane DEMO**:
   - Kliknij `ZAŁADUJ REKORDY DEMO`, aby wypełnić tabelę przykładowymi wynikami na czas prezentacji stoiska przed pierwszymi gośćmi.
   - Rekordy demonstracyjne posiadają znacznik `DEMO` i można je w każdej chwili ukryć (`UKRYJ REKORDY DEMO`) lub usunąć (`USUŃ REKORDY DEMO`) bez naruszania prawdziwych wyników odwiedzających.
3. **Pełny reset wydarzenia**:
   - Kliknij `RESETUJ WSZYSTKIE WYNIKI...`, wpisz słowo `RESET` w polu potwierdzenia i zatwierdź przyciskiem `POTWIERDŹ TRWAŁY RESET`.

---

## 9. Znane ograniczenia (Known Limitations)

- W przypadku uruchomienia samych plików statycznych (bez procesu Node.js `npm run dev` / `npm start`), zapis opiera się wyłącznie na `localStorage`, co oznacza, że wyniki są wówczas widoczne tylko w obrębie tego samego profilu przeglądarki na jednym urządzeniu.
- Porównywanie znaków we wszystkich trybach jest ścisłe (`1:1`, z uwzględnieniem wielkości liter oraz polskich znaków diakrytycznych), aby zachować uczciwe i jednoznaczne zasady rywalizacji.
