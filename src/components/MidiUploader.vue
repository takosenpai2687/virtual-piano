<template>
  <div class="relative inline-block z-20">
    <button
      @click="showUpload = !showUpload"
      class="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg shadow-lg font-semibold transition-all flex items-center"
    >
      <i class="fas fa-upload mr-2"></i>
      {{ showUpload ? 'Hide' : 'Upload' }}
    </button>

    <div
      v-if="showUpload"
      class="absolute top-full left-0 mt-2 p-4 bg-white/95 backdrop-blur rounded-lg shadow-xl w-80 transform -translate-x-1/2 left-1/2"
    >
      <h3 class="text-lg font-bold text-gray-800 mb-3">Upload MIDI File</h3>
      
      <div class="mb-3">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Select MIDI file to convert:
        </label>
        <input
          ref="fileInput"
          type="file"
          accept=".mid,.midi"
          @change="onFileSelect"
          class="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none p-2"
        />
      </div>

      <div v-if="converting" class="text-center py-4">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent"></div>
        <p class="text-gray-600 mt-2">Converting MIDI file...</p>
      </div>

      <div v-if="convertedNotes.length > 0" class="mt-4">
        <p class="text-green-600 font-semibold mb-2">
          <i class="fas fa-check-circle mr-2"></i>
          Converted {{ convertedNotes.length }} notes!
        </p>
        
        <div class="flex gap-2">
          <button
            @click="downloadJson"
            class="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-semibold text-sm transition-all"
          >
            <i class="fas fa-download mr-1"></i>
            JSON
          </button>
          <button
            @click="downloadJs"
            class="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded font-semibold text-sm transition-all"
          >
            <i class="fas fa-download mr-1"></i>
            JS
          </button>
          <button
            @click="useConverted"
            class="flex-1 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded font-semibold text-sm transition-all"
          >
            <i class="fas fa-play mr-1"></i>
            Play
          </button>
        </div>
      </div>

      <div v-if="error" class="mt-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
        <i class="fas fa-exclamation-triangle mr-2"></i>
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
  (e: 'notesConverted', notes: MidiNote[], fileName: string): void;
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
  currentFileName.value = file.name.replace(/\.(mid|midi)$/i, '');
  
  try {
    const buffer = await file.arrayBuffer();
    const notes = await MidiConverter.parseMidiFile(buffer);
    convertedNotes.value = notes;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to convert MIDI file';
    console.error('MIDI conversion error:', err);
  } finally {
    converting.value = false;
  }
};

const downloadJson = () => {
  const json = MidiConverter.exportToJson(convertedNotes.value);
  downloadFile(json, `${currentFileName.value}.json`, 'application/json');
};

const downloadJs = () => {
  const js = MidiConverter.exportToJs(convertedNotes.value);
  downloadFile(js, `${currentFileName.value}.js`, 'text/javascript');
};

const downloadFile = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const useConverted = () => {
  emit('notesConverted', convertedNotes.value, currentFileName.value);
  showUpload.value = false;
};
</script>
