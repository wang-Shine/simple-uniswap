// 声明 <appkit-button /> 为合法 JSX 元素,它是 Reown AppKit 注入的 Web Component,不需要 import
declare namespace JSX {
  interface IntrinsicElements {
    "appkit-button": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
  }
}
