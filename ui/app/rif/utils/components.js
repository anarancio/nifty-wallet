import React from 'react';

export function getLoader (message) {
  return (
    <div>
      <h4 className="app-loader-message">{message}</h4>
      <div className="app-loader"/>
    </div>
  );
}
