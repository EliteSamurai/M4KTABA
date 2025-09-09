import {defineType} from 'sanity'

export default defineType({
  name: 'sanity_perm_probe',
  title: 'Sanity Permission Probe (system)',
  type: 'document',
  fields: [{name: 'note', type: 'string', title: 'Note'}],
})
