export const managedAgentLimits = {
  maxObjectiveUtf8Bytes: 64 * 1024,
  maxIdempotencyKeyUtf8Bytes: 256,
  maxProviderIdentityUtf8Bytes: 128,
  maxOpaqueRunIdentityUtf8Bytes: 2 * 1024,
  maxProviderMessageUtf8Bytes: 2 * 1024,
  maxProviderUrlUtf8Bytes: 4 * 1024,
  maxProviderResponseBytes: 1024 * 1024,
  maxReconcileTaskPages: 5,
  providerOperationTimeoutMs: 60_000,
  /** GitHub admits at most 65,535 characters across all `workflow_dispatch` inputs. */
  maxWorkflowDispatchInputsUtf8Bytes: 65_535,
} as const
