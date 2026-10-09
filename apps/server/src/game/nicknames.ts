import type { NicknameLanguage } from '@ash-quiz/shared'

/** "Surprise me" names used until an admin saves a list for the language. Each passes the name filter. */
export const defaultNicknames: Record<NicknameLanguage, string[]> = {
  hu: [
    'Kapitány Banán', 'Disco Krumpli', 'Turbó Csiga', 'Lufi Lajos', 'Pizzás Pisti', 'Nindzsa Nyuszi',
    'Pörgő Palacsinta', 'Sajtos Pogácsa', 'Rakéta Réka', 'Vicces Vakond', 'Csoki Csaba', 'Táncoló Tojás',
    'Bajszos Bagoly', 'Szuper Szilva', 'Kalandor Kifli', 'Mókás Mókus', 'Lézer Lepke', 'Vidám Vattacukor',
    'Hős Hörcsög', 'Pattogó Pingvin', 'Álmos Lajhár', 'Kockás Kaktusz', 'Gumimaci Gábor', 'Csillámpóni',
    'Pukkanó Popcorn', 'Galaktikus Galuska', 'Nindzsa Nokedli', 'Fürge Fánk', 'Repülő Rántotta', 'Kuglóf Király',
  ],
  en: [
    'Captain Banana', 'Disco Potato', 'Turbo Snail', 'Sir Waffles', 'Pizza Wizard', 'Ninja Bunny',
    'Cosmic Pancake', 'Cheesy Pretzel', 'Rocket Pickle', 'Giggle Mole', 'Choco Charlie', 'Dancing Egg',
    'Mustache Owl', 'Super Plum', 'Noodle Knight', 'Laser Moth', 'Cotton Candy Cat', 'Hero Hamster',
    'Bouncy Penguin', 'Sleepy Sloth', 'Cactus Hugger', 'Gummy Bear Bob', 'Professor Muffin', 'Unicorn Dust',
    'Popcorn Panic', 'Galactic Dumpling', 'Taco Tornado', 'Speedy Donut', 'Flying Omelette', 'Duke of Pudding',
  ],
}

/**
 * A random name from `names` that nobody in the game has yet (compared case-insensitively),
 * or any of them once all are taken (the join then reports the clash). Null for an empty list.
 */
export function pickNickname(names: readonly string[], taken: readonly string[], random: () => number = Math.random): string | null {
  const used = new Set(taken.map((name) => name.toLocaleLowerCase()))
  const free = names.filter((name) => !used.has(name.toLocaleLowerCase()))
  const pool = free.length > 0 ? free : names
  return pool[Math.floor(random() * pool.length)] ?? null
}
