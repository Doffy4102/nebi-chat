export function setSvgContent(parent: HTMLElement, svgContent: string): void {
  parent.empty();
  const doc = new DOMParser().parseFromString(svgContent, "image/svg+xml");
  const svg = doc.querySelector("svg");
  if (svg) parent.appendChild(document.importNode(svg, true));
}

export function createSvgIcon(parent: HTMLElement, svgContent: string): HTMLElement {
  const wrapper = parent.createDiv({ cls: "nebi-chat-icon-wrapper" });
  setSvgContent(wrapper, svgContent);
  return wrapper;
}
