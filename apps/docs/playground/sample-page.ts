import type { GissenData } from 'gissen'

/** The document the playground starts from, and what Reset returns to. */
export function samplePage(): GissenData {
  return {
    version: 1,
    root: { props: {} },
    content: [
      {
        type: 'Hero',
        props: { id: 'hero-1', title: 'Edit this page', subtitle: 'Drag a component in, change a field, then open Preview or JSON.', tone: 'light' },
      },
      {
        type: 'Columns',
        props: {
          id: 'columns-1',
          columns: [
            {
              type: 'Column',
              props: {
                id: 'column-1',
                width: 2,
                children: [
                  { type: 'Card', props: { id: 'card-1', title: 'Your components', rating: 5, size: 'lg' } },
                  { type: 'Text', props: { id: 'text-1', body: 'Gissen renders your own Vue components. It does not ship a component library.' } },
                ],
              },
            },
            {
              type: 'Column',
              props: {
                id: 'column-2',
                width: 1,
                children: [
                  { type: 'Card', props: { id: 'card-2', title: 'Plain JSON', rating: 4, size: 'md' } },
                ],
              },
            },
          ],
        },
      },
    ],
  }
}
