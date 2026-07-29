import type { GissenData } from 'gissen'

/**
 * The sample document shared by the example pages: the editor page loads it
 * as its starting state, and the render page server-renders it — the same
 * JSON a real app would store after editing.
 */
export function samplePage(): GissenData {
  return {
    version: 1,
    root: { props: {} },
    content: [
      {
        type: 'Hero',
        props: {
          id: 'hero-1',
          title: 'Build pages visually',
          subtitle: 'Drag and drop your own Vue components onto a canvas. The output is plain JSON — render it anywhere.',
          cta: 'get-started',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-1',
          heading: 'How it works',
          body: 'Register your Vue components with a typed config. Users drag them onto the canvas — the output is plain JSON you render anywhere.',
        },
      },
      {
        type: 'Container',
        props: {
          id: 'container-1',
          children: [
            {
              type: 'FeatureCard',
              props: {
                id: 'feature-headless',
                icon: '🧩',
                title: 'Headless',
                description: 'Your components, your styles. Gissen is a runtime, not a UI framework.',
                badge: 1,
                highlighted: true,
              },
            },
            {
              type: 'FeatureCard',
              props: {
                id: 'feature-typesafe',
                icon: '🔷',
                title: 'Type-safe',
                description: 'Prop types are inferred from your field definitions. Mismatches are caught at compile time.',
                badge: 2,
                highlighted: false,
              },
            },
            {
              type: 'FeatureCard',
              props: {
                id: 'feature-agent',
                icon: '🤖',
                title: 'Agent-native',
                description: 'An MCP server lets AI agents build pages programmatically — same JSON, same config.',
                badge: 3,
                highlighted: false,
              },
            },
          ],
        },
      },
    ],
  }
}
