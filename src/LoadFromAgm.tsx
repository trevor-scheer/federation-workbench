import React, { useState, Dispatch, useEffect } from "react";
import { Button } from "@apollo/space-kit/Button";
import { colors } from "@apollo/space-kit/colors";
import { Action } from "./App";
import "./LoadFromAgm.css";
import { useLazyQuery, gql } from "@apollo/client";

type Props = {
  dispatch: Dispatch<Action>;
};

const variantsQuery = gql`
  query TrevorDoingStuff {
    me {
      ... on Service {
        createdAt
        schemaTags {
          variant {
            name
            id
          }
        }
      }
    }
  }
`;

const partialSdlQuery = gql`
  query Trevor2($graphVariant: String!) {
    me {
      ... on Service {
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
  }
`;

export default function LoadFromAgm({ dispatch }: Props) {
  const [apiKey, updateApiKey] = useState("");

  useEffect(() => {
    const keyFromStorage = localStorage.getItem("workbenchApiKey");
    if (keyFromStorage) updateApiKey(keyFromStorage);
  }, []);

  const [sendVariantsQuery, variantResponse] = useLazyQuery(variantsQuery);
  const [sendPartialSdlQuery, sdlResponse] = useLazyQuery(partialSdlQuery);

  useEffect(() => {
    console.log("effect!");
    if (sdlResponse.data) {
      console.log(sdlResponse.data);
      for (const {
        name,
        activePartialSchema: { sdl },
      } of sdlResponse.data.me.implementingServices.services) {
        dispatch({ type: "addService", payload: { name } });
        dispatch({ type: "updateService", payload: { name, value: sdl } });
        dispatch({ type: "refreshComposition"});
      }
    }
  }, [sdlResponse]);

  return (
    <>
      <form
        className="LoadFromAgm-form"
        onSubmit={(e) => {
          e.preventDefault();
          localStorage.setItem("workbenchApiKey", apiKey);
          sendVariantsQuery();
        }}
      >
        <label className="LoadFromAgm-label">
          Service API Key
          <input
            className="LoadFromAgm-input"
            placeholder="service:xyz"
            onChange={(e) => updateApiKey(e.target.value)}
            value={apiKey}
          />
        </label>
        <Button size="small" color={colors.black.lighter} type="submit">
          Load from AGM
        </Button>
      </form>
      {!variantResponse.loading && variantResponse.data?.me && (
        <select
          onChange={(e) => {
            console.log("change", e.target.value);
            sendPartialSdlQuery({
              variables: { graphVariant: e.target.value },
            });
          }}
        >
          <option value="">select a variant</option>
          {variantResponse.data.me.schemaTags.map(({ variant }: any) => (
            <option value={variant.name} key={variant.id}>
              {variant.name}
            </option>
          ))}
        </select>
      )}
    </>
  );
}
