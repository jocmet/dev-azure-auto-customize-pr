const dropEventName = 'ad099b39-73ad-466b-a999-a0ed8978306c';
document.dispatchEvent(new CustomEvent(dropEventName));
const observer = new window.MutationObserver(execute);
observer.observe(document.body, {childList: true, subtree: true});
document.addEventListener(dropEventName, () => observer.disconnect(), {once: true});

function execute(): void {
  if (pullrequest()) {
    const dialog = modalDialog();
    dialog && checkbox(dialog) && input(dialog);
  }
}

function pullrequest(): boolean {
  const pattern = /^\/([^\/]+)\/([^\/]+)\/_git\/([^\/]+)\/pullrequest\/([0-9]+)$/i;
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

function input(dialog: HTMLElement): boolean {
  const selector = "input[aria-label='Title']";
  const input = dialog.querySelector<HTMLInputElement>(selector);
  if (!input) return false;
  const value = input.value.replace(/^Merged PR [0-9]+: */i, '');
  if (value === input.value) return true;
  input.value = value;
  return false;
}
