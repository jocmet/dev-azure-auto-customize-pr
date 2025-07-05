import browser from 'webextension-polyfill';
import {Message, State} from './common';

browser.runtime.onMessage.addListener(onMessage);

async function onMessage(message: unknown, sender: browser.Runtime.MessageSender): Promise<void> {
  const tabId = sender.tab?.id;
  if (!tabId) return;
  const command = message as Message;
  if (command?.command === 'set-state') {
    await setState(tabId, command.state);
  }
}

async function setState(tabId: number, state: State) {
  await browser.action.setBadgeTextColor({tabId, color: 'white'});
  const color = backgroundColor[state] ?? 'black';
  await browser.action.setBadgeBackgroundColor({tabId, color});
  await browser.action.setBadgeText({tabId, text: state});
}

const backgroundColor: Record<State, browser.Action.ColorValue> = {
  '-': 'gray',
  'pr': 'red',
  'dg': 'red',
  'rm': 'green',
} as const;
