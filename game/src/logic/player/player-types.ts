/** Kiểu dữ liệu vào/ra của vật lý nhân vật (logic thuần). */

/** Đầu vào nhân vật cho một bước, rút từ InputSnapshot. */
export interface PlayerInput {
  moveX: number;
  jumpPressed: boolean;
  jumpHeld: boolean;
  dashPressed: boolean;
  downHeld: boolean;
}

export const NO_INPUT: PlayerInput = {
  moveX: 0,
  jumpPressed: false,
  jumpHeld: false,
  dashPressed: false,
  downHeld: false,
};

export type PlayerStateName =
  | 'idle'
  | 'run'
  | 'jump_up'
  | 'jump_fall'
  | 'land'
  | 'dash'
  | 'wall_slide'
  | 'wall_jump'
  | 'hurt'
  | 'dead';

/** Chuyện xảy ra trong bước vừa chạy, để phát âm thanh, hiệu ứng, hoạt ảnh. */
export interface PlayerEvents {
  jumped: boolean;
  wallJumped: boolean;
  landed: boolean;
  dashed: boolean;
  hurt: boolean;
  died: boolean;
  fellOut: boolean;
}

export function noEvents(): PlayerEvents {
  return {
    jumped: false,
    wallJumped: false,
    landed: false,
    dashed: false,
    hurt: false,
    died: false,
    fellOut: false,
  };
}
