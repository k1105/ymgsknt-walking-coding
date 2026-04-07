// MdxContent.tsx — Server Component for MDX rendering
import React from "react";
import {MDXRemote} from "next-mdx-remote/rsc";

/* --- Link Card Component --- */
function LinkCard({url, text}: {url: string; text: string}) {
  return (
    <div className="my-2">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex border border-gray-200 rounded hover:bg-gray-50 transition-colors p-3 no-underline group"
      >
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-800 truncate group-hover:text-blue-600">
            {text || url}
          </div>
          <div className="text-xs text-gray-400 mt-1 truncate">{url}</div>
        </div>
        <span className="text-gray-400 ml-2">↗</span>
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
      <div className="whitespace-pre-wrap leading-relaxed mb-4" {...props} />
    );
  },
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="text-2xl font-bold mb-4" {...props} />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="text-xl font-bold mb-3" {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="text-lg font-bold mb-2" {...props} />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:underline cursor-pointer z-10 relative"
      {...props}
    />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc pl-6 mb-4" {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal pl-6 mb-4" {...props} />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="mb-1" {...props} />
  ),
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-4"
      {...props}
    />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code
      className="font-mono bg-gray-100 rounded px-1 text-red-500 text-sm"
      {...props}
    />
  ),
  pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
    <div className="my-2 bg-[#f6f8fa] border border-gray-200 rounded p-3 overflow-x-auto mb-4">
      <pre className="font-mono text-sm text-gray-800" {...props} />
    </div>
  ),
  img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <span className="block my-4">
      <span className="relative block w-full h-[300px] max-h-[500px] rounded overflow-hidden border border-gray-200">
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
  hr: () => <hr className="my-6 border-gray-200" />,
};

interface MdxContentProps {
  source: string;
}

export default function MdxContent({source}: MdxContentProps) {
  return <MDXRemote source={source} components={mdxComponents} />;
}
