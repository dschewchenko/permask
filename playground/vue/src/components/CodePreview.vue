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
        value: `0b${bitmask.toString(2)}`,
        access: {
          read: parsed.read,
          create: parsed.create,
          update: parsed.update,
          delete: parsed.delete
        }
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
  <div class="code-preview">
    <div class="tabs">
      <button 
        :class="{ active: activeTab === 'json' }" 
        @click="activeTab = 'json'">
        JSON Config
      </button>
      <button 
        :class="{ active: activeTab === 'typescript' }" 
        @click="activeTab = 'typescript'">
        TypeScript
      </button>
      <button 
        :class="{ active: activeTab === 'usage' }" 
        @click="activeTab = 'usage'">
        Usage Examples
      </button>
      <button class="copy-btn" @click="copyToClipboard(
        activeTab === 'json' ? jsonConfig : 
        activeTab === 'typescript' ? typeScriptCode : 
        usageExamples
      )">
        Copy
      </button>
    </div>
    
    <div class="code-container">
      <pre v-if="activeTab === 'json'">{{ jsonConfig }}</pre>
      <pre v-if="activeTab === 'typescript'">{{ typeScriptCode }}</pre>
      <pre v-if="activeTab === 'usage'">{{ usageExamples }}</pre>
    </div>
  </div>
</template>

<style scoped>
.code-preview {
  display: flex;
  flex-direction: column;
  border: 1px solid #ddd;
  border-radius: 6px;
  overflow: hidden;
  background-color: white;
}

.tabs {
  display: flex;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.tabs button {
  padding: 10px 16px;
  border: none;
  background: none;
  cursor: pointer;
  color: #555;
  font-size: 14px;
  font-weight: 500;
}

.tabs button:hover {
  background-color: #ececec;
}

.tabs button.active {
  background-color: white;
  color: #1a73e8;
  font-weight: 600;
  box-shadow: inset 0 -2px 0 #1a73e8;
}

.tabs .copy-btn {
  margin-left: auto;
  color: #1a73e8;
}

.code-container {
  padding: 15px;
  overflow-x: auto;
  flex: 1;
  min-height: 300px;
  max-height: 500px;
  overflow-y: auto;
}

pre {
  margin: 0;
  white-space: pre-wrap;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 14px;
  line-height: 1.5;
  color: #333;
}
</style>