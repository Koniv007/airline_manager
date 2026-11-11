# Airline Manager 1975–2040

## Spuštění (potřebujete Node.js 22.18 nebo novější)
    npm install
    npm run dev      # otevře hru v prohlížeči (adresa se vypíše v terminálu)
    npm test         # spustí automatické testy
    npm run build    # kontrola typů + produkční build

## Struktura
- src/simulation – čistá herní logika (čas), bez Reactu
- src/worlds – pravidla Career/Sandbox a seznam serverů (zatím demo data)
- src/auth – účty, hosté, reset hesla (zatím pouze lokální testovací verze)
- src/persistence – ukládání aerolinky (zatím do zařízení)
- src/economy – peníze
- src/game – stav hry
- src/ui – obrazovky a komponenty
