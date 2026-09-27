import type { ImportTripsUseCase, ImportTripsData, UseCaseResult } from "@turo-automation/shared";

export async function runImportTripsJob(params: {
  useCase: ImportTripsUseCase;
  triggeredBy: string;
  importedAt: string;
}): Promise<UseCaseResult<ImportTripsData>> {
  return params.useCase.execute({
    triggeredBy: params.triggeredBy,
    importedAt: params.importedAt,
  });
}
