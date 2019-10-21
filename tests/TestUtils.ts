export async function readFile(path: string): Promise<any> {
  console.debug(`reading file: ${path}`)
  return new Promise((resolve, reject) => {
    jest.requireActual('fs').readFile(path, 'utf8', (err, data) => {
      if (!!err) {
        reject(err)
        return
      }
      resolve(data)
    })
  })
}

export function openStream(path: string): NodeJS.ReadableStream {
  console.debug(`reading stream: ${path}`)
  return jest.requireActual('fs').createReadStream(path)
}

export function writeStream(path: string): NodeJS.WritableStream {
  console.debug(`writable stream: ${path}`)
  return jest.requireActual('fs').createWriteStream(path)
}

export async function readDir(path: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    jest.requireActual('fs').readdir(path, async (err, files) => {
      if (!!err) {
        reject(err)
        return
      }
      resolve(files)
    })
  })
}