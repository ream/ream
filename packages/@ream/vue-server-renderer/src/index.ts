import { createRenderer } from 'vue-server-renderer'
import { createBundleRendererCreator } from './create-bundle-renderer'

export const createBundleRenderer = createBundleRendererCreator(createRenderer)
