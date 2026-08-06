import type { AppLanguage } from '../store/types';

export interface Publication {
  code: string;
  title: Record<AppLanguage, string>;
}

/** Only "Enjoy Life Forever!" for now — the dropdown is deliberately single-option, structured so more publications can be added later. */
export const PUBLICATIONS: Publication[] = [
  {
    code: 'lff',
    title: {
      en: 'Enjoy Life Forever!',
      nl: 'Voor eeuwig gelukkig!',
      id: 'Hidup Bahagia Selamanya!',
    },
  },
];

export function publicationTitle(code: string, language: AppLanguage): string {
  return PUBLICATIONS.find((p) => p.code === code)?.title[language] ?? '';
}

export interface LffLesson {
  lesson: number;
  section: number;
  title: Record<AppLanguage, string>;
}

/** Section number -> [firstLesson, lastLesson] inclusive, for the "Enjoy Life Forever!" course. */
export const LFF_SECTION_RANGES: Record<number, [number, number]> = {
  1: [1, 12],
  2: [13, 33],
  3: [34, 47],
  4: [48, 60],
};

export const LFF_SECTION_COUNT = Object.keys(LFF_SECTION_RANGES).length;

export const LFF_LESSONS: LffLesson[] = [
  { lesson: 1, section: 1, title: { en: 'How Can the Bible Help You?', nl: 'Wat kan de Bijbel voor je betekenen?', id: 'Apa Manfaat Alkitab untuk Anda?' } },
  { lesson: 2, section: 1, title: { en: 'The Bible Gives Hope', nl: 'De Bijbel geeft hoop', id: 'Janji Alkitab Bisa Memberi Kita Harapan' } },
  { lesson: 3, section: 1, title: { en: 'Can You Trust the Bible?', nl: 'Is de Bijbel betrouwbaar?', id: 'Apakah Alkitab Bisa Dipercaya?' } },
  { lesson: 4, section: 1, title: { en: 'Who Is God?', nl: 'Wie is God?', id: 'Siapakah Allah?' } },
  { lesson: 5, section: 1, title: { en: 'The Bible Is God\'s Message to Us', nl: 'De Bijbel bevat Gods boodschap aan ons', id: 'Alkitab Berisi Kata-Kata Allah untuk Kita' } },
  { lesson: 6, section: 1, title: { en: 'How Did Life Begin?', nl: 'Hoe is het leven ontstaan?', id: 'Bagaimana Asal Mula Kehidupan?' } },
  { lesson: 7, section: 1, title: { en: 'What Is Jehovah Like?', nl: 'Wat voor God is Jehovah?', id: 'Seperti Apa Yehuwa Itu?' } },
  { lesson: 8, section: 1, title: { en: 'You Can Be Jehovah\'s Friend', nl: 'Je kunt Jehovah\'s vriend zijn', id: 'Anda Bisa Bersahabat dengan Yehuwa' } },
  { lesson: 9, section: 1, title: { en: 'Draw Close to God Through Prayer', nl: 'Krijg een goede band met God door te bidden', id: 'Mendekatlah kepada Allah dengan Berdoa' } },
  { lesson: 10, section: 1, title: { en: 'How Can the Meetings of Jehovah\'s Witnesses Benefit You?', nl: 'Waarom zou je naar de bijeenkomsten van Jehovah\'s Getuigen gaan?', id: 'Apa Manfaatnya Menghadiri Pertemuan Ibadah Saksi-Saksi Yehuwa?' } },
  { lesson: 11, section: 1, title: { en: 'How You Can Get the Most Out of the Bible', nl: 'Hoe haal je zo veel mogelijk uit Bijbellezen?', id: 'Caranya Anda Bisa Benar-Benar Mendapat Manfaat dari Alkitab' } },
  { lesson: 12, section: 1, title: { en: 'What Will Help You to Keep Studying the Bible?', nl: 'Wat zal je helpen om door te gaan met je Bijbelcursus?', id: 'Apa yang Bisa Membantu Anda Terus Belajar Alkitab?' } },
  { lesson: 13, section: 2, title: { en: 'How False Religion Misrepresents God', nl: 'Hoe valse religies een verkeerd beeld van God geven', id: 'Agama-Agama Palsu Merusak Nama Baik Allah' } },
  { lesson: 14, section: 2, title: { en: 'How Can Our Worship Be Pleasing to God?', nl: 'Hoe kun je God aanbidden op een manier die hij goedkeurt?', id: 'Ibadah yang Menyenangkan Allah' } },
  { lesson: 15, section: 2, title: { en: 'Who Is Jesus?', nl: 'Wie is Jezus?', id: 'Siapakah Yesus?' } },
  { lesson: 16, section: 2, title: { en: 'What Did Jesus Do While on Earth?', nl: 'Wat deed Jezus toen hij op aarde was?', id: 'Apa Saja yang Yesus Lakukan Sewaktu Dia Berada di Bumi?' } },
  { lesson: 17, section: 2, title: { en: 'What Is Jesus Like?', nl: 'Wat voor iemand is Jezus?', id: 'Seperti Apakah Yesus Itu?' } },
  { lesson: 18, section: 2, title: { en: 'How to Identify Real Christians', nl: 'Waaraan zijn echte christenen te herkennen?', id: 'Cara Mengenali Orang Kristen Sejati' } },
  { lesson: 19, section: 2, title: { en: 'Are Jehovah\'s Witnesses Real Christians?', nl: 'Zijn Jehovah\'s Getuigen echte christenen?', id: 'Apakah Saksi-Saksi Yehuwa Itu Orang Kristen Sejati?' } },
  { lesson: 20, section: 2, title: { en: 'How the Congregation Is Organized', nl: 'Hoe de christelijke gemeente georganiseerd is', id: 'Bagaimana Sidang Kristen Diorganisasi?' } },
  { lesson: 21, section: 2, title: { en: 'How Is the Good News Being Preached?', nl: 'Hoe wordt het goede nieuws gepredikt?', id: 'Siapa yang Sekarang Memberitakan Kabar Baik?' } },
  { lesson: 22, section: 2, title: { en: 'How Can You Share the Good News?', nl: 'Hoe kun jij het goede nieuws met anderen delen?', id: 'Bagaimana Anda Bisa Ikut Memberitakan Kabar Baik?' } },
  { lesson: 23, section: 2, title: { en: 'Baptism—A Worthwhile Goal!', nl: 'De doop: Een mooi doel!', id: 'Baptisan—Langkah Menuju Masa Depan yang Cerah' } },
  { lesson: 24, section: 2, title: { en: 'What Is the Truth About Angels?', nl: 'Wat is de waarheid over engelen?', id: 'Apa yang Alkitab Ajarkan tentang Para Malaikat?' } },
  { lesson: 25, section: 2, title: { en: 'What Is God\'s Purpose for Us?', nl: 'Wat is Gods doel met de mens?', id: 'Kehidupan Seperti Apa yang Allah Inginkan bagi Kita?' } },
  { lesson: 26, section: 2, title: { en: 'Why Do Evil and Suffering Exist?', nl: 'Waarom is er zo veel slechtheid en ellende?', id: 'Mengapa Ada Banyak Hal Buruk dan Penderitaan?' } },
  { lesson: 27, section: 2, title: { en: 'How Can Jesus\' Death Save Us?', nl: 'Hoe kan Jezus\' dood ons redden?', id: 'Mengapa Kematian Yesus Bisa Menyelamatkan Kita?' } },
  { lesson: 28, section: 2, title: { en: 'Show Appreciation for What Jehovah and Jesus Did for You', nl: 'Toon waardering voor wat Jehovah en Jezus voor je hebben gedaan', id: 'Tunjukkan Rasa Syukur atas Apa yang Yehuwa dan Yesus Lakukan bagi Anda' } },
  { lesson: 29, section: 2, title: { en: 'What Happens When We Die?', nl: 'Wat gebeurt er bij de dood?', id: 'Seperti Apa Keadaan Orang Mati?' } },
  { lesson: 30, section: 2, title: { en: 'Your Loved Ones Can Live Again!', nl: 'Gestorven dierbaren zullen weer leven!', id: 'Orang-Orang yang Anda Sayangi Bisa Hidup Lagi!' } },
  { lesson: 31, section: 2, title: { en: 'What Is God\'s Kingdom?', nl: 'Wat is Gods Koninkrijk?', id: 'Apa Kerajaan Allah Itu?' } },
  { lesson: 32, section: 2, title: { en: 'God\'s Kingdom Now Rules!', nl: 'Gods Koninkrijk regeert nu!', id: 'Kerajaan Allah Sekarang Telah Memerintah!' } },
  { lesson: 33, section: 2, title: { en: 'What the Kingdom Will Accomplish', nl: 'Wat Gods Koninkrijk zal doen', id: 'Apa Saja yang Akan Dilakukan Kerajaan Allah?' } },
  { lesson: 34, section: 3, title: { en: 'How Can We Show Our Love for Jehovah?', nl: 'Hoe kun je laten zien dat je van Jehovah houdt?', id: 'Bagaimana Kita Bisa Menunjukkan Bahwa Kita Mengasihi Yehuwa?' } },
  { lesson: 35, section: 3, title: { en: 'How to Make Good Decisions', nl: 'Hoe je goede beslissingen neemt', id: 'Cara Membuat Keputusan yang Baik' } },
  { lesson: 36, section: 3, title: { en: 'Be Honest in All Things', nl: 'Wees altijd eerlijk', id: 'Jujurlah dalam Segala Hal' } },
  { lesson: 37, section: 3, title: { en: 'What the Bible Says About Work and Money', nl: 'Wat de Bijbel zegt over werk en geld', id: 'Pandangan Alkitab tentang Pekerjaan dan Uang' } },
  { lesson: 38, section: 3, title: { en: 'Appreciate the Gift of Life', nl: 'Wees dankbaar voor het leven dat God heeft gegeven', id: 'Hargailah Karunia Kehidupan' } },
  { lesson: 39, section: 3, title: { en: 'God\'s View of Blood', nl: 'Gods kijk op bloed', id: 'Pandangan Allah tentang Darah' } },
  { lesson: 40, section: 3, title: { en: 'How Can We Be Clean in God\'s Eyes?', nl: 'Hoe kun je rein zijn in Gods ogen?', id: 'Bagaimana Kita Bisa Bersih di Mata Allah?' } },
  { lesson: 41, section: 3, title: { en: 'What Does the Bible Say About Sex?', nl: 'Wat zegt de Bijbel over seks?', id: 'Apa yang Alkitab Katakan tentang Seks?' } },
  { lesson: 42, section: 3, title: { en: 'What Does the Bible Say About Singleness and Marriage?', nl: 'Wat zegt de Bijbel over wel of niet trouwen?', id: 'Apa Pandangan Alkitab tentang Kelajangan dan Perkawinan?' } },
  { lesson: 43, section: 3, title: { en: 'How Should Christians View Alcohol?', nl: 'Wat is volgens de Bijbel de juiste kijk op alcohol?', id: 'Apa Pandangan Alkitab tentang Alkohol?' } },
  { lesson: 44, section: 3, title: { en: 'Do All Celebrations Please God?', nl: 'Hebben alle feestdagen Gods goedkeuring?', id: 'Apakah Semua Perayaan Menyenangkan Allah?' } },
  { lesson: 45, section: 3, title: { en: 'What It Means to Be Neutral', nl: 'Wat het betekent om neutraal te zijn', id: 'Apa Artinya Tetap Netral?' } },
  { lesson: 46, section: 3, title: { en: 'Why Make a Dedication and Get Baptized?', nl: 'Waarom zou je je aan God opdragen en je laten dopen?', id: 'Mengapa Anda Perlu Membaktikan Diri dan Dibaptis?' } },
  { lesson: 47, section: 3, title: { en: 'Are You Ready to Get Baptized?', nl: 'Ben je klaar om gedoopt te worden?', id: 'Apakah Anda Siap untuk Dibaptis?' } },
  { lesson: 48, section: 4, title: { en: 'Choose Your Friends Wisely', nl: 'Kies goede vrienden', id: 'Pilihlah Teman Bergaul dengan Bijak' } },
  { lesson: 49, section: 4, title: { en: 'How Can Your Family Be Happy?—Part 1', nl: 'Hoe kun je als gezin gelukkig zijn?—Deel 1', id: 'Bagaimana Keluarga Anda Bisa Bahagia?—Bagian 1' } },
  { lesson: 50, section: 4, title: { en: 'How Can Your Family Be Happy?—Part 2', nl: 'Hoe kun je als gezin gelukkig zijn?—Deel 2', id: 'Bagaimana Keluarga Anda Bisa Bahagia?—Bagian 2' } },
  { lesson: 51, section: 4, title: { en: 'How Can You Please Jehovah With Your Speech?', nl: 'Hoe maak je Jehovah blij met wat je zegt?', id: 'Bagaimana Kata-Kata Anda Bisa Menyenangkan Yehuwa?' } },
  { lesson: 52, section: 4, title: { en: 'Why Our Clothing and Appearance Matter', nl: 'Waarom zijn je kleding en uiterlijk belangrijk?', id: 'Mengapa Kita Perlu Memperhatikan Pakaian dan Penampilan Kita?' } },
  { lesson: 53, section: 4, title: { en: 'Choose Entertainment That Pleases Jehovah', nl: 'Kies entertainment dat aanvaardbaar is voor Jehovah', id: 'Pilihlah Hiburan yang Menyenangkan Yehuwa' } },
  { lesson: 54, section: 4, title: { en: 'The Role of “the Faithful and Discreet Slave”', nl: 'De rol van ‘de getrouwe en beleidvolle slaaf’', id: 'Peranan ”Budak yang Setia dan Bijaksana”' } },
  { lesson: 55, section: 4, title: { en: 'Support Your Local Congregation', nl: 'Ondersteun de plaatselijke gemeente', id: 'Dukunglah Sidang Anda' } },
  { lesson: 56, section: 4, title: { en: 'Maintain Unity in the Congregation', nl: 'Draag bij aan de eenheid in de gemeente', id: 'Jagalah Persatuan di Dalam Sidang' } },
  { lesson: 57, section: 4, title: { en: 'What if You Commit a Serious Sin?', nl: 'Wat als je een ernstige zonde begaat?', id: 'Bagaimana Kalau Anda Melakukan Dosa Serius?' } },
  { lesson: 58, section: 4, title: { en: 'Remain Loyal to Jehovah', nl: 'Blijf trouw aan Jehovah', id: 'Tetaplah Setia kepada Yehuwa' } },
  { lesson: 59, section: 4, title: { en: 'You Can Endure Persecution', nl: 'Je kunt volharden ondanks vervolging', id: 'Anda Bisa Tetap Bertekun Meskipun Dianiaya' } },
  { lesson: 60, section: 4, title: { en: 'Continue Making Progress', nl: 'Blijf werken aan je band met Jehovah', id: 'Teruslah Perkuat Persahabatan Anda dengan Yehuwa' } },
];

