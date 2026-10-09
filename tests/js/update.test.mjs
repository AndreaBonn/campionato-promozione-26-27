import assert from "node:assert/strict";
import { test } from "node:test";

// A browser with a service worker container, in the order the spec runs the lifecycle:
// updatefound while the new worker is "installing", then registration.waiting is set and only
// after that the worker itself fires statechange "installed" (nothing fires on the registration).
class FakeWorker {
  constructor() {
    this.state = "installing";
    this.listeners = [];
    this.messages = [];
  }
  addEventListener(type, handler) {
    if (type === "statechange") this.listeners.push(handler);
  }
  postMessage(message) {
    this.messages.push(message);
  }
  setState(state) {
    this.state = state;
    this.listeners.forEach((handler) => handler());
  }
}

function element() {
  return { hidden: true, disabled: false, textContent: "", onclick: null };
}

function makeBrowser({ controlled, waiting = null }) {
  const calls = { reload: 0, update: 0 };
  const containerListeners = [];
  const documentListeners = [];
  const registrationListeners = [];
  const registration = {
    installing: null,
    waiting,
    update: async () => calls.update++,
    addEventListener: (type, handler) => type === "updatefound" && registrationListeners.push(handler),
  };
  const container = {
    controller: controlled ? new FakeWorker() : null,
    register: async () => registration,
    addEventListener: (type, handler) => type === "controllerchange" && containerListeners.push(handler),
  };
  const elements = { "update-notice": element(), "update-apply": element(), "update-later": element() };
  const doc = {
    visibilityState: "visible",
    getElementById: (id) => elements[id],
    addEventListener: (type, handler) => type === "visibilitychange" && documentListeners.push(handler),
  };
  const browser = {
    calls,
    registration,
    notice: elements["update-notice"],
    apply: elements["update-apply"],
    later: elements["update-later"],
    // a deploy found by registration.update(): the new worker installs and waits
    release() {
      const worker = new FakeWorker();
      registration.installing = worker;
      registrationListeners.forEach((handler) => handler());
      registration.waiting = worker;
      registration.installing = null;
      worker.setState("installed");
      return worker;
    },
    takeControl(worker) {
      container.controller = worker;
      containerListeners.forEach((handler) => handler());
    },
    goToBackground() {
      doc.visibilityState = "hidden";
      documentListeners.forEach((handler) => handler());
    },
    comeToForeground() {
      doc.visibilityState = "visible";
      documentListeners.forEach((handler) => handler());
    },
  };
  return { browser, globals: { container, doc, reload: () => calls.reload++ } };
}

let instance = 0;

// update.js wires itself on import: each page gets a fresh copy of the module.
async function openPage(options) {
  const { browser, globals } = makeBrowser(options);
  Object.defineProperty(globalThis, "navigator", {
    value: { serviceWorker: globals.container },
    configurable: true,
  });
  globalThis.document = globals.doc;
  globalThis.location = { reload: globals.reload };
  await import(`../../docs/update.js?page=${instance++}`);
  await settle();
  return browser;
}

const settle = () => new Promise((resolve) => setImmediate(resolve));

test("a release found while the app is open is announced once the new worker has installed", async () => {
  const browser = await openPage({ controlled: true });
  assert.equal(browser.notice.hidden, true);

  browser.release();

  assert.equal(browser.notice.hidden, false);
});

test("a version already waiting from a previous session is announced at startup", async () => {
  const browser = await openPage({ controlled: true, waiting: new FakeWorker() });

  assert.equal(browser.notice.hidden, false);
});

test("first visit: the first worker installing and taking control shows nothing and reloads nothing", async () => {
  const browser = await openPage({ controlled: false });

  const first = browser.release();
  browser.takeControl(first);

  assert.equal(browser.notice.hidden, true);
  assert.equal(browser.calls.reload, 0);

  // the same tab, now controlled, does announce and reload for the next release
  const second = browser.release();
  assert.equal(browser.notice.hidden, false);
  browser.takeControl(second);
  assert.equal(browser.calls.reload, 1);
});

test("Aggiorna hands over to the waiting worker and reloads only when it has taken control", async () => {
  const browser = await openPage({ controlled: true });
  const next = browser.release();

  browser.apply.onclick();

  assert.deepEqual(next.messages, [{ type: "SKIP_WAITING" }]);
  assert.equal(browser.apply.disabled, true);
  assert.equal(browser.calls.reload, 0);

  browser.takeControl(next);

  assert.equal(browser.calls.reload, 1);
});

test("a repeated control handover reloads the page once", async () => {
  const browser = await openPage({ controlled: true });
  const next = browser.release();
  browser.apply.onclick();

  browser.takeControl(next);
  browser.takeControl(next);

  assert.equal(browser.calls.reload, 1);
});

test("another tab accepting the update reloads this one too", async () => {
  const browser = await openPage({ controlled: true });
  const next = browser.release();

  browser.takeControl(next);

  assert.equal(browser.calls.reload, 1);
});

test("Più tardi hides the notice without applying, and reopening the app shows it again", async () => {
  const browser = await openPage({ controlled: true });
  const next = browser.release();

  browser.later.onclick();

  assert.equal(browser.notice.hidden, true);
  assert.deepEqual(next.messages, []);

  browser.goToBackground();
  browser.comeToForeground();

  assert.equal(browser.notice.hidden, false);
});

test("quick app switches do not ask the server again", async () => {
  const browser = await openPage({ controlled: true });
  assert.equal(browser.calls.update, 1);

  browser.goToBackground();
  browser.comeToForeground();
  browser.goToBackground();
  browser.comeToForeground();

  assert.equal(browser.calls.update, 1);
});
