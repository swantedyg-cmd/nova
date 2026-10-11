export type Collection = 'Nouvelle Collection'

export interface Piece {
  id: string
  collection: Collection
  theme: string
  philosophy: { fr: string; en: string; ar: string } // a short line of meaning unique to this piece, per site language — shown alongside the theme
  keywords: { fr: string[]; en: string[]; ar: string[] } // 5 evocative tags per language, from the official Nova catalog
  width: number   // cm
  height: number  // cm
  price: number   // DH — official prices from the NOVA catalogue price list (2026-10-11)
  quantity: number // pieces remaining in this run — estimated within the historical range for its tier
  // Aspect ratio helpers
  aspect: number  // width/height, measured from the actual photographed crop
  image?: string  // filename in /public/images, falls back to gradient placeholder if absent
}

// "New Collection 2026-2027" — 12 pieces, sourced from the official NOVA
// catalog (NOVA_catalog.pdf). No supplier price/size sheet exists yet for
// this run, so width/height/price/quantity are mapped from this same
// catalogue's own previously-established tiers (closest photographed aspect
// ratio → nearest standard canvas size → a real price already used at that
// size). Update with real supplier figures as soon as they're available.
export const PIECES: Piece[] = [
  {
    id: 'eclat-floral', collection: 'Nouvelle Collection',
    theme: 'Éclat Floral',
    philosophy: {
      fr: "Une couronne de roses sur fond sombre, portée avec une élégance traditionnelle. Une toile florale vibrante et féminine qui éclaire le mur.",
      en: "A crown of roses against a dark ground, worn with traditional elegance. A vibrant, feminine floral canvas that lights up the wall.",
      ar: "تاج من الورود على خلفية داكنة، بأناقة تقليدية. لوحة زهرية نابضة بالحياة وأنثوية تضيء الجدار.",
    },
    keywords: {
      fr: ['Floral', 'Élégant', 'Vibrant', 'Féminin', 'Traditionnel'],
      en: ['Floral', 'Elegant', 'Vibrant', 'Feminine', 'Traditional'],
      ar: ['زهري', 'أنيق', 'نابض بالحياة', 'أنثوي', 'تقليدي'],
    },
    width: 80, height: 120, price: 2000, quantity: 80, aspect: 1007 / 1600, image: 'eclat-floral.jpg',
  },
  {
    id: 'rosee', collection: 'Nouvelle Collection',
    theme: 'Rosée',
    philosophy: {
      fr: "Un portrait majestueux couronné de fleurs et de perles colorées. Romantique et raffiné, d'un luxe tout en couleur.",
      en: "A majestic portrait crowned with flowers and colorful beads. Romantic and refined, with a luxury full of color.",
      ar: "بورتريه مهيب متوّج بالأزهار والخرز الملوّن. رومانسي وراقٍ، بفخامة مليئة بالألوان.",
    },
    keywords: {
      fr: ['Majestueux', 'Romantique', 'Luxueux', 'Coloré', 'Raffiné'],
      en: ['Majestic', 'Romantic', 'Luxurious', 'Colorful', 'Refined'],
      ar: ['مهيب', 'رومانسي', 'فاخر', 'ملوّن', 'راقٍ'],
    },
    width: 80, height: 120, price: 2000, quantity: 60, aspect: 1022 / 1600, image: 'rosee.jpg',
  },
  {
    id: 'ame-nomade', collection: 'Nouvelle Collection',
    theme: 'Âme Nomade',
    philosophy: {
      fr: "Une chevelure de fleurs éclatantes et des pampilles de couleur. Libre, expressive et profondément culturelle, une œuvre pour les âmes voyageuses.",
      en: "A headdress of bright blooms and colorful tassels. Free, expressive and deeply cultural, a piece for wandering souls.",
      ar: "تاج من الأزهار الزاهية وشرّابات ملوّنة. حرة ومعبّرة وعميقة الثقافة، عمل للأرواح الجوّالة.",
    },
    keywords: {
      fr: ['Libre', 'Expressif', 'Coloré', 'Culturel', 'Artistique'],
      en: ['Free', 'Expressive', 'Colorful', 'Cultural', 'Artistic'],
      ar: ['حر', 'معبّر', 'ملوّن', 'ثقافي', 'فني'],
    },
    width: 90, height: 120, price: 1200, quantity: 80, aspect: 1178 / 1600, image: 'ame-nomade.jpg',
  },
  {
    id: 'serenite-doree', collection: 'Nouvelle Collection',
    theme: 'Sérénité Dorée',
    philosophy: {
      fr: "Mains jointes, yeux fermés, un turban voilé d'or. Une présence spirituelle, gracieuse et puissante qui apaise toute la pièce.",
      en: "Hands joined, eyes closed, a turban brushed with gold. A spiritual, graceful and powerful presence that calms the whole room.",
      ar: "يدان مضمومتان وعينان مغمضتان وعمامة مطلية بالذهب. حضور روحاني ورشيق وقوي يبعث الهدوء في الغرفة.",
    },
    keywords: {
      fr: ['Spirituel', 'Gracieux', 'Puissant', 'Luxueux', 'Apaisant'],
      en: ['Spiritual', 'Graceful', 'Powerful', 'Luxurious', 'Soothing'],
      ar: ['روحاني', 'رشيق', 'قوي', 'فاخر', 'مهدّئ'],
    },
    width: 80, height: 120, price: 1700, quantity: 60, aspect: 1044 / 1600, image: 'serenite-doree.jpg',
  },
  {
    id: 'reine-dor', collection: 'Nouvelle Collection',
    theme: "Reine d'Or",
    philosophy: {
      fr: "Un regard royal, des colliers d'or et un turban rayé sur fond noir. Puissante et luxueuse, une reine qui s'impose au mur.",
      en: "A royal gaze, golden necklaces and a striped turban on black. Powerful and luxurious, a queen who commands the wall.",
      ar: "نظرة ملكية وقلائد ذهبية وعمامة مخططة على خلفية سوداء. قوية وفاخرة، ملكة تفرض حضورها على الجدار.",
    },
    keywords: {
      fr: ['Royal', 'Puissant', 'Doré', 'Luxueux', 'Intense'],
      en: ['Royal', 'Powerful', 'Golden', 'Luxurious', 'Intense'],
      ar: ['ملكي', 'قوي', 'ذهبي', 'فاخر', 'مؤثر'],
    },
    width: 80, height: 120, price: 1400, quantity: 80, aspect: 1060 / 1600, image: 'reine-dor.jpg',
  },
  {
    id: 'grace-doree', collection: 'Nouvelle Collection',
    theme: 'Grâce Dorée',
    philosophy: {
      fr: "Un profil recueilli, des touches d'or au turban et sur les épaules. Une toile lumineuse et délicate, d'une élégance précieuse.",
      en: "A contemplative profile with touches of gold on the turban and shoulders. A radiant, delicate canvas of precious elegance.",
      ar: "وجه جانبي متأمل ولمسات ذهبية على العمامة والكتفين. لوحة مشرقة ورقيقة بأناقة ثمينة.",
    },
    keywords: {
      fr: ['Recueilli', 'Lumineux', 'Délicat', 'Élégant', 'Précieux'],
      en: ['Contemplative', 'Radiant', 'Delicate', 'Elegant', 'Precious'],
      ar: ['متأمل', 'مشرق', 'رقيق', 'أنيق', 'ثمين'],
    },
    width: 80, height: 120, price: 1700, quantity: 80, aspect: 994 / 1600, image: 'grace-doree.jpg',
  },
  {
    id: 'blooming-muse', collection: 'Nouvelle Collection',
    theme: 'Blooming Muse',
    philosophy: {
      fr: "Un profil serein sous une profusion de pivoines et de fleurs. Artistique, raffinée et opulente, une muse en pleine floraison.",
      en: "A serene profile beneath a profusion of peonies and blooms. Artistic, refined and opulent, a muse in full bloom.",
      ar: "وجه جانبي هادئ تحت وفرة من الفاوانيا والأزهار. فنية وراقية وباذخة، ملهمة في أوج تفتّحها.",
    },
    keywords: {
      fr: ['Artistique', 'Floral', 'Raffiné', 'Serein', 'Opulent'],
      en: ['Artistic', 'Floral', 'Refined', 'Serene', 'Opulent'],
      ar: ['فني', 'زهري', 'راقٍ', 'هادئ', 'باذخ'],
    },
    width: 80, height: 120, price: 1300, quantity: 60, aspect: 1086 / 1600, image: 'blooming-muse.jpg',
  },
  {
    id: 'flower-crown', collection: 'Nouvelle Collection',
    theme: 'Flower Crown',
    philosophy: {
      fr: "Une couronne de fleurs pastel sur des tons gris doux. Rêveuse, éthérée et sophistiquée, d'une féminité tout en douceur.",
      en: "A crown of pastel flowers over soft grey tones. Dreamy, ethereal and sophisticated, with a gentle femininity.",
      ar: "تاج من الأزهار الباستيل على درجات رمادية ناعمة. حالمة وأثيرية وأنيقة، بأنوثة هادئة.",
    },
    keywords: {
      fr: ['Rêveur', 'Féminin', 'Éthéré', 'Doux', 'Sophistiqué'],
      en: ['Dreamy', 'Feminine', 'Ethereal', 'Soft', 'Sophisticated'],
      ar: ['حالم', 'أنثوي', 'أثيري', 'ناعم', 'أنيق'],
    },
    width: 80, height: 120, price: 1300, quantity: 70, aspect: 1086 / 1600, image: 'flower-crown.jpg',
  },
  {
    id: 'wings-of-colors', collection: 'Nouvelle Collection',
    theme: 'Wings of Colors',
    philosophy: {
      fr: "Un envol de papillons autour d'un visage. Vibrante, expressive et libre, une toile pleine de mouvement et de couleur.",
      en: "A flutter of butterflies around a face. Vibrant, expressive and free, a canvas full of movement and color.",
      ar: "سرب من الفراشات حول وجه. نابضة ومعبّرة وحرة، لوحة مليئة بالحركة والألوان.",
    },
    keywords: {
      fr: ['Vibrant', 'Expressif', 'Coloré', 'Libre', 'Dynamique'],
      en: ['Vibrant', 'Expressive', 'Colorful', 'Free', 'Dynamic'],
      ar: ['نابض', 'معبّر', 'ملوّن', 'حر', 'ديناميكي'],
    },
    width: 60, height: 90, price: 1500, quantity: 60, aspect: 1024 / 1600, image: 'wings-of-colors.jpg',
  },
  {
    id: 'ivory-blossom', collection: 'Nouvelle Collection',
    theme: 'Ivory Blossom',
    philosophy: {
      fr: "Des pivoines ivoire aux nuances poudrées. Élégante, délicate et romantique, une toile florale intemporelle.",
      en: "Ivory peonies in powdery shades. Elegant, delicate and romantic, a timeless floral canvas.",
      ar: "فاوانيا عاجية بدرجات مخملية. أنيقة ورقيقة ورومانسية، لوحة زهرية خالدة.",
    },
    keywords: {
      fr: ['Élégant', 'Floral', 'Délicat', 'Romantique', 'Intemporel'],
      en: ['Elegant', 'Floral', 'Delicate', 'Romantic', 'Timeless'],
      ar: ['أنيق', 'زهري', 'رقيق', 'رومانسي', 'خالد'],
    },
    width: 90, height: 120, price: 1600, quantity: 60, aspect: 1187 / 1600, image: 'ivory-blossom.jpg',
  },
  {
    id: 'summer-in-style', collection: 'Nouvelle Collection',
    theme: 'Summer in Style',
    philosophy: {
      fr: "Chapeau de paille, robe de dentelle blanche et palmes dorées. Élégante, moderne et aérienne, l'été tout en sophistication.",
      en: "Straw hat, white lace dress and golden palms. Elegant, modern and airy, summer with effortless sophistication.",
      ar: "قبعة من القش وفستان دانتيل أبيض وسعف نخيل ذهبي. أنيقة وعصرية وخفيفة، صيف بلمسة راقية.",
    },
    keywords: {
      fr: ['Élégant', 'Moderne', 'Aérien', 'Naturel', 'Sophistiqué'],
      en: ['Elegant', 'Modern', 'Airy', 'Natural', 'Sophisticated'],
      ar: ['أنيق', 'عصري', 'خفيف', 'طبيعي', 'راقٍ'],
    },
    width: 70, height: 100, price: 1800, quantity: 60, aspect: 1130 / 1600, image: 'summer-in-style.jpg',
  },
  {
    id: 'riviera-muse', collection: 'Nouvelle Collection',
    theme: 'Riviera Muse',
    philosophy: {
      fr: "Lunettes de soleil, chapeau de paille et crochet blanc sur un fauteuil en rotin. Chic, bohème et ensoleillée, un luxe décontracté.",
      en: "Sunglasses, straw hat and white crochet on a rattan chair. Chic, boho and sunlit, a relaxed luxury.",
      ar: "نظارات شمسية وقبعة قش وكروشيه أبيض على كرسي من الروطان. شيك وبوهيمية ومشمسة، فخامة مريحة.",
    },
    keywords: {
      fr: ['Chic', 'Bohème', 'Décontracté', 'Ensoleillé', 'Luxueux'],
      en: ['Chic', 'Boho', 'Relaxed', 'Sunlit', 'Luxurious'],
      ar: ['شيك', 'بوهيمي', 'مريح', 'مشمس', 'فاخر'],
    },
    width: 70, height: 100, price: 1800, quantity: 70, aspect: 1146 / 1600, image: 'riviera-muse.jpg',
  },
]

export const COLLECTIONS: Collection[] = [
  'Nouvelle Collection',
]

// Color palette per collection — used for placeholder canvases & UI accents
export const COLLECTION_COLORS: Record<Collection, { from: string; to: string; accent: string }> = {
  'Nouvelle Collection': { from: '#E8D4B4', to: '#C99860', accent: '#A87838' },
}
