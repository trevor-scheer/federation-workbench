import React, { Dispatch } from "react";
import { Action } from "./App";
import { Button } from "@apollo/space-kit/Button";

type Props = {
  dispatch: Dispatch<Action>;
  services: { [name: string]: string };
  shouldShowComposition: boolean;
};

export default function ServiceSelectors({
  dispatch,
  services,
  shouldShowComposition,
}: Props) {
  return (
    <>
      {Object.keys(services).map((name) => (
        <Button
          key={name}
          onClick={() => dispatch({ type: "selectService", payload: name })}
          style={{ marginBottom: "10px" }}
        >
          {name}
        </Button>
      ))}
      {shouldShowComposition && (
        <Button
          onClick={() =>
            dispatch({ type: "selectService", payload: "composed" })
          }
          style={{ marginBottom: "10px" }}
        >
          Composed
        </Button>
      )}
    </>
  );
}
