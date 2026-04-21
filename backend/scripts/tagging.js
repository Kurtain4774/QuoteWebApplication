// Heuristic tagger for quotes that arrive with only { text, author }.
// Returns an array of tags drawn from the 8 genre tags used elsewhere:
// philosophy, love, motivation, humor, science, politics, wisdom, literature.
//
// Strategy: combine an author-hint map (substring match on the author string)
// with keyword regexes against the quote text. Coverage is partial by design;
// the goal is "good enough for Explorer filters", not perfect classification.

// Author -> tags. Keys are lowercase substrings; we match with String.includes,
// so "william shakespeare" and "shakespeare" both fire when the author is
// "William Shakespeare".
const AUTHOR_TAGS = {
  // literature
  'shakespeare':            ['literature'],
  'mark twain':             ['literature', 'humor'],
  'oscar wilde':            ['literature', 'humor'],
  'victor hugo':            ['literature'],
  'charles dickens':        ['literature'],
  'ernest hemingway':       ['literature'],
  'robert frost':           ['literature'],
  'emily dickinson':        ['literature'],
  'maya angelou':           ['literature', 'wisdom'],
  'stephen chbosky':        ['literature'],
  'ralph waldo emerson':    ['literature', 'philosophy'],
  'henry david thoreau':    ['literature', 'philosophy'],
  'leo tolstoy':            ['literature'],
  'fyodor dostoevsky':      ['literature'],
  'jane austen':            ['literature'],
  'j.k. rowling':           ['literature'],
  'j.r.r. tolkien':         ['literature'],
  'c.s. lewis':             ['literature', 'philosophy'],
  'george bernard shaw':    ['literature', 'humor'],
  'dr. seuss':              ['literature', 'humor'],
  'kurt vonnegut':          ['literature', 'humor'],
  'edgar allan poe':        ['literature'],
  'walt whitman':           ['literature'],

  // science
  'albert einstein':        ['science', 'wisdom'],
  'isaac newton':           ['science'],
  'charles darwin':         ['science'],
  'marie curie':            ['science'],
  'stephen hawking':        ['science'],
  'carl sagan':             ['science'],
  'galileo galilei':        ['science'],
  'nikola tesla':           ['science'],
  'richard feynman':        ['science', 'humor'],

  // politics
  'abraham lincoln':        ['politics', 'wisdom'],
  'winston churchill':      ['politics', 'motivation'],
  'mahatma gandhi':         ['politics', 'wisdom'],
  'eleanor roosevelt':      ['politics', 'motivation'],
  'franklin d. roosevelt':  ['politics'],
  'theodore roosevelt':     ['politics', 'motivation'],
  'nelson mandela':         ['politics', 'wisdom'],
  'john f. kennedy':        ['politics'],
  'martin luther king':     ['politics', 'wisdom'],
  'thomas jefferson':       ['politics', 'philosophy'],
  'benjamin franklin':      ['politics', 'wisdom'],
  'malcolm x':              ['politics'],
  'barack obama':           ['politics'],

  // philosophy / wisdom
  'socrates':               ['philosophy', 'wisdom'],
  'plato':                  ['philosophy', 'wisdom'],
  'aristotle':              ['philosophy', 'wisdom'],
  'confucius':              ['philosophy', 'wisdom'],
  'lao tzu':                ['philosophy', 'wisdom'],
  'friedrich nietzsche':    ['philosophy'],
  'rené descartes':         ['philosophy'],
  'rene descartes':         ['philosophy'],
  'voltaire':               ['philosophy', 'humor'],
  'immanuel kant':          ['philosophy'],
  'søren kierkegaard':      ['philosophy'],
  'soren kierkegaard':      ['philosophy'],
  'jean-paul sartre':       ['philosophy'],
  'arthur schopenhauer':    ['philosophy'],
  'marcus aurelius':        ['philosophy', 'wisdom'],
  'seneca':                 ['philosophy', 'wisdom'],
  'epictetus':              ['philosophy', 'wisdom'],
  'rumi':                   ['philosophy', 'love'],
  'khalil gibran':          ['philosophy', 'love'],
  'buddha':                 ['philosophy', 'wisdom'],

  // motivation
  'steve jobs':             ['motivation'],
  'henry ford':             ['motivation'],
  'walt disney':            ['motivation'],
  'thomas edison':          ['motivation'],
  'tony robbins':           ['motivation'],
  'zig ziglar':             ['motivation'],
  'jim rohn':               ['motivation'],
  'napoleon hill':          ['motivation'],
  'vince lombardi':         ['motivation'],
  'michael jordan':         ['motivation'],
  'muhammad ali':           ['motivation'],
  'wayne dyer':             ['motivation', 'wisdom'],
  'oprah winfrey':          ['motivation'],
};

// Tag -> keyword regex. Word-boundaried, case-insensitive. Tuned to favour
// precision over recall so we don't slap every quote with five tags.
const KEYWORD_TAGS = {
  love:       /\b(love|loved|loving|lover|loves|heart|hearts|romance|romantic|beloved|affection|cherish)\b/i,
  motivation: /\b(success|successful|dream|dreams|goal|goals|achieve|achievement|persevere|persist|courage|brave|impossible|possible|believe|opportunity)\b/i,
  wisdom:     /\b(wise|wisdom|learn|learned|learning|knowledge|understand|experience|truth|truths|insight|teach|teaches|taught)\b/i,
  philosophy: /\b(meaning|existence|exist|soul|virtue|virtuous|being|reality|consciousness|ethics|moral|morality|reason|reasoning)\b/i,
  science:    /\b(science|scientist|discover|discovery|experiment|theory|theories|universe|cosmos|physics|chemistry|biology|evolution|gravity|equation)\b/i,
  politics:   /\b(freedom|liberty|government|democracy|democratic|nation|nations|justice|injustice|tyranny|oppression|revolution|equality|war|peace)\b/i,
  humor:      /\b(laugh|laughs|laughed|laughing|joke|jokes|funny|fool|fools|ridiculous|absurd|silly|comedy)\b/i,
  literature: /\b(poem|poetry|poet|novel|story|stories|writer|writing|book|books|verse)\b/i,
};

function tagify(text, author) {
  const tags = new Set();
  const t = String(text || '');
  const a = String(author || '').toLowerCase();

  // Author hints: substring match against the lowercased author string.
  if (a) {
    for (const key of Object.keys(AUTHOR_TAGS)) {
      if (a.includes(key)) {
        for (const tag of AUTHOR_TAGS[key]) tags.add(tag);
      }
    }
  }

  // Keyword hints: regex against the quote text.
  for (const tag of Object.keys(KEYWORD_TAGS)) {
    if (KEYWORD_TAGS[tag].test(t)) tags.add(tag);
  }

  return Array.from(tags);
}

module.exports = { tagify };
