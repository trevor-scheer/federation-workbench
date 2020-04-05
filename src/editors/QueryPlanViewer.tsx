import React from "react";
import { ControlledEditor } from "@monaco-editor/react";

type Props = {
  queryPlan: string | undefined;
};

export default function QueryPlanViewer({ queryPlan }: Props) {
  return (
    <ControlledEditor
      height="50vh"
      theme="dark"
      language="graphql"
      value={queryPlan}
    />
  );
}
