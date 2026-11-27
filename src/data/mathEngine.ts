// Comprehensive Elementary Math Question Generator (Kelas 1 SD - Kelas 6 SD)
// Generates fresh, mathematically verified questions with diverse interactive formats

export type QuestionFormat =
  | 'multiple_choice'
  | 'visual_count'
  | 'story'
  | 'fill_blank'
  | 'ordering'
  | 'matching';

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface MathQuestion {
  id: string;
  grade: number; // 1 to 6
  topic: string;
  difficulty: 'Mudah' | 'Sedang' | 'Menantang';
  format: QuestionFormat;
  prompt: string;
  correctAnswer: string;
  options: string[]; // 4 choices for multiple_choice / visual_count / story / fill_blank
  explanation: string;
  // Optional visual elements for visual_count / geometry / clock
  visualData?: {
    type: 'items' | 'shape' | 'clock' | 'fraction_bar';
    emoji?: string;
    countA?: number;
    countB?: number;
    operator?: '+' | '-';
    shapeName?: 'persegi' | 'persegi_panjang' | 'segitiga' | 'lingkaran' | 'kubus' | 'balok';
    sideA?: number;
    sideB?: number;
    sideC?: number;
    hour?: number;
    minute?: number;
    numerator?: number;
    denominator?: number;
  };
  // For ordering format
  orderingNumbers?: number[];
  // For matching format
  matchingPairs?: MatchingPair[];
}

