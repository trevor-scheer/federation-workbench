import { GraphQLError, printSchema } from "graphql";
import { ServiceDefinition, composeAndValidate } from "@apollo/federation";
import gql from "graphql-tag";

// TODO Fully type these payloads-responses and WebWorkers

export default () => {
  // @ts-ignore
  // eslint-disable-next-line no-restricted-globals
  self.addEventListener("message", 
  // @ts-ignore
  (_: Window, e: MessageEvent) => {
      let compositionErrors: GraphQLError[] | undefined = undefined;
      try {
        const sdls = Object.entries(e.data.services).reduce(
          (serviceDefs, [name, typeDefs]) => {
              // @ts-ignore
            serviceDefs.push({ name, typeDefs: gql(typeDefs) });
            return serviceDefs;
          },
          [] as ServiceDefinition[]
        );
        const { schema, errors} = composeAndValidate(sdls);
        // @ts-ignore
        postMessage(
          {
            composition: {
              schema,
              printed: printSchema(schema),
            },
            compositionErrors: errors
          }
        );
      } catch {}
    }
  )
}