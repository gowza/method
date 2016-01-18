/*jslint
  node: true,
  browser: true,
  indent: 2
*/

"use strict";

if (!Array.from) {
  Array.from = function (arrayLike) {
    return [].slice.call(arrayLike, 0);
  };
}

exports.callback = Symbol("callback");

Function.prototype[exports.callback] = function (options) {
  var originalFunction = this,

    // The time limit starts now
    boundTime = Date.now(),

    // There is no time limit by default
    timeLimit = Infinity,

    // A callback intuitively should only be called once 
    invocationLimit = 1,

    // This array will be arguments to be curried
    boundArguments = [],

    // needed for clearTimeout incase more time is requested
    onTimeoutHandle,

    // Throws errors by default
    failSilently = false,

    // Delay invocation
    delay = 0,

    scope;

  // This is the handler for any invocations
  function callback() {
    var callbackArguments = Array.from(arguments);

    clearTimeout(onTimeoutHandle);

    if (scope === undefined) {
      scope = this;
    }

    // Check the invocation limit
    invocationLimit -= 1;

    if (invocationLimit < 0) {
      if (failSilently) {
        return;
      }

      throw new Error("Function surpassed invocation limit");
    }

    // Check the time limit
    if (Date.now() > (boundTime + timeLimit)) {
      if (failSilently) {
        return;
      }

      throw new Error("Function timed out and was invoked");
    }

    // Invoke if its all good
    if (delay === 0) {
      return originalFunction.apply(scope, boundArguments.concat(callbackArguments));
    }

    setTimeout(function () {
      originalFunction.apply(scope, boundArguments.concat(callbackArguments));
    }, delay);
  }

  // If timer mode is enabled, this method gets attatched
  function extendTimeout(extraTime) {
    // Check the time limit
    if (Date.now() > (boundTime + timeLimit)) {
      if (failSilently) {
        return;
      }

      throw new Error("Function timed out before extendTimeout()");
    }

    console.log("extendTimeout():\n" + originalFunction.toString());

    // Extend the time
    timeLimit = extraTime;
    boundTime = Date.now();

    // Refresh any timers
    if (options.onTimeout) {
      clearTimeout(onTimeoutHandle);
      onTimeoutHandle = setTimeout(options.onTimeout, timeLimit);
    }
  }

  // If there is no options, it's as simple as a limit to one invocation
  if (!options) {
    return callback;
  }

  if (options instanceof Array) {
    boundArguments = options;
  } else if (typeof options === 'number') {
    invocationLimit = options;
  } else {
    if (options.hasOwnProperty('arguments')) {
      boundArguments = options.arguments;
    }

    if (options.scope !== undefined) {
      scope = options.scope;
    }

    if (options.failSilently === true) {
      failSilently = true;
    }

    if (typeof options.timeLimit === 'number') {
      timeLimit = options.timeLimit;

      if (!options.noExtendTimeout) {
        callback.extendTimeout = extendTimeout;
      }

      if (typeof options.onTimeout === 'function') {
        onTimeoutHandle = setTimeout(options.onTimeout, timeLimit);
      }
    }
  }

  return callback;
};

exports.throttle = Symbol("throttle");

Function.prototype[exports.throttle] = function throttle(threshhold) {
  var func = this,
    deferTimer,
    last;

  if (!threshhold) {
    threshhold = 250;
  }

  return function () {
    var self = this,
      now = Date.now(),
      args = arguments;

    // If never invoked, or last invocation was further behind on the threshold
    if (
      !last ||
        now - threshhold > last
    ) {
      last = now;
      return func.apply(self, args);
    }

    // Set the current invocation to be 
    if (deferTimer) {
      return;
    }

    deferTimer = setTimeout(function () {
      deferTimer = null;
      last = Date.now();
      func.apply(self, args);
    }, threshhold + last - now);
  };
};

exports.debounce = Symbol("debounce");

Function.prototype[exports.debounce] = function debounce(delay) {
  var timer = null,
    func = this;

  return function () {
    var self = this,
      args = arguments;

    clearTimeout(timer);

    timer = setTimeout(function () {
      func.apply(self, args);
    }, delay || 250);
  };
};