export const GRADE_INFO = [
  {
    grade: 1,
    title: 'KELAS 1 SD',
    subtitle: 'Angka 1–20, Penjumlahan, Pengurangan, Bentuk & Waktu',
    color: '#FF8FAB',
    topics: ['Mengenal & Menghitung Angka', 'Membandingkan & Mengurutkan', 'Penjumlahan & Pengurangan', 'Bentuk Geometri & Jam'],
  },
  {
    grade: 2,
    title: 'KELAS 2 SD',
    subtitle: 'Dua Angka, Perkalian Dasar, Pembagian, Nilai Tempat & Satuan',
    color: '#FBBF24',
    topics: ['Penjumlahan & Pengurangan 2 Angka', 'Perkalian & Pembagian Dasar', 'Nilai Tempat', 'Panjang, Berat & Waktu'],
  },
  {
    grade: 3,
    title: 'KELAS 3 SD',
    subtitle: 'Hitung Campuran, Pecahan Sederhana, Keliling & Luas Persegi',
    color: '#34D399',
    topics: ['Perkalian & Pembagian', 'Pecahan Sederhana', 'Keliling & Luas Bangun Datar', 'Soal Cerita Sehari-hari'],
  },
  {
    grade: 4,
    title: 'KELAS 4 SD',
    subtitle: 'Faktor, FPB, KPK, Pecahan, Desimal & Bangun Datar',
    color: '#38BDF8',
    topics: ['Faktor, FPB & KPK', 'Pecahan & Desimal', 'Operasi Hitung Campuran', 'Luas & Keliling'],
  },
  {
    grade: 5,
    title: 'KELAS 5 SD',
    subtitle: 'Operasi Pecahan, Persen, Perbandingan, Volume & Kecepatan',
    color: '#A78BFA',
    topics: ['Operasi Hitung Pecahan', 'Persen & Perbandingan', 'Volume Kubus & Balok', 'Kecepatan, Jarak & Waktu'],
  },
  {
    grade: 6,
    title: 'KELAS 6 SD',
    subtitle: 'Skala, Bangun Ruang, Luas Permukaan, Statistika & Soal Kontekstual',
    color: '#F87171',
    topics: ['Operasi Campuran & Pecahan', 'Skala & Perbandingan', 'Volume & Luas Permukaan', 'Statistika (Rata-rata & Modus)'],
  },
];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeNumericOptions(correct: number, step = 1, suffix = ''): string[] {
  const set = new Set<number>([correct]);
  const offsets = [-3, -2, -1, 1, 2, 3, 4, -4, 5, 10, -10];
  for (const off of shuffle(offsets)) {
    const candidate = correct + off * step;
    if (candidate >= 0 && !set.has(candidate)) {
      set.add(candidate);
    }
    if (set.size >= 4) break;
  }
  let fallback = correct + step;
  while (set.size < 4) {
    set.add(fallback);
    fallback += step;
  }
  return shuffle(Array.from(set).map((n) => `${n}${suffix}`));
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

// ============================================================================
// KELAS 1 SD GENERATOR
// ============================================================================
function generateGrade1Question(uid: string): MathQuestion {
  const variant = randInt(1, 8);

  if (variant === 1) {
    // Visual counting addition
    const emojis = ['🍎', '🍓', '🧸', '🍼', '🌟', '🐤'];
    const emoji = emojis[randInt(0, emojis.length - 1)];
    const a = randInt(2, 8);
    const b = randInt(2, 7);
    const ans = a + b;
    return {
      id: uid,
      grade: 1,
      topic: 'Penjumlahan Gambar',
      difficulty: 'Mudah',
      format: 'visual_count',
      prompt: `Hitunglah jumlah gambar di bawah ini! Berapakah ${a} + ${b}?`,
      correctAnswer: String(ans),
      options: makeNumericOptions(ans, 1),
      explanation: `Jika kita menggabungkan ${a} dan ${b}, kita menghitung maju dari ${a} sebanyak ${b} langkah sehingga hasilnya adalah ${ans}.`,
      visualData: {
        type: 'items',
        emoji,
        countA: a,
        countB: b,
        operator: '+',
      },
    };
  }

  if (variant === 2) {
    // Subtraction within 20
    const a = randInt(9, 19);
    const b = randInt(2, a - 2);
    const ans = a - b;
    return {
      id: uid,
      grade: 1,
      topic: 'Pengurangan Satuan & Belasan',
      difficulty: 'Mudah',
      format: 'multiple_choice',
      prompt: `Ibu memiliki ${a} biskuit bayi, lalu diberikan kepada adik sebanyak ${b} biskuit. Berapa sisa biskuit Ibu sekarang?`,
      correctAnswer: String(ans),
      options: makeNumericOptions(ans, 1),
      explanation: `Karena diberikan, maka jumlahnya berkurang: ${a} - ${b} = ${ans} biskuit.`,
    };
  }

  if (variant === 3) {
    // Ordering numbers (Mengurutkan bilangan)
    const base = randInt(3, 15);
    const nums = [base, base + randInt(2, 4), base + randInt(5, 8), base + randInt(9, 12)];
    const shuffled = shuffle(nums);
    const sortedStr = nums.join(', ');
    return {
      id: uid,
      grade: 1,
      topic: 'Mengurutkan Bilangan',
      difficulty: 'Sedang',
      format: 'ordering',
      prompt: `Susunlah angka-angka berikut mulai dari yang TERKECIL hingga TERBESAR!`,
      correctAnswer: sortedStr,
      options: [],
      orderingNumbers: shuffled,
      explanation: `Urutan dari angka yang paling kecil ke paling besar adalah ${sortedStr}.`,
    };
  }

  if (variant === 4) {
    // Fill in the blank addition
    const a = randInt(4, 12);
    const b = randInt(3, 9);
    const sum = a + b;
    return {
      id: uid,
      grade: 1,
      topic: 'Mengisi Angka Kosong',
      difficulty: 'Sedang',
      format: 'fill_blank',
      prompt: `Isilah titik-titik berikut: ${a} + ... = ${sum}`,
      correctAnswer: String(b),
      options: makeNumericOptions(b, 1),
      explanation: `Untuk mencari angka yang kosong, kurangi ${sum} dengan ${a}: ${sum} - ${a} = ${b}. Jadi ${a} + ${b} = ${sum}.`,
    };
  }

  if (variant === 5) {
    // Mengenal Waktu Sederhana (Visual Clock)
    const hour = randInt(1, 11);
    const correct = `Pukul ${String(hour).padStart(2, '0')}.00`;
    const otherHours = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter((h) => h !== hour)).slice(0, 3);
    const options = shuffle([correct, ...otherHours.map((h) => `Pukul ${String(h).padStart(2, '0')}.00`)]);
    return {
      id: uid,
      grade: 1,
      topic: 'Mengenal Waktu Sederhana',
      difficulty: 'Mudah',
      format: 'visual_count',
      prompt: `Perhatikan gambar jam dinding ini! Jarum pendek menunjuk angka ${hour} dan jarum panjang di angka 12. Pukul berapakah ini?`,
      correctAnswer: correct,
      options,
      explanation: `Saat jarum panjang di angka 12 dan jarum pendek di angka ${hour}, waktu menunjukkan tepat ${correct}.`,
      visualData: {
        type: 'clock',
        hour,
        minute: 0,
      },
    };
  }

  if (variant === 6) {
    // Mengenal Bentuk Geometri
    const shapes: { id: 'persegi' | 'segitiga' | 'lingkaran' | 'persegi_panjang'; label: string; desc: string }[] = [
      { id: 'persegi', label: 'Persegi', desc: 'memiliki 4 sisi yang sama panjang' },
      { id: 'segitiga', label: 'Segitiga', desc: 'memiliki 3 sisi dan 3 titik sudut' },
      { id: 'lingkaran', label: 'Lingkaran', desc: 'berbentuk bulat seperti roda atau bola' },
      { id: 'persegi_panjang', label: 'Persegi Panjang', desc: 'memiliki 2 pasang sisi berhadapan sama panjang' },
    ];
    const picked = shapes[randInt(0, shapes.length - 1)];
    return {
      id: uid,
      grade: 1,
      topic: 'Mengenal Bentuk Geometri',
      difficulty: 'Mudah',
      format: 'visual_count',
      prompt: `Bangun datar pada gambar di bawah ini ${picked.desc}. Apakah nama bangun datar ini?`,
      correctAnswer: picked.label,
      options: shuffle(shapes.map((s) => s.label)),
      explanation: `Gambar tersebut adalah ${picked.label} karena ${picked.desc}.`,
      visualData: {
        type: 'shape',
        shapeName: picked.id,
      },
    };
  }

  if (variant === 7) {
    // Membandingkan Bilangan
    const a = randInt(11, 29);
    const b = a + randInt(2, 8);
    return {
      id: uid,
      grade: 1,
      topic: 'Membandingkan Bilangan',
      difficulty: 'Mudah',
      format: 'multiple_choice',
      prompt: `Manakah pernyataan perbandingan yang BENAR antara bilangan ${a} dan ${b}?`,
      correctAnswer: `${a} lebih kecil dari ${b}`,
      options: shuffle([
        `${a} lebih kecil dari ${b}`,
        `${a} lebih besar dari ${b}`,
        `${a} sama dengan ${b}`,
        `${b} lebih kecil dari ${a}`,
      ]),
      explanation: `Bilangan ${a} nilainya kurang dari ${b}, sehingga ${a} lebih kecil dari ${b} (${a} < ${b}).`,
    };
  }

  // Matching pairs Grade 1
  const n1 = randInt(3, 7);
  const n2 = randInt(8, 11);
  const n3 = randInt(12, 16);
  const pairs: MatchingPair[] = [
    { id: 'p1', left: `${n1} + 2`, right: String(n1 + 2) },
    { id: 'p2', left: `${n2} - 3`, right: String(n2 - 3) },
    { id: 'p3', left: `${n3} + 4`, right: String(n3 + 4) },
  ];
  return {
    id: uid,
    grade: 1,
    topic: 'Memasangkan Hitungan',
    difficulty: 'Sedang',
    format: 'matching',
    prompt: 'Pasangkan soal di sebelah kiri dengan hasil jawaban yang tepat di sebelah kanan!',
    correctAnswer: 'Selesai',
    options: [],
    matchingPairs: pairs,
    explanation: `${n1} + 2 = ${n1 + 2}, ${n2} - 3 = ${n2 - 3}, dan ${n3} + 4 = ${n3 + 4}. Hebat!`,
  };
}

