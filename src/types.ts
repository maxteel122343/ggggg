/**
 * Types for the AI Gesture Agent
 */

export type GestureType = 
  | 'tap' 
  | 'double_tap' 
  | 'long_press' 
  | 'scroll_up' 
  | 'scroll_down' 
  | 'scroll_left' 
  | 'scroll_right' 
  | 'swipe' 
  | 'drag' 
  | 'pinch_in' 
  | 'pinch_out' 
  | 'type_text' 
  | 'open_app' 
  | 'go_back' 
  | 'go_home' 
  | 'wait';

export interface GestureAction {
  id: number;
  type: GestureType;
  x: number;
  y: number;
  duration: number;
  delay: number;
  color: string;
  text?: string;
}

export interface AIResponse {
  actions: {
    gesture: GestureType | 'generate_report' | 'download' | 'install_app' | 'finish_search' | 'send_notification';
    target?: string;
    x?: number;
    y?: number;
    direction?: 'left' | 'right' | 'up' | 'down';
    text?: string;
    title?: string;
    content?: string;
    body?: string;
    name?: string;
    type?: string;
    duration?: number;
  }[];
  message?: string;
}
