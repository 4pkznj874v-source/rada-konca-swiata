# Rada Końca Świata - prototyp TV + telefony

## Co jest w środku
- wspólny ekran TV/tabletu
- kod pokoju + QR
- 3-8 graczy na telefonach
- filmowy prolog (animowany CSS/SVG, bez osobnego pliku MP4)
- ambientowa muzyka generowana w przeglądarce przez Web Audio
- 8 rund kryzysów
- tajne role i prywatne informacje
- publiczny ranking punktowy
- punkty wpływu i wzmacnianie głosu
- specjalna akcja: przejęcie głosu innego gracza za 7 wpływu, raz na grę
- konsekwencje decyzji zmieniające 6 parametrów świata
- końcowy profil decyzyjny gracza na podstawie jego wyborów

Profil końcowy jest elementem rozrywkowym gry i nie jest diagnozą psychologiczną.

## Pliki
- index.html
- style.css
- app.js
- firebase-config.js
- database.rules.json
- assets/world-grid.svg

## GitHub
Najprościej utworzyć NOWE repozytorium, np. `rada-konca-swiata`.

Do głównego katalogu repozytorium wrzuć:
- index.html
- style.css
- app.js
- firebase-config.js
- database.rules.json
- README.md

Oraz utwórz katalog `assets` i w nim umieść:
- world-grid.svg

Struktura ma wyglądać tak:

rada-konca-swiata/
  index.html
  style.css
  app.js
  firebase-config.js
  database.rules.json
  README.md
  assets/
    world-grid.svg

## GitHub Pages
Settings -> Pages
- Source: Deploy from a branch
- Branch: main
- Folder: /(root)
- Save

Po wdrożeniu adres będzie podobny do:
https://TWOJ-LOGIN.github.io/rada-konca-swiata/

## Firebase
Plik firebase-config.js jest już skonfigurowany pod używany projekt `wyscig-test`.

W Firebase Realtime Database -> Rules powinno być:

{
  "rules": {
    "rooms": {
      "$room": {
        ".read": true,
        ".write": true
      }
    }
  }
}

UWAGA: te reguły są celowo otwarte tylko do prototypu. Przed produkcyjnym użyciem trzeba dodać uwierzytelnianie i bezpieczne reguły.

## Jak zagrać
1. Otwórz stronę na TV/tablecie.
2. Kliknij `UTWÓRZ GRĘ NA TV / TABLECIE`.
3. Gracze skanują QR lub otwierają ten sam adres i wpisują kod pokoju.
4. Każdy wpisuje imię.
5. Na TV kliknij `URUCHOM PROLOG I GRĘ`.
6. Po prologu zaczyna się Runda 1.
7. Gracze czytają prywatne informacje i dyskutują.
8. Host klika `OTWÓRZ GŁOSOWANIE`.
9. Gracze wybierają A/B/C i opcjonalnie wydają 0-3 wpływu.
10. Host klika `ZAMKNIJ GŁOSOWANIE`.
11. TV pokazuje konsekwencję i ranking.
12. Po 8 rundach pojawia się ranking końcowy i profile decyzyjne.

## Mechanika punktów
Każda rola ma tajne preferencje. Gracz dostaje punkty m.in. za wybieranie decyzji zgodnych z tymi preferencjami i za zgodność własnego głosu z decyzją Rady. Na TV widać sumę punktów, ale nie źródło punktacji.

Wpływ:
- każdy zaczyna z 5
- w głosowaniu można wydać 0-3, zwiększając wagę własnego głosu
- za decyzje zgodne z rolą można odzyskać wpływ
- za 7 wpływu można raz na grę przejąć głos innego gracza; TV pokaże tylko fakt użycia nacisku

## Ważne technicznie
Muzyka uruchamia się dopiero po pierwszym kliknięciu użytkownika - to wymóg współczesnych przeglądarek dotyczący autoplay audio.
