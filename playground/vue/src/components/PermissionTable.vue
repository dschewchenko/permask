<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { PermissionAccess } from "permask";

// Props
const props = defineProps<{
  groups: Record<string, number>;
  permissions: number[];
  permask: any; // Permask instance
}>();

// Emits
const emit = defineEmits<{
  (e: "update-permissions", permissions: number[]): void;
  (e: "add-permission", groupKey: string, read: boolean, create: boolean, update: boolean, del: boolean): void;
}>();

// Calculate the current permissions state as a more convenient format for rendering
const permissionsMap = computed(() => {
  const map: Record<string, { read: boolean; create: boolean; update: boolean; delete: boolean }> = {};
  
  // Initialize with default values (all false) for each group
  Object.keys(props.groups).forEach(groupKey => {
    map[groupKey] = { read: false, create: false, update: false, delete: false };
  });
  
  // Update with actual values from permissions
  props.permissions.forEach(bitmask => {
    const groupName = props.permask.getGroupName(bitmask);
    if (groupName) {
      const parsed = props.permask.parse(bitmask);
      map[groupName] = {
        read: parsed.read,
        create: parsed.create,
        update: parsed.update,
        delete: parsed.delete
      };
    }
  });
  
  return map;
});

// Handle checkbox changes
const updatePermission = (groupKey: string, permission: "read" | "create" | "update" | "delete", value: boolean) => {
  const currentPerms = { ...permissionsMap.value[groupKey] };
  currentPerms[permission] = value;
  
  emit("add-permission", 
    groupKey, 
    currentPerms.read, 
    currentPerms.create, 
    currentPerms.update, 
    currentPerms.delete
  );
};

// Reactively update when groups change
watch(() => props.groups, () => {
  // The computed permissionsMap will handle the updates
}, { deep: true });
</script>

<template>
  <div class="permission-table-wrapper">
    <table class="permission-table">
      <thead>
        <tr>
          <th>Group</th>
          <th>Read</th>
          <th>Create</th>
          <th>Update</th>
          <th>Delete</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(groupValue, groupKey) in groups" :key="groupKey">
          <td>{{ groupKey }}</td>
          <td>
            <input 
              type="checkbox" 
              :checked="permissionsMap[groupKey]?.read" 
              @change="updatePermission(groupKey, 'read', $event.target.checked)" 
            />
          </td>
          <td>
            <input 
              type="checkbox" 
              :checked="permissionsMap[groupKey]?.create" 
              @change="updatePermission(groupKey, 'create', $event.target.checked)" 
            />
          </td>
          <td>
            <input 
              type="checkbox" 
              :checked="permissionsMap[groupKey]?.update" 
              @change="updatePermission(groupKey, 'update', $event.target.checked)" 
            />
          </td>
          <td>
            <input 
              type="checkbox" 
              :checked="permissionsMap[groupKey]?.delete" 
              @change="updatePermission(groupKey, 'delete', $event.target.checked)" 
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.permission-table-wrapper {
  overflow-x: auto;
}

.permission-table {
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
}

.permission-table th, 
.permission-table td {
  padding: 12px 15px;
  text-align: center;
  border-bottom: 1px solid #ddd;
}

.permission-table th {
  background-color: #f2f2f2;
  font-weight: 600;
}

.permission-table td:first-child {
  text-align: left;
  font-weight: 500;
}

.permission-table tr:hover {
  background-color: #f5f5f5;
}

input[type="checkbox"] {
  transform: scale(1.2);
  cursor: pointer;
}
</style>