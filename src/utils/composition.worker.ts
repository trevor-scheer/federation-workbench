import { printSchema } from "graphql";
import { ServiceDefinition, composeAndValidate } from "@apollo/federation";
import gql from "graphql-tag";

// TODO Fully type these payloads-responses and WebWorkers
const ctx: Worker = self as any;

const handleCompositionRequest = (e: MessageEvent) => {
  console.log("[worker][handleCompositionRequest]", Date.now());
  try {
    const sdls = Object.entries(e.data.services).reduce(
      (serviceDefs, [name, typeDefs]) => {
        // @ts-ignore
        serviceDefs.push({ name, typeDefs: gql(typeDefs) });
        return serviceDefs;
      },
      [] as ServiceDefinition[]
    );
    const { schema, errors } = composeAndValidate(sdls);

    ctx.postMessage({
      composition: {
        printed: printSchema(schema),
      },
      compositionErrors: errors,
    });
  } catch (e) {
    ctx.postMessage({
      composition: {
        schema: undefined,
        printed: "",
      },
      compositionErrors: undefined,
    });
    console.error(e);
  }
};

ctx.addEventListener("message", handleCompositionRequest);
