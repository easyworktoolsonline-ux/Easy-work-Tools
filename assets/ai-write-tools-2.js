/* =====================================================================
   EasyWorkTools.online - AI Write engine, part 3
   ---------------------------------------------------------------------
   The writing, planning and generator tools. Same contract as part 2.
   These produce genuinely useful, real documents (outlines, briefs,
   plans, structures, social copy, contracts, schemas, counts, checklists)
   from the user's own input. They are drafting aids, and each result
   says so - none of them claims to be a hosted language model.
   ===================================================================== */
(function (global) {
  'use strict';
  var U = global.__EWT_AIWRITE_UTIL;
  var P1 = global.__EWT_AIWRITE_PART1;
  if (!U || !P1) { throw new Error('ai-write-engine: part 1 did not load'); }

  var words = U.words, sentences = U.sentences, paragraphs = U.paragraphs;
  var keyphrases = U.keyphrases, toSlug = U.toSlug, listFormat = U.listFormat;
  var truncateWords = U.truncateWords, excerpt = U.excerpt;
  var titleCase = U.titleCase, makeRng = U.makeRng, pick = U.pick;
  var stats = U.textStats, readability = U.readability;

  function need(text) { if (!String(text || '').trim()) throw new Error('Enter a topic or some text first.'); return String(text); }
  function kpi(lines) { return lines.join('\n'); }
  function rule(t) { return String(t).replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim(); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  var INTENTS = [
    ['How to', ['What it is', 'What you need', 'Step by step', 'Common mistakes', 'Next steps']],
    ['Listicle', ['Why this matters', 'Item 1', 'Item 2', 'Item 3', 'Item 4', 'How to use this', 'Wrap up']],
    ['Problem / solution', ['The problem', 'Why it happens', 'The fix', 'Preventing it', 'When to escalate']],
    ['Comparison', ['Option A', 'Option B', 'Head to head', 'Which suits you', 'Recommendation']],
    ['Explainer', ['The short answer', 'Background', 'The detail', 'Where it matters', 'Key takeaways']],
    ['Opinion', ['The claim', 'The case for', 'The case against', 'Your position', 'Conclusion']],
    ['Product', ['What it is', 'Who it is for', 'Key features', 'How it works', 'Pricing', 'Getting started']],
    ['Review', ['Overview', 'Build quality', 'Performance', 'Value', 'Who should buy it', 'Verdict']]
  ];
  var INTENTS2 = [
    ['Opinion', 'The claim', 'The case for', 'The case against', 'Your position', 'Conclusion'],
    ['Problem / solution', 'The problem', 'Why it happens', 'The fix', 'Preventing it', 'When to escalate'],
    ['How to', 'What it is', 'What you need', 'Step by step', 'Common mistakes', 'Next steps'],
    ['Listicle', 'Why this matters', 'Item 1', 'Item 2', 'Item 3', 'Item 4', 'Wrap up'],
    ['Comparison', 'Option A', 'Option B', 'Head to head', 'Which suits you', 'Recommendation'],
    ['Explainer', 'The short answer', 'Background', 'The detail', 'Where it matters', 'Key takeaways'],
    ['Product', 'What it is', 'Who it is for', 'Key features', 'How it works', 'Pricing'],
    ['Review', 'Overview', 'Build quality', 'Performance', 'Value', 'Verdict']
  ];
  var ANGLES = ['beginner mistakes', 'advanced tactics', 'a short checklist', 'a worked example', 'common questions', 'the costs involved', 'what experts skip', 'a case study'];
  var POST_FORMATS = {
    'LinkedIn post': ['Hook (1 line, no clickbait)', 'Context (2-3 lines)', '3 short points, one per line', 'One takeaway', 'Question to the reader'],
    'Instagram caption': ['Hook', 'Line break', '3-5 short lines', 'Call to action', 'Hashtags (5-10)'],
    'X / Twitter post': ['One strong claim', 'Supporting line', 'Optional: a link or CTA'],
    'Facebook post': ['Hook', 'Short paragraph', 'Bullets', 'Question'],
    'Blog post': ['Title', 'Intro (2-3 sentences)', 'Main point', 'Supporting detail', 'Conclusion + CTA']
  };

  var TOOLS2 = {
    'essay-writer': {
      label: 'Essay Writer', action: 'Build essay',
      placeholder: 'Enter your essay topic, e.g. "the impact of sleep on learning"…',
      options: [
        { id: 'optLength', label: 'Length', type: 'select', values: ['500 words', '1000 words', '1500 words', '2000 words'] },
        { id: 'optStyle', label: 'Structure', type: 'select', values: INTENTS.map(function (i) { return i[0]; }) }
      ],
      run: function (text, opts) {
        var topic = need(text).trim();
        var words0 = parseInt(opts.length, 10) || 1000;
        var intent = opts.style || 'How to';
        var shape = INTENTS.filter(function (i) { return i[0] === intent; })[0] || INTENTS[0];
        var kp = keyphrases(topic, 5);
        var words1 = Math.max(3, Math.round(words0 / (shape[1].length + 1)));
        var rng = makeRng(topic);
        var out = [
          titleCase(topic),
          'Essay structure (' + intent.toLowerCase() + ', ~' + words0 + ' words)',
          '================================================',
          ''
        ];
        shape[1].forEach(function (h, i) {
          out.push(titleCase(h) + '  (~' + words1 + ' words)');
          out.push('- Point: ' + (kp[i % kp.length] ? 'focus on ' + kp[i % kp.length] : 'state the main claim in one sentence'));
          out.push('- Evidence: ' + (rng() > 0.5 ? 'a specific example or case' : 'a statistic you can verify'));
          out.push('- Link back to: "' + topic + '"');
          out.push('');
        });
        out.push('Total sections: ' + shape[1].length + ' × ~' + words1 + ' words ≈ ' + (shape[1].length * words1) + ' words');
        out.push('');
        out.push('THESIS STATEMENT (fill in)');
        out.push('──────────────────────────');
        out.push('"' + titleCase(topic) + ' matters because [reason], as shown by [evidence]."');
        out.push('');
        out.push('INTRODUCTION PARAGRAPH (template)');
        out.push('─────────────────────────────');
        out.push('Write about ' + topic + '. Start with a concrete example, name the problem, state your position in one sentence, and tell the reader what they will get from reading on. About 80 words.');
        out.push('');
        out.push('KEY TERMS TO WORK IN');
        out.push('───────────────────────');
        out.push(kp.length ? listFormat(kp, false) : '- (add a sentence or two to extract key terms)');
        out.push('');
        out.push('This is a planning scaffold, not a finished essay. The outline gives you a structure and a word budget; the argument, evidence and wording are yours to write.');
        return out.join('\n');
      }
    },
    'article-writer': {
      label: 'Article Writer', action: 'Build article',
      placeholder: 'Enter your article title or topic…',
      options: [
        { id: 'optWords', label: 'Length', type: 'select', values: ['800 words', '1200 words', '2000 words', '3000 words'] },
        { id: 'optIntent', label: 'Search intent', type: 'select', values: ['Informational', 'Commercial', 'Transactional', 'Navigational'] }
      ],
      run: function (text, opts) {
        var topic = need(text).trim();
        var target = parseInt(opts.words, 10) || 1200;
        var intent = opts.intent || 'Informational';
        var kp = keyphrases(topic, 6);
        var introWords = Math.round(target * 0.12), bodyWords = Math.round(target * 0.68), endWords = Math.round(target * 0.2);
        var out = [
          'ARTICLE PLAN',
          '============',
          'Title: ' + titleCase(topic),
          'Slug: /' + toSlug(topic) + '/',
          'Meta title: ' + (titleCase(topic).length > 55 ? titleCase(topic).slice(0, 55) + '…' : titleCase(topic)),
          'Meta description: ' + (truncateWordsLocal(topic, 20) + ' - what it is, how it works, and when to use it.'),
          'Target length: ~' + target + ' words',
          'Search intent: ' + intent,
          '',
          'WORD BUDGET',
          '───────────',
          'Introduction ... ' + introWords,
          'Body .......... ' + bodyWords,
          'Conclusion .... ' + endWords,
          '',
          'H2 SECTIONS',
          '──────────',
          '1. What is ' + topic + '?  (~' + Math.round(bodyWords * 0.2) + ' words)',
          '   - define it in one sentence a beginner would understand',
          '2. Why it matters  (~' + Math.round(bodyWords * 0.25) + ' words)',
          '   - the problem it solves, with a number or example',
          '3. How to use it  (~' + Math.round(bodyWords * 0.3) + ' words)',
          '   - numbered steps, each one actionable',
          '4. Common mistakes  (~' + Math.round(bodyWords * 0.15) + ' words)',
          '   - 3-4 real mistakes, each with the fix',
          '5. Alternatives and when to use them  (~' + Math.round(bodyWords * 0.1) + ' words)',
          '',
          'FAQ (target these as real questions)',
          '─────────────────────────────',
          '- What is the simplest way to get started with ' + topic + '?',
          '- Is ' + topic + ' free?',
          '- How long does it take to see results?',
          '- What are the most common mistakes people make?',
          '',
          'KEY TERMS TO NATURALLY INCLUDE',
          '──────────────────────────────',
          kp.length ? listFormat(kp, false) : '- (paste a longer intro to extract terms)',
          '',
          'INTERNAL LINKS TO ADD',
          '─────────────────────',
          '- Link to one related tool on EasyWorkTools (use a descriptive anchor, not "click here")',
          '- Link to one related article on the blog',
          '',
          'This gives you a complete, SEO-conscious structure with a word budget. Fill in the',
          'arguments and examples yourself - the plan is the hard part, done for you.'
        ].join('\n');
        return out;
      }
    },
    'article-generator': {
      label: 'Article Generator', action: 'Generate SEO article plan',
      placeholder: 'Enter your article topic and target keyword…',
      options: [{ id: 'optWords', label: 'Length', type: 'select', values: ['1000 words', '1500 words', '2000 words', '3000 words'] }],
      run: function (text, opts) {
        var t = need(text);
        var topic = t.split(/[\n,]/)[0].trim();
        var kw = t.split(/[\n,]/)[1] ? t.split(/[\n,]/)[1].trim() : topic;
        var target = parseInt(opts.words, 10) || 1500;
        var kp = keyphrases(t, 6);
        var out = [
          'SEO ARTICLE BRIEF',
          '=================',
          'Topic: ' + topic,
          'Target keyword: ' + kw,
          'Search intent: informational (someone wants to understand ' + kw + ')',
          'Target length: ~' + target + ' words',
          'Slug: /' + toSlug(kw) + '/',
          '',
          'META',
          '────',
          'Title tag: ' + (titleCase(kw).length > 55 ? titleCase(kw).slice(0, 55) + '…' : titleCase(kw)),
          'Meta description: Learn ' + kw + ' - a practical guide with steps, examples and answers to common questions.',
          'H1: ' + titleCase(kw),
          '',
          'H2 STRUCTURE (with keyword placement)',
          '───────────────────────────────',
          'Intro (' + Math.round(target * 0.12) + ' w) - answer the query in the first 100 words, mention "' + kw + '" once',
          'H2: What is ' + kw + '? (' + Math.round(target * 0.2) + ' w) - define, with an example',
          'H2: Why ' + kw + ' matters (' + Math.round(target * 0.2) + ' w) - the benefit, backed by a number',
          'H2: How to use ' + kw + ' (' + Math.round(target * 0.3) + ' w) - numbered steps',
          'H2: Common mistakes with ' + kw + ' (' + Math.round(target * 0.1) + ' w) - 3 mistakes, each with a fix',
          'H2: FAQ (' + Math.round(target * 0.08) + ' w)',
          '',
          'KEYWORD PLACEMENT',
          '─────────────────',
          'Title tag: 1× (exact)',
          'H1: 1× (exact)',
          'First 100 words: 1× (exact)',
          'H2s: 2-3× (exact, in 2 headings)',
          'Body: 1× per 150 words (natural, not stuffed)',
          'Meta description: 1× (exact)',
          '',
          'SECONDARY TERMS',
          '────────────────',
          kp.length ? listFormat(kp, false) : '- (paste a longer intro to extract terms)',
          '',
          'FAQ TO TARGET',
          '────────────',
          '- What is the best way to learn ' + kw + '?',
          '- How much does ' + kw + ' cost?',
          '- Is ' + kw + ' beginner friendly?',
          '- How long does ' + kw + ' take?',
          '',
          'Readability target: aim for Flesch 60+ (plain English). Include one original image',
          'with descriptive alt text. This is a brief to write from, not text to publish as-is.'
        ].join('\n');
        return out;
      }
    },
    'blog-post-generator': {
      label: 'Blog Post Generator', action: 'Generate blog plan',
      placeholder: 'Enter your blog topic…',
      options: [{ id: 'optWords', label: 'Length', type: 'select', values: ['800 words', '1200 words', '1800 words', '2500 words'] }],
      run: function (text, opts) {
        var topic = need(text).trim();
        var target = parseInt(opts.words, 10) || 1200;
        var kp = keyphrases(topic, 5);
        return kpi([
          'BLOG POST PLAN',
          '================',
          'Title: ' + titleCase(topic),
          'Slug: /blog/' + toSlug(topic) + '.html',
          'Meta description: ' + truncateWordsLocal(topic, 20) + ' - a practical walkthrough with examples and answers to common questions.',
          'Target length: ~' + target + ' words',
          '',
          'OUTLINE',
          '───────',
          'H1: ' + titleCase(topic),
          '',
          'Intro (' + Math.round(target * 0.12) + ' w): hook + promise + what the reader gets',
          '',
          'H2: What is ' + topic + '?',
          '  (' + Math.round(target * 0.2) + ' w) - plain definition, one concrete example',
          '',
          'H2: Why people use it',
          '  (' + Math.round(target * 0.2) + ' w) - 3 use cases, each with an outcome',
          '',
          'H2: Step-by-step',
          '  (' + Math.round(target * 0.3) + ' w) - 4-6 numbered steps, each independently actionable',
          '',
          'H2: Common mistakes',
          '  (' + Math.round(target * 0.1) + ' w) - 3 mistakes, each paired with the fix',
          '',
          'H2: FAQ',
          '  (' + Math.round(target * 0.08) + ' w) - 4 questions with 2-3 sentence answers',
          '',
          'KEY TERMS',
          '---------',
          kp.length ? listFormat(kp, false) : '- (add a sentence or two to extract terms)',
          '',
          'INTERNAL LINKS',
          '----------------',
          '- → related tool (descriptive anchor text)',
          '- → one related article',
          '- → the tools index',
          '',
          'This is an outline and SEO brief. Write the article yourself; the structure is the hard part.'
        ]);
      }
    },
    'post-writer': {
      label: 'Post Writer', action: 'Build post',
      placeholder: 'Enter your post topic and platform…',
      options: [
        { id: 'optPlatform', label: 'Platform', type: 'select', values: Object.keys(POST_FORMATS) },
        { id: 'optTone', label: 'Tone', type: 'select', values: ['Professional', 'Friendly', 'Bold', 'Neutral'] }
      ],
      run: function (text, opts) {
        var topic = need(text).trim();
        var platform = opts.platform || 'LinkedIn post';
        var tone = opts.tone || 'Professional';
        var shape = POST_FORMATS[platform] || POST_FORMATS['LinkedIn post'];
        var kp = keyphrases(topic, 4);
        var out = [
          platform.toUpperCase() + ' POST',
          '='.repeat(platform.length + 6),
          'Topic: ' + topic,
          'Tone: ' + tone,
          'Target: ' + (platform.indexOf('Twitter') > -1 ? '≤280 characters' : platform.indexOf('Instagram') > -1 ? 'short, visual' : '1500-3000 characters'),
          '',
          'STRUCTURE (' + shape.length + ' parts)',
          '──────────────────────────',
        ];
        shape.forEach(function (s, i) {
          out.push((i + 1) + '. ' + s);
          out.push('   ' + (i === 0
            ? 'Hook: "' + (kp[0] ? 'Most people get ' + kp[0] + ' wrong.' : topic + ' is not what you think.') + '"'
            : i === 1
              ? 'Context: ' + truncateWordsLocal(topic, 15) + ' - keep it to two lines'
              : i === shape.length - 1
                ? (platform.indexOf('Twitter') > -1 ? 'Link or CTA' : 'Ask a question to invite replies')
                : 'Point ' + i + ': one idea, one line, no jargon'));
          out.push('');
        });
        out.push('DRAFT (fill in the specifics)');
        out.push('─────────────────────────────');
        out.push((kp[0] ? 'Most people get ' + kp[0] + ' wrong.' : topic + ' is not what you think.'));
        out.push('');
        out.push('Here is the short version. ' + truncateWordsLocal(topic, 18) + '.');
        out.push('');
        var pts = (kp.length ? kp : ['point one', 'point two', 'point three']).slice(0, 3);
        pts.forEach(function (p) { out.push('• ' + titleCase(p) + ' - one sentence explaining why it matters.'); });
        out.push('');
        out.push('What has your experience been? Drop it in the comments.');
        if (platform.indexOf('Instagram') > -1 || platform.indexOf('Facebook') > -1) {
          out.push('');
          out.push('#' + toSlug(topic).split('-').slice(0, 4).map(function (h) { return h; }).join(' #'));
        }
        out.push('');
        out.push('Character count of this draft: ' + (out.join('\n').length) + ' (the platform limit is checked when you paste).');
        out.push('Fill in the specifics, add one real example or number, and post it as your voice.');
        return out.join('\n');
      }
    },
    'story-generator': {
      label: 'Story Generator', action: 'Build story',
      placeholder: 'Enter your story idea, genre, or character…',
      options: [
        { id: 'optGenre', label: 'Genre', type: 'select', values: ['Mystery', 'Sci-fi', 'Fantasy', 'Thriller', 'Romance', 'Horror', 'Adventure', 'Drama'] },
        { id: 'optLength', label: 'Length', type: 'select', values: ['Short (800 words)', 'Medium (2000 words)', 'Long (5000 words)'] }
      ],
      run: function (text, opts) {
        var idea = need(text).trim();
        var genre = opts.genre || 'Mystery';
        var len = opts.length || 'Short (800 words)';
        var total = len.indexOf('800') > -1 ? 800 : len.indexOf('2000') > -1 ? 2000 : 5000;
        var rng = makeRng(idea + genre);
        var chars = {
          Mystery: [['The stranger who knew too much', 'A retired detective who cannot stop noticing patterns'], ['The locked room with no key', 'A locksmith who trusts locks more than people'], ['The last message', 'An archivist who reads letters nobody collected']],
          'Sci-fi': [['Signal from the edge', 'An engineer who decodes a message that is answering back'], ['The long winter orbit', 'A botanist alone on a station at the edge of the dark'], ['Memory market', 'A courier who sells other people’s recollections'], ['The last upload', 'A programmer who finds her own backup still running']],
          Fantasy: [['The map that redraws itself', 'A cartographer who cannot leave her own city'], ['Salt and silver', 'A blacksmith bound by an old oath'], ['The seventh door', 'A courier who delivers to houses that should not exist'], ['Lantern season', 'A lamplighter who keeps the dark honest']],
          Thriller: [['The nine-minute window', 'A surgeon who has exactly nine minutes to stop a killing'], ['Dead drop', 'A courier who opens the wrong envelope'], ['The witness list', 'A lawyer who knows every name on a list that keeps growing'], ['Split second', 'A pilot who lands on a runway that is not on the map']],
          Romance: [['Second chances at the corner café', 'Two people who meet the same way every winter'], ['The shared apartment', 'A nurse and a carpenter who hate the same noise'], ['Letters from a year ago', 'Two people writing to someone who has moved on'], ['Second draft', 'An editor and her writer, who is also her neighbour']],
          Horror: [['The house that remembers', 'A surveyor who maps a house that adds a room each visit'], ['The friendly neighbour', 'A man who is helped by his neighbour, every night'], ['Sound in the walls', 'A renter who hears the previous tenant living normally'], ['The long drive home', 'A driver who takes a road that is not on the map']],
          Adventure: [['The map with a hole in it', 'A cartographer who leaves a piece out on purpose'], ['The last expedition', 'A climber who finds the camp already pitched'], ['The river that goes inland', 'A kayaker following a current that defies geography'], ['The clockmaker’s island', 'A courier carrying a broken clock to a place that stopped']],
          Drama: [['The long goodbye', 'A sibling sorting a parent’s house after the funeral'], ['The second shift', 'A nurse and a patient who recognise each other'], ['The quiet sale', 'A couple selling the house they built'], ['A year of letters', 'Two friends writing to each other for a year without meeting']]
        };
        var pool = chars[genre] || chars.Mystery;
        var c = pool[Math.floor(rng() * pool.length) % pool.length];
        var beats = [
          ['Opening image', 'Start in the middle of a normal moment that the reader will learn was not normal.'],
          ['The inciting problem', 'Something breaks the routine. The character cannot go back to how it was.'],
          ['First attempt', 'They try the obvious solution. It makes things worse in a specific, visible way.'],
          ['The turn', 'A detail from the opening returns, recontextualised. The goal changes.'],
          ['Climax', 'The character does the thing they have been avoiding. It costs them something real.'],
          ['Resolution', 'Show the new normal, not a summary. One image from the opening, changed.']
        ];
        var perBeat = Math.round(total / beats.length);
        var out = [
          'STORY PLAN',
          '==========',
          'Idea: ' + idea,
          'Genre: ' + genre,
          'Length: ~' + total + ' words',
          '',
          'PREMISE',
          '--------',
          '"' + c[0] + ' - ' + c[1] + '"',
          '',
          'CHARACTER',
          '----------',
          'Name: ____ (one memorable name)',
          'Want: the thing they are after',
          'Need: the thing they actually have to learn',
          'Flaw: the habit that stops them getting it',
          '',
          'STRUCTURE',
          '---------'
        ];
        beats.forEach(function (b) {
          out.push(b[0].toUpperCase() + ' (~' + perBeat + ' words)');
          out.push('  ' + b[1]);
          out.push('  Tie to "' + idea + '": ____');
          out.push('');
        });
        out.push('TENSION CHECK');
        out.push('---------------');
        out.push('Does the inciting problem force a choice? If not, sharpen it.');
        out.push('Does the climax cost the character something? If not, the story is flat.');
        out.push('Is the ending an image, not a summary? Show, do not tell.');
        out.push('');
        out.push('OPENING LINE (draft)');
        out.push('---------------------');
        out.push('The first sentence should be concrete and specific. Try: "' + titleCase(pick(rng, c[0].split(' '))) + ' was the kind of thing you tell yourself you noticed the first time."');
        out.push('');
        out.push('This is a structure and a premise, generated from your idea. The voice, the');
        out.push('specifics and the good sentences are yours. A plan makes writing possible;');
        out.push('it does not write the story.');
        return out.join('\n');
      }
    },
    'paragraph-writer': {
      label: 'Paragraph Writer', action: 'Write paragraph',
      placeholder: 'Enter the topic or point your paragraph should make…',
      options: [{ id: 'optType', label: 'Paragraph type', type: 'select', values: ['Intro', 'Body', 'Topic sentence', 'Conclusion', 'Transition'] }],
      run: function (text, opts) {
        var topic = need(text).trim();
        var type = opts.type || 'Body';
        var kp = keyphrases(topic, 4);
        var map = {
          'Topic sentence': ['Topic sentence: ' + titleCase(topic) + ' is [what it does] because [reason].', '', 'Support: ' + (kp[0] ? 'it depends on ' + kp[0] : 'a specific factor you can name') + ', which explains [effect].', '', 'Example: one concrete case, with a number or a name.'],
          'Intro': ['Hook: start with a concrete example that makes ' + topic + ' real, not a definition.', '', 'Context: one sentence on why this matters to the reader right now.', '', 'Thesis: ' + titleCase(topic) + ' matters because [the one thing you want them to accept].', '', 'Promise: by the end you will be able to [specific outcome].'],
          'Body': ['Topic sentence: make one claim about ' + topic + '.', '', 'Support 1: the reason, with evidence (a number, a study, a case).', '', 'Support 2: a second, independent reason - not a restatement of the first.', '', 'Wrap: one sentence tying both supports back to the claim.'],
          'Conclusion': ['Restate: ' + titleCase(topic) + ' works because [the reason], not because [the common assumption].', '', 'So what: the practical implication - what the reader should do differently.', '', 'Last line: a concrete image or a question, not a summary of what you just said.'],
          'Transition': ['Link back: connect this paragraph to the previous idea explicitly.', '', 'Bridge: one sentence that introduces the new angle without repeating the old one.', '', 'Forward: name what the next paragraph will argue.']
        };
        var body = map[type] || map['Body'];
        var out = [
          type.toUpperCase() + ' PARAGRAPH PLAN (~' + (type === 'Body' ? 120 : 90) + ' words)',
          '='.repeat(40),
          'Topic: ' + topic,
          ''
        ].concat(body, ['',
          'DRAFT (fill in the specifics)',
          '──────────────────────────────',
          sentencesLocal(body.filter(Boolean).join(' ')).replace(/\[([^\]]+)\]/g, '____'),
          '',
          'Check: one idea per paragraph. If it has two, split it. The first sentence should',
          'tell the reader what the paragraph will do. The last should not repeat the first.'
        ]);
        return out.join('\n');
      }
    },
    'paragraph-completer': {
      label: 'Paragraph Completer', action: 'Complete paragraph',
      placeholder: 'Paste the start of your paragraph and we will suggest how to finish it…',
      run: function (text) {
        var t = need(text).trim();
        var last = sentences(t).pop() || t;
        var kp = keyphrases(t, 3);
        var ideas = [
          'Add a specific example: "For instance, [case] shows this clearly."',
          'Add the reason why: "This happens because [mechanism]."',
          'Add a contrast: "By contrast, [alternative] does the opposite."',
          'Add a number: "In practice that is about [figure] [unit]."',
          'Add the consequence: "So the effect is [result]."',
          'Close the loop: "That is why [the point made earlier] matters."',
          'Add a caveat: "The exception is [case], where [different rule] applies."',
          'Point forward: "The next section covers [topic]."'
        ];
        return kpi([
          'YOUR OPENING',
          '────────────',
          t,
          '',
          'Last sentence: "' + last + '"',
          '',
          'WAYS TO FINISH IT',
          '─────────────────',
          ideas.map(function (i, n) { return (n + 1) + '. ' + i; }).join('\n'),
          '',
          'TIPS',
          '────',
          '• Finish the thought your last sentence started, not a new one.',
          '• One paragraph = one idea. If you are adding a second idea, start a new paragraph.',
          '• End on the strongest point, not on "in conclusion".',
          kp.length ? '\nKey terms already in your text: ' + kp.join(', ') : ''
        ]);
      }
    },
    'blog-post-ideas': {
      label: 'Blog Post Ideas', action: 'Generate ideas',
      placeholder: 'Enter your niche or topic to generate blog ideas…',
      options: [{ id: 'optCount', label: 'How many ideas', type: 'select', values: ['10', '15', '20', '25'] }],
      run: function (text, opts) {
        var niche = need(text).trim();
        var n = parseInt(opts.count, 10) || 15;
        var rng = makeRng(niche + n);
        var templates = [
          'How to {a} {b} without {c}', '{N} mistakes when {a} {b}',
          'The beginner guide to {b}', '{b} vs {c}: which should you use?',
          'Why {a} {b} fails for beginners', 'A checklist for {b}',
          'What nobody tells you about {a} {b}', 'How long does {b} actually take?',
          '{b}: a complete walkthrough', 'Is {b} still worth it in {year}?',
          'The cheapest way to {a} {b}', 'How to tell if {b} is working',
          '{b} for absolute beginners (step by step)', '5 free tools for {a} {b}',
          'What to do when {b} goes wrong', '{a} {b}: the honest version',
          'Do you need {b}? Here is how to decide', 'The real cost of {b}',
          'How to {a} {b} in under an hour', '{b} explained simply',
          'Common {b} myths, busted', 'How to get better at {b}',
          'The {b} setup I wish I had sooner', 'When to skip {b} entirely'
        ];
        var angles = ['beginner mistakes', 'advanced tactics', 'a short checklist', 'a worked example', 'common questions', 'the costs involved', 'what experts skip', 'a case study'];
        var out = [
          'BLOG POST IDEAS',
          '===============',
          'Niche: ' + niche,
          'Generated: ' + n + ' ideas',
          '',
          'IDEAS',
          '-----'
        ];
        var used = {};
        var made = 0;
        for (var i = 0; i < templates.length && made < n; i++) {
          var idx = (i * 7 + Math.floor(rng() * 3)) % templates.length;
          var tpl = templates[idx];
          if (used[tpl]) continue;
          used[tpl] = 1;
          var title = tpl
            .replace('{a}', 'do better at ' + niche)
            .replace('{b}', toSlug(niche).split('-')[0] || 'it')
            .replace('{c}', 'a paid tool')
            .replace('{N}', pick(rng, ['3', '5', '7', '9']))
            .replace('{year}', '2026');
          out.push((made + 1) + '. ' + titleCase(title));
          out.push('   angle: ' + pick(rng, angles));
          made++;
        }
        out.push('');
        out.push('HOW TO PICK ONE');
        out.push('───────────────');
        out.push('• Search your topic in the search bar. If the top results are all thin, that is your opening.');
        out.push('• Pick an idea you can finish in one sitting. A short post you publish beats a long one you do not.');
        out.push('• Add a number, a price, or a year to any title - specificity is what wins clicks.');
        out.push('• Answer the question your reader is actually typing, in the first 100 words.');
        return out.join('\n');
      }
    },
    'blog-outline-generator': {
      label: 'Blog Outline Generator', action: 'Build outline',
      placeholder: 'Enter your blog topic…',
      options: [{ id: 'optStyle', label: 'Post type', type: 'select', values: INTENTS2.map(function (i) { return i[0]; }) }],
      run: function (text, opts) {
        var topic = need(text).trim();
        var style = opts.style || 'How to';
        var shape = INTENTS2.filter(function (i) { return i[0] === style; })[0] || INTENTS2[2];
        var out = [
          'OUTLINE',
          '=======',
          'Topic: ' + topic,
          'Type: ' + style,
          'Slug: /blog/' + toSlug(topic) + '.html',
          '',
          'STRUCTURE',
          '---------'
        ];
        shape.slice(1).forEach(function (h, i) {
          var w = style === 'Listicle' ? 150 : 200;
          out.push('');
          out.push((i + 1) + '. ' + titleCase(h) + '  (~' + w + ' words)');
          out.push('   - Opening line: [what the reader wants to know]');
          out.push('   - Main point: [one claim]');
          out.push('   - Evidence: [example, number, or step]');
          out.push('   - Transition: [bridge to the next heading]');
        });
        out.push('');
        out.push('FAQ (write real answers, then add FAQ schema)');
        out.push('----------------------------------------------');
        out.push('- What is ' + topic + '?');
        out.push('- Who is it for?');
        out.push('- How much does it cost?');
        out.push('- What is the alternative?');
        out.push('');
        out.push('Est. total: ' + (shape.length - 1) * 200 + ' words + intro + FAQ');
        out.push('Fill in the bracketed prompts. This is a skeleton - the writing is yours.');
        return out.join('\n');
      }
    },
    'content-brief-generator': {
      label: 'Content Brief Generator', action: 'Build content brief',
      placeholder: 'Enter your target topic or keyword…',
      options: [{ id: 'optAudience', label: 'Audience', type: 'select', values: ['Beginner', 'Intermediate', 'Expert', 'Business', 'Consumer'] }],
      run: function (text, opts) {
        var topic = need(text).trim();
        var audience = opts.audience || 'Beginner';
        var kp = keyphrases(topic, 6);
        return kpi([
          'CONTENT BRIEF',
          '==============',
          'Target topic: ' + topic,
          'Audience: ' + audience,
          'Primary keyword: ' + toSlug(topic).split('-').join(' '),
          'Slug: /blog/' + toSlug(topic) + '.html',
          'Meta title: ' + (titleCase(topic).length > 55 ? titleCase(topic).slice(0, 55) + '…' : titleCase(topic)),
          'Meta description: ' + truncateWordsLocal(topic, 18) + ' - what it is, how it works, and when it is worth it.',
          '',
          'SEARCH INTENT',
          '-------------',
          audience + ' wants to ' + (audience === 'Expert' ? 'go deep on trade-offs' : audience === 'Business' ? 'see ROI and risk' : 'get a clear answer fast') + '.',
          'Promise them: one clear outcome, by the end of the first screen.',
          '',
          'SECTIONS',
          '--------',
          '1. Quick answer (' + Math.round(12) + '% of words) - answer the query immediately',
          '2. What is ' + topic + '? (20%) - define it for a ' + audience.toLowerCase(),
          '3. How it works (25%) - the mechanism, in plain steps',
          '4. Use cases (18%) - 3 examples, each with an outcome',
          '5. Mistakes and fixes (15%) - what people get wrong',
          '6. FAQ (10%) - 4 real questions, 2-3 sentences each',
          '',
          'KEY TERMS TO INCLUDE',
          '-------------------',
          kp.length ? listFormat(kp, false) : '- (paste a longer intro to extract terms)',
          '',
          'MEDIA',
          '-----',
          '- One original image or diagram (not stock) with descriptive alt text',
          '- One table or list if it saves the reader effort',
          '',
          'INTERNAL LINKS',
          '----------------',
          '- → 1 related tool (descriptive anchor)',
          '- → 1 related article',
          '- → the tools index',
          '',
          'SUCCESS CHECK',
          '---------------',
          '• Does the first 100 words answer the query?',
          '• Is there at least one number, date, or named example?',
          '• Would a ' + audience.toLowerCase() + ' say "this answered my question"?'
        ]);
      }
    },
    'content-planner': {
      label: 'Content Planner', action: 'Build content plan',
      placeholder: 'Describe your business, site, or audience…',
      options: [{ id: 'optWeeks', label: 'Plan length', type: 'select', values: ['4 weeks', '8 weeks', '12 weeks'] }],
      run: function (text, opts) {
        var subject = need(text).trim();
        var weeks = parseInt(opts.weeks, 10) || 8;
        var types = ['Pillar page', 'How-to guide', 'Listicle', 'Comparison', 'FAQ page', 'Case study', 'Tool walkthrough', 'Glossary term'];
        var channels = ['Blog', 'Blog', 'Blog', 'Newsletter', 'Social', 'YouTube', 'Podcast'];
        var out = [
          'CONTENT PLAN (' + weeks + ' weeks)',
          '=======================',
          'Subject: ' + subject,
          'Cadence: 2 posts per week = ' + (weeks * 2) + ' pieces',
          '',
          'CALENDAR',
          '--------'
        ];
        var rng = makeRng(subject + weeks);
        for (var w = 1; w <= weeks; w++) {
          out.push('');
          out.push('WEEK ' + w);
          for (var p = 1; p <= 2; p++) {
            var t = types[(w * 2 + p) % types.length];
            var ch = channels[(w + p) % channels.length];
            out.push('  P' + p + '. [' + ch + '] ' + t + ': ' + titleCase(pick(rng, ['a complete guide to', 'mistakes in', 'how to choose', 'a walkthrough of', 'the truth about']) + ' ' + subject));
            out.push('      keyword: ' + toSlug(subject).split('-')[0] + (p === 1 ? '' : ' tips'));
            out.push('      status: □ drafted  □ edited  □ published');
          }
        }
        out.push('');
        out.push('SEQUENCING LOGIC');
        out.push('----------------');
        out.push('• Pillar first (week 1), then 2-3 supporting posts that link up to it.');
        out.push('• One comparison or tool post per 4 weeks - these convert best.');
        out.push('• Refresh an old post instead of writing a new one when you run out of ideas.');
        out.push('');
        out.push('REALISTIC EXPECTATIONS');
        out.push('-----------------------');
        out.push('SEO compounds over 6-12 months, not 6-12 days. Publish consistently, update');
        out.push('what you already published, and expect the second half of the plan to perform better');
        out.push('than the first. No schedule guarantees rankings - only useful, durable content does.');
        return out.join('\n');
      }
    },
    'cold-email-writer': {
      label: 'Cold Email Writer', action: 'Write cold email',
      placeholder: 'Describe your offer and who you are emailing…',
      options: [{ id: 'optTone', label: 'Tone', type: 'select', values: ['Direct', 'Friendly', 'Consultative'] }],
      run: function (text, opts) {
        var offer = need(text).trim();
        var tone = opts.tone || 'Direct';
        var bodies = {
          'Direct': ['Hi [Name],', '', 'I noticed [specific detail about their business].', '', 'I built [what you do] that [outcome you deliver].', '', 'Worth 15 minutes next week?', '', '[Your name]'],
          'Friendly': ['Hi [Name],', '', 'Hope your week is going well.', '', 'I work with [their type of company] on [problem you solve]. Saw [specific detail] and thought it might be relevant.', '', 'No pitch - just a quick question about what you are seeing.', '', '[Your name]'],
          'Consultative': ['Hi [Name],', '', 'I have been looking at how [their type of company] handles [their problem].', '', 'Most of them I see are doing [common approach], which works until [limitation]. We built [what you do] for exactly that gap.', '', 'If it is useful I can send a two-page breakdown - no call needed. If not, tell me and I will stop.', '', '[Your name]']
        };
        var body = bodies[tone] || bodies['Direct'];
        return kpi([
          'COLD EMAIL (' + tone + ')',
          '────────────────────',
          body.join('\n'),
          '',
          'CHECKLIST BEFORE YOU SEND',
          '─────────────────────────',
          '□ Subject line under 6 words, lowercase, no punctuation',
          '□ One specific detail about THEM in the first 2 lines',
          '□ One ask, and it is small (15 minutes, or "no call")',
          '□ No attachments',
          '□ Under 125 words',
          '□ Read the first line and ask: "would a stranger read this?"',
          '',
          'WHAT MAKES COLD EMAIL WORK',
          '──────────────────────────',
          'Relevance beats cleverness. One true, specific observation about the recipient is',
          'worth more than three paragraphs about you. Sending 20 well-researched emails beats',
          '2,000 generic ones, and the generic ones are what earn a spam report.'
        ]);
      }
    },
    'landing-page-copy-generator': {
      label: 'Landing Page Copy Generator', action: 'Generate landing page copy',
      placeholder: 'Describe your product or service and who it is for…',
      options: [{ id: 'optGoal', label: 'Goal', type: 'select', values: ['Sign up', 'Buy now', 'Book a call', 'Download', 'Subscribe'] }],
      run: function (text, opts) {
        var product = need(text).trim();
        var goal = opts.goal || 'Sign up';
        return kpi([
          'LANDING PAGE COPY',
          '==================',
          'Product: ' + product,
          'Primary goal: ' + goal,
          '',
          'HERO',
          '----',
          'Headline: [Outcome] without [the pain]',
          'Subheadline: ' + titleCase(product) + ' does [one specific thing] for [audience], so you [result].',
          'Primary CTA: ' + goal + ' →',
          '',
          'PROBLEM',
          '-------',
          '- You need [result], but [current approach] takes [time/cost]',
          '- [Specific pain 2]',
          '- [Specific pain 3]',
          '',
          'SOLUTION',
          '--------',
          titleCase(product) + ' [verb] so that [outcome]. Unlike [alternative], it [specific differentiator].',
          '',
          'FEATURES (3, each tied to a benefit)',
          '------------------------------',
          '1. [Feature] - so you [benefit]',
          '2. [Feature] - so you [benefit]',
          '3. [Feature] - so you [benefit]',
          '',
          'SOCIAL PROOF',
          '--------------',
          '[Name], [Role] at [Company]: "[one specific result]"',
          '[Number] users. [Number] five-star rating. [Company logos, if you have permission]',
          '',
          'FAQ',
          '---',
          'Q: How much does it cost?',
          'A: [Price]. Cancel anytime.',
          'Q: Do I need a credit card?',
          'A: [Honest answer]',
          'Q: How long until I see results?',
          'A: [Realistic timeline]',
          '',
          'CLOSING CTA',
          '-----------',
          '[Restate the outcome]. ' + goal + ' →',
          '',
          'CTA COPY RULES',
          '-------------',
          '• One CTA, repeated. Two buttons split attention and lower conversions.',
          '• First person, active voice: "Start free" beats "Submit your request".',
          '• Say what happens after they click. Uncertainty kills more signups than price does.'
        ]);
      }
    },
    'press-release-generator': {
      label: 'Press Release Generator', action: 'Write press release',
      placeholder: 'Describe the news: what happened, when, and why it matters…',
      options: [{ id: 'optTone', label: 'Tone', type: 'select', values: ['News', 'Product launch', 'Company news'] }],
      run: function (text, opts) {
        var news = need(text).trim();
        var tone = opts.tone || 'Product launch';
        var today = 'MONTH DAY, YEAR';
        return kpi([
          'PRESS RELEASE TEMPLATE',
          '=======================',
          '',
          'FOR IMMEDIATE RELEASE',
          today,
          '',
          'HEADLINE',
          '--------',
          '[Company] [announces / launches / raises] [what happened] in one line under 100 characters',
          '',
          'DATELINE — City, State. — ',
          '-------------------',
          '[Company] today announced [the news]. [One sentence on what it is, for someone who has not heard of you.]',
          '',
          'WHY IT MATTERS',
          '--------------',
          '[The problem this solves, and for whom. Be specific: "for [audience] who [pain]."]',
          '',
          'DETAILS',
          '-------',
          '[Key feature 1] - [what it does]',
          '[Key feature 2] - [what it does]',
          '[Key feature 3] - [what it does]',
          '',
          'QUOTE',
          '-----',
          '"[Real, quotable statement from the founder]," said [Name], [Title] at [Company]. "The second sentence should say why it matters to customers, not to the company."',
          '',
          'AVAILABILITY',
          '------------',
          '[What happens next, when it is available, and how to get it or sign up.]',
          '',
          'BOILERPLATE',
          '-----------',
          'About [Company]: [Two sentences. What you do, who you do it for, and one number - customers, projects, years.]',
          '',
          'CONTACT',
          '-------',
          '[Name] | [Title] | [email] | [phone]',
          '',
          'NOTES ON WRITING A GOOD ONE',
          '----------------------------',
          '• Newsworthiness comes before polish. "Raises $2M" gets covered; "excited to announce" does not.',
          '• Never write "press release" and send it to journalists. Pitch to a specific person.',
          '• Put the most newsworthy fact in the headline and the first sentence.',
          '• The quote should contain a claim only the founder can make.',
          '• There is no guarantee any outlet will run it. That is normal.'
        ]);
      }
    },
    'faq-generator': {
      label: 'FAQ Generator', action: 'Generate FAQ',
      placeholder: 'Paste your article text or describe your topic…',
      run: function (text) {
        var t = need(text);
        var sents = sentences(t);
        var kp = keyphrases(t, 5);
        var existing = (t.match(/\?[^?]*\?/g) || []);
        var questions = [];
        if (existing.length) {
          existing.forEach(function (q) { questions.push({ q: q.replace(/^.*\?/, '').trim().slice(0, 120), a: 'Answer from your article, in 2-3 sentences.' }); });
        }
        var tpl = [
          ['What is {t}?', 'Define it in one sentence, then one sentence on why it matters.'],
          ['How much does {t} cost?', 'Give the real number, and say what is free.'],
          ['How long does {t} take?', 'A range is more useful than a point estimate.'],
          ['Is {t} suitable for beginners?', 'Answer yes or no, then the reason.'],
          ['What are the alternatives to {t}?', 'Name two real alternatives, and when each is better.'],
          ['Do I need {t}?', 'Describe the situation where they do and do not need it.'],
          ['What are the common mistakes with {t}?', 'Three mistakes, each with the fix.'],
          ['Can I use {t} on mobile?', 'Yes/no, with the honest limitation if there is one.']
        ];
        var topic = kp[0] || toSlug(t.split(/\s+/)[0] || 'this');
        tpl.forEach(function (p) {
          if (questions.length >= 8) return;
          questions.push({ q: p[0].replace('{t}', topic), a: p[1] });
        });
        var out = ['FAQ (with schema-ready Q&A)', '========================='];
        questions.forEach(function (item, i) {
          out.push('');
          out.push((i + 1) + '. ' + item.q);
          out.push('   ' + item.a);
        });
        out.push('');
        out.push('JSON-LD FOR THIS FAQ (paste into the page <head>)');
        out.push('---------------------------------------------');
        out.push(JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          'mainEntity': questions.slice(0, 8).map(function (item) {
            return { '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } };
          })
        }, null, 2));
        out.push('');
        out.push('Only add FAQ schema for questions and answers that are actually visible on the page.');
        out.push('Schema for hidden content is a manual action, and it is the fastest way to lose trust.');
        return out.join('\n');
      }
    },
    'trivia-generator': {
      label: 'Trivia Generator', action: 'Generate trivia',
      placeholder: 'Enter your topic or category for trivia…',
      options: [{ id: 'optCount', label: 'Questions', type: 'select', values: ['5', '10', '15', '20'] }],
      run: function (text, opts) {
        var topic = need(text).trim();
        var n = parseInt(opts.count, 10) || 10;
        var rng = makeRng(topic + n);
        var used = {};
        var out = ['TRIVIA: ' + titleCase(topic), '='.repeat(10 + topic.length), 'Format: multiple choice · ' + n + ' questions · answers at the bottom', ''];
        var stems = [
          'Which of these is a real {t} fact?',
          'What is the most common misconception about {t}?',
          'When was {t} first documented?',
          'Who is credited with popularising {t}?',
          'What is the technical term for this aspect of {t}?',
          'How many [units] does {t} typically involve?',
          'Which country or region is most associated with {t}?',
          'What problem was {t} originally designed to solve?',
          'Which of these best describes {t}?',
          'What year did {t} first appear in public records?'
        ];
        for (var i = 0; i < n; i++) {
          var stem = stems[i % stems.length].replace('{t}', topic);
          var opts4 = ['Option A', 'Option B', 'Option C', 'Option D'].sort(function () { return rng() - 0.5; });
          used[stem] = 1;
          out.push((i + 1) + '. ' + stem);
          out.push('   a) ' + opts4[0] + '   b) ' + opts4[1] + '   c) ' + opts4[2] + '   d) ' + opts4[3]);
        }
        out.push('');
        out.push('ANSWER KEY');
        out.push('-----------');
        out.push('Replace each option with a real answer before using this. Invented answers make');
        out.push('the quiz useless, and a quiz with wrong answers is worse than no quiz.');
        out.push('');
        out.push('MAKE IT A REAL QUIZ');
        out.push('-------------------');
        out.push('1. Write 4 plausible options per question, only one correct.');
        out.push('2. Vary difficulty: 3 easy, 4 medium, rest hard.');
        out.push('3. Explain the answer after each - the explanation is what people share.');
        out.push('4. Never publish trivia you have not verified. Wrong facts travel fast.');
        return out.join('\n');
      }
    },
    'poll-generator': {
      label: 'Poll Generator', action: 'Generate poll',
      placeholder: 'Describe your topic for poll questions…',
      options: [{ id: 'optCount', label: 'Questions', type: 'select', values: ['3', '5', '8'] }],
      run: function (text, opts) {
        var topic = need(text).trim();
        var n = parseInt(opts.count, 10) || 5;
        var tpl = [
          ['How often do you use {t}?', ['Daily', 'Weekly', 'Monthly', 'Never']],
          ['What is your biggest challenge with {t}?', ['It is too slow', 'Too complicated', 'Too expensive', 'I do not know where to start']],
          ['How much would you pay for {t}?', ['Nothing', 'Under $10', '$10-50', 'Over $50']],
          ['Which {t} feature matters most to you?', ['Speed', 'Accuracy', 'Ease of use', 'Price']],
          ['Where do you learn about {t}?', ['Search', 'Social media', 'Friends', 'YouTube']],
          ['Would you recommend {t} to a friend?', ['Yes', 'Maybe', 'No', 'Not sure']],
          ['How long have you worked with {t}?', ['Under a month', '1-6 months', '6-12 months', 'Over a year']],
          ['What would make you use {t} more?', ['Better quality', 'Lower cost', 'More options', 'Less effort']]
        ];
        var out = ['POLL: ' + titleCase(topic), '====================', n + ' questions, ready to publish', ''];
        tpl.slice(0, n).forEach(function (q, i) {
          out.push('Q' + (i + 1) + '. ' + q[0].replace('{t}', topic));
          q[1].forEach(function (o) { out.push('   ☐ ' + o); });
          out.push('');
        });
        out.push('BEST PRACTICES FOR POLLS THAT GET ANSWERED');
        out.push('------------------------------------------');
        out.push('• 4 options maximum. People drop off fast after that.');
        out.push('• One clear question per poll. Two questions halves your response rate.');
        out.push('• No obviously wrong answers - people skip polls that feel rigged.');
        out.push('• Ask about behaviour, not opinions ("how often" beats "do you agree").');
        out.push('• Show results publicly. It rewards the people who voted.');
        return out.join('\n');
      }
    },
    'linkedin-post-generator': {
      label: 'LinkedIn Post Generator', action: 'Write LinkedIn post',
      placeholder: 'Enter your topic, insight, or announcement…',
      options: [{ id: 'optTone', label: 'Tone', type: 'select', values: ['Professional', 'Bold', 'Storytelling', 'Educational'] }],
      run: function (text, opts) {
        var topic = need(text).trim();
        var tone = opts.tone || 'Professional';
        var kp = keyphrases(topic, 4);
        var hooks = {
          Professional: 'Most teams get ' + (kp[0] || 'this') + ' wrong, and it costs them months.',
          Bold: 'Unpopular opinion: ' + (kp[0] || 'this') + ' is not the bottleneck.',
          Storytelling: 'Six months ago I was wrong about ' + (kp[0] || 'this') + '.',
          Educational: 'Here is what I learned about ' + (kp[0] || 'this') + ' (and what it cost me).'
        };
        var body = {
          Professional: ['I have seen this pattern at three companies now.', '', 'The pattern: [describe the specific problem].', '', 'What changed it:', '1. [Change 1 - concrete]', '2. [Change 2 - concrete]', '3. [Change 3 - concrete]', '', 'The result: [a number].', '', 'What has your experience been?'],
          Bold: ['Everyone says [common advice].', '', 'It does not work, because [reason].', '', 'What works instead: [the alternative, in one sentence]', '', 'Evidence: [specific example or number].', '', 'Agree or disagree? I am genuinely curious.'],
          Storytelling: ['It started with a [small moment].', '', 'At first I thought it was nothing.', '', 'Then [the thing that happened].', '', 'By the time I realised [the insight], we had already lost [the cost].', '', 'What I would do differently: [the lesson].', '', 'Has this happened to you?'],
          Educational: ['Most people learn ' + (kp[0] || 'this') + ' the hard way. Here is the easy way.', '', '1. [Principle]', '2. [Principle]', '3. [Principle]', '4. [Principle]', '', 'The most common mistake: [mistake] and the fix: [fix].', '', 'Save this for next time.']
        };
        var post = (hooks[tone] || hooks.Professional) + '\n\n' + (body[tone] || body.Professional).join('\n');
        return kpi([
          'LINKEDIN POST (' + tone + ')',
          '───────────────────────────',
          post,
          '',
          'Length: ' + post.length + ' characters (LinkedIn shows ~1,400 before "see more" on desktop, ~210 on mobile)',
          '',
          'BEFORE YOU POST',
          '───────────────',
          '• The first line is everything - it is all that shows before "see more".',
          '• One idea per post. Two ideas halves the engagement.',
          '• Line breaks every 1-2 lines. Blocks of text get skipped.',
          '• End with a question to invite comments, not a link.',
          '• Do not put the link in the post body - it suppresses reach. Put it in the first comment.',
          '• Post 8-10am on a weekday for the widest professional audience.'
        ]);
      }
    },
    'instagram-caption-generator': {
      label: 'Instagram Caption Generator', action: 'Write caption',
      placeholder: 'Describe your photo or post…',
      options: [{ id: 'optTone', label: 'Tone', type: 'select', values: ['Casual', 'Inspirational', 'Promotional', 'Fun'] }],
      run: function (text, opts) {
        var topic = need(text).trim();
        var tone = opts.tone || 'Casual';
        var caps = {
          Casual: ['Real talk: ' + topic + '.', '', 'Not the plan, but here we are.', '', 'Anyone else? 👇'],
          Inspirational: ['A reminder about ' + topic + '.', '', 'You do not need a perfect plan. You need a start.', '', 'Save this for the day you need it.'],
          Promotional: ['New: ' + topic + '.', '', 'Built for [audience]. Works in [time].', '', 'Link in bio.'],
          Fun: ['POV: you said you would do ' + topic + ' "later"', '', 'It is still later 😅', '', 'Tag someone who relates.']
        };
        var cap = (caps[tone] || caps.Casual).join('\n');
        var tags = toSlug(topic).split('-').filter(function (t) { return t.length > 2 && ['the', 'and', 'for', 'with', 'your', 'you', 'are', 'this', 'that'].indexOf(t) === -1; })
          .slice(0, 8).map(function (t) { return '#' + t; }).join(' ');
        return kpi([
          'INSTAGRAM CAPTION (' + tone + ')',
          '─────────────────────────────',
          cap,
          '',
          'HASHTAGS',
          '--------',
          tags || '#' + toSlug(topic).split('-')[0],
          '',
          'TIPS',
          '────',
          '• First line is visible before "more" - hook in those five words.',
          '• 3-5 hashtags in the caption, or 15-20 in the first comment. Do not stuff 30 in the caption.',
          '• Save posts outperform reach posts. Teach something.',
          '• Put the best content first in a carousel - most people never swipe.'
        ]);
      }
    },
    'instagram-story-idea': {
      label: 'Instagram Story Idea', action: 'Generate story ideas',
      placeholder: 'Enter your niche, product, or topic…',
      options: [{ id: 'optCount', label: 'How many ideas', type: 'select', values: ['5', '10', '15'] }],
      run: function (text, opts) {
        var topic = need(text).trim();
        var n = parseInt(opts.count, 10) || 10;
        var tpl = [
          ['Poll', 'Ask: "' + topic + ' - do you use it?" vs "Still on my list"'],
          ['Question sticker', 'Ask one specific question about ' + topic + ' (not "thoughts?")'],
          ['This or that', 'Two options related to ' + topic + ' - let them tap'],
          ['Countdown', 'Announce a launch, drop, or deadline related to ' + topic + ''],
          ['Quiz', 'Test 4 facts about ' + topic + ' - boosts replies'],
          ['Slider', 'Ask "How confident are you?" with an emoji slider on ' + topic + ''],
          ['Before / after', 'Show the result of using ' + topic + ''],
          ['Tutorial', '3-step quick how-to for ' + topic + ' - save-worthy'],
          ['Q&A box', 'Answer a question about ' + topic + ' from your DMs'],
          ['Text hook', 'One bold line about ' + topic + ', no photo needed'],
          ['Repost a reply', 'Screenshot the best comment about ' + topic + ' - social proof'],
          ['Link sticker', 'Send people to the full ' + topic + ' guide']
        ];
        var out = ['STORY IDEAS: ' + titleCase(topic), '='.repeat(12 + topic.length), n + ' ideas with the sticker type', ''];
        tpl.slice(0, n).forEach(function (t, i) { out.push((i + 1) + '. ' + t[0] + ' - ' + t[1]); });
        out.push('');
        out.push('STORY RULES THAT ACTUALLY WORK');
        out.push('--------------------------------');
        out.push('• Stories are 15 seconds. One idea per frame.');
        out.push('• Every frame should have a sticker or it gets skipped.');
        out.push('• Post 3-7 stories at a time, spread through the day, not all at once.');
        out.push('• Reply to every DM a story generates - that is the whole point.');
        return out.join('\n');
      }
    },
    'twitter-generator': {
      label: 'Twitter Generator', action: 'Write post',
      placeholder: 'Enter your key message or topic…',
      options: [{ id: 'optCount', label: 'How many versions', type: 'select', values: ['3', '5', '8'] }],
      run: function (text, opts) {
        var topic = need(text).trim();
        var n = parseInt(opts.count, 10) || 3;
        var kp = keyphrases(topic, 3);
        var forms = [
          'Most people think ' + (kp[0] || 'X') + ' is about [A]. It is about [B].',
          'Unpopular opinion: ' + (kp[0] || 'this') + ' is overrated. Here is why ↓',
          'A thread on ' + (kp[0] || 'this') + ':',
          'If you only fix one thing about ' + (kp[0] || 'this') + ', fix this.',
          'I was wrong about ' + (kp[0] || 'this') + '. Here is what I got right.',
          'The difference between good ' + (kp[0] || 'work') + ' and great: [one thing].',
          'Three things I wish I knew about ' + (kp[0] || 'this') + ':',
          'Hot take: the best time to start ' + (kp[0] || 'this') + ' was yesterday. The second best is today.'
        ];
        var out = ['X / TWITTER POSTS (' + n + ' variants)', '='.repeat(30), ''];
        for (var i = 0; i < n; i++) {
          var p = forms[i % forms.length];
          out.push('VARIANT ' + (i + 1) + ' (' + p.length + ' chars)');
          out.push('────────────────');
          out.push(p);
          out.push('');
        }
        out.push('RULES');
        out.push('─────');
        out.push('• Under 280 characters. Count it - the tool above does.');
        out.push('• First 100 characters carry the whole post. If the hook is at the end, nobody sees it.');
        out.push('• No link in the post for reach - put it in a reply.');
        out.push('• Specific beats broad: "reduced build time 4min → 40s" beats "faster builds".');
        return out.join('\n');
      }
    },
    'fb-headline-generator': {
      label: 'FB Headline Generator', action: 'Generate headlines',
      placeholder: 'Describe your product or offer…',
      options: [{ id: 'optCount', label: 'How many', type: 'select', values: ['5', '10', '15'] }],
      run: function (text, opts) {
        var offer = need(text).trim();
        var n = parseInt(opts.count, 10) || 10;
        var tpl = [
          'Get [benefit] in [time] - no [objection]',
          'Stop [pain]. Start [outcome].',
          '[Number] ways to [action] with [product]',
          'Why [audience] are switching to [product]',
          'Free [thing] for [audience] (no signup)',
          '[Product] vs [alternative]: which is actually better?',
          'You do not need [unnecessary thing] to [outcome]',
          'The [adjective] way to [action]',
          'How [audience] use [product] to [result]',
          'Last chance: [offer] ends [time]',
          'One small change that [specific result]',
          'Everything about [topic], in 5 minutes',
          'Built for [audience]: [product]',
          'What nobody tells you about [topic]',
          'Save this: [topic] in 4 steps'
        ];
        var out = ['FACEBOOK AD HEADLINES (' + n + ')', '='.repeat(26), 'Offer: ' + offer, ''];
        tpl.slice(0, n).forEach(function (t, i) { out.push((i + 1) + '. ' + t); });
        out.push('');
        out.push('AD COPY STRUCTURE');
        out.push('------------------');
        out.push('Hook (matches the headline) → Problem → Solution → Proof → CTA');
        out.push('');
        out.push('WHAT ACTUALLY MOVES CTR ON FACEBOOK');
        out.push('-------------------------------');
        out.push('• Specific beats clever. "40 seconds, not 4 minutes" outsells "Super fast tool".');
        out.push('• Show the product. Image/video ads beat text ads at the same spend.');
        out.push('• One offer per ad. Two offers splits the click intent.');
        out.push('• Test the hook first - it is the only variable worth testing early.');
        out.push('• No guaranteed results, no fake urgency. It gets accounts restricted.');
        return out.join('\n');
      }
    },
    'youtube-script-writer': {
      label: 'YouTube Script Writer', action: 'Write video script',
      placeholder: 'Enter your video topic and target length…',
      options: [{ id: 'optLength', label: 'Video length', type: 'select', values: ['60 seconds', '5 minutes', '10 minutes', '20 minutes'] }],
      run: function (text, opts) {
        var topic = need(text).trim();
        var len = opts.length || '5 minutes';
        var mins = len === '60 seconds' ? 1 : parseInt(len, 10) || 5;
        var wpm = 150;
        var words1 = mins * wpm;
        var kp = keyphrases(topic, 4);
        var out = [
          'YOUTUBE SCRIPT',
          '==============',
          'Topic: ' + topic,
          'Target length: ' + len + ' (~' + words1 + ' words at ' + wpm + ' wpm)',
          'Slug: /' + toSlug(topic) + '/',
          'Thumbnail text: 3-4 words, high contrast, readable at small size',
          '',
          'STRUCTURE',
          '---------',
          '0:00 HOOK (first 5 seconds - decide everything)',
          '  "' + (kp[0] ? 'The mistake everyone makes with ' + kp[0] : topic) + '."',
          '  Why this line: it promises a specific payoff, and it is under 8 words.',
          '',
          '0:05 CONTEXT (15-30 seconds)',
          '  Set up the problem in 2-3 sentences. Name who it affects.',
          '',
          '0:30 MAIN CONTENT',
          '  Point 1: [claim] + [example] + [visual]',
          '  Point 2: [claim] + [example] + [visual]',
          '  Point 3: [claim] + [example] + [visual]',
          '  Each point: state it, prove it, then show it on screen.',
          '',
          'CONCLUSION',
          '  Recap the three points in one sentence each.',
          '  End with the next action, not "thanks for watching".',
          '',
          'PRODUCTION NOTES',
          '-----------------',
          '• Cut to a new shot every 5-8 seconds.',
          '• B-roll every claim. Silence over a static talking head loses viewers.',
          '• Write the hook last, after the video is done - it is the easiest to get right.',
          '• Add chapters at natural section breaks for search.',
          '',
          'DESCRIPTION + TAGS',
          '-----------------',
          'Description: ' + truncateWordsLocal(topic, 25) + ' - in this video I cover [what]. Timestamps below.',
          'Tags: ' + (kp.length ? kp.join(', ') : toSlug(topic).split('-').join(', '))
        ];
        return out.join('\n');
      }
    },
    'tiktok-script-writer': {
      label: 'TikTok Script Writer', action: 'Write short script',
      placeholder: 'Enter your topic for a 15-60 second video…',
      options: [{ id: 'optLength', label: 'Length', type: 'select', values: ['15 seconds', '30 seconds', '60 seconds'] }],
      run: function (text, opts) {
        var topic = need(text).trim();
        var len = opts.length || '30 seconds';
        var secs = parseInt(len, 10) || 30;
        var wps = 2.5;
        var wordBudget = Math.round(secs * wps);
        var hooks = ['Nobody tells you this.', 'Stop doing that.', 'This changed everything for me.', 'Read that again.', '3 seconds. Watch.', 'I was wrong about this.', 'Everyone gets this wrong.', 'Save this one.'];
        var out = [
          'TIKTOK SCRIPT (' + len + ')',
          '=======================',
          'Topic: ' + topic,
          'Word budget: ~' + wordBudget + ' words (TikTok is ~2.5 words/second of speech)',
          '',
          'BEAT BY BEAT',
          '------------',
          '0-3s  HOOK (text on screen + spoken)',
          '  Spoken: "' + hooks[0] + '"',
          '  On screen: [3 words, large, high contrast]',
          '  Why: the first 3 seconds decide 80% of retention. No logo, no intro.',
          '',
          '3-' + Math.round(secs * 0.8) + 's  CONTENT',
          '  Beat 1: [claim] - point at the camera',
          '  Beat 2: [proof] - show it on screen',
          '  Beat 3: [payoff] - deliver what the hook promised',
          '',
          secs + 's  END',
          '  Loop back to the opening visual so it replays cleanly.',
          '',
          'DRAFT',
          '-----',
          '[' + (secs > 30 ? 'Wide shot, talking' : 'Close-up, talking directly to camera') + ']',
          '"' + hooks[0] + '"',
          '[Beat on screen text: the one thing that matters]',
          '[Show the result]',
          '[Text on screen: what to do next]',
          '',
          'TIKTOK SPECIFICS',
          '----------------',
          '• 9:16 only. Anything else gets letterboxed.',
          '• Captions on - 80% watch muted. Your hook must read without sound.',
          '• One idea per video. Two ideas halves retention.',
          '• Post when your audience is online, not when it is convenient for you.',
          '• Hook first 24h data decides whether to make a part 2.'
        ];
        return out.join('\n');
      }
    },
    'podcast-script-writer': {
      label: 'Podcast Script Writer', action: 'Write episode script',
      placeholder: 'Enter your episode topic and guest, if any…',
      options: [{ id: 'optLength', label: 'Episode length', type: 'select', values: ['15 minutes', '30 minutes', '60 minutes'] }],
      run: function (text, opts) {
        var topic = need(text).trim();
        var len = opts.length || '30 minutes';
        var mins = parseInt(len, 10) || 30;
        var talk = Math.round(mins * 0.75);
        var out = [
          'PODCAST SCRIPT',
          '===============',
          'Topic: ' + topic,
          'Episode length: ' + len + ' (' + talk + ' min of speech, ' + (mins - talk) + ' min of questions/ads)',
          '',
          'SEGMENTS',
          '--------',
          '0:00  COLD OPEN (30s)',
          '  Hook: the single most surprising or useful thing in the episode. No "welcome to the show".',
          '  Tease: "by the end you will know [specific thing]."',
          '',
          '0:30  INTRO (1 min)',
          '  Who you are (2 sentences), who the guest is, and the one question this episode answers.',
          '',
          Math.ceil(talk / 3) + ':00  SEGMENT 1',
          '  Topic: [first angle]',
          '  Key point → example → counter-argument → takeaway',
          '',
          Math.ceil(talk * 2 / 3) + ':00  SEGMENT 2',
          '  Topic: [second angle]',
          '  Key point → example → counter-argument → takeaway',
          '',
          Math.ceil(talk * 0.95) + ':00  CLOSE',
          '  Recap the three takeaways, one sentence each.',
          '  Ask the listener one specific question - it drives replies.',
          '  CTA: rate, review, and one link in the show notes.',
          '',
          'GUEST QUESTIONS',
          '----------------',
          '1. What is the most common mistake you see in [their field]?',
          '2. What changed your mind about [topic]?',
          '3. What would you do differently if you started again?',
          '4. What should people stop doing immediately?',
          '5. Who should we talk to next?',
          '',
          'SCRIPT',
          '------',
          '[COLD OPEN]',
          '"' + truncateWordsLocal(topic, 20) + ' - here is what most people get wrong, and the fix."',
          '',
          '[INTRO]',
          '"Welcome. Today: ' + topic + '. With me is [guest], who [one-line credential]. We are covering [three things]."',
          '',
          '[SEGMENT 1 - set up the question, then answer it]',
          '',
          '[CLOSE]',
          '"Three things: [1], [2], [3]. One question for you: [question]? Reply in the show notes."',
          '',
          'PRODUCTION NOTES',
          '-----------------',
          '• Conversational is fine. Fully written scripts sound stiff on podcasts.',
          '• Ads mid-episode, never before the hook.',
          '• Every claim should have a source you can put in the show notes.',
          '• Royalty-free music bed at -24 LUFS under speech.'
        ];
        return out.join('\n');
      }
    },
    'real-estate-descriptions': {
      label: 'Real Estate Descriptions', action: 'Write property description',
      placeholder: 'Describe the property: beds, baths, size, location, features…',
      options: [{ id: 'optTone', label: 'Tone', type: 'select', values: ['Professional', 'Warm', 'Luxury', 'Concise'] }],
      run: function (text, opts) {
        var facts = need(text);
        var tone = opts.tone || 'Professional';
        var kp = keyphrases(facts, 5);
        var hooks = {
          Professional: 'Located in [neighbourhood], this [beds]-bedroom property offers [size] of [interior/exterior] space.',
          Warm: 'Come home to [neighbourhood]. This [beds]-bedroom property was designed for [lifestyle].',
          Luxury: 'A rare offering in [neighbourhood]: [beds] bedrooms, [size], finished to an exacting standard.',
          Concise: '[Beds] bed · [baths] bath · [size] · [location]'
        };
        var body = {
          Professional: ['The property comprises [beds] bedrooms and [baths] bathrooms across [size].', 'The principal living space opens to [orientation], providing [benefit].', 'The kitchen features [appliances/surfaces].', 'Outside, [garden/parking/storage].', 'Located within [distance] of [amenities], with [transport links] nearby.'],
          Warm: ['Step inside and the first thing you notice is the light - it runs from [orientation] right through the living space.', 'The kitchen is the heart of the home: [detail].', 'Three bedrooms, [detail about the primary].', 'Outside there is [detail] - enough for [use].', 'The neighbourhood is [character], and [amenities] are [distance] away.'],
          Luxury: ['Set on [location], this residence presents [beds] bedrooms of [size], considered with an exacting eye.', 'Materials include [premium finishes].', 'The principal suite occupies [detail].', 'Beyond the interior: [landscape, parking, amenities].', 'Offered for viewing by appointment.'],
          Concise: ['[Beds] bed · [baths] bath · [size] · [key feature] · [location]', '', '[One sentence: the single best thing about it.]']
        };
        return kpi([
          'PROPERTY DESCRIPTION (' + tone + ')',
          '───────────────────────────────',
          hooks[tone] + '\n\n' + body[tone].join('\n\n'),
          '',
          'FACT SHEET TO FILL',
          '------------------',
          'Address · Price · Bedrooms · Bathrooms · Floor area · Plot · Year built · Parking · Heating · Council tax',
          '',
          'DESCRIPTION RULES THAT HELP',
          '----------------------------',
          '• Lead with the single best feature. Buyers decide in the first two lines.',
          '• Numbers beat adjectives: "300 sq ft of south-facing garden" not "ample outdoor space".',
          '• Do not claim anything you cannot evidence (no "no nearby neighbours" unless verified).',
          '• Mention orientation and light - it is the first thing buyers filter on.',
          '• Never use words like "unique", "stunning" or "must-see" without a reason attached.',
          '• Photograph after describing: the words should tell them what to look for.',
          'Legal note: descriptions must be accurate and must not discriminate. Check local rules.'
        ]);
      }
    },
    'business-name-generator': {
      label: 'Business Name Generator', action: 'Generate names',
      placeholder: 'Describe your business and what it does…',
      options: [{ id: 'optStyle', label: 'Name style', type: 'select', values: ['Descriptive', 'Abstract', 'Compound', 'Invented', 'Founder-based'] }],
      run: function (text, opts) {
        var desc = need(text);
        var style = opts.style || 'Descriptive';
        var kp = keyphrases(desc, 4);
        var a = kp[0] || 'bright', b = kp[1] || 'works', c = kp[2] || 'flow';
        var roots = {
          Descriptive: [a + ' ' + c, 'The ' + a + ' Co', a + ' & ' + b, c + 'works', a + ' ' + b],
          Abstract: ['Zentra', 'Veltro', 'Nuvira', 'Kadence', 'Orvanta', 'Pelvia', 'Lumin', 'Ashvale'],
          Compound: [a + 'ly', 'Clear' + titleCase(c), 'True' + titleCase(a), c + 'wise', a + 'forge'],
          Invented: ['Zorbli', 'Vexani', 'Krumble', 'Nimbrix', 'Tolvia', 'Jarnik', 'Plyvon'],
          'Founder-based': ['[Surname] Studio', '[Surname] & Co', '[Surname] Works', 'By ' + a, '[Surname] Labs']
        };
        var out = ['BUSINESS NAME IDEAS (' + style + ')', '='.repeat(30 + style.length), 'Business: ' + desc, ''];
        var i = 0;
        Object.keys(roots).forEach(function (styleKey) {
          out.push('');
          out.push(styleKey.toUpperCase());
          roots[styleKey].forEach(function (n) {
            i++;
            out.push('  ' + i + '. ' + n + '   [check .com + handle availability]');
          });
        });
        out.push('');
        out.push('BEFORE YOU CHOOSE');
        out.push('------------------');
        out.push('• Check the domain, the social handle, and the trademark database. All three, before you commit.');
        out.push('• Say it out loud on a phone call. If you need to spell it, it fails.');
        out.push('• Say it after "I work at". "I work at Vexani" - does it land?');
        out.push('• Avoid names tied to one trend, one product, or one technology that will be obsolete in 3 years.');
        out.push('• Register the domain defensively (.com, and the country domain if you sell outside your own).');
        return out.join('\n');
      }
    },
    'business-slogan-generator': {
      label: 'Business Slogan Generator', action: 'Generate slogans',
      placeholder: 'Describe what your business does and for whom…',
      options: [{ id: 'optCount', label: 'How many', type: 'select', values: ['5', '10', '15'] }],
      run: function (text, opts) {
        var desc = need(text);
        var n = parseInt(opts.count, 10) || 10;
        var kp = keyphrases(desc, 4);
        var t = kp[0] || 'it', b = kp[1] || 'better';
        var tpl = [
          t + ', made simple.', 'Work ' + b + '.', 'Less hassle. More ' + t + '.',
          'Built for people who [specific].', 'The simpler way to ' + t + '.',
          'Do ' + t + ' without the drama.', 'Your shortcut to ' + t + '.',
          'Good ' + t + ' should be easy.', 'From idea to done, fast.',
          'Everything you need. Nothing you do not.', 'We make ' + t + ' feel effortless.',
          'Stop guessing. Start doing.', 'Take the stress out of ' + t + '.', 'Made for real life.'
        ];
        var out = ['SLOGAN IDEAS', '============', 'Business: ' + desc, ''];
        tpl.slice(0, n).forEach(function (s, i) { out.push((i + 1) + '. ' + s); });
        out.push('');
        out.push('WHAT MAKES A SLOGAN WORK');
        out.push('-------------------------');
        out.push('• 3-7 words. Longer slogans are remembered less, not more.');
        out.push('• Rhythm matters more than cleverness. Alliteration and parallelism stick.');
        out.push('• Say what you do, not how you feel about it.');
        out.push('• Avoid puns that need explanation. Nobody explains a slogan to a customer.');
        out.push('• Test it: say the business name, then the slogan, back to back. If it flows, it works.');
        return out.join('\n');
      }
    },
    'business-plan-generator': {
      label: 'Business Plan Generator', action: 'Build business plan',
      placeholder: 'Describe your business idea and target market…',
      options: [{ id: 'optStage', label: 'Stage', type: 'select', values: ['Idea', 'Pre-launch', 'Early revenue', 'Growth'] }],
      run: function (text, opts) {
        var idea = need(text);
        var stage = opts.stage || 'Idea';
        var kp = keyphrases(idea, 4);
        return kpi([
          'BUSINESS PLAN FRAMEWORK',
          '=========================',
          'Business: ' + idea,
          'Stage: ' + stage,
          '',
          '1. EXECUTIVE SUMMARY (1 page)',
          '   The problem, who has it, what you do about it, and the number you need to hit.',
          '   Write this last.',
          '',
          '2. PROBLEM',
          '   - Who has this problem? (' + (kp[0] || 'audience') + ')',
          '   - How painful is it? (what do they do today instead?)',
          '   - How big is the market? (bottom-up: number of people × what they spend)',
          '',
          '3. SOLUTION',
          '   - What you do, in one sentence',
          '   - Why your version is better than the alternatives they use now',
          '   - What is deliberately out of scope in v1',
          '',
          '4. MARKET',
          '   - Who exactly: age, role, situation, budget',
          '   - Where they are: specific channels, not "social media"',
          '   - Early adopters: the first 100 customers, named',
          '',
          '5. MARKETING',
          '   - Channel 1 (where your buyer already is) - budget, expected CAC',
          '   - Channel 2 - budget, expected CAC',
          '   - Referral loop: what makes them tell someone',
          '',
          '6. OPERATIONS',
          '   - How you deliver value (the process, not the vision)',
          '   - Key suppliers, tools, people',
          '   - What breaks first at 10× volume',
          '',
          '7. FINANCIAL PROJECTIONS',
          '   - Monthly revenue, cost, and margin for 12 months',
          '   - Break-even point: the month revenue exceeds costs',
          '   - Runway: how many months of cash you have',
          '',
          '8. RISKS',
          '   List the top 3. For each: what it is, how likely, what you would do.',
          '',
          'REALITY CHECK',
          '-------------',
          'A plan is a tool for making decisions under uncertainty, not a document for a bank.',
          'Write the numbers you can defend, and mark the ones that are guesses as guesses.',
          'No business plan guarantees funding or success.'
        ]);
      }
    },
    'bill-of-sale': {
      label: 'Bill of Sale', action: 'Create bill of sale',
      placeholder: 'Describe the item(s), price, buyer and seller details…',
      options: [{ id: 'optType', label: 'Type', type: 'select', values: ['Private sale', 'Vehicle', 'Electronics', 'Furniture', 'Other'] }],
      run: function (text, opts) {
        var facts = need(text);
        var type = opts.type || 'Private sale';
        var today = '____________, 20____';
        return kpi([
          'BILL OF SALE — ' + type.toUpperCase(),
          '===================================',
          'Date: ' + today,
          'Place of sale: ____________________',
          '',
          'SELLER',
          '------',
          'Name: ____________________  ID/Company: ____________________',
          'Address: ____________________  Phone: ____________________',
          '',
          'BUYER',
          '-----',
          'Name: ____________________  ID/Company: ____________________',
          'Address: ____________________  Phone: ____________________',
          '',
          'ITEM(S)',
          '-------',
          'Description: ______________________________________________',
          'Serial / VIN / identifying number: __________________________',
          'Condition: __________________________________________________',
          '',
          'TERMS',
          '-----',
          'Purchase price: ____________________',
          'Deposit paid: ____________________   Balance: ____________________',
          'Payment method: ____________________  Date of full payment: __________',
          'Warranty / condition: [state clearly what is and is not covered]',
          '',
          'SIGNATURES',
          '----------',
          'Seller: ____________________  Date: ____________',
          'Buyer: ____________________  Date: ____________',
          'Witness (recommended): ____________  Date: ____________',
          '',
          'LEGAL NOTE',
          '-----------',
          'This is a plain template, not legal advice. Requirements differ by country and by what',
          'you are selling - vehicles in particular often need a specific form and registration.',
          'A signed bill of sale is what many buyers need for proof of purchase and warranty claims,',
          'so keep a copy. For high-value items, consider a notary and a witness. Check your local law.'
        ]);
      }
    },
    'purchase-agreement': {
      label: 'Purchase Agreement', action: 'Create purchase agreement',
      placeholder: 'Describe what is being bought or sold, and the key terms…',
      run: function (text) {
        var facts = need(text);
        return kpi([
          'PURCHASE AGREEMENT — TEMPLATE',
          '================================',
          'This document is made on ____________, 20____',
          '',
          'PARTIES',
          '-------',
          'SELLER: ____________________ of ____________________ ("the Seller")',
          'BUYER:  ____________________ of ____________________ ("the Buyer")',
          '',
          'SUBJECT OF THE AGREEMENT',
          '-----------------------',
          facts,
          '',
          '1. PURCHASE AND PRICE',
          '   The Seller agrees to sell, and the Buyer agrees to buy, the subject matter',
          '   described above for a total of ____________________ ("the Price").',
          '',
          '2. DEPOSIT AND COMPLETION',
          '   A deposit of ____________________ is payable on signing. The balance of',
          '   ____________________ is due on or before ____________ ("Completion"), when',
          '   ownership and possession pass to the Buyer.',
          '',
          '3. TITLE AND CONDITION',
          '   The Seller warrants that they hold good title to the subject matter, free of',
          '   undisclosed encumbrances, and that it is as described: ____________________',
          '',
          '4. RISK',
          '   Risk passes to the Buyer at Completion. Until then, the Seller bears all risk of loss.',
          '',
          '5. CONDITIONS',
          '   Completion is conditional on: [inspection/survey/finance/approval, if applicable]',
          '',
          '6. CANCELLATION',
          '   If either party fails to complete, the other may cancel. Deposits are',
          '   non-refundable except where the Seller is in breach or where a condition fails.',
          '',
          '7. NOTICES',
          '   Notices to be sent to the addresses above, by [email/post], deemed received',
          '   [24 hours / 48 hours] after sending.',
          '',
          '8. GOVERNING LAW',
          '   This agreement is governed by the laws of ____________________.',
          '',
          '9. ENTIRE AGREEMENT',
          '   This document is the entire agreement between the parties.',
          '',
          'SIGNATURES',
          '----------',
          'Seller: ____________________  Date: ____________',
          'Buyer:  ____________________  Date: ____________',
          '',
          'LEGAL NOTE',
          '-----------',
          'A template, not legal advice. For property, vehicles, business sales or anything of real',
          'value, use a solicitor or a lawyer and a signed contract. Terms differ significantly by',
          'jurisdiction. This form is for low-value, simple transactions.'
        ]);
      }
    },
    'nda-generator': {
      label: 'NDA Generator', action: 'Create NDA',
      placeholder: 'Describe the parties, the confidential information, and the purpose…',
      options: [{ id: 'optType', label: 'NDA type', type: 'select', values: ['Mutual', 'One-way (disclosing)', 'One-way (receiving)'] }],
      run: function (text, opts) {
        var facts = need(text);
        var type = opts.type || 'Mutual';
        var parties = type === 'Mutual'
          ? 'both parties ("the Parties") each disclose Confidential Information to the other'
          : 'the Discloser discloses Confidential Information to the Recipient';
        return kpi([
          'NON-DISCLOSURE AGREEMENT — ' + type.toUpperCase(),
          '==================================================',
          '',
          'PARTIES',
          '-------',
          '(1) ____________________ of ____________________ ("Party A")',
          '(2) ____________________ of ____________________ ("Party B")',
          '',
          'BACKGROUND',
          '---------',
          facts,
          '',
          '1. PURPOSE',
          '   The Parties wish to exchange information in order to: ____________________',
          '   (the "Purpose").',
          '',
          '2. CONFIDENTIAL INFORMATION',
          '   "Confidential Information" means any non-public information disclosed by one party',
          '   to the other, in any form, that is marked confidential or that a reasonable person',
          '   would understand to be confidential. It includes: ' + facts + '',
          '',
          '3. OBLIGATIONS',
          '   The receiving party shall:',
          '   a) use the Confidential Information only for the Purpose;',
          '   b) not disclose it to any third party without prior written consent;',
          '   c) protect it with at least the same care used for its own confidential',
          '      information, and no less than reasonable care;',
          '   d) limit access to those of its personnel who need it and who are bound by',
          '      obligations no less protective than these.',
          '',
          '4. EXCLUSIONS',
          '   These obligations do not apply to information that:',
          '   a) is or becomes public through no fault of the recipient;',
          '   b) was known to the recipient without restriction before disclosure;',
          '   c) is independently developed without using the Confidential Information;',
          '   d) is received from a third party without a duty of confidentiality.',
          '',
          '5. COMPELLED DISCLOSURE',
          '   If required by law or court order, the recipient may disclose only the minimum',
          '   required, and shall give prompt written notice where legally permitted.',
          '',
          '6. TERM',
          '   These obligations continue for ______ years from the date of this agreement, and',
          '   indefinitely for information that constitutes a trade secret.',
          '',
          '7. RETURN OR DESTRUCTION',
          '   On written request, the recipient shall return or destroy all Confidential',
          '   Information, and certify destruction in writing, within ______ days.',
          '',
          '8. NO LICENCE',
          '   No rights are granted under any intellectual property except as expressly stated.',
          '',
          '9. REMEDIES',
          '   Breach may cause irreparable harm for which damages are inadequate. The disclosing',
          '   party may seek injunctive relief in addition to any other remedy.',
          '',
          '10. GOVERNING LAW',
          '    This agreement is governed by the laws of ____________________, and the parties',
          '    submit to the exclusive jurisdiction of its courts.',
          '',
          'SIGNATURES',
          '----------',
          'Party A: ____________________  Date: ____________',
          'Party B: ____________________  Date: ____________',
          '',
          'LEGAL NOTE',
          '-----------',
          'A starting template, not legal advice. NDAs are jurisdiction-specific and the',
          'exclusions, duration and remedies clauses matter a great deal. Have a lawyer review',
          'before signing anything with real commercial value. Never sign an NDA you have not read.'
        ]);
      }
    },
    'privacy-policy-generator': {
      label: 'Privacy Policy Generator', action: 'Draft privacy policy',
      placeholder: 'Describe your site or app, what data you collect, and whether you use ads or analytics…',
      options: [
        { id: 'optAds', label: 'Advertising', type: 'select', values: ['No advertising', 'Google AdSense', 'Other ad networks'] },
        { id: 'optAnalytics', label: 'Analytics', type: 'select', values: ['None', 'Google Analytics', 'Other analytics'] }
      ],
      run: function (text, opts) {
        var site = need(text);
        var ads = opts.ads || 'No advertising';
        var analytics = opts.analytics || 'None';
        var hasAds = ads !== 'No advertising';
        var hasAnalytics = analytics !== 'None';
        var out = [
          'PRIVACY POLICY — DRAFT',
          '=========================',
          'Site/App: ' + site,
          'Advertising: ' + ads + ' | Analytics: ' + analytics,
          '',
          'LAST UPDATED: ____________, 20____',
          '',
          '1. WHO WE ARE',
          '   [Legal name] ("we", "us") operates ' + site + '. Contact: [email address].',
          '   [If you are not established, name the individual or entity responsible.]',
          '',
          '2. WHAT WE COLLECT',
          '   Information you provide: [e.g. email address, name, message, if you contact us]',
          '   Information collected automatically: [e.g. IP address, browser type, pages visited]',
          '   ' + (hasAds ? 'Advertising cookies set by third parties.' : 'We do not set advertising cookies.'),
          '   ' + (hasAnalytics ? 'Analytics data from ' + analytics + '.' : 'We do not run analytics.'),
          '',
          '3. HOW WE USE IT',
          '   - To provide and maintain the service',
          '   - To respond to your enquiries',
          '   - To improve the service',
          '   ' + (hasAds ? '- To show advertising and measure how effective it is' : '- Not for advertising'),
          '',
          '4. SHARING',
          '   We do not sell your personal data. We share it only with:',
          '   - Hosting providers, to serve the site',
          hasAds ? '   - Google AdSense, which uses cookies to serve ads based on your prior visits' : '   - Service providers who process data on our behalf, under contract',
          '',
          '5. COOKIES',
          '   ' + (hasAds
            ? 'This site uses cookies and third-party advertising cookies, including cookies set by Google to serve ads based on prior visits to this and other sites. You can opt out of personalised advertising via Google Ads Settings, or opt out of third-party vendor cookies at aboutads.info.'
            : 'We use only essential cookies required for the site to function. We do not use advertising cookies.'),
          '',
          '6. DATA RETENTION',
          '   We keep personal data only for as long as necessary for the purposes described',
          '   here, or as required by law.',
          '',
          '7. YOUR RIGHTS',
          '   Depending on where you live, you may have the right to access, correct, delete,',
          '   or restrict processing of your personal data, and to object to it. To exercise any',
          '   of these, contact us at [email]. You may also complain to your local data',
          '   protection authority.',
          '',
          '8. CHILDREN',
          '   This service is not directed at children under 13 and we do not knowingly collect',
          '   their data.',
          '',
          '9. SECURITY',
          '   We use [HTTPS, password hashing, access controls] to protect data. No method of',
          '   transmission or storage is completely secure.',
          '',
          '10. CHANGES',
          '    We may update this policy. The "last updated" date above always reflects the',
          '    current version.',
          '',
          '11. CONTACT',
          '    [Legal name] · [Address] · [Email]',
          '',
          'IMPORTANT',
          '----------',
          'This is a starting draft generated from your description, not legal advice and not a',
          'finished policy. If you use advertising cookies, you are legally required to add a',
          'cookie consent mechanism (in the EU, prior consent is required for non-essential',
          'cookies) and to disclose the specific partners. Have a lawyer review this before you',
          'publish it, and keep it in sync with what you actually do.'
        ];
        return out.join('\n');
      }
    },
    'summarize-youtube': {
      label: 'Summarize YouTube', action: 'Build summary template',
      placeholder: 'Paste the video title, description, and any transcript you have…',
      run: function (text) {
        var t = need(text);
        var sents = sentences(t);
        var kp = keyphrases(t, 6);
        return kpi([
          'VIDEO SUMMARY TEMPLATE',
          '=========================',
          'Fill this in while the video plays. Pause at each section below and note the points',
          'in your own words - that is what makes the summary useful later.',
          '',
          'ONE-LINE SUMMARY',
          '----------------',
          excerpt(t, 100) || '[What is this video about, in one sentence?]',
          '',
          'KEY POINTS',
          '----------',
          (kp.length ? kp : ['point one', 'point two', 'point three', 'point four', 'point five']).map(function (k, i) {
            return (i + 1) + '. ' + titleCase(k) + ' - [what the video says about it]';
          }).join('\n'),
          '',
          'TIMESTAMPED NOTES',
          '------------------',
          '00:00  [Opening: what they promise]',
          '02:30  [First main point]',
          '05:00  [Second main point]',
          '08:30  [Example or demo]',
          '12:00  [Third main point]',
          '15:00  [Conclusion and call to action]',
          '',
          'QUOTES WORTH KEEPING',
          '---------------------',
          '"[exact quote]" - [timestamp]',
          '',
          'QUESTIONS IT RAISED',
          '-------------------',
          '- [something you want to look up]',
          '- [something you disagree with]',
          '',
          'WHY THIS TOOL DOES NOT FETCH THE VIDEO',
          '---------------------------------------',
          'Downloading and transcribing someone else\'s video needs a third-party service and',
          'raises their copyright and terms of service. This tool does neither. Paste the',
          'transcript, captions, or the description you are permitted to use, and it will be',
          'structured above. To get a transcript, open the video, use the platform\'s own',
          'captions feature, and paste the text here.'
        ]);
      }
    },
    'meta-description-generator': {
      label: 'Meta Description Generator', action: 'Generate meta description',
      placeholder: 'Paste your article title and first paragraph…',
      options: [{ id: 'optCount', label: 'How many versions', type: 'select', values: ['3', '5', '8'] }],
      run: function (text, opts) {
        var t = need(text);
        var n = parseInt(opts.count, 10) || 5;
        var kp = keyphrases(t, 4);
        var first = sentences(t)[0] || t;
        var topic = kp[0] || toSlug(t.split(/\s+/)[0] || 'this');
        var v = [
          truncateWords(first, 24),
          'Learn ' + topic + ' - what it is, how it works, and when to use it.',
          'Everything about ' + topic + ': practical steps, real examples, and the mistakes to avoid.',
          truncateWords(first, 20) + ' Read the full guide.',
          'A clear, practical guide to ' + topic + '. No jargon, no fluff.'
        ].slice(0, n);
        var out = ['META DESCRIPTIONS (' + n + ' variants)', '='.repeat(30), 'Source text: ' + t.length + ' characters', ''];
        v.forEach(function (d, i) {
          var len = d.length;
          var state = len > 160 ? 'TOO LONG (Google truncates around 155-160 chars)' : len < 70 ? 'short - you could use more detail' : 'good length';
          out.push((i + 1) + '. ' + d);
          out.push('   [' + len + ' characters - ' + state + ']');
          out.push('');
        });
        out.push('TITLE TAGS (from the same text)');
        out.push('----------------------------');
        var title = t.split(/[.!?]/)[0].trim();
        out.push('• ' + (title.length > 60 ? title.slice(0, 57) + '…' : title) + '  [' + Math.min(title.length, 60) + ' chars]');
        out.push('• ' + titleCase(topic) + ' - Complete Guide  [' + (titleCase(topic).length + 16) + ' chars]');
        out.push('');
        out.push('RULES');
        out.push('-----');
        out.push('• 140-160 characters. Longer gets truncated in the SERP, shorter wastes space.');
        out.push('• Lead with the keyword, but write it for a human first - it is a pitch, not a tag.');
        out.push('• Include a reason to click. "Free" or a specific number usually beats a description of the topic.');
        out.push('• Every page needs a unique one. Duplicate descriptions are ignored by search engines.');
        out.push('• Google rewrites about 70% of meta descriptions, so write it anyway - it is what shows when they do not.');
        return out.join('\n');
      }
    },
    'title-rewriter': {
      label: 'Title Rewriter', action: 'Rewrite titles',
      placeholder: 'Paste your article title, and optionally a second title for context…',
      options: [{ id: 'optCount', label: 'How many', type: 'select', values: ['5', '8', '12'] }],
      run: function (text, opts) {
        var t = need(text).trim();
        var n = parseInt(opts.count, 10) || 8;
        var kp = keyphrases(t, 3);
        var topic = kp[0] || toSlug(t).split('-')[0] || 'this';
        var forms = [
          titleCase(topic) + ': A Practical Guide',
          'How to ' + t.replace(/[?]$/, ''),
          titleCase(topic) + ' - What Actually Works',
          'The Complete Guide to ' + titleCase(topic),
          'Everything You Need to Know About ' + titleCase(topic),
          titleCase(topic) + ': A Step-by-Step Tutorial',
          'Why ' + titleCase(topic) + ' Matters',
          'A Beginner Guide to ' + titleCase(topic),
          titleCase(topic) + ' - Common Mistakes to Avoid',
          'The Truth About ' + titleCase(topic),
          'Do ' + titleCase(topic) + ' - Here Is How',
          titleCase(topic) + ' (Explained Simply)'
        ];
        var out = ['TITLE OPTIONS (' + n + ')', '='.repeat(20), 'Original: ' + t + ' [' + t.length + ' chars]', ''];
        forms.slice(0, n).forEach(function (title, i) {
          var len = title.length;
          out.push((i + 1) + '. ' + title);
          out.push('   [' + len + ' chars - ' + (len > 60 ? 'truncated in SERP' : len < 30 ? 'short, but fine' : 'good') + ']');
        });
        out.push('');
        out.push('WHAT MAKES A TITLE WORK');
        out.push('---------------------');
        out.push('• Front-load the keyword. The first 50 characters are what show on mobile.');
        out.push('• A number makes it concrete: "5 Ways" beats "Ways".');
        out.push('• Say the benefit, not the category. "Cut Your PDF Size" beats "PDF Tools".');
        out.push('• Title case for most content, sentence case for news-like topics.');
        out.push('• Avoid clickbait. It raises click-through and destroys bounce rate, and readers remember.');
        return out.join('\n');
      }
    },
    'article-rewriter': {
      label: 'Article Rewriter', action: 'Plan a rewrite',
      placeholder: 'Paste the article you want to rewrite…',
      options: [{ id: 'optGoal', label: 'Rewrite goal', type: 'select', values: ['Update for accuracy', 'Improve clarity', 'Shorten it', 'Change the angle', 'Update for SEO'] }],
      run: function (text, opts) {
        var t = need(text);
        var goal = opts.goal || 'Improve clarity';
        var r = U.readability(t);
        var st = stats(t);
        var kp = keyphrases(t, 6);
        var passive = U.findPassive(t);
        var d = U.detectAIFlags(t);
        var out = [
          'REWRITE PLAN — ' + goal.toUpperCase(),
          '==========================',
          'Original: ' + st.words + ' words · ' + st.sentences + ' sentences · ' + st.paragraphs + ' paragraphs',
          'Flesch ease ' + r.ease + ' (' + U.easeLabel(r.ease) + ') · grade ' + r.grade,
          '',
          'KEY TERMS ALREADY IN THE PIECE',
          '------------------------------',
          kp.length ? listFormat(kp, false) : '- (too short to extract terms)',
          '',
          'KEEP',
          '----',
          '• Anything factually current - the facts are the expensive part',
          '• Your original examples, screenshots, and data',
          '• Any section that already ranks or earns links',
          '',
          'CHANGE',
          '------'
        ];
        if (goal === 'Improve clarity') {
          out.push('• ' + passive.length + ' passive constructions - name who is acting');
          out.push('• ' + Math.max(0, st.avgSentenceWords - 18) + ' words/sentence - split the long ones');
          if (d.findings.length) out.push('• ' + d.findings.length + ' stock phrases - replace with plain English');
        }
        if (goal === 'Shorten it') {
          var cut = Math.round(st.words * 0.4);
          out.push('• Target: ' + cut + ' words (' + st.words + ' → ' + Math.max(120, st.words - cut) + ')');
          out.push('• Cut the intro throat-clearing. Start at the first real point.');
          out.push('• Merge overlapping sections. Two headings on one idea is one heading.');
          out.push('• Move detail to a separate post and link to it.');
        }
        if (goal === 'Update for accuracy') {
          out.push('• Verify every number and date against a primary source');
          out.push('• Re-check every screenshot - UI changes');
          out.push('• Confirm every external link still works');
          out.push('• Update the "last updated" date and note what changed');
        }
        if (goal === 'Change the angle') {
          out.push('• Keep the URL. Do not start over at a new address.');
          out.push('• New angle: [contrarian take / beginner-first / data-led / case study]');
          out.push('• Keep any ranking keywords, change the framing around them');
          out.push('• Re-map the intent: someone searching this wants a different answer now');
        }
        if (goal === 'Update for SEO') {
          out.push('• Title: under 60 characters, keyword first');
          out.push('• Meta description: 140-160 characters, with a reason to click');
          out.push('• H2s: descriptive, containing the keywords they target');
          out.push('• Internal links: 2-3, descriptive anchor text, both directions');
          out.push('• Add FAQ for questions your comments section keeps asking');
        }
        out.push('');
        out.push('A rewrite is not a copy of the original. If the substance is unchanged, it is');
        out.push('duplicate content, and search engines are right to ignore it. Change the argument,');
        out.push('the evidence, or the structure - then rewrite the words around that change.');
        return out.join('\n');
      }
    },
    'blog-post-rewriter': {
      label: 'Blog Post Rewriter', action: 'Plan a rewrite',
      placeholder: 'Paste the blog post you want to rewrite…',
      run: function (text) {
        var t = need(text);
        var st = stats(t);
        var r = U.readability(t);
        var out = [
          'REWRITE PLAN',
          '=============',
          'Original: ' + st.words + ' words · ' + st.paragraphs + ' paragraphs · grade ' + r.grade,
          '',
          'STRUCTURE TO KEEP',
          '------------------'
        ];
        var sents = sentences(t);
        sents.slice(0, 6).forEach(function (s, i) { out.push((i + 1) + '. ' + U.truncateWords(s, 14)); });
        out.push('');
        out.push('EDITS TO MAKE');
        out.push('-------------');
        if (r.ease !== null && r.ease < 55) out.push('• Raise readability from ' + r.ease + ' - shorter sentences, plainer words');
        if (st.avgSentenceWords > 22) out.push('• Average sentence is ' + st.avgSentenceWords + ' words - split the long ones');
        if (st.paragraphs && st.words / st.paragraphs > 180) out.push('• Paragraphs average ' + Math.round(st.words / st.paragraphs) + ' words - break them up for scannability');
        out.push('• Add a specific number, date, or named example in the first 100 words');
        out.push('• Add 2 internal links with descriptive anchor text');
        out.push('• Add an FAQ for the questions your comments keep asking');
        out.push('• Update the date and note what changed in the post');
        out.push('');
        out.push('Do not submit the same text with synonyms swapped. That is duplicate content, and it');
        out.push('is the fastest way to lose the ranking you already have.');
        return out.join('\n');
      }
    },
    'ai-detector-report': { label: '', run: function () { return ''; } } // placeholder removed below
  };
  delete TOOLS2['ai-detector-report'];

  function truncateWordsLocal(t, n) { return U.truncateWords(t, n); }
  function sentencesLocal(t) { return U.sentences(t).join(' '); }

  /* --------------------------------------------------- the 8 document tools */
  var DOCS = {
    'ai-detector': P1['ai-detector'],
    'ai-humanizer': P1['ai-humanizer'],
    'grammar-fixer': P1['grammar-fixer'],
    'word-counter': P1['word-counter'],
    'content-summarizer': P1['content-summarizer'],
    'content-shortener': P1['content-shortener'],
    'content-improver': P1['content-improver'],
    'sentence-rewriter': P1['sentence-rewriter'],
    'paragraph-rewriter': P1['paragraph-rewriter'],
    'content-paraphraser': P1['content-paraphraser'],
    'ai-rephraser': P1['ai-rephraser'],
    'tone-of-voice': P1['tone-of-voice'],
    'translate': P1['translate'],
    'explain-it': P1['explain-it'],
    'readability-score': P1['readability-score']
  };
  Object.keys(DOCS).forEach(function (k) { if (DOCS[k]) TOOLS2[k] = DOCS[k]; });

  window.__EWT_AIWRITE_TOOLS = Object.assign({}, P1, TOOLS2);
  window.__EWT_AIWRITE_META = { options: { INTENTS: INTENTS.map(function (i) { return i[0]; }) } };
})(window);
