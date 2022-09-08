package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"sort"
	"time"

	"gitlab.com/gomidi/midi/reader"
)

type NoteInfo struct {
	IsOn bool
	Key  int
	Vel  int
}

type OutPutInfo struct {
	TimeMs     int
	Key        int
	DurationMs int
	Vel        int
}

func main() {
	sheet = make(map[uint64]NoteInfo)
	f := midPath
	rd := reader.New(
		reader.NoLogger(),
		reader.NoteOn(writeNote(true)),
		reader.NoteOff(writeNote(false)),
	)
	err := reader.ReadSMFFile(rd, f)

	if err != nil {
		fmt.Printf("could not read SMF file %v\n", f)
		os.Exit(1)
	}

	// prepare keys
	keys := make([]uint64, 0)
	for k := range sheet {
		keys = append(keys, k)
	}
	sort.Slice(keys, func(i, j int) bool { return keys[i] < keys[j] })
	fmt.Printf("Load file complete.\nTotal notes:\t%d\n", len(keys))

	// Write to Output JSON
	var output []OutPutInfo
	for i, timeStamp := range keys {
		if !sheet[timeStamp].IsOn {
			continue
		}
		timeMs := reader.Duration(rd, uint32(keys[i])) / time.Millisecond
		duration := 0
		for j := i + 1; j < len(keys); j++ {
			if !sheet[keys[j]].IsOn && sheet[keys[j]].Key == sheet[timeStamp].Key {
				duration = int(reader.Duration(rd, uint32(keys[j]-keys[i])) / time.Millisecond)
				break
			}
		}
		output = append(output, OutPutInfo{TimeMs: int(timeMs), DurationMs: duration, Key: sheet[timeStamp].Key, Vel: sheet[timeStamp].Vel})
	}
	file, _ := json.MarshalIndent(output, "", " ")
	_ = ioutil.WriteFile("output/test.json", file, 0644)
	fmt.Printf("FILE SAVED\n")

}

func printSheet(sheet map[uint64]NoteInfo) {
	keys := make([]uint64, 0)
	for k := range sheet {
		keys = append(keys, k)
	}
	sort.Slice(keys, func(i, j int) bool { return keys[i] < keys[j] })
	for _, key := range keys {
		if sheet[key].IsOn {
			fmt.Printf("TICK %d\t\t%v\n", key, sheet[key])
		}
	}
}

func writeNote(isOn bool) func(*reader.Position, uint8, uint8, uint8) {
	return func(p *reader.Position, channel, key, vel uint8) {
		if MAX_NOTES > 0 && noteCount > MAX_NOTES {
			return
		}
		var offset uint64 = 0
		for _, ok := sheet[p.AbsoluteTicks+offset]; ok; _, ok = sheet[p.AbsoluteTicks+offset] {
			offset++
		}
		sheet[(p.AbsoluteTicks+offset)*RYTHM_MULTIPLIER] = NoteInfo{IsOn: isOn, Key: int(key), Vel: int(vel)}
		noteCount++
	}
}
