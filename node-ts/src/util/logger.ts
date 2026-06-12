export const logger = {
  error(message: string, context: Record<string, unknown> = {}) {
    process.stderr.write(
      JSON.stringify({ level: 'error', message, ...context, ts: new Date().toISOString() }) + '\n'
    );
  }
};
