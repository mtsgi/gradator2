<script setup lang="ts">
import { type GradientKind, getCorePackageInfo } from '@gradator/core';
import { formatGradientFunctionName, getCssPackageInfo } from '@gradator/css';
import { computed, ref } from 'vue';

const coreInfo = getCorePackageInfo();
const cssInfo = getCssPackageInfo();

const selectedKind = ref<GradientKind>('linear');
const isRepeating = ref(false);

const activeFunctionName = computed(() =>
  formatGradientFunctionName(selectedKind.value, isRepeating.value),
);
</script>

<template>
  <main class="app-shell">
    <section class="app-card">
      <h1 class="app-title">Gradator 2</h1>
      <p class="app-subtitle">CSS Gradient Visual Editor</p>

      <div class="kind-selector" role="group" aria-label="Gradient kind">
        <button
          v-for="kind in coreInfo.supportedKinds"
          :key="kind"
          type="button"
          class="kind-button"
          :aria-pressed="selectedKind === kind"
          @click="selectedKind = kind"
        >
          {{ kind }}
        </button>
      </div>

      <code class="code-preview" data-testid="gradient-fn"> {{ activeFunctionName }}() </code>

      <p class="app-subtitle" data-testid="package-versions">
        {{ coreInfo.name }}@{{ coreInfo.version }} / {{ cssInfo.name }}@{{ cssInfo.version }}
      </p>
    </section>
  </main>
</template>
