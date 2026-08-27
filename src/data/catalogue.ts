export type Collection = 'Portraits Fleuris' | 'Bouquets' | 'Papillons' | 'Reines d\'Or' | 'Éclat Floral' | 'Âme Nomade'

export interface Piece {
  id: string
  collection: Collection
  theme: string
  philosophy: { fr: string; en: string; ar: string } // a short line of meaning unique to this piece, per site language — shown alongside the theme
  width: number   // cm — some entries ESTIMATED, see per-run notes below
  height: number  // cm — some entries ESTIMATED, see per-run notes below
  price: number   // DH — some entries ESTIMATED, see per-run notes below
  quantity: number // pieces remaining in this run — some entries ESTIMATED
  // Aspect ratio helpers
  aspect: number  // width/height, measured from the actual photographed crop
  image?: string  // filename in /public/images, falls back to gradient placeholder if absent
}

// Combined catalogue — two runs merged:
//
// 1) "JYO" run (24 pieces, atelier availability sheet, August 2026).
//    Real width/height/price/quantity from the supplier sheet.
//
// 2) "PW" run (19 pieces, first-party product photography, "Patchwork M",
//    August 2026). Width/height/price/quantity are ESTIMATED from existing
//    collection price tiers and measured photo aspect ratios — no supplier
//    sheet for this run yet. Placeholders, pending real atelier figures.
export const PIECES: Piece[] = [
  // ─── Portraits Fleuris — floral portraiture, soft and photographic ───
  {
    id: 'JYO37608-NF', collection: 'Portraits Fleuris',
    theme: 'Veiled in Peonies',
    philosophy: {
      fr: "Elle laisse d'abord parler les fleurs — un rappel que la présence la plus puissante est celle qui n'a pas besoin d'être entièrement dévoilée.",
      en: "She lets the flowers speak first — a reminder that the most powerful presence is the one that doesn't need to be fully seen.",
      ar: "تدع الزهور تتكلم أولاً — تذكير بأن أقوى حضور هو الذي لا يحتاج أن يُرى بالكامل.",
    },
    width: 70, height: 100, price: 1399, quantity: 60, aspect: 567/630, image: 'JYO37608-NF.jpg',
  },
  {
    id: 'JYO37609-NF', collection: 'Portraits Fleuris',
    theme: 'Crowned in Silence',
    philosophy: {
      fr: "Certaines couronnes s'héritent. La sienne a été rassemblée pétale par pétale — une souveraineté discrète, portée sans demander la permission.",
      en: 'Some crowns are inherited. Hers was gathered petal by petal — a quiet sovereignty worn without asking permission.',
      ar: "بعض التيجان تُورَث. أما تاجها فجُمع بتلة تلو الأخرى — سيادة هادئة تُرتدى من دون استئذان.",
    },
    width: 70, height: 100, price: 1399, quantity: 60, aspect: 567/630, image: 'JYO37609-NF.jpg',
  },
  {
    id: 'JYO37610-NF', collection: 'Portraits Fleuris',
    theme: 'Profile in Bloom',
    philosophy: {
      fr: "Détournée, elle devient plus elle-même — la preuve que la grâce préfère souvent la compagnie de son propre reflet.",
      en: 'Turned away, she becomes more herself — proof that grace often prefers the company of its own reflection.',
      ar: "بانحرافها عن الأنظار، تصبح أقرب إلى ذاتها — دليل على أن الرشاقة كثيراً ما تفضّل صحبة انعكاسها.",
    },
    width: 70, height: 100, price: 1399, quantity: 80, aspect: 567/630, image: 'JYO37610-NF.jpg',
  },
  {
    id: 'JYO37611-NF', collection: 'Portraits Fleuris',
    theme: 'Petals at Dawn',
    philosophy: {
      fr: "Pas encore pleinement éclose, pas encore pleinement vue — un portrait du devenir, peint à l'heure qui précède la certitude.",
      en: 'Not yet fully open, not yet fully seen — a portrait of becoming, painted in the hour just before certainty.',
      ar: "لم تتفتح بعد كلياً، ولم تُرَ بعد كلياً — بورتريه للصيرورة، رُسم في الساعة التي تسبق اليقين.",
    },
    width: 70, height: 100, price: 1399, quantity: 80, aspect: 567/630, image: 'JYO37611-NF.jpg',
  },
  {
    id: 'JYO37319-NF', collection: 'Portraits Fleuris',
    theme: 'The Garland Keeper',
    philosophy: {
      fr: "De l'or à la gorge, des fleurs sauvages au front — elle porte tout un jardin comme s'il lui avait toujours appartenu.",
      en: 'Gold at her throat, wildflowers at her brow — she carries an entire garden as though it always belonged to her.',
      ar: "ذهب عند العنق، وزهور برية عند الجبين — تحمل حديقة بأكملها وكأنها كانت لها دوماً.",
    },
    width: 80, height: 120, price: 1899, quantity: 80, aspect: 455/546, image: 'JYO37319-NF.jpg',
  },
  {
    id: 'PW-000', collection: 'Portraits Fleuris',
    theme: 'A Garden All Her Own',
    philosophy: {
      fr: "Elle porte un jardin entier comme s'il lui avait toujours appartenu — audacieux, sans excuse, rassemblé pétale par pétale en quelque chose qu'aucun mur ne peut ignorer.",
      en: 'She wears an entire garden like it always belonged to her — bold, unapologetic, gathered petal by petal into something no wall can ignore.',
      ar: 'ترتدي حديقة بأكملها وكأنها كانت لها دوماً — جريئة، بلا اعتذار، جُمعت بتلة تلو الأخرى في شيء لا يستطيع أي جدار تجاهله.',
    },
    width: 90, height: 120, price: 1999, quantity: 60, aspect: 809/1092, image: 'PW-000.jpg',
  },
  {
    id: 'PW-006', collection: 'Portraits Fleuris',
    theme: 'Crowned in Wildflowers',
    philosophy: {
      fr: "Une couronne trop pleine pour rester discrète, sur un visage trop posé pour s'en apercevoir — le contraste est tout le propos.",
      en: 'A crown too full to be quiet, on a face too composed to notice — the contrast is the whole point.',
      ar: 'تاج غني جداً ليبقى هادئاً، على وجه هادئ جداً ليلاحظ ذلك — والتباين هو بيت القصيد.',
    },
    width: 60, height: 120, price: 1899, quantity: 60, aspect: 467/1259, image: 'PW-006.jpg',
  },
  {
    id: 'PW-009', collection: 'Portraits Fleuris',
    theme: 'Coral and Gold',
    philosophy: {
      fr: "Le corail et l'or ne rivalisent pas ici, ils collaborent — la preuve que l'abondance, arrangée avec soin, se lit comme élégance, non comme excès.",
      en: "Coral and gold don't compete here, they collaborate — proof that abundance, arranged with care, reads as elegance, not excess.",
      ar: 'المرجاني والذهبي هنا لا يتنافسان، بل يتعاونان — دليل على أن الوفرة، حين تُرتَّب بعناية، تُقرأ أناقة لا إفراطاً.',
    },
    width: 60, height: 120, price: 1899, quantity: 60, aspect: 411/1167, image: 'PW-009.jpg',
  },
  {
    id: 'PW-073', collection: 'Portraits Fleuris',
    theme: 'The Beaded Garden',
    philosophy: {
      fr: "Perles et fleurs partagent la même couronne ici, et aucune ne cherche à voler la vedette — ensemble, elles existent, tout simplement.",
      en: 'Beadwork and blossoms share the same crown here, and neither asks to be the main event — together, they simply are.',
      ar: 'الخرز والزهور يتشاركان التاج هنا، ولا يسعى أي منهما لسرقة الأضواء — معاً، هما ببساطة موجودان.',
    },
    width: 70, height: 120, price: 2199, quantity: 60, aspect: 972/1624, image: 'PW-073.jpg',
  },
  {
    id: 'PW-019', collection: 'Portraits Fleuris',
    theme: 'Roses at Dusk',
    philosophy: {
      fr: "Des roses aussi denses devraient submerger. Sur elle, elles semblent inévitables — comme si les fleurs y avaient poussé exprès.",
      en: 'Roses this dense should overwhelm. On her, they read as inevitable — as if the flowers grew there on purpose.',
      ar: 'وردٌ بهذا الكثافة كان يجب أن يطغى. عليها، يبدو حتمياً — وكأن الزهور نبتت هناك عن قصد.',
    },
    width: 70, height: 100, price: 1799, quantity: 60, aspect: 1024/1536, image: 'PW-019.jpg',
  },
  {
    id: 'PW-038', collection: 'Portraits Fleuris',
    theme: 'Petals in Profile',
    philosophy: {
      fr: "Détournée, elle laisse les pivoines parler — un profil qui fait davantage confiance au silence qu'à un regard frontal.",
      en: 'Turned away, she lets the peonies do the talking — a profile that trusts silence more than a straight-on gaze ever could.',
      ar: 'بانحرافها، تدع الفاوانيا تتحدث — ملمح يثق بالصمت أكثر من أي نظرة مباشرة.',
    },
    width: 60, height: 120, price: 1999, quantity: 60, aspect: 644/1528, image: 'PW-038.jpg',
  },
  {
    id: 'PW-040', collection: 'Portraits Fleuris',
    theme: 'Bloom in Blue',
    philosophy: {
      fr: "Le bleu s'est invité dans un bouquet qui ne le demandait pas — et la couronne entière en est plus belle, plus étrange.",
      en: "Blue found its way into a bouquet that didn't ask for it — and the whole crown is better, stranger, for it.",
      ar: 'الأزرق وجد طريقه إلى باقة لم تطلبه — والتاج كله أجمل وأغرب بسببه.',
    },
    width: 55, height: 120, price: 1699, quantity: 70, aspect: 362/1224, image: 'PW-040.jpg',
  },
  {
    id: 'PW-041', collection: 'Portraits Fleuris',
    theme: 'Softly, She Blooms',
    philosophy: {
      fr: "Rien dans cette couronne ne force le trait. Elle s'est simplement posée là, comme le fait la vraie beauté.",
      en: 'Nothing about this crown is trying hard. It simply settled into place, the way real beauty tends to.',
      ar: 'لا شيء في هذا التاج يحاول جاهداً. استقر ببساطة في مكانه، كما يفعل الجمال الحقيقي دوماً.',
    },
    width: 55, height: 120, price: 1699, quantity: 70, aspect: 344/1140, image: 'PW-041.jpg',
  },
  {
    id: 'PW-058', collection: 'Portraits Fleuris',
    theme: 'A Quiet Bloom',
    philosophy: {
      fr: "Ici, les pétales remplacent le tissu — un foulard entièrement composé de fleurs, porté aussi naturellement que la soie.",
      en: 'Petals stand in for fabric here — a headwrap built entirely from flowers, worn as naturally as silk.',
      ar: 'البتلات هنا تحل محل القماش — غطاء رأس مصنوع بالكامل من الزهور، يُرتدى بطبيعية الحرير.',
    },
    width: 70, height: 100, price: 1799, quantity: 60, aspect: 1024/1536, image: 'PW-058.jpg',
  },
  {
    id: 'PW-075', collection: 'Portraits Fleuris',
    theme: 'Lavender Hour',
    philosophy: {
      fr: "La lavande ne demande pas qu'on la remarque, et elle non plus — c'est précisément pour cela qu'on ne peut détacher son regard ni de l'une ni de l'autre.",
      en: "Lavender doesn't ask to be noticed, and neither does she — which is exactly why both are impossible to look away from.",
      ar: 'الخزامى لا تطلب أن يُلتفت إليها، وهي أيضاً لا تطلب ذلك — ولهذا بالضبط يستحيل على النظر أن يبتعد عن أي منهما.',
    },
    width: 45, height: 120, price: 1599, quantity: 70, aspect: 135/778, image: 'PW-075.jpg',
  },
  {
    id: 'PW-076', collection: 'Portraits Fleuris',
    theme: 'Blue Bloom',
    philosophy: {
      fr: "Des pétales bleus, un regard baissé — un portrait entièrement construit autour de l'idée de prendre son temps.",
      en: 'Blue petals, a lowered gaze — a portrait built entirely around the idea of taking your time.',
      ar: 'بتلات زرقاء، ونظرة خافضة — بورتريه بُني بالكامل حول فكرة أخذ الوقت الكافي.',
    },
    width: 40, height: 120, price: 1499, quantity: 70, aspect: 228/972, image: 'PW-076.jpg',
  },

  // ─── Bouquets — floral still life ───
  {
    id: 'JYO37590-N', collection: 'Bouquets',
    theme: 'Still Life, Held Breath',
    philosophy: {
      fr: "Un bouquet saisi dans son instant le plus généreux — pleine floraison, avant que le premier pétale ne songe à tomber.",
      en: 'A bouquet caught in its most generous moment — full bloom, before the first petal ever considers falling.',
      ar: "باقة أُمسكت في أسخى لحظاتها — تفتّح كامل، قبل أن تفكّر أولى البتلات في السقوط.",
    },
    width: 90, height: 120, price: 1499, quantity: 60, aspect: 471/625, image: 'JYO37590-N.jpg',
  },

  // ─── Papillons — butterfly-crowned pair ───
  {
    id: 'JYO37638-N', collection: 'Papillons',
    theme: 'Metamorphosis, Crowned',
    philosophy: {
      fr: "Cent petites métamorphoses posées sur un visage immobile — toute l'idée du changement, saisie en plein vol.",
      en: 'A hundred small transformations resting on one still face — the whole idea of change, caught mid-flight.',
      ar: "مئة تحوّل صغير مستقر على وجه ساكن — فكرة التغيير كلها، ملتقَطة في منتصف الطيران.",
    },
    width: 80, height: 120, price: 1499, quantity: 80, aspect: 451/559, image: 'JYO37638-N.jpg',
  },
  {
    id: 'JYO37639-N', collection: 'Papillons',
    theme: 'The Gathering Wings',
    philosophy: {
      fr: "Elles ne se sont pas posées sur elle par hasard — une beauté aussi silencieuse a le pouvoir d'apaiser le monde.",
      en: "They didn't land on her by accident — beauty this quiet has a way of asking the world to settle.",
      ar: "لم تحطّ عليها صدفة — لجمال بهذا الهدوء قدرة على دعوة العالم للسكينة.",
    },
    width: 80, height: 120, price: 1499, quantity: 80, aspect: 451/569, image: 'JYO37639-N.jpg',
  },
  {
    id: 'PW-010', collection: 'Papillons',
    theme: 'Where Butterflies Gather',
    philosophy: {
      fr: "Même les papillons semblent l'avoir choisie — se posant dans une couronne visiblement conçue pour accueillir de belles choses inquiètes.",
      en: "Even the butterflies seem to have chosen her — settling into a crown that was clearly built to hold beautiful, restless things.",
      ar: 'حتى الفراشات بدت وكأنها اختارتها — استقرت في تاج صُمم بوضوح ليحتضن أشياء جميلة لا تهدأ.',
    },
    width: 55, height: 120, price: 1599, quantity: 70, aspect: 567/1234, image: 'PW-010.jpg',
  },
  {
    id: 'PW-004', collection: 'Papillons',
    theme: 'A Flight of Wings',
    philosophy: {
      fr: "Cent ailes et un seul visage immobile — le point le plus calme d'une pièce pleine de mouvement.",
      en: 'A hundred wings and one still face — the quietest point in a room full of movement.',
      ar: 'مئة جناح ووجه ساكن واحد — أهدأ نقطة في غرفة مليئة بالحركة.',
    },
    width: 60, height: 120, price: 1599, quantity: 70, aspect: 439/1211, image: 'PW-004.jpg',
  },

  // ─── Reines d'Or — African portraiture in gold and shadow ───
  {
    id: 'JYO37313-NF', collection: 'Reines d\'Or',
    theme: 'Sovereign in Gold and Shadow',
    philosophy: {
      fr: "Peinte dans le contraste qu'elle est née pour porter — une obscurité qui ne l'assombrit jamais, un or qui n'a jamais besoin de crier.",
      en: 'Painted in the contrast she was born to hold — darkness that never dims her, gold that never needs to shout.',
      ar: "رُسمت في التباين الذي وُلدت لتحمله — عتمة لا تُخفت بريقها، وذهب لا يحتاج أبداً أن يعلو صوته.",
    },
    width: 70, height: 100, price: 1399, quantity: 60, aspect: 467/569, image: 'JYO37313-NF.jpg',
  },
  {
    id: 'JYO37314-NF', collection: 'Reines d\'Or',
    theme: 'The Unbowed Crown',
    philosophy: {
      fr: "Un foulard noué comme une décision, non une habitude — voilà à quoi ressemble vraiment l'autorité tranquille.",
      en: 'A headwrap tied like a decision, not a habit — this is what quiet authority actually looks like.',
      ar: "غطاء رأس معقود كقرار، لا كعادة — هذا ما تبدو عليه السلطة الهادئة حقاً.",
    },
    width: 70, height: 100, price: 1399, quantity: 60, aspect: 466/569, image: 'JYO37314-NF.jpg',
  },
  {
    id: 'JYO37268-NF', collection: 'Reines d\'Or',
    theme: 'Golden Hour, Golden Line',
    philosophy: {
      fr: "Chaque touche d'or ici a été méritée, non appliquée — un portrait qui traite l'éclat comme un fait, non comme un compliment.",
      en: 'Every gold stroke here was earned, not applied — a portrait that treats radiance as fact, not compliment.',
      ar: "كل لمسة ذهب هنا استُحقّت ولم تُضَف — بورتريه يعامل التألق كحقيقة، لا كمجاملة.",
    },
    width: 70, height: 100, price: 1399, quantity: 60, aspect: 567/529, image: 'JYO37268-NF.jpg',
  },
  {
    id: 'JYO37267-NF', collection: 'Reines d\'Or',
    theme: 'Downcast, Never Diminished',
    philosophy: {
      fr: "Ses yeux sont clos et la pièce lui appartient encore — la preuve que la présence n'a jamais dépendu du regard des autres.",
      en: 'Her eyes are closed and the room still belongs to her — proof that presence was never about being watched.',
      ar: "عيناها مغمضتان والمكان لا يزال لها — دليل على أن الحضور لم يكن يوماً رهين نظرة الآخرين.",
    },
    width: 70, height: 100, price: 1399, quantity: 60, aspect: 548/540, image: 'JYO37267-NF.jpg',
  },
  {
    id: 'JYO37347-NF', collection: 'Reines d\'Or',
    theme: 'The Prayer Before Gold',
    philosophy: {
      fr: "Mains jointes, tête inclinée — un instant d'immobilité si complet qu'il devient sa propre forme de splendeur.",
      en: "Hands folded, head bowed — a moment of stillness so complete it becomes its own kind of splendor.",
      ar: "يدان متشابكتان، رأس منحنٍ — لحظة سكون كاملة لدرجة أنها تصبح شكلاً خاصاً بها من البهاء.",
    },
    width: 80, height: 120, price: 1799, quantity: 60, aspect: 471/547, image: 'JYO37347-NF.jpg',
  },
  {
    id: 'JYO37348-NF', collection: 'Reines d\'Or',
    theme: 'Devotion, Gilded',
    philosophy: {
      fr: "Toutes les offrandes ne se disent pas. Certaines se portent simplement — en silence, avec patience, enveloppées d'or et de lumière dorée.",
      en: 'Not every offering is spoken. Some are simply held — quietly, patiently, wrapped in gold and yellow light.',
      ar: "ليست كل قربانة تُقال. بعضها يُحمل فقط — بصمت، بصبر، ملفوفاً بذهب وضوء أصفر.",
    },
    width: 80, height: 120, price: 1799, quantity: 60, aspect: 471/559, image: 'JYO37348-NF.jpg',
  },
  {
    id: 'JYO37343-NF', collection: 'Reines d\'Or',
    theme: 'The Long Line of Grace',
    philosophy: {
      fr: "Un seul profil, dessiné haut et sans hâte — une élégance qui n'a pas besoin de largeur pour s'affirmer.",
      en: "A single profile, drawn tall and unhurried — elegance that doesn't need width to make its point.",
      ar: "ملمح واحد، مرسوم شامخاً وبلا استعجال — أناقة لا تحتاج إلى اتساع لتثبت حضورها.",
    },
    width: 50, height: 100, price: 1399, quantity: 60, aspect: 378/569, image: 'JYO37343-NF.jpg',
  },
  {
    id: 'JYO37337-NF', collection: 'Reines d\'Or',
    theme: 'Colors She Was Given',
    philosophy: {
      fr: "Chaque teinte de son foulard raconte une histoire différente — ensemble, elles se lisent comme une famille qui n'a jamais cessé de chanter.",
      en: 'Every hue in her headwrap tells a different story — together, they read like a family that never stopped singing.',
      ar: "كل لون في غطاء رأسها يروي حكاية مختلفة — معاً، تُقرأ كعائلة لم تتوقف يوماً عن الغناء.",
    },
    width: 60, height: 90, price: 1499, quantity: 60, aspect: 446/569, image: 'JYO37337-NF.jpg',
  },
  {
    id: 'PW-003', collection: 'Reines d\'Or',
    theme: 'Prayer in Blue and Gold',
    philosophy: {
      fr: "Mains jointes, foulard qui capte les derniers rayons — un portrait qui comprend que l'immobilité est en soi une déclaration.",
      en: 'Hands folded, headwrap catching the last of the light — a portrait that understands stillness is its own kind of statement.',
      ar: 'يدان متشابكتان، وغطاء رأس يلتقط آخر الضوء — بورتريه يدرك أن السكون بيان بحد ذاته.',
    },
    width: 65, height: 120, price: 1899, quantity: 60, aspect: 420/1015, image: 'PW-003.jpg',
  },
  {
    id: 'PW-008', collection: 'Reines d\'Or',
    theme: 'Gathered in Prayer',
    philosophy: {
      fr: "Toute prière n'a pas besoin de public. Celle-ci est intime, recueillie, et ne demande rien à la pièce qui l'accueille.",
      en: "Not every prayer needs an audience. This one is private, folded inward, and asks nothing of the room it hangs in.",
      ar: 'ليست كل صلاة بحاجة إلى جمهور. هذه خاصة، منطوية على ذاتها، ولا تطلب شيئاً من الغرفة التي تُعلَّق فيها.',
    },
    width: 60, height: 120, price: 1899, quantity: 60, aspect: 405/1186, image: 'PW-008.jpg',
  },
  {
    id: 'PW-071', collection: 'Reines d\'Or',
    theme: 'Stillness, Gilded',
    philosophy: {
      fr: "Même l'éclat d'or sur ce foulard semble attendre, patient, le moment où ses mains trouveront enfin le repos.",
      en: "Even the glint of gold on this headwrap seems to wait, patient, for the moment her hands finally come to rest.",
      ar: 'حتى بريق الذهب على هذا الغطاء يبدو منتظراً، بصبر، اللحظة التي تستقر فيها يداها أخيراً.',
    },
    width: 70, height: 120, price: 2199, quantity: 55, aspect: 717/1222, image: 'PW-071.jpg',
  },
  {
    id: 'PW-074', collection: 'Reines d\'Or',
    theme: 'The Quiet Crown',
    philosophy: {
      fr: "Une toile étroite, une couronne discrète — la preuve que la présence n'a jamais dépendu de l'espace occupé sur un mur.",
      en: "A narrow canvas, a quiet crown — proof that presence was never about how much wall you take up.",
      ar: 'لوحة ضيقة، تاج هادئ — دليل على أن الحضور لم يكن يوماً رهين المساحة التي يشغلها على الجدار.',
    },
    width: 40, height: 120, price: 1499, quantity: 70, aspect: 206/861, image: 'PW-074.jpg',
  },

  // ─── Éclat Floral — vivid, impasto floral crowns ───
  {
    id: 'JYO37321-NF', collection: 'Éclat Floral',
    theme: 'Wildflower Sovereign',
    philosophy: {
      fr: "Aucun pétale de sa couronne ne ressemble à un autre, et c'est précisément le propos — elle n'a jamais été destinée à l'uniformité.",
      en: 'No two petals in her crown match, and that\'s precisely the point — she was never meant to be uniform.',
      ar: "لا بتلتان في تاجها متشابهتان، وهذا بالضبط هو المقصود — لم يُكتب لها يوماً أن تكون متماثلة.",
    },
    width: 80, height: 120, price: 2499, quantity: 80, aspect: 567/529, image: 'JYO37321-NF.jpg',
  },
  {
    id: 'JYO37320-NF', collection: 'Éclat Floral',
    theme: 'The Painted Garden Queen',
    philosophy: {
      fr: "Dense de couleur et sans en avoir peur, ce portrait refuse de chuchoter quand il pourrait chanter.",
      en: 'Thick with color and unafraid of it, this is a portrait that refuses to whisper when it could sing.',
      ar: "غنيّة باللون ولا تخشاه، هذه لوحة ترفض أن تهمس بينما تستطيع أن تُغنّي.",
    },
    width: 80, height: 120, price: 2499, quantity: 80, aspect: 455/545, image: 'JYO37320-NF.jpg',
  },
  {
    id: 'JYO37322-NF', collection: 'Éclat Floral',
    theme: 'Riot of Petals',
    philosophy: {
      fr: "Certains bouquets se composent. Le sien semble être simplement arrivé — joyeusement, tout à la fois, exactement comme il se doit.",
      en: 'Some bouquets are arranged. Hers looks like it simply happened — joyfully, all at once, exactly as it should.',
      ar: "بعض الباقات تُنسَّق. أما باقتها فتبدو وكأنها حدثت من تلقاء نفسها — بفرح، دفعة واحدة، تماماً كما ينبغي.",
    },
    width: 60, height: 80, price: 2299, quantity: 80, aspect: 499/535, image: 'JYO37322-NF.jpg',
  },
  {
    id: 'JYO37324-NF', collection: 'Éclat Floral',
    theme: 'Blossom Unrestrained',
    philosophy: {
      fr: "Chaque coup de pinceau ici a été peint comme s'il comptait — parce que dans ce visage, dans cette couleur, il comptait, à l'évidence.",
      en: 'Every brushstroke here was painted like it mattered — because in this face, in this color, it clearly did.',
      ar: "كل ضربة فرشاة هنا رُسمت وكأنها تعني شيئاً — لأنها في هذا الوجه، في هذا اللون، كانت تعني ذلك فعلاً.",
    },
    width: 60, height: 80, price: 2299, quantity: 80, aspect: 502/551, image: 'JYO37324-NF.jpg',
  },
  {
    id: 'JYO37323-NF', collection: 'Éclat Floral',
    theme: 'Her Own Season',
    philosophy: {
      fr: "Ni le printemps, ni l'été — une saison inventée rien que pour elle, où chaque fleur éclot à la fois et ne se fane jamais.",
      en: 'Not spring, not summer — a season invented just for her, where every flower blooms at once and stays.',
      ar: "لا ربيعاً ولا صيفاً — فصل اختُرع من أجلها وحدها، حيث تتفتح كل الأزهار معاً ولا تذبل.",
    },
    width: 60, height: 80, price: 2299, quantity: 80, aspect: 501/561, image: 'JYO37323-NF.jpg',
  },

  // ─── Âme Nomade — sunlit, unhurried, elsewhere ───
  {
    id: 'JYO37646-N', collection: 'Âme Nomade',
    theme: 'The Slow Afternoon',
    philosophy: {
      fr: "Ombres de palmier, chapeau de paille, nulle part où être — l'instant exact où la journée cesse de rien demander.",
      en: 'Palm shadows, straw brim, nowhere to be — the exact moment the day stops asking anything of you.',
      ar: "ظلال نخيل، قبعة قش، لا مكان للذهاب إليه — اللحظة بالضبط حين يتوقف النهار عن طلب أي شيء.",
    },
    width: 90, height: 120, price: 2199, quantity: 80, aspect: 503/569, image: 'JYO37646-N.jpg',
  },
  {
    id: 'JYO37645-N', collection: 'Âme Nomade',
    theme: 'Golden Hour Wanderer',
    philosophy: {
      fr: "Elle n'est pas posée, elle est suspendue — saisie dans cette lumière rare où voyager commence à ressembler à appartenir.",
      en: "She isn't posed, she's paused — caught in that rare light where travel starts to feel like belonging.",
      ar: "لم تتخذ وضعية، بل توقفت — التُقطت في ذلك الضوء النادر حيث يبدأ السفر بالشعور وكأنه انتماء.",
    },
    width: 90, height: 120, price: 2199, quantity: 80, aspect: 567/529, image: 'JYO37645-N.jpg',
  },
  {
    id: 'PW-070', collection: 'Âme Nomade',
    theme: 'Afternoon, Unhurried',
    philosophy: {
      fr: "Ombres de palmier, chapeau à larges bords, nulle part où elle doive être — voilà à quoi ressemble un après-midi qui ne doit rien à personne.",
      en: 'Palm shadows, a wide-brimmed hat, nowhere she has to be — this is what an afternoon looks like when nothing is owed to anyone.',
      ar: 'ظلال نخيل، قبعة واسعة الحواف، لا مكان عليها أن تكون فيه — هذا ما يبدو عليه بعد ظهر لا يدين لأحد بشيء.',
    },
    width: 45, height: 120, price: 2199, quantity: 60, aspect: 284/1001, image: 'PW-070.jpg',
  },
]

export const COLLECTIONS: Collection[] = [
  'Portraits Fleuris',
  'Bouquets',
  'Papillons',
  'Reines d\'Or',
  'Éclat Floral',
  'Âme Nomade',
]

// Color palette per collection — used for placeholder canvases & UI accents
export const COLLECTION_COLORS: Record<Collection, { from: string; to: string; accent: string }> = {
  'Portraits Fleuris': { from: '#E8C4C4', to: '#C4759A', accent: '#B0557A' },
  'Bouquets':          { from: '#B8D4B0', to: '#7A9E6D', accent: '#5A7E50' },
  'Papillons':         { from: '#C4D4E8', to: '#7A8EC4', accent: '#5A6EA0' },
  'Reines d\'Or':      { from: '#E8C880', to: '#C89B3C', accent: '#A07828' },
  'Éclat Floral':      { from: '#E8B4C4', to: '#C4508A', accent: '#A03868' },
  'Âme Nomade':        { from: '#E8D4B4', to: '#C99860', accent: '#A87838' },
}
