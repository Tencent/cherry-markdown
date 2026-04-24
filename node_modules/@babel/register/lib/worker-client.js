var _WorkerClient, _worker, _signal;
function _classPrivateGetter(s, r, a) { return a(_assertClassBrand(s, r)); }
function _classPrivateFieldInitSpec(obj, privateMap, value) { _checkPrivateRedeclaration(obj, privateMap); privateMap.set(obj, value); }
function _checkPrivateRedeclaration(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }
function _classPrivateFieldGet(s, a) { return s.get(_assertClassBrand(s, a)); }
function _classPrivateFieldSet(s, a, r) { return s.set(_assertClassBrand(s, a), r), r; }
function _assertClassBrand(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
const path = require("path");
const ACTIONS = {
  GET_DEFAULT_EXTENSIONS: "GET_DEFAULT_EXTENSIONS",
  SET_OPTIONS: "SET_OPTIONS",
  TRANSFORM: "TRANSFORM",
  TRANSFORM_SYNC: "TRANSFORM_SYNC"
};
var _send = new WeakMap();
var _eCache = new WeakMap();
class Client {
  constructor(send) {
    _classPrivateFieldInitSpec(this, _send, void 0);
    _classPrivateFieldInitSpec(this, _eCache, void 0);
    _classPrivateFieldSet(_send, this, send);
  }
  getDefaultExtensions() {
    var _classPrivateFieldGet2;
    return (_classPrivateFieldGet2 = _classPrivateFieldGet(_eCache, this)) != null ? _classPrivateFieldGet2 : _classPrivateFieldSet(_eCache, this, _classPrivateFieldGet(_send, this).call(this, ACTIONS.GET_DEFAULT_EXTENSIONS, undefined));
  }
  setOptions(options) {
    return _classPrivateFieldGet(_send, this).call(this, ACTIONS.SET_OPTIONS, options);
  }
  transform(code, filename) {
    return _classPrivateFieldGet(_send, this).call(this, ACTIONS.TRANSFORM, {
      code,
      filename
    });
  }
}
exports.WorkerClient = (_worker = new WeakMap(), _signal = new WeakMap(), _WorkerClient = class WorkerClient extends Client {
  constructor() {
    super((action, payload) => {
      _classPrivateFieldGet(_signal, this)[0] = 0;
      const subChannel = new (_classPrivateGetter(_WorkerClient, WorkerClient, _get_worker_threads).MessageChannel)();
      _classPrivateFieldGet(_worker, this).postMessage({
        signal: _classPrivateFieldGet(_signal, this),
        port: subChannel.port1,
        action,
        payload
      }, [subChannel.port1]);
      Atomics.wait(_classPrivateFieldGet(_signal, this), 0, 0);
      const {
        message
      } = _classPrivateGetter(_WorkerClient, WorkerClient, _get_worker_threads).receiveMessageOnPort(subChannel.port2);
      if (message.error) throw Object.assign(message.error, message.errorData);else return message.result;
    });
    _classPrivateFieldInitSpec(this, _worker, new (_classPrivateGetter(_WorkerClient, WorkerClient, _get_worker_threads).Worker)(path.resolve(__dirname, "./worker/index.js"), {
      env: _classPrivateGetter(_WorkerClient, WorkerClient, _get_markInRegisterWorker).call(WorkerClient, process.env)
    }));
    _classPrivateFieldInitSpec(this, _signal, new Int32Array(new SharedArrayBuffer(4)));
    _classPrivateFieldGet(_worker, this).unref();
  }
});
function _get_worker_threads(_this) {
  return require("worker_threads");
}
function _get_markInRegisterWorker(_this2) {
  return require("./is-in-register-worker.js").markInRegisterWorker;
}
{
  var _LocalClient, _handleMessage;
  exports.LocalClient = (_LocalClient = class LocalClient extends Client {
    constructor() {
      var _assertClassBrand$_;
      (_assertClassBrand$_ = _assertClassBrand(_LocalClient, LocalClient, _handleMessage)._) != null ? _assertClassBrand$_ : _handleMessage._ = _assertClassBrand(_LocalClient, LocalClient, require("./worker/handle-message.js"));
      super((action, payload) => {
        return _assertClassBrand(_LocalClient, LocalClient, _handleMessage)._.call(LocalClient, action === ACTIONS.TRANSFORM ? ACTIONS.TRANSFORM_SYNC : action, payload);
      });
      this.isLocalClient = true;
    }
  }, _handleMessage = {
    _: void 0
  }, _LocalClient);
}

//# sourceMappingURL=worker-client.js.map
