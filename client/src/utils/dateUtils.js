export function getISOWeekNumber(dateValue) {
  if (!dateValue) {
    return null;
  }

  const originalDate = new Date(`${dateValue}T12:00:00`);

  if (Number.isNaN(originalDate.getTime())) {
    return null;
  }

  const date = new Date(
    Date.UTC(
      originalDate.getFullYear(),
      originalDate.getMonth(),
      originalDate.getDate()
    )
  );

  const dayNumber = date.getUTCDay() || 7;

  date.setUTCDate(date.getUTCDate() + 4 - dayNumber);

  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));

  return Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
}

export function getWorkWeekDates(dateValue) {
  if (!dateValue) {
    return null;
  }

  const selectedDate = new Date(`${dateValue}T12:00:00`);

  if (Number.isNaN(selectedDate.getTime())) {
    return null;
  }

  const selectedDay = selectedDate.getDay();

  let differenceFromFriday;

  if (selectedDay === 5) {
    differenceFromFriday = 0;
  } else if (selectedDay === 6) {
    differenceFromFriday = 1;
  } else if (selectedDay === 0) {
    differenceFromFriday = 2;
  } else {
    differenceFromFriday = (selectedDay + 2) % 7;
  }

  const friday = new Date(selectedDate);
  friday.setDate(selectedDate.getDate() - differenceFromFriday);

  const saturday = new Date(friday);
  saturday.setDate(friday.getDate() + 1);

  const sunday = new Date(friday);
  sunday.setDate(friday.getDate() + 2);

  return {
    friday,
    saturday,
    sunday,
  };
}

export function formatDate(date) {
  if (!(date instanceof Date)) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}