/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import katex from 'katex';

interface LatexRendererProps {
  text: string;
}

export default function LatexRenderer({ text }: LatexRendererProps) {
  if (!text) return null;

  // Preprocess text to align math block delimiters:
  // Convert \[ \] into $$ and \( \) into $
  const preprocessed = text
    .replace(/\\\[/g, '$$$$')
    .replace(/\\\]/g, '$$$$')
    .replace(/\\\(/g, '$')
    .replace(/\\\)/g, '$');

  // Split by $$ to separate block math from non-block math parts
  const blockParts = preprocessed.split('$$');

  // Helper to check and auto-wrap un-delimited LaTeX macros (e.g. \frac without $)
  const autoWrapLaTeX = (inlineText: string): string => {
    // If it already has delimiters, don't interfere
    if (inlineText.includes('$')) {
      return inlineText;
    }
    // Check if the string contains a backslash followed by characters (standard LaTeX macro pattern)
    // or characters that indicate superscript/subscript combined with math lookups
    const hasMacro = /\\[a-zA-Z]+/.test(inlineText);
    if (hasMacro) {
      return `$${inlineText}$`;
    }
    return inlineText;
  };

  // Helper to render inline content of a specific line/paragraph
  const renderInlineContent = (inlineText: string, keyPrefix: string) => {
    const wrappedText = autoWrapLaTeX(inlineText);
    const inlineParts = wrappedText.split('$');
    
    return (
      <span key={keyPrefix}>
        {inlineParts.map((inlinePart, inlineIndex) => {
          const isInlineMath = inlineIndex % 2 === 1;

          if (isInlineMath) {
            try {
              // Extract formula and trim
              const formula = inlinePart.trim();
              if (!formula) return null;

              const html = katex.renderToString(formula, {
                displayMode: false,
                throwOnError: false,
              });
              return (
                <span
                  key={`inline-${keyPrefix}-${inlineIndex}`}
                  className="inline-block px-1 text-amber-200 font-semibold align-middle py-0.5"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              );
            } catch (e) {
              return (
                <code key={`inline-err-${keyPrefix}-${inlineIndex}`} className="px-1 text-[11px] bg-[#1a1a1a] text-rose-400 font-mono rounded-sm">
                  {inlinePart}
                </code>
              );
            }
          } else {
            return (
              <span key={`text-${keyPrefix}-${inlineIndex}`}>
                {inlinePart}
              </span>
            );
          }
        })}
      </span>
    );
  };

  return (
    <>
      {blockParts.map((blockContent, blockIndex) => {
        const isBlockMath = blockIndex % 2 === 1;

        if (isBlockMath) {
          try {
            const html = katex.renderToString(blockContent.trim(), {
              displayMode: true,
              throwOnError: false,
            });
            return (
              <div
                key={`block-${blockIndex}`}
                className="my-3 overflow-x-auto py-1 text-center"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch (e) {
            return (
              <div key={`block-err-${blockIndex}`} className="my-3 text-center overflow-x-auto font-mono text-xs text-rose-400 border border-rose-950/40 p-2 bg-rose-950/10 rounded-sm">
                {blockContent}
              </div>
            );
          }
        } else {
          // This is normal text that could contain inline math and might contain newlines/paragraphs
          const lines = blockContent.split('\n');
          
          return (
            <div key={`text-block-${blockIndex}`} className="inline-block w-full">
              {lines.map((line, lineIndex) => {
                const trimmed = line.trim();
                
                // If it is an empty line, render a line break/space
                if (!trimmed) {
                  return <div key={`empty-${blockIndex}-${lineIndex}`} className="h-2" />;
                }

                // Check for list formatting (bullets)
                if (trimmed.startsWith('-') || trimmed.startsWith('●') || trimmed.startsWith('*')) {
                  const contentWithoutBullet = trimmed.substring(1).trim();
                  return (
                    <li key={`list-${blockIndex}-${lineIndex}`} className="ml-4 list-disc text-slate-300 py-0.5 leading-relaxed text-xs sm:text-sm font-sans">
                      {renderInlineContent(contentWithoutBullet, `list-content-${blockIndex}-${lineIndex}`)}
                    </li>
                  );
                }

                // Check for numbered list
                if (trimmed.match(/^\d+\./)) {
                  return (
                    <div key={`numbered-${blockIndex}-${lineIndex}`} className="pl-2 py-0.5 text-slate-300 leading-relaxed text-xs sm:text-sm font-sans">
                      {renderInlineContent(trimmed, `numbered-content-${blockIndex}-${lineIndex}`)}
                    </div>
                  );
                }

                // Just a normal paragraph
                return (
                  <p key={`p-${blockIndex}-${lineIndex}`} className="text-slate-300 leading-relaxed py-1 text-xs sm:text-sm font-sans">
                    {renderInlineContent(trimmed, `p-content-${blockIndex}-${lineIndex}`)}
                  </p>
                );
              })}
            </div>
          );
        }
      })}
    </>
  );
}
