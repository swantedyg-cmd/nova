// The six brand taglines — each exists in French (primary display), English
// (subtitle) and Arabic (tertiary, RTL). `role` is internal strategy
// context (where/why this line works), not customer-facing copy.

export interface Tagline {
  id: string
  label: string
  fr: string
  en: string
  ar: string
  role: string
}

export const TAGLINES: Tagline[] = [
  {
    id: '4a',
    label: 'The Hand',
    fr: "Chaque toile porte la main qui l'a peinte.",
    en: 'Every canvas carries the hand that painted it.',
    ar: 'كلّ لوحة تحمل أثر اليد التي رسمتها.',
    role: 'Safest and most factual. Communicates handmade without using the word. Primary hero tagline.',
  },
  {
    id: '4b',
    label: 'The Hours',
    fr: 'Nous ne vendons pas des images.\nNous vendons des heures de peinture.',
    en: "We don't sell pictures. We sell hours of painting.",
    ar: 'لا نبيع صوراً، بل نبيع ساعات من الرسم.',
    role: 'Strongest against printed-canvas competitors. Place near pricing or in an "about the work" section.',
  },
  {
    id: '4c',
    label: 'The Light',
    fr: 'Peint à la lumière de Marrakech,\npour vivre chez vous.',
    en: 'Painted in the light of Marrakech, to live in your home.',
    ar: 'رُسِمَت في ضوء مراكش، لتعيش في بيتك.',
    role: 'Best for international buyers. Origin + destination.',
  },
  {
    id: '4d',
    label: 'The Room',
    fr: 'Un mur qui respire.\nUne maison qui se souvient.',
    en: 'A wall that breathes. A home that remembers.',
    ar: 'جدار يتنّفس، وبيت يتذكّر.',
    role: 'Most emotional. Sells the room the painting lives in, not the painting itself.',
  },
  {
    id: '4e',
    label: 'The Single One',
    fr: 'Aucune toile ne quitte\ncet atelier deux fois.',
    en: 'No canvas leaves this studio twice.',
    ar: 'لا تغادر لوحة هذا المرسم مرتين.',
    role: 'Scarcity, said quietly. Pairs with numbered pieces or edition labels.',
  },
  {
    id: '4f',
    label: 'The Keeping',
    fr: "L'huile sèche lentement.\nCe qu'elle raconte reste.",
    en: 'Oil dries slowly. What it says stays.',
    ar: 'يجّف الزيت ببطء، ويبقى ما يرويه.',
    role: 'Addresses the #1 online art objection (will it last?). Most poetic — permanence promise.',
  },
]
