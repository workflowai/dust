import type { WithAPIErrorReponse } from "@dust-tt/types";
import type { NextApiRequest, NextApiResponse } from "next";

import { Authenticator, getSession } from "@app/lib/auth";
import { TemplateResource } from "@app/lib/resources/template_resource";
import { apiError, withLogging } from "@app/logger/withlogging";

export type AssistantTemplateListType = ReturnType<
  TemplateResource["toListJSON"]
>;

export interface FetchAssistantTemplatesResponse {
  templates: AssistantTemplateListType[];
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WithAPIErrorReponse<FetchAssistantTemplatesResponse>>
): Promise<void> {
  const session = await getSession(req, res);
  const auth = await Authenticator.fromSession(
    session,
    req.query.wId as string
  );
  const owner = auth.workspace();
  if (!owner || !auth.isUser()) {
    return apiError(req, res, {
      status_code: 404,
      api_error: {
        type: "app_auth_error",
        message:
          "Workspace not found or user not authenticated to this workspace.",
      },
    });
  }

  const isMultiActionsEnabled = owner.flags.includes("multi_actions");

  switch (req.method) {
    case "GET":
      const templates = await TemplateResource.listAll({
        visibility: "published",
      });

      // For multi-actions workspaces, we only want to show templates that were built for multi-actions, or the one in reply-only.
      // For non multi-actions workspaces, we only want to show templates that were built for single actions.
      const filteredTemplates = templates.filter((t) => {
        if (isMultiActionsEnabled) {
          return t.presetAction === "reply" || t.presetActions.length > 0;
        } else {
          return t.presetActions.length === 0;
        }
      });

      return res
        .status(200)
        .json({ templates: filteredTemplates.map((t) => t.toListJSON()) });

    default:
      return apiError(req, res, {
        status_code: 405,
        api_error: {
          type: "method_not_supported_error",
          message: "The method passed is not supported, POST is expected.",
        },
      });
  }
}

export default withLogging(handler);
