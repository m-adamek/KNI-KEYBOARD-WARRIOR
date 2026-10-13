import { GameMode, ModeMetadata, PassageItem } from '../types/game';

export const MODE_METADATA: Record<GameMode, ModeMetadata> = {
  EASY: {
    id: 'EASY',
    label: 'EASY MODE',
    polishTitle: 'Start dla każdego',
    badge: 'POZIOM 01 // STANDARD',
    description:
      'Przystępne polskie zdania z codziennym słownictwem. Idealny wybór na rozgrzewkę — nie wymaga żadnej wiedzy o programowaniu.',
    instructions:
      'Przepisuj dokładnie wyświetlony tekst w języku polskim, pamiętając o wielkich literach, kropkach i polskich znakach (ą, ę, ś, ć, ż, ź, ó, ł, ń).',
    difficulty: 'ŁATWY',
    caseRuleNote: 'Rozróżnia wielkość liter oraz polskie znaki diakrytyczne (1:1).',
    accentColor: 'green',
  },
  HACKER: {
    id: 'HACKER',
    label: 'HACKER MODE',
    polishTitle: 'Cybernetyczny terminal',
    badge: 'POZIOM 02 // CYBERSEC',
    description:
      'Tekst o komputerach, sieciach i cyberbezpieczeństwie. Połączenie języka polskiego oraz popularnych angielskich pojęć ze świata IT.',
    instructions:
      'Wprowadzaj komunikaty systemowe i żargon technologiczny. Uważaj na angielskie terminy techniczne, liczby oraz znaki przestankowe.',
    difficulty: 'ŚREDNI',
    caseRuleNote: 'Rozróżnia wielkość liter, liczby i znaki interpunkcyjne (1:1).',
    accentColor: 'cyan',
  },
  CODE: {
    id: 'CODE',
    label: 'CODE MODE',
    polishTitle: 'Wyzwanie programisty',
    badge: 'POZIOM 03 // DEV CHALLENGE',
    description:
      'Wyzwanie dla osób, które chcą spróbować pisania prawdziwego kodu! Krótkie fragmenty JavaScript i TypeScript pełne nawiasów, średników i operatorów.',
    instructions:
      'Wpisuj składnię kodu znak po znaku. Zwróć szczególną uwagę na nawiasy (), {}, [], operatory ===, => oraz średniki.',
    difficulty: 'TRUDNY (KOD)',
    caseRuleNote: 'Ścisłe porównanie znaków (case-sensitive) wraz z symbolami składni JS/TS.',
    accentColor: 'amber',
  },
};

