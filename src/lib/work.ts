/** Static wall for the public home. Not orders, not delivery files. */

export const heroWork = {
  src: "/work/studio-wall.webp",
  width: 853,
  height: 1280,
  year: 2026,
  widthCm: 50,
  heightCm: 70,
  medium: "mediumPastel",
  place: "placeGardenCity",
} as const;

export const selectedWork = [
  {
    id: "date-seller",
    src: "/work/date-seller.webp",
    title: "pieceDate",
    medium: "mediumPastel",
    place: "placeKhan",
    year: 2025,
    widthCm: 70,
    heightCm: 50,
    width: 1280,
    height: 853,
    featured: true,
  },
  {
    id: "night-tram",
    src: "/work/night-tram.webp",
    title: "pieceTram",
    medium: "mediumInk",
    place: "placeHeliopolis",
    year: 2025,
    widthCm: 50,
    heightCm: 70,
    width: 853,
    height: 1280,
    featured: false,
  },
  {
    id: "orange-seller",
    src: "/work/orange-seller.webp",
    title: "pieceOrange",
    medium: "mediumStudy",
    place: "placeAtaba",
    year: 2024,
    widthCm: 40,
    heightCm: 50,
    width: 853,
    height: 1280,
    featured: false,
  },
  {
    id: "balcony-laundry",
    src: "/work/balcony-laundry.webp",
    title: "pieceBalcony",
    medium: "mediumPastel",
    place: "placeGardenCity",
    year: 2024,
    widthCm: 50,
    heightCm: 70,
    width: 853,
    height: 1280,
    featured: false,
  },
  {
    id: "clay-pot",
    src: "/work/clay-pot.webp",
    title: "piecePot",
    medium: "mediumPastel",
    place: "placeStudio",
    year: 2026,
    widthCm: 50,
    heightCm: 70,
    width: 853,
    height: 1280,
    featured: false,
  },
  {
    id: "felucca",
    src: "/work/felucca.webp",
    title: "pieceFelucca",
    medium: "mediumInk",
    place: "placeNile",
    year: 2026,
    widthCm: 40,
    heightCm: 50,
    width: 853,
    height: 1280,
    featured: false,
  },
] as const;

function localeTag(locale: string) {
  return locale === "ar" ? "ar-EG" : "en-GB";
}

export function formatWorkYear(locale: string, year: number) {
  return new Intl.NumberFormat(localeTag(locale), { useGrouping: false }).format(
    year,
  );
}

export function formatWorkSize(
  locale: string,
  widthCm: number,
  heightCm: number,
) {
  const n = new Intl.NumberFormat(localeTag(locale), { useGrouping: false });
  const unit = locale === "ar" ? "سم" : "cm";
  return `${n.format(widthCm)}×${n.format(heightCm)} ${unit}`;
}
