/**
 * Generates professional, human-readable order identifiers for Diyas N Duas.
 * Format: DND-DDMMYY-XXXXX (e.g. DND-260824-00127)
 */
export function generateHumanReadableOrderId(): string {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  
  const dateSegment = `${day}${month}${year}`;
  const randomNumericSequence = Math.floor(1000 + Math.random() * 90000); // 5 digits
  
  return `DND-${dateSegment}-${randomNumericSequence}`;
}
