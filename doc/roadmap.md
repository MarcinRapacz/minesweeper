# Roadmapa implementacji — Saper (zadanie rekrutacyjne)

Budżet: 3 h. Zasady: TDD, bez overengineeringu, twardo według PDF. Każdy etap kończy się osobnym
commitem w konwencji Conventional Commits. Szacunki czasu są orientacyjne i służą pilnowaniu budżetu.

## Etap 0 — Szkielet projektu (~15 min)

1. `git init`, `.gitignore` (node_modules, dist).
2. `npm create vite@latest . -- --template react-ts`, `npm i -D sass vitest`.
3. Sprawdzić `tsconfig`: `strict: true` (Vite ustawia domyślnie). Dodać skrypt `"test": "vitest run"`.
4. Usunąć demo Vite (logo, `App.css`, licznik). Zostawić minimalny `App.tsx`.
5. Przenieść `saper-plansze.json` do `src/data/levels.json`. `doc/` zostaje w repo, PDF z zadaniem nie.
6. `npm run build` musi przejść.

Commit: `chore: scaffold vite react-ts project with sass and vitest`

## Etap 1 — Logika `src/logic/board.ts` (TDD, ~60 min)

Plik eksportuje **dokładnie** typy `Level`, `Cell`, `Board` i funkcje `createBoard`, `revealCell`,
`toggleFlag`. Nic więcej. Funkcje czyste, zwracają nowe obiekty. Testy w `src/logic/board.test.ts`.
Kolejność: test → implementacja → refactor, po jednym zachowaniu na raz.

### 1a. `createBoard`

Testy:
- wymiary i długość `cells` = width × height, indeks = y × width + x;
- miny na właściwych indeksach, `adjacent` liczone poprawnie (róg, krawędź, środek);
- `state === 'idle'`, nic nie odkryte, nic nie oflagowane;
- dane brudne: duplikat miny liczy się raz (`bliznieta`), mina poza planszą jest pomijana (`za-plotem`),
  `mineCount` niezgodny z listą nie psuje planszy (`rachmistrz`), zero min (`laka`), same miny (`ciasno`).

Commit: `feat(logic): create board from level with data normalization`

### 1b. `toggleFlag`

Testy:
- flaga na zakrytym polu, ponowne wywołanie ją zdejmuje;
- brak zmiany na polu odkrytym;
- brak zmiany, gdy `state` to `won` lub `lost`;
- nie mutuje wejścia.

Commit: `feat(logic): toggle flag on hidden cells`

### 1c. `revealCell` — pojedyncze odkrycie i pierwsze bezpieczne odkrycie

Testy:
- odkrycie pola bez miny odkrywa je i przełącza `idle` → `playing`;
- pierwsze odkrycie na minie przenosi ją na najniższy wolny indeks, `adjacent` przeliczone;
- pierwsze odkrycie na minie bez wolnego pola (`ciasno`) → `lost`;
- odkrycie miny w stanie `playing` → `lost`;
- odkrycie pola oflagowanego nie robi nic;
- ruch na planszy `won`/`lost` nie robi nic.

Commit: `feat(logic): reveal cell with safe first move and loss detection`

### 1d. `revealCell` — kaskada i wygrana

Testy:
- odkrycie pola z `adjacent === 0` odkrywa sąsiadów rekurencyjnie, zatrzymuje się na cyfrach;
- kaskada omija pola oflagowane;
- odkrycie ostatniego pola bez miny → `won`;
- plansza bez min (`laka`): pierwsze odkrycie → `won` od razu.

Commit: `feat(logic): cascade reveal and win detection`

### 1e. Chording

Miejsce implementacji: patrz decyzja D2 niżej. Testy:
- odkryte pole z cyfrą n i n flagami wokół → odkryci wszyscy pozostali sąsiedzi;
- liczba flag ≠ cyfra → brak zmiany;
- flaga na złym polu → `lost`;
- pole zakryte lub z `adjacent === 0` → brak chordingu.

Commit: `feat(logic): chording on numbered cells`

## Etap 2 — Interfejs (~50 min)

Bez bibliotek poza Reactem. Stan gry w jednym hooku `useGame` (useState + funkcje z logiki).
Komponenty tylko te, które są potrzebne:

- `App` — wybór poziomu, licznik, status, przycisk restartu, plansza.
- `LevelSelect` — `<select>` z listy poziomów.
- `Board` — siatka pól (CSS grid, `grid-template-columns` z `width`).
- `Cell` — `<button>`; lewy klik → reveal / chord, prawy klik → flaga z `preventDefault` na `contextmenu`.

