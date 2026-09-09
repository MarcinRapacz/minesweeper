# Saper

Zadanie rekrutacyjne: saper w React + TypeScript z planszami wczytywanymi z pliku `src/data/levels.json`.
Logika gry jest w czystych funkcjach w `src/logic/board.ts`, bez zależności od Reacta.

## 1. Jak uruchomić

Wymagany Node 24 (pisane i sprawdzane na v24.16.0; Vite 8 nie wystartuje na Node starszym niż 20.19).

```bash
npm install
npm run dev      # serwer deweloperski na http://localhost:3000
npm run build    # kompilacja TypeScript + build produkcyjny do dist/
npm test         # testy jednostkowe (Vitest)
npm run lint     # oxlint
```

Instrukcja sprawdzona na czystym klonie.

## 2. Co zrobiłem, a czego nie i dlaczego

Zrobione jest wszystko z zakresu wymaganego: kontrakt `board.ts` z narzuconymi sygnaturami, bezpieczne
pierwsze odkrycie, kaskada omijająca flagi, wygrana i przegrana z blokadą dalszych ruchów, chording,
interfejs z wyborem planszy, restartem, licznikiem min i stanem gry, SCSS z klasami BEM i zmiennymi CSS
w jednym pliku, testy logiki.

Świadomie nie zrobiłem:

- **Chording nie jest w `revealCell`, tylko w osobnym module `src/logic/chord.ts`.** Zadanie wymaga,
  żeby `board.ts` eksportował dokładnie trzy funkcje, a ich zachowanie jest testowane zewnętrznym zestawem.
  Gdyby `revealCell` na odkrytym polu robił chording, test w stylu „odkrycie odkrytego pola nic nie
  zmienia" mógłby się wysypać. `chordCell` składa wywołania `revealCell` na sąsiadach, więc nie duplikuje
  reguł przegranej ani kaskady. Interfejs decyduje: klik w pole zakryte to odkrycie, w odkryte to chording.
- **Brak walidacji JSON-a w czasie działania.** Plik jest bundlowany, więc TypeScript zna jego kształt
  w czasie kompilacji. Jedyne, czego nie wywnioskuje, to krotka `[x, y]`, i tylko to jest sprawdzane
  w `src/data/levels.ts`. Walidator na `unknown` miałby sens dopiero dla danych z backendu.
- **Brak obsługi klawiatury i atrybutów ARIA na planszy.** Pola są przyciskami, więc fokus działa,
  ale odkrywanie i flagowanie klawiaturą to rozszerzenie zakresu.
- **Po przegranej nie wyróżniam źle postawionych flag.** Zadanie wymaga pokazania min i to robię.
- **Zwykły SCSS zamiast CSS Modules.** Klasy BEM są globalne i unikalne, moduły nic by tu nie dały.
- **Brak obsługi błędów w czasie działania.** Dwa `throw` przy starcie (brak elementu `#root`, pusta lista
  poziomów) to jedyne miejsca, gdzie coś może pójść nie tak, i oba oznaczają zepsuty build, a nie stan gry.
  Logika jest czysta i nie rzuca wyjątków, więc `try/catch` nie ma czego łapać.

## 3. Co znalazłem w danych i jak to obsłużyłem

Plik `levels.json` ma pięć celowych pułapek. Przyjąłem jedną zasadę: **źródłem prawdy jest lista min
po normalizacji**, a pole `mineCount` z pliku jest ignorowane. Licznik w interfejsie pokazuje faktyczną
liczbę min na planszy.

| Poziom | Problem | Obsługa |
|---|---|---|
| Pomyłka rachmistrza | `mineCount: 10`, ale na liście jest 12 min | Plansza ma 12 min, licznik pokazuje 12 |
| Bliźnięta | Mina `[2, 2]` wpisana dwa razy | Duplikat zwinięty do jednej miny, plansza ma 7 min |
| Za płotem | Mina `[8, 3]` poza planszą 8×8 | Wpis odrzucony, plansza ma 5 min |
| Łąka | 5×5 bez min | Pierwsze odkrycie kaskaduje całość i od razu daje `won` |
| Ciasno | 3×3, mina na każdym polu | Bezpieczne pierwsze odkrycie nie ma gdzie przenieść miny, więc pierwszy klik przegrywa. `createBoard` nie zgłasza `won` przy tworzeniu, mimo że nie ma pól bez min |

