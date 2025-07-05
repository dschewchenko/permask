<script setup lang="ts">
import { ref, computed, onUpdated, nextTick } from "vue";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import json from "highlight.js/lib/languages/json";

// Register languages
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('json', json);

// Props
const props = defineProps<{
  groups: Record<string, number>;
  permissions: number[];
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  permask: any; // Permask instance
}>();

// Track which code view is active
const activeTab = ref("json");

// Copy button state
const copyButtonText = ref("Copy");

// Generate prettified JSON representation
const jsonConfig = computed(() => {
  const config = {
    groups: props.groups,
    permissions: props.permissions.map(bitmask => {
      const parsed = props.permask.parse(bitmask);
      const groupName = props.permask.getGroupName(bitmask);
      return {
        group: groupName,
        bitmask,
        value: `0b${bitmask.toString(2)}`
      };
    })
  };

  return JSON.stringify(config, null, 2);
});

// Generate TypeScript code
const typeScriptCode = computed(() => {
  // Generate group enum code
  const groupsCode = `// Define permission groups
const PermissionGroup = {
  ${Object.entries(props.groups)
    .map(([key, value]) => `${key}: ${value}`)
    .join(",\n  ")}
} as const;

// Create permask instance and import required functions
import { createPermask, hasRequiredPermission, PermissionAccess } from "permask";
const permask = createPermask(PermissionGroup);

// Create permission bitmasks
const permissions = [
  ${props.permissions.map(bitmask => {
    const parsed = props.permask.parse(bitmask);
    const groupName = props.permask.getGroupName(bitmask);
    return `// ${groupName} - ${parsed.read ? "Read" : ""}${parsed.create ? " Create" : ""}${parsed.update ? " Update" : ""}${parsed.delete ? " Delete" : ""}
  permask.create({
    group: "${groupName}",
    read: ${parsed.read},
    create: ${parsed.create},
    update: ${parsed.update},
    delete: ${parsed.delete}
  })`;
  }).join(",\n  ")}
];

// Example check
const canAdminRead = hasRequiredPermission(permissions, PermissionGroup.${Object.keys(props.groups)[0] || "ADMIN"}, PermissionAccess.READ);
`;

  return groupsCode;
});

// Generate usage examples
const usageExamples = computed(() => {
  if (props.permissions.length === 0) {
    return "// Add some permissions to see usage examples";
  }

  // Take first permission as example
  const exampleBitmask = props.permissions[0];
  const groupName = props.permask.getGroupName(exampleBitmask);

  return `// Check individual permissions
const bitmask = ${exampleBitmask}; // ${groupName}
const canRead = permask.canRead(bitmask);
const canCreate = permask.canCreate(bitmask);
const canUpdate = permask.canUpdate(bitmask);
const canDelete = permask.canDelete(bitmask);

// Import: import { hasRequiredPermission, PermissionAccess } from "permask";
function checkUserAccess(userBitmasks: number[], requiredGroup: string, requiredAccess: "read" | "create" | "update" | "delete") {
  const groupId = PermissionGroup[requiredGroup];
  const accessValue = PermissionAccess[requiredAccess.toUpperCase()];
  return hasRequiredPermission(userBitmasks, groupId, accessValue);
}

// Direct usage example
const userPermissions = [/* user's bitmask array */];
const hasReadAccess = hasRequiredPermission(userPermissions, PermissionGroup.${groupName}, PermissionAccess.READ);

// Express middleware example
app.get("/api/posts", (req, res) => {
  const userBitmasks = req.user.permissions; // Assuming permissions are stored in user object
  if (checkUserAccess(userBitmasks, "${groupName}", "read")) {
    res.json({ posts: [] });
  } else {
    res.status(403).json({ error: "Access denied" });
  }
});`;
});

// Copy code to clipboard
const copyToClipboard = (code: string) => {
  navigator.clipboard.writeText(code).then(() => {
    copyButtonText.value = "Copied!";
    setTimeout(() => {
      copyButtonText.value = "Copy";
    }, 2500);
  });
};

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
  <div class="flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-white">
    <div class="flex bg-gray-50 border-b border-gray-200">
      <button
        :class="{ 'bg-white text-blue-600 font-semibold shadow-[inset_0_-2px_0] shadow-blue-600': activeTab === 'json',
                 'text-gray-600 hover:bg-gray-100': activeTab !== 'json' }"
        @click="activeTab = 'json'"
        class="px-4 py-2.5 text-sm font-medium"
      >
        JSON Config
      </button>
      <button
        :class="{ 'bg-white text-blue-600 font-semibold shadow-[inset_0_-2px_0] shadow-blue-600': activeTab === 'typescript',
                 'text-gray-600 hover:bg-gray-100': activeTab !== 'typescript' }"
        @click="activeTab = 'typescript'"
        class="px-4 py-2.5 text-sm font-medium"
      >
        TypeScript
      </button>
      <button
        :class="{ 'bg-white text-blue-600 font-semibold shadow-[inset_0_-2px_0] shadow-blue-600': activeTab === 'usage',
                 'text-gray-600 hover:bg-gray-100': activeTab !== 'usage' }"
        @click="activeTab = 'usage'"
        class="px-4 py-2.5 text-sm font-medium"
      >
        Usage Examples
      </button>
      <button
        class="ml-auto px-4 py-2.5 text-sm font-medium text-blue-600 hover:bg-gray-100"
        @click="copyToClipboard(
          activeTab === 'json' ? jsonConfig :
          activeTab === 'typescript' ? typeScriptCode :
          usageExamples
        )"
      >
        {{ copyButtonText }}
      </button>
    </div>

    <div class="p-4 overflow-x-auto min-h-[300px] max-h-[500px] overflow-y-auto">
      <pre v-if="activeTab === 'json'" class="m-0 whitespace-pre-wrap font-mono text-sm leading-6"><code class="language-json">{{ jsonConfig }}</code></pre>
      <pre v-if="activeTab === 'typescript'" class="m-0 whitespace-pre-wrap font-mono text-sm leading-6"><code class="language-typescript">{{ typeScriptCode }}</code></pre>
      <pre v-if="activeTab === 'usage'" class="m-0 whitespace-pre-wrap font-mono text-sm leading-6"><code class="language-javascript">{{ usageExamples }}</code></pre>
    </div>
  </div>
</template>
