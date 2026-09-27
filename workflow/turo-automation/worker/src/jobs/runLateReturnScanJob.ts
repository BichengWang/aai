import type {
  DetectLateReturnsData,
  DetectLateReturnsUseCase,
  UseCaseResult,
} from "@turo-automation/shared";

export async function runLateReturnScanJob(params: {
  useCase: DetectLateReturnsUseCase;
  asOf: string;
  openedBy: string;
}): Promise<UseCaseResult<DetectLateReturnsData>> {
  return params.useCase.execute({
    asOf: params.asOf,
    openedBy: params.openedBy,
  });
}
