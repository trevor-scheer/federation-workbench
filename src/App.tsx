import React, { useReducer, Reducer, Fragment } from "react";
import gql from "graphql-tag";
import { GraphQLSchema, GraphQLError } from "graphql";
import {
  // composeAndValidate,
  composeServices,
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
import SaveAndLoad from "./SaveAndLoad";

export type Action =
  | { type: "addService"; payload: { name: string } }
  | { type: "selectService"; payload: string }
  | { type: "updateService"; payload: { name: string; value: string } }
  | { type: "updateQuery"; payload: string }
  | { type: "loadWorkbench"; payload: string | undefined }
  | { type: "refreshComposition" }
  | { type: "loadFromAGM"; payload: { services: { [name: string]: string } } };

export type State = {
  services: { [name: string]: string };
  selectedService: string | undefined;
  composition: {
    schema: GraphQLSchema | undefined;
    printed: string;
  };
  query: string | undefined;
  queryPlan: string;
  compositionErrors?: GraphQLError[] | undefined;
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
        const { schema, errors } = composeServices(sdls);
        composition = {
          schema,
          printed: printSchema(schema),
        };
        // TODO: Handle these in the UI
        // if (warnings && warnings.length) {
        //   console.warn("[Composition Warnings]");
        //   console.dir(warnings);
        //   composition = {
        //     schema: undefined,
        //     printed: "",
        //   };
        // }
        if (errors && errors.length) {
          compositionErrors = errors;
          console.error("[Composition Errors]");
          console.dir(errors);
          composition = {
            schema: undefined,
            printed: "",
          };
        }
      } catch (compositionException) {
        console.error("[Composition Exception]", compositionException instanceof GraphQLError);
        console.dir(compositionException);
        composition = {
          schema: undefined,
          printed: "",
        };
        if (compositionException instanceof GraphQLError) {
          compositionErrors = [compositionException];
        } else {
          compositionErrors = [new GraphQLError( compositionException.message)];
        }
      }

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
      let queryErrors: GraphQLError[] | undefined;

      try {
        queryAST = gql(action.payload);
      } catch (queryASTException) {
        console.error("[Query Exception]");
        console.dir(queryASTException);
      }

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
        } catch (queryPlanException) {
          console.error("[Query Plan Exception]");
          console.dir(queryPlanException);
          queryErrors = [queryPlanException]
        }
      }

      return {
        ...state,
        query: action.payload,
        queryPlan,
        compositionErrors: queryErrors
      };
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
  });
  // Separated during debug for clarity
  const { services, selectedService, composition, query, queryPlan } = appState;

  return (
    <ApolloProvider client={client}>
      <div className="App">
        <div
          className="status-bar"
          style={{
            display: "flex",
            flexDirection: "row",
            height: "10vh",
            color: "white",
          }}
        >
          {appState.compositionErrors?.map((item) => (
            <Fragment>
              <p>
                {item.message} on{" "}
                {item.locations
                  ?.map((location) => `line ${location.line || "unknown"}, col ${location.column || "unknown"}`)
                  .join(",")}
              </p>
            </Fragment>
          ))}
        </div>
        <div
          className="App-root"
          style={{ display: "flex", flexDirection: "row", height: "90vh" }}
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
            <SaveAndLoad dispatch={dispatch} appState={appState} />
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
