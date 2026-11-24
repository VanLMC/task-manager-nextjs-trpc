// Fixed locale and time zone so the server render and the browser hydration produce the same text.
const taskDateFormat = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo',
});

export function formatTaskDate(date: Date): string {
  return taskDateFormat.format(date);
}
