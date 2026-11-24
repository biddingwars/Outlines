# Beta testing Project X

The game can keep a log of your games on your phone so they can be analysed
afterwards. Nothing is ever sent by the game itself: you decide when to export.

## Switch it on
1. Open the game, tap the **settings** (gear) button on the menu.
2. Under **Game log (for analysis)**, switch on **Record my games**.

From now on every game is saved on the device, finished or left early (the 40
most recent are kept), together with any app errors.

## Play normally
Play the way you normally would. Useful extras:
- Try every difficulty and both packs.
- Try other languages, and type place names the way you naturally would.
- If something looks wrong, remember the time, or take a screenshot.

## Send the log
1. Settings → **Export**.
2. Tap **Share** and send the file (Mail, Messages, AirDrop, Files…), or tap
   **Copy** and paste the text into the chat with Claude.
3. Add a sentence about anything you noticed (with screenshots if you have them).

## What is in the log
For each game: the date, pack and difficulty, the five clues of each round, your
guesses and how long they took, your drawings with their accuracy and score, the
bot's results, and names you typed that the game did not recognise. App errors
are listed with the screen they happened on. No names of players are stored.

Turn the switch off, or tap **Clear log**, at any time. "Delete all data" in the
privacy page removes it too.

## For the analysis (developer)
    node tools/analyze-log.mjs project-x-log.json --svg drawings/
prints a report (results, clue-by-clue solving, accuracy per place, wrong and
unrecognised guesses, timing, errors) and writes every drawing over the real
outline, worst first.
