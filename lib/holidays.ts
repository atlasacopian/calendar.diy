export type Holiday = {
  id: string
  name: string
  date: Date
}

export const getAllHolidays = (year: number): Holiday[] => {
  const holidays: Holiday[] = [
    {
      id: `new-years-${year}`,
      name: "New Year's Day",
      date: new Date(year, 0, 1),
    },
    {
      id: `valentines-${year}`,
      name: "Valentine's Day",
      date: new Date(year, 1, 14),
    },
    {
      id: `st-patricks-${year}`,
      name: "St. Patrick's Day",
      date: new Date(year, 2, 17),
    },
    {
      id: `easter-${year}`,
      name: "Easter",
      date: new Date(year, 3, 9), // Note: This is a simplification, Easter date varies
    },
    {
      id: `mothers-day-${year}`,
      name: "Mother's Day",
      date: new Date(year, 4, 14), // Second Sunday in May (simplified)
    },
    {
      id: `fathers-day-${year}`,
      name: "Father's Day",
      date: new Date(year, 5, 18), // Third Sunday in June (simplified)
    },
    {
      id: `independence-day-${year}`,
      name: "Independence Day",
      date: new Date(year, 6, 4),
    },
    {
      id: `labor-day-${year}`,
      name: "Labor Day",
      date: new Date(year, 8, 4), // First Monday in September (simplified)
    },
    {
      id: `halloween-${year}`,
      name: "Halloween",
      date: new Date(year, 9, 31),
    },
    {
      id: `thanksgiving-${year}`,
      name: "Thanksgiving",
      date: new Date(year, 10, 28), // Fourth Thursday in November (simplified)
    },
    {
      id: `christmas-${year}`,
      name: "Christmas",
      date: new Date(year, 11, 25),
    },
    {
      id: `new-years-eve-${year}`,
      name: "New Year's Eve",
      date: new Date(year, 11, 31),
    },
  ]

  return holidays
}

