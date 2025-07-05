<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { PermissionAccess } from "../../../../src";

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
  <div class="overflow-x-auto">
    <table class="w-full border-collapse">
      <thead>
        <tr>
          <th class="p-3 bg-gray-100 font-semibold text-left">Group</th>
          <th class="p-3 bg-gray-100 font-semibold text-center">Read</th>
          <th class="p-3 bg-gray-100 font-semibold text-center">Create</th>
          <th class="p-3 bg-gray-100 font-semibold text-center">Update</th>
          <th class="p-3 bg-gray-100 font-semibold text-center">Delete</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(groupValue, groupKey) in groups"
          :key="groupKey"
          class="hover:bg-gray-50 border-b border-gray-200"
        >
          <td class="p-3 font-medium">{{ groupKey }}</td>
          <td class="p-3 text-center">
            <input
              type="checkbox"
              :checked="permissionsMap[groupKey]?.read"
              @change="updatePermission(groupKey, 'read', $event.target.checked)"
              class="w-4 h-4 cursor-pointer accent-blue-600"
            />
          </td>
          <td class="p-3 text-center">
            <input
              type="checkbox"
              :checked="permissionsMap[groupKey]?.create"
              @change="updatePermission(groupKey, 'create', $event.target.checked)"
              class="w-4 h-4 cursor-pointer accent-blue-600"
            />
          </td>
          <td class="p-3 text-center">
            <input
              type="checkbox"
              :checked="permissionsMap[groupKey]?.update"
              @change="updatePermission(groupKey, 'update', $event.target.checked)"
              class="w-4 h-4 cursor-pointer accent-blue-600"
            />
          </td>
          <td class="p-3 text-center">
            <input
              type="checkbox"
              :checked="permissionsMap[groupKey]?.delete"
              @change="updatePermission(groupKey, 'delete', $event.target.checked)"
              class="w-4 h-4 cursor-pointer accent-blue-600"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
</style>
