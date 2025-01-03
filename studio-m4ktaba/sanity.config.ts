import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'M4KTABA',

  projectId: '32kxkt38',
  dataset: 'blog-m4ktaba',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