export function lffLessonTitle(lesson: number, language: AppLanguage): string {
  return LFF_LESSONS.find((l) => l.lesson === lesson)?.title[language] ?? '';
}

export type StudyItemKind = 'lesson' | 'review';

/**
 * A single trackable checklist row: either a numbered lesson, or the review
 * that closes out its section. `id` is what gets stored in
 * `Contact.studyProgress`.
 */
export interface StudyItem {
  id: string;
  kind: StudyItemKind;
  section: number;
  /** Only set for kind 'lesson'. */
  lesson?: number;
}

/** Ordered lesson-then-review items for the given publication code. Empty for unknown/unset codes. */
export function studyItemsForPublication(code: string): StudyItem[] {
  if (code !== 'lff') return [];
  const items: StudyItem[] = [];
  for (let section = 1; section <= LFF_SECTION_COUNT; section += 1) {
    const [start, end] = LFF_SECTION_RANGES[section];
    for (let lesson = start; lesson <= end; lesson += 1) {
      items.push({ id: `lesson-${lesson}`, kind: 'lesson', section, lesson });
    }
    items.push({ id: `review-${section}`, kind: 'review', section });
  }
  return items;
}

export interface StudyProgressSummary {
  totalItems: number;
  completedItems: number;
  /** 0-100, rounded. */
  percent: number;
  totalLessons: number;
  /** The next lesson number to study — capped at `totalLessons` once every lesson is done. */
  currentLessonNumber: number;
  /** Section the current lesson belongs to. */
  currentSection: number;
  /** id of the first incomplete item (lesson or review), or null once everything is checked off. */
  nextItemId: string | null;
}

