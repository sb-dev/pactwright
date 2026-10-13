// INJECTED FAULT (T3.6 L4 fixture)
export function isLeapYear(year) {
  return year % 4 === 0;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  console.log(JSON.stringify(isLeapYear(Number(process.argv[2]))));
}
