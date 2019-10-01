export function chunk<T>(array:Array<T>, size: number): Array<Array<T>> {
  var chunks = []
  for (var i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, Math.min(i + size, array.length)))
  }
  return chunks
}