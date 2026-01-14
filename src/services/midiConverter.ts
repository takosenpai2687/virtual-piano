import type { MidiNote } from '@/types/piano';

interface MidiEvent {
  deltaTime: number;
  type: string;
  channel?: number;
  noteNumber?: number;
  velocity?: number;
  metaType?: number;
  metaData?: Uint8Array;
}

interface MidiTrack {
  events: MidiEvent[];
}

interface MidiData {
  header: {
    format: number;
    numTracks: number;
    ticksPerBeat: number;
  };
  tracks: MidiTrack[];
}

export class MidiConverter {
  /**
   * Parse a MIDI file from an ArrayBuffer
   */
  static async parseMidiFile(buffer: ArrayBuffer): Promise<MidiNote[]> {
    const view = new DataView(buffer);
    let offset = 0;

    // Read header chunk
    const headerChunk = this.readString(view, offset, 4);
    if (headerChunk !== 'MThd') {
      throw new Error('Invalid MIDI file: Missing MThd header');
    }
    offset += 4;

    const headerLength = view.getUint32(offset);
    offset += 4;

    const format = view.getUint16(offset);
    offset += 2;

    const numTracks = view.getUint16(offset);
    offset += 2;

    const ticksPerBeat = view.getUint16(offset);
    offset += 2;

    const tracks: MidiTrack[] = [];

    // Read all tracks
    for (let i = 0; i < numTracks; i++) {
      const trackChunk = this.readString(view, offset, 4);
      if (trackChunk !== 'MTrk') {
        throw new Error(`Invalid MIDI file: Missing MTrk header for track ${i}`);
      }
      offset += 4;

      const trackLength = view.getUint32(offset);
      offset += 4;

      const trackEnd = offset + trackLength;
      const events: MidiEvent[] = [];

      let runningStatus = 0;
      while (offset < trackEnd) {
        const { value: deltaTime, bytesRead } = this.readVariableLength(view, offset);
        offset += bytesRead;

        let statusByte = view.getUint8(offset);
        let isRunningStatus = false;

        // Handle running status
        if (statusByte < 0x80) {
          statusByte = runningStatus;
          isRunningStatus = true;
        } else {
          offset++;
          runningStatus = statusByte;
        }

        const eventType = statusByte >> 4;
        const channel = statusByte & 0x0f;

        let event: MidiEvent = { deltaTime, type: 'unknown' };

        if (eventType === 0x08) {
          // Note Off
          const noteNumber = view.getUint8(offset++);
          const velocity = view.getUint8(offset++);
          event = { deltaTime, type: 'noteOff', channel, noteNumber, velocity };
        } else if (eventType === 0x09) {
          // Note On
          const noteNumber = view.getUint8(offset++);
          const velocity = view.getUint8(offset++);
          // Note: velocity 0 is actually note off
          event = {
            deltaTime,
            type: velocity === 0 ? 'noteOff' : 'noteOn',
            channel,
            noteNumber,
            velocity
          };
        } else if (eventType === 0x0a || eventType === 0x0b || eventType === 0x0e) {
          // Aftertouch, Control Change, Pitch Bend (2 bytes)
          offset += 2;
          event = { deltaTime, type: 'other' };
        } else if (eventType === 0x0c || eventType === 0x0d) {
          // Program Change, Channel Pressure (1 byte)
          offset += 1;
          event = { deltaTime, type: 'other' };
        } else if (statusByte === 0xff) {
          // Meta event
          const metaType = view.getUint8(offset++);
          const { value: length, bytesRead: lengthBytes } = this.readVariableLength(view, offset);
          offset += lengthBytes;

          // Store meta event data for tempo extraction
          const metaData = new Uint8Array(length);
          for (let i = 0; i < length; i++) {
            metaData[i] = view.getUint8(offset + i);
          }
          offset += length;

          event = { deltaTime, type: 'meta', metaType, metaData } as any;
        } else if (statusByte === 0xf0 || statusByte === 0xf7) {
          // SysEx event
          const { value: length, bytesRead: lengthBytes } = this.readVariableLength(view, offset);
          offset += lengthBytes + length;
          event = { deltaTime, type: 'sysex' };
        }

        events.push(event);
      }

      tracks.push({ events });
    }

    // Convert to our MidiNote format
    return this.convertToMidiNotes(tracks, ticksPerBeat);
  }

