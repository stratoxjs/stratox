// Loaded by spec/stratox-async.spec.js through the "directory" config.
globalThis.asyncFirstLoads = (globalThis.asyncFirstLoads ?? 0) + 1;

export default function AsyncFirst({ props }) {
  return `<first>${props.text}</first>`;
}
