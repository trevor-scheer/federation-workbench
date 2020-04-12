import React, { useReducer, Reducer } from "react";
import gql from "graphql-tag";
import { GraphQLSchema, GraphQLError } from "graphql";
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
import FileSaver from "file-saver";
import SaveAndLoad from "./SaveAndLoad";

interface WorkerCompositionResult {
  composition: {
    schema: GraphQLSchema | undefined;
    printed: string;
  };
  compositionErrors?: GraphQLError[] | undefined;
}

export type Action =
  | { type: "addService"; payload: { name: string } }
  | { type: "selectService"; payload: string }
  | { type: "updateService"; payload: { name: string; value: string } }
  | { type: "updateQuery"; payload: string }
  | { type: "saveWorkbench"; payload: string | undefined }
  | { type: "loadWorkbench"; payload: string | undefined }
  | { type: "refreshComposition" }
  | { type: "loadFromAGM"; payload: { services: { [name: string]: string } } };

type State = {
  services: { [name: string]: string };
  selectedService: string | undefined;
  composition: {
    schema: GraphQLSchema | undefined;
    printed: string;
  };
  query: string | undefined;
  queryPlan: string;
  compositionErrors?: GraphQLError[] | undefined;
  compositionBusy: boolean;
};

const reducer: Reducer<State, Action> = (state, action) => {
  switch (action.type) {
    case "addService": {
      // Exit on blank-ish service name (EMOJIIS WORK, THOUGH 👍)
      if (action.payload.name.trim().length === 0) return state;
      const selectedService = state.selectedService || action.payload.name;
      return {
        ...state,
        selectedService,
        services: {
          ...state.services,
          [action.payload.name.trim()]: "",
        },
      };
    }
    case "selectService": {
      return {
        ...state,
        selectedService: action.payload,
      };
    }
    case "refreshComposition": {
      let composition = state.composition;
      let compositionErrors: GraphQLError[] | undefined = undefined;
      try {
        const sdls = Object.entries(state.services).reduce(
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
        // TODO: Handle these in the UI
        if (errors && errors.length) compositionErrors = errors;
      } catch {}

      return {
        ...state,
        composition,
        compositionErrors,
      };
    }
    case "updateService": {
      // let composition = state.composition;

      return {
        ...state,
        services: {
          ...state.services,
          [action.payload.name]: action.payload.value,
        },
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
    case "saveWorkbench": {
      let serializedState = "";
      try {
        serializedState = JSON.stringify(state);
      } catch (e) {
        alert(`Unable to save Workbench due to ${e}`);
        console.error(e);
        return state;
      }
      // Okay, we have a serializeable Redux store.
      const blob = new Blob([serializedState], {
        type: "text/plain;charset=utf-8",
      });
      FileSaver.saveAs(
        blob,
        `${
          (action.payload ? action.payload : "Workbench") + "-" + Date.now()
        }.federationworkbench`
      );
      return state;
    }
    case "loadWorkbench": {
      // TODO alert on invalid file
      if (!action.payload || action.payload.toString().length === 0)
        return state;
      let hopefullyValidState: State | string = "";
      try {
        hopefullyValidState = JSON.parse(action.payload) as State;
      } catch (e) {
        alert(`Unable to load Workbench due to ${e}`);
        console.error(e);
        return state;
      }
      // Okay, we have a serializeable Redux store.

      return { ...state, ...hopefullyValidState };
    }
    case "loadFromAGM": {
      return {
        ...state,
        query: undefined,
        queryPlan: "",
        selectedService: undefined,
        services: action.payload.services,
      };
    }
  }
};

function App() {
  const [appState, dispatch] = useReducer<typeof reducer>(reducer, {
    services: {},
    selectedService: undefined,
    composition: {
      schema: undefined,
      printed: "",
    },
    query: "",
    queryPlan: "",
    compositionBusy: false,
  });
  // Separated during debug for clarity
  const { services, selectedService, composition, query, queryPlan } = appState;

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
            <hr />
            <AddServiceForm dispatch={dispatch} />
            <hr />
            <ServiceSelectors
              dispatch={dispatch}
              services={services}
              shouldShowComposition={!!composition.printed}
            />
            <hr />
            <SaveAndLoad dispatch={dispatch} />
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
