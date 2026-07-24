export type SearchEntityType =
  | 'release'
  | 'track'
  | 'artist'
  | 'person'
  | 'task';

export interface SearchResult {
  type: SearchEntityType;
  id: string;
  title: string;
  subtitle: string;
  icon?: string;
  url: string;
  badge?: string;
  score: number;
}