/**
 * KaTeX rendering components
 * Usage:
 *   <Eq>x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}</Eq>          // inline
 *   <EqBlock>x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}</EqBlock> // display
 */
import React, { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

function render(el, latex, displayMode) {
  if (!el) return;
  try {
    katex.render(latex, el, {
      displayMode,
      throwOnError: false,
      trust: false,
      strict: false,
      macros: {
        "\\F": "\\text{F90-CRI}",
        "\\EFA": "\\text{EFA}",
        "\\rho": "\\varrho",
      },
    });
  } catch (err) {
    el.textContent = latex;
  }
}

/** Inline equation — renders in the flow of text */
export function Eq({ children }) {
  const ref = useRef(null);
  useEffect(() => render(ref.current, String(children), false), [children]);
  return <span ref={ref} className="katex-inline" />;
}

/** Display (block) equation — centred on its own line */
export function EqBlock({ children, label }) {
  const ref = useRef(null);
  useEffect(() => render(ref.current, String(children), true), [children]);
  return (
    <div className="my-4 overflow-x-auto">
      <div ref={ref} className="katex-display-wrap" />
      {label && (
        <p className="text-xs text-center mt-1 opacity-50 font-mono">{label}</p>
      )}
    </div>
  );
}

/** Aligned multi-line derivation */
export function EqAligned({ children, label }) {
  const latex = `\\begin{aligned}${children}\\end{aligned}`;
  return <EqBlock label={label}>{latex}</EqBlock>;
}

/** Symbol glossary entry */
export function Symbol({ sym, description }) {
  return (
    <tr className="border-b border-white/10">
      <td className="py-2 pr-6 font-mono text-gold w-24">
        <Eq>{sym}</Eq>
      </td>
      <td className="py-2 text-sm opacity-80">{description}</td>
    </tr>
  );
}
