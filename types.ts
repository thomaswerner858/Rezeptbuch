
export interface Dish {
  id: string;
  name: string;
  imageUrl: string;
  recipe?: string;
  isCustom?: boolean;
}

export interface Vote {
  userId: string;
  dishId: string;
  liked: boolean;
  timestamp: number;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
}

export enum SwipeDirection {
  LEFT = 'left',
  RIGHT = 'right',
  NONE = 'none'
}
