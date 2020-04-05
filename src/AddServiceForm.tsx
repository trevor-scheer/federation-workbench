import React, { useState, Dispatch } from "react";
import { Button } from "@apollo/space-kit/Button";
import { colors } from "@apollo/space-kit/colors";
import { Action } from "./App";
import "./AddServiceForm.css";

type Props = {
  dispatch: Dispatch<Action>;
};

export default function AddServiceForm({ dispatch }: Props) {
  const [serviceName, updateServiceName] = useState("");

  return (
    <>
      <form
        className="AddServiceForm-form"
        onSubmit={(e) => {
          e.preventDefault();
          dispatch({
            type: "addService",
            payload: { name: serviceName },
          });
          updateServiceName("");
        }}
      >
        <label className="AddServiceForm-label">
          Service name
          <input
            className="AddServiceForm-input"
            placeholder="Products"
            onChange={(e) => updateServiceName(e.target.value)}
            value={serviceName}
          />
        </label>
        <Button size="small" color={colors.black.lighter} type="submit">
          Add service
        </Button>
      </form>
    </>
  );
}
