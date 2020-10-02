import React from 'react';

export function getLoader (message) {
  return (
    <div>
      <h4 className="app-loader-message">{message}</h4>
      <div className="app-loader"/>
    </div>
  );
}

export function getBlockUiMessage (message) {
  return (<div className="block-ui-message"><div>{message}</div></div>);
}