import React, { Dispatch } from "react";
import { ControlledEditor,  } from "@monaco-editor/react";
import { Action } from "../App";
import "./ServiceEditors.css";
import { debounce } from "../utils/debounce";

type Props = {
  dispatch: Dispatch<Action>;
  services: { [name: string]: string };
  selectedService: string | undefined;
  composition: string | undefined;
};

const updateService = debounce((dispatch: Dispatch<Action>, e: Event, name: string, value: any) => {
  console.log("Updating service...");
  dispatch({
    type: "updateService",
    payload: { name, value: value || "" },
  });
  //TODO: Debounce within Debounce? 🤔
  dispatch({
    type: 'refreshComposition'
  })
}, 2000);

export default function ServiceEditors({
  dispatch,
  services,
  selectedService,
  composition,
}: Props) {
  return (
    <div className="ServiceEditors-editors" style={{ width: "50%" }}>
      {Object.entries(services).map(([name, value]) => (
        <div
          key={name}
          className={`ServiceEditors-monacoInstance ${
            name === selectedService ? "is-active" : ""
          }`}
        >
          <h3>{name}</h3>
          <ControlledEditor
            height="100vh"
            theme="dark"
            value={value}
            onChange={(e, value) => {
              updateService(dispatch, e, name, value);
            }}
            language="graphql"
          />
        </div>
      ))}
      <div
        style={{ display: "flex", flexDirection: "column" }}
        className={`ServiceEditors-monacoInstance ${
          "composed" === selectedService ? "is-active" : ""
        }`}
      >
        <h3>Composed Schema</h3>
        <ControlledEditor
          height="100vh"
          theme="dark"
          language="graphql"
          value={composition}
          // TODO: this editor should be read-only. For breadcrumbs, the below worked previously.
          // editorDidMount={(_: any, editor: any) => {
          //   editor.updateOptions({ readOnly: true });
          // }}
        />
      </div>
    </div>
  );
}