// ============================================================================
// KELAS 2 SD GENERATOR
// ============================================================================
function generateGrade2Question(uid: string): MathQuestion {
  const variant = randInt(1, 7);

  if (variant === 1) {
    // Penjumlahan dua angka
    const a = randInt(24, 58);
    const b = randInt(15, 39);
    const ans = a + b;
    return {
      id: uid,
      grade: 2,
      topic: 'Penjumlahan Dua Angka',
      difficulty: 'Mudah',
      format: 'multiple_choice',
      prompt: `Berapakah hasil penjumlahan dari ${a} + ${b}?`,
      correctAnswer: String(ans),
      options: makeNumericOptions(ans, 1),
      explanation: `Jumlahkan satuan dengan satuan dan puluhan dengan puluhan: ${a} + ${b} = ${ans}.`,
    };
  }

  if (variant === 2) {
    // Perkalian dasar
    const a = randInt(2, 6);
    const b = randInt(3, 8);
    const ans = a * b;
    return {
      id: uid,
      grade: 2,
      topic: 'Perkalian Dasar',
      difficulty: 'Sedang',
      format: 'story',
      prompt: `Di kamar bayi terdapat ${a} kotak mainan. Setiap kotak berisi ${b} boneka kecil. Berapa jumlah seluruh boneka kecil?`,
      correctAnswer: String(ans),
      options: makeNumericOptions(ans, 2),
      explanation: `${a} kotak dikali ${b} boneka = ${a} × ${b} = ${ans} boneka.`,
    };
  }

  if (variant === 3) {
    // Pembagian sederhana
    const b = randInt(2, 6);
    const ans = randInt(3, 9);
    const total = b * ans;
    return {
      id: uid,
      grade: 2,
      topic: 'Pembagian Sederhana',
      difficulty: 'Sedang',
      format: 'fill_blank',
      prompt: `Kakak membagikan ${total} buah apel sama banyak kepada ${b} keranjang. Berapa apel di setiap keranjang? (${total} ÷ ${b} = ...)`,
      correctAnswer: String(ans),
      options: makeNumericOptions(ans, 1),
      explanation: `Karena ${b} × ${ans} = ${total}, maka ${total} ÷ ${b} = ${ans} apel.`,
    };
  }

  if (variant === 4) {
    // Nilai tempat
    const hundreds = randInt(1, 8);
    const tens = randInt(1, 9);
    const ones = randInt(1, 9);
    const num = hundreds * 100 + tens * 10 + ones;
    return {
      id: uid,
      grade: 2,
      topic: 'Nilai Tempat Bilangan',
      difficulty: 'Mudah',
      format: 'multiple_choice',
      prompt: `Pada bilangan ${num}, angka ${tens} menempati nilai tempat apakah?`,
      correctAnswer: `Puluhan (nilainya ${tens * 10})`,
      options: shuffle([
        `Puluhan (nilainya ${tens * 10})`,
        `Ratusan (nilainya ${tens * 100})`,
        `Satuan (nilainya ${tens})`,
        `Ribuan (nilainya ${tens * 1000})`,
      ]),
      explanation: `Pada bilangan ${num}: ${hundreds} adalah ratusan (${hundreds * 100}), ${tens} adalah puluhan (${tens * 10}), dan ${ones} adalah satuan.`,
    };
  }

  if (variant === 5) {
    // Pengukuran Panjang & Berat
    const meters = randInt(2, 7);
    const cm = meters * 100;
    return {
      id: uid,
      grade: 2,
      topic: 'Pengukuran Panjang',
      difficulty: 'Sedang',
      format: 'multiple_choice',
      prompt: `Karpet di kamar bermain memiliki panjang ${meters} meter. Berapa sentimeter (cm) panjang karpet tersebut?`,
      correctAnswer: `${cm} cm`,
      options: makeNumericOptions(cm, 100, ' cm'),
      explanation: `Ingat bahwa 1 meter = 100 cm. Maka ${meters} meter = ${meters} × 100 = ${cm} cm.`,
    };
  }

  if (variant === 6) {
    // Mengurutkan bilangan ratusan Kelas 2
    const b1 = randInt(110, 180);
    const nums = [b1, b1 + randInt(15, 35), b1 + randInt(40, 75), b1 + randInt(80, 120)];
    return {
      id: uid,
      grade: 2,
      topic: 'Mengurutkan Bilangan Ratusan',
      difficulty: 'Sedang',
      format: 'ordering',
      prompt: 'Urutkan bilangan ratusan di bawah ini dari yang TERKECIL ke yang TERBESAR!',
      correctAnswer: nums.join(', '),
      options: [],
      orderingNumbers: shuffle(nums),
      explanation: `Urutan bilangan dari yang paling kecil ke besar adalah: ${nums.join(', ')}.`,
    };
  }

  // Matching Grade 2
  const a1 = randInt(3, 6);
  const a2 = randInt(7, 9);
  const pairs: MatchingPair[] = [
    { id: 'm1', left: `${a1} × 4`, right: String(a1 * 4) },
    { id: 'm2', left: `${a2 * 3} ÷ 3`, right: String(a2) },
    { id: 'm3', left: `50 - 15`, right: '35' },
  ];
  return {
    id: uid,
    grade: 2,
    topic: 'Pasangan Perkalian & Pembagian',
    difficulty: 'Sedang',
    format: 'matching',
    prompt: 'Pasangkan operasi hitung Kelas 2 di kiri dengan jawaban yang benar di kanan!',
    correctAnswer: 'Selesai',
    options: [],
    matchingPairs: pairs,
    explanation: `${a1} × 4 = ${a1 * 4}, ${a2 * 3} ÷ 3 = ${a2}, dan 50 - 15 = 35.`,
  };
}

