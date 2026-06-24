import { GameItem } from '../../interfaces';

/**
 * Basic shapes. `meta.shape` is a key the frontend draws as an SVG during the
 * question; the name is revealed afterwards.
 */
export const SHAPES: GameItem[] = [
  { id: 'circle', display: 'Circle', answer: 'Circle', pronunciation: 'Circle', meta: { shape: 'circle' } },
  { id: 'square', display: 'Square', answer: 'Square', pronunciation: 'Square', meta: { shape: 'square' } },
  { id: 'triangle', display: 'Triangle', answer: 'Triangle', pronunciation: 'Triangle', meta: { shape: 'triangle' } },
  { id: 'rectangle', display: 'Rectangle', answer: 'Rectangle', pronunciation: 'Rectangle', meta: { shape: 'rectangle' } },
  { id: 'oval', display: 'Oval', answer: 'Oval', pronunciation: 'Oval', meta: { shape: 'oval' } },
  { id: 'diamond', display: 'Diamond', answer: 'Diamond', pronunciation: 'Diamond', meta: { shape: 'diamond' } },
  { id: 'star', display: 'Star', answer: 'Star', pronunciation: 'Star', meta: { shape: 'star' } },
  { id: 'heart', display: 'Heart', answer: 'Heart', pronunciation: 'Heart', meta: { shape: 'heart' } },
];
