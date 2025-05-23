export type State = '-' | 'pr' | 'dg' | 'rm';

export type Message = {command: 'set-state'; state: State};