// ============================================================================
// KELAS 3 SD GENERATOR
// ============================================================================
function generateGrade3Question(uid: string): MathQuestion {
  const variant = randInt(1, 6);

  if (variant === 1) {
    // Keliling & Luas Persegi Panjang (Visual Shape)
    const p = randInt(6, 14);
    const l = randInt(3, p - 1);
    const askArea = Math.random() > 0.5;
    const ans = askArea ? p * l : 2 * (p + l);
    return {
      id: uid,
      grade: 3,
      topic: askArea ? 'Luas Persegi Panjang' : 'Keliling Persegi Panjang',
      difficulty: 'Sedang',
      format: 'visual_count',
      prompt: askArea
        ? `Perhatikan bangun persegi panjang dengan panjang ${p} cm dan lebar ${l} cm. Berapakah LUAS bangun tersebut?`
        : `Perhatikan bangun persegi panjang dengan panjang ${p} cm dan lebar ${l} cm. Berapakah KELILING bangun tersebut?`,
      correctAnswer: askArea ? `${ans} cm²` : `${ans} cm`,
      options: makeNumericOptions(ans, 2, askArea ? ' cm²' : ' cm'),
      explanation: askArea
        ? `Rumus Luas persegi panjang = panjang × lebar = ${p} × ${l} = ${ans} cm².`
        : `Rumus Keliling persegi panjang = 2 × (panjang + lebar) = 2 × (${p} + ${l}) = ${ans} cm.`,
      visualData: {
        type: 'shape',
        shapeName: 'persegi_panjang',
        sideA: p,
        sideB: l,
      },
    };
  }

  if (variant === 2) {
    // Pecahan sederhana dengan visual bar
    const den = randInt(4, 8);
    const num = randInt(1, den - 1);
    const correct = `${num}/${den}`;
    const opts = new Set<string>([correct]);
    opts.add(`${den - num}/${den}`);
    opts.add(`${num}/${den + 1}`);
    opts.add(`${Math.max(1, num - 1)}/${den + 2}`);
    return {
      id: uid,
      grade: 3,
      topic: 'Pecahan Sederhana',
      difficulty: 'Mudah',
      format: 'visual_count',
      prompt: `Perhatikan balok pecahan berikut! Ada ${num} bagian yang diwarnai dari ${den} bagian keseluruhan. Nilai pecahannya adalah...`,
      correctAnswer: correct,
      options: shuffle(Array.from(opts)),
      explanation: `Pembilang adalah bagian yang diwarnai (${num}) dan penyebut adalah total seluruh bagian (${den}), sehingga nilainya ${num}/${den}.`,
      visualData: {
        type: 'fraction_bar',
        numerator: num,
        denominator: den,
      },
    };
  }

  if (variant === 3) {
    // Operasi hitung campuran sederhana
    const a = randInt(15, 35);
    const b = randInt(4, 8);
    const c = randInt(3, 6);
    const ans = a + b * c;
    return {
      id: uid,
      grade: 3,
      topic: 'Operasi Hitung Campuran',
      difficulty: 'Sedang',
      format: 'fill_blank',
      prompt: `Hitunglah hasil dari: ${a} + (${b} × ${c}) = ...`,
      correctAnswer: String(ans),
      options: makeNumericOptions(ans, 2),
      explanation: `Kerjakan perkalian terlebih dahulu: ${b} × ${c} = ${b * c}. Lalu jumlahkan: ${a} + ${b * c} = ${ans}.`,
    };
  }

  if (variant === 4) {
    // Soal cerita perkalian & pembagian
    const packs = randInt(4, 9);
    const perPack = randInt(6, 12);
    const eaten = randInt(5, 12);
    const ans = packs * perPack - eaten;
    return {
      id: uid,
      grade: 3,
      topic: 'Soal Cerita Kehidupan Sehari-hari',
      difficulty: 'Menantang',
      format: 'story',
      prompt: `Ayah membeli ${packs} kotak susu bubuk. Setiap kotak berisi ${perPack} saset. Setelah diminum adik sebanyak ${eaten} saset, berapa saset susu yang tersisa?`,
      correctAnswer: `${ans} saset`,
      options: makeNumericOptions(ans, 2, ' saset'),
      explanation: `Total saset awal = ${packs} × ${perPack} = ${packs * perPack}. Sisa saset = ${packs * perPack} - ${eaten} = ${ans} saset.`,
    };
  }

  if (variant === 5) {
    // Luas Persegi
    const s = randInt(5, 12);
    const ans = s * s;
    return {
      id: uid,
      grade: 3,
      topic: 'Luas Persegi',
      difficulty: 'Mudah',
      format: 'visual_count',
      prompt: `Sebuah ubin kamar bayi berbentuk persegi memiliki panjang sisi ${s} cm. Berapakah luas ubin tersebut?`,
      correctAnswer: `${ans} cm²`,
      options: makeNumericOptions(ans, 4, ' cm²'),
      explanation: `Luas persegi = sisi × sisi = ${s} × ${s} = ${ans} cm².`,
      visualData: {
        type: 'shape',
        shapeName: 'persegi',
        sideA: s,
      },
    };
  }

  // Matching Grade 3
  const s1 = randInt(4, 8);
  const s2 = randInt(6, 9);
  return {
    id: uid,
    grade: 3,
    topic: 'Pasangan Perkalian & Keliling',
    difficulty: 'Sedang',
    format: 'matching',
    prompt: 'Pasangkan soal matematika Kelas 3 di kiri dengan jawaban yang sesuai di kanan!',
    correctAnswer: 'Selesai',
    options: [],
    matchingPairs: [
      { id: 'g3_1', left: `Keliling persegi sisi ${s1} cm`, right: `${s1 * 4} cm` },
      { id: 'g3_2', left: `${s2} × 7`, right: String(s2 * 7) },
      { id: 'g3_3', left: `72 ÷ 8`, right: '9' },
    ],
    explanation: `Keliling persegi = 4 × ${s1} = ${s1 * 4} cm; ${s2} × 7 = ${s2 * 7}; dan 72 ÷ 8 = 9.`,
  };
}

