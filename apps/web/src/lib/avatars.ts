import { avatars, type Avatar } from '@ash-quiz/shared'

/** A random avatar: preselected on the join page and picked by "Surprise me". */
export function randomAvatar(random: () => number = Math.random): Avatar {
  return avatars[Math.floor(random() * avatars.length)]!
}
