
export function dateInFilename(filename: string): string {
  const matches = filename.match('[0-9]{4}[-|\/]{1}[0-9]{2}[-|\/]{1}[0-9]{2}')
  if (matches.length === 0) {
    return "Unknown"
  }
  return matches[0]
}