// ============================================================================
// KELAS 4 SD GENERATOR
// ============================================================================
function generateGrade4Question(uid: string): MathQuestion {
  const variant = randInt(1, 6);

  if (variant === 1) {
    // KPK (Kelipatan Persekutuan Terkecil)
    const pairs = [
      [4, 6],
      [6, 8],
      [8, 12],
      [6, 9],
      [5, 6],
      [4, 10],
    ];
    const [a, b] = pairs[randInt(0, pairs.length - 1)];
    const ans = lcm(a, b);
    return {
      id: uid,
      grade: 4,
      topic: 'KPK (Kelipatan Persekutuan Terkecil)',
      difficulty: 'Sedang',
      format: 'multiple_choice',
      prompt: `Berapakah Kelipatan Persekutuan Terkecil (KPK) dari bilangan ${a} dan ${b}?`,
      correctAnswer: String(ans),
      options: makeNumericOptions(ans, 2),
      explanation: `Kelipatan ${a} dan ${b} yang paling kecil dan sama adalah ${ans}. Jadi KPK(${a}, ${b}) = ${ans}.`,
    };
  }

  if (variant === 2) {
    // FPB (Faktor Persekutuan Terbesar)
    const pairs = [
      [12, 18],
      [16, 24],
      [15, 25],
      [18, 27],
      [20, 30],
      [14, 21],
    ];
    const [a, b] = pairs[randInt(0, pairs.length - 1)];
    const ans = gcd(a, b);
    return {
      id: uid,
      grade: 4,
      topic: 'FPB (Faktor Persekutuan Terbesar)',
      difficulty: 'Sedang',
      format: 'story',
      prompt: `Ibu mempunyai ${a} botol susu dan ${b} biskuit bayi. Ibu ingin membagikannya ke dalam beberapa bingkisan dengan jumlah sama banyak. Berapa bingkisan paling banyak yang dapat dibuat? (FPB dari ${a} dan ${b})`,
      correctAnswer: `${ans} bingkisan`,
      options: makeNumericOptions(ans, 1, ' bingkisan'),
      explanation: `Faktor pembagi terbesar yang dapat membagi habis ${a} dan ${b} adalah ${ans}. Jadi FPB(${a}, ${b}) = ${ans}.`,
    };
  }

  if (variant === 3) {
    // Pecahan ke Desimal
    const items = [
      { frac: '1/2', dec: '0,5', exp: '1 ÷ 2 = 5/10 = 0,5' },
      { frac: '1/4', dec: '0,25', exp: '1 ÷ 4 = 25/100 = 0,25' },
      { frac: '3/4', dec: '0,75', exp: '3 ÷ 4 = 75/100 = 0,75' },
      { frac: '2/5', dec: '0,4', exp: '2/5 = 4/10 = 0,4' },
      { frac: '3/5', dec: '0,6', exp: '3/5 = 6/10 = 0,6' },
      { frac: '7/10', dec: '0,7', exp: '7 persepuluh ditulis 0,7' },
    ];
    const picked = items[randInt(0, items.length - 1)];
    const wrong = shuffle(items.filter((i) => i.dec !== picked.dec)).slice(0, 3).map((i) => i.dec);
    return {
      id: uid,
      grade: 4,
      topic: 'Pecahan & Desimal',
      difficulty: 'Mudah',
      format: 'multiple_choice',
      prompt: `Ubahlah pecahan ${picked.frac} menjadi bentuk bilangan desimal!`,
      correctAnswer: picked.dec,
      options: shuffle([picked.dec, ...wrong]),
      explanation: `Cara mengubah pecahan ${picked.frac} ke desimal: ${picked.exp}.`,
    };
  }

  if (variant === 4) {
    // Luas Segitiga
    const alas = randInt(4, 10) * 2;
    const tinggi = randInt(3, 9);
    const luas = (alas * tinggi) / 2;
    return {
      id: uid,
      grade: 4,
      topic: 'Luas Segitiga',
      difficulty: 'Sedang',
      format: 'visual_count',
      prompt: `Sebuah bendera hias kamar bayi berbentuk segitiga memiliki alas ${alas} cm dan tinggi ${tinggi} cm. Berapakah luas segitiga tersebut?`,
      correctAnswer: `${luas} cm²`,
      options: makeNumericOptions(luas, 3, ' cm²'),
      explanation: `Rumus Luas Segitiga = ½ × alas × tinggi = ½ × ${alas} × ${tinggi} = ${luas} cm².`,
      visualData: {
        type: 'shape',
        shapeName: 'segitiga',
        sideA: alas,
        sideB: tinggi,
      },
    };
  }

  if (variant === 5) {
    // Operasi hitung campuran Kelas 4
    const a = randInt(120, 250);
    const b = randInt(12, 20);
    const c = randInt(4, 6);
    const ans = a - b * c;
    return {
      id: uid,
      grade: 4,
      topic: 'Operasi Hitung Campuran',
      difficulty: 'Sedang',
      format: 'fill_blank',
      prompt: `Berapakah hasil dari ${a} - (${b} × ${c})?`,
      correctAnswer: String(ans),
      options: makeNumericOptions(ans, 5),
      explanation: `Hitung perkalian lebih dulu: ${b} × ${c} = ${b * c}. Kemudian kurangkan: ${a} - ${b * c} = ${ans}.`,
    };
  }

  // Matching Grade 4
  return {
    id: uid,
    grade: 4,
    topic: 'Faktor, Desimal & Pecahan',
    difficulty: 'Sedang',
    format: 'matching',
    prompt: 'Pasangkan nilai yang setara di sebelah kiri dan kanan!',
    correctAnswer: 'Selesai',
    options: [],
    matchingPairs: [
      { id: 'g4_1', left: 'FPB dari 12 dan 16', right: '4' },
      { id: 'g4_2', left: 'KPK dari 6 dan 9', right: '18' },
      { id: 'g4_3', left: 'Bentuk desimal 3/4', right: '0,75' },
    ],
    explanation: 'FPB(12, 16) = 4, KPK(6, 9) = 18, dan 3/4 = 0,75.',
  };
}

