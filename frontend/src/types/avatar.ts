export type Position = {
  x: number;
  y: number;
  z: number;
};

export type AvatarConfig = {
  id: string;
  name: string;
  position: Position;
  color: string;
  scale: number;
  visible: boolean;
  rotationSpeed: number; // ラジアン/秒（0 で停止）
};
