import type {
  DataSourceType,
  SubscriptionType,
  WebCrawlerConfigurationType,
  WorkspaceType,
} from "@dust-tt/types";
import { ConnectorsAPI } from "@dust-tt/types";
import type { InferGetServerSidePropsType } from "next";

import WebsiteConfiguration from "@app/components/data_source/WebsiteConfiguration";
import { getDataSource, getDataSources } from "@app/lib/api/data_sources";
import { withDefaultUserAuthRequirements } from "@app/lib/iam/session";
import logger from "@app/logger/logger";

const { GA_TRACKING_ID = "" } = process.env;

export const getServerSideProps = withDefaultUserAuthRequirements<{
  owner: WorkspaceType;
  subscription: SubscriptionType;
  dataSources: DataSourceType[];
  dataSource: DataSourceType;
  webCrawlerConfiguration: WebCrawlerConfigurationType;
  gaTrackingId: string;
}>(async (context, auth) => {
  const owner = auth.workspace();
  const subscription = auth.subscription();

  if (!owner || !subscription || !auth.isBuilder()) {
    return {
      notFound: true,
    };
  }

  const dataSources = await getDataSources(auth);
  const dataSource = await getDataSource(auth, context.params?.name as string, {
    includeEditedBy: true,
  });

  if (!dataSource) {
    return {
      notFound: true,
    };
  }
  if (
    dataSource.connectorProvider !== "webcrawler" ||
    dataSource.connectorId === null
  ) {
    return {
      notFound: true,
    };
  }

  const connectorRes = await new ConnectorsAPI(logger).getConnector(
    dataSource.connectorId
  );
  if (connectorRes.isErr()) {
    throw new Error(connectorRes.error.message);
  }

  return {
    props: {
      owner,
      subscription,
      dataSources,
      dataSource,
      webCrawlerConfiguration: connectorRes.value
        .configuration as WebCrawlerConfigurationType,
      gaTrackingId: GA_TRACKING_ID,
    },
  };
});

export default function DataSourceNew({
  owner,
  subscription,
  dataSources,
  dataSource,
  gaTrackingId,
  webCrawlerConfiguration,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <WebsiteConfiguration
      owner={owner}
      subscription={subscription}
      dataSources={dataSources}
      gaTrackingId={gaTrackingId}
      webCrawlerConfiguration={webCrawlerConfiguration}
      dataSource={dataSource}
    />
  );
}
