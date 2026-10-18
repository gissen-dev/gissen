import { createComponent, createEmptyData } from 'gissen'
import config from '../rendering/config'

// An empty page. root.props starts from config.root.defaultProps.
export const empty = createEmptyData(config)

// A page with one Hero, filled from the Hero's defaultProps.
export const withHero = {
  ...createEmptyData(config),
  content: [createComponent('Hero', config)],
}
