<script setup lang="ts">
import { ref, computed } from "vue";

// Props
const props = defineProps<{
  groups: Record<string, number>;
}>();

// Emits
const emit = defineEmits<{
  (e: "update-groups", groups: Record<string, number>): void;
}>();

// Create a copy of groups to work with locally
const localGroups = ref<Record<string, string | number>>({...props.groups});

// For adding new groups
const newGroupName = ref("");
const nextGroupId = computed(() => {
  const currentIds = Object.values(props.groups).filter(id => typeof id === "number") as number[];
  return currentIds.length > 0 ? Math.max(...currentIds) + 1 : 1;
});

// Add a new group
const addGroup = () => {
  if (!newGroupName.value.trim()) return;
  
  // Convert to uppercase for consistency
  const formattedName = newGroupName.value.trim().toUpperCase();
  
  // Check if name already exists
  if (Object.keys(localGroups.value).includes(formattedName)) {
    alert(`Group "${formattedName}" already exists.`);
    return;
  }
  
  // Add the new group
  localGroups.value[formattedName] = nextGroupId.value;
  
  // Update parent
  emit("update-groups", {...localGroups.value});
  
  // Reset form
  newGroupName.value = "";
};

// Remove a group
const removeGroup = (groupName: string) => {
  const updatedGroups = {...localGroups.value};
  delete updatedGroups[groupName];
  
  // Update local reference and parent
  localGroups.value = updatedGroups;
  emit("update-groups", {...updatedGroups});
};
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-2 max-h-[250px] overflow-y-auto">
      <div 
        v-for="(groupId, groupName) in localGroups" 
        :key="groupName" 
        class="flex justify-between items-center p-2 px-3 bg-white rounded border border-gray-200"
      >
        <div class="flex items-center gap-2">
          <span class="font-medium">{{ groupName }}</span>
          <span class="text-sm text-gray-500">(ID: {{ groupId }})</span>
        </div>
        <button 
          @click="removeGroup(groupName)" 
          class="w-7 h-7 flex items-center justify-center bg-gray-100 hover:bg-red-500 hover:text-white text-gray-600 rounded border border-gray-200 hover:border-red-500 transition-colors"
          title="Remove this group"
        >
          ✕
        </button>
      </div>
      
      <div 
        v-if="Object.keys(localGroups).length === 0" 
        class="py-4 text-center text-gray-500 italic bg-white rounded border border-dashed border-gray-300"
      >
        No groups defined. Add a group below.
      </div>
    </div>
    
    <div class="flex gap-2 mt-1">
      <input 
        v-model="newGroupName" 
        placeholder="New group name"
        @keyup.enter="addGroup"
        class="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <button 
        @click="addGroup"
        class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm font-medium transition-colors"
      >
        Add Group
      </button>
    </div>
  </div>
</template>
