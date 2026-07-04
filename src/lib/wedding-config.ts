export const menu = {
  courses: [
    {
      name: 'Antipasto',
      items: [
        { name: 'To Be Decided', description: '' },
        { name: 'To Be Decided', description: '' },
      ],
    },
    {
      name: 'Main course',
      items: [
        { name: 'To Be Decided', description: '' },
        { name: 'To Be Decided', description: '' },
      ],
    },
    {
      name: 'Postre',
      items: [
        { name: 'To Be Decided', description: '' },
        { name: 'To Be Decided', description: '' },
      ],
    },
  ],
};

export const gallery = {
  opensAt: '2026-08-08T00:00:00-06:00',
  closesAt: '2026-08-09T23:59:59-06:00',
};

export const wedding = {
  coupleNames: 'Tommaso & Melissa',
  monogram: 'Tommaso & Melissa',
  date: '2026-08-08',
  dateDisplay: 'Saturday, 8 August 2026',
  ceremonyTime: '4:00 PM',
  receptionTime: '5:30 PM',
  ceremonyVenueName: 'Playa Grande',
  ceremonyVenueAddress: 'Playa Grande',
  ceremonyMapUrl: 'https://maps.app.goo.gl/y9nW2kN9NAAT5qZC9',
  venueName: "Green Lapa's Village",
  venueAddress: "Green Lapa's Village",
  venueMapUrl: 'https://maps.app.goo.gl/uiLafoJz1KUYUp8p9',
  parkingNote:
    "Parking may be limited, so we recommend coordinating travel with another guest when possible. If you need help, please reach out to us directly; Meli's number is +506 6202-6203.",
  dressCodeLines: [
    'Please avoid wearing white or light beige.',
    'The ceremony will be on the beach, so choose comfortable shoes for sand; we will not be on the beach for too long.',
    'Even by the sea, it is still a wedding. For men, we recommend fresh trousers that are not denim, paired with a short-sleeve or three-quarter-sleeve shirt.',
    'For women, a dress with comfortable footwear is a lovely choice.',
  ],
  schedule: [
    { time: '3:50 PM', event: 'Arrive at Playa Grande' },
    { time: '4:00 PM', event: 'Beach ceremony with a small refreshment' },
    { time: '5:30 PM', event: "Move to Green Lapa's Village for dinner and photos" },
    { time: '6:00 PM', event: 'Seating and aperitivo' },
    { time: '7:00 PM', event: 'Main course served' },
    { time: '8:00 PM', event: 'Music starts' },
  ],
  additionalNotes: '',
};

export function getWeddingLocalDate(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Costa_Rica',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}

export function isWeddingDay(date: Date = new Date()): boolean {
  return getWeddingLocalDate(date) === wedding.date;
}
