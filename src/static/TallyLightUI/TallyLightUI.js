/**
 * @file Provides tally light UI - full screen large font text & background color switching
 *
 * @author aKuad
 */


export class TallyLightUI {
  /**
   * Light viewing element
   *
   * @type {HTMLDivElement}
   */
  #light_view;


  /**
   * Provides tally light UI - full screen large font text & background color switching
   *
   * Note: It uses all field of screen, then all elements in body will be hidden
   *
   * @param {string} view_text Text to view on tally light
   */
  constructor(view_text) {
    this.#light_view = document.createElement("div");
    this.#light_view.classList.add("TallyLightUI-view");
    this.#light_view.innerText = view_text;
    document.body.appendChild(this.#light_view);
  }


  /**
   * Turn light (background color) to red
   */
  set_light_red() {
    this.#light_view.style.backgroundColor = "hsl(0, 100%, 70%)";
  }


  /**
   * Turn light (background color) to green
   */
  set_light_green() {
    this.#light_view.style.backgroundColor = "hsl(130, 100%, 70%)";
  }


  /**
   * Turn light (background color) to OFF (dark gray)
   */
  set_light_off() {
    this.#light_view.style.backgroundColor = "";  // Reset style to use style in `TallyLightUI.css`
  }
}
