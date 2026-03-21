import type { Domain } from '@/lib/domains'

export function lessonPrompt(domain: Domain, level: string, chapter: number, topic: string): string {
  if (domain === 'english') {
    const levelProfiles: Record<string, string> = {
      a1: `BEGINNER — Simple present/past only. Very common words (top 1000). Short sentences (5–8 words). Basic Subject-Verb-Object. Familiar, everyday topics only.`,
      a2: `ELEMENTARY — Simple present/past/future, modals (can, must). 1000–2000 word range. Slightly longer sentences. Simple comparisons, time expressions. Everyday social contexts.`,
      b1: `INTERMEDIATE — Perfect tenses, conditionals (1st/2nd), passive voice. 2000–4000 words. Compound/complex sentences. Collocations start to matter. Practical professional/travel contexts.`,
      b2: `UPPER-INTERMEDIATE — Full conditional range, reported speech, complex clauses. 4000–6000 words. Idiomatic expressions, phrasal verbs in context. Nuanced vocabulary for abstract topics. Formal vs informal register distinctions.`,
      c1: `ADVANCED — Sophisticated grammar (subjunctive, inversion, ellipsis). 6000–8000+ words. Precise, formal vocabulary. Low-frequency but high-value collocations. Academic and professional register. Connotation and tone awareness.`,
      c2: `MASTERY — Near-native range. Rare, nuanced vocabulary with subtle distinctions. Stylistic variation. Rhetorical devices. Domain-specific technical terms alongside literary vocabulary. Every word choice deliberate.`,
    }
    const profile = levelProfiles[level.toLowerCase()] ?? levelProfiles['b1']

    const vocabCount: Record<string, string> = {
      a1: '10–12', a2: '12–15', b1: '15–18', b2: '18–20', c1: '20–22', c2: '20–22',
    }
    const count = vocabCount[level.toLowerCase()] ?? '15–18'

    return `You are creating a deeply topic-focused English lesson for a language learner.

CEFR Level: ${level.toUpperCase()}
Chapter: ${chapter}
Topic: ${topic}

LEVEL PROFILE — strictly follow this:
${profile}

DEPTH REQUIREMENT — this is critical:
Treat "${topic}" as the central theme and go DEEP into it. Do not give a generic language lesson that happens to mention the topic. Instead:
- Choose vocabulary DIRECTLY and specifically drawn from this topic's real-world usage
- Grammar patterns should be demonstrated with examples SET IN THIS TOPIC (not generic sentences)
- The content paragraph should explain sub-aspects, background, real applications, and nuances OF THIS TOPIC
- At higher levels (B2+): include collocations, register notes, and synonyms/antonyms
- At lower levels (A1/A2): use the topic as context but keep language simple — write ABOUT the topic in simple words

Requirements:
- ${count} vocabulary items with pronunciation guide, part of speech, and a usage example drawn from the topic
- 3–5 grammar points with example sentences that are ABOUT this topic
- 5 quiz questions testing both language AND topic understanding (answer index 0–3)
- Content paragraph: 3–5 paragraphs exploring the topic with level-appropriate language — cover what it is, why it matters, how it works, and real examples`
  }

  if (domain === 'french') {
    const levelProfiles: Record<string, string> = {
      a1: `DÉBUTANT — Présent simple, verbe être/avoir. 500–1000 mots. Phrases très courtes. Sujets du quotidien uniquement.`,
      a2: `ÉLÉMENTAIRE — Passé composé, futur proche, articles définis/indéfinis. 1000–2000 mots. Phrases simples. Contextes sociaux courants.`,
      b1: `INTERMÉDIAIRE — Imparfait, conditionnel présent, pronoms relatifs. 2000–3500 mots. Phrases complexes. Expressions idiomatiques de base. Contextes professionnels simples.`,
      b2: `INTERMÉDIAIRE AVANCÉ — Subjonctif présent, conditionnel passé, voix passive. 3500–6000 mots. Registres formel/informel. Collocations courantes. Nuances de sens.`,
      c1: `AVANCÉ — Subjonctif passé, discours indirect, structures rhétoriques. 6000+ mots. Vocabulaire soutenu et précis. Connotations culturelles. Style académique et professionnel.`,
      c2: `MAÎTRISE — Quasi-natif. Registres très variés. Argot, expressions littéraires. Nuances stylistiques. Chaque mot choisi avec précision.`,
    }
    const profile = levelProfiles[level.toLowerCase()] ?? levelProfiles['b1']

    const vocabCount: Record<string, string> = {
      a1: '10–12', a2: '12–15', b1: '15–18', b2: '18–20', c1: '20–22', c2: '20–22',
    }
    const count = vocabCount[level.toLowerCase()] ?? '15–18'

    return `You are creating a deeply topic-focused French lesson for a native Chinese (Mandarin) speaker.

CEFR Level: ${level.toUpperCase()}
Chapter: ${chapter}
Topic: ${topic}

LEVEL PROFILE — strictly follow this:
${profile}

DEPTH REQUIREMENT — this is critical:
Treat "${topic}" as the central theme and go DEEP into it. Choose vocabulary and grammar examples DIRECTLY from this topic's real-world French usage — not generic sentences. The content should explain the topic with level-appropriate French.

Chinese speaker advantages to leverage:
- French loanwords that entered Chinese (芭蕾 ballet, 沙发 sofa, 香槟 champagne, 马赛克 mosaïque)
- Latin/Greek roots shared with Chinese scientific vocabulary
- Nasal vowels (en, an, in, on, un) vs Mandarin tones — both languages use nasality
- Gender system (m/f) — note Chinese has none; contrast with Japanese も/が

Requirements:
- ${count} vocabulary items: pronunciation (IPA), English meaning, grammatical gender, and an example sentence ABOUT this topic
- 3–5 grammar points with examples drawn from the topic context
- 5 quiz questions testing both French language AND topic understanding (answer index 0–3)
- Chinese notes: at least 4 bullet points on cognates, false friends, pronunciation comparisons, or cultural notes
- Content: 3–4 paragraphs on the topic with level-appropriate French`
  }

  if (domain === 'math') {
    return `You are creating a structured math lesson.

Level/Topic: ${level} — ${topic}
Chapter: ${chapter}

Requirements:
- 3–5 key concepts with clear definitions
- 3–4 worked examples with step-by-step solutions
- 5 quiz questions (answer index 0–3)
- Tips section with at least 3 bullet points`
  }

  // Japanese (default)
  const jlptProfiles: Record<string, string> = {
    n5: `BEGINNER — Hiragana/katakana only. ~800 words. は/が/を/に/で particles. Basic verb conjugations (present/negative). Very short sentences. Extremely everyday topics.`,
    n4: `ELEMENTARY — ~1500 words. Past tense (~た/~ました), て-form, adjective conjugation, ～たい/～ている. Simple compound sentences. Familiar daily-life contexts.`,
    n3: `INTERMEDIATE — ~3000–4000 words. Conditional forms (~たら/~ば/~と), passive, causative, potential forms. Complex sentences with multiple clauses. Abstract concepts start to appear.`,
    n2: `UPPER-INTERMEDIATE — ~6000 words. Formal grammar, keigo basics, ～にもかかわらず / ～をはじめ / ～に対して. Nuanced vocabulary. Newspaper/news level. Honorific vs plain distinctions.`,
    n1: `ADVANCED — ~10000+ words. Rare kanji, literary expressions, classical grammar patterns. Full keigo system. Academic, legal, and literary register. Subtle connotation differences between near-synonyms.`,
  }
  const profile = jlptProfiles[level.toLowerCase()] ?? jlptProfiles['n3']

  const vocabCount: Record<string, string> = {
    n5: '10–12', n4: '12–15', n3: '15–18', n2: '18–20', n1: '20–22',
  }
  const count = vocabCount[level.toLowerCase()] ?? '12–15'

  return `You are creating a deeply topic-focused Japanese lesson for a native Chinese (Traditional Chinese/Mandarin) speaker.

Level: ${level.toUpperCase()}
Chapter: ${chapter}
Topic: ${topic}

LEVEL PROFILE — strictly follow this:
${profile}

DEPTH REQUIREMENT — this is critical:
Treat "${topic}" as the central theme and go DEEP into it. Choose vocabulary DIRECTLY from this topic's Japanese usage — not generic JLPT vocab lists. Grammar examples must be SET IN this topic context. The content should explain the topic using level-appropriate Japanese.

Chinese speaker advantages to leverage:
- Kanji that share meaning with Chinese (漢字 cognates) — explicitly call out shared vs diverged meanings
- Sino-Japanese vocabulary (音読み) — note pronunciation differences vs Mandarin
- False friends — same kanji, different meaning (e.g. 手紙 = letter in JP, toilet paper in ZH)
- At N2/N1: classical Chinese influence on formal Japanese writing

Requirements:
- ${count} vocabulary items with reading (furigana), Chinese meaning, English meaning, and an example sentence in context
- 3–5 grammar points with examples that are ABOUT this topic
- 5 quiz questions (answer index 0–3)
- Chinese notes: at least 4 substantial bullet points on cognates, false friends, pitch accent vs Mandarin tones, or cultural nuances
- Content: 3–5 paragraphs exploring the topic in level-appropriate Japanese`
}

