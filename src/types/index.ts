export interface Card {
  id: string;
  title: string;
  description: string;
}

export interface List {
  id: string;
  title: string;
  cards: Card[];
}

export interface Board {
  id: string;
  title: string;
  lists: List[];
  createdAt: string;
  lastModified: string;
  isArchived: boolean;
}

export interface BoardMetadata {
  id: string;
  title: string;
  createdAt: string;
  lastModified: string;
  isArchived: boolean;
  listCount: number;
  cardCount: number;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}
