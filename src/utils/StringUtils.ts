
export function dateInFilename(filename: string): string {
  const matches = filename.match('[0-9]{4}[-|\/]{1}[0-9]{2}[-|\/]{1}[0-9]{2}')
  if (!matches || matches.length === 0) {
    return "Unknown"
  }
  return matches[0]
}

export function hasData(...values: string[]): boolean {
  return values.filter(v => !!v && v.length > 0).length > 0
}