export function studyProgressSummary(items: StudyItem[], completed: string[]): StudyProgressSummary {
  const completedSet = new Set(completed);
  const lessons = items.filter((i): i is StudyItem & { lesson: number } => i.kind === 'lesson');
  const totalItems = items.length;
  const completedItems = items.filter((i) => completedSet.has(i.id)).length;
  const completedLessons = lessons.filter((i) => completedSet.has(i.id)).length;
  const totalLessons = lessons.length;
  const currentLessonNumber = Math.min(completedLessons + 1, totalLessons);
  const currentLesson = lessons.find((i) => i.lesson === currentLessonNumber);
  const nextItem = items.find((i) => !completedSet.has(i.id));
  return {
    totalItems,
    completedItems,
    percent: totalItems ? Math.round((completedItems / totalItems) * 100) : 0,
    totalLessons,
    currentLessonNumber,
    currentSection: currentLesson?.section ?? lessons[lessons.length - 1]?.section ?? 1,
    nextItemId: nextItem?.id ?? null,
  };
}

export function sectionProgress(items: StudyItem[], completed: string[], section: number): { done: number; total: number } {
  const completedSet = new Set(completed);
  const sectionItems = items.filter((i) => i.section === section);
  return { done: sectionItems.filter((i) => completedSet.has(i.id)).length, total: sectionItems.length };
}
