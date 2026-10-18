# Slots and allow lists

<GissenStatus />

A `slot` field lets a component hold other components. This is how you build containers, cards and columns.

<<< @/snippets/guides/slots/config.ts [gissen.config.ts]

`Container` accepts `Card` only. `Card` accepts anything. `Text` has no slot.

## The component renders a named slot

The slot name is the field name. A field called `children` needs `<slot name="children" />`.

<<< @/snippets/guides/slots/components/Container.vue [Container.vue]

<<< @/snippets/guides/slots/components/Card.vue [Card.vue]

- In the editor, Gissen adds a drop zone inside each named slot.
- In `GissenRender`, the slot receives the rendered children.
- Slot fields are not props. Do not declare them in `defineProps`.
- If the name in the template does not match the field name, the children do not appear.

## Allow lists

`allow` lists the component types that may go into a slot. Without it, any registered type is accepted.

- The editor does not let you drop another type into the slot.
- `validateData` rejects a document that has one. The error names the slot and lists the allowed types.
- `allow` names are checked at validation time, not when you write the config. A name that matches no component simply never matches.

## Nesting

Children live in the parent's props, so the page is a tree. A card inside a container looks like this.

<<< @/snippets/guides/slots/tree.ts [tree.ts]

`createComponent` makes every slot an empty array, so you can fill it straight away. Each node needs a unique `id`. `createComponent` generates one. For trees you build another way, `ensureId` fills in missing ids.
