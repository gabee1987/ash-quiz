/** Background and readable text colour, fixed by index: red triangle, blue diamond, yellow circle, green square, orange pentagon, purple hexagon. */
export const optionColours = [
  'bg-red-600 text-white',
  'bg-blue-600 text-white',
  'bg-yellow-400 text-black',
  'bg-green-600 text-white',
  'bg-orange-500 text-black',
  'bg-purple-600 text-white',
]

export function optionColour(index: number): string {
  return optionColours[index % optionColours.length]!
}