export const PASSAGES: Record<GameMode, PassageItem[]> = {
  EASY: [
    {
      id: 'easy-1',
      mode: 'EASY',
      text: 'Każdy wielki projekt zaczyna się od małego pomysłu. Dzisiaj możesz sprawdzić, jak szybko potrafisz pisać!',
    },
    {
      id: 'easy-2',
      mode: 'EASY',
      text: 'Studia informatyczne to nie tylko nauka kodowania, ale przede wszystkim wspólne tworzenie ciekawych projektów.',
    },
    {
      id: 'easy-3',
      mode: 'EASY',
      text: 'Szybkie pisanie na klawiaturze przydaje się każdego dnia, niezależnie od tego, jaki kierunek studiów wybierzesz.',
    },
    {
      id: 'easy-4',
      mode: 'EASY',
      text: 'W kole naukowym rozwijamy pasje, budujemy aplikacje i pomagamy sobie nawzajem w zdobywaniu nowej wiedzy.',
    },
    {
      id: 'easy-5',
      mode: 'EASY',
      text: 'Dobra kawa, wygodna klawiatura i zgrany zespół to najlepszy przepis na udany dzień pełen wyzwań.',
    },
    {
      id: 'easy-6',
      mode: 'EASY',
      text: 'Technologia zmienia świat wokół nas, a najlepsze rozwiązania powstają wtedy, gdy łączymy wiedzę z wyobraźnią.',
    },
    {
      id: 'easy-7',
      mode: 'EASY',
      text: 'Skup się na rytmie pisania, patrz na ekran i postaraj się popełniać jak najmniej błędów w każdym zdaniu.',
    },
    {
      id: 'easy-8',
      mode: 'EASY',
      text: 'Dzień otwarty na uczelni to świetna okazja, aby porozmawiać ze studentami i zobaczyć nowoczesne laboratoria.',
    },
    {
      id: 'easy-9',
      mode: 'EASY',
      text: 'Nawet najtrudniejszy problem staje się prostszy, kiedy podzielimy go na kilka mniejszych kroków do wykonania.',
    },
    {
      id: 'easy-10',
      mode: 'EASY',
      text: 'Precyzja jest równie ważna jak prędkość. Utrzymuj wysoką celność, aby zdobyć dodatkowe punkty w rankingu!',
    },
  ],
  HACKER: [
    {
      id: 'hacker-1',
      mode: 'HACKER',
      text: 'System wykrył nowy pakiet danych w sieci lokalnej. Uruchamiam firewall i weryfikuję klucze szyfrowania.',
    },
    {
      id: 'hacker-2',
      mode: 'HACKER',
      text: 'Połączenie z głównym serwerem zostało nawiązane. Czas odpowiedzi ping wynosi zaledwie cztery milisekundy.',
    },
    {
      id: 'hacker-3',
      mode: 'HACKER',
      text: 'Zanim wdrożysz nowy deploy na produkcję, zawsze sprawdź logi systemowe oraz aktualny backup bazy danych.',
    },
    {
      id: 'hacker-4',
      mode: 'HACKER',
      text: 'Bezpieczne hasło oraz autoryzacja dwuskładnikowa 2FA to podstawa ochrony każdego konta w cyberprzestrzeni.',
    },
    {
      id: 'hacker-5',
      mode: 'HACKER',
      text: 'Terminal oczekuje na komendę administratora. Dostęp do klastra obliczeniowego został autoryzowany przez token.',
    },
    {
      id: 'hacker-6',
      mode: 'HACKER',
      text: 'Algorytm sztucznej inteligencji przetwarza strumień danych w czasie rzeczywistym i optymalizuje ruch w sieci.',
    },
    {
      id: 'hacker-7',
      mode: 'HACKER',
      text: 'Skanowanie portów zakończone sukcesem. Wszystkie usługi w kontenerach Docker działają stabilnie na porcie 8080.',
    },
    {
      id: 'hacker-8',
      mode: 'HACKER',
      text: 'Protokół HTTPS gwarantuje poufność transmisji pomiędzy przeglądarką klienta a serwerem aplikacji webowej.',
    },
    {
      id: 'hacker-9',
      mode: 'HACKER',
      text: 'Wykryto anomalię w ruchu sieciowym. Automatyczny system obrony zablokował podejrzane zapytania do endpointu API.',
    },
    {
      id: 'hacker-10',
      mode: 'HACKER',
      text: 'Architektura mikroserwisów pozwala skalować aplikację w chmurze bez przerywania sesji aktywnych użytkowników.',
    },
  ],
  CODE: [
    {
      id: 'code-1',
      mode: 'CODE',
      text: 'const calcScore = (wpm: number, acc: number) => Math.round(wpm * (acc / 100));',
    },
    {
      id: 'code-2',
      mode: 'CODE',
      text: 'const topPlayers = scores.filter((s) => s.wpm >= 60).sort((a, b) => b.score - a.score);',
    },
    {
      id: 'code-3',
      mode: 'CODE',
      text: 'function isValidKey(char: string, target: string): boolean { return char === target; }',
    },
    {
      id: 'code-4',
      mode: 'CODE',
      text: 'export interface Player { id: string; nick: string; score: number; online: boolean; }',
    },
    {
      id: 'code-5',
      mode: 'CODE',
      text: 'for (let i = 0; i < items.length; i++) { total += items[i].value ?? 0; }',
    },
    {
      id: 'code-6',
      mode: 'CODE',
      text: 'const response = await fetch("/api/scores", { method: "POST", body: payload });',
    },
    {
      id: 'code-7',
      mode: 'CODE',
      text: 'const [timeLeft, setTimeLeft] = useState<number>(30); if (timeLeft === 0) stopGame();',
    },
    {
      id: 'code-8',
      mode: 'CODE',
      text: 'const nextIndex = (currentIndex + 1) % passages.length; return passages[nextIndex];',
    },
    {
      id: 'code-9',
      mode: 'CODE',
      text: 'type GameMode = "EASY" | "HACKER" | "CODE"; const defaultMode: GameMode = "EASY";',
    },
    {
      id: 'code-10',
      mode: 'CODE',
      text: 'const cleanNick = rawInput.trim().slice(0, 16); if (!cleanNick) throw new Error("Empty");',
    },
  ],
};

/**
 * Deterministically selects the next passage for a given mode without immediate repetition.
 *
 * @param mode - Selected GameMode ('EASY' | 'HACKER' | 'CODE')
 * @param usedIds - List of passage IDs already shown in the current session
 * @param startOffset - Deterministic starting offset (defaults to 0, or derived from session seed)
 */
export function selectNextPassage(
  mode: GameMode,
  usedIds: string[] = [],
  startOffset = 0
): PassageItem {
  const pool = PASSAGES[mode] || PASSAGES.EASY;
  const usedSet = new Set(usedIds);

  const normalizedOffset = Math.abs(Math.floor(startOffset)) % pool.length;

  for (let i = 0; i < pool.length; i++) {
    const candidate = pool[(normalizedOffset + i) % pool.length];
    if (!usedSet.has(candidate.id)) {
      return candidate;
    }
  }

  // If the player completed every passage in the pool during one session, wrap around cleanly
  // while avoiding the immediately preceding passage if pool has more than 1 item.
  const lastId = usedIds[usedIds.length - 1];
  for (let i = 0; i < pool.length; i++) {
    const candidate = pool[(normalizedOffset + i) % pool.length];
    if (candidate.id !== lastId) {
      return candidate;
    }
  }

  return pool[0];
}
