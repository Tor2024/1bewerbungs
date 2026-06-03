# ⚡ Schnellstart-Anleitung

## Sofort loslegen - 3 einfache Schritte!

Ihre Daten (CV + Foto) sind bereits vorgeladen. Sie müssen nur noch:

### Schritt 1: Website öffnen
```
https://1bewerbungs.vercel.app
```

### Schritt 2: Stellenanzeige einfügen
- Vollständigen Text der Stellenanzeige kopieren
- In das große Textfeld einfügen
- **Wichtig:** Komplette Anzeige mit Firma, Kontakt, E-Mail

### Schritt 3: Generieren & Herunterladen
- Button **"Dokumente generieren"** klicken
- Warten (ca. 10-30 Sekunden)
- Tabs "Anschreiben" und "Lebenslauf" prüfen
- Button **"Als PDF speichern"** klicken
- **Fertig!** 🎉

---

## Was wird automatisch gemacht?

✅ **Ihr Master-CV (Oleh Kalchenko)** wird automatisch geladen  
✅ **Ihr Foto** wird automatisch eingefügt  
✅ **Firma & Kontakt** werden aus der Stellenanzeige extrahiert  
✅ **Dokumente werden angepasst** an den Jobtyp:
- Web Developer → GitHub & Portfolio hervorheben
- Lagerarbeit → Logistik-Erfahrung betonen
- Verwaltung → Organisation & MS Office Skills
- IT Support → Problemlösung & Lernfähigkeit

---

## Beispiel-Stellenanzeige zum Testen

```
Lagerarbeiter (m/w/d) Vollzeit

LOGISTIK PRO GmbH
Siegen, Deutschland

Ihre Aufgaben:
• Wareneingang und -ausgang
• Kommissionierung
• Lagerverwaltung

Ihr Profil:
• Zuverlässigkeit
• Körperliche Belastbarkeit
• Deutschkenntnisse

Wir bieten:
• Unbefristete Anstellung
• 18-20 EUR/Stunde

Bewerbung an: jobs@logistikpro.de
```

---

## Tipps für beste Ergebnisse

### 1. Vollständige Stellenanzeige kopieren
**Gut:**
```
Frontend Developer (m/w/d)
TechSolutions GmbH
Kontakt: Frau Schmidt
E-Mail: bewerbung@techsolutions.de
Adresse: Industriestr. 45, Siegen

Aufgaben:
- React Development
- ...
```

**Schlecht:**
```
Frontend Developer gesucht
```

### 2. Verschiedene Jobtypen ausprobieren
Die KI passt Ihre Dokumente automatisch an:
- **Developer-Jobs:** Betont GitHub, Portfolio, technische Skills
- **Lager-Jobs:** Betont 20 Jahre Logistik, Führungserfahrung
- **Büro-Jobs:** Betont Organisation, MS Office, Dokumentation

### 3. Prüfung vor dem Versenden
Tab **"Prüfung"** öffnen und kontrollieren:
- ✓ Firma richtig erkannt?
- ✓ Kontaktperson gefunden?
- ✓ E-Mail extrahiert?
- ✓ Ton des Briefes passend?

---

## Eigene Daten verwenden (Optional)

Falls Sie nicht Oleh Kalchenko sind:

### Master-CV ändern:
1. `masterCV.json` bearbeiten oder eigene JSON-Datei erstellen
2. Im Abschnitt "1. Master-CV" auf "Eigene CV-Datei hochladen" klicken
3. Ihre JSON-Datei auswählen

### Foto ändern:
1. Im Abschnitt "3. Bewerbungsfoto" auf "Anderes Foto hochladen" klicken
2. Ihr Foto auswählen (empfohlen: 35mm x 45mm, Passbildformat)

### Struktur der JSON-Datei:
Siehe `masterCV.json` als Vorlage mit allen erforderlichen Feldern:
- personalInfo (Name, Adresse, E-Mail, Telefon, Portfolio, GitHub)
- profile (Kurzbeschreibung, Ziele)
- experience (Berufserfahrung)
- education (Ausbildung)
- skills (Fähigkeiten)
- projects (Projekte)
- languages (Sprachen)

---

## Häufige Fragen

### Q: Wie lange dauert die Generierung?
**A:** 10-30 Sekunden, je nach API-Antwortzeit

### Q: Kann ich die Dokumente nachträglich bearbeiten?
**A:** Ja! Nach PDF-Export mit PDF-Editor oder Word öffnen

### Q: Funktioniert es für alle Job-Arten?
**A:** Ja! Von Lager bis Software Developer - alles anpassbar

### Q: Muss ich jedes Mal alle Daten neu eingeben?
**A:** Nein! CV und Foto werden gespeichert (localStorage + Vercel)

### Q: Wie ändere ich die Daten?
**A:** Einfach neue Datei hochladen - überschreibt gespeicherte Daten

### Q: Wird meine Stellenanzeige gespeichert?
**A:** Nein, aus Datenschutzgründen nicht. Nur das Ergebnis wird gecacht.

### Q: Funktioniert es offline?
**A:** Nein, benötigt Internet für AI-Generierung (Google Gemini API)

### Q: Kostet es etwas?
**A:** Nein, völlig kostenlos!

---

## Technische Details (für Entwickler)

- **Frontend:** Vanilla JavaScript, HTML, CSS
- **Backend:** Vercel Serverless Functions (Node.js)
- **AI:** Google Gemini 2.5 Flash (JSON mode)
- **Hosting:** Vercel
- **Daten:** LocalStorage (Browser) + masterCV.json/photo.jpg (Vercel)

### API-Keys:
Mehrere Gemini API Keys für Load-Balancing in Vercel Environment Variables:
```
GEMINI_API_KEY=key1,key2,key3,...
```

### Lokale Entwicklung:
```bash
# Installation nicht nötig (statische Files)
# Öffne einfach index.html im Browser

# Für API-Testing:
node test-api.js
```

---

## Workflow-Diagramm

```
┌─────────────────────────────────────────┐
│  1. Website öffnen                      │
│     → CV & Foto automatisch geladen     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  2. Stellenanzeige einfügen             │
│     → Vollständiger Text mit Kontakt    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  3. "Dokumente generieren" klicken      │
│     ┌───────────────────────────────┐   │
│     │ AI analysiert:                │   │
│     │ • Jobtyp (Dev/Lager/Büro?)    │   │
│     │ • Firma & Kontakt             │   │
│     │ • Anforderungen               │   │
│     │ • Passt CV an Strategie an    │   │
│     └───────────────────────────────┘   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  4. Ergebnis prüfen (3 Tabs)            │
│     • Anschreiben (DIN 5008)            │
│     • Lebenslauf (mit Foto)             │
│     • Prüfung (russische Zusammenfassung)│
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  5. Als PDF speichern                   │
│     → Druckdialog: "Als PDF speichern"  │
│     → Datei benennen & speichern        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  6. Per E-Mail versenden! ✉️            │
└─────────────────────────────────────────┘
```

---

## Support

Bei Problemen:
1. Browser-Console öffnen (F12) und Fehler prüfen
2. GitHub Issues: https://github.com/Tor2024/1bewerbungs/issues
3. Cache löschen: Button "Cache löschen" im Output-Bereich

**Viel Erfolg bei der Jobsuche!** 🚀
