import type {
  SendApprovedMessageDraftsData,
  SendApprovedMessageDraftsUseCase,
  UseCaseResult,
} from "@turo-automation/shared";

export async function runSendApprovedMessageDraftsJob(params: {
  useCase: SendApprovedMessageDraftsUseCase;
  sentAt: string;
  triggeredBy: string;
}): Promise<UseCaseResult<SendApprovedMessageDraftsData>> {
  return params.useCase.execute({
    sentAt: params.sentAt,
    triggeredBy: params.triggeredBy,
  });
}
