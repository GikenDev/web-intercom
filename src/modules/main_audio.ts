/**
 * Part of `main.ts` for audio client websocket processing
 *
 * @author aKuad
 */

import { Atem, AtemState } from "npm:atem-connection";

import { AudioMixer } from "./AudioMixer.ts";
import { is_audio_packet, packet_audio_encode, packet_audio_decode } from "../static/packet_conv/audio.js";
import { atem_tally_extract } from "./atem_tally_extract.ts";


/**
 * Audio client websocket processing
 *
 * @param socket WebSocket for communicate client
 * @param audio_mixer AudioMixer of server core
 * @param atem Connected Atem object to read state
 */
export function main_audio(socket: WebSocket, audio_mixer: AudioMixer, atem: Atem): void {
  socket.binaryType = "arraybuffer";
  let lane_id: number;
  let ext_bytes_next = new Uint8Array(0);

  // Switcher using camera source extraction from atem status
  // Note: Accept only source ID 1~8, then over 9 sources will be ignored, cause unnecessary for our use
  if(atem.state) {
    ext_bytes_next = Uint8Array.from(atem_tally_extract(atem.state)); // For init
  }
  function on_state_changed(state: AtemState) {
    ext_bytes_next = Uint8Array.from(atem_tally_extract(state));      // For state changed
  }
  atem.on("stateChanged", on_state_changed);

  // Mixer new lane initialization
  socket.addEventListener("open", () => {
    lane_id = audio_mixer.create_lane();
  });

  // Audio mixing process & tally status send
  socket.addEventListener("message", e => {
    const ws_receive = new Uint8Array(e.data);
    if(!is_audio_packet(ws_receive)) { return; }  // Do nothing for non audio packet
    const { audio_pcm, lane_name } = packet_audio_decode(ws_receive);
    const mixed_pcm = audio_mixer.lane_io(lane_id, audio_pcm, lane_name);
    const ws_return = packet_audio_encode(mixed_pcm, lane_name, ext_bytes_next);

    socket.send(ws_return.buffer);
    ext_bytes_next = new Uint8Array(0);
  });

  // Mixer lane deletion & atem state event removing on disconnected
  function on_socket_closed() {
    audio_mixer.delete_lane(lane_id);
    atem.removeListener("stateChanged", on_state_changed);
  }
  socket.addEventListener("close", on_socket_closed);
  socket.addEventListener("error", on_socket_closed);
}
