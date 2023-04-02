import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection } from "lexical";
import { $setBlocksType } from "@lexical/selection";
import { $createHeadingNode } from "@lexical/rich-text";
import { useState } from "react";

type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export function HeadingToolbarPlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [dropdownToggled, setDropdownToggled] = useState(false);

  const headingTags: HeadingTag[] = ["h1", "h2", "h3", "h4", "h5", "h6"];
  const onClick = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    tag: HeadingTag
  ) => {
    e.preventDefault();
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(tag));
      }
      setDropdownToggled(false);
    });
  };
  return (
    <div className="button-group">
      {/* <button
        className="dropdown-toggle"
        onClick={(e) => {
          e.preventDefault();
          setDropdownToggled(!dropdownToggled);
        }}
      >
        Headings
      </button>*/}
      {/* {dropdownToggled && ( */}
      {headingTags.map((tag, i) => (
        <button onClick={(e) => onClick(e, tag)} key={i}>
          {tag.toUpperCase()}
        </button>
      ))}
      {/* )}  */}
    </div>
  );
}
