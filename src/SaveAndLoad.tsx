import React, { useState, Dispatch, useCallback } from "react";
import { Button } from "@apollo/space-kit/Button";
import { colors } from "@apollo/space-kit/colors";
import { Action, State } from "./App";
import { useDropzone, FileWithPath } from "react-dropzone";
import "./SaveAndLoad.css";
import FileSaver from "file-saver";

type Props = {
  dispatch: Dispatch<Action>;
  appState: State;
};

type FileUploadZoneProps = {
  dispatch: Dispatch<Action>;
}

// TODO: Refactor into separate file some day
const FileUploadZone = function ({ dispatch }: FileUploadZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles) => {
      acceptedFiles.forEach((file: FileWithPath) => {
        const reader = new FileReader();
        // We have to use a FileReader to get the contents of the file
        reader.onabort = () => console.warn("file reading was aborted");
        reader.onerror = () => console.warn("file reading has failed");
        reader.onload = () => {
          const textString = "" + reader.result;
          console.log(textString?.toString());
          // Try to load
          dispatch({ type: "loadWorkbench", payload: textString });
          dispatch({ type: "refreshComposition" });
        };
        reader.readAsText(file);
      });
    },
    [dispatch]
  );
  const { getRootProps, getInputProps } = useDropzone({
    accept: ".federationworkbench",
    onDrop,
  });

  return (
    <section className="dropzone-container">
      <div {...getRootProps({ className: "dropzone-item" })}>
        <input {...getInputProps()} />
        <p>Load *.federationworkbench file</p>
      </div>
    </section>
  );
};

const saveState = (fileName: string, stateToSave: State) => {
  let serializedState = "";
  try {
    serializedState = JSON.stringify(stateToSave);
  } catch (e) {
    alert(`Unable to save Workbench due to ${e}`);
    console.error(e);
  }
  // Okay, we have a serializeable Redux store.
  const blob = new Blob([serializedState], {
    type: "text/plain;charset=utf-8",
  });
  FileSaver.saveAs(
    blob,
    `${
      (fileName ? fileName : "Workbench") + "-" + Date.now()
    }.federationworkbench`
  );
};

export default function SaveAndLoad({ dispatch, appState }: Props) {
  const [fileName, updateFileName] = useState("");

  return (
    <>
      <form
        className="SaveAndLoad-form"
        onSubmit={(e) => {
          e.preventDefault();
          saveState(fileName, appState);
        }}
      >
        <label className="SaveAndLoad-label">
          Workbench Name
          <input
            className="SaveAndLoad-input"
            placeholder="Products"
            onChange={(e) => updateFileName(e.target.value)}
            value={fileName}
          />
        </label>
        <Button size="small" color={colors.black.lighter} type="submit">
          Save Workbench
        </Button>
        <hr />
        <FileUploadZone dispatch={dispatch} />
      </form>
    </>
  );
}
