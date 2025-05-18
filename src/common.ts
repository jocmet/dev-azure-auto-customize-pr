export type State = '-' | 'pr' | 'c';

export type Message = {command: 'set-state'; state: State};