  private static convertToMidiNotes(tracks: MidiTrack[], ticksPerBeat: number): MidiNote[] {
    const noteOnEvents = new Map<string, { time: number; key: number; velocity: number }>();
    const midiNotes: MidiNote[] = [];

    // Extract tempo from tempo meta events (default to 120 BPM if not found)
    let microsecondsPerBeat = 500000; // Default: 500,000 microseconds per quarter note = 120 BPM

    // First pass: find tempo in the first track (usually track 0)
    if (tracks.length > 0) {
      for (const event of tracks[0].events) {
        if (
          event.type === 'meta' &&
          event.metaType === 0x51 &&
          event.metaData &&
          event.metaData.length === 3
        ) {
          // Tempo meta event (0x51): 3 bytes representing microseconds per quarter note
          microsecondsPerBeat =
            (event.metaData[0] << 16) | (event.metaData[1] << 8) | event.metaData[2];
          break; // Use the first tempo we find
        }
      }
    }

    // Calculate time in milliseconds per tick using the tempo
    // microseconds per beat / ticks per beat = microseconds per tick
    // microseconds per tick / 1000 = milliseconds per tick
    const msPerTick = microsecondsPerBeat / ticksPerBeat / 1000;

    // Combine all tracks
    const allEvents: Array<{ event: MidiEvent; track: number }> = [];
    tracks.forEach((track, trackIndex) => {
      let time = 0;
      track.events.forEach((event) => {
        time += event.deltaTime;
        allEvents.push({ event: { ...event, deltaTime: time }, track: trackIndex });
      });
    });

    // Sort by time
    allEvents.sort((a, b) => a.event.deltaTime - b.event.deltaTime);

    // Process events
    allEvents.forEach(({ event }) => {
      const timeMs = Math.round(event.deltaTime * msPerTick);

      if (
        event.type === 'noteOn' &&
        event.noteNumber !== undefined &&
        event.velocity !== undefined
      ) {
        const key = `${event.noteNumber}-${event.channel}`;
        noteOnEvents.set(key, {
          time: timeMs,
          key: event.noteNumber,
          velocity: event.velocity
        });
      } else if (event.type === 'noteOff' && event.noteNumber !== undefined) {
        const key = `${event.noteNumber}-${event.channel}`;
        const noteOn = noteOnEvents.get(key);

        if (noteOn) {
          const duration = timeMs - noteOn.time;
          if (duration > 0) {
            midiNotes.push({
              TimeMs: noteOn.time,
              Key: noteOn.key,
              DurationMs: duration,
              Vel: noteOn.velocity
            });
          }
          noteOnEvents.delete(key);
        }
      }
    });

    // Sort by time
    return midiNotes.sort((a, b) => a.TimeMs - b.TimeMs);
  }

  private static readString(view: DataView, offset: number, length: number): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += String.fromCharCode(view.getUint8(offset + i));
    }
    return result;
  }

  private static readVariableLength(
    view: DataView,
    offset: number
  ): { value: number; bytesRead: number } {
    let value = 0;
    let bytesRead = 0;
    let byte: number;

    do {
      byte = view.getUint8(offset + bytesRead);
      value = (value << 7) | (byte & 0x7f);
      bytesRead++;
    } while (byte & 0x80);

    return { value, bytesRead };
  }

  /**
   * Export MidiNote[] to JSON string
   */
  static exportToJson(notes: MidiNote[]): string {
    return JSON.stringify(notes, null, 2);
  }

  /**
   * Export MidiNote[] to JavaScript file format (for compatibility with existing playlists)
   */
  static exportToJs(notes: MidiNote[], variableName = 'midifile'): string {
    return `var ${variableName} = ${JSON.stringify(notes, null, 2)};`;
  }
}
