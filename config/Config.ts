import { ServiceType } from "../model/Models"

export function serviceType(): ServiceType {
  const env = process.env.SERVICE_TYPE || 'Branch'
  if (env === 'Tune'){
    return ServiceType.Tune
  }
  return ServiceType.Branch
}