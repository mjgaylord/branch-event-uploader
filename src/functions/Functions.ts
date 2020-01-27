import { ServiceType, ExportRequestStatus } from "../model/Models"

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

export function exportRequestStatusToString(type: ExportRequestStatus) {
  switch (type) {
      case ExportRequestStatus.Empty:
        return 'Empty'
      case ExportRequestStatus.Failed:
        return 'Failed'
      case ExportRequestStatus.Success:
        return 'Success'
  }
}

export function exportRequestStatusFromValue(value: string) {
  if (value === exportRequestStatusToString(ExportRequestStatus.Empty)) {
    return ExportRequestStatus.Empty
  }
  if (value === exportRequestStatusToString(ExportRequestStatus.Failed)) {
    return ExportRequestStatus.Failed
  }
  return ExportRequestStatus.Success
}