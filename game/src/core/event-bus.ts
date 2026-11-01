/**
 * Event bus có kiểu: các module giao tiếp qua đây thay vì gọi chéo trực tiếp.
 * Logic thuần, không phụ thuộc Phaser, để test được.
 */
export type EventMap = Record<string, unknown>;
export type Listener<T> = (payload: T) => void;
export type Unsubscribe = () => void;

export class EventBus<Events extends EventMap> {
  private readonly listeners = new Map<keyof Events, Set<Listener<never>>>();

  on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): Unsubscribe {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener as Listener<never>);
    return () => this.off(event, listener);
  }

  once<K extends keyof Events>(event: K, listener: Listener<Events[K]>): Unsubscribe {
    const wrapped: Listener<Events[K]> = (payload) => {
      unsubscribe();
      listener(payload);
    };
    const unsubscribe = this.on(event, wrapped);
    return unsubscribe;
  }

  off<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void {
    const set = this.listeners.get(event);
    if (!set) return;
    set.delete(listener as Listener<never>);
    if (set.size === 0) this.listeners.delete(event);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    // Chép ra mảng để listener tự hủy đăng ký trong lúc phát không làm hỏng vòng lặp.
    for (const listener of [...set]) {
      (listener as Listener<Events[K]>)(payload);
    }
  }

  listenerCount<K extends keyof Events>(event: K): number {
    return this.listeners.get(event)?.size ?? 0;
  }

  clear(): void {
    this.listeners.clear();
  }
}
