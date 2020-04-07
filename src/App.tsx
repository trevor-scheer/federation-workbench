import React, { useReducer, Reducer } from "react";
import gql from "graphql-tag";
import { GraphQLSchema } from "graphql";
import {
  composeAndValidate,
  printSchema,
  ServiceDefinition,
} from "@apollo/federation";
import {
  buildQueryPlan,
  buildOperationContext,
} from "@apollo/gateway/dist/buildQueryPlan";
import { serializeQueryPlan } from "@apollo/gateway/dist/QueryPlan";
import { ApolloProvider } from "@apollo/client";
import QueryEditor from "./editors/QueryEditor";
import ServiceEditors from "./editors/ServiceEditors";
import QueryPlanViewer from "./editors/QueryPlanViewer";
import AddServiceForm from "./AddServiceForm";
import ServiceSelectors from "./ServiceSelectors";
import LoadFromAgm from "./LoadFromAgm";

import "./App.css";
import { client } from "./client";

export type Action =
  | { type: "addService"; payload: { name: string } }
  | { type: "selectService"; payload: string }
  | { type: "updateService"; payload: { name: string; value: string } }
  | { type: "updateQuery"; payload: string };

type State = {
  services: { [name: string]: string };
  selectedService: string | undefined;
  composition: {
    schema: GraphQLSchema | undefined;
    printed: string;
  };
  query: string | undefined;
  queryPlan: string;
};

const reducer: Reducer<State, Action> = (state, action) => {
  switch (action.type) {
    case "addService": {
      const selectedService = state.selectedService || action.payload.name;
      return {
        ...state,
        selectedService,
        services: {
          ...state.services,
          [action.payload.name]: "",
        },
      };
    }
    case "selectService": {
      return {
        ...state,
        selectedService: action.payload,
      };
    }
    case "updateService": {
      let composition = state.composition;

      const nextState = {
        ...state,
        services: {
          ...state.services,
          [action.payload.name]: action.payload.value,
        },
      };

      try {
        const sdls = Object.entries(nextState.services).reduce(
          (serviceDefs, [name, typeDefs]) => {
            serviceDefs.push({ name, typeDefs: gql(typeDefs) });
            return serviceDefs;
          },
          [] as ServiceDefinition[]
        );
        const { schema, errors } = composeAndValidate(sdls);
        composition = {
          schema,
          printed: printSchema(schema),
        };
      } catch {}

      return {
        ...nextState,
        composition,
      };
    }
    case "updateQuery": {
      let queryPlan = "";
      let queryAST;

      try {
        queryAST = gql(action.payload);
      } catch {}

      if (queryAST && state.composition.schema) {
        const context = buildOperationContext(
          state.composition.schema,
          queryAST
        );
        try {
          const queryPlanAST = buildQueryPlan(context);
          if (queryPlanAST) {
            queryPlan = serializeQueryPlan(queryPlanAST);
          }
        } catch {}
      }

      return {
        ...state,
        query: action.payload,
        queryPlan,
      };
    }
  }
};

function App() {
  const [
    { services, selectedService, composition, query, queryPlan },
    dispatch,
  ] = useReducer<typeof reducer>(reducer, {
    services: {},
    selectedService: undefined,
    composition: {
      schema: undefined,
      printed: "",
    },
    query: "",
    queryPlan: "",
  });

  return (
    <ApolloProvider client={client}>
      <div className="App">
        <div
          className="App-root"
          style={{ display: "flex", flexDirection: "row", height: "100vh" }}
        >
          <div
            className="App-serviceSelector monaco-editor-background"
            style={{
              display: "flex",
              flexDirection: "column",
              width: "15%",
              border: "1px solid black",
              padding: "10px",
              backgroundColor: "rgb(23,43,58)",
            }}
          >
            <LoadFromAgm dispatch={dispatch} />
            <AddServiceForm dispatch={dispatch} />
            <ServiceSelectors
              dispatch={dispatch}
              services={services}
              shouldShowComposition={!!composition.printed}
            />
          </div>
          <ServiceEditors
            selectedService={selectedService}
            composition={composition.printed}
            services={services}
            dispatch={dispatch}
          />
          <div
            className="App-queryWrapper"
            style={{ display: "flex", flexDirection: "column", width: "35%" }}
          >
            <QueryEditor dispatch={dispatch} query={query} />
            <QueryPlanViewer queryPlan={queryPlan} />
          </div>
        </div>
      </div>
    </ApolloProvider>
  );
}

export default App;