// ============================================================================
// KELAS 5 SD GENERATOR
// ============================================================================
function generateGrade5Question(uid: string): MathQuestion {
  const variant = randInt(1, 6);

  if (variant === 1) {
    // Volume Balok (Visual 3D Box)
    const p = randInt(5, 10);
    const l = randInt(3, 6);
    const t = randInt(2, 5);
    const vol = p * l * t;
    return {
      id: uid,
      grade: 5,
      topic: 'Volume Bangun Ruang (Balok)',
      difficulty: 'Sedang',
      format: 'visual_count',
      prompt: `Kotak penyimpanan mainan berbentuk balok memiliki panjang ${p} dm, lebar ${l} dm, dan tinggi ${t} dm. Berapakah volume kotak tersebut?`,
      correctAnswer: `${vol} dm³`,
      options: makeNumericOptions(vol, 5, ' dm³'),
      explanation: `Rumus Volume Balok = panjang × lebar × tinggi = ${p} × ${l} × ${t} = ${vol} dm³.`,
      visualData: {
        type: 'shape',
        shapeName: 'balok',
        sideA: p,
        sideB: l,
        sideC: t,
      },
    };
  }

  if (variant === 2) {
    // Penjumlahan Pecahan Beda Penyebut
    const problems = [
      { q: '1/2 + 1/4', ans: '3/4', exp: 'Samakan penyebut menjadi 4: 2/4 + 1/4 = 3/4.', wrong: ['2/6', '1/6', '3/8'] },
      { q: '1/3 + 1/6', ans: '1/2', exp: 'Samakan penyebut menjadi 6: 2/6 + 1/6 = 3/6 = 1/2.', wrong: ['2/9', '2/6', '5/6'] },
      { q: '2/5 + 3/10', ans: '7/10', exp: 'Samakan penyebut menjadi 10: 4/10 + 3/10 = 7/10.', wrong: ['5/15', '1/2', '9/10'] },
      { q: '3/4 - 1/2', ans: '1/4', exp: 'Samakan penyebut menjadi 4: 3/4 - 2/4 = 1/4.', wrong: ['2/2', '1/2', '3/8'] },
      { q: '2/3 + 1/4', ans: '11/12', exp: 'Samakan penyebut menjadi 12: 8/12 + 3/12 = 11/12.', wrong: ['3/7', '7/12', '5/12'] },
    ];
    const p = problems[randInt(0, problems.length - 1)];
    return {
      id: uid,
      grade: 5,
      topic: 'Operasi Hitung Pecahan',
      difficulty: 'Sedang',
      format: 'multiple_choice',
      prompt: `Berapakah hasil paling sederhana dari operasi pecahan: ${p.q} ?`,
      correctAnswer: p.ans,
      options: shuffle([p.ans, ...p.wrong]),
      explanation: p.exp,
    };
  }

  if (variant === 3) {
    // Kecepatan, Jarak, dan Waktu
    const speed = randInt(4, 8) * 10; // 40..80 km/jam
    const time = randInt(2, 4);
    const dist = speed * time;
    return {
      id: uid,
      grade: 5,
      topic: 'Kecepatan, Jarak & Waktu',
      difficulty: 'Sedang',
      format: 'story',
      prompt: `Keluarga bayi Chika pergi bertamasya mengendarai mobil dengan kecepatan rata-rata ${speed} km/jam selama ${time} jam. Berapa kilometer jarak yang ditempuh?`,
      correctAnswer: `${dist} km`,
      options: makeNumericOptions(dist, 20, ' km'),
      explanation: `Rumus Jarak = Kecepatan × Waktu = ${speed} km/jam × ${time} jam = ${dist} km.`,
    };
  }

  if (variant === 4) {
    // Persen & Diskon Toko Bayi
    const prices = [100, 200, 150, 80];
    const price = prices[randInt(0, prices.length - 1)];
    const pcts = [10, 20, 25, 50];
    const pct = pcts[randInt(0, pcts.length - 1)];
    const disc = (price * pct) / 100;
    return {
      id: uid,
      grade: 5,
      topic: 'Persen dalam Kehidupan Sehari-hari',
      difficulty: 'Sedang',
      format: 'fill_blank',
      prompt: `Harga sebuah kereta dorong bayi adalah ${price} koin. Jika mendapat potongan harga ${pct}%, berapa koin besar potongan harganya?`,
      correctAnswer: String(disc),
      options: makeNumericOptions(disc, 5),
      explanation: `${pct}% dari ${price} = (${pct}/100) × ${price} = ${disc} koin.`,
    };
  }

  if (variant === 5) {
    // Volume Kubus
    const rusuk = randInt(3, 9);
    const vol = rusuk * rusuk * rusuk;
    return {
      id: uid,
      grade: 5,
      topic: 'Volume Kubus',
      difficulty: 'Sedang',
      format: 'visual_count',
      prompt: `Sebuah balok susun berbentuk kubus memiliki panjang rusuk ${rusuk} cm. Berapakah volume kubus tersebut?`,
      correctAnswer: `${vol} cm³`,
      options: makeNumericOptions(vol, 9, ' cm³'),
      explanation: `Rumus Volume Kubus = rusuk × rusuk × rusuk = ${rusuk} × ${rusuk} × ${rusuk} = ${vol} cm³.`,
      visualData: {
        type: 'shape',
        shapeName: 'kubus',
        sideA: rusuk,
      },
    };
  }

  // Perbandingan Kelas 5
  const mult = randInt(3, 8);
  const rA = 2;
  const rB = 3;
  const valA = rA * mult;
  const valB = rB * mult;
  return {
    id: uid,
    grade: 5,
    topic: 'Perbandingan Senilai',
    difficulty: 'Menantang',
    format: 'story',
    prompt: `Perbandingan jumlah botol susu biru dan botol susu pink adalah ${rA} : ${rB}. Jika jumlah botol susu biru ada ${valA} buah, berapakah jumlah botol susu pink?`,
    correctAnswer: `${valB} buah`,
    options: makeNumericOptions(valB, 3, ' buah'),
    explanation: `Karena ${valA} ÷ ${rA} = ${mult}, maka jumlah botol pink = ${rB} × ${mult} = ${valB} buah.`,
  };
}

