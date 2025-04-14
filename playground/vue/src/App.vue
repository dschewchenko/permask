<script setup lang="ts">
import { ref, computed } from "vue";
import { createPermask, PermissionAccess } from "permask";
import PermissionTable from "./components/PermissionTable.vue";
import CodePreview from "./components/CodePreview.vue";
import GroupManager from "./components/GroupManager.vue";

// Initialize with some default groups
const groups = ref({
  ADMIN: 1,
  EDITOR: 2,
  VIEWER: 3
});

// Track permissions as an array of bitmasks
const permissions = ref<number[]>([]);

// Create a permask instance with our groups
const permask = computed(() => createPermask(groups.value));

// Add a new permission to the array
const addPermission = (groupKey: string, read: boolean, create: boolean, update: boolean, del: boolean) => {
  const group = groups.value[groupKey as keyof typeof groups.value];
  
  if (group === undefined) return;
  
  const bitmask = permask.value.create({
    group,
    read,
    create,
    update,
    delete: del
  });
  
  // Replace existing permission for this group or add new one
  const existingIndex = permissions.value.findIndex(p => 
    permask.value.hasGroup(p, group)
  );
  
  if (existingIndex >= 0) {
    permissions.value[existingIndex] = bitmask;
  } else {
    permissions.value.push(bitmask);
  }
};

// Handle updates from the permission table
const updatePermissions = (updatedPermissions: number[]) => {
  permissions.value = updatedPermissions;
};

// Handle updates to group definitions
const updateGroups = (updatedGroups: Record<string, number>) => {
  groups.value = updatedGroups;
  
  // Filter out permissions for groups that no longer exist
  permissions.value = permissions.value.filter(p => {
    const group = permask.value.getGroupName(p);
    return group !== undefined;
  });
};

// Export configuration
const exportConfig = () => {
  const config = {
    groups: groups.value,
    permissions: permissions.value.map(p => {
      const parsedBitmask = permask.value.parse(p);
      const groupName = permask.value.getGroupName(p);
      return {
        group: groupName,
        bitmask: p,
        read: parsedBitmask.read,
        create: parsedBitmask.create,
        update: parsedBitmask.update,
        delete: parsedBitmask.delete
      };
    })
  };
  
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "permask-config.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Import configuration
const importConfig = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string);
        
        if (config.groups && typeof config.groups === 'object') {
          groups.value = config.groups;
        }
        
        if (config.permissions && Array.isArray(config.permissions)) {
          // Handle two possible formats:
          // 1. Array of numbers (just bitmasks)
          // 2. Array of objects with bitmask property
          permissions.value = config.permissions.map(p => 
            typeof p === 'number' ? p : (p.bitmask || 0)
          );
        }
      } catch (err) {
        alert("Failed to import configuration: Invalid JSON format");
        console.error(err);
      }
    };
    
    reader.readAsText(file);
  };
  
  input.click();
};
</script>

<template>
  <div class="max-w-7xl mx-auto px-5">
    <header class="flex justify-between items-center mb-8 pb-5 border-b border-gray-200">
      <h1 class="text-2xl font-bold text-gray-800">Permask Playground</h1>
      <div class="actions flex gap-2">
        <button 
          @click="importConfig"
          class="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded font-medium transition-colors"
        >
          Import Config
        </button>
        <button 
          @click="exportConfig"
          class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded font-medium transition-colors"
        >
          Export Config
        </button>
      </div>
    </header>
    
    <main class="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <section class="bg-gray-50 rounded-lg p-5 shadow-sm">
        <h2 class="text-xl font-semibold text-gray-700 mt-0 mb-4">Group Configuration</h2>
        <GroupManager 
          :groups="groups" 
          @update-groups="updateGroups" 
        />
      </section>
      
      <section class="bg-gray-50 rounded-lg p-5 shadow-sm">
        <h2 class="text-xl font-semibold text-gray-700 mt-0 mb-4">Permission Configuration</h2>
        <PermissionTable 
          :groups="groups" 
          :permissions="permissions" 
          :permask="permask"
          @update-permissions="updatePermissions"
          @add-permission="addPermission"
        />
      </section>
      
      <section class="bg-gray-50 rounded-lg p-5 shadow-sm lg:col-span-2">
        <h2 class="text-xl font-semibold text-gray-700 mt-0 mb-4">Code Preview</h2>
        <CodePreview 
          :groups="groups" 
          :permissions="permissions"
          :permask="permask"
        />
      </section>
    </main>
  </div>
</template>
