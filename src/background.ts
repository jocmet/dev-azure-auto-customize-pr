import browser from 'webextension-polyfill';
import {Message} from './common';

browser.runtime.onMessage.addListener(onMessage);

async function onMessage(message: unknown, sender: browser.Runtime.MessageSender): Promise<void> {
  const tabId = sender.tab?.id;
  if (!tabId) return;
  const command = message as Message;
  if (!command) return;
  switch (command.command) {
    case 'set-state':
      await setState(tabId, command.state);
      break;
  }
}

async function setState(tabId: number, state: string) {
  await browser.action.setBadgeTextColor({tabId, color: 'white'});
  const color = state === '-' ? 'gray' : 'red';
  await browser.action.setBadgeBackgroundColor({tabId, color});
  await browser.action.setBadgeText({tabId, text: state});
}
