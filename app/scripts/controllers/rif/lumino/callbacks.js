import {CALLBACKS} from '@rsksmart/lumino-light-client-sdk/dist/utils/callbacks';
import EventEmitter from 'events';

export class LuminoCallbacks extends EventEmitter {

  callbackNames = Object.keys(CALLBACKS).map(callbackKey => CALLBACKS[callbackKey]);

  constructor (lumino) {
    super();
    this.lumino = lumino;
    this.callbackNames.forEach(callbackName => {
      this.lumino.callbacks.set(callbackName, this.resolveCallback(callbackName));
    });
  }

  resolveCallback (callbackName) {
    return (result, error) => {
      this.emit(callbackName, {
        result, error,
      });
    }
  }

  listenForCallback (callbackName) {
    return new Promise((resolve, reject) => {
      this.on(callbackName, (params) => {
        if (params.error) {
          return reject(params.error);
        }
        return resolve(params.result);
      });
    });
  }
}