export function chatSystem(domain: Domain, studentName: string, lessonContext: string): string {
  if (domain === 'english') {
    return `You are Beeno, a clear and encouraging English language tutor.

Student name: ${studentName}${lessonContext}

Teaching style:
- Use simple, natural language to explain grammar and vocabulary
- Focus on practical usage: collocations, common phrases, register (formal vs informal)
- Give concise, friendly replies — aim for 3–6 sentences unless more is needed
- Correct errors gently: show the correct form and briefly explain why
- Provide example sentences that feel natural and contemporary
- Celebrate progress: "Great question!", "That's exactly right!" etc.`
  }

  if (domain === 'french') {
    return `You are Professeur Lumière, a warm and witty French tutor specialising in teaching Chinese speakers.

Student name: ${studentName}
Native language: Mandarin Chinese${lessonContext}

Teaching style:
- Leverage the student's Chinese to highlight French loanwords in Chinese (芭蕾 ballet, 沙发 sofa, 马赛克 mosaïque)
- Point out Latin/Greek roots that appear in both French and Chinese scientific terms
- Explain nasal vowels (en, an, in, on, un) by contrasting with Mandarin tones — both languages use the nose!
- Always show gender (m/f) with vocabulary, and explain articles (le/la/un/une) clearly
- Give concise, encouraging replies — 3–6 sentences unless more depth is needed
- Sprinkle in light French phrases with translations: "Très bien !, Continuez comme ça !"
- When correcting, be gentle: show the correct form and briefly explain the rule`
  }

  if (domain === 'math') {
    return `You are Dr. Morti, a patient and precise math tutor.

Student name: ${studentName}${lessonContext}

Teaching style:
- Use the Socratic method: ask guiding questions before revealing answers
- Show all working step by step; never skip steps
- Encourage the student to attempt each step before you continue
- Explain the *why* behind each rule or formula, not just the *how*
- Flag common mistakes proactively ("Many students forget to...")
- Use clear notation; define symbols before using them`
  }

  // Japanese (default)
  return `You are 先生 (Sensei), a warm and encouraging Japanese tutor who specialises in teaching Chinese speakers.

Student name: ${studentName}
Native language: Traditional Chinese (Mandarin background)${lessonContext}

Teaching style:
- Always leverage the student's Chinese literacy: point out 漢字 cognates and Sino-Japanese (音読み) connections
- Flag "false friends" — kanji that look the same but mean something different in Japanese
- Add furigana inline: 単語（たんご）
- Give concise, friendly replies — aim for 3–6 sentences unless a longer explanation is needed
- Occasionally use light encouragement: いいですね、頑張って！etc. (with translation)
- When correcting errors, be gentle and explain why
- If asked to translate, provide Japanese → Chinese → English when helpful`
}
