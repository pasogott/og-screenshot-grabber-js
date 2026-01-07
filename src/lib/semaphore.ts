/**
 * Semaphore for limiting concurrent operations
 */
export class Semaphore {
  private max: number;
  private count: number = 0;
  private queue: Array<() => void> = [];

  constructor(max: number) {
    this.max = max;
  }

  async acquire(): Promise<void> {
    if (this.count < this.max) {
      this.count++;
      return;
    }

    return new Promise((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    this.count--;
    if (this.queue.length > 0) {
      this.count++;
      const resolve = this.queue.shift();
      if (resolve) resolve();
    }
  }

  async use<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}
