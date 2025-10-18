/// <reference types="vite/client" />

// CSV file imports as raw text
declare module '*.csv?raw' {
  const content: string;
  export default content;
}

declare module '*.csv' {
  const content: string;
  export default content;
}
