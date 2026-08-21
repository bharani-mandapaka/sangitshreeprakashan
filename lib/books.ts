export type BookCategory =
  | 'instrumental'
  | 'vocal'
  | 'raag-theory'
  | 'kathak'
  | 'research'
  | 'cbse'
  | 'bundle';

export type BookLevel =
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'research'
  | 'bundle';

export type BookLanguage = 'hindi' | 'english' | 'bilingual';

export interface Book {
  id: string;
  slug: string;
  titleHindi: string;
  titleEnglish: string;
  price: number;
  category: BookCategory;
  level: BookLevel;
  language: BookLanguage;
  authors: string[];
  description: string;
  descriptionHindi?: string;
  series?: string;
  part?: number;
  isBundle?: boolean;
  isFeatured?: boolean;
  tags: string[];
}

export const books: Book[] = [
  // ─── BUNDLES ───────────────────────────────────────────────────────────────
  {
    id: 'b-swar-vadan-set',
    slug: 'swar-vadan-complete-set',
    titleHindi: 'स्वर वादन भाग (1–5) - सम्पूर्ण सेट',
    titleEnglish: 'Swar Vadan Parts 1–5 (Complete Set)',
    price: 1685,
    category: 'bundle',
    level: 'bundle',
    language: 'hindi',
    authors: ['पं० सतीश चन्द्र श्रीवास्तव', 'रोहित कुमार'],
    description:
      'A complete collection of 5 books for students of Guitar, Sitar, Harmonium, Bansuri, Sarod, Casio, Mandolin, Sarangi and more. Covers raag introductions, alaap, Maseetkhani gat, Razakhani gat, taan and jhala across 130 ragas - aligned with syllabi from Class 9 through Post-Graduation, Prayag Sangit Samiti, Pracheen Kala Kendra, and Gandharv Mahavidyalay Mumbai (Year 1–8 Pravin).',
    series: 'Swar Vadan',
    isBundle: true,
    isFeatured: true,
    tags: ['instrumental', 'sitar', 'harmonium', 'guitar', 'bansuri', 'bundle', 'complete-set'],
  },
  {
    id: 'b-bal-sangit-set',
    slug: 'bal-sangit-sangrah-complete-set',
    titleHindi: 'बाल संगीत संग्रह (भाग 1–3) - सम्पूर्ण सेट',
    titleEnglish: 'Bal Sangit Sangrah Parts 1–3 (Complete Set)',
    price: 375,
    category: 'bundle',
    level: 'bundle',
    language: 'bilingual',
    authors: ['पं० सतीश चन्द्र श्रीवास्तव'],
    description:
      'A 3-book series with photographs of musicians and instruments, basic music knowledge, easy compositions and notations of ragas and talas, orchestra concepts, vandana, prayers, patriotic songs, children\'s songs, English songs, and biographies of renowned musicians. Specially designed for students up to Class 8 and beginners.',
    series: 'Bal Sangit Sangrah',
    isBundle: true,
    isFeatured: true,
    tags: ['children', 'beginner', 'vocal', 'bundle', 'complete-set'],
  },
  {
    id: 'b-intro-raags-set',
    slug: 'introduction-of-raags-complete-set',
    titleHindi: 'Introduction Of Raags भाग 1 & 2 - सम्पूर्ण सेट',
    titleEnglish: 'Introduction of Raags Part 1 & 2 (Complete Set)',
    price: 448,
    category: 'bundle',
    level: 'bundle',
    language: 'english',
    authors: ['Pt. Satish Chandra Srivastava', 'Rohit Kumar'],
    description:
      'A set of 2 Hindustani Music books in English - useful for students of Class 9 to 12, Prayag Sangit Samiti Allahabad and Pracheen Kala Kendra for first to fourth year. Covers both Theory and Practical.',
    series: 'Introduction of Raags',
    isBundle: true,
    isFeatured: false,
    tags: ['raag-theory', 'english-medium', 'bundle', 'complete-set'],
  },
  {
    id: 'b-bhatkhande-1-3-set',
    slug: 'bhatkhande-notation-1-3-set',
    titleHindi: 'भातखंडे स्वरलीपि संग्रह (भाग 1–3) - सम्पूर्ण सेट',
    titleEnglish: 'Bhatkhande Notation Collection Parts 1–3 (Complete Set)',
    price: 597,
    category: 'bundle',
    level: 'bundle',
    language: 'hindi',
    authors: ['पं० सतीश चन्द्र श्रीवास्तव', 'डॉ० अल्पना खरे'],
    description:
      'A 3-book set for Hindustani Classical Vocal in Hindi, covering 56 ragas with notation. Each raga includes introduction, aaroh-avroh, pakad, nyaas swar, similar ragas, alaap, taan, chhota khayal, bada khayal, dhrupad, dhamar and tarana. Suitable for Prayag Sangit Samiti, Pracheen Kala Kendra, Gandharv Mahavidyalay and Class 9 to B.A.',
    series: 'Bhatkhande Notation',
    isBundle: true,
    isFeatured: true,
    tags: ['vocal', 'bhatkhande', 'notation', 'bundle', 'complete-set'],
  },
  {
    id: 'b-bhatkhande-1-5-set',
    slug: 'bhatkhande-notation-1-5-set',
    titleHindi: 'भातखंडे स्वरलीपि संग्रह (भाग 1–5) - सम्पूर्ण सेट',
    titleEnglish: 'Bhatkhande Notation Collection Parts 1–5 (Complete Set)',
    price: 1295,
    category: 'bundle',
    level: 'bundle',
    language: 'hindi',
    authors: ['पं० सतीश चन्द्र श्रीवास्तव', 'डॉ० अल्पना खरे'],
    description:
      'A complete 5-book set covering 116 ragas with notation for Hindustani Classical Vocal. Includes aaroh-avroh, pakad, alaap, taan, chhota khayal, bada khayal, dhrupad, dhamar and tarana for each raga. Aligned with syllabi from Class 9 through M.A., Prayag Sangit Samiti, Pracheen Kala Kendra and Gandharv Mahavidyalay.',
    series: 'Bhatkhande Notation',
    isBundle: true,
    isFeatured: true,
    tags: ['vocal', 'bhatkhande', 'notation', 'bundle', 'complete-set'],
  },

  // ─── INSTRUMENTAL - SWAR VADAN ──────────────────────────────────────────────
  {
    id: 'sv-5',
    slug: 'swar-vadan-part-5',
    titleHindi: 'स्वर वादन भाग-5',
    titleEnglish: 'Swar Vadan Part 5',
    price: 499,
    category: 'instrumental',
    level: 'advanced',
    language: 'hindi',
    authors: ['पं० सतीश चन्द्र श्रीवास्तव (सितार वादक)', 'रोहित कुमार'],
    description:
      'For M.A. Sangit Pravin, Sangit Bhaskar and equivalent students. Covers 30 ragas - 15 detailed (Bilaskhani Todi, Megh Malhar, Jogkauns, Nayaki Kanhada, Kaunsi Kanhada, Suha, Hemant, Shyam Kalyan, Gorakh Kalyan, Devgiri Bilawal, Yamani Bilawal, Bhatiyar, Jhinjhoti, Miyan Ki Sarang, Jaitashri) and 15 in brief. Each includes alaap, Maseetkhani gat, Razakhani gat, tihai and jhala.',
    series: 'Swar Vadan',
    part: 5,
    isFeatured: true,
    tags: ['instrumental', 'sitar', 'harmonium', 'advanced', 'ma', 'pravin'],
  },
  {
    id: 'sv-4',
    slug: 'swar-vadan-part-4',
    titleHindi: 'स्वर वादन भाग-4',
    titleEnglish: 'Swar Vadan Part 4',
    price: 499,
    category: 'instrumental',
    level: 'advanced',
    language: 'hindi',
    authors: ['पं० सतीश चन्द्र श्रीवास्तव (सितार वादक)', 'रोहित कुमार'],
    description:
      'For M.A. Sangit Pravin, Sangit Bhaskar and equivalent students. Contains 30 ragas - 15 detailed (Ahir Bhairav, Puriya Kalyan, Chandrakauns, Gurjari Todi, Madhuvanti, Maru Bihag, Shuddh Sarang, Hans Dhwani, Nand, Jog, Madhmad Sarang, Abhogi Kanhada, Sur Malhar, Narayani, Maluha Kedar) and 15 brief.',
    series: 'Swar Vadan',
    part: 4,
    isFeatured: false,
    tags: ['instrumental', 'sitar', 'harmonium', 'advanced', 'ma', 'pravin'],
  },
  {
    id: 'sv-3',
    slug: 'swar-vadan-part-3',
    titleHindi: 'स्वर वादन भाग-3',
    titleEnglish: 'Swar Vadan Part 3',
    price: 300,
    category: 'instrumental',
    level: 'intermediate',
    language: 'hindi',
    authors: ['पं० सतीश चन्द्र श्रीवास्तव (सितार वादक)', 'रोहित कुमार'],
    description:
      'For B.A. Sangit Prabhakar and equivalent students. Covers 29 ragas including Lalit, Rageshri, Miyan Malhar, Darbari Kanhada, Ramkali, Basant, Paraj, Shuddh Kalyan, Puriya Kalyan, Shuddh Sarang, Chandrakauns, Jog, and more - with alaap, Maseetkhani gat, Razakhani gat, tihai and jhala.',
    series: 'Swar Vadan',
    part: 3,
    isFeatured: false,
    tags: ['instrumental', 'sitar', 'harmonium', 'intermediate', 'ba', 'prabhakar'],
  },
  {
    id: 'sv-2',
    slug: 'swar-vadan-part-2',
    titleHindi: 'स्वर वादन भाग-2',
    titleEnglish: 'Swar Vadan Part 2',
    price: 180,
    category: 'instrumental',
    level: 'intermediate',
    language: 'hindi',
    authors: ['पं० सतीश चन्द्र श्रीवास्तव (सितार वादक)', 'रोहित कुमार'],
    description:
      'For Class 11–12 boards, Prayag Sangit Samiti and Pracheen Kala Kendra (3rd–4th year). Covers ragas Ahir Bhairav, Patdeep, Kalingada, Gaud Sarang, Hindol, Purvi, Hamir, Bahar, Pilu, Deshkar, Shankara, Jayjayawanti, Kamod, Marwa, Multani, Sohni, and Todi - with alaap, vilambit gat, drut gat, jhala and notation differences for harmonium and sitar/sarod.',
    series: 'Swar Vadan',
    part: 2,
    isFeatured: false,
    tags: ['instrumental', 'sitar', 'harmonium', 'intermediate', 'class-11-12'],
  },
  {
    id: 'sv-1',
    slug: 'swar-vadan-part-1',
    titleHindi: 'स्वर वादन भाग-1',
    titleEnglish: 'Swar Vadan Part 1',
    price: 180,
    category: 'instrumental',
    level: 'beginner',
    language: 'hindi',
    authors: ['पं० सतीश चन्द्र श्रीवास्तव (सितार वादक)', 'रोहित कुमार'],
    description:
      'Ideal for Sitar, Guitar, Harmonium, Casio, Bansuri, Sarod, Mandolin, Sarangi and more. Covers Class 9–10 boards and Prayag Sangit Samiti / Pracheen Kala Kendra (1st–2nd year). Contains 20 ragas including Bhairav, Alhaya Bilawal, Kafi, Bhupali, Kalyan (Yaman), Bhairavi, Asavari, Vrindavani Sarang, Bhimpalasi, Durga, Desh, Kedar, Bageshri, Bihag, Malkaus, Jaunpuri, Tilak Kamod, Tilang, Pilu.',
    series: 'Swar Vadan',
    part: 1,
    isFeatured: true,
    tags: ['instrumental', 'sitar', 'harmonium', 'beginner', 'class-9-10'],
  },

  // ─── VOCAL - BHATKHANDE NOTATION ────────────────────────────────────────────
  {
    id: 'bsl-5',
    slug: 'bhatkhande-swarlippi-part-5',
    titleHindi: 'भातखंडे स्वरलिपि संग्रह भाग-5',
    titleEnglish: 'Bhatkhande Swarlippi Sangrah Part 5',
    price: 399,
    category: 'vocal',
    level: 'advanced',
    language: 'hindi',
    authors: ['पं० सतीश चन्द्र श्रीवास्तव', 'डॉ० अल्पना खरे'],
    description:
      'For M.A., Sangit Pravin, Sangit Bhaskar and equivalent vocal students. Includes raaga description, aaroh-avroh, pakad, nyaas swar, alaap, mukta taan, chhota khayal, bada khayal, dhrupad, dhamar and tarana for ragas including Bilaskhani Todi, Megh Malhar, Jogkauns, Nayaki Kanhada, Suha, Hemant, Shyam Kalyan, Gorakha Kalyan, Devgiri Bilawal, Yamani Bilawal, Matiyar, Jhinjhoti, Miyan Ki Sarang, Jaitashri, Bihagda, Nat Bihag, Jat Kalyan, Ramdasi Malhar, Shukla Bilawal, and more.',
    series: 'Bhatkhande Swarlippi Sangrah',
    part: 5,
    isFeatured: true,
    tags: ['vocal', 'bhatkhande', 'notation', 'advanced', 'ma', 'pravin'],
  },
  {
    id: 'bsl-4',
    slug: 'bhatkhande-swarlippi-part-4',
    titleHindi: 'भातखंडे स्वरलिपि संग्रह भाग-4',
    titleEnglish: 'Bhatkhande Swarlippi Sangrah Part 4',
    price: 299,
    category: 'vocal',
    level: 'advanced',
    language: 'hindi',
    authors: ['पं० सतीश चन्द्र श्रीवास्तव', 'डॉ० अल्पना खरे'],
    description:
      'For M.A., Sangit Pravin, Sangit Bhaskar and equivalent vocal students. Covers ragas Ahir Bhairav, Puriya Kalyan, Chandrakauns, Gurjari Todi, Madhuvanti, Hans Dhwani, Maru Bihag, Shuddh Sarang, Jog, Nand, Madhmad Sarang, Abhogi Kanhada, Sur Malhar, Narayani, Maluha Kedar, Bengal Bhairav, Jalghar Kedar, Bhupal Todi, Dhani, Gopibasant, Rewa, Hanskinkini, Jait, Dhanashri, Bheem, Shahana, Anand Bhairav, Sarpad, Gara, Jayant Malhar.',
    series: 'Bhatkhande Swarlippi Sangrah',
    part: 4,
    isFeatured: false,
    tags: ['vocal', 'bhatkhande', 'notation', 'advanced', 'ma'],
  },
  {
    id: 'bsl-3',
    slug: 'bhatkhande-swarlippi-part-3',
    titleHindi: 'भातखंडे स्वरलिपि संग्रह भाग-3',
    titleEnglish: 'Bhatkhande Swarlippi Sangrah Part 3',
    price: 249,
    category: 'vocal',
    level: 'intermediate',
    language: 'hindi',
    authors: ['पं० सतीश चन्द्र श्रीवास्तव', 'डॉ० अल्पना खरे'],
    description:
      'For B.A. Sangit Prabhakar, Sangit Visharad and equivalent students. Contains Pt. Bhatkhande\'s gharanedar compositions in notation. Covers ragas Puriya, Darbari Kanhada, Todi, Ramkali, Miyan Malhar, Rageshri, Puriya Dhanashri, Lalit, Deshi, Shri, Hindol, Gaud Sarang, Adana, Paraj, Basant, Vimas, Shuddh Kalyan, Gaud Malhar, Chhayanat, and Malgunji.',
    series: 'Bhatkhande Swarlippi Sangrah',
    part: 3,
    isFeatured: false,
    tags: ['vocal', 'bhatkhande', 'notation', 'intermediate', 'ba', 'prabhakar'],
  },
  {
    id: 'bsl-2',
    slug: 'bhatkhande-swarlippi-part-2',
    titleHindi: 'भातखंडे स्वरलिपि संग्रह भाग-2',
    titleEnglish: 'Bhatkhande Swarlippi Sangrah Part 2',
    price: 199,
    category: 'vocal',
    level: 'intermediate',
    language: 'hindi',
    authors: ['पं० सतीश चन्द्र श्रीवास्तव', 'डॉ० अल्पना खरे'],
    description:
      'For ISC, CBSE Class 11–12 and equivalent boards, and Prayag Sangit Samiti / Pracheen Kala Kendra (3rd–4th year). Covers ragas Jaunpuri, Malkaus, Jayjayawanti, Bhimpalasi, Patdeep, Vrindavani Sarang, Multani, Bhairav, Kalingada, Hamir, Kedar, Kamod, Deshkar, Shankara, Sohni, Marwa, Purvi, Bahar, Pilu, Tilang, Tilak Kamod, Ahir Bhairav.',
    series: 'Bhatkhande Swarlippi Sangrah',
    part: 2,
    isFeatured: false,
    tags: ['vocal', 'bhatkhande', 'notation', 'intermediate', 'class-11-12'],
  },
  {
    id: 'bsl-1',
    slug: 'bhatkhande-swarlippi-part-1',
    titleHindi: 'भातखंडे स्वरलिपि संग्रह भाग-1',
    titleEnglish: 'Bhatkhande Swarlippi Sangrah Part 1',
    price: 149,
    category: 'vocal',
    level: 'beginner',
    language: 'hindi',
    authors: ['पं० सतीश चन्द्र श्रीवास्तव', 'डॉ० अल्पना खरे'],
    description:
      'For ICSE, CBSE Class 9–10 and equivalent boards, and Prayag Sangit Samiti / Pracheen Kala Kendra (1st–2nd year). Covers ragas Kalyan (Yaman), Alhaya Bilawal, Bhairav, Bhairavi, Bhupali, Bageshri, Khamaj, Vrindavani Sarang, Bhimpalasi, Desh, Bihag, Asavari, Kafi, and Durga - with sargam geet, lakshan geet, chhota khayal, bada khayal, tarana, dhrupad and dhamar.',
    series: 'Bhatkhande Swarlippi Sangrah',
    part: 1,
    isFeatured: true,
    tags: ['vocal', 'bhatkhande', 'notation', 'beginner', 'class-9-10'],
  },

  // ─── RAAG THEORY - HINDI ────────────────────────────────────────────────────
  {
    id: 'rsp-3',
    slug: 'raag-shastra-parichay-part-3',
    titleHindi: 'राग शास्त्र परिचय भाग-3',
    titleEnglish: 'Raag Shastra Parichay Part 3',
    price: 225,
    category: 'raag-theory',
    level: 'intermediate',
    language: 'hindi',
    authors: ['पं० सतीश चन्द्र श्रीवास्तव', 'डॉ. अल्पना खरे'],
    description:
      'For Sangit Prabhakar, B.A. and equivalent students. Covers 36 ragas including Ramkali, Lalit, Kamod, Shuddh Kalyan, Darbari Kanhada, Adana, Rageshri, Chhayanat, Puriya, Sohni, Basant, Todi, Multani, Miyan Malhar, Jhinjhoti, Pahadi, Maand, and Aasa. Also includes raga comparison, Hindustani vs Carnatic systems, Indian music history, gharanas, biographies and Western notation.',
    series: 'Raag Shastra Parichay',
    part: 3,
    isFeatured: false,
    tags: ['raag-theory', 'theory', 'intermediate', 'ba', 'prabhakar'],
  },
  {
    id: 'rsp-2',
    slug: 'raag-shastra-parichay-part-2',
    titleHindi: 'राग शास्त्र परिचय भाग-2',
    titleEnglish: 'Raag Shastra Parichay Part 2',
    price: 175,
    category: 'raag-theory',
    level: 'intermediate',
    language: 'hindi',
    authors: ['पं० सतीश चन्द्र श्रीवास्तव', 'डॉ. अल्पना खरे'],
    description:
      'For Class 11–12 boards and Prayag Sangit Samiti / Pracheen Kala Kendra (3rd–4th year). Covers 26 ragas including Bhimpalasi, Patdeep, Kedar, Hamir, Kamod, Jaunpuri, Vrindavani Sarang, Bahar, Tilak Kamod, Gaud Sarang, Marwa, Sohni, Purvi, Todi, Multani, Shankara, Jayjayawanti, Pilu, Ahir Bhairav, Hindol. Also includes laya, maatra, taal, laykari chapters, terminology and biographies.',
    series: 'Raag Shastra Parichay',
    part: 2,
    isFeatured: false,
    tags: ['raag-theory', 'theory', 'intermediate', 'class-11-12'],
  },
  {
    id: 'rsp-1',
    slug: 'raag-shastra-parichay-part-1',
    titleHindi: 'राग शास्त्र परिचय भाग-1',
    titleEnglish: 'Raag Shastra Parichay Part 1',
    price: 99,
    category: 'raag-theory',
    level: 'beginner',
    language: 'hindi',
    authors: ['पं० सतीश चन्द्र श्रीवास्तव', 'डॉ. अल्पना खरे'],
    description:
      'For Class 9–10 boards, Prayag Sangit Samiti and Pracheen Kala Kendra (1st–2nd year). Covers 19 ragas including Kalyan, Bihag, Kafi, Bhupali, Alhaya Bilawal, Khamaj, Tilang, Bhairav, Bhairavi, Malkaus, Bhimpalasi, Bageshri, Asavari, Jaunpuri, Vrindavani Sarang, Desh, Tilak Kamod, Durga, and Kedar. Also includes taal, laya, terminology, instruments, brief music history and musician biographies.',
    series: 'Raag Shastra Parichay',
    part: 1,
    isFeatured: true,
    tags: ['raag-theory', 'theory', 'beginner', 'class-9-10'],
  },

  // ─── RAAG THEORY - ENGLISH ──────────────────────────────────────────────────
  {
    id: 'ior-2',
    slug: 'introduction-of-raags-part-2',
    titleHindi: 'Introduction of Raags भाग-2',
    titleEnglish: 'Introduction of Raags Part 2',
    price: 249,
    category: 'raag-theory',
    level: 'intermediate',
    language: 'english',
    authors: ['Pt. Satish Chandra Srivastava', 'Rohit Kumar'],
    description:
      'A complete book of Theory and Practical for students of Class 11–12 appearing through English medium in ISC Board, U.P. Board and equivalent examinations. Also covers the syllabus of Prayag Sangit Samiti Allahabad and Pracheen Kala Kendra Chandigarh for the 3rd and 4th years.',
    series: 'Introduction of Raags',
    part: 2,
    isFeatured: false,
    tags: ['raag-theory', 'english-medium', 'intermediate', 'class-11-12', 'isc'],
  },
  {
    id: 'ior-1',
    slug: 'introduction-of-raags-part-1',
    titleHindi: 'Introduction of Raags भाग-1',
    titleEnglish: 'Introduction of Raags Part 1',
    price: 199,
    category: 'raag-theory',
    level: 'beginner',
    language: 'english',
    authors: ['Pt. Satish Chandra Srivastava', 'Rohit Kumar'],
    description:
      'A complete book of Theory and Practical for students of Class 9–10 appearing through English medium in ICSE Board, U.P. Board and equivalent examinations. Also covers the complete syllabus of Prayag Sangit Samiti Allahabad and Pracheen Kala Kendra Chandigarh for the first two years.',
    series: 'Introduction of Raags',
    part: 1,
    isFeatured: false,
    tags: ['raag-theory', 'english-medium', 'beginner', 'class-9-10', 'icse'],
  },

  // ─── KATHAK ─────────────────────────────────────────────────────────────────
  {
    id: 'kathak-1',
    slug: 'kathak-shastra-parichay-part-1',
    titleHindi: 'कथक शास्त्र परिचय भाग-1',
    titleEnglish: 'Kathak Shastra Parichay Part 1',
    price: 149,
    category: 'kathak',
    level: 'beginner',
    language: 'hindi',
    authors: ['पं० सतीश चन्द्र श्रीवास्तव', 'डॉ. अल्पना खरे'],
    description:
      'For Prayag Sangit Samiti and Pracheen Kala Kendra (1st–4th year). Covers Bhatkhande and Vishnu Digambar taal-lipis, Tandav and Laasya dance, Bharatnatyam, Kathakali, Manipuri, Kathak, folk dances, brief history of Kathak, gharanas, tabla, pakhawaj, taals, laykari, biographies, mudras, ang-sanchalan, dancer\'s attire, rasa and bhaav, nayak-nayika bhed, kavitt and thumri, dance laheras, gharanedar bandishes and detailed terminology.',
    series: 'Kathak Shastra Parichay',
    part: 1,
    isFeatured: true,
    tags: ['kathak', 'dance', 'beginner', 'theory'],
  },

  // ─── RESEARCH ───────────────────────────────────────────────────────────────
  {
    id: 'malhar-darshan',
    slug: 'malhar-darshan',
    titleHindi: 'मल्हार दर्शन',
    titleEnglish: 'Malhar Darshan',
    price: 300,
    category: 'research',
    level: 'research',
    language: 'hindi',
    authors: ['डॉ. गीता बनर्जी (अवकाश प्राप्त अध्यक्षा, संगीत विभाग, इलाहाबाद विश्वविद्यालय)'],
    description:
      'A scholarly work covering 30 types of ancient, medieval and modern Malhar ragas. Establishes the pure form of Malhar ragas by dispelling misconceptions. Includes Megh Malhar, Gaud Malhar, Miyan Malhar, Sur Malhar, Ramdasi Malhar, Nat Malhar, Meera Malhar, Dhulia Malhar, Gaudgiri Malhar, Charaju Ki Malhar, Jayant Malhar, Samant Malhar, Chanchalas Malhar, Aruna Malhar, Rupamanjari Malhar, Chhaaya Malhar, Tilak Malhar, Sorath Malhar, Kedar Malhar, Jhanjh Malhar, Chandra Malhar, Mahendra Malhar, Anjani Malhar, Janaki Malhar and many more compositions. An invaluable resource for artists, researchers, teachers and music enthusiasts.',
    isFeatured: true,
    tags: ['research', 'malhar', 'raaga', 'scholarly', 'advanced'],
  },

  // ─── CBSE ENGLISH SERIES ────────────────────────────────────────────────────
  {
    id: 'cbse-vocal-9',
    slug: 'concepts-of-vocal-music-class-9',
    titleHindi: 'Concepts of Vocal Music - कक्षा IX',
    titleEnglish: 'Concepts of Vocal Music - Class IX',
    price: 159,
    category: 'cbse',
    level: 'beginner',
    language: 'english',
    authors: ['Pt. Satish Chandra Srivastava', 'Dr. Alpana Khare'],
    description:
      'Covers the entire CBSE syllabus for Class IX Hindustani Music (Code 034). Contains both Theory and Practical sections. Includes objective questions as per the new pattern. Suitable for English medium students appearing in board examinations.',
    series: 'Concepts of Vocal Music',
    part: 9,
    isFeatured: false,
    tags: ['vocal', 'cbse', 'class-9', 'english-medium', 'beginner'],
  },
  {
    id: 'cbse-vocal-10',
    slug: 'concepts-of-vocal-music-class-10',
    titleHindi: 'Concepts of Vocal Music - कक्षा X',
    titleEnglish: 'Concepts of Vocal Music - Class X',
    price: 159,
    category: 'cbse',
    level: 'beginner',
    language: 'english',
    authors: ['Pt. Satish Chandra Srivastava', 'Dr. Alpana Khare'],
    description:
      'Covers the entire CBSE syllabus for Class X Hindustani Music (Code 034). Contains both Theory and Practical sections. Includes objective questions as per the new pattern. Suitable for English medium students appearing in board examinations.',
    series: 'Concepts of Vocal Music',
    part: 10,
    isFeatured: false,
    tags: ['vocal', 'cbse', 'class-10', 'english-medium', 'beginner'],
  },
  {
    id: 'cbse-vocal-11',
    slug: 'concepts-of-vocal-music-class-11',
    titleHindi: 'Concepts of Vocal Music - कक्षा XI',
    titleEnglish: 'Concepts of Vocal Music - Class XI',
    price: 159,
    category: 'cbse',
    level: 'intermediate',
    language: 'english',
    authors: ['Pt. Satish Chandra Srivastava', 'Dr. Alpana Khare'],
    description:
      'Covers the entire CBSE syllabus for Class XI Hindustani Music (Code 034). Contains both Theory and Practical sections. Includes objective questions as per the new pattern. Suitable for English medium students appearing in board examinations.',
    series: 'Concepts of Vocal Music',
    part: 11,
    isFeatured: false,
    tags: ['vocal', 'cbse', 'class-11', 'english-medium', 'intermediate'],
  },
  {
    id: 'cbse-vocal-12',
    slug: 'concepts-of-vocal-music-class-12',
    titleHindi: 'Concepts of Vocal Music - कक्षा XII',
    titleEnglish: 'Concepts of Vocal Music - Class XII',
    price: 159,
    category: 'cbse',
    level: 'intermediate',
    language: 'english',
    authors: ['Pt. Satish Chandra Srivastava', 'Dr. Alpana Khare'],
    description:
      'Covers the entire CBSE syllabus for Class XII Hindustani Music (Code 034). Contains both Theory and Practical sections. Includes objective questions as per the new pattern. Suitable for English medium students appearing in board examinations.',
    series: 'Concepts of Vocal Music',
    part: 12,
    isFeatured: false,
    tags: ['vocal', 'cbse', 'class-12', 'english-medium', 'intermediate'],
  },
  {
    id: 'cbse-inst-9',
    slug: 'concepts-of-instrumental-music-class-9',
    titleHindi: 'Concepts of Instrumental Music - कक्षा IX',
    titleEnglish: 'Concepts of Instrumental Music - Class IX',
    price: 149,
    category: 'cbse',
    level: 'beginner',
    language: 'english',
    authors: ['Pt. Satish Chandra Srivastava', 'Dr. Alpana Khare'],
    description:
      'Covers the entire CBSE syllabus for Class IX Hindustani Music (Code 035). Suitable for students who opt for Guitar, Sitar, Sarod, Harmonium, Sarangi, Flute and more. Contains Theory and Practical sections with objective questions as per the new pattern.',
    series: 'Concepts of Instrumental Music',
    part: 9,
    isFeatured: false,
    tags: ['instrumental', 'cbse', 'class-9', 'english-medium', 'beginner'],
  },
  {
    id: 'cbse-inst-10',
    slug: 'concepts-of-instrumental-music-class-10',
    titleHindi: 'Concepts of Instrumental Music - कक्षा X',
    titleEnglish: 'Concepts of Instrumental Music - Class X',
    price: 149,
    category: 'cbse',
    level: 'beginner',
    language: 'english',
    authors: ['Pt. Satish Chandra Srivastava', 'Dr. Alpana Khare'],
    description:
      'Covers the entire CBSE syllabus for Class X Hindustani Music (Code 035). Suitable for students who opt for Guitar, Sitar, Sarod, Harmonium, Sarangi, Flute and more. Contains Theory and Practical sections with objective questions as per the new pattern.',
    series: 'Concepts of Instrumental Music',
    part: 10,
    isFeatured: false,
    tags: ['instrumental', 'cbse', 'class-10', 'english-medium', 'beginner'],
  },
  {
    id: 'cbse-inst-11',
    slug: 'concepts-of-instrumental-music-class-11',
    titleHindi: 'Concepts of Instrumental Music - कक्षा XI',
    titleEnglish: 'Concepts of Instrumental Music - Class XI',
    price: 149,
    category: 'cbse',
    level: 'intermediate',
    language: 'english',
    authors: ['Pt. Satish Chandra Srivastava', 'Dr. Alpana Khare'],
    description:
      'Covers the entire CBSE syllabus for Class XI Hindustani Music (Code 035). Suitable for students who opt for Guitar, Sitar, Sarod, Harmonium, Sarangi, Flute and more. Contains Theory and Practical sections with objective questions as per the new pattern.',
    series: 'Concepts of Instrumental Music',
    part: 11,
    isFeatured: false,
    tags: ['instrumental', 'cbse', 'class-11', 'english-medium', 'intermediate'],
  },
  {
    id: 'cbse-inst-12',
    slug: 'concepts-of-instrumental-music-class-12',
    titleHindi: 'Concepts of Instrumental Music - कक्षा XII',
    titleEnglish: 'Concepts of Instrumental Music - Class XII',
    price: 149,
    category: 'cbse',
    level: 'intermediate',
    language: 'english',
    authors: ['Pt. Satish Chandra Srivastava', 'Dr. Alpana Khare'],
    description:
      'Covers the entire CBSE syllabus for Class XII Hindustani Music (Code 035). Suitable for students who opt for Guitar, Sitar, Sarod, Harmonium, Sarangi, Flute and more. Contains Theory and Practical sections with objective questions as per the new pattern.',
    series: 'Concepts of Instrumental Music',
    part: 12,
    isFeatured: false,
    tags: ['instrumental', 'cbse', 'class-12', 'english-medium', 'intermediate'],
  },

  // ─── CBSE HINDI SERIES - SANGIT SAAR CLASS XI ───────────────────────────────
  {
    id: 'cbse-gayan-11',
    slug: 'sangit-saar-gayan-class-11',
    titleHindi: 'संगीत सार गायन कक्षा-XI',
    titleEnglish: 'Sangit Saar: Gayan Class XI',
    price: 125,
    category: 'cbse',
    level: 'intermediate',
    language: 'hindi',
    authors: ['पं० सतीश चन्द्र श्रीवास्तव', 'डॉ. अल्पना खरे'],
    description:
      'Specially written for CBSE Class 11 vocal music students (Subject Code 034). Covers the complete CBSE syllabus with detailed raga notations, theory, and practical guidance for board examinations.',
    series: 'Sangit Saar',
    part: 11,
    isFeatured: false,
    tags: ['vocal', 'cbse', 'class-11', 'intermediate'],
  },

  // ─── BAL SANGIT - INDIVIDUAL BOOKS ──────────────────────────────────────────
  {
    id: 'bal-1',
    slug: 'bal-sangit-sangrah-part-1',
    titleHindi: 'बाल संगीत संग्रह भाग-1',
    titleEnglish: 'Bal Sangit Sangrah Part 1',
    price: 125,
    category: 'cbse',
    level: 'beginner',
    language: 'bilingual',
    authors: ['पं० सतीश चन्द्र श्रीवास्तव', 'डॉ. अल्पना खरे'],
    description:
      'Designed for Class 6 and beginner students. Contains photographs of musicians and instruments, basic music knowledge, ragas Kalyan, Khamaj, Bhupali and Alhaya Bilawal, orchestra pieces, vandana, prayers, patriotic songs, children\'s songs and English songs. Also includes biographies of renowned musicians and music terminology.',
    series: 'Bal Sangit Sangrah',
    part: 1,
    isFeatured: false,
    tags: ['children', 'beginner', 'class-6', 'vocal', 'bilingual'],
  },
  {
    id: 'bal-2',
    slug: 'bal-sangit-sangrah-part-2',
    titleHindi: 'बाल संगीत संग्रह भाग-2',
    titleEnglish: 'Bal Sangit Sangrah Part 2',
    price: 125,
    category: 'cbse',
    level: 'beginner',
    language: 'bilingual',
    authors: ['पं० सतीश चन्द्र श्रीवास्तव', 'डॉ. अल्पना खरे'],
    description:
      'Designed for Class 7 and beginner students. Covers ragas Bageshri, Bhimpalasi, Kafi and Malkaus with alaap, notations and taans. Includes orchestra pieces, prayers, patriotic songs, English songs, biographies of musicians and music terminology.',
    series: 'Bal Sangit Sangrah',
    part: 2,
    isFeatured: false,
    tags: ['children', 'beginner', 'class-7', 'vocal', 'bilingual'],
  },
  {
    id: 'bal-3',
    slug: 'bal-sangit-sangrah-part-3',
    titleHindi: 'बाल संगीत संग्रह भाग-3',
    titleEnglish: 'Bal Sangit Sangrah Part 3',
    price: 125,
    category: 'cbse',
    level: 'beginner',
    language: 'bilingual',
    authors: ['पं० सतीश चन्द्र श्रीवास्तव', 'डॉ. अल्पना खरे'],
    description:
      'Designed for Class 8 and beginner students. Covers ragas Asavari, Bhairav and Pilu with alaap, notations and taans. Includes orchestra pieces, prayers, patriotic songs, English songs, biographies of musicians and music terminology.',
    series: 'Bal Sangit Sangrah',
    part: 3,
    isFeatured: false,
    tags: ['children', 'beginner', 'class-8', 'vocal', 'bilingual'],
  },

  // ─── RESEARCH - TREASURE OF RAAGS & TAALS ───────────────────────────────────
  {
    id: 'treasure-raags-taals',
    slug: 'treasure-of-raags-and-taals',
    titleHindi: 'Treasure of Raags & Taals',
    titleEnglish: 'Treasure of Raags & Taals',
    price: 150,
    category: 'research',
    level: 'research',
    language: 'english',
    authors: ['Pt. Satish Chandra Srivastava'],
    description:
      'A comprehensive reference covering 564 North Indian ragas with Thaat, Jati, Vadi, Samvadi, nature of notes, Aaroha, Avaroha and performing time. Also includes 69 North Indian taals with Matra, Vibhag, Tali, Khali and Theka. Covers 938 South Indian ragas and 175 South Indian taals. An invaluable resource for music lovers, students, teachers and research scholars.',
    isFeatured: false,
    tags: ['research', 'reference', 'raag', 'taal', 'english', 'scholarly'],
  },
  // ─── CBSE ───────────────────────────────────────────────────────────────────
  {
    id: 'cbse-gayan-12',
    slug: 'sangit-saar-gayan-class-12',
    titleHindi: 'संगीत सार गायन कक्षा-XII',
    titleEnglish: 'Sangit Saar: Gayan Class XII',
    price: 125,
    category: 'cbse',
    level: 'intermediate',
    language: 'hindi',
    authors: ['पं० सतीश चन्द्र श्रीवास्तव', 'डॉ. अल्पना खरे'],
    description:
      'Specially written for CBSE Class 12 vocal music students (Subject Code 034). Covers the complete CBSE syllabus with detailed raga notations, theory, and practical guidance for board examinations.',
    series: 'Sangit Saar',
    part: 12,
    isFeatured: false,
    tags: ['vocal', 'cbse', 'class-12', 'intermediate'],
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

export function getBookBySlug(slug: string): Book | undefined {
  return books.find((b) => b.slug === slug);
}

export function getBooksByCategory(category: BookCategory): Book[] {
  return books.filter((b) => b.category === category);
}

export function getFeaturedBooks(): Book[] {
  return books.filter((b) => b.isFeatured);
}

export function searchBooks(query: string): Book[] {
  const q = query.toLowerCase();
  return books.filter(
    (b) =>
      b.titleEnglish.toLowerCase().includes(q) ||
      b.titleHindi.includes(q) ||
      b.description.toLowerCase().includes(q) ||
      b.tags.some((t) => t.includes(q)),
  );
}

export const categoryMeta: Record<
  BookCategory,
  { label: string; labelHindi: string; icon: string; description: string }
> = {
  instrumental: {
    label: 'Instrumental Music',
    labelHindi: 'वाद्य संगीत',
    icon: 'व',
    description: 'Sitar, Harmonium, Guitar, Bansuri, Sarod and more',
  },
  vocal: {
    label: 'Vocal Music',
    labelHindi: 'गायन संगीत',
    icon: 'ग',
    description: 'Bhatkhande notation, khayal, dhrupad, thumri',
  },
  'raag-theory': {
    label: 'Raag Theory',
    labelHindi: 'राग शास्त्र',
    icon: 'र',
    description: 'Hindustani raag theory in Hindi and English',
  },
  kathak: {
    label: 'Kathak Dance',
    labelHindi: 'कथक नृत्य',
    icon: 'क',
    description: 'Classical Kathak dance theory and practice',
  },
  research: {
    label: 'Research',
    labelHindi: 'शोध ग्रंथ',
    icon: 'श',
    description: 'Scholarly works and in-depth musicological studies',
  },
  cbse: {
    label: 'CBSE / Board',
    labelHindi: 'बोर्ड परीक्षा',
    icon: 'प',
    description: 'CBSE, ICSE, ISC and UP Board curriculum books',
  },
  bundle: {
    label: 'Bundle Sets',
    labelHindi: 'सम्पूर्ण सेट',
    icon: 'सं',
    description: 'Save more with complete series sets',
  },
};
