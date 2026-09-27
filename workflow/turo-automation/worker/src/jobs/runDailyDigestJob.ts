import type { BuildDailyDigestData, BuildDailyDigestUseCase, UseCaseResult } from "@turo-automation/shared";

export async function runDailyDigestJob(params: {
  useCase: BuildDailyDigestUseCase;
  today: string;
  generatedAt: string;
  channel: string;
}): Promise<UseCaseResult<BuildDailyDigestData>> {
  return params.useCase.execute({
    today: params.today,
    generatedAt: params.generatedAt,
    channel: params.channel,
  });
}