Alternatywą było dosypywanie lub usuwanie min tak, żeby zgadzało się z `mineCount`. Odrzuciłem ją, bo
plansze mają być deterministyczne i zgodne z plikiem, a nie dopasowane do licznika.

## 4. Co było najtrudniejsze

Najwięcej czasu zajęło pilnowanie kolejności reguł w `revealCell`: przeniesienie miny przy pierwszym
odkryciu musi przeliczyć `adjacent` całej planszy, zanim ruszy kaskada, a sprawdzenie wygranej musi być
po kaskadzie, ale nigdy przy tworzeniu planszy. Test dla przeniesionej miny napisałem początkowo z błędną
asercją sąsiedztwa i chwilę zajęło ustalenie, że to test jest zły, nie kod.

Drugi problem wyszedł przy dokładaniu kaskady: wcześniejsze testy odkrywały „bezpieczne" pole z zerem
sąsiadów i po dodaniu kaskady wygrywały planszę zamiast zostać w `playing`. Trzeba było je przepisać na
pola z cyfrą, co jest dobrą lekcją, że testy powinny wybierać pola świadomie.

## 5. Jakich bibliotek użyłem i po co

- **react** — wymagany przez zadanie, komponenty i stan interfejsu.
- **react-dom** — montuje drzewo React w DOM; pola planszy są zwykłymi elementami `button`.
- **vite** — bundler i serwer deweloperski, sugerowany w zadaniu, zero konfiguracji dla React + TS.
- **typescript** — wymagany, tryb `strict`. Flaga `erasableSyntaxOnly` dodatkowo blokuje `enum`.
- **sass** — wymagany przez zadanie do SCSS.
- **vitest** — runner testów, natywnie czyta konfigurację Vite i nie wymaga osobnego setupu.
- **oxlint** — linter dostarczony przez aktualny szablon Vite zamiast ESLint; zadanie zostawia wybór.

Poza tym żadnych bibliotek: brak UI kitów, CSS-in-JS ani bibliotek do gier.

## 6. Co zrobiłbym dalej

- Obsługa klawiatury (strzałki, Enter, Space) i atrybuty ARIA dla pól i statusu gry.
- Wyróżnienie błędnych flag po przegranej.
- `React.memo` na `Cell`, jeśli plansze miałyby być duże; dziś przy 120 polach nie ma potrzeby.
- Walidator poziomów na `unknown` z czytelnym komunikatem, gdyby plansze przychodziły z API.
- Testy hooka `useGame` i test e2e jednego pełnego rozegrania.
- Zapis wybranego poziomu i wyników w `localStorage`, licznik czasu.

## 7. Gdzie korzystałem z AI

Pracowałem z Claude Code (Claude Fable 5.1) przez cały czas. Zadanie i plansze przeanalizowałem razem z nim,
a w `doc/roadmap.md` spisaliśmy plan i decyzje projektowe, które podejmowałem ja (polityka brudnych danych,
umiejscowienie chordingu, zawartość repozytorium). Kod, testy i style powstały w trybie TDD z asystentem
piszącym kolejne kroki na podstawie tych decyzji, a ja je przeglądałem i testowałem ręcznie w przeglądarce.
Instrukcje dla asystenta są w `CLAUDE.md`, a historia commitów zawiera trailer Co-Authored-By.

Gotowy kod przeszedł code review na osobnym agencie AI, a niezależnie od niego zrobiłem własny przegląd.
Z obu wyszły ostatnie poprawki: dodatkowe testy brzegowe logiki (ruchy po wygranej, kaskada po relokacji
miny, indeksy poza planszą), podniesienie kontrastu cyfr 2, 3 i 6 do poziomu WCAG AA oraz drobne zmiany
w README. Żadna z tych poprawek nie zmieniła zachowania gry.
