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
  <div class="group-manager">
    <div class="groups-list">
      <div v-for="(groupId, groupName) in localGroups" :key="groupName" class="group-item">
        <div class="group-info">
          <span class="group-name">{{ groupName }}</span>
          <span class="group-id">(ID: {{ groupId }})</span>
        </div>
        <button 
          @click="removeGroup(groupName)" 
          class="remove-btn"
          title="Remove this group"
        >
          ✕
        </button>
      </div>
      
      <div v-if="Object.keys(localGroups).length === 0" class="no-groups">
        No groups defined. Add a group below.
      </div>
    </div>
    
    <div class="add-group-form">
      <input 
        v-model="newGroupName" 
        placeholder="New group name"
        @keyup.enter="addGroup"
      />
      <button @click="addGroup">Add Group</button>
    </div>
  </div>
</template>

<style scoped>
.group-manager {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.groups-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 250px;
  overflow-y: auto;
}

.group-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: white;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.group-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-name {
  font-weight: 500;
}

.group-id {
  font-size: 0.85rem;
  color: #666;
}

.no-groups {
  padding: 15px;
  text-align: center;
  color: #777;
  font-style: italic;
  background-color: white;
  border-radius: 4px;
  border: 1px dashed #ddd;
}

.add-group-form {
  display: flex;
  gap: 8px;
  margin-top: 5px;
}

.add-group-form input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.remove-btn {
  background-color: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  font-size: 12px;
}

.remove-btn:hover {
  background-color: #ff4d4f;
  color: white;
  border-color: #ff4d4f;
}
</style>
