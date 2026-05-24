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
          // It's normal text containing inline math split by $
          const inlineParts = blockContent.split('$');

          return (
            <span key={`inline-container-${blockIndex}`}>
              {inlineParts.map((inlinePart, inlineIndex) => {
                const isInlineMath = inlineIndex % 2 === 1;

                if (isInlineMath) {
                  try {
                    const html = katex.renderToString(inlinePart.trim(), {
                      displayMode: false,
                      throwOnError: false,
                    });
                    return (
                      <span
                        key={`inline-${blockIndex}-${inlineIndex}`}
                        className="inline-block px-1 text-amber-200 align-middle py-0.5"
                        dangerouslySetInnerHTML={{ __html: html }}
                      />
                    );
                  } catch (e) {
                    return (
                      <code key={`inline-err-${blockIndex}-${inlineIndex}`} className="px-1 text-[11px] bg-[#1a1a1a] text-rose-400 font-mono rounded-sm">
                        {inlinePart}
                      </code>
                    );
                  }
                } else {
                  return (
                    <span key={`text-${blockIndex}-${inlineIndex}`} className="whitespace-pre-wrap">
                      {inlinePart}
                    </span>
                  );
                }
              })}
            </span>
          );
        }
      })}
    </>
  );
}
