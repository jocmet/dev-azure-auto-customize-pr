import browser from 'webextension-polyfill';
import {Message, State} from './common';

const dropEventName = 'ad099b39-73ad-466b-a999-a0ed8978306c';
document.dispatchEvent(new CustomEvent(dropEventName));

const observer = new window.MutationObserver(execute);
observer.observe(document.body, {childList: true, subtree: true});
document.addEventListener(dropEventName, shutdown, {once: true});

let state: undefined | State;
setState('-');

let intervallId = 0;

function execute(): void {
  const nextState = next();
  setState(nextState);
  if (state !== 'dg') {
    stopIntervall();
  }
}

function next(): State {
  if (!pullrequest()) return '-';
  const dialog = modalDialog();
  if (dialog === undefined) return 'pr';
  if (state == 'rm') return 'rm';
  if (checkbox(dialog) && inputTitle(dialog)) return 'rm';
  startIntervall();
  return 'dg';
}

function setState(value: State): void {
  if (value === state) return;
  state = value;
  const message: Message = {command: 'set-state', state};
  browser.runtime.sendMessage(message).catch(() => observer.disconnect());
}

function pullrequest(): boolean {
  const pattern = /^\/([^/]+)\/([^/]+)\/_git\/([^/]+)\/pullrequest\/([0-9]+)$/i;
  return pattern.test(window.location.pathname);
}

function modalDialog(): HTMLDivElement | undefined {
  const selector = "div[role='dialog'][aria-modal='true'][aria-labelledby]";
  const dialogs = document.querySelectorAll<HTMLDivElement>(selector);
  for (const dialog of dialogs) {
    const headingId = dialog.getAttribute('aria-labelledby');
    if (!headingId) continue;
    const headingNode = document.getElementById(headingId);
    if (!headingNode) continue;
    const heading = headingNode.innerText;
    if (heading === 'Enable automatic completion' || heading === 'Complete pull request') {
      return dialog;
    }
  }
  return undefined;
}

function checkbox(dialog: HTMLElement): boolean {
  const selector = "div[role='checkbox'][aria-checked]";
  const checkboxes = dialog.querySelectorAll<HTMLDivElement>(selector);
  for (const checkbox of checkboxes) {
    if (checkbox.innerText !== 'Customize merge commit message') continue;
    const checked = checkbox.getAttribute('aria-checked');
    if (checked === 'true') return true;
    checkbox.click();
    return false;
  }
  return false;
}

function inputTitle(dialog: HTMLElement): boolean {
  const selector = "input[aria-label='Title']";
  const element = dialog.querySelector<HTMLInputElement>(selector);
  if (!element) return false;
  const value = element.value.replace(/^Merged PR [0-9]+: */i, '');
  if (value === element.value) return false;
  element.value = value;
  element.setSelectionRange(0, 0);
  element.dispatchEvent(new Event('input', {bubbles: true}));
  return true;
}

function startIntervall() {
  if (intervallId !== 0) return;
  intervallId = window.setInterval(execute, 200);
}

function stopIntervall() {
  if (intervallId === 0) return;
  window.clearInterval(intervallId);
  intervallId = 0;
}

function shutdown() {
  stopIntervall();
  observer.disconnect();
}
