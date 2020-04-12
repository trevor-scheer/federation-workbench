import React, { useState, Dispatch, useEffect } from "react";
import { Button } from "@apollo/space-kit/Button";
import { colors } from "@apollo/space-kit/colors";
import { Action } from "./App";
import "./LoadFromAgm.css";
import { useLazyQuery, gql } from "@apollo/client";

type Props = {
  dispatch: Dispatch<Action>;
};

const graphSelectQuery = gql`
  query GraphSelectQuery {
    me {
      id
      ... on User {
        memberships {
          account {
            id
            name
            services {
              id
              name
              schemaTags {
                variant {
                  id
                  name
                }
              }
            }
          }
        }
      }
    }
  }
`;

const partialSdlQuery = gql`
  query PartialSdlQuery($serviceId: ID!, $graphVariant: String!) {
    service(id: $serviceId) {
      implementingServices(graphVariant: $graphVariant) {
        ... on FederatedImplementingServices {
          services {
            name
            activePartialSchema {
              sdl
            }
          }
        }
      }
    }
  }
`;

export default function LoadFromAgm({ dispatch }: Props) {
  const [apiKey, updateApiKey] = useState("");

  const [sendGraphsQuery, { loading, data: graphs }] = useLazyQuery(
    graphSelectQuery
  );
  const [sendPartialSdlQuery, sdlResponse] = useLazyQuery(partialSdlQuery);

  useEffect(() => {
    const keyFromStorage = localStorage.getItem("workbenchApiKey");
    if (keyFromStorage) {
      updateApiKey(keyFromStorage);
    }
    sendGraphsQuery();
  }, []);

  useEffect(() => {
    if (sdlResponse.data?.service.implementingServices) {
      dispatch({
        type: "loadFromAGM",
        payload: {
          services: Object.fromEntries(
            sdlResponse.data?.service.implementingServices.services.map(
              (service: {
                name: string;
                activePartialSchema: { sdl: string };
              }) => [service.name, service.activePartialSchema.sdl]
            )
          ),
        },
      });
      dispatch({ type: "refreshComposition" });
    }
  }, [sdlResponse]);

  return (
    <>
      <form
        className="LoadFromAgm-form"
        onSubmit={(e) => {
          e.preventDefault();
          localStorage.setItem("workbenchApiKey", apiKey);
          sendGraphsQuery();
        }}
      >
        <label className="LoadFromAgm-label">
          User API Key
          <input
            className="LoadFromAgm-input"
            placeholder="user:xyz"
            onChange={(e) => updateApiKey(e.target.value)}
            value={apiKey}
          />
        </label>
        <Button size="small" color={colors.black.lighter} type="submit">
          Load from AGM
        </Button>
      </form>
      {!loading && graphs && (
        <select
          onChange={(e) => {
            const [serviceId, graphVariant] = e.target.value.split(",");
            sendPartialSdlQuery({ variables: { serviceId, graphVariant } });
          }}
        >
          <option value="">select a graph</option>
          {graphs.me.memberships.map((membership: any) =>
            membership.account.services.map((service: any) => (
              <optgroup label={service.name} key={service.id}>
                {service.schemaTags.map((schemaTag: any) => (
                  <option
                    key={`${service.name}@${schemaTag.variant.name}`}
                    value={[service.name, schemaTag.variant.name]}
                  >
                    {schemaTag.variant.name}
                  </option>
                ))}
              </optgroup>
            ))
          )}
        </select>
      )}
    </>
  );
}
