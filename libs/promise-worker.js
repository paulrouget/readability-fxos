/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

if (typeof importScripts === "function") {
  // In the worker

  this.WorkerWrapper = function(workerOrPort, object) {
    workerOrPort.addEventListener("message", e => {
      var method = e.data.method;
      var options = e.data.options;
      var uuid = e.data.uuid;

      if (!(method in object)) {
        workerOrPort.postMessage({
          uuid: uuid,
          isError: true,
          errorMessage: "no such method"
        });
      }

      try {
        var promise = object[method].call(null, options);
      } catch(e) {
        workerOrPort.postMessage({
          uuid: uuid,
          isError: true,
          errorMessage: "" + e
        });
        return;
      }
      if (!(promise instanceof Promise)) {
        promise = Promise.resolve(promise);
      }
      promise.then((res) => {
        workerOrPort.postMessage({
          uuid: uuid,
          result: res
        });
      }, (e) => {
        workerOrPort.postMessage({
          uuid: uuid,
          isError: true,
          errorMessage: e
        });
      });
    })
  };

} else {
  // In the window

  this.WorkerWrapper = function(workerOrPort) {
    var pending = new Map();

    workerOrPort.addEventListener("message", e => {
      // console.log("client", "<", e.data);
      var uuid = e.data.uuid;
      if (!uuid) {
        return;
      }
      var promise = pending.get(uuid);
      if (promise) {
        if (e.data.isError) {
          promise.reject(e.data.errorMessage);
        } else {
          promise.resolve(e.data.result);
        }
        pending.delete(uuid);
      } else {
        console.warn("Unexpected message: " + e.data);
      }
    });

    var handler = {
      get: function(proxy, name) {
        return options => {
          var uuid = Math.random();

          var data = {
            method: name,
            options: options,
            uuid: uuid
          };
          // console.log("client", ">", data);

          var p = new Promise(function(resolve, reject) {
            pending.set(uuid, {resolve:resolve,reject:reject});
            workerOrPort.postMessage(data);
          });
          return p;
        };
      }
    };

    return (new Proxy({}, handler));
  }
}
