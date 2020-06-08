interface NodeModule {
  hot: {accept(file: string, cb: () => void): void};
}
