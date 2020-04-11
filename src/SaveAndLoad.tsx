import React, { useState, Dispatch, useCallback } from "react";
import { Button } from "@apollo/space-kit/Button";
import { colors } from "@apollo/space-kit/colors";
import { Action } from "./App";
import { useDropzone, FileWithPath } from 'react-dropzone';
import "./SaveAndLoad.css";

type Props = {
  dispatch: Dispatch<Action>;
};

export default function SaveAndLoad({ dispatch }: Props) {
  const [serviceName, updateServiceName] = useState("");

  const onDrop = useCallback((acceptedFiles) => {
    acceptedFiles.forEach((file:FileWithPath) => {
    const reader = new FileReader()
    // We have to use a FileReader to get the contents of the file
    reader.onabort = () => console.warn('file reading was aborted');
    reader.onerror = () => console.warn('file reading has failed');
    reader.onload = () => {
        const textString = "" + reader.result;
        console.log(textString?.toString());
        // Try to load
        dispatch({type: "loadWorkbench", payload: textString});
        dispatch({type: "refreshComposition"});
    }
    reader.readAsText(file);
    
    })
    
}, []);

const FileUploadZone = function({ dispatch }: Props) {
    const {getRootProps, getInputProps} = useDropzone({
        accept: '.federationworkbench',
        onDrop
      });
      
    return (
      <section className="dropzone-container">
        <div {...getRootProps({className: 'dropzone-item'})}>
          <input {...getInputProps()} />
          <p>Load *.federationworkbench file</p>
        </div>
      </section>
    );
  }

  return (
    <>
      <form
        className="SaveAndLoad-form"
        onSubmit={(e) => {
          e.preventDefault();
          dispatch({
            type: "saveWorkbench",
            payload: serviceName,
          });
          updateServiceName("");
        }}
      >
        <label className="SaveAndLoad-label">
          Workbench Name
          <input
            className="SaveAndLoad-input"
            placeholder="Products"
            onChange={(e) => updateServiceName(e.target.value)}
            value={serviceName}
          />
        </label>
        <Button size="small" color={colors.black.lighter} type="submit">
          Save Workbench
        </Button>
        <hr/>
        <FileUploadZone dispatch={dispatch} />
      </form>
    </>
  );
}
