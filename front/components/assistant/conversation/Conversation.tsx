import { useCallback, useEffect, useRef } from "react";

import { AgentMessage } from "@app/components/assistant/conversation/AgentMessage";
import { UserMessage } from "@app/components/assistant/conversation/UserMessage";
import { useEventSource } from "@app/hooks/useEventSource";
import {
  AgentMessageNewEvent,
  UserMessageNewEvent,
} from "@app/lib/api/assistant/conversation";
import { useConversation } from "@app/lib/swr";
import {
  AgentMessageType,
  UserMessageType,
} from "@app/types/assistant/conversation";
import { WorkspaceType } from "@app/types/user";

export default function Conversation({
  conversationId,
  owner,
}: {
  conversationId: string;
  owner: WorkspaceType;
}) {
  const {
    conversation,
    isConversationError,
    isConversationLoading,
    mutateConversation,
  } = useConversation({
    conversationId,
    workspaceId: owner.sId,
  });

  useEffect(() => {
    if (window && window.scrollTo) {
      window.scrollTo(0, document.body.scrollHeight);
    }
  }, [conversation?.content.length]);

  const buildEventSourceURL = useCallback(
    (lastEvent: string | null) => {
      const esURL = `/api/w/${owner.sId}/assistant/conversations/${conversationId}/events`;
      let lastEventId = "";
      if (lastEvent) {
        const eventPayload: {
          eventId: string;
        } = JSON.parse(lastEvent);
        lastEventId = eventPayload.eventId;
      }
      const url = esURL + "?lastEventId=" + lastEventId;

      return url;
    },
    [conversationId, owner.sId]
  );

  const onEventCallback = useCallback(
    (event: string) => {
      const eventPayload: {
        eventId: string;
        data: UserMessageNewEvent | AgentMessageNewEvent;
      } = JSON.parse(event);
      if (!eventIds.current.includes(eventPayload.eventId)) {
        eventIds.current.push(eventPayload.eventId);
        void mutateConversation();
      }
    },
    [mutateConversation]
  );

  useEventSource(buildEventSourceURL, onEventCallback);
  const eventIds = useRef<string[]>([]);

  if (isConversationLoading) {
    return null;
  } else if (isConversationError) {
    return <div>Error loading conversation</div>;
  }
  if (!conversation) {
    return <div>No conversation here</div>;
  }

  return (
    <div className="pb-24">
      {conversation.content.map((versionedMessages) => {
        // Lots of typing because of the reduce which Typescript
        // doesn't handle well on union types
        const m = (versionedMessages as any[]).reduce(
          (
            acc: UserMessageType | AgentMessageType,
            cur: UserMessageType | AgentMessageType
          ) => (cur.version > acc.version ? cur : acc)
        ) as UserMessageType | AgentMessageType;

        if (m.visibility === "deleted") {
          return null;
        }
        switch (m.type) {
          case "user_message":
            return (
              <div key={`message-id-${m.sId}`} className="bg-structure-50 py-6">
                <div className="mx-auto flex max-w-4xl gap-4">
                  <UserMessage message={m} />
                </div>
              </div>
            );
          case "agent_message":
            return (
              <div
                key={`message-id-${m.sId}`}
                className="border-t border-structure-100 px-2 py-6"
              >
                <div className="mx-auto flex max-w-4xl gap-4">
                  <AgentMessage
                    message={m}
                    owner={owner}
                    conversationId={conversationId}
                  />
                </div>
              </div>
            );
          default:
            ((message: never) => {
              console.error("Unknown message type", message);
            })(m);
        }
      })}
    </div>
  );
}
