import { excludedTopics } from "../utils/Config"

export function shouldUpload(filename: string, config: string): Boolean {
  const topics = excludedTopics(config)
  for (const topic in topics.values) {
    if (filename.indexOf(topic) >= 0) {
      return false
    }
  }
  return true
}