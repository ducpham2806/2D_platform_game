import { describe, expect, it, vi } from 'vitest';
import { EventBus } from '@/core/event-bus';

type TestEvents = {
  hit: { damage: number };
  reset: undefined;
};

describe('EventBus', () => {
  it('gửi payload đúng kiểu tới mọi listener', () => {
    const bus = new EventBus<TestEvents>();
    const a = vi.fn();
    const b = vi.fn();
    bus.on('hit', a);
    bus.on('hit', b);
    bus.emit('hit', { damage: 12 });
    expect(a).toHaveBeenCalledWith({ damage: 12 });
    expect(b).toHaveBeenCalledWith({ damage: 12 });
  });

  it('hủy đăng ký bằng hàm trả về', () => {
    const bus = new EventBus<TestEvents>();
    const fn = vi.fn();
    const off = bus.on('hit', fn);
    off();
    bus.emit('hit', { damage: 1 });
    expect(fn).not.toHaveBeenCalled();
    expect(bus.listenerCount('hit')).toBe(0);
  });

  it('once chỉ chạy một lần', () => {
    const bus = new EventBus<TestEvents>();
    const fn = vi.fn();
    bus.once('reset', fn);
    bus.emit('reset', undefined);
    bus.emit('reset', undefined);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('listener tự hủy trong lúc phát không làm bỏ sót listener khác', () => {
    const bus = new EventBus<TestEvents>();
    const order: string[] = [];
    const offFirst = bus.on('hit', () => {
      order.push('first');
      offFirst();
    });
    bus.on('hit', () => order.push('second'));
    bus.emit('hit', { damage: 1 });
    bus.emit('hit', { damage: 1 });
    expect(order).toEqual(['first', 'second', 'second']);
  });

  it('phát sự kiện không có listener thì không lỗi', () => {
    const bus = new EventBus<TestEvents>();
    expect(() => bus.emit('hit', { damage: 1 })).not.toThrow();
  });
});
