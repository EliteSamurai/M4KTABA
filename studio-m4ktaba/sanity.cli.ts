import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '32kxkt38',
    dataset: 'blog-m4ktaba'
  },
  /**
   * Enable auto-updates for studios.
   * Learn more at https://www.sanity.io/docs/cli#auto-updates
   */
  autoUpdates: true,
})
