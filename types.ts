
export enum GameMode {
  SINGLES = 'SINGLES',
  DOUBLES = 'DOUBLES',
  ADVANCED_SINGLES = 'ADVANCED_SINGLES',
  ADVANCED_DOUBLES = 'ADVANCED_DOUBLES',
  SIMPLE_SINGLES = 'SIMPLE_SINGLES',
  SIMPLE_DOUBLES = 'SIMPLE_DOUBLES',
}

export enum GamePhase {
  HOME = 'HOME',
  SETUP = 'SETUP',
  GAME = 'GAME',
  GAME_OVER = 'GAME_OVER',
  HISTORY = 'HISTORY',
  SHARED_RESULT = 'SHARED_RESULT',
}

export interface Player {
  id: number;
  name: string;
}

export interface Team {
  id: number;
  players: Player[];
  score: number;
}

export interface StatPoint {
  playerId: number;
  teamId: number;
  type: 'winner' | 'error';
  reason: string;
}

export interface ScoreSnapshot {
  team1Score: number;
  team2Score: number;
}

export interface MatchResult {
  id: string;
  timestamp: string;
  winner: Team;
  teams: Team[];
  gameMode: GameMode;
  gameHistory: StatPoint[];
  scoreHistory: ScoreSnapshot[];
}
