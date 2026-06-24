import { GameItem } from '../../interfaces';

/**
 * Kid-friendly primary/secondary colors. `meta.hex` is the swatch shown during
 * the question; the name is revealed afterwards.
 */
export const COLORS: GameItem[] = [
  { id: 'red', display: 'Red', answer: 'Red', pronunciation: 'Red', meta: { hex: '#e6194b' } },
  { id: 'orange', display: 'Orange', answer: 'Orange', pronunciation: 'Orange', meta: { hex: '#f58231' } },
  { id: 'yellow', display: 'Yellow', answer: 'Yellow', pronunciation: 'Yellow', meta: { hex: '#ffd60a' } },
  { id: 'green', display: 'Green', answer: 'Green', pronunciation: 'Green', meta: { hex: '#3cb44b' } },
  { id: 'blue', display: 'Blue', answer: 'Blue', pronunciation: 'Blue', meta: { hex: '#4363d8' } },
  { id: 'purple', display: 'Purple', answer: 'Purple', pronunciation: 'Purple', meta: { hex: '#911eb4' } },
  { id: 'pink', display: 'Pink', answer: 'Pink', pronunciation: 'Pink', meta: { hex: '#f472b6' } },
  { id: 'brown', display: 'Brown', answer: 'Brown', pronunciation: 'Brown', meta: { hex: '#8b5a2b' } },
  { id: 'black', display: 'Black', answer: 'Black', pronunciation: 'Black', meta: { hex: '#1a1a1a' } },
  { id: 'white', display: 'White', answer: 'White', pronunciation: 'White', meta: { hex: '#ffffff' } },
];
