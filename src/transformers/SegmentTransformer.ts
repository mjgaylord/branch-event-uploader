import { Transformer, initMustache } from "./Transformer";
import SegmentEvent from "../model/SegmentEvent";
import BranchEvent, { enableFunctions } from "../model/BranchEvent";
import * as Mustache from 'mustache'

export class SegmentTransformer implements Transformer<SegmentEvent> {
  template = "SEGMENTEVENT"
  partials = {}
  constructor(template: string, partials: {}) {
    this.template = template
    this.partials = partials
    initMustache(this.template)
  }
  transform = (event: BranchEvent): SegmentEvent | undefined => {
    enableFunctions(event)
    const { template } = this
    const rendered = Mustache.render(template, event, this.loadPartial)
    if (!rendered || rendered.length === 0) {
      throw new Error(`Mustache template render failed for event: ${JSON.stringify(event)}`)
    }
    try {
      return this.parse(rendered)
    } catch (error) {
      throw new Error(`Parsing transformed event failed: ${rendered}`)
    }
  }
  loadPartial = (name: string) => {
    try {
      const partial = this.partials[name]
      if (!partial) {
        throw new Error(`Undefined, the partial: ${name} does not exist`)
      }
      return partial
    } catch (error) {
      console.error(`Unable to load partial: ${name} due to: ${error}`)
      throw error
    }
  }
  parse = (event: string): SegmentEvent => {
    return JSON.parse(event, (key, value) => {
      if (key === 'timestamp' && !!value) {
        return new Date(value)
      }
      return value
    })
  }
}