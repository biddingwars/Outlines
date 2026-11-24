import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fold, resolve, suggest } from '../engine/names.js';
import { world, us } from './helpers.js';

test('fold strips accents, case, punctuation and articles', () => {
  assert.equal(fold('  Côte d’Ivoire '), 'cote divoire');
  assert.equal(fold('Österreich'), 'osterreich');
  assert.equal(fold('The Netherlands'), 'netherlands');
  assert.equal(fold('Le Royaume-Uni'), 'royaume uni');
  assert.equal(fold('Großbritannien'), 'grossbritannien');
});

test('guesses resolve in all five languages', () => {
  for (const name of ['Spain', 'Spanien', 'Spagna', 'España', 'espana', 'Espagne']) assert.equal(resolve(world.index, name), 'ESP');
  for (const name of ['Germany', 'Deutschland', 'Germania', 'Alemania', 'Allemagne']) assert.equal(resolve(world.index, name), 'DEU');
  assert.equal(resolve(us.index, 'Kalifornien'), 'CA');
  assert.equal(resolve(us.index, 'Louisiane'), 'LA');
});

test('aliases and one typo are accepted, junk is not', () => {
  assert.equal(resolve(world.index, 'UK'), 'GBR');
  assert.equal(resolve(world.index, 'great britain'), 'GBR');
  assert.equal(resolve(world.index, 'Brasil'), 'BRA');
  assert.equal(resolve(world.index, 'Argentnia'), 'ARG'); // transposition
  assert.equal(resolve(world.index, 'Portugall'), 'PRT');
  assert.equal(resolve(world.index, 'Narnia'), null);
  assert.equal(resolve(world.index, ''), null);
  assert.equal(resolve(world.index, 'Ch'), null);
});

test('autocomplete matches word starts and shows the player’s language', () => {
  const s = suggest(world.index, 'united ki', 'en');
  assert.equal(s[0].id, 'GBR');
  assert.equal(s[0].label, 'United Kingdom');
  const de = suggest(world.index, 'spa', 'de');
  assert.equal(de[0].id, 'ESP');
  assert.equal(de[0].label, 'Spanien');
  const viaGerman = suggest(world.index, 'Deutsch', 'en');
  assert.equal(viaGerman[0].id, 'DEU');
  assert.equal(viaGerman[0].label, 'Germany');
  assert.equal(viaGerman[0].matched, 'Deutschland');
  assert.deepEqual(suggest(world.index, '', 'en'), []);
  assert.ok(suggest(world.index, 'a', 'en', 3).length <= 3);
});
