import { getDay } from "date-fns"

export type Holiday = {
  name: string
  date: Date
  type?: string
}

// Function to get the nth occurrence of a specific day of the week in a month
function getNthDayOfMonth(year: number, month: number, dayOfWeek: number, n: number): Date {
  const firstDayOfMonth = new Date(year, month, 1)
  const firstDayOfWeekInMonth =
    dayOfWeek < getDay(firstDayOfMonth) ? 7 - getDay(firstDayOfMonth) + dayOfWeek : dayOfWeek - getDay(firstDayOfMonth)

  const day = 1 + firstDayOfWeekInMonth + (n - 1) * 7
  return new Date(year, month, day)
}

// Function to get the last occurrence of a specific day of the week in a month
function getLastDayOfMonth(year: number, month: number, dayOfWeek: number): Date {
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const offset = (dayOfWeek - getDay(lastDayOfMonth) + 7) % 7
  return new Date(year, month, lastDayOfMonth.getDate() - offset)
}

export function getAllHolidays(year: number): Holiday[] {
  const holidays: Holiday[] = []

  // Federal Holidays
  // New Year's Day
  holidays.push({
    name: "New Year's Day",
    date: new Date(year, 0, 1),
  })

  // Martin Luther King Jr. Day (3rd Monday in January)
  holidays.push({
    name: "MLK Jr. Day",
    date: getNthDayOfMonth(year, 0, 1, 3), // 3rd Monday (1) in January (0)
  })

  // Presidents' Day (3rd Monday in February)
  holidays.push({
    name: "Presidents' Day",
    date: getNthDayOfMonth(year, 1, 1, 3), // 3rd Monday (1) in February (1)
  })

  // Memorial Day (Last Monday in May)
  holidays.push({
    name: "Memorial Day",
    date: getLastDayOfMonth(year, 4, 1), // Last Monday (1) in May (4)
  })

  // Juneteenth
  holidays.push({
    name: "Juneteenth",
    date: new Date(year, 5, 19),
  })

  // Independence Day
  holidays.push({
    name: "Independence Day",
    date: new Date(year, 6, 4),
  })

  // Labor Day (1st Monday in September)
  holidays.push({
    name: "Labor Day",
    date: getNthDayOfMonth(year, 8, 1, 1), // 1st Monday (1) in September (8)
  })

  // Columbus Day / Indigenous Peoples' Day (2nd Monday in October)
  holidays.push({
    name: "Columbus Day",
    date: getNthDayOfMonth(year, 9, 1, 2), // 2nd Monday (1) in October (9)
  })

  // Veterans Day
  holidays.push({
    name: "Veterans Day",
    date: new Date(year, 10, 11),
  })

  // Thanksgiving (4th Thursday in November)
  holidays.push({
    name: "Thanksgiving",
    date: getNthDayOfMonth(year, 10, 4, 4), // 4th Thursday (4) in November (10)
  })

  // Christmas
  holidays.push({
    name: "Christmas",
    date: new Date(year, 11, 25),
  })

  // International Holidays
  // Valentine's Day
  holidays.push({
    name: "Valentine's Day",
    date: new Date(year, 1, 14),
  })

  // St. Patrick's Day
  holidays.push({
    name: "St. Patrick's Day",
    date: new Date(year, 2, 17),
  })

  // Earth Day
  holidays.push({
    name: "Earth Day",
    date: new Date(year, 3, 22),
  })

  // Mother's Day (2nd Sunday in May)
  holidays.push({
    name: "Mother's Day",
    date: getNthDayOfMonth(year, 4, 0, 2),
  })

  // Father's Day (3rd Sunday in June)
  holidays.push({
    name: "Father's Day",
    date: getNthDayOfMonth(year, 5, 0, 3),
  })

  // Halloween
  holidays.push({
    name: "Halloween",
    date: new Date(year, 9, 31),
  })

  // New Year's Eve
  holidays.push({
    name: "New Year's Eve",
    date: new Date(year, 11, 31),
  })

  return holidays
}

