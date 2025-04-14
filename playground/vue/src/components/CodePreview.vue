<script setup lang="ts">
import { ref, computed } from "vue";

// Props
const props = defineProps<{
  groups: Record<string, number>;
  permissions: number[];
  permask: any; // Permask instance
}>();

// Track which code view is active
const activeTab = ref("json");

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

// Create permask instance
import { createPermask } from "permask";
const permask = createPermask(PermissionGroup);

// Create permission bitmasks
const permissions = [
  ${props.permissions.map(bitmask => {
    const parsed = props.permask.parse(bitmask);
    const groupName = props.permask.getGroupName(bitmask);
    return `// ${groupName} - ${parsed.read ? "Read" : ""}${parsed.create ? " Create" : ""}${parsed.update ? " Update" : ""}${parsed.delete ? " Delete" : ""}
  permask.create({
    group: PermissionGroup.${groupName},
    read: ${parsed.read},
    create: ${parsed.create},
    update: ${parsed.update},
    delete: ${parsed.delete}
  })`;
  }).join(",\n  ")}
];

// Example usage
function checkPermission(bitmasks: number[], group: number, permissionType: "read" | "create" | "update" | "delete") {
  return bitmasks.some(bitmask => 
    permask.hasGroup(bitmask, group) && 
    permask[\`can\${permissionType.charAt(0).toUpperCase() + permissionType.slice(1)}\`](bitmask)
  );
}

// Example check
const canAdminRead = checkPermission(permissions, PermissionGroup.${Object.keys(props.groups)[0] || "ADMIN"}, "read");
console.log(\`Can ${Object.keys(props.groups)[0] || "ADMIN"} read? \${canAdminRead}\`);`;
  
  return typeScriptCode;
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

// Using in an access control function
function hasAccess(userBitmasks: number[], requiredGroup: number, requiredAccess: number) {
  return userBitmasks.some(bitmask => 
    permask.hasGroup(bitmask, requiredGroup) && 
    (getPermissionAccess(bitmask) & requiredAccess) === requiredAccess
  );
}

// Express middleware example
app.get("/api/posts", checkPermissions(PermissionGroup.${groupName}, PermissionAccess.READ), (req, res) => {
  // Handler runs only if user has read permission on ${groupName}
  res.json({ posts: [] });
});`;
});

// Copy code to clipboard
const copyToClipboard = (code: string) => {
  navigator.clipboard.writeText(code).then(() => {
    alert("Copied to clipboard!");
  });
};
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
        Copy
      </button>
    </div>
    
    <div class="p-4 overflow-x-auto min-h-[300px] max-h-[500px] overflow-y-auto">
      <pre v-if="activeTab === 'json'" class="m-0 whitespace-pre-wrap font-mono text-sm leading-6 text-gray-800">{{ jsonConfig }}</pre>
      <pre v-if="activeTab === 'typescript'" class="m-0 whitespace-pre-wrap font-mono text-sm leading-6 text-gray-800">{{ typeScriptCode }}</pre>
      <pre v-if="activeTab === 'usage'" class="m-0 whitespace-pre-wrap font-mono text-sm leading-6 text-gray-800">{{ usageExamples }}</pre>
    </div>
  </div>
</template>