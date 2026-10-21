import type { Theme } from 'vitepress'
import Layout from './Layout.vue'
import Playground from '../../components/Playground.vue'
import ApiReference from '../../components/ApiReference.vue'
import GuideDemo from '../../components/GuideDemo.vue'
import './style.css'
export default {
  Layout,
  enhanceApp({ app }) {
    app.component('Playground', Playground)
    app.component('ApiReference', ApiReference)
    app.component('GuideDemo', GuideDemo)
  },
} satisfies Theme
