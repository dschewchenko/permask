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
</script>

<template>
  <div class="container">
    <header>
      <h1>Permask Playground</h1>
      <div class="actions">
        <button @click="exportConfig">Export Config</button>
      </div>
    </header>
    
    <main>
      <section class="config-section">
        <h2>Group Configuration</h2>
        <GroupManager 
          :groups="groups" 
          @update-groups="updateGroups" 
        />
      </section>
      
      <section class="permissions-section">
        <h2>Permission Configuration</h2>
        <PermissionTable 
          :groups="groups" 
          :permissions="permissions" 
          :permask="permask"
          @update-permissions="updatePermissions"
          @add-permission="addPermission"
        />
      </section>
      
      <section class="preview-section">
        <h2>Code Preview</h2>
        <CodePreview 
          :groups="groups" 
          :permissions="permissions"
          :permask="permask"
        />
      </section>
    </main>
  </div>
</template>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eaeaea;
}

h1 {
  margin: 0;
  color: #333;
}

main {
  display: grid;
  grid-template-columns: 1fr;
  gap: 30px;
}

@media (min-width: 1024px) {
  main {
    grid-template-columns: 1fr 1fr;
  }
  
  .preview-section {
    grid-column: span 2;
  }
}

section {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

h2 {
  margin-top: 0;
  color: #444;
  font-size: 1.25rem;
}

button {
  background-color: #4b70e2;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

button:hover {
  background-color: #3a5bbf;
}
</style>
