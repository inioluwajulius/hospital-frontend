// Doctors' weekly availability: [{ day: 0-6 (Sunday = 0), start: 'HH:mm', end: 'HH:mm' }]

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** "Mon 09:00-17:00, Wed 09:00-13:00" or a fallback when no hours are set */
export const formatAvailability = (availability, fallback = 'No fixed hours set') =>
  Array.isArray(availability) && availability.length
    ? [...availability]
        .sort((a, b) => a.day - b.day || a.start.localeCompare(b.start))
        .map((s) => `${DAY_SHORT[s.day]} ${s.start}-${s.end}`)
        .join(', ')
    : fallback;
