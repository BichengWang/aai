import type {
  GenerateLifecycleTasksData,
  GenerateLifecycleTasksUseCase,
  UseCaseResult,
} from "@turo-automation/shared";

export async function runLifecycleTasksJob(params: {
  useCase: GenerateLifecycleTasksUseCase;
  asOf: string;
  createdBy: string;
}): Promise<UseCaseResult<GenerateLifecycleTasksData>> {
  return params.useCase.execute({
    asOf: params.asOf,
    createdBy: params.createdBy,
  });
}
