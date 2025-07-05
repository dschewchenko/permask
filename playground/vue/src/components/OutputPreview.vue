<script setup lang="ts">
import { computed } from "vue";
import {packBitmasks} from "../../../../src";

// Props
const props = defineProps<{
  permissions: number[];
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  permask: any; // Permask instance
}>();

// Computed properties for different output formats
const rawBitmasks = computed(() => JSON.stringify(props.permissions));
const packedBase64 = computed(() => packBitmasks(props.permissions));
</script>

<template>
  <div class="space-y-4">
    <div class="bg-white border border-gray-200 rounded-lg p-4">
      <h3 class="text-lg font-semibold text-gray-700 mb-3">Bitmask Array</h3>
      <code class="block bg-gray-50 p-3 rounded border text-sm font-mono text-gray-800 break-all">{{ rawBitmasks }}</code>
    </div>

    <div class="bg-white border border-gray-200 rounded-lg p-4">
      <h3 class="text-lg font-semibold text-gray-700 mb-3">Packed (Base64)</h3>
      <code class="block bg-gray-50 p-3 rounded border text-sm font-mono text-gray-800 break-all">{{ packedBase64 }}</code>
    </div>
  </div>
</template>
