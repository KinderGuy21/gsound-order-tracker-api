import { format, parse, lastDayOfMonth } from 'date-fns';

export const getDateRange = (
  month: string,
  year: string,
): { date: string; endDate: string } => {
  const parsedDate = parse(
    `${year}-${month.padStart(2, '0')}`,
    'yyyy-MM',
    new Date(),
  );

  const start = format(parsedDate, 'MM-dd-yyyy');
  const end = format(lastDayOfMonth(parsedDate), 'MM-dd-yyyy');

  return { date: start, endDate: end };
};
