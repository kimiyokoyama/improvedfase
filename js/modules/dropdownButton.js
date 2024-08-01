export default class DropwdownButton {
  /**
   * Create a dropdown button
   * @param {string} text - button text
   * @param {Array<Object<{text: string, callback: Function}>>} list - list of objects with display text and a callback function
   * @param {number} id - button id
   * @param {boolean} closeOnClick - if choosing from the list should close the dropdown
   */
  constructor(text, list, id, closeOnClick = true) {
    this.list = list;
    this.isOpen = false;

    // initialize button
    this.button = document.createElement("button");
    this.button.classList.add("dropdown-button");
    this.button.innerHTML = text;
    if (id) this.button.id = id;
    this.button.addEventListener("click", () => this.toggleList());

    // initialize dropdown
    this.dropdown = document.createElement("div");
    this.dropdown.classList.add("dropdown-content");
    this.list.forEach((item) => {
      const button = document.createElement("button");
      button.innerHTML = item.text;
      if (item.link) {
        // add launch svg icon
        const launchSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        launchSvg.classList.add("launch-svg");
        launchSvg.setAttribute("viewBox", "0 0 24 24");
        launchSvg.setAttribute("fill", "currentColor");
        // launch icon path from mui icons https://mui.com/material-ui/material-icons/
        launchSvg.innerHTML = `<path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3z"></path>`;
        button.appendChild(launchSvg);
      }
      button.addEventListener("click", () => {
        item.callback();
        if (closeOnClick) this.toggleList(false);
      });
      this.dropdown.appendChild(button);
    });

    // close dropdown when unfocused
    window.addEventListener("click", (e) => {
      if (this.isOpen) this.toggleList(e.composedPath().includes(this.dropdown) || e.composedPath().includes(this.button));
    });
  }

  /**
   * Toggle the dropdown list
   * @param {boolean} open - if the list should be open or closed
   */
  toggleList(open = !this.isOpen) {
    this.isOpen = open;
    if (this.dropdown) this.dropdown.classList.toggle("show", this.isOpen);
  }

  /**
   * Append the dropdown button to a parent element
   * @param {HTMLElement} parent - the parent element
   */
  appendTo(parent) {
    parent.appendChild(this.button);
    parent.appendChild(this.dropdown);
  }

  /**
   * Replace an element with the dropdown button
   * @param {HTMLElement} parent - the parent element
   * @param {HTMLElement} sibling - the sibling element
   */
  insertBefore(parent, sibling) {
    parent.insertBefore(this.button, sibling);
    parent.insertBefore(this.dropdown, sibling);
  }
}
