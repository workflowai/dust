import type { ModelId, Result } from "@dust-tt/types";
import { Err, Ok } from "@dust-tt/types";
import type { WorkflowHandle } from "@temporalio/client";
import { WorkflowNotFoundError } from "@temporalio/client";

import { getTemporalClient } from "@connectors/lib/temporal";
import logger from "@connectors/logger/logger";
import { ConnectorResource } from "@connectors/resources/connector_resource";
import { WebCrawlerConfigurationResource } from "@connectors/resources/webcrawler_resource";

import { WebCrawlerQueueNames } from "./config";
import {
  crawlWebsiteSchedulerWorkflow,
  crawlWebsiteSchedulerWorkflowId,
  crawlWebsiteWorkflow,
  crawlWebsiteWorkflowId,
} from "./workflows";

export async function launchCrawlWebsiteWorkflow(
  connectorId: ModelId
): Promise<Result<string, Error>> {
  const connector = await ConnectorResource.fetchById(connectorId);
  if (!connector) {
    return new Err(new Error(`Connector ${connectorId} not found`));
  }
  const webcrawlerConfig =
    await WebCrawlerConfigurationResource.fetchByConnectorId(connector.id);

  if (!webcrawlerConfig) {
    return new Err(new Error(`CrawlerConfig not found for ${connector.id}`));
  }

  const webCrawlerQueueName = webcrawlerConfig.lastCrawledAt
    ? WebCrawlerQueueNames.UPDATE_WEBSITE
    : WebCrawlerQueueNames.NEW_WEBSITE;

  const client = await getTemporalClient();
  const workflowId = crawlWebsiteWorkflowId(connectorId);
  try {
    const handle: WorkflowHandle<typeof crawlWebsiteWorkflow> =
      client.workflow.getHandle(workflowId);
    try {
      await handle.terminate();
    } catch (e) {
      if (!(e instanceof WorkflowNotFoundError)) {
        throw e;
      }
    }

    await client.workflow.start(crawlWebsiteWorkflow, {
      args: [connectorId],
      taskQueue: webCrawlerQueueName,
      workflowId: workflowId,
      searchAttributes: {
        connectorId: [connectorId],
      },
      memo: {
        connectorId: connectorId,
      },
    });
    logger.info(
      {
        workflowId,
      },
      `Started workflow.`
    );
    return new Ok(workflowId);
  } catch (e) {
    logger.error(
      {
        workflowId,
        error: e,
      },
      `Failed starting workflow.`
    );
    return new Err(e as Error);
  }
}

export async function stopCrawlWebsiteWorkflow(
  connectorId: ModelId
): Promise<Result<void, Error>> {
  const client = await getTemporalClient();

  const workflowId = crawlWebsiteWorkflowId(connectorId);
  try {
    const handle: WorkflowHandle<typeof crawlWebsiteWorkflow> =
      client.workflow.getHandle(workflowId);
    try {
      await handle.terminate();
    } catch (e) {
      if (!(e instanceof WorkflowNotFoundError)) {
        throw e;
      }
    }
    return new Ok(undefined);
  } catch (e) {
    logger.error(
      {
        workflowId,
        error: e,
      },
      `Failed stopping workflow.`
    );
    return new Err(e as Error);
  }
}

export async function launchCrawlWebsiteSchedulerWorkflow(): Promise<
  Result<string, Error>
> {
  const client = await getTemporalClient();

  const workflowId = crawlWebsiteSchedulerWorkflowId();
  try {
    const handle = client.workflow.getHandle(workflowId);
    await handle.terminate();
  } catch (e) {
    if (!(e instanceof WorkflowNotFoundError)) {
      throw e;
    }
  }
  try {
    await client.workflow.start(crawlWebsiteSchedulerWorkflow, {
      args: [],
      taskQueue: WebCrawlerQueueNames.UPDATE_WEBSITE,
      workflowId: workflowId,
      cronSchedule: "0 * * * *", // every hour, on the hour
    });
    logger.info(
      {
        workflowId,
      },
      `Started workflow.`
    );
    return new Ok(workflowId);
  } catch (e) {
    logger.error(
      {
        workflowId,
        error: e,
      },
      `Failed starting workflow.`
    );
    return new Err(e as Error);
  }
}
