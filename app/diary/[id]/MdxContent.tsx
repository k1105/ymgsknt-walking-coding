// MdxContent.tsx — Server Component for MDX rendering
import React from "react";
import {MDXRemote} from "next-mdx-remote/rsc";

/* --- Link Card Component --- */
function LinkCard({url, text}: {url: string; text: string}) {
  return (
    <div className="mdx-line my-2">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex border border-white/20 rounded hover:bg-white/10 transition-colors p-3 no-underline group"
      >
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate group-hover:underline">
            {text || url}
          </div>
          <div className="text-xs opacity-50 mt-1 truncate">{url}</div>
        </div>
        <span className="opacity-50 ml-2">↗</span>
      </a>
    </div>
  );
}

/* --- Helper: check if children is a single link --- */
function getSoleLinkFromChildren(
  children: React.ReactNode
): {url: string; text: string} | null {
  const childArray = React.Children.toArray(children);
  if (childArray.length !== 1) return null;

  const child = childArray[0];
  if (
    React.isValidElement<{href?: string; children?: React.ReactNode}>(child) &&
    child.props?.href
  ) {
    const text =
      typeof child.props.children === "string"
        ? child.props.children
        : child.props.href;
    return {url: child.props.href, text};
  }
  return null;
}

/* --- MDX Custom Components --- */
const mdxComponents = {
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => {
    const link = getSoleLinkFromChildren(props.children);
    if (link) {
      return <LinkCard url={link.url} text={link.text} />;
    }
    return (
      <div className="mdx-line whitespace-pre-wrap leading-relaxed" {...props} />
    );
  },
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="mdx-line text-2xl font-bold" {...props} />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="mdx-line text-xl font-bold" {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="mdx-line text-lg font-bold" {...props} />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className="underline cursor-pointer z-10 relative"
      {...props}
    />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="mdx-line list-disc pl-6" {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="mdx-line list-decimal pl-6" {...props} />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="mb-1" {...props} />
  ),
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="mdx-line border-l-4 border-current/30 pl-4 italic opacity-70"
      {...props}
    />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code
      className="font-mono bg-white/10 rounded px-1 text-sm"
      {...props}
    />
  ),
  pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
    <div className="mdx-line my-2 bg-white/5 border border-white/10 rounded p-3 overflow-x-auto">
      <pre className="font-mono text-sm" {...props} />
    </div>
  ),
  img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <span className="mdx-line block my-2">
      <span className="relative block w-full h-[300px] max-h-[500px] rounded overflow-hidden border border-white/20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="w-full h-full object-cover rounded"
          loading="lazy"
          alt={props.alt || "Diary Image"}
          {...props}
        />
      </span>
    </span>
  ),
  hr: () => <hr className="mdx-line my-4 border-current/20" />,
};

interface MdxContentProps {
  source: string;
}

export default function MdxContent({source}: MdxContentProps) {
  return (
    <div className="mdx-content">
      <MDXRemote source={source} components={mdxComponents} />
    </div>
  );
}
