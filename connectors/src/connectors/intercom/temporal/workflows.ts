import type { ModelId } from "@dust-tt/types";
import {
  executeChild,
  proxyActivities,
  setHandler,
  workflowInfo,
} from "@temporalio/workflow";

import type * as activities from "@connectors/connectors/intercom/temporal/activities";
import type { IntercomUpdateSignal } from "@connectors/connectors/intercom/temporal/signals";

import { intercomUpdatesSignal } from "./signals";

const {
  getHelpCenterIdsToSyncActivity,
  syncHelpCenterOnlyActivity,
  getLevel1CollectionsIdsActivity,
  syncLevel1CollectionWithChildrenActivity,
  syncArticleBatchActivity,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: "30 minutes",
});

const {
  syncTeamOnlyActivity,
  getNextConversationBatchToSyncActivity,
  syncConversationBatchActivity,
  getNextConversationsBatchToDeleteActivity,
  deleteConversationBatchActivity,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: "30 minutes",
});

const { saveIntercomConnectorStartSync, saveIntercomConnectorSuccessSync } =
  proxyActivities<typeof activities>({
    startToCloseTimeout: "1 minute",
  });

/**
 * Sync Workflow for Intercom.
 * This workflow is responsible for syncing all the help centers for a given connector.
 * Lauched on a cron schedule every hour, it will sync all the help centers that are in DB.
 * If a signal is received, it will sync the help centers that were modified.
 */
export async function intercomSyncWorkflow({
  connectorId,
}: {
  connectorId: ModelId;
}) {
  await saveIntercomConnectorStartSync({ connectorId });

  const uniqueHelpCenterIds = new Set<string>();
  const uniqueTeamIds = new Set<string>();

  // If we get a signal, update the workflow state by adding help center ids.
  // We send a signal when permissions are updated by the admin.
  setHandler(
    intercomUpdatesSignal,
    (intercomUpdates: IntercomUpdateSignal[]) => {
      for (const { type, intercomId } of intercomUpdates) {
        if (type === "help_center") {
          uniqueHelpCenterIds.add(intercomId);
        } else if (type === "team") {
          uniqueTeamIds.add(intercomId);
        }
      }
    }
  );

  // If we got no signal, then we're on the hourly execution
  // We will only refresh the Help Center data as Conversations have webhooks
  if (uniqueHelpCenterIds.size === 0 && uniqueTeamIds.size === 0) {
    const helpCenterIds = await getHelpCenterIdsToSyncActivity(connectorId);
    helpCenterIds.forEach((i) => uniqueHelpCenterIds.add(i));
  }

  const {
    workflowId,
    searchAttributes: parentSearchAttributes,
    memo,
  } = workflowInfo();

  const currentSyncMs = new Date().getTime();

  // Async operations allow Temporal's event loop to process signals.
  // If a signal arrives during an async operation, it will update the set before the next iteration.
  while (uniqueHelpCenterIds.size > 0) {
    // Create a copy of the set to iterate over, to avoid issues with concurrent modification.
    const helpCenterIdsToProcess = new Set(uniqueHelpCenterIds);
    for (const helpCenterId of helpCenterIdsToProcess) {
      if (!uniqueHelpCenterIds.has(helpCenterId)) {
        continue;
      }
      // Async operation yielding control to the Temporal runtime.
      await executeChild(intercomHelpCenterSyncWorklow, {
        workflowId: `${workflowId}-help-center-${helpCenterId}`,
        searchAttributes: parentSearchAttributes,
        args: [
          {
            connectorId,
            helpCenterId,
            currentSyncMs,
          },
        ],
        memo,
      });
      // Remove the processed help center from the original set after the async operation.
      uniqueHelpCenterIds.delete(helpCenterId);
    }
  }

  // Async operations allow Temporal's event loop to process signals.
  // If a signal arrives during an async operation, it will update the set before the next iteration.
  while (uniqueTeamIds.size > 0) {
    // Create a copy of the set to iterate over, to avoid issues with concurrent modification.
    const teamIdsToProcess = new Set(uniqueTeamIds);
    for (const teamId of teamIdsToProcess) {
      if (!uniqueTeamIds.has(teamId)) {
        continue;
      }
      // Async operation yielding control to the Temporal runtime.
      await executeChild(intercomTeamFullSyncWorkflow, {
        workflowId: `${workflowId}-team-${teamId}`,
        searchAttributes: parentSearchAttributes,
        args: [
          {
            connectorId,
            teamId,
            currentSyncMs,
          },
        ],
        memo,
      });
      // Remove the processed team from the original set after the async operation.
      uniqueTeamIds.delete(teamId);
    }
  }

  await intercomOldConversationsCleanup({
    connectorId,
  });

  await saveIntercomConnectorSuccessSync({ connectorId });
}