// ============================================================================
// KELAS 6 SD GENERATOR
// ============================================================================
function generateGrade6Question(uid: string): MathQuestion {
  const variant = randInt(1, 6);

  if (variant === 1) {
    // Statistika Dasar: Rata-rata (Mean)
    const base = randInt(6, 12);
    const data = [base, base + 2, base + 4, base + 2, base + 7]; // sum = 5*base + 15 => divisible by 5!
    const sum = data.reduce((a, b) => a + b, 0);
    const mean = sum / data.length;
    return {
      id: uid,
      grade: 6,
      topic: 'Statistika Dasar (Rata-rata / Mean)',
      difficulty: 'Sedang',
      format: 'story',
      prompt: `Selama 5 hari, pemain berhasil mengumpulkan koin matematika berturut-turut: ${data.join(', ')}. Berapakah rata-rata koin per hari?`,
      correctAnswer: String(mean),
      options: makeNumericOptions(mean, 1),
      explanation: `Jumlah seluruh data = ${data.join(' + ')} = ${sum}. Rata-rata = ${sum} ÷ 5 hari = ${mean}.`,
    };
  }

  if (variant === 2) {
    // Luas Permukaan Kubus
    const s = randInt(4, 10);
    const lp = 6 * s * s;
    return {
      id: uid,
      grade: 6,
      topic: 'Luas Permukaan Bangun Ruang',
      difficulty: 'Sedang',
      format: 'visual_count',
      prompt: `Kotak kado kejutan berbentuk kubus memiliki panjang rusuk ${s} cm. Berapakah luas permukaan seluruh sisi kotak kado tersebut?`,
      correctAnswer: `${lp} cm²`,
      options: makeNumericOptions(lp, 12, ' cm²'),
      explanation: `Kubus memiliki 6 sisi persegi yang sama. Luas permukaan = 6 × (s × s) = 6 × (${s} × ${s}) = ${lp} cm².`,
      visualData: {
        type: 'shape',
        shapeName: 'kubus',
        sideA: s,
      },
    };
  }

  if (variant === 3) {
    // Skala Peta / Denah Kamar
    const cmMap = randInt(3, 8);
    const scaleMeters = randInt(2, 5); // 1 : (scaleMeters * 100)
    const scaleNum = scaleMeters * 100;
    const realMeters = cmMap * scaleMeters;
    return {
      id: uid,
      grade: 6,
      topic: 'Skala dan Perbandingan',
      difficulty: 'Menantang',
      format: 'story',
      prompt: `Pada denah rumah berskala 1 : ${scaleNum}, panjang taman bermain bayi adalah ${cmMap} cm. Berapa meter panjang taman sebenarnya?`,
      correctAnswer: `${realMeters} meter`,
      options: makeNumericOptions(realMeters, 2, ' meter'),
      explanation: `Jarak sebenarnya = ${cmMap} cm × ${scaleNum} = ${cmMap * scaleNum} cm = ${realMeters} meter.`,
    };
  }

  if (variant === 4) {
    // Operasi Hitung Campuran & Bilangan Bulat
    const a = randInt(40, 80);
    const b = randInt(6, 12);
    const c = randInt(3, 5);
    const d = randInt(10, 25);
    const ans = a + b * c - d;
    return {
      id: uid,
      grade: 6,
      topic: 'Operasi Hitung Campuran',
      difficulty: 'Sedang',
      format: 'fill_blank',
      prompt: `Selesaikan operasi hitung campuran berikut: ${a} + (${b} × ${c}) - ${d} = ...`,
      correctAnswer: String(ans),
      options: makeNumericOptions(ans, 4),
      explanation: `Utamakan perkalian: ${b} × ${c} = ${b * c}. Lalu ${a} + ${b * c} - ${d} = ${ans}.`,
    };
  }

  if (variant === 5) {
    // Lingkaran (Keliling dengan r kelipatan 7)
    const rList = [7, 14, 21];
    const r = rList[randInt(0, rList.length - 1)];
    const keliling = 2 * (22 / 7) * r;
    return {
      id: uid,
      grade: 6,
      topic: 'Keliling Lingkaran',
      difficulty: 'Sedang',
      format: 'visual_count',
      prompt: `Sebuah karpet bundar di kamar bayi memiliki jari-jari (r) = ${r} cm. Gunakan π = 22/7. Berapakah keliling karpet bundar tersebut?`,
      correctAnswer: `${keliling} cm`,
      options: makeNumericOptions(keliling, 11, ' cm'),
      explanation: `Keliling lingkaran = 2 × π × r = 2 × (22/7) × ${r} = ${keliling} cm.`,
      visualData: {
        type: 'shape',
        shapeName: 'lingkaran',
        sideA: r,
      },
    };
  }

  // Matching Grade 6
  return {
    id: uid,
    grade: 6,
    topic: 'Konsep Gabungan Kelas 6',
    difficulty: 'Menantang',
    format: 'matching',
    prompt: 'Pasangkan pernyataan matematika Kelas 6 di kiri dengan hasil yang tepat di kanan!',
    correctAnswer: 'Selesai',
    options: [],
    matchingPairs: [
      { id: 'g6_1', left: 'Modus dari: 7, 8, 8, 9, 8, 10', right: '8' },
      { id: 'g6_2', left: '25% dari 240', right: '60' },
      { id: 'g6_3', left: 'Volume kubus rusuk 5 cm', right: '125 cm³' },
    ],
    explanation: 'Modus adalah nilai yang paling sering muncul (8), 25% × 240 = 60, dan 5³ = 125 cm³.',
  };
}

export function generateQuestionForGrade(grade: number): MathQuestion {
  const uid = `q_${grade}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  switch (grade) {
    case 1:
      return generateGrade1Question(uid);
    case 2:
      return generateGrade2Question(uid);
    case 3:
      return generateGrade3Question(uid);
    case 4:
      return generateGrade4Question(uid);
    case 5:
      return generateGrade5Question(uid);
    case 6:
    default:
      return generateGrade6Question(uid);
  }
}
