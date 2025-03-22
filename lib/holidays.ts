import { getDay } from "date-fns"

export type Holiday = {
  name: string
  date: Date
  type: "federal" | "religious" | "cultural" | "international" | "observance"
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

// Easter calculation (Meeus/Jones/Butcher algorithm)
function getEasterDate(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1
  const day = ((h + l - 7 * m + 114) % 31) + 1

  return new Date(year, month, day)
}

export function getFederalHolidays(year: number): Holiday[] {
  const holidays: Holiday[] = []

  // New Year's Day
  holidays.push({
    name: "New Year's Day",
    date: new Date(year, 0, 1),
    type: "federal",
  })

  // Martin Luther King Jr. Day (3rd Monday in January)
  holidays.push({
    name: "MLK Jr. Day",
    date: getNthDayOfMonth(year, 0, 1, 3), // 3rd Monday (1) in January (0)
    type: "federal",
  })

  // Presidents' Day (3rd Monday in February)
  holidays.push({
    name: "Presidents' Day",
    date: getNthDayOfMonth(year, 1, 1, 3), // 3rd Monday (1) in February (1)
    type: "federal",
  })

  // Memorial Day (Last Monday in May)
  holidays.push({
    name: "Memorial Day",
    date: getLastDayOfMonth(year, 4, 1), // Last Monday (1) in May (4)
    type: "federal",
  })

  // Juneteenth
  holidays.push({
    name: "Juneteenth",
    date: new Date(year, 5, 19),
    type: "federal",
  })

  // Independence Day
  holidays.push({
    name: "Independence Day",
    date: new Date(year, 6, 4),
    type: "federal",
  })

  // Labor Day (1st Monday in September)
  holidays.push({
    name: "Labor Day",
    date: getNthDayOfMonth(year, 8, 1, 1), // 1st Monday (1) in September (8)
    type: "federal",
  })

  // Columbus Day / Indigenous Peoples' Day (2nd Monday in October)
  holidays.push({
    name: "Columbus Day",
    date: getNthDayOfMonth(year, 9, 1, 2), // 2nd Monday (1) in October (9)
    type: "federal",
  })

  // Veterans Day
  holidays.push({
    name: "Veterans Day",
    date: new Date(year, 10, 11),
    type: "federal",
  })

  // Thanksgiving (4th Thursday in November)
  holidays.push({
    name: "Thanksgiving",
    date: getNthDayOfMonth(year, 10, 4, 4), // 4th Thursday (4) in November (10)
    type: "federal",
  })

  // Christmas
  holidays.push({
    name: "Christmas",
    date: new Date(year, 11, 25),
    type: "federal",
  })

  return holidays
}

export function getReligiousHolidays(year: number): Holiday[] {
  const holidays: Holiday[] = []

  // Christian Holidays
  const easterDate = getEasterDate(year)

  // Easter
  holidays.push({
    name: "Easter",
    date: easterDate,
    type: "religious",
  })

  // Good Friday (2 days before Easter)
  holidays.push({
    name: "Good Friday",
    date: new Date(easterDate.getTime() - 2 * 24 * 60 * 60 * 1000),
    type: "religious",
  })

  // Ash Wednesday (46 days before Easter)
  holidays.push({
    name: "Ash Wednesday",
    date: new Date(easterDate.getTime() - 46 * 24 * 60 * 60 * 1000),
    type: "religious",
  })

  // Christmas Eve
  holidays.push({
    name: "Christmas Eve",
    date: new Date(year, 11, 24),
    type: "religious",
  })

  // Jewish Holidays (approximate dates - these actually depend on the Hebrew calendar)
  // Passover (approximate)
  holidays.push({
    name: "Passover",
    date: new Date(year, 3, 15),
    type: "religious",
  })

  // Rosh Hashanah (approximate)
  holidays.push({
    name: "Rosh Hashanah",
    date: new Date(year, 8, 20),
    type: "religious",
  })

  // Yom Kippur (approximate - 10 days after Rosh Hashanah)
  holidays.push({
    name: "Yom Kippur",
    date: new Date(year, 8, 30),
    type: "religious",
  })

  // Hanukkah (approximate)
  holidays.push({
    name: "Hanukkah",
    date: new Date(year, 11, 10),
    type: "religious",
  })

  // Islamic Holidays (approximate dates - these depend on the Islamic calendar)
  // Eid al-Fitr (approximate)
  holidays.push({
    name: "Eid al-Fitr",
    date: new Date(year, 4, 10),
    type: "religious",
  })

  // Eid al-Adha (approximate)
  holidays.push({
    name: "Eid al-Adha",
    date: new Date(year, 6, 17),
    type: "religious",
  })

  // Hindu Holidays
  // Diwali (approximate)
  holidays.push({
    name: "Diwali",
    date: new Date(year, 10, 4),
    type: "religious",
  })

  // Holi (approximate)
  holidays.push({
    name: "Holi",
    date: new Date(year, 2, 8),
    type: "religious",
  })

  return holidays
}

export function getInternationalHolidays(year: number): Holiday[] {
  const holidays: Holiday[] = []

  // New Year's Day is already in federal holidays

  // Valentine's Day
  holidays.push({
    name: "Valentine's Day",
    date: new Date(year, 1, 14),
    type: "international",
  })

  // St. Patrick's Day
  holidays.push({
    name: "St. Patrick's Day",
    date: new Date(year, 2, 17),
    type: "international",
  })

  // Earth Day
  holidays.push({
    name: "Earth Day",
    date: new Date(year, 3, 22),
    type: "international",
  })

  // Mother's Day (2nd Sunday in May)
  holidays.push({
    name: "Mother's Day",
    date: getNthDayOfMonth(year, 4, 0, 2),
    type: "international",
  })

  // Father's Day (3rd Sunday in June)
  holidays.push({
    name: "Father's Day",
    date: getNthDayOfMonth(year, 5, 0, 3),
    type: "international",
  })

  // Halloween
  holidays.push({
    name: "Halloween",
    date: new Date(year, 9, 31),
    type: "international",
  })

  // New Year's Eve
  holidays.push({
    name: "New Year's Eve",
    date: new Date(year, 11, 31),
    type: "international",
  })

  return holidays
}

export function getObservanceDays(year: number): Holiday[] {
  const holidays: Holiday[] = []

  // Black History Month (just marking the first day)
  holidays.push({
    name: "Black History Month",
    date: new Date(year, 1, 1),
    type: "observance",
  })

  // Women's History Month (just marking the first day)
  holidays.push({
    name: "Women's History Month",
    date: new Date(year, 2, 1),
    type: "observance",
  })

  // Pride Month (just marking the first day)
  holidays.push({
    name: "Pride Month",
    date: new Date(year, 5, 1),
    type: "observance",
  })

  // Groundhog Day
  holidays.push({
    name: "Groundhog Day",
    date: new Date(year, 1, 2),
    type: "observance",
  })

  // Tax Day (usually April 15)
  holidays.push({
    name: "Tax Day",
    date: new Date(year, 3, 15),
    type: "observance",
  })

  // Cinco de Mayo
  holidays.push({
    name: "Cinco de Mayo",
    date: new Date(year, 4, 5),
    type: "observance",
  })

  // Election Day (first Tuesday after first Monday in November)
  const firstMondayInNov = getNthDayOfMonth(year, 10, 1, 1)
  const electionDay = new Date(firstMondayInNov)
  electionDay.setDate(firstMondayInNov.getDate() + 1) // Tuesday after first Monday
  holidays.push({
    name: "Election Day",
    date: electionDay,
    type: "observance",
  })

  return holidays
}

export function getAllHolidays(year: number): Holiday[] {
  return [
    ...getFederalHolidays(year),
    ...getReligiousHolidays(year),
    ...getInternationalHolidays(year),
    ...getObservanceDays(year),
  ]
}

