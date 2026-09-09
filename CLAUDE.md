# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Czym jest to repozytorium

Zadanie rekrutacyjne (Frontend Developer, junior/mid, budżet 3 godziny): saper w React + TypeScript,
którego plansze są wczytywane z `saper-plansze.json`, a nie losowane. Pełna treść zadania jest w PDF-ie z maila
rekrutacyjnego, który celowo nie trafił do repozytorium. Kluczowe
wymagania są streszczone niżej, bo są oceniane, a rekruter uruchamia własny zestaw testów na
`src/logic/board.ts`.

W momencie pisania tego pliku repozytorium zawiera tylko JSON z planszami. Nie ma jeszcze szkieletu projektu.
PDF sugeruje `npm create vite@latest -- --template react-ts` plus `npm i -D sass`; bundler i runner
testów są dowolne. Po postawieniu projektu standardowe komendy to `npm install`, `npm run dev`,
`npm run build` (musi przechodzić na czystym klonie) oraz skonfigurowany skrypt testów (Vitest naturalnie
pasuje do Vite). Zaktualizuj tę sekcję, gdy szkielet powstanie.

## Sposób pracy (wymagania Marcina)

- **TDD.** Najpierw test, potem implementacja. Dotyczy zwłaszcza logiki w `src/logic/board.ts`.
- **Zakaz overengineeringu.** Żadnych abstrakcji, warstw ani konfiguracji „na przyszłość”. Kod dzielimy na
  sensowne domeny tylko wtedy, gdy stanie się na tyle wymagający, że to uzasadni.
- **Twarde trzymanie się wymagań z zadania.** Zakres i ograniczenia z PDF są wiążące.
- **Gdy coś jest nie tak, informuj przed implementacją.** Niejasne, sprzeczne lub niemożliwe wymaganie,
  pomysł wykraczający poza zakres, ryzyko naruszenia ograniczeń: zatrzymaj się i opisz problem oraz opcje,
  zamiast decydować samodzielnie.

## Twarde ograniczenia (naruszenie zamyka weryfikację)

- React 18+, TypeScript w trybie `strict`.
- Style wyłącznie w SCSS (dopuszczalne CSS Modules). Klasy w konwencji BEM.
- Wszystkie kolory, odstępy i rozmiary pochodzą ze zmiennych CSS zebranych w JEDNYM pliku. Żadnych
  literalnych kolorów ani odstępów w komponentach i ich SCSS. Cyfry 1–8 mają osobne zmienne kolorów.
- Pola planszy to elementy DOM. Żadnego canvas.
- Zabronione: `any`, `as any`, `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`, `enum`.
- Zabronione biblioteki: gotowe implementacje sapera i biblioteki do gier siatkowych; MUI, Chakra,
  Ant Design, Bootstrap, Tailwind; styled-components i każdy CSS-in-JS.
- Kod, nazwy plików i komentarze po angielsku. `README.md` po polsku.
- Historia gita: osobny commit na funkcjonalność, wiadomości w konwencji Conventional Commits.
- Nie rozszerzaj zakresu. Wolny czas idzie w README, nie w dodatkowe funkcje.

## Narzucony kontrakt logiki: `src/logic/board.ts`

Czyste funkcje, bez Reacta. Eksportuj dokładnie to (sygnatury są narzucone; testy rekrutera od nich zależą):

```ts
export type Level = { id: string; name: string; width: number; height: number; mineCount: number; mines: [number, number][] } // [x, y]
export type Cell = { mine: boolean; revealed: boolean; flagged: boolean; adjacent: number }
export type Board = { width: number; height: number; cells: Cell[]; state: 'idle' | 'playing' | 'won' | 'lost' } // indeks = y * width + x
export function createBoard(level: Level): Board
export function revealCell(board: Board, index: number): Board
export function toggleFlag(board: Board, index: number): Board
```

Reguły, które funkcje muszą realizować:

- **Bezpieczne pierwsze odkrycie.** Jeśli pierwsze odkrywane pole ma minę, przenieś ją na pole
  o najniższym indeksie, które nie ma miny i nie jest polem odkrywanym. Jeśli takiego pola nie ma,
  mina zostaje i gracz przegrywa. Po pierwszym odkryciu `state` zmienia się z `idle` na `playing`.
- **Kaskada.** Odkrycie pola z `adjacent === 0` odkrywa rekurencyjnie wszystkich 8 sąsiadów.
  Kaskada nigdy nie odkrywa pól oflagowanych.
- **Flagi.** Nie da się oflagować pola odkrytego ani odkryć pola oflagowanego.
- **Wygrana:** wszystkie pola bez min odkryte. **Przegrana:** odkryte pole z miną. Zakończona plansza
  (`won`/`lost`) ignoruje kolejne ruchy.
- **Chording** (UI + logika): kliknięcie w odkryte pole z cyfrą, wokół którego stoi dokładnie tyle flag,
  ile wynosi cyfra, odkrywa pozostałych nieoflagowanych sąsiadów. Źle postawiona flaga oznacza przegraną.

Funkcje powinny zwracać nowe obiekty `Board`, a nie mutować wejścia (UI opiera się na niemutowalnych
aktualizacjach, a testy rekrutera mogą porównywać plansze przed i po).

## Pułapki w danych `saper-plansze.json`

Plik jest celowo popsuty. Gra nie może się wywalić na żadnym poziomie, a README musi opisać każdy problem
i sposób obsługi. Znalezione problemy:

| id | Problem |
|---|---|
| `rachmistrz` | `mineCount` to 10, ale na liście jest 12 min. |
| `bliznieta` | `[2, 2]` występuje dwa razy, więc unikalnych min jest 7 mimo `mineCount: 8`. |
| `za-plotem` | Mina `[8, 3]` jest poza planszą 8×8 (poprawne x to 0–7). |
| `laka` | 5×5 bez min. Pierwsze odkrycie kaskaduje całą planszę i musi dać `won`, a nie zostać w `playing`. |
| `ciasno` | 3×3 z minami na wszystkich 9 polach. Bezpieczne pierwsze odkrycie nie ma wolnego pola, więc pierwszy klik przegrywa. Uważaj też, żeby `createBoard` nie zgłaszał `won` w stanie `idle` tylko dlatego, że nie ma pól bez min. |

`rozgrzewka` i `spacer` są czyste. Ustal politykę (np. wyprowadzaj faktyczną liczbę min ze zdeduplikowanej
listy min w granicach planszy i używaj jej w liczniku) i stosuj ją konsekwentnie w `createBoard`, bo
rekruter podaje obiekty `Level` bezpośrednio.

## Zakres interfejsu

Wybór planszy z JSON-a, restart bieżącej, lewy przycisk odkrywa, prawy stawia flagę (bez menu
kontekstowego przeglądarki), licznik pozostałych min (miny minus flagi), czytelny stan wygranej i przegranej,
po przegranej widoczne wszystkie miny.

## Testy

Minimum cztery, testujące wyłącznie funkcje z `board.ts` (nie klikanie w UI): po jednym na kaskadę,
bezpieczne pierwsze odkrycie, warunek wygranej i flagi.

## README.md (po polsku, siedem punktów)

1. Jak uruchomić (dokładne komendy, sprawdzone na czystym klonie). 2. Co zrobiono, a czego nie i dlaczego.
3. Co znaleziono w danych i jak to obsłużono. 4. Co było najtrudniejsze. 5. Użyte biblioteki, po jednym
zdaniu na każdą (jeśli żadnych poza Reactem, napisz to). 6. Co dalej na produkcję. 7. Gdzie użyto AI.
