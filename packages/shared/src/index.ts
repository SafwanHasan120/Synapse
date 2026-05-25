export type EventType =
  | 'ai_prompt'
  | 'ai_response'
  | 'file_save'
  | 'manual_capture'
  | 'decision';

export interface EventMetadata {
  filePaths?:  string[];
  language?:   string;
  editorId?:   string;
  commitHash?: string;
  tags?:       string[];
}

export interface SearchResult {
  chunkId:   string;
  eventId:   string;
  content:   string;
  score:     number;
  metadata:  EventMetadata & {
    eventType:   EventType;
    authorName:  string;
    authorLogin: string;
    createdAt:   string;
  };
}

export interface JwtPayload {
  sub:    string;   // userId
  teamId: string;
  iat:    number;
  exp:    number;
}

export interface ApiError {
  error: { message: string; code: string };
}