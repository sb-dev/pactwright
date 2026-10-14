export const NAME = "Pactwright";

if (process.argv[1] === new URL(import.meta.url).pathname) {
  console.log(NAME);
}
