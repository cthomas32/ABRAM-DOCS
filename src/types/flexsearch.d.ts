/* eslint-disable @typescript-eslint/no-unused-vars */
declare module 'flexsearch' {
  export interface IndexOptions {
    tokenize?: 'strict' | 'forward' | 'reverse' | 'full';
    resolution?: number;
    depth?: number;
    count?: number;
    preset?: 'memory' | 'speed' | 'match' | 'score' | 'balanced';
    bidirectional?: boolean;
    optimize?: boolean;
    cache?: boolean | number;
  }

  export interface DocumentOptions<T> {
    id: string;
    index: string[] | Record<string, IndexOptions>;
    store?: string[];
  }

  export class Index {
    constructor(options?: IndexOptions);
    add(id: number | string, text: string): this;
    search(query: string, limit?: number): (number | string)[];
    update(id: number | string, text: string): this;
    remove(id: number | string): this;
  }

  export interface SearchResultItem {
    field: string;
    result: (number | string)[];
  }

  export interface SearchResultEnriched<T> {
    field: string;
    result: {
      id: number | string;
      doc: T;
    }[];
  }

  export class Document<T, Store extends boolean = false> {
    constructor(options: {
      document: DocumentOptions<T>;
      tokenize?: 'strict' | 'forward' | 'reverse' | 'full';
      resolution?: number;
      preset?: 'memory' | 'speed' | 'match' | 'score' | 'balanced';
      cache?: boolean | number;
    });
    add(id: number | string, document: T): this;
    search(query: string, limit?: number): SearchResultItem[];
    search(
      query: string,
      limit: number,
      options: {
        enrich?: boolean;
        index?: string[];
        bool?: 'and' | 'or';
      }
    ): SearchResultEnriched<T>[];
    update(id: number | string, document: T): this;
    remove(id: number | string): this;
  }
}
