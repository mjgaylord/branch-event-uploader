import BranchEvent from "../model/BranchEvent"
import * as Mustache from 'mustache'

export interface Transformer<T> {
  transform(event: BranchEvent): T
}

export function initMustache(template: any) {
  Mustache.parse(template)
  //@ts-ignore
  Mustache.escape = function (text: string): string { return text }
}