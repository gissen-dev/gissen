import type { GissenData } from 'gissen'

/** Two columns, each already holding a Card and a Text, so the nesting is visible immediately. */
export function samplePage(): GissenData {
  return {
    version: 1,
    root: { props: {} },
    content: [
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
                  {
                    type: 'Card',
                    props: { id: 'card-1', title: 'Headless', rating: 5, size: 'lg' },
                  },
                  {
                    type: 'Text',
                    props: { id: 'text-1', body: 'Your components, your styles. Gissen adds the editing layer.' },
                  },
                ],
              },
            },
            {
              type: 'Column',
              props: {
                id: 'column-2',
                width: 1,
                children: [
                  {
                    type: 'Card',
                    props: { id: 'card-2', title: 'Type-safe', rating: 4, size: 'md' },
                  },
                ],
              },
            },
          ],
        },
      },
    ],
  }
}
