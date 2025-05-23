export type State = '-' | 'pr' | 'dg' | 'rm';

export interface Message {
  command: 'set-state';
  state: State;
}