/**
 * Sync Workflow for a Help Center.
 * Launched by the IntercomSyncWorkflow, it will sync a given help center.
 * We sync a HelpCenter by fetching all the Collections and Articles.
 */
export async function intercomHelpCenterSyncWorklow({
  connectorId,
  helpCenterId,
  currentSyncMs,
}: {
  connectorId: ModelId;
  helpCenterId: string;
  currentSyncMs: number;
}) {
  const hasPermission = await syncHelpCenterOnlyActivity({
    connectorId,
    helpCenterId,
    currentSyncMs,
  });

  if (!hasPermission) {
    // We don't have permission anymore on this help center, we don't sync it.
    return;
  }

  // First we sync the collections
  const collectionIds = await getLevel1CollectionsIdsActivity({
    connectorId,
    helpCenterId,
  });
  for (const collectionId of collectionIds) {
    await syncLevel1CollectionWithChildrenActivity({
      connectorId,
      helpCenterId,
      collectionId,
      currentSyncMs,
    });
  }

  // Then we sync the articles
  // We loop over the conversations to sync them all, by batch of INTERCOM_CONVO_BATCH_SIZE.
  let page: number | null = 1;
  do {
    const { nextPage } = await syncArticleBatchActivity({
      connectorId,
      helpCenterId,
      page,
      currentSyncMs,
    });
    page = nextPage;
  } while (page);
}

/**
 * Sync Workflow for a Team.
 * Launched by the IntercomSyncWorkflow, it will sync a given Team.
 * We sync a Team by fetching the conversations attached to this team.
 */
export async function intercomTeamFullSyncWorkflow({
  connectorId,
  teamId,
  currentSyncMs,
}: {
  connectorId: ModelId;
  teamId: string;
  currentSyncMs: number;
}) {
  // Updates the Team name and make sure we're still allowed to sync it.
  // If the team is not allowed anymore (permission to none or object not in Intercom anymore), it will delete all its data.
  const hasPermission = await syncTeamOnlyActivity({
    connectorId,
    teamId,
    currentSyncMs,
  });

  if (!hasPermission) {
    // We don't have permission anymore on this team, we don't sync it.
    return;
  }

  let cursor = null;

  // We loop over the conversations to sync them all, by batch of INTERCOM_CONVO_BATCH_SIZE.
  do {
    const { conversationIds, nextPageCursor } =
      await getNextConversationBatchToSyncActivity({
        connectorId,
        teamId,
        cursor,
      });

    await syncConversationBatchActivity({
      connectorId,
      teamId,
      conversationIds,
      currentSyncMs,
    });

    cursor = nextPageCursor;
  } while (cursor);
}

/**
 * Cleaning Workflow to remove old convos.
 * Launched by the IntercomSyncWorkflow, it will sync a given Team.
 * We sync a Team by fetching the conversations attached to this team.
 */
export async function intercomOldConversationsCleanup({
  connectorId,
}: {
  connectorId: ModelId;
}) {
  let conversationIds = [];
  do {
    conversationIds = await getNextConversationsBatchToDeleteActivity({
      connectorId,
    });
    await deleteConversationBatchActivity({
      connectorId,
      conversationIds,
    });
  } while (conversationIds.length > 0);
}
