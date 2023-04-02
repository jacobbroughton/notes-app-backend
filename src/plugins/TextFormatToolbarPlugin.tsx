import { useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { FORMAT_TEXT_COMMAND } from "lexical";
import BoldIcon from "../components/ui/Icons/BoldIcon";
import ItalicIcon from "../components/ui/Icons/ItalicIcon";
import UnderlineIcon from "../components/ui/Icons/UnderlineIcon";
import StrikeThroughIcon from "../components/ui/Icons/StrikeThroughIcon";

type formatType = "bold" | "strikethrough" | "italic" | "underline";

export function TextFormatToolbarPlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [dropdownToggled, setDropdownToggled] = useState(false);

  // const formatTypeTags: formatType[] = ["bold", "strikethrough", "italic", "underline"];
  const onClick = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    type: formatType
  ) => {
    e.preventDefault();
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, type);
    setDropdownToggled(!dropdownToggled);
  };

  // <UnderlineIcon />
  // <BoldIcon/>
  // <StrikeThroughIcon />
  // <UnderlineIcon />

  return (
    <div className="button-group">
      {/* <button
        className="dropdown-toggle"
        onClick={(e) => {
          e.preventDefault();
          setDropdownToggled(!dropdownToggled);
        }}
      >
        Text Format
      </button> 
      {dropdownToggled && (
        <div className="dropdown-options">
          {formatTypeTags.map((tag, i) => (
            <button onClick={(e) => onClick(e, tag)} key={i}>
              {tag.toUpperCase()}
            </button>
          ))}
        </div>
      )} */}

      <button onClick={(e) => onClick(e, "bold")}>
        <BoldIcon />
      </button>
      <button onClick={(e) => onClick(e, "italic")}>
        <ItalicIcon />
      </button>
      <button onClick={(e) => onClick(e, "underline")}>
        <UnderlineIcon />
      </button>
      <button onClick={(e) => onClick(e, "strikethrough")}>
        <StrikeThroughIcon />
      </button>
    </div>
  );
}
