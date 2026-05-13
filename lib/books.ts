export type Book = {
  slug: string        // used for file paths and routing
  title: string
  author: string
  year: number
  description: string
  seSlug: string      // Standard Ebooks URL slug (for download script)
  goodreadsRating: {
    value: number      // Goodreads average rating (out of 5)
    asOf: string       // Date this manually curated snapshot was checked
    count?: number
    url?: string
  }
}

export const books: Book[] = [
  {
    slug: "pride-and-prejudice",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    year: 1813,
    description: "A witty story of love, marriage, and social manners in Regency-era England.",
    seSlug: "jane-austen/pride-and-prejudice",
    goodreadsRating: {
      value: 4.28,
      asOf: "2026-05-09",
    },
  },
  {
    slug: "sense-and-sensibility",
    title: "Sense and Sensibility",
    author: "Jane Austen",
    year: 1811,
    description: "Two sisters navigate love and heartbreak with contrasting temperaments.",
    seSlug: "jane-austen/sense-and-sensibility",
    goodreadsRating: {
      value: 4.08,
      asOf: "2026-05-09",
    },
  },
  {
    slug: "frankenstein",
    title: "Frankenstein",
    author: "Mary Shelley",
    year: 1818,
    description: "A scientist creates life only to abandon his creation, with terrifying consequences.",
    seSlug: "mary-shelley/frankenstein",
    goodreadsRating: {
      value: 3.99,
      asOf: "2026-05-09",
    },
  },
  {
    slug: "dracula",
    title: "Dracula",
    author: "Bram Stoker",
    year: 1897,
    description: "A Transylvanian count spreads his dark curse across Victorian England.",
    seSlug: "bram-stoker/dracula",
    goodreadsRating: {
      value: 4.02,
      asOf: "2026-05-09",
    },
  },
  {
    slug: "the-picture-of-dorian-gray",
    title: "The Picture of Dorian Gray",
    author: "Oscar Wilde",
    year: 1890,
    description: "A beautiful young man preserves his youth in a portrait while his soul decays.",
    seSlug: "oscar-wilde/the-picture-of-dorian-gray",
    goodreadsRating: {
      value: 4.11,
      asOf: "2026-05-09",
    },
  },
  {
    slug: "jekyll-and-hyde",
    title: "Dr Jekyll and Mr Hyde",
    author: "Robert Louis Stevenson",
    year: 1886,
    description: "A respected doctor harbours a terrifying alter ego lurking beneath the surface.",
    seSlug: "robert-louis-stevenson/the-strange-case-of-dr-jekyll-and-mr-hyde",
    goodreadsRating: {
      value: 3.97,
      asOf: "2026-05-09",
    },
  },
  {
    slug: "treasure-island",
    title: "Treasure Island",
    author: "Robert Louis Stevenson",
    year: 1883,
    description: "A young boy embarks on a swashbuckling pirate adventure in search of buried gold.",
    seSlug: "robert-louis-stevenson/treasure-island",
    goodreadsRating: {
      value: 3.83,
      asOf: "2026-05-09",
    },
  },
  {
    slug: "moby-dick",
    title: "Moby-Dick",
    author: "Herman Melville",
    year: 1851,
    description: "Captain Ahab's obsessive hunt for the white whale that claimed his leg.",
    seSlug: "herman-melville/moby-dick",
    goodreadsRating: {
      value: 3.54,
      asOf: "2026-05-09",
    },
  },
  {
    slug: "huckleberry-finn",
    title: "The Adventures of Huckleberry Finn",
    author: "Mark Twain",
    year: 1884,
    description: "A boy and a runaway slave journey down the Mississippi River toward freedom.",
    seSlug: "mark-twain/the-adventures-of-huckleberry-finn",
    goodreadsRating: {
      value: 3.84,
      asOf: "2026-05-09",
    },
  },
  {
    slug: "alices-adventures-in-wonderland",
    title: "Alice's Adventures in Wonderland",
    author: "Lewis Carroll",
    year: 1865,
    description: "A curious girl falls down a rabbit hole into a world of glorious nonsense.",
    seSlug: "lewis-carroll/alices-adventures-in-wonderland/john-tenniel",
    goodreadsRating: {
      value: 4.02,
      asOf: "2026-05-09",
    },
  },
  {
    slug: "crime-and-punishment",
    title: "Crime and Punishment",
    author: "Fyodor Dostoevsky",
    year: 1866,
    description: "A student commits murder and is slowly consumed by guilt and psychological torment.",
    seSlug: "fyodor-dostoevsky/crime-and-punishment/constance-garnett",
    goodreadsRating: {
      value: 4.25,
      asOf: "2026-05-09",
    },
  },
  {
    slug: "anna-karenina",
    title: "Anna Karenina",
    author: "Leo Tolstoy",
    year: 1878,
    description: "A married aristocrat risks everything for a passionate and forbidden love.",
    seSlug: "leo-tolstoy/anna-karenina/constance-garnett",
    goodreadsRating: {
      value: 4.02,
      asOf: "2026-05-09",
    },
  },
  {
    slug: "the-time-machine",
    title: "The Time Machine",
    author: "H.G. Wells",
    year: 1895,
    description: "A Victorian inventor travels far into the future to find humanity strangely divided.",
    seSlug: "h-g-wells/the-time-machine",
    goodreadsRating: {
      value: 3.91,
      asOf: "2026-05-09",
    },
  },
  {
    slug: "the-war-of-the-worlds",
    title: "The War of the Worlds",
    author: "H.G. Wells",
    year: 1898,
    description: "Martians invade England, laying waste to everything in their path.",
    seSlug: "h-g-wells/the-war-of-the-worlds",
    goodreadsRating: {
      value: 3.89,
      asOf: "2026-05-09",
    },
  },
  {
    slug: "the-invisible-man",
    title: "The Invisible Man",
    author: "H.G. Wells",
    year: 1897,
    description: "A scientist discovers invisibility, but the power leads only to isolation and madness.",
    seSlug: "h-g-wells/the-invisible-man",
    goodreadsRating: {
      value: 3.71,
      asOf: "2026-05-09",
    },
  },
  {
    slug: "the-call-of-the-wild",
    title: "The Call of the Wild",
    author: "Jack London",
    year: 1903,
    description: "A domesticated dog is thrust into the brutal wilderness of the Yukon Gold Rush.",
    seSlug: "jack-london/the-call-of-the-wild",
    goodreadsRating: {
      value: 3.90,
      asOf: "2026-05-09",
    },
  },
  {
    slug: "around-the-world-in-eighty-days",
    title: "Around the World in Eighty Days",
    author: "Jules Verne",
    year: 1872,
    description: "An unflappable English gentleman bets he can circumnavigate the globe in eighty days.",
    seSlug: "jules-verne/around-the-world-in-eighty-days/george-makepeace-towle",
    goodreadsRating: {
      value: 3.91,
      asOf: "2026-05-09",
    },
  },
  {
    slug: "the-count-of-monte-cristo",
    title: "The Count of Monte Cristo",
    author: "Alexandre Dumas",
    year: 1844,
    description: "A falsely imprisoned man escapes and engineers an elaborate, patient revenge.",
    seSlug: "alexandre-dumas/the-count-of-monte-cristo/chapman-and-hall",
    goodreadsRating: {
      value: 4.34,
      asOf: "2026-05-09",
    },
  },
  {
    slug: "sherlock-holmes",
    title: "The Adventures of Sherlock Holmes",
    author: "Arthur Conan Doyle",
    year: 1892,
    description: "Twelve tales of brilliant deduction from literature's greatest detective.",
    seSlug: "arthur-conan-doyle/the-adventures-of-sherlock-holmes",
    goodreadsRating: {
      value: 4.32,
      asOf: "2026-05-09",
    },
  },
  {
    slug: "les-miserables",
    title: "Les Misérables",
    author: "Victor Hugo",
    year: 1862,
    description: "An ex-convict's decades-long struggle for redemption in 19th-century France.",
    seSlug: "victor-hugo/les-miserables/isabel-f-hapgood",
    goodreadsRating: {
      value: 4.19,
      asOf: "2026-05-09",
    },
  },
]

/** Absolute path to the cover image under /public/covers/ */
export function coverPath(slug: string) {
  return `/covers/${slug}.jpg`
}

/** Absolute path to the epub file under /public/books/ */
export function epubPath(slug: string) {
  return `/books/${slug}.epub`
}
