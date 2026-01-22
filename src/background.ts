import browser from 'webextension-polyfill';
import {Message, State} from './common';

updateRegisteredContentScripts(); // NOSONARCHECK
browser.permissions.onAdded.addListener(updateRegisteredContentScripts);
browser.permissions.onRemoved.addListener(updateRegisteredContentScripts);

async function updateRegisteredContentScripts(): Promise<void> {
  const permissions = await browser.permissions.getAll();
  const origins = permissions.origins ?? [];
  console.debug('update registered content scripts', origins);
  await browser.scripting.unregisterContentScripts();
  if (origins.length > 0) {
    await browser.scripting.registerContentScripts([
      {
        id: 'client-script',
        matches: origins,
        js: ['src/client.js'],
        persistAcrossSessions: true,
        runAt: 'document_idle',
      },
    ]);
  }
}

browser.action.onClicked.addListener(onActionClicked);

function onActionClicked(tab: browser.Tabs.Tab): void {
  const origin = getOrigin(tab.url);
  if (origin === undefined) return;
  browser.permissions.request({origins: [origin]}).then((granted) => {
    if (granted) {
      browser.scripting
        .executeScript({
          target: {tabId: tab.id ?? 0},
          files: ['src/client.js'],
        })
        .then((r) => console.info('loaded script', r))
        .catch((e) => console.warn('unable to load script', e));
    }
  });
}

function getOrigin(url: string | undefined): string | undefined {
  if (url === undefined) return undefined;
  const match = /^(https?:\/\/[^/]+)\/(([^/]+)\/)?([^/]+)\/_git\/([^/]+)\/pullrequest(s|\/(\d+))?($|\?|#)/i.exec(url);
  if (match) return `${match[1]}/*`;
  console.debug('unsupported url', url);
  return undefined;
}

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
  await browser.action.setIcon({tabId, path: {'16': '/icon/16.png', '24': '/icon/24.png', '32': '/icon/32.png'}});
  await browser.action.disable(tabId);
}

const backgroundColor: Record<State, browser.Action.ColorValue> = {
  '-': 'gray',
  'pr': 'red',
  'dg': 'red',
  'rm': 'green',
} as const;
