import type { Linter } from 'eslint'

declare const vue: {
  meta: any
  configs: {
    base: Linter.LegacyConfig
    essential: Linter.LegacyConfig
    'no-layout-rules': Linter.LegacyConfig
    recommended: Linter.LegacyConfig
    'strongly-recommended': Linter.LegacyConfig
    'vue3-essential': Linter.LegacyConfig
    'vue3-recommended': Linter.LegacyConfig
    'vue3-strongly-recommended': Linter.LegacyConfig
    'flat/base': Linter.FlatConfig[]
    'flat/vue2-essential': Linter.FlatConfig[]
    'flat/vue2-recommended': Linter.FlatConfig[]
    'flat/vue2-strongly-recommended': Linter.FlatConfig[]
    'flat/essential': Linter.FlatConfig[]
    'flat/recommended': Linter.FlatConfig[]
    'flat/strongly-recommended': Linter.FlatConfig[]
  }
  rules: Record<string, any>
  processors: {
    '.vue': any
    vue: any
  }
  environments: {
    /**
     * @deprecated
     */
    'setup-compiler-macros': {
      globals: {
        defineProps: 'readonly'
        defineEmits: 'readonly'
        defineExpose: 'readonly'
        withDefaults: 'readonly'
      }
    }
  }
}

export = vue
