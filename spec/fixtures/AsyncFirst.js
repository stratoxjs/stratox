// Loaded by spec/stratox-async.spec.js through the "directory" config.
import { html } from '../../src/index.js';

globalThis.asyncFirstLoads = (globalThis.asyncFirstLoads ?? 0) + 1;

export default function AsyncFirst({ props }) {
  return html`<first>${props.text}</first>`;
}
