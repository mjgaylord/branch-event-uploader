import { ServiceType } from "../model/Models"

export function typeToString(type: ServiceType) {
  switch (type) {
      case ServiceType.Branch:
          return 'Branch'
      case ServiceType.Tune:
          return 'Tune'
  }
}

export function typeFromValue(value: string) {
  if (value === typeToString(ServiceType.Tune)) {
      return ServiceType.Tune
  }
  return ServiceType.Branch
}