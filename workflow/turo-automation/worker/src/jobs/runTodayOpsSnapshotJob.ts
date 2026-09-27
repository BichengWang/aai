import type { GetTodayOpsSnapshotUseCase, UseCaseResult, TodayOpsSnapshot } from "@turo-automation/shared";

export async function runTodayOpsSnapshotJob(params: {
  useCase: GetTodayOpsSnapshotUseCase;
  today: string;
  generatedAt: string;
}): Promise<UseCaseResult<TodayOpsSnapshot>> {
  return params.useCase.execute({
    today: params.today,
    generatedAt: params.generatedAt,
  });
}
