// Interface strings in five languages. Place names, clues and facts live in the packs.

export const UI_LANGS = ['en', 'de', 'it', 'es', 'fr'];
export const LANG_NAMES = { en: 'English', de: 'Deutsch', it: 'Italiano', es: 'Español', fr: 'Français' };

const S = {
  tagline: ['Work out the place. Draw it from memory.', 'Errate den Ort. Zeichne ihn aus dem Gedächtnis.', 'Indovina il luogo. Disegnalo a memoria.', 'Adivina el lugar. Dibújalo de memoria.', 'Trouve le lieu. Dessine-le de mémoire.'],
  footer: ['Offline · no accounts · no tracking · test build', 'Offline · ohne Konto · ohne Tracking · Testversion', 'Offline · nessun account · nessun tracciamento · versione di prova', 'Sin conexión · sin cuentas · sin rastreo · versión de prueba', 'Hors ligne · sans compte · sans pistage · version test'],
  solo: ['Solo', 'Solo', 'Solo', 'Solo', 'Solo'],
  soloSub: ['You against 1 to 3 bots. Works offline.', 'Du gegen 1 bis 3 Bots. Funktioniert offline.', 'Tu contro 1–3 bot. Funziona offline.', 'Tú contra 1 a 3 bots. Funciona sin conexión.', 'Toi contre 1 à 3 bots. Fonctionne hors ligne.'],
  hotseat: ['Pass and play', 'Reihum spielen', 'Passa e gioca', 'Pasa y juega', 'Passe et joue'],
  hotseatSub: ['2 to 4 players on one device.', '2 bis 4 Spieler auf einem Gerät.', 'Da 2 a 4 giocatori su un dispositivo.', 'De 2 a 4 jugadores en un dispositivo.', 'De 2 à 4 joueurs sur un appareil.'],
  howToPlay: ['How to play', 'Spielregeln', 'Come si gioca', 'Cómo se juega', 'Règles du jeu'],
  settings: ['Settings', 'Einstellungen', 'Impostazioni', 'Ajustes', 'Réglages'],
  language: ['Language', 'Sprache', 'Lingua', 'Idioma', 'Langue'],
  theme: ['Theme', 'Design', 'Tema', 'Tema', 'Thème'],
  dark: ['Nocturne', 'Nocturne', 'Nocturne', 'Nocturne', 'Nocturne'],
  light: ['Daylight', 'Daylight', 'Daylight', 'Daylight', 'Daylight'],
  sound: ['Sound', 'Ton', 'Suono', 'Sonido', 'Son'],
  on: ['On', 'An', 'Sì', 'Sí', 'Oui'],
  off: ['Off', 'Aus', 'No', 'No', 'Non'],
  deleteData: ['Delete all data', 'Alle Daten löschen', 'Elimina tutti i dati', 'Borrar todos los datos', 'Effacer toutes les données'],
  deleteAsk: ['Delete your settings, record and best drawings from this device?', 'Einstellungen, Bilanz und beste Zeichnungen von diesem Gerät löschen?', 'Eliminare impostazioni, record e migliori disegni da questo dispositivo?', '¿Borrar ajustes, récord y mejores dibujos de este dispositivo?', 'Effacer réglages, bilan et meilleurs dessins de cet appareil ?'],
  deleteYes: ['Delete', 'Löschen', 'Elimina', 'Borrar', 'Effacer'],
  deleted: ['All data deleted.', 'Alle Daten gelöscht.', 'Tutti i dati eliminati.', 'Datos borrados.', 'Données effacées.'],
  cancel: ['Cancel', 'Abbrechen', 'Annulla', 'Cancelar', 'Annuler'],
  close: ['Close', 'Schließen', 'Chiudi', 'Cerrar', 'Fermer'],
  newGame: ['New game', 'Neues Spiel', 'Nuova partita', 'Nueva partida', 'Nouvelle partie'],
  difficulty: ['Difficulty', 'Schwierigkeit', 'Difficoltà', 'Dificultad', 'Difficulté'],
  rounds: ['Rounds', 'Runden', 'Round', 'Rondas', 'Manches'],
  bots: ['Bots', 'Bots', 'Bot', 'Bots', 'Bots'],
  players: ['Players', 'Spieler', 'Giocatori', 'Jugadores', 'Joueurs'],
  yourName: ['Your name', 'Dein Name', 'Il tuo nome', 'Tu nombre', 'Ton nom'],
  playerN: ['Player {n}', 'Spieler {n}', 'Giocatore {n}', 'Jugador {n}', 'Joueur {n}'],
  clueTime: ['Seconds per clue', 'Sekunden pro Hinweis', 'Secondi per indizio', 'Segundos por pista', 'Secondes par indice'],
  drawTime: ['Seconds to draw', 'Sekunden zum Zeichnen', 'Secondi per disegnare', 'Segundos para dibujar', 'Secondes pour dessiner'],
  practice: ['Practice: faint outline on the canvas', 'Training: blasser Umriss auf der Fläche', 'Allenamento: contorno tenue sulla tela', 'Práctica: contorno tenue en el lienzo', 'Entraînement : contour pâle sur la toile'],
  practiceNote: ['Practice games don’t count toward your record.', 'Trainingsspiele zählen nicht für deine Bilanz.', 'Le partite di allenamento non contano nel record.', 'Las partidas de práctica no cuentan para tu récord.', 'Les parties d’entraînement ne comptent pas dans ton bilan.'],
  start: ['Start', 'Los geht’s', 'Inizia', 'Empezar', 'Commencer'],
  record: ['Record vs the bot', 'Bilanz gegen den Bot', 'Record contro il bot', 'Récord contra el bot', 'Bilan contre le bot'],
  games: ['{n} games', '{n} Spiele', '{n} partite', '{n} partidas', '{n} parties'],
  noGames: ['No games yet', 'Noch keine Spiele', 'Nessuna partita', 'Sin partidas aún', 'Aucune partie'],
  round: ['Round {r} of {n}', 'Runde {r} von {n}', 'Round {r} di {n}', 'Ronda {r} de {n}', 'Manche {r} sur {n}'],
  menu: ['Menu', 'Menü', 'Menu', 'Menú', 'Menu'],
  paused: ['Paused', 'Pausiert', 'In pausa', 'En pausa', 'En pause'],
  resume: ['Resume', 'Weiter', 'Riprendi', 'Continuar', 'Reprendre'],
  quit: ['Quit game', 'Spiel beenden', 'Esci dalla partita', 'Salir de la partida', 'Quitter la partie'],
  quitNote: ['A game you quit doesn’t count.', 'Ein abgebrochenes Spiel zählt nicht.', 'Una partita abbandonata non conta.', 'Una partida abandonada no cuenta.', 'Une partie abandonnée ne compte pas.'],
  passTo: ['Pass the device to', 'Gib das Gerät an', 'Passa il dispositivo a', 'Pasa el dispositivo a', 'Passe l’appareil à'],
  passNote: ['Everyone else, look away.', 'Alle anderen: wegschauen.', 'Tutti gli altri: non guardate.', 'Los demás, no miréis.', 'Les autres, ne regardez pas.'],
  ready: ['I’m ready', 'Bereit', 'Sono pronto', 'Estoy listo', 'Je suis prêt'],
  clueN: ['Clue {n}', 'Hinweis {n}', 'Indizio {n}', 'Pista {n}', 'Indice {n}'],
  worth: ['Worth {p}', 'Wert {p}', 'Vale {p}', 'Vale {p}', 'Vaut {p}'],
  pts: ['pts', 'Pkt.', 'pt', 'pts', 'pts'],
  guessPh: ['Type a place…', 'Ort eingeben …', 'Scrivi un luogo…', 'Escribe un lugar…', 'Tape un lieu…'],
  guess: ['Guess', 'Raten', 'Indovina', 'Adivinar', 'Deviner'],
  nextClue: ['Next clue', 'Nächster Hinweis', 'Prossimo indizio', 'Siguiente pista', 'Indice suivant'],
  unknown: ['No place called “{t}”. Pick one from the list.', 'Kein Ort namens „{t}“. Wähle einen aus der Liste.', 'Nessun luogo chiamato «{t}». Scegline uno dalla lista.', 'No hay ningún lugar llamado «{t}». Elige uno de la lista.', 'Aucun lieu nommé « {t} ». Choisis-en un dans la liste.'],
  already: ['You already tried {p}.', '{p} hast du schon versucht.', 'Hai già provato {p}.', 'Ya probaste {p}.', 'Tu as déjà essayé {p}.'],
  notIt: ['Not {p}. −1 point.', 'Nicht {p}. −1 Punkt.', 'Non è {p}. −1 punto.', 'No es {p}. −1 punto.', 'Pas {p}. −1 point.'],
  thinking: ['thinking', 'überlegt', 'ci pensa', 'pensando', 'réfléchit'],
  finished: ['done', 'fertig', 'fatto', 'listo', 'fini'],
  draw: ['Draw {p}', 'Zeichne {p}', 'Disegna {p}', 'Dibuja {p}', 'Dessine {p}'],
  solvedOn: ['Solved on clue {n} · {b} pts', 'Gelöst bei Hinweis {n} · {b} Pkt.', 'Risolto all’indizio {n} · {b} pt', 'Resuelto en la pista {n} · {b} pts', 'Trouvé à l’indice {n} · {b} pts'],
  missedIt: ['Missed. Draw it anyway for practice.', 'Verpasst. Zeichne es trotzdem zum Üben.', 'Mancato. Disegnalo comunque per esercizio.', 'Fallado. Dibújalo igualmente para practicar.', 'Raté. Dessine-le quand même pour t’entraîner.'],
  mainland: ['Main landmass only', 'Nur das Hauptland', 'Solo la terraferma principale', 'Solo la masa continental principal', 'Terre principale uniquement'],
  northUp: ['North is up', 'Norden ist oben', 'Il nord è in alto', 'El norte arriba', 'Le nord en haut'],
  undo: ['Undo', 'Rückgängig', 'Annulla', 'Deshacer', 'Annuler'],
  clear: ['Clear', 'Löschen', 'Cancella', 'Borrar', 'Effacer'],
  done: ['Done', 'Fertig', 'Fatto', 'Listo', 'Terminé'],
  accuracy: ['Accuracy', 'Genauigkeit', 'Precisione', 'Precisión', 'Précision'],
  roundScore: ['Round score', 'Rundenpunkte', 'Punti del round', 'Puntos de la ronda', 'Points de la manche'],
  tapSkip: ['Tap to skip', 'Tippen zum Überspringen', 'Tocca per saltare', 'Toca para saltar', 'Touche pour passer'],
  continue: ['Continue', 'Weiter', 'Continua', 'Continuar', 'Continuer'],
  itWas: ['It was', 'Es war', 'Era', 'Era', 'C’était'],
  didYouKnow: ['Did you know?', 'Schon gewusst?', 'Lo sapevi?', '¿Sabías que…?', 'Le savais-tu ?'],
  nextRound: ['Next round', 'Nächste Runde', 'Prossimo round', 'Siguiente ronda', 'Manche suivante'],
  seeResults: ['See results', 'Zum Ergebnis', 'Vedi i risultati', 'Ver resultados', 'Voir les résultats'],
  scoresHidden: ['Scores stay hidden until the end.', 'Punkte bleiben bis zum Schluss verdeckt.', 'I punteggi restano nascosti fino alla fine.', 'Las puntuaciones se ocultan hasta el final.', 'Les scores restent cachés jusqu’à la fin.'],
  finalScores: ['Final scores', 'Endstand', 'Punteggi finali', 'Puntuación final', 'Scores finaux'],
  revealNext: ['Reveal round {r}', 'Runde {r} aufdecken', 'Svela il round {r}', 'Revelar ronda {r}', 'Révéler la manche {r}'],
  revealAll: ['Reveal all', 'Alles aufdecken', 'Svela tutto', 'Revelar todo', 'Tout révéler'],
  wins: ['{n} wins', '{n} gewinnt', 'Vince {n}', 'Gana {n}', '{n} gagne'],
  tie: ['It’s a tie', 'Unentschieden', 'Pareggio', 'Empate', 'Égalité'],
  total: ['Total', 'Gesamt', 'Totale', 'Total', 'Total'],
  avgAcc: ['avg. accuracy', 'Ø Genauigkeit', 'precisione media', 'precisión media', 'précision moyenne'],
  best: ['Best drawing of the game', 'Beste Zeichnung des Spiels', 'Miglior disegno della partita', 'Mejor dibujo de la partida', 'Meilleur dessin de la partie'],
  places: ['Places played', 'Gespielte Orte', 'Luoghi giocati', 'Lugares jugados', 'Lieux joués'],
  playAgain: ['Play again', 'Nochmal', 'Gioca ancora', 'Otra vez', 'Rejouer'],
  bot: ['Bot', 'Bot', 'Bot', 'Bot', 'Bot'],
  rules: [
    ['A mystery place is chosen. Clues appear one at a time, hardest first.', 'Ein geheimer Ort wird gewählt. Hinweise erscheinen einzeln, der schwerste zuerst.', 'Viene scelto un luogo misterioso. Gli indizi appaiono uno alla volta, dal più difficile.', 'Se elige un lugar misterioso. Las pistas aparecen de una en una, la más difícil primero.', 'Un lieu mystère est choisi. Les indices apparaissent un par un, du plus difficile au plus facile.'],
    ['Guess early for more points: clue 1 is worth 5, clue 5 is worth 1. A wrong guess shows the next clue and costs 1 point.', 'Früh raten bringt mehr: Hinweis 1 ist 5 Punkte wert, Hinweis 5 nur 1. Ein falscher Tipp zeigt den nächsten Hinweis und kostet 1 Punkt.', 'Indovina presto per più punti: l’indizio 1 vale 5, il 5 vale 1. Un errore mostra l’indizio successivo e costa 1 punto.', 'Adivina pronto para ganar más: la pista 1 vale 5, la 5 vale 1. Un fallo muestra la siguiente pista y cuesta 1 punto.', 'Devine tôt pour plus de points : l’indice 1 vaut 5, l’indice 5 vaut 1. Une erreur montre l’indice suivant et coûte 1 point.'],
    ['Then draw the outline from memory, north up. Size and position don’t matter, only the shape.', 'Dann zeichnest du den Umriss aus dem Gedächtnis, Norden oben. Größe und Lage sind egal, nur die Form zählt.', 'Poi disegna il contorno a memoria, nord in alto. Dimensione e posizione non contano, solo la forma.', 'Luego dibuja el contorno de memoria, con el norte arriba. Tamaño y posición dan igual; solo cuenta la forma.', 'Puis dessine le contour de mémoire, nord en haut. Taille et position ne comptent pas, seule la forme compte.'],
    ['Accuracy measures how much better your shape is than a plain circle or square. It multiplies your points from 1× up to 1,000×.', 'Die Genauigkeit misst, wie viel besser deine Form ist als ein einfacher Kreis oder ein Quadrat. Sie multipliziert deine Punkte von 1× bis 1.000×.', 'La precisione misura quanto la tua forma è migliore di un semplice cerchio o quadrato. Moltiplica i punti da 1× fino a 1.000×.', 'La precisión mide cuánto mejor es tu forma que un simple círculo o cuadrado. Multiplica tus puntos de 1× a 1.000×.', 'La précision mesure à quel point ta forme est meilleure qu’un simple cercle ou carré. Elle multiplie tes points de 1× à 1 000×.'],
    ['Islands: draw only the main landmass. If you miss all five clues you score 0, but you still draw for practice.', 'Inseln: Zeichne nur das Hauptland. Wer alle fünf Hinweise verpasst, bekommt 0 Punkte, zeichnet aber trotzdem zum Üben.', 'Isole: disegna solo la terraferma principale. Se manchi tutti e cinque gli indizi fai 0, ma disegni comunque per esercizio.', 'Islas: dibuja solo la masa principal. Si fallas las cinco pistas sumas 0, pero dibujas igualmente para practicar.', 'Îles : dessine seulement la terre principale. Si tu rates les cinq indices, tu marques 0, mais tu dessines quand même.'],
    ['Scores stay hidden until the end, then the bars lift one round at a time.', 'Die Punkte bleiben bis zum Ende verdeckt, dann werden sie Runde für Runde aufgedeckt.', 'I punteggi restano nascosti fino alla fine, poi si svelano un round alla volta.', 'Las puntuaciones se ocultan hasta el final y luego se revelan ronda a ronda.', 'Les scores restent cachés jusqu’à la fin, puis se dévoilent manche par manche.'],
  ],
};

/** Translate a key, filling {placeholders}. */
export function tr(lang, key, vars = {}) {
  const i = Math.max(0, UI_LANGS.indexOf(lang));
  const entry = S[key];
  if (!entry) return key;
  if (Array.isArray(entry[0])) return entry.map((row) => row[i]);
  let s = entry[i] ?? entry[0];
  for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

export function missingTranslations() {
  const out = [];
  for (const [k, v] of Object.entries(S)) {
    const rows = Array.isArray(v[0]) ? v : [v];
    rows.forEach((r, j) => {
      if (r.length !== UI_LANGS.length || r.some((x) => typeof x !== 'string' || !x.trim())) out.push(`${k}${rows.length > 1 ? `[${j}]` : ''}`);
    });
  }
  return out;
}
