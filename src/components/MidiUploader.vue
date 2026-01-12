<template>
  <div class="relative inline-block z-20">
    <button
      @click="showUpload = !showUpload"
      class="bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-500 hover:to-red-500 text-white rounded-full shadow-lg font-extrabold transition-all flex items-center active:scale-95"
      style="padding: 0.5rem 1rem; font-size: 0.875rem;"
    >
      <i class="fas fa-upload" style="margin-right: 0.5rem;"></i>
      {{ showUpload ? 'Hide' : 'Upload' }}
    </button>

    <div
      v-if="showUpload"
      class="absolute top-full left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur rounded-lg shadow-xl"
      style="margin-top: 0.5rem; padding: 1rem; width: 20rem;"
    >
      <h3 class="font-bold text-gray-800" style="font-size: 1.125rem; margin-bottom: 0.75rem;">Upload MIDI File</h3>
      
      <div style="margin-bottom: 0.75rem;">
        <label class="block font-medium text-gray-700" style="font-size: 0.875rem; margin-bottom: 0.5rem;">
          Select MIDI file to convert:
        </label>
        <input
          ref="fileInput"
          type="file"
          accept=".mid,.midi"
          @change="onFileSelect"
          class="block w-full border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
          style="font-size: 0.875rem; color: #111827; padding: 0.5rem;"
        />
      </div>

      <div v-if="converting" class="text-center" style="padding: 1rem 0;">
        <div class="inline-block animate-spin rounded-full border-4 border-pink-600 border-t-transparent" style="height: 2rem; width: 2rem;"></div>
        <p class="text-gray-600" style="margin-top: 0.5rem;">Converting MIDI file...</p>
      </div>

      <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 rounded" style="margin-top: 0.75rem; padding: 0.75rem;">
        <i class="fas fa-exclamation-triangle" style="margin-right: 0.5rem;"></i>
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { MidiConverter } from '@/services/midiConverter';
import type { MidiNote } from '@/types/piano';

const emit = defineEmits<{
  (e: 'notesConverted', notes: MidiNote[], fileName: string, autoPlay?: boolean): void;
  (e: 'sheetSaved'): void;
}>();

const showUpload = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const converting = ref(false);
const convertedNotes = ref<MidiNote[]>([]);
const currentFileName = ref('');
const error = ref('');

const onFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file) return;
  
  error.value = '';
  converting.value = true;
  // Remove only the .mid or .midi extension, keep everything else including dashes
  currentFileName.value = file.name.replace(/\.(mid|midi)$/i, '');
  
  try {
    const buffer = await file.arrayBuffer();
    const notes = await MidiConverter.parseMidiFile(buffer);
    convertedNotes.value = notes;
    
    // Auto-save to localStorage
    const savedSheetsJson = localStorage.getItem('customSheets');
    const savedSheets = savedSheetsJson ? JSON.parse(savedSheetsJson) : {};
    const sheetKey = `custom_${currentFileName.value.replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    savedSheets[sheetKey] = {
      name: currentFileName.value,
      notes: notes
    };
    
    localStorage.setItem('customSheets', JSON.stringify(savedSheets));
    
    // Emit events
    emit('sheetSaved');
    emit('notesConverted', notes, currentFileName.value, true);
    showUpload.value = false;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to convert MIDI file';
    console.error('MIDI conversion error:', err);
  } finally {
    converting.value = false;
  }
};
</script>
