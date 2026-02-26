// Global type declarations to allow operations on union types

declare global {
  interface String {
    toFixed?(decimals: number): string;
  }
  
  interface Number {
    slice?(start: number, end?: number): string;
    charAt?(index: number): string;
    includes?(searchString: string): boolean;
  }
  
  interface Boolean {
    toFixed?(decimals: number): string;
    toLocaleString?(): string;
    slice?(start: number, end?: number): string;
    charAt?(index: number): string;
    includes?(searchString: string): boolean;
  }
}

export {};
