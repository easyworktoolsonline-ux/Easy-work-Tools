/* =====================================================================
   EasyWorkTools.online - AI Write engine
   ---------------------------------------------------------------------
   Shared, dependency-free browser code for every tool in
   /tools/ai-write/. One definition per tool slug, so all 54 tool pages
   stay in sync and the whole thing costs one extra request on only the
   54 pages that need it (not site-wide).

   HONESTY NOTE, because it matters for the AdSense/SEO side of the site:
   these tools are deterministic text utilities. They run entirely in the
   visitor's browser - no API key, no account, no server, nothing is
   uploaded, and no third-party model is called. Anything that reads like
   "AI" (Humanizer, Detector, Rephraser) works from published, checkable
   signals: sentence-length distribution, lexical variety, contraction and
   hedge usage, punctuation habits, passive voice, filler phrases and
   readability formulas. The pages say exactly that. No page claims a
   model, a ranking, or an accuracy figure we cannot substantiate.
   ===================================================================== */
(function (global) {
  'use strict';

  /* ---------------------------------------------------------------- utils */

  var WORD_RE = /[A-Za-z0-9'’\-]+/g;
  var SENTENCE_SPLIT = /[^.!?…]+(?:[.!?…]+|$)/g;

  function $(id) { return document.getElementById(id); }
  function isString(v) { return typeof v === 'string'; }
  function words(text) {
    var m = String(text || '').match(WORD_RE);
    return m ? m : [];
  }
  function sentences(text) {
    var out = String(text || '').match(SENTENCE_SPLIT) || [];
    return out.map(function (s) { return s.trim(); }).filter(function (s) {
      return /[A-Za-z0-9]/.test(s);
    });
  }
  function paragraphs(text) {
    return String(text || '')
      .split(/\n{2,}/)
      .map(function (p) { return p.trim(); })
      .filter(Boolean);
  }
  function lines(text) { return String(text || '').split(/\r?\n/); }
  function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }
  function titleCase(s) {
    var small = { a: 1, an: 1, and: 1, as: 1, at: 1, but: 1, by: 1, for: 1, from: 1,
      if: 1, in: 1, into: 1, nor: 1, of: 1, on: 1, onto: 1, or: 1, over: 1, per: 1,
      the: 1, to: 1, up: 1, via: 1, with: 1, vs: 1 };
    var parts = String(s).split(/(\s+)/);
    var cap = true;
    return parts.map(function (p) {
      if (/^\s+$/.test(p)) return p;
      var out = cap ? p.charAt(0).toUpperCase() + p.slice(1) : p;
      cap = small[p.toLowerCase()] ? false : true;
      return out;
    }).join('');
  }
  function sentenceCase(s) {
    return String(s).toLowerCase().replace(/(^\s*[\p{L}])|([.!?…]\s+[\p{L}])/gu, function (m) {
      return m.toUpperCase();
    });
  }
  function escapeRe(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  /* Deterministic PRNG so a "Generate" button gives a reproducible result
     for the same seed, which makes these testable and avoids pretending
     to be a random language model. */
  function makeRng(seed) {
    var h = 2166136261 >>> 0;
    var s = String(seed == null ? '' : seed);
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return function rng() {
      h ^= h << 13; h >>>= 0;
      h ^= h >> 17;
      h ^= h << 5; h >>>= 0;
      return h / 4294967296;
    };
  }
  function pick(rng, arr) { return arr[Math.floor(rng() * arr.length) % arr.length]; }

  /* --------------------------------------------------------------- stats */

  function textStats(text) {
    var w = words(text);
    var sents = sentences(text);
    var paras = paragraphs(text);
    var chars = String(text || '').length;
    var letters = (String(text || '').match(/[\p{L}]/gu) || []).length;
    var syl = syllablesOf(w);
    var unique = {};
    w.forEach(function (x) { unique[x.toLowerCase()] = 1; });
    var d = w.length - 1;
    return {
      chars: chars,
      letters: letters,
      words: w.length,
      uniqueWords: Object.keys(unique).length,
      sentences: sents.length,
      paragraphs: paras.length,
      avgWordLength: w.length ? +(w.reduce(function (a, x) { return a + x.length; }, 0) / w.length).toFixed(1) : 0,
      avgSentenceWords: sents.length ? +(w.length / sents.length).toFixed(1) : 0,
      longestSentence: sents.reduce(function (m, x) {
        return Math.max(m, words(x).length);
      }, 0),
      syllables: syl,
      readingMinutes: w.length ? +(w.length / 225).toFixed(1) : 0,
      speakingMinutes: w.length ? +(w.length / 130).toFixed(1) : 0,
      lexicalVariety: w.length ? +((Object.keys(unique).length / w.length)).toFixed(3) : 0
    };
  }

  function syllablesOf(ws) {
    var total = 0;
    for (var i = 0; i < ws.length; i++) {
      var w = String(ws[i]).toLowerCase().replace(/[^a-z]/g, '');
      if (!w) continue;
      var m = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
        .replace(/^y/, '').match(/[aeiouy]{1,2}/g);
      total += m ? m.length : 1;
    }
    return total;
  }

  /* Flesch Reading Ease + Flesch-Kincaid Grade, the two formulas the
     readability tools already document. */
  function readability(text) {
    var st = textStats(text);
    var W = st.words, S = st.sentences, Y = st.syllables;
    if (W < 3 || S === 0) return { ease: null, grade: null, stats: st };
    var ease = 206.835 - 1.015 * (W / S) - 84.6 * (Y / W);
    var grade = 0.39 * (W / S) + 11.8 * (Y / W) - 15.59;
    return {
      ease: Math.round(clamp(ease, 0, 100)),
      grade: Math.round(clamp(grade, 0, 20) * 10) / 10,
      stats: st
    };
  }
  function easeLabel(v) {
    if (v === null) return 'n/a';
    if (v >= 90) return 'Very easy - 5th grade';
    if (v >= 80) return 'Easy - 6th grade';
    if (v >= 70) return 'Fairly easy - 7th grade';
    if (v >= 60) return 'Standard - 8th to 9th grade';
    if (v >= 50) return 'Fairly difficult - 10th to 12th grade';
    if (v >= 30) return 'Difficult - university';
    return 'Very difficult - graduate';
  }

  /* ------------------------------------------------------- shared lexicons */

  var FILLER = [
    'it is important to note that', 'it is worth mentioning that',
    'in today\'s fast-paced world', 'in the ever-evolving landscape',
    'at the end of the day', 'it goes without saying',
    'needless to say', 'as we all know', 'a well-known fact',
    'plays a crucial role', 'serves as a testament',
    'the fact of the matter is', 'in conclusion', 'furthermore',
    'moreover', 'additionally', 'however', 'therefore'
  ];
  var CONTRACTIONS = {
    'do not': "don't", 'does not': "doesn't", 'did not': "didn't",
    'is not': "isn't", 'are not': "aren't", 'was not': "wasn't",
    'were not': "weren't", 'cannot': "can't", 'can not': "can't",
    'will not': "won't", 'would not': "wouldn't", 'should not': "shouldn't",
    'could not': "couldn't", 'have not': "haven't", 'has not': "hasn't",
    'had not': "hadn't", 'it is': "it's", 'that is': "that's",
    'there is': "there's", 'they are': "they're", 'we are': "we're",
    'you are': "you're", 'i am': "I'm", 'let us': "let's",
    'they will': "they'll", 'we will': "we'll", 'you will': "you'll",
    'i will': "I'll", 'i have': "I've", 'we have': "we've"
  };
  var HEDGES = [
    'maybe', 'perhaps', 'possibly', 'somewhat', 'quite', 'rather',
    'sort of', 'kind of', 'a bit', 'fairly', 'pretty much', 'arguably',
    'seemingly', 'apparently', 'presumably', 'relatively'
  ];
  var AI_TELLS = [
    'delve', 'tapestry', 'testament', 'realm', 'nuanced', 'multifaceted',
    'underscore', 'pivotal', 'meticulous', 'intricate', 'myriad',
    'plethora', 'paradigm', 'holistic', 'leverage', 'robust',
    'seamless', 'crucial', 'vital', 'comprehensive', 'landscape',
    'unlock', 'game-changer', 'revolutionize', 'elevate', 'empower',
    'harness', 'synergy', 'dynamic', 'foster', 'showcase'
  ];
  var PASSIVE = [
    [/\b(is|are|was|were|be|been|being)\s+(\w+(?:ed|en))\b/gi,
      function (m, be, verb) { return m; }]
  ];
  var TONE_RULES = {
    professional: [
      [/\bhey\b/gi, 'Hello'], [/\byou know\b/gi, 'as you may know'],
      [/\ba lot of\b/gi, 'many'], [/\bkids\b/gi, 'children'],
      [/\bstuff\b/gi, 'material'], [/\bguys\b/gi, 'everyone'],
      [/\bgonna\b/gi, 'going to'], [/\bwanna\b/gi, 'want to']
    ],
    friendly: [
      [/\btherefore\b/gi, 'so'], [/\bhowever\b/gi, 'but'],
      [/\bmoreover\b/gi, 'and'], [/\bfurthermore\b/gi, 'plus'],
      [/\butilize\b/gi, 'use'], [/\bendeavor\b/gi, 'try']
    ],
    formal: [
      [/\bI think\b/g, 'In my assessment'], [/\bkind of\b/gi, 'somewhat'],
      [/\bgot\b/gi, 'obtained'], [/\bbig\b/gi, 'substantial'],
      [/\bnice\b/gi, 'agreeable'], [/\bstuff\b/gi, 'material']
    ],
    casual: [
      [/\bcommence\b/gi, 'start'], [/\bterminate\b/gi, 'end'],
      [/\bendeavour\b/gi, 'try'], [/\bpurchase\b/gi, 'buy'],
      [/\bassist\b/gi, 'help']
    ],
    confident: [
      [/\bmight\b/gi, 'will'], [/\bperhaps\b/gi, 'definitely'],
      [/\bpossibly\b/gi, 'certainly'], [/\bI think we should\b/gi, 'We will'],
      [/\bmay want to\b/gi, 'should']
    ],
    persuasive: [
      [/\bI think\b/g, 'Clearly,'],
      [/\bmaybe\b/gi, 'without doubt'],
      [/\bwe should probably\b/gi, 'we must']
    ]
  };

  /* -------------------------------------------------------- text transforms */

  function words_(text) { return words(text); }

  function stripFiller(text) {
    var out = text;
    FILLER.forEach(function (p) {
      out = out.replace(new RegExp('(^|[\\s.!?])' + escapeRe(p) + '[,\\s]*', 'gi'), '$1');
    });
    return out.replace(/[ \t]{2,}/g, ' ').replace(/\s+([,.;:!?])/g, '$1');
  }

  function toContractions(text) {
    var out = text;
    Object.keys(CONTRACTIONS).forEach(function (long) {
      out = out.replace(new RegExp('\\b' + escapeRe(long) + '\\b', 'gi'), function (m) {
        var rep = CONTRACTIONS[long];
        return m[0] === m[0].toUpperCase() ? rep.charAt(0).toUpperCase() + rep.slice(1) : rep;
      });
    });
    return out;
  }

  function expandContractions(text) {
    var out = text;
    Object.keys(CONTRACTIONS).forEach(function (long) {
      var short = CONTRACTIONS[long];
      out = out.replace(new RegExp('\\b' + escapeRe(short) + '\\b', 'gi'), long);
    });
    return out;
  }

  function varySentenceLength(text) {
    /* Split the longest sentences at a natural comma/conjunction so the
       rhythm stops being uniform. Deterministic and reversible enough to
       read naturally, which is the actual goal. */
    return sentences(text).map(function (s) {
      var w = words(s);
      if (w.length < 18) return s;
      var body = s.replace(/[.!?…]+$/, '');
      var tail = s.slice(body.length);
      var m = body.match(/^(.{40,}?),\s+(and|but|so|because|which|while|although|however)\s+(.+)$/i);
      if (m) return titleCase(m[1]) + '. ' + m[2].charAt(0).toUpperCase() + m[2].slice(1) + ' ' + m[3] + tail;
      var half = Math.floor(w.length / 2);
      var cut = body.lastIndexOf(' ', half);
      if (cut > 20) {
        return body.slice(0, cut).replace(/[,;]$/, '.') + ' ' +
          body.slice(cut + 1).charAt(0).toUpperCase() + body.slice(cut + 2) + tail;
      }
      return s;
    }).join(' ');
  }

  function findPassive(text) {
    var hits = [];
    var re = /\b(is|are|was|were|be|been|being)\s+([a-z]+(?:ed|en))\b(\s+by\b)?/gi;
    var m;
    while ((m = re.exec(text))) {
      var verb = m[2].toLowerCase();
      if (['need', 'used', 'based', 'called', 'named', 'red', 'bed', 'seed'].indexOf(verb) === -1) {
        hits.push(m[0]);
      }
    }
    return hits;
  }

  function listFormat(items, ordered, start) {
    if (!items.length) return '';
    if (ordered) {
      return items.map(function (it, i) {
        return (start || 1) + i + '. ' + it;
      }).join('\n');
    }
    return items.map(function (it) { return '- ' + it; }).join('\n');
  }

  function bulletsFromText(text) {
    return String(text)
      .split(/(?:\r?\n)+|(?:\s+[-*•]\s+)/)
      .map(function (s) { return s.replace(/^[-*•]\s*/, '').trim(); })
      .filter(function (s) { return s.length > 2; });
  }

  function keyphrases(text, n) {
    var ws = words(text).map(function (w) { return w.toLowerCase(); });
    var stop = {};
    ('a an the and or but if then than that this these those of to in on for with as by at from is are was were be been being it its it\'s do does did have has had not no so such can could should would may might will shall about into over under again further once here there when where why how all any both each few more most other some such only own same too very just also'.split(' ')).forEach(function (w) { stop[w] = 1; });
    var freq = {};
    ws.forEach(function (w) {
      if (w.length < 4 || stop[w]) return;
      freq[w] = (freq[w] || 0) + 1;
    });
    var unigrams = Object.keys(freq).sort(function (a, b) { return freq[b] - freq[a] || a.localeCompare(b); });
    var bigrams = {};
    for (var i = 0; i < ws.length - 1; i++) {
      if (stop[ws[i]] || stop[ws[i + 1]] || ws[i].length < 4) continue;
      var bg = ws[i] + ' ' + ws[i + 1];
      bigrams[bg] = (bigrams[bg] || 0) + 1;
    }
    var bigramList = Object.keys(bigrams).filter(function (b) { return bigrams[b] > 1; })
      .sort(function (a, b) { return bigrams[b] - bigrams[a] || a.localeCompare(b); });
    var out = [];
    bigramList.concat(unigrams).forEach(function (k) {
      if (out.length >= (n || 8)) return;
      if (out.some(function (o) { return o.indexOf(k) === -1 && k.indexOf(o) === -1; })) out.push(k);
    });
    return out;
  }

  function toSlug(text) {
    return String(text).toLowerCase().normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/['’"]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
  }

  function excerpt(text, n) {
    var s = sentences(text)[0] || String(text).trim();
    return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s;
  }
  function truncateWords(text, n) {
    var w = words(text);
    return w.length <= n ? String(text).trim() : w.slice(0, n).join(' ') + '…';
  }

  function detectAIFlags(text) {
    var t = String(text);
    var st = textStats(t);
    var findings = [];
    var lower = t.toLowerCase();

    AI_TELLS.forEach(function (w) {
      var re = new RegExp('\\b' + escapeRe(w) + '\\b', 'gi');
      var n = (t.match(re) || []).length;
      if (n) findings.push({ signal: 'Vocabulary', term: w, count: n });
    });
    FILLER.forEach(function (p) {
      var re = new RegExp(escapeRe(p), 'gi');
      var n = (t.match(re) || []).length;
      if (n) findings.push({ signal: 'Filler phrase', term: p, count: n });
    });
    HEDGES.forEach(function (p) {
      var re = new RegExp('\\b' + escapeRe(p) + '\\b', 'gi');
      var n = (t.match(re) || []).length;
      if (n) findings.push({ signal: 'Hedge', term: p, count: n });
    });
    if (st.sentences >= 4) {
      var lens = sentences(t).map(function (s) { return words(s).length; });
      var mean = lens.reduce(function (a, b) { return a + b; }, 0) / lens.length;
      var sd = Math.sqrt(lens.reduce(function (a, b) { return a + (b - mean) * (b - mean); }, 0) / lens.length);
      if (sd < 2.2) {
        findings.push({ signal: 'Rhythm', term: 'Sentence lengths near-identical (sd ' + sd.toFixed(1) + ')', count: lens.length });
      }
      if (mean > 26) findings.push({ signal: 'Rhythm', term: 'Mean sentence ' + mean.toFixed(1) + ' words - long and uniform', count: lens.length });
    }
    if (st.lexicalVariety && st.lexicalVariety < 0.42 && st.words > 40) {
      findings.push({ signal: 'Repetition', term: 'Low lexical variety (' + st.lexicalVariety + ')', count: st.uniqueWords });
    }
    var passive = findPassive(t);
    if (passive.length >= 3) findings.push({ signal: 'Grammar', term: 'Passive voice (' + passive.length + ' instances)', count: passive.length });
    if (!/[’']/.test(t) && st.words > 40) {
      findings.push({ signal: 'Punctuation', term: 'No contractions anywhere', count: 0 });
    }
    if (!/^"[^"]{60,}"/m.test(t) && !/\b(said|asked|replied|noted)\b/i.test(t) && st.sentences >= 5) {
      findings.push({ signal: 'Style', term: 'No quoted speech or reporting verbs', count: 0 });
    }
    return { findings: findings, stats: st, lower: lower };
  }
  window.__EWT_AIWRITE_UTIL = {
    $: $, words: words, sentences: sentences, paragraphs: paragraphs, lines: lines,
    clamp: clamp, titleCase: titleCase, sentenceCase: sentenceCase, makeRng: makeRng, pick: pick,
    textStats: textStats, readability: readability, easeLabel: easeLabel,
    stripFiller: stripFiller, toContractions: toContractions, expandContractions: expandContractions,
    varySentenceLength: varySentenceLength, findPassive: findPassive, listFormat: listFormat,
    bulletsFromText: bulletsFromText, keyphrases: keyphrases, toSlug: toSlug, excerpt: excerpt,
    truncateWords: truncateWords, detectAIFlags: detectAIFlags,
    FILLER: FILLER, HEDGES: HEDGES, AI_TELLS: AI_TELLS, TONE_RULES: TONE_RULES
  };
})(window);
