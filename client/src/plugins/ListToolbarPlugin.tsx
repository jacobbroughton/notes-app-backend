import { useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection } from "lexical";
import { $setBlocksType } from "@lexical/selection";
import { $createHeadingNode } from "@lexical/rich-text";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_CHECK_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import OrderedListIcon from "../components/ui/Icons/OrderedList";
import UnorderedListIcon from "../components/ui/Icons/UnorderedList";
import CheckBoxListIcon from "../components/ui/Icons/CheckBoxList";

type ListTag = "ol" | "ul" | "checklist";

export function ListToolbarPlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [dropdownToggled, setDropdownToggled] = useState(false);

  const listTags: ListTag[] = ["ol", "ul", "checklist"];
  const onClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, tag: ListTag) => {
    e.preventDefault();
    if (tag === "ol") {
      // <OrderedListIcon />
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
      // <UnOrderedListIcon />
    } else if (tag === "ul") {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else if (tag === "checklist") {
      // <CheckBoxListIcon />
      editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
    setDropdownToggled(!dropdownToggled);
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
        List
      </button>
      {dropdownToggled && (
        <div className="dropdown-options">
          {listTags.map((tag, i) => (
            <button onClick={(e) => onClick(e, tag)} key={i}>
              {tag.toUpperCase()}
            </button>
          ))}
        </div>
      )} */}
      <button onClick={(e) => onClick(e, "ol")}>
        <OrderedListIcon />
      </button>
      <button onClick={(e) => onClick(e, "ul")}>
        <UnorderedListIcon />
      </button>
      {/* <button onClick={(e) => onClick(e, "checkbox")}>
        <CheckBoxListIcon />
      </button> */}
    </div>
  );
}
