import { type SchemaTypeDefinition } from 'sanity'
import blog from './blog'
import faq from './faq'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [blog, faq],
}