Wymagania UI do odhaczenia:
- [ ] wybór planszy z JSON, restart bieżącej;
- [ ] licznik: faktyczna liczba min minus flagi;
- [ ] stan `won` / `lost` czytelny tekstem;
- [ ] po `lost` widoczne wszystkie miny (Cell dostaje `revealed` wizualnie, gdy `board.state === 'lost' && cell.mine`);
- [ ] cyfry 1–8 w kolorach ze zmiennych.

Commity:
- `feat(ui): level selection and board rendering`
- `feat(ui): reveal, flag and chord interactions`
- `feat(ui): mine counter, game status and restart`

## Etap 3 — Style SCSS (~20 min)

- `src/styles/variables.scss` — jedyny plik z wartościami: kolory tła, pól, flag, min, cyfr 1–8,
  odstępy, rozmiar pola. Wszystko jako CSS custom properties na `:root`.
- Pliki SCSS per komponent, klasy BEM: `board`, `board__cell`, `board__cell--revealed`,
  `board__cell--flagged`, `board__cell--mine`, `board__cell--adjacent-3` itd.
- W komponentach i ich SCSS wyłącznie `var(--…)`. Zero literałów kolorów i odstępów.

Commit: `style: scss with bem classes and css variables`

## Etap 4 — README i kontrola końcowa (~25 min)

README.md po polsku, siedem punktów z PDF (kilka zdań każdy). Punkt 3 opisuje każdy z pięciu
problemów w danych i przyjętą politykę. Punkt 7 opisuje użycie AI.

Kontrola przed oddaniem:
```
grep -rnE "\bany\b|@ts-ignore|@ts-expect-error|@ts-nocheck|\benum\b" src
grep -rnE "#[0-9a-fA-F]{3,8}|rgb\(|[0-9]+(px|rem|em)" src --include=*.tsx --include=*.scss | grep -v variables.scss
npm run build && npm test
git log --oneline
```
Test czystego klonu: `git clone <repo> /tmp/saper-check && cd /tmp/saper-check && npm i && npm run build && npm test`.

Commity: `docs: add readme in polish`, ewentualnie `fix:` po kontroli.

## Decyzje (ustalone 2026-09-09)

**D1. Polityka brudnych danych.** DECYZJA: normalizacja listy min. `createBoard` normalizuje listę min — usuwa duplikaty i
pola poza planszą — i to zdeduplikowana lista jest źródłem prawdy. `mineCount` z pliku jest ignorowany;
licznik w UI pokazuje faktyczną liczbę min. Alternatywa: dosypywać/usuwać miny, żeby zgadzało się
z `mineCount`. Odrzucona, bo plansze mają być deterministyczne, a nie losowane.

**D2. Gdzie żyje chording.** `board.ts` ma eksportować „dokładnie” trzy funkcje. Opcje:
- (a) chording wewnątrz `revealCell`: wywołanie na polu już odkrytym z cyfrą i pasującą liczbą flag
  odkrywa sąsiadów; w innym wypadku no-op. Ryzyko: test rekrutera „reveal na odkrytym polu nic nie
  zmienia” może się wysypać.
- (b) osobny moduł `src/logic/chord.ts` z funkcją `chordCell(board, index)`, która składa wywołania
  `revealCell` na sąsiadach. `board.ts` zostaje dokładnie w kontrakcie, `revealCell` na odkrytym polu
  jest no-opem. UI decyduje: pole odkryte → chord, zakryte → reveal.
DECYZJA: (b).

**D3. `laka` — przejście `idle` → `won` z pominięciem `playing`.** DECYZJA: tak, pierwsze odkrycie
kaskaduje całość i plansza od razu jest `won`. Bez sztucznego stanu pośredniego.

**D4. `ciasno` — plansza bez pól do odkrycia.** DECYZJA: `createBoard` zwraca `idle`, nie `won`. Warunek wygranej
sprawdzamy tylko po ruchu odkrycia, nigdy przy tworzeniu.

**D5. Rozmiary zbliżone do budżetu.** Jeśli po Etapie 2 zostanie mniej niż 30 min, Etap 3 ograniczyć
do minimum (zmienne + BEM bez dopieszczania), a czas oddać README.

**D6. Zawartość repozytorium.** DECYZJA: `CLAUDE.md` i `doc/roadmap.md` są w repo,
PDF z treścią zadania nie. Commity zawierają trailer Co-Authored-By Claude i link do sesji. Użycie AI opisane w README pkt 7.

**D7. Linter.** Szablon Vite dostarcza oxlint zamiast ESLint. Zadanie zostawia linter dowolny, zostaje oxlint.
