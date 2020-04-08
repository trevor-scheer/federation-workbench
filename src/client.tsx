import {
  InMemoryCache,
  HttpLink,
  ApolloClient,
  ApolloLink,
} from "@apollo/client";
import { setContext } from "apollo-link-context";

const middlewareLink = new ApolloLink((operation, forward) => {
  return forward(operation);
});

const authLink = setContext(function (request, { headers }) {
  const apiKey = localStorage.getItem("workbenchApiKey");
  return {
    headers: {
      ...headers,
      "x-api-key": apiKey,
      "Access-Control-Allow-Origin": "*",
    },
  };
});

const httpLink = new HttpLink({
  uri: "https://engine-graphql.apollographql.com/api/graphql",
});

export const client = new ApolloClient({
  // @ts-ignore
  link: authLink.concat(middlewareLink.concat(httpLink)),
  cache: new InMemoryCache(),
});
