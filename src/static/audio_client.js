/**
 * Main of `index.html` - audio client
 *
 * @author aKuad
 */

import { keep_wake_lock } from "./util/keep_wake_lock.js";
import { AudioClientModule } from "./audio_connect/AudioClientModule.js";
import { TallyLightUI } from "./TallyLightUI/TallyLightUI.js";


globalThis.addEventListener("load", () => {
  /* Input checking */
  document.getElementById("control-container").addEventListener("input", e => {
    const input_name = e.target.value;

    if(input_name === "") {
      // If empty input
      set_input_error("Lane name can't be empty");
    } else if(!(/^[\x20-\x7F]*$/.test(input_name))) {
      // If non ascii input
      set_input_error("Non ascii disallowed for lane name");
    } else {
      // Correct input
      set_input_error("");
    }
  });

  function set_input_error(message) {
    if(message === "") {
      document.getElementById("lane-name-input").classList.remove("invalid-input");
      document.getElementById("connect-start").disabled = false;
      document.getElementById("error-view").innerText = "";
    } else {
      document.getElementById("lane-name-input").classList.add("invalid-input");
      document.getElementById("connect-start").disabled = true;
      document.getElementById("error-view").innerText = message;
    }
  }


  /* Start connection */
  document.getElementById("connect-start").addEventListener("click", () => {
    // Behavior properties
    const lane_name = document.getElementById("lane-name-input").value;
    const is_tally_mode = 1 <= Number(lane_name) && Number(lane_name) <= 8; // If Number(lane_name) is NaN, it will be false

    // Prevent system lock or display sleep
    keep_wake_lock();

    // Start audio connection
    const audio_client_module = new AudioClientModule("/api/audio", lane_name, -40.0);

    // View update for communicating
    if(is_tally_mode) {
      // For tally light mode
      const error_view_elem = document.getElementById("error-view");
      document.body.replaceChildren();                    // Clear view
      const tally_light_ui = new TallyLightUI(lane_name); // Tally view set
      document.body.appendChild(error_view_elem);         // Error view restore

      const tally_source_id = Number(lane_name);
      audio_client_module.addEventListener("ext-bytes-received", e => {
        const is_in_preview = Boolean((e.data[0] >>> (tally_source_id - 1)) & 0b1);
        const is_in_program = Boolean((e.data[1] >>> (tally_source_id - 1)) & 0b1);

        if(is_in_program) {
          tally_light_ui.set_light_red();
        } else if(is_in_preview) {
          tally_light_ui.set_light_green();
        } else {
          tally_light_ui.set_light_off();
        }
      });

    } else {
      // For normal mode
      document.getElementById("lane-name-guide").innerText = "Lane name:";
      document.getElementById("lane-name-input").remove();
      document.getElementById("connect-start").remove();
      document.getElementById("mixer-client-link").remove();
      document.getElementById("lane-name-view").innerText = lane_name;
    }

    // Connection closed event
    audio_client_module.websocket_obj.addEventListener("close", () => {
      document.getElementById("error-view").innerText = "Connection closed by server";
    });
    audio_client_module.websocket_obj.addEventListener("error", () => {
      document.getElementById("error-view").innerText = "Connection error occurred";
    });
  });
});
