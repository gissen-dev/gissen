import type { GissenData } from 'gissen'
import { createComponent } from 'gissen'
import config from './config'

// Slot fields hold arrays of components, so the page is a tree.
const container = createComponent('Container', config)
const card = createComponent('Card', config)
const text = createComponent('Text', config)

card.props.body = [text]
container.props.children = [card]

export const page: GissenData = {
  version: 1,
  root: { props: {} },
  content: [container],
}
