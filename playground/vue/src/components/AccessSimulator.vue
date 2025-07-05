<script setup lang="ts">
import { ref, computed, watch, onUpdated, nextTick } from "vue";
import { hasRequiredPermission, PermissionAccess } from "../../../../src";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";

// Register languages for syntax highlighting
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);

// Props
const props = defineProps<{
  groups: Record<string, number>;
  permissions: number[];
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  permask: any; // Permask instance
}>();

// Reactive state
const selectedGroup = ref<string>("");
const selectedAccess = ref<string>("");
const resultMessage = ref<string>("");
const detailedResults = ref<Array<{
  bitmask: number;
  hasGroup: boolean;
  hasAccess: boolean;
  permissions: {
    read: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
  };
}>>([]);

// Access types
const accessTypes = [
  { value: "read", label: "READ" },
  { value: "create", label: "CREATE" },
  { value: "update", label: "UPDATE" },
  { value: "delete", label: "DELETE" }
];

// Computed property for generating safe code example
const codeExample = computed(() => {
  if (!selectedGroup.value || !selectedAccess.value) return '';

  const permissionsArray = props.permissions.join(', ');
  const groupId = props.groups[selectedGroup.value];
  const accessType = selectedAccess.value.toUpperCase();
  const resultValue = resultMessage.value === 'Access granted' ? 'true' : resultMessage.value === 'Access denied' ? 'false' : 'boolean';

  return `const hasAccess = hasRequiredPermission(
  userPermissions, // Array of bitmasks: [${permissionsArray}]
  PermissionGroup.${selectedGroup.value}, // Group: ${groupId}
  PermissionAccess.${accessType} // Access: ${selectedAccess.value}
); // Returns: ${resultValue}`;
});

// Check access function using new permask methods
const checkAccess = () => {
  if (!selectedGroup.value || !selectedAccess.value) {
    resultMessage.value = "Please select group and access type";
    detailedResults.value = [];
    return;
  }

  const groupId = props.groups[selectedGroup.value];
  if (groupId === undefined) {
    resultMessage.value = "Invalid group";
    detailedResults.value = [];
    return;
  }

  // Use both old and new methods for comparison and detailed breakdown
  let accessValue: number;
  switch (selectedAccess.value) {
    case "read":
      accessValue = PermissionAccess.READ;
      break;
    case "create":
      accessValue = PermissionAccess.CREATE;
      break;
    case "update":
      accessValue = PermissionAccess.UPDATE;
      break;
    case "delete":
      accessValue = PermissionAccess.DELETE;
      break;
    default:
      resultMessage.value = "Invalid access type";
      detailedResults.value = [];
      return;
  }

  // Use hasRequiredPermission method for the main result
  const hasAccess = hasRequiredPermission(props.permissions, groupId, accessValue);

  resultMessage.value = hasAccess ? "Access granted" : "Access denied";
};

// Watch for changes to make it real-time
watch([selectedGroup, selectedAccess, () => props.permissions], () => {
  checkAccess();
}, { immediate: true });

// Apply syntax highlighting after updates
onUpdated(() => {
  nextTick(() => {
    for (const block of document.querySelectorAll('pre code')) {
      const element = block as HTMLElement;
      // Clear previous highlighting and re-highlight
      if (element.dataset.highlighted) {
        delete element.dataset.highlighted;
        element.className = element.className.replace(/hljs[^\s]*/g, '').trim();
        element.className = element.className.replace(/language-\w+/, (match) => match);
      }
      // Use highlight with ignoreIllegals option to prevent security warnings
      try {
        const content = element.textContent || '';
        const language = element.className.match(/language-(\w+)/)?.[1] || 'typescript';
        const result = hljs.highlight(content, {
          language,
          ignoreIllegals: true
        });
        element.innerHTML = result.value;
        element.dataset.highlighted = 'yes';
      } catch (error) {
        // If highlighting fails, just skip it to avoid security issues
        console.warn('Syntax highlighting failed:', error);
      }
    }
  });
});
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-lg p-6">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div>
        <label for="group-select" class="block text-sm font-medium text-gray-700 mb-2">
          Select group:
        </label>
        <select
          id="group-select"
          v-model="selectedGroup"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">-- Select group --</option>
          <option v-for="(id, name) in groups" :key="name" :value="name">
            {{ name }}
          </option>
        </select>
      </div>

      <div>
        <label for="access-select" class="block text-sm font-medium text-gray-700 mb-2">
          Select access type:
        </label>
        <select
          id="access-select"
          v-model="selectedAccess"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">-- Select access --</option>
          <option v-for="access in accessTypes" :key="access.value" :value="access.value">
            {{ access.label }}
          </option>
        </select>
      </div>
    </div>

    <div class="flex flex-col items-center gap-4 mb-6">
      <div
        v-if="resultMessage"
        :class="{
          'text-green-600': resultMessage === 'Access granted',
          'text-red-600': resultMessage === 'Access denied',
          'text-orange-600': resultMessage.includes('Please') || resultMessage.includes('Invalid')
        }"
        class="text-lg font-semibold"
      >
        {{ resultMessage }}
      </div>
    </div>

    <!-- Dynamic Permission Verification Code Example -->
    <div v-if="selectedGroup && selectedAccess" class="mt-6 border-t pt-6">
      <h4 class="text-md font-semibold text-gray-700 mb-4">Code:</h4>

      <pre class="bg-white rounded border p-4 m-0 overflow-x-auto"><code class="language-typescript">{{ codeExample }}</code></pre>
    </div>
  </div>
</template>
