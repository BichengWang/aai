import type {
  GenerateMessageDraftsData,
  GenerateMessageDraftsUseCase,
  UseCaseResult,
} from "@turo-automation/shared";

export async function runGenerateMessageDraftsJob(params: {
  useCase: GenerateMessageDraftsUseCase;
  asOf: string;
  requestedBy: string;
}): Promise<UseCaseResult<GenerateMessageDraftsData>> {
  return params.useCase.execute({
    asOf: params.asOf,
    requestedBy: params.requestedBy,
  });
}
