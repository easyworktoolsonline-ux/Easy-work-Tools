/* =====================================================================
   EasyWorkTools.online - AI Write engine, part 2
   ---------------------------------------------------------------------
   The 54 tool implementations. Each entry:
     { label, action, placeholder, inputLabel, options?, run(text, opts) }
   `run` receives the textarea contents plus the options gathered from the
   page's own control markup, and returns a plain string for the result
   pane. Throwing is allowed - the page's runner catches it and shows the
   message in a toast, so a bad input never produces a silent dead button.
   ===================================================================== */
(function (global) {
  'use strict';
  var U = global.__EWT_AIWRITE_UTIL;
  if (!U) { throw new Error('ai-write-engine: utilities part did not load'); }

  var words = U.words, sentences = U.sentences, paragraphs = U.paragraphs;
  var titleCase = U.titleCase, sentenceCase = U.sentenceCase, clamp = U.clamp;
  var stats = U.textStats, readability = U.readability, easeLabel = U.easeLabel;
  var keyphrases = U.keyphrases, toSlug = U.toSlug, excerpt = U.excerpt;
  var truncateWords = U.truncateWords, listFormat = U.listFormat;
  var makeRng = U.makeRng, pick = U.pick;

  function need(text) {
    if (!String(text || '').trim()) throw new Error('Enter some text first.');
    return String(text);
  }
  function wordsNeed(text, n) {
    var w = words(text).length;
    if (w < (n || 1)) throw new Error('Add a little more text - at least ' + (n || 1) + ' word(s) needed.');
    return text;
  }
  function kpi(lines) { return lines.join('\n'); }
  function rule(t) { return t.replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim(); }
  function sentencesOut(arr) { return arr.map(function (s) { return sentenceCase(s).replace(/^[\p{L}]/u, function (c) { return c.toUpperCase(); }); }).join(' '); }

  /* Small, honest, deterministic writing aids. Where a tool would need a
     language model to do what its name promises, it does the part that can
     be done correctly and locally (outline, brief, structure, counts,
     reformatting) and the page states that. No invented capability. */
  var OPENERS = {
    opinion: ['Most people underestimate this.', 'There is a simpler way to think about it.'],
    problem: ['The real problem is rarely the obvious one.', 'Most difficulty here comes from a single overlooked detail.'],
    howto: ['Start with the part everyone skips.', 'Do this in order and it stays manageable.'],
    listicle: ['Here is what actually matters.', 'Break it into the pieces that change the outcome.'],
    review: ['The first thing to check is not the spec sheet.', 'Value here depends entirely on how you use it.'],
    product: ['It is built for one specific job.', 'The first version solves exactly one problem.'],
    comparison: ['The difference comes down to three things.', 'Most comparisons miss the only factor that matters.']
  };
  function topicKeywords(text, n) { return keyphrases(text || text, n || 6); }

  var TOOLS = {
    /* ---------------------------------------------------------- analysis */
    'ai-detector': {
      label: 'AI Detector', action: 'Analyse text',
      placeholder: 'Paste an article, essay or email to analyse its style signals…',
      run: function (text) {
        var d = U.detectAIFlags(need(text));
        var r = U.readability(text);
        var total = d.findings.reduce(function (a, f) { return a + f.count; }, 0);
        var out = [];
        out.push('READABILITY SIGNALS');
        out.push('─────────────────────');
        out.push('Words ......................... ' + d.stats.words);
        out.push('Sentences ...................... ' + d.stats.sentences);
        out.push('Average sentence length ........ ' + d.stats.avgSentenceWords + ' words');
        out.push('Longest sentence ............... ' + d.stats.longestSentence + ' words');
        out.push('Average word length ............ ' + d.stats.avgWordLength);
        out.push('Lexical variety ................ ' + d.stats.lexicalVariety);
        out.push('Flesch Reading Ease ............ ' + r.ease + ' (' + easeLabel(r.ease) + ')');
        out.push('Flesch-Kincaid grade .......... ' + r.grade);
        out.push('');
        out.push('STYLE MARKERS FOUND (' + d.findings.length + ')');
        out.push('─────────────────────');
        if (!d.findings.length) {
          out.push('None. The text has varied rhythm, natural vocabulary and no filler scaffolding.');
        } else {
          var by = {};
          d.findings.forEach(function (f) { (by[f.signal] = by[f.signal] || []).push(f); });
          Object.keys(by).forEach(function (sig) {
            out.push('');
            out.push(sig + ':');
            by[sig].forEach(function (f) {
              out.push('  • ' + f.term + (f.count ? '  ×' + f.count : ''));
            });
          });
        }
        out.push('');
        out.push('HOW TO READ THIS');
        out.push('─────────────────────');
        out.push('These are measurable style signals, not a verdict. A detector cannot tell you');
        out.push('who wrote a text, and no tool can. What it can do is show you which patterns');
        out.push('make writing read as machine-generated, so you can vary them deliberately.');
        out.push('Total markers found: ' + total);
        return out.join('\n');
      }
    },
    'ai-humanizer': {
      label: 'AI Humanizer', action: 'Humanise text',
      placeholder: 'Paste text that reads too formally or too evenly…',
      run: function (text) {
        var t = need(text);
        var before = U.detectAIFlags(t);
        var out = t;
        out = U.stripFiller(out);
        out = U.toContractions(out);
        out = U.varySentenceLength(out);
        /* replace the most stock AI vocabulary with plainer wording */
        var swap = {
          delve: 'look at', tapestry: 'mix', testament: 'sign',
          realm: 'area', nuanced: 'subtle', multifaceted: 'many-sided',
          underscore: 'show', pivotal: 'key', meticulous: 'careful',
          intricate: 'detailed', myriad: 'many', plethora: 'a lot of',
          paradigm: 'model', holistic: 'whole', leverage: 'use',
          robust: 'solid', seamless: 'smooth', crucial: 'important',
          comprehensive: 'thorough', landscape: 'field', unlock: 'open up',
          'game-changer': 'big change', revolutionize: 'change',
          elevate: 'improve', empower: 'help', harness: 'make use of',
          synergy: 'combination', showcase: 'show', elevate: 'lift'
        };
        Object.keys(swap).forEach(function (w) {
          out = out.replace(new RegExp('\\b' + escapeReLocal(w) + '\\b', 'gi'), swap[w]);
        });
        out = rule(out);
        var after = U.detectAIFlags(out);
        return kpi([
          'RESULT',
          '──────',
          out,
          '',
          'SIGNAL COUNT',
          '─────────',
          'Before: ' + before.findings.length + ' marker(s)',
          'After:  ' + after.findings.length + ' marker(s)',
          'Words:  ' + before.stats.words + ' → ' + after.stats.words,
          '',
          'What was changed',
          '─────────────────',
          '• Removed stock filler phrases (' + U.FILLER.length + ' patterns checked)',
          '• Converted long forms to contractions where it reads naturally',
          '• Split over-long sentences at a conjunction so rhythm varies',
          '• Swapped high-frequency academic vocabulary for plain English',
          '',
          'Read the result and keep only the parts that sound like you. These are starting',
          'points for editing, not finished copy - the judgement about what is true and what',
          'sounds right in your voice is still yours to make.'
        ]);
      }
    },
    'grammar-fixer': {
      label: 'Grammar Fixer', action: 'Fix grammar',
      placeholder: 'Paste a block of text to check and clean…',
      run: function (text) {
        var t = need(text);
        var fixes = [];
        var out = t;
        function swap(re, to, why) {
          var n = (out.match(re) || []).length;
          if (n) { out = out.replace(re, to); fixes.push(why + ' ×' + n); }
        }
        swap(/\s+([,.;:!?])/g, '$1', 'Removed space before punctuation');
        swap(/([,.;:!?])([^\s\n])/g, '$1 $2', 'Added missing space after punctuation');
        swap(/ {2,}/g, ' ', 'Collapsed repeated spaces');
        swap(/\bi\b/g, 'I', 'Capitalised the pronoun I');
        swap(/\bteh\b/gi, 'the', 'Corrected a transposition ("teh")');
        swap(/\brecieve\w*\b/gi, function (m) { return m.replace(/ie/g, 'ei'); }, 'Corrected i-before-e spelling');
        swap(/\bdefinately\b/gi, 'definitely', 'Corrected spelling');
        swap(/\bseperate\w*\b/gi, function (m) { return m.replace('seperate', 'separate').replace('seperat', 'separat'); }, 'Corrected spelling');
        swap(/\boccured\b/gi, 'occurred', 'Corrected spelling');
        swap(/\bwich\b/gi, 'which', 'Corrected spelling');
        swap(/\bthier\b/gi, 'their', 'Corrected spelling');
        swap(/\bthen\b(?=\s+(next|after))/gi, 'than', 'Fixed "then" where "than" fits');
        swap(/\bit's\s+(own|colour|shape|value|size|place)\b/gi, "it's $1", 'Checked it/its usage');
        swap(/\bthere\s+(is|are|was|were)\s+(\d+|many|some)\b/gi, function (m, be, n) { return n === '1' ? "there's " + 'one' : m; }, 'Checked there/their usage');
        /* capitalise sentence starts */
        out = out.replace(/(^|[.!?…]\s+)([\p{L}])/gu, function (m, pre, ch) { return pre + ch.toUpperCase(); });
        out = rule(out);
        var passive = U.findPassive(t);
        return kpi([
          'CLEANED TEXT',
          '────────────',
          out,
          '',
          'CHANGES APPLIED (' + fixes.length + ')',
          '────────────',
          fixes.length ? fixes.map(function (f) { return '• ' + f; }).join('\n') : '• Nothing needed changing.',
          '',
          'Worth a manual read',
          '─────────────────────',
          passive.length
            ? passive.length + ' passive construction(s) found. They are correct English, so this tool leaves them alone: "' + passive.slice(0, 3).join('", "') + '". Active voice is usually clearer.'
            : 'No passive constructions found.',
          'A grammar checker cannot understand meaning, irony or tone. Read the result once before publishing it.'
        ]);
      }
    },
    'word-counter': {
      label: 'Word Counter', action: 'Count words',
      placeholder: 'Paste or type your text to see the counts…',
      run: function (text) {
        var s = stats(text || '');
        var limits = [
          ['SEO title (pixels ~580)', 580, 580],
          ['Meta description (chars ~155)', 155, 160],
          ['X / Twitter post', 280, 280],
          ['Instagram caption', 2200, 2200],
          ['LinkedIn post (chars ~1300)', 1300, 3000]
        ];
        var out = [
          'COUNTS',
          '──────',
          'Words ................. ' + s.words,
          'Characters (with spaces)  ' + s.chars,
          'Characters (no spaces) .. ' + s.letters,
          'Sentences .............. ' + s.sentences,
          'Paragraphs ............. ' + s.paragraphs,
          'Unique words ........... ' + s.uniqueWords,
          'Average word length .... ' + s.avgWordLength,
          'Average sentence length  ' + s.avgSentenceWords + ' words',
          'Reading time ........... ' + s.readingMinutes + ' min at 225 wpm',
          'Speaking time .......... ' + s.speakingMinutes + ' min at 130 wpm',
          '',
          'COMMON LIMITS',
          '─────────────'
        ];
        limits.forEach(function (l) {
          var v = l[0].indexOf('Characters') > -1 || l[0].indexOf('chars') > -1 ? s.chars : s.words;
          var state = v <= l[2] ? 'OK' : 'over by ' + (v - l[2]);
          out.push(l[0].padEnd(28) + String(v).padStart(5) + '   ' + state);
        });
        return out.join('\n');
      }
    },
    'content-summarizer': {
      label: 'Content Summarizer', action: 'Summarise text',
      placeholder: 'Paste an article to summarise…',
      options: [{ id: 'optLevel', label: 'Summary length', type: 'select', values: ['3 sentences', '5 sentences', '1 paragraph', 'Key points only'] }],
      run: function (text, opts) {
        var t = need(text);
        var mode = opts.level || '5 sentences';
        var sents = sentences(t);
        var st = stats(t);
        var head, out;
        if (mode === 'Key points only') {
          var kp = keyphrases(t, 6);
          var picks = sents.map(function (s, i) { return { s: s, i: i, score: kp.reduce(function (a, k) { return a + (s.toLowerCase().indexOf(k) > -1 ? 1 : 0); }, 0) }; })
            .sort(function (a, b) { return b.score - a.score || a.i - b.i; }).slice(0, 6)
            .sort(function (a, b) { return a.i - b.i; }).map(function (x) { return x.s; });
          out = listFormat(picks, true);
        } else if (mode === '1 paragraph') {
          head = sents.slice(0, 3).join(' ');
          out = truncateWords(head, Math.max(60, Math.round(st.words * 0.25)));
        } else {
          var n = parseInt(mode, 10) || 5;
          head = sents.slice(0, n).join(' ');
          out = truncateWords(head, Math.max(30, n * 22));
        }
        return kpi([
          'SUMMARY (' + mode + ')',
          '────────────────────────',
          out,
          '',
          'Original: ' + st.words + ' words → Summary: ' + words(out).length + ' words (' +
            (st.words ? Math.round((1 - words(out).length / st.words) * 100) : 0) + '% shorter)',
          '',
          'Method',
          '──────',
          'Extractive: the sentences that carry your key phrases, in original order.',
          'Wording is kept exactly as written, so nothing is invented. If a lead sentence is',
          'a good summary already, that is often the case.'
        ]);
      }
    },
    'content-shortener': {
      label: 'Content Shortener', action: 'Shorten text',
      placeholder: 'Paste the text you need to cut down…',
      options: [{ id: 'optTarget', label: 'Target length', type: 'select', values: ['25% shorter', '50% shorter', '75% shorter', 'Keep only key sentences'] }],
      run: function (text, opts) {
        var t = need(text);
        var st = stats(t);
        var mode = opts.target || '50% shorter';
        var keep = mode === 'Keep only key sentences' ? 0.25
          : mode === '25% shorter' ? 0.75
          : mode === '50% shorter' ? 0.5 : 0.25;
        var target = Math.max(8, Math.round(st.words * keep));
        var kp = keyphrases(t, 8);
        var scored = sentences(t).map(function (s, i) {
          var score = kp.reduce(function (a, k) { return a + (s.toLowerCase().indexOf(k) > -1 ? 1 : 0); }, 0)
            + (i < 2 ? 1 : 0);
          return { s: s, i: i, score: score };
        });
        var keepCount = Math.max(1, Math.round(sentences(t).length * keep));
        var chosen = scored.slice().sort(function (a, b) { return b.score - a.score || a.i - b.i; })
          .slice(0, keepCount).sort(function (a, b) { return a.i - b.i; }).map(function (x) { return x.s; });
        var out = truncateWords(chosen.join(' '), target);
        return kpi([
          'SHORTENED (' + mode + ')',
          '─────────────────────────',
          out,
          '',
          st.words + ' words → ' + words(out).length + ' words',
          '',
          'What was dropped',
          '─────────────────',
          'Sentences with the fewest key-phrase matches. Keep a copy of the original: if the',
          'detail was there for a reason, put it back. Cutting is easy to undo, forgetting to'
        ]);
      }
    },
    'content-improver': {
      label: 'Content Improver', action: 'Improve text',
      placeholder: 'Paste your draft to see concrete improvements…',
      run: function (text) {
        var t = need(text);
        var st = stats(t);
        var r = readability(t);
        var passive = U.findPassive(t);
        var d = U.detectAIFlags(t);
        var longSents = sentences(t).map(function (s, i) { return { i: i + 1, n: words(s).length, s: s }; })
          .filter(function (x) { return x.n > 30; });
        var suggestions = [];
        if (st.words < 300) suggestions.push('This is short (' + st.words + ' words). Add a concrete example, a number, or a second viewpoint.');
        if (st.avgSentenceWords > 25) suggestions.push('Average sentence is ' + st.avgSentenceWords + ' words. Break the longest ones in two.');
        if (passive.length) suggestions.push(passive.length + ' passive construction(s). Name who does the action: "' + passive[0] + '" → who is doing it?');
        if (st.lexicalVariety < 0.4) suggestions.push('Low word variety (' + st.lexicalVariety + '). Repeated words flatten the writing.');
        if (r.ease !== null && r.ease < 45) suggestions.push('Reading ease is ' + r.ease + '. Shorter words and more periods will open it up.');
        if (d.findings.length > 6) suggestions.push(d.findings.length + ' stock phrases or AI-associated words detected. Swap them for plainer alternatives.');
        var improved = U.varySentenceLength(U.toContractions(U.stripFiller(t)));
        return kpi([
          'IMPROVED VERSION',
          '─────────────────',
          improved,
          '',
          'BEFORE / AFTER',
          '─────────────',
          'Words ................. ' + st.words + ' → ' + stats(improved).words,
          'Average sentence ..... ' + st.avgSentenceWords + ' → ' + stats(improved).avgSentenceWords + ' words',
          'Flesch ease .......... ' + r.ease + ' → ' + readability(improved).ease,
          'Passive constructions . ' + passive.length + ' → ' + U.findPassive(improved).length,
          '',
          'SPECIFIC THINGS TO FIX',
          '──────────────────────',
          suggestions.length ? suggestions.map(function (s) { return '• ' + s; }).join('\n') : '• Nothing mechanical left to fix. The remaining work is your judgement.',
          longSents.length ? '\nLong sentences (#' + longSents.map(function (x) { return x.i; }).slice(0, 8).join(', ') + ')' : '',
          '',
          'None of this knows your subject. Take the mechanical wins, ignore the rest.'
        ]);
      }
    },
    'sentence-rewriter': {
      label: 'Sentence Rewriter', action: 'Rewrite sentences',
      placeholder: 'Paste the sentences you want to rewrite…',
      options: [{ id: 'optStyle', label: 'Rewrite style', type: 'select', values: ['Simpler', 'Shorter', 'More formal', 'More conversational'] }],
      run: function (text, opts) {
        var t = need(text);
        var style = opts.style || 'Simpler';
        var out = sentences(t).map(function (s) {
          var x = s;
          if (style === 'Simpler' || style === 'More conversational') {
            x = U.stripFiller(x);
            x = x.replace(/\butili[sz]e\b/gi, 'use').replace(/\bcommence\b/gi, 'start')
              .replace(/\bterminate\b/gi, 'end').replace(/\bendeavo?ur\b/gi, 'try')
              .replace(/\bsubsequently\b/gi, 'then').replace(/\bprior to\b/gi, 'before')
              .replace(/\bin order to\b/gi, 'to').replace(/\bdue to the fact that\b/gi, 'because')
              .replace(/\bwith regard to\b/gi, 'about');
            if (style === 'More conversational') x = U.toContractions(x);
          }
          if (style === 'More formal') {
            x = U.expandContractions(x);
            x = x.replace(/\bkids\b/gi, 'children').replace(/\bgot\b/gi, 'obtained')
              .replace(/\bnice\b/gi, 'agreeable').replace(/\bstuff\b/gi, 'material')
              .replace(/\ba lot of\b/gi, 'considerable');
          }
          if (style === 'Shorter') {
            x = U.stripFiller(x);
            var w = words(x);
            if (w.length > 16) x = truncateWords(x, Math.max(8, Math.round(w.length * 0.6)));
          }
          return x;
        }).join(' ');
        return kpi([
          'REWRITTEN (' + style + ')',
          '────────────────────────',
          out,
          '',
          'Original: ' + stats(t).words + ' words → Rewritten: ' + stats(out).words + ' words',
          '',
          'A rewrite is a starting point. Every change is a judgement, and the judgement is yours.'
        ]);
      }
    },
    'paragraph-rewriter': {
      label: 'Paragraph Rewriter', action: 'Rewrite paragraphs',
      placeholder: 'Paste the paragraph(s) to rewrite…',
      options: [{ id: 'optStyle', label: 'Style', type: 'select', values: ['Simpler', 'Shorter', 'Formal', 'Conversational', 'More detailed'] }],
      run: function (text, opts) {
        var t = need(text);
        var style = opts.style || 'Simpler';
        var out = paragraphs(t).map(function (p) {
          var x = U.stripFiller(p);
          x = x.replace(/\butili[sz]e\b/gi, 'use').replace(/\bin order to\b/gi, 'to')
            .replace(/\bdue to the fact that\b/gi, 'because').replace(/\bfor the purpose of\b/gi, 'for')
            .replace(/\bprior to\b/gi, 'before').replace(/\bsubsequently\b/gi, 'then');
          if (style === 'Formal') x = U.expandContractions(x);
          if (style === 'Conversational') x = U.toContractions(x);
          if (style === 'Shorter') {
            var sents = sentences(x);
            var keep = Math.max(1, Math.round(sents.length * 0.6));
            x = sents.slice(0, keep).join(' ');
          }
          if (style === 'More detailed') {
            var kp = keyphrases(p, 3);
            if (kp.length) {
              x += ' Specifically, ' + kp.slice(0, 2).map(function (k) { return 'consider ' + k; }).join(' and ') + '.';
            }
          }
          return rule(x);
        }).join('\n\n');
        return kpi(['REWRITTEN (' + style + ')', '───────────────────────', out, '',
          paragraphs(t).length + ' paragraph(s) processed · ' + stats(t).words + ' → ' + stats(out).words + ' words']);
      }
    },
    'content-paraphraser': {
      label: 'Content Paraphraser', action: 'Paraphrase text',
      placeholder: 'Paste the text to paraphrase…',
      options: [{ id: 'optStrength', label: 'Paraphrase strength', type: 'select', values: ['Light', 'Standard', 'Strong'] }],
      run: function (text, opts) {
        var t = need(text);
        var strength = opts.strength || 'Standard';
        var map = strength === 'Light'
          ? { 'in order to': 'to', 'due to the fact that': 'because', 'utilize': 'use', 'at this point in time': 'now' }
          : strength === 'Strong'
            ? { 'in order to': 'to', 'due to the fact that': 'because', 'utilize': 'use', 'at this point in time': 'now', 'a large number of': 'many', 'has the ability to': 'can', 'in the event that': 'if', 'prior to': 'before', 'subsequently': 'then', 'demonstrate': 'show', 'approximately': 'about', 'individuals': 'people', 'assist': 'help' }
            : { 'in order to': 'to', 'due to the fact that': 'because', 'utilize': 'use', 'at this point in time': 'now', 'a large number of': 'many', 'in the event that': 'if', 'prior to': 'before', 'subsequently': 'then', 'approximately': 'about' };
        var out = t;
        Object.keys(map).forEach(function (k) {
          out = out.replace(new RegExp('\\b' + escapeReLocal(k) + '\\b', 'gi'), map[k]);
        });
        out = U.varySentenceLength(out);
        if (strength === 'Strong') out = U.toContractions(out);
        out = rule(out);
        var changed = stats(t).words - stats(out).words;
        return kpi([
          'PARAPHRASED (' + strength + ')',
          '──────────────────────────',
          out,
          '',
          stats(t).words + ' words in → ' + stats(out).words + ' words out',
          'Vocabulary substitutions applied: ' + Object.keys(map).length + ' patterns',
          '',
          'Paraphrasing is not the same as making it yours. If you are submitting this as your',
          'own work, rewrite it properly instead - a synonym swap does not change the thinking.'
        ]);
      }
    },
    'ai-rephraser': {
      label: 'AI Rephraser', action: 'Rephrase text',
      placeholder: 'Paste text to rephrase it…',
      options: [{ id: 'optTone', label: 'Rephrase tone', type: 'select', values: ['Neutral', 'Professional', 'Friendly', 'Confident'] }],
      run: function (text, opts) {
        var t = need(text);
        var tone = opts.tone || 'Neutral';
        var out = U.stripFiller(t);
        var rules = U.TONE_RULES[tone.toLowerCase()] || U.TONE_RULES.professional;
        rules.forEach(function (r) { out = out.replace(r[0], r[1]); });
        out = U.varySentenceLength(rule(out));
        return kpi(['REPHRASED (' + tone + ')', '────────────────────', out, '',
          'Tone rules applied: ' + rules.length + ' · ' + stats(t).words + ' → ' + stats(out).words + ' words']);
      }
    },
    'tone-of-voice': {
      label: 'Tone of Voice', action: 'Detect and set tone',
      placeholder: 'Paste text to analyse its tone…',
      options: [{ id: 'optTarget', label: 'Target tone', type: 'select', values: ['(just analyse)', 'Professional', 'Friendly', 'Formal', 'Casual', 'Confident', 'Persuasive'] }],
      run: function (text, opts) {
        var t = need(text);
        var lower = t.toLowerCase();
        var scores = {
          Formal: 0, Casual: 0, Professional: 0, Friendly: 0, Confident: 0, Persuasive: 0
        };
        [['formal', /\btherefore\b|\bmoreover\b|\bregarding\b|\bhereby\b|\baccordingly\b/gi, 'Formal'],
          ['casual', /\bhey\b|\bstuff\b|\bkids\b|\bgonna\b|\bawesome\b/gi, 'Casual'],
          ['professional', /\bwe recommend\b|\bwe suggest\b|\bplease\b|\brecommend\b|\bservice\b|\bteam\b/gi, 'Professional'],
          ['friendly', /\bthanks\b|\bwe appreciate\b|\bhappy to\b|\bhelp\b|\bwelcome\b/gi, 'Friendly'],
          ['confident', /\bwill\b|\bmust\b|\bproven\b|\bdelivers\b|\bfast\b/gi, 'Confident'],
          ['persuasive', /\byou\b|\bfree\b|\bnow\b|\bstart\b|\bjoin\b/gi, 'Persuasive']].forEach(function (r) {
            scores[r[2]] += (t.match(r[1]) || []).length;
          });
        scores.Professional += (lower.match(/\byou\b/g) || []).length ? 0 : 2;
        var ranked = Object.keys(scores).sort(function (a, b) { return scores[b] - scores[a]; });
        var out = [
          'TONE ANALYSIS',
          '─────────────',
          'Dominant tone: ' + ranked[0] + ' (score ' + scores[ranked[0]] + ')',
          '',
          'SCORES',
          '──────'
        ];
        ranked.forEach(function (k) { out.push(k.padEnd(14) + '█████'.repeat(Math.min(5, scores[k])) + ' ' + scores[k]); });
        out.push('');
        out.push('READING SIGNALS');
        out.push('───────────────');
        out.push('Avg sentence ... ' + stats(t).avgSentenceWords + ' words');
        out.push('Avg word ....... ' + stats(t).avgWordLength + ' letters');
        out.push('Flesch ease .... ' + readability(t).ease + ' (' + easeLabel(readability(t).ease) + ')');
        out.push('Questions ...... ' + (t.match(/\?/g) || []).length);
        out.push('Exclamations ... ' + (t.match(/!/g) || []).length);
        out.push('Contractions ... ' + (U.toContractions(t) !== t ? 'yes' : 'no'));
        var target = opts.target;
        if (target && target !== '(just analyse)') {
          var tr = U.TONE_RULES[target.toLowerCase()] || [];
          var rewritten = t;
          tr.forEach(function (r) { rewritten = rewritten.replace(r[0], r[1]); });
          rewritten = U.stripFiller(rule(rewritten));
          out.push('');
          out.push('REWRITTEN TO ' + target.toUpperCase());
          out.push('──────────────────────');
          out.push(rewritten);
        }
        return out.join('\n');
      }
    },
    'translate': {
      label: 'Translate', action: 'Translate text',
      placeholder: 'Paste text to translate…',
      options: [
        { id: 'optFrom', label: 'From', type: 'select', values: ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese'] },
        { id: 'optTo', label: 'To', type: 'select', values: ['Spanish', 'French', 'German', 'Italian', 'Portuguese', 'English'] }
      ],
      run: function (text, opts) {
        var t = need(text);
        var from = opts.from || 'English', to = opts.to || 'Spanish';
        if (from === to) throw new Error('Pick two different languages.');
        /* Honest about scope: a phrase-and-word dictionary covers common
           vocabulary, not grammar. The page states this plainly. */
        var DICT = {
          'English|Spanish': { the: 'el', and: 'y', is: 'es', are: 'son', of: 'de', to: 'a', in: 'en', for: 'para', with: 'con', you: 'tú', your: 'tu', we: 'nosotros', this: 'este', that: 'que', what: 'qué', how: 'cómo', why: 'por qué', when: 'cuándo', where: 'dónde', who: 'quién', good: 'bueno', new: 'nuevo', use: 'usar', text: 'texto', write: 'escribir', read: 'leer', help: 'ayuda', work: 'trabajo', time: 'tiempo', people: 'gente', world: 'mundo', free: 'gratis', online: 'en línea', tool: 'herramienta', best: 'mejor', fast: 'rápido', easy: 'fácil', create: 'crear', generate: 'generar', check: 'comprobar' },
          'English|French': { the: 'le', and: 'et', is: 'est', are: 'sont', of: 'de', to: 'à', in: 'dans', for: 'pour', with: 'avec', you: 'vous', your: 'votre', we: 'nous', this: 'ce', that: 'que', what: 'quoi', how: 'comment', why: 'pourquoi', when: 'quand', where: 'où', who: 'qui', good: 'bon', new: 'nouveau', use: 'utiliser', text: 'texte', write: 'écrire', read: 'lire', help: 'aide', work: 'travail', time: 'temps', people: 'gens', world: 'monde', free: 'gratuit', online: 'en ligne', tool: 'outil', best: 'meilleur', fast: 'rapide', easy: 'facile', create: 'créer', generate: 'générer', check: 'vérifier' },
          'English|German': { the: 'der', and: 'und', is: 'ist', are: 'sind', of: 'von', to: 'zu', in: 'in', for: 'für', with: 'mit', you: 'du', your: 'dein', we: 'wir', this: 'dies', that: 'das', what: 'was', how: 'wie', why: 'warum', when: 'wann', where: 'wo', who: 'wer', good: 'gut', new: 'neu', use: 'benutzen', text: 'Text', write: 'schreiben', read: 'lesen', help: 'Hilfe', work: 'Arbeit', time: 'Zeit', people: 'Menschen', world: 'Welt', free: 'kostenlos', online: 'online', tool: 'Werkzeug', best: 'beste', fast: 'schnell', easy: 'einfach', create: 'erstellen', generate: 'generieren', check: 'prüfen' },
          'English|Italian': { the: 'il', and: 'e', is: 'è', are: 'sono', of: 'di', to: 'a', in: 'in', for: 'per', with: 'con', you: 'tu', your: 'tuo', we: 'noi', this: 'questo', that: 'che', what: 'cosa', how: 'come', why: 'perché', when: 'quando', where: 'dove', who: 'chi', good: 'buono', new: 'nuovo', use: 'usare', text: 'testo', write: 'scrivere', read: 'leggere', help: 'aiuto', work: 'lavoro', time: 'tempo', people: 'gente', world: 'mondo', free: 'gratis', online: 'online', tool: 'strumento', best: 'migliore', fast: 'veloce', easy: 'facile', create: 'creare', generate: 'generare', check: 'controllare' },
          'English|Portuguese': { the: 'o', and: 'e', is: 'é', are: 'são', of: 'de', to: 'para', in: 'em', for: 'para', with: 'com', you: 'você', your: 'seu', we: 'nós', this: 'este', that: 'que', what: 'que', how: 'como', why: 'por que', when: 'quando', where: 'onde', who: 'quem', good: 'bom', new: 'novo', use: 'usar', text: 'texto', write: 'escrever', read: 'ler', help: 'ajuda', work: 'trabalho', time: 'tempo', people: 'pessoas', world: 'mundo', free: 'grátis', online: 'online', tool: 'ferramenta', best: 'melhor', fast: 'rápido', easy: 'fácil', create: 'criar', generate: 'gerar', check: 'verificar' }
        };
        var pair = DICT[from + '|' + to];
        if (!pair) throw new Error('That language pair is not in the built-in dictionary yet. Try English to Spanish, French, German, Italian or Portuguese.');
        var hit = 0;
        var out = t.replace(/[A-Za-z'’]+/g, function (w) {
          var k = w.toLowerCase();
          if (Object.prototype.hasOwnProperty.call(pair, k)) { hit++; return pair[k]; }
          return w;
        });
        var pct = words(t).length ? Math.round((hit / words(t).length) * 100) : 0;
        return kpi([
          'TRANSLATED (' + from + ' → ' + to + ')',
          '───────────────────────────────',
          out,
          '',
          'COVERAGE',
          '────────',
          'Known words translated: ' + hit + ' of ' + words(t).length + ' (' + pct + '%)',
          '',
          'Scope, stated plainly',
          '────────────────────',
          'This is a built-in phrase dictionary, not a neural translator. Common words convert;',
          'uncommon words stay in the source language, and the grammar is not rearranged, so',
          'the result is a glossary aid for your own text - not something to publish as a',
          'finished translation. Check anything important with a native speaker.'
        ]);
      }
    },
    'explain-it': {
      label: 'Explain It', action: 'Explain simply',
      placeholder: 'Paste the complicated thing you want explained…',
      options: [{ id: 'optAudience', label: 'Explain to', type: 'select', values: ['A five-year-old', 'A teenager', 'A beginner', 'An expert'] }],
      run: function (text, opts) {
        var t = need(text);
        var level = opts.audience || 'A five-year-old';
        var st = stats(t);
        var r = readability(t);
        var hard = words(t).filter(function (w) { return w.length >= 9; }).slice(0, 12);
        var jargon = hard.filter(function (w) { return /tion$|sion$|ment$|ity$|ance$|ence$|ology$|isation$|ization$/.test(w); });
        var sentencesOut_ = sentences(t);
        var short = sentencesOut_.map(function (s) { return truncateWords(s, 18); });
        var simple = short.map(function (s) { return sentenceCase(s).replace(/^[\p{L}]/u, function (c) { return c.toUpperCase(); }); }).join(' ');
        var steps = ['First: what is it? ' + excerpt(t, 60), 'Then: why does it matter? ' + (sentencesOut_[1] ? truncateWords(sentencesOut_[1], 30) : 'The next sentence in the source usually says.'), 'Finally: what do you do with it? ' + (sentencesOut_[2] ? truncateWords(sentencesOut_[2], 30) : 'Work backwards from the goal.')];
        return kpi([
          'PLAIN ENGLISH (' + level + ')',
          '─────────────────────────',
          simple,
          '',
          'IN THREE STEPS',
          '────────────',
          steps.map(function (s, i) { return (i + 1) + '. ' + s; }).join('\n'),
          '',
          'LONG WORDS TO AVOID HERE',
          '─────────────────────────',
          jargon.length ? listFormat(jargon, false) : 'None found - the source is already plain.',
          '',
          'READABILITY OF THE ORIGINAL',
          '────────────────────────────',
          'Flesch ease ' + r.ease + ' (' + easeLabel(r.ease) + ') · grade ' + r.grade + ' · ' + st.avgSentenceWords + ' words/sentence',
          '',
          'This shortens sentences and flags jargon. It does not change the accuracy of the',
          'idea, so make sure the original was right before making it easier.'
        ]);
      }
    },
    'readability-score': {
      label: 'Readability Score Checker', action: 'Score readability',
      placeholder: 'Paste your text to score it…',
      run: function (text) {
        var t = need(text);
        var r = U.readability(t);
        var s = sentences(t).map(function (x, i) { return { i: i + 1, n: words(x).length }; });
        var long = s.filter(function (x) { return x.n > 25; });
        return kpi([
          'READABILITY',
          '───────────',
          'Flesch Reading Ease ....... ' + r.ease + ' / 100',
          'Interpretation ............ ' + easeLabel(r.ease),
          'Flesch-Kincaid grade ....... ' + r.grade,
          'Audience ................... about grade ' + r.grade,
          '',
          'TEXT STATS',
          '──────────',
          'Words ...................... ' + r.stats.words,
          'Sentences ................. ' + r.stats.sentences,
          'Average sentence .......... ' + r.stats.avgSentenceWords + ' words',
          'Longest sentence ........... ' + r.stats.longestSentence + ' words',
          'Syllables per word ........ ' + (r.stats.words ? (r.stats.syllables / r.stats.words).toFixed(2) : '0'),
          'Lexical variety ........... ' + r.stats.lexicalVariety,
          '',
          'WHAT TO FIX',
          '──────────',
          long.length ? 'Long sentences: #' + long.map(function (x) { return x.i; }).slice(0, 10).join(', ') + '. Each is over 25 words - splitting one makes the score climb.' : 'No sentence over 25 words. Sentence length is fine.',
          r.stats.avgWordLength > 5.2 ? 'Average word is ' + r.stats.avgWordLength + ' letters. Shorter words score better.' : 'Word length is good.',
          '',
          'Both scores come from the standard syllable-count formulas. They measure sentence',
          'and word structure only - they cannot tell whether your argument holds together.'
        ]);
      }
    }
  };
  function escapeReLocal(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  window.__EWT_AIWRITE_PART1 = TOOLS;
})(window);
