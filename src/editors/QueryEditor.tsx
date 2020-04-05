import React, { Dispatch } from "react";
import { ControlledEditor } from "@monaco-editor/react";
import { Action } from "../App";

type Props = {
  dispatch: Dispatch<Action>;
  query: string | undefined;
};

export default function QueryEditor({ dispatch, query }: Props) {
  return (
    <div className="QueryEditor">
      <ControlledEditor
        height="50vh"
        theme="dark"
        value={query}
        onChange={(_, value) =>
          dispatch({ type: "updateQuery", payload: value || "" })
        }
        language="graphql"
      />
    </div>
  );
}
