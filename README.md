# FöreningsSök - AI-Driven Sökning efter Föreningar

## 🚀 Introduktion

**FöreningsSök** är en webbapplikation som använder AI och en vektorbaserad databas för att effektivt söka efter föreningar. Genom att integrera LangChain och hnswlib-node, levererar FöreningsSök snabba och relevanta sökresultat, vilket hjälper användare att hitta rätt förening baserat på deras behov och intressen.

Tyvärr är databasen mycket begränsad vad gäller data och omfattar endast föreningslivet i Sundsvall.

## Nerladdning

Klona gitrepot.
döp om env.exempel till env.local och mata in en ai-nyckel

kör npm install

starta applikationen med npm run dev

## Användning

skriv din fråga i frågeraden. Appen ska endast svara på frågor om föreningar. Ibland kan det gå att komma undan med andra frågor. Fördelen med semantiskt sök är att maninte behöver söka på exakta ord. Med hjälp av vektordatabasen hjälper AI med att förstå relationer och kan på så sätt ge förslag på tennisklubbar om man söker på racketsporter fast det inte finns med som sökord i databasen för tennisklubben.

Exempel på frågor:

- Vad kan finns det för föreningar i Sundsvall för kulturintresserade pensionärer?
- Ge mig tio föreningar för någon som gillar racketsporter.
- Ge mig fem förslag på föreningar som innehåller boll sorter
